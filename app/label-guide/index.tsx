import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';

type Section = {
  id: string;
  title: string;
  emoji: string;
  content: React.ReactNode;
};

const RED_FLAGS = [
  { name: 'Fragrance / Parfum', why: 'Catch-all term hiding 200+ undisclosed chemicals. Leading cause of contact dermatitis.' },
  { name: 'SD Alcohol / Alcohol Denat', why: 'Denatures proteins and strips lipids from skin barrier. Often used to feel "clean."' },
  { name: 'PEG compounds', why: 'May be contaminated with 1,4-dioxane (carcinogen). Enhance penetration of other chemicals.' },
  { name: 'Sodium Lauryl Sulfate (SLS)', why: 'Harsh surfactant that disrupts skin barrier and raises pH. Fine for dishwashing, not for skin.' },
  { name: 'Parabens (methyl-, propyl-, butyl-)', why: 'Synthetic preservatives with weak estrogen-mimicking activity. Still debated, but why risk it?' },
  { name: 'Formaldehyde releasers (DMDM Hydantoin, Quaternium-15)', why: 'Release small amounts of formaldehyde as preservative. Known carcinogen and sensitizer.' },
  { name: 'Oxybenzone', why: 'Chemical UV filter absorbed through skin into bloodstream. FDA has not confirmed its safety.' },
  { name: 'Synthetic color dyes (FD&C Red, Yellow #5)', why: 'Petroleum-derived, often contaminated with carcinogens. Serve only aesthetic purposes in skincare.' },
  { name: 'Propylene Glycol (high concentrations)', why: 'Can irritate skin at high concentrations. A penetration enhancer that pulls other ingredients deeper.' },
  { name: 'Artificial preservatives (BHT, BHA)', why: 'Endocrine disruptors in animal studies. Better alternatives (vitamin E, rosemary extract) exist.' },
];

const MARKETING_TERMS: { term: string; reality: string }[] = [
  { term: 'Natural', reality: 'No legal definition in cosmetics. Arsenic is natural. This means nothing.' },
  { term: 'Organic', reality: 'Only legally meaningful on USDA-certified products. On cosmetics, it\'s often just marketing.' },
  { term: 'Clean', reality: 'No regulatory standard. Each brand defines its own "clean" list.' },
  { term: 'Hypoallergenic', reality: 'No scientific definition. Products can still cause allergies — this is not regulated.' },
  { term: 'Non-comedogenic', reality: 'No standardized testing required. Brands self-certify. Comedogenicity also varies by person.' },
  { term: 'Dermatologist-tested', reality: 'Just means one dermatologist used it. Says nothing about efficacy or safety.' },
  { term: 'Clinically proven', reality: 'Often a tiny, industry-funded study with subjective outcomes. Not FDA-approved claims.' },
  { term: 'Anti-aging', reality: 'No specific requirement. Can mean anything the brand chooses.' },
  { term: 'pH-balanced', reality: 'Also unregulated. Doesn\'t specify which pH, or whether it\'s appropriate for skin.' },
  { term: 'All-natural ingredients', reality: 'All ingredients are chemicals — "natural" chemicals aren\'t inherently safer.' },
];

