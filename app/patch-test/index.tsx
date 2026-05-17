import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

const LOG_KEY = 'gd_patch_tests';

type CheckIn = {
  hour: 24 | 48 | 72;
  reaction: 'none' | 'mild' | 'moderate' | 'severe';
  notes: string;
  timestamp: string;
};

type PatchTest = {
  id: string;
  productName: string;
  ingredients: string;
  startDate: string;
  testZone: string;
  checkIns: CheckIn[];
  result: 'pending' | 'passed' | 'failed';
};

function buildReactionOptions(c: Palette): { value: CheckIn['reaction']; label: string; emoji: string; color: string }[] {
  return [
    { value: 'none', label: 'No reaction', emoji: '✅', color: '#4ADE80' },
    { value: 'mild', label: 'Mild redness', emoji: '🟡', color: c.gold },
    { value: 'moderate', label: 'Moderate', emoji: '🟠', color: '#F97316' },
    { value: 'severe', label: 'Severe', emoji: '🔴', color: c.scorePoor },
  ];
}

const TEST_ZONES = ['Inner wrist', 'Behind ear', 'Inner elbow', 'Jawline', 'Neck'];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getHoursSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60));
}

function getResultColor(result: PatchTest['result'], c: Palette) {
  if (result === 'passed') return '#4ADE80';
  if (result === 'failed') return c.scorePoor;
  return c.gold;
}

function getResultLabel(test: PatchTest): string {
  if (test.result === 'passed') return '✅ Passed';
  if (test.result === 'failed') return '❌ Failed';
  const hours = getHoursSince(test.startDate);
  if (hours < 24) return '⏱ Waiting for 24h check-in';
  if (hours < 48) return '⏱ 24h done — wait for 48h';
  if (hours < 72) return '⏱ 48h done — wait for 72h';
  return '⏱ 72h done — mark result';
}

