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

const TABS = ['Benefits', 'Exercise Types', 'Pre & Post', 'Skin During Exercise', 'Tallow Protocol'];

const EXERCISE_BENEFITS = [
  { benefit: 'Growth hormone secretion: the collagen trigger', detail: 'Resistance training and high-intensity interval training (HIIT) are the strongest known non-pharmaceutical stimulants of growth hormone (GH) secretion. GH directly stimulates collagen synthesis in fibroblasts and IGF-1 production. Regular strength training measurably increases dermal collagen density in multiple studies — an anti-aging effect not achievable through topicals alone.', icon: '💪' },
  { benefit: 'Improved dermal blood flow and oxygenation', detail: 'Exercise increases cardiac output and vasodilates peripheral blood vessels. Skin blood flow increases 4–7× during moderate exercise. This floods the dermis with oxygen, glucose, and micronutrients — and removes metabolic waste products. Regular exercisers have measurably higher resting skin blood flow and better nutrient delivery between sessions.', icon: '❤️' },
  { benefit: 'Cortisol regulation: the stress-skin connection', detail: 'Regular aerobic exercise significantly reduces resting cortisol levels and cortisol reactivity to stressors. Lower baseline cortisol = reduced sebum production, reduced skin inflammation, and improved barrier function. The anti-cortisol effect of exercise is one of its most clinically significant but underappreciated skin benefits.', icon: '🧘' },
  { benefit: 'Skin microbiome diversity increases with fitness', detail: 'Studies on athletes vs sedentary controls consistently show significantly greater gut and skin microbiome diversity in active individuals. This diversity correlates with lower rates of acne, eczema, and rosacea. Mechanistically: exercise-induced changes in body temperature, sweat composition, and systemic inflammation all affect microbial ecology.', icon: '🦠' },
  { benefit: 'Telomere protection: exercise slows cellular aging', detail: 'Telomere length is a cellular aging marker. Regular endurance exercise (running, swimming, cycling) measurably reduces telomere shortening rate. Marathon runners have telomeres up to 15 years younger than sedentary age-matched controls. Skin cells are included — exercise slows the cellular clock.', icon: '🧬' },
  { benefit: 'Sweat: natural skin cleansing', detail: 'Eccrine sweat contains antimicrobial peptides (dermcidin) that selectively inhibit pathogenic bacteria. The act of sweating flushes follicle contents. Dermal interstitial pressure during intense exercise also helps mobilise waste products from skin tissue. The catch: sweat must be rinsed off promptly to prevent follicle re-clogging.', icon: '💧' },
];

const EXERCISE_TYPES = [
  { type: 'Resistance Training', skinEffect: 'Highest GH secretion = strongest collagen-stimulating effect. Compound movements (squat, deadlift, bench) produce more GH than isolated exercises. 3–4× weekly. Best skin anti-aging workout type by GH criteria.', skinRisks: 'Friction from equipment on face. Gym hygiene contact points. Sweating in tight athletic wear.', icon: '🏋️', color: Colors.primary },
  { type: 'HIIT (High-Intensity Intervals)', skinEffect: 'Second strongest GH secretion. Also produces the "afterburn" (EPOC) that extends metabolic elevation for hours — including extended skin blood flow benefit. Anti-inflammatory over time despite acute inflammation during sessions.', skinRisks: 'Most intense sweating — shower promptly. High cortisol spike during session (normalises in 30–60 min).', icon: '⚡', color: Colors.gold },
  { type: 'Steady-State Cardio (running, cycling, swimming)', skinEffect: 'Lower GH but highest vasodilation and blood flow. Best for consistent dermal oxygenation. Most cortisol-reducing effect over time (chronic adaptation). Swimming: cold water activates vasoconstriction-dilation cycles beneficial for circulation.', skinRisks: 'Running: UV exposure in outdoor runs. Swimming: chlorine is alkaline (disrupts acid mantle), dehydrating, and potentially irritating for eczema and sensitive skin.', icon: '🏃', color: Colors.blue },
  { type: 'Yoga and Mindfulness Movement', skinEffect: 'Lowest GH but highest cortisol-reducing effect. The parasympathetic nervous system activation during yoga measurably reduces inflammatory cytokines. Best for stress-related skin conditions: acne from cortisol, rosacea flares, eczema from nervous system dysregulation.', skinRisks: 'Floor mat contact: bacterial transfer. Hot yoga: extreme sweating + high temperature + compromised barrier in heat.', icon: '🧘', color: Colors.teal },
  { type: 'Cold Water Swimming / Cold Exposure', skinEffect: 'Activates the Nrf2 antioxidant pathway. Produces noradrenaline (anti-inflammatory neurotransmitter). Vascular training from cold-induced vasoconstriction improves capillary tone. Improves the skin\'s ability to regulate temperature.', skinRisks: 'Extreme TEWL in cold air + cold water combination. Require immediate moisturisation post-swim. Not for rosacea-prone (cold triggers flushing in some).', icon: '🏊', color: Colors.blue },
];

