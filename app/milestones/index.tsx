import { useCallback, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
  category: 'scanning' | 'routine' | 'learning' | 'tracking' | 'lifestyle';
}

function buildCategoryColors(c: Palette): Record<string, string> {
  return {
    scanning: c.primary,
    routine: '#6B85A8',
    learning: '#60A5FA',
    tracking: '#4ADE80',
    lifestyle: '#F59E0B',
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  scanning: 'Scanning',
  routine: 'Routine',
  learning: 'Learning',
  tracking: 'Tracking',
  lifestyle: 'Lifestyle',
};

async function computeAchievements(): Promise<Achievement[]> {
  const [profile, history, readArticles, journal, routineLog] = await Promise.all([
    Storage.getUserProfile(),
    Storage.getScanHistory(),
    Storage.getReadArticles(),
    Storage.getJournal(),
    Storage.getFullRoutineLog(),
  ]);

  // Water check
  let waterGoalHit = false;
  try {
    const raw = await AsyncStorage.getItem('gd_water');
    if (raw) {
      const data = JSON.parse(raw);
      waterGoalHit = Object.values(data).some((v: any) => v >= 8);
    }
  } catch {}

  // Habit check
  let topHabitDay = 0;
  try {
    const raw = await AsyncStorage.getItem('gd_daily_habits');
    if (raw) {
      const logs = JSON.parse(raw);
      topHabitDay = Math.max(0, ...logs.map((l: any) => l.checked?.length ?? 0));
    }
  } catch {}

  // Ingredient decoder usage
  let ingredientLooked = false;
  try {
    const raw = await AsyncStorage.getItem('gd_ingredients_viewed');
    ingredientLooked = !!raw && JSON.parse(raw).length > 0;
  } catch {}

  // Streak from routine log
  let maxStreak = 0;
  let cur = 0;
  const sortedLog = [...routineLog].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (let i = 0; i < sortedLog.length; i++) {
    if (sortedLog[i].morning || sortedLog[i].evening) {
      if (i === 0) {
        cur = 1;
      } else {
        const prev = new Date(sortedLog[i - 1].date);
        const curr = new Date(sortedLog[i].date);
        const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
        cur = diff === 1 ? cur + 1 : 1;
      }
      maxStreak = Math.max(maxStreak, cur);
    }
  }

  const scoreImproved = history.length >= 2
    ? history[0].overallScore > history[history.length - 1].overallScore
    : false;

  return [
    {
      id: 'first_profile',
      emoji: '🌱',
      title: 'First Steps',
      description: 'Created your GlowDermics profile',
      unlocked: !!profile,
      category: 'scanning',
    },
    {
      id: 'first_scan',
      emoji: '📸',
      title: 'Skin Scan Pioneer',
      description: 'Took your first AI skin scan',
      unlocked: history.length >= 1,
      category: 'scanning',
    },
    {
      id: 'five_scans',
      emoji: '🔬',
      title: 'Dedicated Scanner',
      description: 'Completed 5 or more skin scans',
      unlocked: history.length >= 5,
      category: 'scanning',
    },
    {
      id: 'score_climber',
      emoji: '📈',
      title: 'Score Climber',
      description: 'Improved your overall skin score from first scan',
      unlocked: scoreImproved,
      category: 'scanning',
    },
    {
      id: 'first_routine',
      emoji: '🌅',
      title: 'Routine Rookie',
      description: 'Logged your morning or evening routine for the first time',
      unlocked: routineLog.length >= 1,
      category: 'routine',
    },
    {
      id: 'streak_3',
      emoji: '🔥',
      title: 'Streak Starter',
      description: 'Maintained a 3-day routine streak',
      unlocked: maxStreak >= 3,
      category: 'routine',
    },
    {
      id: 'streak_7',
      emoji: '⚡',
      title: 'Week Warrior',
      description: 'Maintained a 7-day routine streak',
      unlocked: maxStreak >= 7,
      category: 'routine',
    },
    {
      id: 'streak_30',
      emoji: '👑',
      title: 'Skin Royalty',
      description: 'Legendary 30-day routine streak',
      unlocked: maxStreak >= 30,
      category: 'routine',
    },
    {
      id: 'first_article',
      emoji: '📖',
      title: 'Curious Mind',
      description: 'Read your first Skin Lab article',
      unlocked: readArticles.length >= 1,
      category: 'learning',
    },
    {
      id: 'five_articles',
      emoji: '🎓',
      title: 'Skin Scholar',
      description: 'Read 5 or more Skin Lab articles',
      unlocked: readArticles.length >= 5,
      category: 'learning',
    },
    {
      id: 'all_articles',
      emoji: '🏛️',
      title: 'Skin Expert',
      description: 'Read all articles in the Skin Lab',
      unlocked: readArticles.length >= 8,
      category: 'learning',
    },
    {
      id: 'ingredient_decoder',
      emoji: '⚗️',
      title: 'Ingredient Detective',
      description: 'Looked up an ingredient in the Decoder',
      unlocked: ingredientLooked,
      category: 'learning',
    },
    {
      id: 'first_journal',
      emoji: '📝',
      title: 'Journaling Begins',
      description: 'Wrote your first skin journal entry',
      unlocked: journal.length >= 1,
      category: 'tracking',
    },
    {
      id: 'ten_journal',
      emoji: '📔',
      title: 'Journal Keeper',
      description: 'Wrote 10 or more journal entries',
      unlocked: journal.length >= 10,
      category: 'tracking',
    },
    {
      id: 'habit_5',
      emoji: '✅',
      title: 'Habit Builder',
      description: 'Completed 5 or more daily habits in one day',
      unlocked: topHabitDay >= 5,
      category: 'tracking',
    },
    {
      id: 'habit_all',
      emoji: '🌟',
      title: 'Perfect Day',
      description: 'Completed all 12 daily habits in one day',
      unlocked: topHabitDay >= 12,
      category: 'tracking',
    },
    {
      id: 'water_goal',
      emoji: '💧',
      title: 'Water Warrior',
      description: 'Hit the 8-glass daily water goal',
      unlocked: waterGoalHit,
      category: 'lifestyle',
    },
    {
      id: 'ten_scans',
      emoji: '💎',
      title: 'Skin Historian',
      description: '10+ scans — your skin story is rich',
      unlocked: history.length >= 10,
      category: 'scanning',
    },
  ];
}

export default function Milestones() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const CATEGORY_COLORS = useMemo(() => buildCategoryColors(colors), [colors]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    computeAchievements().then(data => {
      setAchievements(data);
      Animated.stagger(90, [
        Animated.timing(headerAnim, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(contentAnim, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
  }, []));

  const categories = ['all', 'scanning', 'routine', 'learning', 'tracking', 'lifestyle'];
  const filtered = activeCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === activeCategory);

  const unlocked = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;
  const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
        }]}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>Milestones</Text>
            <Text style={styles.headerSub}>Your skin journey achievements</Text>
          </View>
          <View style={{ width: 36 }} />
        </Animated.View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>

        {/* Progress card */}
        <View style={styles.progressCard}>
          <LinearGradient
            colors={['rgba(196,98,45,0.15)', 'rgba(196,98,45,0.04)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <View style={styles.progressTop}>
            <View>
              <Text style={styles.progressNum}>{unlocked}<Text style={styles.progressTotal}> / {total}</Text></Text>
              <Text style={styles.progressLabel}>milestones unlocked</Text>
            </View>
            <View style={styles.trophyCircle}>
              <Text style={styles.trophyEmoji}>🏆</Text>
            </View>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${pct}%` as any }]} />
          </View>
          <Text style={styles.progressPct}>{pct}% complete</Text>
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catScrollContent}>
          {categories.map(cat => (
            <Pressable
              key={cat}
              style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catChipText, activeCategory === cat && styles.catChipTextActive]}>
                {cat === 'all' ? 'ALL' : CATEGORY_LABELS[cat]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Achievement grid */}
        <View style={styles.grid}>
          {filtered.map(a => (
            <View
              key={a.id}
              style={[styles.achievementCard, !a.unlocked && styles.achievementLocked]}
            >
              {a.unlocked && (
                <LinearGradient
                  colors={[CATEGORY_COLORS[a.category] + '20', CATEGORY_COLORS[a.category] + '08']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />
              )}
              <View style={styles.achievementTop}>
                <Text style={[styles.achievementEmoji, !a.unlocked && styles.achievementEmojiLocked]}>
                  {a.emoji}
                </Text>
                {a.unlocked && (
                  <View style={[styles.unlockedBadge, { backgroundColor: CATEGORY_COLORS[a.category] + '25' }]}>
                    <Ionicons name="checkmark" size={10} color={CATEGORY_COLORS[a.category]} />
                  </View>
                )}
              </View>
              <Text style={[styles.achievementTitle, !a.unlocked && styles.lockedText]}>{a.title}</Text>
              <Text style={[styles.achievementDesc, !a.unlocked && styles.lockedDesc]}>{a.description}</Text>
              {!a.unlocked && (
                <View style={styles.lockedTag}>
                  <Ionicons name="lock-closed" size={9} color={colors.textMuted} />
                  <Text style={styles.lockedTagText}>Locked</Text>
                </View>
              )}
              {a.unlocked && (
                <View style={[styles.categoryTag, { backgroundColor: CATEGORY_COLORS[a.category] + '20' }]}>
                  <Text style={[styles.categoryTagText, { color: CATEGORY_COLORS[a.category] }]}>
                    {CATEGORY_LABELS[a.category].toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Motivational footer */}
        <View style={styles.footerCard}>
          <Ionicons name="sparkles-outline" size={16} color={colors.gold} />
          <Text style={styles.footerText}>
            {unlocked === 0
              ? 'Start your skin journey to unlock your first milestone!'
              : unlocked < total / 2
              ? `Great progress! ${total - unlocked} milestones left to unlock.`
              : unlocked === total
              ? "You've unlocked everything! You're a true skin expert."
              : `Almost there — ${total - unlocked} milestones remaining.`}
          </Text>
        </View>

        <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
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
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  progressCard: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)',
    padding: 20, marginBottom: 16,
  },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  progressNum: { fontSize: 38, fontWeight: '800', color: c.textPrimary },
  progressTotal: { fontSize: 20, fontWeight: '500', color: c.textMuted },
  progressLabel: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
  trophyCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(196,98,45,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  trophyEmoji: { fontSize: 26 },
  progressBarTrack: { height: 6, backgroundColor: c.bgElevated, borderRadius: 3, marginBottom: 6 },
  progressBarFill: { height: '100%', backgroundColor: c.primary, borderRadius: 3 },
  progressPct: { fontSize: 11, color: c.textMuted, fontWeight: '600' },

  catScroll: { marginBottom: 16 },
  catScrollContent: { gap: 8, paddingRight: 16 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.bgCard,
  },
  catChipActive: { borderColor: c.primary, backgroundColor: 'rgba(196,98,45,0.15)' },
  catChipText: { fontSize: 11, fontWeight: '600', color: c.textMuted },
  catChipTextActive: { color: c.primary },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  achievementCard: {
    width: '48%', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: c.borderStrong,
    backgroundColor: c.bgCard, padding: 16, gap: 6,
  },
  achievementLocked: { opacity: 0.5 },
  achievementTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  achievementEmoji: { fontSize: 28 },
  achievementEmojiLocked: { filter: undefined }, // grayscale applied via opacity on card
  unlockedBadge: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  achievementTitle: { fontSize: 13, fontWeight: '700', color: c.textPrimary, lineHeight: 18 },
  achievementDesc: { fontSize: 11, color: c.textSecondary, lineHeight: 16 },
  lockedText: { color: c.textMuted },
  lockedDesc: { color: c.textMuted },
  lockedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  lockedTagText: { fontSize: 9, color: c.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  categoryTag: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  categoryTagText: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },

  footerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(212,169,106,0.06)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(212,169,106,0.15)',
    padding: 16,
  },
  footerText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 19 },
  });
}
