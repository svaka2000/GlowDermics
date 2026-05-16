/**
 * GlowDermics affiliate redirect Worker.
 *
 * Deploy to Cloudflare Workers, route: go.glowdermics.com/p/*
 *
 *   go.glowdermics.com/p/<productKey>?ctx=<screen>&u=<userBucket>
 *     → log click (before cookie drops)
 *     → 302 to the affiliate URL with the correct per-network SubID embedded
 *
 * Why this exists (playbook §3.2): hot-swap merchants without an app rebuild,
 * capture ground-truth click logs even when ITP eats the cookie, A/B test
 * merchants, keep app code human-readable + grep-able.
 *
 * The real affiliate URLs (with YOUR tracking tags) live ONLY here / in the
 * R2 link table — never in the shipped app bundle.
 */

// JSON table in R2: { "<productKey>": { url, network, enabled }, ... }
const LINK_TABLE_URL = 'https://r2.glowdermics.com/affiliate-links.json';
const CLICK_ENDPOINT = 'https://analytics.glowdermics.com/click';
const FALLBACK_URL = 'https://glowdermics.com/product-unavailable';

// Per-network SubID parameter (playbook §3.3).
const SUBID_PARAM = {
  amazon: 'ascsubtag',
  impact: 'subId1',
  rakuten: 'u1',
  cj: 'sid',
  awin: 'clickref',
  skimlinks: 'xcust',
};

let tableCache = null;
let tableCacheTs = 0;
const TABLE_TTL_MS = 5 * 60 * 1000; // 5 min edge cache

async function loadTable() {
  const now = Date.now();
  if (tableCache && now - tableCacheTs < TABLE_TTL_MS) return tableCache;
  const res = await fetch(LINK_TABLE_URL, { cf: { cacheTtl: 300 } });
  if (!res.ok) return tableCache || {};
  tableCache = await res.json();
  tableCacheTs = now;
  return tableCache;
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const match = url.pathname.match(/^\/p\/([a-z0-9-]+)$/);
    if (!match) return new Response('Not found', { status: 404 });

    const productKey = match[1];
    const context = (url.searchParams.get('ctx') || 'unknown').slice(0, 32);
    const userBucket = (url.searchParams.get('u') || 'anon').slice(0, 16);

    const table = await loadTable();
    const link = table[productKey];
    if (!link || !link.enabled) {
      return Response.redirect(FALLBACK_URL, 302);
    }

    // Build destination with SubID encoding the source context.
    const dest = new URL(link.url);
    const subId = `${context}_${userBucket}_${Date.now().toString(36)}`;
    const param = SUBID_PARAM[link.network];
    if (param) dest.searchParams.set(param, subId);

    // Log the click BEFORE redirecting (fire-and-forget — ground truth).
    ctx.waitUntil(
      fetch(CLICK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productKey,
          context,
          userBucket,
          network: link.network,
          ts: Date.now(),
        }),
      }).catch(() => {}),
    );

    return new Response(null, {
      status: 302,
      headers: {
        Location: dest.toString(),
        // Don't let search engines index affiliate redirects.
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer-when-downgrade',
      },
    });
  },
};
