import { useCallback, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Alert, Animated, Easing,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

interface Goal {
  id: string;
  title: string;
  targetScore: number;
  metric: string;
  createdDate: string;
  targetDate: string;
  completedDate?: string;
}

const METRIC_OPTIONS = [
  { key: 'overall', label: 'Overall Score' },
  { key: 'hydration', label: 'Hydration' },
  { key: 'texture', label: 'Texture' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'evenness', label: 'Evenness' },
  { key: 'firmness', label: 'Firmness' },
  { key: 'pores', label: 'Pores' },
];

const PRESET_GOALS = [
  { title: 'Hit 80 overall skin score', metric: 'overall', targetScore: 80 },
  { title: 'Clear my acne — reach 75 clarity', metric: 'clarity', targetScore: 75 },
  { title: 'Repair my barrier — 80 hydration', metric: 'hydration', targetScore: 80 },
  { title: 'Smooth texture to 75', metric: 'texture', targetScore: 75 },
  { title: 'Even skin tone to 80', metric: 'evenness', targetScore: 80 },
];

const GOALS_KEY = 'gd_goals';

async function loadGoals(): Promise<Goal[]> {
  const raw = await AsyncStorage.getItem(GOALS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveGoals(goals: Goal[]): Promise<void> {
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function Goals() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [metric, setMetric] = useState('overall');
  const [targetScore, setTargetScore] = useState('80');
  const [weeksAway, setWeeksAway] = useState('8');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    loadGoals().then(data => {
      setGoals(data);
      Animated.stagger(80, [
        Animated.timing(headerAnim, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(contentAnim, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
  }, []));

  const addGoal = async () => {
    if (!title.trim()) return;
    const target = parseInt(targetScore, 10);
    if (isNaN(target) || target < 1 || target > 100) {
      Alert.alert('Invalid Score', 'Target score must be between 1 and 100.');
      return;
    }
    const weeks = parseInt(weeksAway, 10) || 8;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + weeks * 7);

    const newGoal: Goal = {
      id: generateId(),
      title: title.trim(),
      targetScore: target,
      metric,
      createdDate: new Date().toISOString(),
      targetDate: targetDate.toISOString(),
    };

    const updated = [newGoal, ...goals];
    await saveGoals(updated);
    setGoals(updated);
    setShowAdd(false);
    setTitle('');
    setMetric('overall');
    setTargetScore('80');
    setWeeksAway('8');
  };

  const addPreset = async (preset: typeof PRESET_GOALS[0]) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 56); // 8 weeks default
    const newGoal: Goal = {
      id: generateId(),
      title: preset.title,
      targetScore: preset.targetScore,
      metric: preset.metric,
      createdDate: new Date().toISOString(),
      targetDate: targetDate.toISOString(),
    };
    const updated = [newGoal, ...goals];
    await saveGoals(updated);
    setGoals(updated);
  };

  const toggleComplete = async (id: string) => {
    const updated = goals.map(g =>
      g.id === id
        ? { ...g, completedDate: g.completedDate ? undefined : new Date().toISOString() }
        : g
    );
    await saveGoals(updated);
    setGoals(updated);
  };

  const deleteGoal = (id: string) => {
    Alert.alert('Delete Goal', 'Remove this goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = goals.filter(g => g.id !== id);
          await saveGoals(updated);
          setGoals(updated);
        },
      },
    ]);
  };

  const active = goals.filter(g => !g.completedDate);
  const completed = goals.filter(g => g.completedDate);

  const daysUntil = (dateStr: string) => {
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today!';
    return `${days}d left`;
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
        }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Skin Goals</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Add goal" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => setShowAdd(true)} style={styles.addBtn}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </Pressable>
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        style={{ opacity: contentAnim }}>

        {/* Add goal form */}
        {showAdd && (
          <View style={styles.addCard}>
            <Text style={styles.addTitle}>New Goal</Text>
            <TextInput
              style={styles.input}
              placeholder="Goal title (e.g. Clear my acne)"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
            <Text style={styles.fieldLabel}>Metric to track</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricRow}>
              {METRIC_OPTIONS.map(m => (
                <Pressable
                  key={m.key}
                  style={[styles.metricChip, metric === m.key && styles.metricChipActive]}
                  onPress={() => setMetric(m.key)}
                >
                  <Text style={[styles.metricChipText, metric === m.key && styles.metricChipTextActive]}>{m.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>Target Score</Text>
                <TextInput
                  style={styles.input}
                  value={targetScore}
                  onChangeText={setTargetScore}
                  keyboardType="number-pad"
                  maxLength={3}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>Weeks to achieve</Text>
                <TextInput
                  style={styles.input}
                  value={weeksAway}
                  onChangeText={setWeeksAway}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
            <View style={styles.addActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.saveBtn, !title.trim() && styles.saveBtnDisabled]} onPress={addGoal} disabled={!title.trim()}>
                <LinearGradient colors={[colors.primaryLight, colors.primary]} style={styles.saveBtnGrad}>
                  <Text style={styles.saveText}>Add Goal</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{active.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{completed.length}</Text>
            <Text style={styles.statLabel}>Completed ✓</Text>
          </View>
        </View>

        {/* Preset goals */}
        {active.length === 0 && !showAdd && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Start Goals</Text>
            <Text style={styles.sectionSub}>Tap to add a goal instantly</Text>
            {PRESET_GOALS.map(p => (
              <Pressable key={p.title} style={styles.presetItem} onPress={() => addPreset(p)}>
                <View style={styles.presetContent}>
                  <Text style={styles.presetTitle}>{p.title}</Text>
                  <Text style={styles.presetMeta}>{METRIC_OPTIONS.find(m => m.key === p.metric)?.label} → {p.targetScore}</Text>
                </View>
                <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Active goals */}
        {active.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Goals</Text>
            {active.map(goal => (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalTop}>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <View style={styles.goalMeta}>
                      <View style={styles.goalMetricBadge}>
                        <Text style={styles.goalMetricText}>{METRIC_OPTIONS.find(m => m.key === goal.metric)?.label}</Text>
                      </View>
                      <Text style={styles.goalTarget}>Target: {goal.targetScore}</Text>
                    </View>
                  </View>
                  <View style={styles.goalActions}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Mark goal complete" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.goalActionBtn} onPress={() => toggleComplete(goal.id)}>
                      <Ionicons name="checkmark-circle-outline" size={22} color={colors.scoreExcellent} />
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel="Delete goal" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.goalActionBtn} onPress={() => deleteGoal(goal.id)}>
                      <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.goalFooter}>
                  <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.goalDeadline}>
                    {daysUntil(goal.targetDate)} · Due {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Completed goals */}
        {completed.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.scoreExcellent }]}>Completed ✓</Text>
            {completed.map(goal => (
              <View key={goal.id} style={[styles.goalCard, styles.goalCardCompleted]}>
                <View style={styles.goalTop}>
                  <View style={styles.goalInfo}>
                    <Text style={[styles.goalTitle, { textDecorationLine: 'line-through', color: colors.textMuted }]}>{goal.title}</Text>
                    <Text style={styles.goalCompletedDate}>
                      Completed {new Date(goal.completedDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel="Delete goal" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => deleteGoal(goal.id)}>
                    <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {goals.length === 0 && !showAdd && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>Set your first skin goal</Text>
            <Text style={styles.emptySub}>Track specific improvements and stay motivated with milestone targets.</Text>
            <Pressable style={styles.addGoalBtn} onPress={() => setShowAdd(true)}>
              <Text style={styles.addGoalBtnText}>+ Add Goal</Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: c.textPrimary },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  addCard: { backgroundColor: c.bgCard, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 18, marginBottom: 16 },
  addTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary, marginBottom: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: c.textMuted, letterSpacing: 0.5, marginTop: 12, marginBottom: 8 },
  input: { backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: c.textPrimary },
  metricRow: { gap: 8, paddingBottom: 4 },
  metricChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated },
  metricChipActive: { borderColor: c.primary, backgroundColor: 'rgba(196,98,45,0.15)' },
  metricChipText: { fontSize: 12, color: c.textMuted, fontWeight: '500' },
  metricChipTextActive: { color: c.primary, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  addActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: c.border },
  cancelText: { fontSize: 14, color: c.textMuted, fontWeight: '600' },
  saveBtn: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  saveText: { fontSize: 14, fontWeight: '700', color: c.white },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20, marginTop: 4 },
  statCard: { flex: 1, backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 14, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 26, fontWeight: '800', color: c.textPrimary },
  statLabel: { fontSize: 11, color: c.textMuted, fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: c.textMuted, marginBottom: 12 },
  presetItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 8 },
  presetContent: { flex: 1 },
  presetTitle: { fontSize: 14, fontWeight: '600', color: c.textPrimary, marginBottom: 3 },
  presetMeta: { fontSize: 11, color: c.textMuted },
  goalCard: { backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: c.primary, padding: 16, marginBottom: 10 },
  goalCardCompleted: { opacity: 0.6 },
  goalTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  goalInfo: { flex: 1 },
  goalTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary, marginBottom: 8 },
  goalMeta: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  goalMetricBadge: { backgroundColor: 'rgba(196,98,45,0.1)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  goalMetricText: { fontSize: 10, color: c.primary, fontWeight: '700' },
  goalTarget: { fontSize: 12, color: c.textMuted },
  goalActions: { flexDirection: 'row', gap: 4 },
  goalActionBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  goalFooter: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  goalDeadline: { fontSize: 11, color: c.textMuted },
  goalCompletedDate: { fontSize: 11, color: c.scoreExcellent, marginTop: 4 },
  emptyWrap: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24, maxWidth: 280 },
  addGoalBtn: { backgroundColor: c.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  addGoalBtnText: { fontSize: 15, fontWeight: '700', color: c.white },
  });
}
