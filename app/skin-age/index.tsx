import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  ActivityIndicator, Share, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '', dangerouslyAllowBrowser: true });
const AGE_CACHE_KEY = 'gd_skin_age_result';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const USER_AGE_KEY = 'gd_user_age';

type AgingFactor = {
  metric: string;
  score: number;
  impact: 'positive' | 'negative' | 'neutral';
  note: string;
};

type SkinAgeResult = {
  skinAge: number;
  ageGap: number;
  headline: string;
  verdict: string;
  agingFactors: AgingFactor[];
  topWins: string[];
  topRisks: string[];
  recommendations: string[];
  tallowNote: string;
  ts: number;
  chronologicalAge: number;
};

export default function SkinAge() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [age, setAge] = useState('');
  const [ageInput, setAgeInput] = useState('');
  const [result, setResult] = useState<SkinAgeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [error, setError] = useState('');
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    (async () => {
      const storedAge = await AsyncStorage.getItem(USER_AGE_KEY);
      if (storedAge) {
        setAge(storedAge);
        setAgeInput(storedAge);
        const cached = await AsyncStorage.getItem(AGE_CACHE_KEY);
        if (cached) {
          const parsed: SkinAgeResult = JSON.parse(cached);
          if (Date.now() - parsed.ts < CACHE_TTL && parsed.chronologicalAge === parseInt(storedAge, 10)) {
            setResult(parsed);
            setHasData(true);
          }
        }
      }
    })();
  }, []);

  const analyze = async () => {
    const chronoAge = parseInt(ageInput.trim(), 10);
    if (isNaN(chronoAge) || chronoAge < 13 || chronoAge > 99) {
      setError('Please enter a valid age between 13 and 99');
      return;
    }
    setError('');
    setLoading(true);
    await AsyncStorage.setItem(USER_AGE_KEY, String(chronoAge));
    setAge(String(chronoAge));

    try {
      const profile = await Storage.getUserProfile();
      const latest = await Storage.getLatestAnalysis();

      if (!latest) {
        setError('Please take a skin scan first to get your skin age estimate.');
        setLoading(false);
        return;
      }

      const { scores } = latest;
      const lifestyle = profile?.lifestyle;

      const prompt = `You are a dermatological AI estimating biological skin age.

User data:
- Chronological age: ${chronoAge}
- Skin type: ${profile?.skinType || 'unknown'}
- Primary concerns: ${profile?.primaryConcerns?.join(', ') || 'none'}
- Sleep: ${lifestyle?.sleepHours || 7} hours/night
- Water: ${lifestyle?.waterIntake || 'moderate'}
- Diet: ${lifestyle?.diet || 'mixed'}
- Sun exposure: ${lifestyle?.sunExposure || 'moderate'}

Skin scores (0-100):
- Overall: ${scores.overall}
- Hydration: ${scores.hydration}
- Texture: ${scores.texture}
- Clarity: ${scores.clarity}
- Evenness: ${scores.evenness}
- Firmness: ${scores.firmness}
- Pores: ${scores.pores}

Return ONLY valid JSON (no markdown, no explanation):
{
  "skinAge": <integer — estimated biological skin age>,
  "ageGap": <integer — skinAge minus chronologicalAge, negative means skin is younger>,
  "headline": "<short punchy headline about their result — 5-8 words>",
  "verdict": "<1-2 sentence verdict explaining what this means for them>",
  "agingFactors": [
    {
      "metric": "<e.g. Hydration>",
      "score": <0-100>,
      "impact": "<positive|negative|neutral>",
      "note": "<1 sentence about how this metric affects skin age>"
    }
  ],
  "topWins": ["<win 1>", "<win 2>"],
  "topRisks": ["<risk 1>", "<risk 2>"],
  "recommendations": ["<action 1>", "<action 2>", "<action 3>"],
  "tallowNote": "<1 sentence connecting this to tallow-based skincare and TallowDermics>"
}`;

      const resp = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 1200,
      });

      const text = resp.choices[0].message.content ?? '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON');
      const parsed = JSON.parse(jsonMatch[0]);
      const final: SkinAgeResult = { ...parsed, ts: Date.now(), chronologicalAge: chronoAge };
      await AsyncStorage.setItem(AGE_CACHE_KEY, JSON.stringify(final));
      setResult(final);
      setHasData(true);
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    const gap = result.ageGap;
    const gapStr = gap < 0 ? `${Math.abs(gap)} years YOUNGER` : gap > 0 ? `${gap} years older` : 'right on track';
    await Share.share({
      message: [
        `🌿 My Skin Age Result — GlowDermics`,
        '',
        `Chronological Age: ${result.chronologicalAge}`,
        `Skin Biological Age: ${result.skinAge}`,
        `My skin is ${gapStr} than my actual age!`,
        '',
        result.verdict,
        '',
        'Powered by GlowDermics × TallowDermics',
      ].join('\n'),
    });
  };

  const getAgeColor = (gap: number) => {
    if (gap <= -3) return '#4ADE80';
    if (gap < 0) return '#86EFAC';
    if (gap === 0) return colors.gold;
    if (gap <= 3) return '#FCA5A5';
    return colors.scorePoor;
  };

  const getAgeEmoji = (gap: number) => {
    if (gap <= -5) return '🌟';
    if (gap < 0) return '✨';
    if (gap === 0) return '⚖️';
    if (gap <= 3) return '⚠️';
    return '🔴';
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Skin Age</Text>
            <Text style={styles.headerSub}>Biological vs Chronological</Text>
          </View>
          {result ? (
            <Pressable style={styles.backBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={colors.primary} />
            </Pressable>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ opacity: contentAnim }}>

        {/* Age input */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Your Age</Text>
            {hasData && (
              <Pressable onPress={() => { setResult(null); setHasData(false); }}>
                <Text style={styles.regenBtn}>Recalculate</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.cardSub}>Enter your age to estimate your skin's biological age</Text>
          <View style={styles.ageInputRow}>
            <TextInput
              style={styles.ageInput}
              value={ageInput}
              onChangeText={setAgeInput}
              placeholder="e.g. 28"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={2}
              editable={!loading}
            />
            <Pressable
              style={[styles.analyzeBtn, loading && { opacity: 0.5 }]}
              onPress={analyze}
              disabled={loading}
            >
              <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              {loading
                ? <ActivityIndicator size="small" color={colors.white} />
                : <Text style={styles.analyzeBtnText}>Analyze</Text>
              }
            </Pressable>
          </View>
          {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* How it works */}
        {!hasData && !loading && (
          <View style={styles.infoCard}>
            <LinearGradient colors={['rgba(196,98,45,0.12)', 'rgba(196,98,45,0.02)']} style={StyleSheet.absoluteFill} />
            <Text style={styles.infoTitle}>How Skin Age is Calculated</Text>
            <View style={styles.infoRows}>
              {[
                { icon: '💧', label: 'Hydration score', note: 'Dehydrated skin ages faster' },
                { icon: '🔬', label: 'Texture & firmness', note: 'Key indicators of collagen quality' },
                { icon: '✨', label: 'Clarity & evenness', note: 'Sun damage and pigmentation patterns' },
                { icon: '🌙', label: 'Lifestyle factors', note: 'Sleep, diet, and water intake' },
              ].map(item => (
                <View key={item.label} style={styles.infoRow}>
                  <Text style={styles.infoIcon}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    <Text style={styles.infoNote}>{item.note}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Result */}
        {result && (
          <>
            {/* Hero age comparison */}
            <View style={styles.heroCard}>
              <LinearGradient
                colors={result.ageGap < 0 ? ['rgba(74,222,128,0.12)', 'rgba(74,222,128,0.03)'] : result.ageGap > 3 ? ['rgba(248,113,113,0.12)', 'rgba(248,113,113,0.03)'] : ['rgba(212,169,106,0.12)', 'rgba(212,169,106,0.03)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.ageRow}>
                <View style={styles.ageBlock}>
                  <Text style={styles.ageBlockLabel}>YOUR AGE</Text>
                  <Text style={styles.ageNum}>{result.chronologicalAge}</Text>
                  <Text style={styles.ageBlockSub}>chronological</Text>
                </View>
                <View style={styles.ageVsBlock}>
                  <Text style={[styles.ageGapEmoji]}>{getAgeEmoji(result.ageGap)}</Text>
                  <Text style={[styles.ageGapNum, { color: getAgeColor(result.ageGap) }]}>
                    {result.ageGap < 0 ? `${Math.abs(result.ageGap)} yrs` : result.ageGap === 0 ? '0 yrs' : `+${result.ageGap} yrs`}
                  </Text>
                  <Text style={styles.ageGapSub}>{result.ageGap < 0 ? 'younger' : result.ageGap > 0 ? 'older' : 'on track'}</Text>
                </View>
                <View style={[styles.ageBlock, { alignItems: 'flex-end' }]}>
                  <Text style={styles.ageBlockLabel}>SKIN AGE</Text>
                  <Text style={[styles.ageNum, { color: getAgeColor(result.ageGap) }]}>{result.skinAge}</Text>
                  <Text style={styles.ageBlockSub}>biological</Text>
                </View>
              </View>
              <View style={styles.headlineBadge}>
                <Text style={styles.headlineText}>{result.headline}</Text>
              </View>
              <Text style={styles.verdictText}>{result.verdict}</Text>
            </View>

            {/* Metric breakdown */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Aging Factor Breakdown</Text>
              <Text style={styles.cardSub}>How each metric contributes to your skin age</Text>
              {result.agingFactors.map((factor, i) => (
                <View key={i} style={styles.factorRow}>
                  <View style={styles.factorLeft}>
                    <View style={[styles.factorDot, {
                      backgroundColor: factor.impact === 'positive' ? '#4ADE80' : factor.impact === 'negative' ? colors.scorePoor : colors.textMuted,
                    }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.factorMetric}>{factor.metric}</Text>
                      <Text style={styles.factorNote}>{factor.note}</Text>
                    </View>
                  </View>
                  <View style={styles.factorScore}>
                    <Text style={[styles.factorScoreNum, {
                      color: factor.score >= 70 ? '#4ADE80' : factor.score >= 50 ? colors.gold : colors.scorePoor,
                    }]}>{factor.score}</Text>
                    <Text style={styles.factorScoreLabel}>/100</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Wins and risks */}
            <View style={styles.winRiskRow}>
              <View style={[styles.winCard, { flex: 1 }]}>
                <Text style={styles.winTitle}>✅ What's Working</Text>
                {result.topWins.map((w, i) => (
                  <Text key={i} style={styles.winItem}>• {w}</Text>
                ))}
              </View>
              <View style={[styles.riskCard, { flex: 1 }]}>
                <Text style={styles.riskTitle}>⚠️ Watch Out</Text>
                {result.topRisks.map((r, i) => (
                  <Text key={i} style={styles.riskItem}>• {r}</Text>
                ))}
              </View>
            </View>

            {/* Recommendations */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>How to Improve Your Skin Age</Text>
              {result.recommendations.map((rec, i) => (
                <View key={i} style={styles.recRow}>
                  <View style={styles.recNum}>
                    <Text style={styles.recNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.recText}>{rec}</Text>
                </View>
              ))}
            </View>

            {/* Tallow note */}
            <Pressable style={styles.tallowCard} onPress={() => router.push('/product')}>
              <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <Text style={styles.tallowEmoji}>🌿</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.tallowTitle}>TallowDermics Insight</Text>
                <Text style={styles.tallowText}>{result.tallowNote}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
            </Pressable>

            {/* Rescan CTA */}
            <Pressable style={styles.rescanCard} onPress={() => router.push('/scan')}>
              <LinearGradient colors={['rgba(196,98,45,0.1)', 'rgba(196,98,45,0.03)']} style={StyleSheet.absoluteFill} />
              <Ionicons name="camera-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rescanTitle}>Rescan to Track Progress</Text>
                <Text style={styles.rescanSub}>Scan weekly to watch your skin age improve</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
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
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  card: { backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 16, gap: 10, marginBottom: 14 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  cardSub: { fontSize: 11, color: c.textMuted, marginTop: -6 },
  regenBtn: { fontSize: 13, fontWeight: '600', color: c.primary },

  ageInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  ageInput: {
    flex: 1, backgroundColor: c.bgElevated, borderRadius: 12, borderWidth: 1,
    borderColor: c.border, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 22, fontWeight: '700', color: c.textPrimary, textAlign: 'center',
  },
  analyzeBtn: {
    flex: 2, height: 50, borderRadius: 12, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  analyzeBtnText: { fontSize: 15, fontWeight: '700', color: c.white },
  errorText: { fontSize: 13, color: c.scorePoor, fontWeight: '500' },

  infoCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 16, gap: 12, marginBottom: 14 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  infoRows: { gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  infoLabel: { fontSize: 13, fontWeight: '600', color: c.textPrimary },
  infoNote: { fontSize: 12, color: c.textMuted, marginTop: 2 },

  heroCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: c.border, padding: 20, gap: 16, marginBottom: 14 },
  ageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ageBlock: { alignItems: 'flex-start', gap: 2 },
  ageBlockLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: c.textMuted },
  ageNum: { fontSize: 48, fontWeight: '900', color: c.textPrimary, lineHeight: 56 },
  ageBlockSub: { fontSize: 11, color: c.textMuted },
  ageVsBlock: { alignItems: 'center', gap: 2 },
  ageGapEmoji: { fontSize: 22 },
  ageGapNum: { fontSize: 20, fontWeight: '900' },
  ageGapSub: { fontSize: 10, color: c.textMuted, fontWeight: '600' },
  headlineBadge: { backgroundColor: 'rgba(196,98,45,0.12)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)' },
  headlineText: { fontSize: 13, fontWeight: '700', color: c.primary },
  verdictText: { fontSize: 14, color: c.textSecondary, lineHeight: 22 },

  factorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: 10 },
  factorLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  factorDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  factorMetric: { fontSize: 13, fontWeight: '600', color: c.textPrimary },
  factorNote: { fontSize: 11, color: c.textMuted, marginTop: 2, lineHeight: 16 },
  factorScore: { flexDirection: 'row', alignItems: 'baseline', gap: 1 },
  factorScoreNum: { fontSize: 18, fontWeight: '800' },
  factorScoreLabel: { fontSize: 10, color: c.textMuted },

  winRiskRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  winCard: { backgroundColor: 'rgba(74,222,128,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', padding: 14, gap: 8 },
  winTitle: { fontSize: 12, fontWeight: '700', color: '#4ADE80' },
  winItem: { fontSize: 12, color: c.textSecondary, lineHeight: 18 },
  riskCard: { backgroundColor: 'rgba(248,113,113,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)', padding: 14, gap: 8 },
  riskTitle: { fontSize: 12, fontWeight: '700', color: c.scorePoor },
  riskItem: { fontSize: 12, color: c.textSecondary, lineHeight: 18 },

  recRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: 10 },
  recNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(196,98,45,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(196,98,45,0.3)' },
  recNumText: { fontSize: 12, fontWeight: '800', color: c.primary },
  recText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  tallowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, overflow: 'hidden', padding: 16, marginBottom: 12 },
  tallowEmoji: { fontSize: 24 },
  tallowTitle: { fontSize: 13, fontWeight: '700', color: c.white, marginBottom: 3 },
  tallowText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },

  rescanCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 14, marginBottom: 14 },
  rescanTitle: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
  rescanSub: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  });
}
