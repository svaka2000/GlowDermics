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
type ShimColors = ReturnType<typeof shimColors>;

const TABS = ['EFA Science', 'Omega-3', 'Omega-6', 'The Ratio', 'Oils & Tallow'];

const EFA_BASICS = [
  { fact: 'Essential fatty acids cannot be synthesised by the body', detail: 'Omega-3 (alpha-linolenic acid — ALA) and omega-6 (linoleic acid — LA) are "essential" because human metabolism cannot create them. They must come from diet. These precursor fatty acids are then converted to longer-chain derivatives (EPA, DHA from omega-3; arachidonic acid from omega-6) that drive the body\'s pro- and anti-inflammatory signalling systems.', icon: '🧬' },
  { fact: 'Linoleic acid is essential for ceramide synthesis', detail: 'Linoleic acid (omega-6) is the essential fatty acid for skin barrier function. It is required for the synthesis of acylceramide — the ceramide class that creates the cornified envelope (the outermost waterproofing layer). Linoleic acid deficiency directly causes a defective skin barrier, increased TEWL, and scaly, hyperkeratotic skin.', icon: '🛡️' },
  { fact: 'EPA and DHA reduce skin inflammation systemically', detail: 'EPA (eicosapentaenoic acid) competitively inhibits arachidonic acid — reducing the production of pro-inflammatory prostaglandin E2 and leukotriene B4. This systemic anti-inflammatory effect measurably reduces acne, eczema, and psoriasis severity in multiple randomised trials. DHA also plays a role in maintaining membrane fluidity and signalling.', icon: '🐟' },
  { fact: 'Fatty acids are incorporated into skin cell membranes', detail: 'The fatty acids in your diet are literally incorporated into the phospholipid bilayers of every skin cell membrane. Omega-3-rich diets produce more fluid, functional cell membranes. High omega-6 (especially arachidonic acid) membranes are more rigid and pro-inflammatory. The quality of your cell membranes is, to a significant extent, a reflection of what you eat.', icon: '🔬' },
  { fact: 'The omega-6:omega-3 ratio in Western diets is dangerously unbalanced', detail: 'The ancestral human diet had an omega-6:omega-3 ratio of approximately 1:1 to 4:1. The modern Western diet has shifted this to 15:1 to 25:1 — primarily due to ubiquitous refined vegetable oils (soybean, corn, sunflower) high in omega-6 linoleic acid. This imbalance is a systemic pro-inflammatory state that manifests prominently in skin.', icon: '⚖️' },
  { fact: 'Topical essential fatty acids restore the barrier directly', detail: 'Linoleic acid-rich oils (rosehip, sea buckthorn, hemp seed) applied topically supplement skin ceramide precursors directly in the stratum corneum. Studies show topical linoleic acid restores barrier function in deficiency states. Conversely, topical oleic acid (olive oil) at high concentrations can disrupt the barrier — demonstrating that not all fatty acids have the same topical effect.', icon: '💧' },
];

function buildOmega3(Colors: ShimColors) {
  return [
  { fa: 'ALA (Alpha-Linolenic Acid)', source: 'Flaxseed, chia seeds, walnuts, hemp seeds', chain: '18:3 n-3', role: 'Parent omega-3. Converted to EPA and DHA in the body but conversion efficiency is low (5–10% to EPA, <0.5% to DHA). Plant-based omega-3 — provides the precursor but requires conversion.', skinEffect: 'Indirect benefit through EPA/DHA conversion. Lower bioavailability compared to marine sources.', color: Colors.blue },
  { fa: 'EPA (Eicosapentaenoic Acid)', source: 'Fatty fish, fish oil, krill oil, algae oil', chain: '20:5 n-3', role: 'Primary anti-inflammatory omega-3. Competitively inhibits arachidonic acid from producing pro-inflammatory eicosanoids. Reduces PGE2 (prostaglandin E2) — the primary driver of acne-associated inflammation and eczema flares.', skinEffect: 'Reduces inflammatory acne, eczema, psoriasis. Clinical doses: 1–3g EPA daily.', color: Colors.teal },
  { fa: 'DHA (Docosahexaenoic Acid)', source: 'Fatty fish, fish oil, algae oil', chain: '22:6 n-3', role: 'Structural omega-3 — incorporated into cell membranes, especially in the brain and retina. In skin: maintains membrane fluidity, modulates skin immune function, and supports the ceramide precursor pool.', skinEffect: 'Improves cell membrane function, reduces TEWL. Found at significant concentration in the skin, particularly in sebaceous glands.', color: Colors.green },
  ];
}

