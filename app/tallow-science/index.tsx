import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

function buildFattyAcids(colors: Palette) {
  return [
  {
    name: 'Palmitic Acid',
    type: 'Saturated',
    pct: '26%',
    skinRole: 'Barrier forming',
    color: colors.primary,
    desc: 'A key component of the skin\'s natural lipid barrier. Provides structural stability and helps maintain skin softness. Identical to what your own sebaceous glands produce.',
  },
  {
    name: 'Oleic Acid (Omega-9)',
    type: 'Monounsaturated',
    pct: '40%',
    skinRole: 'Emollient',
    color: colors.gold,
    desc: 'Penetrates deeply into the stratum corneum, making it an excellent carrier for fat-soluble vitamins. Helps soften and condition skin. Anti-inflammatory at the cellular level.',
  },
  {
    name: 'Palmitoleic Acid (Omega-7)',
    type: 'Monounsaturated',
    pct: '4%',
    skinRole: 'Antimicrobial + anti-aging',
    color: '#F97316',
    desc: 'Produced naturally by human sebaceous glands — and decreases significantly with age. Tallow replenishes this decline. Antibacterial against P. acnes and promotes wound healing.',
  },
  {
    name: 'Stearic Acid',
    type: 'Saturated',
    pct: '16%',
    skinRole: 'Barrier + soothing',
    color: '#60A5FA',
    desc: 'Softens and smooths skin while supporting barrier integrity. Unlike short-chain saturated fats, stearic acid is skin-compatible and non-comedogenic.',
  },
  {
    name: 'Linoleic Acid (Omega-6)',
    type: 'Polyunsaturated',
    pct: '5%',
    skinRole: 'Barrier essential',
    color: '#4ADE80',
    desc: 'An essential fatty acid the body cannot make — must come from diet or topical application. Deficiency causes dry, scaly, acne-prone skin. Critical for ceramide synthesis in the barrier.',
  },
  {
    name: 'CLA (Conjugated Linoleic Acid)',
    type: 'Polyunsaturated',
    pct: '1-3%',
    skinRole: 'Anti-inflammatory',
    color: '#6B85A8',
    desc: 'Found almost exclusively in grass-fed ruminant fat — 3-5x higher in grass-fed vs grain-fed. Potent anti-inflammatory that reduces acne, eczema, and rosacea flares. Also shows anti-cancer properties in research.',
  },
  ];
}

function buildVitamins(colors: Palette) {
  return [
  {
    name: 'Vitamin A (Retinol)',
    emoji: '🔬',
    color: '#F97316',
    desc: 'The gold standard anti-aging vitamin. In tallow, it\'s in its bioavailable retinol form — your skin can use it directly without conversion. Supports cell turnover and collagen production.',
    comparison: 'Same vitamin as prescription tretinoin, but at gentler, natural concentrations.',
  },
  {
    name: 'Vitamin D (D3)',
    emoji: '☀️',
    color: colors.gold,
    desc: 'Skin cells contain vitamin D receptors — it regulates cell growth and immune function in skin. Vitamin D deficiency is associated with eczema, psoriasis, and impaired wound healing.',
    comparison: 'Tallow contains D3 (cholecalciferol) — the same form produced by skin in sunlight, and far more bioavailable than plant-derived D2.',
  },
  {
    name: 'Vitamin E (Tocopherol)',
    emoji: '🌿',
    color: '#4ADE80',
    desc: 'The skin\'s primary fat-soluble antioxidant. Neutralizes UV-induced free radicals that degrade collagen. Also serves as a natural preservative, extending tallow\'s shelf life.',
    comparison: 'Acts as a natural preservative — tallow needs no synthetic preservatives partly because of its natural vitamin E content.',
  },
  {
    name: 'Vitamin K (K2 — MK-4)',
    emoji: '💊',
    color: '#6B85A8',
    desc: 'K2 in particular (found in grass-fed animal products) activates proteins that regulate calcium in soft tissue. May reduce dark circles and vascular redness when applied topically.',
    comparison: 'K2 (menaquinone-4) is found only in grass-fed animal products — not in plant-based fats or conventional grain-fed tallow.',
  },
  ];
}

