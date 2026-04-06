import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  Dimensions, TextInput, KeyboardAvoidingView, Platform, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import { Auth } from '../../src/services/auth';
import { UserProfile } from '../../src/types';

const { width } = Dimensions.get('window');

const SKIN_TYPES = ['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive'];
const CONCERNS = ['Acne & Breakouts', 'Dryness', 'Dark Spots', 'Fine Lines', 'Redness', 'Large Pores', 'Dullness', 'Sensitivity'];
const GOALS = ['Clear Skin', 'Deep Hydration', 'Anti-Aging', 'Even Tone', 'Barrier Repair', 'Natural Glow', 'Reduce Redness'];

const SLEEP_OPTIONS = [
  { value: 5, label: '< 6 hrs', emoji: '😴', sub: 'Sleep-deprived' },
  { value: 6, label: '6–7 hrs', emoji: '😐', sub: 'Under-slept' },
  { value: 7, label: '7–8 hrs', emoji: '😊', sub: 'Getting there' },
  { value: 8, label: '8+ hrs', emoji: '🌟', sub: 'Optimal' },
];

const WATER_OPTIONS = [
  { value: 'low', label: 'Rarely', emoji: '🏜️', sub: '1–3 glasses/day' },
  { value: 'moderate', label: 'Some', emoji: '💧', sub: '4–6 glasses/day' },
  { value: 'good', label: 'Good', emoji: '🌊', sub: '7–8 glasses/day' },
  { value: 'high', label: 'Excellent', emoji: '💦', sub: '8+ glasses/day' },
];

