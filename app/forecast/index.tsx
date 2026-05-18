import { useCallback, useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Animated, Easing,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Groq from 'groq-sdk';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

type ForecastResult = {
  currentScore: number;
  score30: number;
  score60: number;
  score90: number;
  trajectory: 'improving' | 'declining' | 'stable';
  keyDrivers: string[];
  risks: string[];
  actions: { action: string; impact: 'high' | 'medium' | 'low'; timeframe: string }[];
  summary: string;
  tallowNote: string;
};

function getScoreColor(score: number, c: Palette): string {
  if (score >= 80) return c.scoreExcellent;
  if (score >= 65) return c.scoreGood;
  if (score >= 50) return c.scoreFair;
  return c.scorePoor;
}

export default function Forecast() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [error, setError] = useState('');
  const [hasData, setHasData] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    headerAnim.setValue(0);
    contentAnim.setValue(0);
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Storage.getScanHistory().then(h => setHasData(h.length >= 1));
  }, []));

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const [history, profile, routineLog, journal] = await Promise.all([
        Storage.getScanHistory(),
        Storage.getUserProfile(),
        Storage.getFullRoutineLog(),
        Storage.getJournal(),
      ]);

      // Habit score
      let avgHabitScore = 0;
      try {
        const raw = await AsyncStorage.getItem('gd_daily_habits');
        if (raw) {
          const logs = JSON.parse(raw);
          const recent = logs.slice(0, 7);
          if (recent.length > 0) {
            avgHabitScore = Math.round(recent.reduce((s: number, l: any) => s + (l.checked?.length ?? 0), 0) / recent.length / 12 * 100);
          }
        }
      } catch {}

      // Routine consistency (last 14 days)
      const last14 = Array.from({ length: 14 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toDateString();
      });
      const routineDays = last14.filter(day => routineLog.find(e => e.date === day && (e.morning || e.evening))).length;
      const routineConsistency = Math.round(routineDays / 14 * 100);

      // Score trend
      const scores = history.slice(0, 5).map(h => h.overallScore);
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const trend = scores.length >= 2 ? scores[0] - scores[scores.length - 1] : 0;

      const prompt = `You are Vera, Velumi AI's personal skin coach. You're forecasting THIS person's next 90 days and talking straight to them — warm, specific, second person ("your skin", "you'll", "if you keep…"). Ground every line in their ACTUAL numbers below, be honest about what's holding them back, and make the path forward feel achievable, not clinical. No "N/A"/"no data" hedging — if something isn't logged yet, speak to it warmly and move on.

User data:
- Current overall skin score: ${history[0]?.overallScore ?? 'no scan logged yet'}/100
- Scan history (newest first): ${scores.join(', ')} (${scores.length} scans)
- Score trend over scans: ${trend >= 0 ? '+' : ''}${trend} points
- Average score: ${avgScore}
- Skin type: ${profile?.skinType || 'not set yet'}
- Concerns: ${profile?.primaryConcerns?.join(', ') || 'none set yet'}
- Goals: ${profile?.goals?.join(', ') || 'none set yet'}
- Lifestyle: sleep ${profile?.lifestyle?.sleepHours ?? 7}hrs, water ${profile?.lifestyle?.waterIntake ?? 'moderate'}, diet ${profile?.lifestyle?.diet ?? 'balanced'}
- Routine consistency (last 14 days): ${routineConsistency}% (${routineDays}/14 days)
- Daily habit score (last 7 days average): ${avgHabitScore}%
- Journal entries: ${journal.length} total

Based on this data, forecast where their skin will be in 30, 60, and 90 days if they maintain current habits, and what they can achieve with improvements.

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "currentScore": ${history[0]?.overallScore ?? 50},
  "score30": <realistic 30-day projection, 0-100>,
  "score60": <realistic 60-day projection, 0-100>,
  "score90": <realistic 90-day projection, 0-100>,
  "trajectory": "<improving|declining|stable>",
  "keyDrivers": ["<top 3 things YOU'RE doing that are working — second person, name the real number/habit behind each>"],
  "risks": ["<top 3 honest things that could hold YOUR skin back — second person, specific to their data, kind but straight>"],
  "actions": [
    {"action": "<specific high-impact thing YOU should do, spoken to them ('start…', 'swap…')>", "impact": "<high|medium|low>", "timeframe": "<e.g. 2 weeks>"},
    {"action": "<second action, second person, concrete>", "impact": "<high|medium|low>", "timeframe": "<e.g. 4 weeks>"},
    {"action": "<third action, second person, concrete>", "impact": "<high|medium|low>", "timeframe": "<e.g. 4-6 weeks>"},
    {"action": "<fourth action, second person, concrete>", "impact": "<high|medium|low>", "timeframe": "<e.g. 6-8 weeks>"}
  ],
  "summary": "<2-3 warm sentences spoken directly TO them ('your skin', 'you') — an honest, motivating read of where their trajectory is heading and the one lever that matters most, citing their real numbers>",
  "tallowNote": "<1 warm second-person sentence with a brand-agnostic, high-impact skincare tip tailored to THEIR specific journey — honest, no products, no brand names>"
}

VOICE — applies to the prose strings ONLY (keyDrivers[], risks[], actions[].action, summary, tallowNote); NOT to currentScore/score30/score60/score90 numbers, the trajectory/impact enums, or the timeframe labels, which stay exactly as specified: write every prose string in warm second person ("your skin", "you", "you'll"), grounded in the SPECIFIC numbers above — never generic, never "N/A"/"no data" hedging. Be honest about the risks but always make the path forward feel achievable. Keep every JSON field name, the shape, and the enum/number rules above EXACTLY.`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 800,
      });

      const text = response.choices[0].message.content?.trim() || '';
      const json = text.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '');
      setResult(JSON.parse(json));
    } catch (e: any) {
      setError(e?.message || 'Failed to generate forecast.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
        }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>Skin Forecast</Text>
            <Text style={styles.headerSub}>AI-predicted 90-day trajectory</Text>
          </View>
          <View style={{ width: 36 }} />
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ opacity: contentAnim }}>

        {!hasData && !result && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🔮</Text>
            <Text style={styles.emptyTitle}>No scan data yet</Text>
            <Text style={styles.emptySub}>Take at least one skin scan to generate your forecast.</Text>
            <Pressable style={styles.scanBtn} onPress={() => router.push('/scan')}>
              <Text style={styles.scanBtnText}>Take a Scan →</Text>
            </Pressable>
          </View>
        )}

        {hasData && !result && !loading && (
          <View style={styles.introCard}>
            <LinearGradient
              colors={['rgba(138,120,96,0.12)', 'rgba(138,120,96,0.03)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.introHero}>🔮</Text>
            <Text style={styles.introTitle}>Your 90-Day Skin Forecast</Text>
            <Text style={styles.introDesc}>
              Our AI analyzes your scan history, routine consistency, lifestyle habits, and skin goals to predict where your skin is headed — and what will move the needle fastest.
            </Text>
            <View style={styles.introFactoids}>
              {[
                { icon: '📊', text: 'Based on your real scan data' },
                { icon: '🔄', text: 'Factors in routine consistency' },
                { icon: '🌿', text: 'Personalized to your lifestyle' },
              ].map(f => (
                <View key={f.text} style={styles.introFactoid}>
                  <Text style={styles.introFactoidIcon}>{f.icon}</Text>
                  <Text style={styles.introFactoidText}>{f.text}</Text>
                </View>
              ))}
            </View>
            <Pressable style={styles.generateBtn} onPress={generate}>
              <LinearGradient colors={[colors.primaryLight, colors.primary]} style={styles.generateBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="sparkles-outline" size={18} color={colors.white} />
                <Text style={styles.generateBtnText}>Generate My Forecast</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} size="large" style={{ marginBottom: 16 }} />
            <Text style={styles.loadingTitle}>Analyzing your skin data…</Text>
            <Text style={styles.loadingSub}>Our AI is modeling your skin trajectory based on scans, habits, and lifestyle.</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={generate}>
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        ) : null}

        {result && (
          <>
            {/* Score timeline */}
            <View style={styles.timelineCard}>
              <Text style={styles.cardTitle}>Score Trajectory</Text>
              <View style={styles.scoreTimeline}>
                {[
                  { label: 'Now', score: result.currentScore, sub: 'Current' },
                  { label: '30 Days', score: result.score30, sub: 'Projected' },
                  { label: '60 Days', score: result.score60, sub: 'Projected' },
                  { label: '90 Days', score: result.score90, sub: 'Projected' },
                ].map((item, i) => {
                  const isGain = item.score > result.currentScore;
                  const diff = item.score - result.currentScore;
                  return (
                    <View key={item.label} style={styles.timelineItem}>
                      <View style={styles.timelineConnector}>
                        {i > 0 && <View style={[styles.connectorLine, { backgroundColor: getScoreColor(item.score, colors) + '40' }]} />}
                        <View style={[styles.timelineDot, { backgroundColor: getScoreColor(item.score, colors) }]} />
                      </View>
                      <View style={[styles.scoreCircle, { borderColor: getScoreColor(item.score, colors) + '50' }]}>
                        <Text style={[styles.scoreCircleNum, { color: getScoreColor(item.score, colors) }]}>{item.score}</Text>
                        {i > 0 && (
                          <Text style={[styles.scoreDiff, { color: diff >= 0 ? colors.scoreExcellent : colors.scorePoor }]}>
                            {diff >= 0 ? '+' : ''}{diff}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.timelineLabel}>{item.label}</Text>
                      <Text style={styles.timelineSub}>{item.sub}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Trajectory badge */}
              <View style={[styles.trajectoryBadge, {
                backgroundColor: result.trajectory === 'improving'
                  ? 'rgba(74,222,128,0.12)'
                  : result.trajectory === 'declining'
                  ? 'rgba(248,113,113,0.12)'
                  : 'rgba(250,243,224,0.08)',
              }]}>
                <Ionicons
                  name={result.trajectory === 'improving' ? 'trending-up' : result.trajectory === 'declining' ? 'trending-down' : 'remove'}
                  size={14}
                  color={result.trajectory === 'improving' ? colors.scoreExcellent : result.trajectory === 'declining' ? colors.scorePoor : colors.textMuted}
                />
                <Text style={[styles.trajectoryText, {
                  color: result.trajectory === 'improving' ? colors.scoreExcellent : result.trajectory === 'declining' ? colors.scorePoor : colors.textMuted,
                }]}>
                  {result.trajectory === 'improving' ? 'Improving trajectory' : result.trajectory === 'declining' ? 'Declining — intervention needed' : 'Stable — room to grow'}
                </Text>
              </View>

              <Text style={styles.summaryText}>{result.summary}</Text>
            </View>

            {/* Key drivers */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>What's Driving Your Skin</Text>
              <Text style={styles.cardSub}>Positive factors in your current trajectory</Text>
              {result.keyDrivers.map((d, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.scoreExcellent} />
                  <Text style={styles.bulletText}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Risks */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Potential Risks</Text>
              <Text style={styles.cardSub}>What could hold you back</Text>
              {result.risks.map((r, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.scoreFair} />
                  <Text style={styles.bulletText}>{r}</Text>
                </View>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Actions to Accelerate</Text>
              <Text style={styles.cardSub}>Ranked by impact</Text>
              {result.actions.map((a, i) => (
                <View key={i} style={styles.actionCard}>
                  <View style={styles.actionLeft}>
                    <View style={[styles.impactBadge, {
                      backgroundColor: a.impact === 'high'
                        ? 'rgba(74,222,128,0.15)'
                        : a.impact === 'medium'
                        ? 'rgba(245,158,11,0.15)'
                        : 'rgba(250,243,224,0.08)',
                    }]}>
                      <Text style={[styles.impactText, {
                        color: a.impact === 'high' ? colors.scoreExcellent : a.impact === 'medium' ? colors.gold : colors.textMuted,
                      }]}>
                        {a.impact.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.actionText}>{a.action}</Text>
                  </View>
                  <View style={styles.timeframePill}>
                    <Text style={styles.timeframeText}>{a.timeframe}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Skin tip */}
            <Pressable style={styles.tallowCard} onPress={() => router.push('/product')}>
              <LinearGradient colors={['rgba(138,120,96,0.18)', 'rgba(138,120,96,0.06)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.tallowEmoji}>🌿</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.tallowTitle}>Your Skin Tip</Text>
                <Text style={styles.tallowText}>{result.tallowNote}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </Pressable>

            {/* Regenerate */}
            <Pressable style={styles.regenBtn} onPress={generate}>
              <Ionicons name="refresh-outline" size={16} color={colors.textMuted} />
              <Text style={styles.regenText}>Regenerate forecast</Text>
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
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  emptyCard: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: c.textPrimary },
  emptySub: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 22 },
  scanBtn: { backgroundColor: c.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  scanBtnText: { fontSize: 15, fontWeight: '700', color: c.white },

  introCard: {
    borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(138,120,96,0.2)',
    padding: 24, gap: 16, marginBottom: 16,
  },
  introHero: { fontSize: 44, textAlign: 'center' },
  introTitle: { fontSize: 22, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  introDesc: { fontSize: 14, color: c.textSecondary, lineHeight: 22, textAlign: 'center' },
  introFactoids: { gap: 10 },
  introFactoid: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  introFactoidIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  introFactoidText: { fontSize: 14, color: c.textSecondary },
  generateBtn: { borderRadius: 16, overflow: 'hidden' },
  generateBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: c.white },

  loadingCard: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadingTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
  loadingSub: { fontSize: 13, color: c.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  errorCard: { alignItems: 'center', padding: 24, gap: 14 },
  errorText: { fontSize: 14, color: c.scorePoor, textAlign: 'center' },
  retryBtn: { borderRadius: 12, borderWidth: 1, borderColor: c.borderStrong, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { fontSize: 14, color: c.primary, fontWeight: '600' },

  timelineCard: {
    backgroundColor: c.bgCard, borderRadius: 18, borderWidth: 1, borderColor: c.border,
    padding: 18, marginBottom: 14, gap: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary },
  cardSub: { fontSize: 11, color: c.textMuted, marginTop: -8, marginBottom: 4 },

  scoreTimeline: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  timelineItem: { alignItems: 'center', gap: 6, flex: 1 },
  timelineConnector: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', position: 'relative' },
  connectorLine: { position: 'absolute', height: 2, width: '50%', left: 0, top: '50%' },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  scoreCircle: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: c.bgElevated,
  },
  scoreCircleNum: { fontSize: 16, fontWeight: '800' },
  scoreDiff: { fontSize: 9, fontWeight: '700', marginTop: -2 },
  timelineLabel: { fontSize: 10, fontWeight: '700', color: c.textPrimary, textAlign: 'center' },
  timelineSub: { fontSize: 9, color: c.textMuted, textAlign: 'center' },

  trajectoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 10 },
  trajectoryText: { fontSize: 13, fontWeight: '600' },
  summaryText: { fontSize: 14, color: c.textSecondary, lineHeight: 21 },

  card: {
    backgroundColor: c.bgCard, borderRadius: 18, borderWidth: 1, borderColor: c.border,
    padding: 18, marginBottom: 14, gap: 12,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletText: { fontSize: 14, color: c.textSecondary, lineHeight: 20, flex: 1 },

  actionCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    backgroundColor: c.bgElevated, borderRadius: 12, padding: 12,
  },
  actionLeft: { flex: 1, gap: 6 },
  impactBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  impactText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  actionText: { fontSize: 13, color: c.textPrimary, lineHeight: 19 },
  timeframePill: { backgroundColor: c.bgCard, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: c.border },
  timeframeText: { fontSize: 10, color: c.textMuted, fontWeight: '600' },

  tallowCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(138,120,96,0.2)',
    padding: 16, marginBottom: 14,
  },
  tallowEmoji: { fontSize: 24 },
  tallowTitle: { fontSize: 13, fontWeight: '700', color: c.primary, marginBottom: 4 },
  tallowText: { fontSize: 13, color: c.textSecondary, lineHeight: 19 },

  regenBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14,
  },
  regenText: { fontSize: 13, color: c.textMuted },
  });
}
