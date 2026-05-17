import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Groq from 'groq-sdk';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

type FlaggedIngredient = {
  name: string;
  category: 'irritant' | 'allergen' | 'comedogenic' | 'endocrine_disruptor' | 'fragrance' | 'preservative';
  risk: 'high' | 'medium' | 'low';
  reason: string;
  sensitiveNote: string;
};

type SensitivityResult = {
  overallScore: number; // 0-100, higher = cleaner
  verdict: 'clean' | 'borderline' | 'concerning';
  flagged: FlaggedIngredient[];
  cleanIngredients: string[];
  comedogenicRating: number; // 0-5
  fragrancePresent: boolean;
  alcoholPresent: boolean;
  summary: string;
  skinTypeWarnings: { skinType: string; warning: string }[];
};

function buildCategoryConfig(c: Palette): Record<string, { color: string; label: string; icon: string }> {
  return {
    irritant: { color: c.scorePoor, label: 'Irritant', icon: 'flame-outline' },
    allergen: { color: '#F97316', label: 'Known Allergen', icon: 'medical-outline' },
    comedogenic: { color: '#6B85A8', label: 'Pore-Clogging', icon: 'close-circle-outline' },
    endocrine_disruptor: { color: '#EF4444', label: 'Endocrine Disruptor', icon: 'warning-outline' },
    fragrance: { color: c.scoreFair, label: 'Fragrance', icon: 'water-outline' },
    preservative: { color: c.gold, label: 'Preservative', icon: 'shield-outline' },
  };
}

function buildVerdictConfig(c: Palette) {
  return {
    clean: { color: c.scoreExcellent, bg: 'rgba(74,222,128,0.10)', icon: 'checkmark-circle', label: 'Clean Formula' },
    borderline: { color: c.scoreFair, bg: 'rgba(245,158,11,0.10)', icon: 'alert-circle', label: 'Review Carefully' },
    concerning: { color: c.scorePoor, bg: 'rgba(248,113,113,0.10)', icon: 'close-circle', label: 'Concerns Found' },
  };
}

const EXAMPLE_LISTS = [
  {
    label: 'Typical drugstore moisturizer',
    list: 'Water, Glycerin, Petrolatum, Dimethicone, Niacinamide, Fragrance, Phenoxyethanol, Methylparaben, Propylparaben, DMDM Hydantoin, Sodium Lauryl Sulfate, Alcohol Denat.',
  },
  {
    label: 'TallowDermics Balm',
    list: 'Grass-fed Beef Tallow, Manuka Honey, Organic Olive Oil, Calendula Extract',
  },
  {
    label: 'Popular serum',
    list: 'Water, Ascorbic Acid, Propylene Glycol, Glycerin, Tocopherol, Ferulic Acid, Panthenol, Sodium Hyaluronate, Phenoxyethanol, Triethanolamine, Fragrance',
  },
];

