/**
 * Velumi affiliate-link wrapper.
 *
 * Takes a plain retail URL (Amazon, Sephora, Ulta, brand DTC site...) and
 * returns the same URL with the configured affiliate tag injected, so any
 * outbound product link in the app earns commission.
 *
 * Plug-in flow:
 *  1. Sign up for the programs listed in docs/VELUMI_LAUNCH_LINKS.md
 *  2. Drop the IDs into .env.local (gitignored):
 *       EXPO_PUBLIC_AMAZON_TAG=yourtag-20
 *       EXPO_PUBLIC_SKIMLINKS_PUB_ID=12345
 *       EXPO_PUBLIC_IMPACT_PUBLISHER_ID=12345
 *       EXPO_PUBLIC_RAKUTEN_PUB_ID=12345
 *       EXPO_PUBLIC_CJ_PUB_ID=12345
 *       EXPO_PUBLIC_AWIN_AFF_ID=12345
 *       EXPO_PUBLIC_SHAREASALE_AFF_ID=12345
 *  3. Restart the dev server. All product links route through here.
 *
 * Design rules:
 *  - Pure function. No side effects. Same input → same output.
 *  - If no relevant tag is configured, returns the URL unchanged
 *    (NEVER break a working link to add a missing tag).
 *  - Adds a `velumi` UTM source so we can attribute traffic in retailer analytics.
 */

// expo-constants reads .env via Expo's EXPO_PUBLIC_ prefix at build time
const env = (key: string): string => {
  // process.env access in Expo: EXPO_PUBLIC_* keys are inlined at bundle time.
  // The any-cast is intentional — TS narrowing of process.env isn't worth the cost.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((process.env as any)?.[key] ?? '') as string;
};

const TAGS = {
  amazon: env('EXPO_PUBLIC_AMAZON_TAG'),
  skimlinks: env('EXPO_PUBLIC_SKIMLINKS_PUB_ID'),
  impact: env('EXPO_PUBLIC_IMPACT_PUBLISHER_ID'),
  rakuten: env('EXPO_PUBLIC_RAKUTEN_PUB_ID'),
  cj: env('EXPO_PUBLIC_CJ_PUB_ID'),
  awin: env('EXPO_PUBLIC_AWIN_AFF_ID'),
  shareasale: env('EXPO_PUBLIC_SHAREASALE_AFF_ID'),
};

const AMAZON_HOSTS = new Set([
  'amazon.com', 'www.amazon.com', 'amzn.to', 'a.co',
  'amazon.co.uk', 'www.amazon.co.uk',
  'amazon.ca', 'www.amazon.ca',
]);

// Brand → which network owns the program. Used when the URL itself doesn't
// reveal the right network (e.g. brand DTC sites).
const BRAND_NETWORK: Record<string, keyof typeof TAGS> = {
  cerave: 'impact',
  'la roche-posay': 'impact',
  'la-roche-posay': 'impact',
  vichy: 'impact',
  sephora: 'rakuten',
  ulta: 'cj',
  walgreens: 'rakuten',
  iherb: 'cj',
  glossier: 'impact',
  paulaschoice: 'shareasale',
  'paulas-choice': 'shareasale',
  // Add brands as new programs are signed up for.
};

function hostnameOf(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function addUtm(url: string): string {
  try {
    const u = new URL(url);
    if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', 'velumi');
    if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', 'app');
    return u.toString();
  } catch {
    return url;
  }
}

function tagAmazon(url: string, tag: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set('tag', tag);
    return u.toString();
  } catch {
    return url;
  }
}

function wrapSkimlinks(url: string, pubId: string): string {
  // Skimlinks redirect format. Their docs allow direct URL wrap via
  // go.skimresources.com/?url=... — exact param name may need to be updated
  // once the user signs up and verifies.
  const encoded = encodeURIComponent(url);
  return `https://go.skimresources.com/?id=${pubId}&xs=1&url=${encoded}`;
}

/**
 * Wrap a retail URL with the appropriate affiliate tag.
 *
 * @param url - The original retail URL (Amazon, Sephora, brand DTC, etc.)
 * @param brandHint - Optional brand name (lowercased) when the URL hostname
 *                    doesn't reveal the network (e.g. cerave.com → use Impact).
 * @returns The URL with affiliate tag injected, or the original URL if no
 *          relevant tag is configured.
 */
export function affiliateLink(url: string, brandHint?: string): string {
  if (!url) return url;
  const host = hostnameOf(url);
  if (!host) return url;

  // 1. Amazon family — direct tag injection (fastest, cheapest path)
  if (AMAZON_HOSTS.has(host) || host.endsWith('.amazon.com') || host.endsWith('.amzn.to')) {
    if (TAGS.amazon) {
      return addUtm(tagAmazon(url, TAGS.amazon));
    }
    return addUtm(url);
  }

  // 2. Brand DTC — route through the network that runs their program
  const brand = (brandHint ?? '').toLowerCase().trim();
  const networkForBrand = BRAND_NETWORK[brand];
  if (networkForBrand) {
    const tag = TAGS[networkForBrand];
    // For Impact / Rakuten / CJ / Awin: their deep-link tools generate URLs
    // per-product in the publisher dashboard. We append the tag as a tracking
    // param the network's pixel will pick up if the user is logged in.
    // Update this once you've verified each network's exact format.
    if (tag) {
      const sep = url.includes('?') ? '&' : '?';
      return addUtm(`${url}${sep}velumi_${networkForBrand}=${tag}`);
    }
  }

  // 3. Skimlinks fallback — auto-monetises ANY retail link if the pub ID is set
  if (TAGS.skimlinks) {
    return wrapSkimlinks(addUtm(url), TAGS.skimlinks);
  }

  // 4. No tag available — return URL with UTM only so we can at least attribute
  return addUtm(url);
}

/**
 * Returns true when at least one affiliate tag is configured. Useful for
 * conditionally hiding the affiliate disclosure ribbon when no monetization
 * is actually happening (e.g. local dev).
 */
export function hasAffiliateConfig(): boolean {
  return Object.values(TAGS).some((v) => v && v.length > 0);
}
