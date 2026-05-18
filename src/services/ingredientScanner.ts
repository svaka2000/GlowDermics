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
  const prompt = `You are Vera, Velumi AI's skincare coach with a cosmetic chemist's training, reading this product's label FOR this person. Your ingredient detection, safety scoring, and severity calls stay strictly rigorous and clinical — never soften a real risk. But the words you write back to them are warm and second person ("this product…", "if your skin…", "you'll want to…"), like a knowledgeable friend reading the label over their shoulder.

Evaluation lens: favor well-formulated products with proven actives and a healthy-barrier focus; flag needless irritants, known sensitizers, and filler-heavy formulas. Judge every product on its own formulation merits — no brand bias.

${manualText ? `Analyze this ingredient list: "${manualText}"` : 'Read and analyze the ingredient list visible in the image.'}

Respond ONLY with valid JSON (no markdown, no code fences):

{
  "safetyScore": <0-100>,
  "verdict": "<Clean|Mostly Clean|Use Caution|Avoid>",
  "summary": "<2-3 warm sentences spoken TO them ('this product…', 'you') — what it is, your honest read on its safety, and the one thing they should take away>",
  "totalIngredients": <number>,
  "naturalPercent": <0-100>,
  "flagged": [
    {
      "name": "<exact ingredient name>",
      "reason": "<why it's flagged — clinically specific (endocrine disruptor, comedogenic 4/5, known allergen) AND told to them plainly so they get why it matters for their skin; do NOT downplay it>",
      "severity": "<high|medium|low>",
      "commonlyFoundIn": "<optional: 'cheap drugstore moisturizers' or similar>"
    }
  ],
  "beneficial": [
    {
      "name": "<ingredient name>",
      "benefit": "<specific skin benefit with the mechanism, said warmly to them ('this gives your skin…')>"
    }
  ],
  "skinCompatibility": [
    { "skinType": "Oily", "compatible": <true|false>, "note": "<optional short second-person note — what it means for YOUR skin>" },
    { "skinType": "Dry", "compatible": <true|false>, "note": "<optional short second-person note — what it means for YOUR skin>" },
    { "skinType": "Combination", "compatible": <true|false>, "note": "<optional short second-person note — what it means for YOUR skin>" },
    { "skinType": "Sensitive", "compatible": <true|false>, "note": "<optional short second-person note — what it means for YOUR skin>" },
    { "skinType": "Normal", "compatible": <true|false>, "note": "<optional short second-person note — what it means for YOUR skin>" }
  ],
  "formulationComparison": "<2 warm, honest sentences (to them) on this product's overall ingredient philosophy — is it a focused, well-formulated formula or padded with needless fillers? Generic and fair, NO brand names>"
}

Rules:
- safetyScore: 90-100 = truly clean (all natural, no irritants), 70-89 = mostly clean, 50-69 = use caution, below 50 = avoid
- Flag: parabens, sulfates (SLS/SLES), synthetic fragrances, formaldehyde releasers, PEGs, oxybenzone, PFAS, high-comedogenic ingredients, known sensitizers
- Highlight: niacinamide, hyaluronic acid, ceramides, peptides, antioxidants, natural oils, plant extracts
- If image doesn't contain an ingredient list, return safetyScore 0 and summary explaining the issue
- Be honest and specific — this is health information

VOICE — applies ONLY to the prose strings (summary, flagged[].reason, flagged[].commonlyFoundIn, beneficial[].benefit, skinCompatibility[].note, formulationComparison); NOT to safetyScore/totalIngredients/naturalPercent numbers, the verdict/severity enums, the compatible booleans, the skinType labels, or the Rules above — those stay strictly clinical and EXACT: write the prose in warm second person ("this product", "your skin", "you'll want to"), specific to THIS label, no generic filler. CRITICAL SAFETY: warmth must NEVER soften a real risk — for any high-severity flag or an "Avoid"/"Use Caution" verdict, be blunt and direct about the danger; the kindness is in the tone, never in downplaying. Keep every JSON field name, the shape, the enums/numbers, and the Rules above EXACTLY.`;

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
    formulationComparison: parsed.formulationComparison || '',
  };
}
