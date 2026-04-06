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

const LOG_KEY = 'gd_uv_log';

type UVEntry = {
  date: string;
  exposureMin: number; // minutes of sun exposure
  spf: number | null; // SPF used (null = none)
  reapplied: boolean;
  activities: string[];
};

const EXPOSURE_OPTIONS = [
  { min: 0, label: 'None', emoji: '🏠' },
  { min: 15, label: '15 min', emoji: '☕' },
  { min: 30, label: '30 min', emoji: '🚶' },
  { min: 60, label: '1 hour', emoji: '🏃' },
  { min: 120, label: '2 hours', emoji: '🌳' },
  { min: 240, label: '4+ hours', emoji: '🏖️' },
];

const SPF_OPTIONS = [
  { value: null, label: 'No SPF', color: Colors.scorePoor },
  { value: 15, label: 'SPF 15', color: Colors.scoreFair },
  { value: 30, label: 'SPF 30', color: Colors.scoreGood },
  { value: 50, label: 'SPF 50', color: Colors.scoreExcellent },
  { value: 100, label: 'SPF 100+', color: '#4ADE80' },
];

const ACTIVITIES = [
  'Morning walk', 'Outdoor workout', 'Driving', 'Sitting outside',
  'Beach/Pool', 'Hiking', 'Gardening', 'Sport',
];

function getTodayStr() {
  return new Date().toDateString();
}

function getUVRisk(exposureMin: number, spf: number | null, reapplied: boolean): { label: string; color: string; desc: string } {
  if (exposureMin === 0) return { label: 'No Exposure', color: Colors.textMuted, desc: 'No UV risk today.' };
  if (!spf) {
    if (exposureMin <= 15) return { label: 'Low Risk', color: Colors.scoreGood, desc: 'Brief exposure without SPF — watch for cumulative damage.' };
    if (exposureMin <= 60) return { label: 'Moderate Risk', color: Colors.gold, desc: 'Extended unprotected exposure causes collagen breakdown and pigmentation.' };
    return { label: 'High Risk', color: Colors.scorePoor, desc: 'Long unprotected sun exposure significantly accelerates skin aging.' };
  }
  const protection = spf * (reapplied ? 1.2 : 0.6);
  if (protection >= 30 && reapplied) return { label: 'Well Protected', color: Colors.scoreExcellent, desc: 'Great SPF routine — your skin barrier is protected.' };
  if (protection >= 20) return { label: 'Moderate Protection', color: Colors.scoreGood, desc: 'Good coverage but consider reapplying every 2 hours.' };
  return { label: 'Limited Protection', color: Colors.gold, desc: 'SPF applied but needs reapplication for full protection.' };
}

function getVitaminDNote(exposureMin: number): string {
  if (exposureMin === 0) return 'No vitamin D synthesis today — consider a D3 supplement.';
  if (exposureMin < 15) return 'Light exposure. Vitamin D synthesis starts at ~10-15 minutes of midday sun.';
  if (exposureMin <= 30) return 'Good vitamin D window — 15-30 minutes of midday sun can produce 10,000-20,000 IU.';
  return 'Ample sun exposure for vitamin D. Beyond 30 minutes, benefits plateau while UV damage increases.';
}

