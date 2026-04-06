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

const TABS = ['UV Science', 'Damage Types', 'Reversal', 'Prevention Stack', 'Tallow Role'];

const UV_SCIENCE = [
  { title: 'UVA vs UVB: completely different damage mechanisms', detail: 'UVB (290–320nm): burns. Causes direct DNA damage (CPD — cyclobutane pyrimidine dimers) in the epidermis. Peaks at midday. Blocked by glass. Causes immediate erythema (redness) and delayed tanning. UVA (320–400nm): ages. Penetrates to the dermis. Causes oxidative damage, collagen breakdown via MMP activation, and indirect DNA damage. Constant throughout daylight hours. Penetrates glass and clouds. 95% of UV reaching Earth is UVA.', icon: '☀️' },
  { title: 'A single sunburn before 20 doubles melanoma risk', detail: 'The correlation between blistering childhood sunburns and later melanoma risk is one of the strongest in dermatology. UV-induced DNA mutations in melanocytes can remain dormant for decades. This is also why no sun exposure history is "safe" — cumulative UV exposure is what matters.', icon: '🔴' },
  { title: 'Photoaging accounts for 80–90% of visible aging', detail: 'The landmark TWIN study compared identical twins with different UV exposure histories — the UV-exposed twins showed dramatically accelerated aging despite identical genetics. Research consistently attributes 80–90% of visible facial aging to cumulative UV exposure, not biological age. SPF worn daily from age 20 would prevent most visible facial aging by 60.', icon: '📊' },
  { title: 'UV depletes vitamin C in skin within minutes', detail: 'A single UV dose depletes up to 50% of the stratum corneum\'s ascorbic acid (vitamin C) reserves within 30 minutes. Without replenishment, the skin\'s antioxidant defence against the free radical cascade initiated by UV is severely compromised. This is why topical vitamin C in the AM is not cosmetic — it is a functional antioxidant reserve.', icon: '🍊' },
  { title: 'UVA breaks down collagen directly via MMP activation', detail: 'UVA activates matrix metalloproteinases (MMPs) — collagen-degrading enzymes in the dermis. Each UVA dose leaves a small amount of irreversible collagen degradation. Decades of daily UVA exposure creates the characteristic deep wrinkles, sagging, and loss of dermis volume of photoaged skin.', icon: '🧬' },
  { title: 'Infrared A (IRA) is emerging as a third photodamage source', detail: 'IR-A (760–1440nm) penetrates deepest of all — to the hypodermis. It generates reactive oxygen species in dermal mitochondria, impairs the barrier, and may contribute to collagen breakdown independently of UV. Heat from intense sun exposure is partly IR-A. Antioxidants reduce IR-A damage.', icon: '🔥' },
];

const DAMAGE_TYPES = [
  { type: 'Fine Lines and Wrinkles', mechanism: 'MMP-mediated collagen breakdown (UVA), loss of HA matrix, epidermal thinning. Collagen types I and III are reduced; collagen type III (the "young" collagen) is the most rapidly depleted.', reversibility: 'Moderate — retinoids stimulate new collagen synthesis. Cannot fully reverse established deep wrinkles without professional intervention.', color: Colors.gold, icon: '〰️' },
  { type: 'Solar Lentigines (Age Spots)', mechanism: 'UV stimulates melanocytes to produce excess melanin in localised clusters. Unlike freckles (genetic), solar lentigines are purely UV-induced and grow with continued exposure. Mark sites of accumulated DNA damage.', reversibility: 'High — respond well to vitamin C, niacinamide, arbutin, azelaic acid, retinoids, and laser/IPL professionally.', color: Colors.primary, icon: '⭕' },
  { type: 'Mottled Pigmentation', mechanism: 'Diffuse uneven melanin deposition from decades of inconsistent UV exposure. Creates the "splotchy" look of significantly photoaged skin — irregular dark areas against lighter background.', reversibility: 'Moderate — responds to retinoids and brightening agents but requires 6–18 months of consistent treatment.', color: Colors.blue, icon: '🎨' },
  { type: 'Loss of Elasticity (Elastosis)', mechanism: 'UV directly damages elastin fibres and stimulates abnormal elastin production (solar elastosis). The characteristic "leathery" appearance of heavily sun-damaged skin is abnormal elastin accumulation, not normal aging.', reversibility: 'Low — established solar elastosis cannot be fully reversed topically. Retinoids slow progression. Professional treatments (laser, RF) show partial improvement.', color: Colors.red, icon: '📏' },
  { type: 'Rough Texture / Keratosis', mechanism: 'UV-induced changes in keratinocyte differentiation produce irregular, thickened skin surface. Actinic keratoses (AKs) are premalignant lesions requiring medical monitoring. Rough texture represents epidermal dysregulation.', reversibility: 'Moderate topically (AHAs, retinoids improve texture). AKs require medical treatment — do not self-treat.', color: Colors.teal, icon: '🔵' },
  { type: 'Dilated Capillaries / Redness', mechanism: 'Repeated UV exposure causes chronic vasodilation and weakening of capillary walls. The permanent facial flushing and visible broken capillaries of sun-damaged skin are vascular, not inflammatory.', reversibility: 'Low for established telangiectasia — laser vascular treatment is most effective. Prevention is strongly preferable.', color: Colors.red + 'CC', icon: '🩸' },
];

