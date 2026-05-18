import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Modal, Platform, ScrollView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { Auth } from '../services/auth';
import { TierCard, TierFeature, SocialProofStrip } from './ui';

interface PremiumGateProps {
  visible: boolean;
  onClose: () => void;
  feature?: string;
  reason?: string; // e.g. "You've used 3/3 free scans this month"
}

type TierId = 'free' | 'premium' | 'ultra';
type BillingPeriod = 'monthly' | 'annual';

interface TierConfig {
  id: TierId;
  name: string;
  tagline: string;
  monthly: number;       // monthly USD when billed monthly
  annual: number;        // monthly USD when billed annually (lower)
  annualTotal: number;   // total billed once per year
  features: TierFeature[];
  recommended?: boolean;
  eyebrow?: string;
}

const TIERS: TierConfig[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Get started',
    monthly: 0,
    annual: 0,
    annualTotal: 0,
    features: [
      { label: '3 scans / month', included: true },
      { label: '10 coach messages / day', included: true },
      { label: 'Basic skin scorecard', included: true },
      { label: 'Unlimited scans + coach', included: false },
      { label: 'Regional analysis & skin age', included: false },
      { label: 'PDF reports + export', included: false },
      { label: 'Dermatologist consult', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'For your daily routine',
    monthly: 4.99,
    annual: 3.33,
    annualTotal: 39.99,
    recommended: true,
    eyebrow: 'MOST POPULAR',
    features: [
      { label: 'Unlimited scans', included: true, highlight: true },
      { label: 'Unlimited AI coach', included: true, highlight: true },
      { label: 'Regional analysis & skin age', included: true },
      { label: '16-dim biomarker tracking', included: true },
      { label: 'PDF reports + photo timeline', included: true },
      { label: 'Priority AI processing', included: true },
      { label: 'Dermatologist consult', included: false },
    ],
  },
  {
    id: 'ultra',
    name: 'Ultra',
    tagline: 'Clinical-grade results',
    monthly: 9.99,
    annual: 6.66,
    annualTotal: 79.99,
    features: [
      { label: 'Everything in Premium', included: true, highlight: true },
      { label: '1:1 dermatologist consult / month', included: true, highlight: true },
      { label: 'Custom routine builder', included: true },
      { label: 'Family sharing (up to 4)', included: true },
      { label: 'Early access to new features', included: true },
      { label: 'Dedicated skin coach DM', included: true },
      { label: 'Priority human support', included: true },
    ],
  },
];

export function PremiumGate({ visible, onClose, feature, reason }: PremiumGateProps) {
  const [selected, setSelected] = useState<TierId>('premium');
  const [billing, setBilling] = useState<BillingPeriod>('annual');
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  // Reset state every time the gate opens.
  useEffect(() => {
    if (visible) {
      setSelected('premium');
      setBilling('annual');
      setActivated(false);
    }
  }, [visible]);

  const billingToggleX = useSharedValue(billing === 'annual' ? 1 : 0);
  useEffect(() => {
    billingToggleX.value = withSpring(billing === 'annual' ? 1 : 0, { damping: 14, stiffness: 220 });
  }, [billing]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: billingToggleX.value * 96 }],
  }));

  const selectedTier = useMemo(() => TIERS.find(t => t.id === selected) ?? TIERS[1], [selected]);

  const handleActivate = async () => {
    if (selected === 'free') {
      // Free is the current state; just dismiss.
      onClose();
      return;
    }

    // Guests can't have premium — send them to register
    const isGuest = await Auth.isGuest();
    const user = await Auth.getCurrentUser();
    if (isGuest || !user) {
      onClose();
      if (Platform.OS === 'web') {
        setTimeout(() => router.push('/(auth)/register'), 100);
      } else {
        Alert.alert(
          'Create an Account',
          'Premium is available to registered users. Create a free account to start your trial.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Sign Up', onPress: () => router.push('/(auth)/register') },
          ],
        );
      }
      return;
    }

    setActivating(true);
    try {
      // NOTE: Real Stripe wiring (per-tier SKU + period) is a Tier 2 backlog item.
      // For now any paid tier flips `isPremium = true` via the existing API.
      await Auth.activatePremium();
      setActivated(true);
      setTimeout(() => {
        setActivated(false);
        onClose();
      }, 1800);
    } catch {
      if (Platform.OS === 'web') {
        window.alert('Could not activate. Please try again.');
      } else {
        Alert.alert('Error', 'Could not activate. Please try again.');
      }
    }
    setActivating(false);
  };

  const ctaLabel = (() => {
    if (activating) return 'Activating…';
    if (selected === 'free') return 'Stick with Free';
    const price = billing === 'annual' ? selectedTier.annual : selectedTier.monthly;
    return `Start 7-day free trial · then $${price.toFixed(2)}/mo`;
  })();

  const sheetContent = (
    <View style={styles.sheet}>
      <View style={styles.handle} />
      {activated ? (
        <ActivatedView />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={styles.scroll}>
          <Hero />

          {feature && (
            <Text style={styles.featureLabel}>
              Unlocks <Text style={{ color: Colors.primary, fontWeight: '900' }}>{feature}</Text>
            </Text>
          )}
          {reason && <ReasonBadge reason={reason} />}

          <SocialProofStrip rating={4.9} userCount={24800} delay={120} />

          {/* Billing toggle */}
          <View style={styles.toggleWrap}>
            <Animated.View style={[styles.toggleSelector, toggleStyle]} />
            <Pressable style={styles.toggleBtn} onPress={() => setBilling('monthly')}>
              <Text style={[styles.toggleText, billing === 'monthly' && styles.toggleTextActive]}>
                Monthly
              </Text>
            </Pressable>
            <Pressable style={styles.toggleBtn} onPress={() => setBilling('annual')}>
              <Text style={[styles.toggleText, billing === 'annual' && styles.toggleTextActive]}>
                Annual
              </Text>
              <View style={styles.toggleSavingsTag}>
                <Text style={styles.toggleSavingsText}>SAVE 33%</Text>
              </View>
            </Pressable>
          </View>

          {/* Tier cards */}
          <View style={styles.tiersStack}>
            {TIERS.map((t, i) => {
              const monthlyPrice =
                t.id === 'free' ? '$0' : `$${(billing === 'annual' ? t.annual : t.monthly).toFixed(2)}`;
              const priceSub =
                t.id === 'free'
                  ? 'Forever'
                  : billing === 'annual'
                  ? `Billed annually · $${t.annualTotal.toFixed(2)}/yr`
                  : 'Billed monthly · cancel anytime';
              const priceStrike =
                billing === 'annual' && t.id !== 'free'
                  ? `$${t.monthly.toFixed(2)}`
                  : undefined;
              return (
                <TierCard
                  key={t.id}
                  id={t.id}
                  name={t.name}
                  tagline={t.tagline}
                  eyebrow={t.eyebrow}
                  recommended={t.recommended}
                  selected={selected === t.id}
                  onSelect={() => setSelected(t.id)}
                  delay={i * 120}
                  price={`${monthlyPrice}${t.id === 'free' ? '' : '/mo'}`}
                  priceStrike={priceStrike}
                  priceSub={priceSub}
                  features={t.features}
                />
              );
            })}
          </View>

          {/* Testimonial pill */}
          <Testimonial />

          {/* Activate CTA */}
          <Pressable
            style={[styles.cta, activating && { opacity: 0.7 }]}
            onPress={handleActivate}
            disabled={activating}
          >
            <LinearGradient
              colors={
                selected === 'free'
                  ? ['#A6A29A', '#73706B']
                  : selected === 'ultra'
                  ? ['#0F1F33', '#1A2A44']
                  : ['#F0C94A', '#E8834A', '#C4622D']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGrad}
            >
              {selected !== 'free' && <Ionicons name="rocket" size={16} color="#fff" />}
              <Text style={styles.ctaText}>{ctaLabel}</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={onClose} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>Maybe later</Text>
          </Pressable>

          <Text style={styles.finePrint}>
            Cancel anytime · No commitment · Data stays private · Trial converts to billing on day 8
          </Text>
        </ScrollView>
      )}
    </View>
  );

  // On web, Modal renders as a browser-level portal and escapes the phone frame.
  if (Platform.OS === 'web') {
    if (!visible) return null;
    return (
      <View style={[StyleSheet.absoluteFillObject, styles.webOverlay]}>
        <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onClose} />
        {sheetContent}
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {sheetContent}
      </View>
    </Modal>
  );
}

