import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Share,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';

type WeatherStat = {
  icon: string;
  label: string;
  value: string;
  unit: string;
  level: 'low' | 'medium' | 'high' | 'good';
};

type WeatherReport = {
  condition: string;
  conditionIcon: string;
  headline: string;
  summary: string;
  stats: WeatherStat[];
  forecast: { label: string; icon: string; tip: string }[];
  skinAdvice: string;
  gradientColors: [string, string];
};

function getWeatherReport(data: {
  hydration: number;
  clarity: number;
  texture: number;
  stress: number;
  water: number;
  routine: boolean;
  stressLevel: number;
}, c: Palette): WeatherReport {
  const { hydration, clarity, texture, stress, water, routine, stressLevel } = data;
  const overall = Math.round((hydration + clarity + texture) / 3);

  // Determine main condition
  let condition = 'Clear Skies';
  let conditionIcon = '☀️';
  let gradientColors: [string, string] = ['#1E3A5F', '#2563EB'];
  let headline = '';
  let summary = '';
  let skinAdvice = '';

  if (stressLevel >= 4 && hydration < 60) {
    condition = 'Skin Storm Alert';
    conditionIcon = '⛈️';
    gradientColors = ['#1A1A2E', '#7C3AED'];
    headline = 'High stress + low hydration detected';
    summary = 'Your skin is under pressure today. Prioritize hydration, skip actives, and apply extra occlusive tonight.';
    skinAdvice = 'Apply a thick layer of a rich occlusive balm before bed to rebuild barrier overnight.';
  } else if (clarity < 55 || texture < 55) {
    condition = 'Cloudy Conditions';
    conditionIcon = '☁️';
    gradientColors = ['#374151', '#6B7280'];
    headline = 'Congestion risk — skin needs clearing';
    summary = 'Some texture or clarity concerns detected. A gentle weekly cleanse and consistent routine will help.';
    skinAdvice = 'Try the Weekly Deep Cleanse facial this week and ensure you\'re completing your evening routine.';
  } else if (hydration >= 75 && clarity >= 75 && stressLevel <= 2 && water >= 6) {
    condition = 'Golden Hour';
    conditionIcon = '🌟';
    gradientColors = [c.primaryDark, '#D4A96A'];
    headline = 'Peak skin conditions today';
    summary = 'You\'re hydrated, calm, and consistent. Your skin is glowing and primed to absorb everything you give it.';
    skinAdvice = 'Perfect day to take a skin scan — your scores will be at their best right now.';
  } else if (hydration >= 65 && routine) {
    condition = 'Partly Sunny';
    conditionIcon = '🌤️';
    gradientColors = [c.primaryDark, c.primary];
    headline = 'Good skin day incoming';
    summary = 'Solid hydration and routine consistency. Keep it up — you\'re building positive momentum.';
    skinAdvice = 'Stay on top of water intake and don\'t skip the evening routine tonight.';
  } else if (water < 4) {
    condition = 'Dry Conditions';
    conditionIcon = '🏜️';
    gradientColors = ['#92400E', '#D97706'];
    headline = 'Dehydration risk — drink up';
    summary = 'Low water intake is showing in your skin. Internal hydration is as important as topical hydration.';
    skinAdvice = 'Aim for 8 glasses today and apply extra moisturizer to compensate for internal dryness.';
  } else if (stressLevel >= 3) {
    condition = 'Breezy but Unsettled';
    conditionIcon = '🌬️';
    gradientColors = ['#1E3A5F', '#0F4C75'];
    headline = 'Moderate stress affecting skin';
    summary = 'Elevated cortisol can increase oiliness and sensitivity. Use today to calm both mind and skin.';
    skinAdvice = 'Cortisol spikes increase sebum production. A calming evening routine with a rich occlusive can counteract this.';
  } else {
    condition = 'Mild & Steady';
    conditionIcon = '🌤️';
    gradientColors = [c.primaryDark, c.primary];
    headline = 'Stable skin day';
    summary = 'Conditions are normal. Maintain your routine and stay hydrated to keep things trending positive.';
    skinAdvice = 'Consistency is king. Log your routine and water intake today.';
  }

  const stats: WeatherStat[] = [
    {
      icon: '💧',
      label: 'Hydro Level',
      value: String(hydration),
      unit: '%',
      level: hydration >= 70 ? 'good' : hydration >= 55 ? 'medium' : 'low',
    },
    {
      icon: '✨',
      label: 'Clarity Index',
      value: String(clarity),
      unit: '%',
      level: clarity >= 70 ? 'good' : clarity >= 55 ? 'medium' : 'low',
    },
    {
      icon: '💦',
      label: 'Water Intake',
      value: String(water),
      unit: 'gl',
      level: water >= 7 ? 'good' : water >= 5 ? 'medium' : 'low',
    },
    {
      icon: '😌',
      label: 'Stress Level',
      value: stressLevel > 0 ? String(stressLevel) : '—',
      unit: '/5',
      level: stressLevel <= 2 ? 'good' : stressLevel <= 3 ? 'medium' : 'low',
    },
    {
      icon: '🌅',
      label: 'Routine',
      value: routine ? 'Done' : 'Pending',
      unit: '',
      level: routine ? 'good' : 'low',
    },
    {
      icon: '🌡️',
      label: 'Texture',
      value: String(texture),
      unit: '%',
      level: texture >= 70 ? 'good' : texture >= 55 ? 'medium' : 'low',
    },
  ];

  const tomorrow = overall >= 70 ? '🌞 Sunny' : overall >= 55 ? '🌤️ Partly Sunny' : '🌥️ Cloudy';

  const forecast = [
    {
      label: 'Tomorrow',
      icon: tomorrow,
      tip: overall >= 70 ? 'Maintain routine for continued glow' : 'Focus on hydration and consistency',
    },
    {
      label: 'This Week',
      icon: stressLevel >= 3 ? '⛈️ Rough' : '🌤️ Improving',
      tip: stressLevel >= 3 ? 'High stress week — prioritize sleep and barrier care' : 'Good week to start a new habit or challenge',
    },
  ];

  return { condition, conditionIcon, headline, summary, stats, forecast, skinAdvice, gradientColors };
}

