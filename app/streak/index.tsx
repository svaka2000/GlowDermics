import { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { fonts } from '../../src/constants/typography';
import {
  GlassHero, Card, Badge, Button, Section, StreakRing,
} from '../../src/components/ui';
import { runStreakAnalysis, StreakReport, MILESTONES } from '../../src/engine/StreakEngine';

const { width: SCREEN_W } = Dimensions.get('window');

export default function StreakScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [report, setReport] = useState<StreakReport | null>(null);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    runStreakAnalysis().then(r => {
      if (mounted) setReport(r);
    });
    return () => { mounted = false; };
  }, []));

  if (!report) {
    return (
      <View style={styles.root}>
        <GlassHero height={130} tint={colors.primary} style={styles.heroWrap}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.heroBackBtn}
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
              >
                <Ionicons name="arrow-back" size={20} color={colors.white} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Streak</Text>
                <Text style={styles.heroSub}>Loading…</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </GlassHero>
      </View>
    );
  }

  const noStreakYet = report.currentStreak === 0 && report.longestStreak === 0;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <GlassHero height={130} tint={colors.primary} style={styles.heroWrap}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.heroBackBtn}
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
              >
                <Ionicons name="arrow-back" size={20} color={colors.white} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Your streak</Text>
                <Text style={styles.heroSub}>
                  {report.unlocksCount} of {MILESTONES.length} milestones unlocked
                </Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </GlassHero>

        <View style={styles.content}>
          <Pressable
            style={styles.msCta}
            onPress={() => router.push('/milestones-celebrate' as any)}
            accessibilityRole="button"
            accessibilityLabel="View your milestones"
          >
            <View style={styles.msCtaText}>
              <Text style={styles.msCtaEyebrow}>YOUR STREAK LADDER</Text>
              <Text style={styles.msCtaTitle}>Milestones</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </Pressable>
          {/* Hero ring card */}
          <Card variant="elevated" padding={18} style={{ alignItems: 'center', marginBottom: 14 }}>
            <View style={{ marginBottom: 14 }}>
              <StreakRing
                currentStreak={report.currentStreak}
                nextMilestone={report.nextMilestone}
                size={Math.min(SCREEN_W - 100, 220)}
                atRisk={report.atRisk}
                subLabel={
                  report.daysToNext > 0
                    ? `${report.daysToNext} to ${report.nextMilestone}-day milestone`
                    : 'Milestone reached!'
                }
              />
            </View>

            {/* At-risk banner */}
            {report.atRisk && (
              <View style={styles.riskBanner}>
                <Ionicons name="alert-circle" size={14} color={colors.scorePoor} />
                <Text style={styles.riskText}>
                  Don't break the chain — log a routine or take a scan today.
                </Text>
              </View>
            )}

            {/* Today logged celebration */}
            {report.todayLogged && report.currentStreak > 0 && !report.atRisk && (
              <View style={styles.celebrateBanner}>
                <Ionicons name="checkmark-circle" size={14} color={colors.scoreExcellent} />
                <Text style={styles.celebrateText}>
                  Today's locked in — see you tomorrow.
                </Text>
              </View>
            )}

            {/* Quick actions */}
            <View style={styles.actionsRow}>
              <Pressable style={styles.actionBtn} onPress={() => router.push('/scan')}>
                <Ionicons name="scan-outline" size={14} color={colors.primary} />
                <Text style={styles.actionText}>Scan</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => router.push('/(tabs)/routine')}>
                <Ionicons name="checkmark-done-outline" size={14} color={colors.primary} />
                <Text style={styles.actionText}>Log routine</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => router.push('/checkin')}>
                <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
                <Text style={styles.actionText}>Check-in</Text>
              </Pressable>
            </View>
          </Card>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <Stat
              label="Best ever"
              value={`${report.longestStreak}d`}
              tone={report.longestStreak >= 30 ? colors.gold : colors.primary}
              icon="trophy"
            />
            <Stat
              label="Total days"
              value={`${report.totalActiveDays}`}
              tone={colors.scoreExcellent}
              icon="calendar"
            />
            <Stat
              label="Unlocked"
              value={`${report.unlocksCount}/${MILESTONES.length}`}
              tone={colors.darkCircles}
              icon="ribbon"
            />
          </View>

          {/* Last 28 days calendar */}
          <Section title="Last 28 days" caption="Each square is a day. Filled = activity logged.">
            <Card variant="elevated" padding={14}>
              <View style={styles.calendarGrid}>
                {report.last28.map((d, i) => (
                  <CalendarCell key={d.date} day={d} index={i} />
                ))}
              </View>
              <View style={styles.calendarLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.legendText}>Active</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: 'rgba(28,24,20,0.10)' },
                    ]}
                  />
                  <Text style={styles.legendText}>Empty</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: colors.gold, borderWidth: 2, borderColor: '#fff' },
                    ]}
                  />
                  <Text style={styles.legendText}>Today</Text>
                </View>
              </View>
            </Card>
          </Section>

          {/* Milestones timeline */}
          <Section title="Milestones" caption="Hit each tier with a streak that long.">
            <View style={{ gap: 10 }}>
              {report.milestones.map((m, i) => (
                <MilestoneRow
                  key={m.days}
                  milestone={m}
                  isCurrent={!m.unlocked && report.nextMilestone === m.days}
                  delay={i * 60}
                />
              ))}
            </View>
          </Section>

          {/* Empty state nudge */}
          {noStreakYet && (
            <Card variant="gradient" tint={colors.primary} padding={18} style={{ marginTop: 14 }}>
              <Text style={styles.emptyTitle}>Start your first streak</Text>
              <Text style={styles.emptySub}>
                Take a scan or log a routine today and you're on the board. The first 3-day streak unlocks
                "Spark" — your first badge.
              </Text>
              <View style={{ marginTop: 12 }}>
                <Button label="Take a scan" icon="scan" onPress={() => router.push('/scan')} />
              </View>
            </Card>
          )}

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Sub-components ---------- */

