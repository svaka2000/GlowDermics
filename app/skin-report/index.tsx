import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Share, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Groq from 'groq-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

const CACHE_KEY = 'gd_skin_report';
const CACHE_TTL = 1000 * 60 * 60 * 24 * 5; // 5 days

type SkinReport = {
  generatedAt: number;
  overallGrade: string;
  gradeLabel: string;
  headline: string;
  executiveSummary: string;
  skinScoreAnalysis: {
    trend: 'improving' | 'declining' | 'stable';
    trendNote: string;
    bestScore: number;
    bestScoreDate: string;
    lowestScore: number;
    avgScore: number;
  };
  topInsights: string[];
  habits: {
    wellDoing: string[];
    needsWork: string[];
  };
  ingredientsToEmbrace: { name: string; why: string }[];
  ingredientsToAvoid: { name: string; why: string }[];
  monthlyGoal: string;
  tallowMoment: string;
  motivationalClose: string;
};

const GRADE_COLORS: Record<string, string> = {
  'A+': '#4ADE80', 'A': '#4ADE80', 'A-': '#86EFAC',
  'B+': '#86EFAC', 'B': '#D4A96A', 'B-': '#D4A96A',
  'C+': '#F97316', 'C': '#F97316', 'C-': '#EF4444',
  'D': '#EF4444', 'F': '#EF4444',
};

