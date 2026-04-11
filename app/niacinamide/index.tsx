import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';

const Colors = {
  bg: '#0A0A0F', card: '#13131A', cardAlt: '#1A1A24', border: '#2A2A3A',
  primary: '#C4622D', gold: '#D4A96A', textPrimary: '#FAF3E0',
  textSecondary: '#9A9AAF', textMuted: '#5A5A6E',
  green: '#4ADE80', red: '#F87171', blue: '#60A5FA', purple: '#6B85A8', teal: '#2DD4BF',
};

const TABS = ['Science', 'Benefits', 'How to Use', 'Combinations', 'Tallow Stack'];

const SCIENCE_FACTS = [
  { fact: 'Niacinamide is vitamin B3 — a water-soluble essential nutrient', detail: 'Also called nicotinamide. Unlike retinol (vitamin A) and vitamin C, niacinamide is a B vitamin — stable, non-irritating, and effective across a wide pH range (4–8). It does not require a specific acidic environment to work. This makes it one of the most formulation-friendly actives in skincare.', icon: '🧪' },
  { fact: 'It converts to NAD+ in the skin', detail: 'Niacinamide converts to NAD (nicotinamide adenine dinucleotide) and NADP intracellularly. NAD+ is a critical coenzyme for 500+ cellular reactions, including DNA repair, energy metabolism, and antioxidant defence (via NADPH which regenerates glutathione). Topical application measurably increases skin NAD+ levels.', icon: '⚡' },
  { fact: 'Stimulates ceramide synthesis within 4 weeks', detail: 'Multiple clinical trials show 2–5% niacinamide significantly increases ceramide, fatty acid, and cholesterol synthesis in the stratum corneum. This is one of the only topical ingredients with robust clinical evidence for directly repairing the lipid barrier — not just hydrating it.', icon: '🛡️' },
  { fact: 'Inhibits melanosome transfer without affecting melanocyte function', detail: 'Vitamin C inhibits melanin production. Niacinamide works differently: it inhibits the transfer of melanosomes (melanin-containing packages) from melanocytes to keratinocytes. Even if melanin is produced normally, it cannot deposit into skin cells. This downstream action is unique among brighteners.', icon: '🎨' },
  { fact: 'Anti-sebum: reduces sebum excretion rate', detail: '2% niacinamide applied for 8 weeks significantly reduced sebum excretion rate (SER) in clinical studies. Mechanism: niacinamide inhibits sebocyte differentiation (the process by which cells become sebum-producing). Effective for oily skin and enlarged pores.', icon: '💧' },
  { fact: 'TEWL reduction of up to 24% in studies', detail: 'The ceramic synthesis boost translates directly to reduced transepidermal water loss. Studies using 2% niacinamide showed 24% TEWL reduction after 6 weeks. This is clinically significant — comparable to prescription barrier repair creams.', icon: '🌊' },
];

const BENEFITS = [
  { benefit: 'Barrier repair', detail: 'Stimulates ceramide, cholesterol, and fatty acid synthesis. Quantifiably reduces TEWL. One of few ingredients with direct clinical evidence for structural barrier improvement — not just surface hydration.', evidence: 'strong', icon: '🛡️' },
  { benefit: 'Brightening / fading dark spots', detail: 'Inhibits melanosome transfer from melanocytes to keratinocytes. 5% niacinamide shows comparable brightening to 2% hydroquinone in a 12-week head-to-head trial, with significantly less irritation.', evidence: 'strong', icon: '✨' },
  { benefit: 'Pore minimisation', detail: 'Reduces sebum excretion rate, which reduces pore congestion and apparent pore size. Effect is real but modest — approximately 16% reduction in pore visibility at 2% concentration over 8 weeks. Not as dramatic as BHA.', evidence: 'moderate', icon: '🔍' },
  { benefit: 'Anti-inflammatory (acne, rosacea)', detail: 'Inhibits inflammatory cytokine production (IL-8, IL-6). 4% niacinamide gel showed equivalent efficacy to 1% clindamycin for inflammatory acne in one trial. Anti-inflammatory via PGE2 suppression is also relevant for rosacea erythema.', evidence: 'strong', icon: '🔥' },
  { benefit: 'Anti-aging: fine lines and skin elasticity', detail: 'In a 12-week study, 5% niacinamide significantly reduced fine lines, red blotchiness, and improved skin texture. Mechanism: upregulates dermal collagen production and inhibits photocarcinogenesis. Not as potent as retinol but complementary.', evidence: 'moderate', icon: '⏰' },
  { benefit: 'DNA repair assistance', detail: 'Topical NAD+ precursors (niacinamide) increase the activity of PARP-1, a DNA repair enzyme. PARP-1 repairs single-strand DNA breaks caused by UV radiation. Niacinamide is one of the few topicals with mechanistic evidence for UV-induced DNA repair.', evidence: 'emerging', icon: '🧬' },
  { benefit: 'Redness and blotchiness reduction', detail: 'Through anti-inflammatory pathways, niacinamide measurably reduces persistent erythema. In one study, 5% niacinamide reduced facial hyperpigmented and red blotchiness comparably to tretinoin, without tretinoin\'s irritation profile.', evidence: 'moderate', icon: '🩸' },
];

