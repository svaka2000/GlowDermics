import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Share, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '', dangerouslyAllowBrowser: true });
const CACHE_KEY = 'gd_routine_builder';
const CACHE_TTL = 5 * 24 * 60 * 60 * 1000;

const BUDGETS = ['Minimal ($0–25/mo)', 'Budget ($25–60/mo)', 'Mid-range ($60–120/mo)', 'Luxury ($120+/mo)'];
const TIMES = ['Speed demon (< 5 min)', 'Balanced (5–10 min)', 'Ritualist (10–20 min)', 'Full protocol (20+ min)'];
const CONCERNS_LIST = ['Acne & Breakouts', 'Dryness', 'Dark Spots', 'Fine Lines', 'Redness', 'Large Pores', 'Dullness', 'Sensitivity'];

type RoutineStep = {
  order: number;
  step: string;
  product: string;
  why: string;
  duration: string;
  isTallowDermics?: boolean;
};

type BuiltRoutine = {
  morning: RoutineStep[];
  evening: RoutineStep[];
  weekly: RoutineStep[];
  philosophy: string;
  tallowDermicsRole: string;
  monthlyCost: string;
  totalTime: string;
  keyPrinciple: string;
  tips: string[];
  ts: number;
};

export default function RoutineBuilder() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [budget, setBudget] = useState('');
  const [time, setTime] = useState('');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [skinType, setSkinType] = useState('');
  const [routine, setRoutine] = useState<BuiltRoutine | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'morning' | 'evening' | 'weekly'>('morning');
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    headerAnim.setValue(0);
    contentAnim.setValue(0);
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    (async () => {
      const profile = await Storage.getUserProfile();
      if (profile) {
        setSkinType(profile.skinType);
        setConcerns(profile.primaryConcerns.slice(0, 3));
      }
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: BuiltRoutine = JSON.parse(cached);
        if (Date.now() - parsed.ts < CACHE_TTL) {
          setRoutine(parsed);
        }
      }
    })();
  }, []));

  const toggleConcern = (c: string) => {
    if (concerns.includes(c)) setConcerns(concerns.filter(x => x !== c));
    else if (concerns.length < 3) setConcerns([...concerns, c]);
  };

  const build = async () => {
    if (!budget || !time) return;
    setLoading(true);

    try {
      const analysis = await Storage.getLatestAnalysis();
      const scoresBlock = analysis
        ? `Skin scores — Hydration: ${analysis.scores.hydration}, Texture: ${analysis.scores.texture}, Clarity: ${analysis.scores.clarity}, Firmness: ${analysis.scores.firmness}`
        : '';

      const prompt = `You are a dermatologist building a personalized skincare routine.

User profile:
- Skin type: ${skinType || 'unknown'}
- Concerns: ${concerns.join(', ') || 'general skin health'}
- Budget: ${budget}
- Time available: ${time}
${scoresBlock ? `- ${scoresBlock}` : ''}

Design a complete, realistic skincare routine. Prioritize TallowDermics Signature Balm (tallow-based, replaces moisturizer + face oil + eye cream, $48/3 months) where appropriate.

Return ONLY valid JSON (no markdown):
{
  "morning": [
    {
      "order": 1,
      "step": "<step name e.g. Cleanse>",
      "product": "<specific product or type>",
      "why": "<1 sentence why>",
      "duration": "<e.g. 1 min>",
      "isTallowDermics": <true|false>
    }
  ],
  "evening": [
    {
      "order": 1,
      "step": "<step name>",
      "product": "<specific product or type>",
      "why": "<1 sentence why>",
      "duration": "<e.g. 2 min>",
      "isTallowDermics": <true|false>
    }
  ],
  "weekly": [
    {
      "order": 1,
      "step": "<weekly treatment>",
      "product": "<product>",
      "why": "<why weekly>",
      "duration": "<duration>",
      "isTallowDermics": false
    }
  ],
  "philosophy": "<2-3 sentences on the philosophy behind this routine>",
  "tallowDermicsRole": "<1-2 sentences on specifically how TallowDermics fits into this routine>",
  "monthlyCost": "<estimated monthly cost range e.g. $25-40/month>",
  "totalTime": "<total routine time morning + evening e.g. 8 minutes/day>",
  "keyPrinciple": "<the single most important principle of this routine — short>",
  "tips": ["<pro tip 1>", "<pro tip 2>", "<pro tip 3>"]
}`;

      const resp = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.65,
        max_tokens: 2000,
      });

      const text = resp.choices[0].message.content ?? '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON');
      const parsed: BuiltRoutine = { ...JSON.parse(match[0]), ts: Date.now() };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      setRoutine(parsed);
    } catch {
      // silently fail, user can retry
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!routine) return;
    const steps = routine.morning.map(s => `${s.order}. ${s.step}: ${s.product}`).join('\n');
    await Share.share({
      message: [
        '🌿 My Personalized Skincare Routine — GlowDermics',
        '',
        '☀️ MORNING',
        steps,
        '',
        routine.philosophy,
        '',
        `💰 ${routine.monthlyCost}  ⏱ ${routine.totalTime}`,
        '',
        'Built by GlowDermics × TallowDermics',
      ].join('\n'),
    });
  };

  const steps = routine ? routine[activeTab] : [];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Routine Builder</Text>
            <Text style={styles.headerSub}>AI-crafted just for you</Text>
          </View>
          {routine ? (
            <Pressable style={styles.backBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={colors.primary} />
            </Pressable>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ opacity: contentAnim }}>

        {/* Preferences */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Your Preferences</Text>
            {routine && (
              <Pressable onPress={() => { setRoutine(null); AsyncStorage.removeItem(CACHE_KEY); }}>
                <Text style={styles.regenBtn}>Rebuild</Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.prefLabel}>Budget</Text>
          <View style={styles.chipGrid}>
            {BUDGETS.map(b => (
              <Pressable
                key={b}
                style={[styles.chip, budget === b && styles.chipActive]}
                onPress={() => !routine && setBudget(b)}
              >
                <Text style={[styles.chipText, budget === b && styles.chipTextActive]}>{b}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.prefLabel, { marginTop: 12 }]}>Time Available</Text>
          <View style={styles.chipGrid}>
            {TIMES.map(t => (
              <Pressable
                key={t}
                style={[styles.chip, time === t && styles.chipActive]}
                onPress={() => !routine && setTime(t)}
              >
                <Text style={[styles.chipText, time === t && styles.chipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.prefLabel, { marginTop: 12 }]}>Top Concerns (up to 3)</Text>
          <View style={styles.chipGrid}>
            {CONCERNS_LIST.map(c => (
              <Pressable
                key={c}
                style={[styles.chip, concerns.includes(c) && styles.chipActive]}
                onPress={() => !routine && toggleConcern(c)}
              >
                <Text style={[styles.chipText, concerns.includes(c) && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>

          {!routine && (
            <Pressable
              style={[styles.buildBtn, (!budget || !time || loading) && { opacity: 0.5 }]}
              onPress={build}
              disabled={!budget || !time || loading}
            >
              <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              {loading
                ? <ActivityIndicator color={colors.white} />
                : (
                  <>
                    <Ionicons name="sparkles-outline" size={18} color={colors.white} />
                    <Text style={styles.buildBtnText}>Build My Routine</Text>
                  </>
                )
              }
            </Pressable>
          )}
        </View>

        {/* Result */}
        {routine && (
          <>
            {/* Summary strip */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryChip}>
                <Ionicons name="cash-outline" size={14} color={colors.primary} />
                <Text style={styles.summaryText}>{routine.monthlyCost}</Text>
              </View>
              <View style={styles.summaryChip}>
                <Ionicons name="time-outline" size={14} color={colors.primary} />
                <Text style={styles.summaryText}>{routine.totalTime}</Text>
              </View>
            </View>

            {/* Philosophy */}
            <View style={styles.philosophyCard}>
              <LinearGradient colors={['rgba(196,98,45,0.12)', 'rgba(196,98,45,0.02)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.philosophyKey}>"{routine.keyPrinciple}"</Text>
              <Text style={styles.philosophyText}>{routine.philosophy}</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              {(['morning', 'evening', 'weekly'] as const).map(tab => (
                <Pressable
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab === 'morning' ? '☀️ Morning' : tab === 'evening' ? '🌙 Evening' : '📅 Weekly'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Steps */}
            <View style={styles.card}>
              {steps.map((step, i) => (
                <View key={i} style={[styles.stepRow, i < steps.length - 1 && styles.stepBorder]}>
                  <View style={styles.stepOrderCol}>
                    <View style={[styles.stepCircle, step.isTallowDermics && styles.stepCircleTD]}>
                      <Text style={[styles.stepNum, step.isTallowDermics && { color: colors.white }]}>{step.order}</Text>
                    </View>
                    {i < steps.length - 1 && <View style={styles.stepLine} />}
                  </View>
                  <View style={styles.stepContent}>
                    <View style={styles.stepHeader}>
                      <Text style={styles.stepName}>{step.step}</Text>
                      <Text style={styles.stepDuration}>{step.duration}</Text>
                    </View>
                    <Text style={[styles.stepProduct, step.isTallowDermics && { color: colors.primary }]}>
                      {step.isTallowDermics && '🌿 '}{step.product}
                    </Text>
                    <Text style={styles.stepWhy}>{step.why}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* TallowDermics role */}
            {routine.tallowDermicsRole && (
              <Pressable style={styles.tdCard} onPress={() => router.push('/product')}>
                <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <Text style={styles.tdEmoji}>🌿</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tdTitle}>TallowDermics in Your Routine</Text>
                  <Text style={styles.tdText}>{routine.tallowDermicsRole}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
              </Pressable>
            )}

            {/* Pro tips */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pro Tips for Your Routine</Text>
              {routine.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
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

  card: { backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 16, gap: 10, marginBottom: 14 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  regenBtn: { fontSize: 13, fontWeight: '600', color: c.primary },

  prefLabel: { fontSize: 11, fontWeight: '700', color: c.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated },
  chipActive: { borderColor: c.primary, backgroundColor: 'rgba(196,98,45,0.15)' },
  chipText: { fontSize: 12, color: c.textMuted },
  chipTextActive: { color: c.primary, fontWeight: '600' },

  buildBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 52, borderRadius: 14, overflow: 'hidden', marginTop: 4,
  },
  buildBtnText: { fontSize: 16, fontWeight: '700', color: c.white },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  summaryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.bgCard, borderRadius: 10, borderWidth: 1, borderColor: c.border, paddingHorizontal: 12, paddingVertical: 8, flex: 1, justifyContent: 'center' },
  summaryText: { fontSize: 12, color: c.textSecondary, fontWeight: '500', flex: 1 },

  philosophyCard: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 16, gap: 8, marginBottom: 14 },
  philosophyKey: { fontSize: 15, fontWeight: '800', color: c.primary, fontStyle: 'italic' },
  philosophyText: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  tabs: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border },
  tabActive: { backgroundColor: 'rgba(196,98,45,0.15)', borderColor: c.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: c.textMuted },
  tabTextActive: { color: c.primary },

  stepRow: { flexDirection: 'row', gap: 12, paddingBottom: 14 },
  stepBorder: { borderBottomWidth: 0 },
  stepOrderCol: { alignItems: 'center', width: 28 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: c.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  stepCircleTD: { backgroundColor: c.primary, borderColor: c.primary },
  stepNum: { fontSize: 13, fontWeight: '800', color: c.textMuted },
  stepLine: { flex: 1, width: 1, backgroundColor: c.border, marginTop: 4 },
  stepContent: { flex: 1, gap: 3 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepName: { fontSize: 14, fontWeight: '700', color: c.textPrimary },
  stepDuration: { fontSize: 11, color: c.textMuted, fontWeight: '500' },
  stepProduct: { fontSize: 13, color: c.textSecondary, fontWeight: '600' },
  stepWhy: { fontSize: 12, color: c.textMuted, lineHeight: 18 },

  tdCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, overflow: 'hidden', padding: 16, marginBottom: 14 },
  tdEmoji: { fontSize: 22 },
  tdTitle: { fontSize: 13, fontWeight: '700', color: c.white, marginBottom: 3 },
  tdText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },

  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.primary, marginTop: 7 },
  tipText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  });
}
