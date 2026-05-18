import { useState, useCallback, useMemo } from 'react';
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

const DETOX_KEY = 'gd_skin_detox';

type DetoxProtocol = {
  id: string;
  name: string;
  emoji: string;
  duration: string;
  days: number;
  color: string;
  tagline: string;
  idealFor: string[];
  whatToExpect: string;
  phases: {
    name: string;
    dayRange: string;
    description: string;
    allowed: string[];
    notAllowed: string[];
  }[];
  tallowRole: string;
};

type ActiveDetox = {
  protocolId: string;
  startDate: string;
  checkIns: string[]; // dates completed
};

function buildProtocols(c: Palette): DetoxProtocol[] {
  return [
  {
    id: 'purge-7',
    name: '7-Day Skin Purge Reset',
    emoji: '🌿',
    duration: '7 days',
    days: 7,
    color: '#4ADE80',
    tagline: 'Strip back to essentials and let your skin breathe',
    idealFor: ['Overloaded skin from too many products', 'Persistent breakouts despite complex routines', 'Skin that\'s become "addicted" to products', 'Post-travel or post-holiday skin'],
    whatToExpect: 'Days 1-3: Skin may look worse as it adjusts. Days 4-5: Redness subsides. Days 6-7: Natural glow returns, pores look smaller.',
    phases: [
      {
        name: 'Cold Turkey',
        dayRange: 'Days 1-3',
        description: 'Stop everything except the absolute minimum. Give your skin no external signals except water and tallow.',
        allowed: ['Lukewarm water rinse (no cleanser)', 'TallowDermics Balm morning and night', 'Plain zinc oxide SPF (morning only)', 'Plenty of water internally'],
        notAllowed: ['All serums', 'All actives', 'All exfoliants', 'All toners', 'Any makeup if possible', 'Hot showers'],
      },
      {
        name: 'Stabilization',
        dayRange: 'Days 4-7',
        description: 'Continue minimal approach. If skin is stable by day 4, add back one gentle cleanser in the evening only.',
        allowed: ['Water rinse (AM)', 'Gentle oil or cream cleanser (PM only)', 'TallowDermics Balm', 'Zinc SPF'],
        notAllowed: ['Actives', 'Exfoliants', 'Multiple products', 'Fragrance'],
      },
    ],
    tallowRole: 'Tallow is the hero ingredient of this protocol. It provides barrier repair, anti-inflammatory CLA, and all necessary lipids — in a single, clean ingredient. It\'s the only "treatment" you need during the detox.',
  },
  {
    id: 'barrier-14',
    name: '14-Day Barrier Repair Protocol',
    emoji: '🛡️',
    duration: '14 days',
    days: 14,
    color: c.primary,
    tagline: 'Systematically rebuild a damaged skin barrier',
    idealFor: ['Skin that stings or burns with products', 'Chronic redness or sensitization', 'Over-exfoliated or over-treated skin', 'Eczema or seborrheic dermatitis flares'],
    whatToExpect: 'Week 1: Reduction in stinging and burning. Week 2: Visible reduction in redness, skin feels more comfortable. Post-protocol: Dramatically improved tolerance for actives.',
    phases: [
      {
        name: 'Emergency Rest',
        dayRange: 'Days 1-7',
        description: 'Complete barrier repair mode. No exceptions — skin is in recovery.',
        allowed: ['Micellar water or water-only cleanse', 'TallowDermics Balm (twice daily, generously)', 'Mineral SPF only (zinc oxide)', 'Ceramide-based cream (optional, fragrance-free)'],
        notAllowed: ['ALL actives (vitamin C, retinol, AHA, BHA, niacinamide)', 'Any exfoliation', 'Fragrance', 'Alcohol-based products', 'Foaming cleansers', 'Hot water'],
      },
      {
        name: 'Careful Rebuild',
        dayRange: 'Days 8-14',
        description: 'Slowly add back the gentlest possible ingredients if skin is responding well.',
        allowed: ['Gentle pH-balanced cleanser (PM)', 'TallowDermics Balm', 'Zinc SPF', 'Niacinamide 4% (only if no reaction by day 10)'],
        notAllowed: ['Retinol', 'AHA/BHA', 'Vitamin C', 'Benzoyl peroxide', 'Fragrance', 'Essential oils'],
      },
    ],
    tallowRole: 'Tallow is the cornerstone of barrier repair. Its fatty acid profile fills the structural gaps in a damaged stratum corneum while CLA suppresses the inflammation that\'s preventing repair. Apply generously, multiple times daily in severe cases.',
  },
  {
    id: 'minimal-30',
    name: '30-Day Minimalist Challenge',
    emoji: '⚡',
    duration: '30 days',
    days: 30,
    color: c.gold,
    tagline: 'Discover what your skin actually needs (vs what you think it needs)',
    idealFor: ['Anyone wanting to simplify', 'Those spending too much on skincare', 'Figuring out which products are actually working', 'Building a sustainable long-term routine'],
    whatToExpect: 'Weeks 1-2: Adjustment period, skin may crave products. Week 3: Skin\'s natural rhythm restores. Week 4: Clear picture of what\'s actually necessary.',
    phases: [
      {
        name: 'Foundation Week',
        dayRange: 'Days 1-7',
        description: 'Reduce to maximum 4 products total. No exceptions, no "just this one" additions.',
        allowed: ['Cleanser (1 product)', 'TallowDermics Balm', 'SPF', 'One treatment serum (your most important one)'],
        notAllowed: ['Toners', 'Essences', 'Multiple serums', 'Eye cream (tallow covers this)', 'Mask more than once'],
      },
      {
        name: 'Evaluation',
        dayRange: 'Days 8-21',
        description: 'Note how skin looks and feels. Take weekly scans in Velumi AI to track objectively.',
        allowed: ['Same 4 products from Week 1', 'One additional active IF essential (patch test first)'],
        notAllowed: ['Adding products "just to try"', 'Using facial tools excessively', 'Changing what\'s working'],
      },
      {
        name: 'Optimization',
        dayRange: 'Days 22-30',
        description: 'If skin has improved or stayed the same — you have your minimal effective routine. If declined, add back one product at a time to identify what\'s needed.',
        allowed: ['Continue 4-5 product protocol', 'Reintroduce one "missing" product if needed'],
        notAllowed: ['Returning to your old full routine without analysis'],
      },
    ],
    tallowRole: 'Challenge: can TallowDermics replace your moisturizer AND eye cream AND body lotion? Most users find it can. This challenge is a way to test whether their expensive multi-step routine is actually outperforming a single ancestral ingredient.',
  },
  ];
}

