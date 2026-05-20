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
    brown: '#A16207',
  };
}

const TABS = [
  { id: 'types', label: 'Types', icon: '🔍' },
  { id: 'actives', label: 'Treatments', icon: '⚗️' },
  { id: 'routine', label: 'Protocol', icon: '📋' },
  { id: 'myths', label: 'Myths', icon: '💡' },
  { id: 'occlusive', label: 'Barrier Role', icon: '🌿' },
];

function buildTypes(Colors: ReturnType<typeof shimColors>) {
  return [
  {
    type: 'Post-Inflammatory Hyperpigmentation (PIH)',
    icon: '🔴',
    color: Colors.red,
    cause: 'Inflammation triggers melanocytes to overproduce melanin as a wound response. Caused by acne, eczema, cuts, burns, insect bites, or any skin trauma.',
    depth: 'Superficial (epidermis) — responds well to topical treatment',
    timeline: '3–24 months without treatment; 2–6 months with consistent treatment + SPF',
    mostEffective: 'Vitamin C, azelaic acid, niacinamide, tranexamic acid + mandatory SPF',
    notes: 'Darker skin tones are significantly more prone to PIH — melanocytes are more reactive. Never pick or squeeze active spots.',
  },
  {
    type: 'Melasma',
    icon: '🌑',
    color: Colors.purple,
    cause: 'Hormonal triggers (pregnancy, birth control, HRT) plus UV exposure activate melanocyte clusters in the face. Symmetrical patches on cheeks, forehead, upper lip.',
    depth: 'Epidermal and/or dermal — deeper melasma is harder to treat topically',
    timeline: 'Chronic condition — fades with treatment + SPF avoidance but returns with hormonal triggers or UV',
    mostEffective: 'Hydroquinone (prescription), tranexamic acid, kojic acid + strict daily SPF. Hormonal adjustments (changing contraceptive) often required.',
    notes: 'Melasma is notoriously treatment-resistant. Even after fading, it returns with UV or hormonal change. SPF is management, not optional.',
  },
  {
    type: 'Solar Lentigines (Sun Spots)',
    icon: '☀️',
    color: Colors.gold,
    cause: 'Years of cumulative UV exposure causes permanent melanin clusters. More common after 40 but begin forming from sun exposure in your 20s.',
    depth: 'Epidermal to dermal — varies by spot age',
    timeline: 'Older, deeper spots respond slowly (6–12 months). Newer spots respond faster.',
    mostEffective: 'Retinoids + Vitamin C + SPF. Laser/IPL for stubborn cases.',
    notes: 'Prevent with SPF — sun spots are the most direct evidence of unprotected UV exposure accumulated over decades.',
  },
  {
    type: 'Freckles (Ephelides)',
    icon: '🟠',
    color: Colors.primary,
    cause: 'Genetic predisposition (MC1R gene variants) causing melanocyte clusters that respond to UV. Natural. Common in fair skin, redheads, and those with Northern European ancestry.',
    depth: 'Superficial (epidermis)',
    timeline: 'They fade in winter and return in summer — this is normal. Fading attempts are often a matter of preference, not necessity.',
    mostEffective: 'SPF reduces darkening and new formation. Brightening actives can fade them but they return with UV.',
    notes: 'Freckles are not damage — they\'re a normal genetic trait. Distinguish from solar lentigines (which appear later, are larger, and represent actual UV damage).',
  },
  {
    type: 'DISH (Drug-Induced Skin Hyperpigmentation)',
    icon: '💊',
    color: Colors.blue,
    cause: 'Certain medications trigger excess melanin: minocycline, antimalarials, chemotherapy, amiodarone, some antipsychotics.',
    depth: 'Often dermal — difficult to treat topically',
    timeline: 'May persist long after stopping medication. Dermatologist evaluation needed.',
    mostEffective: 'Address root cause (medication change if possible). Laser therapy for persistent cases.',
    notes: 'If hyperpigmentation started after beginning a new medication, report to your prescribing doctor.',
  },
  ];
}

