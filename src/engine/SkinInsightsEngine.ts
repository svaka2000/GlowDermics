/**
 * SkinInsightsEngine — pure, deterministic SYNTHESIS layer over the user's
 * per-dimension scan history.
 *
 * Where the trends derivation yields the raw per-dimension series, this yields
 * the *takeaway*: the single biggest gain, the dimension that needs focus, a
 * lightweight momentum tag per dimension, and one brand-agnostic
 * natural-language headline.
 *
 * It is fully decoupled — it imports NO other engine — and it never mutates
 * inputs, uses device storage, the wire, scheduled reminders, or any
 * nondeterministic source beyond an optional injected `now`. Same inputs ⇒
 * same output. (Routine-consistency↔score correlation is intentionally NOT
 * here: the progress/coach report already owns it; this is presentation-only.)
 */
import type { SkinAnalysis, SkinScore, SkinScoreV2 } from '../types';

export type MomentumState = 'improving' | 'steady' | 'plateaued' | 'regressing';

export interface InsightMover {
  key: string;
  label: string;
  delta: number;
  latest: number;
}

export interface InsightMomentum {
  key: string;
  label: string;
  state: MomentumState;
}

export interface SkinInsightsReport {
  /** Biggest positive first→latest delta (excludes the aggregate 'overall'). */
  topMover: InsightMover | null;
  /** Most-negative delta; ties broken by lowest latest. The dimension to focus. */
  topConcern: InsightMover | null;
  /** Per-dimension recent momentum. Empty until there are >= 3 scans. */
  momentum: InsightMomentum[];
  /** Deterministic, brand-agnostic one-line takeaway. */
  headline: string;
  window: { scans: number };
}

/** Dimension keys + brand-neutral labels — re-declared locally (NOT imported). */
const DIMS: { key: string; label: string }[] = [
  { key: 'overall', label: 'Overall' },
  { key: 'hydration', label: 'Hydration' },
  { key: 'texture', label: 'Texture' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'evenness', label: 'Evenness' },
  { key: 'firmness', label: 'Firmness' },
  { key: 'pores', label: 'Pores' },
  { key: 'radiance', label: 'Radiance' },
  { key: 'redness', label: 'Redness' },
  { key: 'darkSpots', label: 'Dark Spots' },
  { key: 'darkCircles', label: 'Dark Circles' },
  { key: 'wrinkles', label: 'Wrinkles' },
  { key: 'acne', label: 'Acne' },
  { key: 'oiliness', label: 'Oiliness' },
  { key: 'sensitivity', label: 'Sensitivity' },
  { key: 'barrierHealth', label: 'Barrier' },
];

function readScore(obj: SkinScore | SkinScoreV2 | undefined, key: string): number | undefined {
  if (!obj) return undefined;
  const v = (obj as unknown as Record<string, number>)[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

/**
 * Lexicographic ISO-8601 string compare === chronological order. Deterministic
 * and pure — no Date construction, no clock read.
 */
function byDateAsc(a: SkinAnalysis, b: SkinAnalysis): number {
  return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
}

/**
 * Recent-vs-earlier momentum: mean of the last third vs the first third
 * (series length is guaranteed >= 3 by the caller). The final step
 * disambiguates a true plateau from gentle steady drift. Deterministic.
 */
function classifyMomentum(series: number[]): MomentumState {
  const n = series.length;
  const seg = Math.max(1, Math.floor(n / 3));
  let earlySum = 0;
  for (let i = 0; i < seg; i++) earlySum += series[i];
  let lateSum = 0;
  for (let i = n - seg; i < n; i++) lateSum += series[i];
  const early = earlySum / seg;
  const late = lateSum / seg;
  const drift = late - early;
  const lastStep = series[n - 1] - series[n - 2];
  if (drift >= 3) return 'improving';
  if (drift <= -3) return 'regressing';
  if (Math.abs(drift) < 1 && Math.abs(lastStep) < 1) return 'plateaued';
  return 'steady';
}

/**
 * Pure synthesis. Deterministic; time only via the optional `now`.
 */
export function deriveSkinInsights(analyses: SkinAnalysis[], now?: number): SkinInsightsReport {
  void now; // accepted for deterministic test injection; no nondeterministic use

  const list = Array.isArray(analyses)
    ? analyses.filter((a) => a && typeof a.date === 'string' && a.scores)
    : [];
  const sorted = [...list].sort(byDateAsc);
  const scans = sorted.length;

  if (scans === 0) {
    return {
      topMover: null,
      topConcern: null,
      momentum: [],
      headline: 'Run your first scan to start seeing what moves your skin.',
      window: { scans: 0 },
    };
  }

  const series: { key: string; label: string; vals: number[] }[] = [];
  for (const dim of DIMS) {
    const vals: number[] = [];
    for (const scan of sorted) {
      const v = readScore(scan.scoresV2, dim.key) ?? readScore(scan.scores, dim.key);
      if (typeof v === 'number' && Number.isFinite(v)) vals.push(v);
    }
    if (vals.length >= 1) series.push({ key: dim.key, label: dim.label, vals });
  }

  if (scans < 2) {
    return {
      topMover: null,
      topConcern: null,
      momentum: [],
      headline: 'One scan in — your baseline is set. Trends and insights sharpen with each new scan.',
      window: { scans },
    };
  }

  // Mover / concern ranked over real dimensions only (exclude the 'overall' aggregate).
  const dimSeries = series.filter((s) => s.key !== 'overall' && s.vals.length >= 2);
  let topMover: InsightMover | null = null;
  let worst: InsightMover | null = null;
  for (const s of dimSeries) {
    const latest = Math.round(s.vals[s.vals.length - 1]);
    const delta = Math.round(s.vals[s.vals.length - 1] - s.vals[0]);
    if (
      delta > 0 &&
      (!topMover ||
        delta > topMover.delta ||
        (delta === topMover.delta && s.key < topMover.key))
    ) {
      topMover = { key: s.key, label: s.label, delta, latest };
    }
    if (
      !worst ||
      delta < worst.delta ||
      (delta === worst.delta && latest < worst.latest) ||
      (delta === worst.delta && latest === worst.latest && s.key < worst.key)
    ) {
      worst = { key: s.key, label: s.label, delta, latest };
    }
  }
  const topConcern: InsightMover | null = worst;

  const momentum: InsightMomentum[] = [];
  if (scans >= 3) {
    for (const s of series) {
      if (s.vals.length >= 3) {
        momentum.push({ key: s.key, label: s.label, state: classifyMomentum(s.vals) });
      }
    }
  }

  let headline: string;
  if (topMover && topConcern && topMover.key !== topConcern.key && topConcern.delta < 0) {
    headline = `${topMover.label} is your biggest gain (+${topMover.delta}). ${topConcern.label} is slipping (${topConcern.delta}) — focus here next.`;
  } else if (topMover) {
    headline = `${topMover.label} is your biggest gain (+${topMover.delta}) across ${scans} scans. Keep the momentum going.`;
  } else if (topConcern && topConcern.delta < 0) {
    headline = `${topConcern.label} needs attention (${topConcern.delta} across ${scans} scans). Small, consistent wins compound.`;
  } else {
    headline = `Your skin is holding steady across ${scans} scans — consistency is working.`;
  }

  return { topMover, topConcern, momentum, headline, window: { scans } };
}

export default deriveSkinInsights;
