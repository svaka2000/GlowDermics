import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Animated,
} from 'react-native';
import { router } from 'expo-router';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

function shimColors(c: Palette) {
  return {
    bg: c.bg, card: c.bgCard, cardAlt: c.bgElevated, border: c.border,
    primary: c.primary, gold: c.gold, textPrimary: c.textPrimary,
    textSecondary: c.textSecondary, textMuted: c.textMuted,
    green: c.scoreGood, red: c.scorePoor, blue: c.hydration, cyan: '#22D3EE',
  };
}

const TABS = [
  { id: 'science', label: 'Science', icon: '🔬' },
  { id: 'rolling', label: 'Ice Rolling', icon: '🧊' },
  { id: 'shower', label: 'Cold Shower', icon: '🚿' },
];

const SCIENCE_CARDS = [
  {
    title: 'Vasoconstriction & dilation cycle',
    content: 'Cold causes blood vessels to constrict. When you warm up after, vessels dilate and blood rushes back — this pumping action increases circulation, delivering oxygen and nutrients to skin cells. Repeated cycles strengthen vessel walls over time.',
  },
  {
    title: 'Reduces puffiness and inflammation',
    content: 'Cold temperatures cause immediate lymphatic constriction, reducing fluid buildup (puffiness). It also inhibits pro-inflammatory prostaglandins, making it effective for morning puffiness, post-exercise redness, and inflammatory skin conditions.',
  },
  {
    title: 'Tightens pore appearance',
    content: 'Cold causes temporary constriction of follicle openings, giving a tightened appearance. This is temporary (not permanent), but useful for pre-event skin prep or reducing redness before going out.',
  },
  {
    title: 'Collagen stimulation',
    content: 'Repeated cold exposure triggers production of collagen-supporting proteins as part of the thermal adaptation response. This is a long-term benefit requiring consistent practice — not a one-time effect.',
  },
  {
    title: 'Wim Hof and the skin connection',
    content: "Research on cold exposure practitioners shows significantly reduced systemic inflammation markers. Since many skin conditions (acne, eczema, rosacea) are inflammatory in nature, cold therapy's anti-inflammatory systemic effects are relevant beyond the skin surface.",
  },
  {
    title: 'Tallow + cold therapy synergy',
    content: "Apply tallow AFTER cold therapy, not before. The improved circulation from cold exposure enhances transdermal penetration. Your skin is warmed from within and blood flow is maximized — the ideal state for tallow's fatty acids to penetrate.",
  },
];

const ICE_ROLLING_ZONES = [
  { zone: 'Forehead', direction: 'Side to side across forehead', time: 30, benefit: 'Reduces morning puffiness, tension headaches' },
  { zone: 'Under-eyes', direction: 'Gently inward to outward (never pressing hard)', time: 30, benefit: 'Reduces dark circles and eye puffiness' },
  { zone: 'Cheeks', direction: 'Upward and outward from nose to ears', time: 45, benefit: 'Lymphatic drainage, lifts and tones' },
  { zone: 'Nose & T-zone', direction: 'Down the nose, out along brow', time: 20, benefit: 'Reduces redness, minimizes pore appearance' },
  { zone: 'Jawline', direction: 'Upward from chin to ear, both sides', time: 40, benefit: 'Defines jawline, reduces tension' },
  { zone: 'Neck (downward)', direction: 'Neck downward toward collarbone', time: 30, benefit: 'Drains lymph to lymph nodes, reduces facial puffiness' },
];

