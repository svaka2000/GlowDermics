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

const TABS = ['Dry vs Dehydrated', 'Pinch Test', 'Causes', 'Fix It', 'Tallow Role'];

const COMPARISON = {
  dry: {
    label: 'DRY SKIN',
    color: Colors.gold,
    definition: 'A skin TYPE. Genetic — you produce less sebum than average. Sebaceous glands are less active. Dry skin lacks oil (lipids), not water.',
    characteristics: [
      'Feels rough or flaky all year round',
      'Gets worse in winter / cold / low humidity',
      'Minimal pore visibility',
      'Makeup clings or looks patchy',
      'Rarely experiences oiliness',
      'Tightness is chronic, not temporary',
    ],
    fix: 'Needs lipid supplementation — oils, butter, tallow. The missing ingredient is sebum, not water.',
    permanent: true,
  },
  dehydrated: {
    label: 'DEHYDRATED SKIN',
    color: Colors.blue,
    definition: 'A skin CONDITION. Temporary and fixable. Any skin type (including oily) can be dehydrated. Skin lacks water in the stratum corneum, not oil.',
    characteristics: [
      'Looks dull and feels tight after washing',
      'Fine lines appear more prominent (crinkly texture when skin is compressed)',
      'Skin feels oily and dry simultaneously',
      'Under-eye area appears sunken',
      'Makeup sits oddly on skin',
      'Temporary — changes with season, diet, and hydration',
    ],
    fix: 'Needs humectants (draw water in) + occlusives (seal water in). The missing ingredient is water, not oil.',
    permanent: false,
  },
};

const PINCH_TEST = [
  { step: 1, instruction: 'Cleanse face and wait 30 minutes', detail: 'Remove all products. Wait 30 minutes so skin can return to its baseline state without any product influence. Do not apply anything during this time.' },
  { step: 2, instruction: 'Look for surface texture', detail: 'In good lighting, gently compress a small area of cheek between two fingers (not pinching hard — just pressing inward slightly). Look at the texture. Well-hydrated skin: smooth, taut. Dehydrated skin: fine horizontal lines visible in the compressed area (like a crinkled surface).' },
  { step: 3, instruction: 'Assess after releasing', detail: 'Release the compression. Well-hydrated skin springs back immediately. Dehydrated skin: takes 1–2 seconds to return, or may look slightly "stuck" before returning. This is the turgor test — reduced skin turgor indicates low stratum corneum water content.' },
  { step: 4, instruction: 'Check oiliness vs tightness', detail: 'Press a clean tissue to your forehead and cheeks after 2 hours without products. Oil on tissue = sebum (skin type indicator). Tightness but no oil on tissue = possible dehydration. Oily tissue + still feels tight = dehydrated oily skin — the most confused skin state.' },
  { step: 5, instruction: 'Repeat after a week of focused hydration', detail: 'If your skin improves significantly after 5–7 days of focused hydration (drinking 2–3L water, HA serum, occlusive), it was dehydration. Dry skin type does not change with hydration alone — it needs lipids.' },
];

const CAUSES = [
  { cause: 'Insufficient water intake', detail: 'Skin is the last organ to receive water from the bloodstream. When total body hydration drops, skin water content drops last — but it does drop. 2.5–3L total daily fluid intake (food + drink) is the baseline for adequate skin hydration. Coffee and alcohol are diuretics that increase water loss.', icon: '🚰' },
  { cause: 'Over-cleansing or harsh cleansers', detail: 'High-pH cleansers (soap bars, foaming SLS cleansers) strip the Natural Moisturising Factor (NMF) — the skin\'s built-in humectant system made of amino acids, lactic acid, and PCA. Without NMF, the stratum corneum cannot hold water. Cleansing more than twice daily almost always causes dehydration.', icon: '🧼' },
  { cause: 'Air conditioning and heating', detail: 'Both dramatically lower indoor humidity. Air conditioned offices (20–30% RH) accelerate TEWL. Spending 8–10 hours per day in forced-air environments is a significant dehydration driver. A desktop humidifier during working hours makes a measurable difference.', icon: '❄️' },
  { cause: 'Low-fat diet', detail: 'The stratum corneum\'s barrier function depends on a lipid bilayer. Dietary fats provide essential fatty acids (linoleic, oleic) that the skin uses to build and maintain this barrier. Very low fat diets compromise barrier integrity, increasing TEWL and therefore dehydration.', icon: '🥗' },
  { cause: 'Over-exfoliation', detail: 'AHAs, BHAs, and physical exfoliants remove the outermost stratum corneum cells. This is intentional — but if overdone, it removes the NMF-containing corneocytes faster than they can be replenished, creating chronic surface dehydration and stinging from active ingredients.', icon: '⚗️' },
  { cause: 'Alcohol-containing toners and astringents', detail: 'Denatured alcohol (alcohol denat., SD alcohol) is one of the most rapidly dehydrating topical agents. It dissolves the lipid components of the barrier and disrupts the NMF layer. Many "clarifying" and "pore-minimising" toners are significant dehydration drivers.', icon: '🧪' },
  { cause: 'Caffeine and alcohol consumption', detail: 'Both are diuretics — they increase urine output, reducing systemic hydration. Even moderate coffee consumption (3+ cups) measurably reduces skin hydration markers in clinical studies if not compensated with additional water intake. Alcohol has a stronger diuretic effect.', icon: '☕' },
  { cause: 'High-glycaemic diet', detail: 'Elevated blood sugar glycates (sugar-damages) proteins including filaggrin — the protein that breaks down into NMF components. Chronic high glycaemic diet reduces NMF production, reducing the skin\'s capacity to retain water regardless of topical hydration.', icon: '🍞' },
];

