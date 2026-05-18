import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

function shimColors(c: Palette) {
  return {
    bg: c.bg, card: c.bgCard, cardAlt: c.bgElevated, border: c.border,
    primary: c.primary, gold: c.gold, textPrimary: c.textPrimary,
    textSecondary: c.textSecondary, textMuted: c.textMuted,
    green: c.scoreGood, red: c.scorePoor, blue: c.hydration, teal: '#2DD4BF',
  };
}
type ShimColors = ReturnType<typeof shimColors>;

const TABS = ['Why Zinc', 'Forms', 'For Acne', 'Topical Zinc', 'Zinc + Occlusive'];

const ZINC_FACTS = [
  { fact: 'Zinc is involved in 300+ enzymatic reactions', detail: 'Zinc is one of the most essential trace minerals in human biology — a cofactor for over 300 enzymes across metabolism, immune function, DNA synthesis, and cell signalling. In skin specifically: collagen synthesis (required by prolyl hydroxylase and matrix metalloproteinase regulators), wound healing, sebaceous gland regulation, and immune defence all require zinc.', icon: '⚗️' },
  { fact: 'Zinc deficiency is common and underdiagnosed', detail: 'An estimated 17–20% of the global population is zinc-deficient. Dietary zinc from plant sources (legumes, grains) is bound to phytates that significantly reduce absorption — meaning vegetarian and vegan diets are at highest deficiency risk. Standard blood serum zinc tests are notoriously unreliable for detecting mild to moderate deficiency.', icon: '📊' },
  { fact: 'Zinc is concentrated in the skin', detail: 'The outer epidermis (stratum spinosum) contains 6× more zinc than the dermis, and approximately 12× more than the bloodstream. Zinc concentrates in the skin for good reason: it is required for keratinocyte proliferation and differentiation, sebaceous gland regulation, and antimicrobial defence.', icon: '🔬' },
  { fact: 'Zinc regulates DHT and androgen activity in sebaceous glands', detail: 'Zinc inhibits 5-alpha reductase — the enzyme that converts testosterone to DHT (dihydrotestosterone), the androgen most responsible for sebum overproduction. This is the same mechanism as spironolactone and finasteride, though far less potent. This is why zinc supplementation specifically reduces sebum production in acne studies.', icon: '⚖️' },
  { fact: 'Zinc is essential for wound healing', detail: 'Zinc participates in all 3 phases of wound healing: inflammation (immune cell activation), proliferation (keratinocyte migration, collagen synthesis), and remodelling (MMP regulation). Zinc-deficient individuals heal wounds 40–60% more slowly than zinc-sufficient individuals. Post-acne scarring and PIH resolution both improve with adequate zinc status.', icon: '🩹' },
  { fact: 'Zinc is naturally anti-inflammatory and anti-microbial', detail: 'Zinc directly inhibits the NF-κB inflammatory pathway, reducing production of pro-inflammatory cytokines (IL-1β, IL-6, TNF-α). Topically, zinc inhibits Propionibacterium acnes (C. acnes) and Malassezia. Zinc pyrithione (ZPT) is one of the most effective antifungal ingredients for dandruff and Malassezia folliculitis.', icon: '🛡️' },
];

