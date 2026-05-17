import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

const RESULT_KEY = 'gd_baumann_result';

type Question = {
  id: string;
  text: string;
  dimension: 'O/D' | 'S/R' | 'P/N' | 'W/T';
  options: { text: string; score: number }[];
};

const QUESTIONS: Question[] = [
  {
    id: 'q1', dimension: 'O/D',
    text: 'After washing your face with a gentle cleanser, how does your skin feel after 30 minutes?',
    options: [
      { text: 'Very tight, uncomfortable', score: 0 },
      { text: 'Slightly tight', score: 1 },
      { text: 'Comfortable, normal', score: 2 },
      { text: 'Slightly shiny', score: 3 },
      { text: 'Noticeably oily/shiny', score: 4 },
    ],
  },
  {
    id: 'q2', dimension: 'O/D',
    text: 'By midday, how does your face look?',
    options: [
      { text: 'Dry and flaky', score: 0 },
      { text: 'Normal, no noticeable oil', score: 1 },
      { text: 'Slightly shiny in T-zone only', score: 2 },
      { text: 'Shiny all over', score: 3 },
      { text: 'Very oily — needs blotting', score: 4 },
    ],
  },
  {
    id: 'q3', dimension: 'S/R',
    text: 'How does your skin typically react to new skincare products?',
    options: [
      { text: 'Never react — skin tolerates everything', score: 0 },
      { text: 'Occasionally react to harsh products', score: 1 },
      { text: 'Sometimes get redness or stinging', score: 2 },
      { text: 'Often react with redness, burning, or breakouts', score: 3 },
      { text: 'Almost always react — very sensitive', score: 4 },
    ],
  },
  {
    id: 'q4', dimension: 'S/R',
    text: 'Does your skin flush or redden easily from heat, exercise, spicy food, or alcohol?',
    options: [
      { text: 'Never', score: 0 },
      { text: 'Rarely', score: 1 },
      { text: 'Sometimes', score: 2 },
      { text: 'Often', score: 3 },
      { text: 'Almost always', score: 4 },
    ],
  },
  {
    id: 'q5', dimension: 'P/N',
    text: 'How prominent are dark spots, uneven skin tone, or post-acne marks on your skin?',
    options: [
      { text: 'None — very even skin tone', score: 0 },
      { text: 'Minimal, barely noticeable', score: 1 },
      { text: 'Moderate, some areas', score: 2 },
      { text: 'Significant', score: 3 },
      { text: 'Extensive hyperpigmentation', score: 4 },
    ],
  },
  {
    id: 'q6', dimension: 'P/N',
    text: 'When you spend time in the sun without protection, what typically happens?',
    options: [
      { text: 'I just tan evenly, no burning', score: 0 },
      { text: 'Slight tan, minimal burning', score: 1 },
      { text: 'Sometimes burn, sometimes tan', score: 2 },
      { text: 'Often burn, may tan after', score: 3 },
      { text: 'Always burn, freckle, get spots', score: 4 },
    ],
  },
  {
    id: 'q7', dimension: 'W/T',
    text: 'How would you rate the firmness and elasticity of your skin?',
    options: [
      { text: 'Very firm — no sagging', score: 0 },
      { text: 'Mostly firm', score: 1 },
      { text: 'Some loss of firmness', score: 2 },
      { text: 'Noticeable sagging or fine lines', score: 3 },
      { text: 'Significant wrinkles and loss of firmness', score: 4 },
    ],
  },
  {
    id: 'q8', dimension: 'W/T',
    text: 'How visible are your pores?',
    options: [
      { text: 'Invisible — very refined texture', score: 0 },
      { text: 'Barely visible', score: 1 },
      { text: 'Visible in some areas', score: 2 },
      { text: 'Clearly visible', score: 3 },
      { text: 'Very large and visible pores', score: 4 },
    ],
  },
];

type Scores = { 'O/D': number; 'S/R': number; 'P/N': number; 'W/T': number };

