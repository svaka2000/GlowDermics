import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Share, Animated, Easing,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '', dangerouslyAllowBrowser: true });
const CACHE_KEY = 'gd_weekly_digest';
const CACHE_TTL = 3 * 24 * 60 * 60 * 1000;

type Focus = {
  action: string;
  why: string;
  impact: 'high' | 'medium' | 'low';
};

type DigestResult = {
  weekGrade: string;
  gradeLabel: string;
  narrative: string;
  bestHabit: string;
  biggestMiss: string;
  skinTrend: 'improving' | 'declining' | 'stable' | 'no_data';
  skinTrendNote: string;
  focusNextWeek: Focus[];
  motivationalNote: string;
  routineScore: number;
  waterScore: number;
  ts: number;
};

function buildGradeColors(c: Palette): Record<string, string> {
  return {
    'A+': '#4ADE80', A: '#4ADE80', 'B+': '#86EFAC', B: '#86EFAC',
    'C+': c.gold, C: c.gold, D: '#FCA5A5', F: c.scorePoor,
  };
}

const GRADE_BG: Record<string, string> = {
  'A+': 'rgba(74,222,128,0.15)', A: 'rgba(74,222,128,0.12)', 'B+': 'rgba(134,239,172,0.12)',
  B: 'rgba(134,239,172,0.10)', 'C+': 'rgba(212,169,106,0.12)', C: 'rgba(212,169,106,0.10)',
  D: 'rgba(252,165,165,0.12)', F: 'rgba(248,113,113,0.12)',
};

