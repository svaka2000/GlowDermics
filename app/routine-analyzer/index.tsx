import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
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

type RoutineAnalysis = {
  overallRating: 'excellent' | 'good' | 'fair' | 'poor';
  summary: string;
  conflicts: { products: string[]; issue: string; severity: 'high' | 'medium' | 'low' }[];
  redundancies: { products: string[]; explanation: string }[];
  gaps: { concern: string; suggestion: string }[];
  orderIssues: string[];
  positives: string[];
  optimizedOrder: string[];
};

const EXAMPLE_ROUTINES = [
  'CeraVe Foaming Cleanser, Ordinary Niacinamide, Ordinary Retinol, CeraVe Moisturizer, La Roche Posay SPF 50',
  'Cetaphil Gentle Cleanser, Glycolic Acid Toner, Vitamin C Serum, Hyaluronic Acid, Moisturizer',
  'Oil cleanser, Foam cleanser, AHA exfoliant, BHA exfoliant, Retinol, Eye cream, Moisturizer',
];

function buildSeverityColors(c: Palette) {
  return { high: c.scorePoor, medium: c.scoreFair, low: c.scoreGood };
}
function buildRatingConfig(c: Palette) {
  return {
    excellent: { color: c.scoreExcellent, label: 'Excellent', emoji: '✨' },
    good: { color: c.scoreGood, label: 'Good', emoji: '🌿' },
    fair: { color: c.scoreFair, label: 'Needs Work', emoji: '⚠️' },
    poor: { color: c.scorePoor, label: 'Problematic', emoji: '🚨' },
  };
}

