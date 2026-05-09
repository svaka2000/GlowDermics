import { Storage } from '../services/storage';

/** Milestone tiers users unlock. */
export const MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365] as const;

export interface MilestoneState {
  days: number;
  label: string;
  emoji: string;
  unlocked: boolean;
}

const MILESTONE_META: Record<number, { label: string; emoji: string }> = {
  3:   { label: 'Spark',         emoji: '✨' },
  7:   { label: 'Week Warrior',  emoji: '⚡' },
  14:  { label: 'Fortnight Glow', emoji: '🌟' },
  30:  { label: 'Lunar Cycle',   emoji: '🌙' },
  60:  { label: 'Two-Month Pro', emoji: '🔥' },
  90:  { label: 'Quarter Glow',  emoji: '🏆' },
  180: { label: 'Half-Year Hero', emoji: '👑' },
  365: { label: 'Annual Aura',   emoji: '💎' },
};

export interface StreakDay {
  /** toDateString format. */
  date: string;
  /** True if user logged a routine OR completed a scan that day. */
  logged: boolean;
  /** True if it's today. */
  isToday: boolean;
}

export interface StreakReport {
  /** Active streak in days (consecutive days with activity, ending today or yesterday). */
  currentStreak: number;
  /** Best streak ever recorded. */
  longestStreak: number;
  /** Has the user logged anything yet today? */
  todayLogged: boolean;
  /** Streak is in danger of breaking — non-zero streak + today not logged + after noon. */
  atRisk: boolean;
  /** Next milestone the user is working toward. */
  nextMilestone: number;
  /** Days remaining to reach the next milestone. */
  daysToNext: number;
  /** All milestone tiers with unlocked state. */
  milestones: MilestoneState[];
  /** Last 28 days as a sparkline / calendar (oldest first). */
  last28: StreakDay[];
  /** Total milestones unlocked. */
  unlocksCount: number;
  /** Day the longest streak began (for display). May be empty if never had a streak. */
  longestStartDate?: string;
  /** Total active days across all time (not necessarily consecutive). */
  totalActiveDays: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function dateKey(d: Date): string {
  return d.toDateString();
}

/**
 * Compute a unified daily activity set from routine logs + scan history.
 * A "day with activity" = at least one routine logged OR at least one scan completed.
 */
async function getActiveDaySet(): Promise<Set<string>> {
  const [routineLog, scanHistory] = await Promise.all([
    Storage.getFullRoutineLog(),
    Storage.getScanHistory(),
  ]);

  const set = new Set<string>();
  for (const r of routineLog) {
    if (r.morning || r.evening) set.add(r.date);
  }
  for (const s of scanHistory) {
    set.add(new Date(s.date).toDateString());
  }
  return set;
}

/**
 * runStreakAnalysis — one-shot summary of the user's gamification state.
 * Pure compute — no animation timers, no UI state. Drives the StreakRing
 * + streak screen + home-tab streak stat.
 */
export async function runStreakAnalysis(): Promise<StreakReport> {
  const activeSet = await getActiveDaySet();
  const today = new Date();
  const todayKey = dateKey(today);

  // Current streak: walk back from today (or yesterday if today not yet logged).
  const todayLogged = activeSet.has(todayKey);
  let currentStreak = 0;
  let walkDate = new Date(today);

  // If today not logged, the streak is still alive if YESTERDAY was logged
  // (until end of day, the user can still log today). So start the walk from
  // yesterday in that case to count what's in the bag right now.
  if (!todayLogged) {
    walkDate.setDate(walkDate.getDate() - 1);
  }
  while (activeSet.has(dateKey(walkDate))) {
    currentStreak++;
    walkDate.setDate(walkDate.getDate() - 1);
  }

  // Longest streak: scan all active days.
  // Sort active days ascending and walk for consecutive runs.
  const sortedDays = Array.from(activeSet)
    .map(k => new Date(k))
    .filter(d => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  let longestStreak = 0;
  let runLength = 0;
  let runStart: Date | null = null;
  let longestStart: Date | null = null;
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      runLength = 1;
      runStart = sortedDays[i];
    } else {
      const diffDays = Math.round(
        (sortedDays[i].getTime() - sortedDays[i - 1].getTime()) / MS_PER_DAY,
      );
      if (diffDays === 1) {
        runLength++;
      } else {
        runLength = 1;
        runStart = sortedDays[i];
      }
    }
    if (runLength > longestStreak) {
      longestStreak = runLength;
      longestStart = runStart;
    }
  }

  // Next milestone — first milestone strictly greater than the current streak.
  // If user has surpassed all milestones, lock onto the highest tier.
  const nextMilestone =
    MILESTONES.find(m => m > currentStreak) ?? MILESTONES[MILESTONES.length - 1];
  const daysToNext = Math.max(0, nextMilestone - currentStreak);

  // Milestone unlock list.
  const milestones: MilestoneState[] = MILESTONES.map(m => ({
    days: m,
    label: MILESTONE_META[m].label,
    emoji: MILESTONE_META[m].emoji,
    unlocked: longestStreak >= m,
  }));
  const unlocksCount = milestones.filter(m => m.unlocked).length;

  // Last 28 days sparkline.
  const last28: StreakDay[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKey(d);
    last28.push({ date: key, logged: activeSet.has(key), isToday: i === 0 });
  }

  // At-risk: currentStreak > 0, today not logged, and it's after 12pm
  // (gives the user the morning grace period before nudging).
  const atRisk = currentStreak > 0 && !todayLogged && today.getHours() >= 12;

  return {
    currentStreak,
    longestStreak,
    todayLogged,
    atRisk,
    nextMilestone,
    daysToNext,
    milestones,
    last28,
    unlocksCount,
    longestStartDate: longestStart ? dateKey(longestStart) : undefined,
    totalActiveDays: activeSet.size,
  };
}
