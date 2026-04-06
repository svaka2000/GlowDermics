import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
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
  orange: '#FB923C',
};

const ROUTINES = [
  {
    id: '2min',
    label: '2-Minute',
    subtitle: 'Absolute minimum',
    time: '2 min',
    color: Colors.red,
    icon: '⚡',
    am: [
      { step: 'Splash with cool water', time: '30s', why: 'Removes overnight oil. Preserves the acid mantle (no cleanser stripping).' },
      { step: 'Tallow balm — thin layer', time: '30s', why: 'Moisture seal and barrier protection in one step.' },
      { step: 'SPF 30+ — face and neck', time: '45s', why: 'Non-negotiable. The most impactful anti-aging and anti-pore step.' },
    ],
    pm: [
      { step: 'Micellar water wipe (face, eyes)', time: '60s', why: 'No-rinse cleanser that removes most of the day without disrupting the microbiome.' },
      { step: 'Tallow balm', time: '30s', why: 'Barrier repair and overnight nourishment.' },
    ],
    note: 'Even on your worst day, these steps protect your investment. Skip SPF = 2-day setback. Skip PM cleanse = 3-day setback.',
  },
  {
    id: '5min',
    label: '5-Minute',
    subtitle: 'Busy but intentional',
    time: '5 min',
    color: Colors.orange,
    icon: '🚀',
    am: [
      { step: 'Cool water rinse', time: '30s', why: 'Wakes up skin, removes overnight oil.' },
      { step: 'Niacinamide or Vitamin C serum (optional)', time: '30s', why: 'Quick antioxidant protection before SPF. Pat in, move on.' },
      { step: 'Tallow balm', time: '45s', why: 'Moisturize and create a base for SPF.' },
      { step: 'SPF 30+', time: '45s', why: 'Applied last, always. Shake or swipe quickly.' },
    ],
    pm: [
      { step: 'Oil cleanse — 60 second massage', time: '90s', why: 'Breaks down SPF, makeup, pollution, sebum without stripping.' },
      { step: 'Quick water rinse (or cloth wipe)', time: '30s', why: 'Remove the emulsified oil.' },
      { step: 'BHA or niacinamide (skip if tired)', time: '30s', why: 'One active on most nights is better than skipping all nights.' },
      { step: 'Tallow balm', time: '45s', why: 'Barrier seal before sleep.' },
    ],
    note: 'This covers 85% of what a full routine achieves. The key is double cleansing PM — never skip that step even in the abbreviated version.',
  },
  {
    id: '10min',
    label: '10-Minute',
    subtitle: 'Full routine, streamlined',
    time: '10 min',
    color: Colors.gold,
    icon: '⭐',
    am: [
      { step: 'Cool water splash', time: '20s', why: 'Optional cleanser if you exercised or sweat overnight.' },
      { step: 'Hyaluronic acid serum (damp skin)', time: '30s', why: 'Hydration base while skin is still moist for maximum uptake.' },
      { step: 'Vitamin C serum (wait 30s)', time: '60s', why: 'Antioxidant protection, brightening, collagen support. AM-only.' },
      { step: 'Niacinamide (optional, after Vit C sets)', time: '30s', why: 'Sebum control, anti-redness, pore tightening.' },
      { step: 'Tallow balm', time: '60s', why: 'Seal all layers in. Apply generously.' },
      { step: 'SPF 30+', time: '45s', why: 'Last step always. Let tallow fully set first (30–60s).' },
    ],
    pm: [
      { step: 'Oil cleanse — thorough 60–90s', time: '90s', why: 'Deep dissolve of SPF, pollution, sebum, makeup.' },
      { step: 'Gentle cleanser (double cleanse)', time: '60s', why: 'Remove oil cleanser residue. pH 5–6 preferred.' },
      { step: 'BHA or AHA (alternate nights)', time: '30s', why: 'Chemical exfoliation. BHA for oily/pores; AHA for texture/aging.' },
      { step: 'Wait 15–20 minutes', time: '20m', why: 'Let active penetrate and pH normalize before layering.' },
      { step: 'Peptide or retinol serum (alternate)', time: '30s', why: 'Alternate with exfoliant nights. Never on the same night.' },
      { step: 'Tallow balm — generous layer', time: '60s', why: 'Final occlusive. Seal and repair overnight.' },
    ],
    note: 'This is the complete, sustainable routine. Every minute is doing work. Nothing redundant.',
  },
];