export default function RoutineAnalyzer() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const SEVERITY_COLORS = useMemo(() => buildSeverityColors(colors), [colors]);
  const RATING_CONFIG = useMemo(() => buildRatingConfig(colors), [colors]);
  const [input, setInput] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'evening'>('morning');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RoutineAnalysis | null>(null);
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
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const prompt = `You are Vera, Velumi AI's skincare coach, running a clinical-grade check on this person's ${timeOfDay} routine. Your conflict / redundancy / order / gap detection stays strictly rigorous and precise; the words you write back to them are warm, personal, and second-person ("your routine", "you're layering…"). Analyze this ${timeOfDay} skincare routine for ingredient conflicts, redundancies, application order issues, and gaps.

Routine products (in order used):
${input.trim()}

Analyze carefully for:
- Conflicting ingredients (e.g., retinol + AHAs, vitamin C + niacinamide instability, benzoyl peroxide + retinol)
- Redundant products (similar actives doubling up without benefit)
- Order issues (e.g., pH-dependent actives after neutralizing products)
- Missing protection or key steps for the time of day
- Positive aspects worth keeping

Respond ONLY with a valid JSON object (no markdown, no code fences):
{
  "overallRating": "<excellent|good|fair|poor>",
  "summary": "<2-3 warm sentences spoken directly TO them ('your routine', 'you're') — an honest read of what's working and the single thing to fix first>",
  "conflicts": [
    {"products": ["<product1>", "<product2>"], "issue": "<specific conflict explanation>", "severity": "<high|medium|low>"}
  ],
  "redundancies": [
    {"products": ["<product1>", "<product2>"], "explanation": "<why they overlap and which to keep>"}
  ],
  "gaps": [
    {"concern": "<what is missing>", "suggestion": "<specific product type or ingredient to add>"}
  ],
  "orderIssues": ["<specific order problem>"],
  "positives": ["<2-3 things being done well>"],
  "optimizedOrder": ["<product names in optimal order>"]
}

If there are no conflicts/redundancies/gaps/orderIssues, return empty arrays for those fields. Be specific about product names from the input.

VOICE — applies ONLY to the prose strings (summary, conflicts[].issue, redundancies[].explanation, gaps[].suggestion, orderIssues[], positives[]); NOT to overallRating, severity, or optimizedOrder which stay strictly clinical: speak TO them in warm second person ("your routine", "you'll want to…"), specific to their actual products, no generic filler. BUT never soften a real problem — for high/medium-severity conflicts be blunt and urgent about the risk; warmth must not downplay safety. Keep every JSON field name, the shape, the rating/severity enums, and the empty-array rule above EXACTLY.`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 900,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.choices[0]?.message?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response');
      setResult(JSON.parse(jsonMatch[0]));
    } catch (e) {
      setError('Analysis failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const ratingConfig = result ? RATING_CONFIG[result.overallRating] : null;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>Routine Analyzer</Text>
            <Text style={styles.headerSub}>Detect conflicts & optimize order</Text>
          </View>
          <View style={{ width: 36 }} />
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" style={{ opacity: contentAnim }}>

        {/* Time of day toggle */}
        <View style={styles.toggleWrap}>
          {(['morning', 'evening'] as const).map(t => (
            <Pressable
              key={t}
              style={[styles.toggleBtn, timeOfDay === t && styles.toggleBtnActive]}
              onPress={() => setTimeOfDay(t)}
            >
              <Ionicons name={t === 'morning' ? 'sunny-outline' : 'moon-outline'} size={14} color={timeOfDay === t ? colors.primary : colors.textMuted} />
              <Text style={[styles.toggleLabel, timeOfDay === t && styles.toggleLabelActive]}>{t.charAt(0).toUpperCase() + t.slice(1)} Routine</Text>
            </Pressable>
          ))}
        </View>

        {/* Input */}
        <Text style={styles.inputLabel}>List your products in the order you use them</Text>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="e.g. CeraVe Cleanser, Niacinamide serum, Retinol, Moisturizer, SPF..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        {/* Example routines */}
        {!input && (
          <View style={styles.examples}>
            <Text style={styles.examplesLabel}>Try an example:</Text>
            {EXAMPLE_ROUTINES.map((ex, i) => (
              <Pressable key={i} style={styles.exampleChip} onPress={() => setInput(ex)}>
                <Text style={styles.exampleText} numberOfLines={1}>{ex}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[styles.analyzeBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
          onPress={analyze}
          disabled={!input.trim() || loading}
        >
          <LinearGradient colors={[colors.primaryLight, colors.primary]} style={styles.analyzeBtnGrad}>
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Ionicons name="flask-outline" size={18} color={colors.white} />
                <Text style={styles.analyzeBtnText}>Analyze Routine</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        {/* Results */}
        {result && ratingConfig && (
          <>
            {/* Rating header */}
            <View style={styles.ratingCard}>
              <LinearGradient colors={[ratingConfig.color + '18', ratingConfig.color + '06']} style={StyleSheet.absoluteFill} />
              <Text style={styles.ratingEmoji}>{ratingConfig.emoji}</Text>
              <View>
                <Text style={[styles.ratingLabel, { color: ratingConfig.color }]}>{ratingConfig.label} Routine</Text>
                <Text style={styles.ratingTime}>{timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Analysis</Text>
              </View>
            </View>
            <Text style={styles.summaryText}>{result.summary}</Text>

            {/* Conflicts */}
            {result.conflicts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="warning-outline" size={16} color={colors.scorePoor} />
                  <Text style={[styles.sectionTitle, { color: colors.scorePoor }]}>Ingredient Conflicts</Text>
                </View>
                {result.conflicts.map((c, i) => (
                  <View key={i} style={[styles.conflictCard, { borderColor: SEVERITY_COLORS[c.severity] + '40' }]}>
                    <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[c.severity] + '20' }]}>
                      <Text style={[styles.severityText, { color: SEVERITY_COLORS[c.severity] }]}>{c.severity.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.conflictProducts}>{c.products.join(' + ')}</Text>
                    <Text style={styles.conflictIssue}>{c.issue}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Redundancies */}
            {result.redundancies.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="copy-outline" size={16} color={colors.gold} />
                  <Text style={[styles.sectionTitle, { color: colors.gold }]}>Redundant Steps</Text>
                </View>
                {result.redundancies.map((r, i) => (
                  <View key={i} style={styles.itemCard}>
                    <Text style={styles.itemProducts}>{r.products.join(' + ')}</Text>
                    <Text style={styles.itemExplanation}>{r.explanation}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Order issues */}
            {result.orderIssues.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="reorder-four-outline" size={16} color={colors.primaryLight} />
                  <Text style={[styles.sectionTitle, { color: colors.primaryLight }]}>Application Order</Text>
                </View>
                {result.orderIssues.map((issue, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: colors.primaryLight }]} />
                    <Text style={styles.bulletText}>{issue}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Gaps */}
            {result.gaps.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="add-circle-outline" size={16} color={colors.scoreGood} />
                  <Text style={[styles.sectionTitle, { color: colors.scoreGood }]}>Missing Steps</Text>
                </View>
                {result.gaps.map((g, i) => (
                  <View key={i} style={styles.itemCard}>
                    <Text style={styles.itemProducts}>{g.concern}</Text>
                    <Text style={styles.itemExplanation}>{g.suggestion}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Positives */}
            {result.positives.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.scoreExcellent} />
                  <Text style={[styles.sectionTitle, { color: colors.scoreExcellent }]}>What You're Doing Right</Text>
                </View>
                {result.positives.map((p, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: colors.scoreExcellent }]} />
                    <Text style={styles.bulletText}>{p}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Optimized order */}
            {result.optimizedOrder.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="list-outline" size={16} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Optimized Order</Text>
                </View>
                <View style={styles.orderCard}>
                  {result.optimizedOrder.map((product, i) => (
                    <View key={i} style={[styles.orderRow, i < result.optimizedOrder.length - 1 && styles.orderBorder]}>
                      <View style={styles.orderNum}>
                        <Text style={styles.orderNumText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.orderProduct}>{product}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Coach CTA */}
            <Pressable style={styles.coachCta} onPress={() => router.push('/(tabs)/coach')}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
              <Text style={styles.coachCtaText}>Ask coach for more personalized advice</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </Pressable>
          </>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  toggleWrap: { flexDirection: 'row', backgroundColor: c.bgCard, borderRadius: 14, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: c.border },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10 },
  toggleBtnActive: { backgroundColor: c.bgElevated },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: c.textMuted },
  toggleLabelActive: { color: c.primary },

  inputLabel: { fontSize: 12, fontWeight: '600', color: c.textMuted, letterSpacing: 0.5, marginBottom: 8 },
  input: {
    backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
    borderRadius: 14, padding: 14, fontSize: 14, color: c.textPrimary,
    minHeight: 110, lineHeight: 22, marginBottom: 14,
  },

  examples: { gap: 8, marginBottom: 14 },
  examplesLabel: { fontSize: 11, color: c.textMuted, fontWeight: '600', marginBottom: 4 },
  exampleChip: { backgroundColor: c.bgCard, borderRadius: 10, borderWidth: 1, borderColor: c.border, padding: 10 },
  exampleText: { fontSize: 12, color: c.textSecondary },

  errorText: { color: c.scorePoor, fontSize: 13, textAlign: 'center', marginBottom: 10 },

  analyzeBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  analyzeBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 17 },
  analyzeBtnText: { fontSize: 16, fontWeight: '700', color: c.white },

  ratingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: c.border,
    padding: 16, marginBottom: 12,
  },
  ratingEmoji: { fontSize: 28 },
  ratingLabel: { fontSize: 18, fontWeight: '800' },
  ratingTime: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  summaryText: { fontSize: 14, color: c.textSecondary, lineHeight: 22, marginBottom: 20 },

  section: { marginBottom: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: c.textPrimary },

  conflictCard: { backgroundColor: c.bgCard, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8, gap: 6 },
  severityBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  severityText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  conflictProducts: { fontSize: 13, fontWeight: '700', color: c.textPrimary },
  conflictIssue: { fontSize: 13, color: c.textSecondary, lineHeight: 19 },

  itemCard: { backgroundColor: c.bgCard, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 8, gap: 4 },
  itemProducts: { fontSize: 13, fontWeight: '700', color: c.textPrimary },
  itemExplanation: { fontSize: 13, color: c.textSecondary, lineHeight: 19 },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  bulletText: { fontSize: 13, color: c.textSecondary, lineHeight: 20, flex: 1 },

  orderCard: { backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.border },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  orderBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  orderNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  orderNumText: { fontSize: 12, fontWeight: '800', color: c.white },
  orderProduct: { fontSize: 14, color: c.textPrimary, fontWeight: '500', flex: 1 },

  coachCta: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: c.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: c.border, padding: 16, marginTop: 4,
  },
  coachCtaText: { flex: 1, fontSize: 13, color: c.textSecondary },
  });
}
