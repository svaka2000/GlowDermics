/**
 * AdaptiveRoutineEngine — pure, deterministic derivation of a NON-destructive
 * "adaptive routine" overlay.
 *
 * Given the user's scan history + routine-completion log (read elsewhere via
 * the existing storage getters) it returns a suggestion/annotation layer that
 * references the existing routine — it NEVER mutates or persists a routine,
 * reads or writes device storage, calls the network, or uses randomness or
 * wall-clock time beyond an optional injected `now`. Same inputs ⇒ same output.
 *
 * Inputs are treated as immutable (cloned before sort). Brand-neutral: all
 * guidance is generic ingredient-CLASS advice, never a product/brand name.
 */
import type { SkinAnalysis } from '../types';

/** A single non-destructive suggestion overlaid on the user's routine. */
export interface AdaptiveSuggestion {
  id: string;
  kind: 'reinforce' | 'add' | 'ease' | 'watch';
  title: string;
  rationale: string;
  targetTime?: 'morning' | 'evening' | 'both';
  targetStep?: string;
  severity: 'low' | 'med' | 'high';
}

/** The full adaptive overlay. Purely derived; persists nothing. */
export interface AdaptiveRoutinePlan {
  verdict: string;
  adherencePct: number;
  trendSummary: string;
  suggestions: AdaptiveSuggestion[];
  basis: { scans: number; sinceLabel: string };
}

/** Minimal, decoupled shape — we never import routine-builder's BuiltRoutine. */
export type BuiltRoutineLike = {
  morning: { step?: string; product?: string }[];
  evening: { step?: string; product?: string }[];
};

type DimKey = 'hydration' | 'texture' | 'clarity' | 'evenness' | 'firmness' | 'pores';

const DIMS: DimKey[] = ['hydration', 'texture', 'clarity', 'evenness', 'firmness', 'pores'];

const DIM_LABEL: Record<DimKey, string> = {
  hydration: 'Hydration',
  texture: 'Texture',
  clarity: 'Clarity',
  evenness: 'Evenness',
  firmness: 'Firmness',
  pores: 'Pores',
};

/** Generic, brand-neutral ingredient-CLASS guidance + the routine slot it lives in. */
const DIM_GUIDANCE: Record<DimKey, { add: string; reinforce: string; watch: string; time: 'morning' | 'evening' | 'both'; keyword: string }> = {
  hydration: {
    add: 'Layer a humectant (hyaluronic acid or glycerin) onto damp skin, then seal with a barrier-supporting moisturizer.',
    reinforce: 'Your hydration is climbing — keep humectant-then-seal layering consistent morning and night.',
    watch: 'Hydration slipped. Re-introduce a humectant serum and a richer occlusive at night before adding anything new.',
    time: 'both',
    keyword: 'moistur',
  },
  texture: {
    add: 'Introduce a gentle resurfacing step (a low-strength retinoid or PHA) 1–2 nights a week, building up slowly.',
    reinforce: 'Texture is improving — maintain your current gentle resurfacing cadence without escalating too fast.',
    watch: 'Texture regressed. Hold exfoliation steady (avoid stacking actives) and prioritize barrier repair for two weeks.',
    time: 'evening',
    keyword: 'exfolia',
  },
  clarity: {
    add: 'Add a gentle BHA (salicylic acid) 1–2× per week to keep pores clear without stripping the barrier.',
    reinforce: 'Clarity is trending up — keep your gentle BHA cadence and consistent cleansing.',
    watch: 'Clarity dipped. Tighten evening cleansing and keep a gentle BHA on a fixed weekly schedule.',
    time: 'evening',
    keyword: 'cleans',
  },
  evenness: {
    add: 'Add an antioxidant (vitamin C) in the morning and broad-spectrum SPF daily to even tone over time.',
    reinforce: 'Tone is evening out — daily SPF and your antioxidant step are working; stay consistent.',
    watch: 'Evenness slipped — most often a sun-exposure signal. Reinforce daily broad-spectrum SPF and reapplication.',
    time: 'morning',
    keyword: 'spf',
  },
  firmness: {
    add: 'Add a peptide serum and keep daily SPF — collagen support compounds slowly with consistency.',
    reinforce: 'Firmness is improving — peptides plus rigorous daily SPF are paying off; keep going.',
    watch: 'Firmness eased back. Keep daily SPF non-negotiable and maintain a steady peptide or retinoid step.',
    time: 'morning',
    keyword: 'spf',
  },
  pores: {
    add: 'Add niacinamide and a gentle BHA to refine pores without over-drying.',
    reinforce: 'Pores are looking refined — maintain niacinamide and your gentle BHA rhythm.',
    watch: 'Pores looked more congested. Keep a gentle BHA on schedule and avoid heavy, pore-clogging occlusives at night.',
    time: 'evening',
    keyword: 'niacinamide',
  },
};

const SEV_RANK: Record<AdaptiveSuggestion['severity'], number> = { high: 3, med: 2, low: 1 };

function severityFor(absDelta: number): AdaptiveSuggestion['severity'] {
  if (absDelta >= 10) return 'high';
  if (absDelta >= 6) return 'med';
  return 'low';
}

