import { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  Dimensions, useWindowDimensions, TextInput, KeyboardAvoidingView, Platform,
  StatusBar as RNStatusBar, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../src/constants/colors';
import { fonts } from '../../src/constants/typography';
import { Storage } from '../../src/services/storage';
import { Auth } from '../../src/services/auth';
import { UserProfile, RegionalFinding } from '../../src/types';
import { RegionalSkinMap, BiomarkerCloud, SkinAgeBadge } from '../../src/components/ui';
import { VelumiWordmark } from '../../src/components/ui/VelumiWordmark';

// Fallback for non-component contexts (worklets). The component overrides with useWindowDimensions.
const { width: SCREEN_W_FALLBACK, height: SCREEN_H } = Dimensions.get('window');
const TOTAL_PAGES = 5;

// On web, clamp to a phone-shaped width so the layout doesn't blow up in wide browser viewports.
function getEffectiveScreenW(rawWidth: number): number {
  if (Platform.OS === 'web') return Math.min(rawWidth, 480);
  return rawWidth;
}

// Sample regional findings used on the Regional preview page.
const SAMPLE_FINDINGS: RegionalFinding[] = [
  { region: 'forehead', severity: 'mild', observation: 'minor congestion' },
  { region: 'leftCheek', severity: 'moderate', observation: 'visible texture' },
  { region: 'rightCheek', severity: 'moderate', observation: 'diffuse erythema' },
  { region: 'nose', severity: 'moderate', observation: 'enlarged pores' },
  { region: 'chin', severity: 'none', observation: 'clear' },
  { region: 'eyeArea', severity: 'mild', observation: 'shadowing' },
  { region: 'jawline', severity: 'none', observation: 'smooth' },
];

const SAMPLE_BIOMARKERS = ['mild dehydration', 'uneven sebum', 'early UV signal'];

// 16 dimensions with their tints — used on the dimensions showcase page.
const DIMENSIONS = [
  { key: 'hydration',    label: 'Hydration',    tint: Colors.hydration,    icon: 'water-outline' as const },
  { key: 'texture',      label: 'Texture',      tint: Colors.texture,      icon: 'grid-outline' as const },
  { key: 'clarity',      label: 'Clarity',      tint: Colors.clarity,      icon: 'sparkles-outline' as const },
  { key: 'evenness',     label: 'Evenness',     tint: Colors.evenness,     icon: 'color-palette-outline' as const },
  { key: 'firmness',     label: 'Firmness',     tint: Colors.firmness,     icon: 'shield-checkmark-outline' as const },
  { key: 'pores',        label: 'Pores',        tint: Colors.pores,        icon: 'apps-outline' as const },
  { key: 'radiance',     label: 'Radiance',     tint: Colors.radiance,     icon: 'sunny-outline' as const },
  { key: 'redness',      label: 'Redness',      tint: Colors.redness,      icon: 'flame-outline' as const },
  { key: 'darkSpots',    label: 'Dark Spots',   tint: Colors.darkSpots,    icon: 'eyedrop-outline' as const },
  { key: 'darkCircles',  label: 'Dark Circles', tint: Colors.darkCircles,  icon: 'moon-outline' as const },
  { key: 'wrinkles',     label: 'Wrinkles',     tint: Colors.wrinkles,     icon: 'pulse-outline' as const },
  { key: 'acne',         label: 'Acne',         tint: Colors.acne,         icon: 'bandage-outline' as const },
  { key: 'oiliness',     label: 'Oil Balance',  tint: Colors.oiliness,     icon: 'leaf-outline' as const },
  { key: 'sensitivity',  label: 'Sensitivity',  tint: Colors.sensitivity,  icon: 'thermometer-outline' as const },
  { key: 'barrierHealth',label: 'Barrier',      tint: Colors.barrierHealth,icon: 'lock-closed-outline' as const },
  { key: 'overall',      label: 'Overall',      tint: Colors.primary,      icon: 'medal-outline' as const },
];

export default function Onboarding() {
  const isInvalidName = (s: string) => /[^a-zA-Z0-9 '\-.]/.test(s.trim());

  // Page width is the *measured* width of the pager container (set via onLayout
  // below). For a pagingEnabled ScrollView the page width MUST equal the
  // ScrollView's own width, otherwise paging math breaks. We do NOT trust
  // Dimensions/useWindowDimensions here — on react-native-web inside an iframe
  // it reports a stale/too-large value, which caused page overflow.
  const winDims = useWindowDimensions();
  const [SCREEN_W, setScreenW] = useState(() => getEffectiveScreenW(winDims.width));
  const screenWSV = useSharedValue(SCREEN_W);
  useEffect(() => { screenWSV.value = SCREEN_W; }, [SCREEN_W]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPagerLayout = (e: { nativeEvent: { layout: { width: number } } }) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w > 0 && w !== SCREEN_W) {
      // Re-anchor the scroll position to the current page at the new width.
      setScreenW(w);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ x: page * w, animated: false });
      });
    }
  };

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Reanimated shared values (UI-thread).
  const ambientGlow = useSharedValue(0.4);
  const progress = useSharedValue(0);
  const scrollX = useSharedValue(0);

  useEffect(() => {
    ambientGlow.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.4, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => { cancelAnimation(ambientGlow); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    progress.value = withTiming((page + 1) / TOTAL_PAGES, { duration: 380, easing: Easing.out(Easing.cubic) });
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (next: number) => {
    const target = Math.max(0, Math.min(TOTAL_PAGES - 1, next));
    scrollRef.current?.scrollTo({ x: target * SCREEN_W, animated: true });
    setPage(target);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.value = e.nativeEvent.contentOffset.x;
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (next !== page) setPage(next);
  };

  const canProceedFromCurrent = () => {
    if (page === 0) return name.trim().length > 1 && !isInvalidName(name);
    return true;
  };

  const finish = async (route: 'scan' | 'tabs') => {
    const profile: UserProfile = {
      name: name.trim() || 'Friend',
      skinType: 'normal',
      primaryConcerns: [],
      goals: [],
      lifestyle: { sleepHours: 7, waterIntake: 'moderate', sunExposure: 'moderate', diet: 'mixed' },
      onboardingComplete: true,
    };
    await Storage.saveUserProfile(profile);
    await Storage.setOnboarded();

    const user = await Auth.getCurrentUser();
    if (user) {
      await Auth.updateUser({ name: profile.name });
    } else {
      await Auth.loginAsGuest();
    }

    if (route === 'scan') {
      router.replace('/scan');
    } else {
      router.replace('/(tabs)');
    }
  };

  // Ambient glow style.
  const glowStyle = useAnimatedStyle(() => ({ opacity: ambientGlow.value }));

  // Progress bar.
  const progressFillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.root}>
      <RNStatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0A0608', '#150C07', '#0D0805', '#12090A']}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient terracotta glow at top */}
      <Animated.View
        style={[styles.ambientGlow, { left: SCREEN_W / 2 - 220 }, glowStyle]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['rgba(138,120,96,0.55)', 'rgba(138,120,96,0)']}
          style={{ flex: 1, borderRadius: 200 }}
        />
      </Animated.View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
          {/* Top bar — progress + skip */}
          <View style={styles.topBar}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, progressFillStyle]}>
                <LinearGradient
                  colors={[Colors.primaryLight, Colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
            {page < TOTAL_PAGES - 1 && (
              <Pressable hitSlop={8} onPress={() => finish('tabs')}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            )}
          </View>

          {/* Pages — paginated horizontal scroll */}
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            onLayout={onPagerLayout}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            // Disable user swipe past unfilled name prompt — they must input first.
            scrollEnabled={page > 0 || canProceedFromCurrent()}
            style={styles.scroll}
          >
            <PageWelcome
              isActive={page === 0}
              screenW={SCREEN_W}
              name={name}
              setName={v => {
                setName(v);
                setNameError(isInvalidName(v) ? 'Letters, numbers, and spaces only.' : '');
              }}
              nameError={nameError}
            />
            <PageSixteenDimensions isActive={page === 1} screenW={SCREEN_W} />
            <PageRegionalMap isActive={page === 2} screenW={SCREEN_W} />
            <PageCoachAndAge isActive={page === 3} screenW={SCREEN_W} />
            <PageFirstScan isActive={page === 4} screenW={SCREEN_W} name={name} onScan={() => finish('scan')} onLater={() => finish('tabs')} />
          </ScrollView>

          {/* Footer — back / continue */}
          <View style={styles.footer}>
            {page > 0 && page < TOTAL_PAGES - 1 ? (
              <Pressable style={styles.backBtn} hitSlop={8} onPress={() => goTo(page - 1)}>
                <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
                <Text style={styles.backText}>Back</Text>
              </Pressable>
            ) : (
              <View style={{ width: 80 }} />
            )}

            <View style={styles.dotRow}>
              {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
                <Dot key={i} index={i} scrollX={scrollX} screenWSV={screenWSV} />
              ))}
            </View>

            {page < TOTAL_PAGES - 1 ? (
              <Pressable
                style={[styles.nextBtn, !canProceedFromCurrent() && styles.nextBtnDisabled]}
                disabled={!canProceedFromCurrent()}
                onPress={() => goTo(page + 1)}
              >
                <LinearGradient
                  colors={canProceedFromCurrent() ? [Colors.primaryLight, Colors.primary] : ['#3A2E26', '#2A211B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.nextGrad}
                >
                  <Text style={styles.nextText}>Next</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.white} />
                </LinearGradient>
              </Pressable>
            ) : (
              <View style={{ width: 80 }} />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

/* ---------- Pagination dots ---------- */

function Dot({ index, scrollX, screenWSV }: {
  index: number;
  scrollX: ReturnType<typeof useSharedValue<number>>;
  screenWSV: ReturnType<typeof useSharedValue<number>>;
}) {
  const style = useAnimatedStyle(() => {
    const w = screenWSV.value || 1;
    const distance = Math.abs(scrollX.value - index * w);
    const t = Math.max(0, 1 - distance / w);
    return {
      width: interpolate(t, [0, 1], [6, 22]),
      opacity: interpolate(t, [0, 1], [0.35, 1]),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

/* ---------- Page 1: Welcome + name ---------- */

function PageWelcome({
  isActive,
  screenW,
  name,
  setName,
  nameError,
}: {
  isActive: boolean;
  screenW: number;
  name: string;
  setName: (s: string) => void;
  nameError: string;
}) {
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const headlineY = useSharedValue(20);
  const headlineOpacity = useSharedValue(0);
  const inputY = useSharedValue(30);
  const inputOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    if (!isActive) return;
    logoScale.value = withSpring(1, { damping: 9, stiffness: 110 });
    logoOpacity.value = withTiming(1, { duration: 480 });
    headlineY.value = withDelay(280, withSpring(0, { damping: 12, stiffness: 130 }));
    headlineOpacity.value = withDelay(280, withTiming(1, { duration: 380 }));
    taglineOpacity.value = withDelay(520, withTiming(1, { duration: 380 }));
    inputY.value = withDelay(720, withSpring(0, { damping: 12, stiffness: 130 }));
    inputOpacity.value = withDelay(720, withTiming(1, { duration: 380 }));
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const headStyle = useAnimatedStyle(() => ({
    opacity: headlineOpacity.value,
    transform: [{ translateY: headlineY.value }],
  }));
  const tagStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const inputStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
    transform: [{ translateY: inputY.value }],
  }));

  return (
    <View style={[styles.page, { width: screenW }]}>
      <View style={styles.pageContent}>
        <Animated.View style={[styles.welcomeLogo, logoStyle]}>
          <VelumiWordmark size="lg" useLogo tagline={false} />
        </Animated.View>

        <Animated.View style={headStyle}>
          <Text style={styles.eyebrow}>WELCOME TO VELUMI AI</Text>
          <Text style={styles.heading}>Your skin,{'\n'}decoded.</Text>
        </Animated.View>

        <Animated.Text style={[styles.welcomeTagline, tagStyle]}>
          Clinical-grade AI skin analysis in 30 seconds. What should we call you?
        </Animated.Text>

        <Animated.View style={[styles.welcomeInputWrap, inputStyle]}>
          <TextInput
            style={styles.welcomeInput}
            placeholder="Your first name"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </Animated.View>
      </View>
    </View>
  );
}

/* ---------- Page 2: 16 Dimensions ---------- */

function PageSixteenDimensions({ isActive, screenW }: { isActive: boolean; screenW: number }) {
  const headOpacity = useSharedValue(0);
  const headY = useSharedValue(20);
  const tileOpacities = DIMENSIONS.map(() => useSharedValue(0));
  const tileScales = DIMENSIONS.map(() => useSharedValue(0.6));

  useEffect(() => {
    if (!isActive) return;
    headOpacity.value = withTiming(1, { duration: 380 });
    headY.value = withSpring(0, { damping: 13, stiffness: 130 });
    tileOpacities.forEach((sv, i) => {
      sv.value = withDelay(120 + i * 50, withTiming(1, { duration: 320 }));
    });
    tileScales.forEach((sv, i) => {
      sv.value = withDelay(120 + i * 50, withSpring(1, { damping: 11, stiffness: 180 }));
    });
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const headStyle = useAnimatedStyle(() => ({
    opacity: headOpacity.value,
    transform: [{ translateY: headY.value }],
  }));

  return (
    <View style={[styles.page, { width: screenW }]}>
      <View style={styles.pageContent}>
        <Animated.View style={headStyle}>
          <Text style={styles.eyebrow}>HOW IT WORKS</Text>
          <Text style={styles.heading}>16 clinical dimensions.{'\n'}One photo.</Text>
          <Text style={styles.sub}>
            Most apps score 5–7 metrics. We score 16 — matching the depth of dermatology-grade
            biomarker tools.
          </Text>
        </Animated.View>

        <View style={styles.dimGrid}>
          {DIMENSIONS.map((d, i) => (
            <DimensionTile
              key={d.key}
              label={d.label}
              tint={d.tint}
              icon={d.icon}
              opacity={tileOpacities[i]}
              scale={tileScales[i]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function DimensionTile({
  label,
  tint,
  icon,
  opacity,
  scale,
}: {
  label: string;
  tint: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  opacity: ReturnType<typeof useSharedValue<number>>;
  scale: ReturnType<typeof useSharedValue<number>>;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={[styles.dimTile, { borderColor: tint + '55', backgroundColor: tint + '14' }, style]}>
      <Ionicons name={icon} size={18} color={tint} />
      <Text style={[styles.dimTileText, { color: tint }]}>{label}</Text>
    </Animated.View>
  );
}

/* ---------- Page 3: Regional Map preview ---------- */

function PageRegionalMap({ isActive, screenW }: { isActive: boolean; screenW: number }) {
  const headOpacity = useSharedValue(0);
  const headY = useSharedValue(20);
  const mapOpacity = useSharedValue(0);
  const mapScale = useSharedValue(0.85);

  useEffect(() => {
    if (!isActive) return;
    headOpacity.value = withTiming(1, { duration: 380 });
    headY.value = withSpring(0, { damping: 13, stiffness: 130 });
    mapOpacity.value = withDelay(220, withTiming(1, { duration: 480 }));
    mapScale.value = withDelay(220, withSpring(1, { damping: 11, stiffness: 130 }));
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const headStyle = useAnimatedStyle(() => ({
    opacity: headOpacity.value,
    transform: [{ translateY: headY.value }],
  }));
  const mapStyle = useAnimatedStyle(() => ({
    opacity: mapOpacity.value,
    transform: [{ scale: mapScale.value }],
  }));

  return (
    <View style={[styles.page, { width: screenW }]}>
      <View style={styles.pageContent}>
        <Animated.View style={headStyle}>
          <Text style={styles.eyebrow}>SEE WHERE TO FOCUS</Text>
          <Text style={styles.heading}>Regional analysis.</Text>
          <Text style={styles.sub}>
            Every scan maps 7 zones — forehead, cheeks, nose, chin, eye area, jawline. Tap a
            zone for detail.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.mapWrap, mapStyle]}>
          <RegionalSkinMap findings={SAMPLE_FINDINGS} width={Math.min(screenW - 80, 280)} />
        </Animated.View>
      </View>
    </View>
  );
}

/* ---------- Page 4: AI Coach + Skin Age ---------- */

function PageCoachAndAge({ isActive, screenW }: { isActive: boolean; screenW: number }) {
  const headOpacity = useSharedValue(0);
  const headY = useSharedValue(20);
  const ageOpacity = useSharedValue(0);
  const bubbleOpacity = useSharedValue(0);
  const bubbleY = useSharedValue(30);
  const cloudOpacity = useSharedValue(0);

  useEffect(() => {
    if (!isActive) return;
    headOpacity.value = withTiming(1, { duration: 380 });
    headY.value = withSpring(0, { damping: 13, stiffness: 130 });
    ageOpacity.value = withDelay(220, withTiming(1, { duration: 480 }));
    bubbleOpacity.value = withDelay(380, withTiming(1, { duration: 380 }));
    bubbleY.value = withDelay(380, withSpring(0, { damping: 12, stiffness: 130 }));
    cloudOpacity.value = withDelay(560, withTiming(1, { duration: 380 }));
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const headStyle = useAnimatedStyle(() => ({
    opacity: headOpacity.value,
    transform: [{ translateY: headY.value }],
  }));
  const ageStyle = useAnimatedStyle(() => ({ opacity: ageOpacity.value }));
  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [{ translateY: bubbleY.value }],
  }));
  const cloudStyle = useAnimatedStyle(() => ({ opacity: cloudOpacity.value }));

  return (
    <View style={[styles.page, { width: screenW }]}>
      <View style={styles.pageContent}>
        <Animated.View style={headStyle}>
          <Text style={styles.eyebrow}>BEYOND SCORES</Text>
          <Text style={styles.heading}>Skin age + AI coach.</Text>
          <Text style={styles.sub}>
            Get a biological skin-age estimate, biomarker tags, and a chat coach grounded in
            your actual scores.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.coachStack, ageStyle]}>
          <SkinAgeBadge skinAge={{ estimated: 27, bracket: 'younger' }} delay={0} />
        </Animated.View>

        <Animated.View style={[styles.bubble, bubbleStyle]}>
          <View style={styles.bubbleAvatar}>
            <Ionicons name="sparkles" size={14} color={Colors.white} />
          </View>
          <View style={styles.bubbleBody}>
            <Text style={styles.bubbleSpeaker}>Vera</Text>
            <Text style={styles.bubbleText}>
              Your hydration is at 68 — bumping it 10pts with HA + ceramides should lift
              radiance and pore visibility too. Want a routine?
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={cloudStyle}>
          <Text style={styles.bubbleCaption}>Plus biomarker tags from your scan</Text>
          <BiomarkerCloud biomarkers={SAMPLE_BIOMARKERS} delay={0} />
        </Animated.View>
      </View>
    </View>
  );
}

/* ---------- Page 5: Take first scan CTA ---------- */

function PageFirstScan({
  isActive,
  screenW,
  name,
  onScan,
  onLater,
}: {
  isActive: boolean;
  screenW: number;
  name: string;
  onScan: () => void;
  onLater: () => void;
}) {
  const heroScale = useSharedValue(0.7);
  const heroOpacity = useSharedValue(0);
  const pulse = useSharedValue(0);
  const headOpacity = useSharedValue(0);
  const headY = useSharedValue(20);
  const ctaOpacity = useSharedValue(0);
  const ctaY = useSharedValue(30);

  useEffect(() => {
    if (!isActive) return;
    heroScale.value = withSpring(1, { damping: 9, stiffness: 110 });
    heroOpacity.value = withTiming(1, { duration: 480 });
    headOpacity.value = withDelay(220, withTiming(1, { duration: 380 }));
    headY.value = withDelay(220, withSpring(0, { damping: 13, stiffness: 130 }));
    ctaOpacity.value = withDelay(420, withTiming(1, { duration: 380 }));
    ctaY.value = withDelay(420, withSpring(0, { damping: 13, stiffness: 130 }));
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isActive) cancelAnimation(pulse);
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ scale: heroScale.value }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + pulse.value * 0.45,
    transform: [{ scale: 0.9 + pulse.value * 0.25 }],
  }));
  const headStyle = useAnimatedStyle(() => ({
    opacity: headOpacity.value,
    transform: [{ translateY: headY.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaY.value }],
  }));

  const greeting = name.trim() ? `Ready, ${name.trim()}?` : 'Ready?';

  return (
    <View style={[styles.page, { width: screenW }]}>
      <View style={[styles.pageContent, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={styles.scanIconWrap}>
          <Animated.View style={[styles.scanHalo, haloStyle]} pointerEvents="none" />
          <Animated.View style={[styles.scanIconCircle, heroStyle]}>
            <LinearGradient
              colors={['#B79B6E', '#8A7860']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="scan" size={48} color={Colors.white} />
          </Animated.View>
        </View>

        <Animated.View style={[{ alignItems: 'center', marginTop: 28 }, headStyle]}>
          <Text style={[styles.eyebrow, { textAlign: 'center' }]}>YOUR FIRST SCAN</Text>
          <Text style={[styles.heading, { textAlign: 'center' }]}>{greeting}</Text>
          <Text style={[styles.sub, { textAlign: 'center', maxWidth: 320 }]}>
            Tap below to capture a photo. We'll deliver your full skin profile in about 30
            seconds — no account needed.
          </Text>
        </Animated.View>

        <Animated.View style={[{ width: '100%', gap: 12, marginTop: 36 }, ctaStyle]}>
          <Pressable style={styles.scanCta} onPress={onScan}>
            <LinearGradient
              colors={['#B79B6E', '#8A7860']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="camera" size={20} color={Colors.white} />
            <Text style={styles.scanCtaText}>Take My First Scan</Text>
          </Pressable>

          <Pressable style={styles.laterBtn} onPress={onLater} hitSlop={6}>
            <Text style={styles.laterText}>Maybe later — explore the app</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0608' },
  safe: { flex: 1 },
  kav: { flex: 1 },

  ambientGlow: {
    position: 'absolute',
    top: -180,
    left: SCREEN_W_FALLBACK / 2 - 220,
    width: 440,
    height: 440,
    borderRadius: 220,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  skipText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.5,
  },

  scroll: { flex: 1 },
  page: { width: SCREEN_W_FALLBACK, flex: 1 },
  pageContent: { flex: 1, paddingHorizontal: 28, paddingTop: 24, paddingBottom: 12 },

  eyebrow: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2.4,
    color: Colors.primary,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: 34,
    fontWeight: '600',
    color: Colors.white,
    lineHeight: 41,
    letterSpacing: 0.2,
    marginBottom: 14,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.62)',
    lineHeight: 23,
    fontWeight: '500',
    marginBottom: 22,
    letterSpacing: 0.1,
  },

  /* Page 1 — welcome */
  welcomeLogo: {
    alignSelf: 'center',
    marginBottom: 28,
    shadowColor: Colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  welcomeLogoGrad: {
    width: 96,
    height: 96,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeLogoMark: {
    fontSize: 44,
    color: Colors.white,
    textShadowColor: 'rgba(255,255,255,0.4)',
    textShadowRadius: 10,
  },
  welcomeTagline: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.62)',
    lineHeight: 23,
    fontWeight: '500',
    marginBottom: 28,
    letterSpacing: 0.1,
  },
  welcomeInputWrap: { gap: 6 },
  welcomeInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    color: Colors.white,
    fontWeight: '600',
  },
  errorText: { color: '#F87171', fontSize: 13, marginTop: 6, fontWeight: '500' },

  /* Page 2 — 16 dimensions */
  dimGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  dimTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  dimTileText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },

  /* Page 3 — regional */
  mapWrap: {
    alignItems: 'center',
    marginTop: 12,
    flex: 1,
    justifyContent: 'center',
  },

  /* Page 4 — coach + age */
  coachStack: { marginTop: 4, marginBottom: 16 },
  bubble: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderTopLeftRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    marginBottom: 18,
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleBody: { flex: 1 },
  bubbleSpeaker: { fontSize: 11, fontWeight: '900', color: Colors.primary, letterSpacing: 0.5, marginBottom: 4 },
  bubbleText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 19, fontWeight: '500' },
  bubbleCaption: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  /* Page 5 — first scan CTA */
  scanIconWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  scanHalo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(138,120,96,0.30)',
    shadowColor: Colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  scanIconCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 18,
    overflow: 'hidden',
  },
  scanCtaText: { fontSize: 17, fontWeight: '800', color: Colors.white, letterSpacing: -0.2 },
  laterBtn: { paddingVertical: 12, alignItems: 'center' },
  laterText: { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },

  /* Footer */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: 80,
  },
  backText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  nextBtn: {
    width: 96,
    borderRadius: 14,
    overflow: 'hidden',
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
  },
  nextText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '700', color: Colors.white, letterSpacing: 0.4 },
});
