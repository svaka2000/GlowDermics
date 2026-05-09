import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radii } from '../../constants/theme';
import { SkinScore, SkinScoreV2 } from '../../types';
import { useColors } from '../../state/theme';
import type { Palette } from '../../constants/colors';

const DIM_LABELS_V1: Record<keyof SkinScore, string> = {
  overall: 'Overall',
  hydration: 'Hydration',
  texture: 'Texture',
  clarity: 'Clarity',
  evenness: 'Evenness',
  firmness: 'Firmness',
  pores: 'Pores',
};

const DIM_LABELS_V2_EXTRAS: Partial<Record<keyof SkinScoreV2, string>> = {
  radiance: 'Radiance',
  redness: 'Redness',
  darkSpots: 'Dark Spots',
  darkCircles: 'Dark Circles',
  wrinkles: 'Wrinkles',
  acne: 'Acne',
  oiliness: 'Oil Balance',
  sensitivity: 'Sensitivity',
  barrierHealth: 'Barrier',
};

function buildTints(c: Palette): Record<string, string> {
  return {
    overall: c.primary,
    hydration: c.hydration,
    texture: c.texture,
    clarity: c.clarity,
    evenness: c.evenness,
    firmness: c.firmness,
    pores: c.pores,
    radiance: c.radiance,
    redness: c.redness,
    darkSpots: c.darkSpots,
    darkCircles: c.darkCircles,
    wrinkles: c.wrinkles,
    acne: c.acne,
    oiliness: c.oiliness,
    sensitivity: c.sensitivity,
    barrierHealth: c.barrierHealth,
  };
}

interface DeltaGridProps {
  before: SkinScore | SkinScoreV2;
  after: SkinScore | SkinScoreV2;
  /** Hide the "overall" tile (typically shown elsewhere as a hero). */
  hideOverall?: boolean;
}

/**
 * DeltaGrid — every dimension shown side-by-side as before / after / delta.
 * Auto-detects v1 (7 metrics) vs v2 (16 metrics). Uses a horizontal scroll
 * grid of compact tiles so all dimensions fit even on small screens.
 */
export function DeltaGrid({ before, after, hideOverall = true }: DeltaGridProps) {
  const colors = useColors();
  const tints = useMemo(() => buildTints(colors), [colors]);
  const isV2 = (k: string): k is keyof SkinScoreV2 =>
    k in DIM_LABELS_V2_EXTRAS || k in DIM_LABELS_V1;

  const keys = Object.keys(after).filter(k => isV2(k) && (k !== 'overall' || !hideOverall));

  // Sort: largest |delta| first.
  keys.sort((a, b) => {
    const da = Math.abs((after as any)[a] - (before as any)[a]);
    const db = Math.abs((after as any)[b] - (before as any)[b]);
    return db - da;
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {keys.map(k => {
        const b = (before as any)[k] ?? 0;
        const a = (after as any)[k] ?? 0;
        const d = a - b;
        const tint = tints[k] ?? colors.primary;
        const label = DIM_LABELS_V1[k as keyof SkinScore] ?? DIM_LABELS_V2_EXTRAS[k as keyof SkinScoreV2] ?? k;

        const dirColor =
          d > 0 ? colors.scoreExcellent : d < 0 ? colors.scorePoor : colors.textMuted;
        const dirIcon = d > 0 ? 'trending-up' : d < 0 ? 'trending-down' : 'remove';

        return (
          <View
            key={k}
            style={[
              styles.tile,
              { backgroundColor: colors.bgCard, borderColor: colors.border, borderTopColor: tint },
            ]}
          >
            <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
            <View style={styles.valuesRow}>
              <View style={styles.valBlock}>
                <Text style={[styles.valSmall, { color: colors.textMuted }]}>{b}</Text>
                <Text style={[styles.valTag, { color: colors.textMuted }]}>before</Text>
              </View>
              <Ionicons name="arrow-forward" size={11} color={colors.textMuted} />
              <View style={styles.valBlock}>
                <Text style={[styles.valBig, { color: tint }]}>{a}</Text>
                <Text style={[styles.valTag, { color: colors.textMuted }]}>after</Text>
              </View>
            </View>
            <View
              style={[
                styles.deltaPill,
                { backgroundColor: dirColor + '15', borderColor: dirColor + '40' },
              ]}
            >
              <Ionicons name={dirIcon as any} size={10} color={dirColor} />
              <Text style={[styles.deltaText, { color: dirColor }]}>
                {d > 0 ? '+' : ''}
                {d}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: 4, paddingHorizontal: 4, gap: 10 },
  tile: {
    width: 124,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderTopWidth: 3,
    padding: 12,
    gap: 8,
    shadowColor: '#1C1814',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
  valuesRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  valBlock: { flex: 1, alignItems: 'center' },
  valSmall: { fontSize: 18, fontWeight: '700' },
  valBig: { fontSize: 24, fontWeight: '900', letterSpacing: -0.4 },
  valTag: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  deltaText: { fontSize: 11, fontWeight: '900' },
});