const SCIENCE_FACTS = [
  {
    fact: 'Closest match to human sebum',
    detail: 'Tallow\'s fatty acid profile — palmitic, oleic, palmitoleic, stearic acids — is virtually identical to what human sebaceous glands produce. This means it\'s recognized by skin receptors as "self" rather than foreign.',
    icon: '🧬',
  },
  {
    fact: 'Sebum mimicry = zero rejection',
    detail: 'Because tallow so closely mirrors human sebum, it doesn\'t trigger the same protective inflammatory response that foreign ingredients can cause. It absorbs into the stratum corneum seamlessly.',
    icon: '🔄',
  },
  {
    fact: 'Anhydrous = no bacterial growth',
    detail: 'Pure tallow contains zero water. Bacteria and fungi need water to survive — without it, the product is intrinsically preserved without needing synthetic preservatives.',
    icon: '🛡️',
  },
  {
    fact: 'CLA decreases 5x in grain-fed animals',
    detail: 'Conjugated linoleic acid is 3-5x higher in 100% grass-fed beef tallow. This is why sourcing matters — conventional tallow from feedlot animals is significantly inferior for anti-inflammatory effects.',
    icon: '🌿',
  },
  {
    fact: 'Palmitoleic acid declines with age',
    detail: 'Sebaceous gland palmitoleic acid output decreases roughly 50% between ages 20 and 50. Tallow topically replenishes exactly this decline — it\'s literally anti-aging by replacement.',
    icon: '📉',
  },
  {
    fact: 'Historical record: 12,000+ years',
    detail: 'Archaeological evidence shows humans have been using animal fats as skin salves since at least 12,000 BCE. Egyptian records describe tallow-based preparations for wound healing. This isn\'t a trend — it\'s ancestral wisdom.',
    icon: '📜',
  },
  {
    fact: 'TEWL reduction comparable to petrolatum',
    detail: 'Transepidermal water loss (TEWL) studies comparing animal fats to petrolatum (the gold standard barrier) show similar reduction rates — tallow is as effective at preventing water loss without petroleum derivatives.',
    icon: '💧',
  },
];

