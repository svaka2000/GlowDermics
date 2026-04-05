import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import { ScanHistoryEntry } from '../../src/types';
import { ScoreRing } from '../../src/components/ScoreRing';
import { ScoreChart } from '../../src/components/ScoreChart';

type Metric = 'overall' | 'hydration' | 'texture' | 'clarity' | 'evenness' | 'firmness' | 'pores';

const METRICS: { key: Metric; label: string }[] = [
  { key: 'overall', label: 'Overall' },
  { key: 'hydration', label: 'Hydration' },
  { key: 'texture', label: 'Texture' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'evenness', label: 'Evenness' },
  { key: 'firmness', label: 'Firmness' },
  { key: 'pores', label: 'Pores' },
];

function getDelta(current: number, previous: number) {
  const val = current - previous;
  return { val: Math.round(val), positive: val >= 0 };
}

export default function Progress() {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<Metric>('overall');
  const [routineStreak, setRoutineStreak] = useState(0);
  const [articlesRead, setArticlesRead] = useState(0);
  const [journalCount, setJournalCount] = useState(0);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [h, rs, ar, journal] = await Promise.all([
        Storage.getScanHistory(),
        Storage.getRoutineStreak(),
        Storage.getReadArticles(),
        Storage.getJournal(),
      ]);
      setHistory(h);
      setRoutineStreak(rs);
      setArticlesRead(ar.length);
      setJournalCount(journal.length);
    })();
  }, []));

  const latest = history[0];
  const previous = history[1];
  const oldest = history[history.length - 1];

  // Build chart data for selected metric (chronological order for chart)
  const chartData = [...history]
    .reverse()
    .map(h => ({
      date: h.date,
      value: selectedMetric === 'overall' ? h.overallScore : h.scores[selectedMetric],
    }));

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
          <Text style={styles.headerSub}>{history.length} scan{history.length !== 1 ? 's' : ''} · {history.length >= 2 ? `${Math.round((new Date(latest.date).getTime() - new Date(oldest.date).getTime()) / 86400000)} days` : 'just started'}</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Quick access row */}
        <View style={styles.quickRow}>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/compare')}>
            <Ionicons name="git-compare-outline" size={16} color={Colors.primary} />
            <Text style={styles.quickBtnText}>Compare</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/report')}>
            <Ionicons name="analytics-outline" size={16} color={Colors.primary} />
            <Text style={styles.quickBtnText}>AI Report</Text>
          </Pressable>
        </View>

        {/* AI Trend Report CTA */}
        <Pressable style={styles.reportCta} onPress={() => router.push('/report')}>
          <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <Ionicons name="analytics-outline" size={20} color={Colors.white} />
          <View style={{ flex: 1 }}>
            <Text style={styles.reportCtaTitle}>AI Trend Report</Text>
            <Text style={styles.reportCtaSub}>AI analysis of your full skin journey</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </Pressable>

        {/* Activity stats */}
        <View style={styles.activityRow}>
          <View style={styles.activityCard}>
            <Text style={styles.activityNum}>{history.length}</Text>
            <Text style={styles.activityLabel}>Scans</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityNum}>{routineStreak}</Text>
            <Text style={styles.activityLabel}>Routine Streak</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityNum}>{journalCount}</Text>
            <Text style={styles.activityLabel}>Journal Entries</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityNum}>{articlesRead}</Text>
            <Text style={styles.activityLabel}>Articles Read</Text>
          </View>
        </View>

        {/* Metric selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricScroll}>
          {METRICS.map(m => (
            <Pressable
              key={m.key}
              style={[styles.metricChip, selectedMetric === m.key && styles.metricChipActive]}
              onPress={() => setSelectedMetric(m.key)}
            >
              <Text style={[styles.metricChipText, selectedMetric === m.key && styles.metricChipTextActive]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Trend chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{METRICS.find(m => m.key === selectedMetric)?.label} Over Time</Text>
            {latest && previous && (() => {
              const val = selectedMetric === 'overall' ? latest.overallScore : latest.scores[selectedMetric];
              const prevVal = selectedMetric === 'overall' ? previous.overallScore : previous.scores[selectedMetric];
              const d = getDelta(val, prevVal);
              return (
                <View style={[styles.deltaPill, { backgroundColor: d.positive ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)' }]}>
                  <Ionicons name={d.positive ? 'trending-up' : 'trending-down'} size={12} color={d.positive ? Colors.scoreExcellent : Colors.scorePoor} />
                  <Text style={[styles.deltaPillText, { color: d.positive ? Colors.scoreExcellent : Colors.scorePoor }]}>
                    {d.positive ? '+' : ''}{d.val} from last scan
                  </Text>
                </View>
              );
            })()}
          </View>
          <ScoreChart data={chartData} color={Colors.primary} height={170} />
        </View>

        {/* All metric deltas vs previous scan */}
        {latest && previous && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Score Changes</Text>
            <Text style={styles.cardSub}>Compared to previous scan</Text>
            <View style={styles.deltaGrid}>
              {METRICS.map(m => {
                const curr = m.key === 'overall' ? latest.overallScore : latest.scores[m.key];
                const prev = m.key === 'overall' ? previous.overallScore : previous.scores[m.key];
                const d = getDelta(curr, prev);
                return (
                  <View key={m.key} style={styles.deltaCell}>
                    <Text style={styles.deltaCellLabel}>{m.label}</Text>
                    <Text style={styles.deltaCellVal}>{curr}</Text>
                    <View style={[styles.deltaChange, { backgroundColor: d.positive ? 'rgba(74,222,128,0.12)' : d.val === 0 ? 'rgba(250,243,224,0.06)' : 'rgba(248,113,113,0.12)' }]}>
                      <Text style={[styles.deltaChangeText, { color: d.positive ? Colors.scoreExcellent : d.val === 0 ? Colors.textMuted : Colors.scorePoor }]}>
                        {d.val === 0 ? '—' : `${d.positive ? '+' : ''}${d.val}`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Before/After photos */}
        {history.length >= 2 && oldest.imageUri && latest.imageUri && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Before & After</Text>
            <View style={styles.beforeAfterRow}>
              <View style={styles.beforeAfterItem}>
                <Image source={{ uri: oldest.imageUri }} style={styles.beforeAfterImg} />
                <View style={styles.beforeAfterLabel}>
                  <Text style={styles.beforeAfterTag}>FIRST SCAN</Text>
                  <Text style={styles.beforeAfterDate}>
                    {new Date(oldest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <Text style={[styles.beforeAfterScore, { color: Colors.scoreFair }]}>{oldest.overallScore}</Text>
                </View>
              </View>
              <View style={styles.beforeAfterArrow}>
                <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
                {history.length >= 2 && (() => {
                  const d = getDelta(latest.overallScore, oldest.overallScore);
                  return (
                    <Text style={[styles.totalDelta, { color: d.positive ? Colors.scoreExcellent : Colors.scorePoor }]}>
                      {d.positive ? '+' : ''}{d.val}
                    </Text>
                  );
                })()}
              </View>
              <View style={styles.beforeAfterItem}>
                <Image source={{ uri: latest.imageUri }} style={styles.beforeAfterImg} />
                <View style={styles.beforeAfterLabel}>
                  <Text style={styles.beforeAfterTag}>LATEST</Text>
                  <Text style={styles.beforeAfterDate}>
                    {new Date(latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <Text style={[styles.beforeAfterScore, { color: Colors.scoreExcellent }]}>{latest.overallScore}</Text>
                </View>
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
              style={[styles.historyItem, i < history.length - 1 && styles.historyBorder]}
              onPress={() => router.push(`/results/${entry.id}`)}
            >
              {entry.imageUri ? (
                <Image source={{ uri: entry.imageUri }} style={styles.historyThumb} />
              ) : (
                <View style={[styles.historyThumb, styles.historyThumbEmpty]}>
                  <Ionicons name="person" size={16} color={Colors.textMuted} />
                </View>
              )}
              <View style={styles.historyInfo}>
                <Text style={styles.historyDate}>
                  {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                {i === 0 && <Text style={styles.historyLatestBadge}>Latest</Text>}
              </View>
              <ScoreRing score={entry.overallScore} size={42} strokeWidth={4} />
              <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
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
  scroll: { paddingBottom: 40 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  scanBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingHorizontal: 28, paddingVertical: 16 },
  scanBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },

  quickRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 10 },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: Colors.borderStrong, paddingVertical: 12 },
  quickBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  reportCta: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, borderRadius: 16, overflow: 'hidden',
    padding: 16, marginBottom: 12,
  },
  reportCtaTitle: { fontSize: 15, fontWeight: '700', color: Colors.white },
  reportCtaSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  activityRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4, gap: 8 },
  activityCard: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center', gap: 3 },
  activityNum: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  activityLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '600', textAlign: 'center', lineHeight: 13 },

  metricScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  metricChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  metricChipActive: { borderColor: Colors.primary, backgroundColor: 'rgba(196,98,45,0.15)' },
  metricChipText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  metricChipTextActive: { color: Colors.primary, fontWeight: '700' },

  chartCard: { marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chartTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  deltaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  deltaPillText: { fontSize: 11, fontWeight: '600' },

  card: { marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 18 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  cardSub: { fontSize: 11, color: Colors.textMuted, marginBottom: 16 },

  deltaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deltaCell: { backgroundColor: Colors.bgElevated, borderRadius: 12, padding: 12, alignItems: 'center', minWidth: 80, gap: 4 },
  deltaCellLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  deltaCellVal: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  deltaChange: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  deltaChangeText: { fontSize: 11, fontWeight: '700' },

  beforeAfterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  beforeAfterItem: { flex: 1, gap: 8 },
  beforeAfterImg: { width: '100%', aspectRatio: 0.85, borderRadius: 12, backgroundColor: Colors.bgElevated },
  beforeAfterLabel: { gap: 2 },
  beforeAfterTag: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Colors.textMuted },
  beforeAfterDate: { fontSize: 11, color: Colors.textSecondary },
  beforeAfterScore: { fontSize: 22, fontWeight: '800' },
  beforeAfterArrow: { alignItems: 'center', gap: 6 },
  totalDelta: { fontSize: 14, fontWeight: '800' },

  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  historyBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  historyThumb: { width: 42, height: 42, borderRadius: 10, backgroundColor: Colors.bgElevated },
  historyThumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  historyLatestBadge: { fontSize: 10, color: Colors.primary, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
});
