import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
import { router } from 'expo-router';

const Colors = {
  bg: '#0A0A0F', card: '#13131A', cardAlt: '#1A1A24', border: '#2A2A3A',
  primary: '#C4622D', gold: '#D4A96A', textPrimary: '#FAF3E0',
  textSecondary: '#9A9AAF', textMuted: '#5A5A6E',
  green: '#4ADE80', red: '#F87171', blue: '#60A5FA', teal: '#2DD4BF',
};

const TABS = ['Signs', 'Causes', 'Protocol', 'Ingredients', 'Tallow Role'];

const SIGNS = [
  { sign: 'Tightness after cleansing', detail: 'Healthy skin rebounds within 30–60 seconds after washing. Persistent tightness means the stratum corneum lost too much water and lipids during cleansing.', severity: 'early', emoji: '😣' },
  { sign: 'Stinging from skincare', detail: 'Intact barrier = skincare stays on top. Damaged barrier = actives (acids, niacinamide, vitamin C) penetrate deeper and reach nerve endings. Common early warning sign.', severity: 'early', emoji: '🔥' },
  { sign: 'Redness and blotchiness', detail: 'Chronic redness (not flushing) indicates low-grade inflammation from barrier gaps. Skin can\'t contain irritants, triggering constant immune response.', severity: 'moderate', emoji: '🩸' },
  { sign: 'Sudden breakouts from previously-tolerated products', detail: 'Your routine didn\'t change but your skin did. When barrier breaks down, pores are exposed to more environmental irritants and comedogenic penetration increases.', severity: 'moderate', emoji: '💢' },
  { sign: 'Excessive oiliness alternating with dryness', detail: '"Dehydrated oily" skin. The sebaceous glands compensate for water loss by overproducing oil — giving the paradox of shiny but dehydrated skin.', severity: 'moderate', emoji: '💧' },
  { sign: 'Visible flaking that doesn\'t resolve with moisturiser', detail: 'Normal dry skin responds to hydration. Compromised barrier flaking persists because the structural defect prevents transepidermal water retention even when water is applied.', severity: 'severe', emoji: '🌧️' },
  { sign: 'Extreme sensitivity — everything stings', detail: 'At this stage even plain water causes stinging. The barrier is critically compromised. Enter repair mode immediately: strip the routine to absolute minimum.', severity: 'severe', emoji: '⚠️' },
];

const CAUSES = [
  { cause: 'Over-exfoliation', detail: 'AHAs, BHAs, physical scrubs, and retinoids all accelerate cell shedding. The stratum corneum needs 28+ days to fully renew. Using actives daily, especially combined, removes cells faster than they can be replaced.', fix: 'Reduce acid use to 2× weekly max. Give barrier 2–4 weeks to rebuild before reintroducing.', icon: '⚡' },
  { cause: 'Harsh / surfactant-heavy cleansers', detail: 'SLS, SLES, and soap strip not just dirt but the skin\'s natural oils (NMF — Natural Moisturising Factor). pH >6 disrupts the skin\'s acid mantle (pH 4.5–5.5), impairs enzyme function, and kills microbiome.', fix: 'Switch to pH-balanced (5.0–6.0) gentle cleansers. No foaming if barrier is damaged.', icon: '🧼' },
  { cause: 'Environmental assault', detail: 'Wind strips surface lipids. UV degrades ceramides directly. Pollution creates oxidative stress. Air conditioning and heating create low-humidity environments accelerating TEWL.', fix: 'Occlusive layer (tallow, petrolatum) locks in moisture. Antioxidants (vitamin E, C) neutralise free radicals.', icon: '🌬️' },
  { cause: 'Hot water', detail: 'Water above 40°C dissolves lipids from the skin surface the same way it dissolves grease from a pan. The effect is cumulative — daily hot showers/washes cause chronic barrier erosion.', fix: 'Lukewarm water only (35–37°C). Limit wash time. Pat dry — don\'t rub.', icon: '🚿' },
  { cause: 'Skipping moisturiser / sleeping dry', detail: 'TEWL (trans-epidermal water loss) is highest at night and during sleep. An unoccluded barrier loses 10–20× more water than an occluded one. Overnight is when repair peaks — but only if barrier is supported.', fix: 'Apply a rich occlusive PM. Tallow or plain petrolatum is optimal.', icon: '🌙' },
  { cause: 'Nutritional deficiency', detail: 'Ceramides require linoleic acid (omega-6). Skin cells require fatty acids from diet for membrane integrity. Vitamin A deficiency causes hyperkeratosis. Zinc deficiency impairs wound healing.', fix: 'Increase dietary fat: grass-fed animal fats, olive oil, oily fish. Zinc 15–30mg. Vitamin A from liver or fermented cod liver oil.', icon: '🥩' },
  { cause: 'Stress and cortisol', detail: 'Cortisol directly suppresses skin barrier function and reduces hyaluronic acid synthesis. Chronic stress measurably reduces ceramide production and increases skin permeability.', fix: 'Stress management is a skincare intervention. Sleep, exercise, and nervous system regulation all measurably improve barrier function.', icon: '🧠' },
];

