# Graph Report - .  (2026-04-10)

## Corpus Check
- 148 files · ~255,374 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 335 nodes · 457 edges · 28 communities detected
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `GlowDermics App` - 22 edges
2. `save()` - 9 edges
3. `generateId()` - 8 edges
4. `load()` - 7 edges
5. `getTodayStr()` - 6 edges
6. `today()` - 6 edges
7. `React Native Animated API Usage` - 6 edges
8. `generate()` - 5 edges
9. `addProduct()` - 5 edges
10. `Groq Vision API` - 5 edges

## Surprising Connections (you probably didn't know these)
- `GlowDermics App Icon` --conceptually_related_to--> `GlowDermics App`  [INFERRED]
  assets/icon.png → CHANGELOG.md
- `Concentric Circles Brand Motif` --conceptually_related_to--> `ScoreRing Component (src/components/ScoreRing.tsx)`  [INFERRED]
  assets/icon.png → CHANGELOG.md
- `GlowDermics Adaptive Icon (Android)` --semantically_similar_to--> `GlowDermics App Icon`  [INFERRED] [semantically similar]
  assets/adaptive-icon.png → assets/icon.png
- `GlowDermics Splash Icon` --semantically_similar_to--> `GlowDermics App Icon`  [INFERRED] [semantically similar]
  assets/splash-icon.png → assets/icon.png
- `loadStory()` --calls--> `generate()`  [EXTRACTED]
  app/skin-story/index.tsx → app/forecast/index.tsx

## Hyperedges (group relationships)
- **GlowDermics Animation Polish Pass 3 (2026-04-06)** — changelog_screen_habits, changelog_screen_journal, changelog_screen_settings, changelog_screen_coach, changelog_component_scorering, changelog_tab_layout, changelog_animation_system [EXTRACTED 1.00]
- **GlowDermics Animation Polish Pass 2 (2026-04-06)** — changelog_screen_home, changelog_screen_login, changelog_screen_onboarding, changelog_screen_results, changelog_screen_coach, changelog_screen_progress, changelog_screen_routine, changelog_animation_system [EXTRACTED 1.00]
- **GlowDermics Initial Build (2026-03-22 to 2026-04-04)** — changelog_app_glowdermics, changelog_expo_sdk, changelog_expo_router, changelog_groq_api, changelog_llama4_model, changelog_llama3_model, changelog_async_storage, changelog_skin_analysis, changelog_auth_system [EXTRACTED 1.00]
- **GlowDermics Brand Asset Set** — icon_app_icon, icon_favicon, icon_adaptive_icon, icon_splash_icon, icon_concentric_circles_motif, icon_light_minimal_palette [EXTRACTED 1.00]

## Communities

### Community 0 - "C0"
Cohesion: 0.02
Nodes (0): 

### Community 1 - "C1"
Cohesion: 0.05
Nodes (6): canProceed(), hasProfanity(), handleComplete(), refreshLog(), getHabitLogs(), runSkinProgressEngine()

### Community 2 - "C2"
Cohesion: 0.1
Nodes (31): React Native Animated API Usage, GlowDermics App, AsyncStorage Persistence, Auth System (Guest/Registered Flow), Terracotta Brand Color, PremiumGate Component, ScoreRing Component (src/components/ScoreRing.tsx), Expo Router (File-based Tabs) (+23 more)

### Community 3 - "C3"
Cohesion: 0.12
Nodes (9): generateId(), send(), todayMsgKey(), handleLogin(), shake(), handleRegister(), hasProfanity(), shake() (+1 more)

### Community 4 - "C4"
Cohesion: 0.12
Nodes (17): getCurrentNight(), getDayOfCycle(), getDaysSince(), getPhaseFromDay(), getTodayStr(), getWaterToday(), load(), logToday() (+9 more)

### Community 5 - "C5"
Cohesion: 0.17
Nodes (16): addEntry(), addGoal(), addPreset(), addProduct(), addSuggestion(), finish(), generateId(), resetForm() (+8 more)

