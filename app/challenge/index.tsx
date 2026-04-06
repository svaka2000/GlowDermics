import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/colors';

const CHALLENGE_KEY = 'gd_active_challenge';

type Challenge = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  duration: number; // days
  dailyAction: string;
  tips: string[];
  color: [string, string];
  category: 'routine' | 'tallow' | 'hydration' | 'minimal' | 'lifestyle';
};

type ActiveChallenge = {
  challengeId: string;
  startDate: string;
  completedDays: string[]; // date strings
};

const CHALLENGES: Challenge[] = [
  {
    id: 'tallow-30',
    title: '30-Day Tallow Switch',
    emoji: '🌿',
    description: 'Replace your moisturizer with TallowDermics Balm for 30 days and track the transformation.',
    duration: 30,
    dailyAction: 'Apply TallowDermics Balm morning and evening instead of your regular moisturizer',
    tips: [
      'Start with a pea-sized amount and warm between fingers',
      'Apply to damp skin for maximum absorption',
      'Give it 2 weeks — skin adjusting is normal',
      'Scan weekly to see your progress',
    ],
    color: [Colors.primaryDark, Colors.primary],
    category: 'tallow',
  },
  {
    id: 'full-routine-21',
    title: '21-Day Routine Reset',
    emoji: '🌅',
    description: 'Complete your full morning and evening skincare routine for 21 straight days.',
    duration: 21,
    dailyAction: 'Complete both your morning and evening skincare routine without skipping',
    tips: [
      'Prep your skincare the night before',
      'Set alarms for morning and evening',
      'Keep your products visible on your counter',
      'Log each completion in the Daily Check-In',
    ],
    color: ['#1E3A5F', '#2563EB'],
    category: 'routine',
  },
  {
    id: 'hydration-14',
    title: '14-Day Glow Hydration',
    emoji: '💧',
    description: 'Drink 8 glasses of water every day for 14 days and watch your skin transform.',
    duration: 14,
    dailyAction: 'Drink at least 8 glasses (2L) of water before the end of each day',
    tips: [
      'Start each morning with 2 glasses before anything else',
      'Carry a water bottle everywhere',
      'Set hourly reminders on your phone',
      'Track in the GlowDermics water tracker',
    ],
    color: ['#0F4C75', '#1B9AAA'],
    category: 'hydration',
  },
  {
    id: 'minimal-7',
    title: '7-Day Minimal Routine',
    emoji: '✨',
    description: 'Strip your routine to just 3 steps for 7 days. Less is more for skin barrier recovery.',
    duration: 7,
    dailyAction: 'Use only: 1 gentle cleanser, 1 moisturizer, SPF (morning only)',
    tips: [
      'Skip actives, serums, and treatments this week',
      'Let your barrier rebuild naturally',
      'Notice how your skin feels with less product',
      'Great preparation for introducing tallow-based skincare',
    ],
    color: ['#2D3748', '#4A5568'],
    category: 'minimal',
  },
  {
    id: 'sleep-skin-14',
    title: '14-Day Sleep for Skin',
    emoji: '🌙',
    description: 'Get 7-9 hours of sleep every night for 2 weeks and track the skin impact.',
    duration: 14,
    dailyAction: 'Be in bed by 10:30pm and get at least 7 hours of uninterrupted sleep',
    tips: [
      'Avoid screens 1 hour before bed',
      'Use a silk pillowcase to reduce friction',
      'Apply your evening routine before 9pm',
      'Track your sleep quality in the journal',
    ],
    color: ['#1A1A2E', '#16213E'],
    category: 'lifestyle',
  },
  {
    id: 'no-touch-7',
    title: '7-Day No-Touch Face',
    emoji: '🤲',
    description: 'Catch yourself every time you touch your face and stop for 7 days.',
    duration: 7,
    dailyAction: 'Do not touch your face except during your skincare routine',
    tips: [
      'Put a rubber band on your wrist as a reminder',
      'Keep your phone screen clean daily',
      'Disinfect your pillow mid-week',
      'Notice if your breakouts reduce',
    ],
    color: ['#3D1A2E', '#8B2C6E'],
    category: 'lifestyle',
  },
];

