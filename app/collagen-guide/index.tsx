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

const TABS = ['Collagen Science', 'Types', 'What Destroys It', 'Build It', 'Lipids & Collagen'];

const COLLAGEN_SCIENCE = [
  { fact: 'Collagen is 75% of the dry weight of skin', detail: 'The dermis is predominantly collagen — a fibrous protein network that provides tensile strength, volume, and structural support to the skin. Without adequate collagen density and cross-linking, skin cannot maintain its firmness and resistance to mechanical deformation.', icon: '🏗️' },
  { fact: 'Production declines 1% per year after age 25', detail: 'Starting from peak collagen density in the mid-20s, the body produces approximately 1% less collagen per year. By age 50, this represents a 25% reduction in baseline collagen density — contributing significantly to skin thinning, wrinkle formation, and loss of volume.', icon: '📉' },
  { fact: 'Collagen synthesis requires a precise nutrient sequence', detail: 'Collagen synthesis is a multi-step process: fibroblasts synthesise procollagen chains → hydroxylation of proline and lysine requires vitamin C as cofactor → chains fold into triple helix → cross-linking requires copper-dependent lysyl oxidase → mature collagen fibres form. Deficiency at any step breaks the chain.', icon: '🧬' },
  { fact: 'The triple helix gives collagen its strength', detail: 'Three polypeptide chains wind around each other in a right-handed triple helix — a structure unique to collagen in biology. This architecture gives collagen exceptional tensile strength: gram for gram, type I collagen is stronger than steel. The hydroxyproline residues critical to this structure require vitamin C to form.', icon: '🌀' },
  { fact: 'Collagen breakdown products signal new synthesis', detail: 'When collagen is degraded by MMPs (collagen-degrading enzymes), the fragments signal fibroblasts to produce new collagen. This feedback loop is the mechanism behind both micro-needling (controlled collagen destruction triggering synthesis) and collagen peptide supplementation (feeding the collagen fragment signal).', icon: '🔄' },
  { fact: 'Type I vs III: different roles in skin aging', detail: 'Type I collagen: the dominant adult collagen — rigid, high tensile strength. Type III collagen: "young" collagen — more flexible, abundant in newborn skin. The ratio shifts toward type I with age as type III production declines faster. This loss of type III collagen flexibility contributes to skin rigidity and fine line formation.', icon: '📊' },
  { fact: 'Sun exposure is the primary collagen destroyer', detail: 'UVA activates matrix metalloproteinases (MMPs) — specifically MMP-1 (interstitial collagenase) and MMP-3 (stromelysin). Each UV dose creates a brief MMP activation event that irreversibly degrades a small amount of collagen. Decades of daily UVA exposure accumulates this damage. SPF + antioxidants directly prevent this.', icon: '☀️' },
];

function buildCollagenTypes(Colors: ShimColors) {
  return [
  { type: 'Type I', location: 'Skin dermis, tendons, bone, scar tissue', proportion: '~80% of skin collagen', function: 'Tensile strength and structural integrity. The primary aging-related collagen — loss of type I creates wrinkles and skin laxity.', stimulate: 'Retinoids, vitamin C, laser, microneedling', color: Colors.gold },
  { type: 'Type III', location: 'Skin dermis (especially foetal and young skin), blood vessels, hollow organs', proportion: '~15% of skin collagen, higher in youth', function: '"Young" collagen — more elastic and flexible than type I. Provides skin\'s youthful bounce. Declines faster with age than type I.', stimulate: 'Retinoids (more effectively than type I), vitamin C, growth factors', color: Colors.blue },
  { type: 'Type IV', location: 'Basement membrane (between epidermis and dermis)', proportion: 'Structural component, not fibrous', function: 'Network-forming collagen that anchors epidermis to dermis. Critical for skin barrier integrity and wound healing speed.', stimulate: 'Matrixyl 3000 (palmitoyl tetrapeptide-7), vitamin C', color: Colors.teal },
  { type: 'Type VII', location: 'Anchoring fibrils at dermal-epidermal junction', proportion: 'Small but critical quantity', function: 'Binds type I collagen to the basement membrane. Loss of type VII collagen is implicated in blistering conditions (epidermolysis bullosa).', stimulate: 'Limited topical options. Vitamin C supports baseline production.', color: Colors.green },
  ];
}