const ACTIVES = [
  {
    name: 'Vitamin C (L-ascorbic acid)',
    mechanism: 'Inhibits tyrosinase (rate-limiting enzyme for melanin synthesis) and acts as an antioxidant reducing UV-induced pigmentation.',
    howToUse: '10–20% AM, before SPF. Allow 30s to absorb. Stable in low pH.',
    bestFor: ['PIH', 'Sun spots', 'General brightening'],
    evidence: 'strong',
    occlusiveStack: 'Apply Vitamin C → wait 60s → a thin occlusive → SPF.',
  },
  {
    name: 'Niacinamide',
    mechanism: 'Inhibits melanosome transfer from melanocytes to keratinocytes — doesn\'t stop melanin production but prevents it from reaching the surface cells.',
    howToUse: '5–10%, AM and PM. Well-tolerated by all skin types.',
    bestFor: ['PIH', 'General brightening', 'Skin tone evening'],
    evidence: 'strong',
    occlusiveStack: 'Apply niacinamide → 30s → an occlusive on top (it doesn\'t interfere with niacinamide\'s mechanism).',
  },
  {
    name: 'Azelaic Acid',
    mechanism: 'Selectively inhibits overactive melanocytes. Anti-inflammatory effects reduce the initial trigger of post-inflammatory hyperpigmentation.',
    howToUse: '10–20% AM or PM. Prescription strength 20% requires dermatologist. Start low and increase.',
    bestFor: ['PIH', 'Melasma', 'Rosacea-related redness'],
    evidence: 'strong',
    occlusiveStack: 'Good combination — azelaic acid reduces the PIH trigger, an occlusive reduces the inflammation that causes it.',
  },
  {
    name: 'Tranexamic Acid',
    mechanism: 'Blocks UV-induced prostaglandin synthesis that activates melanocytes. Particularly effective for melasma.',
    howToUse: '2–5% topical, AM and PM. Also available as oral supplement (off-label, require physician).',
    bestFor: ['Melasma', 'PIH', 'Overall brightening'],
    evidence: 'strong',
    occlusiveStack: 'Can be layered under an occlusive. Tranexamic → occlusive → SPF AM routine.',
  },
  {
    name: 'Alpha Arbutin',
    mechanism: 'Tyrosinase inhibitor derived from bearberry. Gentler than hydroquinone. Converts to hydroquinone slowly on skin.',
    howToUse: '2%, AM or PM. Well-tolerated and can be used daily.',
    bestFor: ['PIH', 'Sun spots', 'Sensitive skin brightening'],
    evidence: 'moderate',
    occlusiveStack: 'Alpha arbutin → occlusive. No interaction issues.',
  },
  {
    name: 'Kojic Acid',
    mechanism: 'Chelates copper ions required for tyrosinase activity. Derived from fermentation (sake production).',
    howToUse: '1–4%, AM or PM. Can be irritating at high concentration — introduce slowly.',
    bestFor: ['Melasma', 'Sun spots'],
    evidence: 'moderate',
    occlusiveStack: 'Can be applied before an occlusive. Note: may not be well-tolerated by rosacea-prone skin.',
  },
  {
    name: 'Retinoids (Vitamin A)',
    mechanism: 'Accelerate cell turnover — pigmented cells shed faster. Also inhibit tyrosinase and reduce melanin clustering.',
    howToUse: 'PM only, skin cycling (2× per week). See Retinol Guide.',
    bestFor: ['Sun spots', 'PIH', 'Combined anti-aging + brightening'],
    evidence: 'strong',
    occlusiveStack: 'Retinol → 20 min wait → an occlusive as buffer and seal.',
  },
  {
    name: 'SPF 30+ (Broad Spectrum)',
    mechanism: 'Prevents UV-induced melanin stimulation. Protects fading pigmentation from re-darkening. Without SPF, all other treatments fight UV re-stimulation daily.',
    howToUse: 'Every morning, last step, adequate amount.',
    bestFor: ['All types — prevention and maintenance'],
    evidence: 'critical — without it nothing else works',
    occlusiveStack: 'Occlusive → SPF. Non-negotiable.',
  },
];

