import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';

const WATER_KEY = 'gd_water';
const WATER_GOAL = 8;

function getTodayStr() {
  return new Date().toDateString();
}

export default function HydrationTracker() {
  const [waterData, setWaterData] = useState<Record<string, number>>({});
  const [todayGlasses, setTodayGlasses] = useState(0);
  const [scanHistory, setScanHistory] = useState<{ date: string; overallScore: number }[]>([]);

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(WATER_KEY);
      const data: Record<string, number> = raw ? JSON.parse(raw) : {};
      setWaterData(data);
      setTodayGlasses(data[getTodayStr()] ?? 0);
    } catch {}
    const history = await Storage.getScanHistory();
    setScanHistory(history.map(h => ({ date: h.date, overallScore: h.overallScore })));
  };

  const setGlasses = async (n: number) => {
    const next = Math.max(0, Math.min(15, n));
    const today = getTodayStr();
    const raw = await AsyncStorage.getItem(WATER_KEY);
    const data: Record<string, number> = raw ? JSON.parse(raw) : {};
    data[today] = next;
    await AsyncStorage.setItem(WATER_KEY, JSON.stringify(data));
    setWaterData({ ...data });
    setTodayGlasses(next);
  };

  // Last 14 days data
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dStr = d.toDateString();
    return {
      glasses: waterData[dStr] ?? 0,
      day: d.getDate(),
      isToday: dStr === getTodayStr(),
    };
  });

  const chartMax = Math.max(WATER_GOAL + 2, ...last14.map(d => d.glasses));

  // Stats
  const last14WithData = last14.filter(d => d.glasses > 0);
  const avgGlasses = last14WithData.length > 0
    ? (last14WithData.reduce((s, d) => s + d.glasses, 0) / last14WithData.length).toFixed(1)
    : '—';
  const goalDays = last14.filter(d => d.glasses >= WATER_GOAL).length;
  const streakDays = (() => {
    let streak = 0;
    for (let i = 13; i >= 0; i--) {
      if (last14[i].glasses >= WATER_GOAL) streak++;
      else break;
    }
    return streak;
  })();

  // Skin correlation
  const highWaterScanAvg = (() => {
    const highDates = new Set(
      Object.entries(waterData).filter(([, g]) => g >= WATER_GOAL).map(([d]) => d)
    );
    const relevant = scanHistory.filter(s => {
      const d = new Date(s.date);
      const prev = new Date(d);
      prev.setDate(d.getDate() - 1);
      return highDates.has(prev.toDateString());
    });
    return relevant.length >= 3
      ? Math.round(relevant.reduce((s, e) => s + e.overallScore, 0) / relevant.length)
      : null;
  })();

  const lowWaterScanAvg = (() => {
    const lowDates = new Set(
      Object.entries(waterData).filter(([, g]) => g < WATER_GOAL && g > 0).map(([d]) => d)
    );
    const relevant = scanHistory.filter(s => {
      const d = new Date(s.date);
      const prev = new Date(d);
      prev.setDate(d.getDate() - 1);
      return lowDates.has(prev.toDateString());
    });
    return relevant.length >= 3
      ? Math.round(relevant.reduce((s, e) => s + e.overallScore, 0) / relevant.length)
      : null;
  })();

  const pct = Math.min(1, todayGlasses / WATER_GOAL);
  const ringColor = pct >= 1 ? '#4ADE80' : pct >= 0.75 ? '#86EFAC' : pct >= 0.5 ? Colors.gold : pct >= 0.25 ? '#FCA5A5' : Colors.scorePoor;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Hydration Tracker</Text>
            <Text style={styles.headerSub}>Your skin is mostly water</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Today's ring */}
        <View style={styles.ringCard}>
          <LinearGradient
            colors={['rgba(74,222,128,0.08)', 'rgba(196,98,45,0.05)']}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.ringWrap}>
            <View style={[styles.ringOuter, { borderColor: `${ringColor}30` }]}>
              <View style={[styles.ringInner, { borderColor: ringColor }]}>
                <Text style={[styles.ringCount, { color: ringColor }]}>{todayGlasses}</Text>
                <Text style={styles.ringUnit}>/ {WATER_GOAL} glasses</Text>
                <Text style={styles.ringPct}>{Math.round(pct * 100)}%</Text>
              </View>
            </View>
          </View>

          {/* Quick add row */}
          <View style={styles.quickRow}>
            <Pressable style={styles.bigMinusBtn} onPress={() => setGlasses(todayGlasses - 1)}>
              <Ionicons name="remove" size={22} color={Colors.textPrimary} />
            </Pressable>

            <View style={styles.glassRow}>
              {Array.from({ length: Math.min(10, WATER_GOAL + 2) }, (_, i) => (
                <Pressable
                  key={i}
                  style={[styles.glassDrop, i < todayGlasses && { opacity: 1 }]}
                  onPress={() => setGlasses(i + 1)}
                >
                  <Text style={{ fontSize: 16, opacity: i < todayGlasses ? 1 : 0.2 }}>💧</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.bigPlusBtn, { backgroundColor: ringColor }]}
              onPress={() => setGlasses(todayGlasses + 1)}
            >
              <Ionicons name="add" size={22} color={Colors.bg} />
            </Pressable>
          </View>

          <View style={styles.presetRow}>
            {[1, 2, 4, 8].map(n => (
              <Pressable
                key={n}
                style={styles.presetBtn}
                onPress={() => setGlasses(todayGlasses + n)}
              >
                <Text style={styles.presetBtnText}>+{n}</Text>
              </Pressable>
            ))}
          </View>

          {todayGlasses >= WATER_GOAL && (
            <View style={styles.goalBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
              <Text style={styles.goalBadgeText}>Daily goal reached!</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: parseFloat(avgGlasses) >= WATER_GOAL ? '#4ADE80' : Colors.gold }]}>
              {avgGlasses}
            </Text>
            <Text style={styles.statLabel}>Daily avg</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: goalDays >= 10 ? '#4ADE80' : goalDays >= 5 ? Colors.gold : Colors.scorePoor }]}>
              {goalDays}
            </Text>
            <Text style={styles.statLabel}>Goal days (14)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: streakDays >= 7 ? '#4ADE80' : streakDays >= 3 ? Colors.gold : Colors.textPrimary }]}>
              {streakDays}
            </Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </View>
        </View>

        {/* 14-day chart */}
        {Object.keys(waterData).length >= 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>14-Day Hydration Chart</Text>
            <View style={styles.chart}>
              {last14.map((d, i) => {
                const barPct = chartMax > 0 ? d.glasses / chartMax : 0;
                const barColor = d.glasses >= WATER_GOAL ? '#4ADE80'
                  : d.glasses >= 6 ? '#86EFAC'
                  : d.glasses >= 4 ? Colors.gold
                  : d.glasses > 0 ? Colors.scorePoor
                  : Colors.border;
                return (
                  <View key={i} style={styles.chartCol}>
                    <View style={styles.chartBarWrap}>
                      {d.glasses > 0 && (
                        <View style={[styles.chartBar, {
                          height: `${barPct * 100}%` as any,
                          backgroundColor: barColor,
                          opacity: d.isToday ? 1 : 0.75,
                        }]} />
                      )}
                    </View>
                    <Text style={[styles.chartDay, d.isToday && { color: Colors.primary, fontWeight: '800' }]}>
                      {d.isToday ? '•' : d.day}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.chartGoalLine}>
              <View style={[styles.chartGoalLineInner, { bottom: `${(WATER_GOAL / chartMax) * 80}%` as any }]} />
              <Text style={styles.chartGoalLabel}>Goal ({WATER_GOAL})</Text>
            </View>
          </View>
        )}

        {/* Correlation card */}
        {highWaterScanAvg !== null && lowWaterScanAvg !== null && (
          <View style={styles.correlationCard}>
            <LinearGradient colors={['rgba(74,222,128,0.08)', 'rgba(196,98,45,0.06)']} style={StyleSheet.absoluteFill} />
            <Text style={styles.correlationTitle}>Hydration → Skin Score</Text>
            <View style={styles.correlationRow}>
              <View style={styles.correlationItem}>
                <Text style={[styles.correlationScore, { color: '#4ADE80' }]}>{highWaterScanAvg}</Text>
                <Text style={styles.correlationLabel}>After 8+ glasses</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={Colors.textMuted} />
              <View style={styles.correlationItem}>
                <Text style={[styles.correlationScore, { color: Colors.scorePoor }]}>{lowWaterScanAvg}</Text>
                <Text style={styles.correlationLabel}>After fewer glasses</Text>
              </View>
            </View>
            <Text style={styles.correlationNote}>
              Your skin scores {Math.abs(highWaterScanAvg - lowWaterScanAvg)} points {highWaterScanAvg > lowWaterScanAvg ? 'better' : 'lower'} the day after hitting your water goal.
            </Text>
          </View>
        )}

        {/* Tips */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hydration & Skin Science</Text>
          {[
            { icon: '💧', tip: 'Skin is ~64% water. Even mild dehydration (1-2%) reduces elasticity and increases fine lines.' },
            { icon: '🌿', tip: 'Tallow\'s fatty acids work best when skin is well-hydrated — water plumps cells, lipids seal moisture in.' },
            { icon: '☕', tip: 'Caffeine is mildly diuretic. For every coffee, add an extra glass of water to compensate.' },
            { icon: '🥒', tip: 'Eat your water — cucumber, celery, watermelon, and lettuce are 90-95% water and count toward hydration.' },
            { icon: '🌙', tip: 'Drink a glass of water before bed. Your skin loses moisture overnight — pre-loading helps.' },
            { icon: '🧂', tip: 'Electrolytes (sodium, potassium) help water enter cells. Add a pinch of sea salt to your water bottle.' },
          ].map((item, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipIcon}>{item.icon}</Text>
              <Text style={styles.tipText}>{item.tip}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  ringCard: {
    borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
    padding: 20, gap: 16, marginBottom: 14, alignItems: 'center',
  },
  ringWrap: { alignItems: 'center' },
  ringOuter: { width: 160, height: 160, borderRadius: 80, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 130, height: 130, borderRadius: 65, borderWidth: 3, alignItems: 'center', justifyContent: 'center', gap: 2 },
  ringCount: { fontSize: 40, fontWeight: '900' },
  ringUnit: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  ringPct: { fontSize: 13, color: Colors.textMuted, fontWeight: '700' },

  quickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'center' },
  bigMinusBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  bigPlusBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  glassRow: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2 },
  glassDrop: { padding: 2 },

  presetRow: { flexDirection: 'row', gap: 8 },
  presetBtn: {
    flex: 1, height: 38, borderRadius: 10,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  presetBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },

  goalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  goalBadgeText: { fontSize: 13, fontWeight: '700', color: '#4ADE80' },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 12,
    alignItems: 'center', gap: 3,
  },
  statNum: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '600', textAlign: 'center' },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 10, marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  chart: { flexDirection: 'row', gap: 2, height: 80, alignItems: 'flex-end' },
  chartCol: { flex: 1, alignItems: 'center', gap: 3 },
  chartBarWrap: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 3, minHeight: 3 },
  chartDay: { fontSize: 8, color: Colors.textMuted, fontWeight: '600' },
  chartGoalLine: { position: 'relative', height: 16, alignItems: 'flex-end', marginTop: 2 },
  chartGoalLineInner: {
    position: 'absolute', left: 0, right: 0, height: 1,
    borderTopWidth: 1, borderTopColor: 'rgba(74,222,128,0.4)', borderStyle: 'dashed',
  },
  chartGoalLabel: { fontSize: 9, color: '#4ADE80' },

  correlationCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 12, marginBottom: 14,
  },
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