const FIX_STEPS = [
  { step: 1, title: 'Switch to a gentle, pH-balanced cleanser', detail: 'pH 4.5–5.5 range. Cream, gel, or milk cleansers without SLS or SLES. This preserves the NMF and acid mantle during cleansing. Do not cleanse more than twice daily. In very dehydrated states, PM-only cleansing (no AM wash, just water rinse) is appropriate for 1–2 weeks.' },
  { step: 2, title: 'Apply HA to damp skin every AM and PM', detail: 'Hyaluronic acid serum on damp skin (immediately after cleansing, while skin still has residual moisture). Pat in. Do not rub. This is the humectant step — drawing water into the stratum corneum.' },
  { step: 3, title: 'Seal immediately with an occlusive', detail: 'Within 60 seconds of HA, apply an occlusive. Tallow (best), petrolatum (inert), or a ceramide-rich moisturiser. This prevents the water drawn by HA from evaporating. Without this step, HA can worsen dehydration in dry environments.' },
  { step: 4, title: 'Stop or reduce exfoliants for 1–2 weeks', detail: 'Give the stratum corneum time to rebuild NMF. Acids, retinoids, and physical exfoliants all disrupt the water-holding capacity of the corneocyte layer. Pause them, fix dehydration, then reintroduce slowly.' },
  { step: 5, title: 'Drink 2.5–3L of total fluids daily', detail: 'Internal hydration matters. Skin is the last organ to receive water from the bloodstream. Even modest dehydration (1–2% body weight in water loss) measurably reduces skin turgor and barrier function. Track intake for 1 week to establish baseline.' },
  { step: 6, title: 'Add a humidifier or desk mister', detail: '40–60% indoor humidity is ideal for skin water retention. Dry indoor air is a major driver of TEWL. A bedroom humidifier at night (when TEWL is already elevated during sleep) has the highest return-on-investment for skin hydration.' },
  { step: 7, title: 'Eat adequate dietary fat', detail: 'Essential fatty acids from diet are used to build barrier lipids. Include: oily fish (omega-3), grass-fed animal fats (oleic, palmitic), olive oil, avocado. Very low fat diets chronically impair barrier function and worsen dehydration regardless of topical intervention.' },
];

const TALLOW_ROLE = [
  { title: 'Tallow targets dry skin, not dehydration directly', body: 'Tallow is a lipid — it addresses dry skin (lack of sebum/oil) directly by supplementing the skin\'s lipid layer. It does not primarily function as a humectant. However, by improving barrier integrity (reducing TEWL), it dramatically reduces the rate of water loss, which helps dehydrated skin retain water longer.' },
  { title: 'The correct stack for dehydrated skin', body: 'Dehydrated skin needs water (HA) + seal (tallow). Apply HA serum to damp skin first. Allow 60 seconds. Apply tallow. The HA provides the water-binding humectant action; the tallow provides the lipid occlusive seal. This is the most effective two-product stack for dehydration.' },
  { title: 'Tallow\'s glycerin content: bonus humectant', body: 'Natural tallow contains glycerin (a breakdown product of triglyceride fats). Glycerin is itself a potent humectant. This gives tallow a dual function: primary occlusive barrier support + secondary humectant activity from its natural glycerin content.' },
  { title: 'Dehydrated oily skin and tallow', body: 'Dehydrated oily skin produces excess sebum as a compensation for lost water. The sebaceous glands increase output when the skin is dehydrated. Tallow (which is not "more oil" in the comedogenic sense — it is structurally similar to sebum) applied to oily-dehydrated skin often reduces oiliness by resolving the dehydration signal. The glands stop compensating.' },
  { title: 'Dry skin type long-term: tallow is the treatment', body: 'For genuine dry skin (genetic, year-round, insufficient sebum production), tallow is a long-term supplementation tool. It replaces what the sebaceous glands are not producing. For this skin type, tallow applied daily PM — and even a small amount AM — replaces the traditional heavy moisturiser protocol.' },
];

