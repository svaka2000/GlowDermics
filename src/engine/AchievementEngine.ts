/**
 * AchievementEngine
 *
 * Unified achievement registry combining:
 *   - daily-challenge XP badges (BADGES from DailyChallengeEngine)
 *   - streak milestones (MILESTONES from StreakEngine)
 *   - scan-history milestones (1, 5, 10, 25, 50, 100 scans)
 *   - persona unlocks (one badge per persona archetype achieved)
 *
 * Each achievement carries unlock state, current progress %, rarity tier, and
 * a unified type so the AchievementWall screen can render them in a single
 * gallery without caring about source.
 */
import { Storage } from '../services/storage';
import { runStreakAnalysis } from './StreakEngine';
import { runDailyChallengeAnalysis, BADGES } from './DailyChallengeEngine';
import { runSkinIdentity, SkinPersona } from './SkinIdentityEngine';

export type AchievementCategory = 'streak' | 'xp' | 'scans' | 'persona';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  unlocked: boolean;
  /** 0-1 progress toward unlock. 1 = unlocked. */
  progress: number;
  /** Plain-English progress hint, e.g. "12/30 days". */
  progressLabel?: string;
  /** Pretty-printed unlock date if available (locked = undefined). */
  unlockedDate?: string;
  /** XP/days/scans value for sorting. */
  threshold: number;
}

export interface AchievementReport {
  /** All achievements, sorted by category then threshold ascending. */
  all: Achievement[];
  /** Just unlocked, sorted by recently-earned-first (when known) then by threshold desc. */
  unlocked: Achievement[];
  /** Just locked, sorted by closest-to-unlock first. */
  locked: Achievement[];
  /** Top 3 next-up — closest-to-unlock locked achievements with > 0 progress. */
  nextUp: Achievement[];
  totalCount: number;
  unlockedCount: number;
  /** Completion percentage (0-100). */
  completionPct: number;
}

/** Rarity for streak milestones. */
function streakRarity(days: number): AchievementRarity {
  if (days >= 180) return 'legendary';
  if (days >= 60) return 'epic';
  if (days >= 14) return 'rare';
  return 'common';
}

function xpRarity(xp: number): AchievementRarity {
  if (xp >= 5000) return 'legendary';
  if (xp >= 1000) return 'epic';
  if (xp >= 200) return 'rare';
  return 'common';
}

function scansRarity(n: number): AchievementRarity {
  if (n >= 100) return 'legendary';
  if (n >= 25) return 'epic';
  if (n >= 5) return 'rare';
  return 'common';
}

const SCAN_TIERS: { count: number; name: string; emoji: string }[] = [
  { count: 1,   name: 'First Mirror',     emoji: '🔍' },
  { count: 5,   name: 'Five Frames',      emoji: '🖼️' },
  { count: 10,  name: 'Tenfold',          emoji: '🎯' },
  { count: 25,  name: 'Quarter Century',  emoji: '🏅' },
  { count: 50,  name: 'Half Hundred',     emoji: '💎' },
  { count: 100, name: 'Centurion',        emoji: '👑' },
];

const PERSONA_MAP: Record<SkinPersona, { emoji: string; description: string; rarity: AchievementRarity }> = {
  'Steady Glow':       { emoji: '🌟', description: 'Earned by maintaining consistency with a strong score.',                rarity: 'rare' },
  'The Comeback':      { emoji: '📈', description: 'Earned by recovering 8+ pts across 5 scans.',                          rarity: 'epic' },
  'Resilient Skin':    { emoji: '🛡️', description: 'Earned by holding a flat trend over 30+ days.',                         rarity: 'rare' },
  'Glow Seeker':       { emoji: '🔆', description: 'The exploration phase — improving and still finding your rhythm.',     rarity: 'common' },
  'Radiant Veteran':   { emoji: '👑', description: '90+ days, 6+ scans, 78+ glow score. Top tier.',                        rarity: 'legendary' },
  'Reactive Climber':  { emoji: '⚡', description: 'High variance with a sensitive signal — listen daily.',                rarity: 'rare' },
  'Discovery Phase':   { emoji: '🌱', description: 'Just getting started — and that\'s the most exciting chapter.',        rarity: 'common' },
  'Skin Architect':    { emoji: '📐', description: 'Long streak with low variance — methodical, intentional.',             rarity: 'epic' },
};