const DESTROYERS = [
  { destroyer: 'UV radiation (UVA)', mechanism: 'Activates MMP-1 (collagenase) and MMP-3 with each UV exposure. These enzymes cleave collagen fibres irreversibly. Cumulative UV is the single largest extrinsic collagen destroyer.', prevention: 'SPF + topical antioxidants (vitamin C, E, ferulic). This is the non-negotiable intervention.', severity: 'critical', icon: '☀️' },
  { destroyer: 'Sugar / glycation', mechanism: 'Advanced glycation end products (AGEs) form when glucose bonds to collagen and elastin molecules. AGE-modified collagen becomes stiff, brittle, and yellow-brown. These cross-links cannot be reversed by any current skincare. Glycation is permanent.', prevention: 'Low-glycaemic diet. Topical aminoguanidine, carnosine (anti-glycation ingredients). Avoid cooking methods that produce dietary AGEs (high-heat, dry methods).', severity: 'critical', icon: '🍬' },
  { destroyer: 'Smoking', mechanism: 'Cigarette smoke generates massive free radical burden that depletes vitamin C (needed for collagen synthesis) and directly activates MMP-mediated collagen breakdown. Also causes hypoxia in dermal tissue, impairing fibroblast function.', prevention: 'Cessation. No topical intervention compensates for smoking at any meaningful level.', severity: 'critical', icon: '🚬' },
  { destroyer: 'Cortisol / chronic stress', mechanism: 'Cortisol directly inhibits collagen synthesis in fibroblasts. Chronic stress = chronically elevated cortisol = reduced collagen production rate. Also increases oxidative stress, worsening MMP activation.', prevention: 'Stress management. Sleep. Exercise reduces cortisol. Adaptogenic herbs (ashwagandha) show modest cortisol-reducing effects.', severity: 'high', icon: '😰' },
  { destroyer: 'Nutritional deficiency', mechanism: 'Vitamin C deficiency prevents hydroxyproline formation → structurally weak collagen that breaks down easily. Copper deficiency impairs lysyl oxidase (cross-linking enzyme) → weak, uncrosslinked collagen fibres. Zinc deficiency slows procollagen synthesis.', prevention: 'Adequate dietary vitamin C (bell peppers, citrus), copper (organ meats, oysters, shellfish), zinc (oysters, beef).', severity: 'high', icon: '🥗' },
  { destroyer: 'Over-exfoliation and barrier damage', mechanism: 'Repeated disruption of the stratum corneum triggers chronic inflammatory signalling that activates MMPs in the dermis. Paradoxically, too much exfoliation (especially with strong acids) generates the same MMP activation as UV — destroying the collagen the exfoliation is meant to help reveal.', prevention: 'Limit exfoliation frequency. Barrier repair with a lipid-rich or ceramide moisturiser after each exfoliation session.', severity: 'moderate', icon: '⚗️' },
];

const BUILD_IT = [
  { category: 'Topical', items: [
    { name: 'Retinoids (tretinoin/retinol)', why: 'The most clinically validated topical collagen stimulant. Retinoids upregulate type I and III procollagen mRNA expression and inhibit MMP-1. Even 0.025% tretinoin over 3 months produces measurable collagen density increase. The primary anti-aging intervention.', strength: 'very strong' },
    { name: 'Vitamin C 10–20%', why: 'Essential cofactor for prolyl hydroxylase — the enzyme that hydroxylates proline in collagen chains. Without adequate vitamin C, collagen chains cannot form the stable triple helix structure. Applied topically, vitamin C achieves skin concentrations that stimulate collagen synthesis.', strength: 'strong' },
    { name: 'Peptides (Matrixyl, GHK-Cu)', why: 'Signal peptides mimic collagen breakdown fragments and signal fibroblasts to produce more collagen. GHK-Cu (copper peptide) additionally provides the copper needed for lysyl oxidase cross-linking activity. Evidence is independent-study-supported (not just manufacturer data) for key peptides.', strength: 'moderate-strong' },
    { name: 'Niacinamide 5%', why: 'Upregulates type I collagen mRNA expression (by ~54% in one study at 5% over 12 weeks) and reduces UV-mediated collagen breakdown through anti-MMP activity. Also complements retinoids by reducing their irritation.', strength: 'moderate' },
  ]},
  { category: 'Dietary', items: [
    { name: 'Collagen peptide supplementation', why: '10–20g hydrolysed collagen daily. Clinical trials show improvement in skin elasticity and hydration at 8 weeks. Hydroxyproline-containing dipeptides absorbed intact and signal fibroblast collagen synthesis. Choose marine or bovine collagen (both type I and III).', strength: 'moderate' },
    { name: 'Bone broth', why: 'Contains gelatin (cooked collagen), proline, hydroxyproline, and glycine — all collagen amino acids. Also contains minerals (zinc, copper, manganese) needed for collagen synthesis enzymes. The ancestral collagen-supporting food.', strength: 'moderate' },
    { name: 'Vitamin C from food', why: 'Bell peppers, citrus, kiwi, broccoli. Adequate vitamin C is the prerequisite for all collagen synthesis — without it, even the best topicals cannot produce structurally sound collagen. Internal supplementation directly supports fibroblast collagen output.', strength: 'strong (foundational)' },
    { name: 'Copper from diet', why: 'Oysters, organ meats, shellfish, sesame seeds. Copper is the essential cofactor for lysyl oxidase — the enzyme that cross-links collagen fibres into stable networks. Without crosslinking, individual collagen chains cannot form the strong fibre architecture.', strength: 'strong (foundational)' },
  ]},
  { category: 'Professional', items: [
    { name: 'Microneedling', why: 'Creates controlled micro-injuries that trigger a wound-healing response. Fibroblasts produce new collagen I, III, and IV to repair the treatment sites. Effects are cumulative across sessions. 3–6 sessions monthly then maintenance every 3–6 months.', strength: 'strong' },
    { name: 'Laser (fractional CO2, Fraxel)', why: 'Ablative lasers create thermal injury in the dermis. The wound healing response produces new collagen for 3–6 months after treatment. The most dramatic topical collagen induction available outside of surgery.', strength: 'very strong' },
    { name: 'Radio frequency (RF)', why: 'RF heats dermal collagen to 40–50°C. This causes immediate collagen contraction (visible skin tightening) and triggers a fibroblast proliferation response that produces new collagen over 2–6 months. Monopolar RF (Thermage) has the most evidence.', strength: 'strong' },
  ]},
];

