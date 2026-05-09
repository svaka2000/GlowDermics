import Groq from 'groq-sdk';
import {
  SkinAnalysis,
  SkinScore,
  SkinScoreV2,
  SkinConfidence,
  RegionalFinding,
  SkinAge,
  PhotoQuality,
  UserProfile,
} from '../types';

// Groq — free tier, used for both vision (skin scan) and chat
const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const CHAT_MODEL = 'llama-3.3-70b-versatile';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function clampOrUndef(n: unknown): number | undefined {
  return typeof n === 'number' && !Number.isNaN(n) ? clamp(n) : undefined;
}

/** Retry an async fn with exponential backoff on transient errors. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message ?? err);
      const isTransient =
        /timeout|network|fetch|ECONN|503|502|504|rate.?limit/i.test(msg);
      if (i === attempts || !isTransient) throw err;
      await new Promise(r => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw lastErr;
}

/**
 * v2 skin analysis — 16 dimensions, regional findings, confidence, biomarkers.
 *
 * Backwards compatible: the returned `SkinAnalysis` always has v1 `scores`
 * populated so legacy screens keep working. v2-only fields (`scoresV2`,
 * `confidence`, `regions`, `skinAge`, `biomarkers`) are added on top.
 */
export async function analyzeSkin(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png',
  userProfile: UserProfile | null,
): Promise<SkinAnalysis> {
  const profileContext = userProfile
    ? `User profile — skin type self-reported: ${userProfile.skinType}. Concerns: ${userProfile.primaryConcerns.join(', ')}. Goals: ${userProfile.goals.join(', ')}. Lifestyle — sleep ~${userProfile.lifestyle.sleepHours}h, water: ${userProfile.lifestyle.waterIntake}, sun exposure: ${userProfile.lifestyle.sunExposure}, diet: ${userProfile.lifestyle.diet}.`
    : 'No user profile available — analyze from image only.';

  const prompt = `You are GlowDermics AI, a clinical-grade skin analysis engine modeled on dermatology consensus + computer vision biomarker extraction (Haut.AI / Lóvi tier). Examine this facial photo with rigor.

${profileContext}

Return a JSON object exactly matching the schema below. Reply with JSON ONLY — no markdown, no code fences, no commentary.

SCORING DISCIPLINE:
- All numeric scores are integers 0–100. Higher = better skin (e.g., higher "redness" means LESS visible redness).
- Each score must reflect what is genuinely visible. Do NOT use 65 as a default — pick a real number.
- Across the 16 dimensions, expect natural variance: at least 6 dimensions should differ by ≥4 from the median.
- "overall" must be a weighted synthesis, NOT an average of every dimension.
- Each "confidence" value reflects how clearly that signal is visible in the photo (0=guess, 100=certain).
- If image is non-face, blurry, or poorly lit, set photoQuality.ok=false and return overall=0 with insights explaining the issue.

SCHEMA:
{
  "photoQuality": {
    "ok": true,
    "score": 78,
    "lighting": "good",
    "focus": "sharp",
    "faceDetected": true,
    "filterDetected": false,
    "warning": null,
    "recommendations": []
  },
  "scores": {
    "overall": 72,
    "hydration": 68,
    "texture": 75,
    "clarity": 64,
    "evenness": 70,
    "firmness": 66,
    "pores": 71,
    "radiance": 73,
    "redness": 62,
    "darkSpots": 80,
    "darkCircles": 55,
    "wrinkles": 78,
    "acne": 90,
    "oiliness": 70,
    "sensitivity": 68,
    "barrierHealth": 72
  },
  "confidence": {
    "hydration": 80, "texture": 85, "clarity": 80, "evenness": 75,
    "firmness": 60, "pores": 90, "radiance": 70, "redness": 80,
    "darkSpots": 75, "darkCircles": 85, "wrinkles": 70, "acne": 95,
    "oiliness": 80, "sensitivity": 65, "barrierHealth": 70
  },
  "regions": [
    { "region": "forehead",   "severity": "mild",     "observation": "minor congestion / shine" },
    { "region": "leftCheek",  "severity": "moderate", "observation": "diffuse erythema, visible texture" },
    { "region": "rightCheek", "severity": "mild",     "observation": "slight unevenness" },
    { "region": "nose",       "severity": "moderate", "observation": "enlarged pores, sebum visible" },
    { "region": "chin",       "severity": "none",     "observation": "clear" },
    { "region": "eyeArea",    "severity": "moderate", "observation": "shadowing under-eye" },
    { "region": "jawline",    "severity": "none",     "observation": "smooth" }
  ],
  "skinAge": {
    "estimated": 27,
    "bracket": "on-track"
  },
  "biomarkers": ["mild dehydration", "uneven sebum", "early UV pigmentation"],
  "skinType": "combination",
  "concerns": ["dehydration on cheeks", "T-zone shine"],
  "strengths": ["even tone", "no active acne"],
  "insights": "2-3 sentences of honest, specific, dermatology-grade observation grounded in what you actually see.",
  "recommendations": [
    {
      "category": "Hydration",
      "title": "Layer humectant before cream",
      "description": "1-2 sentences: why and how.",
      "priority": "high",
      "product": {
        "name": "Hyaluronic Acid 2% + B5",
        "brand": "The Ordinary",
        "category": "Serum",
        "why": "1 sentence why this product specifically",
        "isTallowDermics": false
      }
    }
  ],
  "routine": [
    { "time": "morning", "order": 1, "step": "cleanse", "product": "Gentle Skin Cleanser (Cetaphil)", "why": "why this matters", "duration": "30 seconds" }
  ]
}

REGION RULES:
- Always return exactly 7 regions in this order: forehead, leftCheek, rightCheek, nose, chin, eyeArea, jawline.
- "severity": "none" | "mild" | "moderate" | "severe" — calibrated against the whole face, not absolute.
- "observation": <= 8 words, plain English, specific.

SKIN AGE RULES:
- "estimated" is a clinically-grounded biological skin-age estimate from visible markers (firmness, wrinkles, evenness, radiance).
- "bracket": "younger" if visibly younger than typical for visible cues, "older" if visibly older, "on-track" otherwise.
- Do NOT guess chronological age — estimate skin age only.

BIOMARKER RULES:
- 3–6 short tag phrases (≤4 words each) summarizing the most clinically meaningful signals.
- Examples: "compromised barrier", "post-acne marks", "early UV damage", "vascular under-eye", "mild rosacea pattern".

PRODUCT LIBRARY — recommend ONLY from these. Never invent products.

CLEANSERS:
- Oily/Acne: "CeraVe Foaming Facial Cleanser" (CeraVe) | "Effaclar Purifying Foaming Gel" (La Roche-Posay)
- Dry/Sensitive: "CeraVe Hydrating Facial Cleanser" (CeraVe) | "Toleriane Hydrating Gentle Cleanser" (La Roche-Posay) | "Gentle Skin Cleanser" (Cetaphil)
- Combination/Normal: "Gentle Skin Cleanser" (Cetaphil) | "Daily Foam Cleanser" (Neutrogena)

SERUMS:
- Niacinamide (oily/combo/enlarged pores): "Niacinamide 10% + Zinc 1%" (The Ordinary)
- Hyaluronic acid (dry/dehydrated): "Hyaluronic Acid 2% + B5" (The Ordinary) | "B5 Hydra Booster" (SkinCeuticals)
- Vitamin C (dullness/dark spots/anti-aging): "Vitamin C Suspension 23%" (The Ordinary) | "C E Ferulic" (SkinCeuticals)
- Retinol (aging/texture): "Retinol 0.5% in Squalane" (The Ordinary) | "Retinol 1%" (Paula's Choice)
- AHA/BHA (texture/acne): "2% BHA Liquid Exfoliant" (Paula's Choice) | "AHA 30% + BHA 2% Peeling Solution" (The Ordinary)
- Azelaic acid (redness/rosacea/post-acne): "Azelaic Acid Suspension 10%" (The Ordinary)
- Barrier peptides: "Multi-Peptide + HA Serum" (The Ordinary)

MOISTURIZERS:
- Oily/acne: "Hydro Boost Water Gel" (Neutrogena) | "Effaclar Mat" (La Roche-Posay)
- Dry: "Moisturizing Cream" (CeraVe) | "Cicaplast Baume B5" (La Roche-Posay) | "Tallow Cream" (TallowDermics)
- Sensitive/compromised barrier: "Tallow Cream" (TallowDermics) | "Cicalfate+ Restorative Protective Cream" (Avène)
- Combination/Normal: "AM Facial Moisturizing Lotion SPF 30" (CeraVe) | "Double Moisturizer" (Clinique)

SPF:
- Oily/acne: "UV Clear Broad-Spectrum SPF 46" (EltaMD)
- Dry/sensitive: "Anthelios Mineral SPF 50" (La Roche-Posay) | "Mineral Sunscreen SPF 50" (Vanicream)
- Tinted/daily: "Unseen Sunscreen SPF 40" (Supergoop)

TREATMENTS:
- Active acne: "Benzoyl Peroxide 2.5% Gel" (Paula's Choice) | "Adapalene Gel 0.1%" (Differin)
- Post-acne marks: "Alpha Arbutin 2% + HA" (The Ordinary)
- Eye area: "Caffeine Solution 5% + EGCG" (The Ordinary)

ROUTINE / RECOMMENDATION RULES:
- 4–6 routine steps split between morning/evening using ONLY real products from above.
- Always include exactly ONE TallowDermics product (isTallowDermics: true) — only as a moisturizer for dry/sensitive/barrier-compromised cases. Never push it for cleansers/SPF/serums.
- 3–5 recommendations, each with a real product if applicable.
- Tailor recommendations to detected skin type AND the lowest-scoring 2-3 dimensions.`;

  const response = await withRetry(() =>
    groq.chat.completions.create({
      model: VISION_MODEL,
      max_tokens: 3500,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  );

  const text = response.choices[0]?.message?.content || '';

  if (__DEV__) {
    console.log('[skinAnalysis v2] raw response (first 800):', text.slice(0, 800));
  }

  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '');
  const firstBrace = stripped.indexOf('{');
  const lastBrace = stripped.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) throw new Error('AI response contained no JSON');
  const jsonStr = stripped.slice(firstBrace, lastBrace + 1);

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`AI response JSON parse failed. Raw: ${text.slice(0, 200)}`);
  }

  const rawScores = parsed.scores ?? {};

  // Reject uniform-score sentinel responses.
  const v1Keys = ['overall', 'hydration', 'texture', 'clarity', 'evenness', 'firmness', 'pores'] as const;
  const numericV1 = v1Keys.map(k => rawScores[k]).filter((v): v is number => typeof v === 'number');
  if (numericV1.length >= 3 && numericV1.every(v => v === numericV1[0])) {
    throw new Error(
      `AI returned uniform score of ${numericV1[0]} for all v1 dimensions — likely a model default. Please try again.`,
    );
  }

  // v1 (back-compat).
  const scores: SkinScore = {
    overall: clamp(rawScores.overall ?? 65),
    hydration: clamp(rawScores.hydration ?? 65),
    texture: clamp(rawScores.texture ?? 65),
    clarity: clamp(rawScores.clarity ?? 65),
    evenness: clamp(rawScores.evenness ?? 65),
    firmness: clamp(rawScores.firmness ?? 65),
    pores: clamp(rawScores.pores ?? 65),
  };

  // v2 — full 16 dimensions.
  const scoresV2: SkinScoreV2 = {
    ...scores,
    radiance: clamp(rawScores.radiance ?? scores.clarity),
    redness: clamp(rawScores.redness ?? 70),
    darkSpots: clamp(rawScores.darkSpots ?? scores.evenness),
    darkCircles: clamp(rawScores.darkCircles ?? 65),
    wrinkles: clamp(rawScores.wrinkles ?? scores.firmness),
    acne: clamp(rawScores.acne ?? scores.clarity),
    oiliness: clamp(rawScores.oiliness ?? 65),
    sensitivity: clamp(rawScores.sensitivity ?? 70),
    barrierHealth: clamp(rawScores.barrierHealth ?? scores.hydration),
  };

  const rawConf = parsed.confidence ?? {};
  const confidence: SkinConfidence = {};
  for (const k of Object.keys(scoresV2) as (keyof SkinScoreV2)[]) {
    const v = clampOrUndef(rawConf[k]);
    if (v !== undefined) confidence[k] = v;
  }

  const regions: RegionalFinding[] = Array.isArray(parsed.regions)
    ? parsed.regions
        .filter((r: any) => r && typeof r.region === 'string')
        .slice(0, 8)
        .map((r: any) => ({
          region: r.region,
          severity: ['none', 'mild', 'moderate', 'severe'].includes(r.severity)
            ? r.severity
            : 'mild',
          observation: typeof r.observation === 'string' ? r.observation.slice(0, 120) : '',
          metrics: r.metrics && typeof r.metrics === 'object' ? r.metrics : undefined,
        }))
    : [];

  const skinAge: SkinAge | undefined =
    parsed.skinAge && typeof parsed.skinAge.estimated === 'number'
      ? {
          estimated: clamp(parsed.skinAge.estimated),
          bracket: ['younger', 'on-track', 'older'].includes(parsed.skinAge.bracket)
            ? parsed.skinAge.bracket
            : 'on-track',
        }
      : undefined;

  const biomarkers: string[] = Array.isArray(parsed.biomarkers)
    ? parsed.biomarkers.filter((b: any) => typeof b === 'string').slice(0, 6)
    : [];

  const photoQuality: PhotoQuality | undefined =
    parsed.photoQuality && typeof parsed.photoQuality === 'object'
      ? {
          ok: !!parsed.photoQuality.ok,
          score: clamp(parsed.photoQuality.score ?? 75),
          lighting: ['too-dark', 'too-bright', 'uneven', 'good'].includes(parsed.photoQuality.lighting)
            ? parsed.photoQuality.lighting
            : 'good',
          focus: ['blurry', 'soft', 'sharp'].includes(parsed.photoQuality.focus)
            ? parsed.photoQuality.focus
            : 'sharp',
          faceDetected: parsed.photoQuality.faceDetected !== false,
          filterDetected: !!parsed.photoQuality.filterDetected,
          warning: typeof parsed.photoQuality.warning === 'string' ? parsed.photoQuality.warning : undefined,
          recommendations: Array.isArray(parsed.photoQuality.recommendations)
            ? parsed.photoQuality.recommendations.slice(0, 3)
            : undefined,
        }
      : undefined;

  return {
    id: generateId(),
    date: new Date().toISOString(),
    imageUri: '',
    scores,
    scoresV2,
    confidence,
    regions,
    skinAge,
    biomarkers,
    photoQuality,
    schemaVersion: 2,
    skinType: parsed.skinType || 'normal',
    concerns: Array.isArray(parsed.concerns) ? parsed.concerns.slice(0, 4) : [],
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [],
    insights: parsed.insights || '',
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    routine: Array.isArray(parsed.routine)
      ? parsed.routine.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      : [],
  };
}

