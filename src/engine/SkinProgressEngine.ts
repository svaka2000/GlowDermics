import AsyncStorage from '@react-native-async-storage/async-storage';
import { Storage } from '../services/storage';
import { SkinAnalysis, JournalEntry } from '../types';

const HABITS_KEY = 'gd_daily_habits';

type MetricKey = 'overall' | 'hydration' | 'texture' | 'clarity' | 'evenness' | 'firmness' | 'pores';

export interface MetricTrajectory {
  metric: MetricKey;
  label: string;
  data: { date: string; value: number }[];
  trend: number;        // points per week (positive = improving)
  prediction: number;   // predicted value in 7 days
  current: number;
}

export interface CorrelationFactor {
  factor: string;
  impact: number;   // normalised -1 to +1
  evidence: string;
  count: number;
}

export interface EngineReport {
  trajectories: MetricTrajectory[];
  whatWorking: CorrelationFactor[];
  whatNotWorking: CorrelationFactor[];
  overallTrend: 'improving' | 'stable' | 'declining';
  daysTracked: number;
  scanCount: number;
  predictedOverall: number;
  coachContext: string;
}

const METRIC_LABELS: Record<MetricKey, string> = {
  overall: 'Overall', hydration: 'Hydration', texture: 'Texture',
  clarity: 'Clarity', evenness: 'Evenness', firmness: 'Firmness', pores: 'Pores',
};

function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  values.forEach((v, i) => { num += (i - meanX) * (v - meanY); den += (i - meanX) ** 2; });
  return den === 0 ? 0 : num / den;
}

function getScanValue(scan: SkinAnalysis, metric: MetricKey): number {
  return metric === 'overall' ? scan.scores.overall : scan.scores[metric];
}

