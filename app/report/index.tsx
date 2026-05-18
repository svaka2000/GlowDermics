import { useEffect, useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';
import { ScoreBar } from '../../src/components/ScoreBar';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

type TrendReport = {
  headline: string;
  summary: string;
  improving: string[];
  needsAttention: string[];
  topInsight: string;
  nextSteps: string[];
};

export default function SkinTrendReport() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<TrendReport | null>(null);
  const [error, setError] = useState('');
  const [scanCount, setScanCount] = useState(0);
  const [latest, setLatest] = useState<any>(null);
  const [oldest, setOldest] = useState<any>(null);

  const reportAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    generate();
  }, []);

  useEffect(() => {
    if (report) {
      reportAnim.setValue(0);
      headerAnim.setValue(0);
      Animated.stagger(80, [
        Animated.timing(headerAnim, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(reportAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [report]);

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const [history, profile, journal] = await Promise.all([
        Storage.getScanHistory(),
        Storage.getUserProfile(),
        Storage.getJournal(),
      ]);

      setScanCount(history.length);

      if (history.length < 1) {
        setError('no_scans');
        setLoading(false);
        return;
      }

      const l = history[0];
      const o = history[history.length - 1];
      setLatest(l);
      setOldest(o);

      const scansContext = history.slice(0, 10).map((h, i) => {
        const date = new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `Scan ${i + 1} (${date}): Overall ${h.overallScore}, Hydration ${h.scores.hydration}, Texture ${h.scores.texture}, Clarity ${h.scores.clarity}, Evenness ${h.scores.evenness}, Firmness ${h.scores.firmness}, Pores ${h.scores.pores}`;
      }).join('\n');

      const journalContext = journal.slice(0, 7).map(j => {
        const date = new Date(j.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${date}: mood=${j.mood}, tags=[${j.tags.join(', ')}], note="${j.note.slice(0, 80)}"`;
      }).join('\n');

      const prompt = `You are Velumi AI's trend analyst. Analyze this user's skin progress data and generate a detailed trend report.

User profile: ${profile ? `${profile.name}, ${profile.skinType} skin, concerns: ${profile.primaryConcerns.join(', ')}` : 'unknown'}

Scan history (most recent first — scores are 0-100):
${scansContext}

Journal entries (most recent first):
${journalContext || 'No journal entries yet'}

Generate a comprehensive skin trend report. Respond ONLY with a valid JSON object (no markdown, no code fences):
{
  "headline": "<one punchy sentence summarizing their overall skin journey trend>",
  "summary": "<2-3 sentences of honest, specific analysis of their trend over time — mention specific scores if relevant>",
  "improving": ["<2-3 specific metrics or aspects that are improving>"],
  "needsAttention": ["<1-3 specific areas that need focus — be honest>"],
  "topInsight": "<1 most important, specific insight about their skin journey — something they might not have noticed>",
  "nextSteps": ["<3 specific, actionable next steps tailored to their data>"]
}`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 700,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.choices[0]?.message?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response');
      setReport(JSON.parse(jsonMatch[0]));
    } catch (e) {
      setError('Could not generate your report. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <SafeAreaView>
          <Pressable style={[styles.backBtn, { margin: 16 }]} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
        </SafeAreaView>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingTitle}>Analyzing your skin journey...</Text>
          <Text style={styles.loadingSub}>Reading through {scanCount > 0 ? `${scanCount} scans` : 'your data'}</Text>
        </View>
      </View>
    );
  }

  if (error === 'no_scans') {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <Pressable style={[styles.backBtn, { margin: 16 }]} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
        </SafeAreaView>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>No data to report yet</Text>
          <Text style={styles.emptySub}>Complete at least one skin scan to generate your trend report.</Text>
          <Pressable style={styles.scanBtn} onPress={() => { router.back(); router.push('/scan'); }}>
            <Text style={styles.scanBtnText}>Take First Scan →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <Pressable style={[styles.backBtn, { margin: 16 }]} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
        </SafeAreaView>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>⚠️</Text>
          <Text style={styles.emptyTitle}>Generation failed</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <Pressable style={styles.scanBtn} onPress={generate}>
            <Text style={styles.scanBtnText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!report) return null;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
        }]}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Skin Trend Report</Text>
          <Pressable style={styles.refreshBtn} onPress={generate}>
            <Ionicons name="refresh-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        style={{ opacity: reportAnim }}
      >

        {/* Headline card */}
        <View style={styles.headlineCard}>
          <LinearGradient colors={['rgba(138,120,96,0.18)', 'rgba(138,120,96,0.06)']} style={StyleSheet.absoluteFill} />
          <View style={styles.headlineMeta}>
            <Text style={styles.scanCountBadge}>{scanCount} scan{scanCount !== 1 ? 's' : ''} analyzed</Text>
            {latest && oldest && scanCount > 1 && (
              <Text style={styles.dateRange}>
                {new Date(oldest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            )}
          </View>
          <Text style={styles.headline}>{report.headline}</Text>
          <Text style={styles.summary}>{report.summary}</Text>
        </View>

        {/* Latest scores snapshot */}
        {latest && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Skin Scores</Text>
            <View style={styles.scoresGrid}>
              {[
                { label: 'Hydration', val: latest.scores.hydration },
                { label: 'Texture', val: latest.scores.texture },
                { label: 'Clarity', val: latest.scores.clarity },
                { label: 'Evenness', val: latest.scores.evenness },
                { label: 'Firmness', val: latest.scores.firmness },
                { label: 'Pores', val: latest.scores.pores },
              ].map(s => (
                <ScoreBar key={s.label} label={s.label} value={s.val} />
              ))}
            </View>
          </View>
        )}

        {/* Improving */}
        {report.improving.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="trending-up" size={16} color={colors.scoreExcellent} />
              <Text style={[styles.cardTitle, { color: colors.scoreExcellent }]}>Improving</Text>
            </View>
            {report.improving.map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: colors.scoreExcellent }]} />
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Needs attention */}
        {report.needsAttention.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.scoreFair} />
              <Text style={[styles.cardTitle, { color: colors.scoreFair }]}>Needs Attention</Text>
            </View>
            {report.needsAttention.map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: colors.scoreFair }]} />
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Top insight */}
        <View style={styles.insightCard}>
          <LinearGradient colors={['rgba(183,155,110,0.12)', 'rgba(183,155,110,0.04)']} style={StyleSheet.absoluteFill} />
          <View style={styles.insightHeader}>
            <Ionicons name="bulb-outline" size={18} color={colors.gold} />
            <Text style={styles.insightTitle}>Key Insight</Text>
          </View>
          <Text style={styles.insightText}>{report.topInsight}</Text>
        </View>

        {/* Next steps */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recommended Next Steps</Text>
          {report.nextSteps.map((step, i) => (
            <View key={i} style={[styles.stepRow, i < report.nextSteps.length - 1 && styles.stepBorder]}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn} onPress={() => router.push('/scan')}>
            <Ionicons name="scan-outline" size={18} color={colors.primary} />
            <Text style={styles.actionBtnText}>New Scan</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => router.push('/(tabs)/coach')}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
            <Text style={styles.actionBtnText}>Ask Coach</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => router.push('/(tabs)/routine')}>
            <Ionicons name="list-outline" size={18} color={colors.primary} />
            <Text style={styles.actionBtnText}>Routine</Text>
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  scroll: { paddingHorizontal: 16 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
  loadingSub: { fontSize: 13, color: c.textMuted },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: c.textPrimary },
  emptySub: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 22 },
  scanBtn: { backgroundColor: c.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  scanBtnText: { fontSize: 15, fontWeight: '700', color: c.white },

  headlineCard: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(138,120,96,0.2)',
    padding: 22, marginBottom: 16, gap: 10,
  },
  headlineMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  scanCountBadge: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: c.primary },
  dateRange: { fontSize: 11, color: c.textMuted },
  headline: { fontSize: 20, fontWeight: '800', color: c.textPrimary, lineHeight: 28 },
  summary: { fontSize: 14, color: c.textSecondary, lineHeight: 22 },

  card: { backgroundColor: c.bgCard, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 18, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary, marginBottom: 14 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  scoresGrid: { gap: 10 },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  bulletText: { fontSize: 13, color: c.textSecondary, lineHeight: 20, flex: 1 },

  insightCard: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(183,155,110,0.15)',
    padding: 20, marginBottom: 14, gap: 10,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  insightTitle: { fontSize: 14, fontWeight: '700', color: c.gold },
  insightText: { fontSize: 14, color: c.textSecondary, lineHeight: 22 },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  stepBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText: { fontSize: 12, fontWeight: '800', color: c.white },
  stepText: { fontSize: 14, color: c.textSecondary, lineHeight: 21, flex: 1 },

  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: c.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: c.borderStrong, paddingVertical: 14,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: c.primary },
  });
}
