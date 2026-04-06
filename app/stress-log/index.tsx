import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';

const STRESS_KEY = 'gd_stress_log';

type StressEntry = {
  date: string;
  level: number; // 1-5
  triggers: string[];
};

const TRIGGERS = [
  { key: 'poor_sleep', label: 'Poor sleep', emoji: '😴' },
  { key: 'high_stress', label: 'High stress', emoji: '😰' },
  { key: 'junk_food', label: 'Junk food', emoji: '🍕' },
  { key: 'alcohol', label: 'Alcohol', emoji: '🍷' },
  { key: 'travel', label: 'Travel', emoji: '✈️' },
  { key: 'new_product', label: 'New product', emoji: '🧴' },
  { key: 'hormonal', label: 'Hormonal', emoji: '🌀' },
  { key: 'sun_exposure', label: 'Sun exposure', emoji: '☀️' },
  { key: 'sweating', label: 'Heavy sweating', emoji: '🏃' },
  { key: 'dairy', label: 'Dairy', emoji: '🥛' },
  { key: 'sugar', label: 'High sugar', emoji: '🍭' },
  { key: 'dehydrated', label: 'Dehydrated', emoji: '🏜' },
];

const STRESS_LABELS = ['', 'Calm', 'Mild', 'Moderate', 'High', 'Very High'];
const STRESS_COLORS = ['', '#4ADE80', '#86EFAC', Colors.gold, '#FCA5A5', Colors.scorePoor];
const STRESS_EMOJIS = ['', '😌', '🙂', '😐', '😟', '😖'];

function getTodayStr() {
  return new Date().toDateString();
}