const TALLOW_COLLAGEN = [
  { title: 'Vitamin A (retinyl esters): the gentle collagen stimulant', body: 'Some lipid occlusives contain vitamin A in retinyl-ester form — the same basic form as cosmetic retinol, but at lower activity. In skin, retinyl esters convert to retinol, then to retinoic acid (the active form). The conversion is slow and mild — producing retinoid-receptor activation without the irritation of higher-concentration retinol formulations. Applied PM, such an occlusive provides gentle daily retinoid stimulation for collagen gene upregulation.' },
  { title: 'Amino acids that support the collagen substrate pool', body: 'Some natural animal-fat occlusives contain small amounts of free amino acids, including glycine and proline — two of the most abundant amino acids in collagen. Dietary intake matters more than topical (penetration limits), but pairing topical retinoid-like activity with amino-acid substrate support in one ingredient is a useful combination.' },
  { title: 'Trace minerals support collagen synthesis enzymes', body: 'Some animal-fat occlusives contain modest amounts of zinc (far less than a zinc supplement). Zinc is a cofactor for several metalloenzymes in collagen synthesis — including collagenase-inhibitor proteins that regulate collagen breakdown. With small amounts of copper, this provides useful trace-mineral cofactors.' },
  { title: 'Barrier integrity enables retinoid and peptide efficacy', body: 'Collagen-stimulating actives (retinol, vitamin C, peptides) must penetrate the stratum corneum to reach fibroblasts in the dermis. A compromised barrier reduces this penetration. A lipid occlusive\'s barrier-repairing function — by restoring the three-lipid system of the stratum corneum — indirectly improves the efficacy of collagen-stimulating actives applied to the skin.' },
  { title: 'Recommended collagen protocol', body: 'AM: vitamin C serum → SPF (prevents collagen breakdown via MMP inhibition). PM: retinol serum (on dry skin, 20 min) → a lipid-rich occlusive (vitamin A + E, barrier repair). Weekly: collagen peptide supplement (10–20g) + dietary vitamin C and copper-rich foods. This covers topical stimulation, topical protection, and dietary substrate provision simultaneously.' },
];

