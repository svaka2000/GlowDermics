/**
 * Velumi product recommendation catalog.
 *
 * Curated list of real retail products organised by skincare concern.
 * Brand-agnostic (no first-party Velumi products). Each entry includes a
 * direct retail URL that gets wrapped by affiliateLink() at render time.
 *
 * Editing rules:
 *  - Always keep 3+ products per concern across price points (entry / mid / premium).
 *  - URLs must be real product pages, not landing pages.
 *  - `brand` field is the lowercased brand name used by affiliateLink() to
 *    pick the right network (see BRAND_NETWORK map in services/affiliateLink.ts).
 */

export type Concern =
  | 'hydration'
  | 'barrier'
  | 'acne'
  | 'hyperpigmentation'
  | 'anti-aging'
  | 'redness'
  | 'oily'
  | 'sensitive'
  | 'spf'
  | 'retinol';

export interface ProductRec {
  id: string;
  name: string;
  brand: string;            // lowercased
  why: string;              // 1-sentence clinical why
  priceTier: 'entry' | 'mid' | 'premium';
  url: string;              // direct retail URL (Amazon, Sephora, etc.)
}

export const PRODUCT_REC_CATALOG: Record<Concern, ProductRec[]> = {
  hydration: [
    {
      id: 'hyaluronic-acid-the-ordinary',
      name: 'Hyaluronic Acid 2% + B5',
      brand: 'the ordinary',
      why: 'Multi-weight HA serum that hydrates at multiple skin depths — entry-tier benchmark.',
      priceTier: 'entry',
      url: 'https://theordinary.com/en-us/hyaluronic-acid-2pct-b5-hydrating-serum-100436.html',
    },
    {
      id: 'la-roche-posay-hyalu-b5',
      name: 'Hyalu B5 Pure Hyaluronic Acid Serum',
      brand: 'la roche-posay',
      why: 'Pharmacy-grade HA + B5 — clinically tested, gentle for reactive skin.',
      priceTier: 'mid',
      url: 'https://www.amazon.com/dp/B07RMV4ZTC',
    },
    {
      id: 'augustinus-bader-the-cream',
      name: 'The Cream',
      brand: 'augustinus bader',
      why: 'TFC8 hydration complex — high-end if budget allows; one of the most-tested premium creams.',
      priceTier: 'premium',
      url: 'https://augustinusbader.com/us/en/the-cream',
    },
  ],

  barrier: [
    {
      id: 'cerave-pm-lotion',
      name: 'Facial Moisturizing Lotion PM',
      brand: 'cerave',
      why: 'Ceramide 1/3/6-II + niacinamide — the dermatology default for barrier rebuild.',
      priceTier: 'entry',
      url: 'https://www.amazon.com/dp/B00365DABC',
    },
    {
      id: 'la-roche-cicaplast-balm-b5',
      name: 'Cicaplast Baume B5',
      brand: 'la roche-posay',
      why: 'Madecassoside + panthenol — rich occlusive for acute barrier crashes.',
      priceTier: 'mid',
      url: 'https://www.amazon.com/dp/B00RB02LJI',
    },
    {
      id: 'avene-cicalfate',
      name: 'Cicalfate+ Restorative Protective Cream',
      brand: 'avène',
      why: 'Sucralfate + copper-zinc — barrier repair grade, gentle on compromised skin.',
      priceTier: 'mid',
      url: 'https://www.amazon.com/dp/B084JRJM3N',
    },
  ],

  acne: [
    {
      id: 'paulas-2bha',
      name: 'Skin Perfecting 2% BHA Liquid',
      brand: 'paulas-choice',
      why: 'Salicylic acid 2% — gold-standard chemical exfoliant for follicular congestion.',
      priceTier: 'mid',
      url: 'https://www.paulaschoice.com/skin-perfecting-2pct-bha-liquid-salicylic-acid-exfoliant/201.html',
    },
    {
      id: 'la-roche-effaclar-duo',
      name: 'Effaclar Duo Dual Action Acne Treatment',
      brand: 'la roche-posay',
      why: 'Benzoyl peroxide 5.5% + LHA — daily-driver acne treatment.',
      priceTier: 'mid',
      url: 'https://www.amazon.com/dp/B077XYBJG2',
    },
    {
      id: 'differin-gel',
      name: 'Differin Adapalene Gel 0.1%',
      brand: 'differin',
      why: 'OTC retinoid — clinically proven to clear acne over 12 weeks. Start every 3rd night.',
      priceTier: 'entry',
      url: 'https://www.amazon.com/dp/B07L1PHSY9',
    },
  ],

  hyperpigmentation: [
    {
      id: 'good-molecules-discoloration',
      name: 'Discoloration Correcting Serum',
      brand: 'good molecules',
      why: 'Tranexamic acid 3% + niacinamide — affordable workhorse for PIH and melasma.',
      priceTier: 'entry',
      url: 'https://www.amazon.com/dp/B086DCHV21',
    },
    {
      id: 'skinmedica-lytera',
      name: 'Lytera 2.0 Pigment Correcting Serum',
      brand: 'skinmedica',
      why: 'Multi-ingredient brightener — clinically validated for stubborn discoloration.',
      priceTier: 'premium',
      url: 'https://www.amazon.com/dp/B016LWUW3K',
    },
    {
      id: 'naturium-tranexamic',
      name: 'Tranexamic Topical Acid 5%',
      brand: 'naturium',
      why: 'Higher-strength tranexamic acid + kojic — mid-price, well-tolerated.',
      priceTier: 'mid',
      url: 'https://www.amazon.com/dp/B09KGLW8GW',
    },
  ],

  'anti-aging': [
    {
      id: 'olay-retinol-24',
      name: 'Retinol24 Night Face Moisturizer',
      brand: 'olay',
      why: 'Retinol + niacinamide in a moisturizer — gentlest tier to start nightly retinol.',
      priceTier: 'entry',
      url: 'https://www.amazon.com/dp/B07YN3HG6V',
    },
    {
      id: 'medik8-crystal-retinal',
      name: 'Crystal Retinal 3',
      brand: 'medik8',
      why: 'Retinaldehyde — 10× more potent than retinol with similar tolerability. The smart pick.',
      priceTier: 'premium',
      url: 'https://www.amazon.com/dp/B084KPXQNB',
    },
    {
      id: 'the-ordinary-granactive',
      name: 'Granactive Retinoid 2% Emulsion',
      brand: 'the ordinary',
      why: 'HPR (hydroxypinacolone retinoate) — non-irritating retinoid alternative.',
      priceTier: 'entry',
      url: 'https://theordinary.com/en-us/granactive-retinoid-2pct-emulsion-serum-100437.html',
    },
  ],

  redness: [
    {
      id: 'paulas-azelaic',
      name: '10% Azelaic Acid Booster',
      brand: 'paulas-choice',
      why: 'Azelaic acid 10% — gold-standard for rosacea redness + post-inflammatory marks.',
      priceTier: 'mid',
      url: 'https://www.paulaschoice.com/10pct-azelaic-acid-booster/7900.html',
    },
    {
      id: 'avene-antirougeurs',
      name: 'Antirougeurs Calm Soothing Repair Mask',
      brand: 'avène',
      why: 'Thermal spring water + dextran sulfate — fast SOS for reactive skin.',
      priceTier: 'mid',
      url: 'https://www.amazon.com/dp/B07Q5N2QRP',
    },
    {
      id: 'the-ordinary-azelaic',
      name: 'Azelaic Acid Suspension 10%',
      brand: 'the ordinary',
      why: 'Same active as Paula\'s, lower price tier — start here if budget-conscious.',
      priceTier: 'entry',
      url: 'https://theordinary.com/en-us/azelaic-acid-suspension-10pct-brightening-cream-100438.html',
    },
  ],

  oily: [
    {
      id: 'paulas-niacinamide',
      name: '10% Niacinamide Booster',
      brand: 'paulas-choice',
      why: 'Niacinamide 10% — reduces sebum production, refines pore appearance.',
      priceTier: 'mid',
      url: 'https://www.paulaschoice.com/10pct-niacinamide-booster/7700.html',
    },
    {
      id: 'the-ordinary-niacinamide',
      name: 'Niacinamide 10% + Zinc 1%',
      brand: 'the ordinary',
      why: 'Niacinamide + zinc PCA — entry-tier sebum regulator.',
      priceTier: 'entry',
      url: 'https://theordinary.com/en-us/niacinamide-10pct-zinc-1pct-oil-control-serum-100439.html',
    },
    {
      id: 'biossance-squalane-marine',
      name: 'Squalane + Marine Algae Eye Cream',
      brand: 'biossance',
      why: 'Lightweight squalane — moisture without congestion for oily skin types.',
      priceTier: 'mid',
      url: 'https://www.amazon.com/dp/B07ZQGM34Y',
    },
  ],

  sensitive: [
    {
      id: 'avene-tolerance-control',
      name: 'Tolerance Control Soothing Cream',
      brand: 'avène',
      why: '8-ingredient minimal formula — for the most reactive skin.',
      priceTier: 'mid',
      url: 'https://www.amazon.com/dp/B07PFVB1L2',
    },
    {
      id: 'la-roche-toleriane',
      name: 'Toleriane Double Repair Face Moisturizer',
      brand: 'la roche-posay',
      why: 'Ceramide-3 + niacinamide + prebiotic thermal water. Daily-driver for sensitive skin.',
      priceTier: 'entry',
      url: 'https://www.amazon.com/dp/B07P1VQYDV',
    },
    {
      id: 'krave-great-barrier',
      name: 'Great Barrier Relief',
      brand: 'krave beauty',
      why: 'Squalane + tamanu oil — Krave\'s SOS for stripped, sensitised skin.',
      priceTier: 'mid',
      url: 'https://www.amazon.com/dp/B084SZVCY3',
    },
  ],

  spf: [
    {
      id: 'beauty-of-joseon-rice',
      name: 'Relief Sun Rice + Probiotics SPF 50+',
      brand: 'beauty of joseon',
      why: 'Korean chemical SPF — invisible finish, no white cast, suits all tones.',
      priceTier: 'entry',
      url: 'https://www.amazon.com/dp/B0BKWP2Y69',
    },
    {
      id: 'la-roche-anthelios-melt-in',
      name: 'Anthelios Melt-in Sunscreen Milk SPF 60',
      brand: 'la roche-posay',
      why: 'Broad-spectrum chemical SPF — derm-favorite, water-resistant.',
      priceTier: 'mid',
      url: 'https://www.amazon.com/dp/B005J2YS72',
    },
    {
      id: 'supergoop-unseen',
      name: 'Unseen Sunscreen SPF 40',
      brand: 'supergoop',
      why: 'Invisible primer-finish chemical SPF — perfect under makeup.',
      priceTier: 'premium',
      url: 'https://www.amazon.com/dp/B07VL3R3WW',
    },
  ],

  retinol: [
    {
      id: 'the-ordinary-retinol',
      name: 'Retinol 0.5% in Squalane',
      brand: 'the ordinary',
      why: 'Pure retinol 0.5% — entry-tier strength for nightly use after tolerance.',
      priceTier: 'entry',
      url: 'https://theordinary.com/en-us/retinol-0-5pct-in-squalane-100440.html',
    },
    {
      id: 'medik8-crystal-retinal-6',
      name: 'Crystal Retinal 6',
      brand: 'medik8',
      why: 'Retinaldehyde — step up from Crystal Retinal 3 once tolerated.',
      priceTier: 'premium',
      url: 'https://www.amazon.com/dp/B084KQRWGL',
    },
    {
      id: 'cerave-resurfacing-retinol',
      name: 'Resurfacing Retinol Serum',
      brand: 'cerave',
      why: 'Encapsulated retinol + ceramides — drugstore alt with built-in barrier support.',
      priceTier: 'entry',
      url: 'https://www.amazon.com/dp/B07RJ51KS3',
    },
  ],
};

export function recsFor(concern: Concern): ProductRec[] {
  return PRODUCT_REC_CATALOG[concern] ?? [];
}
