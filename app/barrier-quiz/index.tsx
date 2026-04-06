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
  id: string;
  text: string;
  options: { text: string; score: number }[];
};

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'After washing your face with just water, how quickly does it feel tight or dry?',
    options: [
      { text: 'Never — my skin stays comfortable', score: 0 },
      { text: 'After 20-30 minutes', score: 1 },
      { text: 'Within 10-15 minutes', score: 2 },
      { text: 'Almost immediately', score: 3 },
    ],
  },
  {
    id: 'q2',
    text: 'Does your skin sting, burn, or tingle when you apply water or skincare products?',
    options: [
      { text: 'Never', score: 0 },
      { text: 'Occasionally with certain products', score: 1 },
      { text: 'Often with new products', score: 2 },
      { text: 'Almost always, even with water', score: 3 },
    ],
  },
  {
    id: 'q3',
    text: 'How often do you experience redness or flushing?',
    options: [
      { text: 'Rarely or never', score: 0 },
      { text: 'Occasionally after harsh products', score: 1 },
      { text: 'Often after heat, wind, or products', score: 2 },
      { text: 'Persistently — my skin is frequently red', score: 3 },
    ],
  },
  {
    id: 'q4',
    text: 'Do you use physical or chemical exfoliants (scrubs, AHA, BHA, retinol)?',
    options: [
      { text: 'Never or very rarely', score: 0 },
      { text: '1-2 times per week', score: 1 },
      { text: '3-4 times per week', score: 2 },
      { text: 'Daily or multiple actives stacked', score: 3 },
    ],
  },
  {
    id: 'q5',
    text: 'How does your skin look/feel in dry or heated indoor environments?',
    options: [
      { text: 'Fine — no noticeable change', score: 0 },
      { text: 'Slightly drier than usual', score: 1 },
      { text: 'Noticeably drier, flaky', score: 2 },
      { text: 'Very uncomfortable, tight, raw-feeling', score: 3 },
    ],
  },
  {
    id: 'q6',
    text: 'Does your skin break out after using many new products?',
    options: [
      { text: 'No — it tolerates most things', score: 0 },
      { text: 'Sometimes with harsh formulas', score: 1 },
      { text: 'Often after new products', score: 2 },
      { text: 'Almost always — very reactive', score: 3 },
    ],
  },
  {
    id: 'q7',
    text: 'Do you have visible patches of dryness, flaking, or skin that "pills" when layering products?',
    options: [
      { text: 'No — skin texture is smooth', score: 0 },
      { text: 'Occasionally in dry weather', score: 1 },
      { text: 'Regularly in certain areas', score: 2 },
      { text: 'Almost all the time', score: 3 },
    ],
  },
  {
    id: 'q8',
    text: 'How does your skin react to wind, cold, or outdoor elements?',
    options: [
      { text: 'No reaction', score: 0 },
      { text: 'Slightly dryer', score: 1 },
      { text: 'Redness and discomfort', score: 2 },
      { text: 'Severe reactivity — painful', score: 3 },
    ],
  },
];

type BarrierResult = {
  level: string;
  score: number;
  color: string;
  emoji: string;
  summary: string;
  protocol: { phase: string; duration: string; steps: string[] }[];
  ingredients: { name: string; role: string; priority: 'high' | 'medium' }[];
  avoid: string[];
  tallowNote: string;
};

