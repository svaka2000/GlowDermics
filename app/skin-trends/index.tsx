import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline } from 'react-native-svg';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { fonts } from '../../src/constants/typography';
import { Storage } from '../../src/services/storage';
import { deriveSkinTrends, type SkinTrendsReport, type SkinTrendDim } from '../../src/engine/SkinTrendsEngine';

const SPARK_W = Math.max(120, Math.round(Dimensions.get('window').width) - 96);
const SPARK_H = 44;
const PAD = 5;

function sparkPoints(spark: number[]): string {
  const n = spark.length;
  if (n <= 1) {
    const y = (SPARK_H / 2).toFixed(1);
    return `0,${y} ${SPARK_W},${y}`;
  }
  let min = spark[0];
  let max = spark[0];
  for (const v of spark) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;
  const usable = SPARK_H - PAD * 2;
  return spark
    .map((v, i) => {
      const x = (i / (n - 1)) * SPARK_W;
      const y = SPARK_H - PAD - ((v - min) / range) * usable;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function DimCard({ dim, c, styles }: { dim: SkinTrendDim; c: Palette; styles: ReturnType<typeof makeStyles> }) {
  const single = dim.spark.length < 2;
  const deltaColor = single ? c.textMuted : dim.delta >= 0 ? c.scoreGood : c.gold;
  const deltaLabel = single ? 'Baseline' : `${dim.delta > 0 ? '+' : ''}${dim.delta}`;
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.dimLabel}>{dim.label}</Text>
        <View style={styles.cardRight}>
          <Text style={styles.dimLatest}>{dim.latest}</Text>
          <Text style={[styles.deltaChip, { color: deltaColor }]}>{deltaLabel}</Text>
        </View>
      </View>
      <Svg width={SPARK_W} height={SPARK_H}>
        <Polyline points={sparkPoints(dim.spark)} fill="none" stroke={c.primary} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

export default function SkinTrendsScreen() {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [report, setReport] = useState<SkinTrendsReport | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Storage.getAnalyses().then((list) => {
        const result = deriveSkinTrends(Array.isArray(list) ? list : [], Date.now());
        if (alive) setReport(result);
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  const empty = !!report && report.dimensions.length === 0;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={c.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Skin Trends
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        {!report ? null : empty ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.eyebrow}>YOUR TRENDS</Text>
            <Text style={styles.emptyTitle}>Your trends start{'\n'}with a scan</Text>
            <Text style={styles.emptySub}>
              Run a few scans over time and Velumi AI will chart how every dimension of your skin moves.
            </Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/scan' as any)} accessibilityRole="button">
              <Text style={styles.emptyBtnText}>Take a scan</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.eyebrow}>YOUR TRENDS</Text>
            <Text style={styles.windowLine}>
              {report.window.scans} {report.window.scans === 1 ? 'scan' : 'scans'}
              {report.window.sinceLabel ? ` · since ${report.window.sinceLabel}` : ''}
            </Text>
            {report.dimensions.map((dim) => (
              <DimCard key={dim.key} dim={dim} c={c} styles={styles} />
            ))}
            <Text style={styles.footnote}>
              Higher is better across every dimension. One scan shows a baseline; trends sharpen with each new scan.
            </Text>
            <View style={{ height: 60 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontFamily: fonts.display, fontSize: 18, fontWeight: '600', color: c.textPrimary, letterSpacing: 0.3 },
    content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
    eyebrow: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', letterSpacing: 2.4, color: c.primary, textTransform: 'uppercase', marginBottom: 8 },
    windowLine: { fontFamily: fonts.body, fontSize: 13, color: c.textMuted, letterSpacing: 0.2, marginBottom: 18 },
    card: {
      backgroundColor: c.bgCard,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      marginBottom: 12,
    },
    cardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
    dimLabel: { fontFamily: fonts.display, fontSize: 17, fontWeight: '600', color: c.textPrimary, letterSpacing: 0.2 },
    cardRight: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
    dimLatest: { fontFamily: fonts.display, fontSize: 19, fontWeight: '600', color: c.textPrimary },
    deltaChip: { fontFamily: fonts.body, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
    footnote: { fontFamily: fonts.body, fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 18, letterSpacing: 0.1 },
    emptyWrap: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 12 },
    emptyTitle: { fontFamily: fonts.display, fontSize: 27, fontWeight: '600', color: c.textPrimary, textAlign: 'center', letterSpacing: 0.2, lineHeight: 34, marginTop: 14 },
    emptySub: { fontFamily: fonts.body, fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: 12, maxWidth: 300, letterSpacing: 0.1 },
    emptyBtn: { marginTop: 24, borderRadius: 14, borderWidth: 1, borderColor: c.borderStrong, paddingHorizontal: 24, paddingVertical: 13 },
    emptyBtnText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', color: c.primary, letterSpacing: 0.3 },
  });
}
