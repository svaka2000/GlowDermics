import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';

type FoodGroup = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  tagline: string;
  skinBenefit: string;
  keyNutrients: { nutrient: string; amount: string; benefit: string }[];
  topFoods: { food: string; emoji: string; note: string }[];
  howMuch: string;
  timing: string;
};

const FOOD_GROUPS: FoodGroup[] = [
  {
    id: 'omega3',
    name: 'Omega-3 Rich Foods',
    emoji: '🐟',
    color: '#60A5FA',
    tagline: 'The anti-inflammatory core of beautiful skin',
    skinBenefit: 'Reduce systemic inflammation that drives acne, rosacea, eczema, and premature aging. Strengthen cell membranes for plumper, more hydrated skin.',
    keyNutrients: [
      { nutrient: 'EPA (eicosapentaenoic acid)', amount: '500-1000mg/day', benefit: 'Directly suppresses inflammatory cytokines, calms acne and redness' },
      { nutrient: 'DHA (docosahexaenoic acid)', amount: '500-1000mg/day', benefit: 'Structural fat in cell membranes — makes skin cells more fluid and youthful' },
      { nutrient: 'ALA (alpha-linolenic acid)', amount: '1-2g/day (plant sources)', benefit: 'Converts partially to EPA/DHA; still improves skin hydration barrier' },
    ],
    topFoods: [
      { food: 'Wild salmon', emoji: '🐟', note: 'Wild-caught has 5x more omega-3 than farmed. 3.5oz has 2.2g omega-3.' },
      { food: 'Sardines', emoji: '🐟', note: 'The most cost-effective omega-3 source. Also loaded with skin-boosting vitamin D.' },
      { food: 'Mackerel', emoji: '🐠', note: 'Higher omega-3 content than salmon, cheaper, and sustainable.' },
      { food: 'Grass-fed beef', emoji: '🥩', note: 'Significantly better omega-3:6 ratio than grain-fed. TallowDermics uses grass-fed animals for this reason.' },
      { food: 'Chia seeds', emoji: '🌱', note: '5g ALA per tablespoon — great plant source, though conversion to EPA/DHA is limited.' },
    ],
    howMuch: '2-3 servings of fatty fish per week, or 1-2g omega-3 supplement daily',
    timing: 'With meals containing fat for best absorption',
  },
  {
    id: 'antioxidants',
    name: 'Antioxidant-Rich Produce',
    emoji: '🫐',
    color: '#6B85A8',
    tagline: 'Nature\'s shield against UV and pollution damage',
    skinBenefit: 'Neutralize free radicals before they can break down collagen and trigger inflammation. Slow visible aging from environmental exposure.',
    keyNutrients: [
      { nutrient: 'Vitamin C (ascorbic acid)', amount: '500-1000mg/day', benefit: 'Essential cofactor for collagen synthesis. Neutralizes UVA-induced free radicals.' },
      { nutrient: 'Vitamin E (tocopherol)', amount: '15mg/day (more from food)', benefit: 'Fat-soluble antioxidant protecting cell membranes from oxidation.' },
      { nutrient: 'Polyphenols (flavonoids)', amount: 'Varied — eat the rainbow', benefit: 'Hundreds of plant compounds that reduce inflammation and UV sensitivity.' },
      { nutrient: 'Beta-carotene (Vitamin A precursor)', amount: '6-15mg/day', benefit: 'Converted to retinoic acid in skin. Essential for cell turnover.' },
    ],
    topFoods: [
      { food: 'Blueberries', emoji: '🫐', note: 'Among the highest antioxidant content of any food. Anthocyanins protect collagen.' },
      { food: 'Sweet potatoes', emoji: '🍠', note: 'Massive beta-carotene content — your body converts this to vitamin A for skin cell turnover.' },
      { food: 'Bell peppers', emoji: '🫑', note: 'More vitamin C than oranges. Red peppers have the highest concentration.' },
      { food: 'Dark leafy greens', emoji: '🥬', note: 'Kale, spinach, and swiss chard provide vitamin E, C, and skin-supporting minerals.' },
      { food: 'Pomegranate', emoji: '🍎', note: 'Ellagic acid blocks UV-induced collagen breakdown at a cellular level.' },
    ],
    howMuch: '5-9 servings of vegetables and low-glycemic fruits daily',
    timing: 'Spread throughout meals — don\'t save produce for "once a day"',
  },
  {
    id: 'collagen',
    name: 'Collagen Builders',
    emoji: '🦴',
    color: Colors.primary,
    tagline: 'Build the scaffolding that holds skin firm',
    skinBenefit: 'Provide the raw materials for collagen and elastin synthesis. Support skin thickness, elasticity, and resistance to wrinkle formation.',
    keyNutrients: [
      { nutrient: 'Glycine', amount: '2-3g/day', benefit: 'The most abundant amino acid in collagen. Rate-limiting for collagen synthesis.' },
      { nutrient: 'Proline & Hydroxyproline', amount: 'From whole foods', benefit: 'Structural amino acids unique to collagen — found in high amounts in bone broth.' },
      { nutrient: 'Vitamin C', amount: '200mg+ daily', benefit: 'Hydroxylates proline and lysine — collagen CANNOT form without adequate vitamin C.' },
      { nutrient: 'Copper', amount: '0.9mg/day', benefit: 'Activates lysyl oxidase — the enzyme that crosslinks collagen for strength and elasticity.' },
    ],
    topFoods: [
      { food: 'Bone broth', emoji: '🍲', note: 'Slow-cooked collagen breaks down into glycine, proline, hydroxyproline. Make from grass-fed bones for best amino acid profile.' },
      { food: 'Organ meats (liver)', emoji: '🥩', note: 'The original multivitamin. Liver has vitamin A, zinc, copper — all critical for collagen.' },
      { food: 'Egg yolks', emoji: '🥚', note: 'Rich in collagen precursors and sulfur, which crosslinks collagen for stability.' },
      { food: 'Shellfish (oysters, shrimp)', emoji: '🦪', note: 'High zinc and copper content — essential cofactors for collagen synthesis enzymes.' },
      { food: 'Grass-fed beef', emoji: '🥩', note: 'Provides glycine-rich protein plus CLA — the same CLA found in TallowDermics tallow.' },
    ],
    howMuch: '1 cup bone broth daily or high-quality collagen peptide supplement (10-15g)',
    timing: 'Vitamin C with every collagen-containing meal for maximum synthesis',
  },
  {
    id: 'gut',
    name: 'Gut-Skin Axis Foods',
    emoji: '🌿',
    color: '#22C55E',
    tagline: 'Your gut microbiome runs your skin microbiome',
    skinBenefit: 'A diverse gut microbiome reduces systemic inflammation, which directly reduces inflammatory skin conditions (acne, eczema, rosacea, psoriasis). The gut-skin axis is one of the most powerful levers in skin health.',
    keyNutrients: [
      { nutrient: 'Prebiotics (inulin, FOS)', amount: '10-30g/day', benefit: 'Feed beneficial bacteria — especially Lactobacillus and Bifidobacterium' },
      { nutrient: 'Probiotics (live cultures)', amount: '10-100 billion CFU/day', benefit: 'Directly replenish beneficial bacteria and produce anti-inflammatory short-chain fatty acids' },
      { nutrient: 'Butyrate (short-chain fatty acid)', amount: 'From fermented foods + fiber', benefit: 'Seals the gut lining, prevents leaky gut, reduces systemic inflammation that causes skin flares' },
    ],
    topFoods: [
      { food: 'Fermented vegetables (kimchi, sauerkraut)', emoji: '🥬', note: 'Provide live probiotics AND prebiotic fiber. The gold standard gut food.' },
      { food: 'Plain full-fat yogurt / kefir', emoji: '🥛', note: 'Billions of live cultures. Kefir is 3x more probiotic-rich than yogurt.' },
      { food: 'Jerusalem artichokes (sunchokes)', emoji: '🌿', note: 'The highest prebiotic content of any vegetable — feeds your gut bacteria aggressively.' },
      { food: 'Garlic and onions', emoji: '🧅', note: 'Prebiotic fructooligosaccharides that specifically feed beneficial Lactobacillus strains.' },
      { food: 'Green plantains and resistant starch', emoji: '🍌', note: 'Resistant starch feeds bacteria in the large intestine, producing butyrate for gut wall healing.' },
    ],
    howMuch: 'Daily fermented foods + 25-30g total fiber per day',
    timing: 'Spread prebiotics across meals to avoid gas/bloating from sudden increase',
  },
  {
    id: 'hydration',
    name: 'Hydrating Foods',
    emoji: '💧',
    color: '#38BDF8',
    tagline: 'Eat your water — it\'s more effective than drinking it',
    skinBenefit: 'Foods with high water content hydrate skin from the inside out, delivering water alongside electrolytes and nutrients that help cells actually retain moisture.',
    keyNutrients: [
      { nutrient: 'Silica', amount: '20-30mg/day', benefit: 'Strengthens collagen and hair/nail formation. Found in cucumbers and oats.' },
      { nutrient: 'Potassium', amount: '3500-4700mg/day', benefit: 'Key electrolyte that keeps water inside cells. Most people are chronically deficient.' },
      { nutrient: 'Magnesium', amount: '320-420mg/day', benefit: 'Required for 300+ enzymatic reactions including skin barrier maintenance.' },
    ],
    topFoods: [
      { food: 'Cucumbers', emoji: '🥒', note: '96% water. Also contains silica for collagen. Eat the skin — that\'s where the nutrients are.' },
      { food: 'Watermelon', emoji: '🍉', note: '92% water + lycopene (a powerful UV-protective antioxidant).' },
      { food: 'Celery', emoji: '🥬', note: '95% water with anti-inflammatory compounds and potassium.' },
      { food: 'Coconut water', emoji: '🥥', note: 'Natural electrolyte balance: potassium, magnesium, sodium — ideal for cellular hydration.' },
      { food: 'Aloe vera juice', emoji: '🌵', note: 'Contains acemannan, which helps cells retain water from the inside.' },
    ],
    howMuch: '3-5 cups of high-water vegetables daily, plus 8+ glasses of water',
    timing: 'Spread throughout the day — don\'t try to drink a lot at once',
  },
  {
    id: 'avoid',
    name: 'Skin-Damaging Foods',
    emoji: '🚫',
    color: Colors.scorePoor,
    tagline: 'What\'s wrecking your skin from inside',
    skinBenefit: 'Eliminating these foods reduces inflammation, stabilizes insulin (acne\'s primary driver), and prevents glycation (the process that stiffens and yellows skin).',
    keyNutrients: [
      { nutrient: 'Advanced glycation end products (AGEs)', amount: 'From high-heat cooked foods', benefit: 'AGEs crosslink collagen making it stiff and brittle — they accelerate aging' },
      { nutrient: 'Refined sugar/high-glycemic carbs', amount: 'Minimize (<25g added sugar/day)', benefit: 'Spike insulin → trigger androgen hormones → increase sebum → cause acne' },
      { nutrient: 'Vegetable oils (linoleic-heavy)', amount: 'Limit seed oils', benefit: 'Oxidize easily, creating inflammatory free radicals, and compete with anti-inflammatory omega-3s' },
    ],
    topFoods: [
      { food: 'Added sugars (all forms)', emoji: '🍭', note: 'Trigger insulin spikes, feed inflammatory gut bacteria, and cause glycation of collagen.' },
      { food: 'Refined seed oils', emoji: '🫙', note: 'Sunflower, soybean, canola, corn oil — high in omega-6 that drives inflammation. Use tallow, butter, or olive oil instead.' },
      { food: 'Ultra-processed foods', emoji: '🍟', note: 'Contain emulsifiers that break down gut lining, trigger systemic inflammation seen in skin flares.' },
      { food: 'Alcohol', emoji: '🍷', note: 'Dehydrates skin, depletes vitamin A (essential for cell turnover), and increases inflammation.' },
      { food: 'Dairy (for acne-prone)', emoji: '🥛', note: 'Conventional dairy contains hormones that activate androgen receptors in skin. Try removing for 30 days if acne-prone.' },
    ],
    howMuch: 'Reduce as much as possible — even 50% reduction makes measurable difference',
    timing: 'Focus on crowding these out with the beneficial foods above',
  },
];

