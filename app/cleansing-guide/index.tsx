import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar,
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

const TABS = ['Science', 'Cleanser Types', 'Double Cleanse', 'pH', 'Tallow Cleansing'];

const CLEANSING_SCIENCE = [
  { fact: 'The goal of cleansing is selective removal', detail: 'Effective cleansing removes: sunscreen, makeup, airborne pollution particles, excess sebum, and dead skin cell debris. It should NOT remove: the skin\'s Natural Moisturising Factor (NMF), the acid mantle, beneficial skin microbiome, or barrier lipids. Most standard cleansers do not make this distinction.', icon: '🎯' },
  { fact: 'The skin\'s acid mantle: pH 4.5–5.5', detail: 'The skin maintains a slightly acidic surface (acid mantle) created by a mix of sweat, sebum, and NMF components. This acidity is essential for: antimicrobial defence (most pathogens prefer neutral pH), barrier enzyme function (lipid-synthesising enzymes need acidic environment), and microbiome health. Disrupting it causes downstream cascading problems.', icon: '⚗️' },
  { fact: 'Standard soap has a pH of 9–11', detail: 'Soap bars (traditional saponified fats) are highly alkaline — pH 9–11. This immediately neutralises the acid mantle. After using soap, skin pH takes 30–90 minutes to return to its natural 4.5–5.5. During this window, barrier enzymes are impaired, microbiome is disrupted, and skin is maximally permeable to irritants.', icon: '🧼' },
  { fact: 'SLS (sodium lauryl sulfate) is a known irritant', detail: 'SLS is a surfactant found in most foaming cleansers. It is the same compound used in scientific research to reliably induce contact dermatitis (skin irritation) for testing. At concentrations in cleansers (5–15%), it strips both sebum AND NMF, penetrates deep into the stratum corneum, and disrupts tight junctions. SLES is milder but still significantly stripping.', icon: '⚠️' },
  { fact: 'Over-cleansing is more common than under-cleansing', detail: 'Clinical dermatology has more patients with over-cleansed, stripped, reactive skin than with genuinely under-cleansed skin. The skin has intrinsic mechanisms to remove debris and maintain surface hygiene. Excessive cleansing overrides these mechanisms and requires more product to compensate for the damage.', icon: '📊' },
  { fact: 'Night is the only essential cleanse', detail: 'AM skin: has accumulated only what skin naturally produced overnight (sebum, minor debris). PM skin: carries sunscreen, makeup, pollution particles, and heavy oxidative sebum from the day. The evening cleanse is by far the most critical. Many dermatologists recommend just rinsing with water in the AM for non-oily skin types.', icon: '🌙' },
];

