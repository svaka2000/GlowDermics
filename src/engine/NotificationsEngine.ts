/**
 * NotificationsEngine
 *
 * Aggregates "important moments" from across the app into a single ordered
 * notifications feed. Sources:
 *   - Newly unlocked daily-challenge badges (never-acknowledged)
 *   - Newly hit streak milestones (delta vs previously-recorded longest streak)
 *   - Persona changes (delta vs previously-recorded persona)
 *   - At-risk streak warnings (StreakReport.atRisk)
 *   - Scan-overdue when ≥7 days since last scan
 *   - Score-trend warnings (score down ≥5pts in last 3 scans)
 *
 * Each notification carries:
 *   - id (stable across runs so dismissals persist)
 *   - title, body, icon, accent, deeplink
 *   - timestamp, dismissed flag
 *
 * Persists `dismissed` set + `lastSeenPersona` + `lastSeenStreak` in AsyncStorage
 * so users only see each event once.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Storage } from '../services/storage';
import { runStreakAnalysis, MILESTONES } from './StreakEngine';
import { runDailyChallengeAnalysis, BADGES } from './DailyChallengeEngine';
import { runSkinIdentity, SkinPersona } from './SkinIdentityEngine';

const DISMISSED_KEY = 'gd_notifications_dismissed';
const SEEN_PERSONA_KEY = 'gd_notifications_last_persona';
const SEEN_STREAK_KEY = 'gd_notifications_last_longest_streak';
const SEEN_BADGES_KEY = 'gd_notifications_seen_badges';
const SEEN_MILESTONES_KEY = 'gd_notifications_seen_milestones';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type NotifKind =
  | 'badge'
  | 'streak-milestone'
  | 'persona-shift'
  | 'streak-risk'
  | 'scan-overdue'
  | 'score-warning';

export type NotifAccent = 'gold' | 'green' | 'red' | 'primary' | 'purple' | 'blue';

export interface Notification {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  /** Ionicons name. */
  icon: string;
  accent: NotifAccent;
  /** ISO timestamp. */
  date: string;
  /** Optional in-app deeplink. */
  link?: string;
  dismissed: boolean;
}

export interface NotificationsReport {
  all: Notification[];
  unreadCount: number;
}

