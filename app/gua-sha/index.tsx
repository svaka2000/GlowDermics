import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

type Technique = {
  id: string;
  name: string;
  emoji: string;
  duration: string;
  benefit: string;
  color: string;
  steps: {
    title: string;
    instruction: string;
    duration: number; // seconds
    tip: string;
    strokes: string;
  }[];
};

function buildTechniques(c: Palette): Technique[] {
  return [
  {
    id: 'morning-lift',
    name: 'Morning Lift',
    emoji: '🌅',
    duration: '8 min',
    benefit: 'Depuffs and stimulates lymphatic drainage',
    color: c.gold,
    steps: [
      {
        title: 'Neck & Decolletage',
        instruction: 'Hold the gua sha flat. Glide upward from collarbone to jawline on each side of the neck. Always move upward.',
        duration: 60,
        tip: 'Apply a facial oil or balm generously first — never drag dry skin.',
        strokes: '5 upward strokes each side',
      },
      {
        title: 'Jawline Sculpt',
        instruction: 'Position the curved notch along your jawline. Glide from chin toward the ear in one smooth motion.',
        duration: 60,
        tip: 'Use medium pressure — you should feel the tool, not pain.',
        strokes: '8 strokes each side',
      },
      {
        title: 'Cheek Lift',
        instruction: 'Place the flat edge below your cheekbone. Sweep upward and outward toward your temple.',
        duration: 60,
        tip: 'This is your biggest lymph node area — light strokes here are most effective.',
        strokes: '6 upward strokes each side',
      },
      {
        title: 'Under-Eye Glide',
        instruction: 'Use the smaller curved end. Gently glide from the inner corner of the eye outward toward the temple. Ultra-light pressure.',
        duration: 45,
        tip: 'This area is delicate — let the weight of the tool do the work. No pushing.',
        strokes: '4 outward strokes each eye',
      },
      {
        title: 'Forehead Smooth',
        instruction: 'Hold the flat edge horizontally. Glide from the brow upward to the hairline in smooth, even strokes.',
        duration: 45,
        tip: 'Alternate between upward strokes and outward strokes across the brow to prevent horizontal lines.',
        strokes: '6 strokes each zone',
      },
      {
        title: 'Lymph Drain Finish',
        instruction: 'Use light, downward strokes from behind the ears down the neck to the collarbone. This drains accumulated lymph fluid.',
        duration: 30,
        tip: 'This final step is crucial — don\'t skip it. It moves the fluid you\'ve shifted to drain properly.',
        strokes: '5 downward strokes each side',
      },
    ],
  },
  {
    id: 'tension-release',
    name: 'Tension Release',
    emoji: '😌',
    duration: '12 min',
    benefit: 'Relieves jaw tension and facial muscle tightness',
    color: '#6B85A8',
    steps: [
      {
        title: 'Scalp Massage',
        instruction: 'Use the comb teeth (or edge) of your gua sha. Move in small circles across the scalp. Releases cranial tension that affects the face.',
        duration: 90,
        tip: 'Scalp tension directly causes brow furrow and forehead lines.',
        strokes: 'Circular movements across scalp',
      },
      {
        title: 'Temple Release',
        instruction: 'Place the curved notch at your temple. Apply gentle pressure and move in slow circles. Then glide outward toward the ear.',
        duration: 60,
        tip: 'If you clench your jaw or grind your teeth, you\'ll feel this area is very tight.',
        strokes: '10 circles, then 5 sweeps each side',
      },
      {
        title: 'Masseter (Jaw Muscle)',
        instruction: 'Find the muscle that bulges when you clench — that\'s your masseter. Scrape upward along this muscle from jaw to cheekbone.',
        duration: 90,
        tip: 'A tight masseter causes jawline jowling and tension headaches. This is one of the most impactful moves.',
        strokes: '10 upward strokes each side',
      },
      {
        title: 'Brow Lift',
        instruction: 'Use your thumb to hold the brow in place. With the gua sha, stroke upward from the brow into the forehead. Lift, don\'t drag.',
        duration: 60,
        tip: 'This counteracts the constant downward pull of gravity and habitual frowning.',
        strokes: '8 upward strokes across brow',
      },
      {
        title: 'Nasolabial Fold',
        instruction: 'Angle the tool beside your nose. Glide outward and upward along the smile lines toward the ear.',
        duration: 60,
        tip: 'These lines deepen from repeated muscle movements — gua sha helps keep the tissue mobile.',
        strokes: '8 outward strokes each side',
      },
      {
        title: 'Lip Line Smooth',
        instruction: 'Use the curved edge above and below the lips. Make small outward strokes from the center to the corner of the mouth.',
        duration: 60,
        tip: 'Pursing the lips (phones, straws) creates vertical lines. This keeps the orbicularis oris muscle supple.',
        strokes: '6 outward strokes above and below',
      },
      {
        title: 'Final Lymph Drain',
        instruction: 'Light downward strokes from ear to collarbone. End by pressing gently under the collarbone for a few seconds.',
        duration: 60,
        tip: 'Hold the balm in your palms and press onto the face for 30 seconds after finishing.',
        strokes: '5 downward strokes each side',
      },
    ],
  },
  {
    id: 'glow-boost',
    name: 'Glow Boost',
    emoji: '✨',
    duration: '6 min',
    benefit: 'Increases circulation for an instant radiance boost',
    color: c.primary,
    steps: [
      {
        title: 'Prep: Apply Balm',
        instruction: 'Warm a small amount of facial balm or oil between your palms and press onto your face and neck. It should feel slippery — this prevents micro-tears.',
        duration: 30,
        tip: 'Never use gua sha on dry skin. A facial oil or balm is the ideal slip medium — it absorbs slowly and nourishes during the ritual.',
        strokes: 'Press and hold for 10 seconds',
      },
      {
        title: 'Full Face Sweep',
        instruction: 'Starting at the chin, sweep the gua sha in broad upward-outward strokes covering the entire face. Move quickly but smoothly.',
        duration: 90,
        tip: 'Speed matters here — faster strokes increase heat and circulation. Slower strokes drain lymph. This step wants speed.',
        strokes: '3 full sweeps each cheek zone',
      },
      {
        title: 'Cheekbone Define',
        instruction: 'Press the curved notch just below your cheekbone. Sweep sharply upward and outward toward the temple.',
        duration: 60,
        tip: 'Contour and define with a firmer upward sweep. Cheekbone definition comes from lifting fat pads, not pushing bone.',
        strokes: '10 firm upward sweeps each side',
      },
      {
        title: 'Lip Plump',
        instruction: 'Using light tapping motions, tap the flat edge across your lips. Then use tiny outward strokes at the lip border.',
        duration: 45,
        tip: 'The tapping increases blood flow and creates a temporary plumping effect.',
        strokes: '20 taps across lips',
      },
      {
        title: 'Lymph Finish',
        instruction: 'End with 5 downward strokes on each side of the neck. Press below the collarbone.',
        duration: 30,
        tip: 'Lock in moisture by pressing palms to cheeks and breathing deeply for 5 breaths.',
        strokes: '5 downward strokes each side',
      },
    ],
  },
  ];
}