function buildCleanserTypes(Colors: ReturnType<typeof shimColors>) {
  return [
  {
    type: 'Cleansing Oil / Balm',
    icon: '🫧',
    color: Colors.gold,
    howWorks: 'Oil dissolves oil — the "like dissolves like" principle. Oil cleansers dissolve sunscreen, makeup, and sebum through lipid-lipid affinity. Emulsify with water, then rinse. No surfactant needed. pH-neutral.',
    ph: '~6.5–7.5 (neutral)',
    pros: ['Removes oil-based makeup and SPF completely', 'Does not disrupt acid mantle significantly', 'Non-stripping', 'Compatible with dry, sensitive, and barrier-compromised skin'],
    cons: ['Cannot fully remove pollution particles without a second cleanse', 'Some formulas leave residue if not emulsified properly', 'Not ideal as sole cleanser for heavy waterproof makeup'],
    bestFor: 'First cleanse (PM). Sensitive, dry, dehydrated, and barrier-compromised skin.',
  },
  {
    type: 'Micellar Water',
    icon: '💧',
    color: Colors.blue,
    howWorks: 'Micelles: tiny spherical structures with a hydrophilic (water-loving) exterior and lipophilic (oil-loving) interior. They surround oil-based particles (sebum, makeup) and suspend them in water without traditional surfactants. No rinse required (though rinsing is recommended).',
    ph: '~6.0–7.5',
    pros: ['Gentle — no rubbing required', 'pH-compatible', 'Good for sensitive and reactive skin', 'Portable, no-rinse option'],
    cons: ['Incomplete removal of heavy SPF and waterproof makeup without follow-up cleanse', 'Some contain preservatives (phenoxyethanol) that accumulate on skin if not rinsed', 'Not suitable as the only cleanser for oily skin'],
    bestFor: 'First cleanse for light makeup/SPF days. Sensitive skin. AM cleanse alternative.',
  },
  {
    type: 'Gel / Foaming Cleanser',
    icon: '🫧',
    color: Colors.teal,
    howWorks: 'Surfactant-based. Surfactants have a hydrophilic head and lipophilic tail — they sit at the oil-water interface and emulsify both for rinsing. The foaming action distributes surfactants across the skin surface. Efficacy depends heavily on the specific surfactants used.',
    ph: '4.5–6.0 (good) or 7–9 (stripping)',
    pros: ['Effective at removing environmental debris, bacteria, and pollution', 'Rinse-off format leaves clean finish', 'Works well for oily skin'],
    cons: ['Stripping if surfactants are too harsh (SLS, SLES)', 'Must check pH — most drugstore foaming cleansers are too alkaline', 'Can dehydrate dry and sensitive skin'],
    bestFor: 'Second cleanse (PM). Oily and combination skin. Normal skin with gentle formulation.',
  },
  {
    type: 'Cream / Milk Cleanser',
    icon: '🥛',
    color: Colors.green,
    howWorks: 'Emulsion-based — combines water, oils, and mild surfactants. Cleansing action comes from a combination of mild lipid affinity and gentle surface-active components. Does not foam. Rinses off or can be wiped away.',
    ph: '4.5–6.5',
    pros: ['Gentle on barrier', 'Leaves some lipids intact on skin', 'pH-compatible with most formulations', 'Good for dry and dehydrated skin'],
    cons: ['Less effective than oil cleansers for heavy SPF and makeup', 'Can feel film-leaving if not rinsed thoroughly', 'Not suitable for very oily skin as only cleanser'],
    bestFor: 'Dry, sensitive, and dehydrated skin. Second cleanse for minimal makeup days.',
  },
  {
    type: 'Clay / Charcoal Cleanser',
    icon: '🏔️',
    color: Colors.primary,
    howWorks: 'Kaolin and bentonite clay have negatively charged surfaces that electrostatically attract positively charged toxins, sebum, and impurities. Charcoal works similarly via adsorption. Both are used as masks rather than daily cleansers in most clinical applications.',
    ph: 'Variable — check product',
    pros: ['Effective sebum and pollution absorption', 'Detoxifying effect on congested pores', 'Good for occasional deep cleansing'],
    cons: ['Highly stripping if used daily — not recommended for regular use', 'Can over-dry even oily skin with frequent use', 'Should be used as a mask 1–2× weekly, not daily cleanser'],
    bestFor: '1–2× weekly treatment for oily and congested skin. Not daily cleansing.',
  },
  ];
}

function buildDoubleCleanse(Colors: ReturnType<typeof shimColors>) {
  return [
    { step: 1, label: 'First Cleanse: Oil-Based', icon: '🫧', detail: 'Apply cleansing oil or balm to dry skin. Massage for 60 seconds — this is what dissolves sunscreen and makeup. Add a small amount of water to emulsify (the cleanser will turn milky white). Rinse thoroughly. This removes oil-soluble soil (SPF, makeup, oxidised sebum).', skipWhen: 'You wore no SPF and no makeup', color: Colors.gold },
    { step: 2, label: 'Second Cleanse: Water-Based', icon: '💧', detail: 'Apply gentle pH-balanced gel or cream cleanser on damp skin. Massage 30–60 seconds. Rinse with lukewarm water. This removes water-soluble soil (sweat, pollution particles, environmental bacteria) and prepares skin for serums with a clean, pH-appropriate surface.', skipWhen: 'AM cleanse (water rinse only is often sufficient)', color: Colors.teal },
  ];
}