const PROTOCOL_STEPS = [
  { step: 1, phase: 'Days 1–3: Eliminate', action: 'Strip routine to minimum', detail: 'Stop all actives immediately: retinoids, acids (AHA/BHA/PHA), vitamin C, exfoliants, clay masks, peels. Use only cleanser + moisturiser. Actives through a damaged barrier penetrate too deep and worsen inflammation.', warning: 'Do not use niacinamide if everything stings — even it can irritate at this stage.', color: Colors.red },
  { step: 2, phase: 'Days 3–7: Cleanse gently', action: 'Switch to ultra-mild cleanser', detail: 'Use micellar water, cleansing balm, or pH-balanced gentle gel (5.0–5.5 pH). No foaming cleansers. Rinse with lukewarm water only. Consider the "no-wash" evening approach: micellar water only (no rinse-off cleanser) to preserve any remaining lipids.', warning: null, color: Colors.gold },
  { step: 3, phase: 'Days 3–14: Rebuild lipids', action: 'Apply occlusive + ceramide combo', detail: 'The holy grail combo: ceramide-containing moisturiser (CeraVe, La Roche-Posay Cicaplast) or tallow as your lipid donor. Apply while skin is still slightly damp to trap water. Top with a thin occlusive layer at night.', warning: null, color: Colors.teal },
  { step: 4, phase: 'Days 7–21: Protect during day', action: 'SPF + anti-pollution barrier', detail: 'Mineral SPF during barrier repair. Chemical SPF actives (oxybenzone, avobenzone) can penetrate more through compromised barrier. Zinc oxide SPF is inert and non-irritating. Apply SPF as the last step every morning without fail.', warning: 'Skip SPF only if you\'re completely indoors — UV makes barrier repair much harder.', color: Colors.blue },
  { step: 5, phase: 'Week 3+: Reintroduce slowly', action: 'One product at a time', detail: 'Reintroduce actives one-at-a-time with 2 weeks between additions. Start with the gentlest: niacinamide → PHA → low-strength BHA → retinol → higher-strength acids. If stinging returns, retreat to Step 1.', warning: null, color: Colors.green },
];

const REPAIR_INGREDIENTS = [
  { name: 'Ceramides', role: 'Primary lipid of stratum corneum (50% of barrier lipids). Direct structural rebuild.', found: 'CeraVe, tallow (contains ceramide precursors), sunflower seed oil', use: 'AM + PM moisturiser', rating: 'essential' },
  { name: 'Cholesterol', role: 'Co-lipid (25% of barrier lipids). Works synergistically with ceramides. Must be balanced at correct ratio.', found: 'Tallow (high cholesterol content), egg yolk oil', use: 'PM', rating: 'essential' },
  { name: 'Fatty Acids (C18)', role: 'Third barrier lipid fraction (15%). Oleic + linoleic acid. Linoleic is anti-inflammatory and ceramide-building.', found: 'Tallow (oleic), rosehip (linoleic), hemp seed (balanced)', use: 'PM', rating: 'essential' },
  { name: 'Niacinamide', role: 'Stimulates ceramide synthesis within 4 weeks. Anti-inflammatory. Reduces TEWL by ~25% in studies.', found: 'Topical formulations 2–10%', use: 'AM + PM after barrier stabilises', rating: 'high' },
  { name: 'Panthenol (B5)', role: 'Humectant + film-former. Binds water and increases hydration immediately. Soothing, anti-inflammatory.', found: 'Many moisturisers and serums', use: 'AM + PM', rating: 'high' },
  { name: 'Allantoin', role: 'Cell proliferant — accelerates skin cell turnover and wound healing. Keratolytic at low concentrations.', found: 'Cicaplast, many repair creams', use: 'PM especially', rating: 'high' },
  { name: 'Glycerin', role: 'Most studied humectant. Draws water into stratum corneum. Also assists ceramide synthesis.', found: 'Ubiquitous in skincare', use: 'AM + PM', rating: 'moderate' },
  { name: 'Colloidal oatmeal', role: 'Beta-glucans form a protective film. Anti-itch. Studied for eczema and barrier repair.', found: 'Aveeno, oat-based formulas', use: 'As needed for itch/inflammation', rating: 'moderate' },
];