const REVERSAL = [
  { ingredient: 'Retinoids (tretinoin / retinol)', priority: 'first-line', mechanism: 'Upregulates collagen gene expression, reverses MMP-mediated collagen breakdown, normalises keratinocyte differentiation, reduces pigmentation. The most clinically validated topical for photoaging reversal.', protocol: 'Start with 0.025% tretinoin or 0.3% retinol. Apply PM only. Increase concentration every 3–6 months. Minimum 6 months to assess collagen benefit. Sun protection non-negotiable.', icon: '⭐' },
  { ingredient: 'Vitamin C (L-ascorbic acid)', priority: 'first-line', mechanism: 'Inhibits melanin synthesis (fades pigmentation), stimulates collagen synthesis (cofactor for prolyl hydroxylase), neutralises free radicals from existing UV exposure. Directly reverses oxidative photodamage.', protocol: '10–20% LAA applied AM before SPF. Results in pigmentation at 8–12 weeks, collagen benefit at 3–6 months.', icon: '🍊' },
  { ingredient: 'Niacinamide', priority: 'first-line', mechanism: 'Inhibits melanosome transfer (reduces pigmentation), stimulates ceramide synthesis, assists DNA repair via NAD+ pathway, reduces MMP activity. Complements retinoid and vitamin C protocols.', protocol: '5% applied AM and/or PM. Well tolerated. Results at 8–12 weeks for pigmentation.', icon: '💊' },
  { ingredient: 'AHA chemical exfoliants', priority: 'second-line', mechanism: 'Accelerates shedding of pigmented surface cells, improves texture, increases product penetration by removing corneocyte buildup. Indirect support for reversal actives.', protocol: 'Glycolic acid 8–12% PM 2–3× weekly. Or mandelic acid for sensitive skin. Always SPF next morning.', icon: '⚗️' },
  { ingredient: 'Antioxidant combination', priority: 'second-line', mechanism: 'Vitamin C + vitamin E + ferulic acid neutralise existing free radical damage and prevent further oxidative damage from UV. The C+E+ferulic combo provides 8× the UV protection of vitamin C alone.', protocol: 'Vitamin C serum with vitamin E and ferulic acid applied AM. Or vitamin E from tallow PM side of the equation.', icon: '🛡️' },
  { ingredient: 'SPF (prevention/arrest)', priority: 'essential', mechanism: 'Prevents ongoing new photodamage that continuously counteracts reversal actives. Without consistent SPF, every reversal product is working against an accumulating UV burden. SPF stops the damage from progressing.', protocol: 'Mineral SPF 30–50 daily, every day, including winter. Reapply every 2 hours if outdoors. This is the highest-leverage single intervention for photoaging.', icon: '🌟' },
];

