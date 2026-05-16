import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, Animated, Easing,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

const LOG_KEY = 'gd_hormonal_log';
const CYCLE_KEY = 'gd_cycle_start';

type PhaseEntry = {
  date: string;
  phase: string;
  skinState: string[];
  notes: string;
};

function buildPhases(c: Palette) {
  return [
  {
    id: 'menstrual',
    label: 'Menstrual',
    days: 'Days 1-5',
    emoji: '🔴',
    color: '#EF4444',
    desc: 'Estrogen & progesterone drop. Skin may be dull, sensitive.',
    skinTips: ['Use calming, minimal products', 'Avoid actives (AHA, retinol)', 'Apply extra tallow for barrier support', 'Stay hydrated'],
  },
  {
    id: 'follicular',
    label: 'Follicular',
    days: 'Days 6-13',
    emoji: '🌱',
    color: '#22C55E',
    desc: 'Estrogen rises. Skin glows, is less oily, heals faster.',
    skinTips: ['Great time for light exfoliation', 'Introduce new products now', 'Vitamin C works well', 'Enjoy the glow!'],
  },
  {
    id: 'ovulation',
    label: 'Ovulation',
    days: 'Days 14-17',
    emoji: '✨',
    color: c.gold,
    desc: 'Estrogen peaks. Skin is at its most radiant and even-toned.',
    skinTips: ['Peak glow — great for photos', 'You may be more sensitive to sun', 'Light, airy products work best'],
  },
  {
    id: 'luteal',
    label: 'Luteal',
    days: 'Days 18-28',
    emoji: '🌙',
    color: '#6B85A8',
    desc: 'Progesterone rises, then drops. Increased oil, pore visibility, and breakouts.',
    skinTips: ['Prioritize anti-inflammatory ingredients', 'Tallow balm helps with breakout inflammation', 'Avoid heavy makeup', 'Zinc & B6 can help hormonally'],
  },
  ];
}

const SKIN_STATES = [
  'Glowing', 'Clear', 'Oily', 'Dry', 'Dull', 'Sensitive',
  'Breaking out', 'Cystic', 'Congested', 'Redness', 'Even tone', 'Puffy',
];

function getTodayStr() {
  return new Date().toDateString();
}

function getDayOfCycle(cycleStartStr: string | null): number | null {
  if (!cycleStartStr) return null;
  const start = new Date(cycleStartStr);
  const today = new Date();
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return (diff % 28) + 1;
}

function getPhaseFromDay(day: number, PHASES: ReturnType<typeof buildPhases>) {
  if (day <= 5) return PHASES[0];
  if (day <= 13) return PHASES[1];
  if (day <= 17) return PHASES[2];
  return PHASES[3];
}

