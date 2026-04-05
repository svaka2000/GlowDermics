import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import { SkinAnalysis } from '../../src/types';

type TimeFilter = 'morning' | 'evening';

export default function Routine() {
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('morning');
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [todayLog, setTodayLog] = useState({ morning: false, evening: false });
  const [routineStreak, setRoutineStreak] = useState(0);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [a, log, streak] = await Promise.all([
        Storage.getLatestAnalysis(),
        Storage.getTodayRoutineLog(),
        Storage.getRoutineStreak(),
      ]);
      setAnalysis(a);
      setTodayLog(log);
      setRoutineStreak(streak);
      setCheckedSteps(new Set());
    })();
  }, []));

  const toggleStep = (idx: number) => {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const refreshLog = async () => {
    const [log, streak] = await Promise.all([
      Storage.getTodayRoutineLog(),
      Storage.getRoutineStreak(),
    ]);
    setTodayLog(log);
    setRoutineStreak(streak);
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
            <Text style={styles.headerTitle}>Routine</Text>
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
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Routine</Text>
          <Text style={styles.headerSub}>Based on your latest scan</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Streak row */}
        <View style={styles.streakRow}>
          <View style={styles.streakBadge}>
            <Text style={styles.streakNum}>{routineStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
          <View style={styles.todayBadges}>
            <View style={[styles.todayChip, todayLog.morning && styles.todayChipDone]}>
              <Ionicons name="sunny-outline" size={12} color={todayLog.morning ? Colors.scoreExcellent : Colors.textMuted} />
              <Text style={[styles.todayChipText, todayLog.morning && { color: Colors.scoreExcellent }]}>Morning</Text>
            </View>
            <View style={[styles.todayChip, todayLog.evening && styles.todayChipDone]}>
              <Ionicons name="moon-outline" size={12} color={todayLog.evening ? Colors.scoreExcellent : Colors.textMuted} />
              <Text style={[styles.todayChipText, todayLog.evening && { color: Colors.scoreExcellent }]}>Evening</Text>
            </View>
          </View>
        </View>

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
                size={15} color={timeFilter === t ? Colors.primary : Colors.textMuted}
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
              <View style={[styles.progressFill, { width: `${(completedCount / steps.length) * 100}%` as any }]} />
            </View>
          </View>
        )}

        {/* Steps */}
        {steps.length > 0 ? (
          <View style={styles.stepsWrap}>
            {steps.map((step, i) => {
              const checked = checkedSteps.has(i);
              return (
                <Pressable key={i} style={[styles.stepCard, checked && styles.stepCardChecked]} onPress={() => toggleStep(i)}>
                  <View style={[styles.stepCheck, checked && styles.stepCheckDone]}>
                    {checked && <Ionicons name="checkmark" size={14} color={Colors.white} />}
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
          </View>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  streakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  streakBadge: { alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 18, paddingVertical: 10 },
  streakNum: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  streakLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', marginTop: 2 },
  todayBadges: { flexDirection: 'row', gap: 8 },
  todayChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 8 },
  todayChipDone: { borderColor: Colors.scoreExcellent + '40', backgroundColor: Colors.scoreExcellent + '10' },
  todayChipText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  scroll: { paddingHorizontal: 16 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  scanBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingHorizontal: 28, paddingVertical: 16 },
  scanBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  toggleWrap: {
    flexDirection: 'row', backgroundColor: Colors.bgCard,
    borderRadius: 14, padding: 4, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  toggleBtnActive: { backgroundColor: Colors.bgElevated },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  toggleLabelActive: { color: Colors.primary },
  progressCard: { backgroundColor: Colors.bgCard, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  progressComplete: { fontSize: 13, color: Colors.scoreExcellent, fontWeight: '700' },
  logBtn: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  progressTrack: { height: 5, backgroundColor: 'rgba(250,243,224,0.08)', borderRadius: 3 },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  stepsWrap: { gap: 10 },
  stepCard: {
    flexDirection: 'row', gap: 14, alignItems: 'flex-start',
    backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, padding: 16,
  },
  stepCardChecked: { opacity: 0.55, borderColor: Colors.scoreExcellent + '40' },
  stepCheck: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  stepCheckDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepContent: { flex: 1 },
  stepTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  stepNum: { fontSize: 10, fontWeight: '700', color: Colors.primary, letterSpacing: 0.5 },
  stepDuration: { fontSize: 10, color: Colors.textMuted },
  stepName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  stepNameChecked: { textDecorationLine: 'line-through', color: Colors.textMuted },
  stepProduct: { fontSize: 13, color: Colors.gold, fontWeight: '500', marginBottom: 6 },
  stepWhy: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  noSteps: { padding: 40, alignItems: 'center' },
  noStepsText: { color: Colors.textMuted, fontSize: 14 },
  tipCard: { borderRadius: 16, overflow: 'hidden', marginTop: 16 },
  tipGrad: { padding: 20, gap: 8 },
  tipEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: Colors.primary },
  tipText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