const PH_GUIDE = [
  { item: 'Why pH matters for your cleanser', detail: 'Skin naturally sits at pH 4.5–5.5. A cleanser at pH 9 creates a 4–5 unit pH swing across the entire facial surface. This temporarily deactivates the lipid-synthesising enzymes (serine proteases) in the stratum corneum, impairs the antimicrobial barrier, and changes the microbiome balance. The skin takes 30–90 minutes to rebalance.' },
  { item: 'How to check your cleanser\'s pH', detail: 'Buy pH test strips (typically sold for pool/aquarium use, accurate to 0.5 pH). Mix a small amount of your cleanser with water in a clean container. Dip a strip. Ideal: 4.5–6.0. Acceptable: up to 6.5. Concerning: 7+. Actively harmful (daily use): 8+.' },
  { item: 'High pH signals to look for in ingredient labels', detail: 'Sodium hydroxide (NaOH — lye, used as pH adjuster), potassium hydroxide, sodium cocoate/palmate/laurate (saponified oils = traditional soap), "natural soap" or "true soap" labelling. These are reliable markers of high-pH formulations.' },
  { item: 'Gentle pH indicators', detail: 'Cocamidopropyl betaine (amphoteric, mild), sodium cocoyl glutamate (amino acid surfactant, pH ~5.5), sodium lauroyl methyl isethionate (gentle, pH ~5–6), glucoside surfactants (decyl glucoside, coco glucoside — pH ~5.5–7), micellar micelles without SLS. These characterise gentle, pH-appropriate cleansers.' },
  { item: 'Does pH matter for oil cleansers', detail: 'Considerably less. Oil cleansers work via lipid affinity, not surfactant chemistry, and are typically near-neutral pH. They do not significantly affect the acid mantle. This is one reason oil cleansers are generally safe for sensitive and barrier-compromised skin as a first cleanse.' },
];

const TALLOW_CLEANSING = [
  { title: 'Tallow as a cleansing oil: the original method', body: 'Oil cleansing with tallow predates modern surfactant cleansers by millennia. Tallow applied to dry skin, massaged for 60 seconds, then wiped with a warm damp cloth removes makeup, SPF, and excess sebum effectively via lipid-lipid affinity. It is the original "cleansing balm." Many TallowDermics users use a thin layer of tallow as their PM first cleanse.' },
  { title: 'OCM (Oil Cleansing Method) with tallow', body: 'Apply a pea-sized amount of tallow to dry skin. Massage for 60–90 seconds. Take a warm-hot damp cloth (not hot) and hold it over the face for 10 seconds (steam effect opens pores). Wipe gently. Follow with a gentle water-based second cleanse or just rinse with warm water if skin is clear.' },
  { title: 'Preserves the acid mantle', body: 'Tallow cleansing maintains a near-neutral to slightly acidic pH environment. Unlike soap-based or SLS cleansers that spike skin pH to 9–11, tallow cleansing does not significantly shift the acid mantle. The microbiome and barrier enzymes remain functional throughout the cleansing process.' },
  { title: 'For sensitive skin: tallow-only cleansing', body: 'For severely compromised or reactive skin, tallow as the sole cleanser (wiped away with warm damp cloth, no surfactant second cleanse) is a viable protocol. The skin gets cleansed without any surfactant exposure. This is the most barrier-gentle cleansing method available. Recommended during barrier repair protocols.' },
  { title: 'What tallow cleansing does NOT remove', body: 'Tallow cleansing effectively removes oil-soluble soil (makeup, SPF, sebum). It does not effectively remove heavy-duty waterproof makeup or pollution particles as well as a proper micellar or gentle surfactant second cleanse. For days with heavy SPF (outdoor activities), follow with a gentle pH-balanced second cleanse.' },
];

