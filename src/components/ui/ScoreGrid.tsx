import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';
import { SkinScoreV2, SkinConfidence } from '../../types';

type DimensionKey = keyof SkinScoreV2;

const DIMENSIONS: { key: DimensionKey; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; tint: string }[] = [
  { key: 'overall',      label: 'Overall',      icon: 'medal-outline',          tint: Colors.primary },
  { key: 'hydration',    label: 'Hydration',    icon: 'water-outline',          tint: Colors.hydration },
  { key: 'texture',      label: 'Texture',      icon: 'grid-outline',           tint: Colors.texture },
  { key: 'clarity',      label: 'Clarity',      icon: 'sparkles-outline',       tint: Colors.clarity },
  { key: 'evenness',     label: 'Evenness',     icon: 'color-palette-outline',  tint: Colors.evenness },
  { key: 'firmness',     label: 'Firmness',     icon: 'shield-checkmark-outline', tint: Colors.firmness },
  { key: 'pores',        label: 'Pores',        icon: 'apps-outline',           tint: Colors.pores },
  { key: 'radiance',     label: 'Radiance',     icon: 'sunny-outline',          tint: Colors.radiance },
  { key: 'redness',      label: 'Redness',      icon: 'flame-outline',          tint: Colors.redness },
  { key: 'darkSpots',    label: 'Dark Spots',   icon: 'eyedrop-outline',        tint: Colors.darkSpots },
  { key: 'darkCircles',  label: 'Dark Circles', icon: 'moon-outline',           tint: Colors.darkCircles },
  { key: 'wrinkles',     label: 'Wrinkles',     icon: 'pulse-outline',          tint: Colors.wrinkles },
  { key: 'acne',         label: 'Acne',         icon: 'bandage-outline',        tint: Colors.acne },
  { key: 'oiliness',     label: 'Oil Balance',  icon: 'leaf-outline',           tint: Colors.oiliness },
  { key: 'sensitivity',  label: 'Sensitivity',  icon: 'thermometer-outline',    tint: Colors.sensitivity },
  { key: 'barrierHealth',label: 'Barrier',      icon: 'lock-closed-outline',    tint: Colors.barrierHealth },
];

interface ScoreGridProps {
  scores: SkinScoreV2;
  confidence?: SkinConfidence;
  /** Optional prior scan for delta arrows. */
  previous?: SkinScoreV2;
  /** Hide overall in grid (it's usually shown in the hero ring). */
  hideOverall?: boolean;
  onTilePress?: (key: DimensionKey) => void;
}

/**
 * ScoreGrid — 16-dimension scrollable tile grid.
 *
 * Each tile shows: dimension label, icon, score, optional confidence dot,
 * optional trend arrow. Tap to drill into a single-metric explanation.
 */
export function ScoreGrid({ scores, confidence, previous, hideOverall, onTilePress }: ScoreGridProps) {
  const dims = hideOverall ? DIMENSIONS.filter(d => d.key !== 'overall') : DIMENSIONS;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {dims.map(d => {
        const score = scores[d.key];
        const conf = confidence?.[d.key];
        const prev = previous?.[d.key];
        const delta = prev !== undefined ? score - prev : undefined;
        return (
          <Pressable
            key={d.key}
            onPress={() => onTilePress?.(d.key)}
            style={({ pressed }) => [
              styles.tile,
              pressed && { transform: [{ scale: 0.96 }] },
            ]}
          >
            <View style={[styles.iconBubble, { backgroundColor: d.tint + '18', borderColor: d.tint + '40' }]}>
              <Ionicons name={d.icon} size={18} color={d.tint} />
            </View>
            <Text style={styles.label}>{d.label}</Text>
            <Text style={[styles.value, { color: d.tint }]}>{score}</Text>
            <View style={styles.metaRow}>
              {conf !== undefined && (
                <View style={styles.confRow}>
                  <View style={[styles.confDot, { backgroundColor: d.tint }]} />
                  <Text style={styles.confText}>{conf}%</Text>
                </View>
              )}
              {delta !== undefined && delta !== 0 && (
                <View
                  style={[
                    styles.delta,
                    {
                      backgroundColor: delta > 0 ? 'rgba(22,163,74,0.10)' : 'rgba(220,38,38,0.10)',
                    },
                  ]}
                >
                  <Ionicons
                    name={delta > 0 ? 'trending-up' : 'trending-down'}
                    size={9}
                    color={delta > 0 ? Colors.scoreExcellent : Colors.scorePoor}
                  />
                  <Text
                    style={[
                      styles.deltaText,
                      { color: delta > 0 ? Colors.scoreExcellent : Colors.scorePoor },
                    ]}
                  >
                    {delta > 0 ? '+' : ''}
                    {delta}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 4, paddingVertical: 4, gap: 10 },
  tile: {
    width: 100,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 6,
    shadowColor: '#1C1814',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: -0.1 },
  value: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -2 },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  confDot: { width: 5, height: 5, borderRadius: 2.5, opacity: 0.7 },
  confText: { fontSize: 9, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.4 },
  delta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: Radii.pill,
    marginLeft: 'auto',
  },
  deltaText: { fontSize: 9, fontWeight: '900' },
});
