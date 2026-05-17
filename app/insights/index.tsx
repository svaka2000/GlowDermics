import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Storage } from '../../src/services/storage';
import {
  GlassHero, Card, Badge, Section, ScatterPlot, BiomarkerCloud, SkinAgeBadge, Skeleton,
} from '../../src/components/ui';
import { runSleepSkinAnalysis, SleepSkinReport } from '../../src/engine/SleepSkinEngine';
import { runUVSkinAnalysis, UVSkinReport } from '../../src/engine/UVSkinEngine';
import { runStreakAnalysis, StreakReport } from '../../src/engine/StreakEngine';
import { runDailyChallengeAnalysis, DailyChallengeReport } from '../../src/engine/DailyChallengeEngine';
import { runSkinForecast, ForecastReport } from '../../src/engine/SkinForecastEngine';
import { runSkinIdentity, SkinIdentity } from '../../src/engine/SkinIdentityEngine';
import { SkinAnalysis } from '../../src/types';
import { useColors } from '../../src/state/theme';

const { width: SCREEN_W } = Dimensions.get('window');

interface HubData {
  latest: SkinAnalysis | null;
  prev: SkinAnalysis | null;
  sleep: SleepSkinReport;
  uv: UVSkinReport;
  streak: StreakReport;
  challenges: DailyChallengeReport;
  forecast: ForecastReport;
  identity: SkinIdentity;
}

/**
 * Insights Hub — single screen surfacing every behavioral correlation
 * GlowDermics knows about your skin. Combines sleep × skin, UV × skin,
 * streak gamification, daily quest stats, and biomarker tags into one
 * "what's going on with my skin this week" dashboard.
 */