/* ---------- Sub-components ---------- */

function Hero() {
  const heroScale = useSharedValue(0.7);
  const heroOpacity = useSharedValue(0);
  const halo = useSharedValue(0);

  useEffect(() => {
    heroScale.value = withSpring(1, { damping: 11, stiffness: 130 });
    heroOpacity.value = withTiming(1, { duration: 400 });
    halo.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => { cancelAnimation(halo); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const iconStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ scale: heroScale.value }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.15 + halo.value * 0.4,
    transform: [{ scale: 1 + halo.value * 0.18 }],
  }));

  return (
    <View style={styles.heroWrap}>
      <Animated.View style={[styles.heroHalo, haloStyle]} pointerEvents="none" />
      <Animated.View style={[styles.heroIcon, iconStyle]}>
        <LinearGradient
          colors={['#F0C94A', '#E8834A', '#C4622D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="diamond" size={28} color="#fff" />
      </Animated.View>
      <Text style={styles.heroTitle}>Unlock Velumi AI Premium</Text>
      <Text style={styles.heroSub}>
        Clinical-grade analysis, unlimited scans, and a coach trained on dermatology consensus.
      </Text>
    </View>
  );
}

function ActivatedView() {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 9, stiffness: 130 });
    opacity.value = withTiming(1, { duration: 400 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  return (
    <View style={styles.successWrap}>
      <Animated.View style={[styles.successCircle, style]}>
        <Ionicons name="checkmark" size={36} color="#fff" />
      </Animated.View>
      <Text style={styles.successTitle}>Welcome to Premium</Text>
      <Text style={styles.successSub}>Your free trial starts now. Cancel anytime in Settings.</Text>
    </View>
  );
}

function ReasonBadge({ reason }: { reason: string }) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(8);
  useEffect(() => {
    opacity.value = withDelay(80, withTiming(1, { duration: 320 }));
    y.value = withDelay(80, withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));
  return (
    <Animated.View style={[styles.reasonBox, style]}>
      <Ionicons name="information-circle" size={14} color={Colors.primary} />
      <Text style={styles.reasonText}>{reason}</Text>
    </Animated.View>
  );
}

const TESTIMONIALS = [
  { quote: 'Cleared my hormonal acne in 6 weeks.', author: '— Maya, 28' },
  { quote: 'The regional map nailed exactly what I felt.', author: '— Jordan, 34' },
  { quote: 'Better than my $200 esthetician consult.', author: '— Priya, 41' },
];

function Testimonial() {
  const [idx, setIdx] = useState(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const timer = setInterval(() => {
      opacity.value = withTiming(0, { duration: 220 }, finished => {
        if (finished) {
          // setState callback can't run inside worklet; use runOnJS via plain JS scheduling
        }
      });
      setTimeout(() => {
        setIdx(i => (i + 1) % TESTIMONIALS.length);
        opacity.value = withTiming(1, { duration: 280 });
      }, 240);
    }, 4500);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const t = TESTIMONIALS[idx];

  return (
    <View style={styles.testWrap}>
      <View style={styles.testQuoteIcon}>
        <Ionicons name="chatbubble-ellipses" size={12} color={Colors.primary} />
      </View>
      <Animated.View style={[{ flex: 1 }, style]}>
        <Text style={styles.testQuote}>"{t.quote}"</Text>
        <Text style={styles.testAuthor}>{t.author}</Text>
      </Animated.View>
    </View>
  );
}

/* ---------- Inline banner used in feature screens ---------- */

export function PremiumBanner({ onUpgrade, message }: { onUpgrade: () => void; message: string }) {
  return (
    <Pressable style={styles.banner} onPress={onUpgrade}>
      <LinearGradient
        colors={['rgba(212,169,106,0.18)', 'rgba(196,98,45,0.10)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bannerStar}>
        <Ionicons name="diamond" size={12} color={Colors.gold} />
      </View>
      <Text style={styles.bannerText}>{message}</Text>
      <View style={styles.bannerBtn}>
        <LinearGradient
          colors={['#F0C94A', '#E8834A', '#C4622D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.bannerBtnText}>Try free</Text>
      </View>
    </Pressable>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  webOverlay: {
    zIndex: 9999,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 18,
    paddingBottom: 32,
    overflow: 'hidden',
    maxHeight: '92%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginVertical: 10,
  },
  scroll: { paddingBottom: 16 },

  /* Hero */
  heroWrap: { alignItems: 'center', paddingTop: 6, paddingBottom: 14 },
  heroHalo: {
    position: 'absolute',
    top: -10,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(232,131,74,0.35)',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#C4622D',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
    paddingHorizontal: 16,
    fontWeight: '500',
  },

  featureLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginVertical: 8,
    fontWeight: '600',
  },

  reasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(196,98,45,0.08)',
    borderRadius: 12,
    padding: 11,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(196,98,45,0.20)',
  },
  reasonText: { fontSize: 12, color: Colors.textSecondary, flex: 1, fontWeight: '600' },

  /* Billing toggle */
  toggleWrap: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(28,24,20,0.06)',
    borderRadius: 999,
    padding: 4,
    marginVertical: 14,
    width: 200,
    position: 'relative',
  },
  toggleSelector: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 96,
    height: 32,
    borderRadius: 999,
    backgroundColor: Colors.bgCard,
    shadowColor: '#1C1814',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  toggleBtn: {
    width: 96,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  toggleText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  toggleTextActive: { color: Colors.textPrimary, fontWeight: '900' },
  toggleSavingsTag: {
    backgroundColor: Colors.scoreExcellent,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
  },
  toggleSavingsText: { fontSize: 8, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },

  /* Tier cards */
  tiersStack: { gap: 10, marginVertical: 6 },

  /* Testimonial */
  testWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(28,24,20,0.04)',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    marginBottom: 6,
  },
  testQuoteIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(196,98,45,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testQuote: { fontSize: 12, color: Colors.textPrimary, fontWeight: '600', fontStyle: 'italic' },
  testAuthor: { fontSize: 10, color: Colors.textMuted, marginTop: 2, fontWeight: '700', letterSpacing: 0.4 },

  /* CTA */
  cta: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 14,
    shadowColor: '#C4622D',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  ctaGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
  },
  ctaText: { fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 0.2 },

  dismissBtn: { alignItems: 'center', paddingVertical: 10, marginTop: 4 },
  dismissText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },

  finePrint: {
    fontSize: 10.5,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 15,
  },

  /* Success state */
  successWrap: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24, gap: 14 },
  successCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.scoreExcellent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.scoreExcellent,
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  successTitle: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  successSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  /* Inline banner */
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(196,98,45,0.30)',
    padding: 12,
    marginBottom: 16,
  },
  bannerStar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(212,169,106,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: { flex: 1, fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },
  bannerBtn: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    overflow: 'hidden',
  },
  bannerBtnText: { fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
});
