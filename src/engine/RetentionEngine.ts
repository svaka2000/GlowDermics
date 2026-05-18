/**
 * RetentionEngine — pure, deterministic derivation of a NON-destructive
 * retention overlay (milestone ladder + a just-hit celebration + a smart
 * re-engagement nudge).
 *
 * Given scan history + routine-completion log + the current streak (all read
 * elsewhere via the existing storage getters) it returns a presentational
 * state only. It is fully decoupled — it imports NO gamification engine — and
 * it never mutates inputs, reads or writes device storage, schedules a
 * reminder, calls the network, or uses any nondeterministic source beyond an
 * optional injected `now`. Same inputs ⇒ same output.
 */
import type { SkinAnalysis } from '../types';

export interface RetentionMilestone {
  id: string;
  label: string;
  reached: boolean;
  reachedLabel?: string;
}

export interface RetentionState {
  milestones: RetentionMilestone[];
  celebrate?: { id: string; title: string; blurb: string };
  reengage?: { tone: 'gentle' | 'streak-risk' | 'comeback'; headline: string; nudge: string };
  basis: { streak: number; scans: number; adherencePct: number };
}

/** Streak-day thresholds — re-declared locally; intentionally NOT imported. */
const MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365] as const;

const LABELS: Record<number, string> = {
  3: 'First Spark',
  7: 'One Week',
  14: 'Two Weeks',
  30: 'One Month',
  60: 'Two Months',
  90: 'One Quarter',
  180: 'Half Year',
  365: 'Full Year',
};

function safeTime(value: string): number {
  const t = new Date(value).getTime();
  return isNaN(t) ? -Infinity : t;
}

function computeAdherence(routineLog: { date: string; morning: boolean; evening: boolean }[]): number {
  if (!routineLog || routineLog.length === 0) return 0;
  const sorted = [...routineLog]
    .filter((e) => e && typeof e.date === 'string')
    .sort((a, b) => safeTime(b.date) - safeTime(a.date));
  const window = sorted.slice(0, 14);
  const denom = Math.max(1, Math.min(14, routineLog.length));
  const full = window.filter((e) => e.morning && e.evening).length;
  return Math.round((100 * full) / denom);
}

/**
 * Pure derivation. Deterministic; time only via the optional `now`.
 */
export function deriveRetentionState(
  analyses: SkinAnalysis[],
  routineLog: { date: string; morning: boolean; evening: boolean }[],
  streak: number,
  now?: number,
): RetentionState {
  const N = now ?? Date.now();
  const safeStreak = Number.isFinite(streak) && streak > 0 ? Math.floor(streak) : 0;
  const list = Array.isArray(analyses) ? analyses.filter((a) => a && typeof a.date === 'string') : [];
  const log = Array.isArray(routineLog) ? routineLog.filter((e) => e && typeof e.date === 'string') : [];
  const scans = list.length;
  const adherencePct = computeAdherence(log);

  const milestones: RetentionMilestone[] = MILESTONES.map((t) => {
    const reached = safeStreak >= t;
    return {
      id: `ms-${t}`,
      label: LABELS[t],
      reached,
      reachedLabel: reached ? 'Reached' : undefined,
    };
  });

  let celebrate: RetentionState['celebrate'];
  for (const t of MILESTONES) {
    if (safeStreak === t) {
      celebrate = {
        id: `ms-${t}`,
        title: `${LABELS[t]} streak!`,
        blurb: `You've kept your skin ritual going ${t} days straight — that consistency is exactly what lasting results are built on.`,
      };
      break;
    }
  }

  const todayStr = new Date(N).toDateString();
  const loggedToday = log.some((e) => {
    const d = new Date(e.date);
    return !isNaN(d.getTime()) && d.toDateString() === todayStr;
  });

  let reengage: RetentionState['reengage'];
  if (safeStreak === 0 && (scans > 0 || log.length > 0)) {
    reengage = {
      tone: 'comeback',
      headline: 'Pick up where you left off',
      nudge: 'Your skin history is still here. One scan or one logged routine today restarts your streak — no progress is lost.',
    };
  } else if (safeStreak > 0 && !loggedToday) {
    reengage = {
      tone: 'streak-risk',
      headline: `Keep your ${safeStreak}-day streak alive`,
      nudge: 'You haven’t logged today yet. A 60-second routine check-in keeps the momentum — future you will thank you.',
    };
  } else if (adherencePct < 50) {
    reengage = {
      tone: 'gentle',
      headline: 'Small steps, real change',
      nudge: 'Even logging one routine a day compounds. Aim for a simple, repeatable rhythm rather than a perfect one.',
    };
  }

  return {
    milestones,
    celebrate,
    reengage,
    basis: { streak: safeStreak, scans, adherencePct },
  };
}

export default deriveRetentionState;
