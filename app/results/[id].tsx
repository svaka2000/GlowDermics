import { useEffect, useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image,
  ActivityIndicator, Share, Linking, Animated, Easing,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';
import { SkinAnalysis } from '../../src/types';
import { ScoreRing } from '../../src/components/ScoreRing';
import { ScoreBar } from '../../src/components/ScoreBar';
import { getSkincareImage } from '../../src/services/imageSearch';
import { runSkinProgressEngine, EngineReport } from '../../src/engine/SkinProgressEngine';
import {
  RegionalSkinMap,
  RegionDetailChip,
  SkinAgeBadge,
  BiomarkerCloud,
  ScoreGrid,
  ScanCelebration,
} from '../../src/components/ui';
import { runSkinIdentity, SkinIdentity } from '../../src/engine/SkinIdentityEngine';
import { FaceRegion } from '../../src/types';

const SCORE_LABELS: Record<string, string> = {
  hydration: 'Hydration',
  texture: 'Texture',
  clarity: 'Clarity',
  evenness: 'Evenness',
  firmness: 'Firmness',
  pores: 'Pores',
};

function buildPriorityColors(c: Palette) {
  return {
    high: c.scorePoor,
    medium: c.scoreFair,
    low: c.scoreGood,
  };
}

export default function Results() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const PRIORITY_COLORS = useMemo(() => buildPriorityColors(colors), [colors]);
  const params = useLocalSearchParams<{ id: string; celebrate?: string }>();
  const id = params.id;
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [prevAnalysis, setPrevAnalysis] = useState<SkinAnalysis | null>(null);
  const [engineReport, setEngineReport] = useState<EngineReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'scores' | 'routine' | 'recommendations'>('scores');
  const [selectedRegion, setSelectedRegion] = useState<FaceRegion | null>(null);
  const [identity, setIdentity] = useState<SkinIdentity | null>(null);
  const [showCelebration, setShowCelebration] = useState(params.celebrate === '1');

  // Entrance animations
  const heroAnim = useRef(new Animated.Value(0)).current;
  const scoreRingScale = useRef(new Animated.Value(0.3)).current;
  const bodyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const [all, report] = await Promise.all([Storage.getAnalyses(), runSkinProgressEngine()]);
      const idx = all.findIndex(a => a.id === id);
      const found = idx >= 0 ? all[idx] : null;
      // previous scan is the one after it in the array (sorted newest first)
      const prev = idx >= 0 && idx + 1 < all.length ? all[idx + 1] : null;
      setAnalysis(found);
      setPrevAnalysis(prev);
      setEngineReport(report);
      setLoading(false);
      // Load identity in parallel for the celebration overlay (only if celebrating)
      if (params.celebrate === '1') {
        runSkinIdentity().then(setIdentity).catch(() => {});
      }
      Animated.stagger(120, [
        Animated.timing(heroAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(scoreRingScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(bodyAnim, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadWrap}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={styles.loadWrap}>
        <Text style={{ color: colors.textMuted }}>Report not found</Text>
      </View>
    );
  }

  const scoreEntries = Object.entries(analysis.scores).filter(([k]) => k !== 'overall') as [string, number][];

  const handleShare = async () => {
    const scoreLines = [
      `Hydration: ${analysis.scores.hydration}`,
      `Texture: ${analysis.scores.texture}`,
      `Clarity: ${analysis.scores.clarity}`,
      `Evenness: ${analysis.scores.evenness}`,
      `Firmness: ${analysis.scores.firmness}`,
      `Pores: ${analysis.scores.pores}`,
    ].join('  ·  ');

    const message = [
      `🌿 My Skin Score: ${analysis.scores.overall}/100`,
      '',
      scoreLines,
      '',
      `Skin Type: ${analysis.skinType ? analysis.skinType.charAt(0).toUpperCase() + analysis.skinType.slice(1) : '—'}`,
      analysis.strengths.length ? `Strengths: ${analysis.strengths.slice(0, 2).join(', ')}` : '',
      '',
      'Powered by GlowDermics × TallowDermics',
      'tallowdermics.com',
    ].filter(Boolean).join('\n');

    await Share.share({ message });
  };

  return (
    <View style={styles.root}>
      {showCelebration && (
        <ScanCelebration
          score={analysis.scores.overall}
          previousScore={prevAnalysis ? prevAnalysis.scores.overall : null}
          persona={identity?.persona ?? null}
          personaTint={identity?.colorway.accent}
          onDismiss={() => setShowCelebration(false)}
        />
      )}
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Skin Report</Text>
          <Pressable style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero card */}
        <Animated.View style={{ opacity: heroAnim, transform: [{ translateY: heroAnim.interpolate({ inputRange: [0,1], outputRange: [-12, 0] }) }] }}>
          <View style={styles.heroCard}>
            {analysis.imageUri ? (
              <Image source={{ uri: analysis.imageUri }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={styles.heroImageEmpty}>
                <Ionicons name="person" size={48} color={colors.textMuted} />
              </View>
            )}
          </View>

          {/* Score + summary below photo */}
          <View style={styles.heroMeta}>
            <View style={styles.heroMetaTop}>
              <View style={styles.heroLeft}>
                <Text style={styles.heroBadge}>{analysis.skinType?.toUpperCase()} SKIN</Text>
                <Text style={styles.heroDate}>
                  {new Date(analysis.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                </Text>
              </View>
              <Animated.View style={{ transform: [{ scale: scoreRingScale }] }}>
                <ScoreRing score={analysis.scores.overall} size={80} strokeWidth={6} />
              </Animated.View>
            </View>
            <Text style={styles.heroInsights}>{analysis.insights}</Text>

            {/* Delta vs previous scan */}
            {prevAnalysis && (() => {
              const delta = analysis.scores.overall - prevAnalysis.scores.overall;
              const positive = delta >= 0;
              return (
                <View style={styles.deltaBanner}>
                  <Ionicons name={positive ? 'trending-up' : 'trending-down'} size={14} color={positive ? colors.scoreExcellent : colors.scorePoor} />
                  <Text style={[styles.deltaBannerText, { color: positive ? colors.scoreExcellent : colors.scorePoor }]}>
                    {positive ? '+' : ''}{delta} vs. previous scan
                  </Text>
                  <View style={styles.deltaBannerSub}>
                    {(['hydration', 'texture', 'clarity', 'evenness', 'firmness', 'pores'] as const).map(metric => {
                      const d = analysis.scores[metric] - prevAnalysis.scores[metric];
                      if (d === 0) return null;
                      return (
                        <Text key={metric} style={[styles.deltaMini, { color: d > 0 ? colors.scoreExcellent : colors.scorePoor }]}>
                          {metric.slice(0, 3).toUpperCase()} {d > 0 ? '+' : ''}{d}
                        </Text>
                      );
                    })}
                  </View>
                </View>
              );
            })()}
          </View>
        </Animated.View>

        {/* v2 panels — only rendered when v2 data is present (additive, v1-safe). */}
        {analysis.schemaVersion === 2 && (
          <Animated.View
            style={{
              opacity: bodyAnim,
              transform: [{ translateY: bodyAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }}
          >
            {analysis.skinAge && (
              <View style={styles.v2Block}>
                <SkinAgeBadge skinAge={analysis.skinAge} delay={120} />
              </View>
            )}

            {analysis.biomarkers && analysis.biomarkers.length > 0 && (
              <View style={styles.v2Block}>
                <Text style={styles.v2SectionTitle}>Biomarker Signals</Text>
                <BiomarkerCloud biomarkers={analysis.biomarkers} delay={300} />
              </View>
            )}

            {analysis.regions && analysis.regions.length > 0 && (
              <View style={styles.v2BlockCard}>
                <Text style={styles.v2SectionTitle}>Regional Analysis</Text>
                <Text style={styles.v2SectionSub}>Tap a zone to see what we found</Text>
                <View style={{ alignItems: 'center', marginTop: 14 }}>
                  <RegionalSkinMap
                    findings={analysis.regions}
                    selected={selectedRegion}
                    onRegionPress={r => setSelectedRegion(r)}
                  />
                </View>
                {selectedRegion && (
                  <RegionDetailChip
                    finding={analysis.regions.find(r => r.region === selectedRegion)}
                  />
                )}
              </View>
            )}
          </Animated.View>
        )}

        {/* Strengths & Concerns + Tabs + Content */}
        <Animated.View style={{ opacity: bodyAnim, transform: [{ translateY: bodyAnim.interpolate({ inputRange: [0,1], outputRange: [24, 0] }) }] }}>
        <View style={styles.row}>
          <View style={[styles.halfCard, { borderColor: 'rgba(74,222,128,0.2)' }]}>
            <Text style={[styles.halfTitle, { color: colors.scoreExcellent }]}>Strengths</Text>
            {analysis.strengths.map(s => (
              <View key={s} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: colors.scoreExcellent }]}>✓</Text>
                <Text style={styles.bulletText}>{s}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.halfCard, { borderColor: 'rgba(248,113,113,0.2)' }]}>
            <Text style={[styles.halfTitle, { color: colors.scorePoor }]}>Concerns</Text>
            {analysis.concerns.map(c => (
              <View key={c} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: colors.scorePoor }]}>!</Text>
                <Text style={styles.bulletText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {(['scores', 'routine', 'recommendations'] as const).map(t => (
            <Pressable
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Scores tab */}
        {tab === 'scores' && (
          <>
            {/* v2: full 16-dimension score grid */}
            {analysis.scoresV2 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>All 16 Dimensions</Text>
                <Text style={styles.cardSub}>Swipe to see every metric · tap for detail</Text>
                <ScoreGrid
                  scores={analysis.scoresV2}
                  confidence={analysis.confidence}
                  previous={prevAnalysis?.scoresV2}
                  hideOverall
                />
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Skin Scores</Text>
              {prevAnalysis && <Text style={styles.cardSub}>Arrows show change vs. previous scan</Text>}
              <View style={styles.scoresGrid}>
                {scoreEntries.map(([key, val]) => {
                  const prev = prevAnalysis ? prevAnalysis.scores[key as keyof typeof prevAnalysis.scores] : null;
                  const delta = prev !== null ? (val as number) - prev : null;
                  return (
                    <View key={key} style={styles.scoreBarRow}>
                      <View style={{ flex: 1 }}>
                        <ScoreBar label={SCORE_LABELS[key] || key} value={val as number} />
                      </View>
                      {delta !== null && delta !== 0 && (
                        <View style={[styles.scoreDelta, { backgroundColor: delta > 0 ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)' }]}>
                          <Text style={[styles.scoreDeltaText, { color: delta > 0 ? colors.scoreExcellent : colors.scorePoor }]}>
                            {delta > 0 ? '+' : ''}{delta}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* What's Working card */}
            {engineReport && (engineReport.whatWorking.length > 0 || engineReport.whatNotWorking.length > 0) && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>What's Working</Text>
                {engineReport.whatWorking.slice(0, 3).map((f, i) => (
                  <View key={i} style={styles.engineFactorRow}>
                    <View style={[styles.engineFactorDot, { backgroundColor: 'rgba(22,163,74,0.15)' }]}>
                      <Text style={{ fontSize: 10, color: colors.scoreExcellent, fontWeight: '800' }}>✓</Text>
                    </View>
                    <Text style={styles.engineFactorText}>{f.factor}</Text>
                  </View>
                ))}
                {engineReport.whatNotWorking.slice(0, 2).map((f, i) => (
                  <View key={i} style={styles.engineFactorRow}>
                    <View style={[styles.engineFactorDot, { backgroundColor: 'rgba(220,38,38,0.1)' }]}>
                      <Text style={{ fontSize: 10, color: colors.scorePoor, fontWeight: '800' }}>!</Text>
                    </View>
                    <Text style={styles.engineFactorText}>{f.factor}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Routine tab */}
        {tab === 'routine' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Personalized Routine</Text>
            {(['morning', 'evening'] as const).map(time => {
              const steps = analysis.routine.filter(s => s.time === time || s.time === 'both');
              if (!steps.length) return null;
              return (
                <View key={time} style={styles.routineSection}>
                  <View style={styles.routineTimeHeader}>
                    <Ionicons name={time === 'morning' ? 'sunny-outline' : 'moon-outline'} size={16} color={colors.primary} />
                    <Text style={styles.routineTimeLabel}>{time.toUpperCase()} ROUTINE</Text>
                  </View>
                  {steps.map((step, i) => (
                    <View key={i} style={styles.routineStep}>
                      <View style={styles.routineNum}>
                        <Text style={styles.routineNumText}>{i + 1}</Text>
                      </View>
                      <View style={styles.routineInfo}>
                        <Text style={styles.routineStepName}>{step.step}</Text>
                        <Text style={styles.routineProduct}>{step.product}</Text>
                        <Text style={styles.routineWhy}>{step.why}</Text>
                        {step.duration && (
                          <Text style={styles.routineDuration}>⏱ {step.duration}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Recommendations tab */}
        {tab === 'recommendations' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recommendations</Text>
            {analysis.recommendations.map((rec, i) => (
              <View key={i} style={[styles.recCard, rec.product?.isTallowDermics && styles.recCardHighlight]}>
                <View style={styles.recHeader}>
                  <View style={styles.recCategoryWrap}>
                    <Text style={styles.recCategory}>{rec.category}</Text>
                  </View>
                  <View style={[styles.recPriority, { backgroundColor: PRIORITY_COLORS[rec.priority] + '22' }]}>
                    <Text style={[styles.recPriorityText, { color: PRIORITY_COLORS[rec.priority] }]}>
                      {rec.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recTitle}>{rec.title}</Text>
                <Text style={styles.recDesc}>{rec.description}</Text>
                {rec.product && (
                  <View style={styles.productTag}>
                    <View style={styles.productTagInner}>
                      {/* Product image */}
                      <Image
                        source={{ uri: getSkincareImage(rec.product.category || 'skincare') }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1 }}>
                        {rec.product.isTallowDermics && (
                          <View style={styles.tdBadge}>
                            <LinearGradient colors={[colors.primaryLight, colors.primary]} style={StyleSheet.absoluteFill} />
                            <Text style={styles.tdBadgeText}>✦ TallowDermics</Text>
                          </View>
                        )}
                        <Text style={styles.productName}>{rec.product.name}</Text>
                        <Text style={styles.productBrand}>{rec.product.brand}</Text>
                        <Text style={styles.productWhy}>{rec.product.why}</Text>
                        {rec.product.isTallowDermics && (
                          <Pressable
                            style={styles.shopBtn}
                            onPress={() => Linking.openURL('https://tallowdermics.com')}
                          >
                            <Text style={styles.shopBtnText}>Shop TallowDermics →</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  loadWrap: { flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' },
  safeTop: {},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: c.textPrimary },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  shareBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(196,98,45,0.12)', borderRadius: 20 },
  scroll: { paddingBottom: 40 },
  heroCard: { height: 300, backgroundColor: c.bgCard },
  heroImage: { width: '100%', height: '100%' },
  heroImageEmpty: {
    width: '100%', height: '100%', backgroundColor: c.bgCard,
    alignItems: 'center', justifyContent: 'center',
  },
  heroMeta: {
    backgroundColor: c.bgCard, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    marginBottom: 16,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  heroMetaTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  heroLeft: { flex: 1 },
  heroBadge: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: c.primary, marginBottom: 4 },
  heroDate: { fontSize: 12, color: c.textMuted },
  heroInsights: { fontSize: 14, color: c.textSecondary, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 16 },
  halfCard: {
    flex: 1, backgroundColor: c.bgCard, borderRadius: 16,
    borderWidth: 1, padding: 14, gap: 8,
  },
  halfTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  bulletRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  bullet: { fontSize: 12, fontWeight: '800', marginTop: 1 },
  bulletText: { fontSize: 12, color: c.textSecondary, flex: 1, lineHeight: 18 },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: c.bgCard, borderRadius: 14, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: c.bgElevated },
  tabLabel: { fontSize: 12, fontWeight: '600', color: c.textMuted },
  tabLabelActive: { color: c.textPrimary },
  card: {
    marginHorizontal: 16, marginBottom: 16, backgroundColor: c.bgCard,
    borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 20,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary, marginBottom: 16 },
  deltaBanner: {
    marginTop: 12, backgroundColor: c.bgElevated, borderRadius: 12,
    padding: 10, gap: 6, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
  },
  deltaBannerText: { fontSize: 13, fontWeight: '700' },
  deltaBannerSub: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, width: '100%' },
  deltaMini: { fontSize: 10, fontWeight: '700' },
  scoreBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreDelta: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, minWidth: 36, alignItems: 'center' },
  scoreDeltaText: { fontSize: 11, fontWeight: '800' },
  engineFactorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  engineFactorDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  engineFactorText: { fontSize: 13, color: c.textSecondary, flex: 1 },
  cardSub: { fontSize: 11, color: c.textMuted, marginBottom: 12, marginTop: -10 },
  scoresGrid: { gap: 14 },
  routineSection: { marginBottom: 20 },
  routineTimeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  routineTimeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: c.primary },
  routineStep: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  routineNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(196,98,45,0.15)', alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  routineNumText: { fontSize: 12, fontWeight: '700', color: c.primary },
  routineInfo: { flex: 1 },
  routineStepName: { fontSize: 15, fontWeight: '700', color: c.textPrimary, marginBottom: 2 },
  routineProduct: { fontSize: 13, color: c.primary, fontWeight: '500', marginBottom: 4 },
  routineWhy: { fontSize: 13, color: c.textSecondary, lineHeight: 19 },
  routineDuration: { fontSize: 11, color: c.textMuted, marginTop: 4 },
  recCard: {
    backgroundColor: c.bgElevated, borderRadius: 14,
    borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 12,
  },
  recCardHighlight: { borderColor: c.borderStrong },
  recHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  recCategoryWrap: {},
  recCategory: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: c.textMuted },
  recPriority: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  recPriorityText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  recTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary, marginBottom: 6 },
  recDesc: { fontSize: 13, color: c.textSecondary, lineHeight: 19, marginBottom: 12 },
  productTag: {
    backgroundColor: c.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: c.border, overflow: 'hidden',
  },
  productTagInner: { flexDirection: 'row', gap: 12, padding: 12, alignItems: 'flex-start' },
  productImage: { width: 72, height: 72, borderRadius: 10, backgroundColor: c.bgElevated },
  tdBadge: {
    alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 6, overflow: 'hidden',
  },
  tdBadgeText: { fontSize: 10, fontWeight: '700', color: c.white, letterSpacing: 0.5 },
  productName: { fontSize: 14, fontWeight: '700', color: c.textPrimary, marginBottom: 2 },
  productBrand: { fontSize: 12, color: c.textMuted, marginBottom: 4 },
  productWhy: { fontSize: 12, color: c.textSecondary, lineHeight: 18 },
  shopBtn: {
    marginTop: 8, backgroundColor: c.primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start',
  },
  shopBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  v2Block: { marginHorizontal: 16, marginBottom: 16 },
  v2BlockCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: c.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    padding: 20,
  },
  v2SectionTitle: { fontSize: 16, fontWeight: '800', color: c.textPrimary, marginBottom: 4 },
  v2SectionSub: { fontSize: 12, color: c.textMuted, marginBottom: 6 },
  });
}
