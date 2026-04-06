import { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, Animated, Easing,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';

const SLEEP_KEY = 'gd_sleep_log';

type SleepEntry = {
  date: string;
  hours: number;
  quality: number; // 1-5
};

const QUALITY_LABELS = ['', 'Terrible', 'Poor', 'Fair', 'Good', 'Great'];
const QUALITY_EMOJIS = ['', '😫', '😪', '😐', '😌', '😊'];
const QUALITY_COLORS = ['', Colors.scorePoor, '#FCA5A5', Colors.gold, '#86EFAC', '#4ADE80'];

const HOUR_BUCKETS = [4, 5, 6, 7, 8, 9, 10];

function getTodayStr() {
  return new Date().toDateString();
}

export default function SleepLog() {
  const [log, setLog] = useState<SleepEntry[]>([]);
  const [todayHours, setTodayHours] = useState('');
  const [todayQuality, setTodayQuality] = useState(0);
  const [saved, setSaved] = useState(false);
  const [scanHistory, setScanHistory] = useState<{ date: string; overallScore: number }[]>([]);

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
    const raw = await AsyncStorage.getItem(SLEEP_KEY);
    const entries: SleepEntry[] = raw ? JSON.parse(raw) : [];
    setLog(entries);

    const history = await Storage.getScanHistory();
    setScanHistory(history.map(h => ({ date: h.date, overallScore: h.overallScore })));

    const today = getTodayStr();
    const todayEntry = entries.find(e => e.date === today);
    if (todayEntry) {
      setTodayHours(String(todayEntry.hours));
      setTodayQuality(todayEntry.quality);
      setSaved(true);
    }
  };

  const saveToday = async () => {
    const hours = parseFloat(todayHours);
    if (isNaN(hours) || hours < 0 || hours > 24) return;
    const today = getTodayStr();
    const entry: SleepEntry = { date: today, hours, quality: todayQuality || 3 };
    const updated = [entry, ...log.filter(e => e.date !== today)].slice(0, 90);
    await AsyncStorage.setItem(SLEEP_KEY, JSON.stringify(updated));
    setLog(updated);
    setSaved(true);
  };

  // Last 14 days for chart
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const dStr = d.toDateString();
    const entry = log.find(e => e.date === dStr);
    return { hours: entry?.hours ?? 0, quality: entry?.quality ?? 0, day: d.getDate() };
  });

  // Stats
  const recentEntries = log.slice(0, 14);
  const avgHours = recentEntries.length > 0
    ? (recentEntries.reduce((s, e) => s + e.hours, 0) / recentEntries.length).toFixed(1)
    : '—';
  const avgQuality = recentEntries.length > 0
    ? Math.round(recentEntries.reduce((s, e) => s + e.quality, 0) / recentEntries.length)
    : 0;
  const sevenPlusNights = log.filter(e => e.hours >= 7).length;

  // Correlation: high sleep (7+h) vs scan scores
  const highSleepScanAvg = (() => {
    const highSleepDates = new Set(log.filter(e => e.hours >= 7).map(e => e.date));
    const relevant = scanHistory.filter(s => {
      const d = new Date(s.date);
      const prev = new Date(d); prev.setDate(d.getDate() - 1);
      return highSleepDates.has(prev.toDateString());
    });
    return relevant.length > 0 ? Math.round(relevant.reduce((s, e) => s + e.overallScore, 0) / relevant.length) : null;
  })();

  const lowSleepScanAvg = (() => {
    const lowSleepDates = new Set(log.filter(e => e.hours < 7).map(e => e.date));
    const relevant = scanHistory.filter(s => {
      const d = new Date(s.date);
      const prev = new Date(d); prev.setDate(d.getDate() - 1);
      return lowSleepDates.has(prev.toDateString());
    });
    return relevant.length > 0 ? Math.round(relevant.reduce((s, e) => s + e.overallScore, 0) / relevant.length) : null;
  })();

  const chartMax = Math.max(10, ...last14.map(d => d.hours));

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
            <Text style={styles.headerTitle}>Sleep Tracker</Text>
            <Text style={styles.headerSub}>Sleep drives skin repair</Text>
          </View>
          <View style={{ width: 36 }} />
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        style={{ opacity: contentAnim }}
      >

        {/* Today's log */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayLabel}>LAST NIGHT</Text>
            {saved && (
              <View style={styles.savedBadge}>
                <Ionicons name="checkmark" size={12} color="#4ADE80" />
                <Text style={styles.savedText}>Saved</Text>
              </View>
            )}
          </View>

          <Text style={styles.todayQ}>How many hours did you sleep?</Text>

          <View style={styles.hourBtnRow}>
            {HOUR_BUCKETS.map(h => (
              <Pressable
                key={h}
                style={[styles.hourBtn, parseFloat(todayHours) === h && styles.hourBtnActive]}
                onPress={() => { setTodayHours(String(h)); setSaved(false); }}
              >
                <Text style={[styles.hourBtnText, parseFloat(todayHours) === h && { color: Colors.white }]}>{h}h</Text>
              </Pressable>
            ))}
            <TextInput
              style={styles.customHourInput}
              placeholder="Other"
              placeholderTextColor={Colors.textMuted}
              value={parseFloat(todayHours) && !HOUR_BUCKETS.includes(parseFloat(todayHours)) ? todayHours : ''}
              onChangeText={v => { setTodayHours(v); setSaved(false); }}
              keyboardType="decimal-pad"
              maxLength={4}
            />
          </View>

          <Text style={styles.todayQ}>Sleep quality?</Text>
          <View style={styles.qualityRow}>
            {[1, 2, 3, 4, 5].map(q => (
              <Pressable
                key={q}
                style={[styles.qualityBtn, todayQuality === q && { backgroundColor: `${QUALITY_COLORS[q]}22`, borderColor: QUALITY_COLORS[q] }]}
                onPress={() => { setTodayQuality(q); setSaved(false); }}
              >
                <Text style={styles.qualityEmoji}>{QUALITY_EMOJIS[q]}</Text>
                <Text style={[styles.qualityLabel, { color: todayQuality === q ? QUALITY_COLORS[q] : Colors.textMuted }]}>{QUALITY_LABELS[q]}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.saveBtn, saved && styles.saveBtnSaved, !todayHours && { opacity: 0.5 }]}
            onPress={saveToday}
            disabled={!todayHours}
          >
            {saved
              ? <><Ionicons name="checkmark-circle" size={18} color="#4ADE80" /><Text style={[styles.saveBtnText, { color: '#4ADE80' }]}>Saved</Text></>
              : <><Ionicons name="moon-outline" size={18} color={Colors.white} /><Text style={styles.saveBtnText}>Log Sleep</Text></>
            }
          </Pressable>
        </View>

        {/* Stats */}
        {log.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: parseFloat(avgHours) >= 7 ? '#4ADE80' : parseFloat(avgHours) >= 6 ? Colors.gold : Colors.scorePoor }]}>
                {avgHours}h
              </Text>
              <Text style={styles.statLabel}>14-day avg</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{avgQuality > 0 ? QUALITY_EMOJIS[avgQuality] : '—'}</Text>
              <Text style={styles.statLabel}>Avg quality</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{sevenPlusNights}</Text>
              <Text style={styles.statLabel}>7h+ nights</Text>
            </View>
          </View>
        )}

        {/* 14-day chart */}
        {log.length >= 5 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>14-Night Sleep Chart</Text>
            <View style={styles.chart}>
              {last14.map((d, i) => (
                <View key={i} style={styles.chartCol}>
                  <View style={styles.chartBarWrap}>
                    {d.hours > 0 && (
                      <View style={[styles.chartBar, {
                        height: `${(d.hours / chartMax) * 100}%` as any,
                        backgroundColor: d.hours >= 8 ? '#4ADE80' : d.hours >= 7 ? '#86EFAC' : d.hours >= 6 ? Colors.gold : Colors.scorePoor,
                      }]} />
                    )}
                  </View>
                  <Text style={styles.chartDay}>{d.day}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chartRef}>
              <View style={[styles.refLine, { bottom: `${(7 / chartMax) * 80}%` as any }]} />
              <Text style={styles.refLabel}>7h target</Text>
            </View>
          </View>
        )}

        {/* Skin correlation */}
        {highSleepScanAvg && lowSleepScanAvg && (
          <View style={styles.correlationCard}>
            <LinearGradient colors={['rgba(74,222,128,0.08)', 'rgba(196,98,45,0.06)']} style={StyleSheet.absoluteFill} />
            <Text style={styles.correlationTitle}>Sleep → Skin Score Correlation</Text>
            <View style={styles.correlationRow}>
              <View style={styles.correlationItem}>
                <Text style={[styles.correlationScore, { color: '#4ADE80' }]}>{highSleepScanAvg}</Text>
                <Text style={styles.correlationLabel}>After 7h+ sleep</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={Colors.textMuted} />
              <View style={styles.correlationItem}>
                <Text style={[styles.correlationScore, { color: Colors.scorePoor }]}>{lowSleepScanAvg}</Text>
                <Text style={styles.correlationLabel}>After &lt;7h sleep</Text>
              </View>
            </View>
            <Text style={styles.correlationNote}>
              Your skin scores {Math.abs(highSleepScanAvg - lowSleepScanAvg)} points {highSleepScanAvg > lowSleepScanAvg ? 'higher' : 'lower'} the day after 7+ hours of sleep.
            </Text>
          </View>
        )}

        {/* Sleep tips */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sleep & Skin Science</Text>
          {[
            { icon: '🌙', tip: 'Skin cell repair peaks between 11pm-3am. Missing this window slows collagen production.' },
            { icon: '💧', tip: 'Skin loses less water overnight — but only if you stay asleep 7+ hours. Short sleep = more transepidermal water loss.' },
            { icon: '😰', tip: 'Poor sleep spikes cortisol, increasing oil production and inflammation — directly causing breakouts.' },
            { icon: '🌿', tip: 'Applying TallowDermics Balm before bed gives your skin barrier the lipids it needs during repair hours.' },
            { icon: '🛏', tip: 'Silk pillowcases reduce friction and don\'t absorb your skincare products unlike cotton.' },
          ].map((item, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipIcon}>{item.icon}</Text>
              <Text style={styles.tipText}>{item.tip}</Text>
            </View>
          ))}
        </View>

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
  todayQ: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },

  hourBtnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  hourBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated },
  hourBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  hourBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  customHourInput: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated, fontSize: 14, color: Colors.textPrimary, width: 70, textAlign: 'center' },

  qualityRow: { flexDirection: 'row', gap: 6 },
  qualityBtn: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated },
  qualityEmoji: { fontSize: 18 },
  qualityLabel: { fontSize: 8, fontWeight: '600', textAlign: 'center' },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 12, backgroundColor: Colors.primary },
  saveBtnSaved: { backgroundColor: 'rgba(74,222,128,0.08)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center', gap: 3 },
  statNum: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '600', textAlign: 'center' },

  card: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 10, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  chart: { flexDirection: 'row', gap: 3, height: 80, alignItems: 'flex-end', position: 'relative' },
  chartCol: { flex: 1, alignItems: 'center', gap: 3 },
  chartBarWrap: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 3, minHeight: 3 },
  chartDay: { fontSize: 8, color: Colors.textMuted, fontWeight: '600' },
  chartRef: { position: 'absolute', left: 0, right: 0, height: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', bottom: 20 },
  refLine: { flex: 1, height: 1, borderTopWidth: 1, borderTopColor: 'rgba(74,222,128,0.3)', borderStyle: 'dashed' },
  refLabel: { fontSize: 9, color: '#4ADE80', marginLeft: 4 },

  correlationCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12, marginBottom: 14 },
  correlationTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  correlationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  correlationItem: { alignItems: 'center', gap: 4 },
  correlationScore: { fontSize: 28, fontWeight: '900' },
  correlationLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textAlign: 'center' },
  correlationNote: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipIcon: { fontSize: 18, width: 26, textAlign: 'center' },
  tipText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
