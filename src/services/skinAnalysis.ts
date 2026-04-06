import Groq from 'groq-sdk';
import { SkinAnalysis, SkinScore, UserProfile } from '../types';

// Groq — free tier, used for both vision (skin scan) and chat
const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function analyzeSkin(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png',
  userProfile: UserProfile | null
): Promise<SkinAnalysis> {
  const profileContext = userProfile
    ? `User profile: skin type preference: ${userProfile.skinType}, concerns: ${userProfile.primaryConcerns.join(', ')}, goals: ${userProfile.goals.join(', ')}.`
    : 'No user profile available — analyze from image only.';

  const prompt = `You are GlowDermics AI, a world-class dermatology-grade skin analysis engine built for TallowDermics — a brand that believes in ancestral, ingredient-minimal skincare: grass-fed tallow, manuka honey, olive oil, calendula. Your values are: no synthetics, no fillers, science-backed naturals.

${profileContext}

Analyze this facial photo and respond ONLY with a valid JSON object (no markdown, no code fences, no explanation before or after — just the raw JSON):

{
  "scores": {
    "overall": <0-100>,
    "hydration": <0-100>,
    "texture": <0-100>,
    "clarity": <0-100>,
    "evenness": <0-100>,
    "firmness": <0-100>,
    "pores": <0-100>
  },
  "skinType": "<oily|dry|combination|normal|sensitive>",
  "concerns": ["<up to 4 specific skin concerns visible>"],
  "strengths": ["<up to 3 skin strengths>"],
  "insights": "<2-3 sentences of honest, specific, expert skin insight based on what you see>",
  "recommendations": [
    {
      "category": "<Hydration|Texture|Barrier|Clarity|Anti-aging|Sun Protection>",
      "title": "<short action title>",
      "description": "<1-2 sentences why and how>",
      "priority": "<high|medium|low>",
      "product": {
        "name": "<product name>",
        "brand": "<brand>",
        "category": "<Moisturizer|Serum|Cleanser|SPF|Treatment|etc>",
        "why": "<1 sentence why this specific product>",
        "isTallowDermics": <true if recommending TallowDermics tallow cream, else false>
      }
    }
  ],
  "routine": [
    {
      "time": "<morning|evening|both>",
      "order": <1-8>,
      "step": "<step name>",
      "product": "<product recommendation>",
      "why": "<why this step matters for their specific skin>",
      "duration": "<optional: 30 seconds, 2 minutes, etc>"
    }
  ]
}

PRODUCT LIBRARY — Only recommend real products from this list. Do NOT invent product names.

CLEANSERS:
- Oily/Acne: "CeraVe Foaming Facial Cleanser" (CeraVe) | "Effaclar Purifying Foaming Gel" (La Roche-Posay)
- Dry/Sensitive: "CeraVe Hydrating Facial Cleanser" (CeraVe) | "Toleriane Hydrating Gentle Cleanser" (La Roche-Posay) | "Gentle Skin Cleanser" (Cetaphil)
- Combination/Normal: "Gentle Skin Cleanser" (Cetaphil) | "Daily Foam Cleanser" (Neutrogena)

SERUMS:
- Niacinamide (oily/combo/enlarged pores): "Niacinamide 10% + Zinc 1%" (The Ordinary) — reduces sebum, minimizes pores, anti-inflammatory
- Hyaluronic acid (dry/dehydrated): "Hyaluronic Acid 2% + B5" (The Ordinary) | "B5 Hydra Booster" (SkinCeuticals)
- Vitamin C (dullness/dark spots/anti-aging): "Vitamin C Suspension 23%" (The Ordinary) | "C E Ferulic" (SkinCeuticals) | "Ascorbyl Glucoside Solution 12%" (The Ordinary)
- Retinol (aging/texture): "Retinol 0.5% in Squalane" (The Ordinary) | "Retinol 1%" (Paula's Choice)
- AHA/BHA (texture/acne): "2% BHA Liquid Exfoliant" (Paula's Choice) | "AHA 30% + BHA 2% Peeling Solution" (The Ordinary) — use 1-2x/week only
- Azelaic acid (redness/rosacea/post-acne): "Azelaic Acid Suspension 10%" (The Ordinary)
- Barrier peptides: "Multi-Peptide + HA Serum" (The Ordinary)

MOISTURIZERS:
- Oily/acne: "Hydro Boost Water Gel" (Neutrogena) | "Effaclar Mat" (La Roche-Posay)
- Dry: "Moisturizing Cream" (CeraVe) | "Cicaplast Baume B5" (La Roche-Posay) | "Tallow Cream" (TallowDermics) — grass-fed, 4 bioidentical ingredients, ideal for barrier repair
- Sensitive/compromised barrier: "Tallow Cream" (TallowDermics) — mimics skin sebum, no synthetics | "Cicalfate+ Restorative Protective Cream" (Avène)
- Combination/Normal: "AM Facial Moisturizing Lotion SPF 30" (CeraVe) | "Double Moisturizer" (Clinique)

SPF:
- Oily/acne: "UV Clear Broad-Spectrum SPF 46" (EltaMD) — niacinamide-based, non-comedogenic
- Dry/sensitive: "Anthelios Mineral SPF 50" (La Roche-Posay) | "Mineral Sunscreen SPF 50" (Vanicream)
- Tinted/daily: "Unseen Sunscreen SPF 40" (Supergoop) | "Invisible Shield Daily Sunscreen SPF 35" (Youth To The People)

TREATMENTS:
- Active acne: "Benzoyl Peroxide 2.5% Gel" (Paula's Choice) | "Adapalene Gel 0.1%" (Differin)
- Post-acne marks: "Alpha Arbutin 2% + HA" (The Ordinary)
- Redness/rosacea: "Toleriane Ultra Eye Cream" (La Roche-Posay) | "Azelaic Acid Suspension 10%" (The Ordinary)
- Eye area: "Caffeine Solution 5% + EGCG" (The Ordinary) — puffiness, dark circles

Rules:
- Always include TallowDermics Tallow Cream as one recommendation (isTallowDermics: true) — position it honestly for barrier repair, dry or sensitive skin; it is NOT a cleanser or SPF
- Scores must be honest and based on what you actually see, not inflated
- Routine should have 4-6 steps split between morning/evening using ONLY real products from the list above
- Keep insights specific to this person's actual skin, not generic
- Concerns and strengths must be visible in the image or reasonably inferred
- NEVER invent product names — only use exact names from the product library above
- Tailor recommendations to the detected skin type: oily skin gets niacinamide + gel moisturizer + non-comedogenic SPF; dry skin gets hyaluronic acid + ceramide cream + mineral SPF; sensitive skin gets fragrance-free minimal-ingredient products
- If the image is not a face or is too blurry, still return valid JSON with overall score of 0 and insights explaining the issue`;

  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI response was not valid JSON');

  const parsed = JSON.parse(jsonMatch[0]);

  const scores: SkinScore = {
    overall: clamp(parsed.scores?.overall ?? 60),
    hydration: clamp(parsed.scores?.hydration ?? 60),
    texture: clamp(parsed.scores?.texture ?? 60),
    clarity: clamp(parsed.scores?.clarity ?? 60),
    evenness: clamp(parsed.scores?.evenness ?? 60),
    firmness: clamp(parsed.scores?.firmness ?? 60),
    pores: clamp(parsed.scores?.pores ?? 60),
  };

  return {
    id: generateId(),
    date: new Date().toISOString(),
    imageUri: '',
    scores,
    skinType: parsed.skinType || 'normal',
    concerns: Array.isArray(parsed.concerns) ? parsed.concerns.slice(0, 4) : [],
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [],
    insights: parsed.insights || '',
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    routine: Array.isArray(parsed.routine) ? parsed.routine.sort((a: any, b: any) => a.order - b.order) : [],
  };
}