function buildOmega6(Colors: ShimColors) {
  return [
  { fa: 'Linoleic Acid (LA)', source: 'Sunflower seeds, safflower oil, hemp seed, evening primrose, rosehip oil', chain: '18:2 n-6', role: 'The only EFA essential for skin barrier function. Precursor to ceramide synthesis (acylceramide). Deficiency causes hyperkeratosis, increased TEWL, and impaired barrier. Most plant oils are high in LA.', skinEffect: 'Essential for barrier ceramide production. Topically effective for dry, barrier-compromised skin.', color: Colors.gold, critical: true },
  { fa: 'GLA (Gamma-Linolenic Acid)', source: 'Evening primrose oil (8–10%), borage oil (20–25%), hemp seed oil (3%)', chain: '18:3 n-6', role: 'Anti-inflammatory omega-6 (bypasses the pro-inflammatory DGLA→AA conversion pathway). Reduces PGE2. Studied for eczema, PMS-related skin worsening, and inflammatory skin conditions.', skinEffect: 'Evening primrose oil orally: reduces eczema severity in multiple trials. 500mg GLA daily.', color: Colors.primary },
  { fa: 'Arachidonic Acid (AA)', source: 'Meat, eggs, dairy — formed from LA in the body', chain: '20:4 n-6', role: 'Pro-inflammatory precursor. Forms prostaglandin E2, leukotriene B4, and thromboxane A2. These drive acne inflammation, eczema, and psoriasis. At appropriate levels, AA is needed for immune function — excess is pathological.', skinEffect: 'High AA diet → increased inflammatory skin conditions. Balance by increasing omega-3 intake (EPA competitively inhibits AA eicosanoids).', color: Colors.red, warning: 'Excess is pro-inflammatory' },
  ];
}

const RATIO_GUIDE = [
  { point: 'The ideal ratio for skin health', detail: 'Research suggests an omega-6:omega-3 ratio of 4:1 or lower for optimal anti-inflammatory outcomes. At this ratio, EPA from diet can competitively inhibit arachidonic acid eicosanoid production, shifting the balance toward anti-inflammatory signalling. The Mediterranean diet achieves approximately 4:1.' },
  { point: 'How to calculate your ratio', detail: 'Track for one week: all oils used in cooking, animal products, nuts and seeds, and supplements. Identify sources of omega-6 (vegetable oils) vs omega-3 (fatty fish, walnuts, supplements). Most people are shocked to find their ratio is 15:1 or higher.' },
  { point: 'Reducing omega-6: the most impactful change', detail: 'The fastest way to improve the ratio is reducing omega-6 — specifically by replacing refined vegetable oils (soybean, canola, corn, sunflower, safflower) with stable saturated and monounsaturated fats: grass-fed butter, tallow, coconut oil, and olive oil. These do not skew the omega-6 side of the equation.' },
  { point: 'Increasing omega-3: fish oil supplementation', detail: 'For most people on a Western diet, supplementation is necessary to achieve meaningful EPA/DHA levels. Dose: 1–3g combined EPA+DHA daily from fish oil, krill oil, or algae oil. Food sources: 3 servings weekly of fatty fish (salmon, mackerel, sardines, herring) provides significant EPA+DHA.' },
];

