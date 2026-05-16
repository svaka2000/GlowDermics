/**
 * Affiliate outbound + click logging.
 *
 * Per AFFILIATE_PLAYBOOK.md §3.2–§3.4:
 *  - Every outbound click goes through the redirect domain
 *    `go.glowdermics.com/p/<productKey>?ctx=<context>&u=<userBucket>` so the
 *    Worker can hot-swap merchants, log the click before the cookie drops, and
 *    embed the right per-network SubID.
 *  - Buy-intent links open with `Linking.openURL` (system browser) — NOT
 *    expo-web-browser — so the affiliate cookie lands in the system Safari/
 *    Chrome cookie jar and survives the user finishing checkout later.
 *  - Clicks are also queued locally (fire-and-forget) as ground truth in case
 *    ITP eats the network-side attribution.
 */
import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAffiliateLink } from './affiliateLinks';

/** Screen/context that drove the click — feeds SubID analytics. */
export type ClickContext =
  | 'scanner'
  | 'dupes'
  | 'budget'
  | 'chat'
  | 'learn'
  | 'routine'
  | 'ingredient'
  | 'products'
  | 'unknown';

const REDIRECT_BASE =
  process.env.EXPO_PUBLIC_AFFILIATE_REDIRECT_BASE ||
  'https://go.glowdermics.com';

const BUCKET_KEY = 'gd_user_bucket_v1';
const CLICK_QUEUE_KEY = 'gd_affiliate_click_queue_v1';
const CLICK_ENDPOINT =
  process.env.EXPO_PUBLIC_AFFILIATE_CLICK_ENDPOINT ||
  'https://analytics.glowdermics.com/click';

let cachedBucket: string | null = null;

/**
 * A coarse, non-identifying bucket (NOT the user id — privacy hygiene per
 * playbook §3.3). Random 4-char tag, stable per install.
 */
async function getUserBucket(): Promise<string> {
  if (cachedBucket) return cachedBucket;
  try {
    const existing = await AsyncStorage.getItem(BUCKET_KEY);
    if (existing) {
      cachedBucket = existing;
      return existing;
    }
  } catch {
    /* ignore */
  }
  const b = Math.random().toString(36).slice(2, 6);
  cachedBucket = b;
  try {
    await AsyncStorage.setItem(BUCKET_KEY, b);
  } catch {
    /* ignore */
  }
  return b;
}

/** Build the redirect URL (does not open it). Exposed for web `<a href>`. */
export async function buildRedirectUrl(
  productKey: string,
  context: ClickContext,
): Promise<string> {
  const bucket = await getUserBucket();
  const q = `ctx=${encodeURIComponent(context)}&u=${encodeURIComponent(bucket)}`;
  return `${REDIRECT_BASE}/p/${encodeURIComponent(productKey)}?${q}`;
}

/** Locally queue a click as attribution ground-truth; flush opportunistically. */
async function recordClick(productKey: string, context: ClickContext): Promise<void> {
  const entry = { productKey, context, ts: Date.now(), platform: Platform.OS };
  try {
    const raw = await AsyncStorage.getItem(CLICK_QUEUE_KEY);
    const queue: unknown[] = raw ? JSON.parse(raw) : [];
    queue.push(entry);
    // Keep the queue bounded.
    const trimmed = queue.slice(-200);
    await AsyncStorage.setItem(CLICK_QUEUE_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
  // Fire-and-forget network beacon — never blocks the redirect.
  try {
    void fetch(CLICK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

export interface OpenProductResult {
  ok: boolean;
  reason?: 'unknown-product' | 'disabled' | 'open-failed';
}

/**
 * The single entry point for "user wants to buy product X".
 * Logs the click, then hands off to the SYSTEM browser (cookie-preserving).
 */
export async function openProduct(
  productKey: string,
  context: ClickContext,
): Promise<OpenProductResult> {
  const link = getAffiliateLink(productKey);
  if (!link) return { ok: false, reason: 'unknown-product' };
  if (!link.enabled) return { ok: false, reason: 'disabled' };

  await recordClick(productKey, context);
  const url = await buildRedirectUrl(productKey, context);

  try {
    // Linking.openURL → system Safari/Chrome (NOT in-app SFSafariViewController).
    // This is the load-bearing decision for affiliate cookie survival.
    await Linking.openURL(url);
    return { ok: true };
  } catch {
    // Last resort: try the raw destination so the user still reaches the store.
    try {
      await Linking.openURL(link.url);
      return { ok: true };
    } catch {
      return { ok: false, reason: 'open-failed' };
    }
  }
}