export default function FaceFoodGuide() {
  const [selectedGroup, setSelectedGroup] = useState<FoodGroup | null>(null);

  if (selectedGroup) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => setSelectedGroup(null)}>
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>{selectedGroup.name}</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={[styles.groupHero, { borderColor: `${selectedGroup.color}50` }]}>
            <LinearGradient colors={[`${selectedGroup.color}18`, `${selectedGroup.color}05`]} style={StyleSheet.absoluteFill} />
            <Text style={styles.groupHeroEmoji}>{selectedGroup.emoji}</Text>
            <Text style={[styles.groupHeroName, { color: selectedGroup.color }]}>{selectedGroup.name}</Text>
            <Text style={styles.groupHeroTagline}>{selectedGroup.tagline}</Text>
            <Text style={styles.groupHeroBenefit}>{selectedGroup.skinBenefit}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Key Nutrients</Text>
            {selectedGroup.keyNutrients.map((n, i) => (
              <View key={i} style={styles.nutrientRow}>
                <View style={[styles.nutrientBadge, { backgroundColor: `${selectedGroup.color}15` }]}>
                  <Text style={[styles.nutrientName, { color: selectedGroup.color }]}>{n.nutrient}</Text>
                  <Text style={[styles.nutrientAmount, { color: selectedGroup.color }]}>{n.amount}</Text>
                </View>
                <Text style={styles.nutrientBenefit}>{n.benefit}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Best Food Sources</Text>
            {selectedGroup.topFoods.map((food, i) => (
              <View key={i} style={styles.foodRow}>
                <Text style={styles.foodEmoji}>{food.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.foodName}>{food.food}</Text>
                  <Text style={styles.foodNote}>{food.note}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.dosageCard}>
            <View style={styles.dosageItem}>
              <Ionicons name="nutrition-outline" size={16} color={Colors.textMuted} />
              <View>
                <Text style={styles.dosageLabel}>How much</Text>
                <Text style={styles.dosageValue}>{selectedGroup.howMuch}</Text>
              </View>
            </View>
            <View style={styles.dosageItem}>
              <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
              <View>
                <Text style={styles.dosageLabel}>When/How</Text>
                <Text style={styles.dosageValue}>{selectedGroup.timing}</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Face Food Guide</Text>
            <Text style={styles.headerSub}>Eat for your skin's biology</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.listHero}>
          <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Text style={styles.listHeroTitle}>🍽️ Skin Starts in the Kitchen</Text>
          <Text style={styles.listHeroDesc}>
            No amount of topical skincare compensates for a pro-inflammatory diet. The foods you eat directly build — or destroy — your collagen, barrier function, and microbiome. This is the guide your dermatologist won't give you.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>EAT MORE OF THESE</Text>
        {FOOD_GROUPS.filter(g => g.id !== 'avoid').map(group => (
          <Pressable key={group.id} style={styles.groupCard} onPress={() => setSelectedGroup(group)}>
            <LinearGradient colors={[`${group.color}12`, `${group.color}04`]} style={StyleSheet.absoluteFill} />
            <View style={styles.groupCardTop}>
              <Text style={styles.groupCardEmoji}>{group.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.groupCardName, { color: group.color }]}>{group.name}</Text>
                <Text style={styles.groupCardTagline}>{group.tagline}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </View>
            <Text style={styles.groupCardBenefit} numberOfLines={2}>{group.skinBenefit}</Text>
          </Pressable>
        ))}

        <Text style={[styles.sectionLabel, { color: Colors.scorePoor, marginTop: 8 }]}>LIMIT OR ELIMINATE</Text>
        {FOOD_GROUPS.filter(g => g.id === 'avoid').map(group => (
          <Pressable key={group.id} style={[styles.groupCard, { borderColor: 'rgba(239,68,68,0.25)' }]} onPress={() => setSelectedGroup(group)}>
            <LinearGradient colors={['rgba(239,68,68,0.08)', 'rgba(239,68,68,0.02)']} style={StyleSheet.absoluteFill} />
            <View style={styles.groupCardTop}>
              <Text style={styles.groupCardEmoji}>{group.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.groupCardName, { color: group.color }]}>{group.name}</Text>
                <Text style={styles.groupCardTagline}>{group.tagline}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </View>
            <Text style={styles.groupCardBenefit} numberOfLines={2}>{group.skinBenefit}</Text>
          </Pressable>
        ))}

        <View style={styles.ancestralCard}>
          <LinearGradient colors={[`${Colors.primary}12`, `${Colors.primary}04`]} style={StyleSheet.absoluteFill} />
          <Text style={styles.ancestralTitle}>🌿 The Ancestral Connection</Text>
          <Text style={styles.ancestralText}>
            Our ancestors ate a diet rich in omega-3s from pasture-raised animals, seasonal vegetables, and fermented foods — with minimal processed sugar or seed oils. The same principles that make TallowDermics effective topically (grass-fed fat, no synthetic ingredients) apply internally: eat real, whole, ancestrally-appropriate foods and your skin will reflect it.
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', flex: 1 },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  listHero: { borderRadius: 20, overflow: 'hidden', padding: 20, gap: 8, marginBottom: 16 },
  listHeroTitle: { fontSize: 22, fontWeight: '900', color: Colors.white },
  listHeroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 22 },

  sectionLabel: {
    fontSize: 10, fontWeight: '800', color: Colors.textMuted,
    letterSpacing: 1.5, marginBottom: 8,
  },

  groupCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
    padding: 14, gap: 6, marginBottom: 10,
  },
  groupCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  groupCardEmoji: { fontSize: 28 },
  groupCardName: { fontSize: 14, fontWeight: '800' },
  groupCardTagline: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  groupCardBenefit: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  ancestralCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: `${Colors.primary}30`,
    padding: 16, gap: 8, marginBottom: 14,
  },
  ancestralTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  ancestralText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  // Detail styles
  groupHero: {
    borderRadius: 20, overflow: 'hidden', borderWidth: 2,
    padding: 20, gap: 8, marginBottom: 14, alignItems: 'center',
  },
  groupHeroEmoji: { fontSize: 40 },
  groupHeroName: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  groupHeroTagline: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
  groupHeroBenefit: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 10, marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  nutrientRow: { gap: 6 },
  nutrientBadge: { borderRadius: 8, padding: 8, gap: 2 },
  nutrientName: { fontSize: 12, fontWeight: '800' },
  nutrientAmount: { fontSize: 11, fontWeight: '600' },
  nutrientBenefit: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  foodRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  foodEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  foodName: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  foodNote: { fontSize: 12, color: Colors.textMuted, lineHeight: 17, marginTop: 1 },

  dosageCard: {
    backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: 14, gap: 12, marginBottom: 14,
  },
  dosageItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dosageLabel: { fontSize: 9, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  dosageValue: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, lineHeight: 20, marginTop: 2 },
});
