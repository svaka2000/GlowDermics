/**
 * Affiliate link catalog — canonical product → affiliate-link mapping.
 *
 * This is the EMBEDDED FALLBACK copy. At runtime, `affiliateLinks.ts` tries to
 * fetch a fresher table from the CDN (so links can be hot-swapped without an
 * App Store rebuild) and falls back to this baked-in copy when offline or
 * before the first fetch resolves.
 *
 * Key every product by a stable `productKey` (kebab-case, never changes). The
 * SAME key is referenced from the dupes screen, scanner result, budget compare,
 * and AI chat — one canonical product, one link.
 *
 * IMPORTANT: the `url` here is a PLACEHOLDER until the real affiliate accounts
 * are approved. The redirect Worker (infra/affiliate-redirect-worker.js) reads
 * the live table from R2; this embedded copy is only a safety net. Do not ship
 * real tracking tags in the app bundle — they belong server-side in the Worker.
 */

export type AffiliateNetwork =
  | 'amazon'
  | 'skimlinks'
  | 'impact'
  | 'rakuten'
  | 'cj'
  | 'awin'
  | 'direct';

export type ProductCategory =
  | 'moisturizer'
  | 'cleanser'
  | 'serum'
  | 'spf'
  | 'exfoliant'
  | 'treatment'
  | 'tool'
  | 'other';

export interface AffiliateLink {
  /** Stable canonical key, e.g. "cerave-moisturizing-cream". */
  productKey: string;
  brand: string;
  productName: string;
  network: AffiliateNetwork;
  /** Raw destination URL. SubID is appended server-side by the redirect Worker. */
  url: string;
  category: ProductCategory;
  /** When false, OutboundLink renders disabled / falls back to a generic search. */
  enabled: boolean;
  /**
   * True when this is a first-party product (TallowDermics). Not an affiliate
   * relationship — it's self-promotion and must be disclosed differently
   * (see AffiliateDisclosure / playbook §5).
   */
  firstParty?: boolean;
}

/**
 * Embedded fallback table. Real affiliate URLs are injected server-side; these
 * point at plain merchant search/product pages so links still work pre-approval.
 */
export const EMBEDDED_LINK_TABLE: Record<string, AffiliateLink> = {
  'cerave-moisturizing-cream': {
    productKey: 'cerave-moisturizing-cream',
    brand: 'CeraVe',
    productName: 'Moisturizing Cream',
    network: 'amazon',
    url: 'https://www.amazon.com/s?k=cerave+moisturizing+cream',
    category: 'moisturizer',
    enabled: true,
  },
  'cerave-foaming-cleanser': {
    productKey: 'cerave-foaming-cleanser',
    brand: 'CeraVe',
    productName: 'Foaming Facial Cleanser',
    network: 'amazon',
    url: 'https://www.amazon.com/s?k=cerave+foaming+facial+cleanser',
    category: 'cleanser',
    enabled: true,
  },
  'larocheposay-cicaplast-b5': {
    productKey: 'larocheposay-cicaplast-b5',
    brand: 'La Roche-Posay',
    productName: 'Cicaplast Baume B5',
    network: 'amazon',
    url: 'https://www.amazon.com/s?k=la+roche+posay+cicaplast+baume+b5',
    category: 'treatment',
    enabled: true,
  },
  'theordinary-niacinamide': {
    productKey: 'theordinary-niacinamide',
    brand: 'The Ordinary',
    productName: 'Niacinamide 10% + Zinc 1%',
    network: 'skimlinks',
    url: 'https://theordinary.com/en-us/niacinamide-10-zinc-1-serum-100436.html',
    category: 'serum',
    enabled: true,
  },
  'paulaschoice-2bha': {
    productKey: 'paulaschoice-2bha',
    brand: "Paula's Choice",
    productName: 'Skin Perfecting 2% BHA Liquid Exfoliant',
    network: 'skimlinks',
    url: 'https://www.paulaschoice.com/skin-perfecting-2pct-bha-liquid-exfoliant/201.html',
    category: 'exfoliant',
    enabled: true,
  },
  'eltamd-uv-clear-spf46': {
    productKey: 'eltamd-uv-clear-spf46',
    brand: 'EltaMD',
    productName: 'UV Clear Broad-Spectrum SPF 46',
    network: 'amazon',
    url: 'https://www.amazon.com/s?k=eltamd+uv+clear+spf+46',
    category: 'spf',
    enabled: true,
  },
  'tallowdermics-signature-balm': {
    productKey: 'tallowdermics-signature-balm',
    brand: 'TallowDermics',
    productName: 'Signature Tallow Balm',
    network: 'direct',
    url: 'https://tallowdermics.com/products/signature-balm',
    category: 'moisturizer',
    enabled: true,
    firstParty: true,
  },
};

/** Lookup helper used by services + the OutboundLink fallback path. */
export function getEmbeddedLink(productKey: string): AffiliateLink | undefined {
  return EMBEDDED_LINK_TABLE[productKey];
}
