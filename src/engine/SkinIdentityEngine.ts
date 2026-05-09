/**
 * SkinIdentityEngine — derive a "Skin Persona" identity from the user's data.
 *
 * Output: a single SkinIdentity object containing
 *   - persona (8 archetypes, e.g. "Steady Glow", "The Comeback")
 *   - element (Earth | Water | Fire | Air | Crystal — themed to skin type)
 *   - glowScore (composite 0-100 across all dimensions, weighted)
 *   - top 3 strength dimensions
 *   - top 3 challenge dimensions
 *   - signature line (poetic 1-liner that captures the persona)
 *   - colorway (hero gradient + accent color tied to persona)
 *
 * This is intentionally rules-based, not ML — every persona is a clean
 * combination of (consistency, trend, score, mood-variability) that maps to
 * a recognizable identity.
 */
import { Storage } from '../services/storage';
import type { SkinAnalysis, SkinScoreV2 } from '../types';

export type SkinPersona =
  | 'Steady Glow'
  | 'The Comeback'
  | 'Resilient Skin'
  | 'Glow Seeker'
  | 'Radiant Veteran'
  | 'Reactive Climber'
  | 'Discovery Phase'
  | 'Skin Architect';

export type SkinElement = 'Earth' | 'Water' | 'Fire' | 'Air' | 'Crystal';

export interface DimensionScore {
  /** Display label, e.g. "Hydration". */
  label: string;
  /** Internal key in SkinScoreV2. */
  key: keyof SkinScoreV2;
  /** Score 0-100. */
  value: number;
}

export interface SkinIdentity {
  /** User's name (from profile) for the card. */
  name: string;
  /** Days since their first scan (or onboarding if no scans). */
  memberSinceDays: number;
  /** Persona archetype. */
  persona: SkinPersona;
  /** Element archetype, themed to skin type. */
  element: SkinElement;
  /** Composite 0-100 score across all dimensions, weighted by importance. */
  glowScore: number;
  /** Top 3 strongest dimensions. */
  strengths: DimensionScore[];
  /** Top 3 weakest dimensions. */
  challenges: DimensionScore[];
  /** Total scans completed. */
  totalScans: number;
  /** Current daily-tracking streak. */
  streak: number;
  /** Trend across last 5 scans: rising | falling | flat. */
  trend: 'rising' | 'falling' | 'flat';
  /** Trend delta (latest score - 5-scan-ago score). */
  trendDelta: number;
  /** Poetic 1-liner that captures the persona. */
  signature: string;
  /** Persona-themed colorway. */
  colorway: {
    /** Primary hero gradient (start-end). */
    gradient: [string, string];
    /** Accent color for badges, ring, etc. */
    accent: string;
    /** Soft tint for backgrounds. */
    tint: string;
  };
  /** True if the user has at least one v2 scan; otherwise we fall back to defaults. */
  hasV2Scan: boolean;
}

const DIM_LABELS: Record<keyof SkinScoreV2, string> = {
  overall: 'Overall',
  hydration: 'Hydration',
  texture: 'Texture',
  clarity: 'Clarity',
  evenness: 'Evenness',
  firmness: 'Firmness',
  pores: 'Pores',
  radiance: 'Radiance',
  redness: 'Redness',
  darkSpots: 'Dark Spots',
  darkCircles: 'Dark Circles',
  wrinkles: 'Wrinkles',
  acne: 'Acne',
  oiliness: 'Oiliness',
  sensitivity: 'Sensitivity',
  barrierHealth: 'Barrier Health',
};

/** Some dimensions weight more than others in the composite glow score. */
const DIM_WEIGHTS: Partial<Record<keyof SkinScoreV2, number>> = {
  overall: 0,         // exclude — it's a derived/duplicate
  hydration: 1.2,
  barrierHealth: 1.2,
  radiance: 1.1,
  clarity: 1.0,
  evenness: 1.0,
  texture: 1.0,
  firmness: 0.9,
  pores: 0.8,
  redness: 0.9,
  darkSpots: 0.8,
  darkCircles: 0.7,
  wrinkles: 0.7,
  acne: 1.0,
  oiliness: 0.6,
  sensitivity: 0.7,
};

const COLORWAYS: Record<SkinPersona, SkinIdentity['colorway']> = {
  'Steady Glow': {
    gradient: ['#C4622D', '#E89A4D'],
    accent: '#C4622D',
    tint: '#FFE8D4',
  },
  'The Comeback': {
    gradient: ['#1F8A6F', '#5DC4A4'],
    accent: '#1F8A6F',
    tint: '#D4F2E8',
  },
  'Resilient Skin': {
    gradient: ['#3B5673', '#6B85A8'],
    accent: '#3B5673',
    tint: '#D4DCEA',
  },
  'Glow Seeker': {
    gradient: ['#9B5BA8', '#C683CE'],
    accent: '#9B5BA8',
    tint: '#EDD6F0',
  },
  'Radiant Veteran': {
    gradient: ['#B8893E', '#E0BB6E'],
    accent: '#B8893E',
    tint: '#F5E6CB',
  },
  'Reactive Climber': {
    gradient: ['#D45A3D', '#F08161'],
    accent: '#D45A3D',
    tint: '#FFD9CD',
  },
  'Discovery Phase': {
    gradient: ['#5C8AB8', '#8FB1D9'],
    accent: '#5C8AB8',
    tint: '#DCE8F5',
  },
  'Skin Architect': {
    gradient: ['#2D4253', '#5A7287'],
    accent: '#2D4253',
    tint: '#D4DDE5',
  },
};