export default function InsightsHub() {
  const colors = useColors();
  const [data, setData] = useState<HubData | null>(null);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    Promise.all([
      Storage.getAnalyses(),
      runSleepSkinAnalysis(),
      runUVSkinAnalysis(),
      runStreakAnalysis(),
      runDailyChallengeAnalysis(),
      runSkinForecast(),
      runSkinIdentity(),
    ]).then(([analyses, sleep, uv, streak, challenges, forecast, identity]) => {
      if (!mounted) return;
      setData({
        latest: analyses[0] ?? null,
        prev: analyses[1] ?? null,
        sleep,
        uv,
        streak,
        challenges,
        forecast,
        identity,
      });
    });
    return () => { mounted = false; };
  }, []));

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <GlassHero height={150} tint={colors.primary} style={styles.heroWrap}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.heroBackBtn}
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
              >
                <Ionicons name="arrow-back" size={20} color={'#FFFFFF'} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Insights</Text>
                <Text style={styles.heroSub}>
                  {data
                    ? `${data.streak.totalActiveDays} active days · ${data.challenges.unlockedBadges.length} badges`
                    : 'Loading your data…'}
                </Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </GlassHero>

        <View style={styles.content}>
          {!data ? (
            <View style={{ gap: 14 }}>
              <Skeleton height={140} radius={18} />
              <Skeleton height={220} radius={18} />
              <Skeleton height={220} radius={18} />
            </View>
          ) : (
            <>
              {/* Top-line skin-age + biomarker hero */}
              {data.latest?.skinAge && (
                <View style={{ marginBottom: 14 }}>
                  <SkinAgeBadge skinAge={data.latest.skinAge} />
                </View>
              )}

              {data.latest?.biomarkers && data.latest.biomarkers.length > 0 && (
                <View style={{ marginBottom: 18 }}>
                  <Section
                    title="Biomarker signals"
                    caption="What your last scan flagged most clearly"
                    gap={10}
                  >
                    <BiomarkerCloud biomarkers={data.latest.biomarkers} delay={0} />
                  </Section>
                </View>
              )}

              {/* Identity teaser */}
              <View style={{ marginBottom: 14 }}>
                <Pressable onPress={() => router.push('/identity' as any)}>
                  <Card variant="gradient" tint={data.identity.colorway.accent} padding={18}>
                    <View style={styles.streakRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.streakLabel, { color: '#fff', opacity: 0.78 }]}>
                          YOUR SKIN PERSONA
                        </Text>
                        <Text style={[styles.streakValue, { color: '#fff' }]}>
                          {data.identity.persona}
                        </Text>
                        <Text style={[styles.streakSub, { color: '#fff', opacity: 0.85 }]}>
                          Glow Score {data.identity.glowScore} · {data.identity.element}
                        </Text>
                      </View>
                      <View style={[styles.openBtn, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                        <Ionicons name="finger-print" size={14} color="#fff" />
                        <Text style={[styles.openBtnText, { color: '#fff' }]}>Open</Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              </View>

              {/* Streak summary card */}
              <View style={{ marginBottom: 14 }}>
                <Card variant="gradient" tint={colors.primary} padding={18}>
                  <View style={styles.streakRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.streakLabel, { color: colors.textMuted }]}>
                        CURRENT STREAK
                      </Text>
                      <Text style={[styles.streakValue, { color: colors.primary }]}>
                        {data.streak.currentStreak === 1 ? '1 day' : `${data.streak.currentStreak} days`}
                      </Text>
                      <Text style={[styles.streakSub, { color: colors.textSecondary }]}>
                        {data.streak.daysToNext > 0
                          ? `${data.streak.daysToNext} more for the ${data.streak.nextMilestone}-day milestone`
                          : 'Top tier — keep it going.'}
                      </Text>
                    </View>
                    <Pressable
                      style={[styles.openBtn, { backgroundColor: colors.primary + '14' }]}
                      onPress={() => router.push('/streak')}
                    >
                      <Ionicons name="flame" size={14} color={colors.primary} />
                      <Text style={[styles.openBtnText, { color: colors.primary }]}>Open</Text>
                    </Pressable>
                  </View>
                </Card>
              </View>

              {/* Daily quest summary */}
              <View style={{ marginBottom: 14 }}>
                <Card variant="elevated" padding={18}>
                  <View style={styles.streakRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.streakLabel, { color: colors.textMuted }]}>
                        DAILY QUESTS
                      </Text>
                      <Text style={[styles.streakValue, { color: colors.gold }]}>
                        Level {data.challenges.level} · {data.challenges.state.totalXP.toLocaleString()} XP
                      </Text>
                      <Text style={[styles.streakSub, { color: colors.textSecondary }]}>
                        {data.challenges.todayXP > 0
                          ? `+${data.challenges.todayXP} XP earned today`
                          : data.challenges.primaryDone
                          ? "Today's primary quest complete"
                          : 'Today\'s quest is waiting'}
                      </Text>
                    </View>
                    <Pressable
                      style={[styles.openBtn, { backgroundColor: colors.gold + '20' }]}
                      onPress={() => router.push('/daily-challenges')}
                    >
                      <Ionicons name="trophy" size={14} color={colors.gold} />
                      <Text style={[styles.openBtnText, { color: colors.gold }]}>Open</Text>
                    </Pressable>
                  </View>
                </Card>
              </View>

              {/* 7-Day Forecast preview */}
              <View style={{ marginBottom: 14 }}>
                <Pressable onPress={() => router.push('/seven-day' as any)}>
                  <Card variant="elevated" padding={18}>
                    <View style={styles.streakRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.streakLabel, { color: colors.textMuted }]}>
                          7-DAY FORECAST
                        </Text>
                        <Text style={[styles.streakValue, {
                          color: data.forecast.trend === 'rising' ? colors.scoreGood :
                            data.forecast.trend === 'falling' ? colors.scorePoor :
                            colors.primary,
                        }]}>
                          {data.forecast.days[6].score} by {data.forecast.days[6].dayLabel}
                          {data.forecast.trendDelta !== 0 && (
                            <Text style={{ fontSize: 14 }}>
                              {' '}({data.forecast.trendDelta > 0 ? '+' : ''}{data.forecast.trendDelta})
                            </Text>
                          )}
                        </Text>
                        <Text style={[styles.streakSub, { color: colors.textSecondary }]}>
                          {data.forecast.headline}
                        </Text>
                      </View>
                      <View style={[styles.openBtn, {
                        backgroundColor: (data.forecast.trend === 'rising' ? colors.scoreGood :
                          data.forecast.trend === 'falling' ? colors.scorePoor :
                          colors.primary) + '14',
                      }]}>
                        <Ionicons
                          name={data.forecast.trend === 'rising' ? 'trending-up' :
                                data.forecast.trend === 'falling' ? 'trending-down' :
                                'remove-outline'}
                          size={14}
                          color={data.forecast.trend === 'rising' ? colors.scoreGood :
                                 data.forecast.trend === 'falling' ? colors.scorePoor :
                                 colors.primary}
                        />
                        <Text style={[styles.openBtnText, {
                          color: data.forecast.trend === 'rising' ? colors.scoreGood :
                                 data.forecast.trend === 'falling' ? colors.scorePoor :
                                 colors.primary,
                        }]}>Open</Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              </View>

              {/* Sleep × Skin compact correlation */}
              <View style={{ marginBottom: 14 }}>
                <Section
                  title="Sleep × skin"
                  caption={
                    data.sleep.hasEnoughData
                      ? `r = ${data.sleep.correlationHours.toFixed(2)} across ${data.sleep.sampleSize} matched scans`
                      : `Need ${Math.max(0, 8 - data.sleep.sampleSize)} more matched scans`
                  }
                  actionLabel="Log sleep"
                  onAction={() => router.push('/sleep-log')}
                  gap={10}
                >
                  <Card variant="elevated" padding={14}>
                    {data.sleep.hasEnoughData ? (
                      <View style={{ alignItems: 'center' }}>
                        <ScatterPlot
                          data={data.sleep.points.map(p => ({ x: p.hours, y: p.skinScore }))}
                          width={Math.min(SCREEN_W - 64, 320)}
                          height={170}
                          xLabel="Sleep hours"
                          yLabel="Skin score"
                          xRange={[3, 11]}
                          yRange={[40, 100]}
                          showTrendLine
                        />
                      </View>
                    ) : (
                      <View style={styles.lockedRow}>
                        <Ionicons name="hourglass-outline" size={18} color={colors.textMuted} />
                        <Text style={[styles.lockedText, { color: colors.textSecondary }]}>
                          {data.sleep.verdict}
                        </Text>
                      </View>
                    )}
                    {data.sleep.hasEnoughData && (
                      <View style={[styles.verdictRow, { backgroundColor: colors.primary + '0F' }]}>
                        <Ionicons name="bulb" size={12} color={colors.primary} />
                        <Text style={[styles.verdictText, { color: colors.textPrimary }]}>
                          {data.sleep.verdict}
                        </Text>
                      </View>
                    )}
                  </Card>
                </Section>
              </View>

              {/* UV × Skin compact correlation */}
              <View style={{ marginBottom: 14 }}>
                <Section
                  title="UV × skin"
                  caption={
                    data.uv.hasEnoughData
                      ? `r = ${data.uv.correlationDamage.toFixed(2)} across ${data.uv.sampleSize} matched scans`
                      : `Need ${Math.max(0, 8 - data.uv.sampleSize)} more matched scans`
                  }
                  actionLabel="Log UV"
                  onAction={() => router.push('/uv-log')}
                  gap={10}
                >
                  <Card variant="elevated" padding={14}>
                    {data.uv.hasEnoughData ? (
                      <View style={{ alignItems: 'center' }}>
                        <ScatterPlot
                          data={data.uv.points.map(p => ({ x: p.uvDamage, y: p.skinScore }))}
                          width={Math.min(SCREEN_W - 64, 320)}
                          height={170}
                          xLabel="Effective UV damage"
                          yLabel="Skin score"
                          xRange={[
                            0,
                            Math.max(60, Math.ceil(Math.max(...data.uv.points.map(p => p.uvDamage)) / 30) * 30),
                          ]}
                          yRange={[40, 100]}
                          showTrendLine
                        />
                      </View>
                    ) : (
                      <View style={styles.lockedRow}>
                        <Ionicons name="hourglass-outline" size={18} color={colors.textMuted} />
                        <Text style={[styles.lockedText, { color: colors.textSecondary }]}>
                          {data.uv.verdict}
                        </Text>
                      </View>
                    )}
                    {data.uv.hasEnoughData && (
                      <View style={[styles.verdictRow, { backgroundColor: colors.primary + '0F' }]}>
                        <Ionicons name="bulb" size={12} color={colors.primary} />
                        <Text style={[styles.verdictText, { color: colors.textPrimary }]}>
                          {data.uv.verdict}
                        </Text>
                      </View>
                    )}
                  </Card>
                </Section>
              </View>

              {/* "Take action" card combining the strongest signal */}
              <Card variant="gradient" tint={colors.scoreExcellent} padding={16}>
                <View style={styles.takeActionRow}>
                  <View style={[styles.takeActionIcon, { backgroundColor: colors.scoreExcellent + '14' }]}>
                    <Ionicons name="rocket" size={16} color={colors.scoreExcellent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.takeActionLabel, { color: colors.scoreExcellent }]}>
                      NEXT BEST ACTION
                    </Text>
                    <Text style={[styles.takeActionTitle, { color: colors.textPrimary }]}>
                      {pickNextAction(data)}
                    </Text>
                  </View>
                </View>
              </Card>

              <View style={{ height: 60 }} />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Pick the highest-leverage next action based on current data.
 * Order of priority:
 *   1. Streak in danger (if today not logged after noon)
 *   2. Sleep correlation strong → encourage more sleep
 *   3. UV correlation strong negative → encourage SPF
 *   4. Daily quest not done → nudge it
 *   5. Default: take a fresh scan
 */
