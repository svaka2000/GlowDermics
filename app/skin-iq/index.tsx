import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';

type Question = {
  question: string;
  options: string[];
  correct: number; // index
  explanation: string;
  ingredient?: string; // links to ingredient decoder
  difficulty: 'easy' | 'medium' | 'hard';
};

const QUESTIONS: Question[] = [
  {
    question: 'What percentage of human sebum is oleic acid — the same fatty acid found in tallow?',
    options: ['~15%', '~30%', '~45%', '~60%'],
    correct: 2,
    explanation: 'Human sebum contains ~45% oleic acid. Beef tallow also contains ~45% oleic acid — this structural similarity is why tallow absorbs so readily into skin and doesn\'t just sit on the surface.',
    ingredient: 'Oleic Acid',
    difficulty: 'hard',
  },
  {
    question: 'What does "comedogenic" mean?',
    options: ['Antibacterial', 'Pore-clogging', 'Anti-aging', 'Hydrating'],
    correct: 1,
    explanation: 'Comedogenic ingredients clog pores and can cause comedones (blackheads and whiteheads). Coconut oil is rated 4/5 on the comedogenic scale — highly clogging for most skin types.',
    ingredient: 'Comedogenicity',
    difficulty: 'easy',
  },
  {
    question: 'Which ingredient is the only one with decades of clinical proof for anti-aging?',
    options: ['Retinol', 'Vitamin C', 'SPF', 'Hyaluronic Acid'],
    correct: 2,
    explanation: 'Sunscreen (SPF) has the most robust clinical evidence for preventing skin aging. UV radiation causes ~80% of visible facial aging. Retinol has strong evidence too, but SPF prevents the damage before it occurs.',
    difficulty: 'medium',
  },
  {
    question: 'How long should you give a new product before judging its results?',
    options: ['3-5 days', '1-2 weeks', '4-6 weeks', '3-6 months'],
    correct: 2,
    explanation: 'Skin renews itself roughly every 28 days. You need at least one full skin cycle (4-6 weeks) to properly evaluate a new product. Switching too soon is one of the most common skincare mistakes.',
    difficulty: 'easy',
  },
  {
    question: 'What is the skin\'s "acid mantle"?',
    options: [
      'A chemical exfoliant',
      'The slightly acidic protective film on skin',
      'A type of retinol cream',
      'An SPF formula',
    ],
    correct: 1,
    explanation: 'The acid mantle is a thin, slightly acidic film (pH 4.5-5.5) on the skin surface. It protects against bacteria, moisture loss, and environmental irritants. Harsh cleansers and alkaline products disrupt it.',
    ingredient: 'Acid Mantle',
    difficulty: 'medium',
  },
  {
    question: 'Which vitamin deficiency is most closely linked to dry, rough skin?',
    options: ['Vitamin C', 'Vitamin D', 'Vitamin A', 'Vitamin K'],
    correct: 2,
    explanation: 'Vitamin A (retinol) is essential for skin cell turnover and barrier function. Deficiency leads to xerosis (dry, scaly skin) and follicular hyperkeratosis (rough "goosebump" texture). Tallow contains fat-soluble vitamins including Vitamin A.',
    ingredient: 'Vitamin A',
    difficulty: 'hard',
  },
  {
    question: 'What does "denatured alcohol" (Alcohol Denat) do to skin?',
    options: [
      'Deeply hydrates',
      'Adds a matte finish by stripping oils',
      'Rebuilds the skin barrier',
      'Stimulates collagen',
    ],
    correct: 1,
    explanation: 'Alcohol Denat strips skin of oils and disrupts the barrier. While it feels "clean" and provides a matte finish temporarily, over time it causes dehydration, sensitivity, and rebound oiliness. It is one of the top ingredients to avoid.',
    ingredient: 'Alcohol Denat',
    difficulty: 'medium',
  },
  {
    question: 'How is tallow fundamentally different from plant-based oils for skin?',
    options: [
      'It has more antioxidants',
      'It is cheaper to produce',
      'Its fatty acid profile matches human skin chemistry',
      'It contains more water',
    ],
    correct: 2,
    explanation: 'Animal tallow\'s fatty acid composition (saturated + monounsaturated) closely mirrors human sebum. Plant oils are predominantly polyunsaturated (linoleic acid) which oxidizes quickly and differs from skin\'s natural lipids.',
    difficulty: 'hard',
  },
  {
    question: 'What is the primary function of a skin "toner"?',
    options: [
      'Deep cleansing of pores',
      'Balancing pH after cleansing',
      'Adding SPF protection',
      'Increasing collagen production',
    ],
    correct: 1,
    explanation: 'Toners historically rebalanced skin pH after alkaline cleansers disrupted the acid mantle. Modern gentle cleansers often make toners unnecessary — but hydrating toners (like rosewater mist) can still add a nice hydrating step.',
    difficulty: 'easy',
  },
  {
    question: 'What causes "purging" when starting a new active (like retinol)?',
    options: [
      'Allergic reaction to ingredients',
      'Accelerated cell turnover bringing comedones to surface faster',
      'Overhydration of the skin',
      'Bacterial infection from the new product',
    ],
    correct: 1,
    explanation: 'Actives like retinol accelerate cell turnover, which pushes existing clogged pores (comedones) to the surface faster than normal. True purging happens in areas you normally break out and resolves in 4-6 weeks. New breakouts in new areas signal irritation, not purging.',
    ingredient: 'Retinol',
    difficulty: 'medium',
  },
];

