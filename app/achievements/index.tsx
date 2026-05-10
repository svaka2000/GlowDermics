import { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSpring, withRepeat, withSequence,
  Easing as REasing,
} from 'react-native-reanimated';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { runAchievements, AchievementReport, Achievement, AchievementRarity } from '../../src/engine/AchievementEngine';
import { GlassHero, Card, Section, Skeleton, Badge } from '../../src/components/ui';

const { width: SCREEN_W } = Dimensions.get('window');

type FilterTab = 'all' | 'unlocked' | 'locked';

const RARITY_TIER: Record<AchievementRarity, { label: string; weight: number }> = {
  common:    { label: 'COMMON',    weight: 0 },
  rare:      { label: 'RARE',      weight: 1 },
  epic:      { label: 'EPIC',      weight: 2 },
  legendary: { label: 'LEGENDARY', weight: 3 },
};

function rarityColors(c: Palette): Record<AchievementRarity, { tint: string; bg: string; border: string }> {
  return {
    common:    { tint: c.textSecondary, bg: c.bgElevated, border: c.border },
    rare:      { tint: '#3B82F6', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.30)' },
    epic:      { tint: '#9B5BA8', bg: 'rgba(155,91,168,0.12)', border: 'rgba(155,91,168,0.34)' },
    legendary: { tint: c.gold,    bg: c.gold + '1A',           border: c.gold + '50' },
  };
}

