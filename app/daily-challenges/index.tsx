import { useCallback, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import {
  GlassHero, Card, Badge, Button, Section, XPBar,
} from '../../src/components/ui';
import {
  runDailyChallengeAnalysis,
  completeChallenge,
  acknowledgeBadges,
  undoCompletion,
  DailyChallenge,
  DailyChallengeReport,
  BadgeDef,
  BADGES,
} from '../../src/engine/DailyChallengeEngine';

const DIFF_TONE: Record<DailyChallenge['difficulty'], 'success' | 'warning' | 'danger'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
};

const DIFF_LABEL: Record<DailyChallenge['difficulty'], string> = {
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
};

function buildCategoryTint(c: Palette): Record<DailyChallenge['category'], string> {
  return {
    hydration: c.hydration,
    protection: c.primary,
    lifestyle: c.darkCircles,
    routine: c.evenness,
    diet: c.scoreExcellent,
  };
}

export default function DailyChallengesScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [report, setReport] = useState<DailyChallengeReport | null>(null);
  const [celebratingBadge, setCelebratingBadge] = useState<BadgeDef | null>(null);

  const refresh = useCallback(async () => {
    const r = await runDailyChallengeAnalysis();
    setReport(r);
    // Trigger badge celebration for the first un-acknowledged badge.
    if (r.pendingBadgeCelebrations.length > 0) {
      setCelebratingBadge(r.pendingBadgeCelebrations[0]);
      await acknowledgeBadges(r.pendingBadgeCelebrations.map(b => b.id));
    }
  }, []);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  const handleComplete = async (challenge: DailyChallenge) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await completeChallenge(challenge.id);
    await refresh();
  };

  const handleUndo = async (challenge: DailyChallenge) => {
    if (!report) return;
    const onUndo = async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      await undoCompletion(challenge.id);
      await refresh();
    };
    Alert.alert('Undo completion?', `This will subtract ${challenge.xp} XP.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Undo', style: 'destructive', onPress: onUndo },
    ]);
  };

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
                <Text style={styles.heroTitle}>Daily challenges</Text>
                <Text style={styles.heroSub}>Loading…</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </GlassHero>
      </View>
    );
  }

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
                <Text style={styles.heroTitle}>Daily challenges</Text>
                <Text style={styles.heroSub}>
                  {report.todayXP > 0
                    ? `+${report.todayXP} XP today · level ${report.level}`
                    : `Level ${report.level} · ${report.unlockedBadges.length}/${BADGES.length} badges`}
                </Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </GlassHero>

        <View style={styles.content}>
          {/* XP / Level card */}
          <Card variant="elevated" padding={18} style={{ marginBottom: 14 }}>
            <XPBar
              level={report.level}
              xpInLevel={report.xpInLevel}
              xpForLevel={report.xpForLevel}
              totalXP={report.state.totalXP}
              delay={120}
            />
          </Card>

          {/* Today's Primary Challenge */}
          <Section title="Today's challenge" caption="Resets at midnight" gap={10}>
            <ChallengeHero
              challenge={report.primary}
              done={report.primaryDone}
              onComplete={() => handleComplete(report.primary)}
              onUndo={() => handleUndo(report.primary)}
              isPrimary
            />
          </Section>

          {/* Bonus */}
          <Section title="Bonus challenge" caption="Same XP, different category" gap={10}>
            <ChallengeHero
              challenge={report.bonus}
              done={report.bonusDone}
              onComplete={() => handleComplete(report.bonus)}
              onUndo={() => handleUndo(report.bonus)}
            />
          </Section>

          {/* 14-day activity */}
          <Section title="Last 14 days" caption="Each square shows challenges completed">
            <Card variant="elevated" padding={14}>
              <View style={styles.activityRow}>
                {report.last14.map((d, i) => (
                  <ActivityCell key={d.date} count={d.count} delay={i * 24} />
                ))}
              </View>
              <View style={styles.activityLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: 'rgba(28,24,20,0.10)' }]} />
                  <Text style={styles.legendText}>None</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.primary + '50' }]} />
                  <Text style={styles.legendText}>1</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.legendText}>2+</Text>
                </View>
              </View>
            </Card>
          </Section>

          {/* Badges */}
          <Section
            title="Badges"
            caption={`${report.unlockedBadges.length} unlocked${report.nextBadge ? ` · ${report.nextBadge.xp - report.state.totalXP} XP to ${report.nextBadge.name}` : ''}`}
          >
            <View style={styles.badgeGrid}>
              {BADGES.map((b, i) => {
                const unlocked = report.unlockedBadges.some(u => u.id === b.id);
                return (
                  <BadgeTile key={b.id} badge={b} unlocked={unlocked} delay={i * 60} />
                );
              })}
            </View>
          </Section>

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>

      {/* Badge celebration overlay */}
      {celebratingBadge && (
        <CelebrationOverlay
          badge={celebratingBadge}
          onDismiss={() => setCelebratingBadge(null)}
        />
      )}
    </View>
  );
}

/* ---------- Sub-components ---------- */

function ChallengeHero({
  challenge,
  done,
  onComplete,
  onUndo,
  isPrimary,
}: {
  challenge: DailyChallenge;
  done: boolean;
  onComplete: () => void;
  onUndo: () => void;
  isPrimary?: boolean;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tint = useMemo(() => buildCategoryTint(colors)[challenge.category], [colors, challenge.category]);

  // Subtle pulse to draw attention to the unfinished primary card.
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (done || !isPrimary) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => { cancelAnimation(pulse); };
  }, [done, isPrimary]); // eslint-disable-line react-hooks/exhaustive-deps

  const haloStyle = useAnimatedStyle(() => ({
    opacity: done ? 0 : 0.18 + pulse.value * 0.22,
    transform: [{ scale: 0.98 + pulse.value * 0.02 }],
  }));

  return (
    <View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.heroHalo,
          { shadowColor: tint, backgroundColor: tint + '20' },
          haloStyle,
        ]}
      />
      <Card
        variant={done ? 'gradient' : 'elevated'}
        tint={done ? colors.scoreExcellent : tint}
        padding={18}
        style={done ? { borderWidth: 1, borderColor: 'rgba(22,163,74,0.35)' } : undefined}
      >
        <View style={styles.challengeHeader}>
          <View style={[styles.challengeEmojiWrap, { backgroundColor: tint + '18', borderColor: tint + '40' }]}>
            <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.challengeMetaRow}>
              <Badge label={DIFF_LABEL[challenge.difficulty]} tone={DIFF_TONE[challenge.difficulty]} size="xs" />
              <Badge label={`+${challenge.xp} XP`} tone="gold" size="xs" filled />
              <Badge
                label={challenge.category.toUpperCase()}
                tone="neutral"
                size="xs"
              />
            </View>
            <Text style={styles.challengeTitle}>{challenge.title}</Text>
            <Text style={styles.challengeDesc}>{challenge.description}</Text>
          </View>
        </View>

        {challenge.tip && (
          <View style={styles.tipBox}>
            <Ionicons name="bulb-outline" size={12} color={colors.gold} />
            <Text style={styles.tipText}>{challenge.tip}</Text>
          </View>
        )}

        {done ? (
          <View style={styles.doneRow}>
            <View style={styles.doneBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.scoreExcellent} />
              <Text style={styles.doneText}>Completed today · +{challenge.xp} XP earned</Text>
            </View>
            <Pressable hitSlop={6} onPress={onUndo}>
              <Text style={styles.undoText}>Undo</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ marginTop: 14 }}>
            <Button
              label={`Mark complete · +${challenge.xp} XP`}
              icon="checkmark-circle-outline"
              onPress={onComplete}
            />
          </View>
        )}
      </Card>
    </View>
  );
}

function ActivityCell({ count, delay }: { count: number; delay: number }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 280 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 14, stiffness: 220 }));
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
  }, [delay]); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const bg =
    count >= 2
      ? colors.primary
      : count === 1
      ? colors.primary + '50'
      : 'rgba(28,24,20,0.10)';

  return (
    <Animated.View
      style={[
        styles.activityCell,
        { backgroundColor: bg },
        animStyle,
      ]}
    />
  );
}

function BadgeTile({
  badge,
  unlocked,
  delay,
}: {
  badge: BadgeDef;
  unlocked: boolean;
  delay: number;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 320 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 13, stiffness: 180 }));
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
  }, [delay]); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.badgeTile, animStyle]}>
      <View
        style={[
          styles.badgeEmojiWrap,
          unlocked
            ? { backgroundColor: 'rgba(184,136,46,0.18)', borderColor: colors.gold }
            : { backgroundColor: 'rgba(28,24,20,0.05)', borderColor: 'rgba(28,24,20,0.10)' },
        ]}
      >
        <Text style={[styles.badgeEmoji, !unlocked && { opacity: 0.35 }]}>{badge.emoji}</Text>
      </View>
      <Text style={[styles.badgeName, !unlocked && { color: colors.textMuted }]}>{badge.name}</Text>
      <Text style={styles.badgeXP}>{badge.xp.toLocaleString()} XP</Text>
      {!unlocked && (
        <View style={styles.lockedDot}>
          <Ionicons name="lock-closed" size={10} color={colors.textMuted} />
        </View>
      )}
    </Animated.View>
  );
}

function CelebrationOverlay({
  badge,
  onDismiss,
}: {
  badge: BadgeDef;
  onDismiss: () => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 320 });
    scale.value = withSpring(1, { damping: 9, stiffness: 130 });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, styles.celebrateBackdrop, wrapStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      <Animated.View style={[styles.celebrateCard, cardStyle]}>
        <LinearGradient
          colors={['#FBBF24', '#E8834A', '#C4622D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.celebrateLabel}>BADGE UNLOCKED</Text>
        <Text style={styles.celebrateEmoji}>{badge.emoji}</Text>
        <Text style={styles.celebrateName}>{badge.name}</Text>
        <Text style={styles.celebrateDesc}>{badge.description}</Text>
        <Pressable style={styles.celebrateBtn} onPress={onDismiss}>
          <Text style={styles.celebrateBtnText}>Sweet</Text>
        </Pressable>
      </Animated.View>
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

  heroHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },

  challengeHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  challengeEmojiWrap: {
    width: 50, height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  challengeEmoji: { fontSize: 26 },
  challengeMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 2 },
  challengeTitle: { fontSize: 17, fontWeight: '900', color: c.textPrimary, letterSpacing: -0.3 },
  challengeDesc: { fontSize: 13, color: c.textSecondary, lineHeight: 19, fontWeight: '500' },

  tipBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: 'rgba(184,136,46,0.10)',
    borderWidth: 1, borderColor: 'rgba(184,136,46,0.25)',
    borderRadius: 10, padding: 10, marginTop: 12,
  },
  tipText: { flex: 1, fontSize: 12, color: c.textPrimary, lineHeight: 17, fontWeight: '500' },

  doneRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12,
  },
  doneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(22,163,74,0.10)',
    borderColor: 'rgba(22,163,74,0.30)',
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  doneText: { fontSize: 12, fontWeight: '800', color: c.scoreExcellent },
  undoText: { fontSize: 12, color: c.textMuted, fontWeight: '700', textDecorationLine: 'underline' },

  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 5,
  },
  activityCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 5,
  },
  activityLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 10, fontWeight: '700', color: c.textMuted, letterSpacing: 0.4 },

  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeTile: {
    width: '31%',
    backgroundColor: c.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  badgeEmojiWrap: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  badgeEmoji: { fontSize: 22 },
  badgeName: { fontSize: 11, fontWeight: '900', color: c.textPrimary, textAlign: 'center', letterSpacing: -0.1 },
  badgeXP: { fontSize: 9, fontWeight: '800', color: c.gold, letterSpacing: 0.4 },
  lockedDot: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Celebration */
  celebrateBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrateCard: {
    width: 280,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#1C1814',
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
  },
  celebrateLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.85)', letterSpacing: 1.4 },
  celebrateEmoji: { fontSize: 64, marginVertical: 12 },
  celebrateName: { fontSize: 22, fontWeight: '900', color: c.white, letterSpacing: -0.4 },
  celebrateDesc: {
    fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 18,
    marginTop: 6, marginBottom: 16, fontWeight: '500',
  },
  celebrateBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 999, paddingHorizontal: 28, paddingVertical: 11,
  },
  celebrateBtnText: { fontSize: 14, fontWeight: '900', color: c.white, letterSpacing: 0.3 },
  });
}
