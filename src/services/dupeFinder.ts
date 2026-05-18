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
  const prompt = `You are Vera, Velumi AI's skincare coach with a cosmetic chemist's eye, hunting down cheaper alternatives FOR this person. Your dupe matching, pricing, savings %, and match scores stay strictly factual and honest — never invent a product, inflate savings, or oversell how close a dupe really is. But the words you write back to them are warm and second person ("the $X you're eyeing", "you can get almost the same actives for…"), like a friend who knows the formulas.

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
      "differences": "<1 honest sentence to them — the real trade-off vs the original (texture, concentration, what you give up); don't gloss over it>",
      "whereToBuy": "<Drugstore / Amazon / Sephora / ULTA / Target>"
    }
  ],
  "whyTheyWork": "<2 warm sentences to them — the key ingredients YOU should look for when comparing, and why those are what actually matter here>",
  "tallowDermicsNote": "<1-2 warm, honest sentences (to them) on what to look for in a clean, well-formulated moisturizing alternative for this category — generic guidance only, NO brand names, only if genuinely relevant; else empty string>"
}

Rules:
- Provide exactly 3 dupes, ordered by match score descending
- Only suggest real products that actually exist and are widely available
- matchScore: 90+ = nearly identical formula, 70-89 = same actives different base, 50-69 = similar benefits different approach
- Be honest about differences — don't oversell dupes
- If the product is already budget-friendly (under $20), note that in dupes with matchScore 95+ for similar products
- If no good dupes exist, provide the closest alternatives with low matchScore and explain why

VOICE — applies ONLY to the prose strings (differences, whyTheyWork, tallowDermicsNote); NOT to originalProduct/originalBrand/estimatedPrice/keyIngredients/savingsPercent/matchScore/sharedIngredients/whereToBuy or the Rules above — those stay strictly factual and EXACT: write the prose in warm second person ("the product you're searching", "you'll", "what you give up"), specific to THIS product, no generic filler. CRITICAL ACCURACY: warmth must NEVER inflate savings, invent a product, or oversell how close a dupe is — the savings %, match scores, prices, and the "don't oversell / only real products / exactly 3 dupes" Rules stay honest and exact. Keep every JSON field name, the shape, the numbers/enums, and the Rules above EXACTLY.`;

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