const OILS_TALLOW = [
  { oil: 'Grass-Fed Tallow', omega3: '~1%', omega6: '~3%', oleic: '~47%', palmitic: '~26%', stearic: '~14%', notes: 'Balanced saturated/monounsaturated profile. Does not significantly skew omega-6:omega-3 ratio. CLA content (1–2% in grass-fed) is anti-inflammatory. The saturated fat content makes it extremely stable against oxidation. Natural vitamin E, A, D, K2 — makes it a complete skin food.', heroForSkin: true },
  { oil: 'Rosehip Oil', omega3: '~1%', omega6: '~35–45%', oleic: '~18%', palmitic: '~4%', stearic: '~2%', notes: 'Very high linoleic acid — excellent for barrier ceramide precursor supply. Also contains trans-retinoic acid (vitamin A derivative) in small amounts. Can go rancid quickly due to high PUFA content — store refrigerated. Not for Malassezia-prone skin (high LA but also risky).', heroForSkin: false },
  { oil: 'Hemp Seed Oil', omega3: '~20%', omega6: '~55%', oleic: '~12%', palmitic: '~6%', stearic: '~2%', notes: 'Closest to ideal omega-6:omega-3 ratio of any plant oil (approximately 2.5:1). Contains GLA. Low comedogenic rating. Good choice for combination skin types wanting EFA balance without heavy oils.', heroForSkin: false },
  { oil: 'Evening Primrose Oil', omega3: '~0%', omega6: '~65% (includes 8–10% GLA)', oleic: '~10%', palmitic: '~6%', stearic: '~2%', notes: 'High GLA — anti-inflammatory unlike most omega-6. Studied orally for eczema, PMS acne. Topically for barrier repair. Not good for balancing omega-6:omega-3 ratio (adds omega-6), but GLA is anti-inflammatory which partially offsets this.', heroForSkin: false },
  { oil: 'Fish Oil', omega3: '~30% EPA+DHA', omega6: '~1%', oleic: '~15%', palmitic: '~15%', stearic: '~3%', notes: 'Oral supplement primarily — high PUFA content makes topical application risky (oxidation on skin). Best as internal intervention: 1–3g EPA+DHA daily from concentrated fish oil capsule. Best-in-class for shifting omega-6:omega-3 ratio in a Western diet.', heroForSkin: false },
];