export default function WeeklyDigest() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const GRADE_COLORS = useMemo(() => buildGradeColors(colors), [colors]);
  const [digest, setDigest] = useState<DigestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [weekStats, setWeekStats] = useState<any>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    headerAnim.setValue(0);
    contentAnim.setValue(0);
    Animated.stagger(100, [
      Animated.timing(headerAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    loadData();
  }, []));

  const loadData = async () => {
    // Load last 7 days of data
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    const [history, routineLog, journal, profile] = await Promise.all([
      Storage.getScanHistory(),
      Storage.getFullRoutineLog(),
      Storage.getJournal(),
      Storage.getUserProfile(),
    ]);

    // Filter to last 7 days
    const recentScans = history.filter(h => new Date(h.date) >= weekAgo);
    const recentRoutine = routineLog.filter(r => new Date(r.date) >= weekAgo);
    const recentJournal = journal.filter(j => new Date(j.date) >= weekAgo);

    // Water this week
    const waterRaw = await AsyncStorage.getItem('gd_water');
    const waterData: Record<string, number> = waterRaw ? JSON.parse(waterRaw) : {};
    const waterDays = Object.entries(waterData).filter(([d]) => new Date(d) >= weekAgo);
    const waterAvg = waterDays.length > 0 ? waterDays.reduce((s, [, v]) => s + v, 0) / waterDays.length : 0;

    // Habits this week
    const habitsRaw = await AsyncStorage.getItem('gd_daily_habits');
    const habitsData: Record<string, string[]> = habitsRaw ? JSON.parse(habitsRaw) : {};
    const habitDays = Object.entries(habitsData).filter(([d]) => new Date(d) >= weekAgo);
    const habitAvg = habitDays.length > 0 ? habitDays.reduce((s, [, v]) => s + v.length, 0) / habitDays.length : 0;

    // Routine compliance
    const routineCompliance = recentRoutine.length > 0
      ? (recentRoutine.filter(r => r.morning || r.evening).length / 7) * 100
      : 0;

    const stats = {
      scansCount: recentScans.length,
      scanScores: recentScans.map(s => s.overallScore),
      scoreTrend: recentScans.length >= 2 ? recentScans[0].overallScore - recentScans[recentScans.length - 1].overallScore : 0,
      latestScore: recentScans[0]?.overallScore ?? null,
      routineDays: recentRoutine.filter(r => r.morning || r.evening).length,
      routineCompliance: Math.round(routineCompliance),
      journalDays: recentJournal.length,
      moods: recentJournal.map(j => j.mood),
      waterAvg: Math.round(waterAvg * 10) / 10,
      habitAvg: Math.round(habitAvg * 10) / 10,
      skinType: profile?.skinType ?? 'unknown',
      concerns: profile?.primaryConcerns ?? [],
    };
    setWeekStats(stats);

    // Check cache
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: DigestResult = JSON.parse(cached);
      if (Date.now() - parsed.ts < CACHE_TTL) {
        setDigest(parsed);
        return;
      }
    }

    await generate(stats);
  };

  const generate = async (stats: any) => {
    setLoading(true);
    try {
      const moodCount: Record<string, number> = {};
      stats.moods.forEach((m: string) => { moodCount[m] = (moodCount[m] || 0) + 1; });
      const dominantMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'none logged';

      const prompt = `You are Vera, Velumi AI's personal skin coach, writing this week's digest directly TO this person — warm, specific, and honest. Speak in second person ("your week", "you nailed…", "you'll want to…"), ground every line in their ACTUAL numbers below (cite the real scores, %, days, mood — don't speak in generalities), celebrate what they genuinely did well, and be kind but straight about what slipped. No platitudes, no form-letter filler — this should read like a coach who actually watched their week.

Week data (last 7 days):
- Scans taken: ${stats.scansCount} (scores: ${stats.scanScores.join(', ') || 'none'})
- Score trend: ${stats.scoreTrend > 0 ? '+' + stats.scoreTrend : stats.scoreTrend} points this week
- Routine days: ${stats.routineDays}/7 (${stats.routineCompliance}% compliance)
- Journal entries: ${stats.journalDays}/7 days
- Dominant mood: ${dominantMood}
- Water average: ${stats.waterAvg} glasses/day (goal: 8)
- Habit average: ${stats.habitAvg}/5 habits per day completed
- Skin type: ${stats.skinType}
- Concerns: ${stats.concerns.join(', ') || 'general'}

Return ONLY valid JSON (no markdown):
{
  "weekGrade": "<A+|A|B+|B|C+|C|D|F>",
  "gradeLabel": "<2-3 word grade label e.g. 'Consistent Week' or 'Room to Grow'>",
  "narrative": "<2-3 warm sentences spoken directly TO them ('your week', 'you') — honest coaching that cites their actual numbers (score trend, compliance %, mood) and names the one thing that most shaped the week>",
  "bestHabit": "<1 warm second-person sentence naming the specific thing YOU did best this week, tied to a real number>",
  "biggestMiss": "<1 second-person sentence — kind but straight about the one area that slipped (name the real gap), framed as the easiest win to reclaim>",
  "skinTrend": "<improving|declining|stable|no_data>",
  "skinTrendNote": "<1 second-person sentence on what this trend means for YOUR skin and what's driving it>",
  "focusNextWeek": [
    {
      "action": "<specific, concrete goal for YOUR next week (not generic advice) — tied to what slipped>",
      "why": "<1 second-person sentence on why this moves the needle for your skin>",
      "impact": "<high|medium|low>"
    },
    {
      "action": "<second action>",
      "why": "<why>",
      "impact": "<high|medium|low>"
    },
    {
      "action": "<third action>",
      "why": "<why>",
      "impact": "<high|medium|low>"
    }
  ],
  "motivationalNote": "<1 genuine, specific second-person sentence tied to THEIR journey and skin goals — encouraging without being a platitude>",
  "routineScore": <0-100 score for routine compliance this week>,
  "waterScore": <0-100 score for hydration this week>
}

VOICE — applies to the prose strings ONLY (gradeLabel, narrative, bestHabit, biggestMiss, skinTrendNote, focusNextWeek[].action/.why, motivationalNote); NOT to weekGrade/skinTrend/impact enums or routineScore/waterScore numbers, which stay exactly as specified: write every prose string in warm second person ("your week", "you", "you'll"), grounded in the SPECIFIC numbers above — never generic. Be honest about the miss but always constructive and encouraging. Keep every JSON field name, the shape, and the enum/number rules above EXACTLY.`;

      const resp = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const text = resp.choices[0].message.content ?? '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('no json');
      const parsed: DigestResult = { ...JSON.parse(match[0]), ts: Date.now() };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      setDigest(parsed);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!digest) return;
    await Share.share({
      message: [
        `📊 My Week in Skin — Velumi AI`,
        '',
        `Grade: ${digest.weekGrade} — ${digest.gradeLabel}`,
        '',
        digest.narrative,
        '',
        `Next week I'm focusing on:`,
        ...digest.focusNextWeek.map((f, i) => `${i + 1}. ${f.action}`),
        '',
        digest.motivationalNote,
        '',
        '— Velumi AI',
      ].join('\n'),
    });
  };

  const impactColor = (impact: string) => impact === 'high' ? colors.primary : impact === 'medium' ? colors.gold : colors.textMuted;

  const trendIcon = (trend: string) => {
    if (trend === 'improving') return { name: 'trending-up' as const, color: '#4ADE80' };
    if (trend === 'declining') return { name: 'trending-down' as const, color: colors.scorePoor };
    return { name: 'remove' as const, color: colors.gold };
  };

  const weekLabel = () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(weekAgo)} – ${fmt(today)}`;
  };

  return (
    <View style={styles.root}>
      <Animated.View style={{
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
      }}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
            <View>
              <Text style={styles.headerTitle} numberOfLines={1}>Weekly Digest</Text>
              <Text style={styles.headerSub}>{weekLabel()}</Text>
            </View>
            {digest ? (
              <Pressable style={styles.backBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color={colors.primary} />
              </Pressable>
            ) : (
              <View style={{ width: 36 }} />
            )}
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        style={{ opacity: contentAnim }}
      >

        {loading && (
          <View style={styles.loadingCard}>
            <LinearGradient colors={['rgba(196,98,45,0.1)', 'rgba(196,98,45,0.02)']} style={StyleSheet.absoluteFill} />
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Analyzing your week...</Text>
          </View>
        )}

        {!loading && !digest && weekStats && (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataEmoji}>📊</Text>
            <Text style={styles.noDataTitle}>No digest yet</Text>
            <Text style={styles.noDataSub}>Start tracking your routine and journal to generate weekly insights.</Text>
            <Pressable style={styles.generateBtn} onPress={() => generate(weekStats)}>
              <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} />
              <Text style={styles.generateBtnText}>Generate Digest</Text>
            </Pressable>
          </View>
        )}

        {digest && !loading && (
          <>
            {/* Grade hero */}
            <View style={[styles.gradeCard, { backgroundColor: GRADE_BG[digest.weekGrade] ?? 'rgba(196,98,45,0.1)' }]}>
              <LinearGradient colors={['rgba(196,98,45,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={styles.gradeLeft}>
                <Text style={styles.gradeWeek}>{weekLabel()}</Text>
                <Text style={[styles.gradeNum, { color: GRADE_COLORS[digest.weekGrade] ?? colors.primary }]}>{digest.weekGrade}</Text>
                <Text style={styles.gradeLabel}>{digest.gradeLabel}</Text>
              </View>
              <View style={styles.gradeStats}>
                <View style={styles.gradeStat}>
                  <Text style={[styles.gradeStatNum, { color: digest.routineScore >= 70 ? '#4ADE80' : digest.routineScore >= 50 ? colors.gold : colors.scorePoor }]}>
                    {digest.routineScore}%
                  </Text>
                  <Text style={styles.gradeStatLabel}>Routine</Text>
                </View>
                <View style={styles.gradeStat}>
                  <Text style={[styles.gradeStatNum, { color: digest.waterScore >= 70 ? '#4ADE80' : digest.waterScore >= 50 ? colors.gold : colors.scorePoor }]}>
                    {digest.waterScore}%
                  </Text>
                  <Text style={styles.gradeStatLabel}>Hydration</Text>
                </View>
              </View>
            </View>

            {/* Narrative */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your Week in Review</Text>
              <Text style={styles.narrativeText}>{digest.narrative}</Text>

              <View style={styles.highlightRow}>
                <View style={styles.highlightItem}>
                  <Text style={styles.highlightIcon}>✅</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.highlightLabel}>Best This Week</Text>
                    <Text style={styles.highlightText}>{digest.bestHabit}</Text>
                  </View>
                </View>
                <View style={[styles.highlightItem, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }]}>
                  <Text style={styles.highlightIcon}>⚡</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.highlightLabel}>Needs Attention</Text>
                    <Text style={styles.highlightText}>{digest.biggestMiss}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Skin trend */}
            {digest.skinTrend !== 'no_data' && (() => {
              const trend = trendIcon(digest.skinTrend);
              return (
                <View style={styles.trendCard}>
                  <LinearGradient colors={['rgba(196,98,45,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />
                  <Ionicons name={trend.name} size={26} color={trend.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trendLabel}>
                      Skin is {digest.skinTrend === 'improving' ? 'Improving' : digest.skinTrend === 'declining' ? 'Declining' : 'Stable'}
                    </Text>
                    <Text style={styles.trendNote}>{digest.skinTrendNote}</Text>
                  </View>
                </View>
              );
            })()}

            {/* Stats row */}
            {weekStats && (
              <View style={styles.statsRow}>
                {[
                  { icon: '📸', label: 'Scans', value: weekStats.scansCount },
                  { icon: '🌅', label: 'Routine days', value: `${weekStats.routineDays}/7` },
                  { icon: '📓', label: 'Journal', value: `${weekStats.journalDays}/7` },
                  { icon: '💧', label: 'Avg water', value: `${weekStats.waterAvg} gl` },
                ].map(item => (
                  <View key={item.label} style={styles.statBlock}>
                    <Text style={styles.statIcon}>{item.icon}</Text>
                    <Text style={styles.statValue}>{item.value}</Text>
                    <Text style={styles.statLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Focus next week */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Focus for Next Week</Text>
              <Text style={styles.cardSub}>Three specific actions to improve your score</Text>
              {digest.focusNextWeek.map((focus, i) => (
                <View key={i} style={styles.focusRow}>
                  <View style={[styles.focusNum, { backgroundColor: `${impactColor(focus.impact)}22` }]}>
                    <Text style={[styles.focusNumText, { color: impactColor(focus.impact) }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={styles.focusHeader}>
                      <Text style={styles.focusAction}>{focus.action}</Text>
                      <View style={[styles.focusImpact, { backgroundColor: `${impactColor(focus.impact)}20` }]}>
                        <Text style={[styles.focusImpactText, { color: impactColor(focus.impact) }]}>{focus.impact}</Text>
                      </View>
                    </View>
                    <Text style={styles.focusWhy}>{focus.why}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Motivational note */}
            <View style={styles.motCard}>
              <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <Text style={styles.motEmoji}>🌿</Text>
              <Text style={styles.motText}>{digest.motivationalNote}</Text>
            </View>

            {/* Regenerate */}
            <Pressable
              style={styles.regenBtn}
              onPress={() => { AsyncStorage.removeItem(CACHE_KEY); weekStats && generate(weekStats); }}
            >
              <Ionicons name="refresh-outline" size={16} color={colors.textMuted} />
              <Text style={styles.regenText}>Regenerate digest</Text>
            </Pressable>
          </>
        )}

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
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  loadingCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 32, alignItems: 'center', gap: 14, marginBottom: 14 },
  loadingText: { fontSize: 14, color: c.textSecondary },

  noDataCard: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  noDataEmoji: { fontSize: 48 },
  noDataTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
  noDataSub: { fontSize: 13, color: c.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  generateBtn: { borderRadius: 14, overflow: 'hidden', height: 50, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  generateBtnText: { fontSize: 15, fontWeight: '700', color: c.white },

  card: { backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 16, gap: 12, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  cardSub: { fontSize: 11, color: c.textMuted, marginTop: -8 },

  gradeCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: c.border, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  gradeLeft: { gap: 2 },
  gradeWeek: { fontSize: 10, fontWeight: '700', color: c.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  gradeNum: { fontSize: 56, fontWeight: '900', lineHeight: 64 },
  gradeLabel: { fontSize: 14, fontWeight: '600', color: c.textSecondary },
  gradeStats: { gap: 16 },
  gradeStat: { alignItems: 'center' },
  gradeStatNum: { fontSize: 20, fontWeight: '800' },
  gradeStatLabel: { fontSize: 10, color: c.textMuted, fontWeight: '600' },

  narrativeText: { fontSize: 14, color: c.textSecondary, lineHeight: 22 },
  highlightRow: { gap: 0 },
  highlightItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
  highlightIcon: { fontSize: 18 },
  highlightLabel: { fontSize: 10, fontWeight: '700', color: c.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  highlightText: { fontSize: 13, color: c.textSecondary, lineHeight: 18 },

  trendCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 14 },
  trendLabel: { fontSize: 14, fontWeight: '700', color: c.textPrimary },
  trendNote: { fontSize: 12, color: c.textMuted, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statBlock: { flex: 1, backgroundColor: c.bgCard, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 10, alignItems: 'center', gap: 3 },
  statIcon: { fontSize: 16 },
  statValue: { fontSize: 15, fontWeight: '800', color: c.textPrimary },
  statLabel: { fontSize: 9, color: c.textMuted, fontWeight: '600', textAlign: 'center', lineHeight: 12 },

  focusRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: 12 },
  focusNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  focusNumText: { fontSize: 13, fontWeight: '800' },
  focusHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  focusAction: { fontSize: 13, fontWeight: '600', color: c.textPrimary, flex: 1 },
  focusImpact: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  focusImpactText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  focusWhy: { fontSize: 12, color: c.textMuted, lineHeight: 18 },

  motCard: { borderRadius: 16, overflow: 'hidden', padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  motEmoji: { fontSize: 28 },
  motText: { flex: 1, fontSize: 14, fontWeight: '600', color: c.white, lineHeight: 22, fontStyle: 'italic' },

  regenBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  regenText: { fontSize: 12, color: c.textMuted },
  });
}
