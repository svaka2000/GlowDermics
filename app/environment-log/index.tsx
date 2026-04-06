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

const LOG_KEY = 'gd_environment_log';

type EnvEntry = {
  date: string;
  humidity: number; // 10-100 scale in 10s
  pollution: number; // 1-5
  temperature: string; // 'cold' | 'cool' | 'mild' | 'warm' | 'hot'
  indoorHeating: boolean;
  hardWater: boolean;
};

const HUMIDITY_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const POLLUTION_OPTIONS = [
  { value: 1, label: 'Clean', emoji: '🌿', color: '#4ADE80' },
  { value: 2, label: 'Mild', emoji: '😊', color: '#86EFAC' },
  { value: 3, label: 'Moderate', emoji: '😐', color: Colors.gold },
  { value: 4, label: 'High', emoji: '😷', color: '#F97316' },
  { value: 5, label: 'Severe', emoji: '🚨', color: Colors.scorePoor },
];
const TEMP_OPTIONS = [
  { value: 'cold', label: 'Cold', emoji: '🥶', desc: 'Below 40°F / 5°C', color: '#93C5FD' },
  { value: 'cool', label: 'Cool', emoji: '🧥', desc: '40-60°F / 5-15°C', color: '#60A5FA' },
  { value: 'mild', label: 'Mild', emoji: '😊', desc: '60-75°F / 15-24°C', color: '#4ADE80' },
  { value: 'warm', label: 'Warm', emoji: '☀️', desc: '75-90°F / 24-32°C', color: Colors.gold },
  { value: 'hot', label: 'Hot', emoji: '🔥', desc: 'Above 90°F / 32°C', color: Colors.scorePoor },
];

function getTodayStr() { return new Date().toDateString(); }

function getSkinImpact(entry: Partial<EnvEntry>): { issues: string[]; advice: string[] } {
  const issues: string[] = [];
  const advice: string[] = [];

  if (entry.humidity !== undefined) {
    if (entry.humidity <= 30) {
      issues.push('Low humidity dries out the stratum corneum, increasing TEWL');
      advice.push('Layer a humectant (hyaluronic acid / glycerin) under tallow');
    } else if (entry.humidity >= 80) {
      issues.push('High humidity can increase oil production and fungal risk');
      advice.push('Use lighter layers — skip heavy occlusive if skin feels balanced');
    }
  }

  if (entry.pollution && entry.pollution >= 3) {
    issues.push('Air pollution generates free radicals that degrade collagen and cause inflammation');
    advice.push('Double cleanse at night — micellar water first, then gentle cleanser');
    advice.push('Apply antioxidants (vitamin C or E) in the morning');
  }

  if (entry.temperature === 'cold' || entry.temperature === 'cool') {
    issues.push('Cold air is dry air — skin barrier works harder in cold weather');
    advice.push('Apply tallow to slightly damp skin to lock in moisture');
  }

  if (entry.temperature === 'hot') {
    issues.push('Heat increases sweating and oil production, potentially clogging pores');
    advice.push('Cleanse morning AND night when hot');
  }

  if (entry.indoorHeating) {
    issues.push('Central heating removes 20-30% of indoor humidity — very drying to skin');
    advice.push('Use a humidifier or place water bowls near heating vents');
  }

  if (entry.hardWater) {
    issues.push('Hard water leaves mineral deposits that disrupt skin pH and strip lipids');
    advice.push('Use a gentle, low-pH toner after washing to restore pH balance');
    advice.push('Consider a shower filter for long-term skin improvement');
  }

  return { issues, advice };
}

