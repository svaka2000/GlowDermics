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
    green: c.scoreGood, red: c.scorePoor, blue: c.hydration,
    purple: c.darkCircles, teal: '#2DD4BF',
  };
}
type ShimColors = ReturnType<typeof shimColors>;

const TABS = ['What Are Peptides', 'Types', 'Top Peptides', 'How to Use', 'Lipids & Peptides'];

const INTRO_FACTS = [
  { fact: 'Peptides are short chains of amino acids', detail: 'Amino acids linked in sequences of 2–50 form peptides. The skin\'s most important structural proteins — collagen (triple helix), elastin, and fibronectin — are all made from specific amino acid sequences. Peptides signal cells and act as building blocks.', icon: '🔗' },
  { fact: 'Collagen breakdown produces signalling peptides', detail: 'When collagen degrades (from age, UV, MMPs), the fragments act as signals. The skin "reads" collagen fragments as damage signals and accelerates new collagen synthesis in response. Synthetic peptides mimic these signals to trick the skin into producing more collagen without actual damage.', icon: '📡' },
  { fact: 'Skin peptide levels decline ~1% per year after 25', detail: 'Natural collagen production declines approximately 1% per year from age 25. By 50, collagen levels are approximately 25% lower. Simultaneously, MMP (collagen-degrading enzyme) activity increases with UV exposure. Topical peptides cannot fully reverse this but can measurably slow the decline.', icon: '📉' },
  { fact: 'Penetration is the main challenge', detail: 'Large peptides cannot penetrate the stratum corneum — the barrier that keeps things out. Effective peptide formulations use delivery systems: penetration enhancers (fatty acids, liposomes), acetylation, or small enough molecular weight. This is why peptide product quality varies so dramatically.', icon: '🔑' },
  { fact: 'Peptides have no "active form" requirement', detail: 'Unlike retinol (needs conversion to retinoic acid) or vitamin C (needs specific pH), peptides are active as-applied — no conversion required. This makes them stable, gentle, and compatible with almost all other actives.', icon: '✅' },
  { fact: 'Clinical evidence varies widely by specific peptide', detail: 'Some peptides have robust double-blind clinical trial data (Matrixyl 3000, Argireline, copper peptides). Others are proprietary ingredients with only in-vitro or manufacturer-funded data. Understanding which specific peptides are in a product matters more than "contains peptides" marketing.', icon: '📊' },
];

function buildPeptideTypes(Colors: ShimColors) {
  return [
  {
    type: 'Signal Peptides',
    color: Colors.blue,
    icon: '📡',
    mechanism: 'Communicate with fibroblasts and keratinocytes to upregulate collagen, elastin, hyaluronic acid, or fibronectin production. They do not provide the building blocks themselves — they instruct the cell to make more.',
    examples: ['Matrixyl (palmitoyl pentapeptide-4)', 'Matrixyl 3000 (palmitoyl tripeptide-1 + palmitoyl tetrapeptide-7)', 'Syn-Coll (palmitoyl tripeptide-5)', 'Leuphasyl'],
    bestFor: 'Anti-aging: fine lines, loss of firmness, skin laxity',
    evidence: 'strong',
  },
  {
    type: 'Neurotransmitter Inhibitor Peptides',
    color: Colors.purple,
    icon: '⚡',
    mechanism: 'Block acetylcholine release at the neuromuscular junction — the same mechanism as Botulinum toxin (Botox), but topically and far less potently. Reduce repetitive muscle contractions that deepen expression lines. Sometimes called "Botox-like peptides."',
    examples: ['Argireline (acetyl hexapeptide-3/8)', 'Leuphasyl (pentapeptide-18)', 'SNAP-8 (acetyl octapeptide-3)'],
    bestFor: 'Expression lines: forehead, crow\'s feet, perioral lines. Must be applied before moisturiser for best penetration.',
    evidence: 'moderate',
  },
  {
    type: 'Carrier Peptides',
    color: Colors.gold,
    icon: '🚚',
    mechanism: 'Deliver mineral cofactors (copper, manganese, zinc) to enzymes in the dermis. These minerals are essential for collagen cross-linking (lysyl oxidase requires copper) and wound healing. The peptide acts as a chaperone — getting the mineral to its biological target.',
    examples: ['GHK-Cu (copper peptide — tripeptide-1 copper)', 'Manganese tripeptide'],
    bestFor: 'Wound healing, scar fading, post-inflammatory recovery. Also strong antioxidant via SOD induction.',
    evidence: 'strong',
  },
  {
    type: 'Enzyme Inhibitor Peptides',
    color: Colors.red,
    icon: '🛑',
    mechanism: 'Inhibit enzymes that break down skin matrix proteins. Specifically target MMPs (matrix metalloproteinases) — the enzymes responsible for collagen degradation from UV and inflammation. If you inhibit the degradation, net collagen levels increase even without stimulating new synthesis.',
    examples: ['Soy peptides', 'Rice peptides', 'Palmitoyl tripeptide-5 (also a signal peptide)'],
    bestFor: 'UV-induced collagen loss, inflammatory skin conditions, maintaining collagen in already-damaged skin.',
    evidence: 'moderate',
  },
  ];
}

