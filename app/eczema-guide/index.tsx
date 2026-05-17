import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

function shimColors(c: Palette) {
  return {
    bg: c.bg, card: c.bgCard, cardAlt: c.bgElevated, border: c.border,
    primary: c.primary, gold: c.gold, textPrimary: c.textPrimary,
    textSecondary: c.textSecondary, textMuted: c.textMuted,
    green: c.scoreGood, red: c.scorePoor, blue: c.hydration, purple: c.darkCircles,
    teal: '#2DD4BF',
  };
}

const TABS = [
  { id: 'science', label: 'What Is It?', icon: '🔬' },
  { id: 'triggers', label: 'Triggers', icon: '⚠️' },
  { id: 'skincare', label: 'Skincare', icon: '🧴' },
  { id: 'flare', label: 'Flare Protocol', icon: '🆘' },
  { id: 'tallow', label: 'Tallow Approach', icon: '🌿' },
];

const SCIENCE = [
  {
    title: 'What eczema (atopic dermatitis) actually is',
    content: 'Atopic dermatitis is a chronic inflammatory skin condition with a genetic component (FLG gene mutations causing filaggrin deficiency). Filaggrin is a protein that holds the skin barrier together — without it, the barrier is leaky, allowing allergens and irritants to penetrate and triggering immune overreaction.',
  },
  {
    title: 'The atopic triad',
    content: 'Eczema often coexists with asthma and allergic rhinitis (hay fever) — this cluster is called the "atopic triad." All three are immune dysregulation conditions. The gut-skin-lung axis connects them: healing the gut microbiome can improve all three.',
  },
  {
    title: 'Why it flares',
    content: 'Eczema flares when allergens, irritants, or microbial antigens penetrate the compromised barrier, triggering a Th2-dominant immune response that causes itching, inflammation, and further barrier damage — creating a cycle.',
  },
  {
    title: 'Staphylococcus aureus — the key aggravator',
    content: 'S. aureus colonizes eczema skin in up to 90% of patients (vs ~20% of non-eczema skin). S. aureus secretes toxins that trigger Th2 inflammation, driving flares. Treatments targeting S. aureus (bleach baths, antibacterial washes) are evidence-based for eczema management.',
  },
  {
    title: 'The itch-scratch cycle',
    content: 'Itching damages the barrier further. Scratching releases more inflammatory signals. This cycle perpetuates flares. Breaking the itch-scratch cycle with barrier repair and anti-pruritics is as important as treating inflammation itself.',
  },
  {
    title: 'Gut microbiome connection',
    content: 'Lower microbial diversity in the gut is associated with higher eczema severity. Probiotic supplementation (particularly Lactobacillus rhamnosus GG) in infancy and during maternal pregnancy has shown clinical reduction in eczema incidence.',
  },
];

const TRIGGERS = [
  { trigger: 'Sodium lauryl sulfate (SLS) detergents', icon: '🧼', detail: 'SLS directly disrupts the already-compromised eczema skin barrier. Found in most commercial cleansers, shampoos, and body washes. Switch to SLS-free alternatives immediately.' },
  { trigger: 'Fragrance (synthetic and natural)', icon: '🌸', detail: 'Fragrance is the most common contact allergen in eczema. This includes "natural" fragrance from essential oils. Choose fragrance-free everything: detergent, moisturizer, cleansers, fabric softener.' },
  { trigger: 'Wool and synthetic fabrics', icon: '👕', detail: 'Wool fibers physically irritate eczema skin. Synthetic fabrics (polyester, nylon) trap heat and sweat. Choose 100% cotton, bamboo, or silk against eczema-affected skin.' },
  { trigger: 'Hard water', icon: '💧', detail: 'High calcium content in hard water directly worsens eczema by disrupting barrier function and increasing S. aureus colonization. Water softener or Vitamin C rinse are meaningful interventions.' },
  { trigger: 'Stress', icon: '😰', detail: 'Psychological stress activates neuropeptides that trigger mast cell degranulation in the skin, causing immediate itch and subsequent flare. Stress management is clinical eczema management.' },
  { trigger: 'Sweat and heat', icon: '🌡️', detail: 'Sweat contains antimicrobial peptides but also irritates eczema skin when it pools. Exercise-induced heat triggers vasodilation and itch. Shower with cool water immediately after exercise.' },
  { trigger: 'Allergens (pets, dust mites, pollen)', icon: '🐱', detail: 'Inhalant allergens worsen eczema even without skin contact. Dust mite reduction (allergen covers, regular washing at 60°C) is one of the most impactful environmental interventions.' },
  { trigger: 'Food triggers (individual)', icon: '🥛', detail: 'True food allergy triggers eczema in ~30% of children; less common in adults. Common culprits: cow\'s milk, egg, peanut, soy. Food allergy testing (IgE panel) is useful for severe cases.' },
  { trigger: 'Scratching', icon: '😣', detail: 'Scratching worsens the barrier, introduces bacteria (S. aureus on nails), and releases more inflammatory signals. Breaking the itch-scratch cycle is the mechanical challenge of eczema management.' },
];