function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Card variant="elevated" padding={12} style={styles.statCard}>
      <View style={[styles.statIconBubble, { backgroundColor: tone + '15' }]}>
        <Ionicons name={icon} size={16} color={tone} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function CalendarCell({ day, index }: { day: { date: string; logged: boolean; isToday: boolean }; index: number }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);

  useFocusEffect(useCallback(() => {
    opacity.value = withDelay(index * 18, withTiming(1, { duration: 240 }));
    scale.value = withDelay(index * 18, withSpring(1, { damping: 14, stiffness: 220 }));
    return undefined;
  }, [index])); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.calendarCell,
        {
          backgroundColor: day.logged
            ? colors.primary
            : day.isToday
            ? colors.gold + '40'
            : 'rgba(28,24,20,0.10)',
          borderColor: day.isToday ? colors.gold : 'transparent',
          borderWidth: day.isToday ? 2 : 0,
        },
        animStyle,
      ]}
    />
  );
}

function MilestoneRow({
  milestone,
  isCurrent,
  delay,
}: {
  milestone: { days: number; label: string; emoji: string; unlocked: boolean };
  isCurrent: boolean;
  delay: number;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-8);

  useFocusEffect(useCallback(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 320 }));
    translateX.value = withDelay(delay, withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) }));
    return undefined;
  }, [delay])); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Card
        variant={milestone.unlocked ? 'gradient' : isCurrent ? 'glow' : 'outline'}
        tint={milestone.unlocked ? colors.scoreExcellent : colors.primary}
        padding={14}
      >
        <View style={styles.milestoneRow}>
          <View
            style={[
              styles.milestoneEmojiWrap,
              {
                backgroundColor: milestone.unlocked
                  ? 'rgba(22,163,74,0.16)'
                  : isCurrent
                  ? 'rgba(138,120,96,0.14)'
                  : 'rgba(28,24,20,0.05)',
              },
            ]}
          >
            <Text style={styles.milestoneEmoji}>{milestone.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.milestoneLabel, !milestone.unlocked && !isCurrent && { color: colors.textMuted }]}>
              {milestone.label}
            </Text>
            <Text style={[styles.milestoneSub, !milestone.unlocked && !isCurrent && { color: colors.textMuted }]}>
              {milestone.days}-day streak
            </Text>
          </View>
          {milestone.unlocked ? (
            <Badge label="UNLOCKED" tone="success" size="xs" icon="checkmark" />
          ) : isCurrent ? (
            <Badge label="NEXT" tone="primary" size="xs" />
          ) : (
            <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
          )}
        </View>
      </Card>
    </Animated.View>
  );
}

/* ---------- Styles ---------- */

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingBottom: 40 },

  heroWrap: { marginBottom: 14 },
  heroHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12, gap: 12,
  },
  heroBackBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22, fontWeight: '900', color: c.white, letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.78)', marginTop: 2, fontWeight: '600' },

  content: { paddingHorizontal: 16 },
  msCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.bgCard, borderRadius: 18, borderWidth: 1, borderColor: c.borderStrong, paddingHorizontal: 18, paddingVertical: 16, marginBottom: 14 },
  msCtaText: { flex: 1, gap: 3 },
  msCtaEyebrow: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', letterSpacing: 2.4, color: c.primary, textTransform: 'uppercase' },
  msCtaTitle: { fontFamily: fonts.display, fontSize: 17, fontWeight: '600', color: c.textPrimary, letterSpacing: 0.2 },

  riskBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(220,38,38,0.10)',
    borderColor: 'rgba(220,38,38,0.30)',
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 9,
    width: '100%',
    marginBottom: 12,
  },
  riskText: { flex: 1, fontSize: 12, fontWeight: '700', color: c.scorePoor, lineHeight: 17 },

  celebrateBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(22,163,74,0.10)',
    borderColor: 'rgba(22,163,74,0.30)',
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 9,
    width: '100%',
    marginBottom: 12,
  },
  celebrateText: { flex: 1, fontSize: 12, fontWeight: '700', color: c.scoreExcellent },

  actionsRow: { flexDirection: 'row', gap: 8, width: '100%' },
  actionBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: 'rgba(138,120,96,0.06)',
    borderWidth: 1, borderColor: 'rgba(138,120,96,0.22)',
    borderRadius: 12,
    paddingVertical: 10,
  },
  actionText: { fontSize: 11, fontWeight: '800', color: c.primary, letterSpacing: 0.2 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statIconBubble: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  statValue: { fontSize: 18, fontWeight: '900', color: c.textPrimary, letterSpacing: -0.3 },
  statLabel: { fontSize: 9, color: c.textMuted, fontWeight: '900', letterSpacing: 1 },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  calendarCell: {
    width: '12%',
    aspectRatio: 1,
    borderRadius: 4,
  },
  calendarLegend: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 14,
    justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 10, fontWeight: '700', color: c.textMuted, letterSpacing: 0.4 },

  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  milestoneEmojiWrap: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  milestoneEmoji: { fontSize: 18 },
  milestoneLabel: { fontSize: 14, fontWeight: '900', color: c.textPrimary, letterSpacing: -0.2 },
  milestoneSub: { fontSize: 11, color: c.textSecondary, fontWeight: '600', marginTop: 1 },

  emptyTitle: { fontSize: 17, fontWeight: '900', color: c.textPrimary, letterSpacing: -0.3 },
  emptySub: { fontSize: 13, color: c.textSecondary, lineHeight: 19, fontWeight: '500', marginTop: 4 },
  });
}
