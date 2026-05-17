/**
 * ScanCelebration
 *
 * Full-screen post-scan reveal overlay. Plays once when a fresh scan completes
 * and the user lands on the results screen with `?celebrate=1`.
 *
 * Composition:
 *   - confetti burst (24 particles with random hue, gravity, spin)
 *   - "Scan complete" eyebrow
 *   - large animated score count-up
 *   - delta pill ("+4 vs last scan") if previous scan exists
 *   - persona reveal mini-card (when persona was unlocked or changed)
 *   - "View results" CTA
 *
 * Tap-anywhere dismisses. Auto-dismisses after 5s if untouched.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedReaction,
  withTiming, withDelay, withSpring, withRepeat, withSequence,
  runOnJS, Easing as REasing,
} from 'react-native-reanimated';
import { useColors } from '../../state/theme';
import type { Palette } from '../../constants/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  /** New scan's overall score (0-100). */
  score: number;
  /** Previous scan's score, if any (for delta pill). */
  previousScore?: number | null;
  /** Persona just earned/changed, if any. */
  persona?: string | null;
  /** Persona color tint for the persona-reveal card. */
  personaTint?: string;
  /** Called when user taps the CTA or background. */
  onDismiss: () => void;
}

const PARTICLE_COUNT = 24;

const PARTICLE_HUES = [
  '#C4622D', '#E89A4D', '#D4A96A', '#1F8A6F', '#5DC4A4',
  '#3B5673', '#9B5BA8', '#C683CE', '#F08161', '#F5E6CB',
];

interface Particle {
  hue: string;
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  size: number;
  rotateEnd: number;
  delay: number;
}

function buildParticles(): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (Math.PI * (i / (PARTICLE_COUNT - 1))) - Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    const distance = 200 + Math.random() * 240;
    out.push({
      hue: PARTICLE_HUES[i % PARTICLE_HUES.length],
      startX: 0,
      endX: Math.cos(angle) * distance + (Math.random() - 0.5) * 100,
      startY: 0,
      endY: Math.sin(angle) * distance + 80 + Math.random() * 200, // gravity pulls down
      size: 5 + Math.random() * 7,
      rotateEnd: (Math.random() - 0.5) * 720,
      delay: Math.random() * 250,
    });
  }
  return out;
}