export default function GuaShaGuide() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const TECHNIQUES = useMemo(() => buildTechniques(colors), [colors]);
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startStep = (step: Technique['steps'][0]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSecondsLeft(step.duration);
    progressAnim.setValue(0);
    setIsRunning(true);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: step.duration * 1000,
      useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseResume = () => {
    if (!selectedTechnique) return;
    if (isRunning) {
      clearInterval(timerRef.current!);
      progressAnim.stopAnimation();
      setIsRunning(false);
    } else {
      const step = selectedTechnique.steps[activeStep];
      progressAnim.setValue(1 - secondsLeft / step.duration);
      setIsRunning(true);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: secondsLeft * 1000,
        useNativeDriver: false,
      }).start();
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const goToStep = (idx: number) => {
    if (!selectedTechnique) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    setActiveStep(idx);
    setSecondsLeft(selectedTechnique.steps[idx].duration);
    progressAnim.setValue(0);
  };

  const nextStep = () => {
    if (!selectedTechnique) return;
    const next = activeStep + 1;
    if (next >= selectedTechnique.steps.length) {
      setCompleted(true);
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      goToStep(next);
    }
  };

  const startTechnique = (t: Technique) => {
    setSelectedTechnique(t);
    setActiveStep(0);
    setCompleted(false);
    setIsRunning(false);
    setSecondsLeft(t.steps[0].duration);
    progressAnim.setValue(0);
  };

  const backToList = () => {
    setSelectedTechnique(null);
    setCompleted(false);
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  if (selectedTechnique && !completed) {
    const step = selectedTechnique.steps[activeStep];
    const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;

    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={backToList}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>{selectedTechnique.name}</Text>
              <View style={styles.stepProgress}>
                {selectedTechnique.steps.map((_, i) => (
                  <Pressable key={i} onPress={() => goToStep(i)}>
                    <View style={[styles.stepDot, i <= activeStep && { backgroundColor: selectedTechnique.color }]} />
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* Step progress bar */}
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth, backgroundColor: selectedTechnique.color }]} />
          </View>
        </SafeAreaView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Step header */}
          <View style={styles.stepHeader}>
            <Text style={styles.stepCounter}>Step {activeStep + 1} of {selectedTechnique.steps.length}</Text>
            <Text style={styles.stepTitle}>{step.title}</Text>
          </View>

          {/* Timer */}
          <View style={[styles.timerCard, { borderColor: `${selectedTechnique.color}40` }]}>
            <LinearGradient colors={[`${selectedTechnique.color}12`, `${selectedTechnique.color}03`]} style={StyleSheet.absoluteFill} />
            <Text style={[styles.timerDisplay, { color: selectedTechnique.color }]}>
              {mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`}
            </Text>
            <View style={styles.timerBtns}>
              <Pressable style={[styles.timerBtn, { backgroundColor: selectedTechnique.color }]} onPress={pauseResume}>
                <Ionicons name={isRunning ? 'pause' : 'play'} size={20} color={colors.white} />
                <Text style={styles.timerBtnText}>{isRunning ? 'Pause' : secondsLeft === step.duration ? 'Start' : 'Resume'}</Text>
              </Pressable>
              <Pressable style={styles.timerSkipBtn} onPress={nextStep}>
                <Text style={styles.timerSkipText}>{activeStep === selectedTechnique.steps.length - 1 ? 'Finish' : 'Skip →'}</Text>
              </Pressable>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>Instructions</Text>
            <Text style={styles.instructionText}>{step.instruction}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>STROKES</Text>
              <Text style={styles.detailValue}>{step.strokes}</Text>
            </View>
          </View>

          {/* Tip */}
          <View style={styles.tipCard}>
            <View style={[styles.tipIconBadge, { backgroundColor: `${selectedTechnique.color}20` }]}>
              <Text style={{ fontSize: 14 }}>💡</Text>
            </View>
            <Text style={styles.tipText}>{step.tip}</Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  if (completed && selectedTechnique) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={backToList}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>{selectedTechnique.name}</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
        <View style={styles.completedRoot}>
          <LinearGradient colors={[colors.primaryDark, colors.primary, colors.gold]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Text style={styles.completedEmoji}>{selectedTechnique.emoji}</Text>
          <Text style={styles.completedTitle}>Ritual Complete!</Text>
          <Text style={styles.completedBenefit}>{selectedTechnique.benefit}</Text>
          <Text style={styles.completedNote}>Your lymphatic system is now draining, circulation is up, and your skin is primed to absorb nutrients. Apply a final layer of facial balm and let it sink in.</Text>
          <Pressable style={styles.completedBtn} onPress={backToList}>
            <Text style={styles.completedBtnText}>Back to Rituals</Text>
          </Pressable>
          <Pressable style={styles.completedScanBtn} onPress={() => router.push('/scan')}>
            <Text style={styles.completedScanBtnText}>Take a Skin Scan</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>Gua Sha Guide</Text>
            <Text style={styles.headerSub}>Ancient lymphatic sculpting ritual</Text>
          </View>
          <View style={{ width: 36 }} />
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ opacity: contentAnim }}>

        {/* Hero */}
        <View style={styles.heroCard}>
          <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Text style={styles.heroEmoji}>🪨</Text>
          <Text style={styles.heroTitle}>Gua Sha</Text>
          <Text style={styles.heroSub}>Sculpt · Drain · Glow</Text>
          <Text style={styles.heroDesc}>
            Gua sha is a 2,000-year-old Chinese technique that uses a smooth stone to scrape the skin, stimulating lymphatic drainage, increasing circulation, and releasing facial muscle tension.
          </Text>
        </View>

        {/* Technique cards */}
        <Text style={styles.sectionLabel}>CHOOSE YOUR RITUAL</Text>
        {TECHNIQUES.map(t => (
          <Pressable key={t.id} style={styles.techniqueCard} onPress={() => startTechnique(t)}>
            <LinearGradient colors={[`${t.color}14`, `${t.color}04`]} style={StyleSheet.absoluteFill} />
            <View style={styles.techniqueTop}>
              <Text style={styles.techniqueEmoji}>{t.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.techniqueName, { color: t.color }]}>{t.name}</Text>
                <Text style={styles.techniqueDuration}>{t.duration} · {t.steps.length} steps</Text>
              </View>
              <Ionicons name="play-circle" size={28} color={t.color} />
            </View>
            <Text style={styles.techniqueBenefit}>{t.benefit}</Text>
          </Pressable>
        ))}

        {/* Prep guide */}
        <View style={styles.prepCard}>
          <Text style={styles.prepTitle}>Before You Begin</Text>
          {[
            { icon: '🌿', text: 'Apply a facial balm or oil generously. It provides ideal slip and nourishes simultaneously.' },
            { icon: '🧊', text: 'For depuffing, refrigerate your gua sha tool overnight. Cool stone reduces inflammation instantly.' },
            { icon: '💧', text: 'Wash your face first. Gua sha over makeup or SPF is counterproductive.' },
            { icon: '⬆️', text: 'Always move upward and outward. Downward strokes fight gravity — upward strokes lift tissue.' },
            { icon: '🔁', text: 'Do each side of your face. Most people neglect their less dominant side.' },
          ].map((item, i) => (
            <View key={i} style={styles.prepRow}>
              <Text style={styles.prepIcon}>{item.icon}</Text>
              <Text style={styles.prepText}>{item.text}</Text>
            </View>
          ))}
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
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  stepProgress: { flexDirection: 'row', gap: 4, justifyContent: 'center', marginTop: 4 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.border },
  progressBarBg: { height: 3, backgroundColor: c.border, marginHorizontal: 0 },
  progressBarFill: { height: '100%', borderRadius: 2 },
  scroll: { paddingHorizontal: 16 },

  stepHeader: { marginBottom: 16, gap: 4 },
  stepCounter: { fontSize: 11, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  stepTitle: { fontSize: 24, fontWeight: '900', color: c.textPrimary },

  timerCard: {
    borderRadius: 20, overflow: 'hidden', borderWidth: 2,
    padding: 24, gap: 16, marginBottom: 14, alignItems: 'center',
  },
  timerDisplay: { fontSize: 64, fontWeight: '900' },
  timerBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  timerBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 50, borderRadius: 14,
  },
  timerBtnText: { fontSize: 16, fontWeight: '800', color: c.white },
  timerSkipBtn: {
    flex: 1, height: 50, borderRadius: 14,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.bgCard,
    alignItems: 'center', justifyContent: 'center',
  },
  timerSkipText: { fontSize: 14, fontWeight: '700', color: c.textMuted },

  instructionCard: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border,
    padding: 16, gap: 8, marginBottom: 10,
  },
  instructionTitle: { fontSize: 11, fontWeight: '800', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  instructionText: { fontSize: 15, color: c.textPrimary, lineHeight: 24 },

  detailRow: { marginBottom: 10 },
  detailCard: {
    backgroundColor: c.bgCard, borderRadius: 12, borderWidth: 1, borderColor: c.border,
    paddingHorizontal: 14, paddingVertical: 10, gap: 2,
  },
  detailLabel: { fontSize: 9, fontWeight: '800', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  detailValue: { fontSize: 13, fontWeight: '700', color: c.textSecondary },

  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.border,
    padding: 14,
  },
  tipIconBadge: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tipText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  completedRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  completedEmoji: { fontSize: 64 },
  completedTitle: { fontSize: 28, fontWeight: '900', color: c.white },
  completedBenefit: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  completedNote: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 22 },
  completedBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  completedBtnText: { fontSize: 16, fontWeight: '700', color: c.white },
  completedScanBtn: { paddingVertical: 10 },
  completedScanBtnText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecorationLine: 'underline' },

  heroCard: {
    borderRadius: 20, overflow: 'hidden', padding: 24, gap: 8,
    alignItems: 'center', marginBottom: 20,
  },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: 32, fontWeight: '900', color: c.white },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 2 },
  heroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 20, marginTop: 8 },

  sectionLabel: {
    fontSize: 10, fontWeight: '800', color: c.textMuted,
    letterSpacing: 1.5, marginBottom: 10, marginTop: 4,
  },
  techniqueCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: c.border,
    padding: 16, gap: 8, marginBottom: 10,
  },
  techniqueTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  techniqueEmoji: { fontSize: 28 },
  techniqueName: { fontSize: 18, fontWeight: '800' },
  techniqueDuration: { fontSize: 12, color: c.textMuted, marginTop: 1 },
  techniqueBenefit: { fontSize: 13, color: c.textSecondary },

  prepCard: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border,
    padding: 16, gap: 12, marginBottom: 14,
  },
  prepTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  prepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  prepIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  prepText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  });
}
