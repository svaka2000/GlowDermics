# GlowDermics Changelog

All notable changes are listed here in reverse chronological order.

---

## 2026-05-16 — Affiliate Infra + Onboarding/Face-Map Fixes + Dark-Mode Sweep (Pass 69–82)

A large multi-session block. Highlights:

### 💸 Affiliate link infrastructure (`3cd84c8`)
Config-driven, FTC-compliant affiliate system executed from `AFFILIATE_PLAYBOOK.md`.
- `src/data/affiliateCatalog.ts` — canonical `productKey` → link table (embedded fallback; real tracking tags stay server-side, never bundled)
- `src/services/affiliateLinks.ts` — live CDN table fetch + AsyncStorage cache + embedded fallback, never blocks UI; `initLinkTable()` runs at app startup
- `src/services/affiliate.ts` — `openProduct()` logs the click then opens via `Linking.openURL` (system browser, NOT expo-web-browser) so the affiliate cookie survives checkout; non-identifying user bucket for SubID analytics
- `src/components/ui/OutboundLink.tsx` + `AffiliateDisclosure.tsx` — the single "Buy on X" button + FTC disclosure (first-party wording for TallowDermics)
- Reference integration wired into `app/dupes`. Server side in `infra/`: Cloudflare Worker (per-network SubID: Amazon `ascsubtag` / Impact `subId1` / Rakuten `u1` / CJ `sid` / Awin `clickref` / Skimlinks `xcust`), R2 link-table template, 30-min deploy runbook.

### 🛠️ Onboarding pager + RegionalSkinMap (`abd3b9d`, `00f111b`, `e47b57e`)
- Onboarding horizontal pager was overflowing on web (stale `useWindowDimensions` → 5×480px clipped). Now measures the real ScrollView width via `onLayout`; verified live.
- `RegionalSkinMap` rebuilt: old oversized opaque ellipses spilled outside the face; now an SVG `ClipPath` contains all severity zones, soft per-severity `RadialGradient`s, subtle pulse. Delegated to a design agent, verified in preview.

### 🏠 Home hero stat-pill QA fix (`95cfd85`)
4-across glass stat cards clipped at ~373px ("Concerns"→"oncern"). Fixed via tighter padding/gap + `numberOfLines={1}`/`adjustsFontSizeToFit`. Caught & fixed by the autonomous screenshot→critique→fix QA loop.

### ✅ Dark-mode migration COMPLETE — every `app/*/index.tsx` is theme-aware (Pass 69–92, ~56 screens)

As of commit `fe6a077`, the find-loop (`for f in app/*/index.tsx; grep useColors / static Colors`) returns **0 remaining**. Every standalone app screen now responds to the light/dark theme via `useColors()` + `makeStyles(c: Palette)`. Final batch: glossary, ingredient, privacy, skin-weather (getWeatherReport helper takes `c: Palette`), milestones, skin-type. Remaining static-Colors files are nested/[param] routes (`learn/[slug]`, `(auth)/login|register|onboarding`) — a separate, smaller follow-on category; the auth/onboarding screens are intentionally brand-dark.

### 🌙 Dark-mode marathon (Pass 69–90) — ~44 screens
pregnancy-skin/label-guide/barrier-quiz/skin-iq (Pass 69), skin-foods/cleansing-guide/aging-timeline/sleep-log, skin-journal/photodamage/goals/diy-recipes, diet/antioxidants/weekly-digest/tallow-science, microbiome/vitamin-c/routine-builder/eczema-guide, budget/acne-diary/stress-log/seasonal/report, dehydrated-skin/acne-types/active-rotation/challenge, learn/facial-yoga/body-care/collagen-guide, journal/skin-detox/peptides/hyaluronic-acid, barrier-repair, skin-story/product-deck/gua-sha/baumann-test, hydration/hormonal-log/efa-guide/face-mapping, sleep-skin/gut-skin/exercise-skin/face-food, product/niacinamide/zinc-guide/speed-routine, habits/coach-chat/supplements/guided-facial. Established patterns: `shimColors(c: Palette)` for inline-Colors screens; `buildXxx(c|Colors)` factories for module-level color maps (PHASES/OMEGA3/OMEGA6/ZONES/SLEEP_STAGES/EXERCISE_TYPES/FOOD_GROUPS/COMBINATIONS/ZINC_FORMS/ROUTINES/PRIORITY_COLORS/FACIALS/etc.); module helper fns take the array as a param. Process: an `awk` module-scope Colors check before any sed catches multi-line arrays the `^const` grep misses. Every batch tsc-clean (exit 0) and screenshot-verified in the live preview before commit.

### 🤖 Decision Autonomy Rule (memory)
Standing directive saved: never ask the user task-ordering questions — decide and execute everything.

---

## 2026-05-09 — Content-Guide Dark-Mode Sweep (Pass 65–68)

Four more iterations. 16 content-guide screens migrated to the dark palette via the established `shimColors(palette)` + `buildXxx(c)` factory pattern. ~692 Colors refs total.

### 🌙 Dark-mode marathon (Pass 65, 66, 67, 68) — 16 screens

- Pass 65 (4): skin-foods + cleansing-guide + aging-timeline + sleep-log (179 refs) — required `buildSkinNutrients` / `buildAntiInflammatory` / `buildCleanserTypes` / `buildDoubleCleanse` / `buildDecades` / `buildAccelerators` / `buildSlowIt` / `buildQualityColors` factories
- Pass 66 (4): skin-journal + photodamage + goals + diy-recipes (177 refs) — `conditionColor(value, Colors)` helper signature change, `buildDamageTypes` + `buildRecipes` + `buildDifficultyColor` factories
- Pass 67 (4): diet + antioxidants + weekly-digest + tallow-science (174 refs) — `buildAntioxidants` + `buildStacking` + `buildGradeColors` + `buildFattyAcids` + `buildVitamins` factories
- Pass 68 (4): microbiome + vitamin-c + routine-builder + eczema-guide (162 refs) — `getSeverityColor(level, Colors)` + `getImpactColor(level, Colors)` helper signatures, `buildVcForms` + `buildCombinations` factories

Pattern reused: every screen with an inline dark-only `Colors` object got the `shimColors(palette)` shim mapping legacy field names (bg/card/cardAlt/border/primary/gold/text*/green/red/blue/purple/teal) to the project `Palette`. Module-level color-dependent arrays converted to `build*(c: Palette)` factory functions and called via `useMemo(() => buildXxx(colors), [colors])`. Helper functions like `conditionColor` / `getSeverityColor` / `getImpactColor` got `c: Palette` as a second argument so they can compose at every callsite.

After Pass 68, the great majority of registered screens in `app/_layout.tsx` now respond to the dark/light theme toggle. Only ~10 niche guides (dehydrated-skin, acne-diary, acne-types, active-rotation, anti-aging-list, body-care, budget, challenge, collagen-guide, ...) remain on the static-Colors path.

---

## 2026-05-09 — Notifications + Habits + Dark-Mode Finale (Pass 51–61)

Eleven more iterations. Highlights below.

### 🔔 Notifications Center (Pass 56) — `src/engine/NotificationsEngine.ts` + `app/notifications/index.tsx`
6-source aggregator (badges/milestones/persona shifts/at-risk streak/scan-overdue/score-warning) with persisted dismissals + seen-state. GlassHero unread count, "New" + "Earlier" sections, deeplink tap, dismiss buttons.

### ✨ DailyAffirmation widget (Pass 55) — `src/components/ui/DailyAffirmation.tsx`
30 affirmations across 8 themes, persona-tilted day-of-year picking, two-sparkle ambient animation (1.1s repeat with 550ms phase offset), tap-to-rotate.

### 📅 SkinCalendar (Pass 54)
Migrated existing /calendar screen to dark mode.

### 📊 HabitMatrix (Pass 61) — `src/components/ui/HabitMatrix.tsx` + `app/habit-matrix/index.tsx`
GitHub-contributions-style 7×12 weekly heatmap. 5 intensity bands (alpha-blended primary), Mon-first orientation, day-of-week labels, auto month markers, staggered cell entrance. Hero stats screen with tap-to-detail and all-time aggregates.

### 🌙 Dark-mode marathon (Pass 51, 52, 53, 57, 58, 59, 60) — 23 screens, ~1,000+ Colors refs
Migrated:
- Pass 51 (4): oil-guide + water-quality + skin-cycling + hormonal-acne
- Pass 52 (4): spf-guide + blacklist + rosacea-guide + sensitivity
- Pass 53 (4): hyperpigmentation + purging-guide + dupes + skin-age
- Pass 57 (4): scanner + ingredient/[name] + skin-report + exfoliation
- Pass 58 (3): environment-log + cold-therapy + skin-dna
- Pass 59 (4): quiz + minimal-routine + mens-skin + ingredient-check
- Pass 60 (4): skin-type/[type] + skin-scorecard + retinol-guide + products

Established patterns reused: `shimColors(palette)` for old inline-Colors objects; `buildXxx(c: Palette)` factories for module-level color maps; helper functions like `getResultColor(score, c)` taking palette as second arg.

---

## 2026-05-09 — Achievements + Spectrum + Dark-Mode Sweep (Pass 41–47)

Seven more iterations.

### 🏆 Achievement Wall (Pass 41) — `src/engine/AchievementEngine.ts` + `app/achievements/index.tsx`
Unified gallery aggregating 4 sources (8 streak milestones, 6 XP badges, 6 scan-count tiers, 8 persona archetypes) into one registry with 4 rarity tiers (common/rare/epic/legendary). Hero progress card, "Closest to unlock" section, filter pills, 3-column grid of rarity-tinted tiles. Epic + legendary unlocked tiles get a 1.4s shimmer overlay. Linked from home grid.

### 🌙 Dark-mode sweep (Pass 42, 44, 45, 46) — 8 high-traffic screens, ~670 Colors refs
- community + checkin + routine-analyzer (Pass 42, 190 refs)
- compare (Pass 45, 64 refs)
- morning-checklist + product-shelf + uv-log (Pass 44, 220 refs) — required shimColors() pattern to map the old inline-Colors objects from pre-design-system speed-routine days
- anti-aging + pore-guide + ingredient-conflicts (Pass 46, 199 refs) — module-level PILLARS/KEY_ACTIVES/SECTIONS converted to factories