const TALLOW_POINTS = [
  { title: 'Lipid profile matches human sebum', body: 'Grass-fed tallow is ~50% oleic acid, ~25% palmitic acid, ~15% stearic acid — nearly identical to human sebum composition. The stratum corneum recognises these lipids as "self" and integrates them directly into the lipid lamellar structure.' },
  { title: 'Contains all three barrier lipid classes', body: 'Tallow contains ceramide precursors (fatty acids that the skin enzymatically converts to ceramides), cholesterol, and free fatty acids — the exact three-lipid system that makes up the stratum corneum\'s waterproofing.' },
  { title: 'Vitamins A, D, E, K2 — all fat-soluble and bioavailable', body: 'Vitamin A supports epithelial integrity. Vitamin D modulates skin immune function and barrier gene expression. Vitamin E is a potent lipid antioxidant that prevents lipid peroxidation in the barrier. K2 supports skin elasticity.' },
  { title: 'Anti-inflammatory fatty acids reduce repair-time inflammation', body: 'Palmitoleic acid (found in tallow from pasture-raised animals) has documented antimicrobial and anti-inflammatory effects. Reduces the inflammatory cycle that compounds barrier damage.' },
  { title: 'Occlusive without being fully occlusive', body: 'Unlike petrolatum (100% occlusive), tallow allows some gas exchange while still dramatically reducing TEWL. It creates the ideal repair environment: moisture is retained, but CO2 and oxygen still exchange through the barrier.' },
  { title: 'Application timing matters', body: 'Apply tallow within 60 seconds of washing while skin is still slightly damp. The warmth of slightly warm skin melts the tallow instantly — use a pea-sized amount. Thicker application for severe barrier damage, thinner for maintenance.' },
];