async function getHabitLogs(): Promise<{ date: string; checked: string[] }[]> {
  const raw = await AsyncStorage.getItem(HABITS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function runSkinProgressEngine(): Promise<EngineReport | null> {
  const [analyses, journal, routineLog, habitLogs] = await Promise.all([
    Storage.getAnalyses(),
    Storage.getJournal(),
    Storage.getFullRoutineLog(),
    getHabitLogs(),
  ]);

  if (analyses.length === 0) return null;

  // Chronological order
  const scans = [...analyses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latest = scans[scans.length - 1];
  const oldest = scans[0];
  const daysTracked = scans.length > 1
    ? Math.round((new Date(latest.date).getTime() - new Date(oldest.date).getTime()) / 86400000)
    : 0;

  // Average days between scans — used to convert per-scan slope to per-week
  const avgDaysBetweenScans = scans.length > 1 ? daysTracked / (scans.length - 1) : 7;

  // ── Trajectories ─────────────────────────────────────────────────────────
  const metrics: MetricKey[] = ['overall', 'hydration', 'texture', 'clarity', 'evenness', 'firmness', 'pores'];

  const trajectories: MetricTrajectory[] = metrics.map(metric => {
    const data = scans.map(s => ({ date: s.date, value: getScanValue(s, metric) }));
    const values = data.map(d => d.value);
    const slopePerScan = linearSlope(values);
    const trendPerWeek = Math.round(slopePerScan * (7 / avgDaysBetweenScans) * 10) / 10;
    const current = values[values.length - 1];
    const prediction = Math.min(100, Math.max(0, Math.round(current + trendPerWeek)));
    return { metric, label: METRIC_LABELS[metric], data, trend: trendPerWeek, prediction, current };
  });

  const overallTraj = trajectories[0]; // 'overall' is first
  const overallTrend: EngineReport['overallTrend'] =
    overallTraj.trend > 1.5 ? 'improving' : overallTraj.trend < -1.5 ? 'declining' : 'stable';

  // ── Correlation analysis ──────────────────────────────────────────────────
  const factorMap = new Map<string, { sum: number; count: number }>();

  const addFactor = (factor: string, impact: number) => {
    const entry = factorMap.get(factor) ?? { sum: 0, count: 0 };
    entry.sum += impact;
    entry.count += 1;
    factorMap.set(factor, entry);
  };

  // Inter-scan periods
  for (let i = 1; i < scans.length; i++) {
    const prev = scans[i - 1];
    const curr = scans[i];
    const periodStart = new Date(prev.date).getTime();
    const periodEnd = new Date(curr.date).getTime();
    const delta = curr.scores.overall - prev.scores.overall; // overall delta this period

    // Journal tags in this period
    const periodJournal = journal.filter(j => {
      const t = new Date(j.date).getTime();
      return t >= periodStart && t <= periodEnd;
    });

    if (periodJournal.length > 0) {
      const allTags = periodJournal.flatMap(j => j.tags);
      const tagFreq = new Map<string, number>();
      allTags.forEach(tag => tagFreq.set(tag, (tagFreq.get(tag) ?? 0) + 1));
      tagFreq.forEach((freq, tag) => {
        const relFreq = freq / periodJournal.length;
        addFactor(tag, relFreq * Math.sign(delta) * Math.min(1, Math.abs(delta) / 10));
      });

      // Mood correlation
      const moodScore = periodJournal.reduce((acc, j) => {
        return acc + ({ great: 1, good: 0.5, okay: 0, bad: -0.5 }[j.mood] ?? 0);
      }, 0) / periodJournal.length;
      if (Math.abs(moodScore) > 0.25) {
        addFactor('Low stress / good mood', moodScore * Math.sign(delta) * 0.6);
      }
    }

    // Habit logs in this period
    const periodHabits = habitLogs.filter(h => {
      const t = new Date(h.date).getTime();
      return t >= periodStart && t <= periodEnd;
    });
    if (periodHabits.length > 0) {
      const habitFreq = new Map<string, number>();
      periodHabits.forEach(day => day.checked.forEach(hid => {
        habitFreq.set(hid, (habitFreq.get(hid) ?? 0) + 1);
      }));
      const habitLabels: Record<string, string> = {
        spf: 'Daily SPF', water: 'Drinking 8+ glasses water', sleep: '7-8 hours sleep',
        morning_routine: 'Consistent morning routine', evening_routine: 'Consistent evening routine',
        vegetables: 'Eating vegetables / greens', no_touching: 'Not touching face',
        exercise: 'Regular exercise', no_sugar: 'Avoiding sugar/dairy',
        stress: 'Managing stress', clean_pillowcase: 'Clean pillowcase', clean_phone: 'Clean phone screen',
      };
      habitFreq.forEach((freq, hid) => {
        const relFreq = freq / periodHabits.length;
        if (relFreq > 0.4 && habitLabels[hid]) {
          addFactor(habitLabels[hid], relFreq * Math.sign(delta) * 0.7);
        }
      });
    }

    // Strengths/concerns from scan
    if (delta > 3) {
      curr.strengths.forEach(s => addFactor(s, 0.4));
    }
    if (delta < -3) {
      curr.concerns.forEach(c => addFactor(c, -0.4));
    }
  }

  // Routine completion rate (last 30 days) as a baseline factor
  const recent30 = routineLog.slice(0, 30);
  if (recent30.length > 0) {
    const morningRate = recent30.filter(r => r.morning).length / recent30.length;
    const eveningRate = recent30.filter(r => r.evening).length / recent30.length;
    if (morningRate > 0.5) addFactor('Consistent morning routine', morningRate * 0.6);
    if (eveningRate > 0.5) addFactor('Consistent evening routine', eveningRate * 0.6);
    if (morningRate < 0.25) addFactor('Inconsistent morning routine', -morningRate * 0.5 - 0.3);
    if (eveningRate < 0.25) addFactor('Inconsistent evening routine', -eveningRate * 0.5 - 0.3);
  }

  // Convert factor map to sorted arrays
  const allFactors: CorrelationFactor[] = [];
  factorMap.forEach((val, factor) => {
    const impact = val.count > 0 ? val.sum / val.count : 0;
    allFactors.push({ factor, impact, evidence: `Seen across ${val.count} tracking period${val.count > 1 ? 's' : ''}`, count: val.count });
  });

  let whatWorking = allFactors.filter(f => f.impact > 0.15).sort((a, b) => b.impact - a.impact).slice(0, 4);
  let whatNotWorking = allFactors.filter(f => f.impact < -0.15).sort((a, b) => a.impact - b.impact).slice(0, 3);

  // Fallback: if no correlation data, surface scan-derived insights
  if (whatWorking.length === 0) {
    if (recent30.filter(r => r.morning).length > 5) {
      whatWorking.push({ factor: 'Morning skincare routine', impact: 0.5, evidence: 'Completed consistently', count: recent30.filter(r => r.morning).length });
    }
    if (recent30.filter(r => r.evening).length > 5) {
      whatWorking.push({ factor: 'Evening skincare routine', impact: 0.45, evidence: 'Completed consistently', count: recent30.filter(r => r.evening).length });
    }
    latest.strengths.slice(0, 2).forEach(s => {
      whatWorking.push({ factor: s, impact: 0.4, evidence: 'Detected in your latest scan', count: 1 });
    });
  }
  if (whatNotWorking.length === 0 && latest.concerns.length > 0) {
    whatNotWorking.push({
      factor: latest.concerns[0],
      impact: -0.3,
      evidence: 'Flagged in your latest scan',
      count: 1,
    });
  }

  // ── Coach context string ──────────────────────────────────────────────────
  const improving = trajectories.filter(t => t.trend > 1.5 && t.metric !== 'overall').map(t => t.label);
  const declining = trajectories.filter(t => t.trend < -1.5 && t.metric !== 'overall').map(t => t.label);

  const coachContext = [
    `[Skin Progress Engine — use this data to give personalised advice, referencing specifics:]`,
    `${scans.length} scan${scans.length > 1 ? 's' : ''} over ${daysTracked} days. Current overall score: ${latest.scores.overall}/100.`,
    overallTrend === 'improving'
      ? `Trend: IMPROVING — +${overallTraj.trend} pts/week.`
      : overallTrend === 'declining'
      ? `Trend: DECLINING — ${overallTraj.trend} pts/week. This needs attention.`
      : `Trend: STABLE. Focus on optimisation, not repair.`,
    improving.length > 0 ? `Improving: ${improving.join(', ')}.` : '',
    declining.length > 0 ? `Declining: ${declining.join(', ')} — these need focus.` : '',
    `Predicted overall next week: ${overallTraj.prediction}/100.`,
    whatWorking.length > 0 ? `What's working: ${whatWorking.slice(0, 2).map(w => w.factor).join(', ')}.` : '',
    whatNotWorking.length > 0 ? `Potential issues: ${whatNotWorking.slice(0, 2).map(w => w.factor).join(', ')}.` : '',
  ].filter(Boolean).join(' ');

  return {
    trajectories,
    whatWorking,
    whatNotWorking,
    overallTrend,
    daysTracked,
    scanCount: scans.length,
    predictedOverall: overallTraj.prediction,
    coachContext,
  };
}
