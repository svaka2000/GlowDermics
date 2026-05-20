# Velumi AI — Public Launch Action Links

> Manual signup / browse list curated for Samarth. As you complete each row, paste your tracking ID/tag into `.env.local` keys listed in the **env key** column — the code will swap placeholders to real affiliate URLs at runtime.

---

## 1. Affiliate programs (sign up; paste tag → `.env.local`)

Stacked by **highest payout & easiest approval** first.

### Tier A — Sign up day-one (no traffic threshold)

| # | Program | Commission | Cookie | Signup URL | Env key |
|---|---------|------------|--------|------------|---------|
| 1 | **Amazon Associates (US)** — biggest catalog, fastest approval. Beauty 3%, **Luxury Beauty 10%**. | 1%–10% | 24h | https://affiliate-program.amazon.com/ | `EXPO_PUBLIC_AMAZON_TAG` (format: `yourtag-20`) |
| 2 | **Impact** — runs CeraVe, La Roche-Posay (L'Oréal house), many indie brands. Single signup → apply to each brand inside. | 8–15% typical | 30d | https://app.impact.com/secure/signup.ihtml?ref=publisher | `EXPO_PUBLIC_IMPACT_PUBLISHER_ID` |
| 3 | **Skimlinks** — auto-monetises any retail link you already have. Easiest "set & forget." Beauty avg ~7%. | varies | 30d | https://skimlinks.com/publishers/sign-up | `EXPO_PUBLIC_SKIMLINKS_PUB_ID` |
| 4 | **Awin** (absorbed ShareASale US) — Etsy, indie skincare, Glossier-adjacent. | 5–20% | 30d | https://www.awin.com/us/publishers | `EXPO_PUBLIC_AWIN_AFF_ID` |
| 5 | **CJ Affiliate (Commission Junction)** — Sephora is on Rakuten, but Ulta + many drugstore brands here. | 2–10% | 7–30d | https://signup.cj.com/member/signup/publisher/ | `EXPO_PUBLIC_CJ_PUB_ID` |
| 6 | **Rakuten Advertising** — required for **Sephora** (5–10%) and Walgreens. Manual brand approval. | 5–10% | 1–30d | https://rakutenadvertising.com/join-us/publisher/ | `EXPO_PUBLIC_RAKUTEN_PUB_ID` |
| 7 | **ShareASale** (still active under Awin) — niche/indie skincare (Paula's Choice, Herbivore Botanicals). | 5–20% | 30–60d | https://www.shareasale.com/info/affiliates/ | `EXPO_PUBLIC_SHAREASALE_AFF_ID` |

### Tier B — Apply once you have install traffic (require a "site"/audience)

| # | Program | Why it matters | Signup URL |
|---|---------|----------------|------------|
| 8 | **Sephora (via Rakuten)** — premium positioning aligns with Velumi brand. 5–10% on most lines. | brand prestige + AOV | https://www.sephora.com/beauty/affiliates |
| 9 | **Ulta Beauty** (CJ) — drugstore + prestige in one. | broader catalog | https://www.ulta.com/company/affiliate-program/ |
| 10 | **Glossier** (Impact) — high cookie, premium audience | premium-DTC vibe | https://www.glossier.com/affiliate-program (apply via Impact once approved) |
| 11 | **Paula's Choice** (ShareASale) — clinically credible (BHA, retinoids), 7%. | clinical credibility | https://www.paulaschoice.com/affiliates.html |
| 12 | **The Ordinary / DECIEM** | budget hero brand | apply via Skimlinks (auto-monetised) — no direct program |
| 13 | **iHerb** (CJ) — international + supplement crossover. Up to 10%. | global reach | https://www.iherb.com/info/affiliateprogram |

### Tier C — Vibe-fit brands worth a manual deal (DM the brand)

These don't run public affiliate programs but have done one-off creator deals — DM the founder on Instagram / `partnerships@` email:

- **Augustinus Bader** (high-end serum, $300+ AOV — even 5% is meaningful)
- **Tata Harper** (clean luxury — fits Velumi positioning)
- **Aesop** (rare to do affiliate; worth a direct outreach for brand-fit content)
- **Youth To The People** (Sephora — get it via Sephora link)
- **Drunk Elephant** (Sephora — same)
- **U Beauty** (Skimlinks + sometimes direct deals)
- **Necessaire** (Sephora)

**Template DM** (use as-is, swap brackets):

> Hi [name] — I'm launching **Velumi AI**, a skincare-intelligence app that turns selfies into clinical-grade analyses + a personalised regimen. We surface 3–5 real product recs per scan and our early users skew premium-skincare. Would love to set up an affiliate partnership — happy to start at your standard creator rate. Reply for our media kit. — Samarth

---

## 2. UI templates / inspiration to download or buy

### Direct-purchase templates (Expo / React Native — drop-in)

| # | Template | Format | Price | Why | URL |
|---|----------|--------|-------|-----|-----|
| 1 | **Craft React Native** | Expo + TS + Reanimated | ~$79 | Premium tokens, real animations, dark mode — closest match to Velumi target. | https://craftrn.com |
| 2 | **HeroUI Pro** | Figma → React + RN | ~$199 | Strong type rhythm, premium-by-default spacing/radii/shadows. | https://heroui.pro |
| 3 | **RNKit** (CodeCanyon) | 12-app Expo bundle | ~$59 | Cheap insurance — includes beauty/wellness variants. | https://codecanyon.net/item/rnkit-react-native-expo-apps-figma-ui-kit/62205056 |
| 4 | **gluestack-ui Figma Kit** | Figma → RN | Free + Pro | First-party Figma→RN with the design tokens we already use. | https://gluestack.io/ui/docs/home/getting-started/figma-ui-kit |
| 5 | **Material Kit React Native PRO** | Expo | ~$99 | Solid foundation; not as luxe but cheap. | https://www.creative-tim.com/product/material-kit-react-native |

### Figma inspiration / patterns to lift (free browse)

- **Skincare & Beauty App UI Kit** (Figma community): https://www.figma.com/community/file/1219656902263626406/skincare-beauty-app-ui-kit
- **18 Best Figma UI Kits 2026** (curated list): https://www.beyondui.design/blog/best-figma-ui-kits

### Aesthetic reference sites — copy the *feel*, not the layout

These are the brands the Velumi spec calls out as the North Star. Save these as inspo while building:

- **Aesop** — https://www.aesop.com (editorial product cards, restraint, serif headlines)
- **Augustinus Bader** — https://augustinusbader.com (premium gradient backdrops, large hero imagery)
- **Tata Harper** — https://tataharperskincare.com (warm palette + organic photography)
- **Necessaire** — https://necessaire.com (minimal cards, lots of negative space)
- **Skin Bliss app** (App Store) — direct competitor; download to study
- **Charm app** (App Store) — competitor; study scoring viz
- **Glowie app** (App Store) — competitor

---

## 3. How the swap-in works (after you grab tags)

1. Create `.env.local` in `~/GlowDermics` (gitignored).
2. Paste your IDs:
   ```
   EXPO_PUBLIC_AMAZON_TAG=yourtag-20
   EXPO_PUBLIC_IMPACT_PUBLISHER_ID=12345
   EXPO_PUBLIC_SKIMLINKS_PUB_ID=12345
   EXPO_PUBLIC_AWIN_AFF_ID=12345
   EXPO_PUBLIC_RAKUTEN_PUB_ID=12345
   EXPO_PUBLIC_CJ_PUB_ID=12345
   EXPO_PUBLIC_SHAREASALE_AFF_ID=12345
   ```
3. The (re-built) `src/services/affiliateLink.ts` wraps every outbound retail URL in the matching network format. **You don't touch the codebase.**

---

## 4. Public-release pre-launch checklist (parallel to UI work)

- [ ] **Domain:** Buy `velumi.ai` ($120/yr at Cloudflare) or `getvelumi.com` ($12/yr) — _do today_
- [ ] **TestFlight build:** `eas build -p ios --profile preview` → upload to App Store Connect
- [ ] **App Store listing:** screenshots (need new ones post-polish), 30-char subtitle, 4000-char description, keywords
- [ ] **Privacy policy + Terms:** required for App Store + affiliate networks. Use Termly free generator: https://termly.io/
- [ ] **Instagram @velumi.ai handle:** grab now even if dormant
- [ ] **TikTok @velumiai:** same
- [ ] **Reddit:** soft-post in r/SkincareAddiction once you have public testflight
- [ ] **ProductHunt launch:** schedule for ~2 weeks post-public-release (gives you time to seed users)

---

_Generated 2026-05-20 — update as you complete rows._
