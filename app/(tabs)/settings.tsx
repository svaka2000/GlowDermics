import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Alert, Switch, Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import { UserProfile } from '../../src/types';
import {
  requestNotificationPermission,
  scheduleRoutineReminder,
  cancelNotifications,
  getNotificationSettings,
} from '../../src/services/notifications';

const SKIN_TYPES = ['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive'];
const CONCERNS = ['Acne & Breakouts', 'Dryness', 'Dark Spots', 'Fine Lines', 'Redness', 'Large Pores', 'Dullness', 'Sensitivity'];

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [skinType, setSkinType] = useState('');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [scanCount, setScanCount] = useState(0);
  const [notifsEnabled, setNotifsEnabled] = useState(false);
  const [notifHour, setNotifHour] = useState(8);

  useFocusEffect(useCallback(() => {
    (async () => {
      const p = await Storage.getUserProfile();
      const history = await Storage.getScanHistory();
      const notifSettings = await getNotificationSettings();
      setProfile(p);
      setScanCount(history.length);
      setNotifsEnabled(notifSettings.enabled);
      setNotifHour(notifSettings.hour);
      if (p) {
        setName(p.name);
        setSkinType(p.skinType);
        setConcerns(p.primaryConcerns);
      }
    })();
  }, []));

  const saveProfile = async () => {
    if (!profile || !name.trim()) return;
    const updated: UserProfile = {
      ...profile,
      name: name.trim(),
      skinType: skinType.toLowerCase(),
      primaryConcerns: concerns,
    };
    await Storage.saveUserProfile(updated);
    setProfile(updated);
    setEditing(false);
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your scans, progress, and profile. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await Storage.clearAll();
            router.replace('/(auth)/onboarding');
          },
        },
      ]
    );
  };

  const toggleConcern = (c: string) => {
    if (concerns.includes(c)) setConcerns(concerns.filter(x => x !== c));
    else if (concerns.length < 3) setConcerns([...concerns, c]);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.name?.[0]?.toUpperCase() || '?'}</Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.name || '—'}</Text>
            <Text style={styles.profileSub}>{profile?.skinType ? profile.skinType.charAt(0).toUpperCase() + profile.skinType.slice(1) + ' Skin' : '—'}</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statNum}>{scanCount}</Text>
            <Text style={styles.statLabel}>Scans</Text>
          </View>
        </View>

        {/* Edit Profile */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <Pressable onPress={() => editing ? saveProfile() : setEditing(true)}>
              <Text style={styles.editBtn}>{editing ? 'Save' : 'Edit'}</Text>
            </Pressable>
          </View>

          {editing ? (
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholderTextColor={Colors.textMuted}
                placeholder="Your name"
              />
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Skin Type</Text>
              <View style={styles.chipRow}>
                {SKIN_TYPES.map(t => (
                  <Pressable
                    key={t}
                    style={[styles.chip, skinType === t.toLowerCase() && styles.chipActive]}
                    onPress={() => setSkinType(t.toLowerCase())}
                  >
                    <Text style={[styles.chipText, skinType === t.toLowerCase() && styles.chipTextActive]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Concerns (up to 3)</Text>
              <View style={styles.chipRow}>
                {CONCERNS.map(c => (
                  <Pressable
                    key={c}
                    style={[styles.chip, concerns.includes(c) && styles.chipActive]}
                    onPress={() => toggleConcern(c)}
                  >
                    <Text style={[styles.chipText, concerns.includes(c) && styles.chipTextActive]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <Row label="Name" value={profile?.name || '—'} />
              <Row label="Skin Type" value={profile?.skinType ? profile.skinType.charAt(0).toUpperCase() + profile.skinType.slice(1) : '—'} />
              <Row label="Concerns" value={profile?.primaryConcerns?.join(', ') || '—'} last />
            </View>
          )}
        </View>

        {/* Notifications */}
        {Platform.OS !== 'web' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.card}>
              <View style={[rowStyles.wrap, rowStyles.border]}>
                <Ionicons name="notifications-outline" size={16} color={Colors.primary} style={{ marginRight: 10 }} />
                <Text style={[rowStyles.label, { color: Colors.textSecondary, flex: 1 }]}>Daily Scan Reminder</Text>
                <Switch
                  value={notifsEnabled}
                  onValueChange={async (val) => {
                    if (val) {
                      const granted = await requestNotificationPermission();
                      if (!granted) {
                        Alert.alert('Permission Required', 'Enable notifications in your device settings to receive daily reminders.');
                        return;
                      }
                      await scheduleRoutineReminder(notifHour);
                      setNotifsEnabled(true);
                    } else {
                      await cancelNotifications();
                      setNotifsEnabled(false);
                    }
                  }}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
              {notifsEnabled && (
                <View style={rowStyles.wrap}>
                  <Ionicons name="time-outline" size={16} color={Colors.textMuted} style={{ marginRight: 10 }} />
                  <Text style={[rowStyles.label, { color: Colors.textSecondary, flex: 1 }]}>Reminder time</Text>
                  <View style={styles.hourPicker}>
                    {[7, 8, 9, 12, 18, 20].map(h => (
                      <Pressable
                        key={h}
                        style={[styles.hourBtn, notifHour === h && styles.hourBtnActive]}
                        onPress={async () => {
                          setNotifHour(h);
                          await scheduleRoutineReminder(h);
                        }}
                      >
                        <Text style={[styles.hourText, notifHour === h && styles.hourTextActive]}>
                          {h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <Row label="App" value="GlowDermics" />
            <Row label="Version" value="1.0.0" />
            <Row label="Powered by" value="Groq AI + Llama 4" />
            <Row label="Brand" value="TallowDermics™" />
            <LinkRow icon="lock-closed-outline" label="Privacy Policy" onPress={() => router.push('/privacy')} last />
          </View>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TallowDermics</Text>
          <View style={styles.card}>
            <LinkRow icon="globe-outline" label="Visit trytallowdermics.com" />
            <LinkRow icon="leaf-outline" label="The Formula — 4 Ingredients" onPress={() => router.push('/product')} />
            <LinkRow icon="book-outline" label="The Journal" last />
          </View>
        </View>

        {/* Skin DNA featured card */}
        <Pressable style={styles.dnaCard} onPress={() => router.push('/skin-dna')}>
          <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Text style={styles.dnaEmoji}>🧬</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.dnaTitle}>My Skin DNA</Text>
            <Text style={styles.dnaSub}>Your AI-generated skin identity profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis Tools</Text>
          <View style={styles.card}>
            <LinkRow icon="flask-outline" label="Ingredient Scanner" onPress={() => router.push('/scanner')} />
            <LinkRow icon="cash-outline" label="Dupe Finder" onPress={() => router.push('/dupes')} />
            <LinkRow icon="git-compare-outline" label="Routine Analyzer" onPress={() => router.push('/routine-analyzer')} />
            <LinkRow icon="analytics-outline" label="AI Trend Report" onPress={() => router.push('/report')} />
            <LinkRow icon="bar-chart-outline" label="Compare Scans" onPress={() => router.push('/compare')} />
            <LinkRow icon="sparkles-outline" label="90-Day Skin Forecast" onPress={() => router.push('/forecast')} />
            <LinkRow icon="git-network-outline" label="Ingredient Conflict Checker" onPress={() => router.push('/ingredient-check')} />
            <LinkRow icon="shield-checkmark-outline" label="Sensitivity Test" onPress={() => router.push('/sensitivity')} />
            <LinkRow icon="calculator-outline" label="Budget Calculator" onPress={() => router.push('/budget')} />
            <LinkRow icon="body-outline" label="Skin Age Estimator" onPress={() => router.push('/skin-age')} />
            <LinkRow icon="construct-outline" label="Routine Builder" onPress={() => router.push('/routine-builder')} />
            <LinkRow icon="ban-outline" label="Ingredient Blacklist" onPress={() => router.push('/blacklist')} last />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tracking</Text>
          <View style={styles.card}>
            <LinkRow icon="flag-outline" label="Skin Goals" onPress={() => router.push('/goals')} />
            <LinkRow icon="journal-outline" label="Skin Journal" onPress={() => router.push('/journal')} />
            <LinkRow icon="checkmark-done-outline" label="Daily Habits Tracker" onPress={() => router.push('/habits')} />
            <LinkRow icon="cube-outline" label="My Product Shelf" onPress={() => router.push('/products')} />
            <LinkRow icon="trophy-outline" label="Milestones" onPress={() => router.push('/milestones')} />
            <LinkRow icon="calendar-outline" label="Skin Calendar" onPress={() => router.push('/calendar')} />
            <LinkRow icon="newspaper-outline" label="Weekly Digest" onPress={() => router.push('/weekly-digest')} />
            <LinkRow icon="flash-outline" label="30-Day Challenges" onPress={() => router.push('/challenge')} />
            <LinkRow icon="book-outline" label="My Skin Story" onPress={() => router.push('/skin-story')} last />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learn</Text>
          <View style={styles.card}>
            <LinkRow icon="book-outline" label="Skin Lab — Articles" onPress={() => router.push('/learn')} />
            <LinkRow icon="search-outline" label="Ingredient Decoder" onPress={() => router.push('/ingredient')} />
            <LinkRow icon="person-circle-outline" label="Skin Type Guides" onPress={() => router.push('/skin-type')} />
            <LinkRow icon="help-circle-outline" label="Skin Type Quiz" onPress={() => router.push('/quiz')} />
            <LinkRow icon="sunny-outline" label="Seasonal Skin Guide" onPress={() => router.push('/seasonal')} />
            <LinkRow icon="restaurant-outline" label="Diet for Skin" onPress={() => router.push('/diet')} last />
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.scorePoor }]}>Data</Text>
          <Pressable style={styles.dangerBtn} onPress={confirmReset}>
            <Ionicons name="trash-outline" size={18} color={Colors.scorePoor} />
            <Text style={styles.dangerText}>Reset All Data</Text>
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[rowStyles.wrap, !last && rowStyles.border]}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

function LinkRow({ icon, label, last = false, onPress }: { icon: any; label: string; last?: boolean; onPress?: () => void }) {
  return (
    <Pressable style={[rowStyles.wrap, !last && rowStyles.border]} onPress={onPress}>
      <Ionicons name={icon} size={16} color={Colors.primary} style={{ marginRight: 10 }} />
      <Text style={[rowStyles.label, { color: Colors.textSecondary, flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { fontSize: 14, color: Colors.textMuted, width: 100 },
  value: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500', flex: 1, textAlign: 'right' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  scroll: { paddingHorizontal: 16 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border, padding: 18, marginBottom: 24,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: Colors.white },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  profileSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  statBadge: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  editBtn: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16,
  },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 8 },
  input: {
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.textPrimary,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: 'rgba(196,98,45,0.15)' },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
  hourPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  hourBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated },
  hourBtnActive: { borderColor: Colors.primary, backgroundColor: 'rgba(196,98,45,0.15)' },
  hourText: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  hourTextActive: { color: Colors.primary, fontWeight: '700' },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(248,113,113,0.08)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)', padding: 16,
  },
  dangerText: { fontSize: 15, fontWeight: '600', color: Colors.scorePoor },
  dnaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, overflow: 'hidden', padding: 18, marginBottom: 24,
  },
  dnaEmoji: { fontSize: 28 },
  dnaTitle: { fontSize: 17, fontWeight: '800', color: Colors.white },
  dnaSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
});
