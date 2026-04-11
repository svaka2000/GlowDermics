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
  green: '#4ADE80', red: '#F87171', blue: '#60A5FA', orange: '#FB923C', teal: '#2DD4BF',
};

const TABS = ['Science', 'Forms', 'How to Use', 'Combinations', 'Tallow Stack'];

const VC_FACTS = [
  { fact: 'Vitamin C cannot be synthesised by humans', detail: 'Unlike most animals, humans lack the enzyme L-gulonolactone oxidase that converts glucose to ascorbic acid. We must obtain 100% of our vitamin C from diet or topicals. The skin has active transport mechanisms specifically to concentrate ascorbic acid in skin tissue.', icon: '🧬' },
  { fact: 'Skin vitamin C is depleted by UV in 30 minutes', detail: 'A single dose of UV radiation (even brief sun exposure) depletes up to 50% of the skin\'s ascorbic acid reserves. Without replenishment, the skin\'s antioxidant defence against UV-induced free radical damage is compromised for hours.', icon: '☀️' },
  { fact: 'Vitamin C is essential for collagen synthesis', detail: 'Collagen synthesis cannot occur without vitamin C. Specifically, it acts as a cofactor for prolyl hydroxylase and lysyl hydroxylase — the enzymes that cross-link collagen chains and give collagen its mechanical strength. Without adequate vitamin C, collagen is structurally unstable.', icon: '🔗' },
  { fact: 'Topical is more effective than oral for skin', detail: 'Oral vitamin C saturates at ~30µM in plasma. Topical application can achieve 20–40× higher concentrations in the stratum corneum than diet alone. Topical 20% L-ascorbic acid achieves skin concentrations of 400–500µM — dramatically above the threshold for biological activity.', icon: '💊' },
  { fact: 'It inhibits melanogenesis at 3 steps', detail: 'Vitamin C inhibits the production of melanin through 3 separate mechanisms: (1) inhibiting tyrosinase enzyme activity, (2) reducing dopaquinone (a melanin intermediate) back to DOPA, and (3) reducing melanin already formed. This multi-step action makes it effective for existing and new hyperpigmentation.', icon: '🎨' },
  { fact: 'pH below 3.5 is required for L-ascorbic acid absorption', detail: 'L-ascorbic acid (the pure form) must be formulated at pH 2.5–3.5 to be absorbed into skin. Above this pH, the molecule ionises and cannot penetrate the lipid-rich stratum corneum. This low pH is responsible for the stinging sensation on sensitive or compromised skin.', icon: '⚗️' },
  { fact: 'Vitamin C recycling: E regenerates C', detail: 'After vitamin C neutralises a free radical, it becomes a dehydroascorbyl radical (spent vitamin C). Vitamin E can donate an electron to regenerate active vitamin C. This is why vitamin C + vitamin E combinations are synergistic — each regenerates the other in a recycling loop.', icon: '♻️' },
];