const DIET_OPTIONS = [
  { value: 'processed', label: 'Mostly processed', emoji: '🍔' },
  { value: 'mixed', label: 'Mixed', emoji: '🥗' },
  { value: 'balanced', label: 'Balanced whole foods', emoji: '🌿' },
  { value: 'clean', label: 'Clean / ancestral', emoji: '🥩' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [skinType, setSkinType] = useState('');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [sleepHours, setSleepHours] = useState(7);
  const [waterIntake, setWaterIntake] = useState('moderate');
  const [diet, setDiet] = useState('balanced');

  const totalSteps = 5;

  // Step transition animation
  const stepOpacity = useRef(new Animated.Value(1)).current;
  const stepSlide = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressWidth, {
      toValue: (step + 1) / totalSteps,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [step]);

  useEffect(() => {
    // Pulsing ambient glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.9, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const animateStepChange = (newStep: number) => {
    const direction = newStep > step ? 1 : -1;
    Animated.sequence([
      Animated.parallel([
        Animated.timing(stepOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(stepSlide, { toValue: -30 * direction, duration: 160, useNativeDriver: true }),
      ]),
    ]).start(() => {
      stepSlide.setValue(30 * direction);
      setStep(newStep);
      Animated.parallel([
        Animated.timing(stepOpacity, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(stepSlide, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
  };

  const toggleItem = (item: string, list: string[], setList: (l: string[]) => void) => {
    if (list.includes(item)) setList(list.filter(i => i !== item));
    else if (list.length < 3) setList([...list, item]);
  };

  const canProceed = () => {
    if (step === 0) return name.trim().length > 1;
    if (step === 1) return skinType !== '';
    if (step === 2) return concerns.length > 0;
    if (step === 3) return goals.length > 0;
    if (step === 4) return true; // lifestyle has defaults
    return false;
  };

  const handleFinish = async () => {
    const profile: UserProfile = {
      name: name.trim(),
      skinType: skinType.toLowerCase(),
      primaryConcerns: concerns,
      goals,
      lifestyle: { sleepHours, waterIntake, sunExposure: 'moderate', diet },
      onboardingComplete: true,
    };
    await Storage.saveUserProfile(profile);
    await Storage.setOnboarded();

    // Sync name to auth account if logged in, otherwise ensure guest session exists
    const user = await Auth.getCurrentUser();
    if (user) {
      await Auth.updateUser({ name: name.trim() });
    } else {
      // Ensure guests can get past the login screen next time they open the app
      await Auth.loginAsGuest();
    }

    router.replace('/(tabs)');
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#12080A']} style={styles.gradient}>
      {/* Ambient glow */}
      <Animated.View style={[styles.ambientGlow, { opacity: glowAnim }]} pointerEvents="none" />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>

          {/* Progress bar — animated gradient fill */}
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, {
                width: progressWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) as any,
              }]} />
            </View>
            <Text style={styles.progressLabel}>{step + 1} / {totalSteps}</Text>
          </View>

          <Animated.ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            style={{ opacity: stepOpacity, transform: [{ translateX: stepSlide }] }}
            showsVerticalScrollIndicator={false}
          >

            {step === 0 && (
              <View style={styles.stepWrap}>
                <Text style={styles.eyebrow}>WELCOME TO GLOWDERMICS</Text>
                <Text style={styles.heading}>What should we call you?</Text>
                <Text style={styles.sub}>Your personal AI skin coach starts here.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your first name"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  returnKeyType="done"
                />
              </View>
            )}

            {step === 1 && (
              <View style={styles.stepWrap}>
                <Text style={styles.eyebrow}>STEP 2 OF 5</Text>
                <Text style={styles.heading}>What's your skin type?</Text>
                <Text style={styles.sub}>We'll personalize everything around this.</Text>
                <View style={styles.chipGrid}>
                  {SKIN_TYPES.map(t => (
                    <Pressable
                      key={t}
                      style={[styles.chip, skinType === t && styles.chipActive]}
                      onPress={() => setSkinType(t)}
                    >
                      <Text style={[styles.chipText, skinType === t && styles.chipTextActive]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepWrap}>
                <Text style={styles.eyebrow}>STEP 3 OF 5</Text>
                <Text style={styles.heading}>Your biggest concerns?</Text>
                <Text style={styles.sub}>Pick up to 3. We'll target these first.</Text>
                <View style={styles.chipGrid}>
                  {CONCERNS.map(c => (
                    <Pressable
                      key={c}
                      style={[styles.chip, concerns.includes(c) && styles.chipActive]}
                      onPress={() => toggleItem(c, concerns, setConcerns)}
                    >
                      <Text style={[styles.chipText, concerns.includes(c) && styles.chipTextActive]}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepWrap}>
                <Text style={styles.eyebrow}>STEP 4 OF 5</Text>
                <Text style={styles.heading}>What are your skin goals?</Text>
                <Text style={styles.sub}>Pick up to 3. Your routine will be built around these.</Text>
                <View style={styles.chipGrid}>
                  {GOALS.map(g => (
                    <Pressable
                      key={g}
                      style={[styles.chip, goals.includes(g) && styles.chipActive]}
                      onPress={() => toggleItem(g, goals, setGoals)}
                    >
                      <Text style={[styles.chipText, goals.includes(g) && styles.chipTextActive]}>{g}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {step === 4 && (
              <View style={styles.stepWrap}>
                <Text style={styles.eyebrow}>STEP 5 OF 5</Text>
                <Text style={styles.heading}>Your lifestyle</Text>
                <Text style={styles.sub}>Your skin reflects your life. This helps the AI give better advice.</Text>

                <Text style={styles.lifestyleLabel}>How much do you sleep?</Text>
                <View style={styles.lifestyleRow}>
                  {SLEEP_OPTIONS.map(opt => (
                    <Pressable
                      key={opt.value}
                      style={[styles.lifestyleCard, sleepHours === opt.value && styles.lifestyleCardActive]}
                      onPress={() => setSleepHours(opt.value)}
                    >
                      <Text style={styles.lifestyleEmoji}>{opt.emoji}</Text>
                      <Text style={[styles.lifestyleCardLabel, sleepHours === opt.value && styles.lifestyleCardLabelActive]}>{opt.label}</Text>
                      <Text style={styles.lifestyleCardSub}>{opt.sub}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.lifestyleLabel, { marginTop: 24 }]}>Daily water intake?</Text>
                <View style={styles.lifestyleRow}>
                  {WATER_OPTIONS.map(opt => (
                    <Pressable
                      key={opt.value}
                      style={[styles.lifestyleCard, waterIntake === opt.value && styles.lifestyleCardActive]}
                      onPress={() => setWaterIntake(opt.value)}
                    >
                      <Text style={styles.lifestyleEmoji}>{opt.emoji}</Text>
                      <Text style={[styles.lifestyleCardLabel, waterIntake === opt.value && styles.lifestyleCardLabelActive]}>{opt.label}</Text>
                      <Text style={styles.lifestyleCardSub}>{opt.sub}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.lifestyleLabel, { marginTop: 24 }]}>How would you describe your diet?</Text>
                <View style={styles.chipGrid}>
                  {DIET_OPTIONS.map(opt => (
                    <Pressable
                      key={opt.value}
                      style={[styles.chip, diet === opt.value && styles.chipActive]}
                      onPress={() => setDiet(opt.value)}
                    >
                      <Text style={styles.chipText}>{opt.emoji} {opt.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

          </Animated.ScrollView>

          <View style={styles.footer}>
            {step > 0 && (
              <Pressable style={styles.backBtn} onPress={() => animateStepChange(step - 1)}>
                <Text style={styles.backText}>← Back</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
              onPress={() => step < totalSteps - 1 ? animateStepChange(step + 1) : handleFinish()}
              disabled={!canProceed()}
            >
              <LinearGradient
                colors={canProceed() ? [Colors.primaryLight, Colors.primary] : ['#333', '#222']}
                style={styles.nextGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Text style={styles.nextText}>{step === totalSteps - 1 ? 'Start My Journey →' : 'Continue →'}</Text>
              </LinearGradient>
            </Pressable>

          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
  ambientGlow: {
    position: 'absolute',
    top: -80,
    left: '50%',
    marginLeft: -160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#C4622D',
  },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 12 },
  progressTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  progressLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 },
  progressDot: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  progressDotActive: { backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 32 },
  stepWrap: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: Colors.primary, marginBottom: 12 },
  heading: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', lineHeight: 38, marginBottom: 10 },
  sub: { fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 22, marginBottom: 32 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, paddingHorizontal: 20, paddingVertical: 18,
    fontSize: 18, color: '#FFFFFF', fontWeight: '500',
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 40, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: 'rgba(196,98,45,0.25)' },
  chipText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
  lifestyleLabel: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 },
  lifestyleRow: { flexDirection: 'row', gap: 8 },
  lifestyleCard: {
    flex: 1, alignItems: 'center', padding: 12, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)', gap: 4,
  },
  lifestyleCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(196,98,45,0.2)' },
  lifestyleEmoji: { fontSize: 20 },
  lifestyleCardLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  lifestyleCardLabelActive: { color: Colors.primary },
  lifestyleCardSub: { fontSize: 9, color: 'rgba(255,255,255,0.35)', textAlign: 'center', fontWeight: '500' },
  footer: { padding: 24, flexDirection: 'row', gap: 12, alignItems: 'center' },
  backBtn: { paddingHorizontal: 16, paddingVertical: 14 },
  backText: { color: 'rgba(255,255,255,0.4)', fontSize: 15 },
  nextBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  nextBtnDisabled: { opacity: 0.4 },
  nextGradient: { paddingVertical: 18, alignItems: 'center' },
  nextText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
