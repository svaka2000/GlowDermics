import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

const INGREDIENTS = [
  {
    number: '01',
    name: 'Grass-Fed Beef Tallow',
    emoji: '🥩',
    color: '#C8A070',
    tagline: 'The fatty acid profile your skin was built for',
    tags: ['BARRIER REPAIR', 'DEEP MOISTURE', 'VITAMINS A·D·E·K'],
    science: "Tallow's fatty acid profile — stearic (28%), oleic (45%), palmitic (24%) — mirrors human sebum almost exactly. This is why it absorbs instead of sitting on the surface.",
    why: "Conventional moisturizers use water as their base ingredient, which evaporates. Tallow doesn't evaporate — it integrates. Your skin biology hasn't changed in 10,000 years.",
    facts: [
      'Oleic acid: 45% (matches human sebum)',
      'Stearic acid: 28% (skin-identical)',
      'Natural vitamins A, D, E, K',
      'Zero water — zero evaporation',
    ],
  },
  {
    number: '02',
    name: 'Manuka Honey UMF 20+',
    emoji: '🍯',
    color: '#C8830A',
    tagline: "Nature's antibacterial humectant",
    tags: ['MOISTURE LOCK', 'ANTIBACTERIAL', 'ANTIOXIDANT'],
    science: 'Manuka honey contains methylglyoxal (MGO), a compound with documented antibacterial properties not found in any other honey variety. As a humectant it draws moisture from the air into the skin.',
    why: 'UMF 20+ means a minimum methylglyoxal content of 829mg/kg. We use pharmaceutical-grade manuka — not the decorative honey in grocery stores.',
    facts: [
      'MGO 829mg/kg minimum (UMF 20+)',
      'Draws moisture from air (humectant)',
      'Antibacterial without stripping microbiome',
      'Natural antioxidant protection',
    ],
  },
  {
    number: '03',
    name: 'Cold-Pressed Olive Oil',
    emoji: '🫒',
    color: '#9aaf2f',
    tagline: 'Barrier reinforcement since antiquity',
    tags: ['OLEIC ACID', 'NATURAL SQUALENE', 'SOFTENING'],
    science: 'Cold-pressed olive oil contains natural squalene — the same compound your own skin produces until around age 30, when production drops significantly. It also penetrates the stratum corneum and reinforces the lipid barrier.',
    why: "Most skincare brands use synthetic squalene derived from sharks. We get it from olives, in its natural triglyceride form alongside oleic acid that your skin already knows how to use.",
    facts: [
      'Contains natural squalene (your skin\'s own compound)',
      'Rich in oleic acid (penetrates vs sits)',
      'Polyphenols: natural antioxidants',
      'Cold-pressed: enzymes and nutrients intact',
    ],
  },
  {
    number: '04',
    name: 'Calendula Extract',
    emoji: '🌼',
    color: '#E87820',
    tagline: 'The gentlest anti-inflammatory in the formula',
    tags: ['CALMING', 'ECZEMA-SAFE', 'ANTI-INFLAMMATORY'],
    science: "Calendula's flavonoids and triterpenoids target redness and inflammation directly. Clinical research shows meaningful reduction in transepidermal water loss (TEWL) — your skin's ability to hold moisture — in treated areas.",
    why: "Used medicinally since the 12th century for wound healing and skin repair. It's the reason our formula works for sensitive and eczema-prone skin where most moisturizers fail.",
    facts: [
      'Flavonoids: anti-inflammatory compounds',
      'Triterpenoids: promote tissue repair',
      'Reduces TEWL (moisture retention)',
      'Safe for eczema and reactive skin',
    ],
  },
];

const COMPARISON = [
  { label: 'Ingredients', td: '4', typical: '30–60+' },
  { label: 'Synthetic fillers', td: '0', typical: 'Many' },
  { label: 'Water as base', td: '✗ None', typical: '✓ Yes (evaporates)' },
  { label: 'Vitamins A, D, E, K', td: '✓ Natural', typical: 'Often synthetic' },
  { label: 'Antibacterial', td: '✓ Manuka MGO', typical: 'Parabens/preservatives' },
  { label: 'Skin-identical fats', td: '✓ Yes', typical: 'Rarely' },
];