const PREVENTION_STACK = [
  { time: 'AM', step: 1, product: 'Vitamin C Serum (10–20%)', role: 'Antioxidant reserve for UV-induced free radical damage', critical: true },
  { time: 'AM', step: 2, product: 'Niacinamide 5%', role: 'DNA repair support, pigmentation inhibition, anti-inflammatory', critical: false },
  { time: 'AM', step: 3, product: 'Mineral SPF 30–50', role: 'Primary UV block — the most important step', critical: true },
  { time: 'AM', step: 4, product: 'SPF Reapplication every 2hrs (outdoors)', role: 'SPF degrades with UV exposure and sweating', critical: true },
  { time: 'PM', step: 1, product: 'Gentle cleanser', role: 'Remove oxidised sebum, pollution, and SPF', critical: true },
  { time: 'PM', step: 2, product: 'Retinoid (retinol or tretinoin)', role: 'Collagen synthesis, cell turnover, DNA repair', critical: false },
  { time: 'PM', step: 3, product: 'Tallow', role: 'Barrier support, vitamin A/E/D delivery, antioxidant protection', critical: false },
];

const TALLOW_ROLE = [
  { title: 'Vitamin E — the forgotten photoprotective antioxidant', body: 'Tallow from grass-fed cattle contains significant vitamin E (tocopherol). In the skin, vitamin E is the primary lipid-phase antioxidant — it neutralises free radicals within the lipid bilayer of the stratum corneum, where UV generates them. Applied before bed, tallow replenishes the vitamin E reserves depleted by daytime UV exposure.' },
  { title: 'Vitamin A as a gentle retinoid equivalent', body: 'Tallow contains vitamin A in the form of retinyl esters — a gentle precursor to the active retinoid retinoic acid. While not as potent as prescription tretinoin, retinyl esters from food-sourced tallow provide gentle cell turnover stimulation and support the epidermal renewal processes that counteract photoaging.' },
  { title: 'Barrier repair supports reversal active efficacy', body: 'Photoaged skin has a compromised barrier — chronic UV exposure degrades barrier lipids and impairs NMF synthesis. A compromised barrier reduces the efficacy of reversal actives like retinoids and vitamin C (they must penetrate through the barrier to reach target cells). Tallow, by restoring barrier integrity, improves the penetration and efficacy of other photoaging treatments.' },
  { title: 'PM antioxidant coverage vs AM vitamin C', body: 'Vitamin C is the AM antioxidant (active during UV exposure). Tallow with its vitamin E content provides PM antioxidant coverage when the skin is in active repair mode. These two antioxidants are complementary: vitamin C (water-soluble, AM) and vitamin E (lipid-soluble in tallow, PM) cover both the aqueous and lipid phases of the skin\'s antioxidant system.' },
  { title: 'Tallow does not replace SPF', body: 'Critical point: tallow has no meaningful SPF. It is not a sun protection agent. The tallow role in photoaging prevention is entirely in the PM: antioxidant support, barrier repair, and vitamin delivery. The photoprotection strategy is vitamin C + SPF in the AM. These are complementary, non-competing roles.' },
];

