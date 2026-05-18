/**
 * DailyAffirmation — rotating wellness quote tied to the user's persona.
 *
 * Picks one of 30 curated affirmations deterministically based on:
 *  - day of year (consistent within a day)
 *  - user's persona (so different personas see different sets)
 *
 * Visual: gentle gradient card with sparkle accents and a fade-in reveal.
 * Tap rotates to a different one (manually surface variety).
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withRepeat, withSequence, withDelay,
  Easing as REasing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { runSkinIdentity, SkinPersona } from '../../engine/SkinIdentityEngine';
import { useColors } from '../../state/theme';
import type { Palette } from '../../constants/colors';

interface Affirmation {
  text: string;
  author?: string;
  /** Themes this affirmation resonates with — used for persona matching. */
  themes: ('consistency' | 'recovery' | 'discovery' | 'science' | 'rhythm' | 'hope' | 'patience' | 'mastery')[];
}

const AFFIRMATIONS: Affirmation[] = [
  { text: 'Your skin renews every 28 days. The version of you in a month is being made today.', themes: ['hope', 'patience'] },
  { text: 'Consistency over intensity. A simple routine done daily beats a perfect routine done sometimes.', themes: ['consistency', 'rhythm'] },
  { text: 'The barrier comes first. Everything else builds on a healthy foundation.', themes: ['science', 'recovery'] },
  { text: 'Your skin tells the story of how you treat yourself. Listen to what it\'s saying.', themes: ['rhythm', 'discovery'] },
  { text: 'Progress is not linear. A bad week is data, not failure.', themes: ['patience', 'recovery'] },
  { text: 'SPF is the most powerful anti-aging tool ever discovered. Apply it like you mean it.', themes: ['science', 'mastery'] },
  { text: 'Hydration is the cheapest skincare in the world. Drink the water. Apply the moisturizer. Repeat.', themes: ['rhythm', 'consistency'] },
  { text: 'Your skin in 5 years is being shaped by what you do today. Show up.', themes: ['patience', 'hope'] },
  { text: 'Less is more. A 3-step routine you do every day beats a 12-step routine you don\'t.', themes: ['consistency', 'mastery'] },
  { text: 'Sleep is when your skin rebuilds. The dose makes the medicine.', themes: ['science', 'recovery'] },
  { text: 'You are not your worst skin day. You are your average over time.', themes: ['patience', 'hope'] },
  { text: 'The best moisturizer is the one you actually use. Find it. Use it. Move on.', themes: ['mastery', 'rhythm'] },
  { text: 'Patch test everything. Your future self will thank you.', themes: ['science', 'mastery'] },
  { text: 'Glow is not a destination. It\'s a practice.', themes: ['rhythm', 'consistency'] },
  { text: 'Simple occlusive balms have been used for skin care for thousands of years. Some traditions don\'t need updating.', themes: ['science', 'discovery'] },
  { text: 'Trust the process. Real change in skin shows up in 4-6 weeks, not 4-6 days.', themes: ['patience', 'hope'] },
  { text: 'Your stress lives on your face. Take a breath, drop your shoulders, and treat yourself softly.', themes: ['recovery', 'rhythm'] },
  { text: 'Don\'t pick. Don\'t squeeze. Don\'t scrub. Sometimes the best thing you can do is leave it alone.', themes: ['mastery', 'patience'] },
  { text: 'Sunscreen is a lifestyle, not a step.', themes: ['mastery', 'consistency'] },
  { text: 'Your skin barrier is your body\'s armor. Protect it like one.', themes: ['science', 'recovery'] },
  { text: 'Beauty is consistency expressed over time. You\'re building something.', themes: ['consistency', 'hope'] },
  { text: 'A scan a week keeps the surprises away.', themes: ['rhythm', 'mastery'] },
  { text: 'Your skin is data. Listen to what it\'s telling you about your sleep, food, water, and stress.', themes: ['discovery', 'science'] },
  { text: 'The minimum effective dose. Don\'t over-do skincare. The skin knows how to repair itself.', themes: ['mastery', 'recovery'] },
  { text: 'Some days you glow. Some days you don\'t. Both days are part of the process.', themes: ['patience', 'rhythm'] },
  { text: 'Quiet excellence beats loud effort. Show up daily.', themes: ['consistency', 'mastery'] },
  { text: 'Inflammaging is the silent driver. Anti-inflammatory living is the antidote.', themes: ['science', 'rhythm'] },
  { text: 'Glycation is sugar damage to your collagen. Low-glycemic eating is anti-aging eating.', themes: ['science', 'mastery'] },
  { text: 'Your skin reflects your life. Make the life worth reflecting.', themes: ['hope', 'discovery'] },
  { text: 'You\'re here. You\'re tracking. You\'re trying. That\'s already a win.', themes: ['hope', 'discovery'] },
];