export default function EnvironmentLog() {
  const [log, setLog] = useState<EnvEntry[]>([]);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [pollution, setPollution] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<string | null>(null);
  const [indoorHeating, setIndoorHeating] = useState(false);
  const [hardWater, setHardWater] = useState(false);
  const [saved, setSaved] = useState(false);
  const [scanHistory, setScanHistory] = useState<{ date: string; overallScore: number }[]>([]);

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  const load = async () => {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    const entries: EnvEntry[] = raw ? JSON.parse(raw) : [];
    setLog(entries);

    const history = await Storage.getScanHistory();
    setScanHistory(history.map(h => ({ date: h.date, overallScore: h.overallScore })));

    const today = getTodayStr();
    const todayEntry = entries.find(e => e.date === today);
    if (todayEntry) {
      setHumidity(todayEntry.humidity);
      setPollution(todayEntry.pollution);
      setTemperature(todayEntry.temperature);
      setIndoorHeating(todayEntry.indoorHeating);
      setHardWater(todayEntry.hardWater);
      setSaved(true);
    }
  };

  const saveEntry = async () => {
    if (humidity === null || pollution === null || !temperature) return;
    const today = getTodayStr();
    const entry: EnvEntry = {
      date: today,
      humidity,
      pollution,
      temperature,
      indoorHeating,
      hardWater,
    };
    const updated = [entry, ...log.filter(e => e.date !== today)].slice(0, 90);
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(updated));
    setLog(updated);
    setSaved(true);
  };

  const impact = getSkinImpact({ humidity: humidity ?? undefined, pollution: pollution ?? undefined, temperature: temperature ?? undefined, indoorHeating, hardWater });

  // Stats
  const avgHumidity = log.length > 0 ? Math.round(log.slice(0, 14).reduce((s, e) => s + e.humidity, 0) / Math.min(log.length, 14)) : null;
  const avgPollution = log.length > 0 ? (log.slice(0, 14).reduce((s, e) => s + e.pollution, 0) / Math.min(log.length, 14)).toFixed(1) : null;

  // Correlation: high pollution vs scan scores
  const highPollutionScanAvg = (() => {
    const dates = new Set(log.filter(e => e.pollution >= 4).map(e => e.date));
    const relevant = scanHistory.filter(s => {
      const d = new Date(s.date);
      const prev = new Date(d); prev.setDate(d.getDate() - 1);
      return dates.has(prev.toDateString());
    });
    return relevant.length >= 3 ? Math.round(relevant.reduce((s, e) => s + e.overallScore, 0) / relevant.length) : null;
  })();

  const lowPollutionScanAvg = (() => {
    const dates = new Set(log.filter(e => e.pollution <= 2).map(e => e.date));
    const relevant = scanHistory.filter(s => {
      const d = new Date(s.date);
      const prev = new Date(d); prev.setDate(d.getDate() - 1);
      return dates.has(prev.toDateString());
    });
    return relevant.length >= 3 ? Math.round(relevant.reduce((s, e) => s + e.overallScore, 0) / relevant.length) : null;
  })();

  const readyToSave = humidity !== null && pollution !== null && temperature !== null;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Environment Log</Text>
            <Text style={styles.headerSub}>Track what the world does to your skin</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Today's log */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Today's Environment</Text>
            {saved && (
              <View style={styles.savedBadge}>
                <Ionicons name="checkmark" size={12} color="#4ADE80" />
                <Text style={styles.savedText}>Saved</Text>
              </View>
            )}
          </View>

          <Text style={styles.fieldLabel}>Humidity</Text>
          <View style={styles.humidityRow}>
            {HUMIDITY_OPTIONS.map(h => (
              <Pressable
                key={h}
                style={[styles.humChip, humidity === h && styles.humChipActive]}
                onPress={() => { setHumidity(h); setSaved(false); }}
              >
                <Text style={[styles.humChipText, humidity === h && { color: Colors.primary }]}>{h}%</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Air Quality / Pollution</Text>
          <View style={styles.pollutionRow}>
            {POLLUTION_OPTIONS.map(opt => (
              <Pressable
                key={opt.value}
                style={[styles.pollChip, pollution === opt.value && { backgroundColor: `${opt.color}20`, borderColor: opt.color }]}
                onPress={() => { setPollution(opt.value); setSaved(false); }}
              >
                <Text style={styles.pollEmoji}>{opt.emoji}</Text>
                <Text style={[styles.pollLabel, pollution === opt.value && { color: opt.color }]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Temperature</Text>
          <View style={styles.tempGrid}>
            {TEMP_OPTIONS.map(opt => (
              <Pressable
                key={opt.value}
                style={[styles.tempChip, temperature === opt.value && { backgroundColor: `${opt.color}20`, borderColor: opt.color }]}
                onPress={() => { setTemperature(opt.value); setSaved(false); }}
              >
                <Text style={styles.tempEmoji}>{opt.emoji}</Text>
                <Text style={[styles.tempLabel, temperature === opt.value && { color: opt.color }]}>{opt.label}</Text>
                <Text style={styles.tempDesc}>{opt.desc}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Other Factors</Text>
          <View style={styles.toggleRow}>
            {[
              { key: 'heating', label: 'Indoor heating/AC on', value: indoorHeating, set: (v: boolean) => { setIndoorHeating(v); setSaved(false); } },
              { key: 'water', label: 'Hard water area', value: hardWater, set: (v: boolean) => { setHardWater(v); setSaved(false); } },
            ].map(item => (
              <Pressable key={item.key} style={[styles.toggleChip, item.value && styles.toggleChipActive]} onPress={() => item.set(!item.value)}>
                <Ionicons name={item.value ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={item.value ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.toggleLabel, item.value && { color: Colors.textPrimary }]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.saveBtn, saved && styles.saveBtnSaved, !readyToSave && { opacity: 0.5 }]}
            onPress={saveEntry}
            disabled={!readyToSave}
          >
            {saved
              ? <><Ionicons name="checkmark-circle" size={18} color="#4ADE80" /><Text style={[styles.saveBtnText, { color: '#4ADE80' }]}>Saved</Text></>
              : <><Ionicons name="leaf-outline" size={18} color={Colors.white} /><Text style={styles.saveBtnText}>Log Today</Text></>
            }
          </Pressable>
        </View>

        {/* Real-time skin impact */}
        {(impact.issues.length > 0 || impact.advice.length > 0) && (
          <View style={styles.impactCard}>
            <LinearGradient colors={['rgba(196,98,45,0.08)', 'rgba(196,98,45,0.02)']} style={StyleSheet.absoluteFill} />
            <Text style={styles.impactTitle}>Today's Skin Impact</Text>
            {impact.issues.length > 0 && (
              <>
                <Text style={styles.impactSubtitle}>⚠️ Conditions to watch</Text>
                {impact.issues.map((issue, i) => (
                  <View key={i} style={styles.impactRow}>
                    <View style={[styles.impactDot, { backgroundColor: Colors.gold }]} />
                    <Text style={styles.impactText}>{issue}</Text>
                  </View>
                ))}
              </>
            )}
            {impact.advice.length > 0 && (
              <>
                <Text style={styles.impactSubtitle}>✅ Adjust your routine</Text>
                {impact.advice.map((adv, i) => (
                  <View key={i} style={styles.impactRow}>
                    <View style={[styles.impactDot, { backgroundColor: '#4ADE80' }]} />
                    <Text style={styles.impactText}>{adv}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* Stats */}
        {log.length >= 3 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, {
                color: avgHumidity && avgHumidity < 40 ? Colors.scorePoor
                  : avgHumidity && avgHumidity > 70 ? Colors.gold : '#4ADE80'
              }]}>
                {avgHumidity}%
              </Text>
              <Text style={styles.statLabel}>Avg humidity</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: parseFloat(avgPollution!) > 3 ? Colors.scorePoor : '#4ADE80' }]}>
                {avgPollution}
              </Text>
              <Text style={styles.statLabel}>Avg pollution</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{log.filter(e => e.indoorHeating).length}</Text>
              <Text style={styles.statLabel}>Heating days</Text>
            </View>
          </View>
        )}

        {/* Pollution-Skin correlation */}
        {highPollutionScanAvg !== null && lowPollutionScanAvg !== null && (
          <View style={styles.correlationCard}>
            <LinearGradient colors={['rgba(74,222,128,0.08)', 'rgba(239,68,68,0.06)']} style={StyleSheet.absoluteFill} />
            <Text style={styles.correlationTitle}>Pollution → Skin Score</Text>
            <View style={styles.correlationRow}>
              <View style={styles.correlationItem}>
                <Text style={[styles.correlationScore, { color: '#4ADE80' }]}>{lowPollutionScanAvg}</Text>
                <Text style={styles.correlationLabel}>After clean air</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={Colors.textMuted} />
              <View style={styles.correlationItem}>
                <Text style={[styles.correlationScore, { color: Colors.scorePoor }]}>{highPollutionScanAvg}</Text>
                <Text style={styles.correlationLabel}>After high pollution</Text>
              </View>
            </View>
          </View>
        )}

        {/* Science card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Environment & Skin Science</Text>
          {[
            { icon: '💧', tip: 'Ideal skin humidity environment: 40-60%. Below 30%, skin barrier function degrades and TEWL increases by up to 50%.' },
            { icon: '🌫️', tip: 'PM2.5 particles (fine pollution) are small enough to penetrate the stratum corneum, generating free radicals that degrade collagen directly.' },
            { icon: '❄️', tip: 'Cold temperatures cause vasoconstriction and reduce sebum production. Paradoxically, this can lead to dry skin — tallow is ideal for cold climate barriers.' },
            { icon: '🚿', tip: 'Hard water contains calcium and magnesium that interact with soap to form insoluble salts — this deposits on skin and disrupts the acid mantle.' },
            { icon: '🌡️', tip: 'Central heating in winter creates extremely dry indoor air (often 15-20% humidity). Your skin is fighting both cold outside and dry heat inside.' },
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

  card: {
    backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 10, marginBottom: 14,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  savedText: { fontSize: 11, fontWeight: '700', color: '#4ADE80' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },

  humidityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  humChip: {
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated,
  },
  humChipActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}15` },
  humChipText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },

  pollutionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pollChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated,
  },
  pollEmoji: { fontSize: 14 },
  pollLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },

  tempGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tempChip: {
    flex: 1, minWidth: 80, alignItems: 'center', gap: 2,
    paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated,
  },
  tempEmoji: { fontSize: 18 },
  tempLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  tempDesc: { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },

  toggleRow: { gap: 6 },
  toggleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated,
  },
  toggleChipActive: { borderColor: `${Colors.primary}50`, backgroundColor: `${Colors.primary}10` },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 48, borderRadius: 12, backgroundColor: Colors.primary,
  },
  saveBtnSaved: { backgroundColor: 'rgba(74,222,128,0.08)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  impactCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: `${Colors.primary}30`,
    padding: 16, gap: 8, marginBottom: 14,
  },
  impactTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  impactSubtitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, marginTop: 4 },
  impactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  impactDot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 6, flexShrink: 0 },
  impactText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center', gap: 3,
  },
  statNum: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '600', textAlign: 'center' },

  correlationCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 12, marginBottom: 14,
  },
  correlationTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  correlationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  correlationItem: { alignItems: 'center', gap: 4 },
  correlationScore: { fontSize: 28, fontWeight: '900' },
  correlationLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textAlign: 'center' },

  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipIcon: { fontSize: 18, width: 26, textAlign: 'center' },
  tipText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
