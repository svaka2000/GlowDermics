/** Legacy v1 — kept for backward compatibility with stored scans. */
export interface SkinScore {
  overall: number;
  hydration: number;
  texture: number;
  clarity: number;
  evenness: number;
  firmness: number;
  pores: number;
}

/**
 * v2 SkinScore — 16 dimensions for clinical-grade analysis.
 * Backwards compatible: every v1 dimension is preserved.
 *
 * New dimensions inspired by Haut.AI (150+ biomarkers) and Lóvi (medical-board scanner):
 * - radiance      luminosity / glow vs dullness
 * - redness       diffuse erythema (rosacea / inflammation)
 * - darkSpots     post-inflammatory hyperpigmentation, sun damage
 * - darkCircles   periorbital pigmentation / vascular shadowing
 * - wrinkles      fine lines + expression lines
 * - acne          active blemishes (comedones / papules / pustules)
 * - oiliness      sebum production indicators (shine on T-zone)
 * - sensitivity   visible reactivity / capillary fragility
 * - barrierHealth lipid-barrier integrity (flaking, tightness, dehydration patches)
 */
export interface SkinScoreV2 extends SkinScore {
  radiance: number;
  redness: number;
  darkSpots: number;
  darkCircles: number;
  wrinkles: number;
  acne: number;
  oiliness: number;
  sensitivity: number;
  barrierHealth: number;
}

/** Per-metric confidence (0–100) — how certain the model is in each score. */
export type SkinConfidence = Partial<Record<keyof SkinScoreV2, number>>;

/** Facial regions for spatial analysis. */
export type FaceRegion =
  | 'forehead'
  | 'leftCheek'
  | 'rightCheek'
  | 'nose'
  | 'chin'
  | 'eyeArea'
  | 'jawline'
  | 'lipArea';

/** Region-specific findings (e.g., congestion on chin, redness on cheeks). */
export interface RegionalFinding {
  region: FaceRegion;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  observation: string;        // 1-line plain-English description
  metrics?: Partial<SkinScoreV2>; // optional metric overrides for this region
}

/** Pre-flight photo quality check (run BEFORE sending to AI). */
export interface PhotoQuality {
  ok: boolean;
  /** Overall capture quality 0-100; <60 should warn, <40 should block. */
  score: number;
  lighting: 'too-dark' | 'too-bright' | 'uneven' | 'good';
  focus: 'blurry' | 'soft' | 'sharp';
  faceDetected: boolean;
  /** True when filters/heavy makeup likely interfere with analysis. */
  filterDetected?: boolean;
  /** Plain-English message to show user if quality is low. */
  warning?: string;
  /** Specific retake guidance, if any. */
  recommendations?: string[];
}

/** Estimated biological skin age + age delta vs chronological. */
export interface SkinAge {
  estimated: number;           // estimated age in years
  /** Optional vs chronological — populated only if profile age is known. */
  delta?: number;              // negative = younger than age, positive = older
  bracket: 'younger' | 'on-track' | 'older';
}

export interface SkinAnalysis {
  id: string;
  date: string;
  imageUri: string;

  /** v1 scores (always present for back-compat). */
  scores: SkinScore;

  /** v2 expanded scores — present on scans run on/after v2 release. */
  scoresV2?: SkinScoreV2;

  /** Per-metric confidence — only on v2 scans. */
  confidence?: SkinConfidence;

  /** Per-region findings — only on v2 scans. */
  regions?: RegionalFinding[];

  /** Pre-flight photo quality result. */
  photoQuality?: PhotoQuality;

  /** Estimated skin age — only on v2 scans. */
  skinAge?: SkinAge;

  /** Top biomarker tags (e.g., "compromised barrier", "sun damage"). */
  biomarkers?: string[];

  /** Schema version — used by migrations and feature gating. */
  schemaVersion?: 1 | 2;

  skinType: 'oily' | 'dry' | 'combination' | 'normal' | 'sensitive';
  concerns: string[];
  strengths: string[];
  insights: string;
  recommendations: Recommendation[];
  routine: RoutineStep[];
}

export interface Recommendation {
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  product?: ProductSuggestion;
}

export interface ProductSuggestion {
  name: string;
  brand: string;
  category: string;
  why: string;
  isTallowDermics?: boolean;
}

export interface RoutineStep {
  time: 'morning' | 'evening' | 'both';
  order: number;
  step: string;
  product: string;
  why: string;
  duration?: string;
}

export interface UserProfile {
  name: string;
  skinType: string;
  primaryConcerns: string[];
  goals: string[];
  lifestyle: {
    sleepHours: number;
    waterIntake: string;
    sunExposure: string;
    diet: string;
  };
  onboardingComplete: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ScanHistoryEntry {
  id: string;
  date: string;
  imageUri: string;
  overallScore: number;
  scores: SkinScore;
}

export interface JournalEntry {
  id: string;
  date: string;
  mood: 'great' | 'good' | 'okay' | 'bad';
  note: string;
  tags: string[];
  scanId?: string; // linked scan if same day
}

/** AI ingredient-conflict analyzer output. */
export type ConflictSeverity = 'avoid' | 'caution' | 'separate' | 'safe';

export interface IngredientConflict {
  /** First product / ingredient name (as the user typed or AI normalized). */
  a: string;
  /** Second product / ingredient name. */
  b: string;
  severity: ConflictSeverity;
  /** Plain-English explanation of why these conflict. */
  reason: string;
  /** Optional how-to-use-them-together guidance. */
  workaround?: string;
}

export interface RoutineConflictReport {
  /** All detected conflicts (excluding safe). */
  conflicts: IngredientConflict[];
  /** Soft warnings — products that don't conflict but have caveats (e.g., "introduce slowly"). */
  warnings: string[];
  /** General recommendations to improve the user's routine. */
  recommendations: string[];
  /** AI-detected products from the user's input (after normalization). */
  detected: string[];
  /** 0–100 overall routine compatibility score; 100 = no conflicts at all. */
  routineScore: number;
  /** AI-summarized 1-line verdict, e.g. "Strong routine. One spacing fix recommended." */
  verdict: string;
}
