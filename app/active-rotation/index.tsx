import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

type Active = {
  id: string;
  name: string;
  abbr: string;
  emoji: string;
  color: string;
  whenToUse: 'AM' | 'PM' | 'Either';
  conflict: string[];
  synergy: string[];
  sensitivity: 'low' | 'medium' | 'high';
  desc: string;
  howToUse: string;
  waitTime: string;
};

function buildActives(c: Palette): Active[] {
  return [
  {
    id: 'vitc', name: 'Vitamin C (L-AA)', abbr: 'Vit C', emoji: '🍊',
    color: '#F97316', whenToUse: 'AM', conflict: ['niacinamide', 'aha', 'bha'],
    synergy: ['vitamine', 'ferulic', 'spf'],
    sensitivity: 'medium', desc: 'Brightens, boosts collagen synthesis, antioxidant protection',
    howToUse: 'After cleansing on dry skin. Wait 3-5 min before layering.',
    waitTime: '20-30 min',
  },
  {
    id: 'retinol', name: 'Retinol / Retinoids', abbr: 'Ret', emoji: '🔬',
    color: '#6B85A8', whenToUse: 'PM', conflict: ['aha', 'bha', 'vitc', 'benzoyl'],
    synergy: ['niacinamide', 'peptides', 'hyaluronic'],
    sensitivity: 'high', desc: 'Anti-aging, accelerates cell turnover, treats acne',
    howToUse: 'Apply after moisturizer or in "sandwich method" between moisturizer layers.',
    waitTime: '20-30 min',
  },
  {
    id: 'aha', name: 'AHA (Glycolic/Lactic)', abbr: 'AHA', emoji: '🧪',
    color: '#60A5FA', whenToUse: 'PM', conflict: ['retinol', 'vitc', 'bha', 'niacinamide'],
    synergy: ['hyaluronic', 'peptides', 'ceramides'],
    sensitivity: 'high', desc: 'Exfoliates surface dead cells, brightens, fades dark spots',
    howToUse: 'Wait 10-20 min after cleansing. Limit to 2-3x per week.',
    waitTime: '30 min',
  },
  {
    id: 'bha', name: 'BHA (Salicylic Acid)', abbr: 'BHA', emoji: '⚗️',
    color: '#4ADE80', whenToUse: 'PM', conflict: ['retinol', 'vitc', 'aha'],
    synergy: ['niacinamide', 'zinc', 'azelaic'],
    sensitivity: 'medium', desc: 'Penetrates pores, treats acne and blackheads',
    howToUse: 'After cleansing. Can be used AM or PM. 2-3x per week.',
    waitTime: '20 min',
  },
  {
    id: 'niacinamide', name: 'Niacinamide (B3)', abbr: 'Nia', emoji: '💎',
    color: '#86EFAC', whenToUse: 'Either', conflict: ['vitc'],
    synergy: ['retinol', 'aha', 'bha', 'hyaluronic', 'zinc', 'ceramides'],
    sensitivity: 'low', desc: 'Minimizes pores, regulates oil, brightens, anti-inflammatory',
    howToUse: 'Layer on any skin — morning or night. Most versatile active.',
    waitTime: '0 min',
  },
  {
    id: 'azelaic', name: 'Azelaic Acid', abbr: 'AzA', emoji: '🌿',
    color: '#22C55E', whenToUse: 'Either', conflict: [],
    synergy: ['niacinamide', 'retinol', 'bha'],
    sensitivity: 'low', desc: 'Treats rosacea, acne, hyperpigmentation — very well-tolerated',
    howToUse: 'Apply morning or evening after serum, before moisturizer.',
    waitTime: '0 min',
  },
  {
    id: 'peptides', name: 'Peptides', abbr: 'Pep', emoji: '⚡',
    color: c.gold, whenToUse: 'PM', conflict: ['aha', 'bha'],
    synergy: ['retinol', 'hyaluronic', 'niacinamide'],
    sensitivity: 'low', desc: 'Stimulate collagen, firm skin, reduce fine lines',
    howToUse: 'After serums, before moisturizer. Most effective at night.',
    waitTime: '0 min',
  },
  {
    id: 'hyaluronic', name: 'Hyaluronic Acid', abbr: 'HA', emoji: '💧',
    color: '#38BDF8', whenToUse: 'Either', conflict: [],
    synergy: ['retinol', 'aha', 'vitc', 'niacinamide', 'ceramides'],
    sensitivity: 'low', desc: 'Draws and holds moisture, plumps and hydrates',
    howToUse: 'Apply to damp skin before any actives. Layer under everything.',
    waitTime: '0 min',
  },
  ];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Schedule = {
  am: string[];
  pm: string[];
}[];

function generateSchedule(selectedIds: string[], ACTIVES: Active[]): Schedule {
  const selected = ACTIVES.filter(a => selectedIds.includes(a.id));
  const amActives = selected.filter(a => a.whenToUse === 'AM');
  const pmActives = selected.filter(a => a.whenToUse === 'PM');
  const eitherActives = selected.filter(a => a.whenToUse === 'Either');

  // High sensitivity actives can only be used 2-3x per week
  const highSens = [...amActives, ...pmActives, ...eitherActives].filter(a => a.sensitivity === 'high');
  const lowSens = [...amActives, ...pmActives, ...eitherActives].filter(a => a.sensitivity !== 'high');

  const schedule: Schedule = DAYS.map((_, dayIdx) => {
    const am: string[] = [];
    const pm: string[] = [];

    // Always add low-sensitivity AM actives
    amActives.filter(a => a.sensitivity !== 'high').forEach(a => am.push(a.abbr));
    eitherActives.filter(a => a.sensitivity !== 'high').forEach(a => am.push(a.abbr));

    // PM low-sensitivity
    pmActives.filter(a => a.sensitivity !== 'high').forEach(a => pm.push(a.abbr));

    // High sensitivity: rotate so they don't overlap
    highSens.forEach((a, i) => {
      // Use on alternating nights to avoid stacking
      const useDay = (dayIdx + i * 2) % 7 < 3; // Only on 3 days
      if (useDay) {
        if (a.whenToUse === 'AM') am.push(a.abbr);
        else pm.push(a.abbr);
      }
    });

    return { am, pm };
  });

  return schedule;
}

export default function ActiveRotation() {
  const colors = useColors();
  const ACTIVES = useMemo(() => buildActives(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selectedActives, setSelectedActives] = useState<string[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [expandedActive, setExpandedActive] = useState<string | null>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const toggleActive = (id: string) => {
    setSelectedActives(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setShowSchedule(false);
  };

  const conflicts = (() => {
    const conflictPairs: [string, string][] = [];
    for (const id of selectedActives) {
      const active = ACTIVES.find(a => a.id === id);
      if (!active) continue;
      for (const conflictId of active.conflict) {
        if (selectedActives.includes(conflictId)) {
          const pair = [id, conflictId].sort();
          if (!conflictPairs.some(p => p[0] === pair[0] && p[1] === pair[1])) {
            conflictPairs.push([pair[0], pair[1]]);
          }
        }
      }
    }
    return conflictPairs;
  })();

  const schedule = showSchedule ? generateSchedule(selectedActives, ACTIVES) : null;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>Active Rotation</Text>
            <Text style={styles.headerSub}>Schedule actives without conflicts</Text>
          </View>
          <View style={{ width: 36 }} />
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ opacity: contentAnim }}>
        {/* Select actives */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Your Actives</Text>
          <Text style={styles.cardSubtitle}>Tap to select the actives you use or want to use</Text>
          {ACTIVES.map(active => {
            const isSelected = selectedActives.includes(active.id);
            const isExpanded = expandedActive === active.id;
            const hasConflict = isSelected && conflicts.some(c => c.includes(active.id));
            return (
              <View key={active.id}>
                <Pressable
                  style={[
                    styles.activeRow,
                    isSelected && { borderColor: `${active.color}60`, backgroundColor: `${active.color}08` },
                    hasConflict && { borderColor: colors.scorePoor },
                  ]}
                  onPress={() => toggleActive(active.id)}
                >
                  <Text style={styles.activeEmoji}>{active.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.activeName, isSelected && { color: active.color }]}>{active.name}</Text>
                    <Text style={styles.activeDesc} numberOfLines={1}>{active.desc}</Text>
                  </View>
                  <View style={[styles.sensitivityBadge, {
                    backgroundColor: active.sensitivity === 'low' ? 'rgba(74,222,128,0.15)' : active.sensitivity === 'medium' ? 'rgba(183,155,110,0.15)' : 'rgba(239,68,68,0.15)',
                  }]}>
                    <Text style={[styles.sensitivityText, {
                      color: active.sensitivity === 'low' ? '#4ADE80' : active.sensitivity === 'medium' ? colors.gold : colors.scorePoor,
                    }]}>
                      {active.sensitivity === 'low' ? 'Gentle' : active.sensitivity === 'medium' ? 'Medium' : 'Strong'}
                    </Text>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel={isExpanded ? 'Collapse' : 'Expand'} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => setExpandedActive(isExpanded ? null : active.id)} style={{ padding: 4 }}>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
                  </Pressable>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={isSelected ? active.color : colors.textMuted}
                  />
                </Pressable>
                {isExpanded && (
                  <View style={[styles.expandedInfo, { borderColor: `${active.color}30` }]}>
                    <Text style={styles.expandedLabel}>⏰ Best time: {active.whenToUse === 'Either' ? 'AM or PM' : active.whenToUse}</Text>
                    <Text style={styles.expandedLabel}>⏱ Wait time after applying: {active.waitTime}</Text>
                    <Text style={styles.expandedLabel}>💡 {active.howToUse}</Text>
                    {active.conflict.length > 0 && (
                      <Text style={[styles.expandedLabel, { color: colors.scorePoor }]}>
                        ⚠️ Don't combine with: {active.conflict.map(c => ACTIVES.find(a => a.id === c)?.abbr).join(', ')}
                      </Text>
                    )}
                    {active.synergy.length > 0 && (
                      <Text style={[styles.expandedLabel, { color: '#4ADE80' }]}>
                        ✅ Works well with: {active.synergy.map(c => ACTIVES.find(a => a.id === c)?.abbr ?? c).join(', ')}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Conflicts warning */}
        {conflicts.length > 0 && (
          <View style={styles.conflictCard}>
            <LinearGradient colors={['rgba(239,68,68,0.12)', 'rgba(239,68,68,0.04)']} style={StyleSheet.absoluteFill} />
            <Text style={[styles.cardTitle, { color: colors.scorePoor }]}>⚠️ Ingredient Conflicts</Text>
            {conflicts.map(([a, b], i) => {
              const activeA = ACTIVES.find(x => x.id === a);
              const activeB = ACTIVES.find(x => x.id === b);
              return (
                <Text key={i} style={styles.conflictText}>
                  {activeA?.name} + {activeB?.name} → Use on different days or separate AM/PM
                </Text>
              );
            })}
          </View>
        )}

        {/* Generate schedule button */}
        {selectedActives.length >= 2 && (
          <Pressable style={styles.generateBtn} onPress={() => setShowSchedule(true)}>
            <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Ionicons name="calendar-outline" size={18} color={colors.white} />
            <Text style={styles.generateBtnText}>Generate Weekly Schedule</Text>
          </Pressable>
        )}

        {/* Schedule */}
        {schedule && (
          <View style={styles.scheduleCard}>
            <Text style={styles.cardTitle}>Your Weekly Schedule</Text>
            <Text style={styles.scheduleNote}>High-sensitivity actives are rotated to prevent over-stressing your skin.</Text>

            <View style={styles.scheduleGrid}>
              <View style={styles.scheduleHeaderRow}>
                <View style={styles.scheduleDay} />
                <Text style={styles.scheduleHeaderText}>AM</Text>
                <Text style={styles.scheduleHeaderText}>PM</Text>
              </View>
              {DAYS.map((day, i) => (
                <View key={day} style={[styles.scheduleRow, i % 2 === 0 && { backgroundColor: `${colors.primary}05` }]}>
                  <Text style={styles.scheduleDayText}>{day}</Text>
                  <View style={styles.scheduleCell}>
                    {schedule[i].am.map((abbr, j) => (
                      <View key={j} style={[styles.scheduleChip, { backgroundColor: `${ACTIVES.find(a => a.abbr === abbr)?.color}25` }]}>
                        <Text style={[styles.scheduleChipText, { color: ACTIVES.find(a => a.abbr === abbr)?.color }]}>{abbr}</Text>
                      </View>
                    ))}
                    {schedule[i].am.length === 0 && <Text style={styles.restText}>Rest</Text>}
                  </View>
                  <View style={styles.scheduleCell}>
                    {schedule[i].pm.map((abbr, j) => (
                      <View key={j} style={[styles.scheduleChip, { backgroundColor: `${ACTIVES.find(a => a.abbr === abbr)?.color}25` }]}>
                        <Text style={[styles.scheduleChipText, { color: ACTIVES.find(a => a.abbr === abbr)?.color }]}>{abbr}</Text>
                      </View>
                    ))}
                    {schedule[i].pm.length === 0 && <Text style={styles.restText}>Rest</Text>}
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.scheduleFootnote}>
              Always apply tallow balm as your final PM step — it seals all active ingredients in and aids overnight repair.
            </Text>
          </View>
        )}

        {/* Rules */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Active Stacking Rules</Text>
          {[
            { rule: 'Never use AHA + BHA + Retinol in the same routine', why: 'Triple exfoliation strips the barrier and causes chemical burns' },
            { rule: 'Vitamin C + Niacinamide debate', why: 'Old research suggested conflict — modern consensus says low concentrations are fine but why risk it? Use separately.' },
            { rule: 'Retinol goes last (or "sandwich")', why: 'Apply between moisturizer layers if sensitive, or after all serums if tolerant' },
            { rule: 'pH matters for actives', why: 'AHA/BHA need pH 3.5-4. Vitamin C needs pH 3.5. Apply before moisturizer which raises pH.' },
            { rule: 'Introduce one active at a time', why: 'Wait 2 weeks before adding another — you need to know what your skin is reacting to' },
            { rule: 'Always follow actives with tallow or ceramides', why: 'Active ingredients exfoliate or modify skin — tallow seals and repairs what was just stimulated' },
          ].map((item, i) => (
            <View key={i} style={styles.ruleRow}>
              <View style={styles.ruleDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.ruleName}>{item.rule}</Text>
                <Text style={styles.ruleWhy}>{item.why}</Text>
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

  card: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border,
    padding: 16, gap: 8, marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  cardSubtitle: { fontSize: 12, color: c.textMuted, marginBottom: 4 },

  activeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border,
    backgroundColor: c.bgElevated, marginBottom: 4,
  },
  activeEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  activeName: { fontSize: 13, fontWeight: '700', color: c.textPrimary },
  activeDesc: { fontSize: 11, color: c.textMuted, marginTop: 1 },
  sensitivityBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sensitivityText: { fontSize: 10, fontWeight: '800' },
  expandedInfo: {
    marginBottom: 8, marginTop: -4, padding: 12, borderRadius: 10,
    borderWidth: 1, backgroundColor: c.bgElevated, gap: 4,
  },
  expandedLabel: { fontSize: 12, color: c.textSecondary, lineHeight: 18 },

  conflictCard: {
    borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    padding: 14, gap: 8, marginBottom: 14,
  },
  conflictText: { fontSize: 13, color: c.textSecondary },

  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 14, overflow: 'hidden', marginBottom: 14,
  },
  generateBtnText: { fontSize: 15, fontWeight: '800', color: c.white },

  scheduleCard: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border,
    padding: 16, gap: 10, marginBottom: 14,
  },
  scheduleNote: { fontSize: 12, color: c.textMuted },
  scheduleGrid: { gap: 2, marginTop: 4 },
  scheduleHeaderRow: { flexDirection: 'row', paddingHorizontal: 4, marginBottom: 2 },
  scheduleHeaderText: { flex: 1, fontSize: 10, fontWeight: '800', color: c.textMuted, textAlign: 'center' },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 4 },
  scheduleDay: { width: 32 },
  scheduleDayText: { width: 32, fontSize: 11, fontWeight: '700', color: c.textMuted },
  scheduleCell: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 3, justifyContent: 'center' },
  scheduleChip: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  scheduleChipText: { fontSize: 10, fontWeight: '800' },
  restText: { fontSize: 10, color: c.border, fontStyle: 'italic' },
  scheduleFootnote: { fontSize: 11, color: c.textMuted, fontStyle: 'italic', lineHeight: 17 },

  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ruleDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: c.primary, marginTop: 6, flexShrink: 0 },
  ruleName: { fontSize: 13, fontWeight: '700', color: c.textPrimary },
  ruleWhy: { fontSize: 12, color: c.textMuted, lineHeight: 18, marginTop: 1 },
  });
}
