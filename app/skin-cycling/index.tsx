import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
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
  purple: '#A78BFA',
};

const STORAGE_KEY = 'gd_skin_cycling';

interface CycleState {
  startDate: string; // ISO date
  currentDay: number; // 1–4, cycles
}

const CYCLE_NIGHTS = [
  {
    day: 1,
    name: 'Exfoliation Night',
    color: Colors.blue,
    icon: '⚗️',
    description: 'Chemical exfoliant to clear dead cells and prepare skin for actives.',
    steps: [
      { step: 'Double cleanse', detail: 'Oil cleanse + gentle cleanser to start fresh' },
      { step: 'AHA or BHA exfoliant', detail: 'Apply glycolic (AHA) or salicylic acid (BHA) — not both. Leave 10–20 min or per product instructions' },
      { step: 'Wait 20 minutes', detail: 'Allow the exfoliant to fully absorb before layering' },
      { step: 'Lightweight moisturizer', detail: 'A thin layer — avoid heavy occlusives over fresh exfoliant' },
    ],
    warnings: ['No retinol tonight', 'Avoid Vitamin C (pH conflict)', 'Use SPF next morning without fail'],
    tallowNote: 'Skip tallow tonight — use a lighter moisturizer over fresh exfoliant. Return to tallow on recovery nights.',
  },
  {
    day: 2,
    name: 'Retinoid Night',
    color: Colors.purple,
    icon: '🔬',
    description: 'Retinol or retinoid to stimulate collagen, clear pores, and accelerate cell turnover.',
    steps: [
      { step: 'Gentle single cleanse', detail: 'No double cleanse needed — skin is already clear from Night 1' },
      { step: 'Niacinamide serum (optional)', detail: 'Reduces retinol irritation. Apply first, wait 30 seconds' },
      { step: 'Retinol / retinoid', detail: 'Pea-sized amount for full face. Avoid eye area. Wait 20–30 min' },
      { step: 'Tallow balm or moisturizer', detail: 'Apply on top to buffer irritation and lock in the retinoid' },
    ],
    warnings: ['No AHA/BHA tonight', 'No Vitamin C tonight', 'This is where the magic happens — do not skip'],
    tallowNote: 'Tallow is excellent as a retinol buffer on Night 2. Apply after the retinoid wait time. Its fatty acid profile buffers irritation without reducing efficacy.',
  },
  {
    day: 3,
    name: 'Recovery Night 1',
    color: Colors.green,
    icon: '🌿',
    description: 'First barrier repair night. No actives. Focus on restoration and nourishment.',
    steps: [
      { step: 'Gentle cleanse', detail: 'Gentle, pH-balanced cleanser. No oil cleanse required unless heavy makeup' },
      { step: 'Hydrating serum (optional)', detail: 'Hyaluronic acid or centella asiatica serum if desired' },
      { step: 'Tallow balm — generous layer', detail: 'This is the tallow night. Apply generously to allow overnight repair. Focus on any dry or irritated areas' },
      { step: 'Facial oil over tallow (optional)', detail: 'A drop of rosehip or squalane can be layered over tallow for extra nourishment' },
    ],
    warnings: ['Zero actives tonight', 'If skin is irritated — add ceramide or aloe before tallow', 'This night is what makes the actives sustainable'],
    tallowNote: 'Recovery Night 1 is THE tallow night. Use it generously. This is when tallow\'s barrier-repair properties shine — rebuilding what the actives processed.',
  },
  {
    day: 4,
    name: 'Recovery Night 2',
    color: Colors.gold,
    icon: '💛',
    description: 'Second barrier repair night. Skin fully consolidates gains from the cycle before repeating.',
    steps: [
      { step: 'Cleanse as usual', detail: 'Standard gentle cleanse' },
      { step: 'Peptide serum (optional)', detail: 'If using — peptides support collagen synthesis alongside retinol from Night 2' },
      { step: 'Tallow balm — moderate layer', detail: 'Another tallow night, slightly lighter than Night 3. Maintain the barrier repair' },
      { step: 'Eye care', detail: 'Apply tallow or eye cream around eyes' },
    ],
    warnings: ['Still no actives', 'Tomorrow night the cycle repeats from Night 1', 'Consistency over weeks is what produces results'],
    tallowNote: 'Second tallow night — keep it consistent. By cycling recovery nights with active nights, you prevent the chronic barrier damage that makes actives unsustainable long-term.',
  },
];

