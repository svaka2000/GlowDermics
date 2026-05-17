import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Groq from 'groq-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

const CACHE_KEY = 'gd_minimal_routine';
const CACHE_TTL = 1000 * 60 * 60 * 24 * 14; // 14 days

type MinimalRoutine = {
  generatedAt: number;
  philosophy: string;
  morning: { step: number; name: string; product: string; howTo: string; timeSeconds: number; isTallowDermics: boolean }[];
  evening: { step: number; name: string; product: string; howTo: string; timeSeconds: number; isTallowDermics: boolean }[];
  weeklyExtra: string;
  whyItWorks: string;
  totalMorningTime: string;
  totalEveningTime: string;
};

const FIXED_ROUTINES: Record<string, MinimalRoutine> = {
  oily: {
    generatedAt: 0,
    philosophy: 'Oily skin needs balance, not stripping. Less is more — over-cleansing triggers more oil production.',
    morning: [
      { step: 1, name: 'Rinse', product: 'Lukewarm water only', howTo: 'Splash water on face for 20 seconds. No cleanser in AM — night cleansing is enough.', timeSeconds: 30, isTallowDermics: false },
      { step: 2, name: 'Niacinamide', product: 'Niacinamide 10% serum', howTo: '2-3 drops, pat gently into skin. Regulates sebum and minimizes pores.', timeSeconds: 60, isTallowDermics: false },
      { step: 3, name: 'SPF', product: 'Lightweight SPF 50 (mineral preferred)', howTo: '1/4 teaspoon for full face. Wait 5 min before going out.', timeSeconds: 60, isTallowDermics: false },
    ],
    evening: [
      { step: 1, name: 'Double Cleanse', product: 'Oil cleanser → gentle foam', howTo: 'Massage oil cleanser for 1 min to dissolve SPF/sebum. Follow with gentle foam cleanser.', timeSeconds: 120, isTallowDermics: false },
      { step: 2, name: 'BHA (2-3x/week)', product: 'Salicylic acid 2%', howTo: 'Apply to entire face. Wait 10 min before next step. Skip on off nights.', timeSeconds: 60, isTallowDermics: false },
      { step: 3, name: 'Tallow Spot Treatment', product: 'TallowDermics Balm (tiny amount)', howTo: 'Apply just a rice-grain amount to dry areas or healing breakouts. CLA reduces inflammation.', timeSeconds: 30, isTallowDermics: true },
    ],
    weeklyExtra: 'Gentle clay mask (kaolin) once per week to deep clean pores without stripping',
    whyItWorks: 'Morning water-only rinse prevents the over-strip/over-produce oil cycle. Niacinamide directly suppresses sebocyte activity. Evening BHA penetrates oil-filled pores. Tallow spot-treats without adding oil to the T-zone.',
    totalMorningTime: '2-3 minutes',
    totalEveningTime: '4-5 minutes',
  },
  dry: {
    generatedAt: 0,
    philosophy: 'Dry skin needs layers — water to hydrate, then lipids to seal. Adding ingredients is counterproductive without fixing the barrier.',
    morning: [
      { step: 1, name: 'Water splash', product: 'Lukewarm water', howTo: 'Splash, but don\'t towel dry completely — apply next step on damp skin.', timeSeconds: 30, isTallowDermics: false },
      { step: 2, name: 'Hyaluronic Acid', product: 'HA serum (multiple molecular weights)', howTo: '4-5 drops on still-damp skin. The water helps HA draw moisture into cells.', timeSeconds: 45, isTallowDermics: false },
      { step: 3, name: 'Seal with Tallow', product: 'TallowDermics Balm', howTo: 'Warm a pea-sized amount in palms, press gently onto face. This seals all the moisture in.', timeSeconds: 60, isTallowDermics: true },
      { step: 4, name: 'SPF', product: 'Moisturizing SPF 30+', howTo: 'Mineral SPF over tallow. Look for SPFs with ceramides or hyaluronic acid.', timeSeconds: 45, isTallowDermics: false },
    ],
    evening: [
      { step: 1, name: 'Gentle cleanse', product: 'Cream or oil cleanser — no foam/gel', howTo: 'Massage for 60 seconds, rinse with lukewarm water. Pat dry — don\'t rub.', timeSeconds: 90, isTallowDermics: false },
      { step: 2, name: 'Tallow Moisture Layer', product: 'TallowDermics Balm (generous)', howTo: 'Apply generously while skin is still slightly damp. No need for serum tonight — tallow provides everything.', timeSeconds: 60, isTallowDermics: true },
    ],
    weeklyExtra: 'Gentle lactic acid (10%) mask once per week to remove dead cells that prevent moisture absorption',
    whyItWorks: 'The HA + tallow stack on damp skin is the most efficient dry skin routine possible: HA pulls water into cells, tallow locks it in with an occlusive seal. No unnecessary steps that could further compromise the barrier.',
    totalMorningTime: '3 minutes',
    totalEveningTime: '3 minutes',
  },
  combination: {
    generatedAt: 0,
    philosophy: 'Combination skin doesn\'t need two separate routines. Use one balanced routine and spot-treat zones as needed.',
    morning: [
      { step: 1, name: 'Gentle cleanser', product: 'Low-pH gel cleanser', howTo: 'Full face cleanse, 30 seconds. Rinse thoroughly.', timeSeconds: 45, isTallowDermics: false },
      { step: 2, name: 'Niacinamide', product: 'Niacinamide 5-10%', howTo: 'Apply all over. Niacinamide regulates oil in T-zone while hydrating cheeks.', timeSeconds: 45, isTallowDermics: false },
      { step: 3, name: 'Balanced moisture', product: 'Lightweight gel moisturizer', howTo: 'All over. If cheeks feel tight, add a tiny dot of tallow on cheek bones only.', timeSeconds: 45, isTallowDermics: false },
      { step: 4, name: 'SPF', product: 'SPF 30-50', howTo: 'Full coverage. Mineral SPF is less likely to clog T-zone pores.', timeSeconds: 30, isTallowDermics: false },
    ],
    evening: [
      { step: 1, name: 'Cleanse', product: 'Same morning cleanser or micellar water', howTo: '45-second cleanse. Focus on T-zone where product and oil accumulate.', timeSeconds: 60, isTallowDermics: false },
      { step: 2, name: 'Targeted serum', product: 'Retinol (2-3x/week) or skip', howTo: 'Apply only where needed. Skip if skin is irritated.', timeSeconds: 60, isTallowDermics: false },
      { step: 3, name: 'Zone moisturize', product: 'Gel on T-zone, TallowDermics on cheeks/dry areas', howTo: 'Use different amounts in different zones. Tallow goes on dry cheeks/under-eye only.', timeSeconds: 60, isTallowDermics: true },
    ],
    weeklyExtra: 'BHA (salicylic 2%) on T-zone only, once per week',
    whyItWorks: 'Niacinamide is the perfect combination skin ingredient — it reduces oil in oily zones while improving barrier in dry zones. Tallow is used strategically only on dry areas where its rich lipids are actually needed.',
    totalMorningTime: '3 minutes',
    totalEveningTime: '3-4 minutes',
  },
  sensitive: {
    generatedAt: 0,
    philosophy: 'Sensitive skin needs fewer ingredients, not more. The #1 rule: if skin is reacting, remove things — don\'t add more.',
    morning: [
      { step: 1, name: 'Water rinse', product: 'Room temperature water only', howTo: 'No cleansers in AM. They disrupt the barrier\'s overnight repair work.', timeSeconds: 30, isTallowDermics: false },
      { step: 2, name: 'Tallow barrier seal', product: 'TallowDermics Balm', howTo: 'Warm 2-3 drops in palms, press gently. Its CLA and fatty acids calm inflammation and seal the barrier.', timeSeconds: 60, isTallowDermics: true },
      { step: 3, name: 'Mineral SPF', product: 'Zinc oxide SPF 30+, fragrance-free', howTo: 'Over tallow. Zinc is physically reflective — no chemical reaction with skin.', timeSeconds: 45, isTallowDermics: false },
    ],
    evening: [
      { step: 1, name: 'Oil cleanse', product: 'Fragrance-free cleansing oil or micellar water', howTo: 'Gentle massage, 60 sec. Rinse with lukewarm water. No foam — foam cleaners are alkaline.', timeSeconds: 90, isTallowDermics: false },
      { step: 2, name: 'Tallow balm', product: 'TallowDermics Balm (generous)', howTo: 'Generous application on still-damp skin. This is your serum, moisturizer, and barrier seal in one step.', timeSeconds: 60, isTallowDermics: true },
    ],
    weeklyExtra: 'Nothing — keep it minimal. If skin is stable, try a fragrance-free ceramide mask once per week.',
    whyItWorks: 'Every additional ingredient is a potential trigger. This routine has 3 evening ingredients total — none of which are known sensitizers. Tallow\'s near-identical match to human sebum means the skin recognizes it and doesn\'t react defensively.',
    totalMorningTime: '2 minutes',
    totalEveningTime: '3 minutes',
  },
};

