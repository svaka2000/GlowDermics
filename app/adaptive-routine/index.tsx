import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { fonts } from '../../src/constants/typography';
import { Storage } from '../../src/services/storage';
import type { SkinAnalysis } from '../../src/types';
import {
  deriveAdaptiveRoutine,
  type AdaptiveRoutinePlan,
  type AdaptiveSuggestion,
  type BuiltRoutineLike,
} from '../../src/engine/AdaptiveRoutineEngine';

type KindMeta = { label: string; icon: keyof typeof Ionicons.glyphMap; color: (c: Palette) => string };

const KIND: Record<AdaptiveSuggestion['kind'], KindMeta> = {
  reinforce: { label: 'REINFORCE', icon: 'trending-up', color: (c) => c.scoreGood },
  add: { label: 'ADD', icon: 'add-circle-outline', color: (c) => c.primary },
  ease: { label: 'EASE', icon: 'leaf-outline', color: (c) => c.gold },
  watch: { label: 'WATCH', icon: 'alert-circle-outline', color: (c) => c.gold },
};

export default function AdaptiveRoutineScreen() {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [plan, setPlan] = useState<AdaptiveRoutinePlan | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [analyses, routineLog] = await Promise.all([
          Storage.getAnalyses(),
          Storage.getFullRoutineLog(),
        ]);
        let built: BuiltRoutineLike | null = null;
        try {
          const raw = await AsyncStorage.getItem('gd_routine_builder');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.morning) && Array.isArray(parsed.evening)) {
              built = { morning: parsed.morning, evening: parsed.evening };
            }
          }
        } catch {
          /* read-only best-effort; never write */
        }
        const result = deriveAdaptiveRoutine(
          Array.isArray(analyses) ? analyses : ([] as SkinAnalysis[]),
          Array.isArray(routineLog) ? routineLog : [],
          built,
          Date.now()
        );
        if (alive) setPlan(result);
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  const isEmpty = !!plan && plan.basis.scans === 0;

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
            Adaptive Routine
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        {!plan ? null : isEmpty ? (
          <View style={styles.empty}>
            <Text style={styles.eyebrow}>ADAPTIVE ROUTINE</Text>
            <Text style={styles.emptyTitle}>Your routine{'\n'}adapts to you</Text>
            <Text style={styles.emptySub}>
              Take a scan and Velumi AI will tune your routine to how your skin actually responds — reinforcing what
              works, easing what doesn't.
            </Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/scanner' as any)} accessibilityRole="button" accessibilityLabel="Take a scan">
              <Text style={styles.emptyBtnText}>Take a scan</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.eyebrow}>ADAPTIVE ROUTINE</Text>
            <Text style={styles.verdict}>{plan.verdict}</Text>
            {plan.trendSummary ? <Text style={styles.trend}>{plan.trendSummary}</Text> : null}

            <View style={styles.adherenceCard}>
              <View style={styles.adherenceTop}>
                <Text style={styles.adherenceNum}>{plan.adherencePct}%</Text>
                <Text style={styles.adherenceCaption}>
                  routine adherence{'\n'}last 14 days
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.max(0, Math.min(100, plan.adherencePct))}%` }]} />
              </View>
              <Text style={styles.basis}>
                {plan.basis.scans} {plan.basis.scans === 1 ? 'scan' : 'scans'}
                {plan.basis.sinceLabel ? ` · since ${plan.basis.sinceLabel}` : ''}
              </Text>
            </View>

            <Text style={styles.sectionLabel}>SUGGESTED ADJUSTMENTS</Text>
            {plan.suggestions.length === 0 ? (
              <Text style={styles.noneText}>No changes needed — your routine is well matched to your skin right now.</Text>
            ) : (
              plan.suggestions.map((s) => {
                const meta = KIND[s.kind];
                const accent = meta.color(c);
                return (
                  <View key={s.id} style={styles.sCard}>
                    <View style={styles.sHead}>
                      <View style={[styles.sChip, { borderColor: accent }]}>
                        <Ionicons name={meta.icon} size={13} color={accent} />
                        <Text style={[styles.sChipText, { color: accent }]}>{meta.label}</Text>
                      </View>
                      {s.targetTime ? <Text style={styles.sTarget}>{s.targetTime.toUpperCase()}</Text> : null}
                    </View>
                    <Text style={styles.sTitle}>{s.title}</Text>
                    <Text style={styles.sBody}>{s.rationale}</Text>
                    {s.targetStep ? <Text style={styles.sStep}>In your routine: {s.targetStep}</Text> : null}
                  </View>
                );
              })
            )}

            <Text style={styles.footnote}>
              Suggestions only — your saved routine is never changed automatically.
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
    eyebrow: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', letterSpacing: 2.4, color: c.primary, textTransform: 'uppercase', marginBottom: 10 },
    verdict: { fontFamily: fonts.display, fontSize: 26, fontWeight: '600', color: c.textPrimary, letterSpacing: 0.2, lineHeight: 33 },
    trend: { fontFamily: fonts.body, fontSize: 14, color: c.textSecondary, lineHeight: 21, marginTop: 10, letterSpacing: 0.1 },
    adherenceCard: {
      marginTop: 22,
      backgroundColor: c.bgCard,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
    },
    adherenceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    adherenceNum: { fontFamily: fonts.display, fontSize: 34, fontWeight: '600', color: c.textPrimary, letterSpacing: 0.2 },
    adherenceCaption: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', letterSpacing: 1.6, color: c.textMuted, textTransform: 'uppercase', textAlign: 'right' },
    barTrack: { height: 6, borderRadius: 3, backgroundColor: c.bgElevated, marginTop: 14, overflow: 'hidden' },
    barFill: { height: 6, borderRadius: 3, backgroundColor: c.primary },
    basis: { fontFamily: fonts.body, fontSize: 12, color: c.textMuted, marginTop: 12, letterSpacing: 0.2 },
    sectionLabel: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', letterSpacing: 2.4, color: c.textMuted, textTransform: 'uppercase', marginTop: 28, marginBottom: 12 },
    noneText: { fontFamily: fonts.body, fontSize: 14, color: c.textSecondary, lineHeight: 21, letterSpacing: 0.1 },
    sCard: {
      backgroundColor: c.bgCard,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
      marginBottom: 12,
    },
    sHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    sChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    sChipText: { fontFamily: fonts.body, fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
    sTarget: { fontFamily: fonts.body, fontSize: 10, fontWeight: '600', letterSpacing: 1.6, color: c.textMuted },
    sTitle: { fontFamily: fonts.display, fontSize: 17, fontWeight: '600', color: c.textPrimary, letterSpacing: 0.2, marginBottom: 6 },
    sBody: { fontFamily: fonts.body, fontSize: 14, color: c.textSecondary, lineHeight: 21, letterSpacing: 0.1 },
    sStep: { fontFamily: fonts.body, fontSize: 12, color: c.textMuted, marginTop: 8, fontStyle: 'italic' },
    footnote: { fontFamily: fonts.body, fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 18, letterSpacing: 0.1 },
    empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 12 },
    emptyTitle: { fontFamily: fonts.display, fontSize: 27, fontWeight: '600', color: c.textPrimary, textAlign: 'center', letterSpacing: 0.2, lineHeight: 34 },
    emptySub: { fontFamily: fonts.body, fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: 12, maxWidth: 300, letterSpacing: 0.1 },
    emptyBtn: { marginTop: 24, borderRadius: 14, borderWidth: 1, borderColor: c.borderStrong, paddingHorizontal: 24, paddingVertical: 13 },
    emptyBtnText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', color: c.primary, letterSpacing: 0.3 },
  });
}
