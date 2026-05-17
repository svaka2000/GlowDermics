import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';
import { SkinAnalysis } from '../../src/types';
import { HabitCalendar } from '../../src/components/HabitCalendar';

type TimeFilter = 'morning' | 'evening';

export default function Routine() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('morning');
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [todayLog, setTodayLog] = useState({ morning: false, evening: false });
  const [routineStreak, setRoutineStreak] = useState(0);
  const [routineLog, setRoutineLog] = useState<{ date: string; morning: boolean; evening: boolean }[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);

  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const stepsAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const [a, log, streak] = await Promise.all([
          Storage.getLatestAnalysis(),
          Storage.getTodayRoutineLog(),
          Storage.getRoutineStreak(),
        ]);
        setAnalysis(a);
        setTodayLog(log);
        setRoutineStreak(streak);
        setCheckedSteps(new Set());
        const fullLog = await Storage.getFullRoutineLog();
        setRoutineLog(fullLog);
        headerAnim.setValue(0);
        stepsAnim.setValue(0);
        Animated.stagger(120, [
          Animated.timing(headerAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(stepsAnim, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
      } catch {}
    })();
  }, []));

  const toggleStep = (idx: number, totalSteps: number) => {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      const pct = totalSteps > 0 ? next.size / totalSteps : 0;
      Animated.timing(progressAnim, { toValue: pct, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
      return next;
    });
  };

  const refreshLog = async () => {
    const [log, streak, fullLog] = await Promise.all([
      Storage.getTodayRoutineLog(),
      Storage.getRoutineStreak(),
      Storage.getFullRoutineLog(),
    ]);
    setTodayLog(log);
    setRoutineStreak(streak);
    setRoutineLog(fullLog);
  };

  const handleComplete = async () => {
    await Storage.logRoutineCompletion(timeFilter);
    await refreshLog();
  };

  if (!analysis) {
    return (
      <View style={styles.root}>
        <SafeAreaView>
          <View style={styles.header}>
            <Text style={styles.headerTitle} numberOfLines={1}>Routine</Text>
          </View>
        </SafeAreaView>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>🌿</Text>
          <Text style={styles.emptyTitle}>No routine yet</Text>
          <Text style={styles.emptySub}>Your personalized step-by-step routine will appear here after your first skin scan.</Text>
          <Pressable style={styles.scanBtn} onPress={() => router.push('/scan')}>
            <Text style={styles.scanBtnText}>Get My Routine →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const steps = analysis.routine.filter(s => s.time === timeFilter || s.time === 'both');
  const completedCount = steps.filter((_, i) => checkedSteps.has(i)).length;

  return (
    <View style={styles.root}>
      <Animated.View style={{
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
      }}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle} numberOfLines={1}>My Routine</Text>
              <Text style={styles.headerSub}>Based on your latest scan</Text>
            </View>
            <View style={[styles.streakBadge, { marginBottom: 0 }]}>
              <Text style={styles.streakNum}>{routineStreak}🔥</Text>
              <Text style={styles.streakLabel}>Streak</Text>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Streak row */}
        <View style={styles.streakRow}>
          <View style={styles.streakBadge}>
            <Text style={styles.streakNum}>{routineStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
          <View style={styles.todayBadges}>
            <View style={[styles.todayChip, todayLog.morning && styles.todayChipDone]}>
              <Ionicons name="sunny-outline" size={12} color={todayLog.morning ? colors.scoreExcellent : colors.textMuted} />
              <Text style={[styles.todayChipText, todayLog.morning && { color: colors.scoreExcellent }]}>Morning</Text>
            </View>
            <View style={[styles.todayChip, todayLog.evening && styles.todayChipDone]}>
              <Ionicons name="moon-outline" size={12} color={todayLog.evening ? colors.scoreExcellent : colors.textMuted} />
              <Text style={[styles.todayChipText, todayLog.evening && { color: colors.scoreExcellent }]}>Evening</Text>
            </View>
          </View>
        </View>

        {/* Habit calendar toggle */}
        <Pressable style={styles.calendarToggle} onPress={() => setShowCalendar(v => !v)}>
          <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
          <Text style={styles.calendarToggleText}>Habit Calendar</Text>
          <Ionicons name={showCalendar ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
        </Pressable>
        {showCalendar && (
          <View style={{ marginBottom: 16 }}>
            <HabitCalendar log={routineLog} />
          </View>
        )}

        {/* Time toggle */}
        <View style={styles.toggleWrap}>
          {(['morning', 'evening'] as const).map(t => (
            <Pressable
              key={t}
              style={[styles.toggleBtn, timeFilter === t && styles.toggleBtnActive]}
              onPress={() => { setTimeFilter(t); setCheckedSteps(new Set()); }}
            >
              <Ionicons
                name={t === 'morning' ? 'sunny-outline' : 'moon-outline'}
                size={15} color={timeFilter === t ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.toggleLabel, timeFilter === t && styles.toggleLabelActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Progress indicator */}
        {steps.length > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                {completedCount} of {steps.length} steps done
              </Text>
              {completedCount === steps.length && todayLog[timeFilter] && (
                <Text style={styles.progressComplete}>✓ Logged!</Text>
              )}
              {completedCount === steps.length && !todayLog[timeFilter] && (
                <Pressable onPress={handleComplete}>
                  <Text style={styles.logBtn}>Log Complete ✓</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) as any }]} />
            </View>
          </View>
        )}

        {/* Steps */}
        {steps.length > 0 ? (
          <Animated.View style={[styles.stepsWrap, {
            opacity: stepsAnim,
            transform: [{ translateY: stepsAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
          }]}>
            {steps.map((step, i) => {
              const checked = checkedSteps.has(i);
              return (
                <Pressable key={i} style={[styles.stepCard, checked && styles.stepCardChecked]} onPress={() => toggleStep(i, steps.length)}>
                  <View style={[styles.stepCheck, checked && styles.stepCheckDone]}>
                    {checked && <Ionicons name="checkmark" size={14} color={colors.white} />}
                  </View>
                  <View style={styles.stepContent}>
                    <View style={styles.stepTop}>
                      <Text style={styles.stepNum}>Step {i + 1}</Text>
                      {step.duration && (
                        <Text style={styles.stepDuration}>⏱ {step.duration}</Text>
                      )}
                    </View>
                    <Text style={[styles.stepName, checked && styles.stepNameChecked]}>{step.step}</Text>
                    <Text style={styles.stepProduct}>{step.product}</Text>
                    <Text style={styles.stepWhy}>{step.why}</Text>
                  </View>
                </Pressable>
              );
            })}
          </Animated.View>
        ) : (
          <View style={styles.noSteps}>
            <Text style={styles.noStepsText}>No {timeFilter} steps in your routine.</Text>
          </View>
        )}

        {/* TallowDermics tip */}
        <View style={styles.tipCard}>
          <LinearGradient colors={['rgba(196,98,45,0.12)', 'rgba(196,98,45,0.04)']} style={styles.tipGrad}>
            <Text style={styles.tipEyebrow}>TALLOWDERMICS TIP</Text>
            <Text style={styles.tipText}>
              Apply TallowDermics Tallow Cream as your moisturizing step — morning and evening. Its oleic acid profile absorbs deeply without clogging pores.
            </Text>
          </LinearGradient>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  calendarToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, marginBottom: 4 },
  calendarToggleText: { flex: 1, fontSize: 13, color: c.textMuted, fontWeight: '600' },
  streakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  streakBadge: { alignItems: 'center', backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.border, paddingHorizontal: 18, paddingVertical: 10 },
  streakNum: { fontSize: 22, fontWeight: '800', color: c.primary },
  streakLabel: { fontSize: 10, color: c.textMuted, fontWeight: '600', marginTop: 2 },
  todayBadges: { flexDirection: 'row', gap: 8 },
  todayChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.bgCard, borderRadius: 20, borderWidth: 1, borderColor: c.border, paddingHorizontal: 12, paddingVertical: 8 },
  todayChipDone: { borderColor: c.scoreExcellent + '40', backgroundColor: c.scoreExcellent + '10' },
  todayChipText: { fontSize: 12, color: c.textMuted, fontWeight: '600' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: c.textPrimary },
  headerSub: { fontSize: 13, color: c.textMuted, marginTop: 4 },
  scroll: { paddingHorizontal: 16 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: c.textPrimary, marginBottom: 10 },
  emptySub: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  scanBtn: { backgroundColor: c.primary, borderRadius: 16, paddingHorizontal: 28, paddingVertical: 16 },
  scanBtnText: { fontSize: 15, fontWeight: '700', color: c.white },
  toggleWrap: {
    flexDirection: 'row', backgroundColor: c.bgCard,
    borderRadius: 14, padding: 4, marginBottom: 16,
    borderWidth: 1, borderColor: c.border,
  },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  toggleBtnActive: { backgroundColor: c.bgElevated },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: c.textMuted },
  toggleLabelActive: { color: c.primary },
  progressCard: { backgroundColor: c.bgCard, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: c.border },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressText: { fontSize: 13, color: c.textSecondary, fontWeight: '500' },
  progressComplete: { fontSize: 13, color: c.scoreExcellent, fontWeight: '700' },
  logBtn: { fontSize: 13, color: c.primary, fontWeight: '700' },
  progressTrack: { height: 5, backgroundColor: 'rgba(250,243,224,0.08)', borderRadius: 3 },
  progressFill: { height: '100%', backgroundColor: c.primary, borderRadius: 3 },
  stepsWrap: { gap: 10 },
  stepCard: {
    flexDirection: 'row', gap: 14, alignItems: 'flex-start',
    backgroundColor: c.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: c.border, padding: 16,
  },
  stepCardChecked: { opacity: 0.55, borderColor: c.scoreExcellent + '40' },
  stepCheck: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  stepCheckDone: { backgroundColor: c.primary, borderColor: c.primary },
  stepContent: { flex: 1 },
  stepTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  stepNum: { fontSize: 10, fontWeight: '700', color: c.primary, letterSpacing: 0.5 },
  stepDuration: { fontSize: 10, color: c.textMuted },
  stepName: { fontSize: 16, fontWeight: '700', color: c.textPrimary, marginBottom: 3 },
  stepNameChecked: { textDecorationLine: 'line-through', color: c.textMuted },
  stepProduct: { fontSize: 13, color: c.gold, fontWeight: '500', marginBottom: 6 },
  stepWhy: { fontSize: 13, color: c.textSecondary, lineHeight: 19 },
  noSteps: { padding: 40, alignItems: 'center' },
  noStepsText: { color: c.textMuted, fontSize: 14 },
  tipCard: { borderRadius: 16, overflow: 'hidden', marginTop: 16 },
  tipGrad: { padding: 20, gap: 8 },
  tipEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: c.primary },
  tipText: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  });
}
