import { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/colors';

const DIARY_KEY = 'gd_acne_diary';

type DiaryEntry = {
  date: string;
  count: number;
  zones: string[];
  types: string[];
};

const ZONES = [
  { key: 'forehead', label: 'Forehead', emoji: '⬆️', meaning: 'Digestive/hair products' },
  { key: 'chin', label: 'Chin', emoji: '⬇️', meaning: 'Hormonal' },
  { key: 'left_cheek', label: 'Left Cheek', emoji: '◀️', meaning: 'Digestion / phone contact' },
  { key: 'right_cheek', label: 'Right Cheek', emoji: '▶️', meaning: 'Lungs / phone contact' },
  { key: 'nose', label: 'Nose', emoji: '🔴', meaning: 'Cardiovascular / congestion' },
  { key: 'jawline', label: 'Jawline', emoji: '🫦', meaning: 'Hormonal / stress' },
  { key: 'neck', label: 'Neck', emoji: '📍', meaning: 'Hormonal / sweating' },
  { key: 't_zone', label: 'T-Zone', emoji: '🅃', meaning: 'Oiliness / stress' },
];

const TYPES = [
  { key: 'whitehead', label: 'Whiteheads', emoji: '⚪' },
  { key: 'blackhead', label: 'Blackheads', emoji: '⚫' },
  { key: 'papule', label: 'Red Bumps', emoji: '🔴' },
  { key: 'cystic', label: 'Cystic / Deep', emoji: '🔵' },
  { key: 'blind', label: 'Blind Pimples', emoji: '🟡' },
];

const ZONE_TIPS: Record<string, string> = {
  chin: 'Chin breakouts often signal hormonal fluctuations. Track your cycle, reduce dairy, and consider zinc supplementation.',
  forehead: 'Forehead acne may relate to hair products or digestive issues. Check if your shampoo is comedogenic.',
  jawline: 'Jawline breakouts are typically hormonal or stress-related. Elevated cortisol triggers androgen production.',
  nose: 'Nose breakouts (especially blackheads) relate to large pores and excess sebum. Oil cleansing helps.',
  left_cheek: 'Cheek acne may be from phone/pillow contact. Clean your phone daily and change pillowcases every 3-4 days.',
  right_cheek: 'Same as left cheek — contact contamination. Also consider air quality if right-side is more affected.',
  neck: 'Neck breakouts often relate to sweating, tight clothing, or hormonal factors. Use a gentle, non-comedogenic body wash.',
  t_zone: 'T-zone breakouts are classic oily skin. Less is more — over-washing increases sebum production.',
};

function getTodayStr() {
  return new Date().toDateString();
}

export default function AcneDiary() {
  const [log, setLog] = useState<DiaryEntry[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [todayZones, setTodayZones] = useState<string[]>([]);
  const [todayTypes, setTodayTypes] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    headerAnim.setValue(0);
    contentAnim.setValue(0);
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    load();
  }, []));

  const load = async () => {
    const raw = await AsyncStorage.getItem(DIARY_KEY);
    const entries: DiaryEntry[] = raw ? JSON.parse(raw) : [];
    setLog(entries);
    const today = getTodayStr();
    const todayEntry = entries.find(e => e.date === today);
    if (todayEntry) {
      setTodayCount(todayEntry.count);
      setTodayZones(todayEntry.zones);
      setTodayTypes(todayEntry.types);
      setSaved(true);
    }
  };

  const toggleZone = (key: string) => {
    setSaved(false);
    setTodayZones(prev => prev.includes(key) ? prev.filter(z => z !== key) : [...prev, key]);
  };

  const toggleType = (key: string) => {
    setSaved(false);
    setTodayTypes(prev => prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]);
  };

  const saveToday = async () => {
    const today = getTodayStr();
    const entry: DiaryEntry = { date: today, count: todayCount, zones: todayZones, types: todayTypes };
    const updated = [entry, ...log.filter(e => e.date !== today)].slice(0, 90);
    await AsyncStorage.setItem(DIARY_KEY, JSON.stringify(updated));
    setLog(updated);
    setSaved(true);
  };

  // Analytics
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const dStr = d.toDateString();
    const entry = log.find(e => e.date === dStr);
    return { count: entry?.count ?? -1, day: d.getDate() };
  });

  const avgCount = log.length > 0 ? (log.reduce((s, e) => s + e.count, 0) / log.length).toFixed(1) : '—';
  const maxCount = log.length > 0 ? Math.max(...log.map(e => e.count)) : 0;

  const zoneTally: Record<string, number> = {};
  log.forEach(e => e.zones.forEach(z => { zoneTally[z] = (zoneTally[z] || 0) + 1; }));
  const topZone = Object.entries(zoneTally).sort((a, b) => b[1] - a[1])[0];

  const typeTally: Record<string, number> = {};
  log.forEach(e => e.types.forEach(t => { typeTally[t] = (typeTally[t] || 0) + 1; }));
  const topType = Object.entries(typeTally).sort((a, b) => b[1] - a[1])[0];

  const chartMax = Math.max(1, maxCount, ...last30.map(d => d.count));

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
        }]}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Acne Diary</Text>
            <Text style={styles.headerSub}>Track, analyze, and clear</Text>
          </View>
          <View style={{ width: 36 }} />
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ opacity: contentAnim }}>

        {/* Today's log */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayLabel}>TODAY'S LOG</Text>
            {saved && (
              <View style={styles.savedBadge}>
                <Ionicons name="checkmark" size={12} color="#4ADE80" />
                <Text style={styles.savedText}>Saved</Text>
              </View>
            )}
          </View>

          <Text style={styles.todayQ}>How many new breakouts today?</Text>
          <View style={styles.countRow}>
            <Pressable style={styles.countBtn} onPress={() => { setTodayCount(Math.max(0, todayCount - 1)); setSaved(false); }}>
              <Ionicons name="remove" size={22} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.countNum}>{todayCount}</Text>
            <Pressable style={styles.countBtn} onPress={() => { setTodayCount(todayCount + 1); setSaved(false); }}>
              <Ionicons name="add" size={22} color={Colors.textPrimary} />
            </Pressable>
            <Pressable style={[styles.countBtn, { backgroundColor: 'rgba(248,113,113,0.15)' }]} onPress={() => { setTodayCount(10); setSaved(false); }}>
              <Text style={{ color: Colors.scorePoor, fontSize: 12, fontWeight: '700' }}>10+</Text>
            </Pressable>
          </View>

          {todayCount > 0 && (
            <>
              <Text style={styles.sectionLabelInCard}>WHERE? (select all zones)</Text>
              <View style={styles.chipsWrap}>
                {ZONES.map(z => (
                  <Pressable
                    key={z.key}
                    style={[styles.chip, todayZones.includes(z.key) && styles.chipActive]}
                    onPress={() => toggleZone(z.key)}
                  >
                    <Text style={styles.chipEmoji}>{z.emoji}</Text>
                    <Text style={[styles.chipText, todayZones.includes(z.key) && { color: Colors.primary }]}>{z.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.sectionLabelInCard, { marginTop: 8 }]}>WHAT TYPE?</Text>
              <View style={styles.chipsWrap}>
                {TYPES.map(t => (
                  <Pressable
                    key={t.key}
                    style={[styles.chip, todayTypes.includes(t.key) && styles.chipActive]}
                    onPress={() => toggleType(t.key)}
                  >
                    <Text style={styles.chipEmoji}>{t.emoji}</Text>
                    <Text style={[styles.chipText, todayTypes.includes(t.key) && { color: Colors.primary }]}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <Pressable
            style={[styles.saveBtn, saved && styles.saveBtnSaved]}
            onPress={saveToday}
          >
            {saved
              ? <><Ionicons name="checkmark-circle" size={18} color="#4ADE80" /><Text style={[styles.saveBtnText, { color: '#4ADE80' }]}>Saved</Text></>
              : <><Ionicons name="save-outline" size={18} color={Colors.white} /><Text style={styles.saveBtnText}>Save Today</Text></>
            }
          </Pressable>
        </View>

        {/* Stats */}
        {log.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: avgCount === '0.0' ? '#4ADE80' : Number(avgCount) > 3 ? Colors.scorePoor : Colors.gold }]}>{avgCount}</Text>
              <Text style={styles.statLabel}>Avg/day</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{maxCount}</Text>
              <Text style={styles.statLabel}>Worst day</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{log.filter(e => e.count === 0).length}</Text>
              <Text style={styles.statLabel}>Clear days</Text>
            </View>
          </View>
        )}

        {/* 30-day chart */}
        {log.length >= 5 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>30-Day Breakout Chart</Text>
            <View style={styles.chart}>
              {last30.map((d, i) => (
                <View key={i} style={styles.chartCol}>
                  <View style={styles.chartBarWrap}>
                    {d.count > 0 && (
                      <View style={[styles.chartBar, {
                        height: `${(d.count / chartMax) * 100}%` as any,
                        backgroundColor: d.count <= 1 ? '#4ADE80' : d.count <= 3 ? Colors.gold : Colors.scorePoor,
                      }]} />
                    )}
                    {d.count === 0 && (
                      <View style={[styles.chartBar, { height: '4%', backgroundColor: '#4ADE8060' }]} />
                    )}
                  </View>
                  {(i % 5 === 0 || i === 29) && <Text style={styles.chartDay}>{d.day}</Text>}
                  {i % 5 !== 0 && i !== 29 && <Text style={styles.chartDay}> </Text>}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Zone analysis */}
        {topZone && (
          <View style={styles.insightCard}>
            <LinearGradient colors={['rgba(196,98,45,0.10)', 'rgba(196,98,45,0.02)']} style={StyleSheet.absoluteFill} />
            <Text style={styles.insightEmoji}>🔍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTitle}>Most Affected Zone</Text>
              <Text style={styles.insightZone}>{ZONES.find(z => z.key === topZone[0])?.label} — {topZone[1]} time{topZone[1] > 1 ? 's' : ''}</Text>
              {ZONE_TIPS[topZone[0]] && <Text style={styles.insightTip}>{ZONE_TIPS[topZone[0]]}</Text>}
            </View>
          </View>
        )}

        {/* All zones with meanings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Face Mapping Guide</Text>
          <Text style={styles.cardSub}>What your breakout zones reveal</Text>
          {ZONES.map((zone, i) => (
            <View key={zone.key} style={[styles.zoneRow, i < ZONES.length - 1 && styles.zoneBorder]}>
              <Text style={styles.zoneEmoji}>{zone.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.zoneLabel}>{zone.label}</Text>
                <Text style={styles.zoneMeaning}>{zone.meaning}</Text>
              </View>
              {zoneTally[zone.key] && (
                <Text style={styles.zoneCount}>{zoneTally[zone.key]}×</Text>
              )}
            </View>
          ))}
        </View>

        {/* Link to scan */}
        <Pressable style={styles.scanCta} onPress={() => router.push('/scan')}>
          <LinearGradient colors={['rgba(196,98,45,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />
          <Ionicons name="camera-outline" size={18} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.scanCtaTitle}>Scan Your Skin</Text>
            <Text style={styles.scanCtaSub}>See clarity score to track treatment progress</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </Pressable>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  todayCard: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12, marginBottom: 14 },
  todayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  todayLabel: { fontSize: 9, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  savedText: { fontSize: 11, fontWeight: '700', color: '#4ADE80' },
  todayQ: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  countRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  countNum: { fontSize: 40, fontWeight: '900', color: Colors.textPrimary, width: 80, textAlign: 'center' },

  sectionLabelInCard: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated },
  chipActive: { borderColor: Colors.primary, backgroundColor: 'rgba(196,98,45,0.12)' },
  chipEmoji: { fontSize: 13 },
  chipText: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 12, backgroundColor: Colors.primary, overflow: 'hidden' },
  saveBtnSaved: { backgroundColor: 'rgba(74,222,128,0.08)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center', gap: 3 },
  statNum: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '600', textAlign: 'center' },

  card: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 10, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardSub: { fontSize: 11, color: Colors.textMuted, marginTop: -6 },

  chart: { flexDirection: 'row', gap: 2, height: 70, alignItems: 'flex-end' },
  chartCol: { flex: 1, alignItems: 'center', gap: 3 },
  chartBarWrap: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 2, minHeight: 2 },
  chartDay: { fontSize: 7, color: Colors.textMuted, fontWeight: '600' },

  insightCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 14, marginBottom: 14 },
  insightEmoji: { fontSize: 22 },
  insightTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  insightZone: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  insightTip: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  zoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  zoneBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  zoneEmoji: { fontSize: 16, width: 22, textAlign: 'center' },
  zoneLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  zoneMeaning: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  zoneCount: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  scanCta: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 14, marginBottom: 14 },
  scanCtaTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  scanCtaSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
