/**
 * StreakSaver — at-risk streak banner with haptic + pulse animation.
 *
 * Renders only when the user has an active streak AND today is not logged AND
 * it's after noon. Shows a flame-pulse + day count + CTA pointing to /checkin.
 * Quiet otherwise.
 *
 * Strategy: avoid notification fatigue by ONLY appearing when there's something
 * actually at risk. Once the user logs today (any source), the banner disappears
 * automatically on the next focus.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withRepeat, withSequence,
  Easing as REasing,
  cancelAnimation,
} from 'react-native-reanimated';
import { runStreakAnalysis } from '../../engine/StreakEngine';
import { useColors } from '../../state/theme';
import type { Palette } from '../../constants/colors';

export function StreakSaver() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [streak, setStreak] = useState<number | null>(null);
  const [shouldShow, setShouldShow] = useState(false);

  const flamePulse = useSharedValue(1);
  useEffect(() => {
    flamePulse.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 700, easing: REasing.inOut(REasing.sin) }),
        withTiming(1.0, { duration: 700, easing: REasing.inOut(REasing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(flamePulse);
  }, []);
  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flamePulse.value }],
  }));

  useFocusEffect(useCallback(() => {
    let mounted = true;
    runStreakAnalysis().then(r => {
      if (!mounted) return;
      setStreak(r.currentStreak);
      setShouldShow(r.atRisk);
    });
    return () => { mounted = false; };
  }, []));

  if (!shouldShow || !streak) return null;

  return (
    <Pressable style={styles.banner} onPress={() => router.push('/checkin' as any)}>
      <Animated.View style={[styles.iconWrap, flameStyle]}>
        <Text style={styles.flame}>🔥</Text>
      </Animated.View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Save your {streak}-day streak</Text>
        <Text style={styles.sub}>Quick check-in keeps the chain alive — under 1 minute.</Text>
      </View>
      <View style={styles.cta}>
        <Text style={styles.ctaText}>Save</Text>
        <Ionicons name="arrow-forward" size={12} color="#fff" />
      </View>
    </Pressable>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: c.scorePoor + '14',
      borderWidth: 1,
      borderColor: c.scorePoor + '40',
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginBottom: 14,
    },
    iconWrap: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.scorePoor + '18',
      alignItems: 'center', justifyContent: 'center',
    },
    flame: { fontSize: 22 },
    title: { fontSize: 14, fontWeight: '900', color: c.textPrimary, letterSpacing: -0.2 },
    sub: { fontSize: 11, color: c.textMuted, marginTop: 2, lineHeight: 15 },
    cta: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: c.scorePoor,
      borderRadius: 100,
      paddingHorizontal: 12, paddingVertical: 6,
    },
    ctaText: { fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  });
}
