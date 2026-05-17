import { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { GlassHero, Card, Section, Skeleton, HabitMatrix, HabitDay } from '../../src/components/ui';

const HABITS_KEY = 'gd_daily_habits';
const TOTAL_HABITS = 12;

interface MatrixStats {
  totalLogged: number;
  perfectDays: number;
  averagePct: number;
  longestStreak: number;
  currentStreak: number;
}

function computeStats(logs: { date: string; checked?: string[] }[]): MatrixStats {
  if (!logs.length) return { totalLogged: 0, perfectDays: 0, averagePct: 0, longestStreak: 0, currentStreak: 0 };

  const totalLogged = logs.length;
  const perfectDays = logs.filter(l => (l.checked?.length ?? 0) >= TOTAL_HABITS).length;
  const sum = logs.reduce((acc, l) => acc + (l.checked?.length ?? 0), 0);
  const averagePct = Math.round((sum / (logs.length * TOTAL_HABITS)) * 100);

  // Streak: consecutive days backwards from today where ANY habit was logged
  const dateSet = new Set(logs.filter(l => (l.checked?.length ?? 0) > 0).map(l => l.date));
  const today = new Date();
  let currentStreak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    if (dateSet.has(d.toDateString())) currentStreak++;
    else break;
  }

  // Longest streak — scan all logged dates
  const sortedDates = Array.from(dateSet).map(d => new Date(d).getTime()).sort((a, b) => a - b);
  let longestStreak = 0;
  let run = 0;
  let prev = -1;
  for (const t of sortedDates) {
    if (prev === -1 || t - prev === 24 * 60 * 60 * 1000) {
      run++;
    } else {
      run = 1;
    }
    if (run > longestStreak) longestStreak = run;
    prev = t;
  }

  return { totalLogged, perfectDays, averagePct, longestStreak, currentStreak };
}

export default function HabitMatrixScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [logs, setLogs] = useState<{ date: string; checked?: string[] }[] | null>(null);
  const [selectedDay, setSelectedDay] = useState<HabitDay | null>(null);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    AsyncStorage.getItem(HABITS_KEY).then(raw => {
      if (!mounted) return;
      try {
        setLogs(raw ? JSON.parse(raw) : []);
      } catch {
        setLogs([]);
      }
    });
    return () => { mounted = false; };
  }, []));

  const stats = useMemo(() => logs ? computeStats(logs) : null, [logs]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Habit Matrix</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!logs ? (
            <>
              <Skeleton width="100%" height={170} radius={20} style={{ marginBottom: 24 }} />
              <Skeleton width="100%" height={220} radius={18} style={{ marginBottom: 16 }} />
            </>
          ) : (
            <>
              {/* Hero with stats */}
              <GlassHero height={180} tint={colors.primary} style={styles.heroWrap}>
                <View style={styles.heroInner}>
                  <Text style={styles.heroLabel}>HABIT TRACKING</Text>
                  <View style={styles.heroStatRow}>
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatNum}>{stats?.currentStreak ?? 0}</Text>
                      <Text style={styles.heroStatLabel}>day{stats?.currentStreak === 1 ? '' : 's'} active</Text>
                    </View>
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatNum}>{stats?.perfectDays ?? 0}</Text>
                      <Text style={styles.heroStatLabel}>perfect days</Text>
                    </View>
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatNum}>{stats?.averagePct ?? 0}%</Text>
                      <Text style={styles.heroStatLabel}>avg complete</Text>
                    </View>
                  </View>
                </View>
              </GlassHero>

              <Section title="Last 12 weeks" caption="Tap a cell for that day's detail">
                <Card style={styles.matrixCard}>
                  <HabitMatrix
                    logs={logs}
                    weeks={12}
                    onCellPress={day => setSelectedDay(day)}
                  />
                </Card>
              </Section>

              {selectedDay && (
                <Section title="Selected day">
                  <Card style={styles.dayCard}>
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayDate}>
                        {selectedDay.date
                          ? new Date(selectedDay.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            })
                          : '—'}
                      </Text>
                      <View style={[styles.dayChip, { backgroundColor: colors.primary + '14' }]}>
                        <Text style={[styles.dayChipText, { color: colors.primary }]}>
                          {selectedDay.count}/{TOTAL_HABITS}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.dayBarTrack}>
                      <View style={[
                        styles.dayBarFill,
                        { width: `${Math.round(selectedDay.pct * 100)}%`, backgroundColor: colors.primary },
                      ]} />
                    </View>
                    <Text style={styles.daySub}>
                      {selectedDay.count === TOTAL_HABITS
                        ? 'Perfect day — all habits checked.'
                        : selectedDay.count === 0
                        ? 'No habits checked.'
                        : `${selectedDay.count} of ${TOTAL_HABITS} habits checked.`}
                    </Text>
                  </Card>
                </Section>
              )}

              {/* Quick stats card */}
              <Section title="All-time stats">
                <Card style={styles.statsCard}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Days logged</Text>
                    <Text style={styles.statValue}>{stats?.totalLogged ?? 0}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Perfect days (12/12)</Text>
                    <Text style={[styles.statValue, { color: colors.scoreGood }]}>
                      {stats?.perfectDays ?? 0}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Longest streak</Text>
                    <Text style={[styles.statValue, { color: colors.gold }]}>
                      {stats?.longestStreak ?? 0} days
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Average completion</Text>
                    <Text style={styles.statValue}>{stats?.averagePct ?? 0}%</Text>
                  </View>
                </Card>
              </Section>

              <Pressable style={styles.cta} onPress={() => router.push('/habits' as any)}>
                <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
                <Text style={styles.ctaText}>Open today's habits</Text>
              </Pressable>

              <View style={{ height: 40 }} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    safe: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 8,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: c.textPrimary, letterSpacing: -0.2 },
    content: { paddingHorizontal: 20, paddingBottom: 30 },

    heroWrap: { marginHorizontal: -20, marginBottom: 18 },
    heroInner: { padding: 22 },
    heroLabel: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '900', letterSpacing: 1.6 },
    heroStatRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
    heroStat: { flex: 1, alignItems: 'flex-start' },
    heroStatNum: {
      fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1.4,
      textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
    },
    heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '700', marginTop: 2 },

    matrixCard: { padding: 16 },

    dayCard: { padding: 16 },
    dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    dayDate: { fontSize: 13, fontWeight: '800', color: c.textPrimary, letterSpacing: -0.2 },
    dayChip: {
      borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4,
    },
    dayChipText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
    dayBarTrack: {
      height: 6, borderRadius: 3, backgroundColor: c.bgElevated, overflow: 'hidden', marginBottom: 8,
    },
    dayBarFill: { height: 6, borderRadius: 3 },
    daySub: { fontSize: 11, color: c.textMuted },

    statsCard: { padding: 16 },
    statRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 8,
    },
    statLabel: { fontSize: 12, color: c.textSecondary, fontWeight: '600' },
    statValue: { fontSize: 13, fontWeight: '900', color: c.textPrimary },

    cta: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: c.primary,
      borderRadius: 14,
      paddingVertical: 14,
      marginTop: 16,
    },
    ctaText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  });
}
