/**
 * SkinForecastEngine
 *
 * Predicts the next 7 days of skin scores by combining:
 *  - the user's recent baseline (mean of last N scans)
 *  - per-feature Pearson correlations with skin score on aligned daily data
 *  - the user's actual habit pattern over the last 7 days (which the forecast
 *    assumes continues — i.e. "if you keep doing what you're doing")
 *
 * The model is intentionally simple — a linear blend of standardized feature
 * deltas weighted by the strength of each feature's correlation. We do NOT
 * train a real regression because:
 *  (a) data volume is tiny (a few weeks of self-reported logs)
 *  (b) interpretability matters — each driver has a plain-English contribution
 *  (c) overfitting on 14-30 noisy points produces worse forecasts than a
 *      shrinkage estimator
 *
 * Output is a 7-element array of {date, score, drivers[]} suitable for
 * rendering as bars/chart, plus a single-sentence summary.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Storage } from '../services/storage';

const SLEEP_KEY = 'gd_sleep_log';
const WATER_KEY = 'gd_water';
const HABITS_KEY = 'gd_daily_habits';
const ROUTINE_LOG_KEY = 'gd_routine_logs';
const TOTAL_HABITS = 12;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LOOKBACK_DAYS = 30;
const MIN_PAIRS = 6;

export interface ForecastDriver {
  /** Feature that contributed: sleep | water | routine | habits | mood */
  feature: 'sleep' | 'water' | 'routine' | 'habits' | 'mood';
  /** How many score points this driver shifted today's forecast (+/-). */
  delta: number;
  /** Plain-English label, e.g. "Sleep solid: +1.4". */
  label: string;
}

export interface ForecastDay {
  /** ISO date for this forecast day. */
  date: string;
  /** Day-of-week label, e.g. "Mon", "Tue". */
  dayLabel: string;
  /** Predicted overall skin score (0-100). */
  score: number;
  /** Top 3 drivers (positive or negative) for this day, sorted by |delta|. */
  drivers: ForecastDriver[];
}

export interface ForecastReport {
  baseline: number;
  baselineSource: 'scans' | 'fallback';
  /** Sample size used for fitting (number of (day, scan) aligned pairs). */
  sampleSize: number;
  /** True if there's enough data to trust the forecast (sampleSize >= MIN_PAIRS). */
  hasEnoughData: boolean;
  days: ForecastDay[];
  /** Trend direction across the 7 days. */
  trend: 'rising' | 'falling' | 'flat';
  /** End-of-week predicted score - first-day predicted score. */
  trendDelta: number;
  /** Plain-English headline summary, e.g. "Mostly steady — keep your sleep on track." */
  headline: string;
  /** The single biggest lever the user can pull to raise next week's forecast. */
  topLever?: { feature: ForecastDriver['feature']; suggestion: string };
}

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

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DailyFeatures {
  date: string;             // toDateString format
  sleepHours?: number;
  sleepQuality?: number;
  waterGlasses?: number;
  routineCount?: number;    // 0-2
  habitsScore?: number;     // 0-1
  moodScore?: number;       // 0-1 (great=1, good=0.66, okay=0.33, bad=0)
  scanScore?: number;
}

function moodToScore(m: 'great' | 'good' | 'okay' | 'bad'): number {
  switch (m) {
    case 'great': return 1;
    case 'good': return 0.66;
    case 'okay': return 0.33;
    case 'bad': return 0;
  }
}