function buildZincForms(Colors: ShimColors) {
  return [
  { form: 'Zinc Gluconate', bioavailability: 'moderate', dose: '30–50mg elemental zinc', notes: 'Most commonly studied in acne clinical trials. Relatively gentle on digestive system. In the Dreno study, 30mg zinc gluconate showed comparable efficacy to 100mg doxycycline for acne (inflammatory lesion reduction) — a landmark comparison.', color: Colors.blue },
  { form: 'Zinc Bisglycinate', bioavailability: 'high', dose: '25–40mg elemental zinc', notes: 'Chelated form with glycine — significantly improves absorption compared to gluconate or sulfate. Less gastrointestinal irritation than other forms. Preferred form for maximising tissue zinc levels with minimum side effects.', color: Colors.green },
  { form: 'Zinc Picolinate', bioavailability: 'high', dose: '25–30mg elemental zinc', notes: 'Picolinic acid chelate enhances intestinal absorption. Well-studied clinically. Some practitioners prefer this form for dermatological applications specifically.', color: Colors.teal },
  { form: 'Zinc Sulfate', bioavailability: 'low-moderate', dose: '200mg zinc sulfate (≈45mg elemental)', notes: 'The cheapest and most studied form historically. Significant gastrointestinal irritation at therapeutic doses (nausea, stomach upset). Often causes compliance issues. Take with food.', color: Colors.gold },
  { form: 'Zinc Acetate', bioavailability: 'moderate', dose: 'Typically used in topical lozenges', notes: 'More commonly found in topical preparations (lozenges, zinc acetate solution for acne). Topical use for acne: 5.1% zinc acetate solution reduces inflammatory lesions. Used in some prescription topical antibiotic + zinc acetate combination products.', color: Colors.primary },
  { form: 'Zinc Pyrithione (topical only)', bioavailability: 'N/A (topical)', dose: '1–2% in cosmetics', notes: 'Antifungal and antibacterial compound found in anti-dandruff shampoos, Malassezia folliculitis treatments, and seborrheic dermatitis products. Not taken orally. Leave-on or rinse-off application.', color: Colors.blue },
  ];
}

const ZINC_ACNE = [
  { point: 'Clinical evidence: zinc vs antibiotics for acne', detail: 'A landmark randomised controlled trial (Dreno 2001) compared 30mg zinc gluconate vs 100mg doxycycline in 332 acne patients over 12 weeks. Results: doxycycline produced 63% reduction in inflammatory lesions vs 31% for zinc. However, zinc produced no antibiotic resistance, no dysbiosis, and no side effects — making it a meaningful option for mild-moderate acne and for those who cannot use antibiotics.' },
  { point: 'Best for: inflammatory acne and post-acne healing', detail: 'Zinc is most effective for inflammatory papules and pustules (via anti-C.acnes and anti-inflammatory mechanisms) and for post-acne wound healing and scar minimisation. Less effective for comedonal acne (blackheads/whiteheads) — BHA addresses comedones more directly.' },
  { point: 'Dosing and timeline for acne', detail: '30–50mg elemental zinc daily. With food (reduces nausea but also slightly reduces absorption). Take separate from calcium, iron, and copper supplements (they compete for absorption. Take 2 hours apart). Results in acne at 8–12 weeks. Do not exceed 40mg long-term without monitoring copper status (zinc depletes copper with sustained high doses).' },
  { point: 'Copper supplementation when taking zinc long-term', detail: 'Zinc and copper compete for intestinal absorption. Long-term high-dose zinc supplementation (>40mg daily for >3 months) can deplete copper — causing anaemia, fatigue, and impaired collagen synthesis (copper is needed for lysyl oxidase). Add 1–2mg copper daily or use a zinc:copper ratio supplement when supplementing zinc long-term.' },
  { point: 'Diet: highest zinc foods for skin', detail: 'Oysters (highest: 74mg per 100g), beef (8mg/100g), lamb, pumpkin seeds (7.5mg/100g), hemp seeds, crab, lobster. Plant sources: legumes, whole grains, tofu — but all contain phytates that reduce bioavailability by up to 50%. Animal sources provide more bioavailable zinc per gram of food.' },
];

const TOPICAL_ZINC = [
  { product: 'Zinc oxide SPF', use: 'Physical UV blocker — reflects UV rather than absorbing it. Non-irritating, suitable for sensitive and rosacea-prone skin. Also has mild anti-inflammatory and wound-healing properties at the skin surface.', bestFor: 'Daily sun protection, post-procedure, rosacea, acne-prone, sensitive skin' },
  { product: 'Zinc pyrithione cleanser or cream', use: 'Antifungal for Malassezia folliculitis (fungal acne), dandruff, seborrheic dermatitis. Leave on for 2 minutes before rinsing for maximum antifungal contact time. Also mildly antibacterial.', bestFor: 'Malassezia folliculitis, seborrheic dermatitis, dandruff' },
  { product: 'Zinc sulfate/acetate solution (5%)', use: 'Reduces inflammatory acne by inhibiting C. acnes and providing anti-inflammatory action. Found in some prescription topical formulations combined with erythromycin.', bestFor: 'Inflammatory acne — complement to benzoyl peroxide or retinoids' },
  { product: 'Calamine lotion (zinc oxide + iron oxide)', use: 'Cooling, anti-pruritic (anti-itch) topical. Effective for eczema itch, sunburn, insect bites. The zinc oxide provides barrier protection; the iron oxide creates the characteristic pink colour.', bestFor: 'Eczema flares, sunburn, pruritus' },
];

