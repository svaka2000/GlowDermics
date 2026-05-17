import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

type Step = {
  title: string;
  instruction: string;
  duration: number; // seconds
  emoji: string;
  product: string;
  tip: string;
};

type FacialType = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  duration: string;
  steps: Step[];
  color: [string, string];
};

function buildFacials(c: Palette): FacialType[] {
  return [
  {
    id: 'morning',
    title: 'Morning Glow Routine',
    subtitle: 'Start your day with hydrated, protected skin',
    emoji: '☀️',
    duration: '~8 min',
    color: [c.primaryDark, c.primary],
    steps: [
      { title: 'Rinse & Wake', instruction: 'Splash your face with cool water. No cleanser needed in the morning — your skin cleaned itself overnight.', duration: 30, emoji: '💦', product: 'Cool water', tip: 'Cool water tightens pores and reduces morning puffiness.' },
      { title: 'Pat Dry', instruction: 'Gently pat skin dry with a clean towel. Never rub — this creates friction and micro-tears.', duration: 20, emoji: '🌿', product: 'Clean towel', tip: 'Use a fresh towel or paper towel to avoid bacterial transfer.' },
      { title: 'Apply Tallow Balm', instruction: 'Warm a pea-sized amount of TallowDermics Balm between your fingers. Press gently into damp skin using upward strokes.', duration: 60, emoji: '✨', product: 'TallowDermics Signature Balm', tip: 'Applying to damp skin locks in moisture — don\'t fully dry before applying.' },
      { title: 'Massage In', instruction: 'Use your fingertips to gently massage the balm in circular motions. Neck up to forehead. Stimulates circulation and lymphatic drainage.', duration: 90, emoji: '🙌', product: 'TallowDermics Balm', tip: 'Lymphatic massage reduces puffiness — always move upward and outward.' },
      { title: 'Apply SPF', instruction: 'Apply a generous amount of mineral SPF to your face, neck, and ears. Let it sit for 2 minutes before sun exposure.', duration: 60, emoji: '☀️', product: 'Mineral SPF 30+', tip: 'Wait 15-20 minutes before prolonged sun exposure for full protection.' },
      { title: 'Optional: Mist', instruction: 'Spritz a light mist of rosewater if desired. This adds a dewy finish and extra hydration.', duration: 15, emoji: '🌹', product: 'Rosewater mist (optional)', tip: 'Rosewater has anti-inflammatory properties and a natural, subtle scent.' },
    ],
  },
  {
    id: 'evening',
    title: 'Evening Ritual',
    subtitle: 'Reset, repair, and restore overnight',
    emoji: '🌙',
    duration: '~15 min',
    color: ['#1A1A2E', '#16213E'],
    steps: [
      { title: 'Oil Cleanse (Step 1)', instruction: 'Massage a small amount of tallow or facial oil into dry skin. This lifts makeup, sunscreen, and pollutants without stripping.', duration: 90, emoji: '🌿', product: 'TallowDermics Balm or facial oil', tip: 'Oil cleansing follows "like dissolves like" — oil removes oil-based dirt better than water.' },
      { title: 'Rinse or Emulsify', instruction: 'Add a few drops of water to emulsify the oil, then rinse with warm water. Or wipe off with a warm damp cloth.', duration: 30, emoji: '💧', product: 'Warm water + cloth', tip: 'Microfiber cloths are gentler than regular washcloths.' },
      { title: 'Gentle Cleanse (Step 2)', instruction: 'If wearing heavy makeup or SPF, do a second cleanse with a gentle, low-pH cleanser. If skin feels clean, skip this step.', duration: 60, emoji: '🧴', product: 'Gentle cleanser (optional)', tip: 'Double-cleansing is only necessary if you wore SPF or makeup. Skip on low-makeup days.' },
      { title: 'Pat Dry', instruction: 'Gently pat dry — leave skin slightly damp for better product absorption.', duration: 15, emoji: '✦', product: 'Clean towel', tip: 'Slightly damp skin absorbs moisturizers 3x better than dry skin.' },
      { title: 'Facial Massage', instruction: 'Use clean fingers to perform a 2-minute gua sha or facial massage. Sweep upward from neck to forehead. Stimulates collagen and lymph flow.', duration: 120, emoji: '🙌', product: 'Gua sha or clean hands', tip: 'Focus extra time on the jawline, under eyes, and forehead for tension release.' },
      { title: 'Apply Tallow Balm', instruction: 'Apply TallowDermics Balm generously as your night treatment. Your skin will absorb it fully as you sleep — wake up to softer, more supple skin.', duration: 60, emoji: '🌿', product: 'TallowDermics Signature Balm', tip: 'Your skin repairs itself overnight — giving it tallow\'s lipids gives it the building blocks it needs.' },
      { title: 'Gratitude Moment', instruction: 'Take 3 slow deep breaths. Your skin picked up on stress signals all day. This moment of calm signals safety and reduces cortisol.', duration: 30, emoji: '🧘', product: 'Just you', tip: 'Lower cortisol at night means better skin repair quality. Your skincare starts with your nervous system.' },
    ],
  },
  {
    id: 'weekly',
    title: 'Weekly Deep Cleanse',
    subtitle: 'A thorough reset for congested or dull skin',
    emoji: '✨',
    duration: '~20 min',
    color: ['#0F4C75', '#1B9AAA'],
    steps: [
      { title: 'Steam Your Face', instruction: 'Hold your face over a bowl of hot water for 5 minutes with a towel over your head. This opens pores and softens dead skin.', duration: 300, emoji: '🌫', product: 'Hot water, towel', tip: 'Add chamomile or rosemary to the water for extra soothing or anti-inflammatory benefits.' },
      { title: 'Manuka Honey Mask', instruction: 'Apply a thin layer of raw Manuka honey to your face. The MGO compound is antibacterial and gently exfoliates without irritation.', duration: 600, emoji: '🍯', product: 'Manuka honey (MGO 100+)', tip: 'Manuka works best left on for 10+ minutes. Its low pH kills acne bacteria while preserving the microbiome.' },
      { title: 'Rinse Thoroughly', instruction: 'Rinse with warm water using gentle circular motions. This also provides mild physical exfoliation.', duration: 60, emoji: '💦', product: 'Warm water', tip: 'Rinse with cold water at the end to close pores after the steam treatment.' },
      { title: 'Tone & Calm', instruction: 'Spray a light mist of rosewater or apply a toner to balance your skin\'s pH after cleansing.', duration: 20, emoji: '🌹', product: 'Rosewater mist', tip: 'Rosewater reduces redness from the steam and massage.' },
      { title: 'Nourish with Tallow', instruction: 'Apply a slightly more generous layer of TallowDermics Balm than usual. Your freshly cleansed skin is primed to absorb nutrients.', duration: 90, emoji: '🌿', product: 'TallowDermics Signature Balm', tip: 'Freshly exfoliated and cleansed skin absorbs active ingredients up to 40% better.' },
    ],
  },
  {
    id: 'barrier',
    title: 'Barrier Repair Session',
    subtitle: 'For reactive, irritated, or stripped skin',
    emoji: '🛡️',
    duration: '~10 min',
    color: ['#2D3748', '#4A5568'],
    steps: [
      { title: 'Skip the Cleanser', instruction: 'If your skin is irritated, skip cleansing tonight. Water rinse only. Over-cleansing is likely part of the problem.', duration: 30, emoji: '🚫', product: 'Cool water only', tip: 'When your barrier is compromised, every cleanse removes more of the protective acid mantle.' },
      { title: 'Assess Your Skin', instruction: 'Look closely at your skin. Where is it red, tight, flaking? Note the areas that need the most attention.', duration: 60, emoji: '🔍', product: 'Mirror', tip: 'Barrier damage often shows as redness, tightness, stinging from water, or sensitivity to products.' },
      { title: 'Layer Tallow Balm', instruction: 'Apply a thick, generous layer of TallowDermics Balm to your entire face and neck. Press firmly — don\'t rub.', duration: 90, emoji: '🌿', product: 'TallowDermics Signature Balm', tip: 'Tallow\'s saturated fats mimic the skin\'s own lipids — it rebuilds the barrier from the structural level.' },
      { title: 'Occlude if Needed', instruction: 'For very dry or cracked areas, apply a second layer of balm and leave overnight. This is "slugging" with ancestral ingredients.', duration: 60, emoji: '💧', product: 'TallowDermics Balm (extra layer)', tip: 'Occluding damaged skin overnight dramatically speeds barrier recovery.' },
      { title: 'Take Inventory', instruction: 'Think about what products caused this irritation. Consider eliminating actives (retinol, acids, vitamin C) for 1-2 weeks while your barrier heals.', duration: 60, emoji: '📋', product: 'Your mind', tip: 'A healed barrier can tolerate much more than a compromised one. Give it 1-2 weeks of gentle care.' },
    ],
  },
  ];
}

