import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Radii } from '../../constants/theme';
import { useColors, useTheme } from '../../state/theme';
import type { Palette } from '../../constants/colors';

interface MetricBarProps {
  label: string;
  value: number; // 0-100
  /** Optional confidence (0-100) — renders a subtle dotted overlay. */
  confidence?: number;
  /** Tint for the bar fill. Defaults to score-based color. */
  tint?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  /** Trend arrow vs prior reading. */
  trend?: 'up' | 'down' | 'flat';
  trendDelta?: number;
  /** Animation entrance delay (ms). */
  delay?: number;
  onPress?: () => void;
  /** Compact mode — single line, smaller. */
  compact?: boolean;
}

function scoreColor(value: number, palette: Palette): string {
  if (value >= 80) return palette.scoreExcellent;
  if (value >= 65) return palette.scoreGood;
  if (value >= 45) return palette.scoreFair;
  return palette.scorePoor;
}

/**
 * MetricBar — animated horizontal bar with label, value, optional confidence
 * indicator, and trend arrow. Replaces the legacy ScoreBar with much richer
 * visual semantics.
 */
export function MetricBar({
  label,
  value,
  confidence,
  tint,
  icon,
  trend,
  trendDelta,
  delay = 0,
  onPress,
  compact = false,
}: MetricBarProps) {
  const colors = useColors();
  const { scheme } = useTheme();
  const fill = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const color = tint ?? scoreColor(value, colors);
  // Track tint differs by scheme — subtle dark wash on light, subtle light wash on dark.
  const trackBg = scheme === 'dark' ? 'rgba(245,240,234,0.08)' : 'rgba(28,24,20,0.06)';
  const confTrackBg = scheme === 'dark' ? 'rgba(245,240,234,0.06)' : 'rgba(28,24,20,0.04)';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(fill, {
        toValue: value,
        duration: 900,
        delay: delay + 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [value, delay, fade, fill]);

  const widthInterpolation = fill.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const trendColor =
    trend === 'up' ? colors.scoreExcellent : trend === 'down' ? colors.scorePoor : colors.textMuted;
  const trendIcon =
    trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove';

  const Wrapper: any = onPress ? Pressable : View;

  return (
    <Wrapper onPress={onPress}>
      <Animated.View style={[{ opacity: fade }, compact ? styles.compactWrap : styles.wrap]}>
        <View style={styles.headerRow}>
          <View style={styles.labelRow}>
            {icon && <Ionicons name={icon} size={13} color={color} />}
            <Text style={[styles.label, { color: colors.textPrimary }, compact && { fontSize: 12 }]}>{label}</Text>
          </View>
          <View style={styles.valueRow}>
            {trend && trendDelta !== undefined && (
              <View style={[styles.trendChip, { backgroundColor: trendColor + '15' }]}>
                <Ionicons name={trendIcon as any} size={10} color={trendColor} />
                <Text style={[styles.trendText, { color: trendColor }]}>
                  {trendDelta > 0 ? '+' : ''}
                  {trendDelta}
                </Text>
              </View>
            )}
            <Text style={[styles.value, { color }, compact && { fontSize: 14 }]}>{value}</Text>
          </View>
        </View>

        <View style={[styles.track, { backgroundColor: trackBg }]}>
          <Animated.View style={[styles.fill, { width: widthInterpolation }]}>
            <LinearGradient
              colors={[color + 'CC', color]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Subtle inner highlight */}
            <LinearGradient
              colors={['rgba(255,255,255,0.35)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[StyleSheet.absoluteFillObject, { height: '50%' }]}
            />
          </Animated.View>
        </View>

        {confidence !== undefined && !compact && (
          <View style={styles.confidenceRow}>
            <Text style={[styles.confidenceLabel, { color: colors.textMuted }]}>confidence</Text>
            <View style={[styles.confidenceTrack, { backgroundColor: confTrackBg }]}>
              <View
                style={{
                  width: `${confidence}%`,
                  height: '100%',
                  backgroundColor: color,
                  opacity: 0.45,
                  borderRadius: 1,
                }}
              />
            </View>
            <Text style={[styles.confidenceLabel, { color }]}>{confidence}%</Text>
          </View>
        )}
      </Animated.View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, paddingVertical: 4 },
  compactWrap: { gap: 4, paddingVertical: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  label: { fontSize: 13, fontWeight: '600' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  track: {
    height: 8,
    borderRadius: Radii.xs,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: Radii.xs, overflow: 'hidden' },
  trendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radii.pill,
  },
  trendText: { fontSize: 10, fontWeight: '800' },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  confidenceLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  confidenceTrack: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
});