export default function MinimalRoutine() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [routine, setRoutine] = useState<MinimalRoutine | null>(null);
  const [loading, setLoading] = useState(false);
  const [skinType, setSkinType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  const load = async () => {
    const profile = await Storage.getUserProfile();
    if (profile?.skinType) setSkinType(profile.skinType.toLowerCase());

    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw);
      if (Date.now() - cached.generatedAt < CACHE_TTL) {
        setRoutine(cached);
        return;
      }
    }

    // Use pre-built routine based on skin type
    if (profile?.skinType) {
      const type = profile.skinType.toLowerCase();
      const preBuilt = FIXED_ROUTINES[type] || FIXED_ROUTINES.combination;
      const withDate = { ...preBuilt, generatedAt: Date.now() };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(withDate));
      setRoutine(withDate);
    }
  };

  const generateAI = async () => {
    setLoading(true);
    try {
      const profile = await Storage.getUserProfile();
      const prompt = `Create a minimalist skincare routine for someone with ${profile?.skinType || 'combination'} skin and concerns: ${profile?.primaryConcerns?.join(', ') || 'general'}.

Rules:
- Max 3 steps morning, max 3 steps evening
- Each step under 60 seconds
- At least one step must use TallowDermics (a grass-fed beef tallow balm) where appropriate
- Focus on efficacy per step, not number of steps
- No actives stacking

Return ONLY JSON:
{
  "generatedAt": 0,
  "philosophy": "One sentence guiding principle for this skin type",
  "morning": [
    {"step": 1, "name": "Step name", "product": "Specific product type", "howTo": "30-word instruction", "timeSeconds": 45, "isTallowDermics": false}
  ],
  "evening": [
    {"step": 1, "name": "Step name", "product": "Specific product type", "howTo": "30-word instruction", "timeSeconds": 60, "isTallowDermics": false}
  ],
  "weeklyExtra": "One optional weekly addition",
  "whyItWorks": "2-3 sentences on the science",
  "totalMorningTime": "X minutes",
  "totalEveningTime": "X minutes"
}`;

      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 800,
      });

      const text = res.choices[0]?.message?.content || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        parsed.generatedAt = Date.now();
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
        setRoutine(parsed);
      }
    } catch {}
    setLoading(false);
  };

  const steps = routine ? (activeTab === 'morning' ? routine.morning : routine.evening) : [];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>Minimal Routine</Text>
            <Text style={styles.headerSub}>Maximum results, minimum steps</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Regenerate with AI" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={generateAI} style={styles.refreshBtn}>
            {loading ? <ActivityIndicator size="small" color={colors.textMuted} /> : <Ionicons name="sparkles-outline" size={18} color={colors.textMuted} />}
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {!routine && !loading && (
          <View style={styles.emptyCard}>
            <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Text style={styles.emptyEmoji}>⚡</Text>
            <Text style={styles.emptyTitle}>Build My Minimal Routine</Text>
            <Text style={styles.emptyDesc}>Get a 3-step maximum routine tailored to your skin type. Maximum efficacy, minimum time.</Text>
            <Pressable style={styles.emptyBtn} onPress={generateAI}>
              <Text style={styles.emptyBtnText}>Generate My Routine</Text>
            </Pressable>
          </View>
        )}

        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Building your minimal routine...</Text>
          </View>
        )}

        {routine && (
          <>
            {/* Philosophy card */}
            <View style={styles.philosophyCard}>
              <LinearGradient colors={[`${colors.primary}10`, `${colors.primary}03`]} style={StyleSheet.absoluteFill} />
              <Text style={styles.philosophyText}>"{routine.philosophy}"</Text>
            </View>

            {/* Time badges */}
            <View style={styles.timeRow}>
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeEmoji}>🌅</Text>
                <Text style={styles.timeBadgeTime}>{routine.totalMorningTime}</Text>
                <Text style={styles.timeBadgeLabel}>Morning</Text>
              </View>
              <View style={styles.timeSep} />
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeEmoji}>🌙</Text>
                <Text style={styles.timeBadgeTime}>{routine.totalEveningTime}</Text>
                <Text style={styles.timeBadgeLabel}>Evening</Text>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              <Pressable
                style={[styles.tab, activeTab === 'morning' && styles.tabActive]}
                onPress={() => setActiveTab('morning')}
              >
                <Text style={[styles.tabText, activeTab === 'morning' && { color: colors.gold }]}>🌅 Morning</Text>
              </Pressable>
              <Pressable
                style={[styles.tab, activeTab === 'evening' && styles.tabActive]}
                onPress={() => setActiveTab('evening')}
              >
                <Text style={[styles.tabText, activeTab === 'evening' && { color: '#6B85A8' }]}>🌙 Evening</Text>
              </Pressable>
            </View>

            {/* Steps */}
            {steps.map((step, i) => (
              <View key={i} style={[styles.stepCard, step.isTallowDermics && styles.tallowStepCard]}>
                {step.isTallowDermics && (
                  <LinearGradient colors={[`${colors.primary}12`, `${colors.primary}04`]} style={StyleSheet.absoluteFill} />
                )}
                <View style={styles.stepTop}>
                  <View style={[styles.stepCircle, step.isTallowDermics && { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepCircleText}>{step.step}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepName}>{step.name}</Text>
                    <Text style={[styles.stepProduct, step.isTallowDermics && { color: colors.primary }]}>
                      {step.product}
                      {step.isTallowDermics && ' 🌿'}
                    </Text>
                  </View>
                  <View style={styles.stepTimeBadge}>
                    <Text style={styles.stepTime}>{step.timeSeconds}s</Text>
                  </View>
                </View>
                <Text style={styles.stepHowTo}>{step.howTo}</Text>
              </View>
            ))}

            {/* Weekly extra */}
            <View style={styles.weeklyCard}>
              <Text style={styles.weeklyTitle}>📅 Once Per Week</Text>
              <Text style={styles.weeklyText}>{routine.weeklyExtra}</Text>
            </View>

            {/* Why it works */}
            <View style={styles.whyCard}>
              <Text style={styles.whyTitle}>Why This Works</Text>
              <Text style={styles.whyText}>{routine.whyItWorks}</Text>
            </View>

            <Pressable style={styles.regenerateBtn} onPress={generateAI}>
              <Ionicons name="sparkles-outline" size={14} color={colors.textMuted} />
              <Text style={styles.regenerateBtnText}>Regenerate with AI</Text>
            </Pressable>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  scroll: { paddingHorizontal: 16 },

  emptyCard: {
    borderRadius: 20, overflow: 'hidden', padding: 32, gap: 12, alignItems: 'center', marginBottom: 14,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: c.white },
  emptyDesc: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 22 },
  emptyBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: c.white },

  loadingCard: {
    backgroundColor: c.bgCard, borderRadius: 20, borderWidth: 1, borderColor: c.border,
    padding: 40, gap: 12, alignItems: 'center', marginBottom: 14,
  },
  loadingText: { fontSize: 15, fontWeight: '700', color: c.textPrimary },

  philosophyCard: {
    borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: `${c.primary}30`,
    padding: 16, marginBottom: 14,
  },
  philosophyText: { fontSize: 16, color: c.textSecondary, fontStyle: 'italic', lineHeight: 24 },

  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 0 },
  timeBadge: { flex: 1, alignItems: 'center', gap: 4 },
  timeBadgeEmoji: { fontSize: 22 },
  timeBadgeTime: { fontSize: 20, fontWeight: '900', color: c.textPrimary },
  timeBadgeLabel: { fontSize: 11, color: c.textMuted, fontWeight: '600' },
  timeSep: { width: 1, height: 50, backgroundColor: c.border },

  tabs: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tab: {
    flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: c.border,
    backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  tabActive: { borderColor: c.primary, backgroundColor: `${c.primary}10` },
  tabText: { fontSize: 13, fontWeight: '700', color: c.textMuted },

  stepCard: {
    backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.border,
    padding: 14, gap: 8, marginBottom: 8, overflow: 'hidden',
  },
  tallowStepCard: { borderColor: `${c.primary}40` },
  stepTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: `${c.primary}20`, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepCircleText: { fontSize: 14, fontWeight: '900', color: c.primary },
  stepName: { fontSize: 14, fontWeight: '800', color: c.textPrimary },
  stepProduct: { fontSize: 12, color: c.textMuted, marginTop: 1 },
  stepTimeBadge: {
    backgroundColor: c.bgElevated, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: c.border,
  },
  stepTime: { fontSize: 11, fontWeight: '700', color: c.textMuted },
  stepHowTo: { fontSize: 12, color: c.textSecondary, lineHeight: 18 },

  weeklyCard: {
    backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.border,
    padding: 14, gap: 4, marginBottom: 10,
  },
  weeklyTitle: { fontSize: 13, fontWeight: '800', color: c.textPrimary },
  weeklyText: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  whyCard: {
    backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: `${c.primary}30`,
    padding: 14, gap: 6, marginBottom: 10,
  },
  whyTitle: { fontSize: 13, fontWeight: '800', color: c.primary },
  whyText: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  regenerateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'center', padding: 10,
  },
  regenerateBtnText: { fontSize: 12, color: c.textMuted, textDecorationLine: 'underline' },
  });
}