export default function GuidedFacial() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const FACIALS = useMemo(() => buildFacials(colors), [colors]);
  const [selected, setSelected] = useState<FacialType | null>(null);
  const [step, setStep] = useState(-1); // -1 = intro, -2 = complete
  const [timeLeft, setTimeLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  const currentStep = selected && step >= 0 && step < selected.steps.length ? selected.steps[step] : null;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startStep = (s: Step) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(s.duration);
    setRunning(false);
    progressAnim.setValue(0);
  };

  const toggleTimer = () => {
    if (!currentStep) return;
    if (running) {
      clearInterval(timerRef.current!);
      setRunning(false);
    } else {
      setRunning(true);
      const total = currentStep.duration;
      const start = Date.now();
      const startLeft = timeLeft;
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        const remaining = Math.max(0, startLeft - elapsed);
        setTimeLeft(remaining);
        Animated.timing(progressAnim, {
          toValue: 1 - remaining / total,
          duration: 100,
          useNativeDriver: false,
        }).start();
        if (remaining === 0) {
          clearInterval(timerRef.current!);
          setRunning(false);
        }
      }, 200);
    }
  };

  const goNext = () => {
    if (!selected) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
    const next = step + 1;
    if (next >= selected.steps.length) {
      setStep(-2); // complete
    } else {
      setStep(next);
      startStep(selected.steps[next]);
    }
  };

  const startFacial = (facial: FacialType) => {
    setSelected(facial);
    setStep(0);
    startStep(facial.steps[0]);
  };

  const resetAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSelected(null);
    setStep(-1);
    setRunning(false);
    setTimeLeft(0);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Completion screen
  if (step === -2 && selected) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back to start" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={resetAll}>
              <Ionicons name="home-outline" size={20} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>Complete!</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.completeCard}>
            <LinearGradient colors={selected.color} style={StyleSheet.absoluteFill} />
            <Text style={styles.completeEmoji}>✨</Text>
            <Text style={styles.completeTitle}>Facial Complete!</Text>
            <Text style={styles.completeSub}>{selected.title}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>You Just Completed:</Text>
            {selected.steps.map((s, i) => (
              <View key={i} style={styles.completeStepRow}>
                <Ionicons name="checkmark-circle" size={18} color="#4ADE80" />
                <Text style={styles.completeStepText}>{s.title}</Text>
              </View>
            ))}
          </View>
          <Pressable style={styles.scanBtn} onPress={() => { resetAll(); router.push('/scan'); }}>
            <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} />
            <Text style={styles.scanBtnText}>📸 Take a Scan to Track Progress</Text>
          </Pressable>
          <Pressable style={styles.againBtn} onPress={() => startFacial(selected)}>
            <Text style={styles.againText}>Do this facial again</Text>
          </Pressable>
          <Pressable style={styles.againBtn} onPress={resetAll}>
            <Text style={styles.againText}>Choose a different facial</Text>
          </Pressable>
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  // Active step screen
  if (currentStep && selected) {
    const stepProgress = step / selected.steps.length;
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={resetAll}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>Step {step + 1} of {selected.steps.length}</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>

        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: `${stepProgress * 100}%` as any }]} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.stepCard}>
            <LinearGradient colors={selected.color} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Text style={styles.stepEmoji}>{currentStep.emoji}</Text>
            <Text style={styles.stepTitle}>{currentStep.title}</Text>
            <Text style={styles.stepInstruction}>{currentStep.instruction}</Text>

            {/* Timer */}
            <View style={styles.timerSection}>
              <Text style={styles.timerDisplay}>{formatTime(timeLeft)}</Text>
              <View style={styles.timerBarWrap}>
                <Animated.View style={[styles.timerBarFill, {
                  width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                }]} />
              </View>
              <Pressable style={styles.timerBtn} onPress={toggleTimer}>
                <Ionicons name={running ? 'pause' : 'play'} size={22} color="white" />
                <Text style={styles.timerBtnText}>{running ? 'Pause' : timeLeft === currentStep.duration ? 'Start Timer' : 'Resume'}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.productCard}>
            <Text style={styles.productLabel}>PRODUCT</Text>
            <Text style={styles.productName}>{currentStep.product}</Text>
          </View>

          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={16} color={colors.gold} />
            <Text style={styles.tipText}>{currentStep.tip}</Text>
          </View>

          <Pressable style={styles.nextStepBtn} onPress={goNext}>
            <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} />
            <Text style={styles.nextStepBtnText}>
              {step < selected.steps.length - 1 ? `Next: ${selected.steps[step + 1].title} →` : 'Finish Facial ✨'}
            </Text>
          </Pressable>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  // Browse facials
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>Guided Facial</Text>
            <Text style={styles.headerSub}>Step-by-step skincare sessions</Text>
          </View>
          <View style={{ width: 36 }} />
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ opacity: contentAnim }}>

        <View style={styles.introCard}>
          <LinearGradient colors={['rgba(196,98,45,0.12)', 'rgba(196,98,45,0.02)']} style={StyleSheet.absoluteFill} />
          <Text style={styles.introEmoji}>🧖</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>Real-Time Skincare Guidance</Text>
            <Text style={styles.introSub}>Follow along with timed steps and expert tips for each product application.</Text>
          </View>
        </View>

        {FACIALS.map(facial => (
          <Pressable key={facial.id} style={styles.facialCard} onPress={() => startFacial(facial)}>
            <LinearGradient colors={facial.color} style={styles.facialGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={styles.facialContent}>
              <Text style={styles.facialEmoji}>{facial.emoji}</Text>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.facialTitle}>{facial.title}</Text>
                <Text style={styles.facialSub}>{facial.subtitle}</Text>
                <View style={styles.facialMeta}>
                  <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.facialMetaText}>{facial.duration}</Text>
                  <Text style={styles.facialMetaDot}>·</Text>
                  <Text style={styles.facialMetaText}>{facial.steps.length} steps</Text>
                </View>
              </View>
              <Ionicons name="play-circle" size={36} color="rgba(255,255,255,0.85)" />
            </View>
          </Pressable>
        ))}

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
  headerTitle: { fontSize: 20, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },
  progressBarOuter: { height: 3, backgroundColor: c.border },
  progressBarInner: { height: 3, backgroundColor: c.primary },

  introCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 14, marginBottom: 16 },
  introEmoji: { fontSize: 28 },
  introTitle: { fontSize: 14, fontWeight: '700', color: c.textPrimary },
  introSub: { fontSize: 12, color: c.textMuted, marginTop: 2, lineHeight: 18 },

  facialCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 12 },
  facialGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  facialContent: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 },
  facialEmoji: { fontSize: 36 },
  facialTitle: { fontSize: 17, fontWeight: '800', color: c.white },
  facialSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  facialMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  facialMetaText: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  facialMetaDot: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginHorizontal: 2 },

  // Active step
  stepCard: { borderRadius: 20, overflow: 'hidden', padding: 24, gap: 16, marginBottom: 16, alignItems: 'center', minHeight: 320, justifyContent: 'center' },
  stepEmoji: { fontSize: 56 },
  stepTitle: { fontSize: 22, fontWeight: '900', color: c.white, textAlign: 'center' },
  stepInstruction: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 24, textAlign: 'center' },
  timerSection: { alignItems: 'center', gap: 12, width: '100%', marginTop: 8 },
  timerDisplay: { fontSize: 48, fontWeight: '900', color: c.white },
  timerBarWrap: { width: '80%', height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 },
  timerBarFill: { height: 6, backgroundColor: '#4ADE80', borderRadius: 3 },
  timerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  timerBtnText: { fontSize: 14, fontWeight: '700', color: c.white },

  productCard: { backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 10, gap: 4 },
  productLabel: { fontSize: 9, fontWeight: '800', color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  productName: { fontSize: 15, fontWeight: '700', color: c.primary },

  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(212,169,106,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,169,106,0.2)', padding: 12, marginBottom: 16 },
  tipText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  nextStepBtn: { height: 54, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  nextStepBtnText: { fontSize: 15, fontWeight: '700', color: c.white },

  // Complete screen
  completeCard: { borderRadius: 24, overflow: 'hidden', padding: 40, alignItems: 'center', gap: 10, marginBottom: 20 },
  completeEmoji: { fontSize: 60 },
  completeTitle: { fontSize: 28, fontWeight: '900', color: c.white },
  completeSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },

  card: { backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 16, gap: 10, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  completeStepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  completeStepText: { fontSize: 14, color: c.textSecondary },

  scanBtn: { height: 54, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  scanBtnText: { fontSize: 15, fontWeight: '700', color: c.white },

  againBtn: { alignItems: 'center', paddingVertical: 12 },
  againText: { fontSize: 13, color: c.textMuted },
  });
}