export default function BarrierRepairScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSign, setExpandedSign] = useState<number | null>(null);
  const [expandedCause, setExpandedCause] = useState<number | null>(null);
  const [expandedIngredient, setExpandedIngredient] = useState<number | null>(null);

  const severityColor = (s: string) => s === 'early' ? Colors.gold : s === 'moderate' ? Colors.primary : Colors.red;
  const ratingColor = (r: string) => r === 'essential' ? Colors.teal : r === 'high' ? Colors.green : Colors.gold;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Barrier Repair</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>🛡️ Skin Barrier Repair</Text>
        <Text style={styles.heroSub}>The stratum corneum is your skin's protective shield. When compromised, everything else fails. Repair it first — before anything else.</Text>
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
            <Text style={styles.sectionNote}>Signs appear in order of severity. Early signs = catch it now. Severe signs = strip routine immediately.</Text>
            {SIGNS.map((s, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedSign(expandedSign === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{s.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{s.sign}</Text>
                    <View style={[styles.severityBadge, { backgroundColor: severityColor(s.severity) + '22', borderColor: severityColor(s.severity) + '55' }]}>
                      <Text style={[styles.severityText, { color: severityColor(s.severity) }]}>{s.severity.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.expandIcon}>{expandedSign === i ? '▲' : '▼'}</Text>
                </View>
                {expandedSign === i && <Text style={styles.cardDetail}>{s.detail}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 1 && (
          <View>
            {CAUSES.map((c, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedCause(expandedCause === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{c.icon}</Text>
                  <Text style={[styles.cardTitle, { flex: 1 }]}>{c.cause}</Text>
                  <Text style={styles.expandIcon}>{expandedCause === i ? '▲' : '▼'}</Text>
                </View>
                {expandedCause === i && (
                  <View>
                    <Text style={styles.cardDetail}>{c.detail}</Text>
                    <View style={styles.fixBlock}>
                      <Text style={styles.fixLabel}>Fix</Text>
                      <Text style={styles.fixText}>{c.fix}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 2 && (
          <View>
            <Text style={styles.sectionNote}>Follow in order. Do not skip ahead. Most people fail by reintroducing actives too early.</Text>
            {PROTOCOL_STEPS.map((p, i) => (
              <View key={i} style={[styles.protocolCard, { borderLeftColor: p.color }]}>
                <View style={styles.protocolHeader}>
                  <View style={[styles.stepBadge, { backgroundColor: p.color }]}>
                    <Text style={styles.stepBadgeText}>{p.step}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.protocolPhase, { color: p.color }]}>{p.phase}</Text>
                    <Text style={styles.protocolAction}>{p.action}</Text>
                  </View>
                </View>
                <Text style={styles.protocolDetail}>{p.detail}</Text>
                {p.warning && (
                  <View style={styles.warningBlock}>
                    <Text style={styles.warningText}>⚠️ {p.warning}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {activeTab === 3 && (
          <View>
            <Text style={styles.sectionNote}>These ingredients have the best clinical evidence for barrier repair. Use 2–4 at a time rather than layering all of them.</Text>
            {REPAIR_INGREDIENTS.map((ing, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedIngredient(expandedIngredient === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{ing.name}</Text>
                    <View style={[styles.ratingBadge, { backgroundColor: ratingColor(ing.rating) + '22', borderColor: ratingColor(ing.rating) + '55' }]}>
                      <Text style={[styles.ratingText, { color: ratingColor(ing.rating) }]}>{ing.rating.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.expandIcon}>{expandedIngredient === i ? '▲' : '▼'}</Text>
                </View>
                {expandedIngredient === i && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.cardDetail}>{ing.role}</Text>
                    <View style={styles.infoRow}><Text style={styles.infoLabel}>Found in</Text><Text style={styles.infoValue}>{ing.found}</Text></View>
                    <View style={styles.infoRow}><Text style={styles.infoLabel}>Use</Text><Text style={styles.infoValue}>{ing.use}</Text></View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 4 && (
          <View>
            <View style={[styles.tallowHero, { borderColor: Colors.primary + '44' }]}>
              <Text style={styles.tallowHeroTitle}>🌿 Why Tallow Is Ideal for Barrier Repair</Text>
              <Text style={styles.tallowHeroSub}>Tallow's lipid composition is uniquely suited to the stratum corneum's three-lipid system — ceramides, cholesterol, and free fatty acids.</Text>
            </View>
            {TALLOW_POINTS.map((p, i) => (
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

const styles = StyleSheet.create({
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
  cardDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 10 },
  expandIcon: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  severityBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginTop: 2 },
  severityText: { fontSize: 10, fontWeight: '700' },
  fixBlock: { marginTop: 10, backgroundColor: Colors.teal + '11', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: Colors.teal + '33' },
  fixLabel: { color: Colors.teal, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  fixText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  protocolCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 4, marginBottom: 10 },
  protocolHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stepBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stepBadgeText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  protocolPhase: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  protocolAction: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  protocolDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  warningBlock: { marginTop: 10, backgroundColor: Colors.red + '11', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: Colors.red + '33' },
  warningText: { color: Colors.red, fontSize: 12, lineHeight: 18 },
  ratingBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginTop: 2 },
  ratingText: { fontSize: 10, fontWeight: '700' },
  infoRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  infoLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', width: 60 },
  infoValue: { color: Colors.textSecondary, fontSize: 12, flex: 1 },
  tallowHero: { backgroundColor: Colors.primary + '11', borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 14 },
  tallowHeroTitle: { color: Colors.primary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  tallowHeroSub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  tallowCardTitle: { color: Colors.gold, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowCardBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