/** Map persona → preferred themes (just a soft tilt, not strict filter). */
const PERSONA_THEMES: Record<SkinPersona, Affirmation['themes']> = {
  'Steady Glow':       ['consistency', 'rhythm'],
  'The Comeback':      ['recovery', 'hope'],
  'Resilient Skin':    ['patience', 'mastery'],
  'Glow Seeker':       ['discovery', 'rhythm'],
  'Radiant Veteran':   ['mastery', 'science'],
  'Reactive Climber':  ['recovery', 'patience'],
  'Discovery Phase':   ['hope', 'discovery'],
  'Skin Architect':    ['mastery', 'science'],
};

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function pickAffirmation(persona: SkinPersona | null, dayOffset: number): Affirmation {
  const day = dayOfYear(new Date()) + dayOffset;
  if (!persona) {
    return AFFIRMATIONS[day % AFFIRMATIONS.length];
  }
  const themes = PERSONA_THEMES[persona];
  const matches = AFFIRMATIONS.filter(a => a.themes.some(t => themes.includes(t)));
  const pool = matches.length > 0 ? matches : AFFIRMATIONS;
  return pool[day % pool.length];
}

export function DailyAffirmation() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [persona, setPersona] = useState<SkinPersona | null>(null);
  const [dayOffset, setDayOffset] = useState(0);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    runSkinIdentity().then(r => {
      if (mounted) setPersona(r.persona);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []));

  const aff = useMemo(() => pickAffirmation(persona, dayOffset), [persona, dayOffset]);

  const sparkle1 = useSharedValue(0);
  const sparkle2 = useSharedValue(0);
  useEffect(() => {
    sparkle1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: REasing.inOut(REasing.sin) }),
        withTiming(0, { duration: 1100, easing: REasing.inOut(REasing.sin) }),
      ),
      -1,
      false,
    );
    sparkle2.value = withDelay(550, withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: REasing.inOut(REasing.sin) }),
        withTiming(0, { duration: 1100, easing: REasing.inOut(REasing.sin) }),
      ),
      -1,
      false,
    ));
    return () => {
      cancelAnimation(sparkle1);
      cancelAnimation(sparkle2);
    };
  }, []);

  const fade = useSharedValue(0);
  useEffect(() => {
    fade.value = 0;
    fade.value = withTiming(1, { duration: 360 });
  }, [aff]);

  const sparkle1Style = useAnimatedStyle(() => ({ opacity: 0.4 + sparkle1.value * 0.6, transform: [{ scale: 0.8 + sparkle1.value * 0.4 }] }));
  const sparkle2Style = useAnimatedStyle(() => ({ opacity: 0.4 + sparkle2.value * 0.6, transform: [{ scale: 0.8 + sparkle2.value * 0.4 }] }));
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  return (
    <Pressable
      style={styles.outer}
      onPress={() => setDayOffset(o => o + 1)}
    >
      <LinearGradient
        colors={[colors.gold + '14', colors.primary + '08']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Animated.View style={[styles.sparkleA, sparkle1Style]}>
        <Ionicons name="sparkles" size={12} color={colors.gold} />
      </Animated.View>
      <Animated.View style={[styles.sparkleB, sparkle2Style]}>
        <Ionicons name="sparkles" size={9} color={colors.gold + 'AA'} />
      </Animated.View>

      <View style={styles.row}>
        <View style={styles.eyebrow}>
          <Ionicons name="leaf" size={10} color={colors.gold} />
          <Text style={styles.eyebrowText}>WORD FOR TODAY</Text>
        </View>
        <Text style={styles.tap}>tap for next</Text>
      </View>

      <Animated.Text style={[styles.body, fadeStyle]}>
        {aff.text}
      </Animated.Text>
    </Pressable>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    outer: {
      borderWidth: 1,
      borderColor: c.gold + '30',
      borderRadius: 18,
      paddingHorizontal: 18,
      paddingVertical: 16,
      marginBottom: 14,
      overflow: 'hidden',
      backgroundColor: c.bgCard,
    },
    sparkleA: { position: 'absolute', top: 12, right: 14 },
    sparkleB: { position: 'absolute', bottom: 14, right: 32 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    eyebrow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    eyebrowText: {
      fontSize: 9,
      fontWeight: '900',
      color: c.gold,
      letterSpacing: 1.6,
    },
    tap: {
      fontSize: 9,
      color: c.textMuted,
      fontWeight: '600',
    },
    body: {
      fontSize: 14,
      color: c.textPrimary,
      lineHeight: 21,
      fontStyle: 'italic',
      fontWeight: '500',
      letterSpacing: -0.1,
    },
  });
}