const HOW_IT_WORKS = `Skin cycling is a strategic 4-night PM routine rotation developed by dermatologists to maximize the benefits of actives (exfoliants and retinoids) while giving the skin barrier sufficient recovery time between applications.

The problem with daily actives: Used every night, AHAs and retinoids continuously process the skin barrier faster than it can regenerate. The result is sensitization, dryness, and reduced efficacy over time.

The solution — cycle them: By spacing active nights with 2 recovery nights, you get the full cellular benefit of each active while allowing the microbiome and barrier to fully restore. Paradoxically, you often get better results using actives 2 nights per week than 7.

The cycle repeats indefinitely: Night 1 (exfoliate) → Night 2 (retinoid) → Night 3 (recovery) → Night 4 (recovery) → Night 1 again.`;

const today = () => new Date().toISOString().split('T')[0];
const formatDate = (d: string) => {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

const getDaysSince = (startDate: string): number => {
  const start = new Date(startDate + 'T00:00:00').getTime();
  const now = new Date(today() + 'T00:00:00').getTime();
  return Math.floor((now - start) / 86400000);
};

const getCurrentNight = (state: CycleState): number => {
  const elapsed = getDaysSince(state.startDate);
  return (elapsed % 4) + 1;
};

export default function SkinCyclingScreen() {
  const [cycleState, setCycleState] = useState<CycleState | null>(null);
  const [view, setView] = useState<'tracker' | 'guide'>('guide');

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setCycleState(JSON.parse(raw));
    } catch {}
  };

  const startCycle = async () => {
    const state: CycleState = { startDate: today(), currentDay: 1 };
    setCycleState(state);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setView('tracker');
  };

  const resetCycle = () => {
    Alert.alert('Reset Cycle', 'Start the skin cycling tracker from today?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        onPress: async () => {
          const state: CycleState = { startDate: today(), currentDay: 1 };
          setCycleState(state);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        },
      },
    ]);
  };

  const currentNight = cycleState ? getCurrentNight(cycleState) : 1;
  const nightInfo = CYCLE_NIGHTS[currentNight - 1];
  const totalDays = cycleState ? getDaysSince(cycleState.startDate) + 1 : 0;
  const totalCycles = cycleState ? Math.floor(getDaysSince(cycleState.startDate) / 4) + 1 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Skin Cycling</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.tabBar}>
        {(['guide', 'tracker'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, view === t && styles.tabBtnActive]}
            onPress={() => setView(t)}
          >
            <Text style={[styles.tabLabel, view === t && styles.tabLabelActive]}>
              {t === 'guide' ? '📖 The Guide' : '📅 My Tracker'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {view === 'guide' && (
          <>
            <LinearGradient colors={['#A78BFA22', '#0A0A0F']} style={styles.hero}>
              <Text style={styles.heroEmoji}>🔄</Text>
              <Text style={styles.heroTitle}>The 4-Night Cycle</Text>
              <Text style={styles.heroSub}>Max actives. Max recovery. No burnout.</Text>
            </LinearGradient>

            <View style={styles.howItWorksCard}>
              <Text style={styles.howTitle}>How It Works</Text>
              <Text style={styles.howText}>{HOW_IT_WORKS}</Text>
            </View>

            {CYCLE_NIGHTS.map((night, i) => (
              <View key={i} style={[styles.nightCard, { borderLeftColor: night.color, borderLeftWidth: 4 }]}>
                <View style={styles.nightHeader}>
                  <View style={[styles.nightNum, { backgroundColor: night.color + '33' }]}>
                    <Text style={[styles.nightNumText, { color: night.color }]}>N{night.day}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nightIcon}>{night.icon} <Text style={[styles.nightName, { color: night.color }]}>{night.name}</Text></Text>
                    <Text style={styles.nightDesc}>{night.description}</Text>
                  </View>
                </View>
                <View style={styles.nightSteps}>
                  {night.steps.map((s, j) => (
                    <View key={j} style={styles.nightStep}>
                      <Text style={[styles.stepNum, { color: night.color }]}>{j + 1}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stepName}>{s.step}</Text>
                        <Text style={styles.stepDetail}>{s.detail}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.tallowNoteCard}>
                  <Text style={styles.tallowNoteTitle}>🌿 Tallow Note</Text>
                  <Text style={styles.tallowNoteText}>{night.tallowNote}</Text>
                </View>
                <View style={styles.warningsBlock}>
                  {night.warnings.map((w, j) => (
                    <Text key={j} style={styles.warningItem}>⚠️ {w}</Text>
                  ))}
                </View>
              </View>
            ))}
          </>
        )}

        {view === 'tracker' && (
          <>
            {!cycleState ? (
              <View style={styles.startBlock}>
                <Text style={styles.startEmoji}>🔄</Text>
                <Text style={styles.startTitle}>Start Skin Cycling Today</Text>
                <Text style={styles.startText}>
                  Set today as Night 1 (Exfoliation Night). The tracker will automatically advance each day through the 4-night cycle.
                </Text>
                <TouchableOpacity style={styles.startBtn} onPress={startCycle}>
                  <Text style={styles.startBtnText}>Start Cycle Tonight</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{totalDays}</Text>
                    <Text style={styles.statLabel}>Days In</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{totalCycles}</Text>
                    <Text style={styles.statLabel}>Full Cycles</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: nightInfo.color }]}>N{currentNight}</Text>
                    <Text style={styles.statLabel}>Tonight</Text>
                  </View>
                </View>

                <Text style={styles.trackerDateLabel}>Started: {formatDate(cycleState.startDate)}</Text>

                {/* 4-night dot progress */}
                <View style={styles.cycleRow}>
                  {CYCLE_NIGHTS.map((n, i) => (
                    <View key={i} style={styles.cycleNightBlock}>
                      <View style={[
                        styles.cycleNightDot,
                        { backgroundColor: currentNight === n.day ? n.color : Colors.border },
                        currentNight === n.day && { borderWidth: 2, borderColor: n.color },
                      ]}>
                        <Text style={styles.cycleNightDotText}>{n.icon}</Text>
                      </View>
                      <Text style={[styles.cycleNightLabel, currentNight === n.day && { color: n.color }]}>
                        N{n.day}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.cycleLine} />
                </View>

                <LinearGradient colors={[nightInfo.color + '33', '#0A0A0F']} style={styles.tonightCard}>
                  <Text style={styles.tonightLabel}>TONIGHT IS</Text>
                  <Text style={styles.tonightIcon}>{nightInfo.icon}</Text>
                  <Text style={[styles.tonightName, { color: nightInfo.color }]}>{nightInfo.name}</Text>
                  <Text style={styles.tonightDesc}>{nightInfo.description}</Text>

                  <View style={styles.tonightSteps}>
                    {nightInfo.steps.map((s, i) => (
                      <View key={i} style={styles.tonightStep}>
                        <Text style={[styles.tonightStepNum, { color: nightInfo.color }]}>{i + 1}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tonightStepName}>{s.step}</Text>
                          <Text style={styles.tonightStepDetail}>{s.detail}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  <View style={styles.tonightTallow}>
                    <Text style={styles.tonightTallowTitle}>🌿 Tallow Tonight</Text>
                    <Text style={styles.tonightTallowText}>{nightInfo.tallowNote}</Text>
                  </View>
                </LinearGradient>

                <Text style={styles.upNextLabel}>Up Next</Text>
                {CYCLE_NIGHTS.filter(n => n.day !== currentNight).map(n => (
                  <View key={n.day} style={styles.upNextCard}>
                    <Text style={[styles.upNextIcon, { color: n.color }]}>{n.icon}</Text>
                    <Text style={styles.upNextName}>{n.name}</Text>
                    <Text style={styles.upNextDay}>N{n.day}</Text>
                  </View>
                ))}

                <TouchableOpacity style={styles.resetBtn} onPress={resetCycle}>
                  <Text style={styles.resetBtnText}>Reset Cycle to Tonight</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  hero: {
    borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.purple + '33', alignItems: 'center',
  },
  heroEmoji: { fontSize: 36, marginBottom: 6 },
  heroTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 6 },
  heroSub: { color: Colors.textSecondary, fontSize: 13 },
  howItWorksCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
  },
  howTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 8 },
  howText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 21 },
  nightCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 14,
  },
  nightHeader: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  nightNum: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  nightNumText: { fontSize: 13, fontWeight: '800' },
  nightIcon: { fontSize: 14, marginBottom: 2 },
  nightName: { fontWeight: '700' },
  nightDesc: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  nightSteps: { gap: 8, marginBottom: 12 },
  nightStep: { flexDirection: 'row', gap: 10 },
  stepNum: { fontSize: 13, fontWeight: '800', width: 16 },
  stepName: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  stepDetail: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  tallowNoteCard: {
    backgroundColor: Colors.primary + '15', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: Colors.primary + '33', marginBottom: 10,
  },
  tallowNoteTitle: { color: Colors.primary, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  tallowNoteText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  warningsBlock: { gap: 4 },
  warningItem: { color: Colors.textMuted, fontSize: 12 },
  // Tracker
  startBlock: { alignItems: 'center', paddingVertical: 40 },
  startEmoji: { fontSize: 52, marginBottom: 16 },
  startTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 10 },
  startText: {
    color: Colors.textSecondary, fontSize: 14, lineHeight: 22,
    textAlign: 'center', paddingHorizontal: 20, marginBottom: 24,
  },
  startBtn: {
    backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 14,
  },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { color: Colors.gold, fontSize: 24, fontWeight: '900', marginBottom: 2 },
  statLabel: { color: Colors.textMuted, fontSize: 11 },
  trackerDateLabel: { color: Colors.textMuted, fontSize: 12, marginBottom: 16, textAlign: 'center' },
  cycleRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: Colors.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
    position: 'relative',
  },
  cycleNightBlock: { alignItems: 'center', gap: 6 },
  cycleNightDot: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  cycleNightDotText: { fontSize: 20 },
  cycleNightLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
  cycleLine: {
    position: 'absolute', top: 37, left: 48, right: 48, height: 2,
    backgroundColor: Colors.border,
    zIndex: -1,
  },
  tonightCard: {
    borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  tonightLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  tonightIcon: { fontSize: 32, marginBottom: 4 },
  tonightName: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  tonightDesc: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 14 },
  tonightSteps: { gap: 10, marginBottom: 14 },
  tonightStep: { flexDirection: 'row', gap: 10 },
  tonightStepNum: { fontSize: 14, fontWeight: '800', width: 18 },
  tonightStepName: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  tonightStepDetail: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  tonightTallow: {
    backgroundColor: Colors.primary + '20', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: Colors.primary + '44',
  },
  tonightTallowTitle: { color: Colors.primary, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  tonightTallowText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  upNextLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  upNextCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 6,
  },
  upNextIcon: { fontSize: 18 },
  upNextName: { flex: 1, color: Colors.textSecondary, fontSize: 13 },
  upNextDay: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  resetBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
  resetBtnText: { color: Colors.textMuted, fontSize: 13 },
});
