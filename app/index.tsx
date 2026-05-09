import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
import { Storage } from '../src/services/storage';
import { Auth } from '../src/services/auth';

const { width, height } = Dimensions.get('window');
const PRIMARY = '#C4622D';
const GOLD = '#D4A96A';
const DARK = '#0D0805';
const LOGO_SIZE = 108;
const RING_SIZE = LOGO_SIZE + 24;
const PARTICLE_COUNT = 7;

/**
 * Splash — first impression of the app.
 *
 * Migrated to Reanimated 4 worklets so every concurrent loop (rings, blobs,
 * shimmer, logo entrance, text slides, loading bar) runs on the UI thread —
 * no JS-bridge ferries per frame. Adds floating sparkle particles for ambient
 * polish without disrupting the existing visual identity.
 */
export default function Index() {
  // Entrance values
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const logoGlow = useSharedValue(0);
  const nameY = useSharedValue(30);
  const nameOpacity = useSharedValue(0);
  const taglineY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const brandOpacity = useSharedValue(0);

  // Loading bar
  const barProgress = useSharedValue(0); // 0..1
  const barOpacity = useSharedValue(0);

  // Three pulsing rings (independent loops at staggered offsets)
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const ring3 = useSharedValue(0);

  // Floating glow blobs
  const blob1Y = useSharedValue(0);
  const blob2Y = useSharedValue(0);

  // Logo shimmer
  const shimmerX = useSharedValue(-100);

  // Particle phase (each particle reads it with its own offset)
  const particlePhase = useSharedValue(0);

  // Compute stable particle positions via LCG seeded from constant.
  const particles = useMemo(() => {
    const out: { x: number; offset: number; baseY: number; size: number }[] = [];
    let seed = 8675309;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      const x = (seed / 233280) * (width - 24) + 12;
      seed = (seed * 9301 + 49297) % 233280;
      const baseY = (seed / 233280) * (height * 0.6) + height * 0.2;
      seed = (seed * 9301 + 49297) % 233280;
      const size = 2 + (seed / 233280) * 2.5;
      out.push({ x, offset: i / PARTICLE_COUNT, baseY, size });
    }
    return out;
  }, []);

  useEffect(() => {
    // Floating glow blobs — independent slow sine waves
    blob1Y.value = withRepeat(
      withSequence(
        withTiming(-18, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    blob2Y.value = withRepeat(
      withSequence(
        withTiming(14, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    // Logo entrance after 200ms hold
    logoScale.value = withDelay(200, withSpring(1, { damping: 9, stiffness: 100 }));
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    logoGlow.value = withDelay(200, withTiming(1, { duration: 800 }));

    // Logo shimmer (after logo lands)
    shimmerX.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(160, { duration: 900, easing: Easing.linear }),
          withDelay(2000, withTiming(-100, { duration: 0 })),
        ),
        -1,
        false,
      ),
    );

    // Text — name, tagline, brand staggered
    nameY.value = withDelay(600, withSpring(0, { damping: 11, stiffness: 110 }));
    nameOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
    taglineY.value = withDelay(900, withSpring(0, { damping: 11, stiffness: 110 }));
    taglineOpacity.value = withDelay(900, withTiming(1, { duration: 400 }));
    brandOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));

    // Pulsing rings — staggered loops (each ring goes 0→1 then resets, infinitely)
    const ringLoop = (sv: typeof ring1, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 0 }),
          ),
          -1,
          false,
        ),
      );
    };
    ringLoop(ring1, 400);
    ringLoop(ring2, 900);
    ringLoop(ring3, 1400);

    // Loading bar
    barOpacity.value = withDelay(700, withTiming(1, { duration: 300 }));
    barProgress.value = withDelay(1000, withTiming(1, { duration: 1300, easing: Easing.out(Easing.cubic) }));

    // Particle drift
    particlePhase.value = withRepeat(
      withTiming(1, { duration: 4500, easing: Easing.linear }),
      -1,
      false,
    );

    // Navigate
    const timer = setTimeout(async () => {
      const [isLoggedIn, onboarded] = await Promise.all([
        Auth.isLoggedIn(),
        Storage.isOnboarded(),
      ]);
      if (!isLoggedIn) {
        router.replace('/(auth)/login' as any);
      } else if (!onboarded) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    }, 2600);

    return () => {
      clearTimeout(timer);
      [
        logoScale, logoOpacity, logoGlow, nameY, nameOpacity, taglineY,
        taglineOpacity, brandOpacity, barProgress, barOpacity,
        ring1, ring2, ring3, blob1Y, blob2Y, shimmerX, particlePhase,
      ].forEach(sv => cancelAnimation(sv));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ------- Animated styles (all UI-thread) -------
  const blob1Style = useAnimatedStyle(() => ({ transform: [{ translateY: blob1Y.value }] }));
  const blob2Style = useAnimatedStyle(() => ({ transform: [{ translateY: blob2Y.value }] }));
  const centerGlowStyle = useAnimatedStyle(() => ({ opacity: logoGlow.value }));
  const logoWrapStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const logoRingStyle = useAnimatedStyle(() => ({ opacity: logoGlow.value }));
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }, { rotate: '20deg' }],
  }));
  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameY.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));
  const brandStyle = useAnimatedStyle(() => ({ opacity: brandOpacity.value }));
  const barWrapStyle = useAnimatedStyle(() => ({ opacity: barOpacity.value }));
  const barFillStyle = useAnimatedStyle(() => ({ width: `${barProgress.value * 100}%` }));

  return (
    <View style={styles.root}>
      {/* Rich gradient background */}
      <LinearGradient
        colors={[DARK, '#150C07', '#0D0805', '#12090A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating glow blob — top */}
      <Animated.View style={[styles.glowBlobTop, blob1Style]}>
        <LinearGradient
          colors={['rgba(196,98,45,0.45)', 'rgba(196,98,45,0)']}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Floating glow blob — bottom */}
      <Animated.View style={[styles.glowBlobBottom, blob2Style]}>
        <LinearGradient
          colors={['rgba(212,169,106,0.30)', 'rgba(212,169,106,0)']}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Radial center glow */}
      <Animated.View style={[styles.centerGlow, centerGlowStyle]}>
        <LinearGradient
          colors={['rgba(196,98,45,0.28)', 'rgba(196,98,45,0.08)', 'transparent']}
          style={{ flex: 1, borderRadius: 300 }}
        />
      </Animated.View>

      {/* Floating sparkle particles */}
      {particles.map((p, i) => (
        <Particle
          key={i}
          x={p.x}
          baseY={p.baseY}
          offset={p.offset}
          size={p.size}
          phase={particlePhase}
        />
      ))}

      <View style={styles.content}>
        {/* Logo + rings */}
        <View style={styles.logoContainer}>
          <Ring sv={ring1} color={PRIMARY} />
          <Ring sv={ring2} color={GOLD} />
          <Ring sv={ring3} color={PRIMARY} />

          <Animated.View style={[styles.logoWrap, logoWrapStyle]}>
            <LinearGradient
              colors={['#E8834A', '#C4622D', '#9E4D22']}
              style={styles.logoGrad}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
            >
              <Text style={styles.logoMark}>✦</Text>
              <Animated.View style={[styles.shimmer, shimmerStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.35)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
            </LinearGradient>
            <Animated.View style={[styles.logoRing, logoRingStyle]} />
          </Animated.View>
        </View>

        <Animated.View style={nameStyle}>
          <Text style={styles.appName}>GlowDermics</Text>
        </Animated.View>

        <Animated.View style={taglineStyle}>
          <Text style={styles.tagline}>Your skin, decoded.</Text>
        </Animated.View>

        <Animated.Text style={[styles.brand, brandStyle]}>By TallowDermics™</Animated.Text>
      </View>

      <Animated.View style={[styles.barWrap, barWrapStyle]}>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, barFillStyle]}>
            <LinearGradient
              colors={['#E8834A', '#C4622D', '#D4A96A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.barShine} />
          </Animated.View>
        </View>
        <Animated.Text style={[styles.barLabel, brandStyle]}>
          Loading your skin profile…
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

/** Single pulsing ring — opacity + scale driven by a 0..1 shared value. */
function Ring({
  sv,
  color,
}: {
  sv: ReturnType<typeof useSharedValue<number>>;
  color: string;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(sv.value, [0, 0.3, 1], [0, 0.5, 0]),
    transform: [{ scale: interpolate(sv.value, [0, 1], [1, 2.8]) }],
  }));
  return <Animated.View style={[styles.ring, { borderColor: color }, style]} />;
}

