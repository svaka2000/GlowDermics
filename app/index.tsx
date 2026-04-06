import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Storage } from '../src/services/storage';
import { Auth } from '../src/services/auth';

const { width, height } = Dimensions.get('window');
const PRIMARY = '#C4622D';
const GOLD = '#D4A96A';
const DARK = '#0D0805';

export default function Index() {
  // Entrance animations
  const logoScale  = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoGlow   = useRef(new Animated.Value(0)).current;

  const nameY      = useRef(new Animated.Value(30)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const taglineY   = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;

  // Loading bar
  const barProgress = useRef(new Animated.Value(0)).current;
  const barOpacity  = useRef(new Animated.Value(0)).current;

  // Three pulsing rings
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  // Floating glow blobs
  const blob1Y = useRef(new Animated.Value(0)).current;
  const blob2Y = useRef(new Animated.Value(0)).current;

  // Logo shimmer position
  const shimmerX = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // Floating blobs
    Animated.loop(
      Animated.sequence([
        Animated.timing(blob1Y, { toValue: -18, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(blob1Y, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(blob2Y, { toValue: 14, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(blob2Y, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Logo entrance
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(logoGlow, { toValue: 1, duration: 800, useNativeDriver: false }),
      ]),
    ]).start();

    // Logo shimmer loop (starts after logo appears)
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerX, { toValue: 160, duration: 900, easing: Easing.linear, useNativeDriver: true }),
          Animated.delay(2000),
          Animated.timing(shimmerX, { toValue: -100, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    }, 700);

    // Text slides up
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.spring(nameY, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(nameOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(taglineY, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(brandOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Pulsing rings — staggered loops
    const pulseRing = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    };
    setTimeout(() => {
      pulseRing(ring1, 0);
      pulseRing(ring2, 500);
      pulseRing(ring3, 1000);
    }, 400);

    // Loading bar appears and fills
    Animated.sequence([
      Animated.delay(700),
      Animated.timing(barOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.timing(barProgress, { toValue: 1, duration: 1300, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();

    // Navigate — check auth first, then onboarding state
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

    return () => clearTimeout(timer);
  }, []);

  const ringStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.5, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
  });

  const barWidth = barProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.root}>
      {/* Rich gradient background */}
      <LinearGradient
        colors={[DARK, '#150C07', '#0D0805', '#12090A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {/* Floating glow blob — top */}
      <Animated.View style={[styles.glowBlobTop, { transform: [{ translateY: blob1Y }] }]}>
        <LinearGradient
          colors={['rgba(196,98,45,0.45)', 'rgba(196,98,45,0)']}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Floating glow blob — bottom */}
      <Animated.View style={[styles.glowBlobBottom, { transform: [{ translateY: blob2Y }] }]}>
        <LinearGradient
          colors={['rgba(212,169,106,0.30)', 'rgba(212,169,106,0)']}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Radial center glow */}
      <Animated.View style={[styles.centerGlow, {
        opacity: logoGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
      }]}>
        <LinearGradient
          colors={['rgba(196,98,45,0.28)', 'rgba(196,98,45,0.08)', 'transparent']}
          style={{ flex: 1, borderRadius: 300 }}
        />
      </Animated.View>

      <View style={styles.content}>
        {/* Logo + rings */}
        <View style={styles.logoContainer}>
          {/* Pulsing rings */}
          {[ring1, ring2, ring3].map((r, i) => (
            <Animated.View key={i} style={[styles.ring, ringStyle(r), { borderColor: i === 1 ? GOLD : PRIMARY }]} />
          ))}

          {/* Logo box */}
          <Animated.View style={[styles.logoWrap, {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }]}>
            <LinearGradient
              colors={['#E8834A', '#C4622D', '#9E4D22']}
              style={styles.logoGrad}
              start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
            >
              <Text style={styles.logoMark}>✦</Text>

              {/* Shimmer sweep */}
              <Animated.View
                style={[styles.shimmer, { transform: [{ translateX: shimmerX }, { rotate: '20deg' }] }]}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.35)', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
            </LinearGradient>

            {/* Outer ring glow */}
            <Animated.View style={[styles.logoRing, { opacity: logoGlow }]} />
          </Animated.View>
        </View>

        {/* App name */}
        <Animated.View style={{ opacity: nameOpacity, transform: [{ translateY: nameY }] }}>
          <Text style={styles.appName}>GlowDermics</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={{ opacity: taglineOpacity, transform: [{ translateY: taglineY }] }}>
          <Text style={styles.tagline}>Your skin, decoded.</Text>
        </Animated.View>

        {/* Brand */}
        <Animated.Text style={[styles.brand, { opacity: brandOpacity }]}>
          By TallowDermics™
        </Animated.Text>
      </View>

      {/* Loading bar */}
      <Animated.View style={[styles.barWrap, { opacity: barOpacity }]}>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: barWidth }]}>
            <LinearGradient
              colors={['#E8834A', '#C4622D', '#D4A96A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Bar shimmer */}
            <View style={styles.barShine} />
          </Animated.View>
        </View>
        <Animated.Text style={[styles.barLabel, { opacity: brandOpacity }]}>Loading your skin profile…</Animated.Text>
      </Animated.View>
    </View>
  );
}

const LOGO_SIZE = 108;
const RING_SIZE = LOGO_SIZE + 24;

const styles = StyleSheet.create({
  root: { flex: 1 },

  glowBlobTop: {
    position: 'absolute',
    top: -80, left: -60,
    width: width * 0.9, height: height * 0.55,
    borderRadius: 300,
    overflow: 'hidden',
  },
  glowBlobBottom: {
    position: 'absolute',
    bottom: -80, right: -60,
    width: width * 0.8, height: height * 0.45,
    borderRadius: 300,
    overflow: 'hidden',
  },
  centerGlow: {
    position: 'absolute',
    top: '50%', left: '50%',
    width: 500, height: 500,
    marginTop: -250, marginLeft: -250,
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
    width: RING_SIZE, height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
  },

  logoWrap: {
    width: LOGO_SIZE, height: LOGO_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGrad: {
    width: LOGO_SIZE, height: LOGO_SIZE,
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
    top: 0, bottom: 0,
    width: 60,
  },
  logoRing: {
    position: 'absolute',
    width: LOGO_SIZE + 20, height: LOGO_SIZE + 20,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(196,98,45,0.35)',
    top: -10, left: -10,
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
    top: 0, right: 0,
    width: 30, height: 3,
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
