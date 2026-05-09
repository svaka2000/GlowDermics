import AsyncStorage from '@react-native-async-storage/async-storage';
import { Storage } from '../services/storage';

const UV_KEY = 'gd_uv_log';

export interface UVEntry {
  date: string;             // toDateString format from the uv-log screen
  exposureMin: number;
  spf: number | null;
  reapplied: boolean;
  activities: string[];
}

export interface UVSkinPoint {
  /** Date the user logged UV (toDateString). */
  uvDate: string;
  /** Raw exposure minutes that day. */
  exposureMin: number;
  /** SPF (or null = none). */
  spf: number | null;
  /** True if reapplication was logged. */
  reapplied: boolean;
  /** Effective UV damage estimate (lower = better-protected). */
  uvDamage: number;
  /** Overall skin score from the matched-window scan. */
  skinScore: number;
  /** Date of the matched scan (ISO). */
  scanDate: string;
}

export interface UVSkinReport {
  points: UVSkinPoint[];
  /** Pearson r between effective UV damage and next-day skin score. */
  correlationDamage: number;
  /** Pearson r between raw exposure minutes and next-day skin score. */
  correlationExposure: number;
  verdict: string;
  sampleSize: number;
  hasEnoughData: boolean;
  avgDamage: number;
  avgSkinScore: number;
  /** Highest tolerable exposure bucket (mins) where avg skin score holds up. */
  toleranceCeiling?: string;
  /** Number of days with no SPF logged. */
  unprotectedDays: number;
  /** Average daily UV damage when wearing SPF vs not, for comparison verdict. */
  withSpfAvgDamage: number;
  withoutSpfAvgDamage: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_PAIRS = 8;
const LOOKBACK_DAYS = 60;
const MATCH_WINDOW_MS = 48 * 60 * 60 * 1000; // UV damage shows up over 24-48h

/**
 * Estimate effective UV damage for an entry.
 *
 * Heuristic protection factors:
 *   - No SPF: 100% of exposure counts
 *   - SPF logged but not reapplied: ~40% (real-world single-application coverage)
 *   - SPF reapplied: ~15% (high-quality protection)
 * The exact percentages don't matter for correlation strength — what matters is
 * preserving the relative ordering across entries.
 */
export function uvDamageScore(entry: UVEntry): number {
  if (!entry.spf || entry.spf <= 0) return entry.exposureMin;
  return entry.exposureMin * (entry.reapplied ? 0.15 : 0.40);
}

function pearson(xs: number[], ys: number[]): number {
  if (xs.length !== ys.length || xs.length < 2) return 0;
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

function describe(r: number, label: string): string {
  const abs = Math.abs(r);
  // For UV, NEGATIVE correlation = "more UV → lower score" = the expected pattern.
  // POSITIVE correlation = "more UV → higher score" = unexpected (likely reflects
  // confounders like sleep, hydration, etc.).
  const expected = r < 0;
  const adjective =
    abs < 0.15 ? 'little visible'
    : abs < 0.3 ? 'a weak'
    : abs < 0.5 ? 'a moderate'
    : abs < 0.7 ? 'a strong'
    : 'a very strong';
  if (abs < 0.15) return `Little visible link between ${label} and skin score in your data.`;
  if (expected) {
    return `Found ${adjective} negative link — more ${label} tracks with lower skin scores.`;
  }
  return `Found ${adjective} positive link — your ${label} doesn't appear to be hurting skin scores yet (or other factors mask it).`;
}

export async function runUVSkinAnalysis(): Promise<UVSkinReport> {
  const [uvRaw, scans] = await Promise.all([
    AsyncStorage.getItem(UV_KEY),
    Storage.getScanHistory(),
  ]);

  const uvEntries: UVEntry[] = uvRaw ? JSON.parse(uvRaw) : [];
  const cutoff = Date.now() - LOOKBACK_DAYS * MS_PER_DAY;

  const sortedScans = [...scans]
    .filter(s => new Date(s.date).getTime() >= cutoff)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const points: UVSkinPoint[] = [];
  for (const uv of uvEntries) {
    const uvTs = new Date(uv.date).getTime();
    if (Number.isNaN(uvTs) || uvTs < cutoff) continue;
    if (uv.exposureMin === 0) continue; // skip no-exposure days — uninformative

    const match = sortedScans.find(s => {
      const t = new Date(s.date).getTime();
      return t >= uvTs && t <= uvTs + MATCH_WINDOW_MS;
    });
    if (!match) continue;

    points.push({
      uvDate: uv.date,
      exposureMin: uv.exposureMin,
      spf: uv.spf,
      reapplied: uv.reapplied,
      uvDamage: uvDamageScore(uv),
      skinScore: match.overallScore,
      scanDate: match.date,
    });
  }

  points.sort((a, b) => new Date(a.uvDate).getTime() - new Date(b.uvDate).getTime());

  const sampleSize = points.length;
  const hasEnoughData = sampleSize >= MIN_PAIRS;

  const damageArr = points.map(p => p.uvDamage);
  const exposureArr = points.map(p => p.exposureMin);
  const scoreArr = points.map(p => p.skinScore);

  const correlationDamage = hasEnoughData ? pearson(damageArr, scoreArr) : 0;
  const correlationExposure = hasEnoughData ? pearson(exposureArr, scoreArr) : 0;

  const avgDamage = damageArr.length > 0 ? damageArr.reduce((a, b) => a + b, 0) / damageArr.length : 0;
  const avgSkinScore = scoreArr.length > 0 ? scoreArr.reduce((a, b) => a + b, 0) / scoreArr.length : 0;

  const unprotectedDays = points.filter(p => !p.spf).length;

  const withSpfPoints = points.filter(p => p.spf);
  const withoutSpfPoints = points.filter(p => !p.spf);
  const withSpfAvgDamage = withSpfPoints.length > 0
    ? withSpfPoints.reduce((s, p) => s + p.uvDamage, 0) / withSpfPoints.length
    : 0;
  const withoutSpfAvgDamage = withoutSpfPoints.length > 0
    ? withoutSpfPoints.reduce((s, p) => s + p.uvDamage, 0) / withoutSpfPoints.length
    : 0;

  // Tolerance ceiling: highest 30-min exposure bucket where average skin score
  // is still ≥ user's overall average minus 3 points.
  let toleranceCeiling: string | undefined;
  if (hasEnoughData) {
    const buckets = new Map<number, number[]>(); // bucket-start → scores[]
    for (const p of points) {
      const bucketStart = Math.floor(p.exposureMin / 30) * 30;
      const arr = buckets.get(bucketStart) ?? [];
      arr.push(p.skinScore);
      buckets.set(bucketStart, arr);
    }
    const threshold = avgSkinScore - 3;
    let ceiling: number | null = null;
    Array.from(buckets.entries())
      .sort(([a], [b]) => a - b) // ascending
      .forEach(([bucket, scores]) => {
        if (scores.length < 2) return;
        const bucketAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (bucketAvg >= threshold) ceiling = bucket;
      });
    if (ceiling !== null) {
      toleranceCeiling = `${ceiling}–${ceiling + 30} min`;
    }
  }

  let verdict: string;
  if (!hasEnoughData) {
    verdict = `Need ${MIN_PAIRS - sampleSize} more matched scan${MIN_PAIRS - sampleSize === 1 ? '' : 's'} to compute a reliable trend. Keep logging UV exposure.`;
  } else {
    const lead = Math.abs(correlationDamage) >= Math.abs(correlationExposure)
      ? { coef: correlationDamage, label: 'effective UV damage' }
      : { coef: correlationExposure, label: 'sun exposure' };
    verdict = describe(lead.coef, lead.label);
    if (toleranceCeiling) verdict += ` Your skin holds up well around ${toleranceCeiling}.`;
    if (unprotectedDays > 0 && unprotectedDays >= sampleSize / 2) {
      verdict += ` ${unprotectedDays} of ${sampleSize} matched days had no SPF — that's the easiest single fix.`;
    }
  }

  return {
    points,
    correlationDamage,
    correlationExposure,
    verdict,
    sampleSize,
    hasEnoughData,
    avgDamage,
    avgSkinScore,
    toleranceCeiling,
    unprotectedDays,
    withSpfAvgDamage,
    withoutSpfAvgDamage,
  };
}
