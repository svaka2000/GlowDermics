/**
 * SkinStoryEngine
 *
 * Generates a ranked list of personalized "stories" — 1-line headlines that
 * surface the most interesting recent change or context in the user's data.
 * Think of each story as a one-card daily news item TAILORED to the user.
 *
 * Stories rank by priority (1-100). The home widget renders the top 3-5 in
 * order. Empty data → returns no stories rather than filler.
 *
 * Story generators (each emits 0-1 stories):
 *   - streak milestone (approaching/just hit a tier)
 *   - score trend (last 5 scans rising/falling significantly)
 *   - hydration/sleep weekly delta
 *   - active challenge progress
 *   - missing scan (no scan in 7+ days)
 *   - persona-shift (when persona changed in latest run)
 *   - badge progress (close to unlocking)
 *
 * Each story carries:
 *   - id, headline, optional subline, icon, accent color, deeplink
 */
import { Storage } from '../services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runStreakAnalysis } from './StreakEngine';
import { runDailyChallengeAnalysis } from './DailyChallengeEngine';

const SLEEP_KEY = 'gd_sleep_log';
const WATER_KEY = 'gd_water';

export type StoryAccent =
  | 'primary' | 'gold' | 'green' | 'red' | 'blue' | 'purple';

export interface SkinStory {
  id: string;
  headline: string;
  subline?: string;
  /** Ionicons name. */
  icon: string;
  /** Color theme for the story card. */
  accent: StoryAccent;
  /** Priority 0-100; higher = more interesting/urgent. */
  priority: number;
  /** Optional deeplink path within the app. */
  link?: string;
}

