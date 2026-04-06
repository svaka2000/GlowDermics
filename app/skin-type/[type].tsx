import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';
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

const SKIN_TYPE_DATA: Record<string, { emoji: string; color: string }> = {
  oily: { emoji: '✨', color: Colors.scoreFair },
  dry: { emoji: '🏜', color: '#60A5FA' },
  combination: { emoji: '🌗', color: Colors.gold },
  normal: { emoji: '🌿', color: Colors.scoreExcellent },
  sensitive: { emoji: '🌡', color: Colors.scorePoor },
};

export default function SkinTypeGuide() {
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
  "tallowFit": "<1-2 sentences on how tallow/ancestral skincare specifically relates to this skin type — be honest if it may not be ideal>",
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

  const skinData = type ? SKIN_TYPE_DATA[type.toLowerCase()] ?? { emoji: '🌿', color: Colors.primary } : { emoji: '🌿', color: Colors.primary };

  if (loading) {
    return (
      <View style={styles.root}>
        <SafeAreaView>
          <Pressable style={[styles.backBtn, { margin: 16 }]} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
        </SafeAreaView>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingTitle}>Loading guide...</Text>
        </View>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.root}>
        <SafeAreaView>
          <Pressable style={[styles.backBtn, { margin: 16 }]} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
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
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Skin Type Guide</Text>
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
              <View style={[styles.bullet, { backgroundColor: Colors.textMuted }]} />
              <Text style={styles.bulletText}>{c}</Text>
            </View>
          ))}
        </View>

        {/* Common mistakes */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.scoreFair} />
            <Text style={[styles.cardTitle, { marginBottom: 0, color: Colors.scoreFair }]}>Common Mistakes</Text>
          </View>
          {profile.commonMistakes.map((m, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: Colors.scoreFair }]} />
              <Text style={styles.bulletText}>{m}</Text>
            </View>
          ))}
        </View>

        {/* Best ingredients */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={Colors.scoreExcellent} />
            <Text style={[styles.cardTitle, { marginBottom: 0, color: Colors.scoreExcellent }]}>Best Ingredients</Text>
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
              <Ionicons name="chevron-forward" size={13} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* Ingredients to avoid */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="close-circle-outline" size={16} color={Colors.scorePoor} />
            <Text style={[styles.cardTitle, { marginBottom: 0, color: Colors.scorePoor }]}>Ingredients to Avoid</Text>
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
          <LinearGradient colors={['rgba(212,169,106,0.12)', 'rgba(212,169,106,0.04)']} style={StyleSheet.absoluteFill} />
          <View style={styles.cardTitleRow}>
            <Ionicons name="bulb-outline" size={16} color={Colors.gold} />
            <Text style={[styles.cardTitle, { marginBottom: 0, color: Colors.gold }]}>Pro Tips</Text>
          </View>
          {profile.proTips.map((tip, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: Colors.gold }]} />
              <Text style={styles.bulletText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Tallow fit */}
        <View style={styles.tdCard}>
          <LinearGradient colors={['rgba(196,98,45,0.12)', 'rgba(196,98,45,0.04)']} style={StyleSheet.absoluteFill} />
          <Text style={styles.tdEyebrow}>TALLOWDERMICS FIT</Text>
          <Text style={styles.tdText}>{profile.tallowFit}</Text>
          <Pressable style={{ marginTop: 8 }} onPress={() => router.push('/product')}>
            <Text style={styles.tdCta}>See the formula →</Text>
          </Pressable>
        </View>

        {/* Coach CTA */}
        <Pressable style={styles.coachCta} onPress={() => router.push('/(tabs)/coach')}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} />
          <Text style={styles.coachCtaText}>Ask Derm about {type} skin</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scroll: { paddingHorizontal: 16 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  hero: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, padding: 22, marginBottom: 14, gap: 8, alignItems: 'center' },
  heroEmoji: { fontSize: 48 },
  heroName: { fontSize: 26, fontWeight: '800' },
  heroDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, textAlign: 'center' },

  card: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  bulletText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, flex: 1 },

  ingredientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8 },
  ingredientBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  ingredientName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 3 },
  ingredientWhy: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },

  routineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  routineNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  routineNumText: { fontSize: 11, fontWeight: '800', color: Colors.white },
  routineStep: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  routineRec: { fontSize: 12, color: Colors.primary, fontWeight: '500', marginBottom: 2 },
  routineWhy: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },

  proCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(212,169,106,0.15)', padding: 16, marginBottom: 12, gap: 8 },
  tdCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 18, marginBottom: 12, gap: 8 },
  tdEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: Colors.primary },
  tdText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  tdCta: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  coachCta: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 8 },
  coachCtaText: { flex: 1, fontSize: 13, color: Colors.textSecondary },
});