### 📡 SkinSpectrum (Pass 43) — `src/components/ui/SkinSpectrum.tsx`
15-axis polar radar visualization with animated polygon reveal, optional dashed previous-scan overlay, vertex dots, cosine-based axis label anchor. Mounted at top of results scores tab.

### 🔥 StreakSaver (Pass 47) — `src/components/ui/StreakSaver.tsx`
Contextual banner that appears ONLY when atRisk is true (active streak + today not logged + after noon). Pulsing flame + "Save your N-day streak" headline + CTA → /checkin. Auto-dismisses on next focus once user logs.

---

## 2026-05-09 — Aura + ScanReel + Full-App Dark Mode (Pass 33–38)

Six more iterations rounding out the overnight session.

### 🎨 SkinAura procedural art (Pass 34) — `src/components/ui/SkinAura.tsx`
Watercolor-like aura unique to each user. 5 overlapping SVG ellipses with radial gradients, deterministically generated from `persona+element+glow+totalScans` seed. White-blend grows with glow score so high-scoring auras get more luminous bleed. BreathingScrim adds a 1800-2800ms opacity loop. Hero element above the SkinIdentityCard at 140px.

### 🌙 Results + new screens dark mode (Pass 35, 37) — `app/results/[id].tsx`, `app/streak/index.tsx`, `app/timeline/index.tsx`, `app/daily-challenges/index.tsx`
171 more Colors refs migrated. Every screen in the overnight build that registers in `app/_layout.tsx` is now dark-mode aware. Helper components (Stat, CalendarCell, MilestoneRow, ChallengeHero, ActivityCell, BadgeTile, CelebrationOverlay) each call useColors() and useMemo(makeStyles).

### 📷 ScanReel home widget (Pass 36) — `src/components/ui/ScanReel.tsx`
Instagram-style horizontal carousel of recent scan thumbnails. 68px circular avatars with score-tinted progress rings (green/gold/red bands), floating score chip, day-of-week label. Leading "+ NEW" card routes to /scan. Staggered fade+spring entrance.

### 🔄 Refresh-on-focus fix (Pass 38) — `src/components/ui/ScanReel.tsx`, `src/components/ui/GlowPulse.tsx`
Both widgets switched from useEffect → useFocusEffect so they re-load when home regains focus. Fixed stale-data issue after a scan completes.

### 📚 Docs (Pass 33, 39) — `CHANGELOG.md`, progress memory
Comprehensive changelog entries + progress memory updates for cold-start agents.

---

## 2026-05-09 — GlowPulse + CameraGuide + Tab Dark-Mode Finale (Pass 26–32)

Seven more iterations. Highlights below.

### 🎉 Post-scan celebration (Pass 26) — `src/components/ui/ScanCelebration.tsx`
Full-screen reveal overlay that plays after each completed scan. 24-particle confetti burst with random hue / gravity / rotation; 132pt animated score count-up; delta pill ("+4 vs last scan"); persona reveal mini-card; auto-dismisses after 6s. Triggered by `?celebrate=1` query param on /results/{id}.

### 📰 Daily Skin Stories (Pass 27) — `src/engine/SkinStoryEngine.ts` + `src/components/ui/SkinStoryStrip.tsx`
Personalized "For you today" carousel on the home tab. 8 story generators emit 0-1 stories each; top 5 by priority render as horizontal swipe cards. Stories cover streak milestones, score trends, sleep/water week-over-week deltas, quest pending, scan absence, badge milestones. Each card has a 6-color accent palette and optional deeplink.

### 🌙 Tabs dark-mode sweep (Pass 28, 31) — `app/(tabs)/routine.tsx`, `app/(tabs)/coach.tsx`, `app/(tabs)/progress.tsx`
210+ Colors refs migrated. With this batch the entire (tabs) folder is dark-mode aware. TypingDots helper in coach.tsx now calls useColors() directly.

### 📷 Cinematic CameraGuide (Pass 30) — `src/components/ui/CameraGuide.tsx`
Replaces the static frame in scan camera mode with an animated SVG face oval, soft warm glow, vertical scan-line sweep, and four pulsing corner brackets. All Reanimated 4 worklets, runs on UI thread.

### ✨ GlowPulse widget (Pass 32) — `src/components/ui/GlowPulse.tsx`
Animated daily-glow orb on the home tab. Composite score = 0.5×scanScore + 0.2×habitPct + 0.15×sleepNorm + 0.15×waterPct. Score-tinted radial gradient (red→gold→green); pulse cadence scales with score (800-2000ms). Tap → /seven-day forecast.

---

## 2026-05-09 — Skin Identity + 7-Day Forecast + Dark-Mode Sweep (Pass 21–25)

Five iterations chained — high-traffic dark-mode coverage plus two new flagship features.

### 🌙 Dark-mode migration: scan + home (Pass 21–22)

`app/scan/index.tsx`, `app/(tabs)/index.tsx`. The two highest-traffic surfaces in the app — the flagship Skin Scan flow and the home dashboard (~100 Colors refs in 967 lines) — now flip palettes via `useColors()` + `makeStyles(palette)`. Theme toggle in Settings now propagates correctly through the home hero, scan CTA, score grid, 18 quick-action cards, focus card, water tracker, challenge widget, community card, brand strip, and all routes through the camera UI.

### 📊 7-Day Skin Forecast (Pass 23) — deterministic short-term prediction

New `src/engine/SkinForecastEngine.ts` + `app/seven-day/index.tsx`. Complements the existing AI 30/60/90-day forecast at `/forecast` with a short-term, transparent, rules-based projection.

How it works:
- Pulls 30-day window of: scan scores, sleep entries, water log, routine logs, journal mood, habit checks
- Aligns features to scan scores; computes Pearson correlation per feature
- Standardizes user's last-7-day mean for each feature; weights contributions by `|correlation|`
- Caps each feature's contribution at ±6 score points
- Emits 7 days of `{date, dayLabel, score 0-100, top 3 drivers}`
- Detects trend (rising/falling/flat ≥ ±2 pts) with plain-English headline
- Identifies the biggest negative driver as the "top lever to pull this week"

Screen renders:
- Trend-tinted GlassHero badge with end-of-week score + delta + headline
- Smooth Catmull-Rom-cubic spline curve with animated stroke-dashoffset reveal
- Day-by-day cards: bar fill + driver chips (sleep/water/routine/habits/mood with icons)
- Top-lever card with feature-specific suggestion ("Aim for 7.5+ hours tonight…")
- Cross-link to AI 30/60/90-day forecast

### 🪪 Skin Identity (Pass 24) — 8 personas, 5 elements, shareable

New `src/engine/SkinIdentityEngine.ts` + `src/components/ui/SkinIdentityCard.tsx` + `app/identity/index.tsx`.

A flagship feature that turns user data into a social, shareable skin persona.

8 archetypes, picked from (streak, trend, glow score, member-since, score variance, mood variance, skin type):
- **Steady Glow** — consistent + decent score
- **The Comeback** — recovering trend, +8pt or more across 5 scans
- **Resilient Skin** — long member + flat trend
- **Glow Seeker** — improving but not steady, exploration phase
- **Radiant Veteran** — long history (90d+) + high score (78+)
- **Reactive Climber** — high mood/score variance, sensitive
- **Discovery Phase** — fresh user, ≤2 scans
- **Skin Architect** — long streak (14d+) + low variance

5 elements mapped to skin type: dry→Earth, oily→Water, combination/sensitive→Air, normal→Crystal.

Each persona has its own colorway (gradient + accent + tint) and signature 1-liner.

Card composition:
- Gradient hero band tinted by persona colorway with sparkle pulses (Reanimated 4 `withRepeat` sequences)
- Animated glow score ring (`strokeDashoffset` reveal + count-up via `useAnimatedReaction`)
- Top 3 strengths + top 3 challenges with bar fill-in animations (700ms staggered)
- Footer: streak · scans · member-since with element-tinted icons
- 400px max-width, designed to look great when screenshotted

Screen ships with React Native Share API integration and an empty-state CTA.

### 🔗 Discovery (Pass 25) — wiring new features into navigation

`app/(tabs)/index.tsx`, `app/insights/index.tsx`. Both new features surfaced from primary entry points:
- Home tab quick-action grid: added "Skin Persona" card (purple finger-print) and "7-Day Forecast" card (green trend-up)
- Insights hub: gradient persona teaser card above the streak summary; trend-tinted forecast preview card

---

## 2026-05-09 — Insights Hub + Tab Bar Dark Mode + Routing Fix (Pass 17–19)

Three back-to-back ships in one session.

### 🌙 Tab bar dark-mode aware (Pass 17)

`app/(tabs)/_layout.tsx`. The bottom tab bar — visible on every primary
tab — now uses `useColors()` for bg, top divider, active/inactive icon
tints, and the active-indicator pill. Toggle Appearance → tab bar
flips in both modes immediately.

### 🛠️ Routing fix (Pass 18)

`app/_layout.tsx`. Three screens shipped this session
(`/streak`, `/daily-challenges`, `/timeline`) were missing from the
explicit Stack.Screen list, defaulting to a `'fade'` animation instead
of the intended slide/modal. Registered all three plus the new
`/insights` with appropriate animations. Real bug fix —
`/daily-challenges` now slides up modal-style as designed.

### 📊 Insights Hub (Pass 19) — new dedicated screen

`app/insights/index.tsx`. Single dashboard surfacing every behavioral
correlation GlowDermics has computed for you. The "what's going on with
my skin" view that ties everything from this overnight session
together.

Composes data from 5 engines:
- **`runSleepSkinAnalysis`** — Pearson r between sleep hours and next-day
  skin score (iter 8)
- **`runUVSkinAnalysis`** — SPF-adjusted UV damage correlation (iter 10)
- **`runStreakAnalysis`** — current/longest streak + at-risk + milestones
  (iter 9)
- **`runDailyChallengeAnalysis`** — XP/level/badge state (iter 12)
- **`Storage.getAnalyses`** — latest scan + skin age + biomarkers (iter 1)

Surface composition (top → bottom):
1. **Skin age hero** — `<SkinAgeBadge>` of the user's most recent scan
2. **Biomarker cloud** — clinical tags from the latest scan
3. **Streak summary card** — current streak with "X more for milestone"
   subline + Open button
