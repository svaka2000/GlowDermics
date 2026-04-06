import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  Dimensions, TextInput, KeyboardAvoidingView, Platform,
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
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>

          {/* Progress bar */}
          <View style={styles.progressWrap}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

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

          </ScrollView>

          <View style={styles.footer}>
            {step > 0 && (
              <Pressable style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
                <Text style={styles.backText}>← Back</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
              onPress={() => step < totalSteps - 1 ? setStep(s => s + 1) : handleFinish()}
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
  progressWrap: { flexDirection: 'row', gap: 8, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 8 },
  progressDot: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Colors.border },
  progressDotActive: { backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 32 },
  stepWrap: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: Colors.primary, marginBottom: 12 },
  heading: { fontSize: 30, fontWeight: '800', color: Colors.textPrimary, lineHeight: 38, marginBottom: 10 },
  sub: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 32 },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, paddingHorizontal: 20, paddingVertical: 18,
    fontSize: 18, color: Colors.textPrimary, fontWeight: '500',
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 40, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: 'rgba(196,98,45,0.15)' },
  chipText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
  lifestyleLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  lifestyleRow: { flexDirection: 'row', gap: 8 },
  lifestyleCard: {
    flex: 1, alignItems: 'center', padding: 12, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard, gap: 4,
  },
  lifestyleCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(196,98,45,0.12)' },
  lifestyleEmoji: { fontSize: 20 },
  lifestyleCardLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  lifestyleCardLabelActive: { color: Colors.primary },
  lifestyleCardSub: { fontSize: 9, color: Colors.textMuted, textAlign: 'center', fontWeight: '500' },
  footer: { padding: 24, flexDirection: 'row', gap: 12, alignItems: 'center' },
  backBtn: { paddingHorizontal: 16, paddingVertical: 14 },
  backText: { color: Colors.textMuted, fontSize: 15 },
  nextBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  nextBtnDisabled: { opacity: 0.5 },
  nextGradient: { paddingVertical: 18, alignItems: 'center' },
  nextText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
