import AsyncStorage from '@react-native-async-storage/async-storage';

export type ChallengeCategory =
  | 'hydration'
  | 'protection'
  | 'lifestyle'
  | 'routine'
  | 'diet';

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  /** XP reward — 10/25/50 based on difficulty. */
  xp: number;
  /** Optional pro tip shown in the detail view. */
  tip?: string;
}

export interface BadgeDef {
  id: string;
  name: string;
  emoji: string;
  /** XP threshold to unlock. */
  xp: number;
  /** Plain-English description. */
  description: string;
}

const STATE_KEY = 'gd_daily_challenge_state_v1';

/**
 * Catalog — 30 curated daily challenges across 5 categories × 3 difficulties.
 * The deterministic daily picker rotates through these so users see a fresh
 * challenge most days while not getting overwhelmed by hard ones constantly.
 */
export const CHALLENGES: DailyChallenge[] = [
  // 🌊 Hydration
  { id: 'h_8_glasses', title: 'Drink 8 glasses of water', description: 'Hit 8 glasses (≈2L) before bed.', emoji: '💧', category: 'hydration', difficulty: 'medium', xp: 25, tip: 'Pre-fill a 2L bottle in the morning to make it visible.' },
  { id: 'h_morning_2', title: '2 glasses before coffee', description: 'Start the day with 2 glasses of water before any caffeine.', emoji: '🥛', category: 'hydration', difficulty: 'easy', xp: 10, tip: 'Rehydrates after the overnight fast — sets up plumper skin all day.' },
  { id: 'h_herbal_tea', title: 'Drink 2 cups herbal tea', description: 'Caffeine-free options like rooibos, chamomile, or peppermint.', emoji: '🍵', category: 'hydration', difficulty: 'easy', xp: 10 },
  { id: 'h_water_food', title: 'Eat 1 water-rich food', description: 'Cucumber, watermelon, celery, or oranges — food-based hydration.', emoji: '🥒', category: 'hydration', difficulty: 'easy', xp: 10 },
  { id: 'h_no_alcohol', title: 'Skip alcohol today', description: 'Alcohol dehydrates skin and dilates capillaries.', emoji: '🚫', category: 'hydration', difficulty: 'medium', xp: 25 },
  { id: 'h_humidifier', title: 'Run a humidifier overnight', description: 'Keeps skin from losing moisture in dry indoor air.', emoji: '💨', category: 'hydration', difficulty: 'easy', xp: 10 },

  // ☀️ Protection
  { id: 'p_spf_morning', title: 'SPF on before leaving home', description: 'A pea-sized amount on face and neck.', emoji: '☀️', category: 'protection', difficulty: 'easy', xp: 10, tip: 'SPF is the #1 anti-aging habit with decades of evidence.' },
  { id: 'p_spf_reapply', title: 'Reapply SPF at lunch', description: 'Every 2 hours of sun exposure for full protection.', emoji: '🧴', category: 'protection', difficulty: 'medium', xp: 25 },
  { id: 'p_no_touch', title: "Don't touch your face today", description: 'No idle finger contact between routine + cleansing.', emoji: '🙅', category: 'protection', difficulty: 'medium', xp: 25 },
  { id: 'p_clean_phone', title: 'Disinfect your phone screen', description: 'Phone touches your face hundreds of times — bacteria loves it.', emoji: '📱', category: 'protection', difficulty: 'easy', xp: 10 },
  { id: 'p_pillowcase', title: 'Change your pillowcase', description: 'Bacteria + oils accumulate every 2-3 nights.', emoji: '🛏', category: 'protection', difficulty: 'easy', xp: 10 },
  { id: 'p_sunglasses', title: 'Wear UV-blocking sunglasses', description: 'Protects the delicate orbital area from squint lines.', emoji: '🕶️', category: 'protection', difficulty: 'easy', xp: 10 },

  // 😴 Lifestyle
  { id: 'l_8h_sleep', title: 'Get 8 hours of sleep', description: 'Skin repair peaks during deep sleep.', emoji: '😴', category: 'lifestyle', difficulty: 'hard', xp: 50, tip: '11pm-3am is the prime collagen synthesis window.' },
  { id: 'l_no_screens_1h', title: 'No screens 1h before bed', description: 'Blue light delays melatonin — better sleep = better skin.', emoji: '📵', category: 'lifestyle', difficulty: 'hard', xp: 50 },
  { id: 'l_5min_breathwork', title: '5-minute breathwork', description: 'Box breathing or 4-7-8 to drop cortisol.', emoji: '🧘', category: 'lifestyle', difficulty: 'easy', xp: 10 },
  { id: 'l_walk_20', title: 'Take a 20-min outdoor walk', description: 'Movement + fresh air boost circulation and lymph drainage.', emoji: '🚶', category: 'lifestyle', difficulty: 'medium', xp: 25 },
  { id: 'l_silk_pillow', title: 'Sleep on silk', description: 'Reduces friction + does not absorb your skincare.', emoji: '✨', category: 'lifestyle', difficulty: 'easy', xp: 10 },
  { id: 'l_cold_water', title: 'Cold-water rinse', description: 'Splash cold water at end of cleanse — tightens, depuffs.', emoji: '🧊', category: 'lifestyle', difficulty: 'easy', xp: 10 },

  // 🌙 Routine
  { id: 'r_double_cleanse', title: 'Double-cleanse tonight', description: 'Oil cleanser then water cleanser — removes SPF + sebum.', emoji: '🌙', category: 'routine', difficulty: 'medium', xp: 25 },
  { id: 'r_thin_layers', title: 'Layer products thin → thick', description: 'Toner → serum → moisturizer → SPF. Wait 30s between.', emoji: '🪟', category: 'routine', difficulty: 'easy', xp: 10 },
  { id: 'r_full_pm', title: 'Complete full PM routine', description: 'No skipping steps — even when tired.', emoji: '🌃', category: 'routine', difficulty: 'medium', xp: 25 },
  { id: 'r_neck_chest', title: 'Take routine to neck + chest', description: 'These age fastest and are usually neglected.', emoji: '💆', category: 'routine', difficulty: 'easy', xp: 10 },
  { id: 'r_clean_tools', title: 'Clean your skincare tools', description: 'Gua sha, jade roller, rings — bacteria buildup undoes the routine.', emoji: '🧼', category: 'routine', difficulty: 'easy', xp: 10 },
  { id: 'r_face_yoga', title: '5-min face massage', description: 'Lymphatic drainage from center outward, jaw to temples.', emoji: '👋', category: 'routine', difficulty: 'medium', xp: 25 },

  // 🥗 Diet
  { id: 'd_leafy_greens', title: 'Eat 2 servings of leafy greens', description: 'Spinach, kale, arugula — lutein and zeaxanthin defend skin.', emoji: '🥬', category: 'diet', difficulty: 'easy', xp: 10 },
  { id: 'd_omega_3', title: 'Eat omega-3 rich food', description: 'Salmon, sardines, chia, flax — barrier-supporting fats.', emoji: '🐟', category: 'diet', difficulty: 'easy', xp: 10 },
  { id: 'd_no_sugar', title: 'No added sugar today', description: 'Sugar drives glycation — collagen stiffens and ages.', emoji: '🚫🍭', category: 'diet', difficulty: 'hard', xp: 50 },
  { id: 'd_no_dairy', title: 'Skip dairy today', description: 'Often a hidden trigger for hormonal acne.', emoji: '🚫🥛', category: 'diet', difficulty: 'medium', xp: 25 },
  { id: 'd_vit_c_food', title: 'Eat a vitamin-C rich food', description: 'Bell pepper, kiwi, citrus — collagen synthesis cofactor.', emoji: '🍊', category: 'diet', difficulty: 'easy', xp: 10 },
  { id: 'd_zinc_food', title: 'Eat a zinc-rich food', description: 'Pumpkin seeds, beef, oysters — anti-inflammatory + acne-fighter.', emoji: '🌰', category: 'diet', difficulty: 'easy', xp: 10 },
];