const PROTOCOL = {
  am: [
    { step: 'Gentle cleanser', note: 'Fragrance-free, pH 5–5.5. Start clean.' },
    { step: 'Vitamin C serum (10–20%)', note: 'Apply on slightly damp skin. Wait 30–60 seconds.' },
    { step: 'Niacinamide (5–10%)', note: 'After Vitamin C has set. Wait 30 seconds between.' },
    { step: 'Thin occlusive layer', note: 'Lock in serums, barrier support before SPF.' },
    { step: 'SPF 50 broad spectrum', note: 'Most important step of all. 2-finger rule.' },
  ],
  pm: [
    { step: 'Double cleanse', note: 'Oil cleanse → gentle cleanser. Remove SPF completely — incomplete removal leaves UV filters on skin overnight.' },
    { step: 'Tranexamic acid or alpha arbutin (optional)', note: 'Brightening active PM option. Alternate with retinol nights.' },
    { step: 'Retinol (2–3× per week)', note: 'Accelerates shedding of pigmented cells. Wait 15–20 min, then proceed.' },
    { step: 'Generous occlusive layer', note: 'Barrier repair, occlusive, vitamin A delivery. The foundation of the PM routine.' },
  ],
};

const MYTHS = [
  { myth: 'Lemon juice lightens dark spots naturally', truth: 'Lemon juice is acidic and phototoxic. Applied to skin in sunlight, it causes MORE pigmentation (phytophotodermatitis). It also strips the acid mantle. Never apply lemon juice to face.' },
  { myth: 'Scrubbing removes dark spots faster', truth: 'Physical exfoliation inflames the skin, triggering MORE melanin production. This worsens PIH. Chemical exfoliants (AHA) work by accelerating natural cell shedding without inflammation.' },
  { myth: 'Results happen in 2 weeks', truth: 'Superficial PIH takes 2–6 months with consistent treatment. Melasma and sun spots: 6–12+ months. Deep pigmentation requires years. Consistency over months is the only approach that works.' },
  { myth: 'Skin lightening is skin bleaching', truth: '"Brightening" topicals (Vit C, niacinamide, azelaic acid) correct uneven hyperpigmentation — they don\'t lighten your natural skin tone. They inhibit overactive melanocytes, not normal ones.' },
  { myth: 'You only need brightening actives, not SPF', truth: 'Brightening actives slow melanin production. SPF prevents UV from stimulating it back. Without SPF, UV undoes all brightening work daily. Both are non-negotiable.' },
  { myth: 'Hyperpigmentation is permanent', truth: 'Most hyperpigmentation is epidermal and responds to treatment over time. True permanent pigmentation (blue-grey deep dermal) requires laser. The majority of common PIH and sun spots do fade with consistent treatment.' },
];

const evidenceColor = (e: string, Colors: ReturnType<typeof shimColors>) => {
  if (e.includes('critical') || e === 'strong') return Colors.green;
  if (e === 'moderate') return Colors.gold;
  return Colors.blue;
};