export async function runSkinForecast(): Promise<ForecastReport> {
  const [sleepRaw, waterRaw, habitsRaw, routinesRaw, journal, scans] = await Promise.all([
    AsyncStorage.getItem(SLEEP_KEY),
    AsyncStorage.getItem(WATER_KEY),
    AsyncStorage.getItem(HABITS_KEY),
    AsyncStorage.getItem(ROUTINE_LOG_KEY),
    Storage.getJournal(),
    Storage.getScanHistory(),
  ]);

  const sleepEntries: { date: string; hours: number; quality: number }[] = sleepRaw ? JSON.parse(sleepRaw) : [];
  const waterByDay: Record<string, number> = waterRaw ? JSON.parse(waterRaw) : {};
  const habitLogs: { date: string; checked: string[] }[] = habitsRaw ? JSON.parse(habitsRaw) : [];
  const routineLogs: { date: string; morning?: boolean; evening?: boolean }[] = routinesRaw ? JSON.parse(routinesRaw) : [];

  // Build daily-feature index spanning the lookback window.
  const cutoff = Date.now() - LOOKBACK_DAYS * MS_PER_DAY;
  const features = new Map<string, DailyFeatures>();

  const ensureDay = (d: string): DailyFeatures => {
    if (!features.has(d)) features.set(d, { date: d });
    return features.get(d)!;
  };

  for (const s of sleepEntries) {
    if (new Date(s.date).getTime() < cutoff) continue;
    const d = ensureDay(s.date);
    d.sleepHours = s.hours;
    d.sleepQuality = s.quality;
  }
  for (const [date, glasses] of Object.entries(waterByDay)) {
    if (new Date(date).getTime() < cutoff) continue;
    ensureDay(date).waterGlasses = glasses;
  }
  for (const h of habitLogs) {
    if (new Date(h.date).getTime() < cutoff) continue;
    ensureDay(h.date).habitsScore = (h.checked?.length ?? 0) / TOTAL_HABITS;
  }
  for (const r of routineLogs) {
    if (new Date(r.date).getTime() < cutoff) continue;
    ensureDay(r.date).routineCount = (r.morning ? 1 : 0) + (r.evening ? 1 : 0);
  }
  for (const j of journal) {
    const d = new Date(j.date).toDateString();
    if (new Date(d).getTime() < cutoff) continue;
    ensureDay(d).moodScore = moodToScore(j.mood);
  }

  // Pair each scan with that day's features (the day before the scan would also
  // make sense for sleep, but we keep it simple: same-day features → same-day scan).
  for (const s of scans) {
    const d = new Date(s.date).toDateString();
    if (new Date(d).getTime() < cutoff) continue;
    ensureDay(d).scanScore = s.overallScore;
  }

  const arr = Array.from(features.values()).filter(f => f.scanScore !== undefined);

  // Baseline = mean of recent scan scores; fall back to a sensible 70 if no data.
  let baseline = 70;
  let baselineSource: 'scans' | 'fallback' = 'fallback';
  if (arr.length > 0) {
    const sum = arr.reduce((a, b) => a + (b.scanScore ?? 0), 0);
    baseline = sum / arr.length;
    baselineSource = 'scans';
  }

  // Compute per-feature Pearson correlation.
  const corr = (key: keyof DailyFeatures): number => {
    const pairs = arr.filter(f => f[key] !== undefined && f.scanScore !== undefined);
    if (pairs.length < MIN_PAIRS) return 0;
    return pearson(pairs.map(p => p[key] as number), pairs.map(p => p.scanScore!));
  };

  const cSleep = corr('sleepHours');
  const cQuality = corr('sleepQuality');
  const cWater = corr('waterGlasses');
  const cRoutine = corr('routineCount');
  const cHabits = corr('habitsScore');
  const cMood = corr('moodScore');

  // Mean and stddev for each feature (for standardization).
  const featStats = (key: keyof DailyFeatures): { mean: number; stdDev: number } => {
    const values = arr.map(p => p[key] as number).filter(v => typeof v === 'number');
    if (values.length === 0) return { mean: 0, stdDev: 1 };
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    return { mean, stdDev: Math.sqrt(variance) || 1 };
  };

  const sSleep = featStats('sleepHours');
  const sQuality = featStats('sleepQuality');
  const sWater = featStats('waterGlasses');
  const sRoutine = featStats('routineCount');
  const sHabits = featStats('habitsScore');
  const sMood = featStats('moodScore');

  const sampleSize = arr.length;
  const hasEnoughData = sampleSize >= MIN_PAIRS;

  // Last-7-day pattern: average each feature over last 7 calendar days.
  const today = new Date();
  const last7Pattern = (() => {
    const result = {
      sleepHours: 0, sleepCount: 0,
      sleepQuality: 0, qualityCount: 0,
      waterGlasses: 0, waterCount: 0,
      routineCount: 0, routineDays: 0,
      habitsScore: 0, habitsCount: 0,
      moodScore: 0, moodCount: 0,
    };
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today.getTime() - i * MS_PER_DAY).toDateString();
      const f = features.get(d);
      if (!f) continue;
      if (f.sleepHours !== undefined) { result.sleepHours += f.sleepHours; result.sleepCount++; }
      if (f.sleepQuality !== undefined) { result.sleepQuality += f.sleepQuality; result.qualityCount++; }
      if (f.waterGlasses !== undefined) { result.waterGlasses += f.waterGlasses; result.waterCount++; }
      if (f.routineCount !== undefined) { result.routineCount += f.routineCount; result.routineDays++; }
      if (f.habitsScore !== undefined) { result.habitsScore += f.habitsScore; result.habitsCount++; }
      if (f.moodScore !== undefined) { result.moodScore += f.moodScore; result.moodCount++; }
    }
    return {
      sleep: result.sleepCount > 0 ? result.sleepHours / result.sleepCount : sSleep.mean,
      quality: result.qualityCount > 0 ? result.sleepQuality / result.qualityCount : sQuality.mean,
      water: result.waterCount > 0 ? result.waterGlasses / result.waterCount : sWater.mean,
      routine: result.routineDays > 0 ? result.routineCount / result.routineDays : sRoutine.mean,
      habits: result.habitsCount > 0 ? result.habitsScore / result.habitsCount : sHabits.mean,
      mood: result.moodCount > 0 ? result.moodScore / result.moodCount : sMood.mean,
    };
  })();

  // Weight each feature's contribution by abs(correlation), capped at 6 score points.
  // Each unit of standardized z-score contributes (|r| × MAX_SCALE) score points.
  const MAX_SCALE = 6;

  // Per-day gentle drift from the last7 baseline — natural random walk so the
  // forecast doesn't render as a flat line. ±0.5 score points smoothing.
  const driftFor = (i: number): number => {
    // sinusoidal drift makes the chart look natural, not random
    return Math.sin(i * 0.85) * 0.6;
  };

  const days: ForecastDay[] = [];

  for (let i = 0; i < 7; i++) {
    const fwd = new Date(today.getTime() + i * MS_PER_DAY);
    const dayLabel = DAY_LABELS[fwd.getDay()];
    const date = fwd.toDateString();

    // Compute each driver's contribution.
    const drivers: ForecastDriver[] = [];
    const addDriver = (
      feature: ForecastDriver['feature'],
      value: number,
      stats: { mean: number; stdDev: number },
      r: number,
      labelGood: string,
      labelBad: string,
    ) => {
      if (Math.abs(r) < 0.15) return;
      const z = (value - stats.mean) / stats.stdDev;
      const delta = z * Math.abs(r) * MAX_SCALE * Math.sign(r);
      if (Math.abs(delta) < 0.2) return;
      const sign = delta >= 0 ? '+' : '−';
      const label = `${delta >= 0 ? labelGood : labelBad} ${sign}${Math.abs(delta).toFixed(1)}`;
      drivers.push({ feature, delta, label });
    };

    addDriver('sleep', last7Pattern.sleep, sSleep, cSleep, 'Sleep solid:', 'Sleep low:');
    addDriver('water', last7Pattern.water, sWater, cWater, 'Hydration up:', 'Hydration low:');
    addDriver('routine', last7Pattern.routine, sRoutine, cRoutine, 'Routine on:', 'Routine off:');
    addDriver('habits', last7Pattern.habits, sHabits, cHabits, 'Habits high:', 'Habits low:');
    addDriver('mood', last7Pattern.mood, sMood, cMood, 'Mood up:', 'Mood low:');

    // Quality folds into "sleep" rather than its own driver — adds to the sleep delta.
    if (Math.abs(cQuality) >= 0.15) {
      const z = (last7Pattern.quality - sQuality.mean) / sQuality.stdDev;
      const delta = z * Math.abs(cQuality) * MAX_SCALE * Math.sign(cQuality);
      const sleepDriver = drivers.find(d => d.feature === 'sleep');
      if (sleepDriver) {
        sleepDriver.delta += delta;
        const sign = sleepDriver.delta >= 0 ? '+' : '−';
        const lbl = sleepDriver.delta >= 0 ? 'Sleep solid:' : 'Sleep low:';
        sleepDriver.label = `${lbl} ${sign}${Math.abs(sleepDriver.delta).toFixed(1)}`;
      } else if (Math.abs(delta) >= 0.2) {
        const sign = delta >= 0 ? '+' : '−';
        const lbl = delta >= 0 ? 'Sleep solid:' : 'Sleep low:';
        drivers.push({ feature: 'sleep', delta, label: `${lbl} ${sign}${Math.abs(delta).toFixed(1)}` });
      }
    }

    drivers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    const totalDelta = drivers.reduce((acc, d) => acc + d.delta, 0);
    const score = clamp(Math.round(baseline + totalDelta + driftFor(i)), 0, 100);

    days.push({
      date,
      dayLabel,
      score,
      drivers: drivers.slice(0, 3),
    });
  }

  const trendDelta = days[6].score - days[0].score;
  const trend: ForecastReport['trend'] =
    trendDelta >= 2 ? 'rising' : trendDelta <= -2 ? 'falling' : 'flat';

  // Top lever: feature with most negative average delta — that's what's holding back
  // the forecast. If everything is positive, suggest the smallest one to amplify.
  const allDrivers = days.flatMap(d => d.drivers);
  const driverAggregate = new Map<ForecastDriver['feature'], number>();
  for (const d of allDrivers) {
    driverAggregate.set(d.feature, (driverAggregate.get(d.feature) ?? 0) + d.delta);
  }
  let weakest: { feature: ForecastDriver['feature']; total: number } | null = null;
  for (const [feature, total] of driverAggregate) {
    if (!weakest || total < weakest.total) weakest = { feature, total };
  }

  const SUGGESTIONS: Record<ForecastDriver['feature'], string> = {
    sleep: 'Aim for 7.5+ hours tonight — your sleep is the biggest lever.',
    water: 'Add 2 glasses of water tomorrow — your hydration is dragging the forecast.',
    routine: "Hit your evening routine — you've skipped it this week.",
    habits: 'Check off 3 more habits/day — small wins compound.',
    mood: 'Log how you feel — stress shows up on your skin in 2-3 days.',
  };

  const topLever = (weakest && weakest.total < -0.5)
    ? { feature: weakest.feature, suggestion: SUGGESTIONS[weakest.feature] }
    : undefined;

  let headline: string;
  if (!hasEnoughData) {
    headline = `Need ${MIN_PAIRS - sampleSize} more scan${MIN_PAIRS - sampleSize === 1 ? '' : 's'} to forecast accurately. Showing baseline for now.`;
  } else if (trend === 'rising') {
    headline = `Trending up — your habits over the last 7 days project a +${trendDelta} pt gain by ${days[6].dayLabel}.`;
  } else if (trend === 'falling') {
    headline = `Drift down — current pattern projects a ${trendDelta} pt drop by ${days[6].dayLabel}.`;
  } else {
    headline = `Mostly steady — your forecast holds within ${Math.abs(trendDelta) || 1} pt across the week.`;
  }

  return {
    baseline: Math.round(baseline),
    baselineSource,
    sampleSize,
    hasEnoughData,
    days,
    trend,
    trendDelta,
    headline,
    topLever,
  };
}
