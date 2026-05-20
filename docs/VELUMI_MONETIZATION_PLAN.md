# Velumi AI — Asset Manifest

> Exhaustive, pre-flight asset sourcing pass. Download everything BLOCKING below into the folders specified, then development can proceed without stalls.
>
> Codebase recon basis: 130 unique Ionicons in use across 64 screens; no binary fonts loaded (platform-native serif stack); 113 LinearGradient sites; zero Lottie; only Expo-default app icons; 10 hero/empty-state screens that need illustrations.

---

## ⚡ Tl;dr — BLOCKING grab list (do this first)

| # | Item | Where | How |
|---|------|-------|-----|
| 1 | **Velumi brand logo** (PNG/SVG, ≥512×512) | `assets/velumi-logo.png` | Save your own — the ChatGPT-generated one you sent works fine |
| 2 | **App icon master** (1024×1024 PNG) | `assets/icon.png` | Use the same brand mark, padded for square crop |
| 3 | **Adaptive icon foreground** (1024×1024 PNG, transparent) | `assets/adaptive-icon.png` | Brand mark only, no bg |
| 4 | **Splash icon** (1024×1024 PNG, transparent) | `assets/splash-icon.png` | Same as adaptive |
| 5 | **Favicon** (48×48 PNG) | `assets/favicon.png` | Use Expo Assets Generator from icon.png |
| 6 | **Inter font** (variable + 400/500/600/700) | npm package | `npx expo install @expo-google-fonts/inter expo-font` |
| 7 | **Cormorant Garamond** (400/500/600/700) | npm package | `npx expo install @expo-google-fonts/cormorant-garamond` |
| 8 | **lottie-react-native** | npm package | `npx expo install lottie-react-native` |
| 9 | **8 onboarding/empty-state illustrations** (SVG) | `assets/illustrations/` | [unDraw](https://undraw.co) — recolor to `#8A7860` before download |
| 10 | **Noise texture** (SVG, ~1KB) | `assets/textures/noise.svg` | Generate at [nnnoise](https://www.fffuel.co/nnnoise/) |

After grabbing 1–10, the app is fully asset-complete for the public launch.

---

## 1. Fonts

**Current state:** No binary fonts loaded. `fonts.display` falls back to `Georgia` (iOS) / `serif` (Android) / Cormorant via CSS on web only. Marketing landing already uses Cormorant Garamond. Mismatch between app and marketing.

### 1.1 Inter — body sans · BLOCKING

- **Used for:** All body text, captions, buttons, UI labels
- **Weights needed:** 400 (body), 500 (button), 600 (heading), 700 (overline)
- **Install:** `npx expo install @expo-google-fonts/inter expo-font`
- **Package:** [@expo-google-fonts/inter](https://www.npmjs.com/package/@expo-google-fonts/inter)
- **License:** SIL Open Font License 1.1 (commercial OK, no attribution required)
- **Wiring (1 file):** add `useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold })` in `app/_layout.tsx` and gate `<SplashScreen>` until loaded

### 1.2 Cormorant Garamond — display serif · BLOCKING

- **Used for:** All `fonts.display` references (hero headlines, score numbers, card titles)
- **Weights needed:** 400 (light italic for accent), 500 (titles), 600 (display), 700 (rare emphasis)
- **Install:** `npx expo install @expo-google-fonts/cormorant-garamond`
- **Package:** [@expo-google-fonts/cormorant-garamond](https://www.npmjs.com/package/@expo-google-fonts/cormorant-garamond)
- **License:** SIL Open Font License 1.1
- **After install:** Update `src/constants/typography.ts` so `fonts.display = 'CormorantGaramond_500Medium'` on all platforms (not just web)

### 1.3 Alternatives considered (do not install — chosen above)

- **EB Garamond** — also free, slightly less geometric; reject (Cormorant has better italic)
- **Playfair Display** — too contrasty / fashion-mag; reject (clashes with Quiet Luxury restraint)
- **Lora** — too readable / functional; reject (lacks luxury feel)

### 1.4 No additional system font needed

iOS `System` (SF Pro) and Android `Roboto` are fine for non-display contexts after Inter loads.

---

## 2. Icons

**Current state:** Single library — Ionicons via `@expo/vector-icons` (already installed in package.json). 130 unique glyphs in use across 64 screens. Zero custom SVG icons. Zero usage of MaterialIcons / FontAwesome / Feather.

### 2.1 Ionicons (stays) · BLOCKING (already met)

- **Package:** `@expo/vector-icons` (in `package.json` — version 15.1.1)
- **License:** MIT
- **Used for:** Every navigation, settings, action, status, input glyph in the app
- **No action required** — already bundled. Just keep using it.

### 2.2 130-glyph usage manifest (reference for offline-icon-pack builds)

```
add, add-circle, add-circle-outline, airplane, alert-circle,
alert-circle-outline, analytics-outline, arrow-back, arrow-forward, arrow-up,
body-outline, book-outline, bulb, bulb-outline, calendar, calendar-outline,
camera, camera-outline, cash-outline, chatbubble-ellipses,
chatbubble-ellipses-outline, chatbubble-outline, checkmark, checkmark-circle,
checkmark-circle-outline, checkmark-done-outline, chevron-back,
chevron-forward, chevron-up-circle-outline, close, close-circle,
close-circle-outline, cloud-offline-outline, copy-outline, create-outline,
cube-outline, diamond, document-text-outline, eye, eye-outline, film,
film-outline, finger-print, finger-print-outline, flag-outline, flame, flash,
flash-outline, flask, flask-outline, git-compare, git-compare-outline,
git-merge-outline, git-network-outline, grid, grid-outline, heart,
help-circle-outline, home-outline, hourglass-outline, image-outline,
images-outline, infinite, information-circle, information-circle-outline,
journal-outline, leaf, leaf-outline, link-outline, list-outline, lock-closed,
lock-closed-outline, log-out-outline, logo-instagram, mail-outline,
medal-outline, moon-outline, newspaper-outline, notifications-off-outline,
notifications-outline, nutrition-outline, partly-sunny-outline, people-outline,
person, person-outline, play, play-circle, pulse, refresh-outline, remove,
remove-circle, remove-circle-outline, reorder-four-outline, restaurant-outline,
ribbon-outline, rocket, save-outline, scan, scan-outline, search,
search-outline, send, share-outline, share-social, share-social-outline,
shield-checkmark, shield-checkmark-outline, sparkles, sparkles-outline, star,
star-outline, stats-chart-outline, storefront-outline, sunny-outline,
swap-horizontal, time-outline, trash-outline, trending-down, trending-up,
trending-up-outline, trophy, trophy-outline, warning, warning-outline, water,
water-outline
```

### 2.3 Phosphor or Lucide for differentiation · POLISH (optional)

Ionicons is mass-market and recognisable as "Expo default." For a more bespoke premium feel, swap to:

- **[Phosphor Icons](https://phosphoricons.com/)** — 7,700+ icons, 6 weights (duotone is gorgeous on hero cards). MIT license. RN package: [`phosphor-react-native`](https://www.npmjs.com/package/phosphor-react-native)
- **[Lucide](https://lucide.dev/)** — 1,500+ icons, more consistent stroke widths, RN package: [`lucide-react-native`](https://www.npmjs.com/package/lucide-react-native). ISC license.

Trade-off: Ionicons is already bundled and zero-effort; switching = a renaming codemod (~130 glyphs) plus testing. **Recommend deferring to post-launch.**

### 2.4 No custom SVG icons required

Zero custom illustrations are needed as icons. Brand mark (logo) is covered in §4.

---

## 3. Illustrations & Imagery

**Current state:** Zero illustrations. 10 hero/empty-state screens render text-only.

**Strategy:** Use **unDraw** as the single source (instant recolor to Velumi taupe `#8A7860` before download, no attribution required, MIT-style license). Storyset has prettier art but requires attribution — a downgrade from a brand-cleanliness perspective.

### 3.1 Onboarding illustrations · BLOCKING (4)

For `app/(auth)/onboarding.tsx` — five-page horizontal carousel. The current Pages: PageWelcome (has wordmark), PageSixteenDimensions, PageRegionalMap, PageCoachAndAge, PageFirstScan.

| # | Page | unDraw query | Save to |
|---|------|--------------|---------|
| 3.1.1 | Sixteen dimensions explainer | https://undraw.co/illustrations/skincare or "analyze" | `assets/illustrations/onboarding-dimensions.svg` |
| 3.1.2 | Regional skin map | "face_recognition" or "map" | `assets/illustrations/onboarding-regional.svg` |
| 3.1.3 | Coach + age | "conversation" | `assets/illustrations/onboarding-coach.svg` |
| 3.1.4 | First scan | "selfie" or "selfie_taking" | `assets/illustrations/onboarding-firstscan.svg` |

**Color before download:** `#8A7860` (Velumi taupe). License: unDraw open-source (commercial OK, no attribution).

### 3.2 Empty-state illustrations · BLOCKING (6)

| # | Screen | unDraw query | Save to |
|---|--------|--------------|---------|
| 3.2.1 | `app/forecast/index.tsx` empty | "predictions" or "data trend" | `assets/illustrations/empty-forecast.svg` |
| 3.2.2 | `app/skin-story/index.tsx` empty | "story" or "journey" | `assets/illustrations/empty-story.svg` |
| 3.2.3 | `app/journal/index.tsx` empty | "journal" or "writing" | `assets/illustrations/empty-journal.svg` |
| 3.2.4 | `app/morning-checklist/index.tsx` empty | "morning" or "checklist" | `assets/illustrations/empty-checklist.svg` |
| 3.2.5 | `app/expiry-tracker/index.tsx` empty | "calendar" or "tracking" | `assets/illustrations/empty-expiry.svg` |
| 3.2.6 | `app/products/index.tsx` empty | "shelf" or "products" | `assets/illustrations/empty-shelf.svg` |

All recolored to `#8A7860` before download.

### 3.3 Marketing landing photography · POLISH

The marketing landing at `marketing/index.html` currently uses a CSS-only phone mockup (no photography). If you want a hero photo upgrade:

- **[Unsplash — skincare](https://unsplash.com/s/photos/skincare)** — free, no attribution, commercial OK. Best for editorial product shots.
- **[Unsplash — face skincare](https://unsplash.com/s/photos/face-skincare)** — model photography with diverse skin tones (important for inclusive marketing)
- **[Pexels skincare](https://www.pexels.com/search/skincare/)** — same license profile, often cleaner backgrounds
- **[Burst by Shopify](https://burst.shopify.com/skincare)** — best for product-flat-lay shots
- **[Kaboompics](https://kaboompics.com/category/cosmetics-beauty)** — editorial / styled aesthetic closest to Aesop / Augustinus Bader. CC0.
- **[Picjumbo](https://picjumbo.com/category/beauty/)** — free tier OK; premium pass for more

**License rule:** All four require no attribution for commercial use. Avoid Unsplash+ images unless you've paid (the paid tier has different terms).

**Drop into:** `assets/photos/marketing/`

### 3.4 In-app photography · NOT NEEDED

The app's UI deliberately avoids stock photography in favor of data visualization, gradient cards, and the user's own scan photos. **Do not source — keep the editorial discipline.**

---

## 4. Logo & Brand Assets

**Current state:** 1×1 transparent placeholder at `assets/velumi-logo.png` (68 bytes). Wordmark component detects this and skips rendering the image. App icon, adaptive icon, splash icon, and favicon are all Expo defaults (concentric grey circles).

### 4.1 Velumi brand mark · BLOCKING

- **The artwork you sent in chat (V + face profile + constellation + "VELUMI AI SKINCARE")** is good. Save it as:
- **File:** `assets/velumi-logo.png`
- **Format:** PNG with transparent background, ≥512×512 (1024×1024 ideal)
- **Once saved:** `VelumiWordmark` auto-detects (`HAS_REAL_LOGO` heuristic in `src/components/ui/VelumiWordmark.tsx`) and renders at 56/96/168 px size variants

### 4.2 App icon · BLOCKING

- **File:** `assets/icon.png`
- **Format:** 1024×1024 PNG. **No transparency, no rounded corners** — iOS adds those automatically. Pad your brand mark to ~70% of canvas inside a warm ivory `#F7F3EC` square.
- **Generate via:** [Expo Assets Generator](https://expo-assets-generator.vercel.app/) (free, no signup) — drop your master at 1024×1024 and it generates iOS icons, Android adaptive, splash, and favicon plus app.json snippets.
- **Alternative tool:** [NextNative free generator](https://nextnative.dev/free-tools/app-icon-splash-generator)
- **Reference:** [Expo splash + app icon docs](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)

### 4.3 Android adaptive icon foreground · BLOCKING

- **File:** `assets/adaptive-icon.png`
- **Format:** 1024×1024 PNG, **transparent background**. Brand mark centered in inner 66% safe zone.
- Background color set via `app.json` `android.adaptiveIcon.backgroundColor = '#F7F3EC'`

### 4.4 Splash icon · BLOCKING

- **File:** `assets/splash-icon.png`
- **Format:** 1024×1024 PNG, transparent. Same artwork as adaptive icon.
- Background color set in `app.json` `splash.backgroundColor = '#F7F3EC'`

### 4.5 Favicon · BLOCKING (web)

- **File:** `assets/favicon.png`
- **Format:** 48×48 PNG (small enough that just the spark/V mark is fine — don't try to fit the whole wordmark)

### 4.6 App Store / TestFlight assets · BLOCKING for store submission

Required for App Store Connect:

| Asset | Size | Where it shows |
|-------|------|----------------|
| App Store icon | 1024×1024 PNG | App Store listing |
| iPhone 6.7" screenshots | 1290×2796 PNG, ×3–10 frames | App Store gallery |
| iPhone 6.5" screenshots | 1242×2688 PNG, ×3–10 | Legacy gallery |
| iPad screenshots (optional) | 2048×2732 PNG | iPad listings |

**Generate via:** [App Store Screenshot Generator on Figma Community](https://www.figma.com/community/file/1124042280912039755) (free) — drop screenshots from the running app into device-frame templates.

---

## 5. Animations

**Current state:** 105 files use `react-native-reanimated` for imperative micro-animations (fades, slides, scales). Zero Lottie files.

### 5.1 lottie-react-native install · BLOCKING (small)

- **Install:** `npx expo install lottie-react-native`
- **Package:** [lottie-react-native](https://www.npmjs.com/package/lottie-react-native)
- **License:** Apache 2.0
- **Why:** Three places dramatically benefit from Lottie (face-scan loading, success checkmark, onboarding subtle motion). Pure Reanimated would take 10× longer for the same fidelity.

### 5.2 Face scan animation · BLOCKING

- **Use:** `app/scan/index.tsx` overlay while AI analyzes the photo
- **Source:** [Face Scan animation by Mohamed Belas](https://lottiefiles.com/73894-face-scan-animation) or [Face Scan by BatMan](https://lottiefiles.com/55380-face-scan)
- **License:** [Lottie Simple License](https://lottiefiles.com/page/license) — free commercial, no attribution required
- **Save to:** `assets/animations/face-scan.json` (or `.lottie`)
- **Tip:** Recolor strokes to `#8A7860` in the LottieFiles editor before download

### 5.3 Success checkmark · BLOCKING

- **Use:** Scan completed, photo saved, regimen step done, paywall conversion
- **Source:** [Success checkmark by Rishabh Kashyap](https://lottiefiles.com/55015-success-checkmark) or [Loading with success + error by Patrick Rigor](https://lottiefiles.com/20102-loading-animation-with-success-and-error)
- **License:** Lottie Simple License (commercial OK, no attribution)
- **Save to:** `assets/animations/success-check.json`

### 5.4 Skeleton / loading shimmer · BUILD IN CODE

- The codebase already has `src/components/ui/Skeleton.tsx`. The shimmer is driven by Reanimated — keep it. **Do not source.**

### 5.5 Onboarding micro-animations · POLISH

LottieFiles has a [free onboarding category](https://lottiefiles.com/free-animations/onboarding) for swipe-page transitions. Optional — current Reanimated micro-anims in onboarding are already polished.

### 5.6 Hero pulse / scan-aurora · BUILD IN CODE

The existing `SkinAura`, `GlowPulse`, `BiomarkerCloud` components are entirely SVG + Reanimated. **Do not source — these are already premium-tier and bespoke to Velumi.**

---

## 6. Sound / Haptics

### 6.1 Haptics · BLOCKING (install + wire only — no asset files)

- **Package:** `expo-haptics` (already in `package.json` — `~15.0.8`)
- **Install if missing:** `npx expo install expo-haptics`
- **License:** MIT
- **Wire (BUILD IN CODE):** Currently 2 occurrences in codebase. Should add:
  - `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)` on every Pressable in the bottom-tab nav and main CTAs
  - `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)` on scan complete, paywall convert
  - `Haptics.selectionAsync()` on toggle switches and segmented controls
- **No asset files** — system-level haptic engine, code-driven only.

### 6.2 Audio · NOT NEEDED

The app deliberately has no audio — skincare is a visual experience and audio would feel out of place against the Quiet Luxury register. **Do not source.** No expo-av install needed.

---

## 7. Textures & Backgrounds

**Current state:** No texture assets. All depth is via 113 LinearGradient instances + solid color layers.

### 7.1 SVG noise grain · BLOCKING (one file, ~1 KB)

- **Use:** Apply behind hero gradients on home + onboarding + paywall + marketing landing so the warm ivory bg doesn't look "flat AI-generated"
- **Generate:** [nnnoise on fffuel.co](https://www.fffuel.co/nnnoise/) — set:
  - Base color: `#F7F3EC`
  - Noise: 0.65 frequency / 0.45 opacity / monochrome
  - Output: SVG (~1 KB)
- **License:** fffuel free tier — commercial OK, attribution appreciated not required
- **Save to:** `assets/textures/noise-ivory.svg`
- **Wire:** Drop as a `position: absolute, opacity: 0.6` layer above gradients

### 7.2 Paper grain · POLISH

If you want a more "Aesop print catalog" feel on premium screens (paywall, skin-report):

- **Source:** [everytexture.com paper-texture-00025](https://everytexture.com/everytexture-com-stock-paper-texture-00025/) — high-resolution grainy paper, free commercial, no attribution
- **Save to:** `assets/textures/paper-grain.jpg` (or convert to webp for smaller bundle)
- **Alternative:** [Magnific noise textures](https://www.magnific.com/free-photos-vectors/noise-texture) (broader selection, also free commercial)

### 7.3 Linear/radial gradients · BUILD IN CODE

113 existing LinearGradient sites. All use Velumi tokens. **Do not source — every gradient is already palette-driven.**

### 7.4 Decorative blobs / aurora / mesh · BUILD IN CODE

The `SkinAura.tsx` component renders animated SVG blobs deterministically per persona. Same with `BiomarkerCloud.tsx`. **Do not source.**

---

## 8. Folder structure (drop downloads here)

```
~/GlowDermics/
├── assets/
│   ├── icon.png                      # 1024×1024 app icon (REPLACE Expo default)
│   ├── adaptive-icon.png             # 1024×1024 transparent (REPLACE)
│   ├── splash-icon.png               # 1024×1024 transparent (REPLACE)
│   ├── favicon.png                   # 48×48 (REPLACE)
│   ├── velumi-logo.png               # 512×512+ brand mark (REPLACE placeholder)
│   ├── illustrations/                # NEW DIR — drop unDraw SVGs here
│   │   ├── onboarding-dimensions.svg
│   │   ├── onboarding-regional.svg
│   │   ├── onboarding-coach.svg
│   │   ├── onboarding-firstscan.svg
│   │   ├── empty-forecast.svg
│   │   ├── empty-story.svg
│   │   ├── empty-journal.svg
│   │   ├── empty-checklist.svg
│   │   ├── empty-expiry.svg
│   │   └── empty-shelf.svg
│   ├── animations/                   # NEW DIR — drop Lottie JSON/dotLottie here
│   │   ├── face-scan.json
│   │   └── success-check.json
│   ├── textures/                     # NEW DIR
│   │   ├── noise-ivory.svg
│   │   └── paper-grain.jpg           # POLISH only
│   └── photos/                       # OPTIONAL — marketing only
│       └── marketing/
└── marketing/
    └── assets/
        └── og.png                    # 1200×630 OG image for social sharing (POLISH)
```

After download, run:

```bash
mkdir -p ~/GlowDermics/assets/{illustrations,animations,textures,photos/marketing}
mkdir -p ~/GlowDermics/marketing/assets
```

---

## 9. Prioritized download order

### Phase 1 — Brand identity (must land before public launch)
1. Save Velumi brand mark → `assets/velumi-logo.png`
2. Generate icon set via [Expo Assets Generator](https://expo-assets-generator.vercel.app/) → replace `icon.png`, `adaptive-icon.png`, `splash-icon.png`, `favicon.png`

### Phase 2 — Typography (must land before next polish pass)
3. `npx expo install @expo-google-fonts/inter @expo-google-fonts/cormorant-garamond expo-font`
4. Wire `useFonts` in `app/_layout.tsx` (5 lines of code — I can do this in the next turn)

### Phase 3 — Illustrations (before App Store screenshots)
5. Visit [unDraw](https://undraw.co), recolor to `#8A7860`, download 10 SVGs → `assets/illustrations/`

### Phase 4 — Animations (before scan UX polish)
6. `npx expo install lottie-react-native`
7. Download face-scan + success-check Lotties → `assets/animations/`

### Phase 5 — Textures (polish pass)
8. Generate noise.svg at [nnnoise](https://www.fffuel.co/nnnoise/) → `assets/textures/noise-ivory.svg`

### Phase 6 — Marketing photography (optional)
9. Download 2–3 hero shots from [Unsplash skincare](https://unsplash.com/s/photos/skincare) or [Kaboompics cosmetics](https://kaboompics.com/category/cosmetics-beauty) → `assets/photos/marketing/`
10. Generate 1200×630 OG image with brand mark + tagline in [Canva free](https://www.canva.com) or any image editor → `marketing/assets/og.png`

---

## 10. Licensing safety summary (no copyright landmines)

| Source | License | Attribution | Commercial OK | Safe for paid app? |
|--------|---------|-------------|---------------|--------------------|
| Google Fonts (Inter, Cormorant Garamond) | SIL OFL 1.1 | No | Yes | ✅ |
| Ionicons | MIT | No | Yes | ✅ |
| Phosphor Icons | MIT | No | Yes | ✅ |
| Lucide | ISC | No | Yes | ✅ |
| unDraw | Open custom | No | Yes | ✅ |
| Storyset | Free with attrib | **Yes** (link back) | Yes | ⚠️ Avoid for clean brand |
| Open Doodles | Free commercial | No | Yes | ✅ |
| LottieFiles (free tier) | Lottie Simple License | No | Yes | ✅ |
| Unsplash | Unsplash License | No | Yes | ✅ (free tier only — avoid Unsplash+ unless paid) |
| Pexels | Pexels License | No | Yes | ✅ |
| Burst (Shopify) | Burst Free | No | Yes | ✅ |
| Kaboompics | CC0 | No | Yes | ✅ |
| Picjumbo (free) | Picjumbo Free | No | Yes | ✅ (avoid premium-only unless paid) |
| fffuel (nnnoise) | Free use | Appreciated | Yes | ✅ |
| everytexture.com | Free use | No | Yes | ✅ |

**Hard rules:**
- Do **not** download anything from Freepik free tier without checking — many "free" assets require attribution
- Do **not** use Pinterest pins, Dribbble shots, or random Google Image results — those are copyrighted
- Do **not** use Adobe Stock free tier — license unclear for paid apps
- Do **not** train AI on Unsplash+ images — separate restricted clause

---

## 11. After everything is dropped in

Run once:

```bash
cd ~/GlowDermics
npx expo install @expo-google-fonts/inter @expo-google-fonts/cormorant-garamond expo-font lottie-react-native
npx tsc --noEmit                           # sanity check
npx expo start --web --clear                # full asset reload
```

Then I (or whoever picks up next) can:
1. Wire `useFonts` in `app/_layout.tsx`
2. Update `src/constants/typography.ts` so `fonts.display` resolves to `'CormorantGaramond_500Medium'` on iOS/Android
3. Drop `<LottieView source={require('../assets/animations/face-scan.json')} autoPlay loop />` into the scan flow
4. Add `Haptics.impactAsync()` to tab nav + CTAs

---

_Manifest generated 2026-05-20 — refresh after every asset drop._