const HOW_TO_USE = [
  { step: 1, title: 'Concentration: start at 2–5%', detail: 'Effective range is 2–10%. Most studies used 2–5%. There is no evidence that concentrations above 5% are more effective — and above 10%, flushing (from niacin conversion) becomes more likely in some individuals. Start at 2–5%.' },
  { step: 2, title: 'Works at any pH — no timing restrictions', detail: 'Unlike LAA (needs pH < 3.5) or AHAs (need pH < 4), niacinamide is effective across pH 4–8. This means it can be layered with virtually anything without concern for pH compatibility. Apply after water-based serums, before moisturisers.' },
  { step: 3, title: 'AM and/or PM — both are effective', detail: 'Niacinamide can be used morning and evening. AM use: anti-inflammatory and sebum control benefit during the day. PM use: ceramide synthesis stimulation overnight when barrier repair peaks. Many people find it beneficial twice daily.' },
  { step: 4, title: 'Wait for absorption before next step', detail: '30–60 seconds is sufficient. Niacinamide is water-soluble and absorbs quickly on clean skin. No need for the extended wait times required by LAA. Apply serum, pat, proceed after 30–60 seconds.' },
  { step: 5, title: 'Skin flushing: when and why', detail: 'A minority of people experience skin flushing (temporary redness, warmth) from niacinamide at concentrations of 5%+. This is caused by conversion to niacin (nicotinic acid) which causes vasodilation. It is harmless but uncomfortable. If it occurs: lower concentration, switch brands (purity varies), or stop. Most people do not flush from cosmetic formulations.' },
  { step: 6, title: 'Duration: 4–8 weeks to see results', detail: 'Ceramide synthesis improvements begin within 2 weeks but are clinically significant at 4–8 weeks. Brightening effects (melanosome transfer inhibition) show measurable results at 8–12 weeks. Commit to a consistent period before evaluating efficacy.' },
];

const COMBINATIONS = [
  { combo: 'Niacinamide + Retinol', verdict: 'Excellent', detail: 'These two ingredients are often called the "power couple." Retinol increases cell turnover (can cause dryness, irritation). Niacinamide repairs the barrier that retinol disrupts. Used together, niacinamide significantly reduces retinol irritation while adding complementary brightening and barrier benefits. Apply retinol first on dry skin, then niacinamide serum over.', color: Colors.green },
  { combo: 'Niacinamide + Vitamin C', verdict: 'Compatible', detail: 'Old myth: they react to form a yellow niacin compound. Modern research: this reaction is negligible at normal skincare temperatures and concentrations. They are compatible and actually complementary — vitamin C inhibits melanin production while niacinamide inhibits melanosome transfer. Two-pathway pigmentation approach.', color: Colors.teal },
  { combo: 'Niacinamide + AHA/BHA', verdict: 'Excellent', detail: 'Chemical exfoliants cause post-exfoliation sensitivity by temporarily disrupting the barrier. Niacinamide immediately after (or on alternating days) rebuilds the ceramide layer. The combination: exfoliate with acid → follow with niacinamide → barrier repaired quickly. Apply niacinamide 30+ minutes after AHA for best results.', color: Colors.green },
  { combo: 'Niacinamide + SPF', verdict: 'Excellent', detail: 'Niacinamide under SPF provides dual photo-protection: SPF blocks UV; niacinamide (via NAD+ pathway) assists with DNA repair of UV-induced damage that gets through. Daily niacinamide in an SPF-wearing routine measurably reduces UV-induced photoaging.', color: Colors.green },
  { combo: 'Niacinamide + Hyaluronic Acid', verdict: 'Excellent', detail: 'HA provides immediate surface hydration (hygroscopic water-binding). Niacinamide builds long-term barrier infrastructure (ceramide synthesis). Short-term and long-term hydration simultaneously. These are the two complementary hydration mechanisms, addressed by each ingredient.', color: Colors.green },
  { combo: 'Niacinamide + BHA (Salicylic Acid)', verdict: 'Excellent', detail: 'BHA clears pore blockages. Niacinamide reduces sebum production. Both address oily/acne-prone skin through different mechanisms. Apply BHA first on dry skin (pH needs to be low for penetration), wait 20–30 minutes, then niacinamide. The combination is particularly effective for oily, congested skin.', color: Colors.green },
];