export async function chatWithCoach(
  messages: { role: 'user' | 'assistant'; content: string }[],
  latestAnalysis: SkinAnalysis | null,
  userProfile: UserProfile | null,
  shelfContext?: string,
  engineContext?: string,
): Promise<string> {
  const v2 = latestAnalysis?.scoresV2;
  const v2Block = v2
    ? `Hydration ${v2.hydration} · Texture ${v2.texture} · Clarity ${v2.clarity} · Evenness ${v2.evenness} · Firmness ${v2.firmness} · Pores ${v2.pores} · Radiance ${v2.radiance} · Redness ${v2.redness} · DarkSpots ${v2.darkSpots} · DarkCircles ${v2.darkCircles} · Wrinkles ${v2.wrinkles} · Acne ${v2.acne} · Oiliness ${v2.oiliness} · Sensitivity ${v2.sensitivity} · Barrier ${v2.barrierHealth}`
    : latestAnalysis
    ? `Hydration ${latestAnalysis.scores.hydration} · Texture ${latestAnalysis.scores.texture} · Clarity ${latestAnalysis.scores.clarity} · Evenness ${latestAnalysis.scores.evenness} · Firmness ${latestAnalysis.scores.firmness} · Pores ${latestAnalysis.scores.pores}`
    : '';

  const ageBlock = latestAnalysis?.skinAge
    ? ` Estimated skin age: ${latestAnalysis.skinAge.estimated} (${latestAnalysis.skinAge.bracket}).`
    : '';

  const biomarkerBlock = latestAnalysis?.biomarkers?.length
    ? ` Biomarkers: ${latestAnalysis.biomarkers.join(', ')}.`
    : '';

  const systemPrompt = `You are Derm, the GlowDermics AI skincare coach — built for TallowDermics, a brand grounded in ancestral, minimal-ingredient skincare. You are warm, direct, dermatology-grade, and specific.

TallowDermics products: Grass-Fed Tallow Cream (the hero). 4 ingredients: tallow (mimics skin sebum, ~45% oleic acid), manuka honey (UMF 20+, antibacterial humectant), cold-pressed olive oil (squalene), calendula (anti-inflammatory). No synthetics.

${userProfile ? `User: ${userProfile.name}. Self-reported skin type: ${userProfile.skinType}. Concerns: ${userProfile.primaryConcerns.join(', ')}. Goals: ${userProfile.goals.join(', ')}.` : ''}
${latestAnalysis ? `Latest scan — Overall ${latestAnalysis.scores.overall}/100. Detected skin type: ${latestAnalysis.skinType}. Concerns: ${latestAnalysis.concerns.join(', ')}. Strengths: ${latestAnalysis.strengths.join(', ')}.${ageBlock}${biomarkerBlock} Per-metric: ${v2Block}` : ''}
${shelfContext ?? ''}
${engineContext ?? ''}

Tone: warm, expert, never generic. Reference the user's actual scores when giving advice — e.g., "your redness score of ${latestAnalysis?.scoresV2?.redness ?? 'N/A'} suggests…". Mention TallowDermics only when genuinely relevant for barrier repair / dry / sensitive cases. If you don't know something, say so. Never invent studies. Default response length: 3–5 sentences unless asked for more.`;

  const response = await withRetry(() =>
    groq.chat.completions.create({
      model: CHAT_MODEL,
      max_tokens: 800,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  );

  return response.choices[0]?.message?.content || '';
}

/**
 * narrateProgress — generates a 2-3 sentence natural language summary of
 * the change between two skin scans. Used by the Compare screen to give
 * the user a "what changed and why" narrative grounded in actual deltas.
 *
 * Falls back to a template-string summary if the model call fails — never
 * throws — so the Compare screen never blocks on this call.
 */
export async function narrateProgress(
  before: SkinAnalysis,
  after: SkinAnalysis,
  userProfile: UserProfile | null,
): Promise<string> {
  const dDays = Math.max(
    1,
    Math.round(
      (new Date(after.date).getTime() - new Date(before.date).getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  const overallDelta = after.scores.overall - before.scores.overall;

  const v1Deltas = (['hydration', 'texture', 'clarity', 'evenness', 'firmness', 'pores'] as const)
    .map(k => ({ k, d: after.scores[k] - before.scores[k] }))
    .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
    .slice(0, 4)
    .map(({ k, d }) => `${k}: ${d > 0 ? '+' : ''}${d}`)
    .join(', ');

  const v2 = after.scoresV2 && before.scoresV2
    ? (['radiance', 'redness', 'darkSpots', 'darkCircles', 'wrinkles', 'acne', 'oiliness', 'sensitivity', 'barrierHealth'] as const)
        .map(k => ({ k, d: (after.scoresV2![k] - before.scoresV2![k]) }))
        .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
        .slice(0, 4)
        .map(({ k, d }) => `${k}: ${d > 0 ? '+' : ''}${d}`)
        .join(', ')
    : '';

  const fallback =
    overallDelta > 0
      ? `Your skin score is up ${overallDelta} points over ${dDays} days. Biggest gains: ${v1Deltas}.`
      : overallDelta < 0
      ? `Your skin score is down ${Math.abs(overallDelta)} points over ${dDays} days. Watch: ${v1Deltas}.`
      : `Your overall skin score is unchanged across ${dDays} days. Movement: ${v1Deltas}.`;

  try {
    const profile = userProfile
      ? `User: ${userProfile.name}, self-reported skin type: ${userProfile.skinType}, concerns: ${userProfile.primaryConcerns.join(', ')}.`
      : '';

    const system = `You are Derm, GlowDermics' skincare coach. Write a 2-3 sentence progress narrative comparing two scans. Be specific, science-grounded, encouraging without sugarcoating regressions. Reference the most-changed dimensions by name. End with one concrete next-step suggestion. No filler. No exclamation marks. Plain text only — no markdown.`;

    const userMsg = `${profile}

Time elapsed between scans: ${dDays} days.
Overall: before ${before.scores.overall} → after ${after.scores.overall} (Δ ${overallDelta > 0 ? '+' : ''}${overallDelta}).
Top v1 dimension changes: ${v1Deltas || 'none'}.
Top v2 dimension changes: ${v2 || 'n/a'}.
Detected skin type — before: ${before.skinType}, after: ${after.skinType}.
Active concerns now: ${after.concerns.join(', ') || 'none reported'}.
Strengths now: ${after.strengths.join(', ') || 'none reported'}.

Write the 2-3 sentence narrative now.`;

    const response = await withRetry(() =>
      groq.chat.completions.create({
        model: CHAT_MODEL,
        max_tokens: 220,
        temperature: 0.4,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userMsg },
        ],
      }),
    );

    return response.choices[0]?.message?.content?.trim() || fallback;
  } catch {
    return fallback;
  }
}