function buildStatColors(c: Palette): Record<string, string> {
  return { good: '#4ADE80', medium: c.gold, low: c.scorePoor, high: '#4ADE80' };
}

export default function SkinWeather() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const STAT_COLORS = useMemo(() => buildStatColors(colors), [colors]);
  const [report, setReport] = useState<WeatherReport | null>(null);
  const [date, setDate] = useState('');

  useFocusEffect(useCallback(() => {
    generateReport();
  }, []));

  const generateReport = async () => {
    const [analysis, journal] = await Promise.all([
      Storage.getLatestAnalysis(),
      Storage.getJournal(),
    ]);

    const today = new Date().toDateString();
    const waterRaw = await AsyncStorage.getItem('gd_water');
    const waterData = waterRaw ? JSON.parse(waterRaw) : {};
    const waterToday = waterData[today] ?? 0;

    const stressRaw = await AsyncStorage.getItem('gd_stress_log');
    const stressLog = stressRaw ? JSON.parse(stressRaw) : [];
    const todayStress = stressLog.find((e: any) => e.date === today);
    const stressLevel = todayStress?.level ?? 0;

    const routine = await Storage.getTodayRoutineLog();
    const routineDone = routine.morning || routine.evening;

    const scores = analysis?.scores ?? { hydration: 60, clarity: 60, texture: 60 };

    const data = {
      hydration: scores.hydration,
      clarity: scores.clarity,
      texture: scores.texture,
      stress: stressLevel,
      water: waterToday,
      routine: routineDone,
      stressLevel,
    };

    setReport(getWeatherReport(data, colors));
    setDate(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
  };

  const handleShare = async () => {
    if (!report) return;
    await Share.share({
      message: [
        `🌤️ My Skin Weather Report — ${date}`,
        '',
        `${report.conditionIcon} ${report.condition}`,
        report.headline,
        '',
        report.summary,
        '',
        `Today's Tip: ${report.skinAdvice}`,
        '',
        '— Velumi AI',
      ].join('\n'),
    });
  };

  if (!report) return null;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>Skin Weather</Text>
            <Text style={styles.headerSub}>Daily conditions report</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Share" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Main condition card */}
        <View style={styles.mainCard}>
          <LinearGradient colors={report.gradientColors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Text style={styles.dateLabel}>{date}</Text>
          <Text style={styles.conditionEmoji}>{report.conditionIcon}</Text>
          <Text style={styles.condition}>{report.condition}</Text>
          <Text style={styles.headline}>{report.headline}</Text>
          <Text style={styles.summary}>{report.summary}</Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {report.stats.map((stat, i) => (
            <View key={i} style={styles.statBlock}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={[styles.statValue, { color: STAT_COLORS[stat.level] }]}>
                {stat.value}<Text style={styles.statUnit}>{stat.unit}</Text>
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Skin advice */}
        <View style={styles.adviceCard}>
          <LinearGradient colors={['rgba(196,98,45,0.12)', 'rgba(196,98,45,0.02)']} style={StyleSheet.absoluteFill} />
          <Ionicons name="bulb-outline" size={20} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.adviceLabel}>TODAY'S SKIN ADVICE</Text>
            <Text style={styles.adviceText}>{report.skinAdvice}</Text>
          </View>
        </View>

        {/* 2-day forecast */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Skin Forecast</Text>
          {report.forecast.map((f, i) => (
            <View key={i} style={[styles.forecastRow, i < report.forecast.length - 1 && styles.forecastBorder]}>
              <Text style={styles.forecastLabel}>{f.label}</Text>
              <Text style={styles.forecastIcon}>{f.icon}</Text>
              <Text style={styles.forecastTip} numberOfLines={2}>{f.tip}</Text>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn} onPress={() => router.push('/checkin')}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>Daily Check-In</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => router.push('/scan')}>
            <Ionicons name="camera-outline" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>Scan Skin</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => router.push('/stress-log')}>
            <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>Log Stress</Text>
          </Pressable>
        </View>

        <Pressable style={styles.refreshBtn} onPress={generateReport}>
          <Ionicons name="refresh-outline" size={16} color={colors.textMuted} />
          <Text style={styles.refreshText}>Refresh report</Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  mainCard: { borderRadius: 24, overflow: 'hidden', padding: 28, gap: 8, marginBottom: 14, alignItems: 'center' },
  dateLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1, textTransform: 'uppercase' },
  conditionEmoji: { fontSize: 64, marginVertical: 8 },
  condition: { fontSize: 26, fontWeight: '900', color: c.white, textAlign: 'center' },
  headline: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 4 },
  summary: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22, marginTop: 4 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  statBlock: { width: '31%', backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 12, alignItems: 'center', gap: 3 },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statUnit: { fontSize: 11, fontWeight: '600' },
  statLabel: { fontSize: 9, color: c.textMuted, fontWeight: '600', textAlign: 'center' },

  adviceCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 14, marginBottom: 14 },
  adviceLabel: { fontSize: 9, fontWeight: '800', color: c.primary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  adviceText: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  card: { backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 16, gap: 0, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary, marginBottom: 12 },
  forecastRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  forecastBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  forecastLabel: { fontSize: 12, fontWeight: '700', color: c.textMuted, width: 70 },
  forecastIcon: { fontSize: 16, width: 80 },
  forecastTip: { flex: 1, fontSize: 12, color: c.textSecondary, lineHeight: 18 },

  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  actionBtn: { flex: 1, backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 12, alignItems: 'center', gap: 6 },
  actionBtnText: { fontSize: 10, fontWeight: '700', color: c.textMuted, textAlign: 'center' },

  refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  refreshText: { fontSize: 12, color: c.textMuted },
  });
}
