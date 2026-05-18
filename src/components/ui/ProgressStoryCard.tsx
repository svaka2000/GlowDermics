/**
 * ProgressStoryCard — a premium, share-ready 9:16 "Skin Story" card.
 *
 * Presentational only: give it the user's scan history (Storage.getAnalyses())
 * and it renders a quiet-luxury summary of their journey — latest overall
 * score, the change since their first scan, and what's improving — wrapped in
 * the Velumi serif identity. No data fetching, no side effects, no contracts.
 */
import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../constants/colors';
import { useColors } from '../../state/theme';
import { fonts } from '../../constants/typography';
import { ScoreRing } from '../ScoreRing';
import { VelumiWordmark } from './VelumiWordmark';
import type { SkinAnalysis } from '../../types';

const DIMS: { key: 'hydration' | 'clarity' | 'texture' | 'evenness' | 'firmness' | 'pores'; label: string }[] = [
  { key: 'hydration', label: 'Hydration' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'texture', label: 'Texture' },
  { key: 'evenness', label: 'Evenness' },
  { key: 'firmness', label: 'Firmness' },
  { key: 'pores', label: 'Pores' },
];

function monthYear(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export interface ProgressStoryStats {
  overall: number;
  overallDelta: number;
  multi: boolean;
  scans: number;
  sinceLabel: string;
  improving: boolean;
  rows: { label: string; val: number; delta: number }[];
}

/** Pure derivation of the story stats — exported so the screen can reuse it for the share text. */
export function deriveProgressStory(analyses: SkinAnalysis[]): ProgressStoryStats | null {
  if (!analyses || analyses.length === 0) return null;
  const sorted = [...analyses].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  const multi = sorted.length >= 2;
  const overall = Math.round(latest.scores?.overall ?? 0);
  const overallDelta = multi ? overall - Math.round(first.scores?.overall ?? 0) : 0;

  const improvingRows = DIMS
    .map((d) => ({ label: d.label, val: latest.scores?.[d.key] ?? 0, delta: (latest.scores?.[d.key] ?? 0) - (first.scores?.[d.key] ?? 0) }))
    .filter((r) => r.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);

  const strengthRows = DIMS
    .map((d) => ({ label: d.label, val: latest.scores?.[d.key] ?? 0, delta: 0 }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 3);

  const improving = multi && improvingRows.length > 0;
  return {
    overall,
    overallDelta,
    multi,
    scans: sorted.length,
    sinceLabel: monthYear(first.date),
    improving,
    rows: improving ? improvingRows : strengthRows,
  };
}

export function ProgressStoryCard({ analyses }: { analyses: SkinAnalysis[] }) {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const s = useMemo(() => deriveProgressStory(analyses), [analyses]);

  if (!s) {
    return (
      <View style={styles.card}>
        <LinearGradient colors={[c.bgElevated, c.bgCard]} style={StyleSheet.absoluteFill} />
        <View style={styles.inner}>
          <VelumiWordmark size="sm" />
          <Text style={styles.headline}>Your story{'\n'}starts here</Text>
          <Text style={styles.emptySub}>Take your first scan to begin tracking your skin journey.</Text>
        </View>
      </View>
    );
  }

  const deltaPositive = s.overallDelta > 0;
  const deltaText = !s.multi
    ? 'Your baseline'
    : s.overallDelta === 0
      ? 'Holding steady'
      : `${deltaPositive ? '▲ +' : '▼ '}${deltaPositive ? s.overallDelta : s.overallDelta} since ${s.sinceLabel}`;
  const deltaColor = !s.multi ? c.textMuted : s.overallDelta > 0 ? c.scoreGood : s.overallDelta < 0 ? c.gold : c.textSecondary;

  return (
    <View style={styles.card}>
      <LinearGradient colors={[c.bgElevated, c.bgCard]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.inner}>
        <VelumiWordmark size="sm" />

        <View style={styles.headBlock}>
          <Text style={styles.overline}>SKIN PROGRESS</Text>
          <Text style={styles.headline}>Your Skin Story</Text>
        </View>

        <View style={styles.ringWrap}>
          <ScoreRing score={s.overall} size={148} strokeWidth={10} />
          <Text style={[styles.deltaPill, { color: deltaColor }]}>{deltaText}</Text>
        </View>

        <View style={styles.rows}>
          <Text style={styles.rowsTitle}>{s.improving ? "WHAT'S IMPROVING" : 'YOUR STRENGTHS'}</Text>
          {s.rows.map((r) => (
            <View key={r.label} style={styles.row}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <View style={styles.rowRight}>
                <Text style={styles.rowVal}>{Math.round(r.val)}</Text>
                {s.improving && r.delta > 0 ? (
                  <Text style={styles.rowDelta}>+{Math.round(r.delta)}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.hair} />
          <Text style={styles.footerText}>
            {s.scans} {s.scans === 1 ? 'SCAN' : 'SCANS'} · VELUMI AI
          </Text>
        </View>
      </View>
    </View>
  );
}

export default ProgressStoryCard;

function makeStyles(c: Palette) {
  return StyleSheet.create({
    card: {
      width: '100%',
      maxWidth: 340,
      aspectRatio: 9 / 16,
      borderRadius: 28,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
      alignSelf: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
    inner: { flex: 1, paddingHorizontal: 28, paddingVertical: 30, alignItems: 'center', justifyContent: 'space-between' },
    headBlock: { alignItems: 'center', gap: 6 },
    overline: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', letterSpacing: 2.4, color: c.primary, textTransform: 'uppercase' },
    headline: { fontFamily: fonts.display, fontSize: 27, fontWeight: '600', color: c.textPrimary, textAlign: 'center', letterSpacing: 0.2, lineHeight: 33 },
    emptySub: { fontFamily: fonts.body, fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 21, marginTop: 12, letterSpacing: 0.1 },
    ringWrap: { alignItems: 'center', gap: 14 },
    deltaPill: { fontFamily: fonts.body, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
    rows: { width: '100%', gap: 10 },
    rowsTitle: { fontFamily: fonts.body, fontSize: 10, fontWeight: '600', letterSpacing: 2.2, color: c.textMuted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowLabel: { fontFamily: fonts.body, fontSize: 14, color: c.textSecondary, letterSpacing: 0.1 },
    rowRight: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    rowVal: { fontFamily: fonts.display, fontSize: 17, fontWeight: '600', color: c.textPrimary },
    rowDelta: { fontFamily: fonts.body, fontSize: 12, fontWeight: '700', color: c.scoreGood },
    footer: { width: '100%', alignItems: 'center', gap: 12 },
    hair: { width: 40, height: 1, backgroundColor: c.border },
    footerText: { fontFamily: fonts.body, fontSize: 10, fontWeight: '600', letterSpacing: 2.4, color: c.textMuted, textTransform: 'uppercase' },
  });
}
