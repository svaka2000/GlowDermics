import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, TextInput,
} from 'react-native';
import { router } from 'expo-router';

const Colors = {
  bg: '#0A0A0F',
  card: '#13131A',
  cardAlt: '#1A1A24',
  border: '#2A2A3A',
  primary: '#C4622D',
  gold: '#D4A96A',
  textPrimary: '#FAF3E0',
  textSecondary: '#9A9AAF',
  textMuted: '#5A5A6E',
  green: '#4ADE80',
  red: '#F87171',
  blue: '#60A5FA',
  yellow: '#FBBF24',
};

interface Oil {
  name: string;
  comedogenic: number; // 0-5
  keyFattyAcids: string;
  bestFor: string[];
  avoid: string[];
  benefits: string;
  layering: 'first' | 'middle' | 'last';
  tallowNote?: string;
}

const OILS: Oil[] = [
  {
    name: 'Grass-Fed Tallow',
    comedogenic: 1,
    keyFattyAcids: 'Oleic (40%), Stearic (25%), Palmitic (25%), CLA, Palmitoleic',
    bestFor: ['dry', 'sensitive', 'mature', 'eczema', 'normal'],
    avoid: [],
    benefits: "Bioidentical to human sebum. Contains fat-soluble vitamins A, D, E, K2. Full barrier repair. Absorbs like skin's own oil.",
    layering: 'last',
    tallowNote: 'Our hero ingredient. Use as the final occlusive step. All other oils are layered before tallow.',
  },
  {
    name: 'Squalane',
    comedogenic: 1,
    keyFattyAcids: 'Squalene (stable, single compound)',
    bestFor: ['oily', 'acne-prone', 'sensitive', 'dry', 'combination'],
    avoid: [],
    benefits: 'Extremely lightweight. Enhances transdermal penetration of other actives. Mimics the squalene naturally in sebum. Non-comedogenic for all types.',
    layering: 'first',
  },
  {
    name: 'Rosehip Seed Oil',
    comedogenic: 1,
    keyFattyAcids: 'Linoleic (40%), Oleic (16%), Vitamin A (trans-retinoic acid)',
    bestFor: ['dry', 'mature', 'hyperpigmentation', 'scarring'],
    avoid: ['acne-prone'],
    benefits: 'Natural source of trans-retinoic acid (vitamin A). Excellent for fading post-acne marks and hyperpigmentation. Rich in essential fatty acids.',
    layering: 'middle',
  },
  {
    name: 'Jojoba Oil',
    comedogenic: 2,
    keyFattyAcids: 'Technically a liquid wax ester — similar to sebum structure',
    bestFor: ['oily', 'acne-prone', 'combination', 'normal'],
    avoid: [],
    benefits: 'Liquid wax that closely resembles sebum. Signals the skin to reduce oil production. Often misidentified as "oil-free" compatible. Versatile.',
    layering: 'middle',
  },
  {
    name: 'Marula Oil',
    comedogenic: 2,
    keyFattyAcids: 'Oleic (70-80%), Linoleic (5-8%)',
    bestFor: ['dry', 'mature', 'sensitive', 'normal'],
    avoid: ['acne-prone', 'oily'],
    benefits: 'High oleic content makes it excellent for dry/mature skin. Penetrates quickly. Rich in antioxidants oleic acid and vitamin E.',
    layering: 'middle',
  },
  {
    name: 'Argan Oil',
    comedogenic: 0,
    keyFattyAcids: 'Oleic (46%), Linoleic (35%), Vitamin E',
    bestFor: ['all', 'mature', 'dry', 'normal'],
    avoid: [],
    benefits: 'Balanced oleic/linoleic ratio suits most skin types. Non-comedogenic (0). Excellent antioxidant profile. Good for all skin types. Absorbs relatively quickly.',
    layering: 'middle',
  },
  {
    name: 'Hemp Seed Oil',
    comedogenic: 0,
    keyFattyAcids: 'Linoleic (55%), Alpha-linolenic (15%), GLA',
    bestFor: ['acne-prone', 'oily', 'sensitive', 'rosacea'],
    avoid: [],
    benefits: 'High linoleic acid deficiency is linked to acne — hemp seed oil directly replenishes this. Non-comedogenic. Anti-inflammatory GLA content.',
    layering: 'first',
  },
  {
    name: 'Sea Buckthorn Oil',
    comedogenic: 1,
    keyFattyAcids: 'Palmitoleic (30%), Palmitic (30%), Vitamin E, carotenoids',
    bestFor: ['mature', 'dry', 'eczema', 'hyperpigmentation'],
    avoid: ['all (use diluted)'],
    benefits: 'Extremely concentrated — must dilute to 2-5% in a carrier. Enormous vitamin E and carotenoid content. Significant skin-rejuvenating effects but will turn skin orange if used undiluted.',
    layering: 'middle',
  },
  {
    name: 'Bakuchiol Oil',
    comedogenic: 1,
    keyFattyAcids: 'Meroterpene phenol (not fatty acid — acts as plant retinol)',
    bestFor: ['sensitive', 'mature', 'pregnancy-safe retinol alternative'],
    avoid: [],
    benefits: 'Plant-based retinol alternative. Stimulates collagen, improves fine lines, fades hyperpigmentation. Safe during pregnancy when retinoids are not.',
    layering: 'middle',
  },
  {
    name: 'Coconut Oil',
    comedogenic: 4,
    keyFattyAcids: 'Lauric (50%), Myristic (20%), Palmitic (10%)',
    bestFor: ['body', 'hair', 'oil cleansing step only'],
    avoid: ['acne-prone', 'sensitive', 'oily', 'combination'],
    benefits: 'Excellent for body and hair. Strong antimicrobial (lauric acid). However, highly comedogenic on the face for most people. Best kept below the neck.',
    layering: 'last',
  },
  {
    name: 'Sweet Almond Oil',
    comedogenic: 2,
    keyFattyAcids: 'Oleic (65%), Linoleic (25%)',
    bestFor: ['dry', 'normal', 'sensitive', 'massage'],
    avoid: ['nut allergy'],
    benefits: 'Emollient and light. Good for massage. Moderate comedogenic rating — safe for most but not ideal for oily/acne-prone. Rich in vitamin E.',
    layering: 'middle',
  },
  {
    name: 'Camellia (Green Tea) Oil',
    comedogenic: 1,
    keyFattyAcids: 'Oleic (80%), Linoleic (10%), polyphenols',
    bestFor: ['all', 'mature', 'dry', 'sensitive'],
    avoid: [],
    benefits: 'Extremely high oleic acid content. Rich in polyphenol antioxidants. Traditional Japanese beauty staple. Absorbs quickly without greasiness. Excellent for all types.',
    layering: 'middle',
  },
];