function monthYear(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function findTargetStep(built: BuiltRoutineLike | null | undefined, keyword: string): string | undefined {
  if (!built) return undefined;
  const all = [...(built.morning ?? []), ...(built.evening ?? [])];
  for (const s of all) {
    const hay = `${s?.step ?? ''} ${s?.product ?? ''}`.toLowerCase();
    if (keyword && hay.indexOf(keyword) > -1) return s?.step || s?.product || undefined;
  }
  return undefined;
}

function emptyPlan(): AdaptiveRoutinePlan {
  return {
    verdict: 'Take a scan to personalize your routine.',
    adherencePct: 0,
    trendSummary: '',
    suggestions: [],
    basis: { scans: 0, sinceLabel: '' },
  };
}

function computeAdherence(routineLog: { date: string; morning: boolean; evening: boolean }[]): number {
  if (!routineLog || routineLog.length === 0) return 0;
  const sorted = [...routineLog]
    .filter((e) => e && typeof e.date === 'string')
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const window = sorted.slice(0, 14);
  if (window.length === 0) return 0;
  const full = window.filter((e) => e.morning && e.evening).length;
  return Math.round((100 * full) / window.length);
}

/**
 * Pure derivation. No I/O, no persistence, no randomness.
 * @param now optional epoch ms (unused for nondeterministic branching; kept for future-proofing/testing).
 */
export function deriveAdaptiveRoutine(
  analyses: SkinAnalysis[],
  routineLog: { date: string; morning: boolean; evening: boolean }[],
  builtRoutine?: BuiltRoutineLike | null,
  now?: number,
): AdaptiveRoutinePlan {
  void now; // accepted for deterministic test injection; no nondeterministic use
  const list = Array.isArray(analyses) ? analyses.filter((a) => a && a.scores && typeof a.date === 'string') : [];
  if (list.length === 0) return emptyPlan();

  const sorted = [...list].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const scans = sorted.length;
  const first = sorted[0];
  const latest = sorted[scans - 1];
  const sinceLabel = monthYear(first.date);
  const adherencePct = computeAdherence(routineLog);

  const suggestions: AdaptiveSuggestion[] = [];

  if (adherencePct < 50) {
    suggestions.push({
      id: 'ease-adherence',
      kind: 'ease',
      title: 'Simplify to protect consistency',
      rationale:
        'Your completed-routine rate is low. A shorter, two-or-three-step routine you actually finish beats a long one you skip — trim to the essentials for two weeks, then rebuild.',
      severity: adherencePct < 25 ? 'high' : 'med',
    });
  }

  if (scans < 2) {
    suggestions.push({
      id: 'reinforce-consistency',
      kind: 'reinforce',
      title: 'Keep your routine steady',
      rationale:
        'One scan is your baseline. Stay consistent with cleanse, hydrate-and-seal, and daily SPF — your next scan will reveal a clear trend to adapt to.',
      severity: 'low',
    });
    const limited = suggestions.slice(0, 5);
    return {
      verdict: 'One scan logged — take another to unlock adaptive guidance.',
      adherencePct,
      trendSummary: '',
      suggestions: limited,
      basis: { scans, sinceLabel },
    };
  }

  const prev = sorted[scans - 2];
  let improving = 0;
  let regressing = 0;

  for (const key of DIMS) {
    const lv = Number(latest.scores?.[key] ?? 0);
    const pv = Number(prev.scores?.[key] ?? 0);
    const delta = lv - pv;
    const g = DIM_GUIDANCE[key];
    const label = DIM_LABEL[key];

    if (delta <= -4) {
      regressing++;
      suggestions.push({
        id: `watch-${key}`,
        kind: 'watch',
        title: `${label} slipped (${delta})`,
        rationale: g.watch,
        targetTime: g.time,
        targetStep: findTargetStep(builtRoutine, g.keyword),
        severity: severityFor(Math.abs(delta)),
      });
    } else if (delta >= 5) {
      improving++;
      suggestions.push({
        id: `reinforce-${key}`,
        kind: 'reinforce',
        title: `${label} is improving (+${delta})`,
        rationale: g.reinforce,
        targetTime: g.time,
        targetStep: findTargetStep(builtRoutine, g.keyword),
        severity: severityFor(Math.abs(delta)),
      });
    } else if (lv < 55 && Math.abs(delta) < 4) {
      suggestions.push({
        id: `add-${key}`,
        kind: 'add',
        title: `Address ${label.toLowerCase()}`,
        rationale: g.add,
        targetTime: g.time,
        targetStep: findTargetStep(builtRoutine, g.keyword),
        severity: lv < 45 ? 'med' : 'low',
      });
    }
  }

  const overallDelta = Number(latest.scores?.overall ?? 0) - Number(prev.scores?.overall ?? 0);
  const trendSummary =
    overallDelta >= 5
      ? `Your overall skin score is trending up (+${overallDelta}).`
      : overallDelta <= -5
        ? `Your overall score dipped (${overallDelta}) — let's stabilize it.`
        : 'Your overall skin score is holding steady.';

  const verdict =
    regressing > improving
      ? 'A few areas are slipping — the small tweaks below should steady them.'
      : improving > 0 && regressing === 0
        ? 'Strong momentum — keep reinforcing what is working.'
        : improving > regressing
          ? 'Net positive. A couple of focused adjustments will compound it.'
          : 'Steady. Consistency is doing its job — refine, do not overhaul.';

  const ordered = suggestions
    .map((s, i) => ({ s, i }))
    .sort((a, b) => SEV_RANK[b.s.severity] - SEV_RANK[a.s.severity] || a.i - b.i)
    .map((x) => x.s)
    .slice(0, 5);

  return {
    verdict,
    adherencePct,
    trendSummary,
    suggestions: ordered,
    basis: { scans, sinceLabel },
  };
}

export default deriveAdaptiveRoutine;
