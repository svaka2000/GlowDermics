import { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import Groq from 'groq-sdk';
import { searchBeautyProducts, ProductResult, getSkincareImage } from '../../src/services/imageSearch';

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

type IngredientProfile = {
  commonName: string;
  iupacName: string;
  category: string;
  safetyRating: 'safe' | 'generally_safe' | 'caution' | 'avoid';
  function: string;
  howItWorks: string;
  skinTypes: { type: string; verdict: string; note: string }[];
  concerns: string[];
  benefits: string[];
  effectiveConcentration: string;
  pairsWith: string[];
  conflictsWith: string[];
  naturalVsSynthetic: string;
  researchStrength: 'strong' | 'moderate' | 'limited' | 'theoretical';
  isOcclusiveIngredient: boolean;
  barrierNote?: string;
};

function buildSafetyConfig(c: Palette) {
  return {
    safe: { color: c.scoreExcellent, label: 'Safe', icon: 'shield-checkmark-outline' as const },
    generally_safe: { color: c.scoreGood, label: 'Generally Safe', icon: 'checkmark-circle-outline' as const },
    caution: { color: c.scoreFair, label: 'Use with Caution', icon: 'alert-circle-outline' as const },
    avoid: { color: c.scorePoor, label: 'Avoid', icon: 'close-circle-outline' as const },
  };
}

function buildResearchConfig(c: Palette) {
  return {
    strong: { color: c.scoreExcellent, label: 'Strong Evidence' },
    moderate: { color: c.scoreGood, label: 'Moderate Evidence' },
    limited: { color: c.scoreFair, label: 'Limited Evidence' },
    theoretical: { color: c.textMuted, label: 'Theoretical' },
  };
}

export default function IngredientDecoder() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const SAFETY_CONFIG = useMemo(() => buildSafetyConfig(colors), [colors]);
  const RESEARCH_CONFIG = useMemo(() => buildResearchConfig(colors), [colors]);
  const { name } = useLocalSearchParams<{ name: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<IngredientProfile | null>(null);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [heroImage, setHeroImage] = useState<string>('');

  useEffect(() => {
    if (name) {
      const decoded = decodeURIComponent(name);
      decode(decoded);
      // Fetch real product data from Open Beauty Facts
      searchBeautyProducts(decoded, 4).then(results => {
        setProducts(results.filter(p => p.imageUrl));
      }).catch(() => {});
      // Set a curated hero image
      setHeroImage(getSkincareImage(decoded));
      // Track for achievements
      import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
        AsyncStorage.getItem('gd_ingredients_viewed').then(raw => {
          const list: string[] = raw ? JSON.parse(raw) : [];
          if (!list.includes(decoded)) {
            list.push(decoded);
            AsyncStorage.setItem('gd_ingredients_viewed', JSON.stringify(list));
          }
        }).catch(() => {});
      }).catch(() => {});
    }
  }, [name]);

  const decode = async (ingredientName: string) => {
    setLoading(true);
    setError('');
    try {
      const prompt = `You are a cosmetic chemist and dermatology expert. Provide a comprehensive ingredient profile for: "${ingredientName}"

Respond ONLY with a valid JSON object (no markdown, no code fences):
{
  "commonName": "<most recognizable name>",
  "iupacName": "<chemical name or INCI name>",
  "category": "<e.g. Humectant, Emollient, Preservative, Active, Surfactant, Antioxidant, etc>",
  "safetyRating": "<safe|generally_safe|caution|avoid>",
  "function": "<one sentence: what it does in a formula>",
  "howItWorks": "<2-3 sentences of mechanism — the actual science>",
  "skinTypes": [
    {"type": "Oily", "verdict": "<good|neutral|bad>", "note": "<why>"},
    {"type": "Dry", "verdict": "<good|neutral|bad>", "note": "<why>"},
    {"type": "Combination", "verdict": "<good|neutral|bad>", "note": "<why>"},
    {"type": "Sensitive", "verdict": "<good|neutral|bad>", "note": "<why>"},
    {"type": "Acne-Prone", "verdict": "<good|neutral|bad>", "note": "<why>"}
  ],
  "concerns": ["<1-3 things to be aware of>"],
  "benefits": ["<2-4 actual benefits>"],
  "effectiveConcentration": "<what % range actually works, or 'varies'",
  "pairsWith": ["<2-3 ingredients it works well with>"],
  "conflictsWith": ["<1-3 ingredients to avoid pairing with, or empty array if none>"],
  "naturalVsSynthetic": "<brief note on whether typically natural, synthetic, or both, and what to prefer>",
  "researchStrength": "<strong|moderate|limited|theoretical>",
  "isOcclusiveIngredient": <true if this ingredient is an occlusive lipid or found in lipid-rich/animal-fat formulas>,
  "barrierNote": "<optional: 1 sentence on how occlusive/lipid-barrier skincare relates to this ingredient>"
}`;

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
      setError('Could not decode this ingredient. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const safetyConfig = profile ? SAFETY_CONFIG[profile.safetyRating] : null;
  const researchConfig = profile ? RESEARCH_CONFIG[profile.researchStrength] : null;

  const VERDICT_CONFIG = {
    good: { color: colors.scoreExcellent, label: '✓ Good' },
    neutral: { color: colors.textMuted, label: '~ Neutral' },
    bad: { color: colors.scorePoor, label: '✗ Avoid' },
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
          <Text style={styles.loadingTitle}>Decoding ingredient...</Text>
          <Text style={styles.loadingSub}>{name ? decodeURIComponent(name) : ''}</Text>
        </View>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <Pressable style={[styles.backBtn, { margin: 16 }]} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
        </SafeAreaView>
        <View style={styles.loadingWrap}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>⚗️</Text>
          <Text style={styles.loadingTitle}>Couldn't decode</Text>
          <Text style={styles.loadingSub}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => name && decode(decodeURIComponent(name))}>
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
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Ingredient Decoder</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.heroCard}>
          <LinearGradient colors={[safetyConfig!.color + '14', safetyConfig!.color + '04']} style={StyleSheet.absoluteFill} />
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.categoryBadge}>{profile.category.toUpperCase()}</Text>
              <Text style={styles.ingredientName}>{profile.commonName}</Text>
              <Text style={styles.iupacName}>{profile.iupacName}</Text>
            </View>
            <View style={[styles.safetyBadge, { backgroundColor: safetyConfig!.color + '18', borderColor: safetyConfig!.color + '40' }]}>
              <Ionicons name={safetyConfig!.icon} size={18} color={safetyConfig!.color} />
              <Text style={[styles.safetyText, { color: safetyConfig!.color }]}>{safetyConfig!.label}</Text>
            </View>
          </View>
          <Text style={styles.functionText}>{profile.function}</Text>
          {researchConfig && (
            <View style={[styles.researchBadge, { backgroundColor: researchConfig.color + '14' }]}>
              <Ionicons name="flask-outline" size={12} color={researchConfig.color} />
              <Text style={[styles.researchText, { color: researchConfig.color }]}>{researchConfig.label}</Text>
            </View>
          )}
        </View>

        {/* How it works */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How It Works</Text>
          <Text style={styles.bodyText}>{profile.howItWorks}</Text>
        </View>

        {/* Skin type compatibility */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Skin Type Compatibility</Text>
          <View style={styles.skinTypeGrid}>
            {profile.skinTypes.map(st => {
              const v = VERDICT_CONFIG[st.verdict as keyof typeof VERDICT_CONFIG] ?? VERDICT_CONFIG.neutral;
              return (
                <View key={st.type} style={styles.skinTypeRow}>
                  <Text style={styles.skinTypeLabel}>{st.type}</Text>
                  <Text style={[styles.skinTypeVerdict, { color: v.color }]}>{v.label}</Text>
                  <Text style={styles.skinTypeNote} numberOfLines={2}>{st.note}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Benefits</Text>
          {profile.benefits.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: colors.scoreExcellent }]} />
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Concerns */}
        {profile.concerns.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Watch Out For</Text>
            {profile.concerns.map((c, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: colors.scoreFair }]} />
                <Text style={styles.bulletText}>{c}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Concentration */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Effective Concentration</Text>
          <Text style={styles.concentrationText}>{profile.effectiveConcentration}</Text>
        </View>

        {/* Pairs well / conflicts */}
        <View style={styles.halfRow}>
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardTitle}>Pairs With</Text>
            {profile.pairsWith.map((p, i) => (
              <View key={i} style={styles.pairRow}>
                <Ionicons name="add-circle-outline" size={14} color={colors.scoreExcellent} />
                <Text style={styles.pairText}>{p}</Text>
              </View>
            ))}
          </View>
          {profile.conflictsWith.length > 0 && (
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.cardTitle}>Conflicts With</Text>
              {profile.conflictsWith.map((c, i) => (
                <View key={i} style={styles.pairRow}>
                  <Ionicons name="remove-circle-outline" size={14} color={colors.scorePoor} />
                  <Text style={styles.pairText}>{c}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Natural vs synthetic */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Source</Text>
          <Text style={styles.bodyText}>{profile.naturalVsSynthetic}</Text>
        </View>

        {/* Occlusive connection */}
        {(profile.isOcclusiveIngredient || profile.barrierNote) && (
          <View style={styles.tdCard}>
            <LinearGradient colors={['rgba(138,120,96,0.12)', 'rgba(138,120,96,0.04)']} style={StyleSheet.absoluteFill} />
            <Text style={styles.tdEyebrow}>LIPID-BARRIER CONNECTION</Text>
            <Text style={styles.tdText}>{profile.barrierNote || 'This ingredient is present in or closely related to occlusive / lipid-barrier skincare formulations.'}</Text>
          </View>
        )}

        {/* Scan CTA */}
        {/* Real products from Open Beauty Facts */}
        {products.length > 0 && (
          <View style={styles.productsSection}>
            <Text style={styles.productsSectionTitle}>Real Products Containing This</Text>
            <Text style={styles.productsSectionSub}>From the Open Beauty Facts database</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
              {products.map((p, i) => (
                <View key={i} style={styles.productCard}>
                  {p.imageUrl ? (
                    <Image source={{ uri: p.imageUrl }} style={styles.productImg} resizeMode="contain" />
                  ) : (
                    <View style={[styles.productImg, styles.productImgPlaceholder]}>
                      <Ionicons name="cube-outline" size={28} color={colors.textMuted} />
                    </View>
                  )}
                  <Text style={styles.productName} numberOfLines={2}>{p.name}</Text>
                  {p.brand ? <Text style={styles.productBrand} numberOfLines={1}>{p.brand}</Text> : null}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <Pressable style={styles.scanCta} onPress={() => router.push('/scanner')}>
          <Ionicons name="flask-outline" size={18} color={colors.primary} />
          <Text style={styles.scanCtaText}>Scan a product to check if it contains this</Text>
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

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
  loadingSub: { fontSize: 13, color: c.textMuted },
  retryBtn: { backgroundColor: c.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: c.white },

  heroCard: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: c.border,
    padding: 20, marginBottom: 14, gap: 10,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  categoryBadge: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: c.textMuted, marginBottom: 6 },
  ingredientName: { fontSize: 24, fontWeight: '800', color: c.textPrimary, lineHeight: 30 },
  iupacName: { fontSize: 12, color: c.textMuted, marginTop: 4, fontStyle: 'italic' },
  safetyBadge: { flexDirection: 'column', alignItems: 'center', gap: 4, borderRadius: 12, borderWidth: 1, padding: 10, minWidth: 72 },
  safetyText: { fontSize: 10, fontWeight: '700', textAlign: 'center', lineHeight: 14 },
  functionText: { fontSize: 14, color: c.textSecondary, lineHeight: 21 },
  researchBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  researchText: { fontSize: 11, fontWeight: '600' },

  card: { backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: c.textPrimary, marginBottom: 10 },
  bodyText: { fontSize: 14, color: c.textSecondary, lineHeight: 22 },

  skinTypeGrid: { gap: 8 },
  skinTypeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  skinTypeLabel: { fontSize: 12, color: c.textMuted, fontWeight: '600', width: 70 },
  skinTypeVerdict: { fontSize: 12, fontWeight: '700', width: 70 },
  skinTypeNote: { fontSize: 12, color: c.textSecondary, flex: 1, lineHeight: 17 },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  bulletText: { fontSize: 13, color: c.textSecondary, lineHeight: 19, flex: 1 },

  concentrationText: { fontSize: 14, color: c.textPrimary, fontWeight: '600' },

  halfRow: { flexDirection: 'row', gap: 10, marginBottom: 0 },
  pairRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  pairText: { fontSize: 12, color: c.textSecondary, flex: 1 },

  tdCard: {
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(138,120,96,0.2)',
    padding: 18, marginBottom: 12, gap: 8,
  },
  tdEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: c.primary },
  tdText: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  tdCta: { fontSize: 13, color: c.primary, fontWeight: '600' },

  scanCta: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: c.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 8,
  },
  scanCtaText: { flex: 1, fontSize: 13, color: c.textSecondary },
  productsSection: { marginBottom: 14 },
  productsSectionTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary, marginBottom: 2 },
  productsSectionSub: { fontSize: 11, color: c.textMuted, marginBottom: 10 },
  productCard: {
    width: 120, backgroundColor: c.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: c.border, overflow: 'hidden', padding: 8,
  },
  productImg: { width: '100%', height: 80, marginBottom: 6, borderRadius: 8 },
  productImgPlaceholder: { backgroundColor: c.bgElevated, alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: 11, fontWeight: '600', color: c.textPrimary, lineHeight: 15 },
  productBrand: { fontSize: 10, color: c.textMuted, marginTop: 2 },
  });
}
