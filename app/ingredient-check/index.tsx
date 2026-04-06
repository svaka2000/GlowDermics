import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Groq from 'groq-sdk';
import { Colors } from '../../src/constants/colors';

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

type CheckResult = {
  overallSafety: 'safe' | 'caution' | 'conflict';
  conflicts: { ingredients: string[]; severity: 'high' | 'medium' | 'low'; reason: string; advice: string }[];
  synergies: { ingredients: string[]; benefit: string }[];
  redundancies: string[];
  summary: string;
  recommendation: string;
};

const SEVERITY_CONFIG = {
  high: { color: Colors.scorePoor, bg: 'rgba(248,113,113,0.12)', label: 'HIGH RISK' },
  medium: { color: Colors.scoreFair, bg: 'rgba(245,158,11,0.12)', label: 'CAUTION' },
  low: { color: Colors.scoreGood, bg: 'rgba(74,222,128,0.12)', label: 'MINOR' },
};

const SAFETY_CONFIG = {
  safe: { color: Colors.scoreExcellent, bg: 'rgba(74,222,128,0.10)', icon: 'checkmark-circle', label: 'Safe to Layer' },
  caution: { color: Colors.scoreFair, bg: 'rgba(245,158,11,0.10)', icon: 'alert-circle', label: 'Use with Caution' },
  conflict: { color: Colors.scorePoor, bg: 'rgba(248,113,113,0.10)', icon: 'close-circle', label: 'Conflicts Detected' },
};

const EXAMPLE_PRODUCTS = [
  {
    label: 'Vitamin C Serum',
    ingredients: 'Water, Ascorbic Acid, Niacinamide, Glycerin, Hyaluronic Acid, Phenoxyethanol',
  },
  {
    label: 'Retinol Cream',
    ingredients: 'Water, Retinol, Glycolic Acid, Salicylic Acid, Niacinamide, Dimethicone, Fragrance',
  },
  {
    label: 'TallowDermics Balm',
    ingredients: 'Grass-fed Beef Tallow, Manuka Honey, Organic Olive Oil, Calendula Extract',
  },
];