const TOP_PEPTIDES = [
  { name: 'Matrixyl 3000', concentration: '3–8%', mechanism: 'Dual signal peptide combo. Palmitoyl tripeptide-1 mimics collagen fragment signalling. Palmitoyl tetrapeptide-7 reduces IL-6 (pro-inflammatory cytokine that degrades collagen). Together: stimulate collagen synthesis + reduce breakdown simultaneously.', clinical: 'Independent studies: 27–33% reduction in wrinkle depth at 3 months. One of the most studied cosmetic peptides. Palmitoyl group improves stratum corneum penetration.', icon: '⭐' },
  { name: 'GHK-Cu (Copper Peptide)', concentration: '0.5–2%', mechanism: 'Tripeptide-1 chelated with copper (Cu2+). GHK-Cu activates superoxide dismutase (anti-aging antioxidant enzyme), stimulates type I and III collagen synthesis, promotes wound healing (VEGF upregulation), and has anti-inflammatory effects. May also upregulate skin-tightening factors.', clinical: 'Extensive research from Dr. Loren Pickart (1970s–present). Clinically shown to improve skin texture, firmness, and wound healing. Well-tolerated. The copper makes products appear blue-green.', icon: '🔵' },
  { name: 'Argireline (Acetyl Hexapeptide-3)', concentration: '5–10%', mechanism: 'Competes with SNAP-25 protein for the SNARE complex that triggers acetylcholine vesicle release. Less acetylcholine = reduced muscle contraction at treated areas. Most effective for forehead and eye area with consistent application.', clinical: 'In a double-blind study, 10% Argireline reduced wrinkle depth by 17% at 15 days and 27% at 30 days. Topical — not comparable to Botox injections, but measurably effective with consistent use.', icon: '💜' },
  { name: 'Palmitoyl Tripeptide-38 (Matrixyl Morphomics)', concentration: '3–5%', mechanism: 'Third-generation Matrixyl. Stimulates collagen I, III, IV, fibronectin, and hyaluronic acid synthesis simultaneously. Also works on ECM (extracellular matrix) overall, not just collagen. Claimed to address loss of facial volume (not just wrinkles).', clinical: 'Newer peptide with limited independent data. Manufacturer studies show volume restoration and wrinkle reduction. Considered an evolution of Matrixyl 3000.', icon: '✨' },
  { name: 'Snap-8', concentration: '3–5%', mechanism: 'Extended version of Argireline (8 amino acids vs 6). Same SNARE complex inhibition mechanism but claimed to be more potent. Particularly studied for the perioral (around the mouth) area.', clinical: 'Limited independent study data. Manufacturer data: 63% reduction in wrinkle depth compared to Argireline alone in some formulations. Best layered with Argireline for neurotransmitter inhibitor synergy.', icon: '💊' },
  { name: 'Leuphasyl', concentration: '4%', mechanism: 'Acts on the enkephalin receptor (opioid receptor) pathway — a different mechanism than Argireline (SNARE). Reduces the neural signal that triggers the muscle to contract, upstream of the neuromuscular junction. Combination with Argireline addresses both the signal AND the junction.', clinical: 'Clinical data shows synergistic effect when combined with Argireline. Alone, approximately 22% reduction in expression lines at 4%. With Argireline: 48%.', icon: '🎯' },
];

