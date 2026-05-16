import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

type Term = {
  term: string;
  category: string;
  definition: string;
  also?: string; // also known as
  example?: string;
};

const TERMS: Term[] = [
  { term: 'AHA (Alpha Hydroxy Acid)', category: 'Chemical', definition: 'Water-soluble acids (glycolic, lactic, mandelic) that exfoliate the skin\'s surface by dissolving the bonds between dead cells. Best for sun damage, uneven tone, and fine lines.', example: 'Glycolic acid from sugar cane, lactic acid from milk.' },
  { term: 'BHA (Beta Hydroxy Acid)', category: 'Chemical', definition: 'Oil-soluble acid (salicylic acid) that penetrates into pores to dissolve sebum and dead cells. Best for oily, acne-prone skin and blackheads.', example: 'Salicylic acid is the primary BHA used in skincare.' },
  { term: 'Ceramides', category: 'Ingredient', definition: 'Lipid molecules naturally found in the skin\'s barrier (stratum corneum). They hold skin cells together like mortar between bricks. Loss of ceramides leads to water loss and sensitivity.', also: 'Skin-identical lipids' },
  { term: 'CLA (Conjugated Linoleic Acid)', category: 'Ingredient', definition: 'A fatty acid found abundantly in grass-fed tallow. Has potent anti-inflammatory and anti-proliferative properties. Helps reduce acne and redness when applied topically.', example: 'Tallow from grass-fed cattle contains 3-5x more CLA than grain-fed.' },
  { term: 'Comedogenic', category: 'Rating', definition: 'A rating (0-5) describing how likely an ingredient is to clog pores. 0 = non-comedogenic, 5 = highly comedogenic. Tallow rates 0-1, making it suitable for acne-prone skin.', example: 'Coconut oil = 4, Jojoba oil = 2, Tallow = 0-1' },
  { term: 'Collagen', category: 'Biology', definition: 'The most abundant protein in the body, forming the structural scaffolding of skin. Type I collagen provides tensile strength; Type III provides elasticity. Production declines ~1% per year after age 25.', also: 'Types I, II, III, IV' },
  { term: 'Elastin', category: 'Biology', definition: 'Protein that allows skin to stretch and snap back. UV radiation degrades elastin, causing sagging. Unlike collagen, damaged elastin cannot be replaced — only the production of new elastin can be stimulated.' },
  { term: 'Emollient', category: 'Function', definition: 'An ingredient that softens and smooths skin by filling gaps in the stratum corneum. Oils, butters, and tallow are emollients. Different from humectants (attract water) and occlusives (seal water in).', example: 'Jojoba oil, squalane, tallow' },
  { term: 'Emulsifier', category: 'Chemistry', definition: 'An ingredient that allows water and oil to mix stably, forming a cream or lotion. Many synthetic emulsifiers disrupt the skin\'s natural lipid barrier. Anhydrous (water-free) products like tallow don\'t require emulsifiers.' },
  { term: 'Exfoliation', category: 'Process', definition: 'Removal of dead skin cells from the stratum corneum (surface). Physical exfoliation uses abrasives (scrubs). Chemical exfoliation uses acids or enzymes. Over-exfoliation damages the barrier.' },
  { term: 'Free Radicals', category: 'Biology', definition: 'Unstable molecules with unpaired electrons that damage cells, proteins, and DNA. UV, pollution, and stress generate free radicals. Antioxidants (vitamins C, E, A) neutralize them by donating electrons.' },
  { term: 'Glycerin (Glycerol)', category: 'Ingredient', definition: 'A humectant that attracts water from the environment and deeper skin layers to the surface. Highly effective but can draw water out of skin in very dry climates. Must be sealed with an occlusive.' },
  { term: 'Humectant', category: 'Function', definition: 'An ingredient that draws moisture from the environment (or deeper skin layers) into the stratum corneum. Must be used with an occlusive to prevent water from evaporating from skin.', example: 'Hyaluronic acid, glycerin, aloe vera, honey' },
  { term: 'Hyaluronic Acid', category: 'Ingredient', definition: 'A naturally occurring polysaccharide that can hold 1,000x its weight in water. Multiple molecular weights penetrate to different depths. Topical application improves surface hydration but doesn\'t reach dermis.' },
  { term: 'Keratinocytes', category: 'Biology', definition: 'The predominant cells of the epidermis (95%), responsible for producing keratin and forming the protective outer layer. They migrate upward over ~28 days, flatten, and shed as part of natural skin turnover.' },
  { term: 'Linoleic Acid (Omega-6)', category: 'Ingredient', definition: 'An essential fatty acid that skin cannot synthesize itself. Deficiency causes dry, scaly, acne-prone skin. Important for barrier function and sebum composition. Grass-fed tallow is rich in linoleic acid.' },
  { term: 'Melanin', category: 'Biology', definition: 'The pigment produced by melanocytes that determines skin tone and protects against UV. Two types: eumelanin (brown/black) and pheomelanin (red/yellow). UV triggers increased melanin production (tanning).' },
  { term: 'Niacinamide (Vitamin B3)', category: 'Ingredient', definition: 'A multi-functional ingredient that improves barrier function, reduces sebum, minimizes pores, fades hyperpigmentation, and has anti-inflammatory properties. One of the most researched actives in skincare.' },
  { term: 'Occlusive', category: 'Function', definition: 'An ingredient that creates a physical barrier on skin, preventing transepidermal water loss (TEWL). Used as the final step in skincare to seal in all moisture and actives.', example: 'Petrolatum, tallow, beeswax, zinc oxide' },
  { term: 'Palmitoleic Acid', category: 'Ingredient', definition: 'A monounsaturated omega-7 fatty acid produced by the skin itself. Found abundantly in tallow. Has antimicrobial properties and promotes wound healing. Levels in skin decline significantly with age.' },
  { term: 'pH', category: 'Chemistry', definition: 'A measure of acidity (0-14). Healthy skin pH is 4.5-5.5 (slightly acidic). This acid mantle prevents harmful bacteria. Alkaline cleansers (pH 8-9) disrupt it. AHA/BHA actives need pH below 4 to work.' },
  { term: 'Retinol', category: 'Ingredient', definition: 'Vitamin A derivative that speeds cell turnover, stimulates collagen production, and reduces hyperpigmentation. Most researched anti-aging ingredient. Requires conversion to retinoic acid to work — prescription tretinoin is more direct.', also: 'Vitamin A, retinoids' },
  { term: 'Sebum', category: 'Biology', definition: 'The oily substance produced by sebaceous glands. Its composition — triglycerides, wax esters, squalene, free fatty acids — is closely mimicked by grass-fed tallow, making tallow the most skin-compatible moisturizer.' },
  { term: 'SPF (Sun Protection Factor)', category: 'Rating', definition: 'A measure of UVB protection. SPF 15 blocks 93%, SPF 30 blocks 97%, SPF 50 blocks 98%. Does not measure UVA protection. Must be reapplied every 2 hours for stated protection level.' },
  { term: 'Squalane', category: 'Ingredient', definition: 'A stable form of squalene (naturally made by sebaceous glands). Excellent emollient that is lightweight, non-comedogenic (0), and suitable for all skin types. Derived from olive or sugarcane.' },
  { term: 'Stratum Corneum', category: 'Biology', definition: 'The outermost layer of the epidermis, composed of 15-20 layers of flattened dead keratinocytes embedded in lipid lamellae. The primary barrier against water loss and environmental damage.' },
  { term: 'TEWL (Transepidermal Water Loss)', category: 'Biology', definition: 'The passive movement of water from the body through the epidermis to the environment. Disrupted barriers have elevated TEWL. Measured with a tewameter. Occlusives like tallow significantly reduce TEWL.' },
  { term: 'Tretinoin', category: 'Ingredient', definition: 'Prescription-strength retinoic acid — the active form of vitamin A. Works directly without conversion. Significantly more effective than retinol but requires dermatologist prescription. Can cause purging and dryness.' },
  { term: 'Vitamin C (L-Ascorbic Acid)', category: 'Ingredient', definition: 'The most potent form of vitamin C. A powerful antioxidant and essential cofactor for collagen synthesis. Unstable — oxidizes in air and light. Effective pH is under 3.5. Look for tetrahexyldecyl ascorbate for stability.' },
  { term: 'Zinc', category: 'Ingredient', definition: 'A mineral essential for wound healing, sebum regulation, and anti-inflammatory activity. Zinc oxide in sunscreens is the gold standard UV blocker. Oral zinc reduces inflammatory acne. Tallow naturally contains trace zinc.' },
  { term: 'Occlusivity Index', category: 'Rating', definition: 'An informal measure of how well an ingredient prevents water loss. Petrolatum is the gold standard (occlusive index of ~100%). Tallow is 20-30%, jojoba 10-15%. Higher = better barrier sealing.' },
  { term: 'Anhydrous', category: 'Chemistry', definition: 'Literally "without water." Anhydrous products (like pure tallow) don\'t require preservatives since bacteria need water to grow. More stable, longer shelf life, and more concentrated than water-based products.' },
  { term: 'Fatty Acids', category: 'Chemistry', definition: 'Building blocks of fats. Categorized as saturated (solid at room temperature, like tallow), monounsaturated (MUFA), and polyunsaturated (PUFA). Skin relies on specific fatty acids for barrier integrity.' },
  { term: 'Epidermis', category: 'Biology', definition: 'The outermost of the three skin layers. Consists of 5 sub-layers: stratum basale, spinosum, granulosum, lucidum, and corneum. Completely replaced every 28 days. Contains no blood vessels.' },
  { term: 'Dermis', category: 'Biology', definition: 'The middle skin layer, containing collagen, elastin, blood vessels, nerve endings, hair follicles, and sweat glands. Most anti-aging interventions target this layer. Much thicker than the epidermis.' },
  { term: 'Microbiome (Skin)', category: 'Biology', definition: 'The community of bacteria, fungi, and viruses living on skin. Healthy microbiome dominated by Staphylococcus epidermidis protects against pathogens. Harsh cleansers and over-washing disrupt it.' },
];

