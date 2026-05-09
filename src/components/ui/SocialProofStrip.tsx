import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Radii } from '../../constants/theme';
import { useColors, useTheme } from '../../state/theme';

interface SocialProofStripProps {
  /** Average rating (e.g. 4.9). */
  rating?: number;
  /** Number of reviews/users (e.g. 24000). Will be formatted as 24K+. */
  userCount?: number;
  /** Optional plain-text label override. Falls back to "Trusted by 24K+ users · 4.9★". */
  label?: string;
  /** Animation entrance delay (ms). */
  delay?: number;
  /** Compact: single-line strip. Default. */
  compact?: boolean;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000) return `${Math.floor(n / 1000)}K+`;
  return `${n}`;
}

/**
 * SocialProofStrip — small horizontal strip showing rating + user count
 * with a subtle pulse on the stars to draw attention.
 *
 * Use above the tier cards in the paywall, on landing pages, or anywhere
 * you want to anchor trust with quick numbers.
 */
export function SocialProofStrip({
  rating = 4.9,
  userCount = 24000,
  label,
  delay = 0,
  compact = true,
}: SocialProofStripProps) {
  const colors = useColors();
  const { scheme } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);
  const starPulse = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 380 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) }));
    starPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateY);
      cancelAnimation(starPulse);
    };
  }, [delay]); // eslint-disable-line react-hooks/exhaustive-deps

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const starWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + starPulse.value * 0.06 }],
  }));

  const stars = Math.round(rating);
  const fullCount = formatCount(userCount);
  const displayLabel = label ?? `Trusted by ${fullCount} skin journeys`;

  const dividerColor = scheme === 'dark' ? 'rgba(245,240,234,0.18)' : 'rgba(28,24,20,0.12)';

  return (
    <Animated.View
      style={[
        styles.wrap,
        compact ? styles.compact : null,
        { backgroundColor: colors.primary + '0F', borderColor: colors.primary + '30' },
        wrapStyle,
      ]}
    >
      <Animated.View style={[styles.stars, starWrapStyle]}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} index={i} filled={i < stars} pulse={starPulse} />
        ))}
        <Text style={[styles.rating, { color: colors.primary }]}>{rating.toFixed(1)}</Text>
      </Animated.View>
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
      <Text style={[styles.label, { color: colors.textSecondary }]}>{displayLabel}</Text>
    </Animated.View>
  );
}

function Star({
  index,
  filled,
  pulse,
}: {
  index: number;
  filled: boolean;
  pulse: ReturnType<typeof useSharedValue<number>>;
}) {
  const style = useAnimatedStyle(() => {
    const phase = (pulse.value + index * 0.12) % 1;
    return {
      opacity: filled ? interpolate(phase, [0, 0.5, 1], [0.85, 1, 0.85]) : 0.35,
    };
  });
  return (
    <Animated.View style={style}>
      <Ionicons
        name={filled ? 'star' : 'star-outline'}
        size={14}
        color="#FBBF24"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radii.pill,
    borderWidth: 1,
    alignSelf: 'center',
  },
  compact: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rating: { fontSize: 12, fontWeight: '900', marginLeft: 6, letterSpacing: 0.2 },
  divider: { width: 1, height: 14 },
  label: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.2 },
});