const HOW_TO_USE = [
  { step: 1, title: 'Apply after cleanser on clean skin', detail: 'Peptide serums are water-based. Apply to clean, dry or slightly damp skin before any oils or occlusives. Peptides need direct contact with the skin barrier to initiate penetration — do not apply over oils or thick moisturisers.' },
  { step: 2, title: 'No specific pH requirement — apply any time', detail: 'Unlike acids or vitamin C, peptides do not require a specific skin pH and are not degraded by the skin\'s natural acid mantle. They can be used AM, PM, or both. No timing restrictions relative to other products.' },
  { step: 3, title: 'Do not combine with strong AHAs at the same time', detail: 'High-concentration AHAs (pH <4) can break peptide bonds (peptides are chains of amino acids — acids can hydrolyse the amide bonds). Use acids and peptides at separate times: acids PM, peptides AM. Or use acids, wait 30 minutes, then apply peptides (skin pH normalises).' },
  { step: 4, title: 'Consistent use required — 4–12 weeks minimum', detail: 'Signal peptides work via cell signalling cascades that take weeks to produce visible results. Argireline\'s effect on muscle repetition accumulates. GHK-Cu\'s wound healing and collagen induction takes weeks. There are no instant results with peptides — consistency over 3 months is the standard evaluation window.' },
  { step: 5, title: 'Layer order: thinnest to thickest', detail: 'Peptide serum → wait 60 seconds → thicker serums or moisturisers → oils/occlusives. The thinnest product first ensures it contacts skin before any barriers are created.' },
  { step: 6, title: 'Look for delivery systems in formulations', detail: 'High-quality peptide products include penetration enhancers: palmitoyl or acetyl groups attached to the peptide (lipid modification), liposomal encapsulation, or fatty acid vehicles. These are what separate effective peptide products from expensive water. Palmitoyl-prefixed peptides have built-in delivery.' },
];

const TALLOW_PEPTIDES = [
  { title: 'Animal-fat occlusives provide amino acid building blocks', body: 'Some animal-fat occlusives contain a range of amino acids — the building blocks cells use to construct peptides and proteins (including collagen). While topical amino acid delivery is less efficient than peptide delivery, the fat-soluble vitamins (A, D, E, K2) support the cellular machinery that synthesises these proteins.' },
  { title: 'An occlusive as the delivery vehicle for lipid-modified peptides', body: 'Palmitoyl-prefixed peptides (Matrixyl, GHK-Cu palmitoylated forms) have a fatty acid attached specifically to improve stratum corneum penetration. Applying these peptides over a thin layer of a lipid occlusive creates a lipid-rich environment that may further aid the penetration of these oil-adapted peptides.' },
  { title: 'Recommended stack: peptide serum → occlusive', body: 'Apply peptide serum first (water-soluble, needs direct skin contact). Allow 90 seconds to absorb. Apply a thin layer of an occlusive to seal in the serum layer, add vitamin A/E/D, and provide overnight barrier support. The occlusive does not block the already-absorbed serum.' },
  { title: 'GHK-Cu + an occlusive: wound healing synergy', body: 'GHK-Cu is a carrier peptide that promotes wound healing via VEGF upregulation and collagen stimulation. A vitamin-rich occlusive provides vitamin K2 (supports skin healing and reduces bruising/discolouration) and vitamin A (promotes epithelial cell renewal). The two support recovery through distinct but complementary pathways.' },
  { title: 'Avoid peptide breakdown: timing with acids', body: 'If using AHAs or BHAs in your PM routine, apply the acid first, wait 30 minutes, then peptide serum, then an occlusive. This prevents the low-pH environment of the acid from potentially hydrolyzing peptide bonds before the peptide has a chance to penetrate.' },
];