export default function TallowScience() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const FATTY_ACIDS = useMemo(() => buildFattyAcids(colors), [colors]);
  const VITAMINS = useMemo(() => buildVitamins(colors), [colors]);
  const [activeTab, setActiveTab] = useState<'fatty' | 'vitamins' | 'science'>('fatty');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>The Science of Tallow</Text>
            <Text style={styles.headerSub}>Why ancestral skincare works</Text>
          </View>
          <View style={{ width: 36 }} />
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ opacity: contentAnim }}>
        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient colors={[colors.primaryDark, colors.primary, colors.gold]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Text style={styles.heroEmoji}>🧬</Text>
          <Text style={styles.heroTitle}>Tallow Is Your Skin</Text>
          <Text style={styles.heroDesc}>
            Grass-fed beef tallow contains the same fatty acids your skin produces, the fat-soluble vitamins your cells use, and a fatty acid profile matching human sebum closer than any synthetic moisturizer can achieve.
          </Text>
        </View>

        {/* Sebum comparison */}
        <View style={styles.compCard}>
          <Text style={styles.compTitle}>Tallow vs Human Sebum</Text>
          <View style={styles.compTable}>
            <View style={[styles.compRow, styles.compHeader]}>
              <Text style={[styles.compCell, { fontWeight: '800', color: colors.textPrimary }]}>Fatty Acid</Text>
              <Text style={[styles.compCellSmall, { fontWeight: '800', color: colors.textPrimary }]}>Tallow</Text>
              <Text style={[styles.compCellSmall, { fontWeight: '800', color: colors.textPrimary }]}>Sebum</Text>
            </View>
            {[
              ['Palmitic Acid', '26%', '25%'],
              ['Oleic Acid', '40%', '36%'],
              ['Palmitoleic Acid', '4%', '7%'],
              ['Stearic Acid', '16%', '10%'],
              ['Linoleic Acid', '5%', '5%'],
            ].map(([acid, tallow, sebum], i) => (
              <View key={i} style={[styles.compRow, { backgroundColor: i % 2 === 0 ? `${colors.primary}05` : 'transparent' }]}>
                <Text style={styles.compCell}>{acid}</Text>
                <Text style={[styles.compCellSmall, { color: colors.primary, fontWeight: '700' }]}>{tallow}</Text>
                <Text style={[styles.compCellSmall, { color: colors.gold, fontWeight: '700' }]}>{sebum}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.compNote}>Source: Comparative fatty acid analysis, peer-reviewed lipid chemistry literature</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {[
            { id: 'fatty', label: 'Fatty Acids' },
            { id: 'vitamins', label: 'Vitamins' },
            { id: 'science', label: 'Science Facts' },
          ].map(tab => (
            <Pressable
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && { color: colors.primary }]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'fatty' && (
          <View style={styles.card}>
            {FATTY_ACIDS.map((fa, i) => (
              <View key={i} style={[styles.faCard, { borderLeftColor: fa.color }]}>
                <View style={styles.faHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.faName, { color: fa.color }]}>{fa.name}</Text>
                    <Text style={styles.faType}>{fa.type} · {fa.pct} of tallow</Text>
                  </View>
                  <View style={[styles.faBadge, { backgroundColor: `${fa.color}20` }]}>
                    <Text style={[styles.faBadgeText, { color: fa.color }]}>{fa.skinRole}</Text>
                  </View>
                </View>
                <Text style={styles.faDesc}>{fa.desc}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'vitamins' && (
          <View style={styles.card}>
            {VITAMINS.map((v, i) => (
              <View key={i} style={[styles.vitCard, { borderColor: `${v.color}40` }]}>
                <LinearGradient colors={[`${v.color}10`, `${v.color}03`]} style={StyleSheet.absoluteFill} />
                <View style={styles.vitHeader}>
                  <Text style={styles.vitEmoji}>{v.emoji}</Text>
                  <Text style={[styles.vitName, { color: v.color }]}>{v.name}</Text>
                </View>
                <Text style={styles.vitDesc}>{v.desc}</Text>
                <View style={styles.vitComparison}>
                  <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.vitComparisonText}>{v.comparison}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'science' && (
          <View style={styles.card}>
            {SCIENCE_FACTS.map((fact, i) => (
              <View key={i} style={styles.scienceRow}>
                <Text style={styles.scienceIcon}>{fact.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scienceFact}>{fact.fact}</Text>
                  <Text style={styles.scienceDetail}>{fact.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* The ancestral argument */}
        <View style={styles.ancestralCard}>
          <Text style={styles.ancestralTitle}>The Ancestral Argument</Text>
          <Text style={styles.ancestralText}>
            For 99.9% of human history, animal fats were the primary moisturizer. Eczema, rosacea, and widespread skin sensitivity are modern phenomena — coinciding with the replacement of animal fats with synthetic alternatives in the 20th century.
          </Text>
          <Text style={styles.ancestralText}>
            This doesn't mean ancestral = automatically better. But when modern skin science confirms that tallow's composition is nearly identical to human sebum, and that the vitamins it contains (A, D, E, K2) are the exact ones skin cells use — the ancestral use of animal fats isn't superstition. It's empiricism across 10,000 years.
          </Text>
        </View>

        {/* CTA */}
        <Pressable style={styles.cta} onPress={() => router.push('/product')}>
          <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <Text style={styles.ctaText}>Shop TallowDermics →</Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  hero: { borderRadius: 20, overflow: 'hidden', padding: 24, gap: 10, marginBottom: 16, alignItems: 'center' },
  heroEmoji: { fontSize: 52 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: c.white, textAlign: 'center' },
  heroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22 },

  compCard: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border,
    padding: 16, gap: 10, marginBottom: 14,
  },
  compTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  compTable: { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: c.border },
  compRow: { flexDirection: 'row' },
  compHeader: { backgroundColor: c.bgElevated },
  compCell: { flex: 2, padding: 10, fontSize: 12, color: c.textSecondary },
  compCellSmall: { flex: 1, padding: 10, fontSize: 12, color: c.textSecondary, textAlign: 'center' },
  compNote: { fontSize: 10, color: c.textMuted, fontStyle: 'italic' },

  tabs: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  tab: {
    flex: 1, height: 38, borderRadius: 10, borderWidth: 1, borderColor: c.border,
    backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  tabActive: { borderColor: c.primary, backgroundColor: `${c.primary}12` },
  tabText: { fontSize: 12, fontWeight: '700', color: c.textMuted },

  card: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border,
    padding: 14, gap: 10, marginBottom: 14,
  },

  faCard: { borderLeftWidth: 3, paddingLeft: 10, gap: 4 },
  faHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  faName: { fontSize: 13, fontWeight: '800' },
  faType: { fontSize: 11, color: c.textMuted },
  faBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  faBadgeText: { fontSize: 10, fontWeight: '800' },
  faDesc: { fontSize: 12, color: c.textSecondary, lineHeight: 18 },

  vitCard: {
    borderRadius: 14, overflow: 'hidden', borderWidth: 1,
    padding: 14, gap: 8,
  },
  vitHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vitEmoji: { fontSize: 22 },
  vitName: { fontSize: 14, fontWeight: '800', flex: 1 },
  vitDesc: { fontSize: 12, color: c.textSecondary, lineHeight: 18 },
  vitComparison: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  vitComparisonText: { flex: 1, fontSize: 11, color: c.textMuted, fontStyle: 'italic', lineHeight: 17 },

  scienceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 10 },
  scienceIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  scienceFact: { fontSize: 13, fontWeight: '800', color: c.textPrimary },
  scienceDetail: { fontSize: 12, color: c.textSecondary, lineHeight: 18, marginTop: 2 },

  ancestralCard: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: `${c.primary}30`,
    padding: 16, gap: 10, marginBottom: 14,
  },
  ancestralTitle: { fontSize: 15, fontWeight: '700', color: c.primary },
  ancestralText: { fontSize: 13, color: c.textSecondary, lineHeight: 21 },

  cta: {
    height: 52, borderRadius: 14, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  ctaText: { fontSize: 16, fontWeight: '800', color: c.white },
  });
}
