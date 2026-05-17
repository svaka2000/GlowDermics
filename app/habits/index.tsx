import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlassHero } from '../../src/components/ui';

const HABITS_KEY = 'gd_daily_habits';

type Habit = {
  id: string;
  label: string;
  icon: string;
  category: 'protection' | 'hydration' | 'sleep' | 'diet' | 'routine';
  impact: 'high' | 'medium';
};

const HABITS: Habit[] = [
  { id: 'spf', label: 'Wore SPF today', icon: '☀️', category: 'protection', impact: 'high' },
  { id: 'water', label: 'Drank 8+ glasses of water', icon: '💧', category: 'hydration', impact: 'high' },
  { id: 'sleep', label: 'Got 7-8 hours of sleep', icon: '🌙', category: 'sleep', impact: 'high' },
  { id: 'morning_routine', label: 'Completed morning routine', icon: '🌅', category: 'routine', impact: 'high' },
  { id: 'evening_routine', label: 'Completed evening routine', icon: '🌆', category: 'routine', impact: 'high' },
  { id: 'clean_pillowcase', label: 'Clean pillowcase (change every 3-4 days)', icon: '🛏', category: 'protection', impact: 'medium' },
  { id: 'vegetables', label: 'Ate leafy greens / vegetables', icon: '🥗', category: 'diet', impact: 'medium' },
  { id: 'no_touching', label: "Didn't touch face today", icon: '🙅', category: 'protection', impact: 'medium' },
  { id: 'exercise', label: 'Exercised (increases circulation)', icon: '🏃', category: 'diet', impact: 'medium' },
  { id: 'clean_phone', label: 'Cleaned phone screen', icon: '📱', category: 'protection', impact: 'medium' },
  { id: 'no_sugar', label: 'Avoided excess sugar / dairy', icon: '🍭', category: 'diet', impact: 'medium' },
  { id: 'stress', label: 'Managed stress well today', icon: '🧘', category: 'sleep', impact: 'medium' },
];

type HabitLog = { date: string; checked: string[] };

async function getTodayLog(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(HABITS_KEY);
  const logs: HabitLog[] = raw ? JSON.parse(raw) : [];
  const today = new Date().toDateString();
  return logs.find(l => l.date === today)?.checked ?? [];
}

async function setTodayLog(checked: string[]): Promise<void> {
  const raw = await AsyncStorage.getItem(HABITS_KEY);
  const logs: HabitLog[] = raw ? JSON.parse(raw) : [];
  const today = new Date().toDateString();
  const existing = logs.find(l => l.date === today);
  if (existing) {
    existing.checked = checked;
  } else {
    logs.unshift({ date: today, checked });
  }
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(logs.slice(0, 90)));
}

async function getWeekHistory(): Promise<{ date: string; score: number }[]> {
  const raw = await AsyncStorage.getItem(HABITS_KEY);
  const logs: HabitLog[] = raw ? JSON.parse(raw) : [];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const entry = logs.find(l => l.date === dateStr);
    const score = entry ? Math.round((entry.checked.length / HABITS.length) * 100) : 0;
    result.push({ date: d.toLocaleDateString('en-US', { weekday: 'short' }), score });
  }
  return result;
}

