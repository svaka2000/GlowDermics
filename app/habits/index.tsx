import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const CATEGORY_COLORS = {
  protection: Colors.scoreGood,
  hydration: '#60A5FA',
  sleep: '#818CF8',
  diet: Colors.scoreExcellent,
  routine: Colors.primary,
};

export default function DailyHabits() {
  const [checked, setChecked] = useState<string[]>([]);
  const [weekHistory, setWeekHistory] = useState<{ date: string; score: number }[]>([]);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [today, week] = await Promise.all([getTodayLog(), getWeekHistory()]);
      setChecked(today);
      setWeekHistory(week);
    })();
  }, []));

  const toggle = async (id: string) => {
    const updated = checked.includes(id) ? checked.filter(c => c !== id) : [...checked, id];
    setChecked(updated);
    await setTodayLog(updated);
    // Refresh week history for the bar chart
    const week = await getWeekHistory();
    setWeekHistory(week);
  };

  const score = Math.round((checked.length / HABITS.length) * 100);
  const highImpact = HABITS.filter(h => h.impact === 'high');
  const mediumImpact = HABITS.filter(h => h.impact === 'medium');
  const highChecked = highImpact.filter(h => checked.includes(h.id)).length;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Daily Habits</Text>
            <Text style={styles.headerSub}>Skin health beyond products</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Today's score */}
        <View style={styles.scoreCard}>
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
              <View style={[styles.progressFill, { width: `${score}%` as any }]} />
            </View>
          </View>
        </View>

        {/* 7-day history */}
        <View style={styles.weekCard}>
          <Text style={styles.weekTitle}>This Week</Text>
          <View style={styles.weekBars}>
            {weekHistory.map((day, i) => (
              <View key={i} style={styles.weekBarWrap}>
                <View style={styles.weekBarTrack}>
                  <View style={[styles.weekBarFill, {
                    height: `${day.score}%` as any,
                    backgroundColor: day.score >= 70 ? Colors.scoreExcellent : day.score >= 40 ? Colors.scoreFair : Colors.border,
                  }]} />
                </View>
                <Text style={[styles.weekBarLabel, i === weekHistory.length - 1 && { color: Colors.primary, fontWeight: '700' }]}>{day.date}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* High impact habits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.impactBadge}>
              <Text style={styles.impactBadgeText}>HIGH IMPACT</Text>
            </View>
            <Text style={styles.sectionSub}>These 5 habits have the most effect on skin</Text>
          </View>
          {highImpact.map(habit => {
            const done = checked.includes(habit.id);
            return (
              <Pressable key={habit.id} style={[styles.habitCard, done && styles.habitCardDone]} onPress={() => toggle(habit.id)}>
                <Text style={styles.habitIcon}>{habit.icon}</Text>
                <Text style={[styles.habitLabel, done && styles.habitLabelDone]}>{habit.label}</Text>
                <View style={[styles.checkbox, done && styles.checkboxDone]}>
                  {done && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Medium impact habits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.impactBadge, { backgroundColor: 'rgba(250,243,224,0.08)' }]}>
              <Text style={[styles.impactBadgeText, { color: Colors.textMuted }]}>GOOD TO DO</Text>
            </View>
            <Text style={styles.sectionSub}>Lifestyle factors that support skin health</Text>
          </View>
          {mediumImpact.map(habit => {
            const done = checked.includes(habit.id);
            return (
              <Pressable key={habit.id} style={[styles.habitCard, done && styles.habitCardDone]} onPress={() => toggle(habit.id)}>
                <Text style={styles.habitIcon}>{habit.icon}</Text>
                <Text style={[styles.habitLabel, done && styles.habitLabelDone]}>{habit.label}</Text>
                <View style={[styles.checkbox, done && styles.checkboxDone]}>
                  {done && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Science note */}
        <View style={styles.scienceNote}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.scienceText}>Studies show lifestyle factors account for 20-40% of skin appearance variation — independent of products used.</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  scoreCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)',
    padding: 20, marginBottom: 14, gap: 16,
  },
  scoreLeft: { alignItems: 'center', gap: 2 },
  scoreDateLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: Colors.primary },
  scoreValue: { fontSize: 40, fontWeight: '800', color: Colors.textPrimary },
  scoreLabel: { fontSize: 11, color: Colors.textMuted },
  scoreRight: { flex: 1, gap: 6 },
  scoreBreakdown: { fontSize: 12, color: Colors.textSecondary },
  progressTrack: { height: 5, backgroundColor: Colors.bgElevated, borderRadius: 3, marginTop: 4 },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },

  weekCard: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 14 },
  weekTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
  weekBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 60 },
  weekBarWrap: { flex: 1, alignItems: 'center', gap: 6, height: '100%' },
  weekBarTrack: { flex: 1, width: '100%', backgroundColor: Colors.bgElevated, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  weekBarFill: { width: '100%', borderRadius: 4, minHeight: 3 },
  weekBarLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },

  section: { marginBottom: 16 },
  sectionHeader: { gap: 4, marginBottom: 10 },
  impactBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(196,98,45,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  impactBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Colors.primary },
  sectionSub: { fontSize: 12, color: Colors.textMuted },

  habitCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginBottom: 8,
  },
  habitCardDone: { opacity: 0.6, borderColor: Colors.scoreExcellent + '30', backgroundColor: Colors.scoreExcellent + '06' },
  habitIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  habitLabel: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  habitLabelDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: Colors.scoreExcellent, borderColor: Colors.scoreExcellent },

  scienceNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(250,243,224,0.04)', borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  scienceText: { fontSize: 12, color: Colors.textMuted, lineHeight: 18, flex: 1 },
});