function pickNextAction(data: HubData): string {
  if (data.streak.atRisk) {
    return 'Log a routine or take a scan today — your streak is at risk.';
  }
  if (data.sleep.hasEnoughData && data.sleep.correlationHours > 0.4 && data.sleep.optimalRange) {
    return `Aim for ${data.sleep.optimalRange} of sleep tonight — your data shows the strongest skin lift in that range.`;
  }
  if (data.uv.hasEnoughData && data.uv.correlationDamage < -0.4) {
    return 'Reapply SPF every 2 hours today — your UV exposure is measurably tracking down your skin score.';
  }
  if (!data.challenges.primaryDone) {
    return `Today's quest: ${data.challenges.primary.title} (+${data.challenges.primary.xp} XP).`;
  }
  if (data.latest && data.prev && data.latest.scores.overall < data.prev.scores.overall) {
    return 'Take a fresh scan — your last reading was lower than the previous; verify the trend.';
  }
  return 'Take a fresh scan to update your insights.';
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
    fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.78)', marginTop: 2, fontWeight: '600' },

  content: { paddingHorizontal: 16 },

  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  streakValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4, marginTop: 4 },
  streakSub: { fontSize: 12, marginTop: 4, fontWeight: '600' },

  openBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999,
  },
  openBtnText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.4 },

  lockedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
  },
  lockedText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '500' },

  verdictRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 10, padding: 10, marginTop: 12,
  },
  verdictText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '500' },

  takeActionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  takeActionIcon: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  takeActionLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  takeActionTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19, marginTop: 4 },
});