export default function StressLog() {
  const [todayLevel, setTodayLevel] = useState(0);
  const [todayTriggers, setTodayTriggers] = useState<string[]>([]);
  const [log, setLog] = useState<StressEntry[]>([]);
  const [scanHistory, setScanHistory] = useState<{ date: string; overallScore: number }[]>([]);
  const [saved, setSaved] = useState(false);

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  const load = async () => {
    const raw = await AsyncStorage.getItem(STRESS_KEY);
    const entries: StressEntry[] = raw ? JSON.parse(raw) : [];
    setLog(entries);

    const history = await Storage.getScanHistory();
    setScanHistory(history.map(h => ({ date: h.date, overallScore: h.overallScore })));

    const today = getTodayStr();
    const todayEntry = entries.find(e => e.date === today);
    if (todayEntry) {
      setTodayLevel(todayEntry.level);
      setTodayTriggers(todayEntry.triggers);
      setSaved(true);
    }
  };

  const toggleTrigger = (key: string) => {
    setSaved(false);
    if (todayTriggers.includes(key)) {
      setTodayTriggers(todayTriggers.filter(t => t !== key));
    } else {
      setTodayTriggers([...todayTriggers, key]);
    }
  };

  const saveToday = async () => {
    if (!todayLevel) return;
    const today = getTodayStr();
    const entry: StressEntry = { date: today, level: todayLevel, triggers: todayTriggers };
    const updated = [entry, ...log.filter(e => e.date !== today)].slice(0, 90);
    await AsyncStorage.setItem(STRESS_KEY, JSON.stringify(updated));
    setLog(updated);
    setSaved(true);
  };

  // Last 14 days for chart
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dStr = d.toDateString();
    const entry = log.find(e => e.date === dStr);
    return { dStr, level: entry?.level ?? 0, day: d.getDate() };
  });

  // Compute correlation: high stress days (4-5) followed by scan score next 2 days
  const avgStress = log.length > 0 ? log.reduce((s, e) => s + e.level, 0) / log.length : 0;
  const highStressDays = log.filter(e => e.level >= 4).length;
  const topTrigger = (() => {
    const counts: Record<string, number> = {};
    log.forEach(e => e.triggers.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  })();

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Stress & Triggers</Text>
            <Text style={styles.headerSub}>Track what affects your skin</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Today's log */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayLabel}>TODAY'S CHECK-IN</Text>
            {saved && (
              <View style={styles.savedBadge}>
                <Ionicons name="checkmark" size={12} color="#4ADE80" />
                <Text style={styles.savedText}>Logged</Text>
              </View>
            )}
          </View>
          <Text style={styles.todayQuestion}>How's your stress today?</Text>

          {/* Stress level picker */}
          <View style={styles.levelRow}>
            {[1, 2, 3, 4, 5].map(level => (
              <Pressable
                key={level}
                style={[styles.levelBtn, todayLevel === level && { backgroundColor: STRESS_COLORS[level], borderColor: STRESS_COLORS[level] }]}
                onPress={() => { setTodayLevel(level); setSaved(false); }}
              >
                <Text style={styles.levelEmoji}>{STRESS_EMOJIS[level]}</Text>
                <Text style={[styles.levelNum, todayLevel === level && { color: Colors.white }]}>{level}</Text>
                <Text style={[styles.levelLabel, todayLevel === level && { color: Colors.white }]}>{STRESS_LABELS[level]}</Text>
              </Pressable>
            ))}
          </View>

          {todayLevel > 0 && (
            <>
              <Text style={styles.triggersLabel}>Any skin triggers today? (optional)</Text>
              <View style={styles.triggersGrid}>
                {TRIGGERS.map(t => (
                  <Pressable
                    key={t.key}
                    style={[styles.triggerChip, todayTriggers.includes(t.key) && styles.triggerChipActive]}
                    onPress={() => toggleTrigger(t.key)}
                  >
                    <Text style={styles.triggerEmoji}>{t.emoji}</Text>
                    <Text style={[styles.triggerLabel, todayTriggers.includes(t.key) && { color: Colors.primary }]}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[styles.saveBtn, saved && styles.saveBtnSaved]}
                onPress={saveToday}
              >
                {saved
                  ? <><Ionicons name="checkmark-circle" size={18} color="#4ADE80" /><Text style={[styles.saveBtnText, { color: '#4ADE80' }]}>Saved for today</Text></>
                  : <><Ionicons name="save-outline" size={18} color={Colors.white} /><Text style={styles.saveBtnText}>Save Today's Log</Text></>
                }
              </Pressable>
            </>
          )}
        </View>

        {/* Stats */}
        {log.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: avgStress >= 3.5 ? Colors.scorePoor : avgStress >= 2.5 ? Colors.gold : '#4ADE80' }]}>
                {avgStress.toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>Avg stress</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{highStressDays}</Text>
              <Text style={styles.statLabel}>High stress days</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{log.length}</Text>
              <Text style={styles.statLabel}>Days logged</Text>
            </View>
          </View>
        )}

        {/* 14-day chart */}
        {log.length >= 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>14-Day Stress Chart</Text>
            <View style={styles.chart}>
              {last14.map((d, i) => (
                <View key={i} style={styles.chartCol}>
                  <View style={styles.chartBarWrap}>
                    {d.level > 0 && (
                      <View style={[styles.chartBar, {
                        height: `${(d.level / 5) * 100}%` as any,
                        backgroundColor: STRESS_COLORS[d.level],
                      }]} />
                    )}
                  </View>
                  <Text style={styles.chartDay}>{d.day}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chartLegend}>
              {[1, 2, 3, 4, 5].map(l => (
                <View key={l} style={styles.chartLegendItem}>
                  <View style={[styles.chartLegendDot, { backgroundColor: STRESS_COLORS[l] }]} />
                  <Text style={styles.chartLegendText}>{STRESS_LABELS[l]}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top trigger */}
        {topTrigger && (
          <View style={styles.insightCard}>
            <LinearGradient colors={['rgba(196,98,45,0.10)', 'rgba(196,98,45,0.02)']} style={StyleSheet.absoluteFill} />
            <Ionicons name="bulb-outline" size={22} color={Colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTitle}>Your Most Common Trigger</Text>
              <Text style={styles.insightText}>
                {TRIGGERS.find(t => t.key === topTrigger[0])?.emoji} {TRIGGERS.find(t => t.key === topTrigger[0])?.label} — logged {topTrigger[1]} time{topTrigger[1] > 1 ? 's' : ''}
              </Text>
              <Text style={styles.insightSub}>Reducing this trigger may improve your skin scores over time.</Text>
            </View>
          </View>
        )}

        {/* Skin-stress tip */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How Stress Affects Skin</Text>
          {[
            { icon: '⚡', tip: 'Cortisol (stress hormone) increases oil production, leading to breakouts' },
            { icon: '💧', tip: 'High stress disrupts the skin barrier, causing water loss and dehydration' },
            { icon: '🌙', tip: 'Sleep deprivation spikes cortisol and reduces skin repair at night' },
            { icon: '🌿', tip: 'Tallow-based moisturizers help restore the lipid barrier stressed skin loses' },
          ].map((item, i) => (
            <View key={i} style={styles.scienceRow}>
              <Text style={styles.scienceIcon}>{item.icon}</Text>
              <Text style={styles.scienceTip}>{item.tip}</Text>
            </View>
          ))}
        </View>

        {/* Recent log */}
        {log.slice(0, 7).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Log</Text>
            {log.slice(0, 7).map((entry, i) => (
              <View key={i} style={[styles.logRow, i < Math.min(6, log.length - 1) && styles.logBorder]}>
                <Text style={[styles.logEmoji]}>{STRESS_EMOJIS[entry.level]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logDate}>{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                  {entry.triggers.length > 0 && (
                    <Text style={styles.logTriggers}>{entry.triggers.map(t => TRIGGERS.find(tr => tr.key === t)?.emoji).join(' ')}</Text>
                  )}
                </View>
                <View style={[styles.logLevelBadge, { backgroundColor: `${STRESS_COLORS[entry.level]}22` }]}>
                  <Text style={[styles.logLevelText, { color: STRESS_COLORS[entry.level] }]}>{STRESS_LABELS[entry.level]}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Link to scan */}
        <Pressable style={styles.scanCta} onPress={() => router.push('/scan')}>
          <LinearGradient colors={['rgba(196,98,45,0.1)', 'rgba(196,98,45,0.02)']} style={StyleSheet.absoluteFill} />
          <Ionicons name="camera-outline" size={20} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.scanCtaTitle}>Scan After High Stress Days</Text>
            <Text style={styles.scanCtaSub}>See how stress shows up on your skin in real-time</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  todayCard: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12, marginBottom: 14 },
  todayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  todayLabel: { fontSize: 9, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  savedText: { fontSize: 11, fontWeight: '700', color: '#4ADE80' },
  todayQuestion: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  levelRow: { flexDirection: 'row', gap: 6 },
  levelBtn: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated },
  levelEmoji: { fontSize: 18 },
  levelNum: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  levelLabel: { fontSize: 8, fontWeight: '600', color: Colors.textMuted, textAlign: 'center' },

  triggersLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  triggersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  triggerChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated },
  triggerChipActive: { borderColor: Colors.primary, backgroundColor: 'rgba(196,98,45,0.12)' },
  triggerEmoji: { fontSize: 14 },
  triggerLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 12, backgroundColor: Colors.primary, overflow: 'hidden' },
  saveBtnSaved: { backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center', gap: 3 },
  statNum: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '600', textAlign: 'center' },

  card: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 10, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  chart: { flexDirection: 'row', gap: 3, height: 80, alignItems: 'flex-end' },
  chartCol: { flex: 1, alignItems: 'center', gap: 4 },
  chartBarWrap: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 3, minHeight: 4 },
  chartDay: { fontSize: 8, color: Colors.textMuted, fontWeight: '600' },
  chartLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chartLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chartLegendDot: { width: 7, height: 7, borderRadius: 3.5 },
  chartLegendText: { fontSize: 9, color: Colors.textMuted },

  insightCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 14, marginBottom: 14 },
  insightTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  insightText: { fontSize: 13, color: Colors.primary, fontWeight: '600', marginBottom: 3 },
  insightSub: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  scienceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  scienceIcon: { fontSize: 16, marginTop: 1 },
  scienceTip: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  logBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  logEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  logDate: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  logTriggers: { fontSize: 14, marginTop: 2 },
  logLevelBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  logLevelText: { fontSize: 11, fontWeight: '700' },

  scanCta: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 14, marginBottom: 14 },
  scanCtaTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  scanCtaSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