export default function Sensitivity() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const CATEGORY_CONFIG = useMemo(() => buildCategoryConfig(colors), [colors]);
  const VERDICT_CONFIG = useMemo(() => buildVerdictConfig(colors), [colors]);
  const [ingredients, setIngredients] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SensitivityResult | null>(null);
  const [error, setError] = useState('');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const analyze = async () => {
    if (!ingredients.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const profile = await Storage.getUserProfile();

      const prompt = `You are a cosmetic safety expert and dermatologist. Analyze this ingredient list for potential skin concerns.

Ingredient list:
${ingredients}

User skin type: ${profile?.skinType || 'not specified'}
User concerns: ${profile?.primaryConcerns?.join(', ') || 'not specified'}

Evaluate for: irritants, known contact allergens, comedogenic ingredients, endocrine disruptors (parabens, BHA, etc.), fragrance compounds, and preservatives of concern.

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "overallScore": <cleanliness score 0-100, higher = cleaner/safer>,
  "verdict": "<clean|borderline|concerning>",
  "flagged": [
    {
      "name": "<exact ingredient name from list>",
      "category": "<irritant|allergen|comedogenic|endocrine_disruptor|fragrance|preservative>",
      "risk": "<high|medium|low>",
      "reason": "<scientific reason this is flagged>",
      "sensitiveNote": "<specific advice: avoid if X, patch test first, etc.>"
    }
  ],
  "cleanIngredients": ["<notable clean/beneficial ingredients worth highlighting>"],
  "comedogenicRating": <0-5, 0=non-comedogenic, 5=highly comedogenic>,
  "fragrancePresent": <true|false>,
  "alcoholPresent": <true|false — denatured or drying alcohols>,
  "summary": "<2-3 sentence plain-English verdict>",
  "skinTypeWarnings": [
    {"skinType": "<oily|dry|sensitive|combination|acne-prone>", "warning": "<specific warning for this skin type>"}
  ]
}

Only flag ingredients that have legitimate scientific concern. If the formula is genuinely clean, say so. Keep flagged array empty if truly nothing concerning.`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1000,
      });

      const text = response.choices[0].message.content?.trim() || '';
      const json = text.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '');
      setResult(JSON.parse(json));
    } catch (e: any) {
      setError(e?.message || 'Failed to analyze ingredients.');
    } finally {
      setLoading(false);
    }
  };

  function ScoreCircle({ score }: { score: number }) {
    const color = score >= 80 ? colors.scoreExcellent : score >= 60 ? colors.scoreGood : score >= 40 ? colors.scoreFair : colors.scorePoor;
    return (
      <View style={[styles.scoreCircle, { borderColor: color + '50' }]}>
        <Text style={[styles.scoreNum, { color }]}>{score}</Text>
        <Text style={styles.scoreLabel}>/ 100</Text>
      </View>
    );
  }

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
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>Sensitivity Test</Text>
            <Text style={styles.headerSub}>Scan for irritants & allergens</Text>
          </View>
          <View style={{ width: 36 }} />
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ opacity: contentAnim }}>

        {/* Input */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>PASTE INGREDIENT LIST</Text>
          <TextInput
            style={styles.input}
            placeholder="E.g. Water, Glycerin, Fragrance, Phenoxyethanol, Methylparaben…"
            placeholderTextColor={colors.textMuted}
            value={ingredients}
            onChangeText={setIngredients}
            multiline
            numberOfLines={5}
          />
        </View>

        {/* Examples */}
        <View style={styles.examplesSection}>
          <Text style={styles.examplesTitle}>Quick Examples</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.examplesScroll}>
            {EXAMPLE_LISTS.map(e => (
              <Pressable key={e.label} style={styles.exampleChip} onPress={() => setIngredients(e.list)}>
                <Text style={styles.exampleChipText}>{e.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Pressable
          style={[styles.analyzeBtn, (!ingredients.trim() || loading) && styles.analyzeBtnDisabled]}
          onPress={analyze}
          disabled={!ingredients.trim() || loading}
        >
          <LinearGradient
            colors={ingredients.trim() ? [colors.primaryLight, colors.primary] : ['#333', '#222']}
            style={styles.analyzeBtnGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.white} />
            )}
            <Text style={styles.analyzeBtnText}>{loading ? 'Scanning…' : 'Run Sensitivity Scan'}</Text>
          </LinearGradient>
        </Pressable>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {result && (
          <>
            {/* Verdict card */}
            {(() => {
              const cfg = VERDICT_CONFIG[result.verdict];
              return (
                <View style={[styles.verdictCard, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
                  <ScoreCircle score={result.overallScore} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.verdictTop}>
                      <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
                      <Text style={[styles.verdictLabel, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <Text style={styles.verdictSummary}>{result.summary}</Text>
                  </View>
                </View>
              );
            })()}

            {/* Quick indicators */}
            <View style={styles.indicatorRow}>
              <View style={[styles.indicator, { borderColor: result.comedogenicRating > 2 ? colors.scorePoor + '50' : colors.border }]}>
                <Text style={styles.indicatorLabel}>COMEDOGENIC</Text>
                <Text style={[styles.indicatorVal, { color: result.comedogenicRating > 3 ? colors.scorePoor : result.comedogenicRating > 1 ? colors.scoreFair : colors.scoreGood }]}>
                  {result.comedogenicRating}/5
                </Text>
              </View>
              <View style={[styles.indicator, { borderColor: result.fragrancePresent ? colors.scoreFair + '50' : colors.border }]}>
                <Text style={styles.indicatorLabel}>FRAGRANCE</Text>
                <Text style={[styles.indicatorVal, { color: result.fragrancePresent ? colors.scoreFair : colors.scoreExcellent }]}>
                  {result.fragrancePresent ? 'YES' : 'NONE'}
                </Text>
              </View>
              <View style={[styles.indicator, { borderColor: result.alcoholPresent ? colors.scoreFair + '50' : colors.border }]}>
                <Text style={styles.indicatorLabel}>DRYING ALCH</Text>
                <Text style={[styles.indicatorVal, { color: result.alcoholPresent ? colors.scoreFair : colors.scoreExcellent }]}>
                  {result.alcoholPresent ? 'YES' : 'NONE'}
                </Text>
              </View>
            </View>

            {/* Flagged ingredients */}
            {result.flagged.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>⚠ Flagged Ingredients ({result.flagged.length})</Text>
                {result.flagged.map((f, i) => {
                  const cfg = CATEGORY_CONFIG[f.category];
                  return (
                    <Pressable
                      key={i}
                      style={styles.flaggedCard}
                      onPress={() => router.push(`/ingredient/${encodeURIComponent(f.name)}`)}
                    >
                      <View style={styles.flaggedHeader}>
                        <View style={[styles.catBadge, { backgroundColor: cfg.color + '20' }]}>
                          <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
                          <Text style={[styles.catBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                        <View style={[styles.riskBadge, {
                          backgroundColor: f.risk === 'high' ? 'rgba(248,113,113,0.15)' : f.risk === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(74,222,128,0.15)',
                        }]}>
                          <Text style={[styles.riskText, {
                            color: f.risk === 'high' ? colors.scorePoor : f.risk === 'medium' ? colors.gold : colors.scoreGood,
                          }]}>
                            {f.risk.toUpperCase()}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
                      </View>
                      <Text style={styles.flaggedName}>{f.name}</Text>
                      <Text style={styles.flaggedReason}>{f.reason}</Text>
                      <View style={styles.flaggedNoteRow}>
                        <Ionicons name="information-circle-outline" size={12} color={colors.primary} />
                        <Text style={styles.flaggedNote}>{f.sensitiveNote}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Skin type warnings */}
            {result.skinTypeWarnings.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Skin Type Warnings</Text>
                {result.skinTypeWarnings.map((w, i) => (
                  <View key={i} style={styles.warnRow}>
                    <View style={styles.skinTypePill}>
                      <Text style={styles.skinTypePillText}>{w.skinType}</Text>
                    </View>
                    <Text style={styles.warnText}>{w.warning}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Clean ingredients */}
            {result.cleanIngredients.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>✓ Notable Clean Ingredients</Text>
                <View style={styles.cleanGrid}>
                  {result.cleanIngredients.map((c, i) => (
                    <Pressable
                      key={i}
                      style={styles.cleanChip}
                      onPress={() => router.push(`/ingredient/${encodeURIComponent(c)}`)}
                    >
                      <Ionicons name="checkmark" size={10} color={colors.scoreExcellent} />
                      <Text style={styles.cleanChipText}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
          <Text style={styles.infoText}>AI analysis for reference only. Individual reactions vary. Patch test new products before full application.</Text>
        </View>

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

  inputCard: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border,
    padding: 16, marginBottom: 12,
  },
  inputLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: c.textMuted, marginBottom: 10 },
  input: {
    fontSize: 13, color: c.textPrimary, lineHeight: 20,
    minHeight: 90, textAlignVertical: 'top',
  },
  examplesSection: { marginBottom: 14 },
  examplesTitle: { fontSize: 12, fontWeight: '600', color: c.textMuted, marginBottom: 8 },
  examplesScroll: { gap: 8, paddingRight: 4 },
  exampleChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
  },
  exampleChipText: { fontSize: 12, color: c.textSecondary, fontWeight: '500' },

  analyzeBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  analyzeBtnDisabled: { opacity: 0.5 },
  analyzeBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  analyzeBtnText: { fontSize: 16, fontWeight: '700', color: c.white },

  errorCard: { backgroundColor: 'rgba(248,113,113,0.10)', borderRadius: 12, padding: 14, marginBottom: 14 },
  errorText: { fontSize: 13, color: c.scorePoor },

  verdictCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12,
  },
  scoreCircle: {
    width: 66, height: 66, borderRadius: 33, borderWidth: 2,
    backgroundColor: c.bgElevated, alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: { fontSize: 22, fontWeight: '800' },
  scoreLabel: { fontSize: 9, color: c.textMuted, marginTop: -2 },
  verdictTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  verdictLabel: { fontSize: 15, fontWeight: '800' },
  verdictSummary: { fontSize: 13, color: c.textSecondary, lineHeight: 19 },

  indicatorRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  indicator: {
    flex: 1, backgroundColor: c.bgCard, borderRadius: 12, borderWidth: 1,
    padding: 12, alignItems: 'center', gap: 6,
  },
  indicatorLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1, color: c.textMuted },
  indicatorVal: { fontSize: 15, fontWeight: '800' },

  card: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border,
    padding: 16, gap: 10, marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },

  flaggedCard: { backgroundColor: c.bgElevated, borderRadius: 12, padding: 12, gap: 6 },
  flaggedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, flex: 1 },
  catBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  riskBadge: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
  riskText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  flaggedName: { fontSize: 14, fontWeight: '700', color: c.textPrimary },
  flaggedReason: { fontSize: 12, color: c.textSecondary, lineHeight: 18 },
  flaggedNoteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  flaggedNote: { flex: 1, fontSize: 11, color: c.primary, lineHeight: 16 },

  warnRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  skinTypePill: { backgroundColor: 'rgba(196,98,45,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  skinTypePillText: { fontSize: 10, fontWeight: '700', color: c.primary, textTransform: 'capitalize' },
  warnText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 19 },

  cleanGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cleanChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(74,222,128,0.10)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)',
    paddingHorizontal: 10, paddingVertical: 5,
  },
  cleanChipText: { fontSize: 12, color: c.scoreExcellent, fontWeight: '500' },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(196,98,45,0.05)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(196,98,45,0.1)', padding: 14, marginTop: 4,
  },
  infoText: { flex: 1, fontSize: 11, color: c.textMuted, lineHeight: 17 },
  });
}
