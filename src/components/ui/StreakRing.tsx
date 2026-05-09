import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useColors, useTheme } from '../../state/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface StreakRingProps {
  /** Current streak in days. */
  currentStreak: number;
  /** Target days for the next milestone (e.g. 7, 14, 30). */
  nextMilestone: number;
  /** Diameter in points. Default 200. */
  size?: number;
  /** Show pulsing red halo to alert about a streak in danger. */
  atRisk?: boolean;
  /** Animation delay (ms). */
  delay?: number;
  /** Optional sub-label rendered below the count (e.g. "of 7 days"). */
  subLabel?: string;
}

/**
 * StreakRing — circular SVG progress ring driven by Reanimated 4 worklets.
 *
 * - Inner number: current streak, animated count-up.
 * - Progress arc: fills from 0 → currentStreak/nextMilestone of the circle.
 * - Color shifts with streak length: cool blue at 0, terracotta at 7+, gold/red at 30+.
 * - At-risk pulses a red halo to nudge the user to log before midnight.
 * - Flame icon stays subtly above the number when streak ≥ 3.
 */
export function StreakRing({
  currentStreak,
  nextMilestone,
  size = 200,
  atRisk = false,
  delay = 0,
  subLabel,
}: StreakRingProps) {
  const stroke = Math.max(8, size * 0.06);
  const radius = size / 2 - stroke / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const palette = useColors();
  const { scheme } = useTheme();
  const trackStroke = scheme === 'dark' ? 'rgba(245,240,234,0.10)' : 'rgba(28,24,20,0.06)';

  // Color tiers by streak length.
  const tier =
    currentStreak >= 60
      ? { from: '#FBBF24', to: '#DC2626' }   // gold → fire-red (legendary)
      : currentStreak >= 30
      ? { from: '#F0C94A', to: '#E8834A' }   // gold → terracotta (lunar cycle)
      : currentStreak >= 14
      ? { from: '#E8834A', to: '#C4622D' }   // terracotta gradient (fortnight)
      : currentStreak >= 7
      ? { from: '#E08250', to: '#A04D24' }   // primary gradient (week+)
      : currentStreak >= 3
      ? { from: '#FBBF24', to: '#C4622D' }   // gold→terracotta (spark)
      : { from: '#0EA5E9', to: '#0284C7' };  // sky blue (just starting)

  const targetFraction = Math.min(1, currentStreak / nextMilestone);

  // Reanimated values.
  const fillProgress = useSharedValue(0);
  const counter = useSharedValue(0);
  const pulse = useSharedValue(0);
  const riskPulse = useSharedValue(0);
  const fade = useSharedValue(0);

  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    fade.value = withDelay(delay, withTiming(1, { duration: 380 }));
    fillProgress.value = withDelay(
      delay + 80,
      withTiming(targetFraction, { duration: 1100, easing: Easing.out(Easing.cubic) }),
    );
    counter.value = withDelay(
      delay + 80,
      withTiming(currentStreak, { duration: 1100, easing: Easing.out(Easing.cubic) }),
    );
    // Soft breathing pulse around the inner glow.
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(fade);
      cancelAnimation(fillProgress);
      cancelAnimation(counter);
      cancelAnimation(pulse);
    };
  }, [currentStreak, targetFraction, delay]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (atRisk) {
      riskPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(riskPulse);
      riskPulse.value = withTiming(0, { duration: 200 });
    }
    return () => { cancelAnimation(riskPulse); };
  }, [atRisk]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bridge counter shared value → React state for the text node.
  useAnimatedReaction(
    () => Math.round(counter.value),
    (next, prev) => {
      if (next !== prev) runOnJS(setDisplayCount)(next);
    },
  );

  // Animated arc: strokeDashoffset = circumference * (1 - progress).
  const arcProps = useAnimatedProps(() => {
    const offset = circumference * (1 - fillProgress.value);
    return { strokeDashoffset: offset };
  });

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ scale: interpolate(fade.value, [0, 1], [0.92, 1]) }],
  }));

  const innerGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.4,
    transform: [{ scale: 0.95 + pulse.value * 0.06 }],
  }));

  const riskHaloStyle = useAnimatedStyle(() => ({
    opacity: riskPulse.value * 0.5,
    transform: [{ scale: 1 + riskPulse.value * 0.15 }],
  }));

  return (
    <Animated.View style={[styles.wrap, { width: size, height: size }, wrapStyle]}>
      {/* At-risk halo (rendered behind the SVG) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.riskHalo,
          { width: size + 24, height: size + 24, borderRadius: (size + 24) / 2 },
          riskHaloStyle,
        ]}
      />

      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id="streakArcGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={tier.from} stopOpacity={1} />
            <Stop offset="100%" stopColor={tier.to} stopOpacity={1} />
          </SvgLinearGradient>
          <RadialGradient id="streakInnerGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={tier.from} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={tier.from} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={trackStroke}
          strokeWidth={stroke}
          fill="none"
        />

        {/* Animated progress arc — start at top, sweep clockwise. */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="url(#streakArcGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          animatedProps={arcProps}
        />
      </Svg>

      {/* Inner glow under the number */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { alignItems: 'center', justifyContent: 'center' },
          innerGlowStyle,
        ]}
      >
        <View
          style={{
            width: size * 0.55,
            height: size * 0.55,
            borderRadius: (size * 0.55) / 2,
            backgroundColor: tier.from,
            opacity: 0.18,
          }}
        />
      </Animated.View>

      {/* Center label */}
      <View style={styles.centerWrap}>
        {currentStreak >= 3 && (
          <Text style={styles.flame}>🔥</Text>
        )}
        <Text style={[styles.count, { color: tier.to }]}>{displayCount}</Text>
        <Text style={[styles.dayLabel, { color: palette.textMuted }]}>{displayCount === 1 ? 'DAY' : 'DAYS'}</Text>
        {subLabel && <Text style={[styles.subLabel, { color: palette.textSecondary }]}>{subLabel}</Text>}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  riskHalo: {
    position: 'absolute',
    backgroundColor: 'rgba(220,38,38,0.35)',
    shadowColor: '#DC2626',
    shadowOpacity: 0.7,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  centerWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  flame: {
    fontSize: 18,
    marginBottom: 2,
  },
  count: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -3,
    lineHeight: 64,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: -2,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
});
