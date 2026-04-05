import Groq from 'groq-sdk';
import { IngredientReport } from '../types/ingredients';

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

export async function scanIngredients(
  imageBase64: string | null,
  mimeType: 'image/jpeg' | 'image/png' | null,
  manualText?: string
): Promise<IngredientReport> {
  const prompt = `You are GlowDermics Ingredient Scanner — a cosmetic chemist AI built for TallowDermics.

TallowDermics belief: the best skincare uses ingredients your skin biologically recognizes. Grass-fed tallow, manuka honey, olive oil, calendula — no synthetics, no fillers. Use this lens when evaluating products.

${manualText ? `Analyze this ingredient list: "${manualText}"` : 'Read and analyze the ingredient list visible in the image.'}

Respond ONLY with valid JSON (no markdown, no code fences):

{
  "safetyScore": <0-100>,
  "verdict": "<Clean|Mostly Clean|Use Caution|Avoid>",
  "summary": "<2-3 sentences: what this product is, overall safety, key takeaway>",
  "totalIngredients": <number>,
  "naturalPercent": <0-100>,
  "flagged": [
    {
      "name": "<exact ingredient name>",
      "reason": "<why it's flagged — be specific: endocrine disruptor, comedogenic rating 4/5, known allergen, etc>",
      "severity": "<high|medium|low>",
      "commonlyFoundIn": "<optional: 'cheap drugstore moisturizers' or similar>"
    }
  ],
  "beneficial": [
    {
      "name": "<ingredient name>",
      "benefit": "<specific skin benefit with mechanism>"
    }
  ],
  "skinCompatibility": [
    { "skinType": "Oily", "compatible": <true|false>, "note": "<optional short note>" },
    { "skinType": "Dry", "compatible": <true|false>, "note": "<optional short note>" },
    { "skinType": "Combination", "compatible": <true|false>, "note": "<optional short note>" },
    { "skinType": "Sensitive", "compatible": <true|false>, "note": "<optional short note>" },
    { "skinType": "Normal", "compatible": <true|false>, "note": "<optional short note>" }
  ],
  "tallowDermicsComparison": "<2 sentences comparing this product's ingredient philosophy to TallowDermics' 4-ingredient ancestral formula — honest, not dismissive>"
}

Rules:
- safetyScore: 90-100 = truly clean (all natural, no irritants), 70-89 = mostly clean, 50-69 = use caution, below 50 = avoid
- Flag: parabens, sulfates (SLS/SLES), synthetic fragrances, formaldehyde releasers, PEGs, oxybenzone, PFAS, high-comedogenic ingredients, known sensitizers
- Highlight: niacinamide, hyaluronic acid, ceramides, peptides, antioxidants, natural oils, plant extracts
- If image doesn't contain an ingredient list, return safetyScore 0 and summary explaining the issue
- Be honest and specific — this is health information`;

  let messages: any[];

  if (imageBase64 && mimeType) {
    // Vision mode — read ingredients from photo
    messages = [
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
    ];
  } else {
    // Text mode — analyze pasted ingredients
    messages = [{ role: 'user', content: prompt }];
  }

  const model = imageBase64
    ? 'meta-llama/llama-4-scout-17b-16e-instruct'  // vision
    : 'llama-3.3-70b-versatile';                    // text only

  const response = await groq.chat.completions.create({
    model,
    max_tokens: 2000,
    messages,
  });

  const text = response.choices[0]?.message?.content || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse ingredient analysis');

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    safetyScore: Math.max(0, Math.min(100, Math.round(parsed.safetyScore ?? 50))),
    verdict: parsed.verdict || 'Use Caution',
    summary: parsed.summary || '',
    totalIngredients: parsed.totalIngredients || 0,
    naturalPercent: Math.max(0, Math.min(100, Math.round(parsed.naturalPercent ?? 50))),
    flagged: Array.isArray(parsed.flagged) ? parsed.flagged : [],
    beneficial: Array.isArray(parsed.beneficial) ? parsed.beneficial : [],
    skinCompatibility: Array.isArray(parsed.skinCompatibility) ? parsed.skinCompatibility : [],
    tallowDermicsComparison: parsed.tallowDermicsComparison || '',
  };
}