export default function PeptidesScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const PEPTIDE_TYPES = useMemo(() => buildPeptideTypes(Colors), [Colors]);
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedFact, setExpandedFact] = useState<number | null>(null);
  const [expandedType, setExpandedType] = useState<number | null>(null);
  const [expandedPeptide, setExpandedPeptide] = useState<number | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const evidenceColor = (e: string) => e === 'strong' ? Colors.green : e === 'moderate' ? Colors.gold : Colors.blue;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Peptide Guide</Text>
        <View style={{ width: 60 }} />
      </Animated.View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>🔗 Peptides</Text>
        <Text style={styles.heroSub}>The future of anti-aging skincare. Unlike retinol, peptides stimulate collagen through signalling rather than controlled irritation — making them gentle, compatible, and stackable.</Text>
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
            {INTRO_FACTS.map((f, i) => (
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
            {PEPTIDE_TYPES.map((t, i) => (
              <TouchableOpacity key={i} style={[styles.card, { borderLeftColor: t.color, borderLeftWidth: 3 }]} onPress={() => setExpandedType(expandedType === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{t.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: t.color }]}>{t.type}</Text>
                    <View style={[styles.evidenceBadge, { backgroundColor: evidenceColor(t.evidence) + '22', borderColor: evidenceColor(t.evidence) + '55' }]}>
                      <Text style={[styles.evidenceText, { color: evidenceColor(t.evidence) }]}>{t.evidence} evidence</Text>
                    </View>
                  </View>
                  <Text style={styles.expandIcon}>{expandedType === i ? '▲' : '▼'}</Text>
                </View>
                {expandedType === i && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.cardDetail}>{t.mechanism}</Text>
                    <Text style={styles.examplesLabel}>Examples</Text>
                    {t.examples.map((e, j) => (
                      <Text key={j} style={styles.exampleItem}>→ {e}</Text>
                    ))}
                    <View style={styles.bestForBlock}>
                      <Text style={styles.bestForLabel}>Best For</Text>
                      <Text style={styles.bestForText}>{t.bestFor}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 2 && (
          <View>
            <Text style={styles.sectionNote}>Tap any peptide to see mechanism and clinical evidence. Quality matters — look for these specific INCI names on ingredient labels.</Text>
            {TOP_PEPTIDES.map((p, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedPeptide(expandedPeptide === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{p.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{p.name}</Text>
                    <Text style={styles.concText}>Effective at: {p.concentration}</Text>
                  </View>
                  <Text style={styles.expandIcon}>{expandedPeptide === i ? '▲' : '▼'}</Text>
                </View>
                {expandedPeptide === i && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.mechanismLabel}>Mechanism</Text>
                    <Text style={styles.cardDetail}>{p.mechanism}</Text>
                    <View style={styles.clinicalBlock}>
                      <Text style={styles.clinicalLabel}>Clinical Evidence</Text>
                      <Text style={styles.clinicalText}>{p.clinical}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 3 && (
          <View>
            {HOW_TO_USE.map((s, i) => (
              <View key={i} style={styles.stepCard}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{s.step}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepDetail}>{s.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 4 && (
          <View>
            <View style={styles.tallowHero}>
              <Text style={styles.tallowHeroTitle}>🌿 Peptides + an Occlusive</Text>
              <Text style={styles.tallowHeroSub}>A lipid-rich occlusive and peptides work through complementary pathways. Peptides signal collagen production; the occlusive provides barrier support and fat-soluble vitamins that enable the cellular machinery to respond.</Text>
            </View>
            {TALLOW_PEPTIDES.map((p, i) => (
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
  evidenceBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginTop: 2 },
  evidenceText: { fontSize: 10, fontWeight: '700' },
  examplesLabel: { color: c.textMuted, fontSize: 11, fontWeight: '700', marginTop: 12, marginBottom: 4 },
  exampleItem: { color: c.textSecondary, fontSize: 12, marginBottom: 4 },
  bestForBlock: { backgroundColor: c.cardAlt, borderRadius: 8, padding: 10, marginTop: 10 },
  bestForLabel: { color: c.gold, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  bestForText: { color: c.textSecondary, fontSize: 12, lineHeight: 18 },
  concText: { color: c.textMuted, fontSize: 12 },
  mechanismLabel: { color: c.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  clinicalBlock: { backgroundColor: c.green + '0D', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: c.green + '33', marginTop: 10 },
  clinicalLabel: { color: c.green, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  clinicalText: { color: c.textSecondary, fontSize: 12, lineHeight: 18 },
  stepCard: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  stepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  stepTitle: { color: c.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  stepDetail: { color: c.textSecondary, fontSize: 13, lineHeight: 19 },
  tallowHero: { backgroundColor: c.primary + '11', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.primary + '44', marginBottom: 14 },
  tallowHeroTitle: { color: c.primary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  tallowHeroSub: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowCard: { backgroundColor: c.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.border, marginBottom: 10 },
  tallowCardTitle: { color: c.gold, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowCardBody: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  });
}
