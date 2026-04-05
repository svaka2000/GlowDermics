import AsyncStorage from '@react-native-async-storage/async-storage';
import { SkinAnalysis, UserProfile, ScanHistoryEntry } from '../types';

const KEYS = {
  USER_PROFILE: 'gd_user_profile',
  SCAN_HISTORY: 'gd_scan_history',
  ANALYSES: 'gd_analyses',
  ONBOARDED: 'gd_onboarded',
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

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};
