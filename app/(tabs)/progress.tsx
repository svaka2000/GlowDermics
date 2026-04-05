import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import { ScanHistoryEntry } from '../../src/types';
import { ScoreRing } from '../../src/components/ScoreRing';

const METRICS = ['overall', 'hydration', 'texture', 'clarity', 'evenness', 'firmness', 'pores'] as const;

function getDelta(current: number, previous: number): { val: number; positive: boolean } {
  const val = current - previous;
  return { val: Math.round(val), positive: val >= 0 };
}

export default function Progress() {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);

  useFocusEffect(useCallback(() => {
    Storage.getScanHistory().then(setHistory);
  }, []));

  const latest = history[0];
  const previous = history[1];

  if (!history.length) {
    return (
      <View style={styles.root}>
        <SafeAreaView>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Progress</Text>
          </View>
        </SafeAreaView>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>📈</Text>
          <Text style={styles.emptyTitle}>Nothing to track yet</Text>
          <Text style={styles.emptySub}>Complete your first scan to start tracking your skin journey over time.</Text>
          <Pressable style={styles.scanBtn} onPress={() => router.push('/scan')}>
            <Text style={styles.scanBtnText}>Take First Scan →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Progress</Text>
          <Text style={styles.headerSub}>{history.length} scan{history.length !== 1 ? 's' : ''} total</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Latest vs previous comparison */}
        {latest && previous && (
          <View style={styles.compareCard}>
            <Text style={styles.cardTitle}>Latest vs Previous</Text>
            <View style={styles.compareRow}>
              <View style={styles.compareItem}>
                <Text style={styles.compareLabel}>Previous</Text>
                <ScoreRing score={previous.overallScore} size={76} strokeWidth={6} />
                <Text style={styles.compareDate}>
                  {new Date(previous.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.compareDivider}>
                <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
              </View>
              <View style={styles.compareItem}>
                <Text style={styles.compareLabel}>Latest</Text>
                <ScoreRing score={latest.overallScore} size={76} strokeWidth={6} />
                <Text style={styles.compareDate}>
                  {new Date(latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.deltaWrap}>
                {(() => {
                  const d = getDelta(latest.overallScore, previous.overallScore);
                  return (
                    <View style={[styles.deltaBadge, { backgroundColor: d.positive ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)' }]}>
                      <Ionicons
                        name={d.positive ? 'trending-up' : 'trending-down'}
                        size={16}
                        color={d.positive ? Colors.scoreExcellent : Colors.scorePoor}
                      />
                      <Text style={[styles.deltaText, { color: d.positive ? Colors.scoreExcellent : Colors.scorePoor }]}>
                        {d.positive ? '+' : ''}{d.val}
                      </Text>
                    </View>
                  );
                })()}
                <Text style={styles.deltaLabel}>Overall</Text>
              </View>
            </View>

            {/* Per-metric deltas */}
            <View style={styles.metricDeltas}>
              {(Object.keys(latest.scores) as Array<keyof typeof latest.scores>)
                .filter(k => k !== 'overall')
                .map(key => {
                  const d = getDelta(latest.scores[key], previous.scores[key]);
                  return (
                    <View key={key} style={styles.metricDelta}>
                      <Text style={styles.metricDeltaLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                      <Text style={[styles.metricDeltaVal, { color: d.positive ? Colors.scoreGood : Colors.scorePoor }]}>
                        {d.positive ? '+' : ''}{d.val}
                      </Text>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        {/* Before/after photo comparison */}
        {history.length >= 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Before & After</Text>
            <View style={styles.beforeAfterRow}>
              <View style={styles.beforeAfterItem}>
                <Image source={{ uri: history[history.length - 1].imageUri }} style={styles.beforeAfterImg} />
                <Text style={styles.beforeAfterLabel}>First Scan</Text>
                <Text style={styles.beforeAfterDate}>
                  {new Date(history[history.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.beforeAfterItem}>
                <Image source={{ uri: history[0].imageUri }} style={styles.beforeAfterImg} />
                <Text style={styles.beforeAfterLabel}>Latest</Text>
                <Text style={styles.beforeAfterDate}>
                  {new Date(history[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Scan history list */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Scan History</Text>
          {history.map((entry, i) => (
            <Pressable
              key={entry.id}
              style={styles.historyItem}
              onPress={() => router.push(`/results/${entry.id}`)}
            >
              {entry.imageUri ? (
                <Image source={{ uri: entry.imageUri }} style={styles.historyThumb} />
              ) : (
                <View style={[styles.historyThumb, styles.historyThumbEmpty]}>
                  <Ionicons name="person" size={18} color={Colors.textMuted} />
                </View>
              )}
              <View style={styles.historyInfo}>
                <Text style={styles.historyDate}>
                  {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                {i === 0 && <Text style={styles.historyLatest}>Latest</Text>}
              </View>
              <ScoreRing score={entry.overallScore} size={44} strokeWidth={4} />
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  scroll: { paddingHorizontal: 16 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  scanBtn: {
    backgroundColor: Colors.primary, borderRadius: 16,
    paddingHorizontal: 28, paddingVertical: 16,
  },
  scanBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border, padding: 20, marginBottom: 16,
  },
  compareCard: {
    backgroundColor: Colors.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border, padding: 20, marginBottom: 16, marginTop: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  compareItem: { alignItems: 'center', gap: 6 },
  compareLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  compareDate: { fontSize: 10, color: Colors.textMuted },
  compareDivider: { flex: 0 },
  deltaWrap: { flex: 1, alignItems: 'center', gap: 4 },
  deltaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  deltaText: { fontSize: 16, fontWeight: '800' },
  deltaLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  metricDeltas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricDelta: {
    backgroundColor: Colors.bgElevated, borderRadius: 10, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center', minWidth: 80,
  },
  metricDeltaLabel: { fontSize: 10, color: Colors.textMuted, marginBottom: 2 },
  metricDeltaVal: { fontSize: 14, fontWeight: '700' },
  beforeAfterRow: { flexDirection: 'row', gap: 12 },
  beforeAfterItem: { flex: 1, gap: 6 },
  beforeAfterImg: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: Colors.bgElevated },
  beforeAfterLabel: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  beforeAfterDate: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  historyThumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.bgElevated },
  historyThumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  historyInfo: { flex: 1, gap: 3 },
  historyDate: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  historyLatest: { fontSize: 10, color: Colors.primary, fontWeight: '700', letterSpacing: 0.5 },
});