function buildBaumannTypes(c: Palette): Record<string, { name: string; emoji: string; color: string; desc: string; focus: string[]; tallow: string }> {
  return {
  DSNW: { name: 'Dry, Sensitive, Non-Pigmented, Wrinkled', emoji: '🌵', color: '#60A5FA', desc: 'Your skin loses water easily, reacts to ingredients, and shows aging. Focus is on barrier repair and gentle actives.', focus: ['Barrier repair', 'Ceramides', 'Gentle peptides', 'Fragrance-free everything'], tallow: 'Tallow is ideal — it repairs barrier, reduces inflammation, and provides dense lipids without irritating ingredients.' },
  DSPT: { name: 'Dry, Sensitive, Pigmented, Tight', emoji: '🌺', color: '#F97316', desc: 'Sensitive with pigmentation concerns. Need ingredients that brighten without irritating dry, reactive skin.', focus: ['Niacinamide (3-5%)', 'Azelaic acid', 'Avoid AHA until stable', 'Sun protection daily'], tallow: 'Use tallow as your base moisturizer — it calms sensitivity while preparing skin to tolerate brightening actives.' },
  DRNW: { name: 'Dry, Resistant, Non-Pigmented, Wrinkled', emoji: '⛰️', color: '#6B85A8', desc: 'Skin tolerates most actives well, but needs deep moisture and anti-aging support.', focus: ['Retinol', 'Peptides', 'Rich moisturizers', 'Hyaluronic acid'], tallow: 'Perfect match — tallow provides the rich lipids your dry, aging skin needs without the harsh additives of commercial creams.' },
  DRPT: { name: 'Dry, Resistant, Pigmented, Tight', emoji: '🌟', color: c.gold, desc: 'Tolerates actives well. Main goals: moisture, brightening, and anti-aging.', focus: ['Vitamin C', 'Retinol', 'AHA exfoliation', 'SPF daily'], tallow: 'Use tallow as your nighttime moisturizer to support recovery from active ingredients like retinol and vitamin C.' },
  OSNW: { name: 'Oily, Sensitive, Non-Pigmented, Wrinkled', emoji: '🌊', color: '#22C55E', desc: 'Prone to redness and acne despite oily skin. Need anti-inflammatory, non-clogging actives.', focus: ['Niacinamide', 'Zinc', 'Avoid comedogenic ingredients', 'Lightweight antioxidants'], tallow: 'A thin layer of tallow at night can reduce the inflammation driving sensitivity — its CLA is potently anti-inflammatory.' },
  OSPT: { name: 'Oily, Sensitive, Pigmented, Tight', emoji: '🔥', color: c.scorePoor, desc: 'The most complex type — oily, acne-prone, reactive, with hyperpigmentation.', focus: ['Gentle BHA', 'Niacinamide', 'Anti-inflammatory diet', 'Targeted azelaic acid'], tallow: 'Spot-apply tallow on healing breakouts to reduce inflammation and prevent post-inflammatory hyperpigmentation.' },
  ORNW: { name: 'Oily, Resistant, Non-Pigmented, Wrinkled', emoji: '🍃', color: '#4ADE80', desc: 'Lucky — tolerates most things and doesn\'t hyperpigment. Focus on anti-aging prevention.', focus: ['Retinol', 'Vitamin C', 'BHA for pores', 'Broad-spectrum SPF'], tallow: 'Use tallow sparingly — your skin produces its own oil. Focus on tallow\'s vitamin content for anti-aging.' },
  ORPT: { name: 'Oily, Resistant, Pigmented, Tight', emoji: '🌿', color: c.primary, desc: 'Oily and tolerant — can use strong actives for pigmentation and anti-aging.', focus: ['Retinol', 'Strong AHA', 'Vitamin C 15-20%', 'SPF is non-negotiable'], tallow: 'Use as your anti-aging nighttime treatment — tallow\'s fat-soluble vitamins work synergistically with retinol.' },
  };
}

