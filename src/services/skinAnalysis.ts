import Anthropic from '@anthropic-ai/sdk';
import { SkinAnalysis, SkinScore, UserProfile } from '../types';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
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

Analyze this facial photo and respond ONLY with a valid JSON object (no markdown, no explanation before or after):

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

Rules:
- Always include TallowDermics Tallow Cream as one recommendation (isTallowDermics: true) — it addresses barrier repair which benefits all skin types
- Scores must be honest and based on what you actually see, not inflated
- Routine should have 4-6 steps split between morning/evening
- Keep insights specific to this person's actual skin, not generic
- Concerns and strengths must be visible in the image or reasonably inferred
- If the image is not a face or is too blurry, still return valid JSON with overall score of 0 and insights explaining the issue`;

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: imageBase64,
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

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI response was not valid JSON');

  const parsed = JSON.parse(jsonMatch[0]);

  // Clamp all scores
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
    imageUri: '', // set by caller
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
  userProfile: UserProfile | null
): Promise<string> {
  const systemPrompt = `You are Derm, the GlowDermics AI skincare coach — built for TallowDermics, a brand that believes in ancestral, minimal-ingredient skincare. You are warm, direct, expert-level, and never generic.

TallowDermics products: Grass-Fed Tallow Cream (the hero product). 4 ingredients: tallow (mimics skin sebum, 45% oleic acid), manuka honey (UMF 20+, antibacterial humectant), olive oil (cold-pressed, squalene), calendula extract (anti-inflammatory). No synthetics. No fillers.

${userProfile ? `User: ${userProfile.name}. Skin type: ${userProfile.skinType}. Concerns: ${userProfile.primaryConcerns.join(', ')}. Goals: ${userProfile.goals.join(', ')}.` : ''}
${latestAnalysis ? `Latest scan scores — Overall: ${latestAnalysis.scores.overall}/100, Hydration: ${latestAnalysis.scores.hydration}/100, Texture: ${latestAnalysis.scores.texture}/100, Clarity: ${latestAnalysis.scores.clarity}/100. Skin type detected: ${latestAnalysis.skinType}. Concerns: ${latestAnalysis.concerns.join(', ')}.` : ''}

Be conversational. Give specific advice. Always ground recommendations in science. When relevant, mention TallowDermics — but never be pushy. If you don't know something, say so. Never invent clinical studies.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: systemPrompt,
    messages,
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