### Community 6 - "C6"
Cohesion: 0.24
Nodes (6): getCuratedImages(), searchBeautyProducts(), searchFoodProducts(), searchImages(), searchPexels(), setCache()

### Community 7 - "C7"
Cohesion: 0.29
Nodes (7): checkScanLimit(), handleCamera(), handleCapture(), handleOpenCamera(), handlePickPhoto(), runAnalysis(), runScan()

### Community 8 - "C8"
Cohesion: 0.33
Nodes (5): fix_line(), is_js_string_line(), Fix unescaped apostrophes ONLY in JS string literal values. Targets: property va, Returns True if this line contains a JS string literal that could have     an un, For each JS string value on the line, if it contains a word apostrophe,     conv

### Community 9 - "C9"
Cohesion: 0.4
Nodes (5): generate(), loadData(), loadGuide(), loadOrGenerate(), loadStory()

### Community 10 - "C10"
Cohesion: 0.6
Nodes (3): analyzeSkin(), clamp(), generateId()

### Community 11 - "C11"
Cohesion: 0.5
Nodes (4): startPulse(), startRolling(), startSession(), startShower()

### Community 12 - "C12"
Cohesion: 0.67
Nodes (3): getWeekHistory(), setTodayLog(), toggle()

### Community 13 - "C13"
Cohesion: 0.67
Nodes (3): goNext(), startFacial(), startStep()

### Community 14 - "C14"
Cohesion: 0.67
Nodes (3): getAvailableCheckIns(), getHoursSince(), getResultLabel()

### Community 15 - "C15"
Cohesion: 0.67
Nodes (3): calculateResult(), getResult(), handleAnswer()

### Community 16 - "C16"
Cohesion: 0.67
Nodes (3): animateQuestionTransition(), next(), submit()

### Community 17 - "C17"
Cohesion: 0.67
Nodes (0): 

### Community 18 - "C18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "C19"
Cohesion: 1.0
Nodes (1): Replace router.back() in onPress handlers with the safe canGoBack version.

### Community 20 - "C20"
Cohesion: 1.0
Nodes (2): generateReport(), getWeatherReport()

### Community 21 - "C21"
Cohesion: 1.0
Nodes (2): adjustWater(), setWaterToday()

### Community 22 - "C22"
Cohesion: 1.0
Nodes (2): goToStep(), nextStep()

### Community 23 - "C23"
Cohesion: 1.0
Nodes (2): sendMessage(), todayKey()

### Community 24 - "C24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "C25"
Cohesion: 1.0
Nodes (2): Expo Default Favicon Placeholder, GlowDermics Favicon

### Community 26 - "C26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "C27"
Cohesion: 1.0
Nodes (1): GlowDermics Changelog

## Knowledge Gaps
- **16 isolated node(s):** `Fix unescaped apostrophes ONLY in JS string literal values. Targets: property va`, `Returns True if this line contains a JS string literal that could have     an un`, `For each JS string value on the line, if it contains a word apostrophe,     conv`, `Replace router.back() in onPress handlers with the safe canGoBack version.`, `GlowDermics Changelog` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `C18`** (2 nodes): `App.tsx`, `App()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `C19`** (2 nodes): `fix_goback.py`, `Replace router.back() in onPress handlers with the safe canGoBack version.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `C20`** (2 nodes): `generateReport()`, `getWeatherReport()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `C21`** (2 nodes): `adjustWater()`, `setWaterToday()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `C22`** (2 nodes): `goToStep()`, `nextStep()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `C23`** (2 nodes): `sendMessage()`, `todayKey()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `C24`** (2 nodes): `dupeFinder.ts`, `findDupes()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `C25`** (2 nodes): `Expo Default Favicon Placeholder`, `GlowDermics Favicon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `C26`** (1 nodes): `fix_quotes.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `C27`** (1 nodes): `GlowDermics Changelog`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `Fix unescaped apostrophes ONLY in JS string literal values. Targets: property va`, `Returns True if this line contains a JS string literal that could have     an un`, `For each JS string value on the line, if it contains a word apostrophe,     conv` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `C0` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `C1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `C2` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `C3` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `C4` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._