import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Radii } from '../../constants/theme';
import { useColors, useTheme } from '../../state/theme';

interface XPBarProps {
  /** XP within the current level (numerator). */
  xpInLevel: number;
  /** XP required to reach the next level (denominator). */
  xpForLevel: number;
  /** Current level number for display (1-indexed). */
  level: number;
  /** Total lifetime XP for the small caption. */
  totalXP?: number;
  /** Optional label override above the bar (defaults to "LEVEL N"). */
  label?: string;
  /** Animation entrance delay (ms). */
  delay?: number;
  /** Heights — default is the standard 8px track. */
  height?: number;
  /** Show the level + xp text labels above the bar. */
  showLabels?: boolean;
}

/**
 * XPBar — animated progress bar for level + XP display.
 *
 * Shows: "LEVEL N" label, "X / Y XP to next" caption, animated gradient fill.
 * Reanimated worklet drives the fill so it stays on the UI thread.
 */
export function XPBar({
  xpInLevel,
  xpForLevel,
  level,
  totalXP,
  label,
  delay = 0,
  height = 8,
  showLabels = true,
}: XPBarProps) {
  const colors = useColors();
  const { scheme } = useTheme();
  const fill = useSharedValue(0);
  const fade = useSharedValue(0);

  const targetFraction = xpForLevel > 0 ? Math.max(0, Math.min(1, xpInLevel / xpForLevel)) : 0;

  useEffect(() => {
    fade.value = withDelay(delay, withTiming(1, { duration: 320 }));
    fill.value = withDelay(
      delay + 80,
      withTiming(targetFraction, { duration: 1000, easing: Easing.out(Easing.cubic) }),
    );
    return () => {
      cancelAnimation(fade);
      cancelAnimation(fill);
    };
  }, [targetFraction, delay]); // eslint-disable-line react-hooks/exhaustive-deps

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));

  const wrapStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  const trackBg = scheme === 'dark' ? 'rgba(245,240,234,0.08)' : 'rgba(28,24,20,0.06)';
  const highlightOverlay: [string, string] =
    scheme === 'dark'
      ? ['rgba(255,255,255,0.25)', 'transparent']
      : ['rgba(255,255,255,0.45)', 'transparent'];

  return (
    <Animated.View style={[styles.wrap, wrapStyle]}>
      {showLabels && (
        <View style={styles.labelRow}>
          <View
            style={[
              styles.levelPill,
              { backgroundColor: colors.primary + '1A', borderColor: colors.primary + '40' },
            ]}
          >
            <Text style={[styles.levelText, { color: colors.primary }]}>{label ?? `LEVEL ${level}`}</Text>
          </View>
          <Text style={styles.xpText}>
            <Text style={[styles.xpStrong, { color: colors.textPrimary }]}>{xpInLevel}</Text>
            <Text style={[styles.xpDim, { color: colors.textMuted }]}> / {xpForLevel} XP</Text>
          </Text>
        </View>
      )}

      <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackBg }]}>
        <Animated.View style={[styles.fill, { borderRadius: height / 2 }, fillStyle]}>
          <LinearGradient
            colors={['#D8C29A', '#B79B6E', colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={highlightOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[StyleSheet.absoluteFill, { height: '50%' }]}
          />
        </Animated.View>
      </View>

      {totalXP !== undefined && showLabels && (
        <Text style={[styles.totalText, { color: colors.textMuted }]}>
          {totalXP.toLocaleString()} XP lifetime
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelPill: {
    borderRadius: Radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
  },
  levelText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  xpText: { fontSize: 12, fontWeight: '600' },
  xpStrong: { fontWeight: '900' },
  xpDim: { fontWeight: '700' },
  track: { overflow: 'hidden' },
  fill: { height: '100%', overflow: 'hidden' },
  totalText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, marginTop: 2 },
});