const SIGNATURES: Record<SkinPersona, string> = {
  'Steady Glow': 'Consistency built your shine — keep walking the path.',
  'The Comeback': 'You earned this lift. Every scan tells the climb.',
  'Resilient Skin': 'Your skin holds its line. Steadiness is its strength.',
  'Glow Seeker': 'Curious, expressive, always evolving — your skin reflects you.',
  'Radiant Veteran': 'Years of care show in every dimension. The work compounds.',
  'Reactive Climber': "Your skin speaks loudly — it's worth listening every day.",
  'Discovery Phase': "Just getting started — and that's the most exciting chapter.",
  'Skin Architect': 'Methodical, intentional, building the routine that scales.',
};

const SIGNATURES_V2: Record<SkinPersona, string[]> = {
  'Steady Glow': [
    'Consistency built your shine — keep walking the path.',
    'Quiet excellence. Day after day, scan after scan.',
  ],
  'The Comeback': [
    'You earned this lift. Every scan tells the climb.',
    'From baseline to better — proof that effort works.',
  ],
  'Resilient Skin': [
    'Your skin holds its line. Steadiness is its strength.',
    'Unshakable. While others swing, you anchor.',
  ],
  'Glow Seeker': [
    'Curious, expressive, always evolving — your skin reflects you.',
    'Glow follows the seekers. Keep exploring.',
  ],
  'Radiant Veteran': [
    'Years of care show in every dimension. The work compounds.',
    'Veteran skin: where time becomes texture, and texture becomes glow.',
  ],
  'Reactive Climber': [
    "Your skin speaks loudly — it's worth listening every day.",
    'Sensitive but climbing. The signal is feedback, not failure.',
  ],
  'Discovery Phase': [
    "Just getting started — and that's the most exciting chapter.",
    'Day one of the best version of your skin.',
  ],
  'Skin Architect': [
    'Methodical, intentional, building the routine that scales.',
    'Architecture over alchemy. Every step has a reason.',
  ],
};

function pickSignature(persona: SkinPersona, seed: number): string {
  const arr = SIGNATURES_V2[persona];
  if (!arr || arr.length === 0) return SIGNATURES[persona];
  return arr[seed % arr.length];
}

function inferElement(skinType: string | undefined): SkinElement {
  switch (skinType) {
    case 'dry': return 'Earth';
    case 'oily': return 'Water';
    case 'combination': return 'Air';
    case 'sensitive': return 'Air';
    case 'normal': return 'Crystal';
    default: return 'Crystal';
  }
}

function classifyTrend(scores: number[]): { trend: 'rising' | 'falling' | 'flat'; delta: number } {
  if (scores.length < 2) return { trend: 'flat', delta: 0 };
  // scores[0] is newest; compare newest vs oldest in the window
  const newest = scores[0];
  const oldest = scores[scores.length - 1];
  const delta = newest - oldest;
  if (delta >= 4) return { trend: 'rising', delta };
  if (delta <= -4) return { trend: 'falling', delta };
  return { trend: 'flat', delta };
}

function variance(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length;
}

interface PersonaInputs {
  totalScans: number;
  streak: number;
  trend: 'rising' | 'falling' | 'flat';
  trendDelta: number;
  glowScore: number;
  memberSinceDays: number;
  scoreVariance: number;     // higher = bouncier scans
  moodVariance: number;      // higher = bouncier journal moods
  skinType: string | undefined;
}

function pickPersona(p: PersonaInputs): SkinPersona {
  // The Comeback: clearly recovering trend (started lower, now higher)
  if (p.totalScans >= 4 && p.trend === 'rising' && p.trendDelta >= 8) return 'The Comeback';

  // Radiant Veteran: long history + high score
  if (p.memberSinceDays >= 90 && p.totalScans >= 6 && p.glowScore >= 78) return 'Radiant Veteran';

  // Skin Architect: long streak + low variance (very disciplined)
  if (p.streak >= 14 && p.scoreVariance < 25) return 'Skin Architect';

  // Steady Glow: consistent (low variance) and decent score
  if (p.streak >= 7 && p.scoreVariance < 40 && p.glowScore >= 65) return 'Steady Glow';

  // Resilient Skin: long member + flat trend, regardless of score
  if (p.memberSinceDays >= 30 && p.trend === 'flat' && p.totalScans >= 4) return 'Resilient Skin';

  // Reactive Climber: high mood/score variance, sensitive skin signal
  if ((p.scoreVariance >= 60 || p.moodVariance >= 0.15) && (p.skinType === 'sensitive' || p.totalScans >= 3)) {
    return 'Reactive Climber';
  }

  // Glow Seeker: improving but not yet steady — exploration phase
  if (p.totalScans >= 2 && p.trend !== 'falling' && p.glowScore < 78) return 'Glow Seeker';

  // Discovery Phase: very few scans / new user
  if (p.totalScans <= 2 || p.memberSinceDays < 7) return 'Discovery Phase';

  return 'Steady Glow';
}