export default function CollagenGuideScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const COLLAGEN_TYPES = useMemo(() => buildCollagenTypes(Colors), [Colors]);
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedFact, setExpandedFact] = useState<number | null>(null);
  const [expandedType, setExpandedType] = useState<number | null>(null);
  const [expandedDestroyer, setExpandedDestroyer] = useState<number | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const severityColor = (s: string) => s === 'critical' ? Colors.red : s === 'high' ? Colors.primary : Colors.gold;
  const strengthColor = (s: string) => s.includes('very strong') ? Colors.green : s === 'strong' || s === 'strong (foundational)' ? Colors.teal : Colors.gold;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Collagen Guide</Text>
        <View style={{ width: 60 }} />
      </Animated.View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>🏗️ Collagen Science</Text>
        <Text style={styles.heroSub}>Collagen is the structural protein your skin is built from. Understanding how to protect and stimulate it is the foundation of every effective anti-aging strategy.</Text>
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
            {COLLAGEN_SCIENCE.map((f, i) => (
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
            <Text style={styles.sectionNote}>There are 28 types of collagen — but these 4 are most relevant to skin aging and skincare intervention.</Text>
            {COLLAGEN_TYPES.map((t, i) => (
              <TouchableOpacity key={i} style={[styles.card, { borderLeftColor: t.color, borderLeftWidth: 3 }]} onPress={() => setExpandedType(expandedType === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardTitle, { flex: 1, color: t.color }]}>{t.type}</Text>
                  <Text style={styles.expandIcon}>{expandedType === i ? '▲' : '▼'}</Text>
                </View>
                <Text style={styles.proportionText}>{t.proportion} · {t.location}</Text>
                {expandedType === i && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.cardDetail}>{t.function}</Text>
                    <View style={styles.stimBlock}>
                      <Text style={styles.stimLabel}>How to stimulate</Text>
                      <Text style={styles.stimText}>{t.stimulate}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 2 && (
          <View>
            {DESTROYERS.map((d, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedDestroyer(expandedDestroyer === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{d.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{d.destroyer}</Text>
                    <View style={[styles.severityBadge, { backgroundColor: severityColor(d.severity) + '22', borderColor: severityColor(d.severity) + '55' }]}>
                      <Text style={[styles.severityText, { color: severityColor(d.severity) }]}>{d.severity.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.expandIcon}>{expandedDestroyer === i ? '▲' : '▼'}</Text>
                </View>
                {expandedDestroyer === i && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.cardDetail}>{d.mechanism}</Text>
                    <View style={styles.preventBlock}>
                      <Text style={styles.preventLabel}>Prevention</Text>
                      <Text style={styles.preventText}>{d.prevention}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 3 && (
          <View>
            {BUILD_IT.map((cat, i) => (
              <View key={i} style={{ marginBottom: 16 }}>
                <Text style={styles.catLabel}>{cat.category}</Text>
                {cat.items.map((item, j) => (
                  <View key={j} style={styles.buildCard}>
                    <View style={styles.buildHeader}>
                      <Text style={styles.buildName}>{item.name}</Text>
                      <View style={[styles.strengthBadge, { backgroundColor: strengthColor(item.strength) + '22', borderColor: strengthColor(item.strength) + '55' }]}>
                        <Text style={[styles.strengthText, { color: strengthColor(item.strength) }]}>{item.strength}</Text>
                      </View>
                    </View>
                    <Text style={styles.buildWhy}>{item.why}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {activeTab === 4 && (
          <View>
            <View style={styles.tallowHero}>
              <Text style={styles.tallowHeroTitle}>🌿 Lipids & Collagen</Text>
              <Text style={styles.tallowHeroSub}>Lipid-rich occlusives can support collagen health through vitamin A (retinoid-like activity), barrier support (enabling active penetration), and trace-mineral cofactors.</Text>
            </View>
            {TALLOW_COLLAGEN.map((p, i) => (
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
  proportionText: { color: c.textMuted, fontSize: 12, marginTop: 2 },
  stimBlock: { marginTop: 10, backgroundColor: c.green + '0D', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: c.green + '33' },
  stimLabel: { color: c.green, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  stimText: { color: c.textSecondary, fontSize: 12, lineHeight: 18 },
  severityBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginTop: 2 },
  severityText: { fontSize: 10, fontWeight: '700' },
  preventBlock: { marginTop: 10, backgroundColor: c.teal + '0D', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: c.teal + '33' },
  preventLabel: { color: c.teal, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  preventText: { color: c.textSecondary, fontSize: 12, lineHeight: 18 },
  catLabel: { color: c.gold, fontSize: 15, fontWeight: '800', marginBottom: 10 },
  buildCard: { backgroundColor: c.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.border, marginBottom: 10 },
  buildHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 },
  buildName: { color: c.textPrimary, fontSize: 13, fontWeight: '700', flex: 1 },
  strengthBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, flexShrink: 0 },
  strengthText: { fontSize: 10, fontWeight: '700' },
  buildWhy: { color: c.textSecondary, fontSize: 12, lineHeight: 18 },
  tallowHero: { backgroundColor: c.primary + '11', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.primary + '44', marginBottom: 14 },
  tallowHeroTitle: { color: c.primary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  tallowHeroSub: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowCard: { backgroundColor: c.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.border, marginBottom: 10 },
  tallowCardTitle: { color: c.gold, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowCardBody: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  });
}
