import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Alert, TextInput, Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const Colors = {
  bg: '#0A0A0F',
  card: '#13131A',
  cardAlt: '#1A1A24',
  border: '#2A2A3A',
  primary: '#C4622D',
  gold: '#D4A96A',
  textPrimary: '#FAF3E0',
  textSecondary: '#9A9AAF',
  textMuted: '#5A5A6E',
  green: '#4ADE80',
  red: '#F87171',
  blue: '#60A5FA',
};

const STEPS_KEY = 'gd_checklist_steps';
const LOG_KEY = 'gd_checklist_log';

const DEFAULT_AM_STEPS = [
  { id: 'am1', label: 'Rinse face with cool water', time: 'AM', icon: '💧' },
  { id: 'am2', label: 'Apply tallow balm / moisturizer', time: 'AM', icon: '🌿' },
  { id: 'am3', label: 'Apply SPF 30+', time: 'AM', icon: '☀️' },
  { id: 'am4', label: 'Drink a glass of water', time: 'AM', icon: '🥤' },
  { id: 'am5', label: 'Take supplements (if any)', time: 'AM', icon: '💊' },
];

const DEFAULT_PM_STEPS = [
  { id: 'pm1', label: 'Remove makeup / SPF (oil cleanse)', time: 'PM', icon: '🧴' },
  { id: 'pm2', label: 'Gentle cleanser', time: 'PM', icon: '🫧' },
  { id: 'pm3', label: 'Active treatment (BHA / retinol / etc)', time: 'PM', icon: '⚗️' },
  { id: 'pm4', label: 'Tallow balm / moisturizer', time: 'PM', icon: '🌿' },
  { id: 'pm5', label: 'Eye cream (if using)', time: 'PM', icon: '👁️' },
];

interface Step {
  id: string;
  label: string;
  time: 'AM' | 'PM';
  icon: string;
}

interface DayLog {
  date: string;
  amCompleted: string[];
  pmCompleted: string[];
}

