import { useCallback, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image, Animated, Easing,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import { ScanHistoryEntry } from '../../src/types';
import { ScoreRing } from '../../src/components/ScoreRing';

const METRICS = ['hydration', 'texture', 'clarity', 'evenness', 'firmness', 'pores'] as const;
const METRIC_LABELS: Record<string, string> = {
  hydration: 'Hydration', texture: 'Texture', clarity: 'Clarity',
  evenness: 'Evenness', firmness: 'Firmness', pores: 'Pores',
};

function getDelta(a: number, b: number) {
  const val = a - b;
  return { val: Math.round(val), positive: val > 0, neutral: val === 0 };
}

export default function Compare() {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [leftIdx, setLeftIdx] = useState(1); // older scan
  const [rightIdx, setRightIdx] = useState(0); // newer scan
  const [pickingFor, setPickingFor] = useState<'left' | 'right' | null>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    headerAnim.setValue(0);
    contentAnim.setValue(0);
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Storage.getScanHistory().then(h => {
      setHistory(h);
      if (h.length >= 2) {
        setLeftIdx(h.length - 1); // oldest
        setRightIdx(0); // newest
      }
    });
  }, []));

  const left = history[leftIdx];
  const right = history[rightIdx];

  if (history.length < 2) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Compare Scans</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>Need 2+ scans</Text>
          <Text style={styles.emptySub}>Complete at least two skin scans to use the comparison tool.</Text>
          <Pressable style={styles.scanBtn} onPress={() => { router.back(); router.push('/scan'); }}>
            <Text style={styles.scanBtnText}>Take a Scan →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (pickingFor) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => setPickingFor(null)}>
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Select {pickingFor === 'left' ? 'First' : 'Second'} Scan</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
        <ScrollView contentContainerStyle={styles.scroll}>
          {history.map((entry, i) => (
            <Pressable
              key={entry.id}
              style={[styles.pickCard, (pickingFor === 'left' ? leftIdx : rightIdx) === i && styles.pickCardActive]}
              onPress={() => {
                if (pickingFor === 'left') setLeftIdx(i);
                else setRightIdx(i);
                setPickingFor(null);
              }}
            >
              {entry.imageUri ? (
                <Image source={{ uri: entry.imageUri }} style={styles.pickThumb} />
              ) : (
                <View style={[styles.pickThumb, styles.pickThumbEmpty]}>
                  <Ionicons name="person" size={16} color={Colors.textMuted} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.pickDate}>{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                <Text style={styles.pickScore}>Score: {entry.overallScore}/100</Text>
              </View>
              {(pickingFor === 'left' ? leftIdx : rightIdx) === i && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              )}
            </Pressable>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Compare Scans</Text>
          <View style={{ width: 36 }} />
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ opacity: contentAnim }}>

        {/* Scan selectors */}
        {left && right && (
          <>
            <View style={styles.selectorsRow}>
              <Pressable style={styles.scanSelector} onPress={() => setPickingFor('left')}>
                <LinearGradient colors={['rgba(196,98,45,0.10)', 'rgba(196,98,45,0.03)']} style={StyleSheet.absoluteFill} />
                {left.imageUri ? (
                  <Image source={{ uri: left.imageUri }} style={styles.selectorThumb} />
                ) : (
                  <View style={[styles.selectorThumb, styles.selectorThumbEmpty]}>
                    <Ionicons name="person" size={20} color={Colors.textMuted} />
                  </View>
                )}
                <Text style={styles.selectorDate}>{new Date(left.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</Text>
                <ScoreRing score={left.overallScore} size={44} strokeWidth={4} />
                <View style={styles.selectorChangeBtn}>
                  <Ionicons name="swap-horizontal" size={12} color={Colors.primary} />
                  <Text style={styles.selectorChangeBtnText}>Change</Text>
                </View>
              </Pressable>

              <View style={styles.vsWrap}>
                <Text style={styles.vsText}>VS</Text>
                {(() => {
                  const d = getDelta(right.overallScore, left.overallScore);
                  return (
                    <View style={[styles.deltaBadge, { backgroundColor: d.neutral ? Colors.bgElevated : d.positive ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)' }]}>
                      <Text style={[styles.deltaBadgeText, { color: d.neutral ? Colors.textMuted : d.positive ? Colors.scoreExcellent : Colors.scorePoor }]}>
                        {d.neutral ? '—' : `${d.positive ? '+' : ''}${d.val}`}
                      </Text>
                    </View>
                  );
                })()}
              </View>

              <Pressable style={styles.scanSelector} onPress={() => setPickingFor('right')}>
                <LinearGradient colors={['rgba(196,98,45,0.10)', 'rgba(196,98,45,0.03)']} style={StyleSheet.absoluteFill} />
                {right.imageUri ? (
                  <Image source={{ uri: right.imageUri }} style={styles.selectorThumb} />
                ) : (
                  <View style={[styles.selectorThumb, styles.selectorThumbEmpty]}>
                    <Ionicons name="person" size={20} color={Colors.textMuted} />
                  </View>
                )}
                <Text style={styles.selectorDate}>{new Date(right.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</Text>
                <ScoreRing score={right.overallScore} size={44} strokeWidth={4} />
                <View style={styles.selectorChangeBtn}>
                  <Ionicons name="swap-horizontal" size={12} color={Colors.primary} />
                  <Text style={styles.selectorChangeBtnText}>Change</Text>
                </View>
              </Pressable>
            </View>

            {/* Metric comparison */}
            <View style={styles.metricsCard}>
              <Text style={styles.metricsTitle}>Metric Comparison</Text>
              {METRICS.map(metric => {
                const leftVal = left.scores[metric];
                const rightVal = right.scores[metric];
                const d = getDelta(rightVal, leftVal);
                const maxVal = 100;
                return (
                  <View key={metric} style={styles.metricRow}>
                    <Text style={styles.metricLabel}>{METRIC_LABELS[metric]}</Text>
                    <View style={styles.metricBars}>
                      {/* Left bar */}
                      <View style={styles.barWrap}>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, styles.barFillLeft, { width: `${(leftVal / maxVal) * 100}%` as any }]} />
                        </View>
                        <Text style={styles.barVal}>{leftVal}</Text>
                      </View>
                      {/* Delta */}
                      <View style={styles.deltaCell}>
                        <Text style={[styles.deltaCellText, {
                          color: d.neutral ? Colors.textMuted : d.positive ? Colors.scoreExcellent : Colors.scorePoor
                        }]}>
                          {d.neutral ? '—' : `${d.positive ? '+' : ''}${d.val}`}
                        </Text>
                      </View>
                      {/* Right bar */}
                      <View style={[styles.barWrap, { flexDirection: 'row-reverse' }]}>
                        <View style={[styles.barTrack, { flexDirection: 'row-reverse' }]}>
                          <View style={[styles.barFill, styles.barFillRight, { width: `${(rightVal / maxVal) * 100}%` as any }]} />
                        </View>
                        <Text style={[styles.barVal, { textAlign: 'right' }]}>{rightVal}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* View each scan */}
            <View style={styles.viewBtnsRow}>
              <Pressable style={styles.viewBtn} onPress={() => router.push(`/results/${left.id}`)}>
                <Text style={styles.viewBtnText}>View First Scan</Text>
              </Pressable>
              <Pressable style={[styles.viewBtn, styles.viewBtnPrimary]} onPress={() => router.push(`/results/${right.id}`)}>
                <Text style={[styles.viewBtnText, { color: Colors.white }]}>View Second Scan</Text>
              </Pressable>
            </View>
          </>
        )}

        <View style={{ height: 80 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scroll: { paddingHorizontal: 16 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  scanBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  scanBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },

  selectorsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  scanSelector: {
    flex: 1, alignItems: 'center', gap: 8,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  selectorThumb: { width: 60, height: 60, borderRadius: 12, backgroundColor: Colors.bgElevated },
  selectorThumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  selectorDate: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  selectorChangeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  selectorChangeBtnText: { fontSize: 10, color: Colors.primary, fontWeight: '600' },

  vsWrap: { alignItems: 'center', gap: 8 },
  vsText: { fontSize: 14, fontWeight: '800', color: Colors.textMuted },
  deltaBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  deltaBadgeText: { fontSize: 13, fontWeight: '800' },

  metricsCard: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 14 },
  metricsTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
  metricRow: { gap: 6, marginBottom: 12 },
  metricLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textAlign: 'center' },
  metricBars: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  barTrack: { flex: 1, height: 6, backgroundColor: Colors.bgElevated, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barFillLeft: { backgroundColor: Colors.primary + '80' },
  barFillRight: { backgroundColor: Colors.primary },
  barVal: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary, width: 24 },
  deltaCell: { width: 36, alignItems: 'center' },
  deltaCellText: { fontSize: 11, fontWeight: '800' },

  viewBtnsRow: { flexDirection: 'row', gap: 10 },
  viewBtn: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 14, alignItems: 'center' },
  viewBtnPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  viewBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  pickCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 10 },
  pickCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(196,98,45,0.08)' },
  pickThumb: { width: 46, height: 46, borderRadius: 10, backgroundColor: Colors.bgElevated },
  pickThumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  pickDate: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 3 },
  pickScore: { fontSize: 12, color: Colors.textMuted },
});