export default function SkinReportScreen() {
  const [report, setReport] = useState<SkinReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    loadCached();
  }, []));

  const loadCached = async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Date.now() - cached.generatedAt < CACHE_TTL) {
          setReport(cached);
          return;
        }
      }
    } catch {}
  };

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const [history, profile, journal, routineLog, sleepRaw, waterRaw, stressRaw] = await Promise.all([
        Storage.getScanHistory(),
        Storage.getUserProfile(),
        Storage.getJournal(),
        AsyncStorage.getItem('gd_routine_log'),
        AsyncStorage.getItem('gd_sleep_log'),
        AsyncStorage.getItem('gd_water'),
        AsyncStorage.getItem('gd_stress_log'),
      ]);

      const recentScans = history.slice(0, 30);
      const avgScore = recentScans.length > 0
        ? Math.round(recentScans.reduce((s, h) => s + h.overallScore, 0) / recentScans.length)
        : 0;

      const sleepLog = sleepRaw ? JSON.parse(sleepRaw) : [];
      const waterData = waterRaw ? JSON.parse(waterRaw) : {};
      const stressLog = stressRaw ? JSON.parse(stressRaw) : [];

      const avgSleep = sleepLog.length > 0
        ? (sleepLog.slice(0, 14).reduce((s: number, e: any) => s + e.hours, 0) / Math.min(14, sleepLog.length)).toFixed(1)
        : '—';

      const waterDays = Object.values(waterData as Record<string, number>).slice(-14);
      const avgWater = waterDays.length > 0
        ? (waterDays.reduce((s, v) => s + v, 0) / waterDays.length).toFixed(1)
        : '—';

      const avgStress = stressLog.length > 0
        ? (stressLog.slice(0, 14).reduce((s: number, e: any) => s + e.level, 0) / Math.min(14, stressLog.length)).toFixed(1)
        : '—';

      const prompt = `You are a clinical skin health analyst. Generate a comprehensive monthly skin health report for this user. Return ONLY valid JSON.

User data:
- Name: ${profile?.name || 'User'}
- Skin type: ${profile?.skinType || 'unknown'}
- Primary concerns: ${profile?.primaryConcerns?.join(', ') || 'none specified'}
- Total scans: ${history.length}
- Average skin score (last 30 scans): ${avgScore}/100
- Best score: ${recentScans.length > 0 ? Math.max(...recentScans.map(s => s.overallScore)) : 0}
- Worst score: ${recentScans.length > 0 ? Math.min(...recentScans.map(s => s.overallScore)) : 0}
- Score trend: ${recentScans.length > 1 ? (recentScans[0].overallScore > recentScans[recentScans.length - 1].overallScore ? 'improving' : 'declining') : 'insufficient data'}
- Journal entries last 30 days: ${journal.filter(j => Date.now() - new Date(j.date).getTime() < 30 * 24 * 60 * 60 * 1000).length}
- Average sleep: ${avgSleep} hours
- Average daily water: ${avgWater} glasses
- Average stress level: ${avgStress}/5

Return this exact JSON:
{
  "overallGrade": "A-",
  "gradeLabel": "Excellent Progress",
  "headline": "One compelling sentence summarizing their skin journey this month",
  "executiveSummary": "3-4 sentences. Honest, specific, warm. Reference their actual data.",
  "skinScoreAnalysis": {
    "trend": "improving",
    "trendNote": "1 sentence explaining the trend and what's driving it",
    "bestScore": ${recentScans.length > 0 ? Math.max(...recentScans.map(s => s.overallScore)) : 0},
    "bestScoreDate": "this month",
    "lowestScore": ${recentScans.length > 0 ? Math.min(...recentScans.map(s => s.overallScore)) : 0},
    "avgScore": ${avgScore}
  },
  "topInsights": ["3-4 specific, data-backed insights about their skin patterns"],
  "habits": {
    "wellDoing": ["2-3 specific habits that are helping their skin"],
    "needsWork": ["2-3 specific areas for improvement with actionable tips"]
  },
  "ingredientsToEmbrace": [
    {"name": "Ingredient name", "why": "Why it fits their specific skin profile"}
  ],
  "ingredientsToAvoid": [
    {"name": "Ingredient name", "why": "Why it conflicts with their skin concerns"}
  ],
  "monthlyGoal": "One specific, achievable goal for the coming month",
  "tallowMoment": "1-2 sentences connecting tallow's unique benefits to their specific skin situation",
  "motivationalClose": "A warm, honest closing thought. Not generic."
}`;

      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 1200,
      });

      const text = res.choices[0]?.message?.content || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Invalid response');

      const parsed: SkinReport = JSON.parse(match[0]);
      parsed.generatedAt = Date.now();

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      setReport(parsed);
    } catch (e) {
      setError('Could not generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const shareReport = async () => {
    if (!report) return;
    const text = `My GlowDermics Skin Report

Grade: ${report.overallGrade} — ${report.gradeLabel}
"${report.headline}"

${report.executiveSummary}

Monthly Goal: ${report.monthlyGoal}

Generated by GlowDermics for TallowDermics`;

    await Share.share({ message: text });
  };

  const gradeColor = report ? (GRADE_COLORS[report.overallGrade] || Colors.gold) : Colors.gold;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Skin Report</Text>
            <Text style={styles.headerSub}>AI-generated monthly analysis</Text>
          </View>
          {report && (
            <Pressable style={styles.shareBtn} onPress={shareReport}>
              <Ionicons name="share-outline" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
          {!report && <View style={{ width: 36 }} />}
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {!report && !loading && (
          <View style={styles.emptyState}>
            <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyTitle}>Your Monthly Skin Report</Text>
            <Text style={styles.emptyDesc}>
              Get a comprehensive AI-written analysis of your skin health, habits, trends, and personalized recommendations. Based on all your tracking data.
            </Text>
            <Pressable style={styles.generateBtn} onPress={generate}>
              <Text style={styles.generateBtnText}>Generate Report</Text>
              <Ionicons name="sparkles" size={18} color={Colors.bg} />
            </Pressable>
          </View>
        )}

        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingTitle}>Analyzing your skin data...</Text>
            <Text style={styles.loadingDesc}>Reviewing scans, habits, sleep, stress, and more</Text>
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {report && (
          <>
            {/* Grade hero */}
            <View style={[styles.gradeHero, { borderColor: `${gradeColor}50` }]}>
              <LinearGradient colors={[`${gradeColor}15`, `${gradeColor}05`]} style={StyleSheet.absoluteFill} />
              <Text style={[styles.gradeText, { color: gradeColor }]}>{report.overallGrade}</Text>
              <Text style={styles.gradeLabelText}>{report.gradeLabel}</Text>
              <Text style={styles.gradeHeadline}>"{report.headline}"</Text>
            </View>

            {/* Executive summary */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Monthly Overview</Text>
              <Text style={styles.summaryText}>{report.executiveSummary}</Text>
            </View>

            {/* Score analysis */}
            <View style={styles.scoreCard}>
              <LinearGradient colors={['rgba(196,98,45,0.08)', 'rgba(196,98,45,0.02)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.cardTitle}>Skin Score Analysis</Text>
              <View style={styles.scoreRow}>
                <View style={styles.scoreItem}>
                  <Text style={[styles.scoreNum, { color: '#4ADE80' }]}>{report.skinScoreAnalysis.bestScore}</Text>
                  <Text style={styles.scoreLabel}>Best</Text>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={[styles.scoreNum, { color: Colors.gold }]}>{report.skinScoreAnalysis.avgScore}</Text>
                  <Text style={styles.scoreLabel}>Average</Text>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={[styles.scoreNum, { color: Colors.scorePoor }]}>{report.skinScoreAnalysis.lowestScore}</Text>
                  <Text style={styles.scoreLabel}>Lowest</Text>
                </View>
              </View>
              <View style={styles.trendRow}>
                <Ionicons
                  name={report.skinScoreAnalysis.trend === 'improving' ? 'trending-up' : report.skinScoreAnalysis.trend === 'declining' ? 'trending-down' : 'remove'}
                  size={16}
                  color={report.skinScoreAnalysis.trend === 'improving' ? '#4ADE80' : report.skinScoreAnalysis.trend === 'declining' ? Colors.scorePoor : Colors.textMuted}
                />
                <Text style={styles.trendNote}>{report.skinScoreAnalysis.trendNote}</Text>
              </View>
            </View>

            {/* Top insights */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Key Insights</Text>
              {report.topInsights.map((insight, i) => (
                <View key={i} style={styles.insightRow}>
                  <View style={styles.insightBadge}>
                    <Text style={styles.insightNum}>{i + 1}</Text>
                  </View>
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </View>

            {/* Habits */}
            <View style={styles.habitsGrid}>
              <View style={[styles.habitCard, styles.goodHabitCard]}>
                <Text style={styles.habitTitle}>✅ Doing Well</Text>
                {report.habits.wellDoing.map((h, i) => (
                  <View key={i} style={styles.habitRow}>
                    <View style={[styles.habitDot, { backgroundColor: '#4ADE80' }]} />
                    <Text style={styles.habitText}>{h}</Text>
                  </View>
                ))}
              </View>
              <View style={[styles.habitCard, styles.needsWorkCard]}>
                <Text style={styles.habitTitle}>⚠️ Improve</Text>
                {report.habits.needsWork.map((h, i) => (
                  <View key={i} style={styles.habitRow}>
                    <View style={[styles.habitDot, { backgroundColor: Colors.gold }]} />
                    <Text style={styles.habitText}>{h}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Ingredients */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ingredient Guidance</Text>
              <Text style={styles.ingredientSectionLabel}>✅ Embrace these</Text>
              {report.ingredientsToEmbrace.map((ing, i) => (
                <View key={i} style={styles.ingredientRow}>
                  <Text style={[styles.ingredientName, { color: '#4ADE80' }]}>{ing.name}</Text>
                  <Text style={styles.ingredientWhy}>{ing.why}</Text>
                </View>
              ))}
              <Text style={[styles.ingredientSectionLabel, { color: Colors.scorePoor, marginTop: 8 }]}>⚠️ Avoid or reduce</Text>
              {report.ingredientsToAvoid.map((ing, i) => (
                <View key={i} style={styles.ingredientRow}>
                  <Text style={[styles.ingredientName, { color: Colors.scorePoor }]}>{ing.name}</Text>
                  <Text style={styles.ingredientWhy}>{ing.why}</Text>
                </View>
              ))}
            </View>

            {/* Monthly goal */}
            <View style={styles.goalCard}>
              <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Text style={styles.goalLabel}>THIS MONTH'S GOAL</Text>
              <Text style={styles.goalText}>{report.monthlyGoal}</Text>
            </View>

            {/* Tallow moment */}
            <View style={styles.tallowCard}>
              <LinearGradient colors={[`${Colors.primary}12`, `${Colors.primary}04`]} style={StyleSheet.absoluteFill} />
              <Text style={styles.tallowTitle}>🌿 Tallow & Your Skin</Text>
              <Text style={styles.tallowText}>{report.tallowMoment}</Text>
            </View>

            {/* Closing */}
            <View style={styles.closeCard}>
              <Text style={styles.closeText}>"{report.motivationalClose}"</Text>
            </View>

            {/* Regenerate */}
            <View style={styles.regenRow}>
              <Text style={styles.regenDate}>
                Generated {new Date(report.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              <Pressable onPress={generate} style={styles.regenBtn}>
                <Ionicons name="refresh-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.regenText}>Regenerate</Text>
              </Pressable>
            </View>
          </>
        )}

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
  shareBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  scroll: { paddingHorizontal: 16 },

  emptyState: {
    borderRadius: 20, overflow: 'hidden', padding: 32, gap: 12,
    alignItems: 'center', marginBottom: 14,
  },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: Colors.white },
  emptyDesc: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 22 },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.textPrimary, paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 14, marginTop: 8,
  },
  generateBtnText: { fontSize: 16, fontWeight: '800', color: Colors.bg },

  loadingCard: {
    backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
    padding: 40, gap: 12, alignItems: 'center', marginBottom: 14,
  },
  loadingTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  loadingDesc: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  errorText: { fontSize: 14, color: Colors.scorePoor, textAlign: 'center', marginBottom: 14 },

  gradeHero: {
    borderRadius: 20, overflow: 'hidden', borderWidth: 2,
    padding: 28, gap: 8, marginBottom: 14, alignItems: 'center',
  },
  gradeText: { fontSize: 72, fontWeight: '900' },
  gradeLabelText: { fontSize: 16, fontWeight: '800', color: Colors.textSecondary },
  gradeHeadline: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', fontStyle: 'italic', lineHeight: 20 },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 10, marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  summaryText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  scoreCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 10, marginBottom: 14,
  },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-around' },
  scoreItem: { alignItems: 'center', gap: 4 },
  scoreNum: { fontSize: 32, fontWeight: '900' },
  scoreLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendNote: { flex: 1, fontSize: 13, color: Colors.textMuted, lineHeight: 19 },

  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  insightBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: `${Colors.primary}20`, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  insightNum: { fontSize: 11, fontWeight: '900', color: Colors.primary },
  insightText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  habitsGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  habitCard: {
    flex: 1, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: 12, gap: 8,
  },
  goodHabitCard: { backgroundColor: 'rgba(74,222,128,0.05)' },
  needsWorkCard: { backgroundColor: 'rgba(212,169,106,0.05)' },
  habitTitle: { fontSize: 11, fontWeight: '800', color: Colors.textPrimary },
  habitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  habitDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  habitText: { flex: 1, fontSize: 11, color: Colors.textSecondary, lineHeight: 17 },

  ingredientSectionLabel: { fontSize: 11, fontWeight: '700', color: '#4ADE80' },
  ingredientRow: { gap: 2 },
  ingredientName: { fontSize: 13, fontWeight: '800' },
  ingredientWhy: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  goalCard: {
    borderRadius: 16, overflow: 'hidden', padding: 20, gap: 6, marginBottom: 14,
  },
  goalLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5 },
  goalText: { fontSize: 18, fontWeight: '800', color: Colors.white, lineHeight: 26 },

  tallowCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: `${Colors.primary}30`,
    padding: 16, gap: 6, marginBottom: 14,
  },
  tallowTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  tallowText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  closeCard: {
    backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: 16, alignItems: 'center', marginBottom: 10,
  },
  closeText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, fontStyle: 'italic' },

  regenRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  regenDate: { fontSize: 11, color: Colors.textMuted },
  regenBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  regenText: { fontSize: 12, color: Colors.textMuted, textDecorationLine: 'underline' },
});