const VC_FORMS = [
  {
    name: 'L-Ascorbic Acid (LAA)',
    stability: 'low',
    potency: 5,
    irritation: 'high',
    bestFor: 'Brightening, collagen, pigmentation — when you can tolerate it',
    avoid: 'Sensitive skin, rosacea, compromised barrier',
    note: 'The gold standard. Most studied, most effective. Oxidises quickly (turns orange/yellow in bottle = ineffective). Best at 10–20% at pH 2.5–3.5. Refrigerate. Use within 3 months.',
    color: Colors.orange,
  },
  {
    name: 'Ascorbyl Glucoside (AA-2G)',
    stability: 'high',
    potency: 2,
    irritation: 'low',
    bestFor: 'Sensitive skin, beginners, combination with actives',
    avoid: 'Nothing — most tolerated form',
    note: 'Glucose molecule stabilises vitamin C. Enzyme in skin (glucoamylase) cleaves the glucose, releasing free ascorbic acid at the site. Gentle, long shelf life. Less potent but consistent delivery.',
    color: Colors.green,
  },
  {
    name: 'Ascorbyl Tetraisopalmitate (VC-IP)',
    stability: 'high',
    potency: 3,
    irritation: 'low',
    bestFor: 'Dry skin, oil-preferring routines, layering with tallow',
    avoid: 'Nothing significant',
    note: 'Oil-soluble vitamin C ester. Penetrates the lipid-rich stratum corneum differently than water-soluble forms. Compatible with oil-based routines. Stable, comfortable, and effective at 3–5%.',
    color: Colors.gold,
  },
  {
    name: 'Sodium Ascorbyl Phosphate (SAP)',
    stability: 'moderate',
    potency: 2,
    irritation: 'low',
    bestFor: 'Acne-prone skin (bonus: antimicrobial against C. acnes)',
    avoid: 'Nothing significant',
    note: 'Phosphate group stabilises the molecule. Additional benefit: studies show 5% SAP reduces acne lesion counts significantly — comparable to 5% benzoyl peroxide without drying. Unique bonus for acne-prone users.',
    color: Colors.teal,
  },
  {
    name: '3-O-Ethyl Ascorbic Acid (3-O-EAA)',
    stability: 'high',
    potency: 4,
    irritation: 'low-moderate',
    bestFor: 'Brightening, pigmentation, compromise between LAA and gentle forms',
    avoid: 'Compromised barrier at high concentrations',
    note: 'Ethyl ester form. More stable than LAA, more potent than glucoside. Operates closer to the efficacy of LAA but with lower instability risk. At 2–5% is well tolerated by most skin types.',
    color: Colors.blue,
  },
  {
    name: 'Magnesium Ascorbyl Phosphate (MAP)',
    stability: 'moderate',
    potency: 2,
    irritation: 'very low',
    bestFor: 'Hydration + vitamin C — has humectant properties alongside antioxidant action',
    avoid: 'Nothing',
    note: 'The most hydrating vitamin C form. Converts to ascorbic acid slowly in skin. At 10%, provides measurable antioxidant protection with a hydration boost. Often paired with hyaluronic acid.',
    color: (Colors as any).purple ?? '#6B85A8',
  },
];

const HOW_TO_USE = [
  { step: 1, title: 'Choose the right form for your skin', detail: 'Healthy, non-sensitive skin: start with 10% L-ascorbic acid and work up to 15–20%. Sensitive/compromised skin: begin with ascorbyl glucoside or SAP. Acne-prone: SAP specifically. Dry/oil-routine users: VC-IP for compatibility with oils and tallow.' },
  { step: 2, title: 'Apply on dry skin in the AM', detail: 'Apply vitamin C serum on a dry, clean face. Pat on — do not rub. Wait 60–90 seconds before the next step. Morning application is best: (1) protects against UV-induced free radical damage during the day, (2) boosts SPF\'s antioxidant defence.' },
  { step: 3, title: 'Wait for full absorption', detail: 'Vitamin C needs to fully absorb before SPF is applied over it. Rushing this step = vitamin C trapped under SPF before penetrating, reducing efficacy. 60 seconds minimum, 3 minutes ideal.' },
  { step: 4, title: 'Layer SPF immediately after', detail: 'The vitamin C + SPF combination is synergistic. SPF reduces the photons reaching skin; vitamin C neutralises the free radicals from the photons that get through. The duo together provides dramatically more protection than either alone.' },
  { step: 5, title: 'Introduce slowly', detail: 'If using LAA, start with 10% on alternate mornings for 2 weeks, then daily. Jumping to 20% daily with sensitive skin risks irritation and barrier damage — which then requires stopping vitamin C entirely to repair. Slow wins.' },
  { step: 6, title: 'Store correctly', detail: 'L-ascorbic acid: refrigerate, use within 3 months of opening, discard if orange/yellow/brown (oxidised). Stable derivatives: room temperature, away from light. An oxidised vitamin C serum does not work — it may even produce free radicals instead of neutralising them.' },
];