interface StoryContext {
  scanCount: number;
  daysSinceLastScan: number;
  recentScores: number[];        // newest first
  totalActiveDays: number;
  currentStreak: number;
  longestStreak: number;
  daysToNextMilestone: number;
  nextMilestone: number;
  challengeLevel: number;
  challengeXPToNext: number;
  todayQuestComplete: boolean;
  recentSleepAvg: number | null;
  prevSleepAvg: number | null;
  recentWaterAvg: number | null;
  prevWaterAvg: number | null;
  unlockedBadgeCount: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function runSkinStories(): Promise<SkinStory[]> {
  const ctx = await buildContext();

  const stories: SkinStory[] = [];

  // 1. Streak milestone — close to next tier
  if (ctx.daysToNextMilestone > 0 && ctx.daysToNextMilestone <= 3 && ctx.currentStreak > 0) {
    stories.push({
      id: 'streak-near',
      headline: ctx.daysToNextMilestone === 1
        ? `1 day from your ${ctx.nextMilestone}-day streak milestone`
        : `${ctx.daysToNextMilestone} days from the ${ctx.nextMilestone}-day milestone`,
      subline: 'Don\'t break the chain — keep your daily check-in alive.',
      icon: 'flame',
      accent: 'gold',
      priority: 90,
      link: '/streak',
    });
  } else if (ctx.currentStreak >= 7) {
    stories.push({
      id: 'streak-active',
      headline: `${ctx.currentStreak}-day streak running`,
      subline: ctx.currentStreak === ctx.longestStreak
        ? "You're at your personal best."
        : `Personal best: ${ctx.longestStreak} days.`,
      icon: 'flame',
      accent: 'primary',
      priority: 60,
      link: '/streak',
    });
  }

  // 2. Score trend — significant rise or fall in last 5 scans
  if (ctx.recentScores.length >= 3) {
    const newest = ctx.recentScores[0];
    const oldest = ctx.recentScores[ctx.recentScores.length - 1];
    const delta = newest - oldest;
    if (delta >= 5) {
      stories.push({
        id: 'score-rising',
        headline: `Skin score up ${delta} pts across your last ${ctx.recentScores.length} scans`,
        subline: 'Your routine is paying off — keep the rhythm.',
        icon: 'trending-up',
        accent: 'green',
        priority: 88,
        link: '/seven-day',
      });
    } else if (delta <= -5) {
      stories.push({
        id: 'score-falling',
        headline: `Skin score down ${Math.abs(delta)} pts since your last few scans`,
        subline: 'Worth checking in — sleep and stress often surface here first.',
        icon: 'trending-down',
        accent: 'red',
        priority: 92,
        link: '/seven-day',
      });
    }
  }

  // 3. Sleep delta week-over-week
  if (ctx.recentSleepAvg != null && ctx.prevSleepAvg != null) {
    const delta = ctx.recentSleepAvg - ctx.prevSleepAvg;
    if (Math.abs(delta) >= 0.4) {
      stories.push({
        id: 'sleep-delta',
        headline: delta > 0
          ? `Sleeping +${delta.toFixed(1)} hr more this week`
          : `Sleep dropped ${Math.abs(delta).toFixed(1)} hr this week`,
        subline: delta > 0
          ? 'Your skin barrier rebuilds during deep sleep — this shows up in 2-3 days.'
          : 'Sleep loss often surfaces as redness or dullness within 48 hours.',
        icon: 'moon',
        accent: delta > 0 ? 'blue' : 'red',
        priority: 75,
        link: '/sleep-log',
      });
    }
  }

  // 4. Water delta week-over-week
  if (ctx.recentWaterAvg != null && ctx.prevWaterAvg != null) {
    const delta = ctx.recentWaterAvg - ctx.prevWaterAvg;
    if (Math.abs(delta) >= 1) {
      stories.push({
        id: 'water-delta',
        headline: delta > 0
          ? `Hydration up ${delta.toFixed(1)} glasses/day this week`
          : `Hydration dropped ${Math.abs(delta).toFixed(1)} glasses/day`,
        subline: delta > 0
          ? 'Plump cells, fewer fine lines — your skin will thank you.'
          : 'Skin loses hydration first. Bump back up if you can.',
        icon: 'water',
        accent: delta > 0 ? 'blue' : 'gold',
        priority: 65,
      });
    }
  }

  // 5. Active challenge / quest
  if (!ctx.todayQuestComplete && ctx.challengeLevel > 0) {
    stories.push({
      id: 'quest-pending',
      headline: `Today's quest is waiting`,
      subline: `Level ${ctx.challengeLevel} · ${ctx.challengeXPToNext} XP to next level.`,
      icon: 'trophy',
      accent: 'gold',
      priority: 70,
      link: '/daily-challenges',
    });
  }

  // 6. Scan absence
  if (ctx.scanCount > 0 && ctx.daysSinceLastScan >= 7) {
    stories.push({
      id: 'scan-overdue',
      headline: ctx.daysSinceLastScan >= 14
        ? `It's been ${ctx.daysSinceLastScan} days since your last scan`
        : `${ctx.daysSinceLastScan} days since your last scan`,
      subline: 'A weekly scan keeps your forecast and persona accurate.',
      icon: 'scan',
      accent: 'primary',
      priority: ctx.daysSinceLastScan >= 14 ? 95 : 78,
      link: '/scan',
    });
  } else if (ctx.scanCount === 0) {
    stories.push({
      id: 'first-scan',
      headline: 'Take your first skin scan',
      subline: 'Unlock your forecast, persona, and personalized routine.',
      icon: 'sparkles',
      accent: 'primary',
      priority: 100,
      link: '/scan',
    });
  }

  // 7. Badge count milestone
  if (ctx.unlockedBadgeCount > 0 && ctx.unlockedBadgeCount % 3 === 0) {
    stories.push({
      id: 'badge-milestone',
      headline: `${ctx.unlockedBadgeCount} badges earned`,
      subline: 'Your achievements are stacking up. Check the gallery.',
      icon: 'medal',
      accent: 'gold',
      priority: 50,
      link: '/daily-challenges',
    });
  }

  // 8. Member-since milestone (every 30 days)
  if (ctx.totalActiveDays >= 30 && ctx.totalActiveDays % 30 === 0) {
    stories.push({
      id: 'member-milestone',
      headline: `${ctx.totalActiveDays} active days on GlowDermics`,
      subline: 'Keep tracking — long-term data unlocks deeper insights.',
      icon: 'calendar',
      accent: 'purple',
      priority: 45,
    });
  }

  return stories.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

async function buildContext(): Promise<StoryContext> {
  const [scanHistory, sleepRaw, waterRaw, streakReport, challengeReport] = await Promise.all([
    Storage.getScanHistory(),
    AsyncStorage.getItem(SLEEP_KEY),
    AsyncStorage.getItem(WATER_KEY),
    runStreakAnalysis(),
    runDailyChallengeAnalysis(),
  ]);

  const scanCount = scanHistory.length;
  const daysSinceLastScan = scanCount > 0
    ? Math.floor((Date.now() - new Date(scanHistory[0].date).getTime()) / MS_PER_DAY)
    : 999;
  const recentScores = scanHistory.slice(0, 5).map(s => s.overallScore);

  // Sleep: avg of last 7 days vs avg of days 8-14
  const sleepEntries: { date: string; hours: number }[] = sleepRaw ? JSON.parse(sleepRaw) : [];
  const sleepByDay = new Map<string, number>();
  for (const s of sleepEntries) sleepByDay.set(s.date, s.hours);

  const sleepWindow = (start: number, end: number): number | null => {
    const values: number[] = [];
    for (let i = start; i < end; i++) {
      const d = new Date(Date.now() - i * MS_PER_DAY).toDateString();
      const h = sleepByDay.get(d);
      if (typeof h === 'number') values.push(h);
    }
    return values.length >= 3 ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };
  const recentSleepAvg = sleepWindow(0, 7);
  const prevSleepAvg = sleepWindow(7, 14);

  // Water: same window approach
  const waterByDay: Record<string, number> = waterRaw ? JSON.parse(waterRaw) : {};
  const waterWindow = (start: number, end: number): number | null => {
    const values: number[] = [];
    for (let i = start; i < end; i++) {
      const d = new Date(Date.now() - i * MS_PER_DAY).toDateString();
      const g = waterByDay[d];
      if (typeof g === 'number') values.push(g);
    }
    return values.length >= 3 ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };
  const recentWaterAvg = waterWindow(0, 7);
  const prevWaterAvg = waterWindow(7, 14);

  return {
    scanCount,
    daysSinceLastScan,
    recentScores,
    totalActiveDays: streakReport.totalActiveDays,
    currentStreak: streakReport.currentStreak,
    longestStreak: streakReport.longestStreak,
    daysToNextMilestone: streakReport.daysToNext,
    nextMilestone: streakReport.nextMilestone,
    challengeLevel: challengeReport.level,
    challengeXPToNext: Math.max(0, challengeReport.xpForLevel - challengeReport.xpInLevel),
    todayQuestComplete: !!challengeReport.primaryDone,
    recentSleepAvg,
    prevSleepAvg,
    recentWaterAvg,
    prevWaterAvg,
    unlockedBadgeCount: challengeReport.unlockedBadges.length,
  };
}
