import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Storage } from '../src/services/storage';
import { Colors } from '../src/constants/colors';

export default function Index() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in sequence
    Animated.sequence([
      // Logo fades + scales up
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
      // Tagline fades in
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      // Brand footnote
      Animated.timing(brandOpacity, { toValue: 0.6, duration: 300, useNativeDriver: true }),
    ]).start();

    // Navigate after splash
    const timer = setTimeout(async () => {
      const onboarded = await Storage.isOnboarded();
      router.replace(onboarded ? '/(tabs)' : '/(auth)/onboarding');
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient colors={['#0A0A0F', '#12070A', '#0A0A0F']} style={styles.root}>
      {/* Ambient glow */}
      <LinearGradient
        colors={['rgba(196,98,45,0.15)', 'transparent']}
        style={styles.glow}
      />

      <View style={styles.content}>
        {/* Logo mark */}
        <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <LinearGradient
            colors={[Colors.primaryLight, Colors.primary, Colors.primaryDark]}
            style={styles.logoGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Text style={styles.logoMark}>✦</Text>
          </LinearGradient>
          <View style={styles.logoRing} />
        </Animated.View>

        {/* App name */}
        <Animated.View style={{ opacity: logoOpacity }}>
          <Text style={styles.appName}>GlowDermics</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Your skin, decoded.
        </Animated.Text>

        {/* Brand footnote */}
        <Animated.Text style={[styles.brand, { opacity: brandOpacity }]}>
          By TallowDermics™
        </Animated.Text>
      </View>

      {/* Bottom loading bar */}
      <Animated.View style={[styles.loadingBarWrap, { opacity: taglineOpacity }]}>
        <View style={styles.loadingTrack}>
          <Animated.View style={styles.loadingFill} />
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '50%',
    borderRadius: 300,
    transform: [{ translateY: -100 }],
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  logoWrap: { position: 'relative', marginBottom: 8 },
  logoGrad: {
    width: 96, height: 96, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  logoMark: { fontSize: 44, color: Colors.white },
  logoRing: {
    position: 'absolute',
    inset: -8,
    width: 112, height: 112, borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(196,98,45,0.2)',
  },
  appName: {
    fontSize: 38, fontWeight: '900', color: Colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16, color: Colors.textSecondary,
    fontStyle: 'italic', letterSpacing: 0.3,
  },
  brand: {
    fontSize: 11, color: Colors.textMuted,
    letterSpacing: 1.5, fontWeight: '600',
    marginTop: 8,
  },
  loadingBarWrap: {
    paddingHorizontal: 60, paddingBottom: 60,
  },
  loadingTrack: {
    height: 2, backgroundColor: 'rgba(250,243,224,0.08)',
    borderRadius: 1, overflow: 'hidden',
  },
  loadingFill: {
    width: '65%', height: '100%',
    backgroundColor: Colors.primary, borderRadius: 1,
  },
});