export default function HyperpigmentationScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const TYPES = useMemo(() => buildTypes(Colors), [Colors]);
  const [activeTab, setActiveTab] = useState('types');
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [expandedActive, setExpandedActive] = useState<string | null>(null);
  const [expandedMyth, setExpandedMyth] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Hyperpigmentation</Text>
        <View style={{ width: 60 }} />
      </View>

      <LinearGradient colors={['#A1620722', '#0A0A0F']} style={styles.hero}>
        <Text style={styles.heroEmoji}>🌗</Text>
        <Text style={styles.heroTitle}>Hyperpigmentation Guide</Text>
        <Text style={styles.heroSub}>Identify your type, treat it correctly, and protect your progress</Text>
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

        {activeTab === 'types' && TYPES.map((type, i) => (
          <TouchableOpacity key={i} style={[styles.typeCard, { borderLeftColor: type.color, borderLeftWidth: 4 }]} onPress={() => setExpandedType(expandedType === type.type ? null : type.type)} activeOpacity={0.85}>
            <View style={styles.typeHeader}>
              <Text style={styles.typeIcon}>{type.icon}</Text>
              <Text style={styles.typeName}>{type.type}</Text>
              <Text style={styles.expandIcon}>{expandedType === type.type ? '▲' : '▼'}</Text>
            </View>
            {expandedType === type.type && (
              <View style={styles.typeExpanded}>
                {[
                  { label: 'Cause', value: type.cause },
                  { label: 'Depth', value: type.depth },
                  { label: 'Timeline', value: type.timeline },
                  { label: 'Most Effective', value: type.mostEffective },
                  { label: 'Note', value: type.notes },
                ].map((row, j) => (
                  <View key={j} style={styles.typeRow}>
                    <Text style={styles.typeRowLabel}>{row.label}</Text>
                    <Text style={styles.typeRowValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}

        {activeTab === 'actives' && ACTIVES.map((active, i) => (
          <TouchableOpacity key={i} style={styles.activeCard} onPress={() => setExpandedActive(expandedActive === active.name ? null : active.name)} activeOpacity={0.85}>
            <View style={styles.activeHeader}>
              <Text style={styles.activeName}>{active.name}</Text>
              <View style={[styles.evidBadge, { borderColor: evidenceColor(active.evidence, Colors) }]}>
                <Text style={[styles.evidText, { color: evidenceColor(active.evidence, Colors) }]}>{active.evidence.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.bestForRow}>
              {active.bestFor.map(t => <View key={t} style={styles.bestForChip}><Text style={styles.bestForText}>{t}</Text></View>)}
            </View>
            {expandedActive === active.name && (
              <View style={styles.activeExpanded}>
                <Text style={styles.activeSubLabel}>Mechanism</Text>
                <Text style={styles.activeDetail}>{active.mechanism}</Text>
                <Text style={styles.activeSubLabel}>How to Use</Text>
                <Text style={styles.activeDetail}>{active.howToUse}</Text>
                <View style={styles.occlusiveStackCard}>
                  <Text style={styles.occlusiveStackLabel}>🌿 Occlusive Stack</Text>
                  <Text style={styles.occlusiveStackText}>{active.occlusiveStack}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {activeTab === 'routine' && (
          <>
            <View style={styles.protocolNote}>
              <Text style={styles.protocolNoteText}>
                This protocol addresses all types of hyperpigmentation. Consistency over months is required — do not judge results in less than 8 weeks.
              </Text>
            </View>
            <Text style={styles.routineSectionLabel}>🌅 Morning</Text>
            {PROTOCOL.am.map((step, i) => (
              <View key={i} style={styles.routineStep}>
                <View style={styles.routineStepNum}><Text style={styles.routineStepNumText}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routineStepTitle}>{step.step}</Text>
                  <Text style={styles.routineStepNote}>{step.note}</Text>
                </View>
              </View>
            ))}
            <Text style={[styles.routineSectionLabel, { marginTop: 20 }]}>🌙 Evening</Text>
            {PROTOCOL.pm.map((step, i) => (
              <View key={i} style={styles.routineStep}>
                <View style={styles.routineStepNum}><Text style={styles.routineStepNumText}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routineStepTitle}>{step.step}</Text>
                  <Text style={styles.routineStepNote}>{step.note}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === 'myths' && MYTHS.map((item, i) => (
          <TouchableOpacity key={i} style={styles.mythCard} onPress={() => setExpandedMyth(expandedMyth === i ? null : i)} activeOpacity={0.8}>
            <View style={styles.mythHeader}>
              <Text style={styles.mythBadge}>MYTH</Text>
              <Text style={styles.mythText}>{item.myth}</Text>
              <Text style={styles.expandIcon}>{expandedMyth === i ? '▲' : '▼'}</Text>
            </View>
            {expandedMyth === i && (
              <View style={styles.mythTruth}>
                <Text style={styles.truthBadge}>TRUTH</Text>
                <Text style={styles.truthText}>{item.truth}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {activeTab === 'occlusive' && [
          {
            title: 'Occlusives for post-acne marks (PIH)',
            detail: "Apply a lipid-rich occlusive directly to healing acne spots PM. Palmitoleic acid reduces the inflammation that triggers melanin overproduction. Vitamin K2 supports vascular healing. Early application (while the spot is still healing) reduces PIH formation significantly compared to doing nothing.",
          },
          {
            title: 'Vitamin A for pigmentation',
            detail: "A fat-soluble Vitamin A occlusive promotes gentle cell turnover — pigmented epidermal cells shed at a slightly accelerated rate. Not as potent as synthetic retinol, but the gentle daily action compounds over months without the irritation that causes people to stop.",
          },
          {
            title: 'Barrier protection for active treatments',
            detail: "Brightening actives (Vitamin C, azelaic acid) require an intact barrier to work effectively. A lipid occlusive maintains that barrier, letting you use brightening actives consistently without triggering inflammation-induced MORE pigmentation.",
          },
          {
            title: 'SPF layering is essential',
            detail: "Apply an occlusive → 60 seconds → SPF 50. Without SPF, UV undoes pigmentation progress daily. Occlusive + SPF is the non-negotiable pairing for any pigmentation protocol. SPF alone without a barrier layer leads to barrier compromise over time from dry SPF formulas.",
          },
          {
            title: 'A sebum-similar occlusive does not cause PIH',
            detail: "Some oils and occlusives can trigger breakouts that then cause PIH. A sebum-compatible occlusive minimizes comedogenic risk. However, if you are purging initially, be extra diligent with SPF during this period as any inflammation from purging can leave marks.",
          },
        ].map((item, i) => (
          <View key={i} style={styles.barrierPoint}>
            <Text style={styles.barrierPointTitle}>{item.title}</Text>
            <Text style={styles.barrierPointDetail}>{item.detail}</Text>
          </View>
        ))}

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
  hero: { margin: 16, marginBottom: 4, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#A16207' + '44', alignItems: 'center' },
  heroEmoji: { fontSize: 36, marginBottom: 6 },
  heroTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  heroSub: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  tabRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  tabChipActive: { borderColor: Colors.gold, backgroundColor: Colors.gold + '22' },
  tabIcon: { fontSize: 13 },
  tabLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: Colors.gold },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  typeCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  typeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeIcon: { fontSize: 18 },
  typeName: { flex: 1, color: Colors.textPrimary, fontSize: 13, fontWeight: '700' },
  expandIcon: { color: Colors.textMuted, fontSize: 12 },
  typeExpanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  typeRow: { marginBottom: 8 },
  typeRowLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: 2 },
  typeRowValue: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  activeCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  activeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  activeName: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  evidBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  evidText: { fontSize: 9, fontWeight: '700' },
  bestForRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  bestForChip: { backgroundColor: Colors.blue + '22', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  bestForText: { color: Colors.blue, fontSize: 10, fontWeight: '600' },
  activeExpanded: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  activeSubLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: 3, marginTop: 8 },
  activeDetail: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  occlusiveStackCard: { backgroundColor: Colors.primary + '15', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.primary + '44', marginTop: 10 },
  occlusiveStackLabel: { color: Colors.primary, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  occlusiveStackText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  protocolNote: { backgroundColor: Colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 14 },
  protocolNoteText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  routineSectionLabel: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  routineStep: { flexDirection: 'row', gap: 12, backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  routineStepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.gold + '22', alignItems: 'center', justifyContent: 'center' },
  routineStepNumText: { color: Colors.gold, fontSize: 13, fontWeight: '700' },
  routineStepTitle: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  routineStepNote: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  mythCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  mythHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  mythBadge: { color: Colors.red, fontSize: 9, fontWeight: '700', backgroundColor: Colors.red + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  mythText: { flex: 1, color: Colors.textPrimary, fontSize: 13, fontWeight: '600', lineHeight: 20 },
  mythTruth: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  truthBadge: { color: Colors.green, fontSize: 9, fontWeight: '700', backgroundColor: Colors.green + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 6 },
  truthText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  barrierPoint: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  barrierPointTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  barrierPointDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  });
}