export const BADGES: BadgeDef[] = [
  { id: 'b_first',   name: 'First Glow',     emoji: '✨', xp: 10,    description: 'Completed your first daily challenge' },
  { id: 'b_50',      name: 'Initiate',       emoji: '🌱', xp: 50,    description: '50 XP — challenges are sticking' },
  { id: 'b_200',     name: 'Devoted',        emoji: '🔥', xp: 200,   description: '200 XP — habit is forming' },
  { id: 'b_500',     name: 'Glow-Getter',    emoji: '🌟', xp: 500,   description: '500 XP — serious about skin' },
  { id: 'b_1000',    name: 'Iron Glow',      emoji: '🏆', xp: 1000,  description: '1,000 XP — legendary consistency' },
  { id: 'b_5000',    name: 'Skin Sage',      emoji: '👑', xp: 5000,  description: '5,000 XP — top-tier' },
];

export interface DailyChallengeState {
  /** XP earned across all time. */
  totalXP: number;
  /** Map of date string → challenge IDs completed that day. */
  completionsByDate: Record<string, string[]>;
  /** Badge IDs that have been celebrated to the user (so we don't repeat). */
  acknowledgedBadges: string[];
}

const DEFAULT_STATE: DailyChallengeState = {
  totalXP: 0,
  completionsByDate: {},
  acknowledgedBadges: [],
};

