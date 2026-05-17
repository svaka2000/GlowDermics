import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Share, Animated, Easing, Platform, Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';
import { Auth } from '../../src/services/auth';
import { ScoreRing } from '../../src/components/ScoreRing';
import { SkinAnalysis, UserProfile } from '../../src/types';

function getGradeFromScore(score: number, c: Palette): { grade: string; label: string; color: string } {
  if (score >= 90) return { grade: 'A+', label: 'Exceptional', color: '#4ADE80' };
  if (score >= 80) return { grade: 'A', label: 'Excellent', color: '#4ADE80' };
  if (score >= 70) return { grade: 'B+', label: 'Great', color: '#86EFAC' };
  if (score >= 60) return { grade: 'B', label: 'Good', color: c.gold };
  if (score >= 50) return { grade: 'C', label: 'Fair', color: c.gold };
  return { grade: 'D', label: 'Needs Work', color: '#FCA5A5' };
}

function getStreakBadge(streak: number): string {
  if (streak >= 30) return '🔥 Streak Master';
  if (streak >= 14) return '⚡ On a Roll';
  if (streak >= 7) return '✨ Building Habit';
  if (streak >= 3) return '🌱 Getting Started';
  return '🆕 New Member';
}

function buildMetricConfig(c: Palette) {
  return [
    { key: 'hydration', label: 'Hydration', icon: '💧', color: '#60A5FA' },
    { key: 'clarity', label: 'Clarity', icon: '✨', color: '#4ADE80' },
    { key: 'texture', label: 'Texture', icon: '🫧', color: '#A78BFA' },
    { key: 'evenness', label: 'Evenness', icon: '🌟', color: c.gold },
    { key: 'firmness', label: 'Firmness', icon: '💪', color: c.primary },
    { key: 'pores', label: 'Pores', icon: '🔬', color: '#F472B6' },
  ] as const;
}

function MetricBar({ label, icon, value, color, delay }: { label: string; icon: string; value: number; color: string; delay: number }) {
  const palette = useColors();
  const metricStyles = useMemo(() => makeMetricStyles(palette), [palette]);
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.timing(fillAnim, {
        toValue: value / 100,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, delay);
  }, [value]);

  return (
    <View style={metricStyles.row}>
      <Text style={metricStyles.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={metricStyles.label}>{label}</Text>
          <Text style={[metricStyles.value, { color }]}>{value}</Text>
        </View>
        <View style={metricStyles.track}>
          <Animated.View
            style={[metricStyles.fill, {
              backgroundColor: color,
              width: fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }]}
          />
        </View>
      </View>
    </View>
  );
}

function makeMetricStyles(c: Palette) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    icon: { fontSize: 16, width: 22, textAlign: 'center' },
    label: { fontSize: 12, color: c.textSecondary, fontWeight: '600' },
    value: { fontSize: 13, fontWeight: '800' },
    track: { height: 6, backgroundColor: c.bgElevated, borderRadius: 3, overflow: 'hidden' },
    fill: { height: 6, borderRadius: 3 },
  });
}

