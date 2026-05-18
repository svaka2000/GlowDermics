import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { fonts } from '../../src/constants/typography';
import { Storage } from '../../src/services/storage';
import { deriveRetentionState, type RetentionState } from '../../src/engine/RetentionEngine';

type ToneMeta = { icon: keyof typeof Ionicons.glyphMap; color: (c: Palette) => string };

const TONE: Record<NonNullable<RetentionState['reengage']>['tone'], ToneMeta> = {
  comeback: { icon: 'refresh-outline', color: (c) => c.primary },
  'streak-risk': { icon: 'flame-outline', color: (c) => c.gold },
  gentle: { icon: 'leaf-outline', color: (c) => c.scoreGood },
};

export default function MilestonesCelebrateScreen() {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [plan, setPlan] = useState<RetentionState | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [analyses, routineLog, streak] = await Promise.all([
          Storage.getAnalyses(),
          Storage.getFullRoutineLog(),
          Storage.getStreak(),
        ]);
        const result = deriveRetentionState(
          Array.isArray(analyses) ? analyses : [],
          Array.isArray(routineLog) ? routineLog : [],
          typeof streak === 'number' ? streak : 0,
          Date.now()
        );
        if (alive) setPlan(result);
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={c.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Milestones
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        {!plan ? null : (
          <>
            <Text style={styles.eyebrow}>YOUR MILESTONES</Text>

            {plan.celebrate ? (
              <View style={styles.celebrate}>
                <Text style={styles.celebrateBadge}>✦ MILESTONE REACHED</Text>
                <Text style={styles.celebrateTitle}>{plan.celebrate.title}</Text>
                <Text style={styles.celebrateBlurb}>{plan.celebrate.blurb}</Text>
              </View>
            ) : (
              <Text style={styles.lede}>
                Every consistent day compounds. Here is the ladder your streak is climbing.
              </Text>
            )}

            <View style={styles.ladder}>
              {plan.milestones.map((m) => (
                <View key={m.id} style={[styles.rung, m.reached && styles.rungReached]}>
                  <View style={[styles.dot, m.reached ? styles.dotReached : styles.dotLocked]}>
                    <Ionicons
                      name={m.reached ? 'checkmark' : 'ellipse-outline'}
                      size={m.reached ? 14 : 12}
                      color={m.reached ? c.white : c.textMuted}
                    />
                  </View>
                  <Text style={[styles.rungLabel, m.reached && styles.rungLabelReached]}>{m.label}</Text>
                  {m.reachedLabel ? <Text style={styles.rungTag}>{m.reachedLabel}</Text> : null}
                </View>
              ))}
            </View>

            {plan.reengage ? (
              <View style={[styles.nudge, { borderColor: TONE[plan.reengage.tone].color(c) }]}>
                <View style={styles.nudgeHead}>
                  <Ionicons name={TONE[plan.reengage.tone].icon} size={16} color={TONE[plan.reengage.tone].color(c)} />
                  <Text style={[styles.nudgeHeadline, { color: TONE[plan.reengage.tone].color(c) }]}>
                    {plan.reengage.headline}
                  </Text>
                </View>
                <Text style={styles.nudgeBody}>{plan.reengage.nudge}</Text>
              </View>
            ) : null}

            <Text style={styles.basis}>
              {plan.basis.streak} {plan.basis.streak === 1 ? 'day' : 'day'} streak · {plan.basis.scans}{' '}
              {plan.basis.scans === 1 ? 'scan' : 'scans'} · {plan.basis.adherencePct}% adherence
            </Text>
            <View style={{ height: 60 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontFamily: fonts.display, fontSize: 18, fontWeight: '600', color: c.textPrimary, letterSpacing: 0.3 },
    content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
    eyebrow: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', letterSpacing: 2.4, color: c.primary, textTransform: 'uppercase', marginBottom: 14 },
    lede: { fontFamily: fonts.body, fontSize: 14, color: c.textSecondary, lineHeight: 21, letterSpacing: 0.1, marginBottom: 8 },
    celebrate: {
      backgroundColor: c.bgCard,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.gold,
      padding: 20,
      marginBottom: 8,
    },
    celebrateBadge: { fontFamily: fonts.body, fontSize: 10, fontWeight: '700', letterSpacing: 2, color: c.gold, textTransform: 'uppercase', marginBottom: 8 },
    celebrateTitle: { fontFamily: fonts.display, fontSize: 24, fontWeight: '600', color: c.textPrimary, letterSpacing: 0.2, marginBottom: 8 },
    celebrateBlurb: { fontFamily: fonts.body, fontSize: 14, color: c.textSecondary, lineHeight: 21, letterSpacing: 0.1 },
    ladder: { marginTop: 22, gap: 2 },
    rung: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
    rungReached: {},
    dot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    dotReached: { backgroundColor: c.primary },
    dotLocked: { borderWidth: 1, borderColor: c.borderStrong, backgroundColor: 'transparent' },
    rungLabel: { flex: 1, fontFamily: fonts.display, fontSize: 17, fontWeight: '600', color: c.textMuted, letterSpacing: 0.2 },
    rungLabelReached: { color: c.textPrimary },
    rungTag: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', letterSpacing: 1.6, color: c.scoreGood, textTransform: 'uppercase' },
    nudge: {
      marginTop: 24,
      backgroundColor: c.bgCard,
      borderRadius: 16,
      borderWidth: 1,
      padding: 18,
    },
    nudgeHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    nudgeHeadline: { fontFamily: fonts.display, fontSize: 17, fontWeight: '600', letterSpacing: 0.2 },
    nudgeBody: { fontFamily: fonts.body, fontSize: 14, color: c.textSecondary, lineHeight: 21, letterSpacing: 0.1 },
    basis: { fontFamily: fonts.body, fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 24, letterSpacing: 0.2 },
  });
}
