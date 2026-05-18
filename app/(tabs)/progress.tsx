import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Animated, Easing, RefreshControl, Share } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { fonts } from '../../src/constants/typography';
import { Storage } from '../../src/services/storage';
import { ScanHistoryEntry } from '../../src/types';
import { ScoreRing } from '../../src/components/ScoreRing';
import { ScoreChart } from '../../src/components/ScoreChart';
import { runSkinProgressEngine, EngineReport } from '../../src/engine/SkinProgressEngine';
import { runRoutineOptimizer, OptimizedRoutine } from '../../src/engine/RoutineOptimizer';
import { GlassHero } from '../../src/components/ui';

type Metric = 'overall' | 'hydration' | 'texture' | 'clarity' | 'evenness' | 'firmness' | 'pores';

const METRICS: { key: Metric; label: string }[] = [
  { key: 'overall', label: 'Overall' },
  { key: 'hydration', label: 'Hydration' },
  { key: 'texture', label: 'Texture' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'evenness', label: 'Evenness' },
  { key: 'firmness', label: 'Firmness' },
  { key: 'pores', label: 'Pores' },
];

function getDelta(current: number, previous: number) {
  const val = current - previous;
  return { val: Math.round(val), positive: val >= 0 };
}

export default function Progress() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<Metric>('overall');
  const [routineStreak, setRoutineStreak] = useState(0);
  const [articlesRead, setArticlesRead] = useState(0);
  const [journalCount, setJournalCount] = useState(0);
  const [engineReport, setEngineReport] = useState<EngineReport | null>(null);
  const [optimizedRoutine, setOptimizedRoutine] = useState<OptimizedRoutine | null>(null);

  // Entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;
  const chipGlow = useRef(new Animated.Value(1)).current;

  const runEntrance = () => {
    headerAnim.setValue(0);
    statsAnim.setValue(0);
    chartAnim.setValue(0);
    Animated.stagger(100, [
      Animated.timing(headerAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(statsAnim, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(chartAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    // Pulse the active metric chip
    Animated.loop(
      Animated.sequence([
        Animated.timing(chipGlow, { toValue: 1.08, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(chipGlow, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [h, rs, ar, journal] = await Promise.all([
        Storage.getScanHistory(),
        Storage.getRoutineStreak(),
        Storage.getReadArticles(),
        Storage.getJournal(),
      ]);
      setHistory(h);
      setRoutineStreak(rs);
      setArticlesRead(ar.length);
      setJournalCount(journal.length);
      runEntrance();

      // Run engine in background after UI renders
      const report = await runSkinProgressEngine();
      setEngineReport(report);
      if (report && h.length > 0) {
        const allAnalyses = await Storage.getAnalyses();
        const latest = allAnalyses[0];
        if (latest) {
          const routine = await runRoutineOptimizer(latest, report);
          setOptimizedRoutine(routine);
        }
      }
    })();
  }, []));

  const latest = history[0];
  const previous = history[1];
  const oldest = history[history.length - 1];

  // Build chart data for selected metric (chronological order for chart)
  const chartData = [...history]
    .reverse()
    .map(h => ({
      date: h.date,
      value: selectedMetric === 'overall' ? h.overallScore : h.scores[selectedMetric],
    }));

  if (!history.length) {
    return (
      <View style={styles.root}>
        <GlassHero height={140} tint={colors.primary}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroHeader}>
              <Text style={styles.heroTitle}>Progress</Text>
            </View>
          </SafeAreaView>
        </GlassHero>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>📈</Text>
          <Text style={styles.emptyTitle}>Nothing to track yet</Text>
          <Text style={styles.emptySub}>Complete your first scan to start tracking your skin journey over time.</Text>
          <Pressable style={styles.scanBtn} onPress={() => router.push('/scan')}>
            <Text style={styles.scanBtnText}>Take First Scan →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <GlassHero height={170} tint={colors.primary}>
          <SafeAreaView edges={['top']}>
            <Animated.View style={{
              opacity: headerAnim,
              transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
            }}>
              <View style={styles.heroHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>Progress</Text>
                  <Text style={styles.heroSub}>{history.length} scan{history.length !== 1 ? 's' : ''} · {(() => { const d = history.length >= 2 ? Math.round((new Date(latest.date).getTime() - new Date(oldest.date).getTime()) / 86400000) : -1; return d > 0 ? `${d} days` : d === 0 ? 'same day' : 'just started'; })()}</Text>
                </View>
                {latest && (
                  <View style={styles.heroScoreBadge}>
                    <Text style={styles.heroScoreNum}>{latest.overallScore}</Text>
                    <Text style={styles.heroScoreLabel}>OVERALL</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          </SafeAreaView>
        </GlassHero>

        <Pressable
          style={styles.trendsCta}
          onPress={() => router.push('/skin-trends' as any)}
          accessibilityRole="button"
          accessibilityLabel="View your skin trends"
        >
          <View style={styles.trendsCtaText}>
            <Text style={styles.trendsCtaEyebrow}>EVERY DIMENSION, OVER TIME</Text>
            <Text style={styles.trendsCtaTitle}>Skin Trends</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </Pressable>

        <Pressable
          style={styles.baCta}
          onPress={() => router.push('/before-after' as any)}
          accessibilityRole="button"
          accessibilityLabel="See your before and after"
        >
          <View style={styles.baCtaText}>
            <Text style={styles.baCtaEyebrow}>SEE YOUR TRANSFORMATION</Text>
            <Text style={styles.baCtaTitle}>Before / After</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </Pressable>

        {/* XP / Level card */}
        {(() => {
          const xp = (history.length * 50) + (routineStreak * 10) + (journalCount * 5) + (articlesRead * 8);
          const level = Math.floor(xp / 200) + 1;
          const xpInLevel = xp % 200;
          const levelLabel = level >= 10 ? '💎 Diamond' : level >= 7 ? '🥇 Gold' : level >= 4 ? '🥈 Silver' : '🥉 Bronze';
          return (
            <Pressable style={styles.xpCard} onPress={() => router.push('/milestones')}>
              <LinearGradient
                colors={[colors.primaryDark, colors.primary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text style={styles.xpLevel}>Level {level}</Text>
                  <View style={styles.xpLevelBadge}>
                    <Text style={styles.xpLevelBadgeText}>{levelLabel}</Text>
                  </View>
                </View>
                <Text style={styles.xpTotal}>{xp.toLocaleString()} XP total</Text>
                <View style={styles.xpBarTrack}>
                  <View style={[styles.xpBarFill, { width: `${(xpInLevel / 200) * 100}%` as any }]} />
                </View>
                <Text style={styles.xpBarLabel}>{xpInLevel}/200 XP to Level {level + 1}</Text>
              </View>
              <View style={styles.xpRight}>
                <Text style={styles.xpEmoji}>⭐</Text>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.6)" />
              </View>
            </Pressable>
          );
        })()}

        {/* Transformation card — shows after 14+ days of tracking */}
        {history.length >= 2 && oldest && latest && (() => {
          const daysTracked = Math.round((new Date(latest.date).getTime() - new Date(oldest.date).getTime()) / 86400000);
          if (daysTracked < 7) return null;
          const delta = latest.overallScore - oldest.overallScore;
          const handleShareTransformation = async () => {
            const sign = delta >= 0 ? '+' : '';
            await Share.share({
              message: `My ${daysTracked}-day skin transformation with Velumi AI 🌿\n\nStarted: ${oldest.overallScore}/100\nNow: ${latest.overallScore}/100 (${sign}${delta} points)\n\n${history.length} scans · ${daysTracked} days tracked\n\n#VelumiAI #SkinTransformation #SkincareJourney`,
            });
          };
          return (
            <View style={styles.transformCard}>
              <LinearGradient colors={['rgba(138,120,96,0.08)', 'rgba(138,120,96,0.03)']} style={StyleSheet.absoluteFill} />
              <View style={styles.transformHeader}>
                <View>
                  <Text style={styles.transformEyebrow}>YOUR TRANSFORMATION</Text>
                  <Text style={styles.transformTitle}>{daysTracked} Days of Progress</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Share transformation" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.transformShareBtn} onPress={handleShareTransformation}>
                  <Ionicons name="share-outline" size={16} color={colors.primary} />
                </Pressable>
              </View>
              <View style={styles.transformRow}>
                <View style={styles.transformSide}>
                  {oldest.imageUri ? (
                    <Image source={{ uri: oldest.imageUri }} style={styles.transformPhoto} resizeMode="cover" />
                  ) : (
                    <View style={[styles.transformPhoto, styles.transformPhotoEmpty]}>
                      <Ionicons name="person-outline" size={22} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.transformScoreWrap}>
                    <Text style={styles.transformScore}>{oldest.overallScore}</Text>
                  </View>
                  <Text style={styles.transformDateLabel}>Day 1</Text>
                </View>
                <View style={styles.transformMiddle}>
                  <View style={[styles.transformDelta, { backgroundColor: delta >= 0 ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)' }]}>
                    <Text style={[styles.transformDeltaNum, { color: delta >= 0 ? colors.scoreExcellent : colors.scorePoor }]}>
                      {delta >= 0 ? '+' : ''}{delta}
                    </Text>
                    <Text style={[styles.transformDeltaLabel, { color: delta >= 0 ? colors.scoreExcellent : colors.scorePoor }]}>pts</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
                </View>
                <View style={styles.transformSide}>
                  {latest.imageUri ? (
                    <Image source={{ uri: latest.imageUri }} style={styles.transformPhoto} resizeMode="cover" />
                  ) : (
                    <View style={[styles.transformPhoto, styles.transformPhotoEmpty]}>
                      <Ionicons name="person-outline" size={22} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.transformScoreWrap}>
                    <Text style={styles.transformScore}>{latest.overallScore}</Text>
                  </View>
                  <Text style={styles.transformDateLabel}>Now</Text>
                </View>
              </View>
              <Pressable style={styles.transformCta} onPress={() => router.push('/scan-gallery')}>
                <Text style={styles.transformCtaText}>View Full Gallery →</Text>
              </Pressable>
            </View>
          );
        })()}

        {/* Quick access row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRowContent}>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/compare')}>
            <Ionicons name="git-compare-outline" size={16} color={colors.primary} />
            <Text style={styles.quickBtnText}>Compare</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/report')}>
            <Ionicons name="analytics-outline" size={16} color={colors.primary} />
            <Text style={styles.quickBtnText}>AI Report</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/milestones')}>
            <Ionicons name="trophy-outline" size={16} color={colors.primary} />
            <Text style={styles.quickBtnText}>Milestones</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/skin-age')}>
            <Ionicons name="hourglass-outline" size={16} color={colors.primary} />
            <Text style={styles.quickBtnText}>Skin Age</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/skin-scorecard')}>
            <Ionicons name="ribbon-outline" size={16} color={colors.primary} />
            <Text style={styles.quickBtnText}>Scorecard</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/community')}>
            <Ionicons name="people-outline" size={16} color={colors.primary} />
            <Text style={styles.quickBtnText}>Community</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/forecast')}>
            <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
            <Text style={styles.quickBtnText}>Forecast</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/calendar')}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.quickBtnText}>Calendar</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/scan-gallery')}>
            <Ionicons name="images-outline" size={16} color={colors.primary} />
            <Text style={styles.quickBtnText}>Gallery</Text>
          </Pressable>
        </ScrollView>

        {/* AI Trend Report CTA */}
        <Pressable style={styles.reportCta} onPress={() => router.push('/report')}>
          <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <Ionicons name="analytics-outline" size={20} color={colors.white} />
          <View style={{ flex: 1 }}>
            <Text style={styles.reportCtaTitle}>AI Trend Report</Text>
            <Text style={styles.reportCtaSub}>AI analysis of your full skin journey</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </Pressable>

        {/* Activity stats */}
        <Animated.View style={[styles.activityRow, {
          opacity: statsAnim,
          transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
        }]}>
          <View style={[styles.activityCard, { borderColor: 'rgba(138,120,96,0.25)', backgroundColor: 'rgba(138,120,96,0.06)' }]}>
            <Text style={[styles.activityNum, { color: colors.primary }]}>{history.length}</Text>
            <Text style={styles.activityLabel}>Scans</Text>
          </View>
          <View style={[styles.activityCard, { borderColor: 'rgba(183,155,110,0.3)', backgroundColor: 'rgba(183,155,110,0.07)' }]}>
            <Text style={[styles.activityNum, { color: colors.gold }]}>{routineStreak}🔥</Text>
            <Text style={styles.activityLabel}>Streak</Text>
          </View>
          <View style={[styles.activityCard, { borderColor: 'rgba(96,165,250,0.3)', backgroundColor: 'rgba(96,165,250,0.07)' }]}>
            <Text style={[styles.activityNum, { color: '#60A5FA' }]}>{journalCount}</Text>
            <Text style={styles.activityLabel}>Journal</Text>
          </View>
          <View style={[styles.activityCard, { borderColor: 'rgba(74,222,128,0.3)', backgroundColor: 'rgba(74,222,128,0.07)' }]}>
            <Text style={[styles.activityNum, { color: colors.scoreExcellent }]}>{articlesRead}</Text>
            <Text style={styles.activityLabel}>Articles</Text>
          </View>
        </Animated.View>

        {/* Streak milestone celebration */}
        {routineStreak > 0 && [7, 14, 21, 30, 60, 100].includes(routineStreak) && (
          <LinearGradient
            colors={routineStreak >= 30 ? ['#B8882E', '#B79B6E'] : [colors.primaryDark, colors.primary]}
            style={styles.streakMilestone}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Text style={styles.streakMilestoneEmoji}>{routineStreak >= 100 ? '💎' : routineStreak >= 60 ? '🏆' : routineStreak >= 30 ? '🥇' : routineStreak >= 14 ? '🥈' : '🥉'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.streakMilestoneLabel}>MILESTONE UNLOCKED</Text>
              <Text style={styles.streakMilestoneTitle}>{routineStreak}-Day Streak!</Text>
              <Text style={styles.streakMilestoneSub}>You're in the top {routineStreak >= 30 ? '5%' : '15%'} of Velumi AI users. Keep going.</Text>
            </View>
          </LinearGradient>
        )}

        {/* Streak encouragement for non-milestone days */}
        {routineStreak > 0 && ![7, 14, 21, 30, 60, 100].includes(routineStreak) && (() => {
          const next = [7, 14, 21, 30, 60, 100].find(m => m > routineStreak) ?? 0;
          if (!next) return null;
          return (
            <View style={styles.streakNudge}>
              <Text style={styles.streakNudgeEmoji}>🔥</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.streakNudgeTitle}>{routineStreak}-day streak</Text>
                <Text style={styles.streakNudgeSub}>{next - routineStreak} more days to unlock the {next}-day badge</Text>
              </View>
              <View style={styles.streakNudgeBar}>
                <View style={[styles.streakNudgeBarFill, {
                  width: `${((routineStreak - ([7, 14, 21, 30, 60, 100].filter(m => m < routineStreak).pop() ?? 0)) / (next - ([7, 14, 21, 30, 60, 100].filter(m => m < routineStreak).pop() ?? 0))) * 100}%` as any
                }]} />
              </View>
            </View>
          );
        })()}

        {/* AI Engine: Trend summary */}
        {engineReport && (
          <View style={styles.engineCard}>
            <View style={styles.engineHeader}>
              <View style={styles.engineTitleRow}>
                <LinearGradient colors={[colors.primaryLight, colors.primary]} style={styles.engineIcon}>
                  <Text style={styles.engineIconText}>✦</Text>
                </LinearGradient>
                <View>
                  <Text style={styles.engineTitle}>Skin Progress Engine</Text>
                  <Text style={styles.engineSub}>{engineReport.scanCount} scan{engineReport.scanCount !== 1 ? 's' : ''} · {engineReport.daysTracked} days tracked</Text>
                </View>
              </View>
              <View style={[styles.trendBadge, {
                backgroundColor: engineReport.overallTrend === 'improving'
                  ? 'rgba(22,163,74,0.12)' : engineReport.overallTrend === 'declining'
                  ? 'rgba(220,38,38,0.12)' : 'rgba(138,120,96,0.1)',
              }]}>
                <Ionicons
                  name={engineReport.overallTrend === 'improving' ? 'trending-up' : engineReport.overallTrend === 'declining' ? 'trending-down' : 'remove'}
                  size={12}
                  color={engineReport.overallTrend === 'improving' ? colors.scoreExcellent : engineReport.overallTrend === 'declining' ? colors.scorePoor : colors.primary}
                />
                <Text style={[styles.trendBadgeText, {
                  color: engineReport.overallTrend === 'improving' ? colors.scoreExcellent : engineReport.overallTrend === 'declining' ? colors.scorePoor : colors.primary,
                }]}>
                  {engineReport.overallTrend === 'improving' ? 'Improving' : engineReport.overallTrend === 'declining' ? 'Declining' : 'Stable'}
                </Text>
              </View>
            </View>

            {/* Predicted score */}
            <View style={styles.predictRow}>
              <View style={styles.predictItem}>
                <Text style={styles.predictLabel}>Current</Text>
                <Text style={styles.predictVal}>{history[0]?.overallScore ?? '—'}</Text>
              </View>
              <View style={styles.predictArrow}>
                <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
                <Text style={styles.predictArrowLabel}>7 days</Text>
              </View>
              <View style={styles.predictItem}>
                <Text style={styles.predictLabel}>Predicted</Text>
                <Text style={[styles.predictVal, {
                  color: engineReport.predictedOverall > (history[0]?.overallScore ?? 0)
                    ? colors.scoreExcellent : engineReport.predictedOverall < (history[0]?.overallScore ?? 0)
                    ? colors.scorePoor : colors.primary,
                }]}>{engineReport.predictedOverall}</Text>
              </View>
              {engineReport.scanCount >= 2 && (() => {
                const delta = engineReport.predictedOverall - (history[0]?.overallScore ?? 0);
                return (
                  <View style={[styles.predictDelta, { backgroundColor: delta >= 0 ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)' }]}>
                    <Text style={[styles.predictDeltaText, { color: delta >= 0 ? colors.scoreExcellent : colors.scorePoor }]}>
                      {delta >= 0 ? '+' : ''}{delta}
                    </Text>
                  </View>
                );
              })()}
            </View>

            {/* Per-metric trend row */}
            {engineReport.scanCount >= 2 && (
              <View style={styles.metricTrendRow}>
                {engineReport.trajectories.filter(t => t.metric !== 'overall').map(t => (
                  <View key={t.metric} style={styles.metricTrendCell}>
                    <Text style={styles.metricTrendLabel}>{t.label.slice(0, 4)}</Text>
                    <Ionicons
                      name={t.trend > 1 ? 'trending-up' : t.trend < -1 ? 'trending-down' : 'remove'}
                      size={11}
                      color={t.trend > 1 ? colors.scoreExcellent : t.trend < -1 ? colors.scorePoor : colors.textMuted}
                    />
                    <Text style={[styles.metricTrendVal, {
                      color: t.trend > 1 ? colors.scoreExcellent : t.trend < -1 ? colors.scorePoor : colors.textMuted,
                    }]}>
                      {t.trend > 0 ? '+' : ''}{t.trend}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* What's Working / Not */}
        {engineReport && (engineReport.whatWorking.length > 0 || engineReport.whatNotWorking.length > 0) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>What's Working</Text>
            <Text style={styles.cardSub}>Correlated with your scan improvements</Text>
            {engineReport.whatWorking.slice(0, 3).map((f, i) => (
              <View key={i} style={styles.factorRow}>
                <View style={[styles.factorIcon, { backgroundColor: 'rgba(22,163,74,0.12)' }]}>
                  <Text style={styles.factorEmoji}>✓</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.factorLabel}>{f.factor}</Text>
                  <Text style={styles.factorEvidence}>{f.evidence}</Text>
                </View>
              </View>
            ))}
            {engineReport.whatNotWorking.length > 0 && (
              <>
                <View style={styles.factorDivider} />
                <Text style={[styles.cardTitle, { marginBottom: 8, fontSize: 13 }]}>Needs Attention</Text>
                {engineReport.whatNotWorking.slice(0, 2).map((f, i) => (
                  <View key={i} style={styles.factorRow}>
                    <View style={[styles.factorIcon, { backgroundColor: 'rgba(220,38,38,0.1)' }]}>
                      <Text style={styles.factorEmoji}>!</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.factorLabel}>{f.factor}</Text>
                      <Text style={styles.factorEvidence}>{f.evidence}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* Optimized Routine */}
        {optimizedRoutine && (optimizedRoutine.gapAnalysis.length > 0 || optimizedRoutine.productRankings.length > 0) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Routine Optimizer</Text>
            <Text style={styles.cardSub}>Personalized to your scan data</Text>

            {/* Product effectiveness rankings */}
            {optimizedRoutine.productRankings.length > 0 && (
              <>
                <Text style={styles.optimizerSection}>YOUR SHELF — RANKED BY EFFECTIVENESS</Text>
                {optimizedRoutine.productRankings.slice(0, 4).map((p, i) => (
                  <View key={i} style={styles.productRankRow}>
                    <View style={[styles.rankNum, { backgroundColor: i === 0 ? 'rgba(138,120,96,0.15)' : colors.bgElevated }]}>
                      <Text style={[styles.rankNumText, { color: i === 0 ? colors.primary : colors.textMuted }]}>#{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rankProductName}>{p.name}</Text>
                      <Text style={styles.rankProductReason}>{p.reason}</Text>
                    </View>
                    <View style={[styles.scoreCircle, {
                      borderColor: p.effectivenessScore >= 70 ? colors.scoreExcellent : p.effectivenessScore >= 50 ? colors.scoreFair : colors.textMuted,
                    }]}>
                      <Text style={[styles.scoreCircleText, {
                        color: p.effectivenessScore >= 70 ? colors.scoreExcellent : p.effectivenessScore >= 50 ? colors.scoreFair : colors.textMuted,
                      }]}>{p.effectivenessScore}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Gap analysis */}
            {optimizedRoutine.gapAnalysis.length > 0 && (
              <>
                <Text style={[styles.optimizerSection, { marginTop: 16 }]}>GAPS IN YOUR ROUTINE</Text>
                {optimizedRoutine.gapAnalysis.map((gap, i) => (
                  <View key={i} style={styles.gapRow}>
                    <View style={[styles.gapPriority, { backgroundColor: gap.priority === 'high' ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)' }]}>
                      <Text style={[styles.gapPriorityText, { color: gap.priority === 'high' ? colors.scorePoor : colors.scoreFair }]}>
                        {gap.priority.toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.gapCategory}>{gap.gap}</Text>
                      <Text style={styles.gapRec}>{gap.recommendation}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* Metric selector */}
        <Animated.View style={{ opacity: chartAnim }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricScroll}>
          {METRICS.map(m => (
            <Animated.View key={m.key} style={selectedMetric === m.key ? { transform: [{ scale: chipGlow }] } : {}}>
              <Pressable
                style={[styles.metricChip, selectedMetric === m.key && styles.metricChipActive]}
                onPress={() => setSelectedMetric(m.key)}
              >
                <Text style={[styles.metricChipText, selectedMetric === m.key && styles.metricChipTextActive]}>
                  {m.label}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
        </Animated.View>

        {/* Trend chart */}
        <Animated.View style={{ opacity: chartAnim, transform: [{ translateY: chartAnim.interpolate({ inputRange: [0,1], outputRange: [20, 0] }) }] }}>
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{METRICS.find(m => m.key === selectedMetric)?.label} Over Time</Text>
            {latest && previous && (() => {
              const val = selectedMetric === 'overall' ? latest.overallScore : latest.scores[selectedMetric];
              const prevVal = selectedMetric === 'overall' ? previous.overallScore : previous.scores[selectedMetric];
              const d = getDelta(val, prevVal);
              return (
                <View style={[styles.deltaPill, { backgroundColor: d.positive ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)' }]}>
                  <Ionicons name={d.positive ? 'trending-up' : 'trending-down'} size={12} color={d.positive ? colors.scoreExcellent : colors.scorePoor} />
                  <Text style={[styles.deltaPillText, { color: d.positive ? colors.scoreExcellent : colors.scorePoor }]}>
                    {d.positive ? '+' : ''}{d.val} from last scan
                  </Text>
                </View>
              );
            })()}
          </View>
          <ScoreChart data={chartData} color={colors.primary} height={170} />
        </View>
        </Animated.View>

        {/* All metric deltas vs previous scan */}
        {latest && previous && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Score Changes</Text>
            <Text style={styles.cardSub}>Compared to previous scan</Text>
            <View style={styles.deltaGrid}>
              {METRICS.map(m => {
                const curr = m.key === 'overall' ? latest.overallScore : latest.scores[m.key];
                const prev = m.key === 'overall' ? previous.overallScore : previous.scores[m.key];
                const d = getDelta(curr, prev);
                return (
                  <View key={m.key} style={styles.deltaCell}>
                    <Text style={styles.deltaCellLabel}>{m.label}</Text>
                    <Text style={styles.deltaCellVal}>{curr}</Text>
                    <View style={[styles.deltaChange, { backgroundColor: d.positive ? 'rgba(74,222,128,0.12)' : d.val === 0 ? 'rgba(250,243,224,0.06)' : 'rgba(248,113,113,0.12)' }]}>
                      <Text style={[styles.deltaChangeText, { color: d.positive ? colors.scoreExcellent : d.val === 0 ? colors.textMuted : colors.scorePoor }]}>
                        {d.val === 0 ? '—' : `${d.positive ? '+' : ''}${d.val}`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Before/After photos */}
        {history.length >= 2 && oldest.imageUri && latest.imageUri && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Before & After</Text>
            <View style={styles.beforeAfterRow}>
              <View style={styles.beforeAfterItem}>
                <Image source={{ uri: oldest.imageUri }} style={styles.beforeAfterImg} />
                <View style={styles.beforeAfterLabel}>
                  <Text style={styles.beforeAfterTag}>FIRST SCAN</Text>
                  <Text style={styles.beforeAfterDate}>
                    {new Date(oldest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <Text style={[styles.beforeAfterScore, { color: colors.scoreFair }]}>{oldest.overallScore}</Text>
                </View>
              </View>
              <View style={styles.beforeAfterArrow}>
                <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                {history.length >= 2 && (() => {
                  const d = getDelta(latest.overallScore, oldest.overallScore);
                  return (
                    <Text style={[styles.totalDelta, { color: d.positive ? colors.scoreExcellent : colors.scorePoor }]}>
                      {d.positive ? '+' : ''}{d.val}
                    </Text>
                  );
                })()}
              </View>
              <View style={styles.beforeAfterItem}>
                <Image source={{ uri: latest.imageUri }} style={styles.beforeAfterImg} />
                <View style={styles.beforeAfterLabel}>
                  <Text style={styles.beforeAfterTag}>LATEST</Text>
                  <Text style={styles.beforeAfterDate}>
                    {new Date(latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <Text style={[styles.beforeAfterScore, { color: colors.scoreExcellent }]}>{latest.overallScore}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Personal Records */}
        {history.length >= 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Records</Text>
            <Text style={styles.cardSub}>Your best scores across all scans</Text>
            <View style={styles.deltaGrid}>
              {(['overall', 'hydration', 'texture', 'clarity', 'evenness', 'firmness', 'pores'] as const).map(metric => {
                const allVals = history.map(h => metric === 'overall' ? h.overallScore : h.scores[metric]);
                const best = Math.max(...allVals);
                const current = metric === 'overall' ? latest.overallScore : latest.scores[metric];
                // Only show PR if current is best AND there's at least one lower score (not all tied)
                const isCurrentBest = current === best && allVals.some(v => v < best);
                return (
                  <View key={metric} style={[styles.deltaCell, isCurrentBest && { borderColor: colors.scoreExcellent + '40', borderWidth: 1 }]}>
                    <Text style={styles.deltaCellLabel}>{metric === 'overall' ? 'Overall' : metric.charAt(0).toUpperCase() + metric.slice(1)}</Text>
                    <Text style={[styles.deltaCellVal, { color: colors.scoreExcellent }]}>{best}</Text>
                    {isCurrentBest && (
                      <View style={[styles.deltaChange, { backgroundColor: 'rgba(74,222,128,0.12)' }]}>
                        <Text style={[styles.deltaChangeText, { color: colors.scoreExcellent }]}>PR ✓</Text>
                      </View>
                    )}
                    {!isCurrentBest && (
                      <View style={styles.deltaChange}>
                        <Text style={[styles.deltaChangeText, { color: colors.textMuted }]}>Now: {current}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Scan history list */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Scan History</Text>
          {history.map((entry, i) => (
            <Pressable
              key={entry.id}
              style={[styles.historyItem, i < history.length - 1 && styles.historyBorder]}
              onPress={() => router.push(`/results/${entry.id}`)}
            >
              {entry.imageUri ? (
                <Image source={{ uri: entry.imageUri }} style={styles.historyThumb} />
              ) : (
                <View style={[styles.historyThumb, styles.historyThumbEmpty]}>
                  <Ionicons name="person" size={16} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.historyInfo}>
                <Text style={styles.historyDate}>
                  {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                {i === 0 && <Text style={styles.historyLatestBadge}>Latest</Text>}
              </View>
              <ScoreRing score={entry.overallScore} size={42} strokeWidth={4} />
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  heroHeader: {
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  heroTitle: {
    fontSize: 30, fontWeight: '900', color: c.white, letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.78)', marginTop: 4, fontWeight: '600' },
  heroScoreBadge: {
    alignItems: 'center', borderRadius: 18,
    paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)',
  },
  heroScoreNum: { fontSize: 26, fontWeight: '900', color: c.white, letterSpacing: -0.5 },
  heroScoreLabel: { fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: '900', letterSpacing: 1.4 },
  scroll: { paddingBottom: 40 },
  trendsCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 16, backgroundColor: c.bgCard, borderRadius: 18, borderWidth: 1, borderColor: c.borderStrong, paddingHorizontal: 18, paddingVertical: 16 },
  trendsCtaText: { flex: 1, gap: 3 },
  trendsCtaEyebrow: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', letterSpacing: 2.4, color: c.primary, textTransform: 'uppercase' },
  trendsCtaTitle: { fontFamily: fonts.display, fontSize: 17, fontWeight: '600', color: c.textPrimary, letterSpacing: 0.2 },
  baCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 12, backgroundColor: c.bgCard, borderRadius: 18, borderWidth: 1, borderColor: c.borderStrong, paddingHorizontal: 18, paddingVertical: 16 },
  baCtaText: { flex: 1, gap: 3 },
  baCtaEyebrow: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', letterSpacing: 2.4, color: c.primary, textTransform: 'uppercase' },
  baCtaTitle: { fontFamily: fonts.display, fontSize: 17, fontWeight: '600', color: c.textPrimary, letterSpacing: 0.2 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: c.textPrimary, marginBottom: 10 },
  emptySub: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  scanBtn: { backgroundColor: c.primary, borderRadius: 16, paddingHorizontal: 28, paddingVertical: 16 },
  scanBtnText: { fontSize: 15, fontWeight: '700', color: c.white },

  xpCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, borderRadius: 20, overflow: 'hidden',
    padding: 18, marginBottom: 12,
    shadowColor: c.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  xpLevel: { fontSize: 20, fontWeight: '900', color: '#fff' },
  xpLevelBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  xpLevelBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  xpTotal: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 8 },
  xpBarTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  xpBarFill: { height: 6, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 3 },
  xpBarLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  xpRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  xpEmoji: { fontSize: 26 },

  quickRowContent: { paddingHorizontal: 16, paddingVertical: 6, gap: 8, marginBottom: 4 },
  quickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.bgCard, borderRadius: 12, borderWidth: 1, borderColor: c.borderStrong, paddingVertical: 10, paddingHorizontal: 14 },
  quickBtnText: { fontSize: 12, fontWeight: '700', color: c.primary },
  reportCta: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, borderRadius: 16, overflow: 'hidden',
    padding: 16, marginBottom: 12,
  },
  reportCtaTitle: { fontSize: 15, fontWeight: '700', color: c.white },
  reportCtaSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  activityRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4, gap: 8 },
  activityCard: { flex: 1, backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 12, alignItems: 'center', gap: 3 },
  activityNum: { fontSize: 20, fontWeight: '800', color: c.textPrimary },
  activityLabel: { fontSize: 9, color: c.textMuted, fontWeight: '600', textAlign: 'center', lineHeight: 13 },

  streakMilestone: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, borderRadius: 18, padding: 18, marginBottom: 12, marginTop: 8,
    shadowColor: c.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  streakMilestoneEmoji: { fontSize: 32 },
  streakMilestoneLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 2, marginBottom: 3 },
  streakMilestoneTitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 3 },
  streakMilestoneSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 17 },

  streakNudge: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, borderRadius: 16, padding: 14, marginBottom: 10, marginTop: 6,
    backgroundColor: c.bgCard, borderWidth: 1, borderColor: 'rgba(183,155,110,0.25)',
  },
  streakNudgeEmoji: { fontSize: 22 },
  streakNudgeTitle: { fontSize: 14, fontWeight: '700', color: c.textPrimary },
  streakNudgeSub: { fontSize: 11, color: c.textMuted, marginTop: 2 },
  streakNudgeBar: { width: 48, height: 4, backgroundColor: c.border, borderRadius: 2, overflow: 'hidden', marginTop: 6, alignSelf: 'flex-end' },
  streakNudgeBarFill: { height: 4, backgroundColor: c.gold, borderRadius: 2 },

  transformCard: {
    marginHorizontal: 16, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(138,120,96,0.2)',
    padding: 16, marginBottom: 12, marginTop: 4,
  },
  transformHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  transformEyebrow: { fontSize: 8, fontWeight: '900', letterSpacing: 2, color: c.primary, marginBottom: 3 },
  transformTitle: { fontSize: 16, fontWeight: '800', color: c.textPrimary },
  transformShareBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(138,120,96,0.1)', alignItems: 'center', justifyContent: 'center' },
  transformRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  transformSide: { flex: 1, alignItems: 'center', gap: 6 },
  transformPhoto: { width: '100%', height: 100, borderRadius: 14 },
  transformPhotoEmpty: { backgroundColor: c.bgElevated, alignItems: 'center', justifyContent: 'center' },
  transformScoreWrap: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  transformScore: { fontSize: 14, fontWeight: '900', color: c.white },
  transformDateLabel: { fontSize: 10, fontWeight: '700', color: c.textMuted },
  transformMiddle: { alignItems: 'center', gap: 6 },
  transformDelta: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  transformDeltaNum: { fontSize: 18, fontWeight: '900' },
  transformDeltaLabel: { fontSize: 9, fontWeight: '700' },
  transformCta: { alignItems: 'center' },
  transformCtaText: { fontSize: 12, fontWeight: '700', color: c.primary },

  metricScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  metricChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgCard },
  metricChipActive: { borderColor: c.primary, backgroundColor: 'rgba(138,120,96,0.15)' },
  metricChipText: { fontSize: 13, color: c.textMuted, fontWeight: '500' },
  metricChipTextActive: { color: c.primary, fontWeight: '700' },

  chartCard: { marginHorizontal: 16, marginBottom: 14, backgroundColor: c.bgCard, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 16 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chartTitle: { fontSize: 14, fontWeight: '700', color: c.textPrimary },
  deltaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  deltaPillText: { fontSize: 11, fontWeight: '600' },

  card: { marginHorizontal: 16, marginBottom: 14, backgroundColor: c.bgCard, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 18 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary, marginBottom: 2 },
  cardSub: { fontSize: 11, color: c.textMuted, marginBottom: 16 },

  deltaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deltaCell: { backgroundColor: c.bgElevated, borderRadius: 12, padding: 12, alignItems: 'center', minWidth: 80, gap: 4 },
  deltaCellLabel: { fontSize: 10, color: c.textMuted, fontWeight: '600' },
  deltaCellVal: { fontSize: 20, fontWeight: '800', color: c.textPrimary },
  deltaChange: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  deltaChangeText: { fontSize: 11, fontWeight: '700' },

  beforeAfterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  beforeAfterItem: { flex: 1, gap: 8 },
  beforeAfterImg: { width: '100%', aspectRatio: 0.85, borderRadius: 12, backgroundColor: c.bgElevated },
  beforeAfterLabel: { gap: 2 },
  beforeAfterTag: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: c.textMuted },
  beforeAfterDate: { fontSize: 11, color: c.textSecondary },
  beforeAfterScore: { fontSize: 22, fontWeight: '800' },
  beforeAfterArrow: { alignItems: 'center', gap: 6 },
  totalDelta: { fontSize: 14, fontWeight: '800' },

  // Engine cards
  engineCard: { marginHorizontal: 16, marginBottom: 14, backgroundColor: c.bgCard, borderRadius: 18, borderWidth: 1, borderColor: c.borderStrong, padding: 18 },
  engineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  engineTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  engineIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  engineIconText: { fontSize: 14, color: c.white, fontWeight: '800' },
  engineTitle: { fontSize: 14, fontWeight: '800', color: c.textPrimary },
  engineSub: { fontSize: 10, color: c.textMuted, marginTop: 1 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  trendBadgeText: { fontSize: 11, fontWeight: '700' },
  predictRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.bgElevated, borderRadius: 14, padding: 14, gap: 10, marginBottom: 14 },
  predictItem: { flex: 1, alignItems: 'center', gap: 3 },
  predictLabel: { fontSize: 9, color: c.textMuted, fontWeight: '700', letterSpacing: 0.5 },
  predictVal: { fontSize: 26, fontWeight: '900', color: c.textPrimary },
  predictArrow: { alignItems: 'center', gap: 2 },
  predictArrowLabel: { fontSize: 8, color: c.textMuted },
  predictDelta: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  predictDeltaText: { fontSize: 13, fontWeight: '800' },
  metricTrendRow: { flexDirection: 'row', gap: 6 },
  metricTrendCell: { flex: 1, alignItems: 'center', backgroundColor: c.bgElevated, borderRadius: 10, paddingVertical: 8, gap: 2 },
  metricTrendLabel: { fontSize: 8, color: c.textMuted, fontWeight: '700', letterSpacing: 0.3 },
  metricTrendVal: { fontSize: 10, fontWeight: '700' },
  factorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  factorIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  factorEmoji: { fontSize: 12, fontWeight: '800', color: c.textPrimary },
  factorLabel: { fontSize: 13, fontWeight: '600', color: c.textPrimary, marginBottom: 1 },
  factorEvidence: { fontSize: 11, color: c.textMuted },
  factorDivider: { height: 1, backgroundColor: c.border, marginVertical: 12 },
  optimizerSection: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: c.textMuted, marginBottom: 10 },
  productRankRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border },
  rankNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  rankNumText: { fontSize: 11, fontWeight: '800' },
  rankProductName: { fontSize: 13, fontWeight: '700', color: c.textPrimary, marginBottom: 1 },
  rankProductReason: { fontSize: 11, color: c.textMuted },
  scoreCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  scoreCircleText: { fontSize: 11, fontWeight: '800' },
  gapRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  gapPriority: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginTop: 2 },
  gapPriorityText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  gapCategory: { fontSize: 12, fontWeight: '700', color: c.textPrimary, marginBottom: 2 },
  gapRec: { fontSize: 11, color: c.textSecondary, lineHeight: 16 },

  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  historyBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  historyThumb: { width: 42, height: 42, borderRadius: 10, backgroundColor: c.bgElevated },
  historyThumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
  historyLatestBadge: { fontSize: 10, color: c.primary, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
  });
}