export default function SkinScorecard() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const METRIC_CONFIG = useMemo(() => buildMetricConfig(colors), [colors]);
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);

  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.94)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  const load = async () => {
    const [a, p, s] = await Promise.all([
      Storage.getLatestAnalysis(),
      Storage.getUserProfile(),
      Storage.getStreak(),
    ]);
    setAnalysis(a);
    setProfile(p);
    setStreak(s);
    setLoading(false);

    Animated.stagger(80, [
      Animated.parallel([
        Animated.timing(cardAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 1, duration: 600, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      ]),
      Animated.timing(statsAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleShare = async () => {
    if (!analysis || !profile) return;
    const grade = getGradeFromScore(analysis.scores.overall, colors);
    const name = profile.name || 'I';
    const text = [
      `🌿 GlowDermics Skin Scorecard`,
      ``,
      `${name}'s Skin Grade: ${grade.grade} (${grade.label})`,
      `Overall Score: ${analysis.scores.overall}/100`,
      `Skin Type: ${analysis.skinType?.charAt(0).toUpperCase() + (analysis.skinType?.slice(1) ?? '')}`,
      ``,
      `📊 Metrics:`,
      `  💧 Hydration: ${analysis.scores.hydration}/100`,
      `  ✨ Clarity: ${analysis.scores.clarity}/100`,
      `  🫧 Texture: ${analysis.scores.texture}/100`,
      `  🌟 Evenness: ${analysis.scores.evenness}/100`,
      ``,
      `🔥 ${streak}-day streak`,
      ``,
      `Track your skin journey with GlowDermics — AI-powered skincare that actually works.`,
    ].join('\n');

    try {
      await Share.share({ message: text, title: 'My GlowDermics Skin Score' });
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } catch {}
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
        </SafeAreaView>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.Text style={{ fontSize: 32, color: colors.primary }}>✦</Animated.Text>
        </View>
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
        </SafeAreaView>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>🌿</Text>
          <Text style={styles.emptyTitle}>No scan data yet</Text>
          <Text style={styles.emptySub}>Take your first AI skin scan to generate your personalized scorecard.</Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.replace('/scan')}>
            <LinearGradient colors={[colors.primaryLight, colors.primary]} style={styles.emptyBtnGrad}>
              <Ionicons name="scan" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>Start Scan</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  const grade = getGradeFromScore(analysis.scores.overall, colors);
  const streakBadge = getStreakBadge(streak);
  const skinTypeFmt = analysis.skinType
    ? analysis.skinType.charAt(0).toUpperCase() + analysis.skinType.slice(1)
    : 'Unknown';

  // Top 2 strengths
  const topStrengths = Object.entries({
    Hydration: analysis.scores.hydration,
    Clarity: analysis.scores.clarity,
    Texture: analysis.scores.texture,
    Evenness: analysis.scores.evenness,
    Firmness: analysis.scores.firmness,
    Pores: analysis.scores.pores,
  })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => k);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.navTitle}>Your Scorecard</Text>
          <Pressable onPress={handleShare} style={styles.shareNavBtn}>
            <Ionicons name={shared ? 'checkmark' : 'share-outline'} size={20} color={colors.primary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Main card */}
        <Animated.View style={{
          opacity: cardAnim,
          transform: [{ scale: cardScale }],
        }}>
          <View style={styles.mainCard}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark, '#7A3318']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Shimmer overlay */}
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, {
                opacity: 0.15,
                transform: [{
                  translateX: shimmer.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-300, 300],
                  }),
                }],
              }]}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flex: 1, width: 120 }}
              />
            </Animated.View>

            {/* Card header */}
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardBrand}>GLOWDERMICS</Text>
                <Text style={styles.cardTagline}>AI SKIN SCORECARD</Text>
              </View>
              <View style={styles.gradeBadge}>
                <Text style={[styles.gradeText, { color: grade.color }]}>{grade.grade}</Text>
              </View>
            </View>

            {/* Name + type */}
            <View style={styles.cardIdentity}>
              <Text style={styles.cardName}>{profile?.name || 'Skin Report'}</Text>
              <View style={styles.skinTypePill}>
                <Text style={styles.skinTypePillText}>{skinTypeFmt.toUpperCase()} SKIN</Text>
              </View>
            </View>

            {/* Score ring + grade */}
            <View style={styles.scoreRow}>
              <View style={styles.scoreRingWrap}>
                <ScoreRing score={analysis.scores.overall} size={110} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={styles.gradeLabel}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {grade.label}
                </Text>
                <Text style={styles.gradeSubtext}>
                  Better than{' '}
                  <Text style={{ fontWeight: '800' }}>
                    {Math.min(98, analysis.scores.overall)}%
                  </Text>
                  {' '}of users
                </Text>
                <View style={styles.streakBadgeRow}>
                  <Text style={styles.streakBadgeText}>{streakBadge}</Text>
                </View>
                {streak > 0 && (
                  <Text style={styles.streakDetail}>{streak} day streak</Text>
                )}
              </View>
            </View>

            {/* Mini metric grid */}
            <View style={styles.miniMetrics}>
              {[
                { label: 'Hydration', val: analysis.scores.hydration, color: '#60A5FA' },
                { label: 'Clarity', val: analysis.scores.clarity, color: '#4ADE80' },
                { label: 'Texture', val: analysis.scores.texture, color: '#A78BFA' },
                { label: 'Evenness', val: analysis.scores.evenness, color: colors.gold },
              ].map(m => (
                <View key={m.label} style={styles.miniMetricItem}>
                  <Text style={[styles.miniMetricVal, { color: m.color }]}>{m.val}</Text>
                  <Text style={styles.miniMetricLabel}>{m.label}</Text>
                </View>
              ))}
            </View>

            {/* Top strengths */}
            <View style={styles.strengthsRow}>
              <Ionicons name="star" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.strengthsText}>
                Top strengths: {topStrengths.join(' · ')}
              </Text>
            </View>

            {/* Scan date */}
            <View style={styles.cardFooter}>
              <Text style={styles.cardDate}>
                {new Date(analysis.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
              <Text style={styles.cardDomain}>glowdermics.app</Text>
            </View>
          </View>
        </Animated.View>

        {/* Full metrics breakdown */}
        <Animated.View style={{
          opacity: statsAnim,
          transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        }}>
          <View style={styles.metricsCard}>
            <Text style={styles.metricsTitle}>Full Breakdown</Text>
            {METRIC_CONFIG.map((m, i) => (
              <MetricBar
                key={m.key}
                label={m.label}
                icon={m.icon}
                value={analysis.scores[m.key as keyof typeof analysis.scores] ?? 0}
                color={m.color}
                delay={i * 80}
              />
            ))}
          </View>

          {/* Concerns */}
          {analysis.concerns.length > 0 && (
            <View style={styles.concernsCard}>
              <Text style={styles.concernsTitle}>Top Concerns to Address</Text>
              <View style={styles.concernChips}>
                {analysis.concerns.map(c => (
                  <View key={c} style={styles.concernChip}>
                    <Text style={styles.concernChipText}>{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Top insight */}
          {analysis.insights && (
            <View style={styles.insightCard}>
              <LinearGradient colors={['rgba(212,169,106,0.12)', 'rgba(212,169,106,0.04)']} style={StyleSheet.absoluteFill} />
              <View style={styles.insightHeader}>
                <Ionicons name="bulb" size={16} color={colors.gold} />
                <Text style={styles.insightTitle}>AI Insight</Text>
              </View>
              <Text style={styles.insightText}>{analysis.insights}</Text>
            </View>
          )}

          {/* How to improve */}
          <View style={styles.improveCard}>
            <LinearGradient colors={[colors.primary + '12', colors.primary + '04']} style={StyleSheet.absoluteFill} />
            <Text style={styles.improveTitle}>Ready to level up?</Text>
            <View style={styles.improveActions}>
              <Pressable style={styles.improveBtn} onPress={() => router.push('/scan')}>
                <Ionicons name="scan-outline" size={16} color={colors.primary} />
                <Text style={styles.improveBtnText}>Rescan</Text>
              </Pressable>
              <Pressable style={styles.improveBtn} onPress={() => router.push('/(tabs)/coach')}>
                <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                <Text style={styles.improveBtnText}>Ask Coach</Text>
              </Pressable>
              <Pressable style={styles.improveBtn} onPress={() => router.push('/(tabs)/routine')}>
                <Ionicons name="list-outline" size={16} color={colors.primary} />
                <Text style={styles.improveBtnText}>Routine</Text>
              </Pressable>
            </View>
          </View>

          {/* Share CTA */}
          <Pressable style={styles.shareCta} onPress={handleShare}>
            <LinearGradient
              colors={[colors.primaryLight, colors.primary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.shareCtaContent}>
              <Ionicons name="share-social" size={24} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={styles.shareCtaTitle}>
                  {shared ? '✓ Copied to clipboard!' : 'Share Your Scorecard'}
                </Text>
                <Text style={styles.shareCtaSub}>
                  Let the world see your skin transformation journey
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
            </View>
          </Pressable>

          {/* Community CTA */}
          <Pressable style={styles.communityCard} onPress={() => router.push('/community')}>
            <View style={{ flex: 1 }}>
              <Text style={styles.communityTitle}>See how you rank</Text>
              <Text style={styles.communitySub}>Check your position in the GlowDermics leaderboard</Text>
            </View>
            <View style={styles.communityArrow}>
              <Ionicons name="trophy" size={20} color={colors.gold} />
            </View>
          </Pressable>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  navBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: c.textPrimary },
  backBtn: { padding: 6 },
  shareNavBtn: { padding: 6 },

  mainCard: {
    borderRadius: 24, overflow: 'hidden', marginBottom: 20,
    shadowColor: c.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 12,
    padding: 24, gap: 0,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardBrand: { fontSize: 11, fontWeight: '900', letterSpacing: 3, color: 'rgba(255,255,255,0.9)' },
  cardTagline: { fontSize: 9, fontWeight: '600', letterSpacing: 1.5, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  gradeBadge: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  gradeText: { fontSize: 20, fontWeight: '900' },

  cardIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  cardName: { fontSize: 22, fontWeight: '800', color: '#fff', flex: 1 },
  skinTypePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  skinTypePillText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: 'rgba(255,255,255,0.9)' },

  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 },
  scoreRingWrap: {},
  gradeLabel: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  gradeSubtext: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 10 },
  streakBadgeRow: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    marginBottom: 4,
  },
  streakBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  streakDetail: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },

  miniMetrics: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 14,
    marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  miniMetricItem: { flex: 1, alignItems: 'center', gap: 2 },
  miniMetricVal: { fontSize: 18, fontWeight: '900' },
  miniMetricLabel: { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '600', textAlign: 'center' },

  strengthsRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 16 },
  strengthsText: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', paddingTop: 12 },
  cardDate: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },
  cardDomain: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)' },

  metricsCard: {
    backgroundColor: c.bgCard, borderRadius: 20,
    borderWidth: 1, borderColor: c.border,
    padding: 20, marginBottom: 14,
  },
  metricsTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary, marginBottom: 16 },

  concernsCard: {
    backgroundColor: c.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: c.border,
    padding: 16, marginBottom: 14,
  },
  concernsTitle: { fontSize: 13, fontWeight: '700', color: c.textPrimary, marginBottom: 10 },
  concernChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  concernChip: { backgroundColor: 'rgba(196,98,45,0.1)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  concernChipText: { fontSize: 12, color: c.primary, fontWeight: '600' },

  insightCard: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(212,169,106,0.2)',
    padding: 16, marginBottom: 14,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  insightTitle: { fontSize: 12, fontWeight: '700', color: c.gold },
  insightText: { fontSize: 13, color: c.textPrimary, lineHeight: 20 },

  improveCard: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: c.borderStrong,
    padding: 16, marginBottom: 14,
  },
  improveTitle: { fontSize: 14, fontWeight: '700', color: c.textPrimary, marginBottom: 12 },
  improveActions: { flexDirection: 'row', gap: 10 },
  improveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: c.bgElevated, borderRadius: 12,
    borderWidth: 1, borderColor: c.border, paddingVertical: 10,
  },
  improveBtnText: { fontSize: 12, fontWeight: '600', color: c.primary },

  shareCta: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 14,
    shadowColor: c.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  shareCtaContent: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 },
  shareCtaTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 2 },
  shareCtaSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  communityCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: c.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: c.border,
    padding: 16, marginBottom: 14,
  },
  communityTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  communitySub: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  communityArrow: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: c.bgElevated, alignItems: 'center', justifyContent: 'center',
  },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: c.textPrimary, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyBtn: { borderRadius: 16, overflow: 'hidden' },
  emptyBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  });
}