const COLD_SHOWER_PROTOCOL = [
  {
    phase: 'Warm Start',
    duration: 180,
    instruction: 'Shower at normal warm temperature to open pores and relax muscles.',
    tip: 'Do your normal shower routine here — shampoo, body wash, etc.',
  },
  {
    phase: 'Preparation',
    duration: 30,
    instruction: 'Begin reducing water temperature gradually. Mentally prepare.',
    tip: 'Breathe deeply. The anticipation is often worse than the actual cold.',
  },
  {
    phase: 'Cold Exposure — Phase 1',
    duration: 30,
    instruction: 'Turn to cold. Face the cold water on your back first.',
    tip: 'Controlled breathing. Inhale deeply, exhale slowly. Do not hold your breath.',
  },
  {
    phase: 'Cold Exposure — Phase 2',
    duration: 30,
    instruction: 'Rotate to expose chest and front body.',
    tip: 'The gasp reflex will slow. Your breathing will normalize.',
  },
  {
    phase: 'Face & Neck',
    duration: 20,
    instruction: 'Tilt your face into the cold stream. Neck included.',
    tip: 'This is where the skin benefit is most concentrated. Hold steady.',
  },
  {
    phase: 'Final Push',
    duration: 30,
    instruction: 'Full body cold. You made it this far — finish strong.',
    tip: 'If advanced: full submersion. If beginner: feet and lower body is enough.',
  },
  {
    phase: 'Done!',
    duration: 0,
    instruction: 'Turn off water. Pat dry gently (do not rub). Apply tallow immediately while skin is cold.',
    tip: 'The post-cold warmup state is when circulation peaks. Perfect timing for tallow application.',
  },
];

