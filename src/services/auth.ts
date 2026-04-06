import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  isPremium: boolean;
  premiumSince?: string;
  createdAt: string;
  // scan usage tracking for free tier
  scanCount: number;
  scanMonthKey: string; // 'YYYY-MM'
}

const KEYS = {
  USERS: 'gd_auth_users_v1',
  SESSION: 'gd_auth_session_v1',
};

// Very simple hash — this is a local app, no server transmission
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

async function getUsers(): Promise<AuthUser[]> {
  const raw = await AsyncStorage.getItem(KEYS.USERS);
  return raw ? JSON.parse(raw) : [];
}

async function saveUsers(users: AuthUser[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

export const Auth = {
  async register(name: string, email: string, password: string): Promise<AuthUser> {
    const users = await getUsers();
    const emailLower = email.toLowerCase().trim();

    if (users.find(u => u.email === emailLower)) {
      throw new Error('An account with this email already exists.');
    }

    const user: AuthUser = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      email: emailLower,
      name: name.trim(),
      passwordHash: simpleHash(password),
      isPremium: false,
      createdAt: new Date().toISOString(),
      scanCount: 0,
      scanMonthKey: new Date().toISOString().slice(0, 7),
    };

    await saveUsers([...users, user]);
    await AsyncStorage.setItem(KEYS.SESSION, user.id);
    return user;
  },

  async login(email: string, password: string): Promise<AuthUser> {
    const users = await getUsers();
    const emailLower = email.toLowerCase().trim();
    const user = users.find(u => u.email === emailLower);

    if (!user) throw new Error('No account found with this email.');
    if (user.passwordHash !== simpleHash(password)) throw new Error('Incorrect password.');

    await AsyncStorage.setItem(KEYS.SESSION, user.id);
    return user;
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.SESSION);
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const id = await AsyncStorage.getItem(KEYS.SESSION);
    if (!id) return null;
    const users = await getUsers();
    return users.find(u => u.id === id) ?? null;
  },

  async isLoggedIn(): Promise<boolean> {
    const id = await AsyncStorage.getItem(KEYS.SESSION);
    return !!id;
  },

  async updateUser(updates: Partial<AuthUser>): Promise<AuthUser> {
    const id = await AsyncStorage.getItem(KEYS.SESSION);
    if (!id) throw new Error('Not logged in');
    const users = await getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    users[idx] = { ...users[idx], ...updates };
    await saveUsers(users);
    return users[idx];
  },

  async activatePremium(): Promise<void> {
    await this.updateUser({ isPremium: true, premiumSince: new Date().toISOString() });
  },

  async cancelPremium(): Promise<void> {
    await this.updateUser({ isPremium: false });
  },

  // Check & track scan usage for free tier (3 scans/month)
  async canScan(): Promise<{ allowed: boolean; used: number; limit: number }> {
    const user = await this.getCurrentUser();
    if (!user) return { allowed: false, used: 0, limit: 3 };
    if (user.isPremium) return { allowed: true, used: 0, limit: Infinity };

    const currentMonth = new Date().toISOString().slice(0, 7);
    const count = user.scanMonthKey === currentMonth ? user.scanCount : 0;
    return { allowed: count < 3, used: count, limit: 3 };
  },

  async recordScan(): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) return;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const count = user.scanMonthKey === currentMonth ? user.scanCount + 1 : 1;
    await this.updateUser({ scanCount: count, scanMonthKey: currentMonth });
  },
};
