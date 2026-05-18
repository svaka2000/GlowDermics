import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Animated, Easing,
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

type QuizQuestion = {
  id: string;
  question: string;
  options: { label: string; value: string; emoji: string }[];
  multi?: boolean;
};

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'feel',
    question: 'How does your skin feel by midday?',
    options: [
      { label: 'Shiny & oily all over', value: 'very oily', emoji: '✨' },
      { label: 'Oily T-zone, dry cheeks', value: 'combination', emoji: '🌗' },
      { label: 'Tight & dry', value: 'dry', emoji: '🏜' },
      { label: 'Normal — comfortable', value: 'normal', emoji: '🌿' },
      { label: 'Reactive & easily irritated', value: 'sensitive', emoji: '🌡' },
    ],
  },
  {
    id: 'pores',
    question: 'What do you notice about your pores?',
    options: [
      { label: 'Very visible, especially on nose', value: 'enlarged pores', emoji: '🔬' },
      { label: 'Mostly invisible', value: 'small pores', emoji: '✦' },
      { label: 'Clogged / blackheads', value: 'clogged pores', emoji: '🔴' },
      { label: "Don't really notice them", value: 'normal pores', emoji: '😌' },
    ],
  },
  {
    id: 'concerns',
    question: 'Top skin concerns? (pick up to 3)',
    multi: true,
    options: [
      { label: 'Acne & breakouts', value: 'acne', emoji: '😤' },
      { label: 'Dryness & flaking', value: 'dryness', emoji: '🌵' },
      { label: 'Dark spots & hyperpigmentation', value: 'dark spots', emoji: '🌑' },
      { label: 'Fine lines & wrinkles', value: 'fine lines', emoji: '🕰' },
      { label: 'Redness & flushing', value: 'redness', emoji: '🌹' },
      { label: 'Dullness & uneven tone', value: 'dullness', emoji: '🌫' },
      { label: 'Sensitivity & reactions', value: 'sensitivity', emoji: '⚡️' },
      { label: 'Loss of firmness', value: 'firmness loss', emoji: '🎈' },
    ],
  },
  {
    id: 'routine',
    question: 'Describe your current skincare routine',
    options: [
      { label: 'Minimal — 1 or 2 steps', value: 'minimal routine', emoji: '✦' },
      { label: 'Basic — cleanser + moisturizer', value: 'basic routine', emoji: '🌿' },
      { label: 'Full routine with actives', value: 'full routine with actives', emoji: '🧪' },
      { label: "I don't really have one", value: 'no routine', emoji: '🤷' },
    ],
  },
  {
    id: 'lifestyle',
    question: 'How would you describe your lifestyle?',
    options: [
      { label: 'Healthy — good sleep, diet, hydration', value: 'healthy lifestyle', emoji: '🥗' },
      { label: 'Stressful — not enough sleep', value: 'high stress low sleep', emoji: '😰' },
      { label: 'Active — gym, outdoors often', value: 'active lifestyle', emoji: '🏃' },
      { label: 'Screen-heavy, indoor mostly', value: 'sedentary indoor', emoji: '💻' },
    ],
  },
  {
    id: 'goal',
    question: "What's your primary skin goal right now?",
    options: [
      { label: 'Clear up breakouts', value: 'clear acne', emoji: '🎯' },
      { label: 'Deep hydration', value: 'deep hydration', emoji: '💧' },
      { label: 'Slow aging & firm skin', value: 'anti-aging', emoji: '⏰' },
      { label: 'Even, glowing skin tone', value: 'even glow', emoji: '✨' },
      { label: 'Simplify & heal barrier', value: 'barrier healing', emoji: '🛡' },
    ],
  },
];

type Result = {
  skinType: string;
  analysis: string;
  topRecommendations: string[];
  routineSuggestion: string;
  approachFit: string;
};