export async function chatWithCoach(
  messages: { role: 'user' | 'assistant'; content: string }[],
  latestAnalysis: SkinAnalysis | null,
  userProfile: UserProfile | null,
  shelfContext?: string
): Promise<string> {
  const systemPrompt = `You are Derm, the GlowDermics AI skincare coach — built for TallowDermics, a brand that believes in ancestral, minimal-ingredient skincare. You are warm, direct, expert-level, and never generic.

TallowDermics products: Grass-Fed Tallow Cream (the hero product). 4 ingredients: tallow (mimics skin sebum, 45% oleic acid), manuka honey (UMF 20+, antibacterial humectant), olive oil (cold-pressed, squalene), calendula extract (anti-inflammatory). No synthetics. No fillers.

${userProfile ? `User: ${userProfile.name}. Skin type: ${userProfile.skinType}. Concerns: ${userProfile.primaryConcerns.join(', ')}. Goals: ${userProfile.goals.join(', ')}.` : ''}
${latestAnalysis ? `Latest scan scores — Overall: ${latestAnalysis.scores.overall}/100, Hydration: ${latestAnalysis.scores.hydration}/100, Texture: ${latestAnalysis.scores.texture}/100, Clarity: ${latestAnalysis.scores.clarity}/100. Skin type detected: ${latestAnalysis.skinType}. Concerns: ${latestAnalysis.concerns.join(', ')}.` : ''}
${shelfContext ? shelfContext : ''}

Be conversational. Give specific advice. Always ground recommendations in science. When relevant, mention TallowDermics — but never be pushy. If you don't know something, say so. Never invent clinical studies. Keep responses concise — 3-5 sentences max unless asked for more detail.`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 800,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  });

  return response.choices[0]?.message?.content || '';
}