const CATEGORIES = ['All', 'Biology', 'Ingredient', 'Chemistry', 'Function', 'Rating', 'Process'];

export default function Glossary() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const filtered = TERMS.filter(t => {
    const matchSearch = t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.definition.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchSearch && matchCategory;
  }).sort((a, b) => a.term.localeCompare(b.term));

  const CATEGORY_COLORS: Record<string, string> = {
    Biology: '#4ADE80',
    Ingredient: colors.primary,
    Chemistry: '#6B85A8',
    Function: colors.gold,
    Rating: '#60A5FA',
    Process: '#F97316',
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Skin Glossary</Text>
            <Text style={styles.headerSub}>{TERMS.length} terms explained</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search terms..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {CATEGORIES.map(cat => (
              <Pressable
                key={cat}
                style={[
                  styles.filterChip,
                  selectedCategory === cat && {
                    backgroundColor: `${CATEGORY_COLORS[cat] || colors.primary}20`,
                    borderColor: CATEGORY_COLORS[cat] || colors.primary,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedCategory === cat && { color: CATEGORY_COLORS[cat] || colors.primary },
                ]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.resultCount}>{filtered.length} term{filtered.length !== 1 ? 's' : ''}</Text>

        {filtered.map((term) => {
          const color = CATEGORY_COLORS[term.category] || colors.textMuted;
          const isExpanded = expandedTerm === term.term;
          return (
            <Pressable
              key={term.term}
              style={[styles.termCard, isExpanded && { borderColor: `${color}50` }]}
              onPress={() => setExpandedTerm(isExpanded ? null : term.term)}
            >
              <View style={styles.termHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.termName}>{term.term}</Text>
                  {term.also && <Text style={styles.termAlso}>Also: {term.also}</Text>}
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: `${color}20` }]}>
                  <Text style={[styles.categoryBadgeText, { color }]}>{term.category}</Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={colors.textMuted}
                  style={{ marginLeft: 6 }}
                />
              </View>

              {isExpanded && (
                <View style={styles.termBody}>
                  <Text style={styles.termDefinition}>{term.definition}</Text>
                  {term.example && (
                    <View style={[styles.termExample, { borderLeftColor: color }]}>
                      <Text style={styles.termExampleLabel}>Example</Text>
                      <Text style={styles.termExampleText}>{term.example}</Text>
                    </View>
                  )}
                </View>
              )}
            </Pressable>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No terms match "{search}"</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.border,
    paddingHorizontal: 12, height: 44,
  },
  searchIcon: {},
  searchInput: { flex: 1, fontSize: 14, color: c.textPrimary },
  scroll: { paddingHorizontal: 16 },

  filterScroll: { marginBottom: 4, marginHorizontal: -4 },
  filterRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 4, paddingBottom: 4 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.bgCard,
  },
  filterChipText: { fontSize: 12, fontWeight: '700', color: c.textMuted },

  resultCount: { fontSize: 11, color: c.textMuted, marginBottom: 8, marginTop: 4 },

  termCard: {
    backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.border,
    padding: 12, gap: 8, marginBottom: 8,
  },
  termHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  termName: { fontSize: 14, fontWeight: '800', color: c.textPrimary, flex: 1 },
  termAlso: { fontSize: 11, color: c.textMuted, marginTop: 1 },
  categoryBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  categoryBadgeText: { fontSize: 10, fontWeight: '800' },
  termBody: { gap: 8 },
  termDefinition: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  termExample: { borderLeftWidth: 3, paddingLeft: 10, gap: 2 },
  termExampleLabel: { fontSize: 9, fontWeight: '800', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  termExampleText: { fontSize: 12, color: c.textMuted, lineHeight: 18, fontStyle: 'italic' },

  noResults: { alignItems: 'center', padding: 30 },
  noResultsText: { fontSize: 14, color: c.textMuted },
  });
}
