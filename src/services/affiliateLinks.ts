/**
 * Affiliate link table service.
 *
 * Strategy (per AFFILIATE_PLAYBOOK.md §3.1):
 *  - On first use, return the embedded fallback IMMEDIATELY (no blocking).
 *  - In the background, fetch the live table from the CDN and cache it in
 *    AsyncStorage so links can be hot-swapped without an App Store rebuild.
 *  - Subsequent reads prefer cached → embedded.
 *
 * We intentionally never block UI on the network: a slightly stale link is
 * far better than a spinner on a "Buy" button.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EMBEDDED_LINK_TABLE,
  getEmbeddedLink,
  type AffiliateLink,
} from '../data/affiliateCatalog';

const CACHE_KEY = 'gd_affiliate_link_table_v1';
const CACHE_TS_KEY = 'gd_affiliate_link_table_ts_v1';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

/** Where the live table is hosted. Override via env without an app rebuild. */
const REMOTE_TABLE_URL =
  process.env.EXPO_PUBLIC_AFFILIATE_TABLE_URL ||
  'https://r2.glowdermics.com/affiliate-links.json';

let memoryTable: Record<string, AffiliateLink> | null = null;
let refreshing = false;

function isValidTable(x: unknown): x is Record<string, AffiliateLink> {
  if (!x || typeof x !== 'object') return false;
  const vals = Object.values(x as Record<string, unknown>);
  if (vals.length === 0) return false;
  return vals.every(
    v =>
      !!v &&
      typeof v === 'object' &&
      typeof (v as AffiliateLink).productKey === 'string' &&
      typeof (v as AffiliateLink).url === 'string',
  );
}

/** Kick a background refresh (deduped). Safe to call often. */
export async function refreshLinkTable(): Promise<void> {
  if (refreshing) return;
  refreshing = true;
  try {
    const tsRaw = await AsyncStorage.getItem(CACHE_TS_KEY);
    const age = tsRaw ? Date.now() - Number(tsRaw) : Infinity;
    if (age < CACHE_TTL_MS && memoryTable) return; // still fresh

    const res = await fetch(REMOTE_TABLE_URL, { method: 'GET' });
    if (!res.ok) return;
    const json = await res.json();
    if (!isValidTable(json)) return;

    memoryTable = json;
    await AsyncStorage.multiSet([
      [CACHE_KEY, JSON.stringify(json)],
      [CACHE_TS_KEY, String(Date.now())],
    ]);
  } catch {
    // Offline / malformed — keep using cache or embedded. Never throw.
  } finally {
    refreshing = false;
  }
}

/** Hydrate the in-memory table from cache, then trigger a background refresh. */
export async function initLinkTable(): Promise<void> {
  if (!memoryTable) {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValidTable(parsed)) memoryTable = parsed;
      }
    } catch {
      /* ignore */
    }
  }
  // Fire-and-forget refresh.
  void refreshLinkTable();
}

/**
 * Resolve a product link. Order: live/cached table → embedded fallback.
 * Returns undefined only for genuinely unknown productKeys.
 */
export function getAffiliateLink(productKey: string): AffiliateLink | undefined {
  return memoryTable?.[productKey] ?? getEmbeddedLink(productKey);
}

/** All known product keys (used to gate AI output to the catalog). */
export function knownProductKeys(): string[] {
  return Object.keys(memoryTable ?? EMBEDDED_LINK_TABLE);
}

export type { AffiliateLink };
