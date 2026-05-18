import { useCallback, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';

interface DayData {
  date: Date;
  hasRoutine: boolean;
  hasMorning: boolean;
  hasEvening: boolean;
  hasJournal: boolean;
  mood?: 'great' | 'good' | 'okay' | 'bad';
  hasScan: boolean;
  scanScore?: number;
  hasHabits: boolean;
  habitPct?: number;
  hasWater: boolean;
  waterPct?: number;
}

const MOOD_EMOJIS: Record<string, string> = {
  great: '😍', good: '😊', okay: '😐', bad: '😔',
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getScoreColor(score: number, c: Palette): string {
  if (score >= 80) return c.scoreExcellent;
  if (score >= 65) return c.scoreGood;
  if (score >= 50) return c.scoreFair;
  return c.scorePoor;
}

export default function SkinCalendar() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<Record<string, DayData>>({});
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [viewDate]));

  const loadData = async () => {
    const [routineLog, journal, scanHistory] = await Promise.all([
      Storage.getFullRoutineLog(),
      Storage.getJournal(),
      Storage.getScanHistory(),
    ]);

    const waterRaw = await AsyncStorage.getItem('gd_water').catch(() => null);
    const waterData: Record<string, number> = waterRaw ? JSON.parse(waterRaw) : {};

    const habitsRaw = await AsyncStorage.getItem('gd_daily_habits').catch(() => null);
    const habitsData: { date: string; checked: number[] }[] = habitsRaw ? JSON.parse(habitsRaw) : [];

    const data: Record<string, DayData> = {};

    // Build for entire month ± buffer
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const lastDay = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
      const dateStr = date.toDateString();
      const dateIso = date.toISOString().split('T')[0];

      const routineEntry = routineLog.find(r => r.date === dateStr);
      const journalEntry = journal.find(j => new Date(j.date).toDateString() === dateStr);
      const scanEntry = scanHistory.find(s => new Date(s.date).toDateString() === dateStr);
      const habitEntry = habitsData.find(h => h.date === dateStr);
      const waterGlasses = waterData[dateStr] ?? 0;

      data[dateStr] = {
        date,
        hasMorning: routineEntry?.morning ?? false,
        hasEvening: routineEntry?.evening ?? false,
        hasRoutine: !!(routineEntry?.morning || routineEntry?.evening),
        hasJournal: !!journalEntry,
        mood: journalEntry?.mood,
        hasScan: !!scanEntry,
        scanScore: scanEntry?.overallScore,
        hasHabits: (habitEntry?.checked?.length ?? 0) >= 3,
        habitPct: habitEntry ? Math.round((habitEntry.checked.length / 12) * 100) : undefined,
        hasWater: waterGlasses >= 6,
        waterPct: waterGlasses > 0 ? Math.round((waterGlasses / 8) * 100) : undefined,
      };
    }

    setCalendarData(data);
  };

  const prevMonth = () => {
    setSelectedDay(null);
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setSelectedDay(null);
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Build calendar grid
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const lastDay = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const cells: (DayData | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1);
      return calendarData[d.toDateString()] ?? null;
    }),
  ];
  // Pad to fill last row
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d: DayData) => d.date.toDateString() === today.toDateString();
  const isFuture = (d: DayData) => d.date > today;

  // Calculate month stats
  const monthDays = Object.values(calendarData);
  const activeDays = monthDays.filter(d => !isFuture(d) && (d.hasRoutine || d.hasJournal || d.hasScan)).length;
  const perfectDays = monthDays.filter(d => !isFuture(d) && d.hasRoutine && d.hasJournal).length;
  const scanDays = monthDays.filter(d => d.hasScan).length;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>Skin Calendar</Text>
            <Text style={styles.headerSub}>Your monthly skin journey</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Month stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{activeDays}</Text>
            <Text style={styles.statLabel}>Active days</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{perfectDays}</Text>
            <Text style={styles.statLabel}>Routine + journal</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{scanDays}</Text>
            <Text style={styles.statLabel}>Scan days</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          {/* Month nav */}
          <View style={styles.monthNav}>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous month" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.monthBtn} onPress={prevMonth}>
              <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.monthTitle}>{MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Next month" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.monthBtn} onPress={nextMonth}>
              <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Day headers */}
          <View style={styles.dayHeaders}>
            {DAY_NAMES.map(d => (
              <Text key={d} style={styles.dayHeader}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {cells.map((cell, i) => {
              if (!cell) return <View key={i} style={styles.emptyCell} />;
              const today_ = isToday(cell);
              const future = isFuture(cell);
              const selected = selectedDay?.date.toDateString() === cell.date.toDateString();
              const perfect = cell.hasRoutine && cell.hasJournal;

              return (
                <Pressable
                  key={i}
                  style={[
                    styles.dayCell,
                    today_ && styles.dayCellToday,
                    selected && styles.dayCellSelected,
                    perfect && !future && styles.dayCellPerfect,
                    future && styles.dayCellFuture,
                  ]}
                  onPress={() => setSelectedDay(selected ? null : cell)}
                >
                  <Text style={[styles.dayCellNum, today_ && styles.dayCellNumToday, future && styles.dayCellNumFuture]}>
                    {cell.date.getDate()}
                  </Text>
                  {!future && (
                    <View style={styles.dayCellDots}>
                      {cell.hasRoutine && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
                      {cell.hasJournal && <View style={[styles.dot, { backgroundColor: colors.gold }]} />}
                      {cell.hasScan && <View style={[styles.dot, { backgroundColor: colors.scoreExcellent }]} />}
                    </View>
                  )}
                  {cell.hasScan && cell.scanScore && !future && (
                    <Text style={[styles.scanScore, { color: getScoreColor(cell.scanScore, colors) }]}>
                      {cell.scanScore}
                    </Text>
                  )}
                  {cell.hasJournal && cell.mood && !cell.hasScan && !future && (
                    <Text style={styles.moodEmoji}>{MOOD_EMOJIS[cell.mood]}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendLabel}>Routine</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.gold }]} />
              <Text style={styles.legendLabel}>Journal</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.scoreExcellent }]} />
              <Text style={styles.legendLabel}>Scan</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendPerfect]} />
              <Text style={styles.legendLabel}>Perfect day</Text>
            </View>
          </View>
        </View>

        {/* Selected day detail */}
        {selectedDay && (
          <View style={styles.dayDetail}>
            <Text style={styles.dayDetailTitle}>
              {selectedDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {isToday(selectedDay) && <Text style={styles.todayLabel}> — Today</Text>}
            </Text>

            <View style={styles.dayDetailGrid}>
              <View style={[styles.dayDetailItem, { borderColor: selectedDay.hasMorning ? colors.gold + '50' : colors.border }]}>
                <Ionicons name="sunny-outline" size={18} color={selectedDay.hasMorning ? colors.gold : colors.textMuted} />
                <Text style={[styles.dayDetailItemLabel, !selectedDay.hasMorning && { color: colors.textMuted }]}>
                  {selectedDay.hasMorning ? 'Morning done' : 'No morning'}
                </Text>
              </View>
              <View style={[styles.dayDetailItem, { borderColor: selectedDay.hasEvening ? '#6B85A850' : colors.border }]}>
                <Ionicons name="moon-outline" size={18} color={selectedDay.hasEvening ? '#6B85A8' : colors.textMuted} />
                <Text style={[styles.dayDetailItemLabel, !selectedDay.hasEvening && { color: colors.textMuted }]}>
                  {selectedDay.hasEvening ? 'Evening done' : 'No evening'}
                </Text>
              </View>
              <View style={[styles.dayDetailItem, { borderColor: selectedDay.hasJournal ? colors.gold + '50' : colors.border }]}>
                <Text style={styles.dayDetailItemEmoji}>{selectedDay.mood ? MOOD_EMOJIS[selectedDay.mood] : '—'}</Text>
                <Text style={[styles.dayDetailItemLabel, !selectedDay.hasJournal && { color: colors.textMuted }]}>
                  {selectedDay.hasJournal ? selectedDay.mood + ' mood' : 'No journal'}
                </Text>
              </View>
              {selectedDay.hasScan && (
                <View style={[styles.dayDetailItem, { borderColor: getScoreColor(selectedDay.scanScore!, colors) + '50' }]}>
                  <Text style={[styles.dayDetailItemScore, { color: getScoreColor(selectedDay.scanScore!, colors) }]}>
                    {selectedDay.scanScore}
                  </Text>
                  <Text style={styles.dayDetailItemLabel}>Skin score</Text>
                </View>
              )}
              {selectedDay.habitPct !== undefined && (
                <View style={[styles.dayDetailItem, { borderColor: colors.scoreGood + '50' }]}>
                  <Text style={[styles.dayDetailItemScore, { color: colors.scoreGood }]}>{selectedDay.habitPct}%</Text>
                  <Text style={styles.dayDetailItemLabel}>Habits</Text>
                </View>
              )}
              {selectedDay.waterPct !== undefined && (
                <View style={[styles.dayDetailItem, { borderColor: '#60A5FA50' }]}>
                  <Text style={[styles.dayDetailItemScore, { color: '#60A5FA' }]}>{selectedDay.waterPct}%</Text>
                  <Text style={styles.dayDetailItemLabel}>Hydration</Text>
                </View>
              )}
            </View>

            {!isFuture(selectedDay) && !selectedDay.hasRoutine && !selectedDay.hasJournal && !selectedDay.hasScan && (
              <Text style={styles.dayDetailEmpty}>No activity recorded on this day.</Text>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.border,
    padding: 14, alignItems: 'center', gap: 4,
  },
  statNum: { fontSize: 24, fontWeight: '800', color: c.primary },
  statLabel: { fontSize: 9, color: c.textMuted, fontWeight: '600', textAlign: 'center' },

  calendarCard: {
    backgroundColor: c.bgCard, borderRadius: 18, borderWidth: 1, borderColor: c.border,
    padding: 16, marginBottom: 16,
  },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  monthBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.bgElevated, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontSize: 17, fontWeight: '800', color: c.textPrimary },

  dayHeaders: { flexDirection: 'row', marginBottom: 8 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: c.textMuted },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  emptyCell: { width: `${100 / 7}%` as any, aspectRatio: 0.9 },
  dayCell: {
    width: `${100 / 7}%` as any, aspectRatio: 0.9,
    alignItems: 'center', justifyContent: 'flex-start',
    paddingTop: 6, borderRadius: 10,
  },
  dayCellToday: { backgroundColor: 'rgba(138,120,96,0.15)', borderWidth: 1, borderColor: c.primary + '40' },
  dayCellSelected: { backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.borderStrong },
  dayCellPerfect: { backgroundColor: 'rgba(74,222,128,0.08)' },
  dayCellFuture: { opacity: 0.3 },
  dayCellNum: { fontSize: 13, fontWeight: '600', color: c.textPrimary },
  dayCellNumToday: { color: c.primary, fontWeight: '800' },
  dayCellNumFuture: { color: c.textMuted },
  dayCellDots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  scanScore: { fontSize: 8, fontWeight: '800', marginTop: 1 },
  moodEmoji: { fontSize: 10, marginTop: 1 },

  legend: { flexDirection: 'row', gap: 14, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendLabel: { fontSize: 10, color: c.textMuted },
  legendPerfect: { width: 14, height: 10, borderRadius: 2, backgroundColor: 'rgba(74,222,128,0.3)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.4)' },

  dayDetail: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border,
    padding: 16, gap: 14, marginBottom: 16,
  },
  dayDetailTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary },
  todayLabel: { color: c.primary },
  dayDetailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayDetailItem: {
    width: '47%', backgroundColor: c.bgElevated, borderRadius: 12, borderWidth: 1,
    padding: 12, alignItems: 'center', gap: 6,
  },
  dayDetailItemLabel: { fontSize: 11, fontWeight: '600', color: c.textSecondary, textAlign: 'center', textTransform: 'capitalize' },
  dayDetailItemEmoji: { fontSize: 22 },
  dayDetailItemScore: { fontSize: 22, fontWeight: '800' },
  dayDetailEmpty: { fontSize: 13, color: c.textMuted, textAlign: 'center', fontStyle: 'italic' },
  });
}
