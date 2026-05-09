import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';

interface GlassHeroProps {
  children: React.ReactNode;
  /** Tint color for the gradient backdrop. Defaults to terracotta primary. */
  tint?: string;
  /** Total height of the hero block (incl. children). Default 320. */
  height?: number;
  /** Show floating glow blobs behind content. Default true. */
  withBlobs?: boolean;
  /** Show fine grain noise texture overlay (subtle). Default false. */
  withNoise?: boolean;
  /** Bottom corner radius — creates the "drips into page" feel. Default 32. */
  bottomRadius?: number;
  /** Optional override style for the outer wrapper. */
  style?: StyleProp<ViewStyle>;
}

/**
 * GlassHero — premium top-of-screen hero block.
 *
 * Renders a full-bleed terracotta gradient backdrop with optional floating
 * glow blobs (Reanimated worklets) and rounded bottom corners that visually
 * "drip" into the page below. Children render on top — typically a header
 * row + a row of glass cards.
 *
 * Pair child glass cards with `Card variant="glass" blur` for the full
 * frosted-glass effect.
 */
export function GlassHero({
  children,
  tint = Colors.primary,
  height = 320,
  withBlobs = true,
  withNoise = false,
  bottomRadius = 32,
  style,
}: GlassHeroProps) {
  const blob1 = useSharedValue(0);
  const blob2 = useSharedValue(0);
  const blob3 = useSharedValue(0);

  useEffect(() => {
    if (!withBlobs) return;
    blob1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 5800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    blob2.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    blob3.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 7100, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 7100, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(blob1);
      cancelAnimation(blob2);
      cancelAnimation(blob3);
    };
  }, [withBlobs]); // eslint-disable-line react-hooks/exhaustive-deps

  const blob1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: -50 + blob1.value * 30 },
      { translateY: 60 + blob1.value * 20 },
    ],
  }));
  const blob2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: 200 - blob2.value * 25 },
      { translateY: 200 + blob2.value * 30 },
    ],
  }));
  const blob3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: 80 + blob3.value * 40 },
      { translateY: -30 + blob3.value * 25 },
    ],
  }));

  return (
    <View
      style={[
        styles.wrap,
        {
          height,
          borderBottomLeftRadius: bottomRadius,
          borderBottomRightRadius: bottomRadius,
        },
        style,
      ]}
    >
      {/* Base gradient — vertical: tint at top fading into bg color */}
      <LinearGradient
        colors={[tint, `${tint}AA`, `${tint}55`, Colors.bg]}
        locations={[0, 0.4, 0.75, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Diagonal accent gradient — adds richness */}
      <LinearGradient
        colors={['rgba(212,168,74,0.30)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0.7 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Floating glow blobs */}
      {withBlobs && (
        <>
          <Animated.View style={[styles.blob, styles.blob1, blob1Style]}>
            <LinearGradient
              colors={['rgba(255,233,210,0.55)', 'rgba(255,233,210,0)']}
              style={{ flex: 1, borderRadius: 200 }}
            />
          </Animated.View>
          <Animated.View style={[styles.blob, styles.blob2, blob2Style]}>
            <LinearGradient
              colors={['rgba(184,136,46,0.40)', 'rgba(184,136,46,0)']}
              style={{ flex: 1, borderRadius: 200 }}
            />
          </Animated.View>
          <Animated.View style={[styles.blob, styles.blob3, blob3Style]}>
            <LinearGradient
              colors={[`${tint}55`, `${tint}00`]}
              style={{ flex: 1, borderRadius: 200 }}
            />
          </Animated.View>
        </>
      )}

      {/* Subtle noise overlay for texture (optional) */}
      {withNoise && <View style={styles.noise} pointerEvents="none" />}

      {/* Bottom edge highlight — emphasizes the rounded drop */}
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.10)', 'transparent']}
        start={{ x: 0, y: 0.92 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { bottom: 0 }]}
        pointerEvents="none"
      />

      {/* Children float above the backdrop */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  content: { flex: 1, zIndex: 2 },
  blob: {
    position: 'absolute',
    borderRadius: 200,
  },
  blob1: { width: 220, height: 220, top: -40, left: -40 },
  blob2: { width: 180, height: 180, top: 80, right: -40 },
  blob3: { width: 160, height: 160, bottom: -30, left: '30%' },
  noise: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
});
