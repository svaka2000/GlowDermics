import React, { useEffect, useMemo } from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface ScannerOverlayProps {
  /** URI of the captured photo. */
  imageUri: string | null;
  /** Height of the photo region. Default 300. */
  height?: number;
  /** Whether to render the AI SCANNING badge in the top-right corner. */
  showBadge?: boolean;
  /** Whether to render the FaceID-style data-point markers. */
  showDataPoints?: boolean;
}

const DATA_POINT_COUNT = 9;

/**
 * ScannerOverlay — the analyzing-mode visual layer for the skin scanner.
 *
 * Reanimated 4 (worklets only — no JS bridge per frame). All animations run
 * on the UI thread. Drop-in replacement for the inline overlay that previously
 * lived in `app/scan/index.tsx` (legacy `Animated` API).
 *
 * What it renders, layered bottom→top:
 *   1. Captured photo (full bleed)
 *   2. Dark gradient bottom-fade for legibility
 *   3. Vertical scan line that sweeps up & down
 *   4. Diagonal cross-scan line (slower, perpendicular feel)
 *   5. Corner brackets (4 × static, terracotta)
 *   6. Pulsing dashed glow ring around the face
 *   7. FaceID-style data-point markers — small dots that fade in/out at fixed
 *      pseudo-random positions to evoke a clinical biometric scan
 *   8. AI SCANNING badge with pulsing dot (top-right)
 *
 * The component is self-contained and stops all animations on unmount.
 */
export function ScannerOverlay({
  imageUri,
  height = 300,
  showBadge = true,
  showDataPoints = true,
}: ScannerOverlayProps) {
  // Looping shared values — one source of truth per animation.
  const scanLineY = useSharedValue(0);    // 0..1 (vertical)
  const scanLineX = useSharedValue(0);    // 0..1 (diagonal cross)
  const glowOpacity = useSharedValue(0.3);
  const ringRotate = useSharedValue(0);   // 0..360 deg
  const ringScale = useSharedValue(0.85);
  const overlayFade = useSharedValue(0);
  const badgeDotPulse = useSharedValue(0);
  const dataPointSeed = useSharedValue(0); // drives coordinated data-point timing

  // Compute pseudo-random data-point positions (stable across renders).
  // Uses LCG seeded by index so positions differ but are deterministic.
  const dataPoints = useMemo(() => {
    const points: { x: number; y: number; delay: number }[] = [];
    let seed = 1337;
    for (let i = 0; i < DATA_POINT_COUNT; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      const x = 0.18 + (seed / 233280) * 0.64; // 18%..82% horizontal
      seed = (seed * 9301 + 49297) % 233280;
      const y = 0.20 + (seed / 233280) * 0.55; // 20%..75% vertical
      points.push({ x, y, delay: i * 220 });
    }
    return points;
  }, []);

  useEffect(() => {
    overlayFade.value = withTiming(1, { duration: 400 });

    scanLineY.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    scanLineX.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    ringRotate.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false,
    );

    ringScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.85, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    badgeDotPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    dataPointSeed.value = withRepeat(
      withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true, // reverse → fades in & out
    );

    return () => {
      cancelAnimation(scanLineY);
      cancelAnimation(scanLineX);
      cancelAnimation(glowOpacity);
      cancelAnimation(ringRotate);
      cancelAnimation(ringScale);
      cancelAnimation(overlayFade);
      cancelAnimation(badgeDotPulse);
      cancelAnimation(dataPointSeed);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Animated styles (all UI-thread).
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayFade.value }));

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value * (height - 4) }],
  }));

  const scanCrossStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scanLineX.value * 200 - 100 }, { rotate: '24deg' }],
  }));

  const glowRingStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const glowRingWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }, { rotate: `${ringRotate.value}deg` }],
  }));

  const badgeDotStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + badgeDotPulse.value * 0.6,
    transform: [{ scale: 1 + badgeDotPulse.value * 0.4 }],
  }));

  return (
    <Animated.View style={[styles.wrap, { height }, overlayStyle]}>
      {/* Photo */}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={[styles.photo, { height }]} />
      ) : (
        <View style={[styles.photo, { height, backgroundColor: '#1C1814' }]} />
      )}

      {/* Bottom dark fade for legibility of UI chrome below */}
      <LinearGradient
        colors={['transparent', 'rgba(10,8,6,0.92)']}
        style={[StyleSheet.absoluteFillObject, { top: height * 0.4 }]}
        pointerEvents="none"
      />

      {/* Vertical scan line */}
      <Animated.View style={[styles.scanLine, scanLineStyle]}>
        <LinearGradient
          colors={['transparent', Colors.primary, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Diagonal cross-scan line — slower, perpendicular */}
      <Animated.View
        style={[
          styles.crossLine,
          { top: height / 2 - 1, width: height * 1.4, height: 1.5 },
          scanCrossStyle,
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(212,168,74,0.8)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Corner brackets */}
      <View style={[styles.bracket, styles.bracketTL]} />
      <View style={[styles.bracket, styles.bracketTR]} />
      <View style={[styles.bracket, styles.bracketBL]} />
      <View style={[styles.bracket, styles.bracketBR]} />

      {/* Pulsing rotating glow ring */}
      <Animated.View style={[styles.glowRingWrap, glowRingWrapStyle]}>
        <Animated.View style={[styles.glowRing, glowRingStyle]} />
      </Animated.View>

      {/* FaceID-style data-point markers */}
      {showDataPoints &&
        dataPoints.map((p, i) => (
          <DataPoint
            key={i}
            xFraction={p.x}
            yFraction={p.y}
            phaseOffset={i * 0.11}
            seed={dataPointSeed}
            height={height}
          />
        ))}

      {/* AI SCANNING badge */}
      {showBadge && (
        <View style={styles.badge}>
          <Animated.View style={[styles.badgeDot, badgeDotStyle]} />
          <Text style={styles.badgeText}>AI SCANNING</Text>
        </View>
      )}
    </Animated.View>
  );
}