const TALLOW_ZINC = [
  { title: 'Zinc in animal-fat occlusives', body: 'Some animal-fat occlusives contain trace amounts of zinc in their natural composition. While not a significant zinc source (a supplement delivers far more), the trace zinc contributes to wound-healing and anti-inflammatory properties alongside the fatty acids and fat-soluble vitamins.' },
  { title: 'Zinc + an occlusive for acne recovery', body: 'Oral zinc (30–50mg daily) for internal anti-inflammatory and sebum regulation, combined with a lipid-rich occlusive applied topically (barrier repair + palmitoleic acid antimicrobial + vitamin A cell turnover) addresses acne from both internal and external angles. These are complementary, not competing approaches.' },
  { title: 'Post-acne scarring: zinc + occlusive combination', body: 'Zinc accelerates wound healing from the inside (enzyme cofactor for collagen synthesis, cell migration). A lipid-rich occlusive provides vitamin A (retinoid-like activity for skin cell renewal) and vitamin E (lipid antioxidant that reduces oxidative damage in healing tissue). For post-acne PIH and scarring: oral zinc + a PM occlusive addresses both healing speed and scar quality.' },
  { title: 'Zinc for Malassezia + occlusives cautiously', body: 'If Malassezia folliculitis (fungal acne) is suspected, zinc pyrithione treatment should come first. Occlusive oils\' fatty acids (C16–C18) are within Malassezia\'s preferred range, so oil-based occlusives should be paused until Malassezia is cleared. Once cleared, zinc pyrithione maintenance can be used alongside an occlusive cautiously — as the antifungal environment reduces Malassezia regrowth risk.' },
  { title: 'Protocol: zinc deficiency + skin problems', body: 'If you suspect zinc deficiency (poor wound healing, persistent acne, white spots on fingernails, poor taste/smell, hair thinning): supplement zinc bisglycinate 30mg daily with breakfast for 12 weeks. Add 1mg copper supplement. Maintain dietary zinc (oysters, beef) as ongoing maintenance. Add a PM occlusive for topical barrier and retinoid support.' },
];