const LAYERING_ORDER = [
  { order: 1, type: 'Water-based serums/treatments', example: 'Hyaluronic acid, niacinamide, BHA', principle: 'Smallest molecule → largest. Always apply on damp skin.' },
  { order: 2, type: 'Lightweight oils (first layer)', example: 'Squalane, hemp seed', principle: 'Thin, fast-absorbing oils penetrate before heavier ones seal them out.' },
  { order: 3, type: 'Medium oils (main nourishment)', example: 'Jojoba, argan, rosehip', principle: 'Your primary oil layer for skin type-specific benefits.' },
  { order: 4, type: 'Heavy occlusives / balms', example: 'Tallow, coconut oil (body)', principle: 'Seal everything in. Nothing penetrates after this layer.' },
];

const comedogenicColor = (c: number) => {
  if (c <= 1) return Colors.green;
  if (c <= 2) return Colors.yellow;
  if (c <= 3) return Colors.gold;
  return Colors.red;
};

const comedogenicLabel = (c: number) => {
  if (c === 0) return 'Non-comedogenic';
  if (c === 1) return 'Very low risk';
  if (c === 2) return 'Low-moderate risk';
  if (c === 3) return 'Moderate risk';
  if (c === 4) return 'High risk';
  return 'Very high risk';
};

