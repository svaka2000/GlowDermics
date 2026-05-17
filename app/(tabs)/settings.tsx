import { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Alert, Switch, Platform, Linking, Animated, Easing,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import { Auth, AuthUser } from '../../src/services/auth';
import { UserProfile } from '../../src/types';
import { PremiumGate } from '../../src/components/PremiumGate';
import { useColors, useTheme, ThemePreference } from '../../src/state/theme';
import {
  requestNotificationPermission,
  scheduleRoutineReminder,
  cancelNotifications,
  getNotificationSettings,
} from '../../src/services/notifications';

const SKIN_TYPES = ['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive'];
const CONCERNS = ['Acne & Breakouts', 'Dryness', 'Dark Spots', 'Fine Lines', 'Redness', 'Large Pores', 'Dullness', 'Sensitivity'];

export default function Settings() {
  const headerAnim = useRef(new Animated.Value(0)).current;
  const profileAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [skinType, setSkinType] = useState('');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [scanCount, setScanCount] = useState(0);
  const [notifsEnabled, setNotifsEnabled] = useState(false);
  const [notifHour, setNotifHour] = useState(8);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [scanInfo, setScanInfo] = useState<{ used: number; limit: number } | null>(null);

  const { preference, scheme, setPreference, colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const rowStyles = useMemo(() => makeRowStyles(colors), [colors]);
  const appearanceStyles = useMemo(() => makeAppearanceStyles(colors), [colors]);

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
      const p = await Storage.getUserProfile();
      const history = await Storage.getScanHistory();
      const notifSettings = await getNotificationSettings();
      const user = await Auth.getCurrentUser();
      setProfile(p);
      setAuthUser(user);
      setScanCount(history.length);
      setNotifsEnabled(notifSettings.enabled);
      setNotifHour(notifSettings.hour);
      if (p) {
        setName(p.name);
        setSkinType(p.skinType);
        setConcerns(p.primaryConcerns);
      }
      if (user) {
        const info = await Auth.canScan();
        setScanInfo({ used: info.used, limit: info.limit });
      }

      // Entrance animations
      Animated.stagger(90, [
        Animated.timing(headerAnim, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(profileAnim, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(contentAnim, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
      } catch {}
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

  const confirmReset = async () => {
    const doReset = async () => {
      await Storage.clearAll();
      await Auth.logout();
      router.replace('/(auth)/login' as any);
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Reset ALL data? This will delete all scans, progress, and your profile. This cannot be undone.')) {
        await doReset();
      }
    } else {
      Alert.alert(
        'Reset All Data',
        'This will delete all your scans, progress, and profile. This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset Everything', style: 'destructive', onPress: doReset },
        ]
      );
    }
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      await Auth.logout();
      router.replace('/(auth)/login' as any);
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Sign out of GlowDermics?')) await doLogout();
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const toggleConcern = (c: string) => {
    if (concerns.includes(c)) setConcerns(concerns.filter(x => x !== c));
    else if (concerns.length < 3) setConcerns([...concerns, c]);
  };

  return (
    <View style={styles.root}>
      <PremiumGate
        visible={showPremiumGate}
        onClose={async () => {
          setShowPremiumGate(false);
          const user = await Auth.getCurrentUser();
          setAuthUser(user);
        }}
      />
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
        }]}>
          <Text style={styles.headerTitle} numberOfLines={1}>Settings</Text>
        </Animated.View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Profile card */}
        <Animated.View style={[styles.profileCard, {
          opacity: profileAnim,
          transform: [{ translateY: profileAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
        }]}>
          <LinearGradient colors={[colors.primaryLight, colors.primary]} style={styles.avatar}>
            <Text style={styles.avatarText}>{(authUser?.name || profile?.name || '?')[0]?.toUpperCase()}</Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.profileName}>{authUser?.name || profile?.name || '—'}</Text>
              {authUser?.isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={10} color="#fff" />
                  <Text style={styles.premiumBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.profileSub}>{authUser?.email || (profile?.skinType ? profile.skinType.charAt(0).toUpperCase() + profile.skinType.slice(1) + ' Skin' : '—')}</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statNum}>{scanCount}</Text>
            <Text style={styles.statLabel}>Scans</Text>
          </View>
        </Animated.View>

        {/* Premium / auth card */}
        {authUser?.isPremium ? (
          <View style={styles.premiumActiveCard}>
            <LinearGradient colors={['rgba(22,163,74,0.1)', 'rgba(22,163,74,0.05)']} style={StyleSheet.absoluteFill} />
            <View style={[styles.premiumCardIcon, { backgroundColor: '#16A34A' }]}>
              <Ionicons name="checkmark" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.premiumCardTitle, { color: '#16A34A' }]}>Premium Active</Text>
              <Text style={styles.premiumCardSub}>Unlimited scans, full AI coach access</Text>
            </View>
          </View>
        ) : (
          <Pressable style={styles.premiumCard} onPress={() => setShowPremiumGate(true)}>
            <LinearGradient colors={['#F0C94A', '#D4A96A', '#C4622D']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={styles.premiumCardIcon}>
              <Ionicons name="star" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumCardTitle}>Upgrade to Premium</Text>
              <Text style={styles.premiumCardSub}>
                {scanInfo ? `${scanInfo.used}/${scanInfo.limit} scans used · ` : ''}Unlimited scans, AI coach & more
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.85)" />
          </Pressable>
        )}

        {/* Edit Profile */}
        <Animated.View style={{ opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
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
                placeholderTextColor={colors.textMuted}
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

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            <View style={[rowStyles.wrap, rowStyles.border]}>
              <Ionicons
                name={scheme === 'dark' ? 'moon' : 'sunny'}
                size={16}
                color={colors.primary}
                style={{ marginRight: 10 }}
              />
              <Text style={[rowStyles.label, { color: colors.textSecondary, flex: 1 }]}>
                Theme
              </Text>
              <Text style={appearanceStyles.activeLabel}>
                {preference === 'system'
                  ? `Auto · ${scheme === 'dark' ? 'Dark' : 'Light'}`
                  : preference === 'dark'
                  ? 'Dark'
                  : 'Light'}
              </Text>
            </View>
            <View style={appearanceStyles.toggleRow}>
              {(['system', 'light', 'dark'] as ThemePreference[]).map(p => {
                const active = preference === p;
                return (
                  <Pressable
                    key={p}
                    style={[appearanceStyles.toggleBtn, active && appearanceStyles.toggleBtnActive]}
                    onPress={() => setPreference(p)}
                  >
                    <Ionicons
                      name={
                        p === 'system'
                          ? 'phone-portrait-outline'
                          : p === 'light'
                          ? 'sunny-outline'
                          : 'moon-outline'
                      }
                      size={14}
                      color={active ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text style={[appearanceStyles.toggleText, active && appearanceStyles.toggleTextActive]}>
                      {p === 'system' ? 'Auto' : p === 'light' ? 'Light' : 'Dark'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={appearanceStyles.helperText}>
              {preference === 'system'
                ? 'Follows your device setting. Toggle anytime.'
                : preference === 'dark'
                ? 'Warm marble inverted — night-friendly skincare reading.'
                : 'Warm marble — the original GlowDermics palette.'}
            </Text>
          </View>
        </View>

        {/* Notifications */}
        {Platform.OS !== 'web' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.card}>
              <View style={[rowStyles.wrap, rowStyles.border]}>
                <Ionicons name="notifications-outline" size={16} color={colors.primary} style={{ marginRight: 10 }} />
                <Text style={[rowStyles.label, { color: colors.textSecondary, flex: 1 }]}>Daily Scan Reminder</Text>
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
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={'#FFFFFF'}
                />
              </View>
              {notifsEnabled && (
                <View style={rowStyles.wrap}>
                  <Ionicons name="time-outline" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
                  <Text style={[rowStyles.label, { color: colors.textSecondary, flex: 1 }]}>Reminder time</Text>
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
            <Row label="Powered by" value="GlowDermics AI" />
            <Row label="Brand" value="TallowDermics™" />
            <LinkRow icon="lock-closed-outline" label="Privacy Policy" onPress={() => router.push('/privacy')} last />
          </View>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TallowDermics</Text>
          <View style={styles.card}>
            <LinkRow icon="globe-outline" label="Visit tallowdermics.com" onPress={() => {
              if (Platform.OS === 'web') window.open('https://tallowdermics.com', '_blank');
              else Linking.openURL('https://tallowdermics.com');
            }} />
            <LinkRow icon="leaf-outline" label="The Formula — 4 Ingredients" onPress={() => router.push('/product')} />
            <LinkRow icon="book-outline" label="The Journal" onPress={() => router.push('/journal')} last />
          </View>
        </View>

        {/* Skin DNA featured card */}
        <Pressable style={styles.dnaCard} onPress={() => router.push('/skin-dna')}>
          <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
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
            <LinkRow icon="images-outline" label="Skin Photo Gallery" onPress={() => router.push('/scan-gallery')} />
            <LinkRow icon="bar-chart-outline" label="Compare Scans" onPress={() => router.push('/compare')} />
            <LinkRow icon="sparkles-outline" label="90-Day Skin Forecast" onPress={() => router.push('/forecast')} />
            <LinkRow icon="git-network-outline" label="Ingredient Conflict Checker" onPress={() => router.push('/ingredient-check')} />
            <LinkRow icon="shield-checkmark-outline" label="Sensitivity Test" onPress={() => router.push('/sensitivity')} />
            <LinkRow icon="calculator-outline" label="Budget Calculator" onPress={() => router.push('/budget')} />
            <LinkRow icon="body-outline" label="Skin Age Estimator" onPress={() => router.push('/skin-age')} />
            <LinkRow icon="construct-outline" label="Routine Builder" onPress={() => router.push('/routine-builder')} />
            <LinkRow icon="ban-outline" label="Ingredient Blacklist" onPress={() => router.push('/blacklist')} />
            <LinkRow icon="layers-outline" label="My Product Deck" onPress={() => router.push('/product-deck')} last />
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
            <LinkRow icon="book-outline" label="My Skin Story" onPress={() => router.push('/skin-story')} />
            <LinkRow icon="stats-chart-outline" label="Stress & Trigger Log" onPress={() => router.push('/stress-log')} />
            <LinkRow icon="medical-outline" label="Acne Diary" onPress={() => router.push('/acne-diary')} />
            <LinkRow icon="moon-outline" label="Sleep Tracker" onPress={() => router.push('/sleep-log')} />
            <LinkRow icon="water-outline" label="Hydration Tracker" onPress={() => router.push('/hydration')} />
            <LinkRow icon="rose-outline" label="Hormonal Skin Log" onPress={() => router.push('/hormonal-log')} />
            <LinkRow icon="sunny-outline" label="UV & Sun Log" onPress={() => router.push('/uv-log')} />
            <LinkRow icon="flask-outline" label="Patch Test Tracker" onPress={() => router.push('/patch-test')} />
            <LinkRow icon="alarm-outline" label="Product Expiry Tracker" onPress={() => router.push('/expiry-tracker')} />
            <LinkRow icon="leaf-outline" label="Environment Log" onPress={() => router.push('/environment-log')} />
            <LinkRow icon="book-outline" label="Skin Journal" onPress={() => router.push('/skin-journal')} />
            <LinkRow icon="checkmark-circle-outline" label="Routine Checklist" onPress={() => router.push('/morning-checklist')} last />
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
            <LinkRow icon="restaurant-outline" label="Diet for Skin" onPress={() => router.push('/diet')} />
            <LinkRow icon="bulb-outline" label="Skin IQ Quiz" onPress={() => router.push('/skin-iq')} />
            <LinkRow icon="fitness-outline" label="Supplement Guide" onPress={() => router.push('/supplements')} />
            <LinkRow icon="hand-left-outline" label="Guided Facial" onPress={() => router.push('/guided-facial')} />
            <LinkRow icon="partly-sunny-outline" label="Skin Weather Report" onPress={() => router.push('/skin-weather')} />
            <LinkRow icon="chatbubble-ellipses-outline" label="Glow Coach — AI Chat" onPress={() => router.push('/coach-chat')} />
            <LinkRow icon="water-outline" label="Gua Sha Guide" onPress={() => router.push('/gua-sha')} />
            <LinkRow icon="flask-outline" label="DIY Tallow Recipes" onPress={() => router.push('/diy-recipes')} />
            <LinkRow icon="book-outline" label="Skin Glossary" onPress={() => router.push('/glossary')} />
            <LinkRow icon="trophy-outline" label="Baumann Skin Type Test" onPress={() => router.push('/baumann-test')} />
            <LinkRow icon="document-text-outline" label="Monthly Skin Report" onPress={() => router.push('/skin-report')} />
            <LinkRow icon="shield-outline" label="Barrier Health Quiz" onPress={() => router.push('/barrier-quiz')} />
            <LinkRow icon="airplane-outline" label="Travel Skin Planner" onPress={() => router.push('/travel-planner')} />
            <LinkRow icon="restaurant-outline" label="Face Food Guide" onPress={() => router.push('/face-food')} />
            <LinkRow icon="sync-outline" label="Active Rotation Schedule" onPress={() => router.push('/active-rotation')} />
            <LinkRow icon="search-outline" label="Label Reading Guide" onPress={() => router.push('/label-guide')} />
            <LinkRow icon="flask-outline" label="The Science of Tallow" onPress={() => router.push('/tallow-science')} />
            <LinkRow icon="leaf-outline" label="Minimal Routine Builder" onPress={() => router.push('/minimal-routine')} />
            <LinkRow icon="water-outline" label="Skin Detox Protocols" onPress={() => router.push('/skin-detox')} />
            <LinkRow icon="radio-button-off-outline" label="Pore Guide" onPress={() => router.push('/pore-guide')} />
            <LinkRow icon="water-outline" label="Water Quality & Skin" onPress={() => router.push('/water-quality')} />
            <LinkRow icon="map-outline" label="Face Mapping" onPress={() => router.push('/face-mapping')} />
            <LinkRow icon="bug-outline" label="Skin Microbiome Guide" onPress={() => router.push('/microbiome')} />
            <LinkRow icon="repeat-outline" label="Skin Cycling Tracker" onPress={() => router.push('/skin-cycling')} />
            <LinkRow icon="grid-outline" label="My Product Shelf" onPress={() => router.push('/product-shelf')} />
            <LinkRow icon="snow-outline" label="Cold Therapy" onPress={() => router.push('/cold-therapy')} />
            <LinkRow icon="body-outline" label="Facial Yoga" onPress={() => router.push('/facial-yoga')} />
            <LinkRow icon="flask-outline" label="Facial Oil Guide" onPress={() => router.push('/oil-guide')} />
            <LinkRow icon="moon-outline" label="Hormonal Acne Guide" onPress={() => router.push('/hormonal-acne')} />
            <LinkRow icon="flash-outline" label="Speed Routines" onPress={() => router.push('/speed-routine')} />
            <LinkRow icon="sunny-outline" label="Complete SPF Guide" onPress={() => router.push('/spf-guide')} />
            <LinkRow icon="rose-outline" label="Rosacea Guide" onPress={() => router.push('/rosacea-guide')} />
            <LinkRow icon="timer-outline" label="Anti-Aging Protocol" onPress={() => router.push('/anti-aging')} />
            <LinkRow icon="color-filter-outline" label="Hyperpigmentation Guide" onPress={() => router.push('/hyperpigmentation')} />
            <LinkRow icon="git-compare-outline" label="Ingredient Conflicts" onPress={() => router.push('/ingredient-conflicts')} />
            <LinkRow icon="water-outline" label="Eczema Guide" onPress={() => router.push('/eczema-guide')} />
            <LinkRow icon="medical-outline" label="Acne Types Guide" onPress={() => router.push('/acne-types')} />
            <LinkRow icon="sparkles-outline" label="Retinol Guide" onPress={() => router.push('/retinol-guide')} />
            <LinkRow icon="help-circle-outline" label="Purging vs Breakout" onPress={() => router.push('/purging-guide')} />
            <LinkRow icon="shield-outline" label="Barrier Repair Guide" onPress={() => router.push('/barrier-repair')} />
            <LinkRow icon="moon-outline" label="Sleep & Skin Science" onPress={() => router.push('/sleep-skin')} />
            <LinkRow icon="sunny-outline" label="Vitamin C Guide" onPress={() => router.push('/vitamin-c')} />
            <LinkRow icon="flask-outline" label="Niacinamide Guide" onPress={() => router.push('/niacinamide')} />
            <LinkRow icon="layers-outline" label="Exfoliation Guide" onPress={() => router.push('/exfoliation')} />
            <LinkRow icon="link-outline" label="Peptide Guide" onPress={() => router.push('/peptides')} />
            <LinkRow icon="water-outline" label="Hyaluronic Acid Guide" onPress={() => router.push('/hyaluronic-acid')} />
            <LinkRow icon="rainy-outline" label="Dry vs Dehydrated Skin" onPress={() => router.push('/dehydrated-skin')} />
            <LinkRow icon="flask-outline" label="Cleansing Science Guide" onPress={() => router.push('/cleansing-guide')} />
            <LinkRow icon="body-outline" label="Body Care Guide" onPress={() => router.push('/body-care')} />
            <LinkRow icon="sunny-outline" label="Photodamage & UV Aging" onPress={() => router.push('/photodamage')} />
            <LinkRow icon="restaurant-outline" label="Foods for Skin" onPress={() => router.push('/skin-foods')} />
            <LinkRow icon="bug-outline" label="Gut-Skin Axis" onPress={() => router.push('/gut-skin')} />
            <LinkRow icon="shield-outline" label="Antioxidant Guide" onPress={() => router.push('/antioxidants')} />
            <LinkRow icon="build-outline" label="Collagen Science" onPress={() => router.push('/collagen-guide')} />
            <LinkRow icon="fitness-outline" label="Exercise & Skin" onPress={() => router.push('/exercise-skin')} />
            <LinkRow icon="flask-outline" label="Zinc for Skin" onPress={() => router.push('/zinc-guide')} />
            <LinkRow icon="water-outline" label="Essential Fatty Acids" onPress={() => router.push('/efa-guide')} />
            <LinkRow icon="heart-outline" label="Pregnancy-Safe Skincare" onPress={() => router.push('/pregnancy-skin')} />
            <LinkRow icon="time-outline" label="Skin Aging Timeline" onPress={() => router.push('/aging-timeline')} />
            <LinkRow icon="person-outline" label="Men's Skin Guide" onPress={() => router.push('/mens-skin')} last />
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {authUser ? (
            <>
              <View style={styles.card}>
                <Row label="Email" value={authUser.email} />
                <Row label="Member since" value={new Date(authUser.createdAt).toLocaleDateString()} last />
              </View>
              <Pressable style={[styles.dangerBtn, { marginTop: 12 }]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={18} color={colors.scorePoor} />
                <Text style={styles.dangerText}>Sign Out</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.card}>
                <Row label="Status" value="Guest session" last />
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <Pressable style={styles.signInBtn} onPress={() => router.push('/(auth)/login' as any)}>
                  <Ionicons name="person-outline" size={16} color={colors.primary} />
                  <Text style={styles.signInBtnText}>Sign In</Text>
                </Pressable>
                <Pressable style={[styles.signInBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/(auth)/register' as any)}>
                  <Ionicons name="sparkles-outline" size={16} color="#fff" />
                  <Text style={[styles.signInBtnText, { color: '#fff' }]}>Create Account</Text>
                </Pressable>
              </View>
              <Pressable style={[styles.dangerBtn, { marginTop: 10 }]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={18} color={colors.scorePoor} />
                <Text style={styles.dangerText}>Leave Guest Session</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* TallowDermics promo */}
        <Pressable
          style={styles.tdPromoCard}
          onPress={() => {
            if (Platform.OS === 'web') {
              window.open('https://tallowdermics.com', '_blank');
            } else {
              const { Linking } = require('react-native');
              Linking.openURL('https://tallowdermics.com');
            }
          }}
        >
          <View style={styles.tdPromoLeft}>
            <Text style={styles.tdPromoEyebrow}>MADE BY THE SAME TEAM</Text>
            <Text style={styles.tdPromoHeading}>TallowDermics</Text>
            <Text style={styles.tdPromoSub}>Ancestral skincare. Grass-fed tallow, five clean ingredients. The product that inspired this app.</Text>
            <View style={styles.tdPromoBtn}>
              <Text style={styles.tdPromoBtnText}>Shop the Balm</Text>
              <Ionicons name="arrow-forward" size={12} color="#C4622D" />
            </View>
          </View>
          <Text style={styles.tdPromoEmoji}>🌿</Text>
        </Pressable>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.scorePoor }]}>Data</Text>
          <Pressable style={styles.dangerBtn} onPress={confirmReset}>
            <Ionicons name="trash-outline" size={18} color={colors.scorePoor} />
            <Text style={styles.dangerText}>Reset All Data</Text>
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  const colors = useColors();
  const rowStyles = useMemo(() => makeRowStyles(colors), [colors]);
  return (
    <View style={[rowStyles.wrap, !last && rowStyles.border]}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

function LinkRow({ icon, label, last = false, onPress }: { icon: any; label: string; last?: boolean; onPress?: () => void }) {
  const colors = useColors();
  const rowStyles = useMemo(() => makeRowStyles(colors), [colors]);
  return (
    <Pressable style={[rowStyles.wrap, !last && rowStyles.border]} onPress={onPress}>
      <Ionicons name={icon} size={16} color={colors.primary} style={{ marginRight: 10 }} />
      <Text style={[rowStyles.label, { color: colors.textSecondary, flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
    </Pressable>
  );
}

function makeRowStyles(c: Palette) {
  return StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
    border: { borderBottomWidth: 1, borderBottomColor: c.border },
    label: { fontSize: 14, color: c.textMuted, width: 100 },
    value: { fontSize: 14, color: c.textPrimary, fontWeight: '500', flex: 1, textAlign: 'right' },
  });
}

function makeAppearanceStyles(c: Palette) {
  return StyleSheet.create({
    activeLabel: { fontSize: 13, fontWeight: '700', color: c.primary, letterSpacing: 0.2 },
    toggleRow: {
      flexDirection: 'row',
      gap: 8,
      paddingTop: 12,
      paddingBottom: 4,
    },
    toggleBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: c.primary + '0F',
      borderWidth: 1,
      borderColor: c.primary + '30',
    },
    toggleBtnActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
      shadowColor: c.primary,
      shadowOpacity: 0.30,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    toggleText: { fontSize: 12, fontWeight: '800', color: c.textSecondary, letterSpacing: 0.2 },
    toggleTextActive: { color: '#FFFFFF' },
    helperText: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 10,
      fontWeight: '500',
      lineHeight: 16,
    },
  });
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: c.textPrimary },
    scroll: { paddingHorizontal: 16 },
    profileCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: c.bgCard, borderRadius: 18,
      borderWidth: 1, borderColor: c.border, padding: 18, marginBottom: 24,
    },
    avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
    profileSub: { fontSize: 13, color: c.textMuted, marginTop: 2 },
    statBadge: { alignItems: 'center' },
    statNum: { fontSize: 22, fontWeight: '800', color: c.primary },
    statLabel: { fontSize: 10, color: c.textMuted, fontWeight: '600', letterSpacing: 0.5 },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary, marginBottom: 10 },
    editBtn: { fontSize: 14, fontWeight: '600', color: c.primary },
    card: {
      backgroundColor: c.bgCard, borderRadius: 16,
      borderWidth: 1, borderColor: c.border, paddingHorizontal: 16,
    },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: c.textMuted, letterSpacing: 0.5, marginBottom: 8 },
    input: {
      backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15, color: c.textPrimary,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated,
    },
    chipActive: { borderColor: c.primary, backgroundColor: c.primary + '26' },
    chipText: { fontSize: 13, color: c.textSecondary },
    chipTextActive: { color: c.primary, fontWeight: '600' },
    hourPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    hourBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated },
    hourBtnActive: { borderColor: c.primary, backgroundColor: c.primary + '26' },
    hourText: { fontSize: 12, color: c.textMuted, fontWeight: '500' },
    hourTextActive: { color: c.primary, fontWeight: '700' },
    signInBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: c.primary + '14', borderRadius: 14,
      borderWidth: 1, borderColor: c.borderStrong, padding: 14,
    },
    signInBtnText: { fontSize: 14, fontWeight: '700', color: c.primary },
    dangerBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: 'rgba(248,113,113,0.08)', borderRadius: 14,
      borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)', padding: 16,
    },
    dangerText: { fontSize: 15, fontWeight: '600', color: c.scorePoor },
    dnaCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderRadius: 18, overflow: 'hidden', padding: 18, marginBottom: 24,
    },
    dnaEmoji: { fontSize: 28 },
    dnaTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
    dnaSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    premiumBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      backgroundColor: c.primary, borderRadius: 6,
      paddingHorizontal: 6, paddingVertical: 2,
    },
    premiumBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
    premiumCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderRadius: 18, overflow: 'hidden', padding: 18, marginBottom: 24,
    },
    premiumActiveCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderRadius: 18, overflow: 'hidden', padding: 18, marginBottom: 24,
      borderWidth: 1, borderColor: 'rgba(22,163,74,0.25)',
    },
    tdPromoCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: '#FDF6EC', borderRadius: 18,
      borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)',
      padding: 20, marginBottom: 24,
    },
    tdPromoLeft: { flex: 1, paddingRight: 12 },
    tdPromoEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: '#C4622D', textTransform: 'uppercase', marginBottom: 4 },
    tdPromoHeading: { fontSize: 18, fontWeight: '800', color: '#3B1F0E', marginBottom: 6 },
    tdPromoSub: { fontSize: 12, lineHeight: 17, color: 'rgba(59,31,14,0.6)', marginBottom: 12 },
    tdPromoBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    tdPromoBtnText: { fontSize: 12, fontWeight: '700', color: '#C4622D', textDecorationLine: 'underline' },
    tdPromoEmoji: { fontSize: 36 },
    premiumCardIcon: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center', justifyContent: 'center',
    },
    premiumCardTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
    premiumCardSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  });
}