function getResult(totalScore: number, maxScore: number): BarrierResult {
  const pct = totalScore / maxScore;

  if (pct < 0.25) {
    return {
      level: 'Strong Barrier', score: totalScore, color: '#4ADE80', emoji: '🛡️',
      summary: 'Your skin barrier is functioning well. Focus on maintenance and prevention rather than repair.',
      protocol: [
        { phase: 'Maintain', duration: 'Daily', steps: ['Gentle cleanser morning and night', 'One humectant (hyaluronic acid or glycerin)', 'Occlusive seal (tallow or squalane)', 'SPF 30+ every morning'] },
      ],
      ingredients: [
        { name: 'Tallow / Squalane', role: 'Maintenance occlusive', priority: 'high' },
        { name: 'Niacinamide', role: 'Strengthening ceramide production', priority: 'medium' },
        { name: 'SPF 30+', role: 'Prevention of UV damage', priority: 'high' },
      ],
      avoid: ['Over-exfoliation (limit to 2-3x per week max)', 'Fragrance in leave-on products'],
      tallowNote: 'With a strong barrier, tallow works beautifully as your nightly occlusive — its fatty acid profile closely matches your skin\'s own sebum, maintaining what\'s already working.',
    };
  }

  if (pct < 0.5) {
    return {
      level: 'Mildly Compromised', score: totalScore, color: Colors.gold, emoji: '⚠️',
      summary: 'Your barrier shows mild signs of compromise. A 2-4 week repair protocol will significantly restore function.',
      protocol: [
        { phase: 'Phase 1: Simplify', duration: 'Weeks 1-2', steps: ['Stop all actives (AHA, BHA, retinol, vitamin C)', 'Use only micellar water to cleanse', 'Apply ceramide moisturizer twice daily', 'Seal with tallow balm at night'] },
        { phase: 'Phase 2: Rebuild', duration: 'Weeks 3-4', steps: ['Reintroduce gentle cleanser', 'Add one humectant (glycerin or HA)', 'Continue tallow at night', 'Reintroduce actives one at a time — start with niacinamide'] },
      ],
      ingredients: [
        { name: 'Tallow balm', role: 'Barrier occlusive and lipid replacement', priority: 'high' },
        { name: 'Ceramides (types 1, 3, 6)', role: 'Rebuilding lipid structure', priority: 'high' },
        { name: 'Niacinamide 4-5%', role: 'Ceramide synthesis stimulation', priority: 'high' },
        { name: 'Glycerin', role: 'Humectant — draws water to barrier', priority: 'medium' },
      ],
      avoid: ['All exfoliants for at least 2 weeks', 'Fragrance', 'Alcohol-based toners', 'Hot water washing'],
      tallowNote: 'For mildly compromised barriers, tallow is one of the most effective repair ingredients available — its conjugated linoleic acid (CLA) reduces inflammation while the fatty acid profile fills barrier gaps.',
    };
  }

  if (pct < 0.75) {
    return {
      level: 'Moderately Compromised', score: totalScore, color: '#F97316', emoji: '🔴',
      summary: 'Your barrier has significant compromise. A minimum 4-6 week protocol focused exclusively on repair is needed before introducing actives.',
      protocol: [
        { phase: 'Phase 1: Complete Rest', duration: 'Weeks 1-3', steps: ['Cleanse only with oil or micellar water — no foam/gel', 'NO actives of any kind', 'Tallow twice daily: morning and night', 'Add ceramide-based cream under tallow', 'No exfoliation whatsoever'] },
        { phase: 'Phase 2: Cautious Rebuild', duration: 'Weeks 4-6', steps: ['Introduce gentle pH-balanced cleanser', 'Add niacinamide 4% (anti-inflammatory, builds ceramides)', 'Continue tallow nightly', 'Only add one new product per 2 weeks'] },
        { phase: 'Phase 3: Maintenance', duration: 'Ongoing', steps: ['Reintroduce ONE active at low concentration', 'Always patch test', 'Keep exfoliation to once per week maximum'] },
      ],
      ingredients: [
        { name: 'Tallow (undiluted)', role: 'Primary barrier repair — CLA reduces inflammation, fatty acids fill barrier gaps', priority: 'high' },
        { name: 'Ceramides', role: 'Structural lipid replacement', priority: 'high' },
        { name: 'Panthenol (vitamin B5)', role: 'Wound healing and barrier restoration', priority: 'high' },
        { name: 'Colloidal oat', role: 'Soothing anti-inflammatory', priority: 'medium' },
        { name: 'Allantoin', role: 'Cell regeneration and soothing', priority: 'medium' },
      ],
      avoid: ['ALL exfoliants', 'ALL actives (vitamin C, retinol, AHA, BHA)', 'Fragrance and essential oils', 'Hot showers', 'Over-cleansing (max once per day)', 'Physical scrubbing'],
      tallowNote: 'Moderate barrier damage requires consistent, rich lipid application. Tallow applied twice daily creates a semi-occlusive layer that holds moisture in while its palmitoleic acid fights the inflammation causing barrier breakdown. This is the closest thing to a medical barrier cream without a prescription.',
    };
  }

  return {
    level: 'Severely Compromised', score: totalScore, color: Colors.scorePoor, emoji: '🚨',
    summary: 'Your barrier is severely compromised. Focus is on wound-healing mode for at least 6-8 weeks. Consider seeing a dermatologist.',
    protocol: [
      { phase: 'Emergency Phase', duration: 'Weeks 1-4', steps: ['Cleanse only with mineral/lukewarm water — no cleanser', 'Apply thick layer of tallow immediately after washing (damp skin)', 'No products of any kind except tallow', 'Use humidifier in bedroom', 'Drink 8+ glasses of water daily', 'Consult a dermatologist — you may have a condition like eczema or rosacea'] },
      { phase: 'Stabilization', duration: 'Weeks 5-8', steps: ['Introduce one ceramide moisturizer with tallow', 'Consider low-dose prescription if dermatologist recommends', 'Still no actives', 'Keep routine to absolute minimum: cleanse, moisturize, seal'] },
    ],
    ingredients: [
      { name: 'Tallow (thick, frequent application)', role: 'Emergency barrier repair — closest non-prescription option to medical-grade occlusives', priority: 'high' },
      { name: 'Ceramides', role: 'Critical structural repair', priority: 'high' },
      { name: 'Petrolatum (if tolerated)', role: 'Maximum occlusion for severe TEWL', priority: 'high' },
      { name: 'Colloidal oatmeal', role: 'Emergency soothing for inflamed skin', priority: 'high' },
    ],
    avoid: ['Everything except the basics above', 'ANY active ingredient', 'Hot water', 'Towel rubbing — pat only', 'Fragranced products', 'Most commercial moisturizers (fragrance, preservatives)'],
    tallowNote: 'Severe barrier compromise requires the most intensive care. Tallow applied in a thick layer multiple times daily can significantly reduce transepidermal water loss (TEWL) — in some studies, animal fats match petrolatum\'s barrier-repair efficacy. Apply immediately after washing while skin is still slightly damp.',
  };
}

