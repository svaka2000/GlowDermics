# GlowDermics Changelog

All notable changes are listed here in reverse chronological order.

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