const COMBINATIONS = [
  { combo: 'Vitamin C + Vitamin E', verdict: 'Synergistic', detail: 'The classic duo. Vitamin E regenerates spent vitamin C after free radical neutralisation. Together they provide 8× more UV protection than either alone (Pinnell 1996 study). Always combine for maximum antioxidant effect.', color: Colors.green },
  { combo: 'Vitamin C + SPF', verdict: 'Synergistic', detail: 'SPF prevents photon damage. Vitamin C neutralises breakthrough free radical damage. Different mechanisms, complementary protection. Apply vitamin C first, SPF over. Never skip SPF when using vitamin C — UV degrades it rapidly.', color: Colors.green },
  { combo: 'Vitamin C + Ferulic Acid', verdict: 'Synergistic', detail: 'Ferulic acid doubles the stability of L-ascorbic acid and extends its antioxidant efficacy by reducing its oxidation rate. Found in the famous SkinCeuticals CE Ferulic formulation. Provides 4× better UV protection than C+E alone.', color: Colors.green },
  { combo: 'Vitamin C + Niacinamide', verdict: 'Compatible', detail: 'Previously believed to form niacin (yellowing, flushing). Modern studies show this reaction is negligible at skin temperature and normal formulation concentrations. They can be used together without issue. Both address pigmentation through different pathways.', color: Colors.teal },
  { combo: 'Vitamin C + Retinol', verdict: 'Separate (different times)', detail: 'Both are effective but vitamin C is best AM (antioxidant during UV exposure) and retinol is best PM (photosensitive, needs overnight dwell time). Layering them together is not harmful, but using them at their optimal times is more effective.', color: Colors.gold },
  { combo: 'Vitamin C + AHA/BHA', verdict: 'Caution — separate', detail: 'LAA at pH 3.5 and AHA at pH 3.5: stacking two low-pH products significantly increases irritation risk and barrier disruption. Use at separate times (vitamin C AM, acids PM) or choose stable vitamin C derivatives that do not require low pH.', color: Colors.red },
  { combo: 'Vitamin C + Benzoyl Peroxide', verdict: 'Avoid together', detail: 'Benzoyl peroxide oxidises vitamin C on contact, rendering it inactive. If using BP in a routine, apply vitamin C at a completely separate time (morning vs evening) with thorough cleansing between applications.', color: Colors.red },
];

const TALLOW_STACK = [
  { title: 'VC-IP + Tallow: the oil-soluble pairing', body: 'Ascorbyl tetraisopalmitate (VC-IP) is oil-soluble — it disperses readily in fatty acids. A VC-IP serum applied before tallow means the vitamin C is carried deeper into the lipid-rich stratum corneum as the tallow integrates. This pairing works particularly well for dry and mature skin.' },
  { title: 'Vitamin E in tallow regenerates vitamin C', body: 'Grass-fed tallow contains significant vitamin E (tocopherol). When topical vitamin C is applied before tallow, the vitamin E in the tallow helps regenerate spent vitamin C within the skin — creating the antioxidant recycling loop that makes C+E so effective.' },
  { title: 'Vitamin A (retinol equivalent) in tallow + vitamin C', body: 'Tallow contains vitamin A (retinyl esters). Vitamin A and vitamin C work through complementary pathways: C stimulates collagen synthesis via prolyl hydroxylase cofactor activity; A (via RAR signalling) upregulates collagen gene expression. The combination addresses collagen from two angles.' },
  { title: 'Application order', body: 'Apply water-soluble vitamin C serum first. Allow 60–90 seconds to absorb. Then apply tallow. The water-soluble serum sits in the aqueous phase; the tallow (lipid phase) goes over it and seals it in. This is the correct order — tallow before vitamin C would block water-soluble serum penetration.' },
  { title: 'Tallow as buffer for LAA sensitivity', body: 'Some users find L-ascorbic acid too irritating alone. Applying a very thin layer of tallow first (as a semi-permeable barrier) and then LAA serum — the "modified sandwich" — reduces stinging while still allowing some vitamin C penetration. Less effective but more tolerable during barrier rebuilding.' },
  { title: 'PM vs AM division', body: 'The optimal protocol: AM → vitamin C serum → SPF. PM → gentle cleanser → (retinol if using) → tallow. This keeps vitamin C in the antioxidant/UV-protection role and tallow in the overnight repair/barrier support role. Avoiding vitamin C PM reduces potential photosensitivity from any residual active on skin.' },
];