export default function SkinQuiz() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');

  const screenAnim = useRef(new Animated.Value(0)).current;
  const questionAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(screenAnim, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const q = QUESTIONS[step];
  const isMulti = !!q?.multi;
  const current = answers[q?.id] ?? (isMulti ? [] : '');
  const progress = (step / QUESTIONS.length) * 100;

  const animateQuestionTransition = (callback: () => void) => {
    Animated.timing(questionAnim, { toValue: 0, duration: 120, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      callback();
      Animated.timing(progressAnim, {
        toValue: ((step + 1) / QUESTIONS.length),
        duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: false,
      }).start();
      Animated.timing(questionAnim, { toValue: 1, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
  };

  const select = (value: string) => {
    if (isMulti) {
      const prev = (current as string[]);
      if (prev.includes(value)) {
        setAnswers(a => ({ ...a, [q.id]: prev.filter(v => v !== value) }));
      } else if (prev.length < 3) {
        setAnswers(a => ({ ...a, [q.id]: [...prev, value] }));
      }
    } else {
      setAnswers(a => ({ ...a, [q.id]: value }));
    }
  };

  const canNext = isMulti
    ? (current as string[]).length > 0
    : !!current;

  const next = () => {
    if (step < QUESTIONS.length - 1) {
      animateQuestionTransition(() => setStep(s => s + 1));
    } else {
      submit();
    }
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const summary = QUESTIONS.map(q => {
        const ans = answers[q.id];
        const val = Array.isArray(ans) ? ans.join(', ') : ans;
        return `${q.question}: ${val || 'skipped'}`;
      }).join('\n');

      const prompt = `You are Vera, Velumi AI's personal skin coach — warm, direct, and genuinely invested in this person. They just finished a skin quiz; read THEIR answers and write a personal analysis that speaks to them, not a clinical report.

Their quiz answers:
${summary}

Reference the specific things they told you ("the midday shine you mentioned", "since you're doubling on actives"). Be honest and specific — no generic "drink water / wear SPF" filler. Respond ONLY with a valid JSON object (no markdown, no code fences):
{
  "skinType": "<one of: oily, dry, combination, normal, sensitive>",
  "analysis": "<3-4 warm sentences spoken directly TO them ('your skin', 'you're showing') that read their actual answers back, name what it means, and end on the one thing to focus on first>",
  "topRecommendations": ["<3 specific, actionable recommendations tied to their answers, second-person — no generic advice>"],
  "routineSuggestion": "<2-3 warm, second-person sentences describing the simple routine that fits them>",
  "approachFit": "<1-2 honest sentences spoken to them: a brand-agnostic takeaway on what skincare approach best suits their specific profile — never overclaim, no products, no brand>"
}`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 700,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.choices[0]?.message?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response');
      setResult(JSON.parse(jsonMatch[0]));
    } catch (e) {
      setError('Could not generate your analysis. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.loadingTitle}>Analyzing your skin profile...</Text>
          <Text style={styles.loadingSub}>AI is personalizing your results</Text>
        </View>
      </View>
    );
  }

  if (result) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.resultHeader}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.resultHeaderTitle}>Your Skin Profile</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Hero card */}
          <View style={styles.skinTypeCard}>
            <LinearGradient colors={['rgba(138,120,96,0.18)', 'rgba(138,120,96,0.06)']} style={StyleSheet.absoluteFill} />
            <Text style={styles.skinTypeEyebrow}>YOUR SKIN TYPE</Text>
            <Text style={styles.skinTypeLabel}>{result.skinType.charAt(0).toUpperCase() + result.skinType.slice(1)} Skin</Text>
            <Text style={styles.analysisText}>{result.analysis}</Text>
          </View>

          {/* Top recommendations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personalized Recommendations</Text>
            <View style={styles.recsCard}>
              {result.topRecommendations.map((rec, i) => (
                <View key={i} style={[styles.recRow, i < result.topRecommendations.length - 1 && styles.recBorder]}>
                  <View style={styles.recNum}>
                    <Text style={styles.recNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.recText}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Routine suggestion */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ideal Routine for You</Text>
            <View style={styles.routineCard}>
              <LinearGradient colors={['rgba(183,155,110,0.1)', 'rgba(183,155,110,0.03)']} style={StyleSheet.absoluteFill} />
              <Ionicons name="list-outline" size={18} color={colors.gold} style={{ marginBottom: 8 }} />
              <Text style={styles.routineText}>{result.routineSuggestion}</Text>
            </View>
          </View>

          {/* Skin takeaway */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Skin Takeaway</Text>
            <View style={styles.tdCard}>
              <LinearGradient colors={['rgba(138,120,96,0.12)', 'rgba(138,120,96,0.04)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.tdEyebrow}>INGREDIENT FIT</Text>
              <Text style={styles.tdText}>{result.approachFit}</Text>
            </View>
          </View>

          {/* Scan CTA */}
          <Pressable style={styles.scanCta} onPress={() => router.push('/scan')}>
            <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} />
            <View style={styles.scanCtaContent}>
              <View>
                <Text style={styles.scanCtaTitle}>Get a full photo analysis</Text>
                <Text style={styles.scanCtaSub}>30-second AI skin scan for 7 scored metrics</Text>
              </View>
              <Ionicons name="scan" size={26} color={colors.white} />
            </View>
          </Pressable>

          {/* Ask coach */}
          <Pressable style={styles.coachCta} onPress={() => router.push('/(tabs)/coach')}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
            <Text style={styles.coachCtaText}>Ask the AI coach about your results</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </Pressable>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  // back button handler for quiz steps with animation
  const handleBack = () => {
    if (step > 0) {
      animateQuestionTransition(() => setStep(s => s - 1));
    } else {
      router.canGoBack() ? router.back() : router.replace('/(tabs)' as any);
    }
  };

  return (
    <Animated.View style={[styles.root, {
      opacity: screenAnim,
      transform: [{ translateY: screenAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) as any }]} />
            </View>
            <Text style={styles.stepCounter}>{step + 1} of {QUESTIONS.length}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.quizScroll}
        style={{ opacity: questionAnim, transform: [{ translateX: questionAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}
      >
        <Text style={styles.question}>{q?.question}</Text>
        {isMulti && <Text style={styles.multiHint}>Select up to 3</Text>}

        <View style={styles.options}>
          {q?.options.map(opt => {
            const selected = isMulti
              ? (current as string[]).includes(opt.value)
              : current === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => select(opt.value)}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{opt.label}</Text>
                {selected && (
                  <View style={styles.optionCheck}>
                    <Ionicons name="checkmark" size={12} color={colors.white} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[styles.nextBtn, !canNext && { opacity: 0.3 }]}
          onPress={next}
          disabled={!canNext}
        >
          <LinearGradient colors={[colors.primaryLight, colors.primary]} style={styles.nextBtnGrad}>
            <Text style={styles.nextBtnText}>{step === QUESTIONS.length - 1 ? 'See My Results' : 'Continue'}</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </LinearGradient>
        </Pressable>
      </Animated.ScrollView>
    </Animated.View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  progressTrack: { height: 4, backgroundColor: c.bgElevated, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: c.primary, borderRadius: 2 },
  stepCounter: { fontSize: 11, color: c.textMuted, marginTop: 6, textAlign: 'center' },

  quizScroll: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 60 },
  question: { fontSize: 24, fontWeight: '800', color: c.textPrimary, lineHeight: 32, marginBottom: 10 },
  multiHint: { fontSize: 12, color: c.textMuted, marginBottom: 20, fontStyle: 'italic' },
  options: { gap: 10, marginBottom: 32 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: c.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: c.border, padding: 16,
  },
  optionSelected: { borderColor: c.primary, backgroundColor: 'rgba(138,120,96,0.12)' },
  optionEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  optionLabel: { fontSize: 15, color: c.textSecondary, flex: 1 },
  optionLabelSelected: { color: c.textPrimary, fontWeight: '600' },
  optionCheck: { width: 20, height: 20, borderRadius: 10, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },

  nextBtn: { borderRadius: 16, overflow: 'hidden' },
  nextBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: c.white },
  errorText: { fontSize: 13, color: c.scorePoor, textAlign: 'center', marginBottom: 16 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
  loadingSub: { fontSize: 13, color: c.textMuted },

  scroll: { paddingHorizontal: 16 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  resultHeaderTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary },

  skinTypeCard: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(138,120,96,0.2)',
    padding: 24, marginBottom: 20, gap: 8,
  },
  skinTypeEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 2, color: c.primary },
  skinTypeLabel: { fontSize: 32, fontWeight: '800', color: c.textPrimary },
  analysisText: { fontSize: 14, color: c.textSecondary, lineHeight: 22 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary, marginBottom: 10 },

  recsCard: { backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border },
  recRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 16 },
  recBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  recNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  recNumText: { fontSize: 12, fontWeight: '800', color: c.white },
  recText: { fontSize: 14, color: c.textSecondary, lineHeight: 21, flex: 1 },

  routineCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(183,155,110,0.15)', padding: 18 },
  routineText: { fontSize: 14, color: c.textSecondary, lineHeight: 22 },

  tdCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(138,120,96,0.15)', padding: 18, gap: 8 },
  tdEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: c.primary },
  tdText: { fontSize: 14, color: c.textSecondary, lineHeight: 21 },
  tdCta: { alignSelf: 'flex-start', marginTop: 4 },
  tdCtaText: { fontSize: 13, color: c.primary, fontWeight: '600' },

  scanCta: { borderRadius: 18, overflow: 'hidden', marginBottom: 12 },
  scanCtaContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 22 },
  scanCtaTitle: { fontSize: 16, fontWeight: '700', color: c.white, marginBottom: 4 },
  scanCtaSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  coachCta: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: c.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: c.border, padding: 16,
  },
  coachCtaText: { flex: 1, fontSize: 14, color: c.textSecondary, fontWeight: '500' },
  });
}
