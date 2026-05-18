import { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

type SkinTypeProfile = {
  name: string;
  emoji: string;
  description: string;
  causes: string[];
  characteristics: string[];
  commonMistakes: string[];
  bestIngredients: { name: string; why: string }[];
  ingredientsToAvoid: { name: string; why: string }[];
  idealRoutine: { step: string; recommendation: string; why: string }[];
  tallowFit: string;
  proTips: string[];
};

function buildSkinTypeData(c: Palette): Record<string, { emoji: string; color: string }> {
  return {
    oily: { emoji: '✨', color: c.scoreFair },
    dry: { emoji: '🏜', color: '#60A5FA' },
    combination: { emoji: '🌗', color: c.gold },
    normal: { emoji: '🌿', color: c.scoreExcellent },
    sensitive: { emoji: '🌡', color: c.scorePoor },
  };
}

export default function SkinTypeGuide() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const SKIN_TYPE_DATA = useMemo(() => buildSkinTypeData(colors), [colors]);
  const { type } = useLocalSearchParams<{ type: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SkinTypeProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (type) load(decodeURIComponent(type));
  }, [type]);

  const load = async (skinType: string) => {
    setLoading(true);
    setError('');
    try {
      const prompt = `You are a clinical dermatologist and cosmetic chemist. Create a comprehensive guide for ${skinType} skin type.

Respond ONLY with a valid JSON object (no markdown, no code fences):
{
  "name": "<e.g. Oily Skin>",
  "emoji": "<single emoji representing this skin type>",
  "description": "<2-3 sentences honest description of this skin type and what causes it>",
  "causes": ["<3-4 root causes: hormones, genetics, environment, habits>"],
  "characteristics": ["<4-5 characteristics someone with this skin type will recognize>"],
  "commonMistakes": ["<3-4 things people with this skin type commonly do wrong>"],
  "bestIngredients": [
    {"name": "<ingredient>", "why": "<1 sentence why it's ideal for this skin type>"}
  ],
  "ingredientsToAvoid": [
    {"name": "<ingredient>", "why": "<1 sentence why to avoid>"}
  ],
  "idealRoutine": [
    {"step": "<step name>", "recommendation": "<specific product type>", "why": "<why>"}
  ],
  "tallowFit": "<1-2 sentences on how a lipid-rich occlusive / barrier-first skincare specifically relates to this skin type — be honest if it may not be ideal>",
  "proTips": ["<3-4 pro tips specific to this skin type that most people don't know>"]
}

Include 5-6 bestIngredients, 3-4 ingredientsToAvoid, and 4-5 routine steps.`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.choices[0]?.message?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response');
      setProfile(JSON.parse(jsonMatch[0]));
    } catch {
      setError('Could not load skin type guide. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const skinData = type ? SKIN_TYPE_DATA[type.toLowerCase()] ?? { emoji: '🌿', color: colors.primary } : { emoji: '🌿', color: colors.primary };

  if (loading) {
    return (
      <View style={styles.root}>
        <SafeAreaView>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={[styles.backBtn, { margin: 16 }]} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
        </SafeAreaView>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingTitle}>Loading guide...</Text>
        </View>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.root}>
        <SafeAreaView>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={[styles.backBtn, { margin: 16 }]} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
        </SafeAreaView>
        <View style={styles.loadingWrap}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>⚠️</Text>
          <Text style={styles.loadingTitle}>Couldn't load</Text>
          <Pressable style={styles.retryBtn} onPress={() => type && load(decodeURIComponent(type))}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Skin Type Guide</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={[styles.hero, { borderColor: skinData.color + '30' }]}>
          <LinearGradient colors={[skinData.color + '18', skinData.color + '06']} style={StyleSheet.absoluteFill} />
          <Text style={styles.heroEmoji}>{profile.emoji}</Text>
          <Text style={[styles.heroName, { color: skinData.color }]}>{profile.name}</Text>
          <Text style={styles.heroDesc}>{profile.description}</Text>
        </View>

        {/* Characteristics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What It Looks & Feels Like</Text>
          {profile.characteristics.map((c, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: skinData.color }]} />
              <Text style={styles.bulletText}>{c}</Text>
            </View>
          ))}
        </View>

        {/* Root causes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Root Causes</Text>
          {profile.causes.map((c, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: colors.textMuted }]} />
              <Text style={styles.bulletText}>{c}</Text>
            </View>
          ))}
        </View>

        {/* Common mistakes */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.scoreFair} />
            <Text style={[styles.cardTitle, { marginBottom: 0, color: colors.scoreFair }]}>Common Mistakes</Text>
          </View>
          {profile.commonMistakes.map((m, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: colors.scoreFair }]} />
              <Text style={styles.bulletText}>{m}</Text>
            </View>
          ))}
        </View>

        {/* Best ingredients */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.scoreExcellent} />
            <Text style={[styles.cardTitle, { marginBottom: 0, color: colors.scoreExcellent }]}>Best Ingredients</Text>
          </View>
          {profile.bestIngredients.map((ing, i) => (
            <Pressable
              key={i}
              style={[styles.ingredientRow, i < profile.bestIngredients.length - 1 && styles.ingredientBorder]}
              onPress={() => router.push(`/ingredient/${encodeURIComponent(ing.name)}`)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.ingredientName}>{ing.name}</Text>
                <Text style={styles.ingredientWhy}>{ing.why}</Text>
              </View>
              <Ionicons name="chevron-forward" size={13} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* Ingredients to avoid */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="close-circle-outline" size={16} color={colors.scorePoor} />
            <Text style={[styles.cardTitle, { marginBottom: 0, color: colors.scorePoor }]}>Ingredients to Avoid</Text>
          </View>
          {profile.ingredientsToAvoid.map((ing, i) => (
            <View key={i} style={[styles.ingredientRow, i < profile.ingredientsToAvoid.length - 1 && styles.ingredientBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ingredientName}>{ing.name}</Text>
                <Text style={styles.ingredientWhy}>{ing.why}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Ideal routine */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ideal Routine</Text>
          {profile.idealRoutine.map((step, i) => (
            <View key={i} style={[styles.routineRow, i < profile.idealRoutine.length - 1 && styles.ingredientBorder]}>
              <View style={styles.routineNum}>
                <Text style={styles.routineNumText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.routineStep}>{step.step}</Text>
                <Text style={styles.routineRec}>{step.recommendation}</Text>
                <Text style={styles.routineWhy}>{step.why}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pro tips */}
        <View style={styles.proCard}>
          <LinearGradient colors={['rgba(183,155,110,0.12)', 'rgba(183,155,110,0.04)']} style={StyleSheet.absoluteFill} />
          <View style={styles.cardTitleRow}>
            <Ionicons name="bulb-outline" size={16} color={colors.gold} />
            <Text style={[styles.cardTitle, { marginBottom: 0, color: colors.gold }]}>Pro Tips</Text>
          </View>
          {profile.proTips.map((tip, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: colors.gold }]} />
              <Text style={styles.bulletText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Barrier fit */}
        <View style={styles.tdCard}>
          <LinearGradient colors={['rgba(138,120,96,0.12)', 'rgba(138,120,96,0.04)']} style={StyleSheet.absoluteFill} />
          <Text style={styles.tdEyebrow}>BARRIER FIT</Text>
          <Text style={styles.tdText}>{profile.tallowFit}</Text>
        </View>

        {/* Coach CTA */}
        <Pressable style={styles.coachCta} onPress={() => router.push('/(tabs)/coach')}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
          <Text style={styles.coachCtaText}>Ask Vera about {type} skin</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
  scroll: { paddingHorizontal: 16 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
  retryBtn: { backgroundColor: c.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: c.white },

  hero: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, padding: 22, marginBottom: 14, gap: 8, alignItems: 'center' },
  heroEmoji: { fontSize: 48 },
  heroName: { fontSize: 26, fontWeight: '800' },
  heroDesc: { fontSize: 14, color: c.textSecondary, lineHeight: 22, textAlign: 'center' },

  card: { backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: c.textPrimary, marginBottom: 10 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  bulletText: { fontSize: 13, color: c.textSecondary, lineHeight: 20, flex: 1 },

  ingredientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8 },
  ingredientBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  ingredientName: { fontSize: 14, fontWeight: '600', color: c.textPrimary, marginBottom: 3 },
  ingredientWhy: { fontSize: 12, color: c.textSecondary, lineHeight: 17 },

  routineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  routineNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  routineNumText: { fontSize: 11, fontWeight: '800', color: c.white },
  routineStep: { fontSize: 14, fontWeight: '700', color: c.textPrimary, marginBottom: 2 },
  routineRec: { fontSize: 12, color: c.primary, fontWeight: '500', marginBottom: 2 },
  routineWhy: { fontSize: 12, color: c.textSecondary, lineHeight: 17 },

  proCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(183,155,110,0.15)', padding: 16, marginBottom: 12, gap: 8 },
  tdCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(138,120,96,0.2)', padding: 18, marginBottom: 12, gap: 8 },
  tdEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: c.primary },
  tdText: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  tdCta: { fontSize: 13, color: c.primary, fontWeight: '600' },

  coachCta: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 8 },
  coachCtaText: { flex: 1, fontSize: 13, color: c.textSecondary },
  });
}