const PRE_POST = {
  pre: [
    { step: 'Pre-workout (30–60 min before)', actions: ['Remove makeup completely — sweating through makeup clogs pores', 'Apply a light, non-comedogenic moisturiser if skin is dry — prevents moisture loss during exercise', 'Apply SPF if exercising outdoors (sweat-resistant mineral SPF 30+)', 'Do NOT apply heavy occlusive skincare (tallow, thick moisturisers) — they trap heat and block sweating thermoregulation'] },
  ],
  post: [
    { step: 'Immediately post-exercise (within 15 min)', actions: ['Rinse face with cool water — removes sweat, salt, and bacteria before they can re-enter follicles', 'Blot dry with clean cloth — do not rub (skin is temporarily more fragile from increased blood flow and sweating)', 'If showering delayed: apply a light toner or micellar water to remove sweat film temporarily'] },
    { step: 'Post-shower (within 30–60 min)', actions: ['Full PM or AM routine as appropriate', 'Tallow can be applied post-workout as barrier support and anti-inflammatory recovery', 'Protein consumption within 30 min supports skin repair alongside muscle repair (collagen amino acids from bone broth + protein)'] },
  ],
};

const DURING_EXERCISE = [
  { concern: 'Sweat and pore clogging', detail: 'Sweat itself does not clog pores — it is mostly water and salt. The risk comes from sweat mixing with sebum, sunscreen, makeup, and airborne particles and being pushed back into follicles during towel-wiping. Blot (do not rub), use clean towels only, and shower as soon as possible.', icon: '💦' },
  { concern: 'Post-exercise flushing and redness', detail: 'Acute facial redness during and immediately after exercise is normal vasodilation. In rosacea-prone individuals, exercise-induced vasodilation can trigger or worsen flushing. Cool compress immediately post-exercise helps. Low-intensity steady-state cardio (vs high-intensity) reduces the magnitude of vasodilation.', icon: '🔴' },
  { concern: 'Outdoor UV exposure during exercise', detail: 'Moderate exercise in sunlight without SPF is a significant photodamage risk — compounded by sweating (which dilutes SPF on skin) and increased skin surface temperature (which may increase photosensitivity). Use water-resistant mineral SPF 50, reapply every 90 min for long outdoor sessions.', icon: '☀️' },
  { concern: 'Chlorine from swimming pools', detail: 'Pool chlorine is alkaline (pH 7.2–7.8) — disrupts the acid mantle (pH 4.5–5.5). Chlorine also dissolves skin lipids and oxidises melanin, causing patchiness. Apply an occlusive layer (tallow or coconut oil) before swimming as a barrier. Shower with a pH-balanced cleanser immediately after. Post-swim: HA serum + tallow to restore.', icon: '🏊' },
  { concern: 'Acne and folliculitis from gym equipment', detail: 'Face towels, gym mats, and surfaces carry bacteria (including MRSA). Phone pressed against face during calls post-workout. Helmet strap acne. Headband-related folliculitis. Clean all contact points. Use a dedicated clean gym towel for face only. Bench covers for face-down positions.', icon: '🦠' },
];

const TALLOW_PROTOCOL = [
  { title: 'Pre-workout: tallow is not ideal', body: 'Avoid tallow immediately before intense exercise. The occlusive layer traps heat and can impair sweating (a vital thermoregulation mechanism). It can also mix with sweat to create a pore-blocking film. Pre-exercise skin should be clean and minimally occluded.' },
  { title: 'Post-workout: the ideal tallow window', body: 'Post-shower, post-workout is the ideal tallow application window. Skin is: clean (sweat removed), slightly warm (increased penetration), and potentially slightly moisture-depleted from sweating. Apply tallow to slightly damp post-shower skin within 60 seconds for maximum barrier-replenishment and anti-inflammatory effect.' },
  { title: 'Tallow\'s anti-inflammatory fatty acids for post-workout recovery', body: 'Intense exercise creates temporary micro-inflammation in muscles and skin (from increased blood flow and mechanical friction). Tallow\'s palmitoleic acid has documented anti-inflammatory effects — applied topically post-exercise, it may reduce the minor skin inflammation associated with exertion. This is particularly relevant for eczema and rosacea-prone skin after exercise.' },
  { title: 'Pre-swim barrier: tallow or coconut oil', body: 'Applying a thin layer of tallow to face and body before pool swimming creates a hydrophobic barrier that partially resists chlorine penetration. This is the same principle as the "grease" applied by competitive open-water swimmers. Less chlorine penetration = less barrier disruption = less post-swim irritation and dryness.' },
  { title: 'Post-swim recovery protocol', body: 'Shower with pH-balanced cleanser to remove chlorine residue. Apply HA serum while skin is damp. Then apply tallow to restore the lipid barrier that chlorine stripped. The post-swim skin state (lipid-depleted, pH-disrupted, dehydrated) is exactly the state tallow was designed to address.' },
  { title: 'Exercise + tallow as the complete collagen protocol', body: 'Resistance training 3× weekly (GH secretion → collagen stimulation) + tallow PM (vitamin A → retinoid-like collagen gene upregulation + barrier repair) = addressing collagen from both an endocrine/cellular level (exercise) and a topical signalling level (tallow vitamin A). A comprehensive natural anti-aging protocol without pharmaceuticals.' },
];