export function ScanCelebration({
  score, previousScore, persona, personaTint, onDismiss,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const particles = useMemo(buildParticles, []);

  const overlayOpacity = useSharedValue(0);
  const scoreScale = useSharedValue(0.6);
  const scoreOp = useSharedValue(0);
  const counterValue = useSharedValue(0);
  const eyebrowOp = useSharedValue(0);
  const eyebrowTy = useSharedValue(20);
  const ctaOp = useSharedValue(0);
  const ctaTy = useSharedValue(16);
  const personaOp = useSharedValue(0);
  const personaTy = useSharedValue(20);
  const [shown, setShown] = useState(0);
  // RN-web replays the in-flight click/pointerup from whatever press
  // triggered navigation onto this freshly-mounted full-screen Pressable
  // (classic web click-through), instantly dismissing the celebration so
  // the user never sees it. Ignore any dismiss press until the entrance
  // animation has played; real taps after that still dismiss.
  const mountedAt = useRef(Date.now());
  const tryDismiss = () => {
    if (Date.now() - mountedAt.current >= 800) onDismiss();
  };

  useEffect(() => {
    overlayOpacity.value = withTiming(1, { duration: 220 });
    eyebrowOp.value = withDelay(120, withTiming(1, { duration: 320 }));
    eyebrowTy.value = withDelay(120, withSpring(0, { damping: 14 }));
    scoreOp.value = withDelay(280, withTiming(1, { duration: 400 }));
    scoreScale.value = withDelay(280, withSpring(1, { damping: 10, stiffness: 120 }));
    counterValue.value = withDelay(280, withTiming(score, { duration: 1300, easing: REasing.out(REasing.cubic) }));
    personaOp.value = withDelay(1200, withTiming(1, { duration: 360 }));
    personaTy.value = withDelay(1200, withSpring(0, { damping: 14 }));
    ctaOp.value = withDelay(1700, withTiming(1, { duration: 320 }));
    ctaTy.value = withDelay(1700, withSpring(0, { damping: 14 }));

    const timer = setTimeout(() => onDismiss(), 6000);
    return () => clearTimeout(timer);
  }, [score]);

  useAnimatedReaction(
    () => Math.round(counterValue.value),
    (v) => runOnJS(setShown)(v),
    [score],
  );

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const scoreStyle = useAnimatedStyle(() => ({
    opacity: scoreOp.value,
    transform: [{ scale: scoreScale.value }],
  }));
  const eyebrowStyle = useAnimatedStyle(() => ({
    opacity: eyebrowOp.value,
    transform: [{ translateY: eyebrowTy.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOp.value,
    transform: [{ translateY: ctaTy.value }],
  }));
  const personaStyle = useAnimatedStyle(() => ({
    opacity: personaOp.value,
    transform: [{ translateY: personaTy.value }],
  }));

  const delta = previousScore != null ? score - previousScore : null;
  const positiveDelta = delta != null && delta > 0;
  const negativeDelta = delta != null && delta < 0;

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, styles.root, overlayStyle]} pointerEvents="auto">
      <LinearGradient
        colors={['rgba(8,12,20,0.92)', 'rgba(8,12,20,0.96)']}
        style={StyleSheet.absoluteFillObject}
      />

      <Pressable style={StyleSheet.absoluteFillObject} onPress={tryDismiss} />

      {/* Confetti — origin is centered just above the score */}
      <View style={styles.confettiOrigin}>
        {particles.map((p, i) => <ConfettiPiece key={i} p={p} />)}
      </View>

      <Animated.Text style={[styles.eyebrow, eyebrowStyle]}>
        SCAN COMPLETE
      </Animated.Text>

      <Animated.View style={[styles.scoreWrap, scoreStyle]}>
        <Text style={styles.scoreText}>{shown}</Text>
        <Text style={styles.scoreOf}>/ 100</Text>
      </Animated.View>

      {delta != null && (
        <View style={[
          styles.deltaPill,
          positiveDelta && { backgroundColor: 'rgba(31,138,111,0.22)', borderColor: 'rgba(31,138,111,0.4)' },
          negativeDelta && { backgroundColor: 'rgba(212,90,61,0.22)', borderColor: 'rgba(212,90,61,0.4)' },
        ]}>
          <Ionicons
            name={positiveDelta ? 'trending-up' : negativeDelta ? 'trending-down' : 'remove-outline'}
            size={12}
            color={positiveDelta ? '#7BD9B7' : negativeDelta ? '#F0A097' : '#E0E0EA'}
          />
          <Text style={[
            styles.deltaText,
            { color: positiveDelta ? '#7BD9B7' : negativeDelta ? '#F0A097' : '#E0E0EA' },
          ]}>
            {delta > 0 ? '+' : ''}{delta} vs last scan
          </Text>
        </View>
      )}

      {persona && personaTint && (
        <Animated.View style={[styles.personaCard, personaStyle]}>
          <View style={[styles.personaSwatch, { backgroundColor: personaTint }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.personaLabel}>YOUR PERSONA</Text>
            <Text style={styles.personaName}>{persona}</Text>
          </View>
          <Ionicons name="finger-print" size={20} color="#fff" />
        </Animated.View>
      )}

      <Animated.View style={[styles.ctaWrap, ctaStyle]}>
        <Pressable style={styles.ctaBtn} onPress={onDismiss}>
          <Text style={styles.ctaText}>View detailed results</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </Pressable>
        <Text style={styles.dismissHint}>Tap anywhere to dismiss</Text>
      </Animated.View>
    </Animated.View>
  );
}

function ConfettiPiece({ p }: { p: Particle }) {
  const tx = useSharedValue(p.startX);
  const ty = useSharedValue(p.startY);
  const rotate = useSharedValue(0);
  const op = useSharedValue(0);

  useEffect(() => {
    op.value = withDelay(p.delay, withSequence(
      withTiming(1, { duration: 120 }),
      withTiming(1, { duration: 1300 }),
      withTiming(0, { duration: 350 }),
    ));
    tx.value = withDelay(p.delay, withTiming(p.endX, { duration: 1500, easing: REasing.out(REasing.cubic) }));
    ty.value = withDelay(p.delay, withTiming(p.endY, { duration: 1500, easing: REasing.out(REasing.quad) }));
    rotate.value = withDelay(p.delay, withTiming(p.rotateEnd, { duration: 1500, easing: REasing.out(REasing.cubic) }));
  }, []);

  const s = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotateZ: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: p.size,
          height: p.size * 1.6,
          backgroundColor: p.hue,
          borderRadius: 2,
        },
        s,
      ]}
      pointerEvents="none"
    />
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      zIndex: 1000,
    },
    confettiOrigin: {
      position: 'absolute',
      top: SCREEN_H * 0.32,
      left: SCREEN_W / 2,
      width: 0,
      height: 0,
      pointerEvents: 'none',
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: '900',
      color: '#D4A96A',
      letterSpacing: 3,
      marginBottom: 14,
    },
    scoreWrap: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
      marginBottom: 12,
    },
    scoreText: {
      fontSize: 132,
      fontWeight: '900',
      color: '#fff',
      letterSpacing: -5,
      textShadowColor: 'rgba(255,255,255,0.18)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 24,
    },
    scoreOf: {
      fontSize: 22,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.6)',
      letterSpacing: -0.4,
    },
    deltaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
      borderRadius: 100,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginBottom: 24,
    },
    deltaText: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    personaCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 14,
      marginBottom: 32,
      width: SCREEN_W - 56,
    },
    personaSwatch: { width: 32, height: 32, borderRadius: 16 },
    personaLabel: {
      fontSize: 9,
      fontWeight: '900',
      color: 'rgba(255,255,255,0.65)',
      letterSpacing: 1.4,
    },
    personaName: {
      fontSize: 16,
      fontWeight: '800',
      color: '#fff',
      marginTop: 2,
      letterSpacing: -0.2,
    },
    ctaWrap: {
      alignItems: 'center',
      gap: 12,
    },
    ctaBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.primary,
      borderRadius: 14,
      paddingHorizontal: 22,
      paddingVertical: 14,
      shadowColor: c.primary,
      shadowOpacity: 0.5,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 12,
      elevation: 6,
    },
    ctaText: { fontSize: 14, fontWeight: '800', color: '#fff' },
    dismissHint: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.5)',
      fontWeight: '500',
    },
  });
}