function moodToScore(m: 'great' | 'good' | 'okay' | 'bad'): number {
  switch (m) {
    case 'great': return 1;
    case 'good': return 0.66;
    case 'okay': return 0.33;
    case 'bad': return 0;
  }
}

export async function runSkinIdentity(): Promise<SkinIdentity> {
  const [profile, scans, journal, streakRaw] = await Promise.all([
    Storage.getUserProfile(),
    Storage.getScanHistory(),
    Storage.getJournal(),
    Storage.getStreak(),
  ]);

  const name = (profile?.name && profile.name.trim().length > 0) ? profile.name.trim() : 'You';
  const skinType = profile?.skinType;

  // Member-since: earliest of (oldest scan, oldest journal). Default to today.
  const earliestScan = scans.length > 0 ? new Date(scans[scans.length - 1].date).getTime() : Number.POSITIVE_INFINITY;
  const earliestJournal = journal.length > 0 ? new Date(journal[journal.length - 1].date).getTime() : Number.POSITIVE_INFINITY;
  const earliest = Math.min(earliestScan, earliestJournal);
  const memberSinceDays = isFinite(earliest)
    ? Math.max(0, Math.round((Date.now() - earliest) / (24 * 60 * 60 * 1000)))
    : 0;

  // Pull most recent v2 scan for dimensions, fall back to v1 if needed.
  const latestFull = await (async (): Promise<SkinAnalysis | null> => {
    const analyses = await Storage.getAnalyses();
    return analyses[0] ?? null;
  })();

  const v2 = latestFull?.scoresV2;
  const hasV2Scan = !!v2;

  // Compute weighted glow score across the dimensions we have.
  let glowScore = 70;
  let strengths: DimensionScore[] = [];
  let challenges: DimensionScore[] = [];

  if (v2) {
    const entries = (Object.entries(v2) as Array<[keyof SkinScoreV2, number]>)
      .filter(([key]) => key !== 'overall' && (DIM_WEIGHTS[key] ?? 0) > 0);

    const wSum = entries.reduce((acc, [, v], i) => acc + v * (DIM_WEIGHTS[entries[i][0]] ?? 1), 0);
    const wTot = entries.reduce((acc, [k]) => acc + (DIM_WEIGHTS[k] ?? 1), 0);
    glowScore = Math.round(wSum / wTot);

    const ranked = entries
      .map(([k, v]) => ({ key: k, label: DIM_LABELS[k], value: v }))
      .sort((a, b) => b.value - a.value);

    strengths = ranked.slice(0, 3);
    challenges = ranked.slice(-3).reverse();
  } else if (latestFull) {
    // v1-only fallback
    const v1Entries = Object.entries(latestFull.scores)
      .filter(([key]) => key !== 'overall') as Array<[keyof SkinScoreV2, number]>;

    if (v1Entries.length > 0) {
      const sum = v1Entries.reduce((acc, [, v]) => acc + v, 0);
      glowScore = Math.round(sum / v1Entries.length);
      const ranked = v1Entries
        .map(([k, v]) => ({ key: k, label: DIM_LABELS[k] ?? k, value: v }))
        .sort((a, b) => b.value - a.value);
      strengths = ranked.slice(0, 3);
      challenges = ranked.slice(-3).reverse();
    }
  }

  // Trend across last 5 scans
  const recentScores = scans.slice(0, 5).map(s => s.overallScore);
  const { trend, delta: trendDelta } = classifyTrend(recentScores);
  const scoreVariance = variance(recentScores);

  // Mood variance from last 14 journal entries
  const recentMoods = journal.slice(0, 14).map(j => moodToScore(j.mood));
  const moodVariance = variance(recentMoods);

  const persona = pickPersona({
    totalScans: scans.length,
    streak: streakRaw,
    trend,
    trendDelta,
    glowScore,
    memberSinceDays,
    scoreVariance,
    moodVariance,
    skinType,
  });

  const element = inferElement(skinType);
  const colorway = COLORWAYS[persona];
  const signature = pickSignature(persona, memberSinceDays);

  return {
    name,
    memberSinceDays,
    persona,
    element,
    glowScore,
    strengths,
    challenges,
    totalScans: scans.length,
    streak: streakRaw,
    trend,
    trendDelta,
    signature,
    colorway,
    hasV2Scan,
  };
}