const SKINCARE_GUIDE = {
  doUse: [
    { name: 'Ceramide-containing moisturizers', note: 'Ceramides directly repair the filaggrin-deficient barrier. CeraVe, Eucerin, and similar ceramide-heavy formulas are dermatologist first-line recommendations.' },
    { name: 'Colloidal oatmeal', note: 'Anti-inflammatory, anti-itch, and protective. Colloidal oatmeal baths are evidence-based for acute flares. Also effective as a daily lotion ingredient.' },
    { name: 'Petrolatum (as pure as possible)', note: 'One of the most effective barrier occlusives. Used as "wet wrap therapy" on top of corticosteroid creams during flares.' },
    { name: 'Coconut oil (specific use — antimicrobial)', note: 'Lauric acid in coconut oil reduces S. aureus colonization. However, it is comedogenic — appropriate for body eczema, not facial eczema in acne-prone individuals.' },
    { name: 'Bleach baths (sodium hypochlorite, 0.005%)', note: 'Dilute bleach baths (1 teaspoon per gallon of water) reduce S. aureus colonization. Evidence-based by multiple dermatology organizations.' },
    { name: 'Tallow (see Tallow tab)', note: 'Biocompatible fatty acid profile, natural anti-inflammatory properties, no synthetic preservatives or fragrance. See dedicated tab.' },
  ],
  avoid: [
    { name: 'Fragrance (all forms)', note: 'Most common eczema contact allergen. No exceptions — fragrance-free only.' },
    { name: 'SLS / SLES / sodium lauryl sulfate', note: 'Strips lipids from an already lipid-deficient barrier. Found in most foaming products.' },
    { name: 'Alcohol-based products (ethanol, isopropyl)', note: 'Denatures proteins and dehydrates the skin barrier. Especially damaging on eczema skin.' },
    { name: 'Essential oils', note: 'Commonly sensitizing even when "natural." Linalool, limonene, geraniol are all known eczema triggers.' },
    { name: 'Physical exfoliants', note: 'Mechanical friction tears the compromised eczema barrier and risks introducing bacteria.' },
    { name: 'Retinol during active flares', note: 'Retinoids increase skin turnover and thin the epidermis — temporarily worsening barrier function. Avoid during flares; possible during remission with extreme caution.' },
    { name: 'Formaldehyde-releasing preservatives', note: 'DMDM hydantoin, imidazolidinyl urea, quaternium-15 — common eczema sensitizers found in some "natural" products.' },
  ],
};

const FLARE_PROTOCOL = [
  { step: 'Step 1: Cool shower or bath (15 min, tepid water)', note: 'Hydrates the skin by rehydrating the stratum corneum. Avoid hot water — it worsens itch and causes vasodilation.' },
  { step: 'Step 2: Pat (do not rub) dry with clean cotton towel', note: 'Rubbing causes friction damage. Leave skin slightly damp.' },
  { step: 'Step 3: Apply prescribed topical corticosteroid (if prescribed)', note: 'Apply within 3 minutes of bathing on affected areas only, while skin is still damp. Follow your dermatologist\'s protocol.' },
  { step: 'Step 4: Apply heavy emollient/barrier repair immediately after', note: 'Ceramide cream, tallow balm, or petrolatum over the steroid. This is the "soak and seal" method — proven to maximize steroid efficacy and reduce the amount needed.' },
  { step: 'Step 5: Colloidal oatmeal bath for full-body flares', note: '15–20 min oatmeal bath reduces inflammation and itch. Follow with immediate moisturization on exit.' },
  { step: 'Step 6: Cold pack or ice for immediate itch relief', note: 'Cold temporarily inhibits itch signals. Apply wrapped ice pack (never direct ice) for 10 minutes to itchiest areas.' },
  { step: 'Step 7: Cotton gloves overnight', note: 'Prevents scratch damage during sleep (unconscious scratching is responsible for much eczema progression). Wear after applying barrier treatment.' },
  { step: 'Step 8: See dermatologist if infected (weeping, crusting, fever)', note: 'Infected eczema requires oral or topical antibiotics. S. aureus infection can spread rapidly on compromised eczema skin — do not delay treatment.' },
];