export default function ZincGuideScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const ZINC_FORMS = useMemo(() => buildZincForms(Colors), [Colors]);
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedFact, setExpandedFact] = useState<number | null>(null);
  const [expandedForm, setExpandedForm] = useState<number | null>(null);
  const [expandedAcne, setExpandedAcne] = useState<number | null>(null);
  const [expandedTopical, setExpandedTopical] = useState<number | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const bioColor = (b: string) => b === 'high' ? Colors.green : b === 'moderate' ? Colors.gold : b === 'low-moderate' ? Colors.primary : Colors.blue;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Zinc for Skin</Text>
        <View style={{ width: 60 }} />
      </Animated.View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>⚗️ Zinc Guide</Text>
        <Text style={styles.heroSub}>The most clinically validated mineral for acne, wound healing, and sebum control. Often the missing piece in routines that are topically intensive but nutritionally incomplete.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={i} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Animated.ScrollView style={[styles.scroll, { opacity: contentAnim }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {activeTab === 0 && (
          <View>
            {ZINC_FACTS.map((f, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedFact(expandedFact === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{f.icon}</Text>
                  <Text style={[styles.cardTitle, { flex: 1 }]}>{f.fact}</Text>
                  <Text style={styles.expandIcon}>{expandedFact === i ? '▲' : '▼'}</Text>
                </View>
                {expandedFact === i && <Text style={styles.cardDetail}>{f.detail}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 1 && (
          <View>
            <Text style={styles.sectionNote}>Not all zinc forms are equal. Bioavailability varies significantly. For skin applications, bisglycinate or picolinate provide the best tissue concentration with minimum side effects.</Text>
            {ZINC_FORMS.map((f, i) => (
              <TouchableOpacity key={i} style={[styles.card, { borderLeftColor: f.color, borderLeftWidth: 3 }]} onPress={() => setExpandedForm(expandedForm === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: f.color }]}>{f.form}</Text>
                    <View style={styles.metaRow}>
                      <View style={[styles.bioBadge, { backgroundColor: bioColor(f.bioavailability) + '22', borderColor: bioColor(f.bioavailability) + '55' }]}>
                        <Text style={[styles.bioText, { color: bioColor(f.bioavailability) }]}>{f.bioavailability} bioavailability</Text>
                      </View>
                    </View>
                    <Text style={styles.doseText}>Dose: {f.dose}</Text>
                  </View>
                  <Text style={styles.expandIcon}>{expandedForm === i ? '▲' : '▼'}</Text>
                </View>
                {expandedForm === i && <Text style={[styles.cardDetail, { marginTop: 10 }]}>{f.notes}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 2 && (
          <View>
            {ZINC_ACNE.map((p, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedAcne(expandedAcne === i ? null : i)} activeOpacity={0.85}>
                <Text style={styles.cardTitle}>{p.point}</Text>
                {expandedAcne === i && <Text style={[styles.cardDetail, { marginTop: 8 }]}>{p.detail}</Text>}
                {expandedAcne !== i && <Text style={styles.tapHint}>Tap to expand ▼</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 3 && (
          <View>
            {TOPICAL_ZINC.map((t, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedTopical(expandedTopical === i ? null : i)} activeOpacity={0.85}>
                <Text style={styles.cardTitle}>{t.product}</Text>
                <Text style={styles.bestForText}>Best for: {t.bestFor}</Text>
                {expandedTopical === i && <Text style={[styles.cardDetail, { marginTop: 8 }]}>{t.use}</Text>}
                {expandedTopical !== i && <Text style={styles.tapHint}>Tap to expand ▼</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 4 && (
          <View>
            <View style={styles.tallowHero}>
              <Text style={styles.tallowHeroTitle}>🌿 Zinc + an Occlusive</Text>
              <Text style={styles.tallowHeroSub}>Zinc and a lipid-rich occlusive work from the inside and outside simultaneously — oral zinc for internal biology, the occlusive for topical barrier and vitamin delivery.</Text>
            </View>
            {TALLOW_ZINC.map((p, i) => (
              <View key={i} style={styles.tallowCard}>
                <Text style={styles.tallowCardTitle}>{p.title}</Text>
                <Text style={styles.tallowCardBody}>{p.body}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ShimColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  backText: { color: c.primary, fontSize: 16 },
  headerTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700' },
  hero: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: c.border },
  heroTitle: { color: c.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 6 },
  heroSub: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  tabScroll: { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: c.border },
  tabRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
  tabActive: { backgroundColor: c.primary + '22', borderColor: c.primary },
  tabText: { color: c.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: c.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionNote: { color: c.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 12, fontStyle: 'italic' },
  card: { backgroundColor: c.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.border, marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardEmoji: { fontSize: 18, marginTop: 2 },
  cardTitle: { color: c.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  cardDetail: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  expandIcon: { color: c.textMuted, fontSize: 12, marginTop: 4 },
  tapHint: { color: c.textMuted, fontSize: 11, marginTop: 4 },
  metaRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  bioBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  bioText: { fontSize: 10, fontWeight: '700' },
  doseText: { color: c.textMuted, fontSize: 12 },
  bestForText: { color: c.textMuted, fontSize: 11, marginTop: 2 },
  tallowHero: { backgroundColor: c.primary + '11', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.primary + '44', marginBottom: 14 },
  tallowHeroTitle: { color: c.primary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  tallowHeroSub: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowCard: { backgroundColor: c.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.border, marginBottom: 10 },
  tallowCardTitle: { color: c.gold, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowCardBody: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  });
}