/** Single data-point marker — small dot with pulsing fade synced to the parent's seed. */
function DataPoint({
  xFraction,
  yFraction,
  phaseOffset,
  seed,
  height,
}: {
  xFraction: number;
  yFraction: number;
  phaseOffset: number;
  seed: ReturnType<typeof useSharedValue<number>>;
  height: number;
}) {
  const pointStyle = useAnimatedStyle(() => {
    // Stagger the seed so each point fades in/out at a slightly different time.
    const phased = (seed.value + phaseOffset) % 1;
    const opacity = interpolate(phased, [0, 0.5, 1], [0, 1, 0]);
    const scale = interpolate(phased, [0, 0.5, 1], [0.6, 1.4, 0.6]);
    return { opacity, transform: [{ scale }] };
  });

  return (
    <Animated.View
      style={[
        styles.dataPoint,
        {
          left: `${xFraction * 100}%`,
          top: yFraction * height,
        },
        pointStyle,
      ]}
    />
  );
}

const GLOW_SIZE = 140;

const styles = StyleSheet.create({
  wrap: { position: 'relative', overflow: 'hidden' },
  photo: { width: '100%' },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  crossLine: {
    position: 'absolute',
    left: '50%',
    marginLeft: -120,
    opacity: 0.85,
  },
  bracket: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: Colors.primary,
    borderWidth: 2.5,
  },
  bracketTL: { top: 16, left: 16, borderBottomWidth: 0, borderRightWidth: 0 },
  bracketTR: { top: 16, right: 16, borderBottomWidth: 0, borderLeftWidth: 0 },
  bracketBL: { bottom: 16, left: 16, borderTopWidth: 0, borderRightWidth: 0 },
  bracketBR: { bottom: 16, right: 16, borderTopWidth: 0, borderLeftWidth: 0 },
  glowRingWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -GLOW_SIZE / 2,
    marginLeft: -GLOW_SIZE / 2,
  },
  glowRing: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  dataPoint: {
    position: 'absolute',
    width: 7,
    height: 7,
    marginLeft: -3.5,
    marginTop: -3.5,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: Colors.primary,
    shadowOpacity: 1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10,8,6,0.78)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(196,98,45,0.45)',
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  badgeText: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 1.5 },
});