function getDaysCompleted(detox: ActiveDetox): number {
  return detox.checkIns.length;
}

function isToday(dateStr: string): boolean {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function getTodayCheckedIn(detox: ActiveDetox): boolean {
  return detox.checkIns.some(d => isToday(d));
}

export default function SkinDetox() {
  const colors = useColors();
  const PROTOCOLS = useMemo(() => buildProtocols(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [activeDetox, setActiveDetox] = useState<ActiveDetox | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<DetoxProtocol | null>(null);

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  const load = async () => {
    const raw = await AsyncStorage.getItem(DETOX_KEY);
    if (raw) setActiveDetox(JSON.parse(raw));
  };

  const startDetox = async (protocol: DetoxProtocol) => {
    const detox: ActiveDetox = {
      protocolId: protocol.id,
      startDate: new Date().toISOString(),
      checkIns: [new Date().toISOString()],
    };
    await AsyncStorage.setItem(DETOX_KEY, JSON.stringify(detox));
    setActiveDetox(detox);
    setSelectedProtocol(null);
  };

  const checkIn = async () => {
    if (!activeDetox) return;
    const updated = { ...activeDetox, checkIns: [...activeDetox.checkIns, new Date().toISOString()] };
    await AsyncStorage.setItem(DETOX_KEY, JSON.stringify(updated));
    setActiveDetox(updated);
  };

  const endDetox = async () => {
    await AsyncStorage.removeItem(DETOX_KEY);
    setActiveDetox(null);
  };

  const currentProtocol = activeDetox ? PROTOCOLS.find(p => p.id === activeDetox.protocolId) : null;

  if (selectedProtocol) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => setSelectedProtocol(null)}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>{selectedProtocol.name}</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={[styles.protocolHero, { borderColor: `${selectedProtocol.color}50` }]}>
            <LinearGradient colors={[`${selectedProtocol.color}15`, `${selectedProtocol.color}04`]} style={StyleSheet.absoluteFill} />
            <Text style={styles.protocolEmoji}>{selectedProtocol.emoji}</Text>
            <Text style={[styles.protocolName, { color: selectedProtocol.color }]}>{selectedProtocol.name}</Text>
            <Text style={styles.protocolTagline}>{selectedProtocol.tagline}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ideal For</Text>
            {selectedProtocol.idealFor.map((item, i) => (
              <View key={i} style={styles.listRow}>
                <Ionicons name="checkmark-circle" size={14} color={selectedProtocol.color} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>What to Expect</Text>
            <Text style={styles.cardText}>{selectedProtocol.whatToExpect}</Text>
          </View>

          {selectedProtocol.phases.map((phase, i) => (
            <View key={i} style={[styles.phaseCard, { borderColor: `${selectedProtocol.color}30` }]}>
              <LinearGradient colors={[`${selectedProtocol.color}08`, `${selectedProtocol.color}02`]} style={StyleSheet.absoluteFill} />
              <Text style={[styles.phaseName, { color: selectedProtocol.color }]}>{phase.name}</Text>
              <Text style={styles.phaseDayRange}>{phase.dayRange}</Text>
              <Text style={styles.phaseDesc}>{phase.description}</Text>
              <View style={styles.phaseAllowed}>
                <Text style={styles.phaseAllowedTitle}>✅ Allowed</Text>
                {phase.allowed.map((item, j) => (
                  <Text key={j} style={styles.phaseAllowedItem}>• {item}</Text>
                ))}
              </View>
              <View style={styles.phaseNotAllowed}>
                <Text style={styles.phaseNotAllowedTitle}>🚫 Not Allowed</Text>
                {phase.notAllowed.map((item, j) => (
                  <Text key={j} style={styles.phaseNotAllowedItem}>• {item}</Text>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.tallowRoleCard}>
            <LinearGradient colors={[`${colors.primary}12`, `${colors.primary}04`]} style={StyleSheet.absoluteFill} />
            <Text style={styles.tallowRoleTitle}>🌿 TallowDermics in This Protocol</Text>
            <Text style={styles.tallowRoleText}>{selectedProtocol.tallowRole}</Text>
          </View>

          {!activeDetox ? (
            <Pressable style={[styles.startBtn, { backgroundColor: selectedProtocol.color }]} onPress={() => startDetox(selectedProtocol)}>
              <Text style={styles.startBtnText}>Start {selectedProtocol.name}</Text>
            </Pressable>
          ) : (
            <View style={styles.alreadyRunning}>
              <Text style={styles.alreadyRunningText}>You have an active detox protocol. Complete or end it before starting a new one.</Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>Skin Detox</Text>
            <Text style={styles.headerSub}>Reset protocols for overloaded skin</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Active detox */}
        {activeDetox && currentProtocol && (
          <View style={[styles.activeDetoxCard, { borderColor: `${currentProtocol.color}50` }]}>
            <LinearGradient colors={[`${currentProtocol.color}15`, `${currentProtocol.color}05`]} style={StyleSheet.absoluteFill} />
            <View style={styles.activeDetoxHeader}>
              <Text style={styles.activeDetoxEmoji}>{currentProtocol.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.activeDetoxName}>{currentProtocol.name}</Text>
                <Text style={styles.activeDetoxProgress}>
                  Day {getDaysCompleted(activeDetox)} of {currentProtocol.days}
                </Text>
              </View>
            </View>

            <View style={styles.activeProgressBar}>
              <View style={[styles.activeProgressFill, {
                width: `${Math.min(100, (getDaysCompleted(activeDetox) / currentProtocol.days) * 100)}%` as any,
                backgroundColor: currentProtocol.color,
              }]} />
            </View>

            {!getTodayCheckedIn(activeDetox) ? (
              <Pressable style={[styles.checkInBtn, { backgroundColor: currentProtocol.color }]} onPress={checkIn}>
                <Ionicons name="checkmark" size={18} color={colors.white} />
                <Text style={styles.checkInBtnText}>Mark Today Complete</Text>
              </Pressable>
            ) : (
              <View style={styles.todayDone}>
                <Ionicons name="checkmark-circle" size={18} color="#4ADE80" />
                <Text style={styles.todayDoneText}>Today completed ✓</Text>
              </View>
            )}

            <Pressable onPress={endDetox} style={styles.endBtn}>
              <Text style={styles.endBtnText}>End protocol early</Text>
            </Pressable>
          </View>
        )}

        {/* Protocols list */}
        <Text style={styles.sectionLabel}>CHOOSE A PROTOCOL</Text>
        {PROTOCOLS.map(protocol => (
          <Pressable key={protocol.id} style={styles.protocolCard} onPress={() => setSelectedProtocol(protocol)}>
            <LinearGradient colors={[`${protocol.color}10`, `${protocol.color}03`]} style={StyleSheet.absoluteFill} />
            <View style={styles.protocolCardTop}>
              <Text style={styles.protocolCardEmoji}>{protocol.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.protocolCardName, { color: protocol.color }]}>{protocol.name}</Text>
                <Text style={styles.protocolCardDuration}>{protocol.duration}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
            <Text style={styles.protocolCardTagline}>{protocol.tagline}</Text>
          </Pressable>
        ))}

        {/* Signs you need a detox */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Signs You Need a Skin Detox</Text>
          {[
            'Products that used to work have stopped working',
            'New products cause stinging or burning that didn\'t happen before',
            'Skin feels perpetually dry despite heavy moisturizing',
            'Breakouts that won\'t clear despite targeted treatment',
            'Redness or flushing that\'s become chronic, not situational',
            'You can\'t go a day without products without discomfort',
          ].map((sign, i) => (
            <View key={i} style={styles.signRow}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.gold} />
              <Text style={styles.signText}>{sign}</Text>
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: c.textPrimary, textAlign: 'center', flex: 1 },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  activeDetoxCard: {
    borderRadius: 18, overflow: 'hidden', borderWidth: 2,
    padding: 16, gap: 10, marginBottom: 16,
  },
  activeDetoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activeDetoxEmoji: { fontSize: 28 },
  activeDetoxName: { fontSize: 14, fontWeight: '800', color: c.textPrimary },
  activeDetoxProgress: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  activeProgressBar: { height: 6, backgroundColor: c.bgElevated, borderRadius: 3, overflow: 'hidden' },
  activeProgressFill: { height: '100%', borderRadius: 3 },
  checkInBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 46, borderRadius: 12,
  },
  checkInBtnText: { fontSize: 14, fontWeight: '700', color: c.white },
  todayDone: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  todayDoneText: { fontSize: 14, fontWeight: '700', color: '#4ADE80' },
  endBtn: { alignSelf: 'center' },
  endBtnText: { fontSize: 12, color: c.textMuted, textDecorationLine: 'underline' },

  sectionLabel: { fontSize: 10, fontWeight: '800', color: c.textMuted, letterSpacing: 1.5, marginBottom: 10 },

  protocolCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: c.border,
    padding: 14, gap: 6, marginBottom: 10,
  },
  protocolCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  protocolCardEmoji: { fontSize: 26 },
  protocolCardName: { fontSize: 14, fontWeight: '800' },
  protocolCardDuration: { fontSize: 11, color: c.textMuted, marginTop: 1 },
  protocolCardTagline: { fontSize: 12, color: c.textSecondary },

  card: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border,
    padding: 16, gap: 8, marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  cardText: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  listText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 19 },

  signRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  signText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 19 },

  // Protocol detail
  protocolHero: {
    borderRadius: 20, overflow: 'hidden', borderWidth: 2,
    padding: 24, gap: 8, marginBottom: 14, alignItems: 'center',
  },
  protocolEmoji: { fontSize: 40 },
  protocolName: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  protocolTagline: { fontSize: 13, color: c.textMuted, textAlign: 'center' },

  phaseCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1,
    padding: 14, gap: 6, marginBottom: 10,
  },
  phaseName: { fontSize: 15, fontWeight: '800' },
  phaseDayRange: { fontSize: 11, color: c.textMuted, fontWeight: '600' },
  phaseDesc: { fontSize: 13, color: c.textSecondary, lineHeight: 19, marginTop: 2 },
  phaseAllowed: { gap: 4, marginTop: 6 },
  phaseAllowedTitle: { fontSize: 12, fontWeight: '800', color: '#4ADE80' },
  phaseAllowedItem: { fontSize: 12, color: c.textSecondary, paddingLeft: 4 },
  phaseNotAllowed: { gap: 4, marginTop: 6 },
  phaseNotAllowedTitle: { fontSize: 12, fontWeight: '800', color: c.scorePoor },
  phaseNotAllowedItem: { fontSize: 12, color: c.textSecondary, paddingLeft: 4 },

  tallowRoleCard: {
    borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: `${c.primary}30`,
    padding: 14, gap: 6, marginBottom: 14,
  },
  tallowRoleTitle: { fontSize: 14, fontWeight: '700', color: c.primary },
  tallowRoleText: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  startBtn: {
    height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  startBtnText: { fontSize: 16, fontWeight: '700', color: c.white },

  alreadyRunning: {
    backgroundColor: `${c.gold}15`, borderRadius: 12, padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: `${c.gold}30`,
  },
  alreadyRunningText: { fontSize: 13, color: c.gold, textAlign: 'center' },
  });
}