export default function EFAGuideScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const OMEGA3 = useMemo(() => buildOmega3(Colors), [Colors]);
  const OMEGA6 = useMemo(() => buildOmega6(Colors), [Colors]);
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedFact, setExpandedFact] = useState<number | null>(null);
  const [expandedO3, setExpandedO3] = useState<number | null>(null);
  const [expandedO6, setExpandedO6] = useState<number | null>(null);
  const [expandedRatio, setExpandedRatio] = useState<number | null>(null);
  const [expandedOil, setExpandedOil] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Essential Fatty Acids</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>🐟 Essential Fatty Acids</Text>
        <Text style={styles.heroSub}>The omega-3 vs omega-6 balance is one of the most impactful dietary variables for skin inflammation. Most people's ratio is 20:1 when 4:1 is optimal.</Text>
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
            {EFA_BASICS.map((f, i) => (
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
            <Text style={styles.sectionNote}>Marine omega-3 (EPA, DHA) is the active form. Plant omega-3 (ALA) must be converted at low efficiency. For skin benefit, marine sources are significantly more effective.</Text>
            {OMEGA3.map((f, i) => (
              <TouchableOpacity key={i} style={[styles.card, { borderLeftColor: f.color, borderLeftWidth: 3 }]} onPress={() => setExpandedO3(expandedO3 === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: f.color }]}>{f.fa}</Text>
                    <Text style={styles.chainText}>{f.chain} · {f.source}</Text>
                  </View>
                  <Text style={styles.expandIcon}>{expandedO3 === i ? '▲' : '▼'}</Text>
                </View>
                {expandedO3 === i && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.cardDetail}>{f.role}</Text>
                    <View style={styles.skinEffectBlock}>
                      <Text style={styles.skinEffectLabel}>Skin Effect</Text>
                      <Text style={styles.skinEffectText}>{f.skinEffect}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 2 && (
          <View>
            <Text style={styles.sectionNote}>Not all omega-6 is created equal. Linoleic acid is essential for skin barrier. Arachidonic acid is pro-inflammatory. GLA is anti-inflammatory — despite being omega-6.</Text>
            {OMEGA6.map((f, i) => (
              <TouchableOpacity key={i} style={[styles.card, { borderLeftColor: f.color, borderLeftWidth: 3 }]} onPress={() => setExpandedO6(expandedO6 === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: f.color }]}>{f.fa}</Text>
                    <Text style={styles.chainText}>{f.chain}</Text>
                    {'critical' in f && f.critical && (
                      <Text style={[styles.criticalText, { color: Colors.green }]}>★ Essential for skin barrier</Text>
                    )}
                    {'warning' in f && f.warning && (
                      <Text style={[styles.criticalText, { color: Colors.red }]}>⚠️ {f.warning}</Text>
                    )}
                  </View>
                  <Text style={styles.expandIcon}>{expandedO6 === i ? '▲' : '▼'}</Text>
                </View>
                {expandedO6 === i && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.cardDetail}>{f.role}</Text>
                    <View style={styles.skinEffectBlock}>
                      <Text style={styles.skinEffectLabel}>Skin Effect</Text>
                      <Text style={styles.skinEffectText}>{f.skinEffect}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 3 && (
          <View>
            {RATIO_GUIDE.map((r, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedRatio(expandedRatio === i ? null : i)} activeOpacity={0.85}>
                <Text style={styles.cardTitle}>{r.point}</Text>
                {expandedRatio === i && <Text style={[styles.cardDetail, { marginTop: 8 }]}>{r.detail}</Text>}
                {expandedRatio !== i && <Text style={styles.tapHint}>Tap to expand ▼</Text>}
              </TouchableOpacity>
            ))}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>The Quick Fix</Text>
              <Text style={styles.summaryText}>1. Stop cooking with refined vegetable oils (soybean, canola, corn).</Text>
              <Text style={styles.summaryText}>2. Switch to grass-fed tallow, butter, or olive oil.</Text>
              <Text style={styles.summaryText}>3. Eat fatty fish 3× weekly or supplement 2–3g EPA+DHA daily.</Text>
              <Text style={styles.summaryText}>4. Ratio shifts measurably within 4–6 weeks.</Text>
            </View>
          </View>
        )}

        {activeTab === 4 && (
          <View>
            {OILS_TALLOW.map((o, i) => (
              <TouchableOpacity key={i} style={[styles.card, o.heroForSkin && { borderColor: Colors.primary + '88', borderWidth: 2 }]} onPress={() => setExpandedOil(expandedOil === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.oilTitleRow}>
                      <Text style={[styles.cardTitle, o.heroForSkin && { color: Colors.primary }]}>{o.oil}</Text>
                      {o.heroForSkin && <Text style={styles.heroBadge}>★ TALLOW</Text>}
                    </View>
                    <View style={styles.oilFARow}>
                      <Text style={styles.faLabel}>ω-3: {o.omega3}</Text>
                      <Text style={styles.faLabel}>ω-6: {o.omega6}</Text>
                      <Text style={styles.faLabel}>Oleic: {o.oleic}</Text>
                    </View>
                  </View>
                  <Text style={styles.expandIcon}>{expandedOil === i ? '▲' : '▼'}</Text>
                </View>
                {expandedOil === i && <Text style={[styles.cardDetail, { marginTop: 10 }]}>{o.notes}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  chainText: { color: c.textMuted, fontSize: 12 },
  criticalText: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  tapHint: { color: c.textMuted, fontSize: 11, marginTop: 4 },
  skinEffectBlock: { marginTop: 10, backgroundColor: c.teal + '11', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: c.teal + '33' },
  skinEffectLabel: { color: c.teal, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  skinEffectText: { color: c.textSecondary, fontSize: 12, lineHeight: 18 },
  summaryCard: { backgroundColor: c.cardAlt, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.border, marginTop: 6 },
  summaryTitle: { color: c.gold, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  summaryText: { color: c.textSecondary, fontSize: 13, lineHeight: 22 },
  oilTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroBadge: { color: c.primary, fontSize: 11, fontWeight: '700', backgroundColor: c.primary + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  oilFARow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  faLabel: { color: c.textMuted, fontSize: 11 },
  });
}
