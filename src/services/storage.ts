import AsyncStorage from '@react-native-async-storage/async-storage';
import { SkinAnalysis, UserProfile, ScanHistoryEntry, JournalEntry } from '../types';

const KEYS = {
  USER_PROFILE: 'gd_user_profile',
  SCAN_HISTORY: 'gd_scan_history',
  ANALYSES: 'gd_analyses',
  ONBOARDED: 'gd_onboarded',
  STREAK: 'gd_streak',
  LAST_SCAN_DATE: 'gd_last_scan_date',
  ROUTINE_LOG: 'gd_routine_log', // { date: string, morning: boolean, evening: boolean }[]
  ARTICLES_READ: 'gd_articles_read', // string[] of slugs
  JOURNAL: 'gd_journal', // JournalEntry[]
};

export const Storage = {
  async saveUserProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  async getUserProfile(): Promise<UserProfile | null> {
    const raw = await AsyncStorage.getItem(KEYS.USER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  },

  async saveAnalysis(analysis: SkinAnalysis): Promise<void> {
    const existing = await this.getAnalyses();
    const updated = [analysis, ...existing].slice(0, 90);
    await AsyncStorage.setItem(KEYS.ANALYSES, JSON.stringify(updated));
    await this.updateStreak();
  },

  async getAnalyses(): Promise<SkinAnalysis[]> {
    const raw = await AsyncStorage.getItem(KEYS.ANALYSES);
    return raw ? JSON.parse(raw) : [];
  },

  async getLatestAnalysis(): Promise<SkinAnalysis | null> {
    const all = await this.getAnalyses();
    return all.length > 0 ? all[0] : null;
  },

  async getScanHistory(): Promise<ScanHistoryEntry[]> {
    const analyses = await this.getAnalyses();
    return analyses.map(a => ({
      id: a.id,
      date: a.date,
      imageUri: a.imageUri,
      overallScore: a.scores.overall,
      scores: a.scores,
    }));
  },

  async isOnboarded(): Promise<boolean> {
    const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
    return val === 'true';
  },

  async setOnboarded(): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
  },

  async getStreak(): Promise<number> {
    const raw = await AsyncStorage.getItem(KEYS.STREAK);
    return raw ? parseInt(raw, 10) : 0;
  },

  async updateStreak(): Promise<number> {
    const today = new Date().toDateString();
    const lastScan = await AsyncStorage.getItem(KEYS.LAST_SCAN_DATE);
    const currentStreak = await this.getStreak();

    if (lastScan === today) return currentStreak; // already scanned today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = lastScan === yesterday.toDateString();

    const newStreak = isConsecutive ? currentStreak + 1 : 1;
    await AsyncStorage.setItem(KEYS.STREAK, String(newStreak));
    await AsyncStorage.setItem(KEYS.LAST_SCAN_DATE, today);
    return newStreak;
  },

  // Routine log
  async logRoutineCompletion(time: 'morning' | 'evening'): Promise<void> {
    const today = new Date().toDateString();
    const raw = await AsyncStorage.getItem(KEYS.ROUTINE_LOG);
    const log: { date: string; morning: boolean; evening: boolean }[] = raw ? JSON.parse(raw) : [];
    const existing = log.find(e => e.date === today);
    if (existing) {
      existing[time] = true;
    } else {
      log.unshift({ date: today, morning: time === 'morning', evening: time === 'evening' });
    }
    // Keep 90 days
    await AsyncStorage.setItem(KEYS.ROUTINE_LOG, JSON.stringify(log.slice(0, 90)));
  },

  async getTodayRoutineLog(): Promise<{ morning: boolean; evening: boolean }> {
    const today = new Date().toDateString();
    const raw = await AsyncStorage.getItem(KEYS.ROUTINE_LOG);
    const log: { date: string; morning: boolean; evening: boolean }[] = raw ? JSON.parse(raw) : [];
    const todayEntry = log.find(e => e.date === today);
    return todayEntry ?? { morning: false, evening: false };
  },

  async getFullRoutineLog(): Promise<{ date: string; morning: boolean; evening: boolean }[]> {
    const raw = await AsyncStorage.getItem(KEYS.ROUTINE_LOG);
    return raw ? JSON.parse(raw) : [];
  },

  async getRoutineStreak(): Promise<number> {
    const raw = await AsyncStorage.getItem(KEYS.ROUTINE_LOG);
    if (!raw) return 0;
    const log: { date: string; morning: boolean; evening: boolean }[] = JSON.parse(raw);
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < log.length; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const entry = log.find(e => e.date === d.toDateString());
      if (entry && (entry.morning || entry.evening)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  },

  // Article reading tracking
  async markArticleRead(slug: string): Promise<void> {
    const raw = await AsyncStorage.getItem(KEYS.ARTICLES_READ);
    const read: string[] = raw ? JSON.parse(raw) : [];
    if (!read.includes(slug)) {
      read.push(slug);
      await AsyncStorage.setItem(KEYS.ARTICLES_READ, JSON.stringify(read));
    }
  },

  async getReadArticles(): Promise<string[]> {
    const raw = await AsyncStorage.getItem(KEYS.ARTICLES_READ);
    return raw ? JSON.parse(raw) : [];
  },

  // Journal
  async getJournal(): Promise<JournalEntry[]> {
    const raw = await AsyncStorage.getItem(KEYS.JOURNAL);
    return raw ? JSON.parse(raw) : [];
  },

  async saveJournalEntry(entry: JournalEntry): Promise<void> {
    const existing = await this.getJournal();
    const updated = [entry, ...existing.filter(e => e.id !== entry.id)].slice(0, 365);
    await AsyncStorage.setItem(KEYS.JOURNAL, JSON.stringify(updated));
  },

  async deleteJournalEntry(id: string): Promise<void> {
    const existing = await this.getJournal();
    await AsyncStorage.setItem(KEYS.JOURNAL, JSON.stringify(existing.filter(e => e.id !== id)));
  },

  async clearAll(): Promise<void> {
    // Clear all gd_ prefixed keys — covers Storage keys plus coach history,
    // daily counters, water, habits, challenges, shelf, guest session, etc.
    const allKeys = await AsyncStorage.getAllKeys();
    const gdKeys = allKeys.filter(k => k.startsWith('gd_'));
    await Promise.all(gdKeys.map(k => AsyncStorage.removeItem(k)));
  },
};