export default function BaumannTest() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const BAUMANN_TYPES = useMemo(() => buildBaumannTypes(colors), [colors]);
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<string | null>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleAnswer = (score: number) => {
    const q = QUESTIONS[currentQ];
    const newAnswers = { ...answers, [q.id]: score };
    setAnswers(newAnswers);

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      calculateResult(newAnswers);
    }
  };

  const calculateResult = async (ans: Record<string, number>) => {
    const dims: Scores = { 'O/D': 0, 'S/R': 0, 'P/N': 0, 'W/T': 0 };
    for (const q of QUESTIONS) {
      dims[q.dimension] += ans[q.id] ?? 0;
    }
    const maxPerDim = 8; // 2 questions × max score 4

    const type = [
      dims['O/D'] / maxPerDim >= 0.5 ? 'O' : 'D',
      dims['S/R'] / maxPerDim >= 0.5 ? 'S' : 'R',
      dims['P/N'] / maxPerDim >= 0.5 ? 'P' : 'N',
      dims['W/T'] / maxPerDim >= 0.5 ? 'W' : 'T',
    ].join('');

    setResult(type);
    await AsyncStorage.setItem(RESULT_KEY, JSON.stringify({ type, date: new Date().toISOString() }));
    setPhase('result');
  };

  const restart = () => {
    setPhase('intro');
    setCurrentQ(0);
    setAnswers({});
    setResult(null);
  };

  if (phase === 'intro') {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>Baumann Skin Type</Text>
            <View style={{ width: 36 }} />
          </Animated.View>
        </SafeAreaView>

        <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ opacity: contentAnim }}>
          <View style={styles.introHero}>
            <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Text style={styles.introEmoji}>🧬</Text>
            <Text style={styles.introTitle}>Baumann Skin Typing</Text>
            <Text style={styles.introDesc}>
              The Baumann Skin Type System goes beyond the basic 4-type model. It classifies skin across 4 dimensions — 16 possible combinations — for the most precise skin profile available.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>The 4 Dimensions</Text>
            {[
              { dim: 'Oily (O) vs Dry (D)', desc: 'How much sebum your skin produces' },
              { dim: 'Sensitive (S) vs Resistant (R)', desc: 'How reactive your skin is to products and environment' },
              { dim: 'Pigmented (P) vs Non-Pigmented (N)', desc: 'Your tendency to develop dark spots or uneven tone' },
              { dim: 'Wrinkled (W) vs Tight (T)', desc: 'Current signs of aging and skin laxity' },
            ].map((item, i) => (
              <View key={i} style={styles.dimRow}>
                <View style={[styles.dimBadge, { backgroundColor: `${colors.primary}20` }]}>
                  <Text style={[styles.dimText, { color: colors.primary }]}>{item.dim}</Text>
                </View>
                <Text style={styles.dimDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.startBtn} onPress={() => setPhase('quiz')}>
            <LinearGradient colors={[colors.primaryDark, colors.primary, colors.gold]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Text style={styles.startBtnText}>Take the Test ({QUESTIONS.length} Questions)</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </Pressable>

          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      </View>
    );
  }

  if (phase === 'quiz') {
    const q = QUESTIONS[currentQ];
    const progress = (currentQ / QUESTIONS.length) * 100;
    const dimColors: Record<string, string> = { 'O/D': colors.gold, 'S/R': '#EF4444', 'P/N': colors.primary, 'W/T': '#6B85A8' };
    const dimLabels: Record<string, string> = { 'O/D': 'Oil/Dry', 'S/R': 'Sensitivity', 'P/N': 'Pigmentation', 'W/T': 'Aging' };

    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Restart test" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={restart}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>Question {currentQ + 1} of {QUESTIONS.length}</Text>
            <View style={{ width: 36 }} />
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </SafeAreaView>

        <ScrollView contentContainerStyle={styles.quizScroll}>
          <View style={[styles.dimTag, { backgroundColor: `${dimColors[q.dimension]}20`, borderColor: `${dimColors[q.dimension]}50` }]}>
            <Text style={[styles.dimTagText, { color: dimColors[q.dimension] }]}>
              {dimLabels[q.dimension]}
            </Text>
          </View>

          <Text style={styles.questionText}>{q.text}</Text>

          <View style={styles.optionsWrap}>
            {q.options.map((opt, i) => (
              <Pressable key={i} style={styles.optionBtn} onPress={() => handleAnswer(opt.score)}>
                <View style={[styles.optionLetter, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={[styles.optionLetterText, { color: colors.primary }]}>{String.fromCharCode(65 + i)}</Text>
                </View>
                <Text style={styles.optionText}>{opt.text}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Result
  const typeInfo = result ? BAUMANN_TYPES[result] || BAUMANN_TYPES.ORNW : null;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Your Result</Text>
          <Pressable onPress={restart}>
            <Text style={styles.retakeText}>Retake</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {typeInfo && (
          <>
            <View style={[styles.resultHero, { borderColor: `${typeInfo.color}50` }]}>
              <LinearGradient colors={[`${typeInfo.color}20`, `${typeInfo.color}05`]} style={StyleSheet.absoluteFill} />
              <Text style={styles.resultEmoji}>{typeInfo.emoji}</Text>
              <Text style={[styles.resultType, { color: typeInfo.color }]}>{result}</Text>
              <Text style={styles.resultName}>{typeInfo.name}</Text>
              <Text style={styles.resultDesc}>{typeInfo.desc}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your Skin Priorities</Text>
              {typeInfo.focus.map((f, i) => (
                <View key={i} style={styles.focusRow}>
                  <View style={[styles.focusDot, { backgroundColor: typeInfo.color }]} />
                  <Text style={styles.focusText}>{f}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.tallowCard, { borderColor: `${colors.primary}40` }]}>
              <LinearGradient colors={[`${colors.primary}12`, `${colors.primary}04`]} style={StyleSheet.absoluteFill} />
              <Text style={styles.tallowTitle}>🌿 Tallow for Your Type</Text>
              <Text style={styles.tallowText}>{typeInfo.tallow}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>All 16 Baumann Types</Text>
              <View style={styles.typesGrid}>
                {Object.entries(BAUMANN_TYPES).map(([type, info]) => (
                  <View
                    key={type}
                    style={[styles.typeChip, { backgroundColor: `${info.color}15`, borderColor: type === result ? info.color : 'transparent' }]}
                  >
                    <Text style={styles.typeChipEmoji}>{info.emoji}</Text>
                    <Text style={[styles.typeChipType, { color: info.color }]}>{type}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Pressable style={styles.saveBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
              <Text style={styles.saveBtnText}>Save & Continue →</Text>
            </Pressable>

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: c.textPrimary },
  retakeText: { fontSize: 13, color: c.textMuted, textDecorationLine: 'underline' },
  progressBg: { height: 3, backgroundColor: c.border, marginHorizontal: 0 },
  progressFill: { height: '100%', backgroundColor: c.primary, borderRadius: 2 },
  scroll: { paddingHorizontal: 16 },
  quizScroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60 },

  introHero: {
    borderRadius: 20, overflow: 'hidden', padding: 24, gap: 10,
    marginBottom: 16, alignItems: 'center',
  },
  introEmoji: { fontSize: 48 },
  introTitle: { fontSize: 26, fontWeight: '900', color: c.white },
  introDesc: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 22 },

  card: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border,
    padding: 16, gap: 10, marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },

  dimRow: { gap: 4 },
  dimBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  dimText: { fontSize: 12, fontWeight: '800' },
  dimDesc: { fontSize: 12, color: c.textMuted },

  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 56, borderRadius: 16, overflow: 'hidden', marginBottom: 14,
  },
  startBtnText: { fontSize: 16, fontWeight: '800', color: c.white },

  dimTag: {
    alignSelf: 'flex-start', borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 5, marginBottom: 16,
  },
  dimTagText: { fontSize: 12, fontWeight: '800' },
  questionText: { fontSize: 20, fontWeight: '800', color: c.textPrimary, lineHeight: 28, marginBottom: 24 },
  optionsWrap: { gap: 10 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.border,
    padding: 14,
  },
  optionLetter: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 12, fontWeight: '900' },
  optionText: { flex: 1, fontSize: 14, color: c.textSecondary, lineHeight: 20 },

  resultHero: {
    borderRadius: 20, overflow: 'hidden', borderWidth: 2,
    padding: 24, gap: 8, marginBottom: 14, alignItems: 'center',
  },
  resultEmoji: { fontSize: 48 },
  resultType: { fontSize: 36, fontWeight: '900', letterSpacing: 4 },
  resultName: { fontSize: 14, fontWeight: '700', color: c.textSecondary, textAlign: 'center' },
  resultDesc: { fontSize: 13, color: c.textMuted, textAlign: 'center', lineHeight: 20 },

  focusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  focusDot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 6, flexShrink: 0 },
  focusText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  tallowCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1,
    padding: 16, gap: 8, marginBottom: 14,
  },
  tallowTitle: { fontSize: 15, fontWeight: '700', color: c.primary },
  tallowText: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeChip: {
    width: 60, alignItems: 'center', gap: 2,
    paddingVertical: 8, borderRadius: 10, borderWidth: 2,
  },
  typeChipEmoji: { fontSize: 14 },
  typeChipType: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  saveBtn: {
    height: 52, borderRadius: 14, backgroundColor: c.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: c.white },
  });
}