const PERSONA_ALL: SkinPersona[] = [
  'Discovery Phase',
  'Glow Seeker',
  'Reactive Climber',
  'Steady Glow',
  'The Comeback',
  'Resilient Skin',
  'Skin Architect',
  'Radiant Veteran',
];

export async function runAchievements(): Promise<AchievementReport> {
  const [streak, challenges, scans, identity] = await Promise.all([
    runStreakAnalysis(),
    runDailyChallengeAnalysis(),
    Storage.getScanHistory(),
    runSkinIdentity().catch(() => null),
  ]);

  const all: Achievement[] = [];

  // 1. Streak milestones
  for (const ms of streak.milestones) {
    const progress = Math.min(1, streak.longestStreak / ms.days);
    all.push({
      id: `streak-${ms.days}`,
      name: ms.label,
      description: `${ms.days}-day streak milestone`,
      emoji: ms.emoji,
      category: 'streak',
      rarity: streakRarity(ms.days),
      unlocked: ms.unlocked,
      progress,
      progressLabel: ms.unlocked
        ? `${ms.days} days`
        : `${streak.longestStreak}/${ms.days} days`,
      threshold: ms.days,
    });
  }

  // 2. XP badges
  for (const b of BADGES) {
    const totalXP = challenges.state.totalXP;
    const progress = Math.min(1, totalXP / b.xp);
    const unlocked = totalXP >= b.xp;
    all.push({
      id: `xp-${b.id}`,
      name: b.name,
      description: b.description,
      emoji: b.emoji,
      category: 'xp',
      rarity: xpRarity(b.xp),
      unlocked,
      progress,
      progressLabel: unlocked
        ? `${b.xp.toLocaleString()} XP`
        : `${totalXP.toLocaleString()}/${b.xp.toLocaleString()} XP`,
      threshold: b.xp,
    });
  }

  // 3. Scan-count tiers
  for (const t of SCAN_TIERS) {
    const progress = Math.min(1, scans.length / t.count);
    const unlocked = scans.length >= t.count;
    all.push({
      id: `scans-${t.count}`,
      name: t.name,
      description: `${t.count} skin scans completed`,
      emoji: t.emoji,
      category: 'scans',
      rarity: scansRarity(t.count),
      unlocked,
      progress,
      progressLabel: unlocked
        ? `${t.count} scans`
        : `${scans.length}/${t.count} scans`,
      threshold: t.count,
    });
  }

  // 4. Persona archetypes — only the user's CURRENT persona is "unlocked";
  //    the others are visible-but-locked, since a persona is a derived state
  //    rather than an accumulated metric. Order them by rarity for display.
  for (let i = 0; i < PERSONA_ALL.length; i++) {
    const p = PERSONA_ALL[i];
    const meta = PERSONA_MAP[p];
    const isCurrent = identity?.persona === p;
    all.push({
      id: `persona-${p.replace(/\s+/g, '-').toLowerCase()}`,
      name: p,
      description: meta.description,
      emoji: meta.emoji,
      category: 'persona',
      rarity: meta.rarity,
      unlocked: isCurrent,
      progress: isCurrent ? 1 : 0,
      progressLabel: isCurrent ? 'Currently held' : 'Not yet earned',
      threshold: i,
    });
  }

  const unlocked = all.filter(a => a.unlocked);
  const locked = all.filter(a => !a.unlocked);
  const nextUp = [...locked]
    .sort((a, b) => b.progress - a.progress)
    .filter(a => a.progress > 0)
    .slice(0, 3);

  return {
    all,
    unlocked,
    locked,
    nextUp,
    totalCount: all.length,
    unlockedCount: unlocked.length,
    completionPct: Math.round((unlocked.length / all.length) * 100),
  };
}
