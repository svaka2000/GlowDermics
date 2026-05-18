/**
 * ProactiveNudgeEngine — pure, deterministic derivation of a single
 * "what changed since your last scan / what to focus on now" nudge.
 *
 * Fully decoupled — it imports NO other engine or service — and it never
 * mutates inputs, uses device storage, the network, scheduled reminders, any
 * AI call, or any nondeterministic source beyond an optional injected `now`.
 * Same inputs ⇒ same output. The caller (a screen) reads data via the
 * existing storage getters and passes it in; this only derives copy.
 */
import type { SkinAnalysis, SkinScore, SkinScoreV2 } from '../types';

export interface ProactiveNudge {
  hasNudge: boolean;
  tone: 'win' | 'focus' | 'gentle' | 'start';
  headline: string;
  body: string;
  cta?: { label: string; route: string };
}

/** v1 dimension keys + brand-neutral labels — re-declared locally (NOT imported). */
const DIMS: { key: string; label: string }[] = [
  { key: 'hydration', label: 'Hydration' },
  { key: 'texture', label: 'Texture' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'evenness', label: 'Evenness' },
  { key: 'firmness', label: 'Firmness' },
  { key: 'pores', label: 'Pores' },
];

function readScore(obj: SkinScore | SkinScoreV2 | undefined, key: string): number | undefined {
  if (!obj) return undefined;
  const v = (obj as unknown as Record<string, number>)[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

/**
 * Pure derivation. Deterministic; time only via the optional `now`.
 */
export function deriveProactiveNudge(
  analyses: SkinAnalysis[],
  routineLog: { date: string; morning: boolean; evening: boolean }[],
  streak: number,
  now?: number,
): ProactiveNudge {
  void now; // accepted for deterministic test injection; no nondeterministic use
  void streak; // accepted for signature stability / future rules; unused today

  const list = Array.isArray(analyses)
    ? analyses.filter((a) => a && typeof a.date === 'string' && a.scores)
    : [];
  const sorted = [...list].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const n = sorted.length;

  if (n === 0) {
    return {
      hasNudge: true,
      tone: 'start',
      headline: 'Start your skin journey',
      body: 'Take your first scan to unlock personalized insights tailored to you.',
      cta: { label: 'Take a scan', route: '/scan' },
    };
  }

  if (n === 1) {
    return {
      hasNudge: true,
      tone: 'gentle',
      headline: 'One scan in',
      body: 'Take another in a week or two and Velumi AI will show your first real trend.',
      cta: { label: 'See progress', route: '/before-after' },
    };
  }

  const last = sorted[n - 1];
  const prev = sorted[n - 2];

  const lastOverall = readScore(last.scoresV2, 'overall') ?? readScore(last.scores, 'overall') ?? 0;
  const prevOverall = readScore(prev.scoresV2, 'overall') ?? readScore(prev.scores, 'overall') ?? 0;
  const ovl = Math.round(lastOverall - prevOverall);

  if (ovl >= 3) {
    return {
      hasNudge: true,
      tone: 'win',
      headline: `You're up ${ovl} points`,
      body: 'Your overall skin score improved since your last scan — keep the momentum.',
      cta: { label: 'View trends', route: '/skin-trends' },
    };
  }

  let worstDelta = Infinity;
  let worstLabel = '';
  for (const d of DIMS) {
    const bV = readScore(prev.scoresV2, d.key) ?? readScore(prev.scores, d.key);
    const aV = readScore(last.scoresV2, d.key) ?? readScore(last.scores, d.key);
    if (typeof bV === 'number' && typeof aV === 'number') {
      const delta = Math.round(aV - bV);
      if (delta < worstDelta) {
        worstDelta = delta;
        worstLabel = d.label;
      }
    }
  }

  if (worstLabel && worstDelta <= -4) {
    return {
      hasNudge: true,
      tone: 'focus',
      headline: `${worstLabel} slipped`,
      body: `Your ${worstLabel.toLowerCase()} dropped since last scan — a small routine tweak can steady it.`,
      cta: { label: 'Tune routine', route: '/adaptive-routine' },
    };
  }

  const rl = [...routineLog]
    .filter((e) => e && typeof e.date === 'string')
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 14);
  const adh = rl.length
    ? Math.round((100 * rl.filter((e) => e.morning && e.evening).length) / Math.max(1, Math.min(14, routineLog.length)))
    : 0;

  if (adh < 50) {
    return {
      hasNudge: true,
      tone: 'gentle',
      headline: 'Consistency compounds',
      body: 'Logging your routine daily is what moves the numbers — aim for a simple, repeatable rhythm.',
      cta: { label: 'Tune routine', route: '/adaptive-routine' },
    };
  }

  return {
    hasNudge: true,
    tone: 'win',
    headline: 'Holding steady',
    body: 'Your routine is keeping your skin stable — stay consistent and keep tracking.',
    cta: { label: 'View trends', route: '/skin-trends' },
  };
}

export default deriveProactiveNudge;