/** Achievements — gallery of unlocked + locked badges across streak/XP/scans/persona. */
export default function AchievementsScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [report, setReport] = useState<AchievementReport | null>(null);
  const [tab, setTab] = useState<FilterTab>('all');

  useFocusEffect(useCallback(() => {
    let mounted = true;
    runAchievements().then(r => {
      if (mounted) setReport(r);
    });
    return () => { mounted = false; };
  }, []));

  const filtered = useMemo(() => {
    if (!report) return [];
    if (tab === 'unlocked') return report.unlocked;
    if (tab === 'locked') return report.locked;
    return report.all;
  }, [report, tab]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Achievements</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!report ? (
            <LoadingState />
          ) : (
            <>
              {/* Hero progress card */}
              <GlassHero height={170} tint={colors.gold} style={styles.heroWrap}>
                <View style={styles.heroInner}>
                  <Text style={styles.heroLabel}>YOUR PROGRESS</Text>
                  <View style={styles.heroScoreRow}>
                    <Text style={styles.heroScore}>{report.unlockedCount}</Text>
                    <Text style={styles.heroOf}>/ {report.totalCount}</Text>
                  </View>
                  <Text style={styles.heroSub}>{report.completionPct}% complete</Text>

                  {/* Progress bar */}
                  <View style={styles.heroBarTrack}>
                    <View style={[styles.heroBarFill, { width: `${report.completionPct}%` }]} />
                  </View>
                </View>
              </GlassHero>

              {/* Next up card */}
              {report.nextUp.length > 0 && (
                <Section title="Closest to unlock" caption="Achievements you're closest to earning">
                  {report.nextUp.map((a, i) => <NextUpRow key={a.id} achievement={a} index={i} />)}
                </Section>
              )}

              {/* Filter tabs */}
              <View style={styles.tabRow}>
                <TabBtn label={`All (${report.totalCount})`} active={tab === 'all'} onPress={() => setTab('all')} />
                <TabBtn label={`Unlocked (${report.unlocked.length})`} active={tab === 'unlocked'} onPress={() => setTab('unlocked')} />
                <TabBtn label={`Locked (${report.locked.length})`} active={tab === 'locked'} onPress={() => setTab('locked')} />
              </View>

              {/* Grid */}
              <View style={styles.grid}>
                {filtered.map((a, i) => <AchievementTile key={a.id} achievement={a} index={i} />)}
              </View>

              <View style={{ height: 40 }} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function NextUpRow({ achievement, index }: { achievement: Achievement; index: number }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const rc = rarityColors(colors)[achievement.rarity];

  const opacity = useSharedValue(0);
  const ty = useSharedValue(8);
  useEffect(() => {
    opacity.value = withDelay(index * 60, withTiming(1, { duration: 320 }));
    ty.value = withDelay(index * 60, withSpring(0, { damping: 14 }));
  }, []);
  const rowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View style={[rowStyle]}>
      <Card style={styles.nextUpCard}>
        <View style={[styles.nextUpEmojiWrap, { backgroundColor: rc.bg, borderColor: rc.border }]}>
          <Text style={styles.nextUpEmoji}>{achievement.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nextUpHeader}>
            <Text style={styles.nextUpName}>{achievement.name}</Text>
            <View style={[styles.rarityPill, { backgroundColor: rc.bg, borderColor: rc.border }]}>
              <Text style={[styles.rarityText, { color: rc.tint }]}>{RARITY_TIER[achievement.rarity].label}</Text>
            </View>
          </View>
          <View style={styles.nextUpBarTrack}>
            <View style={[styles.nextUpBarFill, { width: `${Math.round(achievement.progress * 100)}%`, backgroundColor: rc.tint }]} />
          </View>
          <Text style={styles.nextUpProgress}>{achievement.progressLabel}</Text>
        </View>
      </Card>
    </Animated.View>
  );
}

function AchievementTile({ achievement, index }: { achievement: Achievement; index: number }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const rc = rarityColors(colors)[achievement.rarity];

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(index * 30, withTiming(1, { duration: 300 }));
    scale.value = withDelay(index * 30, withSpring(1, { damping: 13, stiffness: 200 }));
    if (achievement.unlocked && (achievement.rarity === 'epic' || achievement.rarity === 'legendary')) {
      shimmer.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: REasing.inOut(REasing.sin) }),
          withTiming(0, { duration: 1400, easing: REasing.inOut(REasing.sin) }),
        ),
        -1,
        false,
      );
    }
  }, []);

  const tileStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value * 0.5,
  }));

  const lockedTint = !achievement.unlocked;

  return (
    <Animated.View style={[styles.tile, tileStyle]}>
      <View style={[
        styles.tileInner,
        {
          backgroundColor: lockedTint ? colors.bgElevated : rc.bg,
          borderColor: lockedTint ? colors.border : rc.border,
          opacity: lockedTint ? 0.55 : 1,
        },
      ]}>
        {/* Shimmer overlay for high-rarity unlocked */}
        {achievement.unlocked && (achievement.rarity === 'epic' || achievement.rarity === 'legendary') && (
          <Animated.View style={[StyleSheet.absoluteFillObject, shimmerStyle, { borderRadius: 14 }]}>
            <LinearGradient
              colors={[
                'rgba(255,255,255,0)',
                rc.tint + '30',
                'rgba(255,255,255,0)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]}
            />
          </Animated.View>
        )}

        <View style={[styles.tileEmojiWrap, { backgroundColor: lockedTint ? 'rgba(0,0,0,0.05)' : rc.tint + '14' }]}>
          <Text style={[styles.tileEmoji, lockedTint && { opacity: 0.4 }]}>{achievement.emoji}</Text>
          {lockedTint && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={10} color={colors.textMuted} />
            </View>
          )}
        </View>

        <Text style={[styles.tileName, lockedTint && { color: colors.textMuted }]} numberOfLines={1}>
          {achievement.name}
        </Text>

        <Text style={[styles.tileProgress, lockedTint && { color: colors.textMuted }]} numberOfLines={1}>
          {achievement.progressLabel}
        </Text>

        {achievement.unlocked && (
          <View style={[styles.rarityChip, { backgroundColor: rc.tint + '18' }]}>
            <Text style={[styles.rarityChipText, { color: rc.tint }]}>{RARITY_TIER[achievement.rarity].label}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function TabBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function LoadingState() {
  return (
    <>
      <Skeleton width="100%" height={170} radius={20} style={{ marginBottom: 24 }} />
      <Skeleton width="60%" height={20} radius={6} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={80} radius={16} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={80} radius={16} style={{ marginBottom: 12 }} />
    </>
  );
}

function makeStyles(c: Palette) {
  const tileSize = (SCREEN_W - 40 - 24) / 3;

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    safe: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 8,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: c.textPrimary, letterSpacing: -0.2 },
    content: { paddingHorizontal: 20, paddingBottom: 30 },

    heroWrap: { marginHorizontal: -20, marginBottom: 18 },
    heroInner: { padding: 22 },
    heroLabel: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '900', letterSpacing: 1.6 },
    heroScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 },
    heroScore: {
      fontSize: 56, fontWeight: '900', color: '#fff', letterSpacing: -2,
      textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
    },
    heroOf: { fontSize: 22, fontWeight: '700', color: 'rgba(255,255,255,0.65)' },
    heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    heroBarTrack: {
      height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.20)',
      marginTop: 14, overflow: 'hidden',
    },
    heroBarFill: { height: 6, borderRadius: 3, backgroundColor: '#fff' },

    nextUpCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      padding: 14,
      marginBottom: 8,
    },
    nextUpEmojiWrap: {
      width: 48, height: 48, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1,
    },
    nextUpEmoji: { fontSize: 26 },
    nextUpHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    nextUpName: { fontSize: 14, fontWeight: '800', color: c.textPrimary, flex: 1 },
    rarityPill: {
      borderRadius: 100, paddingHorizontal: 7, paddingVertical: 2,
      borderWidth: 1,
    },
    rarityText: { fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
    nextUpBarTrack: {
      height: 4, borderRadius: 2, backgroundColor: c.bgElevated,
      overflow: 'hidden',
    },
    nextUpBarFill: { height: 4, borderRadius: 2 },
    nextUpProgress: { fontSize: 10, color: c.textMuted, fontWeight: '700', marginTop: 4 },

    tabRow: {
      flexDirection: 'row', gap: 8,
      marginVertical: 14,
    },
    tabBtn: {
      flex: 1, paddingVertical: 10, paddingHorizontal: 8,
      borderRadius: 100,
      backgroundColor: c.bgCard,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    tabBtnActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    tabText: { fontSize: 11, fontWeight: '700', color: c.textSecondary },
    tabTextActive: { color: '#fff' },

    grid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    },
    tile: {
      width: tileSize,
    },
    tileInner: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
      alignItems: 'center',
      gap: 6,
      overflow: 'hidden',
    },
    tileEmojiWrap: {
      width: 56, height: 56, borderRadius: 28,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 4,
    },
    tileEmoji: { fontSize: 30 },
    lockBadge: {
      position: 'absolute',
      bottom: -2, right: -2,
      width: 18, height: 18, borderRadius: 9,
      backgroundColor: c.bgCard,
      borderWidth: 1.5,
      borderColor: c.border,
      alignItems: 'center', justifyContent: 'center',
    },
    tileName: { fontSize: 11, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
    tileProgress: { fontSize: 9, color: c.textMuted, fontWeight: '600', textAlign: 'center' },
    rarityChip: {
      borderRadius: 100, paddingHorizontal: 6, paddingVertical: 2,
      marginTop: 2,
    },
    rarityChipText: { fontSize: 8, fontWeight: '900', letterSpacing: 1.0 },
  });
}