export default function ProductShowcase() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>The Formula</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient colors={['rgba(196,98,45,0.2)', 'transparent']} style={styles.heroGlow} />
          <Text style={styles.heroEyebrow}>TALLOWDERMICS™</Text>
          <Text style={styles.heroTitle}>4 ingredients.{'\n'}Thousands of years{'\n'}of proof.</Text>
          <Text style={styles.heroSub}>
            Every ingredient chosen because your skin biology recognizes it — not because it sounds premium on a label.
          </Text>
          <View style={styles.heroBadges}>
            {['No synthetics', 'No fillers', 'No water base', 'No parabens'].map(b => (
              <View key={b} style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>✓ {b}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Ingredient accordion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>The Ingredients</Text>
          {INGREDIENTS.map((ing, i) => {
            const isOpen = expanded === i;
            return (
              <Pressable key={i} style={styles.ingCard} onPress={() => setExpanded(isOpen ? null : i)}>
                <View style={styles.ingHeader}>
                  <View style={styles.ingLeft}>
                    <Text style={styles.ingNumber}>{ing.number}</Text>
                    <Text style={styles.ingEmoji}>{ing.emoji}</Text>
                    <View>
                      <Text style={styles.ingName}>{ing.name}</Text>
                      <Text style={styles.ingTagline}>{ing.tagline}</Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18} color={colors.textMuted}
                  />
                </View>

                {/* Tags */}
                <View style={styles.ingTags}>
                  {ing.tags.map(tag => (
                    <View key={tag} style={[styles.ingTag, { borderColor: ing.color + '40' }]}>
                      <Text style={[styles.ingTagText, { color: ing.color }]}>{tag}</Text>
                    </View>
                  ))}
                </View>

                {isOpen && (
                  <View style={styles.ingExpand}>
                    <View style={[styles.ingDivider, { backgroundColor: ing.color + '30' }]} />
                    <Text style={styles.ingScienceLabel}>THE SCIENCE</Text>
                    <Text style={styles.ingScience}>{ing.science}</Text>
                    <Text style={styles.ingWhyLabel}>WHY IT'S IN OUR FORMULA</Text>
                    <Text style={styles.ingWhy}>{ing.why}</Text>
                    <View style={styles.ingFacts}>
                      {ing.facts.map(fact => (
                        <View key={fact} style={styles.ingFactRow}>
                          <View style={[styles.ingFactDot, { backgroundColor: ing.color }]} />
                          <Text style={styles.ingFactText}>{fact}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Comparison table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>vs. Typical Moisturizer</Text>
          <View style={styles.compTable}>
            <View style={styles.compHeader}>
              <Text style={[styles.compCell, styles.compLabelCell]} />
              <View style={styles.compTDCol}>
                <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.compTDHeader}>
                  <Text style={styles.compTDHeaderText}>TallowDermics</Text>
                </LinearGradient>
              </View>
              <Text style={[styles.compCell, styles.compTypicalHeader]}>Typical</Text>
            </View>
            {COMPARISON.map((row, i) => (
              <View key={i} style={[styles.compRow, i % 2 === 0 && styles.compRowAlt]}>
                <Text style={[styles.compCell, styles.compLabelCell, styles.compLabel]}>{row.label}</Text>
                <Text style={[styles.compCell, styles.compTDCell]}>{row.td}</Text>
                <Text style={[styles.compCell, styles.compTypicalCell]}>{row.typical}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Philosophy */}
        <View style={styles.philosophyCard}>
          <LinearGradient colors={['rgba(196,98,45,0.12)', 'rgba(196,98,45,0.04)']} style={StyleSheet.absoluteFill} />
          <Text style={styles.philosophyEyebrow}>THE TALLOWDERMICS PHILOSOPHY</Text>
          <Text style={styles.philosophyText}>
            "Modern skincare invented a problem — and then sold you the solution. Your skin doesn't need 30 ingredients. It needs the 4 it evolved with."
          </Text>
          <Text style={styles.philosophyAttrib}>— TallowDermics</Text>
        </View>

        {/* CTA */}
        <Pressable style={styles.ctaBtn} onPress={() => router.push('/(tabs)/coach')}>
          <LinearGradient colors={[colors.primaryLight, colors.primary]} style={styles.ctaGrad}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.white} />
            <Text style={styles.ctaText}>Ask Derm about these ingredients →</Text>
          </LinearGradient>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: c.textPrimary },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 40 },

  hero: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32, position: 'relative' },
  heroGlow: { position: 'absolute', top: -20, left: 0, right: 0, height: 200 },
  heroEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2.5, color: c.primary, marginBottom: 12 },
  heroTitle: { fontSize: 34, fontWeight: '900', color: c.textPrimary, lineHeight: 40, marginBottom: 14, letterSpacing: -0.5 },
  heroSub: { fontSize: 15, color: c.textSecondary, lineHeight: 24, marginBottom: 20, maxWidth: 320 },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heroBadge: { backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)' },
  heroBadgeText: { fontSize: 12, color: c.scoreExcellent, fontWeight: '600' },

  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary, marginBottom: 14 },

  ingCard: { backgroundColor: c.bgCard, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 18, marginBottom: 10 },
  ingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  ingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  ingNumber: { fontSize: 11, fontWeight: '800', color: c.textMuted, letterSpacing: 1 },
  ingEmoji: { fontSize: 22 },
  ingName: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  ingTagline: { fontSize: 12, color: c.textMuted, marginTop: 1 },
  ingTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ingTag: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  ingTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  ingExpand: { marginTop: 16 },
  ingDivider: { height: 1, marginBottom: 14 },
  ingScienceLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: c.textMuted, marginBottom: 6 },
  ingScience: { fontSize: 14, color: c.textSecondary, lineHeight: 22, marginBottom: 14 },
  ingWhyLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: c.textMuted, marginBottom: 6 },
  ingWhy: { fontSize: 14, color: c.textSecondary, lineHeight: 22, marginBottom: 14 },
  ingFacts: { gap: 8 },
  ingFactRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ingFactDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  ingFactText: { fontSize: 13, color: c.textSecondary },

  compTable: { backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },
  compHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c.border },
  compCell: { flex: 1, padding: 10, textAlign: 'center' },
  compLabelCell: { flex: 1.2, textAlign: 'left' },
  compTDCol: { flex: 1, overflow: 'hidden' },
  compTDHeader: { padding: 10, alignItems: 'center' },
  compTDHeaderText: { fontSize: 11, fontWeight: '700', color: c.white },
  compTypicalHeader: { fontSize: 11, fontWeight: '700', color: c.textMuted, textAlignVertical: 'center', lineHeight: 38 },
  compRow: { flexDirection: 'row' },
  compRowAlt: { backgroundColor: 'rgba(250,243,224,0.03)' },
  compLabel: { fontSize: 12, color: c.textMuted, textAlign: 'left', paddingLeft: 14 },
  compTDCell: { fontSize: 12, fontWeight: '700', color: c.scoreExcellent, textAlign: 'center', padding: 10 },
  compTypicalCell: { fontSize: 12, color: c.textMuted, textAlign: 'center', padding: 10 },

  philosophyCard: { marginHorizontal: 16, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: c.borderStrong, padding: 22, marginBottom: 16 },
  philosophyEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: c.primary, marginBottom: 12 },
  philosophyText: { fontSize: 16, color: c.textPrimary, lineHeight: 26, fontStyle: 'italic', marginBottom: 12 },
  philosophyAttrib: { fontSize: 12, color: c.textMuted },

  ctaBtn: { marginHorizontal: 16, borderRadius: 18, overflow: 'hidden' },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 20 },
  ctaText: { fontSize: 15, fontWeight: '700', color: c.white },
  });
}