export default function DailyHabits() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [checked, setChecked] = useState<string[]>([]);
  const [weekHistory, setWeekHistory] = useState<{ date: string; score: number }[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const weekAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  // Animated progress width (0–1 fraction)
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Per-habit bounce scale map
  const habitScales = useRef<Record<string, Animated.Value>>(
    Object.fromEntries(HABITS.map(h => [h.id, new Animated.Value(1)]))
  ).current;

  // Bar chart fill animations (one per day)
  const barAnims = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;

  useFocusEffect(useCallback(() => {
    (async () => {
      const [today, week] = await Promise.all([getTodayLog(), getWeekHistory()]);
      setChecked(today);
      setWeekHistory(week);
      setLoaded(true);

      const ratio = today.length / HABITS.length;
      Animated.timing(progressAnim, {
        toValue: ratio,
        duration: 900,
        delay: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      // Stagger bar fills
      const barFills = week.map((day, i) =>
        Animated.timing(barAnims[i], {
          toValue: day.score / 100,
          duration: 600,
          delay: 500 + i * 80,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        })
      );
      Animated.parallel(barFills).start();

      // Entrance stagger
      Animated.stagger(80, [
        Animated.timing(headerAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scoreAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(weekAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(listAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    })();
  }, []));

  const toggle = async (id: string) => {
    const updated = checked.includes(id) ? checked.filter(c => c !== id) : [...checked, id];
    setChecked(updated);
    await setTodayLog(updated);

    // Bounce the habit row
    const scale = habitScales[id];
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
    ]).start();

    // Animate progress bar
    const ratio = updated.length / HABITS.length;
    Animated.timing(progressAnim, {
      toValue: ratio,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Refresh week history
    const week = await getWeekHistory();
    setWeekHistory(week);
    const barFills = week.map((day, i) =>
      Animated.timing(barAnims[i], {
        toValue: day.score / 100,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      })
    );
    Animated.parallel(barFills).start();
  };

  const score = Math.round((checked.length / HABITS.length) * 100);
  const highImpact = HABITS.filter(h => h.impact === 'high');
  const mediumImpact = HABITS.filter(h => h.impact === 'medium');
  const highChecked = highImpact.filter(h => checked.includes(h.id)).length;

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <GlassHero height={130} tint={colors.primary} style={styles.heroWrap}>
          <SafeAreaView edges={['top']}>
            <Animated.View style={[styles.heroHeader, {
              opacity: headerAnim,
              transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
            }]}>
              <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.heroBackBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
                <Ionicons name="arrow-back" size={20} color={colors.white} />
              </Pressable>
              <View>
                <Text style={styles.heroTitle}>Daily Habits</Text>
                <Text style={styles.heroSub}>Skin health beyond products</Text>
              </View>
              <View style={{ width: 36 }} />
            </Animated.View>
          </SafeAreaView>
        </GlassHero>

        {/* Today's score */}
        <Animated.View style={[styles.scoreCard, {
          opacity: scoreAnim,
          transform: [{ translateY: scoreAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }]}>
          <LinearGradient colors={['rgba(196,98,45,0.15)', 'rgba(196,98,45,0.05)']} style={StyleSheet.absoluteFill} />
          <View style={styles.scoreLeft}>
            <Text style={styles.scoreDateLabel}>TODAY</Text>
            <Text style={styles.scoreValue}>{score}%</Text>
            <Text style={styles.scoreLabel}>habit score</Text>
          </View>
          <View style={styles.scoreRight}>
            <Text style={styles.scoreBreakdown}>{highChecked}/{highImpact.length} high-impact</Text>
            <Text style={styles.scoreBreakdown}>{checked.length}/{HABITS.length} total</Text>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
          </View>
        </Animated.View>

        {/* 7-day history */}
        <Animated.View style={[styles.weekCard, {
          opacity: weekAnim,
          transform: [{ translateY: weekAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }]}>
          <Text style={styles.weekTitle}>This Week</Text>
          <View style={styles.weekBars}>
            {weekHistory.map((day, i) => (
              <View key={i} style={styles.weekBarWrap}>
                <View style={styles.weekBarTrack}>
                  <Animated.View style={[styles.weekBarFill, {
                    height: barAnims[i].interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    backgroundColor: day.score >= 70 ? colors.scoreExcellent : day.score >= 40 ? colors.scoreFair : colors.border,
                  }]} />
                </View>
                <Text style={[styles.weekBarLabel, i === weekHistory.length - 1 && { color: colors.primary, fontWeight: '700' }]}>{day.date}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* High impact habits */}
        <Animated.View style={[styles.section, {
          opacity: listAnim,
          transform: [{ translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.impactBadge}>
              <Text style={styles.impactBadgeText}>HIGH IMPACT</Text>
            </View>
            <Text style={styles.sectionSub}>These 5 habits have the most effect on skin</Text>
          </View>
          {highImpact.map(habit => {
            const done = checked.includes(habit.id);
            return (
              <Animated.View key={habit.id} style={{ transform: [{ scale: habitScales[habit.id] }] }}>
                <Pressable style={[styles.habitCard, done && styles.habitCardDone]} onPress={() => toggle(habit.id)}>
                  <Text style={styles.habitIcon}>{habit.icon}</Text>
                  <Text style={[styles.habitLabel, done && styles.habitLabelDone]}>{habit.label}</Text>
                  <View style={[styles.checkbox, done && styles.checkboxDone]}>
                    {done && <Ionicons name="checkmark" size={14} color={colors.white} />}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Medium impact habits */}
        <Animated.View style={[styles.section, {
          opacity: listAnim,
          transform: [{ translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [32, 0] }) }],
        }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.impactBadge, { backgroundColor: 'rgba(250,243,224,0.08)' }]}>
              <Text style={[styles.impactBadgeText, { color: colors.textMuted }]}>GOOD TO DO</Text>
            </View>
            <Text style={styles.sectionSub}>Lifestyle factors that support skin health</Text>
          </View>
          {mediumImpact.map(habit => {
            const done = checked.includes(habit.id);
            return (
              <Animated.View key={habit.id} style={{ transform: [{ scale: habitScales[habit.id] }] }}>
                <Pressable style={[styles.habitCard, done && styles.habitCardDone]} onPress={() => toggle(habit.id)}>
                  <Text style={styles.habitIcon}>{habit.icon}</Text>
                  <Text style={[styles.habitLabel, done && styles.habitLabelDone]}>{habit.label}</Text>
                  <View style={[styles.checkbox, done && styles.checkboxDone]}>
                    {done && <Ionicons name="checkmark" size={14} color={colors.white} />}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Science note */}
        <View style={styles.scienceNote}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
          <Text style={styles.scienceText}>Studies show lifestyle factors account for 20-40% of skin appearance variation — independent of products used.</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },

  heroWrap: { marginHorizontal: -16, marginBottom: 16 },
  heroHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
  },
  heroBackBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22, fontWeight: '900', color: c.white, textAlign: 'center', letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.78)', textAlign: 'center', marginTop: 2, fontWeight: '600' },
  scroll: { paddingHorizontal: 16 },

  scoreCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)',
    padding: 20, marginBottom: 14, gap: 16,
  },
  scoreLeft: { alignItems: 'center', gap: 2 },
  scoreDateLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: c.primary },
  scoreValue: { fontSize: 40, fontWeight: '800', color: c.textPrimary },
  scoreLabel: { fontSize: 11, color: c.textMuted },
  scoreRight: { flex: 1, gap: 6 },
  scoreBreakdown: { fontSize: 12, color: c.textSecondary },
  progressTrack: { height: 5, backgroundColor: c.bgElevated, borderRadius: 3, marginTop: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: c.primary, borderRadius: 3 },

  weekCard: { backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 14 },
  weekTitle: { fontSize: 13, fontWeight: '700', color: c.textPrimary, marginBottom: 14 },
  weekBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 60 },
  weekBarWrap: { flex: 1, alignItems: 'center', gap: 6, height: '100%' },
  weekBarTrack: { flex: 1, width: '100%', backgroundColor: c.bgElevated, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  weekBarFill: { width: '100%', borderRadius: 4, minHeight: 3 },
  weekBarLabel: { fontSize: 10, color: c.textMuted, fontWeight: '500' },

  section: { marginBottom: 16 },
  sectionHeader: { gap: 4, marginBottom: 10 },
  impactBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(196,98,45,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  impactBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: c.primary },
  sectionSub: { fontSize: 12, color: c.textMuted },

  habitCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: c.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: c.border,
    padding: 14, marginBottom: 8,
  },
  habitCardDone: { opacity: 0.6, borderColor: c.scoreExcellent + '30', backgroundColor: c.scoreExcellent + '06' },
  habitIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  habitLabel: { flex: 1, fontSize: 14, color: c.textSecondary, lineHeight: 20 },
  habitLabelDone: { textDecorationLine: 'line-through', color: c.textMuted },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: c.scoreExcellent, borderColor: c.scoreExcellent },

  scienceNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(250,243,224,0.04)', borderRadius: 12,
    borderWidth: 1, borderColor: c.border, padding: 14,
  },
  scienceText: { fontSize: 12, color: c.textMuted, lineHeight: 18, flex: 1 },
  });
}
