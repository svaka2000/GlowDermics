import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Groq from 'groq-sdk';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

const CACHE_KEY = 'gd_diet_guide';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

type DietGuide = {
  headline: string;
  overview: string;
  topFoods: { name: string; emoji: string; benefit: string; skinImpact: string }[];
  foodsToLimit: { name: string; emoji: string; why: string }[];
  nutrients: { nutrient: string; why: string; sources: string }[];
  gutSkinAxis: string;
  hydrationTip: string;
  ancestralNote: string;
  dailyPlan: { meal: string; suggestions: string }[];
};

export default function DietForSkin() {
  const [guide, setGuide] = useState<DietGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'eat' | 'avoid' | 'nutrients' | 'plan'>('eat');

  useFocusEffect(useCallback(() => {
    loadGuide();
  }, []));

  const loadGuide = async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const { guide: cached, ts } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL) { setGuide(cached); return; }
      }
    } catch {}
    generate();
  };

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const profile = await Storage.getUserProfile();
      const history = await Storage.getScanHistory();

      const prompt = `You are a dermatologist and nutritionist expert for GlowDermics, connected to TallowDermics — a brand that believes in ancestral nutrition and skincare.

User profile:
- Skin type: ${profile?.skinType || 'unknown'}
- Concerns: ${profile?.primaryConcerns?.join(', ') || 'none specified'}
- Goals: ${profile?.goals?.join(', ') || 'none specified'}
- Diet quality: ${profile?.lifestyle?.diet || 'balanced'}
- Latest skin score: ${history[0]?.overallScore ?? 'no scan yet'}/100

Generate a personalized nutrition-for-skin guide. Focus on evidence-based, whole-food recommendations aligned with ancestral nutrition philosophy. Connect to TallowDermics brand values naturally.

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "headline": "<punchy headline about diet and their skin type>",
  "overview": "<2-3 sentences: how diet affects skin for this person specifically>",
  "topFoods": [
    {"name": "<food name>", "emoji": "<emoji>", "benefit": "<specific skin benefit>", "skinImpact": "<which score it helps: hydration/clarity/texture/evenness>"},
    {"name": "<food>", "emoji": "<emoji>", "benefit": "<benefit>", "skinImpact": "<score>"},
    {"name": "<food>", "emoji": "<emoji>", "benefit": "<benefit>", "skinImpact": "<score>"},
    {"name": "<food>", "emoji": "<emoji>", "benefit": "<benefit>", "skinImpact": "<score>"},
    {"name": "<food>", "emoji": "<emoji>", "benefit": "<benefit>", "skinImpact": "<score>"},
    {"name": "<food>", "emoji": "<emoji>", "benefit": "<benefit>", "skinImpact": "<score>"},
    {"name": "<food>", "emoji": "<emoji>", "benefit": "<benefit>", "skinImpact": "<score>"},
    {"name": "<food>", "emoji": "<emoji>", "benefit": "<benefit>", "skinImpact": "<score>"}
  ],
  "foodsToLimit": [
    {"name": "<food to limit>", "emoji": "<emoji>", "why": "<specific reason it harms skin for their type>"},
    {"name": "<food>", "emoji": "<emoji>", "why": "<why>"},
    {"name": "<food>", "emoji": "<emoji>", "why": "<why>"},
    {"name": "<food>", "emoji": "<emoji>", "why": "<why>"},
    {"name": "<food>", "emoji": "<emoji>", "why": "<why>"}
  ],
  "nutrients": [
    {"nutrient": "<Vitamin A, Zinc, Omega-3, etc.>", "why": "<why critical for their skin type>", "sources": "<best food sources>"},
    {"nutrient": "<nutrient>", "why": "<why>", "sources": "<sources>"},
    {"nutrient": "<nutrient>", "why": "<why>", "sources": "<sources>"},
    {"nutrient": "<nutrient>", "why": "<why>", "sources": "<sources>"},
    {"nutrient": "<nutrient>", "why": "<why>", "sources": "<sources>"}
  ],
  "gutSkinAxis": "<2-3 sentences on how gut health affects their specific skin concerns — the gut-skin axis>",
  "hydrationTip": "<specific hydration advice beyond 'drink 8 glasses' — timing, types, foods with water>",
  "ancestralNote": "<1-2 sentences connecting ancestral nutrition philosophy to their skin goals — mention animal fats, fermented foods, whole foods naturally>",
  "dailyPlan": [
    {"meal": "Breakfast", "suggestions": "<2-3 skin-supporting breakfast ideas for their type>"},
    {"meal": "Lunch", "suggestions": "<2-3 skin-supporting lunch ideas>"},
    {"meal": "Dinner", "suggestions": "<2-3 skin-supporting dinner ideas>"},
    {"meal": "Snacks", "suggestions": "<2-3 skin-supporting snack ideas>"}
  ]
}`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1200,
      });

      const text = response.choices[0].message.content?.trim() || '';
      const json = text.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '');
      const parsed: DietGuide = JSON.parse(json);
      setGuide(parsed);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ guide: parsed, ts: Date.now() }));
    } catch (e: any) {
      setError(e?.message || 'Failed to generate diet guide.');
    } finally {
      setLoading(false);
    }
  };

  const IMPACT_COLORS: Record<string, string> = {
    hydration: '#60A5FA',
    clarity: Colors.scoreExcellent,
    texture: '#A78BFA',
    evenness: Colors.gold,
    firmness: Colors.primary,
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Diet for Skin</Text>
            <Text style={styles.headerSub}>Eat your way to better skin</Text>
          </View>
          <Pressable style={styles.reloadBtn} onPress={generate}>
            <Ionicons name="refresh-outline" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {loading && (
          <View style={styles.loadCard}>
            <ActivityIndicator color={Colors.primary} size="large" style={{ marginBottom: 16 }} />
            <Text style={styles.loadTitle}>Building your skin nutrition plan…</Text>
            <Text style={styles.loadSub}>Personalizing to your skin type, concerns, and goals</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={generate}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {guide && (
          <>
            {/* Hero */}
            <View style={styles.heroCard}>
              <LinearGradient colors={['rgba(74,222,128,0.12)', 'rgba(74,222,128,0.03)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.heroEmoji}>🥗</Text>
              <Text style={styles.headline}>{guide.headline}</Text>
              <Text style={styles.overview}>{guide.overview}</Text>
            </View>

            {/* Gut-skin */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="body-outline" size={16} color={Colors.primary} />
                <Text style={styles.infoTitle}>The Gut-Skin Connection</Text>
              </View>
              <Text style={styles.infoText}>{guide.gutSkinAxis}</Text>
            </View>

            {/* Tab bar */}
            <View style={styles.tabBar}>
              {(['eat', 'avoid', 'nutrients', 'plan'] as const).map(t => (
                <Pressable key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
                  <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                    {t === 'eat' ? 'Top Foods' : t === 'avoid' ? 'Limit' : t === 'nutrients' ? 'Nutrients' : 'Daily Plan'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Eat tab */}
            {tab === 'eat' && (
              <View style={styles.foodGrid}>
                {guide.topFoods.map((food, i) => (
                  <View key={i} style={styles.foodCard}>
                    <LinearGradient colors={['rgba(74,222,128,0.08)', 'rgba(74,222,128,0.02)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.foodTop}>
                      <Text style={styles.foodEmoji}>{food.emoji}</Text>
                      {food.skinImpact && (
                        <View style={[styles.impactBadge, { backgroundColor: (IMPACT_COLORS[food.skinImpact.toLowerCase()] || Colors.primary) + '20' }]}>
                          <Text style={[styles.impactText, { color: IMPACT_COLORS[food.skinImpact.toLowerCase()] || Colors.primary }]}>
                            ↑ {food.skinImpact}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={styles.foodBenefit}>{food.benefit}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Avoid tab */}
            {tab === 'avoid' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Foods to Limit for Your Skin</Text>
                {guide.foodsToLimit.map((food, i) => (
                  <View key={i} style={styles.avoidRow}>
                    <Text style={styles.avoidEmoji}>{food.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.avoidName}>{food.name}</Text>
                      <Text style={styles.avoidWhy}>{food.why}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Nutrients tab */}
            {tab === 'nutrients' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Key Nutrients for Your Skin</Text>
                {guide.nutrients.map((n, i) => (
                  <View key={i} style={styles.nutrientCard}>
                    <Text style={styles.nutrientName}>{n.nutrient}</Text>
                    <Text style={styles.nutrientWhy}>{n.why}</Text>
                    <View style={styles.sourcesRow}>
                      <Ionicons name="leaf-outline" size={12} color={Colors.scoreExcellent} />
                      <Text style={styles.sourcesText}>{n.sources}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Plan tab */}
            {tab === 'plan' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Sample Skin-First Day</Text>
                {guide.dailyPlan.map((meal, i) => (
                  <View key={i} style={styles.mealRow}>
                    <View style={styles.mealLabel}>
                      <Text style={styles.mealName}>{meal.meal}</Text>
                    </View>
                    <Text style={styles.mealSuggestions}>{meal.suggestions}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Hydration tip */}
            <View style={styles.hydrationCard}>
              <Ionicons name="water-outline" size={16} color="#60A5FA" />
              <View style={{ flex: 1 }}>
                <Text style={styles.hydrationLabel}>HYDRATION TIP</Text>
                <Text style={styles.hydrationText}>{guide.hydrationTip}</Text>
              </View>
            </View>

            {/* Ancestral note */}
            <Pressable style={styles.ancestralCard} onPress={() => router.push('/product')}>
              <LinearGradient colors={['rgba(196,98,45,0.15)', 'rgba(196,98,45,0.05)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.ancestralEmoji}>🥩</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.ancestralTitle}>Ancestral Nutrition</Text>
                <Text style={styles.ancestralText}>{guide.ancestralNote}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
            </Pressable>
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
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  reloadBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  loadCard: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  loadTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  loadSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', maxWidth: 280, lineHeight: 20 },
  errorCard: { alignItems: 'center', padding: 24, gap: 12 },
  errorText: { fontSize: 13, color: Colors.scorePoor, textAlign: 'center' },
  retryBtn: { borderRadius: 12, borderWidth: 1, borderColor: Colors.borderStrong, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  heroCard: {
    borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)',
    padding: 20, gap: 10, marginBottom: 12, alignItems: 'center',
  },
  heroEmoji: { fontSize: 44 },
  headline: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  overview: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, textAlign: 'center' },

  infoCard: {
    backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: 14, gap: 8, marginBottom: 12,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  infoText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  tabBar: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 14, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: Colors.bgElevated },
  tabLabel: { fontSize: 10, fontWeight: '600', color: Colors.textMuted },
  tabLabelActive: { color: Colors.textPrimary },

  foodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  foodCard: {
    width: '47%', borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)',
    backgroundColor: Colors.bgCard, padding: 14, gap: 6,
  },
  foodTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  foodEmoji: { fontSize: 28 },
  impactBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  impactText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  foodName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  foodBenefit: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },

  card: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  avoidRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avoidEmoji: { fontSize: 22 },
  avoidName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 3 },
  avoidWhy: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  nutrientCard: { backgroundColor: Colors.bgElevated, borderRadius: 12, padding: 12, gap: 4 },
  nutrientName: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  nutrientWhy: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  sourcesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  sourcesText: { fontSize: 11, color: Colors.scoreExcellent, fontWeight: '500' },

  mealRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 4 },
  mealLabel: {},
  mealName: { fontSize: 12, fontWeight: '800', color: Colors.primary, letterSpacing: 0.5 },
  mealSuggestions: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  hydrationCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: 'rgba(96,165,250,0.08)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(96,165,250,0.2)', padding: 14, marginBottom: 12,
  },
  hydrationLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: '#60A5FA', marginBottom: 4 },
  hydrationText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  ancestralCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)',
    padding: 16, marginBottom: 12,
  },
  ancestralEmoji: { fontSize: 24 },
  ancestralTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  ancestralText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
});