export default function CleansingGuideScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const CLEANSER_TYPES = useMemo(() => buildCleanserTypes(Colors), [Colors]);
  const DOUBLE_CLEANSE = useMemo(() => buildDoubleCleanse(Colors), [Colors]);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedFact, setExpandedFact] = useState<number | null>(null);
  const [expandedType, setExpandedType] = useState<number | null>(null);
  const [expandedPH, setExpandedPH] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Cleansing Science</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>🧼 Cleansing Science</Text>
        <Text style={styles.heroSub}>The most underrated step in skincare. Wrong cleansers cause more barrier damage than most actives. Get this right and everything else works better.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={i} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {activeTab === 0 && (
          <View>
            {CLEANSING_SCIENCE.map((f, i) => (
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
            {CLEANSER_TYPES.map((t, i) => (
              <TouchableOpacity key={i} style={[styles.card, { borderLeftColor: t.color, borderLeftWidth: 3 }]} onPress={() => setExpandedType(expandedType === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{t.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: t.color }]}>{t.type}</Text>
                    <Text style={styles.phText}>Typical pH: {t.ph}</Text>
                  </View>
                  <Text style={styles.expandIcon}>{expandedType === i ? '▲' : '▼'}</Text>
                </View>
                {expandedType === i && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.cardDetail}>{t.howWorks}</Text>
                    <View style={styles.prosConsRow}>
                      <View style={styles.prosCons}>
                        <Text style={[styles.prosConsLabel, { color: Colors.green }]}>+ Pros</Text>
                        {t.pros.map((p, j) => <Text key={j} style={[styles.prosConsItem, { color: Colors.green }]}>✓ {p}</Text>)}
                      </View>
                      <View style={[styles.prosCons, { borderLeftWidth: 1, borderLeftColor: Colors.border, paddingLeft: 10 }]}>
                        <Text style={[styles.prosConsLabel, { color: Colors.red }]}>− Cons</Text>
                        {t.cons.map((c, j) => <Text key={j} style={[styles.prosConsItem, { color: Colors.red }]}>✗ {c}</Text>)}
                      </View>
                    </View>
                    <View style={styles.bestForBlock}>
                      <Text style={styles.bestForLabel}>Best for</Text>
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
            <Text style={styles.sectionNote}>Double cleansing is for PM only. AM: water rinse or single gentle cleanse is sufficient for all but very oily skin types.</Text>
            {DOUBLE_CLEANSE.map((s, i) => (
              <View key={i} style={[styles.dcCard, { borderColor: s.color + '55' }]}>
                <View style={[styles.dcBadge, { backgroundColor: s.color }]}>
                  <Text style={styles.dcBadgeText}>{s.step}</Text>
                </View>
                <Text style={[styles.dcLabel, { color: s.color }]}>{s.label}</Text>
                <Text style={styles.cardDetail}>{s.detail}</Text>
                <View style={styles.skipBlock}>
                  <Text style={styles.skipLabel}>Skip when: </Text>
                  <Text style={styles.skipText}>{s.skipWhen}</Text>
                </View>
              </View>
            ))}
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>The key insight</Text>
              <Text style={styles.infoBoxText}>Double cleansing is not about being "extra clean." It is about using the right chemistry for each type of soil: oil-based cleanser for oil-based soil (SPF, makeup), water-based cleanser for water-based soil (sweat, pollution). One cleanser cannot do both equally well.</Text>
            </View>
          </View>
        )}

        {activeTab === 3 && (
          <View>
            {PH_GUIDE.map((p, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedPH(expandedPH === i ? null : i)} activeOpacity={0.85}>
                <Text style={styles.cardTitle}>{p.item}</Text>
                {expandedPH === i && <Text style={[styles.cardDetail, { marginTop: 8 }]}>{p.detail}</Text>}
                {expandedPH !== i && <Text style={styles.tapHint}>Tap to read ▼</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 4 && (
          <View>
            <View style={styles.tallowHero}>
              <Text style={styles.tallowHeroTitle}>🌿 Cleansing with Tallow</Text>
              <Text style={styles.tallowHeroSub}>Tallow is the original cleansing agent. Oil cleansing with tallow predates modern skincare chemistry — and for good reason.</Text>
            </View>
            {TALLOW_CLEANSING.map((p, i) => (
              <View key={i} style={styles.tallowCard}>
                <Text style={styles.tallowCardTitle}>{p.title}</Text>
                <Text style={styles.tallowCardBody}>{p.body}</Text>
              </View>
            ))}
          </View>
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
  hero: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  heroTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 6 },
  heroSub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  tabScroll: { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary + '22', borderColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionNote: { color: Colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 12, fontStyle: 'italic' },
  card: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardEmoji: { fontSize: 18, marginTop: 2 },
  cardTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  cardDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  expandIcon: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  tapHint: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  phText: { color: Colors.textMuted, fontSize: 12 },
  prosConsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  prosCons: { flex: 1 },
  prosConsLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  prosConsItem: { fontSize: 11, lineHeight: 18, marginBottom: 2 },
  bestForBlock: { backgroundColor: Colors.cardAlt, borderRadius: 8, padding: 10, marginTop: 10 },
  bestForLabel: { color: Colors.gold, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  bestForText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  dcCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 12 },
  dcBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  dcBadgeText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  dcLabel: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  skipBlock: { flexDirection: 'row', marginTop: 10 },
  skipLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  skipText: { color: Colors.textSecondary, fontSize: 12, flex: 1 },
  infoBox: { backgroundColor: Colors.teal + '11', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.teal + '33', marginTop: 6 },
  infoBoxTitle: { color: Colors.teal, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  infoBoxText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  tallowHero: { backgroundColor: Colors.primary + '11', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.primary + '44', marginBottom: 14 },
  tallowHeroTitle: { color: Colors.primary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  tallowHeroSub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  tallowCardTitle: { color: Colors.gold, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowCardBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  });
}