const today = () => new Date().toISOString().split('T')[0];
const formatDate = (d: string) => {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export default function MorningChecklistScreen() {
  const [steps, setSteps] = useState<Step[]>([...DEFAULT_AM_STEPS, ...DEFAULT_PM_STEPS]);
  const [log, setLog] = useState<DayLog[]>([]);
  const [view, setView] = useState<'today' | 'history' | 'edit'>('today');
  const [routineTab, setRoutineTab] = useState<'AM' | 'PM'>('AM');
  const [addingStep, setAddingStep] = useState(false);
  const [newStepLabel, setNewStepLabel] = useState('');
  const [newStepTime, setNewStepTime] = useState<'AM' | 'PM'>('AM');

  useFocusEffect(useCallback(() => {
    loadData();
  }, []));

  const loadData = async () => {
    try {
      const [stepsRaw, logRaw] = await Promise.all([
        AsyncStorage.getItem(STEPS_KEY),
        AsyncStorage.getItem(LOG_KEY),
      ]);
      if (stepsRaw) setSteps(JSON.parse(stepsRaw));
      if (logRaw) setLog(JSON.parse(logRaw));
    } catch {}
  };

  const todayLog = (): DayLog => {
    const existing = log.find(l => l.date === today());
    return existing || { date: today(), amCompleted: [], pmCompleted: [] };
  };

  const toggleStep = async (stepId: string, time: 'AM' | 'PM') => {
    const tlog = todayLog();
    const key = time === 'AM' ? 'amCompleted' : 'pmCompleted';
    const already = tlog[key].includes(stepId);
    const updated: DayLog = {
      ...tlog,
      [key]: already ? tlog[key].filter((id: string) => id !== stepId) : [...tlog[key], stepId],
    };
    const newLog = log.filter(l => l.date !== today());
    newLog.unshift(updated);
    setLog(newLog);
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(newLog));
  };

  const addStep = async () => {
    if (!newStepLabel.trim()) return;
    const newStep: Step = {
      id: `custom_${Date.now()}`,
      label: newStepLabel.trim(),
      time: newStepTime,
      icon: newStepTime === 'AM' ? '🌅' : '🌙',
    };
    const updated = [...steps, newStep];
    setSteps(updated);
    await AsyncStorage.setItem(STEPS_KEY, JSON.stringify(updated));
    setNewStepLabel('');
    setAddingStep(false);
  };

  const deleteStep = async (stepId: string) => {
    Alert.alert('Remove Step', 'Remove this step from your routine?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          const updated = steps.filter(s => s.id !== stepId);
          setSteps(updated);
          await AsyncStorage.setItem(STEPS_KEY, JSON.stringify(updated));
        },
      },
    ]);
  };

  const resetToDefaults = async () => {
    Alert.alert('Reset Steps', 'Restore default routine steps?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive',
        onPress: async () => {
          const defaults = [...DEFAULT_AM_STEPS, ...DEFAULT_PM_STEPS];
          setSteps(defaults);
          await AsyncStorage.setItem(STEPS_KEY, JSON.stringify(defaults));
        },
      },
    ]);
  };

  // Streak calculation
  const calcStreak = () => {
    const amSteps = steps.filter(s => s.time === 'AM');
    const pmSteps = steps.filter(s => s.time === 'PM');
    let streak = 0;
    const sortedLog = [...log].sort((a, b) => b.date.localeCompare(a.date));
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    for (const entry of sortedLog) {
      const entryDate = new Date(entry.date + 'T00:00:00');
      const amDone = amSteps.length === 0 || entry.amCompleted.length >= amSteps.length * 0.8;
      const pmDone = pmSteps.length === 0 || entry.pmCompleted.length >= pmSteps.length * 0.8;
      if (amDone && pmDone) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calcStreak();
  const tlog = todayLog();
  const amSteps = steps.filter(s => s.time === 'AM');
  const pmSteps = steps.filter(s => s.time === 'PM');
  const currentTabSteps = routineTab === 'AM' ? amSteps : pmSteps;
  const currentCompleted = routineTab === 'AM' ? tlog.amCompleted : tlog.pmCompleted;
  const todayPct = steps.length
    ? Math.round(((tlog.amCompleted.length + tlog.pmCompleted.length) / steps.length) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Routine Checklist</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.tabBar}>
        {(['today', 'history', 'edit'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, view === t && styles.tabBtnActive]}
            onPress={() => setView(t)}
          >
            <Text style={[styles.tabLabel, view === t && styles.tabLabelActive]}>
              {t === 'today' ? 'Today' : t === 'history' ? 'History' : 'Customize'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {view === 'today' && (
          <>
            <View style={styles.streakCard}>
              <View style={styles.streakLeft}>
                <Text style={styles.streakNumber}>{streak}</Text>
                <Text style={styles.streakLabel}>Day Streak</Text>
              </View>
              <View style={styles.progressBlock}>
                <Text style={styles.progressPct}>{todayPct}%</Text>
                <Text style={styles.progressLabel}>Today</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${todayPct}%` as any }]} />
                </View>
              </View>
            </View>

            <View style={styles.routineTabRow}>
              {(['AM', 'PM'] as const).map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.routineTab, routineTab === tab && styles.routineTabActive]}
                  onPress={() => setRoutineTab(tab)}
                >
                  <Text style={[styles.routineTabText, routineTab === tab && styles.routineTabTextActive]}>
                    {tab === 'AM' ? '🌅 Morning' : '🌙 Evening'}
                  </Text>
                  <Text style={styles.routineTabCount}>
                    {tab === 'AM' ? tlog.amCompleted.length : tlog.pmCompleted.length}/{tab === 'AM' ? amSteps.length : pmSteps.length}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {currentTabSteps.map(step => {
              const done = currentCompleted.includes(step.id);
              return (
                <TouchableOpacity
                  key={step.id}
                  style={[styles.stepCard, done && styles.stepCardDone]}
                  onPress={() => toggleStep(step.id, step.time)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, done && styles.checkboxDone]}>
                    {done && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                  <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{step.label}</Text>
                </TouchableOpacity>
              );
            })}

            {currentTabSteps.length === 0 && (
              <View style={styles.emptySteps}>
                <Text style={styles.emptyText}>No {routineTab} steps. Add some in Customize.</Text>
              </View>
            )}

            {todayPct === 100 && (
              <View style={styles.completeBanner}>
                <Text style={styles.completeBannerText}>✨ Full routine complete today! Amazing work.</Text>
              </View>
            )}
          </>
        )}

        {view === 'history' && (
          <>
            <View style={styles.streakHighlight}>
              <Text style={styles.streakHighlightNum}>{streak}</Text>
              <Text style={styles.streakHighlightLabel}>Current Streak</Text>
            </View>

            {log.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyText}>No history yet. Complete today's routine to start your streak.</Text>
              </View>
            ) : (
              [...log].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30).map(entry => {
                const totalDone = entry.amCompleted.length + entry.pmCompleted.length;
                const pct = steps.length ? Math.round((totalDone / steps.length) * 100) : 0;
                const color = pct >= 80 ? Colors.green : pct >= 50 ? Colors.gold : Colors.red;
                return (
                  <View key={entry.date} style={styles.historyCard}>
                    <Text style={styles.historyDate}>{formatDate(entry.date)}</Text>
                    <View style={styles.historyRight}>
                      <Text style={[styles.historyPct, { color }]}>{pct}%</Text>
                      <View style={styles.historyBar}>
                        <View style={[styles.historyFill, { width: `${pct}%` as any, backgroundColor: color }]} />
                      </View>
                      <Text style={styles.historyDetail}>AM {entry.amCompleted.length}/{amSteps.length} · PM {entry.pmCompleted.length}/{pmSteps.length}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {view === 'edit' && (
          <>
            <Text style={styles.editNote}>
              Customize your AM and PM routine steps. Tap to delete a step. At least 80% completion counts as a streak day.
            </Text>

            <Text style={styles.editSectionLabel}>🌅 Morning (AM)</Text>
            {amSteps.map(step => (
              <View key={step.id} style={styles.editStepRow}>
                <Text style={styles.editStepIcon}>{step.icon}</Text>
                <Text style={styles.editStepLabel}>{step.label}</Text>
                <TouchableOpacity onPress={() => deleteStep(step.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <Text style={[styles.editSectionLabel, { marginTop: 16 }]}>🌙 Evening (PM)</Text>
            {pmSteps.map(step => (
              <View key={step.id} style={styles.editStepRow}>
                <Text style={styles.editStepIcon}>{step.icon}</Text>
                <Text style={styles.editStepLabel}>{step.label}</Text>
                <TouchableOpacity onPress={() => deleteStep(step.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addBtn} onPress={() => setAddingStep(true)}>
              <Text style={styles.addBtnText}>+ Add Custom Step</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetBtn} onPress={resetToDefaults}>
              <Text style={styles.resetBtnText}>Reset to Defaults</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={addingStep} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Step</Text>
            <View style={styles.modalTabRow}>
              {(['AM', 'PM'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.modalTab, newStepTime === t && styles.modalTabActive]}
                  onPress={() => setNewStepTime(t)}
                >
                  <Text style={[styles.modalTabText, newStepTime === t && styles.modalTabTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.modalInput}
              value={newStepLabel}
              onChangeText={setNewStepLabel}
              placeholder="Step description..."
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setAddingStep(false); setNewStepLabel(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={addStep}>
                <Text style={styles.modalConfirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  backText: { color: Colors.primary, fontSize: 16 },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabLabel: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: Colors.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  streakCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 20,
  },
  streakLeft: { alignItems: 'center' },
  streakNumber: { color: Colors.gold, fontSize: 40, fontWeight: '900' },
  streakLabel: { color: Colors.textSecondary, fontSize: 12 },
  progressBlock: { flex: 1 },
  progressPct: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 2 },
  progressLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 6 },
  progressBar: { height: 6, backgroundColor: Colors.border, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  routineTabRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  routineTab: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  routineTabActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  routineTabText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  routineTabTextActive: { color: Colors.primary },
  routineTabCount: { color: Colors.textMuted, fontSize: 12 },
  stepCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  stepCardDone: { borderColor: Colors.green + '44', backgroundColor: Colors.green + '0A' },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: Colors.green, borderColor: Colors.green },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '900' },
  stepIcon: { fontSize: 18 },
  stepLabel: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '500' },
  stepLabelDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  emptySteps: { alignItems: 'center', padding: 30 },
  emptyText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center' },
  completeBanner: {
    backgroundColor: Colors.green + '22', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.green + '44', marginTop: 8,
    alignItems: 'center',
  },
  completeBannerText: { color: Colors.green, fontSize: 14, fontWeight: '700' },
  streakHighlight: {
    alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: 16, padding: 24, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  streakHighlightNum: { color: Colors.gold, fontSize: 56, fontWeight: '900' },
  streakHighlightLabel: { color: Colors.textSecondary, fontSize: 15 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  historyCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  historyDate: { color: Colors.textSecondary, fontSize: 13, flex: 1 },
  historyRight: { alignItems: 'flex-end', gap: 4 },
  historyPct: { fontSize: 14, fontWeight: '700' },
  historyBar: { height: 4, width: 80, backgroundColor: Colors.border, borderRadius: 2 },
  historyFill: { height: 4, borderRadius: 2 },
  historyDetail: { color: Colors.textMuted, fontSize: 10 },
  editNote: {
    color: Colors.textSecondary, fontSize: 13, lineHeight: 20,
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
  },
  editSectionLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  editStepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  editStepIcon: { fontSize: 16 },
  editStepLabel: { flex: 1, color: Colors.textSecondary, fontSize: 13 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { color: Colors.red, fontSize: 16 },
  addBtn: {
    backgroundColor: Colors.primary + '22', borderRadius: 14,
    borderWidth: 1, borderColor: Colors.primary,
    paddingVertical: 12, alignItems: 'center', marginTop: 12, marginBottom: 8,
  },
  addBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  resetBtn: { alignItems: 'center', paddingVertical: 12 },
  resetBtnText: { color: Colors.textMuted, fontSize: 13 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  modalTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modalTabRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  modalTab: {
    flex: 1, padding: 10, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  modalTabActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  modalTabText: { color: Colors.textMuted, fontWeight: '600' },
  modalTabTextActive: { color: Colors.primary },
  modalInput: {
    backgroundColor: Colors.bg, borderRadius: 12, padding: 12,
    color: Colors.textPrimary, fontSize: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
  },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalCancel: {
    flex: 1, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  modalCancelText: { color: Colors.textSecondary, fontWeight: '600' },
  modalConfirm: { flex: 1, backgroundColor: Colors.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
});
