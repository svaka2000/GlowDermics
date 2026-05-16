# Affiliate Redirect — Deploy Guide

What you (Samarth) do once the affiliate accounts are approved. The app code is
already wired; this stands up the server side. ~30 min of work.

See the full strategy in `../AFFILIATE_PLAYBOOK.md`. This is the deploy runbook.

---

## 0. Prereqs (sign up first — see playbook §1, §10)

| Network | URL | Approval |
|---|---|---|
| Amazon Associates | https://affiliate-program.amazon.com/ | instant, 180-day window for 3 sales |
| Skimlinks | https://www.skimlinks.com/publishers/ | 24–72h, no audience minimum |

Skimlinks + Amazon already cover every brand the app mentions. Add Impact/
Rakuten later only if volume justifies the per-brand overhead.

You need a Cloudflare account (free tier) and the `glowdermics.com` domain on
Cloudflare DNS.

---

## 1. Stand up the redirect domain

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Worker**.
2. Name it `glowdermics-affiliate-redirect`.
3. Paste the contents of `affiliate-redirect-worker.js`. Deploy.
4. **Workers Routes** → add route: `go.glowdermics.com/p/*` → this Worker.
5. **DNS** → add a record:
   - Type `CNAME`, name `go`, target `glowdermics.com` (or `@`), **Proxied (orange cloud ON)**. The proxy is what lets the Worker route intercept it.

Test: `curl -sI "https://go.glowdermics.com/p/cerave-moisturizing-cream?ctx=test&u=qa"`
→ expect `HTTP/2 302` and a `location:` header pointing at Amazon with
`ascsubtag=test_qa_...`.

---

## 2. Host the live link table on R2

1. Cloudflare → **R2** → create bucket `glowdermics-cdn`.
2. Copy `affiliate-links.sample.json` → `affiliate-links.json`, fill in your
   REAL affiliate URLs (Amazon: append `?tag=YOURTAG-20`; Skimlinks: wrap with
   your `go.skimresources.com?id=YOURID&url=...`).
3. Upload as `affiliate-links.json`.
4. Connect a custom domain `r2.glowdermics.com` to the bucket (R2 → Settings →
   Custom Domains), or update `LINK_TABLE_URL` in the Worker to the
   `*.r2.dev` public URL.

**To hot-swap a merchant later:** edit `affiliate-links.json`, re-upload.
Live within 5 min (Worker edge cache TTL). Zero app rebuild. This is the entire
point of the architecture.

---

## 3. Click logging (optional but recommended)

The Worker POSTs each click to `CLICK_ENDPOINT` before redirecting — ground
truth even when ITP eats the network cookie. Cheapest options:
- Cloudflare **D1** (SQLite) + a tiny insert in the Worker, or
- Any collector (Tinybird / a Supabase Edge Function / Plausible custom event).

Until you wire one, clicks still queue locally in the app
(`gd_affiliate_click_queue_v1` in AsyncStorage) and the redirect still works —
the POST just no-ops.

---

## 4. Point the app at production

The app reads these env vars (all optional — sensible defaults baked in):

```
EXPO_PUBLIC_AFFILIATE_REDIRECT_BASE=https://go.glowdermics.com
EXPO_PUBLIC_AFFILIATE_TABLE_URL=https://r2.glowdermics.com/affiliate-links.json
EXPO_PUBLIC_AFFILIATE_CLICK_ENDPOINT=https://analytics.glowdermics.com/click
```

Add to `.env`. Defaults already match the values above, so if you use the same
hostnames you don't strictly need to set anything.

---

## 5. Compliance checklist (do NOT skip — playbook §4, §5)

- [ ] List every affiliate network in the app **Privacy Policy** (Apple 5.1.1(i)).
- [ ] `<AffiliateDisclosure />` is rendered on every shoppable screen (already
      wired on `dupes`; add to budget/products/scanner/learn/chat as those get
      OutboundLinks). It must be visible, adjacent, plain-language, unavoidable.
- [ ] TallowDermics recommendations use `<AffiliateDisclosure firstParty />`
      (material-connection wording).
- [ ] App Store description: no "earn while you scan" type language; affiliate
      is incidental, not the pitch.
- [ ] Amazon: register the app's bundle ID under Amazon **Mobile Associates**
      or app clicks won't attribute.
- [ ] W-9 on file with each network; set aside ~30–35% of payouts for tax
      (playbook §7).

---

## How the app side already works (no action needed)

- `src/data/affiliateCatalog.ts` — embedded fallback table + product catalog.
- `src/services/affiliateLinks.ts` — fetches live table, caches in
  AsyncStorage, falls back to embedded. `initLinkTable()` is called at app
  startup.
- `src/services/affiliate.ts` — `openProduct()` logs the click and opens the
  redirect URL via `Linking.openURL` (system browser → affiliate cookie
  survives; this is the §3.4 fix).
- `src/components/ui/OutboundLink.tsx` — drop-in "Buy on X" button.
- `src/components/ui/AffiliateDisclosure.tsx` — FTC disclosure.

To make a new product shoppable: add it to `EMBEDDED_LINK_TABLE` (and the R2
JSON), then `<OutboundLink productKey="..." context="..." />` anywhere.