export default function EczemaGuideScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [activeTab, setActiveTab] = useState('science');
  const [expandedTrigger, setExpandedTrigger] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Eczema Guide</Text>
        <View style={{ width: 60 }} />
      </View>

      <LinearGradient colors={['#2DD4BF22', '#0A0A0F']} style={styles.hero}>
        <Text style={styles.heroEmoji}>🌊</Text>
        <Text style={styles.heroTitle}>Eczema (Atopic Dermatitis)</Text>
        <Text style={styles.heroSub}>Understanding the barrier condition and managing it effectively</Text>
      </LinearGradient>

      <View style={styles.tabRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {TABS.map(t => (
            <TouchableOpacity key={t.id} style={[styles.tabChip, activeTab === t.id && styles.tabChipActive]} onPress={() => setActiveTab(t.id)}>
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === t.id && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {activeTab === 'science' && SCIENCE.map((item, i) => (
          <View key={i} style={styles.sciCard}>
            <Text style={styles.sciTitle}>{item.title}</Text>
            <Text style={styles.sciContent}>{item.content}</Text>
          </View>
        ))}

        {activeTab === 'triggers' && TRIGGERS.map((item, i) => (
          <TouchableOpacity key={i} style={styles.triggerCard} onPress={() => setExpandedTrigger(expandedTrigger === i ? null : i)} activeOpacity={0.8}>
            <View style={styles.triggerHeader}>
              <Text style={styles.triggerIcon}>{item.icon}</Text>
              <Text style={styles.triggerName}>{item.trigger}</Text>
              <Text style={styles.expandIcon}>{expandedTrigger === i ? '▲' : '▼'}</Text>
            </View>
            {expandedTrigger === i && <Text style={styles.triggerDetail}>{item.detail}</Text>}
          </TouchableOpacity>
        ))}

        {activeTab === 'skincare' && (
          <>
            <View style={styles.ingredientSection}>
              <Text style={styles.sectionTitle}>✅ Use for Eczema Skin</Text>
              {SKINCARE_GUIDE.doUse.map((item, i) => (
                <View key={i} style={styles.ingredientCard}>
                  <Text style={styles.ingredientName}>{item.name}</Text>
                  <Text style={styles.ingredientNote}>{item.note}</Text>
                </View>
              ))}
            </View>
            <View style={styles.ingredientSection}>
              <Text style={[styles.sectionTitle, { color: Colors.red }]}>🚫 Avoid with Eczema</Text>
              {SKINCARE_GUIDE.avoid.map((item, i) => (
                <View key={i} style={[styles.ingredientCard, { borderColor: Colors.red + '33' }]}>
                  <Text style={styles.ingredientName}>{item.name}</Text>
                  <Text style={styles.ingredientNote}>{item.note}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'flare' && (
          <>
            <View style={styles.flareAlert}>
              <Text style={styles.flareAlertTitle}>🆘 During a Flare</Text>
              <Text style={styles.flareAlertText}>Follow these steps immediately. Flares are best managed in the first 24–48 hours — delay worsens severity and duration.</Text>
            </View>
            {FLARE_PROTOCOL.map((step, i) => (
              <View key={i} style={styles.flareStep}>
                <View style={styles.flareNum}>
                  <Text style={styles.flareNumText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.flareStepName}>{step.step}</Text>
                  <Text style={styles.flareStepNote}>{step.note}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === 'tallow' && (
          <>
            <View style={styles.tallowIntro}>
              <Text style={styles.tallowIntroText}>
                Tallow has historically been used on eczema-affected skin and is gaining attention among eczema communities. Here is an honest assessment of the evidence and practical approach.
              </Text>
            </View>
            {[
              {
                title: 'Why tallow may help',
                detail: "Grass-fed tallow's fatty acid profile (oleic, stearic, palmitoleic, palmitic) closely matches the lipids that eczema skin is deficient in. Applying these biocompatible lipids directly to the skin can partially compensate for the filaggrin deficiency that allows barrier leakiness.",
              },
              {
                title: 'No synthetic preservatives — a critical advantage',
                detail: 'Most conventional eczema moisturizers contain parabens, phenoxyethanol, or formaldehyde-releasing preservatives — all known eczema sensitizers. Pure tallow contains none of these. This alone makes it worth trialing for those who react to conventional products.',
              },
              {
                title: 'Palmitoleic acid\'s antimicrobial role',
                detail: 'Palmitoleic acid in tallow (5–8%) has demonstrated antimicrobial activity against S. aureus in research. Since S. aureus colonization drives eczema flares in 90% of patients, reducing colonization is clinically meaningful.',
              },
              {
                title: 'Vitamin D in tallow',
                detail: 'Eczema patients consistently show lower Vitamin D levels. Tallow contains cholecalciferol (Vitamin D3) — the same form used in supplements. Topical Vitamin D has been studied as a complementary eczema treatment.',
              },
              {
                title: 'How to introduce carefully',
                detail: 'Apply a tiny amount (pinhead-sized) to a small inner arm patch. Wait 24 hours before expanding. Introduce during remission only, not during active flare. If reaction occurs, discontinue. Patch test is essential — even natural products can sensitize.',
              },
              {
                title: 'What tallow cannot replace',
                detail: "Tallow is a barrier support, not a substitute for prescribed topical corticosteroids or immunomodulators (tacrolimus, dupilumab) during active eczema. Always follow your dermatologist's medical protocol. Use tallow as a complementary barrier repair product, not as a replacement for medical treatment.",
                caution: true,
              },
            ].map((item, i) => (
              <View key={i} style={[styles.tallowCard, item.caution && { borderColor: Colors.gold + '66' }]}>
                {item.caution && <Text style={styles.cautionLabel}>⚠️ IMPORTANT</Text>}
                <Text style={styles.tallowCardTitle}>{item.title}</Text>
                <Text style={styles.tallowCardDetail}>{item.detail}</Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: Palette) {
  const Colors = shimColors(c);
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  backText: { color: Colors.primary, fontSize: 16 },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  hero: { margin: 16, marginBottom: 4, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.teal + '44', alignItems: 'center' },
  heroEmoji: { fontSize: 36, marginBottom: 6 },
  heroTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  heroSub: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  tabRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  tabChipActive: { borderColor: Colors.teal, backgroundColor: Colors.teal + '22' },
  tabIcon: { fontSize: 13 },
  tabLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: Colors.teal },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  sciCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  sciTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  sciContent: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  triggerCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  triggerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  triggerIcon: { fontSize: 18 },
  triggerName: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  expandIcon: { color: Colors.textMuted, fontSize: 12 },
  triggerDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  ingredientSection: { marginBottom: 16 },
  sectionTitle: { color: Colors.green, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  ingredientCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  ingredientName: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  ingredientNote: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  flareAlert: { backgroundColor: Colors.red + '15', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.red + '44', marginBottom: 16 },
  flareAlertTitle: { color: Colors.red, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  flareAlertText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  flareStep: { flexDirection: 'row', gap: 12, backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  flareNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.teal + '22', alignItems: 'center', justifyContent: 'center' },
  flareNumText: { color: Colors.teal, fontSize: 13, fontWeight: '700' },
  flareStepName: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  flareStepNote: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  tallowIntro: { backgroundColor: Colors.primary + '15', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.primary + '44', marginBottom: 14 },
  tallowIntroText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 21, fontStyle: 'italic' },
  tallowCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  cautionLabel: { color: Colors.gold, fontSize: 11, fontWeight: '700', marginBottom: 6 },
  tallowCardTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowCardDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  });
}