export default function UVLog() {
  const [log, setLog] = useState<UVEntry[]>([]);
  const [selectedExposure, setSelectedExposure] = useState<number | null>(null);
  const [selectedSPF, setSelectedSPF] = useState<number | null | undefined>(undefined);
  const [reapplied, setReapplied] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [scanHistory, setScanHistory] = useState<{ date: string; overallScore: number }[]>([]);

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  const load = async () => {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    const entries: UVEntry[] = raw ? JSON.parse(raw) : [];
    setLog(entries);

    const history = await Storage.getScanHistory();
    setScanHistory(history.map(h => ({ date: h.date, overallScore: h.overallScore })));

    const today = getTodayStr();
    const todayEntry = entries.find(e => e.date === today);
    if (todayEntry) {
      setSelectedExposure(todayEntry.exposureMin);
      setSelectedSPF(todayEntry.spf);
      setReapplied(todayEntry.reapplied);
      setSelectedActivities(todayEntry.activities);
      setSaved(true);
    }
  };

  const saveEntry = async () => {
    if (selectedExposure === null || selectedSPF === undefined) return;
    const today = getTodayStr();
    const entry: UVEntry = {
      date: today,
      exposureMin: selectedExposure,
      spf: selectedSPF,
      reapplied,
      activities: selectedActivities,
    };
    const updated = [entry, ...log.filter(e => e.date !== today)].slice(0, 90);
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(updated));
    setLog(updated);
    setSaved(true);
  };

  const toggleActivity = (a: string) => {
    setSelectedActivities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
    setSaved(false);
  };

  // Last 14 days chart
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dStr = d.toDateString();
    const entry = log.find(e => e.date === dStr);
    return {
      exposureMin: entry?.exposureMin ?? 0,
      hasSpf: entry ? entry.spf !== null : false,
      day: d.getDate(),
      isToday: dStr === getTodayStr(),
    };
  });

  const chartMax = Math.max(120, ...last14.map(d => d.exposureMin));

  // Stats
  const recentWithData = log.slice(0, 14).filter(e => e.exposureMin > 0);
  const spfCompliance = recentWithData.length > 0
    ? Math.round((recentWithData.filter(e => e.spf !== null).length / recentWithData.length) * 100)
    : null;
  const avgExposure = recentWithData.length > 0
    ? Math.round(recentWithData.reduce((s, e) => s + e.exposureMin, 0) / recentWithData.length)
    : 0;

  // High SPF scan correlation
  const highProtectionScanAvg = (() => {
    const goodDates = new Set(log.filter(e => e.spf && e.spf >= 30 && e.reapplied).map(e => e.date));
    const relevant = scanHistory.filter(s => {
      const d = new Date(s.date);
      const prev = new Date(d);
      prev.setDate(d.getDate() - 1);
      return goodDates.has(prev.toDateString());
    });
    return relevant.length >= 3 ? Math.round(relevant.reduce((s, e) => s + e.overallScore, 0) / relevant.length) : null;
  })();

  const noProtectionScanAvg = (() => {
    const badDates = new Set(log.filter(e => e.spf === null && e.exposureMin >= 30).map(e => e.date));
    const relevant = scanHistory.filter(s => {
      const d = new Date(s.date);
      const prev = new Date(d);
      prev.setDate(d.getDate() - 1);
      return badDates.has(prev.toDateString());
    });
    return relevant.length >= 3 ? Math.round(relevant.reduce((s, e) => s + e.overallScore, 0) / relevant.length) : null;
  })();

  const riskInfo = selectedExposure !== null && selectedSPF !== undefined
    ? getUVRisk(selectedExposure, selectedSPF, reapplied)
    : null;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>UV & Sun Log</Text>
            <Text style={styles.headerSub}>Track sun exposure and SPF habits</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Today's log */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Today's Sun Exposure</Text>
            {saved && (
              <View style={styles.savedBadge}>
                <Ionicons name="checkmark" size={12} color="#4ADE80" />
                <Text style={styles.savedText}>Saved</Text>
              </View>
            )}
          </View>

          <Text style={styles.fieldLabel}>Time in sun</Text>
          <View style={styles.exposureGrid}>
            {EXPOSURE_OPTIONS.map(opt => (
              <Pressable
                key={opt.min}
                style={[styles.exposureChip, selectedExposure === opt.min && styles.exposureChipActive]}
                onPress={() => { setSelectedExposure(opt.min); setSaved(false); }}
              >
                <Text style={styles.exposureEmoji}>{opt.emoji}</Text>
                <Text style={[styles.exposureLabel, selectedExposure === opt.min && { color: Colors.primary }]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>SPF used</Text>
          <View style={styles.spfRow}>
            {SPF_OPTIONS.map(opt => (
              <Pressable
                key={String(opt.value)}
                style={[styles.spfChip, selectedSPF === opt.value && { backgroundColor: `${opt.color}22`, borderColor: opt.color }]}
                onPress={() => { setSelectedSPF(opt.value); setSaved(false); }}
              >
                <Text style={[styles.spfLabel, { color: selectedSPF === opt.value ? opt.color : Colors.textMuted }]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          {selectedSPF !== null && selectedSPF !== undefined && (
            <Pressable
              style={[styles.reapplyBtn, reapplied && styles.reapplyBtnActive]}
              onPress={() => { setReapplied(prev => !prev); setSaved(false); }}
            >
              <Ionicons
                name={reapplied ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={reapplied ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.reapplyText, reapplied && { color: Colors.textPrimary }]}>Reapplied SPF every 2 hours</Text>
            </Pressable>
          )}

          <Text style={styles.fieldLabel}>Activities (optional)</Text>
          <View style={styles.activitiesGrid}>
            {ACTIVITIES.map(a => (
              <Pressable
                key={a}
                style={[styles.activityChip, selectedActivities.includes(a) && styles.activityChipActive]}
                onPress={() => toggleActivity(a)}
              >
                <Text style={[styles.activityText, selectedActivities.includes(a) && { color: Colors.primary }]}>{a}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.saveBtn, saved && styles.saveBtnSaved, (selectedExposure === null || selectedSPF === undefined) && { opacity: 0.5 }]}
            onPress={saveEntry}
            disabled={selectedExposure === null || selectedSPF === undefined}
          >
            {saved
              ? <><Ionicons name="checkmark-circle" size={18} color="#4ADE80" /><Text style={[styles.saveBtnText, { color: '#4ADE80' }]}>Saved</Text></>
              : <><Ionicons name="sunny-outline" size={18} color={Colors.white} /><Text style={styles.saveBtnText}>Log Today</Text></>
            }
          </Pressable>
        </View>

        {/* Risk & Vitamin D analysis */}
        {riskInfo && (
          <View style={[styles.riskCard, { borderColor: `${riskInfo.color}40` }]}>
            <LinearGradient colors={[`${riskInfo.color}12`, `${riskInfo.color}04`]} style={StyleSheet.absoluteFill} />
            <View style={styles.riskRow}>
              <View style={[styles.riskDot, { backgroundColor: riskInfo.color }]} />
              <Text style={[styles.riskLabel, { color: riskInfo.color }]}>{riskInfo.label}</Text>
            </View>
            <Text style={styles.riskDesc}>{riskInfo.desc}</Text>
            {selectedExposure !== null && (
              <>
                <View style={styles.riskDivider} />
                <View style={styles.vitaminDRow}>
                  <Text style={styles.vitaminDIcon}>☀️</Text>
                  <Text style={styles.vitaminDText}>{getVitaminDNote(selectedExposure)}</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Stats */}
        {log.length >= 3 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: spfCompliance && spfCompliance >= 80 ? '#4ADE80' : Colors.gold }]}>
                {spfCompliance !== null ? `${spfCompliance}%` : '—'}
              </Text>
              <Text style={styles.statLabel}>SPF compliance</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: avgExposure > 60 ? Colors.scorePoor : avgExposure > 30 ? Colors.gold : '#4ADE80' }]}>
                {avgExposure}m
              </Text>
              <Text style={styles.statLabel}>Avg exposure</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{log.filter(e => e.spf && e.spf >= 50).length}</Text>
              <Text style={styles.statLabel}>SPF 50+ days</Text>
            </View>
          </View>
        )}

        {/* 14-day chart */}
        {log.length >= 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>14-Day Sun Exposure</Text>
            <View style={styles.chart}>
              {last14.map((d, i) => {
                const barPct = chartMax > 0 ? d.exposureMin / chartMax : 0;
                const barColor = !d.hasSpf && d.exposureMin > 0 ? Colors.scorePoor
                  : d.exposureMin >= 60 ? Colors.gold
                  : d.exposureMin > 0 ? '#4ADE80'
                  : Colors.border;
                return (
                  <View key={i} style={styles.chartCol}>
                    <View style={styles.chartBarWrap}>
                      {d.exposureMin > 0 && (
                        <View style={[styles.chartBar, {
                          height: `${barPct * 100}%` as any,
                          backgroundColor: barColor,
                        }]} />
                      )}
                    </View>
                    <Text style={[styles.chartDay, d.isToday && { color: Colors.primary, fontWeight: '800' }]}>
                      {d.isToday ? '•' : d.day}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#4ADE80' }]} /><Text style={styles.legendText}>Protected</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.gold }]} /><Text style={styles.legendText}>High exposure</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.scorePoor }]} /><Text style={styles.legendText}>Unprotected</Text></View>
            </View>
          </View>
        )}

        {/* SPF-Skin correlation */}
        {highProtectionScanAvg !== null && noProtectionScanAvg !== null && (
          <View style={styles.correlationCard}>
            <LinearGradient colors={['rgba(74,222,128,0.08)', 'rgba(239,68,68,0.06)']} style={StyleSheet.absoluteFill} />
            <Text style={styles.correlationTitle}>SPF → Skin Score Impact</Text>
            <View style={styles.correlationRow}>
              <View style={styles.correlationItem}>
                <Text style={[styles.correlationScore, { color: '#4ADE80' }]}>{highProtectionScanAvg}</Text>
                <Text style={styles.correlationLabel}>After SPF 30+ days</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={Colors.textMuted} />
              <View style={styles.correlationItem}>
                <Text style={[styles.correlationScore, { color: Colors.scorePoor }]}>{noProtectionScanAvg}</Text>
                <Text style={styles.correlationLabel}>After unprotected days</Text>
              </View>
            </View>
          </View>
        )}

        {/* Education */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>UV & Skin Science</Text>
          {[
            { icon: '☀️', tip: 'UVA (aging rays) penetrate clouds and glass. UVB (burning rays) peak 10am-4pm. Both damage collagen.' },
            { icon: '🌿', tip: 'Tallow contains vitamin D3 precursors — but it doesn\'t replace SPF. Use tallow after sun protection, not instead of it.' },
            { icon: '⏱️', tip: 'SPF 30 blocks ~97% of UVB. SPF 50 blocks ~98%. Reapplication every 2 hours matters more than SPF number.' },
            { icon: '💊', tip: '15-30 minutes of midday sun on your arms and face produces enough vitamin D3. After that, risk outweighs benefit.' },
            { icon: '🔴', tip: 'A single blistering sunburn at any age doubles lifetime melanoma risk. Daily SPF is the #1 anti-aging habit.' },
          ].map((item, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipIcon}>{item.icon}</Text>
              <Text style={styles.tipText}>{item.tip}</Text>
            </View>
          ))}
        </View>

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
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 10, marginBottom: 14,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  savedText: { fontSize: 11, fontWeight: '700', color: '#4ADE80' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },

  exposureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  exposureChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated,
  },
  exposureChipActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}15` },
  exposureEmoji: { fontSize: 14 },
  exposureLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },

  spfRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  spfChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated,
  },
  spfLabel: { fontSize: 12, fontWeight: '700' },

  reapplyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  reapplyBtnActive: { borderColor: `${Colors.primary}50`, backgroundColor: `${Colors.primary}10` },
  reapplyText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },

  activitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  activityChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated,
  },
  activityChipActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}15` },
  activityText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 48, borderRadius: 12, backgroundColor: Colors.primary,
  },
  saveBtnSaved: { backgroundColor: 'rgba(74,222,128,0.08)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  riskCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1.5,
    padding: 16, gap: 8, marginBottom: 14,
  },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  riskDot: { width: 10, height: 10, borderRadius: 5 },
  riskLabel: { fontSize: 16, fontWeight: '800' },
  riskDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  riskDivider: { height: 1, backgroundColor: Colors.border },
  vitaminDRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  vitaminDIcon: { fontSize: 16, width: 22, textAlign: 'center' },
  vitaminDText: { flex: 1, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 12,
    alignItems: 'center', gap: 3,
  },
  statNum: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '600', textAlign: 'center' },

  chart: { flexDirection: 'row', gap: 2, height: 80, alignItems: 'flex-end' },
  chartCol: { flex: 1, alignItems: 'center', gap: 3 },
  chartBarWrap: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 3, minHeight: 3 },
  chartDay: { fontSize: 8, color: Colors.textMuted, fontWeight: '600' },
  chartLegend: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: Colors.textMuted },

  correlationCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 12, marginBottom: 14,
  },
  correlationTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  correlationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  correlationItem: { alignItems: 'center', gap: 4 },
  correlationScore: { fontSize: 28, fontWeight: '900' },
  correlationLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textAlign: 'center' },

  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipIcon: { fontSize: 18, width: 26, textAlign: 'center' },
  tipText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
