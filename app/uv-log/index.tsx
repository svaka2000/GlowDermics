import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing,
  Dimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';
import { GlassHero, Card, Badge, ScatterPlot } from '../../src/components/ui';
import { runUVSkinAnalysis, UVSkinReport } from '../../src/engine/UVSkinEngine';

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

function buildSpfOptions(c: Palette) {
  return [
    { value: null, label: 'No SPF', color: c.scorePoor },
    { value: 15, label: 'SPF 15', color: c.scoreFair },
    { value: 30, label: 'SPF 30', color: c.scoreGood },
    { value: 50, label: 'SPF 50', color: c.scoreExcellent },
    { value: 100, label: 'SPF 100+', color: '#4ADE80' },
  ];
}

const ACTIVITIES = [
  'Morning walk', 'Outdoor workout', 'Driving', 'Sitting outside',
  'Beach/Pool', 'Hiking', 'Gardening', 'Sport',
];

function getTodayStr() {
  return new Date().toDateString();
}

function getUVRisk(exposureMin: number, spf: number | null, reapplied: boolean, c: Palette): { label: string; color: string; desc: string } {
  if (exposureMin === 0) return { label: 'No Exposure', color: c.textMuted, desc: 'No UV risk today.' };
  if (!spf) {
    if (exposureMin <= 15) return { label: 'Low Risk', color: c.scoreGood, desc: 'Brief exposure without SPF — watch for cumulative damage.' };
    if (exposureMin <= 60) return { label: 'Moderate Risk', color: c.gold, desc: 'Extended unprotected exposure causes collagen breakdown and pigmentation.' };
    return { label: 'High Risk', color: c.scorePoor, desc: 'Long unprotected sun exposure significantly accelerates skin aging.' };
  }
  const protection = spf * (reapplied ? 1.2 : 0.6);
  if (protection >= 30 && reapplied) return { label: 'Well Protected', color: c.scoreExcellent, desc: 'Great SPF routine — your skin barrier is protected.' };
  if (protection >= 20) return { label: 'Moderate Protection', color: c.scoreGood, desc: 'Good coverage but consider reapplying every 2 hours.' };
  return { label: 'Limited Protection', color: c.gold, desc: 'SPF applied but needs reapplication for full protection.' };
}

function getVitaminDNote(exposureMin: number): string {
  if (exposureMin === 0) return 'No vitamin D synthesis today — consider a D3 supplement.';
  if (exposureMin < 15) return 'Light exposure. Vitamin D synthesis starts at ~10-15 minutes of midday sun.';
  if (exposureMin <= 30) return 'Good vitamin D window — 15-30 minutes of midday sun can produce 10,000-20,000 IU.';
  return 'Ample sun exposure for vitamin D. Beyond 30 minutes, benefits plateau while UV damage increases.';
}