export default function OilGuideScreen() {
  const [activeTab, setActiveTab] = useState<'compare' | 'layering' | 'skintype'>('compare');
  const [search, setSearch] = useState('');
  const [expandedOil, setExpandedOil] = useState<string | null>(null);
  const [skinTypeFilter, setSkinTypeFilter] = useState('all');

  const SKIN_TYPES = ['all', 'oily', 'dry', 'sensitive', 'acne-prone', 'mature', 'combination'];

  const filteredOils = OILS.filter(oil => {
    const matchSearch = oil.name.toLowerCase().includes(search.toLowerCase());
    const matchType = skinTypeFilter === 'all' || oil.bestFor.some(t => t.toLowerCase().includes(skinTypeFilter));
    return matchSearch && matchType;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Facial Oil Guide</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.tabBar}>
        {(['compare', 'layering', 'skintype'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabLabel, activeTab === t && styles.tabLabelActive]}>
              {t === 'compare' ? '🔍 Oils' : t === 'layering' ? '📐 Layering' : '🎯 By Type'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {activeTab === 'compare' && (
          <>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search oils..."
              placeholderTextColor={Colors.textMuted}
            />
            {filteredOils.map((oil, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.oilCard, oil.name === 'Grass-Fed Tallow' && { borderColor: Colors.primary + '66' }]}
                onPress={() => setExpandedOil(expandedOil === oil.name ? null : oil.name)}
                activeOpacity={0.8}
              >
                <View style={styles.oilHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.oilNameRow}>
                      <Text style={styles.oilName}>{oil.name}</Text>
                      {oil.name === 'Grass-Fed Tallow' && <Text style={styles.heroBadge}>★ HERO</Text>}
                    </View>
                    <Text style={styles.oilFatty}>{oil.keyFattyAcids}</Text>
                  </View>
                  <View>
                    <View style={[styles.comedoBadge, { borderColor: comedogenicColor(oil.comedogenic) }]}>
                      <Text style={[styles.comedo, { color: comedogenicColor(oil.comedogenic) }]}>{oil.comedogenic}/5</Text>
                    </View>
                    <Text style={[styles.comedoLabel, { color: comedogenicColor(oil.comedogenic) }]}>
                      {comedogenicLabel(oil.comedogenic)}
                    </Text>
                  </View>
                </View>

                {expandedOil === oil.name && (
                  <View style={styles.oilExpanded}>
                    <Text style={styles.oilBenefits}>{oil.benefits}</Text>
                    <View style={styles.oilTags}>
                      <Text style={styles.tagLabel}>Best for: </Text>
                      {oil.bestFor.map(t => (
                        <View key={t} style={styles.tagGreen}><Text style={styles.tagTextGreen}>{t}</Text></View>
                      ))}
                    </View>
                    {oil.avoid.length > 0 && (
                      <View style={styles.oilTags}>
                        <Text style={styles.tagLabel}>Avoid if: </Text>
                        {oil.avoid.map(t => (
                          <View key={t} style={styles.tagRed}><Text style={styles.tagTextRed}>{t}</Text></View>
                        ))}
                      </View>
                    )}
                    <View style={styles.layeringBadge}>
                      <Text style={styles.layeringBadgeText}>Layer {oil.layering === 'first' ? 'early (thin)' : oil.layering === 'last' ? 'last (occlusive)' : 'middle'}</Text>
                    </View>
                    {oil.tallowNote && (
                      <View style={styles.tallowNote}>
                        <Text style={styles.tallowNoteText}>🌿 {oil.tallowNote}</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === 'layering' && (
          <>
            <View style={styles.layeringIntro}>
              <Text style={styles.layeringIntroTitle}>Oil Layering Principle</Text>
              <Text style={styles.layeringIntroText}>
                Apply oils thinnest to thickest. Lighter molecules penetrate first; heavier molecules seal on top.
                Never apply a water-based product after oil — it won't absorb.
              </Text>
            </View>
            {LAYERING_ORDER.map((step, i) => (
              <View key={i} style={styles.layeringStep}>
                <View style={styles.layeringNum}>
                  <Text style={styles.layeringNumText}>{step.order}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.layeringType}>{step.type}</Text>
                  <Text style={styles.layeringExample}>{step.example}</Text>
                  <Text style={styles.layeringPrinciple}>{step.principle}</Text>
                </View>
              </View>
            ))}
            <View style={styles.rulebox}>
              <Text style={styles.ruleboxTitle}>Golden Rules</Text>
              <Text style={styles.ruleboxText}>
                • Always apply to slightly damp skin — water provides a substrate{'\n'}
                • A drop or two is enough — more doesn't mean better{'\n'}
                • Wait 30–60 seconds between layers{'\n'}
                • Apply tallow last, always{'\n'}
                • Don't mix actives (BHA, retinol) with oils directly — apply actives first, wait, then oil{'\n'}
                • Oils do not hydrate — they seal. Always hydrate first.
              </Text>
            </View>
          </>
        )}

        {activeTab === 'skintype' && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 0, gap: 8, marginBottom: 14 }}>
              {SKIN_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, skinTypeFilter === t && styles.typeChipActive]}
                  onPress={() => setSkinTypeFilter(t)}
                >
                  <Text style={[styles.typeChipText, skinTypeFilter === t && styles.typeChipTextActive]}>
                    {t === 'all' ? 'All Types' : t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {filteredOils.sort((a, b) => a.comedogenic - b.comedogenic).map((oil, i) => (
              <View key={i} style={[styles.typeOilCard, oil.name === 'Grass-Fed Tallow' && { borderColor: Colors.primary + '55' }]}>
                <View style={styles.typeOilLeft}>
                  <Text style={styles.typeOilName}>{oil.name}</Text>
                  <Text style={styles.typeOilBenefits}>{oil.benefits.split('.')[0]}.</Text>
                </View>
                <View style={[styles.comedoBadge, { borderColor: comedogenicColor(oil.comedogenic), alignSelf: 'flex-start' }]}>
                  <Text style={[styles.comedo, { color: comedogenicColor(oil.comedogenic) }]}>{oil.comedogenic}/5</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  backText: { color: Colors.primary, fontSize: 16 },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: Colors.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  searchInput: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    color: Colors.textPrimary, fontSize: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 12,
  },
  oilCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  oilHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  oilNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  oilName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  heroBadge: {
    color: Colors.primary, fontSize: 9, fontWeight: '700',
    backgroundColor: Colors.primary + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  oilFatty: { color: Colors.textMuted, fontSize: 11, lineHeight: 17 },
  comedoBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignItems: 'center' },
  comedo: { fontSize: 13, fontWeight: '800' },
  comedoLabel: { fontSize: 9, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  oilExpanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  oilBenefits: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 10 },
  oilTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6, alignItems: 'center' },
  tagLabel: { color: Colors.textMuted, fontSize: 11 },
  tagGreen: { backgroundColor: Colors.green + '22', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  tagTextGreen: { color: Colors.green, fontSize: 11, fontWeight: '600' },
  tagRed: { backgroundColor: Colors.red + '22', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  tagTextRed: { color: Colors.red, fontSize: 11, fontWeight: '600' },
  layeringBadge: {
    backgroundColor: Colors.blue + '22', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4,
  },
  layeringBadgeText: { color: Colors.blue, fontSize: 11, fontWeight: '600' },
  tallowNote: {
    backgroundColor: Colors.primary + '15', borderRadius: 10, padding: 8,
    borderWidth: 1, borderColor: Colors.primary + '33', marginTop: 8,
  },
  tallowNoteText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  layeringIntro: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
  },
  layeringIntroTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  layeringIntroText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  layeringStep: {
    flexDirection: 'row', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  layeringNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary + '33', alignItems: 'center', justifyContent: 'center',
  },
  layeringNumText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  layeringType: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 3 },
  layeringExample: { color: Colors.gold, fontSize: 11, marginBottom: 4 },
  layeringPrinciple: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  rulebox: {
    backgroundColor: Colors.primary + '15', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.primary + '44', marginTop: 8,
  },
  ruleboxTitle: { color: Colors.primary, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  ruleboxText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 22 },
  typeChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  typeChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  typeChipText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  typeChipTextActive: { color: Colors.primary },
  typeOilCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  typeOilLeft: { flex: 1 },
  typeOilName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  typeOilBenefits: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
});
