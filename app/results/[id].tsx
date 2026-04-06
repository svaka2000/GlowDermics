import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image,
  ActivityIndicator, Share, Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import { SkinAnalysis } from '../../src/types';
import { ScoreRing } from '../../src/components/ScoreRing';
import { ScoreBar } from '../../src/components/ScoreBar';
import { getSkincareImage } from '../../src/services/imageSearch';

const SCORE_LABELS: Record<string, string> = {
  hydration: 'Hydration',
  texture: 'Texture',
  clarity: 'Clarity',
  evenness: 'Evenness',
  firmness: 'Firmness',
  pores: 'Pores',
};

const PRIORITY_COLORS = {
  high: Colors.scorePoor,
  medium: Colors.scoreFair,
  low: Colors.scoreGood,
};

export default function Results() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'scores' | 'routine' | 'recommendations'>('scores');

  useEffect(() => {
    (async () => {
      const all = await Storage.getAnalyses();
      const found = all.find(a => a.id === id) || null;
      setAnalysis(found);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadWrap}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={styles.loadWrap}>
        <Text style={{ color: Colors.textMuted }}>Report not found</Text>
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
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Skin Report</Text>
          <Pressable style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={Colors.primary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero card */}
        <View style={styles.heroCard}>
          {analysis.imageUri ? (
            <Image source={{ uri: analysis.imageUri }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroImageEmpty}>
              <Ionicons name="person" size={48} color={Colors.textMuted} />
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
            <ScoreRing score={analysis.scores.overall} size={80} strokeWidth={6} />
          </View>
          <Text style={styles.heroInsights}>{analysis.insights}</Text>
        </View>

        {/* Strengths & Concerns */}
        <View style={styles.row}>
          <View style={[styles.halfCard, { borderColor: 'rgba(74,222,128,0.2)' }]}>
            <Text style={[styles.halfTitle, { color: Colors.scoreExcellent }]}>Strengths</Text>
            {analysis.strengths.map(s => (
              <View key={s} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: Colors.scoreExcellent }]}>✓</Text>
                <Text style={styles.bulletText}>{s}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.halfCard, { borderColor: 'rgba(248,113,113,0.2)' }]}>
            <Text style={[styles.halfTitle, { color: Colors.scorePoor }]}>Concerns</Text>
            {analysis.concerns.map(c => (
              <View key={c} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: Colors.scorePoor }]}>!</Text>
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
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Skin Scores</Text>
            <View style={styles.scoresGrid}>
              {scoreEntries.map(([key, val]) => (
                <ScoreBar key={key} label={SCORE_LABELS[key] || key} value={val} />
              ))}
            </View>
          </View>
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
                    <Ionicons name={time === 'morning' ? 'sunny-outline' : 'moon-outline'} size={16} color={Colors.primary} />
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
                            <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={StyleSheet.absoluteFill} />
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  loadWrap: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  safeTop: {},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  shareBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(196,98,45,0.12)', borderRadius: 20 },
  scroll: { paddingBottom: 40 },
  heroCard: { height: 300, backgroundColor: Colors.bgCard },
  heroImage: { width: '100%', height: '100%' },
  heroImageEmpty: {
    width: '100%', height: '100%', backgroundColor: Colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
  },
  heroMeta: {
    backgroundColor: Colors.bgCard, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    marginBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  heroMetaTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  heroLeft: { flex: 1 },
  heroBadge: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: Colors.primary, marginBottom: 4 },
  heroDate: { fontSize: 12, color: Colors.textMuted },
  heroInsights: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 16 },
  halfCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, padding: 14, gap: 8,
  },
  halfTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  bulletRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  bullet: { fontSize: 12, fontWeight: '800', marginTop: 1 },
  bulletText: { fontSize: 12, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.bgCard, borderRadius: 14, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: Colors.bgElevated },
  tabLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  tabLabelActive: { color: Colors.textPrimary },
  card: {
    marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.bgCard,
    borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 20,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  scoresGrid: { gap: 14 },
  routineSection: { marginBottom: 20 },
  routineTimeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  routineTimeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: Colors.primary },
  routineStep: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  routineNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(196,98,45,0.15)', alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  routineNumText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  routineInfo: { flex: 1 },
  routineStepName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  routineProduct: { fontSize: 13, color: Colors.primary, fontWeight: '500', marginBottom: 4 },
  routineWhy: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  routineDuration: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  recCard: {
    backgroundColor: Colors.bgElevated, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 12,
  },
  recCardHighlight: { borderColor: Colors.borderStrong },
  recHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  recCategoryWrap: {},
  recCategory: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: Colors.textMuted },
  recPriority: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  recPriorityText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  recTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  recDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 12 },
  productTag: {
    backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  productTagInner: { flexDirection: 'row', gap: 12, padding: 12, alignItems: 'flex-start' },
  productImage: { width: 72, height: 72, borderRadius: 10, backgroundColor: Colors.bgElevated },
  tdBadge: {
    alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 6, overflow: 'hidden',
  },
  tdBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.white, letterSpacing: 0.5 },
  productName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  productBrand: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  productWhy: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  shopBtn: {
    marginTop: 8, backgroundColor: Colors.primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start',
  },
  shopBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },
});
