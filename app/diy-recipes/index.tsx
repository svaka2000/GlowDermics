import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

type Recipe = {
  id: string;
  name: string;
  emoji: string;
  category: string;
  time: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  benefit: string;
  color: string;
  ingredients: { name: string; amount: string; note?: string }[];
  steps: string[];
  tips: string[];
  storage: string;
  shelfLife: string;
  skinTypes: string[];
};

function buildRecipes(colors: Palette): Recipe[] {
  return [
  {
    id: 'basic-balm',
    name: 'Original Tallow Balm',
    emoji: '🌿',
    category: 'Moisturizer',
    time: '15 min',
    difficulty: 'Easy',
    benefit: 'Deep barrier repair and all-over moisturizing',
    color: colors.primary,
    skinTypes: ['All skin types'],
    ingredients: [
      { name: 'Grass-fed beef tallow', amount: '4 tbsp', note: 'Must be rendered and filtered' },
      { name: 'Organic jojoba oil', amount: '1 tbsp', note: 'Mirrors skin sebum' },
      { name: 'Vitamin E oil', amount: '5 drops', note: 'Natural preservative + antioxidant' },
    ],
    steps: [
      'Warm tallow gently until just melted (not boiling). Use a double boiler.',
      'Remove from heat and stir in jojoba oil.',
      'Add vitamin E drops and mix well.',
      'Pour into a clean, sterilized glass jar.',
      'Let cool at room temperature for 2 hours until set.',
      'Store in a cool, dark place.',
    ],
    tips: [
      'Use rendered, not raw tallow — render by slow-cooking kidney fat (suet) until pure fat separates.',
      'Whip with a hand mixer while cooling for a lighter, mousse-like texture.',
      'Add 2-3 drops of lavender essential oil for a subtle scent.',
    ],
    storage: 'Glass jar at room temperature',
    shelfLife: '12-18 months',
  },
  {
    id: 'tallow-serum',
    name: 'Brightening Face Serum',
    emoji: '✨',
    category: 'Serum',
    time: '10 min',
    difficulty: 'Easy',
    benefit: 'Brightening, anti-aging, and glow-inducing',
    color: colors.gold,
    skinTypes: ['Normal', 'Dry', 'Combination'],
    ingredients: [
      { name: 'Grass-fed beef tallow', amount: '2 tbsp' },
      { name: 'Rosehip seed oil', amount: '1 tbsp', note: 'Rich in vitamin A and C precursors' },
      { name: 'Sea buckthorn oil', amount: '3 drops', note: 'Intense orange — use sparingly' },
      { name: 'Vitamin C (L-ascorbic acid)', amount: '1/4 tsp', note: 'Oil-soluble form recommended' },
      { name: 'Vitamin E oil', amount: '8 drops' },
    ],
    steps: [
      'Melt tallow gently, remove from heat when liquid.',
      'Add rosehip oil and sea buckthorn oil — mix well.',
      'Once cooled to skin temperature, stir in vitamin C and vitamin E.',
      'Pour into a dropper bottle for easy application.',
      'Shake before each use as oils may separate.',
    ],
    tips: [
      'Sea buckthorn will turn the formula orange — this is normal and will not stain skin.',
      'Apply 3-4 drops at night and massage in circular motions.',
      'Vitamin C is unstable in light — use a dark amber dropper bottle.',
    ],
    storage: 'Dark amber dropper bottle, away from light',
    shelfLife: '3-6 months',
  },
  {
    id: 'tallow-eye',
    name: 'Under-Eye Repair Balm',
    emoji: '👁️',
    category: 'Eye Treatment',
    time: '10 min',
    difficulty: 'Easy',
    benefit: 'Reduces puffiness and fine lines under eyes',
    color: '#6B85A8',
    skinTypes: ['All skin types'],
    ingredients: [
      { name: 'Grass-fed beef tallow', amount: '1 tbsp' },
      { name: 'Castor oil', amount: '1 tsp', note: 'Promotes circulation and lash growth' },
      { name: 'Caffeine powder', amount: '1/8 tsp', note: 'De-puffing, constricts vessels' },
      { name: 'Vitamin K oil', amount: '5 drops', note: 'Reduces dark circles' },
    ],
    steps: [
      'Melt tallow and remove from heat.',
      'Add castor oil and stir to combine.',
      'Whisk in caffeine powder until fully dissolved — this takes 2-3 minutes of vigorous stirring.',
      'Add vitamin K drops and mix.',
      'Pour into a small metal tin or glass pot.',
      'Let set at room temperature.',
    ],
    tips: [
      'Apply with your ring finger — it applies the lightest pressure naturally.',
      'Refrigerate the tin for extra de-puffing effect in the morning.',
      'Use at night only — caffeine is absorbed and can disrupt sleep if used during day.',
    ],
    storage: 'Small glass or metal tin, refrigerate for best results',
    shelfLife: '6-9 months',
  },
  {
    id: 'tallow-mask',
    name: 'Deep Nourishing Clay Mask',
    emoji: '😌',
    category: 'Mask',
    time: '5 min',
    difficulty: 'Easy',
    benefit: 'Draws out impurities while deeply nourishing',
    color: '#86EFAC',
    skinTypes: ['Oily', 'Combination', 'Acne-prone'],
    ingredients: [
      { name: 'Kaolin clay', amount: '2 tbsp', note: 'Gentle, non-drying' },
      { name: 'Melted tallow', amount: '1 tsp', note: 'Prevents clay from over-drying' },
      { name: 'Raw apple cider vinegar', amount: '1-2 tsp', note: 'pH balancing' },
      { name: 'Manuka honey', amount: '1 tsp', note: 'Antibacterial and humectant' },
      { name: 'Tea tree essential oil', amount: '2 drops', note: 'Antimicrobial — don\'t exceed 2 drops' },
    ],
    steps: [
      'Mix clay and tallow together until a paste forms.',
      'Add ACV slowly, mixing to reach a spreadable consistency.',
      'Stir in honey and tea tree oil.',
      'Apply to face, avoiding eye area.',
      'Leave on 10-15 minutes (not until fully dry — this over-strips).',
      'Remove with warm water and a soft cloth.',
    ],
    tips: [
      'Mix fresh each time — this mask doesn\'t store well with ACV included.',
      'For dry skin, omit tea tree and add 1 tsp rosehip oil instead.',
      'Use max twice per week — clay is powerful and can over-exfoliate.',
    ],
    storage: 'Mix fresh each use',
    shelfLife: 'Single use',
  },
  {
    id: 'tallow-lip',
    name: 'Tinted Lip Treatment',
    emoji: '💋',
    category: 'Lip',
    time: '15 min',
    difficulty: 'Medium',
    benefit: 'Healing, hydrating, and naturally tinted',
    color: colors.scorePoor,
    skinTypes: ['All skin types'],
    ingredients: [
      { name: 'Beeswax pastilles', amount: '1 tsp', note: 'Creates firm but spreadable texture' },
      { name: 'Tallow', amount: '1.5 tsp' },
      { name: 'Castor oil', amount: '0.5 tsp', note: 'Provides shine' },
      { name: 'Mica powder (red/pink)', amount: '1/4 tsp', note: 'Cosmetic grade only' },
      { name: 'Peppermint essential oil', amount: '2 drops', note: 'Plumping effect' },
    ],
    steps: [
      'Melt beeswax in a double boiler first (it has the highest melting point).',
      'Add tallow and castor oil once wax is melted.',
      'Remove from heat and let cool slightly.',
      'Sift in mica powder and mix vigorously for 1 minute to prevent clumping.',
      'Add peppermint oil and stir.',
      'Pour quickly into a lip balm tube or small pot before it sets.',
    ],
    tips: [
      'Work quickly — the mixture sets fast once poured.',
      'Adjust mica amount for more or less color intensity.',
      'Use a dropper to pour into lip balm tubes for a professional finish.',
    ],
    storage: 'Lip balm tube or small pot',
    shelfLife: '12 months',
  },
  {
    id: 'tallow-body',
    name: 'Whipped Body Butter',
    emoji: '🧴',
    category: 'Body',
    time: '20 min',
    difficulty: 'Medium',
    benefit: 'Ultra-rich body moisturizer that absorbs without grease',
    color: '#22C55E',
    skinTypes: ['Dry', 'Very Dry', 'Sensitive'],
    ingredients: [
      { name: 'Grass-fed tallow', amount: '4 tbsp' },
      { name: 'Shea butter', amount: '2 tbsp' },
      { name: 'Coconut oil', amount: '1 tbsp', note: 'Fractionated for smoother texture' },
      { name: 'Arrowroot powder', amount: '1 tbsp', note: 'Reduces greasiness' },
      { name: 'Lavender essential oil', amount: '10 drops' },
      { name: 'Magnesium flakes', amount: '1 tbsp', note: 'Transdermal magnesium for muscle recovery' },
    ],
    steps: [
      'Melt tallow, shea, and coconut oil together over low heat.',
      'Remove from heat and let cool until just starting to solidify (about 20-30 min in fridge).',
      'Whip with a hand mixer on high for 3-5 minutes until fluffy and white.',
      'Add arrowroot powder and beat again for 1 minute.',
      'Fold in essential oil and magnesium flakes.',
      'Transfer to a glass jar.',
    ],
    tips: [
      'The whipping step is crucial — it aerated the fats and creates a light, non-greasy texture.',
      'Apply immediately after showering while skin is still damp — locks in moisture.',
      'Magnesium is absorbed transdermally and can aid sleep when applied before bed.',
    ],
    storage: 'Glass jar in cool location (will melt above 75°F)',
    shelfLife: '12-18 months',
  },
  ];
}

