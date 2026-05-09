import AsyncStorage from '@react-native-async-storage/async-storage';
import { Storage } from '../services/storage';

const SLEEP_KEY = 'gd_sleep_log';

export interface SleepEntry {
  date: string;       // toDateString() format — what the sleep-log screen writes
  hours: number;
  quality: number;    // 1-5
}

export interface SleepSkinPoint {
  /** Date of the sleep entry (toDateString format). */
  sleepDate: string;
  /** Hours slept that night. */
  hours: number;
  /** Sleep quality 1-5. */
  quality: number;
  /** Overall skin score from the next-day scan, if any. */
  skinScore: number;
  /** Date of the matched scan (ISO format). */
  scanDate: string;
}

export interface SleepSkinReport {
  /** Aligned (sleep, scan) pairs across the lookback window. */
  points: SleepSkinPoint[];
  /** Pearson correlation coefficient between sleep hours and next-day skin score. */
  correlationHours: number;
  /** Pearson correlation coefficient between sleep quality and next-day skin score. */
  correlationQuality: number;
  /** Plain-English verdict (e.g. "Strong positive — more sleep, better skin."). */
  verdict: string;
  /** Number of valid pairs found. */
  sampleSize: number;
  /** True if there's enough data to draw a meaningful conclusion (>=8 pairs). */
  hasEnoughData: boolean;
  /** Suggested ideal sleep range based on the user's data, e.g. "7.5–8.5 hrs". */
  optimalRange?: string;
  /** Mean sleep hours across the dataset. */
  avgHours: number;
  /** Mean skin score across matched scans. */
  avgSkinScore: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_PAIRS_FOR_CORRELATION = 8;
const LOOKBACK_DAYS = 60;

/** Pearson correlation coefficient. Returns 0 for degenerate inputs. */
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

function describeCorrelation(r: number, label: string): string {
  const abs = Math.abs(r);
  const dir = r >= 0 ? 'positive' : 'negative';
  if (abs < 0.15) return `Little visible link between ${label} and skin score in your data.`;
  if (abs < 0.3) return `Weak ${dir} signal — ${label} is one factor among several.`;
  if (abs < 0.5) return `Moderate ${dir} link — ${label} measurably tracks with skin score.`;
  if (abs < 0.7) return `Strong ${dir} link — ${label} is a real driver of your skin score.`;
  return `Very strong ${dir} link — ${label} closely tracks with your skin score.`;
}

/**
 * runSleepSkinAnalysis — pulls the user's sleep log + scan history, aligns
 * each sleep entry with the NEXT scan that occurred within 36h, and returns
 * the Pearson correlation along with a plain-English verdict.
 *
 * Why the +1 day alignment? Skincare dermatology consensus: a poor night's
 * sleep shows up the next morning, not the same morning. So sleep[t] should
 * be paired with the first scan in the [t+0h, t+36h] window.
 */
export async function runSleepSkinAnalysis(): Promise<SleepSkinReport> {
  const [sleepRaw, scans] = await Promise.all([
    AsyncStorage.getItem(SLEEP_KEY),
    Storage.getScanHistory(),
  ]);

  const sleepEntries: SleepEntry[] = sleepRaw ? JSON.parse(sleepRaw) : [];

  const cutoff = Date.now() - LOOKBACK_DAYS * MS_PER_DAY;

  // Sort scans by date ASC for easier window matching.
  const sortedScans = [...scans]
    .filter(s => new Date(s.date).getTime() >= cutoff)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const points: SleepSkinPoint[] = [];
  for (const sleep of sleepEntries) {
    const sleepTs = new Date(sleep.date).getTime();
    if (Number.isNaN(sleepTs) || sleepTs < cutoff) continue;
    // Find first scan whose timestamp is within [sleepTs, sleepTs + 36h].
    const match = sortedScans.find(s => {
      const t = new Date(s.date).getTime();
      return t >= sleepTs && t <= sleepTs + 36 * 60 * 60 * 1000;
    });
    if (!match) continue;
    points.push({
      sleepDate: sleep.date,
      hours: sleep.hours,
      quality: sleep.quality,
      skinScore: match.overallScore,
      scanDate: match.date,
    });
  }

  // Sort points oldest first for chart rendering.
  points.sort((a, b) => new Date(a.sleepDate).getTime() - new Date(b.sleepDate).getTime());

  const sampleSize = points.length;
  const hasEnoughData = sampleSize >= MIN_PAIRS_FOR_CORRELATION;

  const hoursArr = points.map(p => p.hours);
  const qualityArr = points.map(p => p.quality);
  const scoreArr = points.map(p => p.skinScore);

  const correlationHours = hasEnoughData ? pearson(hoursArr, scoreArr) : 0;
  const correlationQuality = hasEnoughData ? pearson(qualityArr, scoreArr) : 0;

  const avgHours = hoursArr.length > 0 ? hoursArr.reduce((a, b) => a + b, 0) / hoursArr.length : 0;
  const avgSkinScore = scoreArr.length > 0 ? scoreArr.reduce((a, b) => a + b, 0) / scoreArr.length : 0;

  // Find the user's "optimal range" — the hour bucket where their average skin
  // score is highest. Group points into 0.5h buckets when there's enough data.
  let optimalRange: string | undefined;
  if (hasEnoughData) {
    const bucketed = new Map<number, number[]>(); // bucketStart -> scores[]
    for (const p of points) {
      const bucketStart = Math.floor(p.hours * 2) / 2; // 0.5h buckets
      const arr = bucketed.get(bucketStart) ?? [];
      arr.push(p.skinScore);
      bucketed.set(bucketStart, arr);
    }
    let best = { bucket: 0, avg: -Infinity };
    bucketed.forEach((scores, bucket) => {
      if (scores.length < 2) return; // need at least 2 nights at this bucket
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > best.avg) best = { bucket, avg };
    });
    if (Number.isFinite(best.avg)) {
      optimalRange = `${best.bucket.toFixed(1)}–${(best.bucket + 0.5).toFixed(1)} hrs`;
    }
  }

  let verdict: string;
  if (!hasEnoughData) {
    verdict = `Need ${MIN_PAIRS_FOR_CORRELATION - sampleSize} more matched scan${MIN_PAIRS_FOR_CORRELATION - sampleSize === 1 ? '' : 's'} to compute a reliable trend. Keep logging sleep.`;
  } else {
    // Pick the stronger of the two correlations to lead the verdict.
    const lead = Math.abs(correlationHours) >= Math.abs(correlationQuality)
      ? { coef: correlationHours, label: 'sleep duration' }
      : { coef: correlationQuality, label: 'sleep quality' };
    verdict = describeCorrelation(lead.coef, lead.label);
    if (optimalRange) {
      verdict += ` Your best skin tracks with ${optimalRange}.`;
    }
  }

  return {
    points,
    correlationHours,
    correlationQuality,
    verdict,
    sampleSize,
    hasEnoughData,
    optimalRange,
    avgHours,
    avgSkinScore,
  };
}
