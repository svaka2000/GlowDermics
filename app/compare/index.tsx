import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image,
  Animated, Easing, Dimensions, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import { narrateProgress } from '../../src/services/skinAnalysis';
import { SkinAnalysis } from '../../src/types';
import { ScoreRing } from '../../src/components/ScoreRing';
import {
  PhotoCompareSlider,
  RegionalDeltaMap,
  DeltaGrid,
  Card,
  Badge,
  Button,
  Section,
  Skeleton,
  SkinAgeBadge,
} from '../../src/components/ui';

const { width: SCREEN_W } = Dimensions.get('window');

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function daysBetween(a: string, b: string) {
  return Math.max(
    1,
    Math.round(Math.abs(new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24)),
  );
}

export default function Compare() {
  const [analyses, setAnalyses] = useState<SkinAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [leftIdx, setLeftIdx] = useState(1);
  const [rightIdx, setRightIdx] = useState(0);
  const [pickingFor, setPickingFor] = useState<'left' | 'right' | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    let mounted = true;
    headerAnim.setValue(0);
    contentAnim.setValue(0);
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    Storage.getAnalyses().then(list => {
      if (!mounted) return;
      setAnalyses(list);
      if (list.length >= 2) {
        setLeftIdx(list.length - 1); // oldest
        setRightIdx(0);                // newest
      }
      setLoading(false);
    });

    return () => { mounted = false; };
  }, []));

  const left = analyses[leftIdx];
  const right = analyses[rightIdx];

  // Recompute the narrative whenever the pair changes.
  useEffect(() => {
    if (!left || !right || left.id === right.id) {
      setNarrative(null);
      return;
    }
    let cancelled = false;
    setNarrativeLoading(true);
    setNarrative(null);
    Storage.getUserProfile().then(profile => {
      narrateProgress(left, right, profile).then(text => {
        if (cancelled) return;
        setNarrative(text);
        setNarrativeLoading(false);
      }).catch(() => {
        if (cancelled) return;
        setNarrativeLoading(false);
      });
    });
    return () => { cancelled = true; };
  }, [left?.id, right?.id]);

  if (loading) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 80 }} />
      </View>
    );
  }

  if (analyses.length < 2) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable
              style={styles.backBtn}
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Compare Scans</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyEmojiBox}>
            <Ionicons name="git-compare-outline" size={42} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Need 2+ scans</Text>
          <Text style={styles.emptySub}>
            Complete at least two skin scans and we'll show your progress side-by-side with a draggable
            before/after slider, regional change map, and AI-narrated insight.
          </Text>
          <Button label="Take a Scan" icon="scan-outline" onPress={() => router.replace('/scan')} />
        </View>
      </View>
    );
  }

  if (pickingFor) {
    const activeIdx = pickingFor === 'left' ? leftIdx : rightIdx;
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => setPickingFor(null)}>
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Pick {pickingFor === 'left' ? 'first' : 'second'} scan</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
        <ScrollView contentContainerStyle={styles.scroll}>
          {analyses.map((a, i) => {
            const active = i === activeIdx;
            return (
              <Pressable
                key={a.id}
                style={[styles.pickCard, active && styles.pickCardActive]}
                onPress={() => {
                  if (pickingFor === 'left') setLeftIdx(i);
                  else setRightIdx(i);
                  setPickingFor(null);
                }}
              >
                {a.imageUri ? (
                  <Image source={{ uri: a.imageUri }} style={styles.pickThumb} />
                ) : (
                  <View style={[styles.pickThumb, styles.pickThumbEmpty]}>
                    <Ionicons name="person" size={16} color={Colors.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickDate}>{fmtDate(a.date)}</Text>
                  <Text style={styles.pickScore}>Overall: {a.scores.overall}/100</Text>
                  {a.schemaVersion === 2 && (
                    <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                      <Badge label="v2" tone="premium" size="xs" />
                    </View>
                  )}
                </View>
                {active && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
              </Pressable>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  if (!left || !right) return null;

  const overallDelta = right.scores.overall - left.scores.overall;
  const positive = overallDelta > 0;
  const neutral = overallDelta === 0;
  const elapsed = daysBetween(left.date, right.date);
  const sameScan = left.id === right.id;

  const sliderWidth = Math.min(SCREEN_W - 32, 420);

  // v2 panels are only shown when BOTH scans are v2 (apples-to-apples).
  const bothV2 = left.schemaVersion === 2 && right.schemaVersion === 2;
  const bothHaveRegions = !!(left.regions?.length && right.regions?.length);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerAnim,
              transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
            },
          ]}
        >
          <Pressable
            style={styles.backBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Progress</Text>
          <View style={{ width: 36 }} />
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        style={{ opacity: contentAnim }}
      >
        {/* Hero photo slider */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <PhotoCompareSlider
            leftSource={left.imageUri || null}
            rightSource={right.imageUri || null}
            width={sliderWidth}
            aspectRatio={1.0}
            leftCaption={`BEFORE · ${fmtDate(left.date)}`}
            rightCaption={`AFTER · ${fmtDate(right.date)}`}
          />
        </View>

        {/* Time elapsed + scan pickers */}
        <Card variant="elevated" style={{ marginBottom: 14 }} padding={14}>
          <View style={styles.elapsedRow}>
            <View style={styles.elapsedChip}>
              <Ionicons name="hourglass-outline" size={13} color={Colors.primary} />
              <Text style={styles.elapsedText}>
                {sameScan ? 'Same scan' : `${elapsed} day${elapsed === 1 ? '' : 's'} apart`}
              </Text>
            </View>
            <View style={styles.scanPickRow}>
              <Pressable style={styles.scanPickBtn} onPress={() => setPickingFor('left')}>
                <Ionicons name="swap-horizontal" size={11} color={Colors.primary} />
                <Text style={styles.scanPickBtnText}>Change First</Text>
              </Pressable>
              <Pressable style={styles.scanPickBtn} onPress={() => setPickingFor('right')}>
                <Ionicons name="swap-horizontal" size={11} color={Colors.primary} />
                <Text style={styles.scanPickBtnText}>Change Second</Text>
              </Pressable>
            </View>
          </View>
        </Card>

        {/* Overall delta hero */}
        <Card
          variant={positive ? 'gradient' : neutral ? 'elevated' : 'gradient'}
          tint={positive ? Colors.scoreExcellent : neutral ? Colors.primary : Colors.scorePoor}
          style={{ marginBottom: 16 }}
        >
          <View style={styles.overallHero}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.overallLabel}>OVERALL CHANGE</Text>
              <View style={styles.overallNumberRow}>
                <Text
                  style={[
                    styles.overallNumber,
                    { color: positive ? Colors.scoreExcellent : neutral ? Colors.textPrimary : Colors.scorePoor },
                  ]}
                >
                  {neutral ? '—' : `${positive ? '+' : ''}${overallDelta}`}
                </Text>
                <Text style={styles.overallUnit}>pts</Text>
              </View>
              <Text style={styles.overallSub}>
                {left.scores.overall} → {right.scores.overall}
              </Text>
            </View>
            <View style={styles.overallRings}>
              <ScoreRing score={left.scores.overall} size={54} strokeWidth={5} />
              <Ionicons name="arrow-forward" size={16} color={Colors.textMuted} />
              <ScoreRing score={right.scores.overall} size={54} strokeWidth={5} />
            </View>
          </View>
        </Card>

        {/* AI narrative */}
        <Card variant="glass" style={{ marginBottom: 16 }} padding={18}>
          <View style={styles.narrativeHeader}>
            <View style={styles.narrativeIcon}>
              <Ionicons name="sparkles" size={14} color={Colors.primary} />
            </View>
            <Text style={styles.narrativeTitle}>What changed</Text>
          </View>
          {narrativeLoading ? (
            <View style={{ gap: 6 }}>
              <Skeleton height={14} />
              <Skeleton height={14} width={'88%'} />
              <Skeleton height={14} width={'72%'} />
            </View>
          ) : (
            <Text style={styles.narrativeText}>
              {narrative ?? 'Comparison narrative unavailable.'}
            </Text>
          )}
        </Card>

        {/* Skin age delta (v2 both) */}
        {bothV2 && left.skinAge && right.skinAge && (
          <View style={{ marginBottom: 16 }}>
            <Section title="Skin age" caption="AI-estimated biological age" gap={10}>
              <View style={styles.ageRow}>
                <View style={{ flex: 1 }}>
                  <SkinAgeBadge skinAge={left.skinAge} delay={0} />
                </View>
                <View style={{ flex: 1 }}>
                  <SkinAgeBadge skinAge={right.skinAge} delay={120} />
                </View>
              </View>
            </Section>
          </View>
        )}

        {/* All-dimension delta grid */}
        <View style={{ marginBottom: 16 }}>
          <Section
            title={bothV2 ? 'All 16 dimensions' : 'All dimensions'}
            caption="Sorted by biggest change · swipe →"
            gap={10}
          >
            <DeltaGrid
              before={
                bothV2 && left.scoresV2 && right.scoresV2 ? left.scoresV2 : left.scores
              }
              after={
                bothV2 && left.scoresV2 && right.scoresV2 ? right.scoresV2 : right.scores
              }
            />
          </Section>
        </View>

        {/* Regional delta map (v2 with regions both) */}
        {bothHaveRegions && (
          <Card variant="elevated" style={{ marginBottom: 16 }} padding={18}>
            <Text style={styles.cardTitle}>Regional change map</Text>
            <Text style={styles.cardSub}>Green = improved · red = regressed · neutral = unchanged</Text>
            <View style={{ marginTop: 14 }}>
              <RegionalDeltaMap
                before={left.regions!}
                after={right.regions!}
                width={Math.min(SCREEN_W - 64, 320)}
              />
            </View>
          </Card>
        )}

        {/* Skin type / concern chips */}
        <Card variant="outline" style={{ marginBottom: 16 }} padding={14}>
          <Text style={styles.smallLabel}>SKIN TYPE</Text>
          <View style={styles.chipRow}>
            <Badge
              label={`Was: ${left.skinType ?? '—'}`}
              tone="neutral"
              size="sm"
              icon="ellipse-outline"
            />
            <Ionicons name="arrow-forward" size={12} color={Colors.textMuted} />
            <Badge
              label={`Now: ${right.skinType ?? '—'}`}
              tone={left.skinType === right.skinType ? 'neutral' : 'primary'}
              size="sm"
              filled={left.skinType !== right.skinType}
              icon="checkmark-circle-outline"
            />
          </View>

          {right.concerns?.length > 0 && (
            <>
              <Text style={[styles.smallLabel, { marginTop: 14 }]}>CURRENT CONCERNS</Text>
              <View style={styles.chipRow}>
                {right.concerns.slice(0, 4).map(c => (
                  <Badge key={c} label={c} tone="danger" size="sm" />
                ))}
              </View>
            </>
          )}

          {right.strengths?.length > 0 && (
            <>
              <Text style={[styles.smallLabel, { marginTop: 14 }]}>CURRENT STRENGTHS</Text>
              <View style={styles.chipRow}>
                {right.strengths.slice(0, 4).map(s => (
                  <Badge key={s} label={s} tone="success" size="sm" />
                ))}
              </View>
            </>
          )}
        </Card>

        {/* View buttons */}
        <View style={styles.viewBtnsRow}>
          <Pressable style={styles.viewBtn} onPress={() => router.push(`/results/${left.id}`)}>
            <Ionicons name="eye-outline" size={14} color={Colors.primary} />
            <Text style={styles.viewBtnText}>View Before</Text>
          </Pressable>
          <Pressable
            style={[styles.viewBtn, styles.viewBtnPrimary]}
            onPress={() => router.push(`/results/${right.id}`)}
          >
            <Ionicons name="eye" size={14} color={Colors.white} />
            <Text style={[styles.viewBtnText, { color: Colors.white }]}>View After</Text>
          </Pressable>
        </View>

        <View style={{ height: 80 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  scroll: { paddingHorizontal: 16 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 12, paddingTop: 60, paddingBottom: 80 },
  emptyEmojiBox: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(196,98,45,0.10)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 14 },

  elapsedRow: { gap: 10 },
  elapsedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(196,98,45,0.10)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  elapsedText: { fontSize: 11, fontWeight: '800', color: Colors.primary, letterSpacing: 0.4 },
  scanPickRow: { flexDirection: 'row', gap: 8 },
  scanPickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: Colors.bgElevated,
    borderRadius: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  scanPickBtnText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  overallHero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  overallLabel: { fontSize: 9, fontWeight: '900', color: Colors.textMuted, letterSpacing: 1.5 },
  overallNumberRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  overallNumber: { fontSize: 56, fontWeight: '900', letterSpacing: -2, lineHeight: 56 },
  overallUnit: { fontSize: 14, fontWeight: '800', color: Colors.textSecondary, paddingBottom: 8 },
  overallSub: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  overallRings: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  narrativeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  narrativeIcon: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(196,98,45,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  narrativeTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 0.2 },
  narrativeText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 22, fontWeight: '500' },

  ageRow: { flexDirection: 'row', gap: 10 },

  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  cardSub: { fontSize: 11, color: Colors.textMuted, marginTop: 3 },

  smallLabel: { fontSize: 9, fontWeight: '900', color: Colors.textMuted, letterSpacing: 1.4, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },

  viewBtnsRow: { flexDirection: 'row', gap: 10 },
  viewBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, paddingVertical: 14,
  },
  viewBtnPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  viewBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  pickCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
    marginBottom: 10,
  },
  pickCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(196,98,45,0.08)' },
  pickThumb: { width: 50, height: 50, borderRadius: 10, backgroundColor: Colors.bgElevated },
  pickThumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  pickDate: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  pickScore: { fontSize: 12, color: Colors.textSecondary },
});