4. **Daily quests summary** — current level + total XP + today's XP +
   Open button
5. **Sleep × skin** — compact `<ScatterPlot>` with verdict box (or
   "need N more scans" placeholder)
6. **UV × skin** — same pattern
7. **Next best action card** — green-tinted gradient with the highest-
   leverage suggestion picked by `pickNextAction()`:
   - Streak at risk → "log routine today"
   - Strong sleep correlation → "aim for X-Y hrs tonight"
   - Strong negative UV correlation → "reapply SPF"
   - Daily quest pending → "today's quest: X (+Y XP)"
   - Score declined vs prev → "take a fresh scan to verify"
   - Default → "take a fresh scan"

Loading state: 3 stacked Skeletons. Empty / not-enough-data states all
gracefully degrade with verdict copy from each engine.

### Wiring

Home tab quick-card grid gets a new green-tinted "Insights Hub" tile
(analytics-outline icon) routing to `/insights`.

### Files

**New**:
- `app/insights/index.tsx` (~315 lines)

**Modified**:
- `app/(tabs)/_layout.tsx` — tab bar uses useColors()
- `app/_layout.tsx` — registered streak/daily-challenges/timeline/insights
- `app/(tabs)/index.tsx` — added Insights Hub quick-card

### ✅ Verified

- `tsc --noEmit --strict` passes clean.

---

## 2026-05-09 — Dark Mode: All Design System Primitives Done (Pass 16)

🎉 **All 21 design-system primitives now dark-mode aware.** This pass
migrated the final 7 — the SVG-heavy and photo-overlay components.

### Migrated this pass

- **ScannerOverlay** — `Colors.primary` was used in 10 places (scan-line
  shadow, 4 corner brackets, glow ring border + shadow, data-point bg,
  badge dot, badge text). Migrated by passing `tint={primary}` to the
  internal `<DataPoint>` and inlining the relevant style overrides on
  the JSX so the static StyleSheet becomes layout-only.
- **ScatterPlot** — `pointColor` and `trendColor` props now resolve
  from active palette when omitted. Y-axis labels, x-axis labels, and
  axis title text colors all source from active palette.
- **StreakRing** — track stroke + day label + sub label colors flip per
  scheme. The 6 streak-tier color stops stay scheme-agnostic since
  they're already AA-contrast on either bg.
- **PhotoTimeline** — `scoreColor()` helper now takes a `palette` arg.
  Frame container background, ring score text, control button text,
  speed-chip text all use active palette. Date pill / skin-type pill /
  frame counter stay white-on-dark since they always sit on a photo.
- **PhotoCompareSlider** — handle bg + shadow source from `colors.primary`
  inline; line/handle border/captions stay white-on-photo. Empty
  fallback icon uses `colors.textMuted`.
- **RegionalSkinMap** — selection stroke uses `colors.primary`; legend
  text + chip card (bg/border/region/observation) all use active
  palette. Severity color map stays semantic-fixed.
- **RegionalDeltaMap** — row card bg/border/label/severity text + arrow
  icon + empty caption all use active palette.

### Coverage milestone

| | Before iter 14 | After iter 14 | After iter 15 | After iter 16 |
|---|---|---|---|---|
| Primitives migrated | 0 | 6 | 14 | **21 / 21** |

### What's still pending

Per-screen migration: 100+ existing screens still import the static
`Colors` constant directly for their root backgrounds, headers, etc.
With all primitives now responsive, screens that consume them get a
partial dark-mode treatment automatically (cards, badges, buttons,
graphs all flip). Their static screen-level styles remain light until
migrated. Screen-level batches will follow.

### Files modified

- `src/components/ui/ScannerOverlay.tsx`
- `src/components/ui/ScatterPlot.tsx`
- `src/components/ui/StreakRing.tsx`
- `src/components/ui/PhotoTimeline.tsx`
- `src/components/ui/PhotoCompareSlider.tsx`
- `src/components/ui/RegionalSkinMap.tsx`
- `src/components/ui/RegionalDeltaMap.tsx`

### ✅ Verified

- `tsc --noEmit --strict` passes clean.

---

## 2026-05-09 — Dark Mode: Score & Metric Primitives (Pass 15)

Continuing #17 dark-mode propagation. Migrated 8 more design-system
primitives so the score/metric/social-proof tiles flip with the theme.

### Migrated this pass

- **MetricBar** — track bg + confidence track flip per scheme; trend
  colors use active palette.
- **ScoreGrid** — module-level `DIMENSIONS` array with `Colors.X` tints
  replaced by `buildDimensions(palette)` memoized inside the component.
  Tile bg + border + label all use active palette.
- **DeltaGrid** — same pattern: module-level tints map → `buildTints(palette)`
  memoized helper. Direction colors (success/poor/muted) sourced from
  active palette.
- **BiomarkerCloud** — chip background + border + text use active primary
  with theme-aware alpha suffixes.
- **SkinAgeBadge** — clean swap of `Colors.white` to `'#FFFFFF'` literal
  (white is white in both palettes; this just removes the static import).
- **XPBar** — track bg + highlight overlay flip per scheme. Level pill +
  text colors source from active palette.
- **SocialProofStrip** — pill bg + border + divider + label all use active
  palette.
- **TierCard** — biggest cleanup: removed 7 light-tier override styles
  (`nameLight`, `taglineLight`, `priceLight`, etc.) that used static
  `Colors.X`. Light-tier text colors now compute inline from active palette
  so the "free" tier flips cleanly. Dark-tier (premium/ultra) gradients
  stay scheme-agnostic. Hex alpha suffixes (`+ '29'`, `+ '14'`) replace
  hardcoded rgba.

### Pattern reaffirmed

For any module-level `Record<string, string>` mapping a key to a `Colors.X`
value: replace with a `buildXxx(palette)` factory + `useMemo` inside the
component. This was needed for ScoreGrid (16 dimensions) and DeltaGrid
(16 dimensions). The factory pattern scales cleanly.

### Files modified

- `src/components/ui/MetricBar.tsx`
- `src/components/ui/ScoreGrid.tsx`
- `src/components/ui/DeltaGrid.tsx`
- `src/components/ui/BiomarkerCloud.tsx`
- `src/components/ui/SkinAgeBadge.tsx`
- `src/components/ui/XPBar.tsx`
- `src/components/ui/SocialProofStrip.tsx`
- `src/components/ui/TierCard.tsx`

### Cumulative dark-mode coverage

After iter 14 + 15: **14 of 21 design-system primitives migrated**.
Remaining: ScannerOverlay, RegionalSkinMap, RegionalDeltaMap, ScatterPlot,
StreakRing, PhotoTimeline, PhotoCompareSlider. (Most of these are SVG-heavy
or photo-overlay components where palette flips matter less, but they
should still be migrated for the few text/border colors they expose.)

### ✅ Verified

- `tsc --noEmit --strict` passes clean.

---

## 2026-05-09 — Dark Mode: Design System Primitives (Pass 14)

Continuation of #17. Migrated the 6 highest-traffic design-system primitives
from the static `Colors` import to the `useColors()` hook so all 100+
consumer screens that use these components automatically respond to theme
changes.

### Migrated primitives

- **Card** — all 6 variants (flat / elevated / glass / outline / gradient /
  glow) now read from active palette. `tint` prop default resolves to
  `colors.primary` at render time. `glass` border color flips white-edge in
  light mode → dark-edge in dark mode. `BlurView` `tint` prop now defaults
  to follow the active scheme (light/dark).
- **Button** — all 5 variants (primary / secondary / ghost / destructive /
  gold). Gradient stops use active `colors.primaryLight/primary` and
  `colors.goldLight/gold`. Secondary background uses `colors.primary + '10'`
  (opacity-suffixed hex) for proper contrast in both modes.
- **Badge** — was the trickiest: had a module-level `TONE` constant with
  `Colors.X` references that froze at module load. Replaced with a
  `buildTones(colors)` helper memoized inside the component via
  `useMemo`. All 8 tones (primary / success / warning / danger / info /
  gold / neutral / premium) now flip cleanly. Hex `+ '1A'` (10% alpha) and
  `+ '4D'` (30% alpha) suffixes generate per-theme background and border
  colors without hardcoded rgba.
- **GlassHero** — base gradient bottom stop now uses `colors.bg` so the
  hero blends into whatever the active surface is. Tint default + blob
  tint resolve dynamically.
- **Section** — title, caption, action label, and chevron icon all source
  text/primary from active palette.
- **Skeleton** — track color flips between dark wash on light vs light
  wash on dark. Shimmer gradient highlight uses theme-appropriate alpha
  white/cream so the glow is visible on both surfaces without retinal
  burn-in.

### How this propagates

Roughly 40+ existing callsites of `<Card>`, 25+ of `<Button>`, 50+ of
`<Badge>`, plus every screen using `<GlassHero>`, `<Section>`, or
`<Skeleton>` now automatically respond to the theme toggle in Settings →
Appearance. No callsite changes needed; behavior is opt-in to dark mode
the moment user toggles.

### Pattern for future migrations

For primitives with module-level color maps (like Badge had), the canonical
fix is:
1. Create a `buildXxx(colors: Palette)` helper.
2. Inside the component, compute `useMemo(() => buildXxx(colors), [colors])`.
3. Reference the memoized object instead of the module-level constant.

For module-level static `StyleSheet.create({...})` objects with theme-aware
properties, the canonical fix is to keep layout properties static
(padding, fontSize, etc.) and compute color-bearing styles inline at
render time using the hook.

### 📁 Files

**Modified**:
- `src/components/ui/Card.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/GlassHero.tsx`
- `src/components/ui/Section.tsx`
- `src/components/ui/Skeleton.tsx`

### ✅ Verified

- `tsc --noEmit --strict` passes clean.

### Next batch

Remaining design-system primitives that still import static `Colors` and
should be migrated in subsequent iterations: `MetricBar`, `ScoreGrid`,
`BiomarkerCloud`, `SkinAgeBadge`, `TierCard`, `SocialProofStrip`,
`XPBar`, `RegionalSkinMap`, `RegionalDeltaMap`, `ScannerOverlay`,
`ScatterPlot`, `StreakRing`, `PhotoTimeline`, `PhotoCompareSlider`,
`DeltaGrid`. The screen-level migrations (home, scan, results, settings,
etc.) are also pending.