export default function BarrierQuiz() {
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<BarrierResult | null>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers, score];
    setAnswers(newAnswers);

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      const total = newAnswers.reduce((s, v) => s + v, 0);
      setResult(getResult(total, QUESTIONS.length * 3));
      setPhase('result');
    }
  };

  const restart = () => {
    setPhase('intro');
    setCurrentQ(0);
    setAnswers([]);
    setResult(null);
  };

  if (phase === 'intro') {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
            <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Barrier Health Quiz</Text>
            <View style={{ width: 36 }} />
          </Animated.View>
        </SafeAreaView>

        <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ opacity: contentAnim }}>
          <View style={styles.hero}>
            <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Text style={styles.heroEmoji}>🛡️</Text>
            <Text style={styles.heroTitle}>Skin Barrier Assessment</Text>
            <Text style={styles.heroDesc}>
              The skin barrier (stratum corneum) is the most important factor in skin health. A compromised barrier causes dryness, sensitivity, breakouts, and accelerated aging — yet most people have no idea theirs is damaged.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>What This Tells You</Text>
            {[
              'Your current barrier health level (Strong → Severe)',
              'An exact repair protocol based on your results',
              'Which ingredients to use and avoid right now',
              'How to reintroduce actives safely',
              'How tallow fits into your barrier repair',
            ].map((item, i) => (
              <View key={i} style={styles.listRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.startBtn} onPress={() => setPhase('quiz')}>
            <LinearGradient colors={[Colors.primaryDark, Colors.primary, Colors.gold]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Text style={styles.startBtnText}>Start ({QUESTIONS.length} Questions)</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </Pressable>

          <View style={{ height: 80 }} />
        </Animated.ScrollView>
      </View>
    );
  }

  if (phase === 'quiz') {
    const q = QUESTIONS[currentQ];
    const progress = ((currentQ) / QUESTIONS.length) * 100;

    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={restart}>
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>{currentQ + 1} of {QUESTIONS.length}</Text>
            <View style={{ width: 36 }} />
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </SafeAreaView>

        <ScrollView contentContainerStyle={styles.quizScroll}>
          <Text style={styles.questionText}>{q.text}</Text>
          <View style={styles.optionsWrap}>
            {q.options.map((opt, i) => (
              <Pressable key={i} style={styles.optionBtn} onPress={() => handleAnswer(opt.score)}>
                <View style={styles.optionLetter}>
                  <Text style={styles.optionLetterText}>{String.fromCharCode(65 + i)}</Text>
                </View>
                <Text style={styles.optionText}>{opt.text}</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
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
          <Text style={styles.headerTitle}>Your Barrier Result</Text>
          <Pressable onPress={restart}>
            <Text style={styles.retakeText}>Retake</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {result && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={[styles.resultHero, { borderColor: `${result.color}50` }]}>
            <LinearGradient colors={[`${result.color}15`, `${result.color}04`]} style={StyleSheet.absoluteFill} />
            <Text style={styles.resultEmoji}>{result.emoji}</Text>
            <Text style={[styles.resultLevel, { color: result.color }]}>{result.level}</Text>
            <Text style={styles.resultSummary}>{result.summary}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Repair Protocol</Text>
            {result.protocol.map((phase, i) => (
              <View key={i} style={styles.protocolPhase}>
                <View style={[styles.phaseHeader, { borderColor: result.color }]}>
                  <Text style={[styles.phaseName, { color: result.color }]}>{phase.phase}</Text>
                  <Text style={styles.phaseDuration}>{phase.duration}</Text>
                </View>
                {phase.steps.map((step, j) => (
                  <View key={j} style={styles.stepRow}>
                    <View style={[styles.stepDot, { backgroundColor: result.color }]} />
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ingredients to Use Now</Text>
            {result.ingredients.map((ing, i) => (
              <View key={i} style={[styles.ingRow, ing.priority === 'high' && styles.highPriorityRow]}>
                {ing.priority === 'high' && (
                  <View style={styles.highBadge}><Text style={styles.highBadgeText}>PRIORITY</Text></View>
                )}
                <Text style={styles.ingName}>{ing.name}</Text>
                <Text style={styles.ingRole}>{ing.role}</Text>
              </View>
            ))}
          </View>

          <View style={styles.avoidCard}>
            <LinearGradient colors={['rgba(239,68,68,0.08)', 'rgba(239,68,68,0.02)']} style={StyleSheet.absoluteFill} />
            <Text style={[styles.cardTitle, { color: Colors.scorePoor }]}>⚠️ Avoid Right Now</Text>
            {result.avoid.map((item, i) => (
              <View key={i} style={styles.avoidRow}>
                <Ionicons name="close-circle" size={14} color={Colors.scorePoor} />
                <Text style={styles.avoidText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.tallowCard}>
            <LinearGradient colors={[`${Colors.primary}12`, `${Colors.primary}04`]} style={StyleSheet.absoluteFill} />
            <Text style={styles.tallowTitle}>🌿 Tallow for Your Barrier Level</Text>
            <Text style={styles.tallowText}>{result.tallowNote}</Text>
          </View>

          <Pressable style={styles.doneBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Text style={styles.doneBtnText}>Start My Protocol →</Text>
          </Pressable>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  retakeText: { fontSize: 13, color: Colors.textMuted, textDecorationLine: 'underline' },
  progressBg: { height: 3, backgroundColor: Colors.border },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  scroll: { paddingHorizontal: 16 },
  quizScroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },

  hero: { borderRadius: 20, overflow: 'hidden', padding: 24, gap: 10, marginBottom: 16, alignItems: 'center' },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: Colors.white },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 22 },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 10, marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  listText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 56, borderRadius: 16, overflow: 'hidden', marginBottom: 14,
  },
  startBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white },

  questionText: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, lineHeight: 28, marginBottom: 24 },
  optionsWrap: { gap: 10 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  optionLetter: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: `${Colors.primary}15`, alignItems: 'center', justifyContent: 'center',
  },
  optionLetterText: { fontSize: 12, fontWeight: '900', color: Colors.primary },
  optionText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },

  resultHero: {
    borderRadius: 20, overflow: 'hidden', borderWidth: 2,
    padding: 24, gap: 8, marginBottom: 14, alignItems: 'center',
  },
  resultEmoji: { fontSize: 48 },
  resultLevel: { fontSize: 24, fontWeight: '900' },
  resultSummary: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  protocolPhase: { gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  phaseHeader: { borderLeftWidth: 3, paddingLeft: 10 },
  phaseName: { fontSize: 14, fontWeight: '800' },
  phaseDuration: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  stepDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  stepText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },

  ingRow: { gap: 2, paddingVertical: 6, borderTopWidth: 1, borderTopColor: Colors.border },
  highPriorityRow: { borderTopColor: `${Colors.primary}30` },
  highBadge: { backgroundColor: `${Colors.primary}20`, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  highBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
  ingName: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  ingRole: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },

  avoidCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
    padding: 16, gap: 8, marginBottom: 14,
  },
  avoidRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  avoidText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },

  tallowCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: `${Colors.primary}30`,
    padding: 16, gap: 6, marginBottom: 14,
  },
  tallowTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  tallowText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  doneBtn: {
    height: 52, borderRadius: 14, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
