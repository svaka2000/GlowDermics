# GlowDermics Changelog

All notable changes are listed here in reverse chronological order.

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
