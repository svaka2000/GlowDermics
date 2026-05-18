import { useCallback, useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image, Animated, Easing,
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
import { getFoodImage } from '../../src/services/imageSearch';

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
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [guide, setGuide] = useState<DietGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'eat' | 'avoid' | 'nutrients' | 'plan'>('eat');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
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

      const prompt = `You are Vera, a dermatologist and nutritionist expert for Velumi AI — a premium, brand-agnostic skin-intelligence app.

User profile:
- Skin type: ${profile?.skinType || 'unknown'}
- Concerns: ${profile?.primaryConcerns?.join(', ') || 'none specified'}
- Goals: ${profile?.goals?.join(', ') || 'none specified'}
- Diet quality: ${profile?.lifestyle?.diet || 'balanced'}
- Latest skin score: ${history[0]?.overallScore ?? 'no scan yet'}/100

Generate a personalized nutrition-for-skin guide. Focus on evidence-based, whole-food recommendations. Keep it strictly brand-agnostic — no product or brand promotion.

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
    clarity: colors.scoreExcellent,
    texture: '#6B85A8',
    evenness: colors.gold,
    firmness: colors.primary,
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>Diet for Skin</Text>
            <Text style={styles.headerSub}>Eat your way to better skin</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Refresh plan" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.reloadBtn} onPress={generate}>
            <Ionicons name="refresh-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ opacity: contentAnim }}>

        {loading && (
          <View style={styles.loadCard}>
            <ActivityIndicator color={colors.primary} size="large" style={{ marginBottom: 16 }} />
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
                <Ionicons name="body-outline" size={16} color={colors.primary} />
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
                {guide.topFoods.map((food, i) => {
                  const imgUrl = getFoodImage(food.name);
                  const impactColor = IMPACT_COLORS[food.skinImpact?.toLowerCase()] || colors.primary;
                  return (
                    <View key={i} style={styles.foodCard}>
                      {/* Real food image */}
                      <Image
                        source={{ uri: imgUrl }}
                        style={styles.foodCardImg}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.75)']}
                        style={styles.foodCardGrad}
                      />
                      {/* Impact badge */}
                      {food.skinImpact && (
                        <View style={[styles.impactBadge, { backgroundColor: impactColor }]}>
                          <Text style={styles.impactText}>↑ {food.skinImpact}</Text>
                        </View>
                      )}
                      {/* Bottom text overlay */}
                      <View style={styles.foodCardText}>
                        <Text style={styles.foodEmoji}>{food.emoji}</Text>
                        <Text style={styles.foodName}>{food.name}</Text>
                        <Text style={styles.foodBenefit} numberOfLines={2}>{food.benefit}</Text>
                      </View>
                    </View>
                  );
                })}
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
                      <Ionicons name="leaf-outline" size={12} color={colors.scoreExcellent} />
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
              <LinearGradient colors={['rgba(138,120,96,0.15)', 'rgba(138,120,96,0.05)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.ancestralEmoji}>🥩</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.ancestralTitle}>Ancestral Nutrition</Text>
                <Text style={styles.ancestralText}>{guide.ancestralNote}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
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
  reloadBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  headerTitle: { fontSize: 22, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  loadCard: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  loadTitle: { fontSize: 17, fontWeight: '700', color: c.textPrimary },
  loadSub: { fontSize: 13, color: c.textMuted, textAlign: 'center', maxWidth: 280, lineHeight: 20 },
  errorCard: { alignItems: 'center', padding: 24, gap: 12 },
  errorText: { fontSize: 13, color: c.scorePoor, textAlign: 'center' },
  retryBtn: { borderRadius: 12, borderWidth: 1, borderColor: c.borderStrong, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { fontSize: 13, color: c.primary, fontWeight: '600' },

  heroCard: {
    borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)',
    padding: 20, gap: 10, marginBottom: 12, alignItems: 'center',
  },
  heroEmoji: { fontSize: 44 },
  headline: { fontSize: 20, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  overview: { fontSize: 14, color: c.textSecondary, lineHeight: 22, textAlign: 'center' },

  infoCard: {
    backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.border,
    padding: 14, gap: 8, marginBottom: 12,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTitle: { fontSize: 13, fontWeight: '700', color: c.textPrimary },
  infoText: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  tabBar: { flexDirection: 'row', backgroundColor: c.bgCard, borderRadius: 14, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: c.border },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: c.bgElevated },
  tabLabel: { fontSize: 10, fontWeight: '600', color: c.textMuted },
  tabLabelActive: { color: c.textPrimary },

  foodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  foodCard: {
    width: '47%', height: 160, borderRadius: 16, overflow: 'hidden',
    backgroundColor: c.bgElevated, position: 'relative',
  },
  foodCardImg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%',
  },
  foodCardGrad: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  foodCardText: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 10, gap: 2,
  },
  foodEmoji: { fontSize: 18 },
  impactBadge: {
    position: 'absolute', top: 8, right: 8,
    borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3,
  },
  impactText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, color: '#fff' },
  foodName: { fontSize: 13, fontWeight: '700', color: '#fff', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  foodBenefit: { fontSize: 10, color: 'rgba(255,255,255,0.8)', lineHeight: 14 },

  card: { backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 16, gap: 12, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },

  avoidRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avoidEmoji: { fontSize: 22 },
  avoidName: { fontSize: 14, fontWeight: '600', color: c.textPrimary, marginBottom: 3 },
  avoidWhy: { fontSize: 12, color: c.textSecondary, lineHeight: 18 },

  nutrientCard: { backgroundColor: c.bgElevated, borderRadius: 12, padding: 12, gap: 4 },
  nutrientName: { fontSize: 14, fontWeight: '700', color: c.primary },
  nutrientWhy: { fontSize: 12, color: c.textSecondary, lineHeight: 18 },
  sourcesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  sourcesText: { fontSize: 11, color: c.scoreExcellent, fontWeight: '500' },

  mealRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border, gap: 4 },
  mealLabel: {},
  mealName: { fontSize: 12, fontWeight: '800', color: c.primary, letterSpacing: 0.5 },
  mealSuggestions: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  hydrationCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: 'rgba(96,165,250,0.08)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(96,165,250,0.2)', padding: 14, marginBottom: 12,
  },
  hydrationLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: '#60A5FA', marginBottom: 4 },
  hydrationText: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  ancestralCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(138,120,96,0.2)',
    padding: 16, marginBottom: 12,
  },
  ancestralEmoji: { fontSize: 24 },
  ancestralTitle: { fontSize: 13, fontWeight: '700', color: c.primary, marginBottom: 4 },
  ancestralText: { fontSize: 13, color: c.textSecondary, lineHeight: 19 },
  });
}