const CATEGORIES_FILTER = ['All', 'Moisturizer', 'Serum', 'Eye Treatment', 'Mask', 'Lip', 'Body'];

function buildDifficultyColor(c: Palette) {
  return { Easy: '#4ADE80', Medium: c.gold, Advanced: c.scorePoor } as const;
}

export default function DIYRecipes() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const RECIPES = useMemo(() => buildRecipes(colors), [colors]);
  const DIFFICULTY_COLOR = useMemo(() => buildDifficultyColor(colors), [colors]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');

  const filtered = RECIPES.filter(r => categoryFilter === 'All' || r.category === categoryFilter);

  if (selectedRecipe) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => setSelectedRecipe(null)}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>{selectedRecipe.name}</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Recipe hero */}
          <View style={[styles.recipeHero, { borderColor: `${selectedRecipe.color}40` }]}>
            <LinearGradient colors={[`${selectedRecipe.color}15`, `${selectedRecipe.color}04`]} style={StyleSheet.absoluteFill} />
            <Text style={styles.recipeHeroEmoji}>{selectedRecipe.emoji}</Text>
            <Text style={styles.recipeHeroName}>{selectedRecipe.name}</Text>
            <Text style={styles.recipeHeroBenefit}>{selectedRecipe.benefit}</Text>
            <View style={styles.recipeMeta}>
              <View style={styles.recipeMetaItem}>
                <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                <Text style={styles.recipeMetaText}>{selectedRecipe.time}</Text>
              </View>
              <View style={[styles.difficultyBadge, { backgroundColor: `${DIFFICULTY_COLOR[selectedRecipe.difficulty]}20` }]}>
                <Text style={[styles.difficultyText, { color: DIFFICULTY_COLOR[selectedRecipe.difficulty] }]}>{selectedRecipe.difficulty}</Text>
              </View>
              <View style={styles.recipeMetaItem}>
                <Ionicons name="person-outline" size={13} color={colors.textMuted} />
                <Text style={styles.recipeMetaText}>{selectedRecipe.skinTypes.join(', ')}</Text>
              </View>
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ingredients</Text>
            {selectedRecipe.ingredients.map((ing, i) => (
              <View key={i} style={styles.ingredientRow}>
                <View style={[styles.ingredientDot, { backgroundColor: selectedRecipe.color }]} />
                <View style={{ flex: 1 }}>
                  <View style={styles.ingredientTop}>
                    <Text style={styles.ingredientName}>{ing.name}</Text>
                    <Text style={[styles.ingredientAmount, { color: selectedRecipe.color }]}>{ing.amount}</Text>
                  </View>
                  {ing.note && <Text style={styles.ingredientNote}>{ing.note}</Text>}
                </View>
              </View>
            ))}
          </View>

          {/* Steps */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Instructions</Text>
            {selectedRecipe.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: selectedRecipe.color }]}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Storage */}
          <View style={styles.storageCard}>
            <View style={styles.storageItem}>
              <Ionicons name="cube-outline" size={16} color={colors.textMuted} />
              <View>
                <Text style={styles.storageLabel}>Storage</Text>
                <Text style={styles.storageValue}>{selectedRecipe.storage}</Text>
              </View>
            </View>
            <View style={styles.storageItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
              <View>
                <Text style={styles.storageLabel}>Shelf life</Text>
                <Text style={styles.storageValue}>{selectedRecipe.shelfLife}</Text>
              </View>
            </View>
          </View>

          {/* Tips */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pro Tips</Text>
            {selectedRecipe.tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Text style={styles.tipEmoji}>💡</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
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
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>DIY Tallow Recipes</Text>
            <Text style={styles.headerSub}>Make your own ancestral skincare</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.listHero}>
          <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Text style={styles.listHeroTitle}>🌿 Craft Your Routine</Text>
          <Text style={styles.listHeroDesc}>
            All recipes use grass-fed tallow as the base — the closest thing to your skin's own sebum. These are the formulas our ancestors used before the synthetic skincare industry existed.
          </Text>
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {CATEGORIES_FILTER.map(cat => (
              <Pressable
                key={cat}
                style={[styles.filterChip, categoryFilter === cat && styles.filterChipActive]}
                onPress={() => setCategoryFilter(cat)}
              >
                <Text style={[styles.filterChipText, categoryFilter === cat && { color: colors.primary }]}>{cat}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Recipe list */}
        {filtered.map(recipe => (
          <Pressable key={recipe.id} style={styles.recipeCard} onPress={() => setSelectedRecipe(recipe)}>
            <LinearGradient colors={[`${recipe.color}10`, `${recipe.color}03`]} style={StyleSheet.absoluteFill} />
            <View style={styles.recipeCardTop}>
              <Text style={styles.recipeCardEmoji}>{recipe.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.recipeCardName}>{recipe.name}</Text>
                <Text style={styles.recipeCardCategory}>{recipe.category}</Text>
              </View>
              <View>
                <View style={[styles.difficultyBadge, { backgroundColor: `${DIFFICULTY_COLOR[recipe.difficulty]}20`, alignSelf: 'flex-end', marginBottom: 4 }]}>
                  <Text style={[styles.difficultyText, { color: DIFFICULTY_COLOR[recipe.difficulty] }]}>{recipe.difficulty}</Text>
                </View>
                <Text style={styles.recipeCardTime}>{recipe.time}</Text>
              </View>
            </View>
            <Text style={styles.recipeCardBenefit}>{recipe.benefit}</Text>
            <Text style={styles.recipeCardSkinTypes}>{recipe.skinTypes.join(' · ')}</Text>
          </Pressable>
        ))}

        {/* Quality note */}
        <View style={styles.qualityCard}>
          <Text style={styles.qualityTitle}>Why Grass-Fed Tallow?</Text>
          <Text style={styles.qualityText}>
            The quality of your tallow determines the quality of your results. Grass-fed, pasture-raised tallow contains significantly higher levels of conjugated linoleic acid (CLA), palmitoleic acid, and fat-soluble vitamins A, D, E, and K compared to grain-fed animals. These nutrients are what make tallow uniquely effective for skin.
          </Text>
          <Pressable style={styles.qualityBtn} onPress={() => router.push('/product')}>
            <Text style={styles.qualityBtnText}>Shop TallowDermics →</Text>
          </Pressable>
        </View>

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

  listHero: {
    borderRadius: 20, overflow: 'hidden', padding: 20, gap: 8, marginBottom: 16,
  },
  listHeroTitle: { fontSize: 22, fontWeight: '900', color: c.white },
  listHeroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 20 },

  filterScroll: { marginBottom: 12, marginHorizontal: -4 },
  filterRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 4 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.bgCard,
  },
  filterChipActive: { borderColor: c.primary, backgroundColor: `${c.primary}15` },
  filterChipText: { fontSize: 12, fontWeight: '700', color: c.textMuted },

  recipeCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: c.border,
    padding: 14, gap: 6, marginBottom: 10,
  },
  recipeCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recipeCardEmoji: { fontSize: 28 },
  recipeCardName: { fontSize: 15, fontWeight: '800', color: c.textPrimary },
  recipeCardCategory: { fontSize: 11, color: c.textMuted, marginTop: 1 },
  recipeCardBenefit: { fontSize: 13, color: c.textSecondary },
  recipeCardSkinTypes: { fontSize: 11, color: c.textMuted, fontStyle: 'italic' },
  recipeCardTime: { fontSize: 10, color: c.textMuted, textAlign: 'right' },

  difficultyBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  difficultyText: { fontSize: 10, fontWeight: '800' },

  qualityCard: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: `${c.primary}40`,
    padding: 16, gap: 10, marginBottom: 14,
  },
  qualityTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  qualityText: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  qualityBtn: { alignSelf: 'flex-start' },
  qualityBtnText: { fontSize: 13, fontWeight: '700', color: c.primary },

  // Recipe detail styles
  recipeHero: {
    borderRadius: 20, overflow: 'hidden', borderWidth: 1,
    padding: 20, gap: 6, marginBottom: 14, alignItems: 'center',
  },
  recipeHeroEmoji: { fontSize: 40 },
  recipeHeroName: { fontSize: 22, fontWeight: '900', color: c.textPrimary },
  recipeHeroBenefit: { fontSize: 13, color: c.textMuted, textAlign: 'center' },
  recipeMeta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 },
  recipeMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recipeMetaText: { fontSize: 11, color: c.textMuted },

  card: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border,
    padding: 16, gap: 10, marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },

  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ingredientDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
  ingredientTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 },
  ingredientName: { fontSize: 14, fontWeight: '700', color: c.textPrimary, flex: 1 },
  ingredientAmount: { fontSize: 13, fontWeight: '800' },
  ingredientNote: { fontSize: 11, color: c.textMuted, marginTop: 2 },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { fontSize: 12, fontWeight: '900', color: c.white },
  stepText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  storageCard: {
    backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.border,
    padding: 14, gap: 10, marginBottom: 14,
  },
  storageItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  storageLabel: { fontSize: 10, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  storageValue: { fontSize: 13, fontWeight: '600', color: c.textSecondary, marginTop: 2 },

  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipEmoji: { fontSize: 16, width: 22, textAlign: 'center' },
  tipText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  });
}