function getTodayStr() {
  return new Date().toDateString();
}

function getDaysElapsed(startDate: string): number {
  return Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000);
}

export default function ChallengePage() {
  const [active, setActive] = useState<ActiveChallenge | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [view, setView] = useState<'browse' | 'active'>('browse');

  useFocusEffect(useCallback(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(CHALLENGE_KEY);
      if (raw) {
        const a: ActiveChallenge = JSON.parse(raw);
        const ch = CHALLENGES.find(c => c.id === a.challengeId);
        if (ch) {
          setActive(a);
          setActiveChallenge(ch);
          setView('active');
        }
      }
    })();
  }, []));

  const startChallenge = async (challenge: Challenge) => {
    Alert.alert(
      `Start ${challenge.title}?`,
      `This is a ${challenge.duration}-day challenge. You can only have one active challenge at a time.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start!', onPress: async () => {
            const a: ActiveChallenge = {
              challengeId: challenge.id,
              startDate: new Date().toISOString(),
              completedDays: [],
            };
            await AsyncStorage.setItem(CHALLENGE_KEY, JSON.stringify(a));
            setActive(a);
            setActiveChallenge(challenge);
            setView('active');
          },
        },
      ]
    );
  };

  const logToday = async () => {
    if (!active) return;
    const today = getTodayStr();
    if (active.completedDays.includes(today)) return;
    const updated = { ...active, completedDays: [...active.completedDays, today] };
    await AsyncStorage.setItem(CHALLENGE_KEY, JSON.stringify(updated));
    setActive(updated);
  };

  const abandonChallenge = () => {
    Alert.alert('Abandon Challenge', 'Give up on this challenge? Your progress will be lost.', [
      { text: 'Keep Going!', style: 'cancel' },
      {
        text: 'Abandon', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem(CHALLENGE_KEY);
          setActive(null);
          setActiveChallenge(null);
          setView('browse');
        },
      },
    ]);
  };

  const todayDone = active?.completedDays.includes(getTodayStr()) ?? false;
  const daysElapsed = active ? getDaysElapsed(active.startDate) : 0;
  const daysComplete = active?.completedDays.length ?? 0;
  const totalDays = activeChallenge?.duration ?? 30;
  const progressPct = totalDays > 0 ? Math.min(1, daysComplete / totalDays) : 0;
  const isComplete = daysComplete >= totalDays;

  const getCategoryColor = (cat: Challenge['category']) => {
    switch (cat) {
      case 'tallow': return Colors.primary;
      case 'routine': return '#2563EB';
      case 'hydration': return '#1B9AAA';
      case 'minimal': return '#4A5568';
      case 'lifestyle': return '#8B2C6E';
    }
  };

  const getCategoryLabel = (cat: Challenge['category']) => {
    switch (cat) {
      case 'tallow': return 'TallowDermics';
      case 'routine': return 'Routine';
      case 'hydration': return 'Hydration';
      case 'minimal': return 'Minimal';
      case 'lifestyle': return 'Lifestyle';
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Skin Challenges</Text>
            <Text style={styles.headerSub}>30-day habits that transform skin</Text>
          </View>
          {active && (
            <Pressable style={styles.backBtn} onPress={() => setView(view === 'active' ? 'browse' : 'active')}>
              <Ionicons name={view === 'active' ? 'grid-outline' : 'checkmark-circle-outline'} size={20} color={Colors.primary} />
            </Pressable>
          )}
          {!active && <View style={{ width: 36 }} />}
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Active challenge view */}
        {active && activeChallenge && view === 'active' && (
          <>
            {/* Hero */}
            <View style={styles.heroCard}>
              <LinearGradient colors={activeChallenge.color} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <Text style={styles.heroEmoji}>{activeChallenge.emoji}</Text>
              <Text style={styles.heroTitle}>{activeChallenge.title}</Text>
              {isComplete ? (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>🎉 CHALLENGE COMPLETE!</Text>
                </View>
              ) : (
                <Text style={styles.heroSub}>Day {daysElapsed + 1} of {activeChallenge.duration}</Text>
              )}
              {/* Progress bar */}
              <View style={styles.progressBarWrap}>
                <View style={[styles.progressBarFill, { width: `${progressPct * 100}%` as any }]} />
              </View>
              <Text style={styles.progressText}>{daysComplete}/{activeChallenge.duration} days completed</Text>
            </View>

            {/* Today's action */}
            {!isComplete && (
              <View style={styles.todayCard}>
                <View style={styles.todayHeader}>
                  <Text style={styles.todayLabel}>TODAY'S ACTION</Text>
                  {todayDone && (
                    <View style={styles.doneBadge}>
                      <Ionicons name="checkmark" size={12} color="#4ADE80" />
                      <Text style={styles.doneText}>Done!</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.todayAction}>{activeChallenge.dailyAction}</Text>
                {!todayDone ? (
                  <Pressable style={styles.logBtn} onPress={logToday}>
                    <LinearGradient colors={['#4ADE80', '#22C55E']} style={StyleSheet.absoluteFill} />
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.logBtnText}>Mark Today Complete</Text>
                  </Pressable>
                ) : (
                  <View style={styles.loggedCard}>
                    <LinearGradient colors={['rgba(74,222,128,0.12)', 'rgba(74,222,128,0.03)']} style={StyleSheet.absoluteFill} />
                    <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
                    <Text style={styles.loggedText}>Today's check-in complete — see you tomorrow!</Text>
                  </View>
                )}
              </View>
            )}

            {/* Calendar grid */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Progress Calendar</Text>
              <View style={styles.calGrid}>
                {Array.from({ length: activeChallenge.duration }, (_, i) => {
                  const d = new Date(active.startDate);
                  d.setDate(d.getDate() + i);
                  const dStr = d.toDateString();
                  const done = active.completedDays.includes(dStr);
                  const isToday = dStr === getTodayStr();
                  const isPast = d < new Date() && !isToday;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.calDay,
                        done && styles.calDayDone,
                        isToday && !done && styles.calDayToday,
                        isPast && !done && styles.calDayMissed,
                      ]}
                    >
                      <Text style={[styles.calDayNum, done && { color: Colors.white }]}>{i + 1}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.calLegend}>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#4ADE80' }]} /><Text style={styles.legendText}>Done</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.primary }]} /><Text style={styles.legendText}>Today</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: 'rgba(248,113,113,0.4)' }]} /><Text style={styles.legendText}>Missed</Text></View>
              </View>
            </View>

            {/* Tips */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tips for Success</Text>
              {activeChallenge.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{daysComplete}</Text>
                <Text style={styles.statLabel}>Days completed</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{Math.max(0, activeChallenge.duration - daysComplete)}</Text>
                <Text style={styles.statLabel}>Days remaining</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{Math.round(progressPct * 100)}%</Text>
                <Text style={styles.statLabel}>Complete</Text>
              </View>
            </View>

            {/* Abandon */}
            <Pressable style={styles.abandonBtn} onPress={abandonChallenge}>
              <Text style={styles.abandonText}>Give up on this challenge</Text>
            </Pressable>
          </>
        )}

        {/* Browse challenges */}
        {(view === 'browse' || !active) && (
          <>
            {active && (
              <View style={styles.activeBanner}>
                <LinearGradient colors={['rgba(196,98,45,0.12)', 'rgba(196,98,45,0.03)']} style={StyleSheet.absoluteFill} />
                <Text style={styles.activeBannerEmoji}>{activeChallenge?.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeBannerTitle}>{activeChallenge?.title}</Text>
                  <Text style={styles.activeBannerSub}>{daysComplete}/{totalDays} days · In progress</Text>
                </View>
                <Pressable onPress={() => setView('active')} style={styles.activeBannerBtn}>
                  <Text style={styles.activeBannerBtnText}>View</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.browseTitle}>All Challenges</Text>
            {CHALLENGES.map(ch => (
              <Pressable
                key={ch.id}
                style={[styles.challengeCard, active?.challengeId === ch.id && styles.challengeCardActive]}
                onPress={() => active ? (active.challengeId === ch.id ? setView('active') : undefined) : startChallenge(ch)}
              >
                <LinearGradient colors={ch.color} style={styles.challengeEmojiBg} />
                <Text style={styles.challengeEmoji}>{ch.emoji}</Text>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.challengeTopRow}>
                    <Text style={styles.challengeTitle}>{ch.title}</Text>
                    <View style={[styles.categoryBadge, { backgroundColor: `${getCategoryColor(ch.category)}20` }]}>
                      <Text style={[styles.categoryBadgeText, { color: getCategoryColor(ch.category) }]}>
                        {getCategoryLabel(ch.category)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.challengeDesc} numberOfLines={2}>{ch.description}</Text>
                  <Text style={styles.challengeDays}>{ch.duration} days</Text>
                </View>
                {active?.challengeId === ch.id
                  ? <View style={styles.activePill}><Text style={styles.activePillText}>ACTIVE</Text></View>
                  : active
                    ? <View style={[styles.activePill, { backgroundColor: Colors.bgElevated }]}><Text style={[styles.activePillText, { color: Colors.textMuted }]}>LOCKED</Text></View>
                    : <Ionicons name="play-circle" size={28} color={Colors.primary} />
                }
              </Pressable>
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  heroCard: { borderRadius: 20, overflow: 'hidden', padding: 24, gap: 8, marginBottom: 14, alignItems: 'center' },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: Colors.white, textAlign: 'center' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  completedBadge: { backgroundColor: 'rgba(74,222,128,0.3)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  completedText: { fontSize: 13, fontWeight: '800', color: '#4ADE80' },
  progressBarWrap: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 8 },
  progressBarFill: { height: 6, backgroundColor: '#4ADE80', borderRadius: 3 },
  progressText: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  todayCard: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12, marginBottom: 14 },
  todayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  todayLabel: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  doneText: { fontSize: 11, fontWeight: '700', color: '#4ADE80' },
  todayAction: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  logBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, overflow: 'hidden' },
  logBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  loggedCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', padding: 12 },
  loggedText: { flex: 1, fontSize: 13, color: Colors.textSecondary },

  card: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 10, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  calDay: { width: 34, height: 34, borderRadius: 8, backgroundColor: Colors.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  calDayDone: { backgroundColor: '#22C55E', borderColor: '#16A34A' },
  calDayToday: { borderColor: Colors.primary, borderWidth: 2 },
  calDayMissed: { backgroundColor: 'rgba(248,113,113,0.15)', borderColor: 'rgba(248,113,113,0.3)' },
  calDayNum: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  calLegend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.textMuted },

  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 7 },
  tipText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, alignItems: 'center', gap: 3 },
  statNum: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', textAlign: 'center' },

  abandonBtn: { alignItems: 'center', paddingVertical: 12 },
  abandonText: { fontSize: 12, color: Colors.textMuted },

  activeBanner: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  activeBannerEmoji: { fontSize: 24 },
  activeBannerTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  activeBannerSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  activeBannerBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  activeBannerBtnText: { fontSize: 12, fontWeight: '700', color: Colors.white },

  browseTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  challengeCard: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  challengeCardActive: { borderColor: Colors.primary },
  challengeEmojiBg: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 6, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  challengeEmoji: { fontSize: 30, width: 40, textAlign: 'center' },
  challengeTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  challengeTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  categoryBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  categoryBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  challengeDesc: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  challengeDays: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  activePill: { backgroundColor: 'rgba(196,98,45,0.2)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  activePillText: { fontSize: 9, fontWeight: '800', color: Colors.primary, letterSpacing: 0.5 },
});
