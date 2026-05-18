/**
 * SkinTrendsEngine — pure, deterministic derivation of per-dimension skin
 * trend series (sparklines + deltas) over the user's scan history.
 *
 * Given the analyses list (read elsewhere via the existing storage getter) it
 * returns a presentational report only. It is fully decoupled — it imports NO
 * other engine — and it never mutates inputs, uses device storage, the
 * network, scheduled reminders, or any nondeterministic source beyond an
 * optional injected `now`. Same inputs ⇒ same output.
 */
import type { SkinAnalysis, SkinScore, SkinScoreV2 } from '../types';

export interface SkinTrendDim {
  key: string;
  label: string;
  latest: number;
  delta: number;
  spark: number[];
}

export interface SkinTrendsReport {
  dimensions: SkinTrendDim[];
  overallSpark: number[];
  window: { scans: number; sinceLabel: string };
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

function monthYear(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

/**
 * Pure derivation. Deterministic; time only via the optional `now`.
 */
export function deriveSkinTrends(analyses: SkinAnalysis[], now?: number): SkinTrendsReport {
  void now; // accepted for deterministic test injection; no nondeterministic use
  const list = Array.isArray(analyses)
    ? analyses.filter((a) => a && typeof a.date === 'string' && a.scores)
    : [];
  const sorted = [...list].sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const dimensions: SkinTrendDim[] = [];
  for (const dim of DIMS) {
    const spark: number[] = [];
    for (const scan of sorted) {
      const v = readScore(scan.scoresV2, dim.key) ?? readScore(scan.scores, dim.key);
      if (typeof v === 'number' && Number.isFinite(v)) spark.push(v);
    }
    if (spark.length >= 1) {
      const last = spark[spark.length - 1];
      dimensions.push({
        key: dim.key,
        label: dim.label,
        latest: Math.round(last),
        delta: spark.length >= 2 ? Math.round(last - spark[0]) : 0,
        spark,
      });
    }
  }

  const overall = dimensions.find((d) => d.key === 'overall');
  return {
    dimensions,
    overallSpark: overall ? overall.spark : [],
    window: {
      scans: sorted.length,
      sinceLabel: sorted.length > 0 ? monthYear(sorted[0].date) : '',
    },
  };
}

export default deriveSkinTrends;
