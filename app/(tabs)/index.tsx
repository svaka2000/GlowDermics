import { useCallback, useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, ActivityIndicator, RefreshControl, Alert,
  Animated, Easing,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import { Auth, AuthUser } from '../../src/services/auth';
import { SkinAnalysis, UserProfile } from '../../src/types';
import { ScoreRing } from '../../src/components/ScoreRing';
import { ScoreBar } from '../../src/components/ScoreBar';

const WATER_KEY = 'gd_water';
const WATER_GOAL = 8;

async function getWaterToday(): Promise<number> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const today = new Date().toDateString();
    const raw = await AsyncStorage.getItem(WATER_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    return data[today] ?? 0;
  } catch { return 0; }
}

async function setWaterToday(glasses: number): Promise<void> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const today = new Date().toDateString();
    const raw = await AsyncStorage.getItem(WATER_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[today] = Math.max(0, Math.min(glasses, 12));
    await AsyncStorage.setItem(WATER_KEY, JSON.stringify(data));
  } catch {}
}

const SKIN_TIPS = [
  { tip: 'Less is more. A 2-step routine done consistently beats a 10-step routine done once a week.', tag: 'ROUTINE' },
  { tip: "Your skin barrier needs fat, not water. That's why tallow outperforms every water-based moisturizer.", tag: 'SCIENCE' },
  { tip: 'SPF is the only anti-aging ingredient with decades of clinical proof behind it. Use it daily.', tag: 'PROTECTION' },
  { tip: 'Changing products too often is one of the top causes of sensitive skin. Give products 4-6 weeks.', tag: 'PATIENCE' },
  { tip: 'Dehydrated skin produces more oil to compensate. If you have oily skin, you might just need more moisture.', tag: 'HYDRATION' },
  { tip: "Your skin renews itself every 28 days. That's how long it takes to actually see results from a new product.", tag: 'TIMELINE' },
  { tip: 'Manuka honey is antibacterial without stripping your microbiome. Regular honey lacks the MGO compound.', tag: 'INGREDIENTS' },
  { tip: 'Pillowcases harbour bacteria and oils. Change yours every 3-4 days for clearer skin — overnight.', tag: 'LIFESTYLE' },
  { tip: "Tallow's oleic acid content (45%) nearly matches human sebum. It absorbs, not just sits.", tag: 'SCIENCE' },
  { tip: 'The longer an ingredient list, the more chances for irritation. Minimal formulas win long-term.', tag: 'FORMULATION' },
];

