# Velumi AI — Relaunch (Phase 1) Design Spec

**Date:** 2026-05-17
**Status:** Approved (direction + approach locked with user; user waived per-part review — execute organized, one part fully at a time)

## 1. Why

The app currently reads as an "AI demo": dark UI, terracotta/Claude-orange palette, "GlowDermics" name, and a deep "TallowDermics" brand tie woven through ~110 files. It does not look like a premium consumer skincare product and does not out-class competitors (Skin Bliss, Charm, Glowie). This phase relaunches it as **Velumi AI** — a quiet-luxury, premium skincare-intelligence brand.

## 2. Locked decisions

- **Brand name:** GlowDermics → **Velumi AI** (display), `velumi` (slug/scheme), bundle id `com.velumi.app`.
- **Visual North Star:** **Quiet Luxury** — warm ivory + taupe/mocha + champagne, elegant serif display. Calm, editorial, premium (Aesop / Augustinus Bader / Tata Harper). Light primary; refined warm-charcoal dark mode (NOT the old warm-black + orange).
- **TallowDermics:** **Clean & neutral** — strip ALL TallowDermics references app-wide. AI gives brand-agnostic advice. KEEP the dupe-finder + affiliate infrastructure but generic (recommends real retail products; no fake first-party brand).
- **AI coach name:** "Derm" → **"Vera"** (warm, on-brand, distinct).
- **Execution approach:** ① Centralized token-swap relaunch — rewrite the one central palette, scripted rename, surgical de-Tallow, add serif typography + Velumi wordmark, then premium-polish the hero screens. Reuses the proven theme + dark-mode + a11y pipeline. Lowest risk, highest leverage.
- **Phase 2 (later, separate cycle):** deeper per-screen redesign + competitive feature upgrades.

## 3. Design system (Part 1 output)

Central file `src/constants/colors.ts` keeps the **exact same key set** (so `useColors()` + `Palette` re-skins all screens with zero structural change). Values are replaced:

**Light — Velumi Quiet Luxury (representative tokens)**
- primary `#8A7860` (warm taupe/mocha) · primaryLight `#A89A86` · primaryDark `#665845`
- bg `#F7F3EC` (warm ivory) · bgCard `#FFFFFF` · bgElevated `#EFE9DF` · bgSheet `#FBF8F2`
- textPrimary `#2B2722` · textSecondary `rgba(43,39,34,0.58)` · textMuted `rgba(43,39,34,0.34)`
- gold/champagne `#B79B6E` · goldLight `#D8C29A`
- scores: excellent `#4F9D77` · good `#6FB58F` · fair `#C8923E` · poor `#C75D4A`
- semantic dimension tints re-toned from neon → refined earthy-jewel (dusty blue/mauve/teal/sand/clay/etc.) so data viz reads premium not garish
- border `rgba(43,39,34,0.08)` · borderStrong `rgba(138,120,96,0.28)` · glass warm-white
- ink `#2B2722` / inkSoft `#3A352E`

**Dark — Velumi refined night (warm espresso-charcoal, not pure black)**
- primary `#B7A083` (lit champagne-taupe) · bg `#1A1714` · bgCard `#241F1A` · bgElevated `#2E2823` · bgSheet `#1F1B17`
- textPrimary `#F2EDE3` · gold `#CBAE80` · brightened earthy-jewel semantic set
- ink flips to `#F2EDE3` / inkSoft `#E4DCCB` (preserves the dark-mode "ink flips" contract every screen relies on)

**Typography:** new `src/constants/typography.ts` — `fonts.display` (elegant serif via Platform serif stack, no binary asset needed), `fonts.body` (system sans), and a type scale (display/title/heading/body/caption/overline). Applied during hero polish (Part 4); module + tokens established in Part 1.

**Wordmark:** new `src/components/ui/VelumiWordmark.tsx` — typographic "VELUMI" lockup (serif, letter-spaced) + small spark mark, theme-aware, used in headers/splash/onboarding. Binary app-icon/splash PNG swap is a follow-up (needs a real raster asset; tracked, not blocking).

## 4. Organized work plan (one part fully → tsc EXIT=0 → live-verify → commit → next)

- **Part 1 — Brand foundation.** Rewrite `colors.ts` (light+dark, same keys). Add `typography.ts`. Add `VelumiWordmark` component. tsc; live-verify ~4 hero screens re-skin cleanly (home/scan/results/coach) in light+dark; commit. No renames yet.
- **Part 2 — Rename.** `GlowDermics`→`Velumi AI` / `glowdermics`→`velumi` across the 42 source files + `app.json` (name/slug/scheme/icon refs/bundleIdentifier `com.velumi.app` + usage strings) + `package.json` name. Scripted, reviewed. tsc; verify boot + a few screens; commit.
- **Part 3 — De-Tallowify (clean & neutral).** Strip TallowDermics from: AI prompts (`src/services/skinAnalysis.ts`, `dupeFinder.ts`, `ingredientScanner.ts`, `app/weekly-digest`, `app/forecast`, `app/quiz`, `app/routine-builder`, `app/routine-analyzer`, coach) — remove tallow persona/product lines, rename "Derm"→"Vera", keep clinical rigor + the warm 2nd-person voice already shipped; affiliate catalog (`src/data/affiliateCatalog.ts`, `src/services/affiliate*`) → generic retail (no firstParty brand); product/dupes/learn screens → de-branded. Sub-commit per logical group; tsc + live-verify each AI surface on its real screen (Groq reachable). Keep gd_analyses baseline = `__qa_mock_scan__` only.
- **Part 4 — Hero polish.** home, scan, results/[id], coach, paywall, onboarding: apply serif display headlines, Velumi wordmark, spacing rhythm, refined cards so the relaunch *feels* designed. One screen fully at a time; screenshot-verify vs the Quiet-Luxury bar; commit per screen.

## 5. Constraints / invariants (carry over from prior passes)

- Never break the `Palette` key set or the dark-mode "ink flips" contract.
- AI changes: tone/persona/brand-strip only — never change JSON field names/shape/parser/fallback/return contracts; preserve the safety-critical conflict analyzers' rigor.
- Per-iteration loop discipline: `tsc --noEmit` EXIT=0 + 0 errors (background to /tmp); live-verify in Claude Preview (Expo Web :8081, serverId `595815cb-919c-47fa-ace6-3c9d836d6bc0`); surgical commit by file name with `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`; never `git add -A`; exclude untracked `.claude/`, `AFFILIATE_PLAYBOOK.md`, `.superpowers/`. ScheduleWakeup 60s to continue non-stop.
- Permanent artifact discount list still applies (preview device-frame width clip, entrance-animation screenshot timing, etc.).

## 6. Verification per part

tsc EXIT=0/0 errors · diff is intentional/surgical · live render-sanity on the real screen(s) (no error overlay, key elements present, theme tokens applied) · for AI surfaces: warm + brand-neutral + Vera + JSON contract intact · baseline `gd_analyses` = `__qa_mock_scan__` only.

## 7. Out of scope (Phase 2)

Per-screen layout redesign beyond hero set; new competitive features; component-system library; real binary app-icon/splash artwork.