export default function ExerciseSkinScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedBenefit, setExpandedBenefit] = useState<number | null>(null);
  const [expandedType, setExpandedType] = useState<number | null>(null);
  const [expandedDuring, setExpandedDuring] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercise & Skin</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>🏋️ Exercise & Skin</Text>
        <Text style={styles.heroSub}>Exercise is one of the few interventions that simultaneously stimulates collagen, reduces cortisol, improves blood flow, and increases microbiome diversity — all measurably affecting skin quality.</Text>
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
            {EXERCISE_BENEFITS.map((b, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedBenefit(expandedBenefit === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{b.icon}</Text>
                  <Text style={[styles.cardTitle, { flex: 1 }]}>{b.benefit}</Text>
                  <Text style={styles.expandIcon}>{expandedBenefit === i ? '▲' : '▼'}</Text>
                </View>
                {expandedBenefit === i && <Text style={styles.cardDetail}>{b.detail}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 1 && (
          <View>
            {EXERCISE_TYPES.map((t, i) => (
              <TouchableOpacity key={i} style={[styles.card, { borderLeftColor: t.color, borderLeftWidth: 3 }]} onPress={() => setExpandedType(expandedType === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{t.icon}</Text>
                  <Text style={[styles.cardTitle, { flex: 1, color: t.color }]}>{t.type}</Text>
                  <Text style={styles.expandIcon}>{expandedType === i ? '▲' : '▼'}</Text>
                </View>
                {expandedType === i && (
                  <View style={{ marginTop: 8 }}>
                    <View style={styles.effectBlock}>
                      <Text style={styles.effectLabel}>Skin Benefits</Text>
                      <Text style={styles.cardDetail}>{t.skinEffect}</Text>
                    </View>
                    <View style={styles.riskBlock}>
                      <Text style={styles.riskLabel}>Skin Risks</Text>
                      <Text style={styles.riskText}>{t.skinRisks}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 2 && (
          <View>
            {[...PRE_POST.pre, ...PRE_POST.post].map((phase, i) => (
              <View key={i} style={styles.phaseCard}>
                <Text style={styles.phaseTitle}>{phase.step}</Text>
                {phase.actions.map((a, j) => (
                  <View key={j} style={styles.actionRow}>
                    <Text style={[styles.actionBullet, { color: i === 0 ? Colors.gold : Colors.teal }]}>→</Text>
                    <Text style={styles.actionText}>{a}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {activeTab === 3 && (
          <View>
            {DURING_EXERCISE.map((d, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedDuring(expandedDuring === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{d.icon}</Text>
                  <Text style={[styles.cardTitle, { flex: 1 }]}>{d.concern}</Text>
                  <Text style={styles.expandIcon}>{expandedDuring === i ? '▲' : '▼'}</Text>
                </View>
                {expandedDuring === i && <Text style={styles.cardDetail}>{d.detail}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 4 && (
          <View>
            <View style={styles.tallowHero}>
              <Text style={styles.tallowHeroTitle}>🌿 Tallow + Exercise Protocol</Text>
              <Text style={styles.tallowHeroSub}>Exercise and tallow address skin health through complementary pathways — tallow never goes on before intense exercise, but it is ideal for the post-workout recovery window.</Text>
            </View>
            {TALLOW_PROTOCOL.map((p, i) => (
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
  card: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardEmoji: { fontSize: 18, marginTop: 2 },
  cardTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  cardDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  expandIcon: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  effectBlock: { marginBottom: 10 },
  effectLabel: { color: Colors.green, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  riskBlock: { backgroundColor: Colors.red + '0A', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: Colors.red + '33' },
  riskLabel: { color: Colors.red, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  riskText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  phaseCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  phaseTitle: { color: Colors.gold, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' },
  actionBullet: { fontSize: 14, fontWeight: '700', marginTop: 1 },
  actionText: { flex: 1, color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  tallowHero: { backgroundColor: Colors.primary + '11', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.primary + '44', marginBottom: 14 },
  tallowHeroTitle: { color: Colors.primary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  tallowHeroSub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  tallowCardTitle: { color: Colors.gold, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowCardBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