export default function ColdTherapyScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [activeTab, setActiveTab] = useState('science');
  const [rollingActive, setRollingActive] = useState(false);
  const [currentZone, setCurrentZone] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showerActive, setShowerActive] = useState(false);
  const [showerPhase, setShowerPhase] = useState(0);
  const [showerTimeLeft, setShowerTimeLeft] = useState(0);

  const rollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const showerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const startRolling = () => {
    setCurrentZone(0);
    setTimeLeft(ICE_ROLLING_ZONES[0].time);
    setRollingActive(true);
    startPulse();
  };

  useEffect(() => {
    if (!rollingActive) {
      if (rollingInterval.current) clearInterval(rollingInterval.current);
      return;
    }
    rollingInterval.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCurrentZone(z => {
            if (z + 1 >= ICE_ROLLING_ZONES.length) {
              setRollingActive(false);
              stopPulse();
              clearInterval(rollingInterval.current!);
              return z;
            }
            setTimeLeft(ICE_ROLLING_ZONES[z + 1].time);
            return z + 1;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (rollingInterval.current) clearInterval(rollingInterval.current); };
  }, [rollingActive]);

  const startShower = () => {
    setShowerPhase(0);
    setShowerTimeLeft(COLD_SHOWER_PROTOCOL[0].duration);
    setShowerActive(true);
    startPulse();
  };

  useEffect(() => {
    if (!showerActive) {
      if (showerInterval.current) clearInterval(showerInterval.current);
      return;
    }
    showerInterval.current = setInterval(() => {
      setShowerTimeLeft(prev => {
        if (prev <= 1) {
          setShowerPhase(p => {
            if (p + 1 >= COLD_SHOWER_PROTOCOL.length) {
              setShowerActive(false);
              stopPulse();
              clearInterval(showerInterval.current!);
              return p;
            }
            setShowerTimeLeft(COLD_SHOWER_PROTOCOL[p + 1].duration);
            return p + 1;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (showerInterval.current) clearInterval(showerInterval.current); };
  }, [showerActive]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const currentZoneInfo = ICE_ROLLING_ZONES[currentZone];
  const currentShowerPhase = COLD_SHOWER_PROTOCOL[showerPhase];
  const isLastShowerPhase = showerPhase === COLD_SHOWER_PROTOCOL.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cold Therapy</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabChip, activeTab === t.id && styles.tabChipActive]}
              onPress={() => setActiveTab(t.id)}
            >
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === t.id && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {activeTab === 'science' && SCIENCE_CARDS.map((card, i) => (
          <View key={i} style={styles.scienceCard}>
            <Text style={styles.scienceTitle}>{card.title}</Text>
            <Text style={styles.scienceContent}>{card.content}</Text>
          </View>
        ))}

        {activeTab === 'rolling' && (
          <>
            <View style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>🧊 Ice Rolling Guide</Text>
              <Text style={styles.instructionText}>
                Store your ice roller in the freezer. Use it on clean skin — AM for depuffing, PM after serums for better penetration.
                Always roll upward and outward (toward lymph nodes). Never drag down.
              </Text>
            </View>

            {!rollingActive ? (
              <>
                {ICE_ROLLING_ZONES.map((zone, i) => (
                  <View key={i} style={styles.zoneCard}>
                    <View style={styles.zoneLeft}>
                      <Text style={styles.zoneName}>{zone.zone}</Text>
                      <Text style={styles.zoneDir}>{zone.direction}</Text>
                      <Text style={styles.zoneBenefit}>{zone.benefit}</Text>
                    </View>
                    <View style={styles.zoneTime}>
                      <Text style={styles.zoneTimeNum}>{zone.time}s</Text>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={styles.startSessionBtn} onPress={startRolling}>
                  <Text style={styles.startSessionBtnText}>🧊 Start Guided Session</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.activeSession}>
                <Animated.View style={[styles.timerRing, { transform: [{ scale: pulseAnim }], borderColor: Colors.cyan }]}>
                  <Text style={styles.timerNum}>{timeLeft}s</Text>
                  <Text style={styles.timerLabel}>{currentZoneInfo.zone}</Text>
                </Animated.View>
                <Text style={styles.activeDirection}>{currentZoneInfo.direction}</Text>
                <Text style={styles.activeBenefit}>{currentZoneInfo.benefit}</Text>
                <View style={styles.zoneProgress}>
                  {ICE_ROLLING_ZONES.map((_, i) => (
                    <View key={i} style={[styles.zoneDot, i === currentZone && { backgroundColor: Colors.cyan }, i < currentZone && { backgroundColor: Colors.green }]} />
                  ))}
                </View>
                <Text style={styles.zoneProgressLabel}>Zone {currentZone + 1} of {ICE_ROLLING_ZONES.length}</Text>
                <TouchableOpacity onPress={() => { setRollingActive(false); stopPulse(); }}>
                  <Text style={styles.stopBtn}>Stop Session</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {activeTab === 'shower' && (
          <>
            <View style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>🚿 Cold Shower Protocol</Text>
              <Text style={styles.instructionText}>
                Beginner: 30 seconds cold at the end. Advanced: 2+ minutes. Total cold exposure time is cumulative — consistency matters more than duration.
                {'\n\n'}Always start warm and transition to cold. Never start cold (thermal shock risk).
              </Text>
            </View>

            {!showerActive ? (
              <>
                {COLD_SHOWER_PROTOCOL.map((phase, i) => (
                  <View key={i} style={styles.phaseCard}>
                    <View style={styles.phaseNum}>
                      <Text style={styles.phaseNumText}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.phaseHeader}>
                        <Text style={styles.phaseName}>{phase.phase}</Text>
                        {phase.duration > 0 && <Text style={styles.phaseDuration}>{formatTime(phase.duration)}</Text>}
                      </View>
                      <Text style={styles.phaseInstruction}>{phase.instruction}</Text>
                      <Text style={styles.phaseTip}>💡 {phase.tip}</Text>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={styles.startSessionBtn} onPress={startShower}>
                  <Text style={styles.startSessionBtnText}>🚿 Start Guided Protocol</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.activeSession}>
                <Animated.View style={[
                  styles.timerRing,
                  { transform: [{ scale: pulseAnim }], borderColor: isLastShowerPhase ? Colors.green : Colors.blue },
                ]}>
                  {!isLastShowerPhase ? (
                    <>
                      <Text style={styles.timerNum}>{formatTime(showerTimeLeft)}</Text>
                      <Text style={styles.timerLabel}>{currentShowerPhase.phase}</Text>
                    </>
                  ) : (
                    <Text style={styles.timerNum}>✓</Text>
                  )}
                </Animated.View>
                <Text style={styles.activeDirection}>{currentShowerPhase.instruction}</Text>
                <Text style={styles.activeBenefit}>💡 {currentShowerPhase.tip}</Text>
                <View style={styles.zoneProgress}>
                  {COLD_SHOWER_PROTOCOL.slice(0, -1).map((_, i) => (
                    <View key={i} style={[styles.zoneDot, i === showerPhase && { backgroundColor: Colors.blue }, i < showerPhase && { backgroundColor: Colors.green }]} />
                  ))}
                </View>
                {!isLastShowerPhase && (
                  <TouchableOpacity onPress={() => { setShowerActive(false); stopPulse(); }}>
                    <Text style={styles.stopBtn}>Stop Protocol</Text>
                  </TouchableOpacity>
                )}
                {isLastShowerPhase && (
                  <TouchableOpacity style={styles.doneBtn} onPress={() => setShowerActive(false)}>
                    <Text style={styles.doneBtnText}>Session Complete ✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: Palette) {
  const Colors = shimColors(c);
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  backText: { color: Colors.primary, fontSize: 16 },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  tabBar: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabChipActive: { borderColor: Colors.cyan, backgroundColor: Colors.cyan + '22' },
  tabIcon: { fontSize: 13 },
  tabLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: Colors.cyan },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  scienceCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  scienceTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  scienceContent: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  instructionCard: {
    backgroundColor: Colors.cyan + '15', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.cyan + '44', marginBottom: 16,
  },
  instructionTitle: { color: Colors.cyan, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  instructionText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  zoneCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  zoneLeft: { flex: 1 },
  zoneName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 3 },
  zoneDir: { color: Colors.textSecondary, fontSize: 12, marginBottom: 3 },
  zoneBenefit: { color: Colors.textMuted, fontSize: 11, fontStyle: 'italic' },
  zoneTime: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.cyan + '22', borderWidth: 1, borderColor: Colors.cyan,
    alignItems: 'center', justifyContent: 'center',
  },
  zoneTimeNum: { color: Colors.cyan, fontSize: 12, fontWeight: '700' },
  startSessionBtn: {
    backgroundColor: Colors.cyan + '22', borderWidth: 1, borderColor: Colors.cyan,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  startSessionBtnText: { color: Colors.cyan, fontSize: 15, fontWeight: '700' },
  activeSession: { alignItems: 'center', paddingVertical: 20 },
  timerRing: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 4, backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  timerNum: { color: Colors.textPrimary, fontSize: 36, fontWeight: '900' },
  timerLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  activeDirection: {
    color: Colors.textPrimary, fontSize: 15, fontWeight: '600', textAlign: 'center',
    paddingHorizontal: 20, marginBottom: 8,
  },
  activeBenefit: {
    color: Colors.textSecondary, fontSize: 13, textAlign: 'center',
    paddingHorizontal: 20, marginBottom: 20,
  },
  zoneProgress: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  zoneDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.border },
  zoneProgressLabel: { color: Colors.textMuted, fontSize: 12, marginBottom: 20 },
  stopBtn: { color: Colors.textMuted, fontSize: 14, paddingVertical: 10 },
  phaseCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  phaseNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.blue + '22', alignItems: 'center', justifyContent: 'center',
  },
  phaseNumText: { color: Colors.blue, fontSize: 13, fontWeight: '700' },
  phaseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  phaseName: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', flex: 1 },
  phaseDuration: { color: Colors.blue, fontSize: 13, fontWeight: '700' },
  phaseInstruction: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 4 },
  phaseTip: { color: Colors.textMuted, fontSize: 11, lineHeight: 16 },
  doneBtn: {
    backgroundColor: Colors.green + '22', borderWidth: 1, borderColor: Colors.green,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 10,
  },
  doneBtnText: { color: Colors.green, fontSize: 15, fontWeight: '700' },
  });
}