export interface DailyChallengeReport {
  state: DailyChallengeState;
  /** Today's primary challenge. */
  primary: DailyChallenge;
  /** Today's bonus challenge (different category, complementary difficulty). */
  bonus: DailyChallenge;
  /** Has the primary been completed today? */
  primaryDone: boolean;
  /** Has the bonus been completed today? */
  bonusDone: boolean;
  /** Total XP earned today. */
  todayXP: number;
  /** Currently held level (1-indexed). */
  level: number;
  /** XP within the current level. */
  xpInLevel: number;
  /** XP needed for the current level. */
  xpForLevel: number;
  /** Badges unlocked, in order. */
  unlockedBadges: BadgeDef[];
  /** Next badge target (or null if all unlocked). */
  nextBadge: BadgeDef | null;
  /** Last 14 days of completion counts (oldest → newest). */
  last14: { date: string; count: number; xp: number }[];
  /** Newly unlocked badges that haven't been acknowledged yet. Trigger UI celebration. */
  pendingBadgeCelebrations: BadgeDef[];
}

const todayKey = (): string => new Date().toDateString();

function dailyHash(date: string): number {
  // Simple deterministic hash from a date string.
  let h = 0;
  for (let i = 0; i < date.length; i++) h = (h * 31 + date.charCodeAt(i)) >>> 0;
  return h;
}

/** Pick today's primary + bonus from the catalog deterministically. */
function pickToday(date: string): { primary: DailyChallenge; bonus: DailyChallenge } {
  const h = dailyHash(date);
  const primary = CHALLENGES[h % CHALLENGES.length];
  // Pick a bonus that's a different category to add variety.
  const candidatesByCat = CHALLENGES.filter(c => c.category !== primary.category);
  const bonus = candidatesByCat[(h >> 8) % candidatesByCat.length];
  return { primary, bonus };
}

/** Compute XP-to-level using a simple square-root curve so leveling slows over time. */
function computeLevel(totalXP: number): { level: number; xpInLevel: number; xpForLevel: number } {
  // L XP threshold = 100 * L^1.5
  // level = floor((totalXP / 100) ^ (1/1.5))
  const level = Math.max(1, Math.floor(Math.pow(totalXP / 100, 1 / 1.5)) + 1);
  const prevThreshold = level === 1 ? 0 : Math.floor(100 * Math.pow(level - 1, 1.5));
  const nextThreshold = Math.floor(100 * Math.pow(level, 1.5));
  return {
    level,
    xpInLevel: totalXP - prevThreshold,
    xpForLevel: nextThreshold - prevThreshold,
  };
}

