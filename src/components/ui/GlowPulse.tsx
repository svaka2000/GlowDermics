/**
 * GlowPulse
 *
 * Animated daily-glow orb — composite "how is your skin RIGHT NOW" indicator
 * that combines today's habit signals with the latest scan score.
 *
 * Today's glow = 0.5 * scan_score + 0.2 * habit_pct + 0.15 * sleep_norm + 0.15 * water_pct
 *   - scan_score: latest scan's overall (0-100), defaults to 70
 *   - habit_pct: today's habit completion percentage
 *   - sleep_norm: last night's sleep hours normalized vs 8 hr target
 *   - water_pct: today's water glasses / 8
 *
 * Visual:
 *   - radial gradient orb with score-tinted color (red < 50 < gold < 75 < green)
 *   - pulse cadence scales with score (more vibrant = faster pulse)
 *   - center: large numerical value + "% GLOW" eyebrow
 *   - tap → routes to /seven-day for forecast context
 *
 * Reanimated 4 worklets only.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedReaction,
  withTiming, withRepeat, withSequence,
  runOnJS, Easing as REasing,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Storage } from '../../services/storage';
import { useColors } from '../../state/theme';
import type { Palette } from '../../constants/colors';

const SLEEP_KEY = 'gd_sleep_log';
const WATER_KEY = 'gd_water';
const HABITS_KEY = 'gd_daily_habits';
const TOTAL_HABITS = 12;

interface GlowSignals {
  scanScore: number;
  habitPct: number;
  sleepHours: number | null;
  waterGlasses: number;
}

async function readSignals(): Promise<GlowSignals> {
  const today = new Date().toDateString();

  // Latest scan
  const scans = await Storage.getScanHistory();
  const scanScore = scans[0]?.overallScore ?? 70;

  // Today's habits
  let habitPct = 0;
  try {
    const raw = await AsyncStorage.getItem(HABITS_KEY);
    if (raw) {
      const logs = JSON.parse(raw);
      const todayLog = logs.find((l: any) => l.date === today);
      if (todayLog) habitPct = (todayLog.checked?.length ?? 0) / TOTAL_HABITS;
    }
  } catch {}

  // Last night's sleep — find an entry for "yesterday"
  let sleepHours: number | null = null;
  try {
    const raw = await AsyncStorage.getItem(SLEEP_KEY);
    if (raw) {
      const entries: { date: string; hours: number }[] = JSON.parse(raw);
      // Most recent entry within last 30 hours
      const cutoff = Date.now() - 30 * 60 * 60 * 1000;
      const recent = entries
        .filter(e => new Date(e.date).getTime() >= cutoff)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (recent) sleepHours = recent.hours;
    }
  } catch {}

  // Today's water
  let waterGlasses = 0;
  try {
    const raw = await AsyncStorage.getItem(WATER_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      waterGlasses = data[today] ?? 0;
    }
  } catch {}

  return { scanScore, habitPct, sleepHours, waterGlasses };
}

function computeGlow(s: GlowSignals): number {
  const scan = s.scanScore;
  const habit = s.habitPct * 100;
  const sleep = s.sleepHours == null ? 70 : Math.max(0, Math.min(100, (s.sleepHours / 8) * 100));
  const water = Math.max(0, Math.min(100, (s.waterGlasses / 8) * 100));
  return Math.round(0.5 * scan + 0.2 * habit + 0.15 * sleep + 0.15 * water);
}

export function GlowPulse() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [glow, setGlow] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    readSignals().then(s => {
      if (!mounted) return;
      setGlow(computeGlow(s));
    });
    return () => { mounted = false; };
  }, []);

  const tone =
    glow == null ? colors.primary :
    glow >= 75 ? colors.scoreGood :
    glow >= 60 ? colors.gold :
    glow >= 45 ? colors.primary :
    colors.scorePoor;

  // Pulse cadence — vibrant scores pulse faster
  const pulseDur = glow == null ? 1600 : Math.max(800, 2000 - glow * 12);
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: pulseDur, easing: REasing.inOut(REasing.sin) }),
        withTiming(1, { duration: pulseDur, easing: REasing.inOut(REasing.sin) }),
      ),
      -1,
      false,
    );
  }, [pulseDur]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  // Counter animation
  const counter = useSharedValue(0);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (glow == null) return;
    counter.value = 0;
    counter.value = withTiming(glow, { duration: 1100, easing: REasing.out(REasing.cubic) });
  }, [glow]);
  useAnimatedReaction(
    () => Math.round(counter.value),
    (v) => runOnJS(setShown)(v),
    [glow],
  );

  return (
    <Pressable style={styles.outer} onPress={() => router.push('/seven-day' as any)}>
      <Animated.View style={[styles.orbWrap, pulseStyle]}>
        <Svg width={108} height={108} viewBox="0 0 108 108">
          <Defs>
            <RadialGradient id="glow-orb-grad" cx="50%" cy="40%" r="55%">
              <Stop offset="0" stopColor="#fff" stopOpacity="0.95" />
              <Stop offset="0.45" stopColor={tone} stopOpacity="0.85" />
              <Stop offset="1" stopColor={tone} stopOpacity="0.0" />
            </RadialGradient>
            <RadialGradient id="glow-orb-edge" cx="50%" cy="50%" r="50%">
              <Stop offset="0.7" stopColor={tone} stopOpacity="0" />
              <Stop offset="1" stopColor={tone} stopOpacity="0.5" />
            </RadialGradient>
          </Defs>
          <Circle cx="54" cy="54" r="48" fill="url(#glow-orb-grad)" />
          <Circle cx="54" cy="54" r="48" fill="url(#glow-orb-edge)" />
        </Svg>
      </Animated.View>

      <View style={styles.copyWrap}>
        <Text style={styles.headline}>{glow != null ? shown : '—'}<Text style={styles.unit}>%</Text></Text>
        <Text style={styles.eyebrow}>TODAY'S GLOW</Text>
        <Text style={styles.subline}>
          {glow == null
            ? 'Computing…'
            : glow >= 80 ? 'Radiant — keep this rhythm.'
            : glow >= 65 ? 'Solid day — stay on it.'
            : glow >= 50 ? 'Fair — small wins compound.'
            : 'Worth checking your basics today.'}
        </Text>
      </View>
    </Pressable>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    outer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: c.bgCard,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 14,
      overflow: 'hidden',
    },
    orbWrap: {
      width: 108, height: 108,
      alignItems: 'center', justifyContent: 'center',
    },
    copyWrap: {
      flex: 1,
      gap: 4,
    },
    headline: {
      fontSize: 36,
      fontWeight: '900',
      color: c.textPrimary,
      letterSpacing: -1.4,
    },
    unit: {
      fontSize: 18,
      fontWeight: '700',
      color: c.textMuted,
      letterSpacing: 0,
    },
    eyebrow: {
      fontSize: 9,
      fontWeight: '900',
      color: c.textMuted,
      letterSpacing: 1.6,
    },
    subline: {
      fontSize: 12,
      color: c.textSecondary,
      lineHeight: 16,
      marginTop: 2,
    },
  });
}
