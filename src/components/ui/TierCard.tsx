import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Radii } from '../../constants/theme';
import { useColors } from '../../state/theme';

export interface TierFeature {
  label: string;
  included: boolean;
  /** Highlight feature with primary tint (e.g. headline differentiator). */
  highlight?: boolean;
}

interface TierCardProps {
  /** Short tier identifier — `free`, `premium`, `ultra`, etc. */
  id: string;
  /** Display name. */
  name: string;
  /** Optional eyebrow string above the price (e.g. "MOST POPULAR"). */
  eyebrow?: string;
  /** Display price string (already includes currency / period). */
  price: string;
  /** Smaller secondary price — e.g. "$59.88/yr · save 17%". */
  priceSub?: string;
  /** Strikethrough original price for sales. */
  priceStrike?: string;
  /** Brief tagline under price. */
  tagline: string;
  /** Feature checklist. */
  features: TierFeature[];
  /** True for the recommended tier — gets glow + border. */
  recommended?: boolean;
  /** Whether this card is currently selected. */
  selected?: boolean;
  onSelect?: () => void;
  /** Animation entrance delay (ms). */
  delay?: number;
  /** Optional custom gradient colors. Defaults pick from tier id. */
  gradient?: [string, string, string?];
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_GRADIENTS: Record<string, [string, string, string?]> = {
  free: ['#F0EAE3', '#E5DCD0'],
  premium: ['#E8834A', '#C4622D', '#9E4D22'],
  ultra: ['#0F1F33', '#0A1426', '#0E1B30'],
};

/**
 * TierCard — premium pricing-tier card with gradient background, glowing
 * border on selection, "Most Popular" eyebrow shimmer, and Reanimated 4
 * entrance + select animations.
 *
 * Designed to be composed in a row of 2-3 tiers. Each card is full width when
 * stacked; constrain via parent layout for side-by-side use.
 */
export function TierCard({
  id,
  name,
  eyebrow,
  price,
  priceSub,
  priceStrike,
  tagline,
  features,
  recommended = false,
  selected = false,
  onSelect,
  delay = 0,
  gradient,
  style,
}: TierCardProps) {
  const palette = useColors();
  const gradientStops = gradient ?? DEFAULT_GRADIENTS[id] ?? DEFAULT_GRADIENTS.premium;
  const isLight = id === 'free';

  // Light-tier text needs to source from active palette so it flips in dark mode.
  // Dark-tier text stays white-on-gradient (gradient itself is opaque).
  const lightTextPrimary = palette.textPrimary;
  const lightTextSecondary = palette.textSecondary;
  const lightTextMuted = palette.textMuted;
  const lightPrimary = palette.primary;

  // Entrance
  const entry = useSharedValue(0);
  // Selection scale + glow
  const selectGlow = useSharedValue(selected ? 1 : 0);
  // Recommended shimmer
  const shimmer = useSharedValue(0);

  useEffect(() => {
    entry.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 130, mass: 0.9 }));
    return () => { cancelAnimation(entry); };
  }, [delay]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    selectGlow.value = withTiming(selected ? 1 : 0, { duration: 280, easing: Easing.out(Easing.cubic) });
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!recommended) return;
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => { cancelAnimation(shimmer); };
  }, [recommended]); // eslint-disable-line react-hooks/exhaustive-deps

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: entry.value,
    transform: [
      { translateY: interpolate(entry.value, [0, 1], [22, 0]) },
      { scale: interpolate(entry.value, [0, 1], [0.94, 1]) + selectGlow.value * 0.018 },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: selectGlow.value,
    transform: [{ scale: interpolate(selectGlow.value, [0, 1], [0.92, 1.04]) }],
  }));

  const eyebrowShimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + shimmer.value * 0.45,
    transform: [{ scale: 1 + shimmer.value * 0.04 }],
  }));

  return (
    <Animated.View style={[styles.outerWrap, wrapStyle, style]}>
      {/* Selection halo (rendered behind card) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.selectRing,
          { borderColor: id === 'free' ? lightPrimary : '#FFFFFF' },
          ringStyle,
        ]}
      />

      <Pressable onPress={onSelect} android_ripple={{ color: 'rgba(255,255,255,0.08)' }}>
        <View style={styles.card}>
          <LinearGradient
            colors={gradientStops as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Recommended eyebrow ribbon */}
          {recommended && eyebrow && (
            <Animated.View style={[styles.eyebrowWrap, eyebrowShimmerStyle]}>
              <LinearGradient
                colors={['#FBBF24', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="star" size={10} color="#fff" />
              <Text style={styles.eyebrowText}>{eyebrow}</Text>
            </Animated.View>
          )}

          <View style={styles.content}>
            <Text style={[styles.name, isLight && { color: lightTextPrimary }]}>{name}</Text>
            <Text style={[styles.tagline, isLight && { color: lightTextSecondary }]}>{tagline}</Text>

            <View style={styles.priceRow}>
              {priceStrike && (
                <Text style={[styles.priceStrike, isLight && { color: lightTextMuted }]}>{priceStrike}</Text>
              )}
              <Text style={[styles.price, isLight && { color: lightTextPrimary }]}>{price}</Text>
            </View>
            {priceSub && (
              <Text style={[styles.priceSub, isLight && { color: lightTextMuted }]}>{priceSub}</Text>
            )}

            <View style={styles.divider} />

            {features.map((f, i) => {
              const featureColor = !f.included
                ? isLight
                  ? lightTextMuted
                  : 'rgba(255,255,255,0.45)'
                : f.highlight
                ? isLight
                  ? lightPrimary
                  : '#FBBF24'
                : isLight
                ? lightTextPrimary
                : 'rgba(255,255,255,0.92)';

              return (
                <View key={`${f.label}-${i}`} style={styles.featureRow}>
                  <View
                    style={[
                      styles.featureIcon,
                      {
                        backgroundColor: f.included
                          ? isLight
                            ? lightPrimary + '29'
                            : 'rgba(255,255,255,0.16)'
                          : isLight
                          ? lightTextPrimary + '14'
                          : 'rgba(255,255,255,0.06)',
                      },
                    ]}
                  >
                    <Ionicons
                      name={f.included ? 'checkmark' : 'close'}
                      size={11}
                      color={
                        f.included
                          ? isLight
                            ? lightPrimary
                            : '#FFFFFF'
                          : isLight
                          ? lightTextMuted
                          : 'rgba(255,255,255,0.45)'
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.featureLabel,
                      { color: featureColor },
                      !f.included && { fontWeight: '500' },
                      f.highlight && { fontWeight: '800' },
                    ]}
                  >
                    {f.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    position: 'relative',
    marginVertical: 6,
  },
  selectRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: Radii.xl + 2,
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowColor: '#FFFFFF',
  },
  card: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
    minHeight: 200,
    shadowColor: '#1C1814',
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  content: { padding: 18, gap: 4 },

  eyebrowWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  eyebrowText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 1 },

  name: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.4 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.78)', fontWeight: '500', marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  price: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.7, lineHeight: 32 },
  priceStrike: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.55)',
    textDecorationLine: 'line-through',
    fontWeight: '700',
    paddingBottom: 2,
  },
  priceSub: { fontSize: 11, color: 'rgba(255,255,255,0.66)', fontWeight: '600', marginTop: 2 },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: 12,
  },

  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  featureIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { fontSize: 12.5, fontWeight: '600', flex: 1 },
});