export default function IngredientCheck() {
  const [productA, setProductA] = useState('');
  const [productB, setProductB] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState('');

  const check = async () => {
    if (!productA.trim() || !productB.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const prompt = `You are a cosmetic chemist expert. Analyze ingredient compatibility between these two products/ingredient lists.

Product A:
${productA}

Product B:
${productB}

Identify: conflicts (ingredients that shouldn't be mixed), synergies (ingredients that enhance each other), and redundancies (duplicate actives).

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "overallSafety": "<safe|caution|conflict>",
  "conflicts": [
    {
      "ingredients": ["<ingredient1>", "<ingredient2>"],
      "severity": "<high|medium|low>",
      "reason": "<scientific reason for the conflict>",
      "advice": "<specific advice: separate by AM/PM, wait time, alternative, etc.>"
    }
  ],
  "synergies": [
    {
      "ingredients": ["<ingredient1>", "<ingredient2>"],
      "benefit": "<why they work well together>"
    }
  ],
  "redundancies": ["<ingredient or category that appears in both — e.g. 'Two niacinamide sources'>"],
  "summary": "<2-3 sentence plain-English overview of the compatibility>",
  "recommendation": "<specific recommendation: can use together / separate AM-PM / other advice>"
}

If no conflicts exist, return an empty conflicts array. Same for synergies and redundancies.`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 900,
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

  const loadExample = (index: number) => {
    if (index === 0) setProductA(EXAMPLE_PRODUCTS[index].ingredients);
    else setProductB(EXAMPLE_PRODUCTS[index].ingredients);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Conflict Checker</Text>
            <Text style={styles.headerSub}>Check ingredient compatibility</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Input cards */}
        <View style={styles.inputSection}>
          <View style={styles.inputCard}>
            <View style={styles.inputCardHeader}>
              <View style={[styles.productBadge, { backgroundColor: 'rgba(196,98,45,0.15)' }]}>
                <Text style={[styles.productBadgeText, { color: Colors.primary }]}>PRODUCT A</Text>
              </View>
              <Pressable onPress={() => loadExample(0)}>
                <Text style={styles.exampleBtn}>Use example</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.ingredientInput}
              placeholder="Paste ingredient list or describe product…"
              placeholderTextColor={Colors.textMuted}
              value={productA}
              onChangeText={setProductA}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.vsRow}>
            <View style={styles.vsDivider} />
            <View style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <View style={styles.vsDivider} />
          </View>

          <View style={styles.inputCard}>
            <View style={styles.inputCardHeader}>
              <View style={[styles.productBadge, { backgroundColor: 'rgba(96,165,250,0.15)' }]}>
                <Text style={[styles.productBadgeText, { color: '#60A5FA' }]}>PRODUCT B</Text>
              </View>
              <Pressable onPress={() => loadExample(1)}>
                <Text style={styles.exampleBtn}>Use example</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.ingredientInput}
              placeholder="Paste ingredient list or describe product…"
              placeholderTextColor={Colors.textMuted}
              value={productB}
              onChangeText={setProductB}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Popular pairs for quick test */}
        <View style={styles.quickSection}>
          <Text style={styles.quickTitle}>Quick Examples</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
            {[
              { a: 'Retinol, Glycolic Acid, Salicylic Acid', b: 'Vitamin C (Ascorbic Acid), Niacinamide, Peptides' },
              { a: 'Niacinamide, Hyaluronic Acid, Glycerin', b: 'Ceramides, Cholesterol, Fatty Acids, Squalane' },
              { a: EXAMPLE_PRODUCTS[2].ingredients, b: 'Hyaluronic Acid, Niacinamide, Glycerin, Allantoin' },
            ].map((pair, i) => (
              <Pressable
                key={i}
                style={styles.quickChip}
                onPress={() => { setProductA(pair.a); setProductB(pair.b); }}
              >
                <Text style={styles.quickChipText}>
                  {i === 0 ? 'Retinol vs Vitamin C' : i === 1 ? 'Niacinamide + Ceramides' : 'Tallow vs HA Serum'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Check button */}
        <Pressable
          style={[styles.checkBtn, (!productA.trim() || !productB.trim() || loading) && styles.checkBtnDisabled]}
          onPress={check}
          disabled={!productA.trim() || !productB.trim() || loading}
        >
          <LinearGradient
            colors={productA.trim() && productB.trim() ? [Colors.primaryLight, Colors.primary] : ['#333', '#222']}
            style={styles.checkBtnGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Ionicons name="flask-outline" size={18} color={Colors.white} />
            )}
            <Text style={styles.checkBtnText}>{loading ? 'Analyzing…' : 'Check Compatibility'}</Text>
          </LinearGradient>
        </Pressable>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {result && (
          <>
            {/* Overall safety */}
            {(() => {
              const cfg = SAFETY_CONFIG[result.overallSafety];
              return (
                <View style={[styles.safetyCard, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
                  <Ionicons name={cfg.icon as any} size={24} color={cfg.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.safetyLabel, { color: cfg.color }]}>{cfg.label}</Text>
                    <Text style={styles.summaryText}>{result.summary}</Text>
                  </View>
                </View>
              );
            })()}

            {/* Recommendation */}
            <View style={styles.recCard}>
              <Ionicons name="bulb-outline" size={16} color={Colors.gold} />
              <Text style={styles.recText}>{result.recommendation}</Text>
            </View>

            {/* Conflicts */}
            {result.conflicts.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>⚠ Conflicts Found ({result.conflicts.length})</Text>
                {result.conflicts.map((c, i) => {
                  const cfg = SEVERITY_CONFIG[c.severity];
                  return (
                    <View key={i} style={[styles.conflictCard, { borderColor: cfg.color + '30' }]}>
                      <View style={styles.conflictHeader}>
                        <View style={[styles.severityBadge, { backgroundColor: cfg.bg }]}>
                          <Text style={[styles.severityText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                        <Text style={styles.conflictIngredients}>{c.ingredients.join(' + ')}</Text>
                      </View>
                      <Text style={styles.conflictReason}>{c.reason}</Text>
                      <View style={styles.conflictAdviceRow}>
                        <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
                        <Text style={styles.conflictAdvice}>{c.advice}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Synergies */}
            {result.synergies.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>✨ Synergies ({result.synergies.length})</Text>
                {result.synergies.map((s, i) => (
                  <View key={i} style={styles.synergyCard}>
                    <Ionicons name="link-outline" size={16} color={Colors.scoreExcellent} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.synergyIngredients}>{s.ingredients.join(' + ')}</Text>
                      <Text style={styles.synergyBenefit}>{s.benefit}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Redundancies */}
            {result.redundancies.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Redundancies</Text>
                {result.redundancies.map((r, i) => (
                  <View key={i} style={styles.redundancyRow}>
                    <Ionicons name="copy-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.redundancyText}>{r}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Info footer */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={14} color={Colors.primary} />
          <Text style={styles.infoText}>Analysis is AI-generated. Always consult a dermatologist for medical skin concerns.</Text>
        </View>

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
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  inputSection: { gap: 0, marginBottom: 14 },
  inputCard: {
    backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 14, gap: 10,
  },
  inputCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  productBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  exampleBtn: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  ingredientInput: {
    fontSize: 13, color: Colors.textPrimary, lineHeight: 20,
    minHeight: 80, textAlignVertical: 'top',
  },
  vsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 10 },
  vsDivider: { flex: 1, height: 1, backgroundColor: Colors.border },
  vsCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  vsText: { fontSize: 11, fontWeight: '800', color: Colors.textMuted },

  quickSection: { marginBottom: 16 },
  quickTitle: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 8 },
  quickScroll: { gap: 8, paddingRight: 4 },
  quickChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
  },
  quickChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },

  checkBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  checkBtnDisabled: { opacity: 0.5 },
  checkBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  checkBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },

  errorCard: { backgroundColor: 'rgba(248,113,113,0.10)', borderRadius: 12, padding: 14, marginBottom: 14 },
  errorText: { fontSize: 13, color: Colors.scorePoor },

  safetyCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 10,
  },
  safetyLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
  summaryText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  recCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(212,169,106,0.08)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(212,169,106,0.2)',
    padding: 14, marginBottom: 14,
  },
  recText: { flex: 1, fontSize: 14, color: Colors.textPrimary, lineHeight: 20, fontWeight: '500' },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 10, marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },

  conflictCard: {
    borderRadius: 12, borderWidth: 1, padding: 12, gap: 8,
    backgroundColor: Colors.bgElevated,
  },
  conflictHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  severityBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  severityText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  conflictIngredients: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  conflictReason: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  conflictAdviceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  conflictAdvice: { flex: 1, fontSize: 12, color: Colors.primary, lineHeight: 18 },

  synergyCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.bgElevated, borderRadius: 10, padding: 10 },
  synergyIngredients: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 3 },
  synergyBenefit: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  redundancyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  redundancyText: { fontSize: 13, color: Colors.textSecondary },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(196,98,45,0.05)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(196,98,45,0.1)', padding: 14, marginTop: 8,
  },
  infoText: { flex: 1, fontSize: 11, color: Colors.textMuted, lineHeight: 17 },
});