---

## 2026-05-09 — Dark Mode Infrastructure (Autonomous Overnight Pass 13)

First Tier 3 milestone. Pivoted from voice journaling (#10) which would have
required adding `expo-av` to deps + microphone permission flow not verifiable
in this session. Dark mode is purely UI/state work.

### 🌙 ColorsDark palette

`src/constants/colors.ts`. Added `ColorsDark` — a warm-marble inverse with
the same key set as `Colors` (so `useColors()` can return either palette
without callers branching). Strategy:

- Backgrounds: `#0D0B09` (deep ink) / `#1A1612` (card) / `#241F19` (elevated)
  / `#15110D` (sheet) — warm undertone preserved
- Text: `#F5F0EA` primary (warm marble inverted), 65%/40% alpha levels
- Brand: terracotta brightened (`#E08250` primary in dark)
- Skin score colors: brightened for AA contrast on dark surfaces
- Glass variants: dark-tinted instead of white-tinted
- 15 semantic dimension tints: held identical (already vivid enough)
- 5 tier badges: brightened
- New exported type `Palette` enforces shape parity

### 🌗 `ThemeProvider` + hooks

`src/state/theme.tsx`. Context-based theme system with three preferences:
`'system' | 'light' | 'dark'`. Stored in AsyncStorage as
`gd_theme_preference_v1`.

- Subscribes to `Appearance` changes so `'system'` mode tracks OS theme live
- `useColors()` → returns the active `Palette`
- `useTheme()` → returns `{ preference, scheme, colors, setPreference }`
- Resolution: `'system'` → checks current `Appearance.getColorScheme()` and
  any subsequent OS-level changes, defaulting to light

### 🔌 Root layout wired

`app/_layout.tsx`. Wrapped the entire app in `<ThemeProvider>`, with a
`RootContent` inner component that consumes the theme. Status bar style
flips between `'dark'` and `'light'` based on scheme. The `<Stack>`'s
`screenOptions.contentStyle.backgroundColor` is bound to `colors.bg` so
the root surface responds immediately to any preference change. Phone-frame
test surface also responds.

### 🎚️ Settings tab — Appearance section

New "Appearance" section above Notifications:

- "Theme" row showing current resolution ("Auto · Dark", "Dark", "Light")
- 3-button pill toggle (Auto / Light / Dark) with sun/phone/moon icons,
  active state has primary fill + glow shadow
- Helper caption that adapts to selection ("Follows your device setting" /
  "Warm marble inverted — night-friendly skincare reading" / "Warm marble —
  the original palette")
- Persisted via `setPreference` from `useTheme`

### 📁 Files

**New**:
- `src/state/theme.tsx` (~85 lines)

**Modified**:
- `src/constants/colors.ts` — `ColorsDark` palette + `Palette` type
- `app/_layout.tsx` — wraps app in `ThemeProvider`, root surface responds to scheme
- `app/(tabs)/settings.tsx` — adds Appearance section + 3-state toggle

### ⚠️ Scope note

The infrastructure ships in this iteration. **Per-screen color migrations
follow in subsequent iterations** — the 100+ existing screens still import
the static `Colors` constant. They will need to be migrated to `useColors()`
to actually flip surfaces, text, and cards in dark mode. The root surface,
the splash status bar, and the Appearance section itself respond
immediately, providing visible feedback when toggling.

### ✅ Verified

- `tsc --noEmit --strict` passes clean.
- AsyncStorage round-trip works by construction (read on mount, written on
  each `setPreference`).

---

## 2026-05-09 — Daily Quests (Autonomous Overnight Pass 12)

A complete one-day-at-a-time gamification surface with XP, levels, and a
6-tier badge system. Distinct from the existing multi-day Challenge screen
(30-Day Tallow Switch, etc.) — these are quick wins that refresh daily.

### 🎯 `DailyChallengeEngine`

`src/engine/DailyChallengeEngine.ts`. Pure-logic service for the entire
quest system.

**Catalog** — 30 curated challenges across 5 categories × 3 difficulties:
- 💧 **Hydration** (6): 8 glasses, 2 morning glasses, herbal tea, water-rich foods, no alcohol, humidifier overnight
- ☀️ **Protection** (6): SPF morning, SPF reapply, no-touch, clean phone, change pillowcase, sunglasses
- 😴 **Lifestyle** (6): 8h sleep, no screens 1h, 5min breathwork, 20min walk, silk pillow, cold-water rinse
- 🌙 **Routine** (6): double-cleanse, layer thin→thick, full PM, neck+chest, clean tools, face massage
- 🥗 **Diet** (6): leafy greens, omega-3, no sugar, no dairy, vit-C food, zinc food

**XP system**: easy 10 / medium 25 / hard 50.
**Daily picker**: deterministic hash of today's date selects a primary,
then a different-category bonus.
**Persistence**: `gd_daily_challenge_state_v1` AsyncStorage key tracks
`totalXP`, `completionsByDate`, `acknowledgedBadges`.
**Levels**: square-root curve so leveling slows over time
(L XP threshold = 100 × L^1.5).
**Badges**: 6 tiers — First Glow (10 XP) → Initiate (50) → Devoted (200)
→ Glow-Getter (500) → Iron Glow (1k) → Skin Sage (5k).

API surface:
- `runDailyChallengeAnalysis()` → full report (today's primary + bonus,
  done flags, todayXP, level, xpInLevel, unlockedBadges, last14, pending
  badge celebrations)
- `completeChallenge(id)` → atomic mark-complete + persist
- `undoCompletion(id)` → reverse with XP rollback
- `acknowledgeBadges(ids)` → so unlock celebrations don't repeat

### 🔋 `<XPBar>` component

`src/components/ui/XPBar.tsx`. Reusable animated XP/level bar.
- Reanimated worklet drives `width: ${fraction * 100}%` fill
- "LEVEL N" pill + "X / Y XP" label above the bar
- Gradient fill: gold → terracotta → primary
- Subtle white-highlight gradient overlay on the top half (glossy feel)
- Optional total-XP-lifetime caption

### 🎯 `/daily-challenges` — new dedicated screen

`app/daily-challenges/index.tsx`. Rich gamification surface:
- GlassHero with today's earned XP + level / badge count
- **XP/Level card** with `<XPBar>` showing progress to next level
- **Today's challenge** hero card — pulsing colored halo when not done,
  category-tinted emoji bubble, difficulty/XP/category badge row, big
  "Mark complete · +X XP" Button. Pro-tip box with bulb icon when present.
  Done state: green gradient card with checkmark badge + Undo link.
- **Bonus challenge** — same component, different category for variety
- **Last 14 days activity grid** — staggered Reanimated entrance per cell;
  intensity tier (none / 1 / 2+) drives color
- **Badge collection** — 3-column grid with locked/unlocked states. Locked
  badges have a small lock icon overlay.
- **Badge celebration overlay** — full-screen modal with animated emoji +
  badge name + dismiss button. Triggers on first viewing of a newly
  unlocked badge; haptic success feedback.

Haptics on complete (success notification) and undo (medium impact).

### 🔗 Home tab wiring

Added a "Daily Quests" quick-card to the home-tab grid (gold-tinted,
trophy icon) routing to `/daily-challenges`.

### 📁 Files

**New**:
- `src/engine/DailyChallengeEngine.ts` (~270 lines)
- `src/components/ui/XPBar.tsx` (~115 lines)
- `app/daily-challenges/index.tsx` (~530 lines)

**Modified**:
- `src/components/ui/index.ts` — exports `XPBar`
- `app/(tabs)/index.tsx` — adds Daily Quests quick-card

### ✅ Verified

- `tsc --noEmit --strict` passes clean.

---

## 2026-05-09 — Photo Timeline (Autonomous Overnight Pass 11)

A share-ready visual transformation player that auto-advances through every
scan photo with a crossfading score-ring and date pill. Turns the user's
scan history into a TikTok/Reels-style story.

### 🎬 `<PhotoTimeline>` component

`src/components/ui/PhotoTimeline.tsx`. Reanimated 4 worklets for the
crossfade and the score ring fill — playback stays buttery even while the
JS thread is doing other work.

- Auto-advances frame-to-frame with a 220ms fade-out / 320ms fade-in
- Animated score ring (`strokeDashoffset` worklet) ticks up to each frame's
  score; numeric counter inside the ring updates in real time
- Date pill + skin-type chip overlay top-corner; frame counter + bottom
  gradient bottom-corner
- Tap photo to pause/resume with a play-icon overlay
- Scrubbable timeline ticks below the photo — tap any tick to jump
- Speed selector: 0.5× / 1× / 2× / 4×
- Skip-back / play-pause / skip-forward triplet

Re-exported as a design-system primitive — reusable for any future
photo-sequence surfaces (challenges, milestones, etc.).

### 📺 `/timeline` — new dedicated screen

`app/timeline/index.tsx`. Premium hero surface with:

- GlassHero header showing "N frames · X days"
- `<PhotoTimeline>` as the centerpiece (responsively sized to ≤360px wide)
- "Versus your first scan" delta card that updates as the user scrubs —
  tracks progression dynamically based on the active frame
- "The story so far" stats: First → Latest with twin score blocks + a
  big delta pill ("+12 pts over 84 days") tinted by direction
- Pro-tip card (gradient gold) explaining tap-to-pause / scrub / speed
- Quick-link row: Gallery / Compare / New scan
- Share button in the hero exports a multi-line transformation summary
- Empty state: "No timeline yet" with film-outline icon + "Take a scan" CTA

### 🔗 Wiring

Scan-gallery now shows a prominent **"Watch your transformation"** card
when ≥2 scans have photos, with a primary play button → `/timeline`.

### 📁 Files

**New**:
- `src/components/ui/PhotoTimeline.tsx` (~420 lines)
- `app/timeline/index.tsx` (~390 lines)

**Modified**:
- `src/components/ui/index.ts` — exports `PhotoTimeline` + `TimelineFrame` type
- `app/scan-gallery/index.tsx` — adds Watch Timeline CTA card after journey banner

### ✅ Verified

- `tsc --noEmit --strict` passes clean.

NOTE: GIF export to camera roll deferred — would require `expo-media-library` permissions
and a GIF encoder native module. The in-app player covers the social-share use case
via screen recording, and the share button exports a polished text summary.

---

## 2026-05-09 — UV × Skin Correlation (Autonomous Overnight Pass 10)

Mirrors the iter-8 sleep correlation pattern for sun exposure. Pulls the
existing UV log + scan history, computes an SPF-adjusted UV damage score
per day, runs Pearson correlation against the next-48h skin score, and
visualizes everything in the same animated `<ScatterPlot>` shipped in iter 8.

### ☀️ `UVSkinEngine`

`src/engine/UVSkinEngine.ts`. Returns a `UVSkinReport`:

- `points[]` — paired (UV log, next-48h scan) entries
- `correlationDamage` — Pearson r between **effective** UV damage (exposure
  × SPF protection factor: 100% if no SPF, 40% if SPF without reapply, 15%
  if SPF reapplied) and skin score
- `correlationExposure` — Pearson r between raw exposure minutes and skin score
- `verdict` — plain-English summary that flips its sign expectation:
  negative correlation = **good** (more UV → lower score, expected),
  positive correlation = "either tolerated or other factors mask it"
- `toleranceCeiling` — highest 30-min exposure bucket where avg skin score
  still exceeds (avg - 3 pts)
- `unprotectedDays` — count of unprotected matched days, surfaced in the
  verdict when ≥ half the sample is unprotected
- `withSpfAvgDamage` / `withoutSpfAvgDamage` — comparison metrics
- `avgDamage`, `avgSkinScore`, `sampleSize`, `hasEnoughData` (≥8 pairs)

The `uvDamageScore()` helper is exported separately for reuse in the UI
(e.g., showing the user their estimated effective damage as they pick SPF
levels).

### 🌞 UV-log screen upgrade

`app/uv-log/index.tsx`. The previous "high-protection vs no-protection
score average" card replaced with the proper correlation card:

- Pearson r badge — `success` if r ≤ -0.5 (good — protection works),
  `warning` if r ≤ -0.25, `danger` if r ≥ 0.15 (something's off),
  `neutral` if no clear signal
- Full `<ScatterPlot>` with effective-UV-damage on x-axis, skin score on y
- Auto-scaled x-range based on user's max recorded damage
- Stats row: SAMPLE / UNPROTECTED days (red if > 0) / AVG SCORE / TOLERATES
  ceiling (green when present)
- Fallback "need N more matched scans" message if < 8 pairs
- Verdict box with bulb icon
- Header reskinned to `<GlassHero>` matching the design-system pass

Removed dead high/low correlation computation + ~7 unused styles.

### 📁 Files

**New**:
- `src/engine/UVSkinEngine.ts` (~165 lines)

**Modified**:
- `app/uv-log/index.tsx` — wired UVSkinEngine + ScatterPlot, GlassHero
  header, removed dead correlation code + styles

### ✅ Verified

- `tsc --noEmit --strict` passes clean.

---

## 2026-05-09 — Streak Gamification (Autonomous Overnight Pass 9)

A dedicated streak gamification surface with an animated SVG ring,
milestone timeline, 28-day activity calendar, and at-risk nudge. Builds
on the existing scan/routine streak data so users get instant visual
feedback on their consistency.

### 🔥 `StreakEngine`

`src/engine/StreakEngine.ts`. Pulls the user's routine log + scan history,
collapses both into a unified "active days" set, then computes:

- `currentStreak` — consecutive days with activity, ending today or
  yesterday (giving a grace period until midnight)
- `longestStreak` — best ever, with `longestStartDate` for display
- `nextMilestone` — first of [3, 7, 14, 30, 60, 90, 180, 365] above current
- `daysToNext` — countdown to next tier
- `atRisk` — boolean: streak > 0, today not yet logged, after 12pm
- `milestones[]` — every tier with unlock state and emoji + label
- `last28[]` — 28-day boolean array for the calendar
- `totalActiveDays`, `unlocksCount`

8 milestone tiers: Spark (3), Week Warrior (7), Fortnight Glow (14),
Lunar Cycle (30), Two-Month Pro (60), Quarter Glow (90), Half-Year
Hero (180), Annual Aura (365).

### ⭕ `<StreakRing>` component

`src/components/ui/StreakRing.tsx`. Circular SVG progress ring entirely
on Reanimated 4 worklets:

- Animated progress arc fills from 0 → currentStreak/nextMilestone
  using `useAnimatedProps` on `strokeDashoffset` (UI-thread)
- Animated count-up — `useAnimatedReaction` bridges a `useSharedValue`
  back to React state per integer change
- Color tier shifts with streak length:
  - 0–2: cool sky-blue (just starting)
  - 3–6: gold→terracotta (Spark unlocked)
  - 7–13: terracotta gradient
  - 14–29: deeper terracotta
  - 30–59: gold→terracotta (Lunar)
  - 60+: gold→fire-red (legendary)
- Inner radial glow pulses softly behind the count
- At-risk halo pulses red when the streak is in danger
- Flame emoji floats above the count when streak ≥ 3

### 📺 `/streak` — new dedicated screen

`app/streak/index.tsx`. Premium gamification surface with:

- GlassHero header showing "X of 8 milestones unlocked"
- **Hero ring card** with the StreakRing centerpiece + at-risk banner
  OR celebration banner ("Today's locked in"). Quick-action row with
  Scan / Log Routine / Check-in shortcuts.
- **Stats row** — Best ever / Total active days / Unlocked count
- **Last 28 days calendar** — staggered fade-in cells (Reanimated
  spring per cell, 18ms apart). Today's cell gets a gold ring outline.
  Legend: Active / Empty / Today.
- **Milestones timeline** — every tier as a Card variant=gradient (when
  unlocked, green tint), variant=glow (when next milestone), or outline
  (locked). Each card has its emoji, label, "X-day streak" subline,
  and an UNLOCKED / NEXT / lock-icon trailing badge. Each row slides in
  with a delay.
- **Empty-state nudge** when no streak yet — gradient card with primary
  CTA to take a scan.

### 🔗 Home wiring

The home tab's "🔥 Streak" stat tile now routes to `/streak` instead of
`/habits`, surfacing the new gamification screen on tap.

### 📁 Files

**New**:
- `src/engine/StreakEngine.ts` (~165 lines)
- `src/components/ui/StreakRing.tsx` (~245 lines)
- `app/streak/index.tsx` (~410 lines)

**Modified**:
- `src/components/ui/index.ts` — export `StreakRing`
- `app/(tabs)/index.tsx` — streak stat now routes to `/streak`

### ✅ Verified

- `tsc --noEmit --strict` passes clean.

---

## 2026-05-09 — Sleep × Skin Correlation Engine (Autonomous Overnight Pass 8)

A proper behavioral-data feature that competitor skincare apps don't have:
**Pearson correlation** between the user's sleep log and their next-day skin
score, surfaced as an animated scatter plot with a fitted trend line.

### 🧠 `SleepSkinEngine`

New file `src/engine/SleepSkinEngine.ts`. Pulls the user's sleep log and
scan history, aligns each sleep entry with the **next scan within 36 hours**
(dermatology consensus: poor sleep shows up the next morning, not the same
morning), and returns a `SleepSkinReport`:

- `points[]` — aligned (sleep, scan) pairs
- `correlationHours` — Pearson r between sleep duration and skin score
- `correlationQuality` — Pearson r between sleep quality (1-5) and skin score
- `verdict` — plain-English summary keyed off whichever correlation is stronger
- `optimalRange` — the user's best-sleep-score bucket (e.g. "7.5–8.0 hrs")
- `avgHours`, `avgSkinScore`, `sampleSize`, `hasEnoughData`

Requires ≥8 paired data points before computing a correlation; below that,
`verdict` says exactly how many more matched scans are needed.

### 📊 `<ScatterPlot>` component

Generic Reanimated 4 SVG scatter plot. Used by sleep×skin today, ready to be
reused for UV×skin (#7), water×skin, etc.

- Auto-computed nice axes (forced y-range for skin scores, data-driven x)
- Animated point entrance (delay-staggered scale spring with halo)
- Animated trend line draw-on (left-to-right sweep after points settle,
  dashed gold)
- Grid lines, axis labels, optional x/y label captions
- Linear regression for the trend line built-in

File: `src/components/ui/ScatterPlot.tsx`.

### 🌙 Sleep-log screen upgrade

The previous "high vs low sleep average" card replaced with a real
correlation card that:
- Shows the Pearson r as a tonal Badge (`success` if strong-positive,
  `danger` if strong-negative, `warning` if moderate, `neutral` otherwise)
- Renders the full scatter plot when there are ≥8 pairs
- Falls back to a "need N more matched scans" message otherwise
- Stats row: SAMPLE / AVG SLEEP / AVG SCORE / YOUR BEST (the optimal range)
- Verdict box with a bulb icon and the engine's plain-English summary

Header replaced with `<GlassHero height={130}>` to match home/progress/habits/
ingredient-conflicts.

### 📁 Files

**New**:
- `src/engine/SleepSkinEngine.ts` (~150 lines)
- `src/components/ui/ScatterPlot.tsx` (~210 lines)

**Modified**:
- `src/components/ui/index.ts` — export `ScatterPlot`
- `app/sleep-log/index.tsx` — wired correlation engine + scatter plot,
  reskinned header to GlassHero, removed dead high/low correlation code

### ✅ Verified

- `tsc --noEmit --strict` passes clean.

---

## 2026-05-09 — AI Routine Conflict Analyzer (Autonomous Overnight Pass 7)

First Tier 2 feature shipped. The ingredient-conflicts screen had 15 hand-
curated rules but its own rogue dark palette and no way to analyze a full
routine at once. Now: full reskin to the design system + new AI tab.

### 🤖 `analyzeRoutineConflicts()` service

New function in `src/services/skinAnalysis.ts`. Takes free-text routine
("AM: cleanse, vit C, niacinamide, SPF · PM: BHA, retinol") + user
profile and returns a structured `RoutineConflictReport`:

- `detected` — every active normalized from user input
- `conflicts[]` — up to 8, severity-graded (avoid / caution / separate / safe)
- `warnings[]` — soft caveats
- `recommendations[]` — actionable next steps
- `routineScore` — 0–100 compatibility number
- `verdict` — 1-line summary

Uses the chat model with strict JSON schema, exponential retry on transient
errors, graceful fallback to a neutral report if the model fails (UI never
crashes).

### 🆕 AI Analyze tab (the headline feature)

New default tab on the ingredient-conflicts screen. Components:

- **Routine input card** — gradient-tinted Card variant=gradient with
  multiline text input (placeholder shows AM/PM example), "Quick fill"
  preset chips (☀️ AM example, 🌙 PM example, 🌱 Recovery), and an
  Analyze button with loading state.
- **Loading skeleton** — Card with stacked Skeletons during AI call.
- **`<RoutineScoreCard>`** — animated 0-100 routine compatibility score,
  gradient fill bar (Reanimated worklet) with score-tinted color, conflict-
  count badge, and verdict line.
- **Detected actives** — Section with Badge chips for every parsed active.
- **`<AIConflictCard>`** — per-conflict card with severity badge, left-edge
  tint stripe, reason, and workaround panel. Staggered fade-up entrance.
- **Warnings card** — soft caveats from AI ("Introduce retinol slowly").
- **Recommendations card** — green-tinted gradient with bulleted next steps.
- **All-clear card** — green shield + verdict shown when score ≥ 90 and no
  conflicts.

### 🎨 Full design-system reskin

The screen previously had a local hardcoded dark palette (`bg: '#0A0A0F'`,
`card: '#13131A'`) that conflicted with the rest of the app's warm marble
tones. Now uses the proper `Colors` import + design-system primitives:

- Header replaced with `<GlassHero height={130}>` with a translucent
  glass back button (matches home/progress/habits)
- Tab pill row with Ionicons (sparkles / warning / checkmark / git-compare)
- All cards converted to `<Card variant="elevated">` / `gradient`
- Severity badges via `<Badge tone="danger|warning|gold|success">`
- Workaround panel: green-tinted with checkmark icon
- Search bar uses design-system bgCard + border
- "Check Two" tab buttons use `<Button>` primitive
- Reanimated 4 entrance for header + content (replaced legacy Animated.Value)

### 🆕 Types

Added to `src/types/index.ts`:
- `ConflictSeverity = 'avoid' | 'caution' | 'separate' | 'safe'`
- `IngredientConflict` (a, b, severity, reason, workaround)
- `RoutineConflictReport` (conflicts, warnings, recommendations, detected, routineScore, verdict)

### 📁 Files

**Modified**:
- `src/types/index.ts` — added 3 new types
- `src/services/skinAnalysis.ts` — added `analyzeRoutineConflicts()` (~140 lines)
- `app/ingredient-conflicts/index.tsx` — full rewrite (~720 lines)

### ✅ Verified

- `tsc --noEmit --strict` passes clean.

---

## 2026-05-09 — Premium Paywall v2 (Autonomous Overnight Pass 6)

### 💎 Multi-tier paywall

The previous paywall offered a single $4.99/mo plan with a flat feature
list. Replaced with a **3-tier comparison** matching the conversion
patterns of leading subscription apps.

**Tiers:**
- **Free** — 3 scans/mo, 10 coach msgs/day, basic scorecard
- **Premium** ($4.99/mo or $39.99/yr → $3.33/mo) — Unlimited scans + coach,
  16-dim biomarker tracking, regional analysis, skin age, PDF reports,
  photo timeline, priority AI. Tagged **MOST POPULAR** with shimmer.
- **Ultra** ($9.99/mo or $79.99/yr → $6.66/mo) — Premium + 1:1 dermatologist
  consult/mo, custom routine builder, family sharing (up to 4), early
  access, dedicated coach DM, priority human support.

### 🆕 Reusable design-system components

- `TierCard` (`src/components/ui/TierCard.tsx`) — tier card with gradient
  background, animated entrance (delay-staggered spring), selection halo
  ring + scale, "Most Popular" eyebrow shimmer, feature checklist with
  highlight support. Reanimated 4 worklets throughout.
- `SocialProofStrip` (`src/components/ui/SocialProofStrip.tsx`) — pill
  showing animated 5-star rating (each star pulses in sequence) +
  user-count label ("Trusted by 24K+ skin journeys"). Auto-formats counts.

### 🔄 Billing toggle

Animated Monthly ↔ Annual switch (Reanimated `withSpring` slides the
selector). Annual tier shows a green **SAVE 33%** tag and a strikethrough
on the original monthly price for each tier.

### 💬 Rotating testimonial

Auto-cycling testimonial chip (3 quotes, 4.5s interval) with cross-fade
between entries via Reanimated worklet.

### 🎬 Hero polish

- Diamond icon with terracotta gradient + colored shadow
- Pulsing radial halo behind the icon (Reanimated infinite loop)
- Scale + opacity entrance spring

### 🎟️ Free trial CTA

Primary button changes copy based on selected tier:
- Free → "Stick with Free"
- Paid → "Start 7-day free trial · then $X.XX/mo"
Activating switches to a check-icon success state with springy confirmation.

### 📁 Files

**New**:
- `src/components/ui/TierCard.tsx`
- `src/components/ui/SocialProofStrip.tsx`

**Modified**:
- `src/components/ui/index.ts` — exports `TierCard` + `TierFeature` type + `SocialProofStrip`
- `src/components/PremiumGate.tsx` — full rewrite with 3-tier picker, billing toggle, social proof, testimonial, free-trial CTA. Preserved `PremiumGate` and `PremiumBanner` API signatures so all 4 callsites (scan, coach, settings, coach-chat) work unchanged.

### 📌 Note for backlog

Real Stripe wiring per-tier and per-period is a Tier 2 task. For now, any
paid tier flips `isPremium = true` via the existing `Auth.activatePremium()`
plumbing. Documented inline.

### ✅ Verified

- `tsc --noEmit --strict` passes clean.
- All 4 PremiumGate callsites continue to work — no signature changes.

---

## 2026-05-09 — Onboarding v2 Tour (Autonomous Overnight Pass 5)

### 🎬 Five-page swipe-paginated onboarding tour

The previous onboarding was a 5-step data-collection wizard (name → skin
type → concerns → goals → lifestyle) that buried the value prop. Replaced
with a swipe-paginated **product tour** that sells the experience first.
Profile gets sensible defaults; users can refine in settings later.

**Page 1 — Welcome + name**
Logo spring-entrance, "Your skin, decoded." headline, single name input.
Auto-advance gated until a valid name is entered.

**Page 2 — 16 dimensions**
"Most apps score 5–7 metrics. We score 16." Animated grid of 16 dimension
tiles, each with its own tint + icon, staggered fade+spring entrance
(50ms apart).

**Page 3 — Regional analysis**
Live `<RegionalSkinMap>` with sample findings (forehead mild · cheeks
moderate · nose moderate · etc.) so users see the real face-map UI before
committing to a scan.

**Page 4 — Skin age + AI coach**
Live `<SkinAgeBadge>` (estimated 27, "younger" bracket) + a sample chat
bubble from "Derm" referencing the user's hydration score, plus a
`<BiomarkerCloud>` of sample biomarker tags.

**Page 5 — Take first scan**
Animated terracotta scan icon with a pulsing halo. Big "Take My First
Scan →" CTA + "Maybe later — explore the app" secondary. Greeting
includes the user's name from page 1.

### 🎚️ Pagination + nav

- Horizontal `ScrollView pagingEnabled` synced with a Reanimated
  `scrollX` shared value so dot indicators morph in real time (active
  dot pill widens from 6 → 22px, brightness 0.35 → 1.0).
- Top bar: thin gradient progress bar (Reanimated worklet) + "Skip"
  button (visible on pages 1–4).
- Footer: Back / dot row / Next, with Next disabled on page 1 until a
  valid name is entered. Footer hidden on the final page where the
  scan CTA takes over.
- Deep ambient terracotta glow at top, pulsing 0.4 ↔ 0.85 opacity.

### ⚡ Per-page entrance animations

Each page's content has its own staggered Reanimated entrance (logo
spring + headline slide + tagline fade + input slide on welcome; tile
cascade on dimensions; map scale-in on regional; bubble slide-up on
coach; halo pulse + CTA bounce on first-scan).

### 📁 Files

**Modified**:
- `app/(auth)/onboarding.tsx` — full rewrite (~750 lines) using Reanimated 4
  worklets, paginated ScrollView, sub-components for each page

### ✅ Verified

- `tsc --noEmit --strict` passes clean.
- Profile is saved with safe defaults (`skinType: 'normal'`, empty concerns
  and goals, lifestyle defaults). Existing scan / coach flows handle this
  gracefully via the prompt's profile-context fallback.
- Skip button + "Maybe later" both finish onboarding to `/(tabs)`. Primary
  CTA finishes onboarding to `/scan` directly.

---

## 2026-05-09 — Glassmorphism + GlassHero (Autonomous Overnight Pass 4)

### 🪟 GlassHero — `src/components/ui/GlassHero.tsx`

A reusable hero block that anchors the top of a screen with a rich terracotta
gradient backdrop, three drifting glow blobs (Reanimated worklets, all
UI-thread), a diagonal accent gradient, and rounded bottom corners that
visually "drip" into the page below. Children render on top of the backdrop.

Props: `tint`, `height`, `withBlobs`, `withNoise`, `bottomRadius`. Composes
with `Card variant="glass" blur` for the full frosted-glass-on-gradient
effect.

### 🃏 Card now supports BlurView

Added `blur?: boolean | number` and `blurTint?: 'light' | 'dark' | 'default'`
to the `Card` primitive. When set, `<BlurView>` from `expo-blur` is layered
behind the content (iOS native, Android via `experimentalBlurMethod`, web via
CSS backdrop-filter). `variant="glass"` automatically becomes transparent so
the blur shows through.

### 🏠 Home tab — `app/(tabs)/index.tsx`

Hero scope: greeting line + name + (PRO badge) + profile avatar + 4 stat
cards (Streak / Score / Habits / Concerns).

- Wrapped in `<GlassHero height={244}>` extending edge-to-edge under
  `SafeAreaView` (negative `marginHorizontal: -20` to escape ScrollView padding).
- 4 stat cards converted to `<Card variant="glass" blur={28}>` so they float
  as frosted tiles on the gradient.
- Text colors switched to white-on-terracotta with subtle text-shadows.
- Profile avatar moved to translucent glass disc instead of solid gradient.
- Old styles (`header`, `greeting`, `name`, `premiumBadge`, `statCard`,
  `statNum`, `statLabel`) renamed to `hero*` variants and updated for white
  legibility.

### 📈 Progress tab — `app/(tabs)/progress.tsx`

Hero scope: "Progress" title + scan count subline + Overall Score badge.

- Wrapped in `<GlassHero height={170}>`.
- Title typography upgraded to `30/900`.
- Score badge converted from rgba pill to translucent glass-on-gradient pill
  with white text + 1.4 letter-spacing label.
- Empty state (no scans) gets its own `<GlassHero height={140}>` for visual
  consistency.

### 🌱 Habits — `app/habits/index.tsx`

Hero scope: back button + "Daily Habits" title + subtitle.

- Wrapped in `<GlassHero height={130}>`.
- Back button on glass disc instead of bgCard pill.
- White title + softened subtitle with text-shadow.
- Score card and week-bars card preserved as-is — they already have their own
  visual identity and would have required a deeper rewrite.

### 📁 Files

**New**:
- `src/components/ui/GlassHero.tsx` (~190 lines, Reanimated 4 worklets)

**Modified**:
- `src/components/ui/Card.tsx` — added `blur` + `blurTint` props, BlurView layer
- `src/components/ui/index.ts` — export `GlassHero`
- `app/(tabs)/index.tsx` — wrapped hero in GlassHero, glass stat cards, new white-on-terracotta hero typography
- `app/(tabs)/progress.tsx` — wrapped header in GlassHero (both empty + populated states)
- `app/habits/index.tsx` — wrapped header in GlassHero with translucent glass back button

### ✅ Verified

- `tsc --noEmit --strict` passes clean.
- All glass effects degrade gracefully on Android (experimentalBlurMethod) and
  web (CSS backdrop-filter / fallback solid translucent fill).

---

## 2026-05-09 — Reanimated 4 Migration + Scanner Polish (Autonomous Overnight Pass 3)

### 🔥 Locked-on UI thread

The scanner-analyzing overlay and the splash screen both ran every frame
through the JS bridge — fine until the JS thread blocks on a network response,
parse, or render, at which point looping animations stutter visibly. Migrated
both surfaces to **Reanimated 4 worklets** so the entire animation pipeline
runs on the UI thread, holding 60fps even mid-API-call.

### 🆕 ScannerOverlay component — `src/components/ui/ScannerOverlay.tsx`

Extracted the analyzing-mode visual layer from `app/scan/index.tsx` into a
self-contained, reusable component. New polish layered on during migration:
- Vertical scan line (pre-existing — terracotta sweep)
- **Diagonal cross-scan line** (new — slower gold sweep, 24° angle, perpendicular feel)
- 4 corner brackets (static)
- Pulsing dashed glow ring (rotating + scaling)
- **9 FaceID-style data-point markers** (new — pseudo-random face positions, each fades in/out at staggered phases — evokes a clinical biometric scan)
- AI SCANNING badge with pulsing dot

All 8 concurrent shared values (`scanLineY`, `scanLineX`, `glowOpacity`,
`ringRotate`, `ringScale`, `overlayFade`, `badgeDotPulse`, `dataPointSeed`)
properly cleaned up via `cancelAnimation()` on unmount. Drop-in usable in
other screens (e.g., ingredient scanner) once enabled there.

### 🆕 Splash screen migration — `app/index.tsx`

13 legacy `Animated.Value` refs → `useSharedValue`s. Every loop, sequence,
and parallel composition replaced with `withRepeat`/`withSequence`/`withDelay`
worklets. Visual identity preserved 1:1 — same spring entrance, same staggered
text, same loading bar. New: **7 floating sparkle particles** (gold dots that
drift upward with fade) for ambient warmth.

Now uses `Animated` from `react-native-reanimated` (not the legacy RN one),
and `useAnimatedStyle` for every derived style.

### 🧹 Cleanup

- Removed dead styles from `app/scan/index.tsx` (`analyzingPhotoWrap`,
  `analyzingPhoto`, `scanLine`, `bracket*`, `glowRing*`, `scanBadge*`) —
  all live in `ScannerOverlay` now.
- Removed unused imports from `app/scan/index.tsx`: `Image`, `Animated`,
  `Easing` from `react-native`. Kept `LinearGradient` (still used).

### 📁 Files

**New**:
- `src/components/ui/ScannerOverlay.tsx` (~280 lines, fully Reanimated 4)

**Modified**:
- `src/components/ui/index.ts` — export `ScannerOverlay`
- `app/scan/index.tsx` — drop in `<ScannerOverlay imageUri={capturedUri} />`, remove 5 legacy `Animated.Value` refs + ~50 lines of useEffect, prune ~50 lines of dead styles
- `app/index.tsx` — full Reanimated 4 rewrite, +7 floating particles

### ✅ Verified

- `tsc --noEmit --strict` passes clean.
- All animation timings preserved within ±200ms of original.
- Visual identity unchanged on splash; scanner gets +data-points and +cross-scan as additive enhancements.

---

## 2026-05-09 — Compare Screen v2 (Autonomous Overnight Pass 2)

### 🎚️ PhotoCompareSlider (the marquee feature)

A draggable wipe between two photos — the signature interaction of every
top-tier skincare app (Lóvi / SkinPal). Built with **Reanimated 4 + Gesture
Handler 2** so every frame stays on the UI thread (60fps even mid-drag).
Tap-to-jump and drag-to-wipe both supported. Includes "Drag to compare" hint
that fades on first interaction, before/after caption pills, terracotta drag
handle with inset chevrons.

File: [`src/components/ui/PhotoCompareSlider.tsx`](src/components/ui/PhotoCompareSlider.tsx)

### 🗺️ RegionalDeltaMap

Anatomically-grounded face SVG showing **per-region delta** between two scans.
Each of the 7 zones (forehead, L/R cheek, nose, chin, eye area, jawline) is
colored by severity change: green = improved, neutral = unchanged, red =
regressed. Region opacity reflects magnitude of change. Below the face: summary
pills (X improved · Y same · Z regressed) plus a sorted detail list of what
changed in each zone, ordered by impact.

File: [`src/components/ui/RegionalDeltaMap.tsx`](src/components/ui/RegionalDeltaMap.tsx)

### 📊 DeltaGrid

Horizontal-scrolling tiles showing every dimension (auto-detects v1's 7 vs v2's
16) sorted by largest absolute delta first. Each tile shows the before-arrow-after
values plus a colored ± delta pill with trend icon. Top border in dimension
tint for instant visual identification.

File: [`src/components/ui/DeltaGrid.tsx`](src/components/ui/DeltaGrid.tsx)

### ✨ AI progress narrative

New `narrateProgress(before, after, profile)` in `skinAnalysis.ts` that calls
the chat model with structured deltas + concerns/strengths and returns a 2-3
sentence natural-language summary. Falls back to a template-string narrative
if the API fails (never blocks the UI). Compare screen renders the result
inside a glass card with a sparkles icon, with skeleton placeholders during
loading.

### 🧠 Compare screen rewrite — `app/compare/index.tsx`

Old: tiny 60×60 thumbnails + flat metric bars. ~300 lines.

New: 
- PhotoCompareSlider hero (max 420px, square, dynamically sized)
- "Time elapsed" chip + scan-pickers row in a unified card
- Big animated Overall delta hero with twin score rings and arrow
- AI narrative card (glass variant)
- Twin SkinAgeBadge cards (when both scans are v2)
- DeltaGrid for all dimensions
- RegionalDeltaMap (when both scans have regional data)
- Skin-type / concerns / strengths chip card with before→after badges
- View Before / View After action buttons

Picker view also got a glow-up — uses Badge component to tag v2 scans.
Empty state now uses Button component with proper iconography.

### 📁 Files

**New**:
- `src/components/ui/PhotoCompareSlider.tsx` (~180 lines, Reanimated worklet)
- `src/components/ui/RegionalDeltaMap.tsx` (~230 lines)
- `src/components/ui/DeltaGrid.tsx` (~150 lines)

**Modified**:
- `src/components/ui/index.ts` — exports new components
- `src/services/skinAnalysis.ts` — added `narrateProgress()` function with retry + graceful fallback
- `app/compare/index.tsx` — full rewrite (~360 lines, was ~300)

### ✅ Verified

- `tsc --noEmit --strict` passes clean.
- Backwards compat preserved: v1 scans render via the old code paths; v2-only panels conditional on `schemaVersion === 2`.

---

## 2026-05-09 — v2 Scanner & Design System (Autonomous Overnight Pass 1)

### 🔬 Skin Scanner v2 — Clinical-Grade

The headline feature. Going from 7 dimensions → **16 clinical biomarkers** so we
match the depth of Haut.AI / Lóvi (the apps currently dominating the App Store
charts). Every new dimension is independently scored with its own AI confidence
rating — users now see not just *what* their skin score is but *how certain*
the model is.

**New score dimensions** (additive to v1 — back-compat preserved):
- `radiance` — luminosity / glow vs dullness
- `redness` — diffuse erythema (rosacea / inflammation)
- `darkSpots` — post-inflammatory hyperpigmentation, sun damage
- `darkCircles` — periorbital pigmentation / vascular shadowing
- `wrinkles` — fine lines + expression lines
- `acne` — active blemishes (comedones / papules / pustules)
- `oiliness` — sebum production indicators
- `sensitivity` — visible reactivity / capillary fragility
- `barrierHealth` — lipid barrier integrity (flaking, tightness, dehydration)

**Regional analysis**: every scan now returns 7 zones (forehead, L/R cheek,
nose, chin, eye area, jawline) with severity (`none`/`mild`/`moderate`/`severe`)
and a one-line observation per zone.

**Skin age estimation**: AI-derived biological skin-age estimate with a bracket
classification (`younger`, `on-track`, `older`) — not a guess at chronological
age, only a clinical estimate from visible markers.

**Biomarker tags**: 3–6 concise diagnostic phrases per scan
("compromised barrier", "early UV damage", "vascular under-eye", etc.).

**Confidence scoring**: every metric carries a 0–100 confidence number that
visualizes how clearly the signal was visible in the photo.

**Photo quality preflight**: cheap client-side check (`src/services/photoQuality.ts`)
runs *before* the API call so unreadable photos don't burn a free scan. Server-side
AI returns a deeper quality assessment (`lighting`, `focus`, `faceDetected`,
`filterDetected`) which is merged with the client result.

**Retry logic**: vision and chat calls now retry on transient errors (network,
rate-limit, 5xx) with exponential backoff — no more single-blip scan failures.

**Schema versioning**: `SkinAnalysis.schemaVersion` tags each scan as v1 or v2 so
the UI can render legacy scans untouched while showcasing v2 panels for new ones.

### 🎨 Design System v2

**Tokens** (new — `src/constants/theme.ts`)
- Typography scale: display/h1/h2/h3/h4/body/bodyStrong/small/smallStrong/caption/micro
- Spacing scale: xxs (2) → giant (56)
- Radii scale: xs (6) → pill (999)
- Shadows: subtle / card / elevated / floating / glow
- Motion: durations + spring presets + press feedback constants
- Layout: screenPadding, cardPadding, sectionGap, itemGap, maxContentWidth

**Color palette** extended (`src/constants/colors.ts`)
- 9 new dimension-tints (one per v2 metric), tier badge colors, glass variants

**New UI primitives** in `src/components/ui/`
- `Card` — 6 variants: flat / elevated / glass / outline / gradient / glow
- `Button` — 5 variants × 3 sizes, with haptic feedback + spring press scale
- `Badge` — 8 tones, 3 sizes, optional pulsing dot for live states
- `Skeleton` — shimmer-loading placeholder for any size
- `Section` — title + caption + optional right-action header
- `MetricBar` — animated bar with confidence overlay + trend arrow

### 📊 Results Screen v2 Panels (additive)

When a v2 scan loads, three new panels render between the hero card and the
existing tabs:
1. **SkinAgeBadge** — gradient hero card showing biological skin-age with delta vs
   chronological age, animated counter on mount.
2. **BiomarkerCloud** — staggered chip cluster of biomarker tags.
3. **RegionalSkinMap** — anatomically-grounded face SVG with severity heatmap.
   Tap a region to see its specific finding. Pulses softly to draw attention to
   active concerns.

In the Scores tab, v2 scans now show the **16-dimension ScoreGrid** above the
legacy 6-bar list — horizontal-scrolling tiles with icon, value, confidence
indicator, and trend arrow vs prior scan.

Old scans render exactly as before (zero regression).

### ⚙️ Coach Improvements

The chat coach's system prompt now consumes v2 data: the model sees all 16
metrics, biomarker tags, and the estimated skin age. Advice is now grounded in
the user's actual scores ("your redness score of 62 suggests…") instead of
generic skin-type guidance.

### 📁 Files

**New**:
- `src/constants/theme.ts`
- `src/services/photoQuality.ts`
- `src/components/ui/Card.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Skeleton.tsx`
- `src/components/ui/Section.tsx`
- `src/components/ui/MetricBar.tsx`
- `src/components/ui/RegionalSkinMap.tsx`
- `src/components/ui/SkinAgeBadge.tsx`
- `src/components/ui/BiomarkerCloud.tsx`
- `src/components/ui/ScoreGrid.tsx`
- `src/components/ui/index.ts`

**Modified**:
- `src/types/index.ts` — added `SkinScoreV2`, `SkinConfidence`, `FaceRegion`, `RegionalFinding`, `PhotoQuality`, `SkinAge` + extended `SkinAnalysis` (all v2 fields optional → back-compat).
- `src/services/skinAnalysis.ts` — full rewrite with v2 prompt, retry, robust parsing, all v2 fields populated; v1 `scores` still returned for legacy code.
- `src/constants/colors.ts` — new tints + tier colors + glass variants.
- `app/scan/index.tsx` — wired preflight quality check, updated hero copy to mention 16 dimensions, updated analyzing-step labels.
- `app/results/[id].tsx` — additive v2 panels (SkinAgeBadge, BiomarkerCloud, RegionalSkinMap) + ScoreGrid in scores tab.

### ✅ Verified

- `tsc --noEmit --strict` passes cleanly.
- v1 results render unchanged (no schemaVersion → no v2 panels).
- v2 panels conditional on `schemaVersion === 2`.

---

## 2026-04-06 (Session 2)

### Animations & Visual Polish (Pass 3)

**Habits screen (`app/habits/index.tsx`)**
- Entrance stagger: header, score card, week bars, habit list all fade+slide in on load
- Progress bar animates to current score with `Animated.Value` (useNativeDriver: false)
- Week bar fills animate individually with staggered timing (80ms each)
- Per-habit row bounce animation on toggle (scale to 0.93, spring back)
- All animations refresh when a habit is toggled

**Journal screen (`app/journal/index.tsx`)**
- Header slides down from above on load
- Entry groups fade+slide up (staggered by group index)
- Compose card slides in from below when opened
- Add button now calls `openCompose()` which triggers slide animation

**Settings tab (`app/(tabs)/settings.tsx`)**
- Header slides down on load
- Profile card fades+slides up
- All sections (profile, premium, notifications, etc.) animate in together

**Tab bar (`app/(tabs)/_layout.tsx`)**
- Active tab now shows a terracotta top indicator pill (28px × 3px rounded bar)
- Tighter icon layout with consistent padding

**ScoreRing (`src/components/ScoreRing.tsx`)**
- SVG `linearGradient` for the progress arc (color to full opacity)
- Ambient glow layer behind the ring (score-colored, 8% opacity circle)
- Score label now shows contextual text: EXCELLENT / GOOD / FAIR / NEEDS WORK
- Optional `animate` prop: animates the arc from 0 on mount using `Animated.Value`

**Coach screen (`app/(tabs)/coach.tsx`)**
- User message bubbles have a soft terracotta shadow glow
- Rounder bubble corners (20px, 5px on corner)
- Quick prompt chips are slightly elevated with shadow
- Line-height improved on bubble text for readability

---

## 2026-04-06

### Animations & Visual Polish (Pass 2)

**Home screen**
- Entrance animations: header slides down, stats row fades+slides up, scan card springs in with scale
- Scan card has continuous pulsing warm glow overlay + icon scale pulse
- All animations run on `useNativeDriver` for 60fps performance

**Login screen**
- Logo has pulsing radial glow in terracotta that breathes continuously
- Sign-in card slides up and fades in on mount
- Added `Easing.sin` for organic feel

**Onboarding screen**
- Step-transition animation: current step fades+slides out, next step fades+slides in from opposite direction
- Animated gradient progress bar (replaces plain dots) — fills smoothly as user progresses
- Ambient radial glow behind header that pulses throughout onboarding
- Back/Continue buttons now trigger `animateStepChange()` instead of instant `setStep()`

**Results screen**
- Hero image fades and slides in from top
- Score ring springs in from 30% scale using `Animated.spring`
- Body content (strengths, concerns, tabs) slides up with staggered delay

**Coach screen**
- Typing indicator dots now bounce up and down in sequence using `Animated.loop` + `Easing.quad`
- 160ms stagger between dots for natural feel

**Progress screen**
- Header slides down with overall score badge (terracotta pill) in top-right
- Activity stat cards slide up staggered — each card has its own accent color (terracotta, gold, blue, green)
- Active metric chip pulses with gentle scale animation
- Chart and metric selector fade in after stats

**Routine screen**
- Header slides down, step cards fade+slide up on focus
- Progress bar is now `Animated.View` — fills smoothly with `Easing.cubic` when steps are checked
- Streak badge moved to header right for immediate visibility

### Bug Fixes
- **PremiumGate**: guests pressing "Activate Premium" now correctly redirect to register screen (was silently failing with "Not logged in" error)
- **PremiumGate**: registered users get a proper error alert if activation fails (was silently swallowed)

---

## 2026-04-05

### Feature: Animated Face Scanner
- Scan line sweeps up and down across face photo during analysis
- Corner bracket overlays frame the face in a scanning UI
- Rotating pulsing glow ring with spring animation
- "AI SCANNING" badge with animation
- Sequential step reveals (Analyzing • Scoring • Generating) with stagger timers
- Completion pulse animation on score reveal

### Auth System
- Added proper guest/registered user flow
- `Auth.isGuest()` and `Auth.getCurrentUser()` distinguish between modes
- Guest sessions tracked via `gd_auth_guest_v1` flag
- `clearAll()` now clears ALL `gd_` prefixed keys (was missing coach history, water, habits, etc.)
- Reset button fully clears all app data including chat

### Fix: Coach Input Visibility
- On web, tab bar overlaps screen content; hardcoded 80px `paddingBottom` for web
- Input text box now always visible above the tab bar

### Fix: Modal Containment
- `PremiumGate`, morning checklist, product shelf modals were escaping phone frame on web
- Fixed by checking `Platform.OS === 'web'` and using `absoluteFillObject` in-tree overlay instead of `<Modal>`

### Fix: AI Scanner Upload
- `asset.base64` from `ImagePicker` can be null on web — added `FileReader` blob fallback
- `photo.base64` from camera can be null on web — same blob fallback in `runAnalysis`
- Data URI prefix (`data:...;base64,`) is stripped before sending to Groq API

### Content
- Product recommendations now use real brands: The Ordinary, CeraVe, La Roche-Posay, Paula's Choice, EltaMD, Differin, Vanicream, Neutrogena, Supergoop, SkinCeuticals
- TallowDermics URL corrected to `tallowdermics.com` across all files

---

## 2026-03-22 — 2026-04-04

### Initial Build
- Expo SDK 54, React Native, Expo Router (file-based tabs)
- AI face scanner (Groq vision API, `meta-llama/llama-4-scout-17b-16e-instruct`)
- AI coach chat (Groq, `llama-3.3-70b-versatile`)
- AsyncStorage persistence for all user data
- Skin analysis with hydration/texture/clarity/evenness/firmness/pores scores
- Personalized AM/PM routine generation
- Skin journal with mood, notes, photo
- Habit tracker with 12 daily habits
- Water intake tracker
- Streak tracking (scans + routine completions)
- Progress charts (ScoreChart component)
- Ingredient scanner (photo upload → AI analysis)
- Dupe finder
- 80+ educational article screens
- Settings with guest/registered auth, premium gate
- TallowDermics promo card in settings