export default function PatchTestTracker() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const REACTION_OPTIONS = useMemo(() => buildReactionOptions(colors), [colors]);
  const [tests, setTests] = useState<PatchTest[]>([]);
  const [adding, setAdding] = useState(false);
  const [productName, setProductName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [testZone, setTestZone] = useState(TEST_ZONES[0]);
  const [checkingIn, setCheckingIn] = useState<{ testId: string; hour: 24 | 48 | 72 } | null>(null);
  const [checkInReaction, setCheckInReaction] = useState<CheckIn['reaction']>('none');
  const [checkInNotes, setCheckInNotes] = useState('');

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  const load = async () => {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    setTests(raw ? JSON.parse(raw) : []);
  };

  const save = async (updated: PatchTest[]) => {
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(updated));
    setTests(updated);
  };

  const startTest = async () => {
    if (!productName.trim()) return;
    const test: PatchTest = {
      id: generateId(),
      productName: productName.trim(),
      ingredients: ingredients.trim(),
      startDate: new Date().toISOString(),
      testZone,
      checkIns: [],
      result: 'pending',
    };
    const updated = [test, ...tests];
    await save(updated);
    setAdding(false);
    setProductName('');
    setIngredients('');
    setTestZone(TEST_ZONES[0]);
  };

  const submitCheckIn = async () => {
    if (!checkingIn) return;
    const checkIn: CheckIn = {
      hour: checkingIn.hour,
      reaction: checkInReaction,
      notes: checkInNotes.trim(),
      timestamp: new Date().toISOString(),
    };
    const updated = tests.map(t => {
      if (t.id !== checkingIn.testId) return t;
      const newCheckIns = [...t.checkIns.filter(c => c.hour !== checkingIn.hour), checkIn];
      let result: PatchTest['result'] = 'pending';
      if (checkIn.reaction === 'severe' || checkIn.reaction === 'moderate') result = 'failed';
      else if (newCheckIns.length >= 3 && newCheckIns.every(c => c.reaction === 'none' || c.reaction === 'mild')) result = 'passed';
      return { ...t, checkIns: newCheckIns, result };
    });
    await save(updated);
    setCheckingIn(null);
    setCheckInReaction('none');
    setCheckInNotes('');
  };

  const deleteTest = (id: string) => {
    Alert.alert('Delete Test', 'Remove this patch test record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => save(tests.filter(t => t.id !== id)) },
    ]);
  };

  const getAvailableCheckIns = (test: PatchTest): (24 | 48 | 72)[] => {
    const hours = getHoursSince(test.startDate);
    const done = new Set(test.checkIns.map(c => c.hour));
    const available: (24 | 48 | 72)[] = [];
    if (hours >= 24 && !done.has(24)) available.push(24);
    if (hours >= 48 && !done.has(48)) available.push(48);
    if (hours >= 72 && !done.has(72)) available.push(72);
    return available;
  };

  const activeTests = tests.filter(t => t.result === 'pending');
  const completedTests = tests.filter(t => t.result !== 'pending');

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>Patch Test Tracker</Text>
            <Text style={styles.headerSub}>Test new products safely</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Add patch test" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.addBtn} onPress={() => setAdding(true)}>
            <Ionicons name="add" size={20} color={colors.white} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Add new test form */}
        {adding && (
          <View style={styles.addCard}>
            <LinearGradient colors={['rgba(196,98,45,0.08)', 'rgba(196,98,45,0.02)']} style={StyleSheet.absoluteFill} />
            <Text style={styles.addCardTitle}>New Patch Test</Text>

            <TextInput
              style={styles.textInput}
              placeholder="Product name"
              placeholderTextColor={colors.textMuted}
              value={productName}
              onChangeText={setProductName}
              autoFocus
            />
            <TextInput
              style={[styles.textInput, { minHeight: 60, textAlignVertical: 'top' }]}
              placeholder="Key ingredients (optional)"
              placeholderTextColor={colors.textMuted}
              value={ingredients}
              onChangeText={setIngredients}
              multiline
            />

            <Text style={styles.fieldLabel}>Test Zone</Text>
            <View style={styles.zoneRow}>
              {TEST_ZONES.map(z => (
                <Pressable
                  key={z}
                  style={[styles.zoneChip, testZone === z && styles.zoneChipActive]}
                  onPress={() => setTestZone(z)}
                >
                  <Text style={[styles.zoneText, testZone === z && { color: colors.primary }]}>{z}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.addFormBtns}>
              <Pressable style={styles.cancelBtn} onPress={() => setAdding(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.startBtn, !productName.trim() && { opacity: 0.5 }]}
                onPress={startTest}
                disabled={!productName.trim()}
              >
                <Text style={styles.startBtnText}>Start Test</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Check-in modal */}
        {checkingIn && (() => {
          const test = tests.find(t => t.id === checkingIn.testId);
          if (!test) return null;
          return (
            <View style={styles.checkInCard}>
              <LinearGradient colors={['rgba(196,98,45,0.1)', 'rgba(196,98,45,0.03)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.checkInTitle}>{checkingIn.hour}h Check-In</Text>
              <Text style={styles.checkInProduct}>{test.productName}</Text>

              <Text style={styles.fieldLabel}>Reaction at {checkingIn.hour} hours</Text>
              <View style={styles.reactionGrid}>
                {REACTION_OPTIONS.map(opt => (
                  <Pressable
                    key={opt.value}
                    style={[styles.reactionChip, checkInReaction === opt.value && { backgroundColor: `${opt.color}20`, borderColor: opt.color }]}
                    onPress={() => setCheckInReaction(opt.value)}
                  >
                    <Text style={styles.reactionEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.reactionLabel, checkInReaction === opt.value && { color: opt.color }]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={styles.textInput}
                placeholder="Notes (itching, swelling, etc.)"
                placeholderTextColor={colors.textMuted}
                value={checkInNotes}
                onChangeText={setCheckInNotes}
              />

              <View style={styles.addFormBtns}>
                <Pressable style={styles.cancelBtn} onPress={() => setCheckingIn(null)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.startBtn} onPress={submitCheckIn}>
                  <Text style={styles.startBtnText}>Submit</Text>
                </Pressable>
              </View>
            </View>
          );
        })()}

        {/* Empty state */}
        {tests.length === 0 && !adding && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🔬</Text>
            <Text style={styles.emptyTitle}>No Patch Tests Yet</Text>
            <Text style={styles.emptyDesc}>
              Before using any new product, do a patch test on your inner wrist. Log it here to track reactions over 24, 48, and 72 hours.
            </Text>
            <Pressable style={styles.emptyBtn} onPress={() => setAdding(true)}>
              <Text style={styles.emptyBtnText}>Start First Test</Text>
            </Pressable>
          </View>
        )}

        {/* Active tests */}
        {activeTests.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>ACTIVE TESTS</Text>
            {activeTests.map(test => {
              const availableCheckIns = getAvailableCheckIns(test);
              const hours = getHoursSince(test.startDate);
              return (
                <View key={test.id} style={styles.testCard}>
                  <View style={styles.testHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.testName}>{test.productName}</Text>
                      <Text style={styles.testMeta}>{test.testZone} · Started {Math.floor(hours)}h ago</Text>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel="Delete test" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => deleteTest(test.id)}>
                      <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                    </Pressable>
                  </View>

                  <Text style={[styles.testStatus, { color: colors.gold }]}>{getResultLabel(test)}</Text>

                  {/* Timeline */}
                  <View style={styles.timeline}>
                    {([24, 48, 72] as const).map((h, i) => {
                      const checkIn = test.checkIns.find(c => c.hour === h);
                      const unlocked = hours >= h;
                      const color = checkIn
                        ? (checkIn.reaction === 'none' ? '#4ADE80' : checkIn.reaction === 'mild' ? colors.gold : colors.scorePoor)
                        : unlocked ? colors.primary : colors.border;
                      return (
                        <View key={h} style={styles.timelineItem}>
                          {i > 0 && <View style={[styles.timelineLine, { backgroundColor: hours >= h ? colors.primary : colors.border }]} />}
                          <View style={[styles.timelineDot, { backgroundColor: checkIn ? color : unlocked ? `${colors.primary}30` : colors.bgElevated, borderColor: color }]}>
                            {checkIn && <Ionicons name={checkIn.reaction === 'none' ? 'checkmark' : 'close'} size={10} color={colors.white} />}
                          </View>
                          <Text style={[styles.timelineLabel, { color: unlocked ? colors.textSecondary : colors.textMuted }]}>{h}h</Text>
                          {checkIn && <Text style={[styles.timelineReaction, { color }]}>{REACTION_OPTIONS.find(r => r.value === checkIn.reaction)?.label}</Text>}
                        </View>
                      );
                    })}
                  </View>

                  {availableCheckIns.length > 0 && (
                    <View style={styles.checkInBtnRow}>
                      {availableCheckIns.map(h => (
                        <Pressable
                          key={h}
                          style={styles.checkInBtn}
                          onPress={() => { setCheckingIn({ testId: test.id, hour: h }); setCheckInReaction('none'); setCheckInNotes(''); }}
                        >
                          <Text style={styles.checkInBtnText}>Log {h}h Check-In</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* Completed tests */}
        {completedTests.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>COMPLETED</Text>
            {completedTests.map(test => (
              <View key={test.id} style={[styles.testCard, styles.completedTestCard]}>
                <View style={styles.testHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.testName}>{test.productName}</Text>
                    <Text style={styles.testMeta}>{test.testZone}</Text>
                  </View>
                  <View style={[styles.resultBadge, { backgroundColor: `${getResultColor(test.result, colors)}20`, borderColor: `${getResultColor(test.result, colors)}50` }]}>
                    <Text style={[styles.resultBadgeText, { color: getResultColor(test.result, colors) }]}>
                      {test.result === 'passed' ? 'PASSED' : 'FAILED'}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => deleteTest(test.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </>
        )}

        {/* How to patch test guide */}
        <View style={styles.guideCard}>
          <Text style={styles.cardTitle}>How to Patch Test</Text>
          {[
            { step: '1', text: 'Apply a small amount of product (dime-sized) to your inner wrist or behind the ear.' },
            { step: '2', text: 'Don\'t wash the area for 24 hours. Note any immediate sensations.' },
            { step: '3', text: 'Check at 24h, 48h, and 72h for redness, itching, bumps, or swelling.' },
            { step: '4', text: 'If no reaction at 72h, the product is likely safe for your skin type.' },
            { step: '5', text: 'Still introduce new products one at a time — wait 2 weeks between new additions.' },
          ].map(item => (
            <View key={item.step} style={styles.guideRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>{item.step}</Text>
              </View>
              <Text style={styles.guideText}>{item.text}</Text>
            </View>
          ))}
        </View>

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
  headerTitle: { fontSize: 20, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
  },
  scroll: { paddingHorizontal: 16 },

  addCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: `${c.primary}40`,
    padding: 16, gap: 10, marginBottom: 14,
  },
  addCardTitle: { fontSize: 16, fontWeight: '800', color: c.textPrimary },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  textInput: {
    backgroundColor: c.bgElevated, borderRadius: 12,
    borderWidth: 1, borderColor: c.border,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: c.textPrimary,
  },
  zoneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  zoneChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated,
  },
  zoneChipActive: { borderColor: c.primary, backgroundColor: `${c.primary}15` },
  zoneText: { fontSize: 12, fontWeight: '600', color: c.textMuted },
  addFormBtns: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: c.textMuted },
  startBtn: {
    flex: 1, height: 44, borderRadius: 12, backgroundColor: c.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  startBtnText: { fontSize: 14, fontWeight: '700', color: c.white },

  checkInCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: `${c.primary}40`,
    padding: 16, gap: 10, marginBottom: 14,
  },
  checkInTitle: { fontSize: 16, fontWeight: '800', color: c.textPrimary },
  checkInProduct: { fontSize: 13, color: c.textMuted },
  reactionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reactionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated,
  },
  reactionEmoji: { fontSize: 14 },
  reactionLabel: { fontSize: 12, fontWeight: '600', color: c.textMuted },

  emptyCard: {
    backgroundColor: c.bgCard, borderRadius: 20, borderWidth: 1, borderColor: c.border,
    padding: 24, gap: 10, marginBottom: 14, alignItems: 'center',
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: c.textPrimary },
  emptyDesc: { fontSize: 13, color: c.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    backgroundColor: c.primary, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, marginTop: 4,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: c.white },

  sectionLabel: {
    fontSize: 10, fontWeight: '800', color: c.textMuted,
    letterSpacing: 1.5, marginBottom: 8, marginTop: 4,
  },

  testCard: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border,
    padding: 14, gap: 10, marginBottom: 10,
  },
  completedTestCard: { opacity: 0.8 },
  testHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  testName: { fontSize: 15, fontWeight: '800', color: c.textPrimary },
  testMeta: { fontSize: 11, color: c.textMuted, marginTop: 2 },
  testStatus: { fontSize: 12, fontWeight: '600' },

  timeline: { flexDirection: 'row', alignItems: 'center', gap: 0, paddingHorizontal: 4 },
  timelineItem: { flex: 1, alignItems: 'center', gap: 4, position: 'relative' },
  timelineLine: { position: 'absolute', left: '-50%', right: '50%', top: 12, height: 2 },
  timelineDot: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  timelineLabel: { fontSize: 10, fontWeight: '700' },
  timelineReaction: { fontSize: 9, fontWeight: '600', textAlign: 'center' },

  checkInBtnRow: { flexDirection: 'row', gap: 8 },
  checkInBtn: {
    flex: 1, height: 38, borderRadius: 10, backgroundColor: c.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  checkInBtnText: { fontSize: 12, fontWeight: '700', color: c.white },

  resultBadge: {
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4,
  },
  resultBadgeText: { fontSize: 11, fontWeight: '800' },
  deleteBtn: { alignSelf: 'flex-start' },
  deleteBtnText: { fontSize: 11, color: c.textMuted, textDecorationLine: 'underline' },

  guideCard: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border,
    padding: 16, gap: 12, marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  guideRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepBadge: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: c.primary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNum: { fontSize: 12, fontWeight: '900', color: c.white },
  guideText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  });
}