export default function DehydratedSkinScreen() {
  const [expandedCause, setExpandedCause] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dry vs Dehydrated</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>💧 Dry vs Dehydrated Skin</Text>
        <Text style={styles.heroSub}>The most confused skin concern in skincare. Treating dehydrated skin with dry-skin solutions (and vice versa) makes both worse. Identify correctly first.</Text>
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
            <View style={styles.comparisonGrid}>
              {[COMPARISON.dry, COMPARISON.dehydrated].map((c, i) => (
                <View key={i} style={[styles.compCard, { borderTopColor: c.color, borderTopWidth: 3 }]}>
                  <Text style={[styles.compLabel, { color: c.color }]}>{c.label}</Text>
                  <View style={[styles.permanentBadge, { backgroundColor: c.permanent ? Colors.red + '22' : Colors.green + '22', borderColor: c.permanent ? Colors.red + '55' : Colors.green + '55' }]}>
                    <Text style={[styles.permanentText, { color: c.permanent ? Colors.red : Colors.green }]}>{c.permanent ? 'PERMANENT TYPE' : 'FIXABLE CONDITION'}</Text>
                  </View>
                  <Text style={styles.compDefinition}>{c.definition}</Text>
                  <Text style={styles.compCharsLabel}>Signs</Text>
                  {c.characteristics.map((ch, j) => (
                    <Text key={j} style={styles.compChar}>• {ch}</Text>
                  ))}
                  <View style={[styles.fixBadge, { borderColor: c.color + '44' }]}>
                    <Text style={[styles.fixText, { color: c.color }]}>{c.fix}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 1 && (
          <View>
            <Text style={styles.sectionNote}>This simple at-home test takes 35 minutes total. You can do it right now.</Text>
            {PINCH_TEST.map((s, i) => (
              <View key={i} style={styles.stepCard}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{s.step}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{s.instruction}</Text>
                  <Text style={styles.stepDetail}>{s.detail}</Text>
                </View>
              </View>
            ))}
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>Key insight</Text>
              <Text style={styles.infoBoxText}>You can be oily AND dehydrated simultaneously. Oily skin is a sebum (oil) measure. Dehydrated skin is a water measure. They are independent variables. If you have oily, congested, yet tight and dull skin — you have dehydrated oily skin and need water (not less oil).</Text>
            </View>
          </View>
        )}

        {activeTab === 2 && (
          <View>
            {CAUSES.map((c, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedCause(expandedCause === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{c.icon}</Text>
                  <Text style={[styles.cardTitle, { flex: 1 }]}>{c.cause}</Text>
                  <Text style={styles.expandIcon}>{expandedCause === i ? '▲' : '▼'}</Text>
                </View>
                {expandedCause === i && <Text style={styles.cardDetail}>{c.detail}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 3 && (
          <View>
            <Text style={styles.sectionNote}>Dehydration fixes within 1–2 weeks of consistent protocol. Stick with this for 7 days before evaluating.</Text>
            {FIX_STEPS.map((s, i) => (
              <View key={i} style={styles.stepCard}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{s.step}</Text></View>
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
              <Text style={styles.tallowHeroTitle}>🌿 Tallow for Dry vs Dehydrated Skin</Text>
              <Text style={styles.tallowHeroSub}>Tallow addresses different aspects of dry and dehydrated skin. Understanding which you have determines how tallow fits into your protocol.</Text>
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
  comparisonGrid: { gap: 12 },
  compCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  compLabel: { fontSize: 16, fontWeight: '900', marginBottom: 6 },
  permanentBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginBottom: 8 },
  permanentText: { fontSize: 10, fontWeight: '700' },
  compDefinition: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 10 },
  compCharsLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 6 },
  compChar: { color: Colors.textSecondary, fontSize: 12, lineHeight: 20 },
  fixBadge: { marginTop: 10, borderRadius: 8, padding: 10, borderWidth: 1, backgroundColor: Colors.cardAlt },
  fixText: { fontSize: 12, fontWeight: '600', lineHeight: 18 },
  card: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardEmoji: { fontSize: 18, marginTop: 2 },
  cardTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  cardDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 10 },
  expandIcon: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  stepCard: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  stepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  stepTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  stepDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  infoBox: { backgroundColor: Colors.blue + '11', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.blue + '33', marginTop: 6 },
  infoBoxTitle: { color: Colors.blue, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  infoBoxText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  tallowHero: { backgroundColor: Colors.primary + '11', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.primary + '44', marginBottom: 14 },
  tallowHeroTitle: { color: Colors.primary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  tallowHeroSub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  tallowCardTitle: { color: Colors.gold, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowCardBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