export default function HormonalLog() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const PHASES = useMemo(() => buildPhases(colors), [colors]);
  const [log, setLog] = useState<PhaseEntry[]>([]);
  const [cycleStart, setCycleStart] = useState<string | null>(null);
  const [settingCycle, setSettingCycle] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState('');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    headerAnim.setValue(0);
    contentAnim.setValue(0);
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    load();
  }, []));

  const load = async () => {
    const [rawLog, startStr] = await Promise.all([
      AsyncStorage.getItem(LOG_KEY),
      AsyncStorage.getItem(CYCLE_KEY),
    ]);
    const entries: PhaseEntry[] = rawLog ? JSON.parse(rawLog) : [];
    setLog(entries);
    setCycleStart(startStr);

    const today = getTodayStr();
    const todayEntry = entries.find(e => e.date === today);
    if (todayEntry) {
      setSelectedPhase(todayEntry.phase);
      setSelectedStates(todayEntry.skinState);
      setNotes(todayEntry.notes);
      setSaved(true);
    } else if (startStr) {
      const day = getDayOfCycle(startStr);
      if (day) setSelectedPhase(getPhaseFromDay(day, PHASES).id);
    }
  };

  const saveEntry = async () => {
    if (!selectedPhase) return;
    const today = getTodayStr();
    const entry: PhaseEntry = {
      date: today,
      phase: selectedPhase,
      skinState: selectedStates,
      notes: notes.trim(),
    };
    const updated = [entry, ...log.filter(e => e.date !== today)].slice(0, 90);
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(updated));
    setLog(updated);
    setSaved(true);
  };

  const startCycleToday = async () => {
    const today = new Date().toISOString();
    await AsyncStorage.setItem(CYCLE_KEY, today);
    setCycleStart(today);
    setSelectedPhase('menstrual');
    setSettingCycle(false);
  };

  const toggleState = (s: string) => {
    setSelectedStates(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
    setSaved(false);
  };

  const dayOfCycle = getDayOfCycle(cycleStart);
  const currentPhase = dayOfCycle ? getPhaseFromDay(dayOfCycle, PHASES) : null;

  // Pattern analysis: most common skin state per phase
  const phaseSkinMap: Record<string, Record<string, number>> = {};
  for (const entry of log) {
    if (!phaseSkinMap[entry.phase]) phaseSkinMap[entry.phase] = {};
    for (const s of entry.skinState) {
      phaseSkinMap[entry.phase][s] = (phaseSkinMap[entry.phase][s] ?? 0) + 1;
    }
  }

  const getTopStates = (phaseId: string) => {
    const map = phaseSkinMap[phaseId] ?? {};
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => s);
  };

  const selectedPhaseObj = PHASES.find(p => p.id === selectedPhase);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
        }]}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Hormonal Skin Log</Text>
            <Text style={styles.headerSub}>Cycle → skin pattern tracker</Text>
          </View>
          <View style={{ width: 36 }} />
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ opacity: contentAnim }}>

        {/* Cycle day card */}
        {cycleStart && dayOfCycle && currentPhase ? (
          <View style={styles.cycleCard}>
            <LinearGradient
              colors={[`${currentPhase.color}18`, `${currentPhase.color}05`]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cycleDayRow}>
              <View style={[styles.cycleDayBadge, { borderColor: currentPhase.color }]}>
                <Text style={[styles.cycleDayNum, { color: currentPhase.color }]}>Day {dayOfCycle}</Text>
              </View>
              <Pressable onPress={() => setSettingCycle(true)}>
                <Text style={styles.resetLink}>Reset cycle</Text>
              </Pressable>
            </View>
            <View style={styles.phaseRow}>
              <Text style={styles.phaseEmoji}>{currentPhase.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.phaseName, { color: currentPhase.color }]}>{currentPhase.label} Phase</Text>
                <Text style={styles.phaseDays}>{currentPhase.days}</Text>
              </View>
            </View>
            <Text style={styles.phaseDesc}>{currentPhase.desc}</Text>
          </View>
        ) : (
          <View style={styles.startCycleCard}>
            <Text style={styles.startCycleTitle}>Set Your Cycle Start</Text>
            <Text style={styles.startCycleDesc}>
              Tell us when your last period started so we can track your skin patterns through each phase.
            </Text>
            {settingCycle ? (
              <Pressable style={[styles.startCycleBtn, { backgroundColor: '#EF4444' }]} onPress={startCycleToday}>
                <Text style={styles.startCycleBtnText}>My period started today</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.startCycleBtn} onPress={() => setSettingCycle(true)}>
                <Text style={styles.startCycleBtnText}>Set cycle start date</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Today's log */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Today's Entry</Text>
            {saved && (
              <View style={styles.savedBadge}>
                <Ionicons name="checkmark" size={12} color="#4ADE80" />
                <Text style={styles.savedText}>Saved</Text>
              </View>
            )}
          </View>

          <Text style={styles.fieldLabel}>Phase</Text>
          <View style={styles.phaseGrid}>
            {PHASES.map(p => (
              <Pressable
                key={p.id}
                style={[styles.phaseChip, selectedPhase === p.id && { backgroundColor: `${p.color}20`, borderColor: p.color }]}
                onPress={() => { setSelectedPhase(p.id); setSaved(false); }}
              >
                <Text style={styles.phaseChipEmoji}>{p.emoji}</Text>
                <Text style={[styles.phaseChipLabel, { color: selectedPhase === p.id ? p.color : colors.textMuted }]}>{p.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Skin Today</Text>
          <View style={styles.stateGrid}>
            {SKIN_STATES.map(s => (
              <Pressable
                key={s}
                style={[styles.stateChip, selectedStates.includes(s) && styles.stateChipActive]}
                onPress={() => toggleState(s)}
              >
                <Text style={[styles.stateChipText, selectedStates.includes(s) && { color: colors.primary }]}>{s}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="How's your skin feeling today? Any triggers?"
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={v => { setNotes(v); setSaved(false); }}
            multiline
            numberOfLines={3}
            maxLength={300}
          />

          <Pressable
            style={[styles.saveBtn, saved && styles.saveBtnSaved, !selectedPhase && { opacity: 0.5 }]}
            onPress={saveEntry}
            disabled={!selectedPhase}
          >
            {saved
              ? <><Ionicons name="checkmark-circle" size={18} color="#4ADE80" /><Text style={[styles.saveBtnText, { color: '#4ADE80' }]}>Saved</Text></>
              : <Text style={styles.saveBtnText}>Save Today's Entry</Text>
            }
          </Pressable>
        </View>

        {/* Phase skin tips */}
        {selectedPhaseObj && (
          <View style={styles.tipsCard}>
            <LinearGradient colors={[`${selectedPhaseObj.color}15`, `${selectedPhaseObj.color}05`]} style={StyleSheet.absoluteFill} />
            <Text style={[styles.cardTitle, { color: selectedPhaseObj.color }]}>
              {selectedPhaseObj.emoji} {selectedPhaseObj.label} Phase Tips
            </Text>
            {selectedPhaseObj.skinTips.map((t, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={[styles.tipDot, { backgroundColor: selectedPhaseObj.color }]} />
                <Text style={styles.tipText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Pattern insights */}
        {log.length >= 8 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Skin Patterns</Text>
            {PHASES.map(p => {
              const topStates = getTopStates(p.id);
              if (topStates.length === 0) return null;
              return (
                <View key={p.id} style={styles.patternRow}>
                  <Text style={styles.patternPhaseEmoji}>{p.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.patternPhaseName, { color: p.color }]}>{p.label}</Text>
                    <Text style={styles.patternStates}>{topStates.join(' · ')}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Cycle phases guide */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cycle → Skin Guide</Text>
          {PHASES.map(p => (
            <View key={p.id} style={styles.guideRow}>
              <View style={[styles.guideEmojiBadge, { backgroundColor: `${p.color}18` }]}>
                <Text style={{ fontSize: 16 }}>{p.emoji}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.guideTopRow}>
                  <Text style={[styles.guideName, { color: p.color }]}>{p.label}</Text>
                  <Text style={styles.guideDays}>{p.days}</Text>
                </View>
                <Text style={styles.guideDesc}>{p.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
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
  scroll: { paddingHorizontal: 16 },

  cycleCard: {
    borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: c.border,
    padding: 16, gap: 10, marginBottom: 14,
  },
  cycleDayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cycleDayBadge: { borderWidth: 2, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  cycleDayNum: { fontSize: 16, fontWeight: '900' },
  resetLink: { fontSize: 12, color: c.textMuted, textDecorationLine: 'underline' },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  phaseEmoji: { fontSize: 28 },
  phaseName: { fontSize: 18, fontWeight: '800' },
  phaseDays: { fontSize: 12, color: c.textMuted, fontWeight: '600', marginTop: 1 },
  phaseDesc: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  startCycleCard: {
    backgroundColor: c.bgCard, borderRadius: 18, borderWidth: 1, borderColor: c.border,
    padding: 20, gap: 10, marginBottom: 14, alignItems: 'center',
  },
  startCycleTitle: { fontSize: 16, fontWeight: '800', color: c.textPrimary },
  startCycleDesc: { fontSize: 13, color: c.textMuted, textAlign: 'center', lineHeight: 20 },
  startCycleBtn: {
    backgroundColor: c.primary, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, marginTop: 4,
  },
  startCycleBtnText: { fontSize: 14, fontWeight: '700', color: c.white },

  card: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border,
    padding: 16, gap: 10, marginBottom: 14,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  savedText: { fontSize: 11, fontWeight: '700', color: '#4ADE80' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },

  phaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  phaseChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated,
  },
  phaseChipEmoji: { fontSize: 14 },
  phaseChipLabel: { fontSize: 12, fontWeight: '700' },

  stateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stateChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated,
  },
  stateChipActive: { borderColor: c.primary, backgroundColor: `${c.primary}15` },
  stateChipText: { fontSize: 12, fontWeight: '600', color: c.textMuted },

  notesInput: {
    backgroundColor: c.bgElevated, borderRadius: 12,
    borderWidth: 1, borderColor: c.border,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: c.textPrimary, minHeight: 80,
    textAlignVertical: 'top',
  },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 48, borderRadius: 12, backgroundColor: c.primary,
  },
  saveBtnSaved: { backgroundColor: 'rgba(74,222,128,0.08)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: c.white },

  tipsCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: c.border,
    padding: 16, gap: 10, marginBottom: 14,
  },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  tipText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  patternRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  patternPhaseEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  patternPhaseName: { fontSize: 12, fontWeight: '800' },
  patternStates: { fontSize: 12, color: c.textMuted, marginTop: 2 },

  guideRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  guideEmojiBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  guideTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  guideName: { fontSize: 13, fontWeight: '800' },
  guideDays: { fontSize: 11, color: c.textMuted },
  guideDesc: { fontSize: 12, color: c.textMuted, lineHeight: 18 },
  });
}