/** Floating sparkle particle — drifts upward and fades, looped. */
function Particle({
  x,
  baseY,
  offset,
  size,
  phase,
}: {
  x: number;
  baseY: number;
  offset: number;
  size: number;
  phase: ReturnType<typeof useSharedValue<number>>;
}) {
  const style = useAnimatedStyle(() => {
    const phased = (phase.value + offset) % 1;
    const dy = interpolate(phased, [0, 1], [0, -80]);
    const opacity = interpolate(phased, [0, 0.15, 0.5, 0.85, 1], [0, 0.7, 0.9, 0.5, 0]);
    return { opacity, transform: [{ translateY: dy }] };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        { left: x, top: baseY, width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  glowBlobTop: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: width * 0.9,
    height: height * 0.55,
    borderRadius: 300,
    overflow: 'hidden',
  },
  glowBlobBottom: {
    position: 'absolute',
    bottom: -80,
    right: -60,
    width: width * 0.8,
    height: height * 0.45,
    borderRadius: 300,
    overflow: 'hidden',
  },
  centerGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 500,
    height: 500,
    marginTop: -250,
    marginLeft: -250,
  },

  particle: {
    position: 'absolute',
    backgroundColor: '#FFE9C5',
    shadowColor: GOLD,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },

  logoContainer: {
    width: LOGO_SIZE + 80,
    height: LOGO_SIZE + 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
  },

  logoWrap: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGrad: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 20,
  },
  logoMark: {
    fontSize: 50,
    color: '#FFFFFF',
    textShadowColor: 'rgba(255,255,255,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
  },
  logoRing: {
    position: 'absolute',
    width: LOGO_SIZE + 20,
    height: LOGO_SIZE + 20,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(196,98,45,0.35)',
    top: -10,
    left: -10,
  },

  appName: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FAF3E0',
    letterSpacing: -1,
    textShadowColor: 'rgba(196,98,45,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 16,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(250,243,224,0.65)',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  brand: {
    fontSize: 11,
    color: 'rgba(212,169,106,0.7)',
    letterSpacing: 2,
    fontWeight: '600',
    marginTop: 4,
  },

  barWrap: {
    paddingHorizontal: 48,
    paddingBottom: 56,
    gap: 10,
  },
  barTrack: {
    height: 3,
    backgroundColor: 'rgba(250,243,224,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barShine: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 2,
  },
  barLabel: {
    fontSize: 11,
    color: 'rgba(250,243,224,0.35)',
    textAlign: 'center',
    letterSpacing: 0.3,
    fontWeight: '500',
  },
});
