import { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Animated, Easing,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import { JournalEntry } from '../../src/types';

const WATER_KEY = 'gd_water';
const WATER_GOAL = 8;
const HABITS_KEY = 'gd_daily_habits';

type Mood = 'great' | 'good' | 'okay' | 'bad';

const MOODS: { value: Mood; emoji: string; label: string; color: string }[] = [
  { value: 'great', emoji: '😍', label: 'Great', color: Colors.scoreExcellent },
  { value: 'good', emoji: '😊', label: 'Good', color: Colors.scoreGood },
  { value: 'okay', emoji: '😐', label: 'Okay', color: Colors.scoreFair },
  { value: 'bad', emoji: '😔', label: 'Bad', color: Colors.scorePoor },
];

const QUICK_TAGS = ['Clear skin', 'Breakout', 'Dry', 'Oily', 'Glowing', 'Irritated', 'Balanced', 'Tired skin'];

const HIGH_IMPACT_HABITS = [
  'Washed face with gentle cleanser',
  'Applied moisturizer / tallow balm',
  'Wore SPF (morning)',
  'Drank 8 glasses of water',
  'Got 7-8 hours of sleep',
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function DailyCheckIn() {
  const screenAnim = useRef(new Animated.Value(0)).current;
  const [step, setStep] = useState(0);
  const [routineLog, setRoutineLog] = useState({ morning: false, evening: false });
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [checkedHabits, setCheckedHabits] = useState<Set<number>>(new Set());
  const [mood, setMood] = useState<Mood | null>(null);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const hour = new Date().getHours();
  const isMorning = hour >= 5 && hour < 12;
  const isEvening = hour >= 18;

  useFocusEffect(useCallback(() => {
    screenAnim.setValue(0);
    Animated.timing(screenAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    (async () => {
      const [rLog, journal] = await Promise.all([
        Storage.getTodayRoutineLog(),
        Storage.getJournal(),
      ]);
      setRoutineLog(rLog);

      const today = new Date().toDateString();
      const alreadyJournaled = journal.some(j => new Date(j.date).toDateString() === today);
      if (alreadyJournaled) setDone(true);

      try {
        const raw = await AsyncStorage.getItem(WATER_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          setWaterGlasses(data[today] ?? 0);
        }
      } catch {}

      try {
        const raw = await AsyncStorage.getItem(HABITS_KEY);
        if (raw) {
          const logs = JSON.parse(raw);
          const todayLog = logs.find((l: any) => l.date === today);
          if (todayLog) {
            setCheckedHabits(new Set(todayLog.checked));
          }
        }
      } catch {}
    })();
  }, []));

  const toggleHabit = (idx: number) => {
    setCheckedHabits(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const toggleTag = (t: string) => {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const adjustWater = async (delta: number) => {
    const next = Math.max(0, Math.min(12, waterGlasses + delta));
    setWaterGlasses(next);
    try {
      const today = new Date().toDateString();
      const raw = await AsyncStorage.getItem(WATER_KEY);
      const data = raw ? JSON.parse(raw) : {};
      data[today] = next;
      await AsyncStorage.setItem(WATER_KEY, JSON.stringify(data));
    } catch {}
  };

  const logRoutine = async (time: 'morning' | 'evening') => {
    await Storage.logRoutineCompletion(time);
    setRoutineLog(prev => ({ ...prev, [time]: true }));
  };

  const saveHabits = async () => {
    try {
      const today = new Date().toDateString();
      const raw = await AsyncStorage.getItem(HABITS_KEY);
      const logs = raw ? JSON.parse(raw) : [];
      const idx = logs.findIndex((l: any) => l.date === today);
      const checked = Array.from(checkedHabits);
      if (idx >= 0) logs[idx].checked = checked;
      else logs.unshift({ date: today, checked });
      await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(logs.slice(0, 90)));
    } catch {}
  };

  const finish = async () => {
    if (!mood) return;
    setLoading(true);
    try {
      await saveHabits();
      const entry: JournalEntry = {
        id: generateId(),
        date: new Date().toISOString(),
        mood,
        note: note.trim(),
        tags,
      };
      await Storage.saveJournalEntry(entry);
      setDone(true);
    } catch {}
    setLoading(false);
  };

  const totalSteps = 4;

  if (done) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </Pressable>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
        <View style={styles.doneWrap}>
          <LinearGradient colors={['rgba(74,222,128,0.15)', 'rgba(74,222,128,0.03)']} style={StyleSheet.absoluteFill} />
          <Text style={styles.doneEmoji}>✨</Text>
          <Text style={styles.doneTitle}>Daily Check-In Complete!</Text>
          <Text style={styles.doneSub}>You've logged your routine, water, habits, and mood for today. Keep the streak going!</Text>
          <View style={styles.doneBtns}>
            <Pressable style={styles.donePrimary} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.donePrimaryText}>Back to Home</Text>
            </Pressable>
            <Pressable style={styles.doneSecondary} onPress={() => router.push('/scan')}>
              <Text style={styles.doneSecondaryText}>Take a Scan →</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.root, {
      opacity: screenAnim,
      transform: [{ translateY: screenAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Daily Check-In</Text>
            <Text style={styles.headerSub}>Step {step + 1} of {totalSteps}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((step + 1) / totalSteps) * 100}%` as any }]} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Step 0: Routine */}
        {step === 0 && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepEmoji}>🌅</Text>
            <Text style={styles.stepTitle}>Routine Check</Text>
            <Text style={styles.stepSub}>Did you complete your skincare routine today?</Text>

            <View style={styles.routineCards}>
              <Pressable
                style={[styles.routineCard, routineLog.morning && styles.routineCardDone]}
                onPress={() => !routineLog.morning && logRoutine('morning')}
              >
                <Ionicons name="sunny-outline" size={24} color={routineLog.morning ? Colors.scoreExcellent : Colors.gold} />
                <Text style={[styles.routineCardLabel, routineLog.morning && { color: Colors.scoreExcellent }]}>
                  Morning Routine
                </Text>
                {routineLog.morning ? (
                  <View style={styles.doneChip}>
                    <Ionicons name="checkmark" size={12} color={Colors.scoreExcellent} />
                    <Text style={styles.doneChipText}>Done!</Text>
                  </View>
                ) : (
                  isMorning && <Text style={styles.tapToLog}>Tap to log ✓</Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.routineCard, routineLog.evening && styles.routineCardDone]}
                onPress={() => !routineLog.evening && logRoutine('evening')}
              >
                <Ionicons name="moon-outline" size={24} color={routineLog.evening ? Colors.scoreExcellent : '#6B85A8'} />
                <Text style={[styles.routineCardLabel, routineLog.evening && { color: Colors.scoreExcellent }]}>
                  Evening Routine
                </Text>
                {routineLog.evening ? (
                  <View style={styles.doneChip}>
                    <Ionicons name="checkmark" size={12} color={Colors.scoreExcellent} />
                    <Text style={styles.doneChipText}>Done!</Text>
                  </View>
                ) : (
                  isEvening && <Text style={styles.tapToLog}>Tap to log ✓</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* Step 1: Water */}
        {step === 1 && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepEmoji}>💧</Text>
            <Text style={styles.stepTitle}>Hydration Log</Text>
            <Text style={styles.stepSub}>How many glasses of water did you drink today?</Text>

            <View style={styles.waterControls}>
              <Pressable style={styles.waterBtn} onPress={() => adjustWater(-1)}>
                <Ionicons name="remove" size={22} color={Colors.textPrimary} />
              </Pressable>
              <View style={styles.waterCountWrap}>
                <Text style={styles.waterBig}>{waterGlasses}</Text>
                <Text style={styles.waterGoalText}>goal: {WATER_GOAL}</Text>
              </View>
              <Pressable style={[styles.waterBtn, styles.waterBtnAdd]} onPress={() => adjustWater(1)}>
                <Ionicons name="add" size={22} color={Colors.white} />
              </Pressable>
            </View>

            <View style={styles.dropGrid}>
              {Array.from({ length: WATER_GOAL }).map((_, i) => (
                <Pressable key={i} onPress={() => adjustWater(i + 1 - waterGlasses)} style={styles.dropBtn}>
                  <Text style={styles.dropIcon}>{i < waterGlasses ? '💧' : '○'}</Text>
                </Pressable>
              ))}
            </View>

            {waterGlasses >= WATER_GOAL && (
              <View style={styles.goalReached}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.scoreExcellent} />
                <Text style={styles.goalReachedText}>Daily goal reached! Great for your skin.</Text>
              </View>
            )}
          </View>
        )}

        {/* Step 2: Habits */}
        {step === 2 && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepEmoji}>✅</Text>
            <Text style={styles.stepTitle}>Top Habits Today</Text>
            <Text style={styles.stepSub}>Which high-impact habits did you hit today?</Text>

            <View style={styles.habitsList}>
              {HIGH_IMPACT_HABITS.map((habit, i) => (
                <Pressable
                  key={i}
                  style={[styles.habitRow, checkedHabits.has(i) && styles.habitRowChecked]}
                  onPress={() => toggleHabit(i)}
                >
                  <View style={[styles.habitCheck, checkedHabits.has(i) && styles.habitCheckDone]}>
                    {checkedHabits.has(i) && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                  </View>
                  <Text style={[styles.habitLabel, checkedHabits.has(i) && styles.habitLabelDone]}>{habit}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.habitNote}>
              {checkedHabits.size} of {HIGH_IMPACT_HABITS.length} completed — {
                checkedHabits.size === HIGH_IMPACT_HABITS.length ? 'Perfect day! 🌟' :
                checkedHabits.size >= 3 ? 'Great progress!' : 'Keep going!'
              }
            </Text>
          </View>
        )}

        {/* Step 3: Mood */}
        {step === 3 && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepEmoji}>📝</Text>
            <Text style={styles.stepTitle}>How's Your Skin?</Text>
            <Text style={styles.stepSub}>Log how your skin feels and looks today.</Text>

            <View style={styles.moodRow}>
              {MOODS.map(m => (
                <Pressable
                  key={m.value}
                  style={[styles.moodCard, mood === m.value && { borderColor: m.color, backgroundColor: m.color + '15' }]}
                  onPress={() => setMood(m.value)}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, mood === m.value && { color: m.color }]}>{m.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Tags</Text>
            <View style={styles.tagGrid}>
              {QUICK_TAGS.map(t => (
                <Pressable
                  key={t}
                  style={[styles.tagChip, tags.includes(t) && styles.tagChipActive]}
                  onPress={() => toggleTag(t)}
                >
                  <Text style={[styles.tagChipText, tags.includes(t) && styles.tagChipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Any observations about your skin today…"
              placeholderTextColor={Colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </View>
        )}

      </ScrollView>

      {/* Footer nav */}
      <View style={styles.footer}>
        {step > 0 && (
          <Pressable style={styles.prevBtn} onPress={() => setStep(s => s - 1)}>
            <Text style={styles.prevText}>← Back</Text>
          </Pressable>
        )}
        {step < totalSteps - 1 ? (
          <Pressable style={styles.nextBtn} onPress={() => setStep(s => s + 1)}>
            <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.nextGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.nextText}>Continue →</Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.nextBtn, !mood && { opacity: 0.4 }]}
            onPress={finish}
            disabled={!mood || loading}
          >
            <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.nextGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.nextText}>{loading ? 'Saving…' : 'Complete Check-In ✓'}</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  progressTrack: { height: 3, backgroundColor: Colors.bgElevated, marginHorizontal: 20 },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  scroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 },

  stepWrap: { gap: 16 },
  stepEmoji: { fontSize: 44, textAlign: 'center' },
  stepTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  stepSub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 23 },

  routineCards: { flexDirection: 'row', gap: 12 },
  routineCard: {
    flex: 1, borderRadius: 18, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgCard, padding: 20, alignItems: 'center', gap: 10,
  },
  routineCardDone: { borderColor: Colors.scoreExcellent + '40', backgroundColor: 'rgba(74,222,128,0.06)' },
  routineCardLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  doneChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  doneChipText: { fontSize: 12, color: Colors.scoreExcellent, fontWeight: '700' },
  tapToLog: { fontSize: 11, color: Colors.primary, fontWeight: '600' },

  waterControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  waterBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  waterBtnAdd: { backgroundColor: '#60A5FA', borderColor: '#60A5FA' },
  waterCountWrap: { alignItems: 'center' },
  waterBig: { fontSize: 56, fontWeight: '800', color: Colors.textPrimary },
  waterGoalText: { fontSize: 13, color: Colors.textMuted },
  dropGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  dropBtn: { padding: 4 },
  dropIcon: { fontSize: 24 },
  goalReached: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(74,222,128,0.10)', borderRadius: 12, padding: 12 },
  goalReachedText: { fontSize: 13, color: Colors.scoreExcellent, fontWeight: '600' },

  habitsList: { gap: 10 },
  habitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16,
  },
  habitRowChecked: { borderColor: Colors.scoreExcellent + '40', backgroundColor: 'rgba(74,222,128,0.06)' },
  habitCheck: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  habitCheckDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  habitLabel: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  habitLabelDone: { color: Colors.textPrimary, fontWeight: '600' },
  habitNote: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', fontStyle: 'italic' },

  moodRow: { flexDirection: 'row', gap: 10 },
  moodCard: {
    flex: 1, alignItems: 'center', gap: 8,
    backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  tagChipActive: { borderColor: Colors.primary, backgroundColor: 'rgba(196,98,45,0.15)' },
  tagChipText: { fontSize: 13, color: Colors.textSecondary },
  tagChipTextActive: { color: Colors.primary, fontWeight: '600' },
  noteInput: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: Colors.textPrimary, minHeight: 80, textAlignVertical: 'top',
  },

  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingVertical: 20, alignItems: 'center' },
  prevBtn: { paddingHorizontal: 16, paddingVertical: 14 },
  prevText: { color: Colors.textMuted, fontSize: 15 },
  nextBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  nextGrad: { paddingVertical: 18, alignItems: 'center' },
  nextText: { color: Colors.white, fontSize: 16, fontWeight: '700' },

  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  doneEmoji: { fontSize: 60 },
  doneTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  doneSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  doneBtns: { gap: 12, width: '100%' },
  donePrimary: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  donePrimaryText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  doneSecondary: { borderRadius: 16, borderWidth: 1, borderColor: Colors.borderStrong, paddingVertical: 16, alignItems: 'center' },
  doneSecondaryText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
});