const TALLOW_STACK = [
  { title: 'Niacinamide before tallow: the correct order', body: 'Niacinamide is water-soluble — it must contact the aqueous phase of skin before any occlusive is applied. Apply niacinamide serum on clean skin, allow 60–90 seconds, then apply tallow. Applying tallow first would block niacinamide penetration.' },
  { title: 'Complementary barrier mechanisms', body: 'Niacinamide stimulates ceramide synthesis (internal barrier building). Tallow provides the three barrier lipids directly (external barrier support). These two mechanisms address barrier repair from both directions: tallow fills gaps now; niacinamide rebuilds the infrastructure to maintain them long-term.' },
  { title: 'Niacinamide\'s sebum reduction + tallow\'s non-comedogenic profile', body: 'A common concern: will tallow make oily skin worse? Niacinamide\'s sebum-reducing effect reduces this risk by lowering sebaceous gland activity. Applied together, niacinamide reduces the sebum that could interact with topical oils, while tallow provides barrier support without adding comedogenic risk to properly applied skin.' },
  { title: 'Anti-aging stack: niacinamide + tallow\'s vitamins', body: 'For anti-aging: niacinamide upregulates collagen production and assists DNA repair. Tallow contributes vitamin A (retinyl ester form — gentle retinoid activity), vitamin E (antioxidant, lipid protection), and vitamin D (skin immune modulation). The combination addresses multiple aging pathways simultaneously.' },
  { title: 'PM protocol recommendation', body: 'PM: cleanser → niacinamide serum (60 sec) → (retinol if using, then 20 min wait) → tallow. This sequence allows niacinamide to penetrate, lets retinol absorb if using, and finishes with tallow as the overnight occlusive barrier support. Comprehensive, well-ordered, layered correctly.' },
];

export default function NiacinamideScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedFact, setExpandedFact] = useState<number | null>(null);
  const [expandedBenefit, setExpandedBenefit] = useState<number | null>(null);
  const [expandedCombo, setExpandedCombo] = useState<number | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const evidenceColor = (e: string) => e === 'strong' ? Colors.green : e === 'moderate' ? Colors.gold : Colors.blue;
  const verdictColor = (v: string) => v === 'Excellent' ? Colors.green : v === 'Compatible' ? Colors.teal : Colors.gold;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Niacinamide Guide</Text>
        <View style={{ width: 60 }} />
      </Animated.View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>💊 Niacinamide (B3)</Text>
        <Text style={styles.heroSub}>The most versatile skincare active. Barrier repair, brightening, sebum control, anti-aging, anti-inflammatory — all in one ingredient. And it plays well with everything.</Text>
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
            {SCIENCE_FACTS.map((f, i) => (
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
            {BENEFITS.map((b, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedBenefit(expandedBenefit === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{b.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{b.benefit}</Text>
                    <View style={[styles.evidenceBadge, { backgroundColor: evidenceColor(b.evidence) + '22', borderColor: evidenceColor(b.evidence) + '55' }]}>
                      <Text style={[styles.evidenceText, { color: evidenceColor(b.evidence) }]}>{b.evidence} evidence</Text>
                    </View>
                  </View>
                  <Text style={styles.expandIcon}>{expandedBenefit === i ? '▲' : '▼'}</Text>
                </View>
                {expandedBenefit === i && <Text style={styles.cardDetail}>{b.detail}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 2 && (
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

        {activeTab === 3 && (
          <View>
            <Text style={styles.sectionNote}>Niacinamide pairs well with almost every common skincare active. It is uniquely non-competitive in layering routines.</Text>
            {COMBINATIONS.map((c, i) => (
              <TouchableOpacity key={i} style={[styles.card, { borderLeftColor: verdictColor(c.verdict), borderLeftWidth: 3 }]} onPress={() => setExpandedCombo(expandedCombo === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{c.combo}</Text>
                    <View style={[styles.verdictBadge, { backgroundColor: verdictColor(c.verdict) + '22', borderColor: verdictColor(c.verdict) + '55' }]}>
                      <Text style={[styles.verdictText, { color: verdictColor(c.verdict) }]}>{c.verdict}</Text>
                    </View>
                  </View>
                  <Text style={styles.expandIcon}>{expandedCombo === i ? '▲' : '▼'}</Text>
                </View>
                {expandedCombo === i && <Text style={styles.cardDetail}>{c.detail}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 4 && (
          <View>
            <View style={styles.tallowHero}>
              <Text style={styles.tallowHeroTitle}>🌿 Niacinamide + Tallow</Text>
              <Text style={styles.tallowHeroSub}>Niacinamide and tallow address barrier repair from opposite directions — one builds infrastructure, the other fills gaps. Together they are more complete than either alone.</Text>
            </View>
            {TALLOW_STACK.map((p, i) => (
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
  evidenceBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginTop: 2 },
  evidenceText: { fontSize: 10, fontWeight: '700' },
  verdictBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginTop: 2 },
  verdictText: { fontSize: 10, fontWeight: '700' },
  stepCard: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  stepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  stepTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  stepDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  tallowHero: { backgroundColor: Colors.primary + '11', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.primary + '44', marginBottom: 14 },
  tallowHeroTitle: { color: Colors.primary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  tallowHeroSub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  tallowCardTitle: { color: Colors.gold, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowCardBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
