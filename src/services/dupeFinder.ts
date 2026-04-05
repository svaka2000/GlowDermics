import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

export interface DupeResult {
  originalProduct: string;
  originalBrand: string;
  estimatedPrice: string;
  keyIngredients: string[];
  dupes: Dupe[];
  whyTheyWork: string;
  tallowDermicsNote: string;
}

export interface Dupe {
  name: string;
  brand: string;
  estimatedPrice: string;
  savingsPercent: number;
  matchScore: number;
  sharedIngredients: string[];
  differences: string;
  whereToBuy: string;
}

export async function findDupes(productName: string, brand: string): Promise<DupeResult> {
  const prompt = `You are GlowDermics Dupe Finder — a cosmetic chemist AI that finds cheaper alternatives to expensive skincare products.

Find real, well-known drugstore or mid-range dupes for: "${productName}" by ${brand}.

Respond ONLY with valid JSON (no markdown, no code fences):

{
  "originalProduct": "${productName}",
  "originalBrand": "${brand}",
  "estimatedPrice": "<e.g. $65 for 50ml>",
  "keyIngredients": ["<top 4-5 active ingredients that make this product work>"],
  "dupes": [
    {
      "name": "<dupe product name>",
      "brand": "<dupe brand>",
      "estimatedPrice": "<price>",
      "savingsPercent": <0-95>,
      "matchScore": <0-100>,
      "sharedIngredients": ["<ingredients it shares with the original>"],
      "differences": "<1 sentence: key differences — texture, concentration, extras>",
      "whereToBuy": "<Drugstore / Amazon / Sephora / ULTA / Target>"
    }
  ],
  "whyTheyWork": "<2 sentences explaining which key ingredients to look for when comparing and why>",
  "tallowDermicsNote": "<1-2 sentences: honest note about how TallowDermics Tallow Cream compares as a moisturizing alternative — only if relevant to the product category>"
}

Rules:
- Provide exactly 3 dupes, ordered by match score descending
- Only suggest real products that actually exist and are widely available
- matchScore: 90+ = nearly identical formula, 70-89 = same actives different base, 50-69 = similar benefits different approach
- Be honest about differences — don't oversell dupes
- If the product is already budget-friendly (under $20), note that in dupes with matchScore 95+ for similar products
- If no good dupes exist, provide the closest alternatives with low matchScore and explain why`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.choices[0]?.message?.content || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse dupe results');

  return JSON.parse(jsonMatch[0]);
}