export default function UVLog() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const SPF_OPTIONS = useMemo(() => buildSpfOptions(colors), [colors]);
  const [log, setLog] = useState<UVEntry[]>([]);
  const [selectedExposure, setSelectedExposure] = useState<number | null>(null);
  const [selectedSPF, setSelectedSPF] = useState<number | null | undefined>(undefined);
  const [reapplied, setReapplied] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [scanHistory, setScanHistory] = useState<{ date: string; overallScore: number }[]>([]);
  const [report, setReport] = useState<UVSkinReport | null>(null);

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

    // Run the correlation engine in the background.
    const r = await runUVSkinAnalysis();
    setReport(r);
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

  const riskInfo = selectedExposure !== null && selectedSPF !== undefined
    ? getUVRisk(selectedExposure, selectedSPF, reapplied, colors)
    : null;

  return (
    <View style={styles.root}>
      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ opacity: contentAnim }}>
        <GlassHero height={130} tint={colors.primary} style={styles.heroWrap}>
          <SafeAreaView edges={['top']}>
            <Animated.View style={[styles.heroHeader, {
              opacity: headerAnim,
              transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
            }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.heroBackBtn}
                onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}
              >
                <Ionicons name="arrow-back" size={20} color={colors.white} />
              </Pressable>
              <View>
                <Text style={styles.heroTitle}>UV & Sun Log</Text>
                <Text style={styles.heroSub}>Track sun exposure and SPF habits</Text>
              </View>
              <View style={{ width: 36 }} />
            </Animated.View>
          </SafeAreaView>
        </GlassHero>

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
                <Text style={[styles.exposureLabel, selectedExposure === opt.min && { color: colors.primary }]}>{opt.label}</Text>
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
                <Text style={[styles.spfLabel, { color: selectedSPF === opt.value ? opt.color : colors.textMuted }]}>{opt.label}</Text>
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
                color={reapplied ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.reapplyText, reapplied && { color: colors.textPrimary }]}>Reapplied SPF every 2 hours</Text>
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
                <Text style={[styles.activityText, selectedActivities.includes(a) && { color: colors.primary }]}>{a}</Text>
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
              : <><Ionicons name="sunny-outline" size={18} color={colors.white} /><Text style={styles.saveBtnText}>Log Today</Text></>
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
              <Text style={[styles.statNum, { color: spfCompliance && spfCompliance >= 80 ? '#4ADE80' : colors.gold }]}>
                {spfCompliance !== null ? `${spfCompliance}%` : '—'}
              </Text>
              <Text style={styles.statLabel}>SPF compliance</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: avgExposure > 60 ? colors.scorePoor : avgExposure > 30 ? colors.gold : '#4ADE80' }]}>
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
                const barColor = !d.hasSpf && d.exposureMin > 0 ? colors.scorePoor
                  : d.exposureMin >= 60 ? colors.gold
                  : d.exposureMin > 0 ? '#4ADE80'
                  : colors.border;
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
                    <Text style={[styles.chartDay, d.isToday && { color: colors.primary, fontWeight: '800' }]}>
                      {d.isToday ? '•' : d.day}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#4ADE80' }]} /><Text style={styles.legendText}>Protected</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.gold }]} /><Text style={styles.legendText}>High exposure</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.scorePoor }]} /><Text style={styles.legendText}>Unprotected</Text></View>
            </View>
          </View>
        )}

        {/* UV × skin correlation — Pearson with scatter plot */}
        {report && (
          <View style={styles.correlationCardV2}>
            <View style={styles.correlationHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.correlationLabelTop}>UV × SKIN CORRELATION</Text>
                <Text style={styles.correlationTitle}>Is your sun exposure showing up?</Text>
              </View>
              {report.hasEnoughData && (
                <Badge
                  label={`r = ${report.correlationDamage.toFixed(2)}`}
                  tone={
                    report.correlationDamage <= -0.5
                      ? 'success'
                      : report.correlationDamage <= -0.25
                      ? 'warning'
                      : Math.abs(report.correlationDamage) < 0.15
                      ? 'neutral'
                      : 'danger'
                  }
                  size="sm"
                />
              )}
            </View>

            {report.hasEnoughData && report.points.length > 0 ? (
              <View style={{ alignItems: 'center', marginTop: 14 }}>
                <ScatterPlot
                  data={report.points.map(p => ({ x: p.uvDamage, y: p.skinScore }))}
                  width={Math.min(Dimensions.get('window').width - 64, 360)}
                  height={220}
                  xLabel="Effective UV damage (min, SPF-adjusted)"
                  yLabel="Skin score"
                  xRange={[0, Math.max(60, Math.ceil(Math.max(...report.points.map(p => p.uvDamage)) / 30) * 30)]}
                  yRange={[40, 100]}
                  showTrendLine
                  pointColor={colors.primary}
                  trendColor={colors.gold}
                />
              </View>
            ) : (
              <View style={styles.notEnoughBox}>
                <Ionicons name="hourglass-outline" size={18} color={colors.textMuted} />
                <Text style={styles.notEnoughText}>
                  Need {Math.max(0, 8 - report.sampleSize)} more matched scans to compute a reliable trend.
                  Each UV log pairs with the next scan within 48h.
                </Text>
              </View>
            )}

            <View style={styles.correlationStatsRow}>
              <View style={styles.correlationStat}>
                <Text style={styles.correlationStatLabel}>SAMPLE</Text>
                <Text style={styles.correlationStatNum}>{report.sampleSize}</Text>
              </View>
              <View style={styles.correlationStatDiv} />
              <View style={styles.correlationStat}>
                <Text style={styles.correlationStatLabel}>UNPROTECTED</Text>
                <Text style={[styles.correlationStatNum, { color: report.unprotectedDays > 0 ? colors.scorePoor : colors.scoreExcellent }]}>
                  {report.unprotectedDays}
                </Text>
              </View>
              <View style={styles.correlationStatDiv} />
              <View style={styles.correlationStat}>
                <Text style={styles.correlationStatLabel}>AVG SCORE</Text>
                <Text style={styles.correlationStatNum}>{Math.round(report.avgSkinScore)}</Text>
              </View>
              {report.toleranceCeiling && (
                <>
                  <View style={styles.correlationStatDiv} />
                  <View style={styles.correlationStat}>
                    <Text style={styles.correlationStatLabel}>TOLERATES</Text>
                    <Text style={[styles.correlationStatNum, { color: colors.scoreExcellent }]}>
                      {report.toleranceCeiling}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.verdictBox}>
              <Ionicons name="bulb" size={14} color={
                report.correlationDamage <= -0.5
                  ? colors.scoreExcellent
                  : report.hasEnoughData ? colors.gold : colors.textMuted
              } />
              <Text style={styles.verdictText}>{report.verdict}</Text>
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
      </Animated.ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },

  heroWrap: { marginHorizontal: -16, marginBottom: 14 },
  heroHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
  },
  heroBackBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22, fontWeight: '900', color: c.white, textAlign: 'center', letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.78)', textAlign: 'center', marginTop: 2, fontWeight: '600' },

  scroll: { paddingHorizontal: 16 },

  /* v2 correlation card */
  correlationCardV2: {
    backgroundColor: c.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#1C1814',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  correlationHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  correlationLabelTop: { fontSize: 9, fontWeight: '900', color: c.textMuted, letterSpacing: 1.4 },
  notEnoughBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: c.bgElevated,
    padding: 12, borderRadius: 12, marginTop: 10,
  },
  notEnoughText: { flex: 1, fontSize: 12, color: c.textSecondary, lineHeight: 17, fontWeight: '500' },
  correlationStatsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: c.bgElevated, borderRadius: 14, padding: 10, marginTop: 14,
  },
  correlationStat: { flex: 1, alignItems: 'center', gap: 2 },
  correlationStatLabel: { fontSize: 8, fontWeight: '900', color: c.textMuted, letterSpacing: 1 },
  correlationStatNum: { fontSize: 14, fontWeight: '900', color: c.textPrimary, letterSpacing: -0.2 },
  correlationStatDiv: { width: 1, height: 18, backgroundColor: 'rgba(28,24,20,0.10)' },
  verdictBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(196,98,45,0.06)',
    borderWidth: 1, borderColor: 'rgba(196,98,45,0.18)',
    borderRadius: 12, padding: 12, marginTop: 14,
  },
  verdictText: { flex: 1, fontSize: 12.5, color: c.textPrimary, lineHeight: 19, fontWeight: '500' },

  card: {
    backgroundColor: c.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: c.border, padding: 16, gap: 10, marginBottom: 14,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  savedText: { fontSize: 11, fontWeight: '700', color: '#4ADE80' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },

  exposureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  exposureChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated,
  },
  exposureChipActive: { borderColor: c.primary, backgroundColor: `${c.primary}15` },
  exposureEmoji: { fontSize: 14 },
  exposureLabel: { fontSize: 12, fontWeight: '600', color: c.textMuted },

  spfRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  spfChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated,
  },
  spfLabel: { fontSize: 12, fontWeight: '700' },

  reapplyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border,
    backgroundColor: c.bgElevated,
  },
  reapplyBtnActive: { borderColor: `${c.primary}50`, backgroundColor: `${c.primary}10` },
  reapplyText: { fontSize: 13, fontWeight: '600', color: c.textMuted },

  activitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  activityChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated,
  },
  activityChipActive: { borderColor: c.primary, backgroundColor: `${c.primary}15` },
  activityText: { fontSize: 12, fontWeight: '600', color: c.textMuted },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 48, borderRadius: 12, backgroundColor: c.primary,
  },
  saveBtnSaved: { backgroundColor: 'rgba(74,222,128,0.08)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: c.white },

  riskCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1.5,
    padding: 16, gap: 8, marginBottom: 14,
  },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  riskDot: { width: 10, height: 10, borderRadius: 5 },
  riskLabel: { fontSize: 16, fontWeight: '800' },
  riskDesc: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  riskDivider: { height: 1, backgroundColor: c.border },
  vitaminDRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  vitaminDIcon: { fontSize: 16, width: 22, textAlign: 'center' },
  vitaminDText: { flex: 1, fontSize: 12, color: c.textMuted, lineHeight: 18 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: c.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: c.border, padding: 12,
    alignItems: 'center', gap: 3,
  },
  statNum: { fontSize: 20, fontWeight: '800', color: c.textPrimary },
  statLabel: { fontSize: 9, color: c.textMuted, fontWeight: '600', textAlign: 'center' },

  chart: { flexDirection: 'row', gap: 2, height: 80, alignItems: 'flex-end' },
  chartCol: { flex: 1, alignItems: 'center', gap: 3 },
  chartBarWrap: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 3, minHeight: 3 },
  chartDay: { fontSize: 8, color: c.textMuted, fontWeight: '600' },
  chartLegend: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: c.textMuted },

  correlationTitle: { fontSize: 15, fontWeight: '900', color: c.textPrimary, letterSpacing: -0.2 },

  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipIcon: { fontSize: 18, width: 26, textAlign: 'center' },
  tipText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  });
}