const EMERGENCY_TIPS = [
  {
    situation: 'Slept with makeup on',
    fix: 'Double cleanse AM instead. Don\'t punish — just reset. Apply extra tallow PM tonight.',
  },
  {
    situation: 'Forgot SPF, already outside',
    fix: 'Reapply when you can. Seek shade for the rest of the day. Apply antioxidant serum or tallow to reduce UV-triggered free radical damage.',
  },
  {
    situation: 'No products available (traveling)',
    fix: 'Water rinse AM. Tallow or basic moisturizer PM. That\'s it — barrier protection is the priority. Skip all actives during travel disruption.',
  },
  {
    situation: 'Skin suddenly reactive/burning',
    fix: 'Pause ALL actives for 3–5 days. Tallow only PM. Cool water AM. Let barrier recover before reintroducing anything.',
  },
  {
    situation: 'Running very late, pick one thing',
    fix: 'SPF. Always SPF. Nothing else you do compounds as badly as skipping SPF daily for years.',
  },
  {
    situation: 'Crashed into bed exhausted',
    fix: 'Next time: keep micellar wipes by bedside. One wipe + one swipe of tallow is 90 seconds. Set it up so the lazy option is the right option.',
  },
];

export default function SpeedRoutineScreen() {
  const [selected, setSelected] = useState('5min');
  const [time, setTime] = useState<'am' | 'pm'>('am');
  const [showEmergency, setShowEmergency] = useState(false);

  const routine = ROUTINES.find(r => r.id === selected)!;
  const steps = time === 'am' ? routine.am : routine.pm;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Speed Routines</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.intro}>
        <Text style={styles.introText}>
          Real life isn't always a 20-minute full routine. These stripped-down protocols maintain results on your busiest days.
        </Text>
      </View>

      <View style={styles.routineSelector}>
        {ROUTINES.map(r => (
          <TouchableOpacity
            key={r.id}
            style={[styles.routineBtn, selected === r.id && { borderColor: r.color, backgroundColor: r.color + '22' }]}
            onPress={() => setSelected(r.id)}
          >
            <Text style={styles.routineIcon}>{r.icon}</Text>
            <Text style={[styles.routineLabel, selected === r.id && { color: r.color }]}>{r.label}</Text>
            <Text style={styles.routineTime}>{r.time}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.timeTab}>
        {(['am', 'pm'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.timeBtn, time === t && { borderColor: routine.color, backgroundColor: routine.color + '22' }]}
            onPress={() => setTime(t)}
          >
            <Text style={[styles.timeBtnText, time === t && { color: routine.color }]}>
              {t === 'am' ? '🌅 Morning' : '🌙 Evening'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={[styles.routineHeader, { borderColor: routine.color + '44' }]}>
          <Text style={styles.routineHeaderIcon}>{routine.icon}</Text>
          <View>
            <Text style={[styles.routineHeaderTitle, { color: routine.color }]}>{routine.label} {time === 'am' ? 'Morning' : 'Evening'}</Text>
            <Text style={styles.routineHeaderSub}>{routine.subtitle} · {routine.time} {time === 'am' ? 'AM' : 'PM'}</Text>
          </View>
        </View>

        {steps.map((step, i) => (
          <View key={i} style={styles.stepCard}>
            <View style={[styles.stepNum, { backgroundColor: routine.color + '22' }]}>
              <Text style={[styles.stepNumText, { color: routine.color }]}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.stepTop}>
                <Text style={styles.stepName}>{step.step}</Text>
                <Text style={styles.stepTime}>{step.time}</Text>
              </View>
              <Text style={styles.stepWhy}>{step.why}</Text>
            </View>
          </View>
        ))}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>⚡ Key Note</Text>
          <Text style={styles.noteText}>{routine.note}</Text>
        </View>

        <TouchableOpacity
          style={styles.emergencyToggle}
          onPress={() => setShowEmergency(!showEmergency)}
        >
          <Text style={styles.emergencyToggleText}>
            {showEmergency ? '▲' : '▼'} Skincare Emergency Guide
          </Text>
        </TouchableOpacity>

        {showEmergency && EMERGENCY_TIPS.map((tip, i) => (
          <View key={i} style={styles.emergencyCard}>
            <Text style={styles.emergencySituation}>🚨 {tip.situation}</Text>
            <Text style={styles.emergencyFix}>{tip.fix}</Text>
          </View>
        ))}

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
  intro: {
    paddingHorizontal: 16, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  introText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  routineSelector: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8,
  },
  routineBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, gap: 2,
  },
  routineIcon: { fontSize: 18 },
  routineLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  routineTime: { color: Colors.textMuted, fontSize: 10 },
  timeTab: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  timeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  timeBtnText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  routineHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, marginBottom: 14,
  },
  routineHeaderIcon: { fontSize: 28 },
  routineHeaderTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  routineHeaderSub: { color: Colors.textMuted, fontSize: 12 },
  stepCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { fontSize: 13, fontWeight: '700' },
  stepTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  stepName: { flex: 1, color: Colors.textPrimary, fontSize: 13, fontWeight: '700' },
  stepTime: {
    color: Colors.gold, fontSize: 11, fontWeight: '700',
    backgroundColor: Colors.gold + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  stepWhy: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  noteCard: {
    backgroundColor: Colors.primary + '15', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.primary + '44', marginTop: 6, marginBottom: 14,
  },
  noteTitle: { color: Colors.primary, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  noteText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  emergencyToggle: {
    alignItems: 'center', paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border, marginBottom: 10,
  },
  emergencyToggleText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  emergencyCard: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  emergencySituation: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  emergencyFix: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