async function readJsonSet(key: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

async function writeJsonSet(key: string, set: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {}
}

export async function runNotifications(): Promise<NotificationsReport> {
  const [streak, challenges, identity, scans, dismissed, seenBadges, seenMilestones, seenPersonaRaw, seenStreakRaw] = await Promise.all([
    runStreakAnalysis(),
    runDailyChallengeAnalysis(),
    runSkinIdentity().catch(() => null),
    Storage.getScanHistory(),
    readJsonSet(DISMISSED_KEY),
    readJsonSet(SEEN_BADGES_KEY),
    readJsonSet(SEEN_MILESTONES_KEY),
    AsyncStorage.getItem(SEEN_PERSONA_KEY),
    AsyncStorage.getItem(SEEN_STREAK_KEY),
  ]);

  const out: Notification[] = [];
  const newSeenBadges = new Set(seenBadges);
  const newSeenMilestones = new Set(seenMilestones);

  // 1. Newly unlocked XP badges
  for (const b of BADGES) {
    if (challenges.state.totalXP >= b.xp && !seenBadges.has(b.id)) {
      out.push({
        id: `badge-${b.id}`,
        kind: 'badge',
        title: `${b.emoji} Badge unlocked: ${b.name}`,
        body: b.description,
        icon: 'medal',
        accent: 'gold',
        date: new Date().toISOString(),
        link: '/achievements',
        dismissed: dismissed.has(`badge-${b.id}`),
      });
      newSeenBadges.add(b.id);
    }
  }

  // 2. Newly hit streak milestones
  const lastSeenStreak = seenStreakRaw ? parseInt(seenStreakRaw, 10) : 0;
  for (const m of MILESTONES) {
    const isHit = streak.longestStreak >= m;
    const wasSeen = lastSeenStreak >= m || seenMilestones.has(`m-${m}`);
    if (isHit && !wasSeen) {
      out.push({
        id: `streak-milestone-${m}`,
        kind: 'streak-milestone',
        title: `🔥 ${m}-day streak unlocked`,
        body: m >= 30 ? 'A real habit. The compounding starts here.' :
              m >= 7 ? 'A full week. The early signal that this will stick.' :
              'You\'re building. Keep going.',
        icon: 'flame',
        accent: 'gold',
        date: new Date().toISOString(),
        link: '/streak',
        dismissed: dismissed.has(`streak-milestone-${m}`),
      });
      newSeenMilestones.add(`m-${m}`);
    }
  }

  // 3. Persona shift
  if (identity && seenPersonaRaw && seenPersonaRaw !== identity.persona) {
    const id = `persona-${identity.persona.replace(/\s+/g, '-').toLowerCase()}-${Date.now().toString(36)}`;
    out.push({
      id,
      kind: 'persona-shift',
      title: `Your persona is now ${identity.persona}`,
      body: identity.signature,
      icon: 'finger-print',
      accent: 'purple',
      date: new Date().toISOString(),
      link: '/identity',
      dismissed: dismissed.has(id),
    });
  }

  // 4. At-risk streak
  if (streak.atRisk && streak.currentStreak > 0) {
    const id = `streak-risk-${new Date().toDateString()}`;
    out.push({
      id,
      kind: 'streak-risk',
      title: `Save your ${streak.currentStreak}-day streak`,
      body: 'Today isn\'t logged yet. A quick check-in keeps the chain alive.',
      icon: 'alert-circle',
      accent: 'red',
      date: new Date().toISOString(),
      link: '/checkin',
      dismissed: dismissed.has(id),
    });
  }

  // 5. Scan overdue
  if (scans.length > 0) {
    const days = Math.floor((Date.now() - new Date(scans[0].date).getTime()) / MS_PER_DAY);
    if (days >= 7) {
      const id = `scan-overdue-${new Date().toDateString()}`;
      out.push({
        id,
        kind: 'scan-overdue',
        title: `${days} days since your last scan`,
        body: 'A weekly scan keeps your forecast and persona accurate.',
        icon: 'scan',
        accent: 'primary',
        date: new Date().toISOString(),
        link: '/scan',
        dismissed: dismissed.has(id),
      });
    }
  }

  // 6. Score warning (down 5+ pts across last 3 scans)
  if (scans.length >= 3) {
    const newest = scans[0].overallScore;
    const oldest = scans[2].overallScore;
    if (newest <= oldest - 5) {
      const id = `score-warning-${scans[0].id}`;
      out.push({
        id,
        kind: 'score-warning',
        title: `Skin score down ${oldest - newest} pts across last 3 scans`,
        body: 'Worth checking in — sleep, stress, or a new product could be the culprit.',
        icon: 'trending-down',
        accent: 'red',
        date: scans[0].date,
        link: '/seven-day',
        dismissed: dismissed.has(id),
      });
    }
  }

  // Persist seen-state so the same event doesn't fire forever
  if (newSeenBadges.size > seenBadges.size) await writeJsonSet(SEEN_BADGES_KEY, newSeenBadges);
  if (newSeenMilestones.size > seenMilestones.size) await writeJsonSet(SEEN_MILESTONES_KEY, newSeenMilestones);
  if (streak.longestStreak > lastSeenStreak) await AsyncStorage.setItem(SEEN_STREAK_KEY, String(streak.longestStreak));
  if (identity && identity.persona !== seenPersonaRaw) await AsyncStorage.setItem(SEEN_PERSONA_KEY, identity.persona);

  // Sort newest first
  out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    all: out,
    unreadCount: out.filter(n => !n.dismissed).length,
  };
}

export async function dismissNotification(id: string): Promise<void> {
  const dismissed = await readJsonSet(DISMISSED_KEY);
  dismissed.add(id);
  await writeJsonSet(DISMISSED_KEY, dismissed);
}

export async function dismissAll(ids: string[]): Promise<void> {
  const dismissed = await readJsonSet(DISMISSED_KEY);
  for (const id of ids) dismissed.add(id);
  await writeJsonSet(DISMISSED_KEY, dismissed);
}
