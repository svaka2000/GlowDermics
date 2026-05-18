/**
 * BeforeAfterEngine — pure, deterministic derivation of a before→after
 * comparison (earliest scan vs latest scan) for the Before/After Studio.
 *
 * Given the analyses list (read elsewhere via the existing storage getter) it
 * returns a presentational report only. It is fully decoupled — it imports NO
 * other engine — and it never mutates inputs, uses device storage, the
 * network, scheduled reminders, or any nondeterministic source beyond an
 * optional injected `now`. Same inputs ⇒ same output.
 */
import type { SkinAnalysis, SkinScore, SkinScoreV2 } from '../types';

export interface BeforeAfterScan {
  id: string;
  date: string;
  imageUri: string;
  overall: number;
}

export interface BeforeAfterMover {
  key: string;
  label: string;
  delta: number;
}

export interface BeforeAfterReport {
  before?: BeforeAfterScan;
  after?: BeforeAfterScan;
  overallDelta: number;
  topMovers: BeforeAfterMover[];
  daysBetween: number;
  hasPair: boolean;
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

function toBA(a: SkinAnalysis): BeforeAfterScan {
  return {
    id: a.id,
    date: a.date,
    imageUri: a.imageUri || '',
    overall: Math.round(readScore(a.scoresV2, 'overall') ?? readScore(a.scores, 'overall') ?? 0),
  };
}

/**
 * Pure derivation. Deterministic; time only via the optional `now`.
 */
export function deriveBeforeAfter(analyses: SkinAnalysis[], now?: number): BeforeAfterReport {
  void now; // accepted for deterministic test injection; no nondeterministic use
  const list = Array.isArray(analyses)
    ? analyses.filter((a) => a && typeof a.date === 'string' && a.scores)
    : [];

  if (list.length === 0) {
    return { before: undefined, after: undefined, overallDelta: 0, topMovers: [], daysBetween: 0, hasPair: false };
  }

  const sorted = [...list].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const firstScan = sorted[0];
  const lastScan = sorted[sorted.length - 1];
  const before = toBA(firstScan);
  const after = toBA(lastScan);
  const hasPair = sorted.length >= 2 && firstScan.id !== lastScan.id;

  const topMovers: BeforeAfterMover[] = [];
  if (hasPair) {
    for (const d of DIMS) {
      if (d.key === 'overall') continue;
      const bV = readScore(firstScan.scoresV2, d.key) ?? readScore(firstScan.scores, d.key);
      const aV = readScore(lastScan.scoresV2, d.key) ?? readScore(lastScan.scores, d.key);
      if (typeof bV === 'number' && typeof aV === 'number') {
        topMovers.push({ key: d.key, label: d.label, delta: Math.round(aV - bV) });
      }
    }
    topMovers.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  }

  const daysBetween = hasPair
    ? Math.max(0, Math.round((+new Date(after.date) - +new Date(before.date)) / 86400000))
    : 0;

  return {
    before,
    after,
    overallDelta: hasPair ? after.overall - before.overall : 0,
    topMovers: topMovers.slice(0, 3),
    daysBetween,
    hasPair,
  };
}

export default deriveBeforeAfter;