const IQ_LABELS: Record<number, string> = {
  10: 'Dermatologist-Level',
  9: 'Skin Expert',
  8: 'Advanced Knowledge',
  7: 'Solid Foundation',
  6: 'Getting There',
  5: 'Intermediate',
  4: 'Learning Fast',
  3: 'Beginner',
  2: 'Just Starting',
  1: 'Keep Reading!',
  0: 'Keep Reading!',
};

const SCORE_COLORS: Record<string, string> = {
  high: '#4ADE80',
  mid: Colors.gold,
  low: Colors.scorePoor,
};

export default function SkinIQ() {
  const [currentQ, setCurrentQ] = useState(-1); // -1 = intro
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [done, setDone] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const start = () => {
    setCurrentQ(0);
    setAnswers([]);
    setSelected(null);
    setShowExplanation(false);
    setDone(false);
  };

  const selectAnswer = (idx: number) => {
    if (selected !== null) return; // already answered
    setSelected(idx);
    setShowExplanation(true);
  };

  const next = () => {
    const newAnswers = [...answers, selected!];
    setAnswers(newAnswers);
    setSelected(null);
    setShowExplanation(false);
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setDone(true);
    }
  };

  const score = answers.filter((a, i) => a === QUESTIONS[i]?.correct).length;
  const pct = Math.round((score / QUESTIONS.length) * 100);
  const iqLabel = IQ_LABELS[score] ?? 'Keep Reading!';
  const scoreColor = pct >= 70 ? SCORE_COLORS.high : pct >= 50 ? SCORE_COLORS.mid : SCORE_COLORS.low;

  const q = QUESTIONS[currentQ];

  // Intro screen
  if (currentQ === -1) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
            <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Skin IQ Quiz</Text>
            <View style={{ width: 36 }} />
          </Animated.View>
        </SafeAreaView>
        <Animated.ScrollView contentContainerStyle={styles.scroll} style={{ opacity: contentAnim }}>
          <View style={styles.introCard}>
            <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Text style={styles.introEmoji}>🧠</Text>
            <Text style={styles.introTitle}>How Much Do You Know About Skin?</Text>
            <Text style={styles.introSub}>{QUESTIONS.length} questions · Ingredients, routines, science</Text>
          </View>

          <View style={styles.infoCard}>
            {[
              { icon: '⏱', text: `${QUESTIONS.length} questions — takes about 5 minutes` },
              { icon: '📖', text: 'Each answer includes a science-backed explanation' },
              { icon: '🌿', text: 'Learn why minimal, ancestral skincare works' },
              { icon: '🏆', text: 'Get your Skin IQ score at the end' },
            ].map((item, i) => (
              <View key={i} style={styles.infoRow}>
                <Text style={styles.infoIcon}>{item.icon}</Text>
                <Text style={styles.infoText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.startBtn} onPress={start}>
            <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={StyleSheet.absoluteFill} />
            <Text style={styles.startBtnText}>Start the Quiz →</Text>
          </Pressable>
          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      </View>
    );
  }

  // Results screen
  if (done) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Your Results</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Score card */}
          <View style={styles.resultCard}>
            <LinearGradient
              colors={pct >= 70 ? ['rgba(74,222,128,0.15)', 'rgba(74,222,128,0.04)'] : pct >= 50 ? ['rgba(212,169,106,0.15)', 'rgba(212,169,106,0.04)'] : ['rgba(248,113,113,0.15)', 'rgba(248,113,113,0.04)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.resultScore, { color: scoreColor }]}>{score}/{QUESTIONS.length}</Text>
            <Text style={[styles.resultPct, { color: scoreColor }]}>{pct}%</Text>
            <Text style={styles.resultLabel}>{iqLabel}</Text>
            <Text style={styles.resultSub}>
              {pct >= 80 ? 'Impressive! You have expert-level skincare knowledge.' :
               pct >= 60 ? 'Good knowledge — you\'re ahead of most people.' :
               pct >= 40 ? 'Solid foundation. Keep exploring the Skin Lab for more.' :
               'Great start! The Skin Lab articles will level you up fast.'}
            </Text>
          </View>

          {/* Answer review */}
          <Text style={styles.reviewTitle}>Answer Review</Text>
          {QUESTIONS.map((question, i) => {
            const userAnswer = answers[i];
            const isCorrect = userAnswer === question.correct;
            return (
              <View key={i} style={[styles.reviewCard, { borderColor: isCorrect ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)' }]}>
                <View style={styles.reviewHeader}>
                  <Ionicons name={isCorrect ? 'checkmark-circle' : 'close-circle'} size={20} color={isCorrect ? '#4ADE80' : Colors.scorePoor} />
                  <Text style={[styles.reviewDifficulty, {
                    color: question.difficulty === 'easy' ? '#4ADE80' : question.difficulty === 'medium' ? Colors.gold : Colors.scorePoor,
                  }]}>{question.difficulty.toUpperCase()}</Text>
                </View>
                <Text style={styles.reviewQ}>{question.question}</Text>
                <Text style={[styles.reviewCorrect, { color: '#4ADE80' }]}>✓ {question.options[question.correct]}</Text>
                {!isCorrect && (
                  <Text style={styles.reviewWrong}>✗ You said: {question.options[userAnswer]}</Text>
                )}
                <Text style={styles.reviewExplanation}>{question.explanation}</Text>
                {question.ingredient && (
                  <Pressable
                    style={styles.learnMoreBtn}
                    onPress={() => router.push(`/ingredient/${encodeURIComponent(question.ingredient!)}`)}
                  >
                    <Text style={styles.learnMoreText}>Learn more about {question.ingredient} →</Text>
                  </Pressable>
                )}
              </View>
            );
          })}

          <Pressable style={styles.retryBtn} onPress={start}>
            <Text style={styles.retryText}>Retake Quiz</Text>
          </Pressable>

          <Pressable style={styles.labBtn} onPress={() => router.push('/learn')}>
            <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={StyleSheet.absoluteFill} />
            <Text style={styles.labBtnText}>Explore Skin Lab →</Text>
          </Pressable>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  // Question screen
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Question {currentQ + 1}/{QUESTIONS.length}</Text>
          <View style={[styles.backBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]}>
            <Text style={[styles.difficultyBadge, {
              color: q.difficulty === 'easy' ? '#4ADE80' : q.difficulty === 'medium' ? Colors.gold : Colors.scorePoor,
            }]}>{q.difficulty}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.progressBarOuter}>
        <View style={[styles.progressBarInner, { width: `${((currentQ) / QUESTIONS.length) * 100}%` as any }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.question}>{q.question}</Text>

        <View style={styles.optionsWrap}>
          {q.options.map((opt, i) => {
            let bg = Colors.bgCard;
            let border = Colors.border;
            let textColor = Colors.textPrimary;

            if (selected !== null) {
              if (i === q.correct) { bg = 'rgba(74,222,128,0.12)'; border = '#4ADE80'; textColor = '#4ADE80'; }
              else if (i === selected && selected !== q.correct) { bg = 'rgba(248,113,113,0.12)'; border = Colors.scorePoor; textColor = Colors.scorePoor; }
            } else if (selected === i) {
              bg = 'rgba(196,98,45,0.12)'; border = Colors.primary; textColor = Colors.primary;
            }

            return (
              <Pressable
                key={i}
                style={[styles.option, { backgroundColor: bg, borderColor: border }]}
                onPress={() => selectAnswer(i)}
              >
                <View style={[styles.optionLetter, { borderColor: border }]}>
                  <Text style={[styles.optionLetterText, { color: border === Colors.border ? Colors.textMuted : border }]}>
                    {['A', 'B', 'C', 'D'][i]}
                  </Text>
                </View>
                <Text style={[styles.optionText, { color: textColor }]}>{opt}</Text>
                {selected !== null && i === q.correct && (
                  <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
                )}
                {selected !== null && i === selected && selected !== q.correct && (
                  <Ionicons name="close-circle" size={20} color={Colors.scorePoor} />
                )}
              </Pressable>
            );
          })}
        </View>

        {showExplanation && (
          <View style={styles.explanationCard}>
            <LinearGradient colors={['rgba(196,98,45,0.12)', 'rgba(196,98,45,0.02)']} style={StyleSheet.absoluteFill} />
            <Ionicons name="bulb-outline" size={18} color={Colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={styles.explanationTitle}>
                {selected === q.correct ? '✅ Correct!' : '❌ Not quite'}
              </Text>
              <Text style={styles.explanationText}>{q.explanation}</Text>
            </View>
          </View>
        )}

        {selected !== null && (
          <Pressable style={styles.nextBtn} onPress={next}>
            <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={StyleSheet.absoluteFill} />
            <Text style={styles.nextBtnText}>
              {currentQ < QUESTIONS.length - 1 ? 'Next Question →' : 'See My Score →'}
            </Text>
          </Pressable>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  difficultyBadge: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  scroll: { paddingHorizontal: 20 },

  progressBarOuter: { height: 3, backgroundColor: Colors.border },
  progressBarInner: { height: 3, backgroundColor: Colors.primary },

  introCard: { borderRadius: 20, overflow: 'hidden', padding: 32, alignItems: 'center', gap: 10, marginBottom: 20, marginTop: 8 },
  introEmoji: { fontSize: 52 },
  introTitle: { fontSize: 22, fontWeight: '900', color: Colors.white, textAlign: 'center' },
  introSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },

  infoCard: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 18, gap: 14, marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  infoText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  startBtn: { height: 56, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  startBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white },

  question: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, lineHeight: 30, marginVertical: 20 },

  optionsWrap: { gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14, borderWidth: 1.5, padding: 16 },
  optionLetter: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 13, fontWeight: '800' },
  optionText: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 22 },

  explanationCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 14, marginTop: 16 },
  explanationTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  explanationText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  nextBtn: { height: 52, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },

  resultCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, padding: 28, alignItems: 'center', gap: 8, marginBottom: 24 },
  resultScore: { fontSize: 52, fontWeight: '900', lineHeight: 60 },
  resultPct: { fontSize: 20, fontWeight: '700' },
  resultLabel: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  resultSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 300 },

  reviewTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  reviewCard: { backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 8, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewDifficulty: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  reviewQ: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, lineHeight: 20 },
  reviewCorrect: { fontSize: 13, fontWeight: '600', lineHeight: 20 },
  reviewWrong: { fontSize: 13, color: Colors.scorePoor, lineHeight: 20 },
  reviewExplanation: { fontSize: 12, color: Colors.textMuted, lineHeight: 19 },
  learnMoreBtn: { paddingTop: 4 },
  learnMoreText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  retryBtn: { alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  retryText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  labBtn: { height: 52, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  labBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