export default function LabelGuide() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const SECTIONS = [
    {
      id: 'inci',
      title: 'The INCI System',
      emoji: '📋',
      content: (
        <View style={styles.sectionContent}>
          <Text style={styles.sectionText}>
            All cosmetics use the International Nomenclature of Cosmetic Ingredients (INCI) — a standardized system of ingredient names. Understanding it unlocks every label.
          </Text>
          <View style={styles.inci}>
            <Text style={styles.inciTitle}>Key INCI rules:</Text>
            {[
              'Ingredients are listed in descending order by concentration',
              'The first 5 ingredients make up the majority of the formula',
              'Ingredients at 1% or below can be listed in any order',
              'Active ingredients must be listed with their percentages (in drugs/SPF)',
              'Water (Aqua) is usually #1 — products starting with water need preservatives',
            ].map((rule, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>{rule}</Text>
              </View>
            ))}
          </View>
          <View style={styles.inciExample}>
            <Text style={styles.inciExampleTitle}>Example Label Analysis:</Text>
            <View style={styles.inciExampleRow}>
              <Text style={styles.inciExampleIngredient}>Aqua</Text>
              <Text style={styles.inciExampleNote}>🔵 Water base — #1 because it's &gt;50% of formula</Text>
            </View>
            <View style={styles.inciExampleRow}>
              <Text style={styles.inciExampleIngredient}>Glycerin</Text>
              <Text style={styles.inciExampleNote}>✅ Humectant — likely 3-5% concentration</Text>
            </View>
            <View style={styles.inciExampleRow}>
              <Text style={styles.inciExampleIngredient}>Niacinamide</Text>
              <Text style={styles.inciExampleNote}>✅ Active ingredient — check position for concentration clue</Text>
            </View>
            <View style={styles.inciExampleRow}>
              <Text style={styles.inciExampleIngredient}>Parfum</Text>
              <Text style={styles.inciExampleNote}>⚠️ Fragrance — 200+ undisclosed chemicals</Text>
            </View>
            <View style={styles.inciExampleRow}>
              <Text style={styles.inciExampleIngredient}>Phenoxyethanol</Text>
              <Text style={styles.inciExampleNote}>🔵 Preservative — last means &lt;1%</Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      id: 'water',
      title: 'The Water Problem',
      emoji: '💧',
      content: (
        <View style={styles.sectionContent}>
          <Text style={styles.sectionText}>
            Water-based products have a fundamental chemistry problem: water + organic ingredients = bacterial growth. This forces manufacturers to add preservatives, emulsifiers, and stabilizers — ingredients that can irritate skin or disrupt the barrier.
          </Text>
          {[
            { point: 'Water dilutes actives', detail: 'A cream with 70% water and 2% vitamin C has much less vitamin C than a concentrate.' },
            { point: 'Anhydrous products are inherently safer', detail: 'TallowDermics tallow balm contains zero water — no preservatives needed, longer shelf life, higher active concentration.' },
            { point: 'Emulsifiers disrupt barrier', detail: 'Mixing water and oil requires emulsifiers — some strip the skin\'s own lipid barrier over time.' },
            { point: '"Water" by any name', detail: 'Aqua, eau, water — it\'s the same. Also: aloe vera juice is mostly water, as is rose water, cucumber extract.' },
          ].map((item, i) => (
            <View key={i} style={styles.pointRow}>
              <Text style={styles.pointName}>{item.point}</Text>
              <Text style={styles.pointDetail}>{item.detail}</Text>
            </View>
          ))}
        </View>
      ),
    },
    {
      id: 'redflags',
      title: 'Red Flag Ingredients',
      emoji: '🚩',
      content: (
        <View style={styles.sectionContent}>
          {RED_FLAGS.map((flag, i) => (
            <View key={i} style={styles.redFlagRow}>
              <Text style={styles.redFlagName}>{flag.name}</Text>
              <Text style={styles.redFlagWhy}>{flag.why}</Text>
            </View>
          ))}
        </View>
      ),
    },
    {
      id: 'marketing',
      title: 'Marketing vs Reality',
      emoji: '🎭',
      content: (
        <View style={styles.sectionContent}>
          <Text style={styles.sectionText}>
            The skincare industry is mostly unregulated for marketing claims. Here's what common terms actually mean:
          </Text>
          {MARKETING_TERMS.map((term, i) => (
            <View key={i} style={styles.marketingRow}>
              <Text style={styles.marketingTerm}>"{term.term}"</Text>
              <Text style={styles.marketingReality}>{term.reality}</Text>
            </View>
          ))}
        </View>
      ),
    },
    {
      id: 'concentration',
      title: 'Concentration Clues',
      emoji: '🔢',
      content: (
        <View style={styles.sectionContent}>
          <Text style={styles.sectionText}>
            Ingredient lists don't show percentages for non-drug products. But you can estimate concentration by position:
          </Text>
          {[
            { range: '#1-3 on list', pct: '15-70%', example: 'Water, silicones, main moisturizers' },
            { range: '#4-6 on list', pct: '2-15%', example: 'Key actives, functional ingredients' },
            { range: '#7-10 on list', pct: '0.5-2%', example: 'Secondary actives, skin-feel additives' },
            { range: 'After #10', pct: '0.01-0.5%', example: 'Preservatives, fragrances, colorants' },
            { range: 'Last few', pct: '<0.1%', example: 'Trace amounts — may not be efficacious' },
          ].map((item, i) => (
            <View key={i} style={styles.concRow}>
              <View style={styles.concRange}>
                <Text style={styles.concRangeText}>{item.range}</Text>
                <Text style={[styles.concPct, { color: Colors.primary }]}>{item.pct}</Text>
              </View>
              <Text style={styles.concExample}>{item.example}</Text>
            </View>
          ))}
          <Text style={styles.sectionNote}>
            Exception: Active drugs (SPF, acne treatments) must list % by law. A "2% salicylic acid" claim means exactly 2%.
          </Text>
        </View>
      ),
    },
    {
      id: 'green',
      title: 'Green vs Conventional',
      emoji: '🌿',
      content: (
        <View style={styles.sectionContent}>
          <Text style={styles.sectionText}>
            "Clean beauty" is largely marketing, but some meaningful distinctions exist between conventional and ingredient-conscious skincare:
          </Text>
          <View style={styles.comparisonTable}>
            <View style={[styles.compRow, styles.compHeader]}>
              <Text style={[styles.compCell, styles.compHeaderText]}>Conventional</Text>
              <Text style={[styles.compCell, styles.compHeaderText]}>Better Choice</Text>
            </View>
            {[
              ['Mineral oil (petrolatum)', 'Tallow / plant waxes'],
              ['Synthetic fragrance', 'Essential oils or fragrance-free'],
              ['PEG emulsifiers', 'Natural emulsifiers (lecithin)'],
              ['Chemical UV filters', 'Zinc oxide / titanium dioxide'],
              ['Synthetic preservatives', 'Vitamin E, rosemary extract'],
              ['Sodium lauryl sulfate', 'Coco-glucoside, decyl glucoside'],
              ['Silicones (dimethicone)', 'Natural oils (jojoba, squalane, tallow)'],
            ].map(([conv, better], i) => (
              <View key={i} style={styles.compRow}>
                <Text style={[styles.compCell, { color: Colors.scorePoor }]}>{conv}</Text>
                <Text style={[styles.compCell, { color: '#4ADE80' }]}>{better}</Text>
              </View>
            ))}
          </View>
        </View>
      ),
    },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Label Reading Guide</Text>
            <Text style={styles.headerSub}>Decode any skincare label</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Text style={styles.heroEmoji}>🔍</Text>
          <Text style={styles.heroTitle}>Read Every Label Like a Chemist</Text>
          <Text style={styles.heroDesc}>
            The skincare industry relies on consumers not knowing what ingredients mean. This guide changes that.
          </Text>
        </View>

        {SECTIONS.map(section => (
          <View key={section.id}>
            <Pressable
              style={[styles.sectionHeader, activeSection === section.id && { borderColor: `${Colors.primary}50`, backgroundColor: `${Colors.primary}05` }]}
              onPress={() => setActiveSection(activeSection === section.id ? null : section.id)}
            >
              <Text style={styles.sectionEmoji}>{section.emoji}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Ionicons name={activeSection === section.id ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
            </Pressable>
            {activeSection === section.id && (
              <View style={styles.sectionBody}>
                {section.content}
              </View>
            )}
          </View>
        ))}

        <View style={styles.tallowCard}>
          <LinearGradient colors={[`${Colors.primary}12`, `${Colors.primary}04`]} style={StyleSheet.absoluteFill} />
          <Text style={styles.tallowTitle}>🌿 Why TallowDermics Is Different</Text>
          <Text style={styles.tallowText}>
            TallowDermics Balm ingredient list: Grass-fed Beef Tallow, Beeswax, Calendula. That's it. No water means no preservatives. No synthetic emulsifiers. No fragrance. No fillers. The ingredient list is the entire formula.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  hero: { borderRadius: 20, overflow: 'hidden', padding: 24, gap: 8, marginBottom: 16, alignItems: 'center' },
  heroEmoji: { fontSize: 40 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: Colors.white, textAlign: 'center' },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 22 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgCard, marginBottom: 4,
  },
  sectionEmoji: { fontSize: 20 },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  sectionBody: {
    backgroundColor: Colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    marginBottom: 8, overflow: 'hidden',
  },
  sectionContent: { padding: 16, gap: 12 },
  sectionText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 21 },
  sectionNote: { fontSize: 11, color: Colors.textMuted, fontStyle: 'italic', lineHeight: 17 },

  inci: { backgroundColor: Colors.bgElevated, borderRadius: 10, padding: 12, gap: 6 },
  inciTitle: { fontSize: 12, fontWeight: '800', color: Colors.textPrimary },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 6, flexShrink: 0 },
  bulletText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  inciExample: { backgroundColor: Colors.bgElevated, borderRadius: 10, padding: 12, gap: 6 },
  inciExampleTitle: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, marginBottom: 4 },
  inciExampleRow: { gap: 2 },
  inciExampleIngredient: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, fontFamily: 'monospace' },
  inciExampleNote: { fontSize: 11, color: Colors.textMuted, lineHeight: 16 },

  pointRow: { gap: 2, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8 },
  pointName: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  pointDetail: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  redFlagRow: { gap: 2, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8 },
  redFlagName: { fontSize: 13, fontWeight: '800', color: Colors.scorePoor },
  redFlagWhy: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  marketingRow: { gap: 2, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8 },
  marketingTerm: { fontSize: 13, fontWeight: '800', color: Colors.gold },
  marketingReality: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  concRow: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8 },
  concRange: { width: 100, gap: 2 },
  concRangeText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  concPct: { fontSize: 14, fontWeight: '900' },
  concExample: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  comparisonTable: { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  compRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  compHeader: { backgroundColor: Colors.bgElevated },
  compCell: { flex: 1, padding: 10, fontSize: 12, lineHeight: 18 },
  compHeaderText: { fontWeight: '800', color: Colors.textPrimary, fontSize: 11 },

  tallowCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: `${Colors.primary}30`,
    padding: 16, gap: 6, marginBottom: 14, marginTop: 10,
  },
  tallowTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  tallowText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
