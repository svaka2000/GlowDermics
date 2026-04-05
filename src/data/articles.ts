export type Article = {
  slug: string;
  title: string;
  subtitle: string;
  tag: string;
  readTime: number; // minutes
  hero: string; // emoji
  sections: { heading?: string; body: string }[];
  keyTakeaways: string[];
  tallowDermicsAngle?: string;
};

export const ARTICLES: Article[] = [
  {
    slug: 'skin-barrier-101',
    title: 'Your Skin Barrier: The Science Behind Healthy Skin',
    subtitle: 'Why protecting it is the only skincare philosophy that matters',
    tag: 'SKIN SCIENCE',
    readTime: 5,
    hero: '🧬',
    sections: [
      {
        body: 'The skin barrier — technically called the stratum corneum — is a 20-micron-thick layer of dead skin cells suspended in a lipid matrix. That matrix is made up of ceramides, cholesterol, and fatty acids in a near-perfect ratio. When it works, your skin stays hydrated, pathogens stay out, and inflammation stays quiet.',
      },
      {
        heading: 'What breaks it',
        body: 'Over-cleansing with sulfate-heavy cleansers, over-exfoliating with acids, alcohol-based toners, and synthetic fragrance all degrade this lipid matrix. The result: transepidermal water loss (TEWL) spikes, irritation becomes constant, and your skin becomes reactive to products it used to tolerate.',
      },
      {
        heading: 'The fatty acid connection',
        body: 'The lipids your barrier needs most are oleic acid (omega-9), linoleic acid (omega-6), and stearic acid. These are the same fatty acids found in human sebum — and almost nowhere else in nature in the same ratio. Tallow from grass-fed beef fat comes closest, with an oleic acid content of ~45%, stearic ~25%, and palmitic ~25%.',
      },
      {
        heading: 'Rebuilding vs patching',
        body: 'Most skincare products patch the barrier with silicones and synthetic occlusive agents (like dimethicone). These block TEWL temporarily but don\'t help your skin rebuild. Ingredients that actually feed your barrier — fatty acids, ceramides, cholesterol — allow it to repair. The difference shows up at the 6-week mark.',
      },
      {
        heading: 'The pH factor',
        body: 'Your skin\'s ideal pH is 4.5–5.5. Many cleansers sit at pH 7–9. Every time you cleanse with an alkaline product, you disrupt your skin\'s acid mantle, setting off a cascade of enzyme dysfunction that takes hours to restore. Slightly acidic or pH-balanced cleansers make a measurable difference in barrier health.',
      },
    ],
    keyTakeaways: [
      'The skin barrier is made of lipids — ceramides, cholesterol, fatty acids',
      'Sulfates, alcohol, and synthetic fragrance degrade it',
      'Tallow\'s fatty acid profile closely mirrors human sebum',
      'Rebuilding the barrier takes 4–6 weeks of consistent care',
      'Skin pH should stay between 4.5 and 5.5',
    ],
    tallowDermicsAngle: 'TallowDermics Tallow Cream is formulated around barrier repair — not a temporary fix. Its oleic and stearic acid content feeds the lipid matrix your barrier is built from.',
  },
  {
    slug: 'tallow-vs-moisturizers',
    title: 'Why Tallow Outperforms Every Water-Based Moisturizer',
    subtitle: 'The biochemistry that most brands don\'t want you to understand',
    tag: 'INGREDIENTS',
    readTime: 6,
    hero: '🔬',
    sections: [
      {
        body: 'Walk into any pharmacy and 90% of moisturizers are water-based. Water (aqua) is listed first, making up 60–80% of the formula. Water alone doesn\'t moisturize — it evaporates. What water-based creams actually do is deliver humectants (glycerin, hyaluronic acid) that draw moisture from the air into skin, then use synthetic polymers or silicones to slow evaporation.',
      },
      {
        heading: 'The problem with this approach',
        body: 'In low-humidity environments, humectants can actually pull moisture out of the deeper skin layers into the surface — and then into dry air. You need a proper occlusive (something that physically seals) and an emollient (something that fills in cracks) to make a moisturizer work. Most water-based formulas use silicones and mineral oil for this — neither of which is biocompatible with skin.',
      },
      {
        heading: 'What biocompatible actually means',
        body: 'Biocompatible means the ingredient is structurally similar enough to your skin\'s own chemistry that it can be used, not just tolerated. Mineral oil sits on top. Silicone sits on top. Tallow, on the other hand, shares the same triglyceride backbone as human sebum. Its fatty acids — oleic, stearic, palmitic — are the same building blocks your sebaceous glands use.',
      },
      {
        heading: 'The sebum comparison',
        body: 'Human sebum is ~57% triglycerides, with oleic acid as the dominant fatty acid. Tallow from grass-fed beef is ~57% saturated/monounsaturated triglycerides, with oleic acid at ~45%. No plant oil comes this close. Coconut oil is almost entirely saturated (no oleic). Jojoba is technically a wax ester. Argan is high in oleic but lacks the stearic/palmitic balance.',
      },
      {
        heading: 'Penetration depth',
        body: 'Because of this structural similarity, tallow\'s fatty acids can integrate into the stratum corneum rather than just sit on the surface. Studies on oleic acid show it increases skin permeability and delivers active ingredients deeper. This is the same reason oleic-rich oils like olive oil are used as penetration enhancers in pharmaceutical formulations.',
      },
      {
        heading: 'The preservative problem',
        body: 'Water-based formulas need preservatives — because water breeds bacteria. Parabens, phenoxyethanol, DMDM hydantoin (a formaldehyde releaser) are all standard. Anhydrous (water-free) formulas like pure tallow preparations don\'t need preservatives at all. That\'s fewer ingredients, and fewer ingredients means less inflammation.',
      },
    ],
    keyTakeaways: [
      'Water-based moisturizers are primarily water — which evaporates',
      'Most rely on silicones and mineral oil that sit on skin rather than absorb',
      'Tallow\'s fatty acid profile mirrors human sebum more closely than any plant oil',
      'Biocompatible ingredients integrate into skin chemistry; inert ones just coat it',
      'Anhydrous formulas skip preservatives — fewer ingredients, less irritation',
    ],
    tallowDermicsAngle: 'TallowDermics is anhydrous by design. No water, no preservatives, no silicones. Just tallow, beeswax, manuka honey, and essential oil — four ingredients that work with your skin\'s biology, not around it.',
  },
  {
    slug: 'minimalist-skincare',
    title: 'The Case for Minimal Skincare',
    subtitle: 'How the beauty industry sold you 10 steps when you need 2',
    tag: 'PHILOSOPHY',
    readTime: 4,
    hero: '✦',
    sections: [
      {
        body: 'The 10-step Korean skincare routine wasn\'t always mainstream. It became a viral export in the early 2010s, and the beauty industry — which had been selling 3-step systems — immediately pivoted. Suddenly serums, essences, ampoules, eye creams, sleeping masks, and toners were all non-negotiable. Revenue followed.',
      },
      {
        heading: 'The clinical reality',
        body: 'Dermatology studies consistently show that more products = more irritation, more sensitization, and more barrier disruption. A 2019 study in the Journal of Investigative Dermatology found that complex multi-step routines significantly increased transepidermal water loss compared to simplified routines — the opposite of what they promise.',
      },
      {
        heading: 'The ingredient interaction problem',
        body: 'Most people layering products don\'t know how ingredients interact. Vitamin C destabilizes niacinamide in some formulations. Retinol and AHAs used together increase irritation without proportionally increasing efficacy. Mixing multiple actives overwhelms the skin\'s ability to process them. Simplicity isn\'t lazy — it\'s strategic.',
      },
      {
        heading: 'What your skin actually needs',
        body: 'At its most fundamental level, skin needs: (1) gentle cleansing that doesn\'t strip the acid mantle, (2) moisture replenishment and occlusion to prevent TEWL, (3) SPF during daylight. That\'s two products in the morning, one at night. Everything else — actives, treatments, serums — is targeting specific concerns, not baseline maintenance.',
      },
      {
        heading: 'The ancestral argument',
        body: 'Humans didn\'t have skincare for 99.9% of our evolutionary history. Our skin evolved to self-regulate, self-heal, and self-moisturize under very different conditions than air conditioning and central heating. When we stop bombarding it with 12 products, many people find their skin improves — because it can finally do its job.',
      },
    ],
    keyTakeaways: [
      'Multi-step routines can increase TEWL (transepidermal water loss)',
      'Ingredient interactions in complex routines often cancel out benefits',
      'Baseline skin only needs: gentle cleanse + moisture + SPF',
      'The 10-step routine was a marketing invention, not a dermatological recommendation',
      'Fewer products = fewer chances for sensitization',
    ],
    tallowDermicsAngle: 'The TallowDermics formula exists in 4 ingredients by conviction, not convenience. Tallow, beeswax, manuka honey, lavender. Nothing you can\'t pronounce. Nothing your great-grandmother couldn\'t identify.',
  },
  {
    slug: 'reading-ingredients',
    title: 'How to Actually Read an Ingredient Label',
    subtitle: 'The INCI system decoded — what to look for, what to avoid',
    tag: 'GUIDE',
    readTime: 7,
    hero: '📋',
    sections: [
      {
        body: 'Ingredients on cosmetic labels are listed under the INCI (International Nomenclature of Cosmetic Ingredients) system — mostly in Latin or English scientific names. By law in the EU and US, they must be listed in descending order of concentration. An ingredient at the top makes up a large fraction of the formula. One at the bottom is often below 1%.',
      },
      {
        heading: 'The 1% rule',
        body: 'Preservatives, fragrance, colorants, and most actives appear in concentrations below 1%. Once you hit the preservatives on a label, everything after is likely sub-1%. This matters because many brands list trending actives like hyaluronic acid or niacinamide, but in amounts too small to do anything measurable. Marketing uses presence; science requires concentration.',
      },
      {
        heading: 'Red flags: what to avoid',
        body: 'Fragrance / Parfum: a catch-all term that can hide hundreds of undisclosed sensitizing chemicals. Sodium Lauryl Sulfate (SLS): a known skin barrier disruptor at typical concentrations. DMDM Hydantoin and Quaternium-15: formaldehyde-releasing preservatives. Phenoxyethanol above 1%: associated with neurotoxicity concerns in some research. BHA/BHT: synthetic antioxidants with endocrine disruption potential.',
      },
      {
        heading: 'Green flags: what to welcome',
        body: 'Ceramides (any ceramide NP, AP, EOP, etc.): barrier builders. Fatty alcohols (cetyl alcohol, stearyl alcohol): emollients, not drying. Glycerin: one of the most effective humectants available. Niacinamide: evidence-based brightening and barrier support. Zinc oxide: physical UV filter, anti-inflammatory, suitable for sensitive skin. Squalane: an extremely stable, non-comedogenic emollient.',
      },
      {
        heading: 'Natural doesn\'t mean safe',
        body: 'Essential oils are natural. Cinnamon bark essential oil causes contact dermatitis in a significant percentage of people. Citrus oils are photosensitizing. "Natural" is not a synonym for "non-irritating." Assess ingredients on their individual safety profiles, not their source. Conversely, "synthetic" doesn\'t mean harmful — some synthetics are more stable and better studied than their natural counterparts.',
      },
      {
        heading: 'Concentration context',
        body: 'Retinol is effective at 0.025%–1%. Niacinamide needs at least 2–5% to show barrier benefits. Vitamin C (L-ascorbic acid) requires 10–20% to show brightening effects. AHAs (glycolic, lactic) need 5–10%+ for exfoliation. If a brand doesn\'t disclose concentrations, assume they\'re low — because brands that use effective concentrations tend to advertise them.',
      },
    ],
    keyTakeaways: [
      'INCI order = descending concentration — top ingredients dominate',
      'Preservatives mark the ~1% threshold; actives below it are mostly decorative',
      'Fragrance/parfum is an undisclosed mix — a common sensitizer',
      '"Natural" ≠ safe; "synthetic" ≠ harmful',
      'Effective concentrations matter — check brands that disclose them',
    ],
  },
  {
    slug: 'oily-skin-myths',
    title: 'Oily Skin: Everything You\'ve Been Told is Wrong',
    subtitle: 'The paradox of dehydrated skin producing more oil',
    tag: 'SKIN TYPE',
    readTime: 5,
    hero: '💧',
    sections: [
      {
        body: 'The advice for oily skin has remained unchanged for decades: strip the oil. Salicylic acid cleansers, alcohol-based toners, oil-free everything. The logic seems sound — if your skin is producing excess oil, remove it. But this approach consistently makes oily skin worse, and the biochemistry explains exactly why.',
      },
      {
        heading: 'Sebostasis: the feedback loop',
        body: 'Your sebaceous glands operate under a feedback mechanism. When sebum production is adequate, they reduce output. When surface oils are stripped — by harsh cleansers, alcohol toners, or over-exfoliation — the glands receive a signal that production needs to increase. Strip your skin at 7am. By 10am, it\'s shinier than before. The cycle continues.',
      },
      {
        heading: 'Dehydrated vs oily skin',
        body: 'These are not the same thing, and can both exist simultaneously. Oily skin = excess sebum production. Dehydrated skin = lack of water in the skin. You can have oily, dehydrated skin — and this is very common in people who over-cleanse. When your skin is dehydrated, it produces more oil to compensate. Adding a non-comedogenic moisturizer to oily skin often reduces oiliness over 4–6 weeks.',
      },
      {
        heading: 'Comedogenicity is misunderstood',
        body: 'Comedogenic ratings were developed in rabbit ear studies in the 1970s — using concentrations far higher than those found in cosmetics. Coconut oil scores 4/5 on comedogenic scales and is genuinely problematic for most acne-prone skin. But olive oil, which also scores highly, is used in many products without widespread breakout reports. The rating system is imperfect. Real-world testing matters more.',
      },
      {
        heading: 'What actually helps',
        body: 'Niacinamide at 4–5% has the strongest clinical evidence for reducing sebum production. Zinc (oral or topical) moderates sebaceous activity. A gentle, pH-balanced cleanser that doesn\'t strip. A lightweight, non-comedogenic moisturizer. And patience — because regulating a dysregulated sebaceous gland takes the same 4–6 weeks as any other skin change.',
      },
    ],
    keyTakeaways: [
      'Stripping oil triggers a sebum overproduction rebound cycle',
      'Oily and dehydrated skin frequently occur together',
      'Moisturizing oily skin often reduces oiliness over 4–6 weeks',
      'Comedogenic ratings are based on outdated, unreliable rabbit ear testing',
      'Niacinamide (4–5%) has the strongest evidence for regulating sebum',
    ],
    tallowDermicsAngle: 'Tallow is oleic-acid dominant, which penetrates rather than sits. Many people with oily skin report normalization of sebum production after 4–6 weeks — consistent with the feedback loop theory.',
  },
  {
    slug: 'the-28-day-rule',
    title: 'The 28-Day Rule: Why Skincare Takes Time',
    subtitle: 'The biology of skin cell turnover and what it means for your routine',
    tag: 'TIMELINE',
    readTime: 4,
    hero: '📅',
    sections: [
      {
        body: 'Most skincare products fail not because they don\'t work — but because people quit before they have any chance to work. The industry standard for seeing results is 4–12 weeks. The reason comes down to one number: 28.',
      },
      {
        heading: 'The cell cycle',
        body: 'Your skin renews itself through keratinocyte turnover. New cells are born in the basal layer, travel upward through the epidermis, and eventually reach the surface as dead, flattened corneocytes in the stratum corneum. This journey takes approximately 28 days in young adults — slowing to 40–60 days in those over 40.',
      },
      {
        heading: 'What this means for actives',
        body: 'When you apply retinol, it doesn\'t change existing cells — it influences the behavior of new cells being formed. Those cells take 28 days to reach the surface. That\'s 28 days before you can even see the first wave of effect. And because not all cells are at the same stage at any given time, the full effect builds over multiple cycles — typically 12 weeks.',
      },
      {
        heading: 'The purging phenomenon',
        body: 'Actives like retinoids and AHAs speed up cell turnover. This accelerated shedding can temporarily push microcomedones (blocked follicles that haven\'t surfaced yet) to the surface. This looks like breakouts. It\'s not — it\'s the clearing process. It typically lasts 4–6 weeks. Quitting during this phase is the most common mistake people make with retinoids.',
      },
      {
        heading: 'Barrier restoration',
        body: 'When you damage your skin barrier, restoration follows the same 28-day cadence. Each new cell generation either has access to the right building materials (ceramides, fatty acids) or it doesn\'t. If you switch to barrier-supporting products, you\'ll need one full turnover cycle before the effects begin to be visible — and two to three cycles before the skin feels transformed.',
      },
    ],
    keyTakeaways: [
      'Skin cells take 28 days to travel from basal layer to surface',
      'Actives work on new cells — results take at minimum one turnover cycle',
      'Retinoid "purging" is normal — it\'s the clearing of existing microcomedones',
      'Barrier repair takes 4–12 weeks depending on damage severity',
      'Consistent use over 12 weeks is the minimum to evaluate any product',
    ],
  },
  {
    slug: 'ancestral-skincare',
    title: 'What Ancestral Skincare Got Right',
    subtitle: 'Before the billion-dollar industry: animal fat, honey, and oils',
    tag: 'HISTORY',
    readTime: 5,
    hero: '🌿',
    sections: [
      {
        body: 'Before the first synthetic cosmetic was produced in the 1800s, humans moisturized with fat. Egyptian papyri describe castor oil and animal fat preparations for skin. Roman women used lard mixed with starch. The indigenous peoples of virtually every climate used locally available animal fats — bear, seal, buffalo — to protect skin from the elements.',
      },
      {
        heading: 'Why fat worked',
        body: 'It wasn\'t superstition. Animal fats — particularly from ruminant animals — have a fatty acid composition that closely mirrors human sebum. They provided the exact lipids the skin barrier needs without disrupting it. They didn\'t require preservatives. They didn\'t cause allergic reactions at scale. And they worked in extreme climates — from the Arctic to the Sahara.',
      },
      {
        heading: 'Honey\'s documented history',
        body: 'Manuka honey appears in ancient wound-treatment papyri from Egypt, dating to 2000 BCE. Hippocrates recorded honey\'s use for burns and ulcers. Its antibacterial mechanism — hydrogen peroxide production, osmotic effect, low pH, methylglyoxal content — is well-studied and clinically validated. It was used on the battlefield before antibiotics existed because it reliably worked.',
      },
      {
        heading: 'The synthetic turn',
        body: 'The 20th century brought petroleum-derived ingredients, synthetic preservatives, and emulsification technology that allowed water to be suspended in oil at scale. This made products cheaper to produce and easier to market. Mineral oil replaced animal fat. Synthetic fragrance replaced botanicals. The industry grew, but the formulations became increasingly foreign to skin biology.',
      },
      {
        heading: 'The pendulum swings back',
        body: 'There\'s a meaningful trend in clinical dermatology: barrier-focused care. A return to ceramides, fatty acids, and occlusive ingredients — not because of nostalgia, but because the evidence base supports them. The ancestral instinct to use fat on skin was correct. The modern refinement is understanding exactly which fatty acids, at what ratios, from what sources.',
      },
    ],
    keyTakeaways: [
      'Animal fat was the universal moisturizer across human history and cultures',
      'Fatty acid profiles of ruminant fats mirror human sebum closely',
      'Honey has 4,000 years of documented antibacterial use',
      'The shift to synthetic ingredients was economic, not clinical',
      'Modern dermatology is returning to barrier-focused, lipid-rich formulations',
    ],
    tallowDermicsAngle: 'TallowDermics is part of this return — a modern interpretation of ancestral skincare, built on exactly the ingredients that have the deepest record of efficacy and safety.',
  },
  {
    slug: 'spf-guide',
    title: 'SPF: The Only Proven Anti-Aging Ingredient',
    subtitle: 'Everything you need to know about UV protection and skin aging',
    tag: 'PROTECTION',
    readTime: 5,
    hero: '☀️',
    sections: [
      {
        body: 'Dermatologists are generally skeptical people. The field moves slowly, demands evidence, and resists hype. On almost no topic is there unanimous agreement — except this one: daily SPF is the single most evidence-backed thing you can do for long-term skin health. The anti-aging benefits of consistent sunscreen use exceed those of any active ingredient on the market.',
      },
      {
        heading: 'UV and photoaging',
        body: 'About 80% of visible facial aging is caused by UV exposure — not chronological aging. UVA rays (the ones that penetrate glass) damage collagen and elastin in the dermis, causing fine lines, loss of elasticity, and pigmentation. UVB rays cause sunburn and are the primary driver of skin cancer. A good sunscreen blocks both.',
      },
      {
        heading: 'SPF numbers decoded',
        body: 'SPF 15 blocks ~93% of UVB. SPF 30 blocks ~97%. SPF 50 blocks ~98%. The logarithmic scale means the jump from 30 to 50 is relatively small — but SPF 30 to SPF 15 is significant. Most dermatologists recommend SPF 30 daily, SPF 50 for prolonged outdoor exposure. The number is about the amount of UV blocked, not how long you can stay in the sun.',
      },
      {
        heading: 'Chemical vs mineral',
        body: 'Chemical sunscreens (avobenzone, octinoxate, oxybenzone) absorb UV and convert it to heat. Mineral sunscreens (zinc oxide, titanium dioxide) reflect UV physically. Mineral filters are generally better tolerated by sensitive and acne-prone skin. Zinc oxide at SPF-effective concentrations has anti-inflammatory properties, making it a dual-action ingredient. The white cast concern is largely resolved in newer formulations.',
      },
      {
        heading: 'Application reality',
        body: 'The SPF rating on a bottle is achieved using 2mg/cm² — about a quarter teaspoon for the face. Most people apply 25–50% of that. If you apply half the required amount of SPF 30, you\'re getting approximately SPF 5–8 in practice. Reapplication every 2 hours in active sun exposure is also essential — sweat, touch, and time all reduce protection.',
      },
    ],
    keyTakeaways: [
      '80% of visible facial aging is from UV, not chronological time',
      'SPF 30 blocks ~97% of UVB — the evidence-backed minimum',
      'Mineral (zinc oxide) SPF suits sensitive and acne-prone skin best',
      'Most people apply too little — use a full quarter-teaspoon on the face',
      'Daily SPF outperforms any other anti-aging active in clinical evidence',
    ],
  },
];