export default function PhotodamageScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedScience, setExpandedScience] = useState<number | null>(null);
  const [expandedDamage, setExpandedDamage] = useState<number | null>(null);
  const [expandedReversal, setExpandedReversal] = useState<number | null>(null);

  const priorityColor = (p: string) => p === 'first-line' ? Colors.green : p === 'essential' ? Colors.gold : Colors.teal;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photodamage Guide</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>☀️ Sun Damage & Photoaging</Text>
        <Text style={styles.heroSub}>80–90% of visible skin aging is UV-induced, not biological. Understanding photodamage is the foundation of any serious anti-aging strategy.</Text>
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
            {UV_SCIENCE.map((f, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedScience(expandedScience === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{f.icon}</Text>
                  <Text style={[styles.cardTitle, { flex: 1 }]}>{f.title}</Text>
                  <Text style={styles.expandIcon}>{expandedScience === i ? '▲' : '▼'}</Text>
                </View>
                {expandedScience === i && <Text style={styles.cardDetail}>{f.detail}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 1 && (
          <View>
            {DAMAGE_TYPES.map((d, i) => (
              <TouchableOpacity key={i} style={[styles.card, { borderLeftColor: d.color, borderLeftWidth: 3 }]} onPress={() => setExpandedDamage(expandedDamage === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{d.icon}</Text>
                  <Text style={[styles.cardTitle, { flex: 1, color: d.color }]}>{d.type}</Text>
                  <Text style={styles.expandIcon}>{expandedDamage === i ? '▲' : '▼'}</Text>
                </View>
                {expandedDamage === i && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.mechLabel}>Mechanism</Text>
                    <Text style={styles.cardDetail}>{d.mechanism}</Text>
                    <View style={styles.reversBlock}>
                      <Text style={styles.reversLabel}>Reversibility</Text>
                      <Text style={styles.reversText}>{d.reversibility}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 2 && (
          <View>
            <Text style={styles.sectionNote}>Photoaging reversal requires 6–18 months of consistent treatment. Results are measurable but require patience and uninterrupted SPF use throughout.</Text>
            {REVERSAL.map((r, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedReversal(expandedReversal === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{r.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{r.ingredient}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: priorityColor(r.priority) + '22', borderColor: priorityColor(r.priority) + '55' }]}>
                      <Text style={[styles.priorityText, { color: priorityColor(r.priority) }]}>{r.priority.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.expandIcon}>{expandedReversal === i ? '▲' : '▼'}</Text>
                </View>
                {expandedReversal === i && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.cardDetail}>{r.mechanism}</Text>
                    <View style={styles.protocolBlock}>
                      <Text style={styles.protocolLabel}>Protocol</Text>
                      <Text style={styles.protocolText}>{r.protocol}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 3 && (
          <View>
            {['AM', 'PM'].map(time => (
              <View key={time} style={{ marginBottom: 16 }}>
                <Text style={[styles.timeLabel, { color: time === 'AM' ? Colors.gold : Colors.blue }]}>{time === 'AM' ? '☀️ Morning' : '🌙 Evening'}</Text>
                {PREVENTION_STACK.filter(s => s.time === time).map((s, i) => (
                  <View key={i} style={[styles.stackRow, s.critical && { borderColor: Colors.gold + '55' }]}>
                    <View style={styles.stackStep}><Text style={styles.stackStepText}>{s.step}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stackProduct}>{s.product}</Text>
                      <Text style={styles.stackRole}>{s.role}</Text>
                    </View>
                    {s.critical && <Text style={styles.criticalBadge}>★</Text>}
                  </View>
                ))}
              </View>
            ))}
            <Text style={styles.legendText}>★ = Critical step — do not skip</Text>
          </View>
        )}

        {activeTab === 4 && (
          <View>
            <View style={styles.tallowHero}>
              <Text style={styles.tallowHeroTitle}>🌿 Tallow in Photoaging Prevention</Text>
              <Text style={styles.tallowHeroSub}>Tallow plays a specific PM role in the photodamage strategy — not as sun protection, but as the antioxidant and barrier recovery partner that supports daytime SPF.</Text>
            </View>
            {TALLOW_ROLE.map((p, i) => (
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
  cardDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  expandIcon: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  mechLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  reversBlock: { marginTop: 10, backgroundColor: Colors.cardAlt, borderRadius: 8, padding: 10 },
  reversLabel: { color: Colors.gold, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  reversText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  priorityBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginTop: 2 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  protocolBlock: { marginTop: 10, backgroundColor: Colors.green + '0D', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: Colors.green + '33' },
  protocolLabel: { color: Colors.green, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  protocolText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  timeLabel: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  stackRow: { backgroundColor: Colors.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  stackStep: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stackStepText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  stackProduct: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  stackRole: { color: Colors.textMuted, fontSize: 11 },
  criticalBadge: { color: Colors.gold, fontSize: 16 },
  legendText: { color: Colors.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  tallowHero: { backgroundColor: Colors.primary + '11', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.primary + '44', marginBottom: 14 },
  tallowHeroTitle: { color: Colors.primary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  tallowHeroSub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  tallowCardTitle: { color: Colors.gold, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowCardBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