export default function VitaminCScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedFact, setExpandedFact] = useState<number | null>(null);
  const [expandedForm, setExpandedForm] = useState<number | null>(null);
  const [expandedCombo, setExpandedCombo] = useState<number | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const verdictColor = (v: string) => v === 'Synergistic' ? Colors.green : v === 'Compatible' ? Colors.teal : v === 'Caution — separate' ? Colors.gold : Colors.red;
  const stabilityColor = (s: string) => s === 'high' ? Colors.green : s === 'moderate' ? Colors.gold : Colors.red;
  const potencyDots = (n: number) => Array.from({ length: 5 }, (_, i) => i < n ? '●' : '○').join('');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vitamin C Guide</Text>
        <View style={{ width: 60 }} />
      </Animated.View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>🍊 Vitamin C</Text>
        <Text style={styles.heroSub}>The most evidence-backed brightening and antioxidant ingredient in skincare. Six different forms with vastly different efficacy, stability, and tolerability — knowing which to use changes everything.</Text>
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
            {VC_FACTS.map((f, i) => (
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
            <Text style={styles.sectionNote}>All forms convert to ascorbic acid in skin, but differ greatly in stability, penetration, and required pH. Match the form to your skin type and routine.</Text>
            {VC_FORMS.map((f, i) => (
              <TouchableOpacity key={i} style={[styles.card, { borderLeftColor: f.color, borderLeftWidth: 3 }]} onPress={() => setExpandedForm(expandedForm === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: f.color }]}>{f.name}</Text>
                    <View style={styles.formMeta}>
                      <Text style={styles.potencyText}>{potencyDots(f.potency)}</Text>
                      <View style={[styles.stabBadge, { backgroundColor: stabilityColor(f.stability) + '22', borderColor: stabilityColor(f.stability) + '55' }]}>
                        <Text style={[styles.stabText, { color: stabilityColor(f.stability) }]}>{f.stability} stability</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.expandIcon}>{expandedForm === i ? '▲' : '▼'}</Text>
                </View>
                {expandedForm === i && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.cardDetail}>{f.note}</Text>
                    <View style={styles.infoRow}><Text style={styles.infoLabel}>Best for</Text><Text style={styles.infoVal}>{f.bestFor}</Text></View>
                    <View style={styles.infoRow}><Text style={styles.infoLabel}>Avoid if</Text><Text style={styles.infoVal}>{f.avoid}</Text></View>
                  </View>
                )}
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
              <Text style={styles.tallowHeroTitle}>🌿 Vitamin C + Tallow Stack</Text>
              <Text style={styles.tallowHeroSub}>Vitamin C and tallow address skin health from complementary angles. Understanding how to sequence them unlocks the benefits of both without interference.</Text>
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
  formMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  potencyText: { color: Colors.gold, fontSize: 11, letterSpacing: 2 },
  stabBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  stabText: { fontSize: 10, fontWeight: '700' },
  infoRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  infoLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', width: 65 },
  infoVal: { color: Colors.textSecondary, fontSize: 12, flex: 1 },
  stepCard: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  stepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  stepTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  stepDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  verdictBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginTop: 2 },
  verdictText: { fontSize: 10, fontWeight: '700' },
  tallowHero: { backgroundColor: Colors.primary + '11', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.primary + '44', marginBottom: 14 },
  tallowHeroTitle: { color: Colors.primary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  tallowHeroSub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  tallowCardTitle: { color: Colors.gold, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowCardBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