function getDailyTip() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return SKIN_TIPS[dayOfYear % SKIN_TIPS.length];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [latest, setLatest] = useState<SkinAnalysis | null>(null);
  const [streak, setStreak] = useState(0);
  const [habitScore, setHabitScore] = useState(0);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [routineToday, setRoutineToday] = useState({ morning: false, evening: false });
  const [journalToday, setJournalToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<{ title: string; emoji: string; daysComplete: number; duration: number; todayDone: boolean } | null>(null);

  // Entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const scanCardAnim = useRef(new Animated.Value(0)).current;
  const scanCardScale = useRef(new Animated.Value(0.96)).current;
  const quickAnim = useRef(new Animated.Value(0)).current;
  const lowerAnim = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Pulsing glow on scan card
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.6, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const runEntranceAnims = () => {
    headerAnim.setValue(0);
    statsAnim.setValue(0);
    scanCardAnim.setValue(0);
    scanCardScale.setValue(0.96);
    quickAnim.setValue(0);
    lowerAnim.setValue(0);
    Animated.stagger(80, [
      Animated.timing(headerAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(statsAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(scanCardAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scanCardScale, { toValue: 1, duration: 500, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      ]),
      Animated.timing(quickAnim, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(lowerAnim, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  const load = async () => {
    const [p, a, s, w, routineLog, journal, user] = await Promise.all([
      Storage.getUserProfile(),
      Storage.getLatestAnalysis(),
      Storage.getStreak(),
      getWaterToday(),
      Storage.getTodayRoutineLog(),
      Storage.getJournal(),
      Auth.getCurrentUser(),
    ]);
    setProfile(p);
    setAuthUser(user);
    setLatest(a);
    setStreak(s);
    setWaterGlasses(w);
    setRoutineToday(routineLog);
    const today = new Date().toDateString();
    setJournalToday(journal.some(j => new Date(j.date).toDateString() === today));
    // Load today's habit score
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const HABITS_KEY = 'gd_daily_habits';
      const TOTAL_HABITS = 12;
      const raw = await AsyncStorage.getItem(HABITS_KEY);
      if (raw) {
        const logs = JSON.parse(raw);
        const today = new Date().toDateString();
        const todayLog = logs.find((l: any) => l.date === today);
        if (todayLog) setHabitScore(Math.round((todayLog.checked.length / TOTAL_HABITS) * 100));
      }
    } catch {}
    // Load active challenge
    try {
      const CHALLENGE_KEY = 'gd_active_challenge';
      const CHALLENGES_MAP: Record<string, { title: string; emoji: string; duration: number }> = {
        'tallow-30': { title: '30-Day Tallow Switch', emoji: '🌿', duration: 30 },
        'full-routine-21': { title: '21-Day Routine Reset', emoji: '🌅', duration: 21 },
        'hydration-14': { title: '14-Day Glow Hydration', emoji: '💧', duration: 14 },
        'minimal-7': { title: '7-Day Minimal Routine', emoji: '✨', duration: 7 },
        'sleep-skin-14': { title: '14-Day Sleep for Skin', emoji: '🌙', duration: 14 },
        'no-touch-7': { title: '7-Day No-Touch Face', emoji: '🤲', duration: 7 },
      };
      const raw = await AsyncStorage.getItem(CHALLENGE_KEY);
      if (raw) {
        const ch = JSON.parse(raw);
        const meta = CHALLENGES_MAP[ch.challengeId];
        if (meta) {
          const today = new Date().toDateString();
          setActiveChallenge({
            title: meta.title, emoji: meta.emoji,
            daysComplete: ch.completedDays.length,
            duration: meta.duration,
            todayDone: ch.completedDays.includes(today),
          });
        }
      } else {
        setActiveChallenge(null);
      }
    } catch {}
    setLoading(false);
    runEntranceAnims();
  };

  const adjustWater = async (delta: number) => {
    const next = Math.max(0, Math.min(12, waterGlasses + delta));
    setWaterGlasses(next);
    await setWaterToday(next);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const dailyTip = getDailyTip();

  if (loading) {
    return (
      <View style={styles.loadWrap}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <Animated.View style={{
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
        }}>
          <SafeAreaView edges={['top']}>
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>{getGreeting()},</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.name}>{authUser?.name || profile?.name || 'Friend'}</Text>
                  {authUser?.isPremium && (
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumBadgeText}>PRO</Text>
                    </View>
                  )}
                </View>
              </View>
              <Pressable style={styles.profileBtn} onPress={() => router.push('/(tabs)/settings')}>
                <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>{(authUser?.name || profile?.name || '?')[0]?.toUpperCase()}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>

        {/* Streak + stats row */}
        <Animated.View style={{
          opacity: statsAnim,
          transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }}>
        <View style={styles.statsRow}>
          <Pressable style={styles.statCard} onPress={() => router.push('/habits')}>
            <Text style={styles.statNum}>{streak}</Text>
            <Text style={styles.statLabel}>🔥 Streak</Text>
          </Pressable>
          <Pressable style={styles.statCard} onPress={() => latest ? router.push(`/results/${latest.id}`) : router.push('/scan')}>
            <Text style={styles.statNum}>{latest ? latest.scores.overall : '—'}</Text>
            <Text style={styles.statLabel}>Score</Text>
          </Pressable>
          <Pressable style={styles.statCard} onPress={() => router.push('/habits')}>
            <Text style={styles.statNum}>{habitScore > 0 ? `${habitScore}%` : '—'}</Text>
            <Text style={styles.statLabel}>Habits</Text>
          </Pressable>
          <Pressable style={styles.statCard} onPress={() => router.push('/journal')}>
            <Text style={styles.statNum}>{profile?.primaryConcerns?.length || 0}</Text>
            <Text style={styles.statLabel}>Concerns</Text>
          </Pressable>
        </View>
        </Animated.View>

        {/* Active Challenge widget */}
        {activeChallenge && (
          <Pressable style={styles.challengeWidget} onPress={() => router.push('/challenge')}>
            <LinearGradient colors={['rgba(196,98,45,0.12)', 'rgba(196,98,45,0.03)']} style={StyleSheet.absoluteFill} />
            <Text style={styles.challengeEmoji}>{activeChallenge.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.challengeLabel}>ACTIVE CHALLENGE</Text>
              <Text style={styles.challengeTitle}>{activeChallenge.title}</Text>
              <View style={styles.challengeBarWrap}>
                <View style={[styles.challengeBarFill, { width: `${Math.min(100, (activeChallenge.daysComplete / activeChallenge.duration) * 100)}%` as any }]} />
              </View>
              <Text style={styles.challengeProgress}>{activeChallenge.daysComplete}/{activeChallenge.duration} days</Text>
            </View>
            {activeChallenge.todayDone
              ? <Ionicons name="checkmark-circle" size={24} color="#4ADE80" />
              : <View style={styles.challengeCheckBtn}><Text style={styles.challengeCheckBtnText}>Check In</Text></View>
            }
          </Pressable>
        )}

        {/* Daily Check-In CTA */}
        {!journalToday && (
          <Pressable style={styles.checkInCta} onPress={() => router.push('/checkin')}>
            <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Text style={styles.checkInEmoji}>✦</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.checkInTitle}>Daily Check-In</Text>
              <Text style={styles.checkInSub}>Log routine · water · habits · mood</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
          </Pressable>
        )}

        {/* Smart Today Focus */}
        {(() => {
          const hour = new Date().getHours();
          const daysSinceScan = latest
            ? Math.floor((Date.now() - new Date(latest.date).getTime()) / 86400000)
            : 999;

          // Determine priority focus
          if (!latest && !profile?.onboardingComplete) return null;

          const items: { icon: string; label: string; action: () => void; color: string }[] = [];

          if (hour >= 5 && hour < 12 && !routineToday.morning) {
            items.push({ icon: '🌅', label: 'Log morning routine', action: () => router.push('/(tabs)/routine'), color: Colors.gold });
          }
          if (hour >= 18 && !routineToday.evening) {
            items.push({ icon: '🌙', label: 'Log evening routine', action: () => router.push('/(tabs)/routine'), color: '#6B85A8' });
          }
          if (waterGlasses < 4 && hour >= 14) {
            items.push({ icon: '💧', label: 'Drink more water — only ' + waterGlasses + ' glasses so far', action: () => adjustWater(1), color: '#60A5FA' });
          }
          if (!journalToday) {
            items.push({ icon: '📝', label: 'Log today\'s mood', action: () => router.push('/journal'), color: Colors.primary });
          }
          if (daysSinceScan >= 7) {
            items.push({ icon: '📸', label: `No scan in ${daysSinceScan} days — check your progress`, action: () => router.push('/scan'), color: Colors.scoreGood });
          }

          if (items.length === 0) return (
            <View style={styles.focusCard}>
              <Text style={styles.focusEmoji}>✨</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.focusTitle}>You're all caught up!</Text>
                <Text style={styles.focusSub}>Routines logged · Journal done · Hydrated</Text>
              </View>
            </View>
          );

          const top = items[0];
          return (
            <Pressable style={styles.focusCard} onPress={top.action}>
              <Text style={styles.focusEmoji}>{top.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.focusTag, { color: top.color }]}>TODAY'S FOCUS</Text>
                <Text style={styles.focusTitle}>{top.label}</Text>
                {items.length > 1 && <Text style={styles.focusSub}>+{items.length - 1} more action{items.length > 2 ? 's' : ''} pending</Text>}
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </Pressable>
          );
        })()}

        {/* Primary scan CTA */}
        <Animated.View style={{
          opacity: scanCardAnim,
          transform: [{ scale: scanCardScale }],
        }}>
          <Pressable style={styles.scanCard} onPress={() => router.push('/scan')}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            {/* Pulsing glow overlay */}
            <Animated.View
              style={[StyleSheet.absoluteFill, {
                opacity: glowPulse,
                borderRadius: 22,
              }]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.12)', 'transparent', 'rgba(255,255,255,0.06)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
            </Animated.View>
            <View style={styles.scanCardContent}>
              <View>
                <Text style={styles.scanCardEyebrow}>AI SKIN SCAN</Text>
                <Text style={styles.scanCardTitle}>
                  {latest ? 'Scan Again' : 'Take Your First Scan'}
                </Text>
                <Text style={styles.scanCardSub}>
                  {latest
                    ? `Last scanned ${new Date(latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : 'Get your full skin analysis in 30 seconds'}
                </Text>
              </View>
              <Animated.View style={[styles.scanIconCircle, {
                transform: [{ scale: glowPulse.interpolate({ inputRange: [0.6, 1], outputRange: [1, 1.06] }) }],
              }]}>
                <Ionicons name="scan" size={30} color={Colors.white} />
              </Animated.View>
            </View>
          </Pressable>
        </Animated.View>

        {/* Skin Age + Scorecard teasers */}
        {latest && (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            <Pressable style={[styles.teaser, { flex: 1 }]} onPress={() => router.push('/skin-age')}>
              <LinearGradient colors={['rgba(107,133,168,0.15)', 'rgba(107,133,168,0.05)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.teaserEmoji}>⏳</Text>
              <Text style={styles.teaserTitle}>Skin Age</Text>
              <Text style={styles.teaserSub}>Is your skin older or younger than you?</Text>
              <Text style={styles.teaserCta}>Discover →</Text>
            </Pressable>
            <Pressable style={[styles.teaser, { flex: 1 }]} onPress={() => router.push('/skin-scorecard')}>
              <LinearGradient colors={['rgba(196,98,45,0.15)', 'rgba(196,98,45,0.05)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.teaserEmoji}>📊</Text>
              <Text style={styles.teaserTitle}>Scorecard</Text>
              <Text style={styles.teaserSub}>Share your skin journey with the world</Text>
              <Text style={styles.teaserCta}>Generate →</Text>
            </Pressable>
          </View>
        )}

        {/* Latest scan summary */}
        {latest && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Analysis</Text>
              <Pressable onPress={() => router.push(`/results/${latest.id}`)}>
                <Text style={styles.seeAll}>Full Report →</Text>
              </Pressable>
            </View>

            <Pressable style={styles.analysisCard} onPress={() => router.push(`/results/${latest.id}`)}>
              <View style={styles.analysisTop}>
                {latest.imageUri ? (
                  <Image source={{ uri: latest.imageUri }} style={styles.analysisThumb} />
                ) : (
                  <View style={[styles.analysisThumb, styles.analysisThumbEmpty]}>
                    <Ionicons name="person" size={26} color={Colors.textMuted} />
                  </View>
                )}
                <View style={styles.analysisInfo}>
                  <View style={styles.skinTypeBadge}>
                    <Text style={styles.skinTypeText}>{latest.skinType?.toUpperCase()} SKIN</Text>
                  </View>
                  <View style={styles.concernChips}>
                    {latest.concerns.slice(0, 2).map(c => (
                      <View key={c} style={styles.concernChip}>
                        <Text style={styles.concernText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.analysisDate}>
                    {new Date(latest.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
                <ScoreRing score={latest.scores.overall} size={72} />
              </View>

              <View style={styles.scoreGrid}>
                {[
                  { label: 'Hydration', val: latest.scores.hydration },
                  { label: 'Texture', val: latest.scores.texture },
                  { label: 'Clarity', val: latest.scores.clarity },
                  { label: 'Evenness', val: latest.scores.evenness },
                ].map(({ label, val }) => (
                  <ScoreBar key={label} label={label} value={val} />
                ))}
              </View>

              {latest.insights ? (
                <View style={styles.insightBox}>
                  <Ionicons name="bulb-outline" size={14} color={Colors.gold} />
                  <Text style={styles.insightText} numberOfLines={2}>{latest.insights}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        )}

        {/* Quick actions — 2 rows of 3 */}
        <Animated.View style={{
          opacity: quickAnim,
          transform: [{ translateY: quickAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            <Pressable style={styles.quickCard} onPress={() => router.push('/scanner')}>
              <LinearGradient colors={['rgba(196,98,45,0.15)', 'rgba(196,98,45,0.05)']} style={StyleSheet.absoluteFill} />
              <Ionicons name="flask-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Ingredient{'\n'}Scanner</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/dupes')}>
              <Ionicons name="cash-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Dupe{'\n'}Finder</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/goals')}>
              <Ionicons name="flag-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Skin{'\n'}Goals</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/journal')}>
              <Ionicons name="journal-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Skin{'\n'}Journal</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/quiz')}>
              <Ionicons name="help-circle-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Skin{'\n'}Quiz</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/learn')}>
              <Ionicons name="book-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Skin{'\n'}Lab</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/habits')}>
              <Ionicons name="checkmark-done-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Daily{'\n'}Habits</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/milestones')}>
              <LinearGradient colors={['rgba(196,98,45,0.15)', 'rgba(196,98,45,0.05)']} style={StyleSheet.absoluteFill} />
              <Ionicons name="trophy-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Mile{'\n'}stones</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/products')}>
              <Ionicons name="cube-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>My{'\n'}Shelf</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/sensitivity')}>
              <Ionicons name="shield-checkmark-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Sensitivity{'\n'}Test</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/forecast')}>
              <Ionicons name="sparkles-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Skin{'\n'}Forecast</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/seasonal')}>
              <Ionicons name="sunny-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Seasonal{'\n'}Guide</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/skin-weather')}>
              <Ionicons name="partly-sunny-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Skin{'\n'}Weather</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/challenge')}>
              <LinearGradient colors={['rgba(196,98,45,0.15)', 'rgba(196,98,45,0.05)']} style={StyleSheet.absoluteFill} />
              <Ionicons name="flash-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>30-Day{'\n'}Challenge</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/community')}>
              <LinearGradient colors={['rgba(196,98,45,0.15)', 'rgba(196,98,45,0.05)']} style={StyleSheet.absoluteFill} />
              <Ionicons name="people-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Commu{'\n'}nity</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/skin-scorecard')}>
              <Ionicons name="ribbon-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Score{'\n'}Card</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/skin-age')}>
              <Ionicons name="hourglass-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Skin{'\n'}Age</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/weekly-digest')}>
              <Ionicons name="newspaper-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Weekly{'\n'}Digest</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/skin-report')}>
              <LinearGradient colors={['rgba(212,169,106,0.15)', 'rgba(212,169,106,0.05)']} style={StyleSheet.absoluteFill} />
              <Ionicons name="document-text-outline" size={22} color={Colors.gold} />
              <Text style={[styles.quickLabel, { color: Colors.gold }]}>Skin{'\n'}Report</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/scan-gallery')}>
              <Ionicons name="images-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Photo{'\n'}Gallery</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/skin-dna')}>
              <LinearGradient colors={['rgba(196,98,45,0.15)', 'rgba(196,98,45,0.05)']} style={StyleSheet.absoluteFill} />
              <Ionicons name="git-network-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Skin{'\n'}DNA</Text>
            </Pressable>
          </View>
        </View>
        </Animated.View>

        <Animated.View style={{
          opacity: lowerAnim,
          transform: [{ translateY: lowerAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
        }}>

        {/* Community Spotlight */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Community</Text>
            <Pressable onPress={() => router.push('/community')}>
              <Text style={styles.seeAll}>View All →</Text>
            </Pressable>
          </View>
          <Pressable style={styles.communityCard} onPress={() => router.push('/community')}>
            <LinearGradient
              colors={[Colors.primary + '14', Colors.primary + '04']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.communityStats}>
              {[
                { num: '24K+', label: 'Active Today' },
                { num: '8.2K', label: 'Scans Today' },
                { num: '#1', label: 'Skincare App' },
              ].map(s => (
                <View key={s.label} style={styles.communityStat}>
                  <Text style={styles.communityStatNum}>{s.num}</Text>
                  <Text style={styles.communityStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.communityBottom}>
              <View style={styles.communityAvatars}>
                {['S', 'A', 'M', 'Y', 'C'].map((l, i) => (
                  <View key={i} style={[styles.communityAvatar, { marginLeft: i === 0 ? 0 : -8, zIndex: 5 - i }]}>
                    <Text style={styles.communityAvatarText}>{l}</Text>
                  </View>
                ))}
                <Text style={styles.communityAvatarMore}>+24K</Text>
              </View>
              <View style={styles.communityJoinBtn}>
                <Text style={styles.communityJoinText}>See Leaderboard →</Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Water tracker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hydration Tracker</Text>
          <View style={styles.waterCard}>
            <View style={styles.waterTop}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
                <Ionicons name="water" size={20} color="#4A90D9" />
                <Text style={styles.waterCount}>{waterGlasses}</Text>
                <Text style={styles.waterGoal}>/ {WATER_GOAL} glasses</Text>
              </View>
              <View style={styles.waterControls}>
                <Pressable style={styles.waterBtn} onPress={() => adjustWater(-1)}>
                  <Ionicons name="remove" size={18} color={Colors.textPrimary} />
                </Pressable>
                <Pressable style={[styles.waterBtn, styles.waterBtnAdd]} onPress={() => adjustWater(1)}>
                  <Ionicons name="add" size={18} color={Colors.white} />
                </Pressable>
              </View>
            </View>

            {/* Fill bar */}
            <View style={styles.waterBarTrack}>
              <LinearGradient
                colors={['#60A5FA', '#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.waterBarFill, { width: `${Math.min(100, (waterGlasses / WATER_GOAL) * 100)}%` as any }]}
              />
              {waterGlasses >= WATER_GOAL && (
                <View style={styles.waterBarShine} />
              )}
            </View>

            {/* Glass markers */}
            <View style={styles.waterMarkers}>
              {Array.from({ length: WATER_GOAL }).map((_, i) => (
                <Pressable key={i} onPress={() => adjustWater(i + 1 - waterGlasses)} style={styles.waterMarkerBtn}>
                  <View style={[styles.waterMarkerTick, i < waterGlasses && styles.waterMarkerTickFilled]} />
                  {(i === 0 || i === Math.floor(WATER_GOAL / 2) - 1 || i === WATER_GOAL - 1) && (
                    <Text style={styles.waterMarkerLabel}>{i + 1}</Text>
                  )}
                </Pressable>
              ))}
            </View>

            <View style={styles.waterFooter}>
              {waterGlasses >= WATER_GOAL ? (
                <View style={styles.waterDone}>
                  <Ionicons name="checkmark-circle" size={14} color="#3B82F6" />
                  <Text style={styles.waterDoneText}>Daily goal reached — great for your skin!</Text>
                </View>
              ) : waterGlasses > 0 ? (
                <Text style={styles.waterProgress}>{WATER_GOAL - waterGlasses} more to reach your goal</Text>
              ) : (
                <Text style={styles.waterProgress}>Tap + to log your first glass today</Text>
              )}
              <Text style={styles.waterPct}>{Math.round((waterGlasses / WATER_GOAL) * 100)}%</Text>
            </View>
          </View>
        </View>

        {/* Daily tip */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Tip</Text>
          <View style={styles.tipCard}>
            <LinearGradient colors={['rgba(212,169,106,0.12)', 'rgba(212,169,106,0.04)']} style={StyleSheet.absoluteFill} />
            <View style={styles.tipHeader}>
              <View style={styles.tipTagWrap}>
                <Text style={styles.tipTag}>{dailyTip.tag}</Text>
              </View>
              <Text style={styles.tipCalendar}>
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <Text style={styles.tipText}>"{dailyTip.tip}"</Text>
            <Text style={styles.tipSource}>— GlowDermics Skin Science</Text>
          </View>
        </View>

        {/* Empty state */}
        {!latest && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyTitle}>Your skin story starts here</Text>
            <Text style={styles.emptySub}>Take a photo scan for scored metrics, or try the quiz for instant text-based recommendations.</Text>
            <Pressable style={styles.emptyQuizBtn} onPress={() => router.push('/quiz')}>
              <Text style={styles.emptyQuizText}>Take Skin Quiz (no camera) →</Text>
            </Pressable>
          </View>
        )}

        </Animated.View>

        {/* Brand strip */}
        <View style={styles.brandStrip}>
          <Text style={styles.brandEyebrow}>POWERED BY TALLOWDERMICS SCIENCE</Text>
          <Text style={styles.brandTagline}>4 ingredients. Ancestral wisdom. Zero synthetic fillers.</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  loadWrap: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 20 },
  greeting: { fontSize: 13, color: Colors.textMuted },
  name: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  premiumBadge: {
    backgroundColor: Colors.primary, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'center',
  },
  premiumBadgeText: { fontSize: 8, fontWeight: '900', color: '#fff', letterSpacing: 0.8 },
  profileBtn: {},
  profileAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { fontSize: 18, fontWeight: '800', color: Colors.white },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, padding: 14, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  statNum: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', textAlign: 'center' },

  scanCard: {
    borderRadius: 22, overflow: 'hidden', marginBottom: 24,
  },
  scanCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 22 },
  scanCardEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  scanCardTitle: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  scanCardSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  scanIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
  },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  analysisCard: {
    backgroundColor: Colors.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  analysisTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  analysisThumb: { width: 66, height: 66, borderRadius: 12, backgroundColor: Colors.bgElevated },
  analysisThumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  analysisInfo: { flex: 1, gap: 6 },
  skinTypeBadge: { backgroundColor: 'rgba(196,98,45,0.12)', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  skinTypeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Colors.primary },
  concernChips: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  concernChip: { backgroundColor: 'rgba(212,169,106,0.12)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  concernText: { fontSize: 10, color: Colors.gold, fontWeight: '600' },
  analysisDate: { fontSize: 11, color: Colors.textMuted },
  scoreGrid: { gap: 10, marginBottom: 14 },
  insightBox: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: 'rgba(212,169,106,0.08)', borderRadius: 10, padding: 10,
  },
  insightText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, flex: 1 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    width: '31%', backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
    alignItems: 'center', gap: 8, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  quickLabel: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', lineHeight: 15 },

  tipCard: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(212,169,106,0.2)', padding: 20,
  },
  tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  tipTagWrap: { backgroundColor: 'rgba(212,169,106,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tipTag: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Colors.gold },
  tipCalendar: { fontSize: 11, color: Colors.textMuted },
  tipText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 24, fontStyle: 'italic', marginBottom: 10 },
  tipSource: { fontSize: 11, color: Colors.textMuted },

  emptyState: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 32, color: Colors.primary, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  brandStrip: {
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(196,98,45,0.12)',
    backgroundColor: 'rgba(196,98,45,0.05)', padding: 18, alignItems: 'center', gap: 6,
  },
  emptyQuizBtn: { marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.borderStrong, paddingHorizontal: 20, paddingVertical: 12 },
  emptyQuizText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  brandEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: Colors.primary },
  brandTagline: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', fontStyle: 'italic' },

  checkInCta: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, overflow: 'hidden', padding: 14, marginBottom: 10,
  },
  checkInEmoji: { fontSize: 20, color: Colors.white },
  checkInTitle: { fontSize: 15, fontWeight: '700', color: Colors.white },
  checkInSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  focusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.borderStrong,
    padding: 14, marginBottom: 14,
  },
  focusEmoji: { fontSize: 22 },
  focusTag: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 2 },
  focusTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  focusSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  waterCard: {
    borderRadius: 18,
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border,
    padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  waterTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  waterCount: { fontSize: 30, fontWeight: '800', color: '#2563EB' },
  waterGoal: { fontSize: 14, fontWeight: '500', color: Colors.textMuted, paddingBottom: 3 },
  waterLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  waterControls: { flexDirection: 'row', gap: 10 },
  waterBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  waterBtnAdd: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  waterBarTrack: {
    height: 14, borderRadius: 7,
    backgroundColor: '#EAF0FA',
    overflow: 'hidden', marginBottom: 6,
  },
  waterBarFill: { height: 14, borderRadius: 7, minWidth: 8 },
  waterBarShine: {
    position: 'absolute', top: 2, left: 8, right: 8, height: 4,
    borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.45)',
  },
  waterMarkers: { flexDirection: 'row', marginBottom: 10 },
  waterMarkerBtn: { flex: 1, alignItems: 'center', gap: 3 },
  waterMarkerTick: { width: 2, height: 6, borderRadius: 1, backgroundColor: '#D4DCF0' },
  waterMarkerTickFilled: { backgroundColor: '#3B82F6' },
  waterMarkerLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '600' },
  waterFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  waterDone: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  waterDoneText: { fontSize: 12, color: '#3B82F6', fontWeight: '600' },
  waterProgress: { fontSize: 12, color: Colors.textMuted },
  waterPct: { fontSize: 13, fontWeight: '800', color: '#3B82F6' },

  challengeWidget: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.25)', padding: 14, marginBottom: 10 },
  challengeEmoji: { fontSize: 24 },
  challengeLabel: { fontSize: 9, fontWeight: '800', color: Colors.primary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  challengeTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  challengeBarWrap: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginBottom: 3 },
  challengeBarFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  challengeProgress: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  challengeCheckBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  challengeCheckBtnText: { fontSize: 11, fontWeight: '700', color: Colors.white },

  teaser: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, gap: 4,
    backgroundColor: Colors.bgCard,
  },
  teaserEmoji: { fontSize: 20, marginBottom: 2 },
  teaserTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  teaserSub: { fontSize: 11, color: Colors.textSecondary, lineHeight: 15 },
  teaserCta: { fontSize: 11, fontWeight: '700', color: Colors.primary, marginTop: 4 },

  communityCard: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.borderStrong,
    padding: 18,
    backgroundColor: Colors.bgCard,
  },
  communityStats: { flexDirection: 'row', marginBottom: 16 },
  communityStat: { flex: 1, alignItems: 'center' },
  communityStatNum: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  communityStatLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', marginTop: 1 },
  communityBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  communityAvatars: { flexDirection: 'row', alignItems: 'center' },
  communityAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
  },
  communityAvatarText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  communityAvatarMore: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', marginLeft: 8 },
  communityJoinBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  communityJoinText: { fontSize: 11, fontWeight: '700', color: '#fff' },
});