async function loadState(): Promise<DailyChallengeState> {
  const raw = await AsyncStorage.getItem(STATE_KEY);
  if (!raw) return { ...DEFAULT_STATE };
  try {
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

async function saveState(state: DailyChallengeState): Promise<void> {
  await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
}

/** Get today's challenge + full state for the daily-challenges screen. */
export async function runDailyChallengeAnalysis(): Promise<DailyChallengeReport> {
  const state = await loadState();
  const today = todayKey();
  const { primary, bonus } = pickToday(today);
  const todayCompletions = state.completionsByDate[today] ?? [];
  const primaryDone = todayCompletions.includes(primary.id);
  const bonusDone = todayCompletions.includes(bonus.id);
  const todayXP =
    todayCompletions.reduce((sum, id) => {
      const ch = CHALLENGES.find(c => c.id === id);
      return sum + (ch?.xp ?? 0);
    }, 0);

  const { level, xpInLevel, xpForLevel } = computeLevel(state.totalXP);

  const unlockedBadges = BADGES.filter(b => state.totalXP >= b.xp);
  const nextBadge = BADGES.find(b => state.totalXP < b.xp) ?? null;

  const pendingBadgeCelebrations = unlockedBadges.filter(
    b => !state.acknowledgedBadges.includes(b.id),
  );

  // last 14 days counts
  const last14: { date: string; count: number; xp: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = d.toDateString();
    const ids = state.completionsByDate[k] ?? [];
    const xp = ids.reduce((sum, id) => sum + (CHALLENGES.find(c => c.id === id)?.xp ?? 0), 0);
    last14.push({ date: k, count: ids.length, xp });
  }

  return {
    state,
    primary,
    bonus,
    primaryDone,
    bonusDone,
    todayXP,
    level,
    xpInLevel,
    xpForLevel,
    unlockedBadges,
    nextBadge,
    last14,
    pendingBadgeCelebrations,
  };
}

/** Mark a challenge complete for today and persist. Returns the new state. */
export async function completeChallenge(challengeId: string): Promise<DailyChallengeState> {
  const state = await loadState();
  const today = todayKey();
  const todayList = state.completionsByDate[today] ?? [];
  if (todayList.includes(challengeId)) return state;

  const challenge = CHALLENGES.find(c => c.id === challengeId);
  if (!challenge) return state;

  const newState: DailyChallengeState = {
    ...state,
    totalXP: state.totalXP + challenge.xp,
    completionsByDate: {
      ...state.completionsByDate,
      [today]: [...todayList, challengeId],
    },
  };
  await saveState(newState);
  return newState;
}

/** Mark badges as acknowledged (so they don't trigger the celebration banner repeatedly). */
export async function acknowledgeBadges(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const state = await loadState();
  const next = new Set([...state.acknowledgedBadges, ...ids]);
  await saveState({ ...state, acknowledgedBadges: Array.from(next) });
}

/** Undo a completion (debug / mistake). */
export async function undoCompletion(challengeId: string): Promise<DailyChallengeState> {
  const state = await loadState();
  const today = todayKey();
  const todayList = state.completionsByDate[today] ?? [];
  if (!todayList.includes(challengeId)) return state;

  const challenge = CHALLENGES.find(c => c.id === challengeId);
  if (!challenge) return state;

  const newList = todayList.filter(id => id !== challengeId);
  const newState: DailyChallengeState = {
    ...state,
    totalXP: Math.max(0, state.totalXP - challenge.xp),
    completionsByDate: {
      ...state.completionsByDate,
      [today]: newList,
    },
  };
  await saveState(newState);
  return newState;
}
