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
    bg: c.bg,
    card: c.bgCard,
    cardAlt: c.bgElevated,
    border: c.border,
    primary: c.primary,
    gold: c.gold,
    textPrimary: c.textPrimary,
    textSecondary: c.textSecondary,
    textMuted: c.textMuted,
    green: c.scoreGood,
    red: c.scorePoor,
    blue: c.hydration,
    purple: c.darkCircles,
    pink: '#F472B6',
  };
}

const TABS = [
  { id: 'signs', label: 'Identify It', icon: '🎯' },
  { id: 'cycle', label: 'Cycle Guide', icon: '🌙' },
  { id: 'diet', label: 'Diet & Supplements', icon: '🌿' },
  { id: 'skincare', label: 'Skincare Protocol', icon: '🧴' },
  { id: 'tallow', label: 'Tallow Approach', icon: '✨' },
];

const SIGNS = [
  { sign: 'Location: chin, jawline, and lower cheeks', detail: 'Hormonal acne almost exclusively presents along the chin, jaw, and lower face — where androgen receptors are densest. T-zone and forehead acne is typically not hormonal.' },
  { sign: 'Cyclical timing — worse before period', detail: 'Breakouts predictably appear 7–10 days before menstruation (during the luteal phase) when progesterone peaks and estrogen drops, triggering sebum overproduction.' },
  { sign: 'Deep, cystic, painful nodules', detail: 'Hormonal acne tends to form deep beneath the skin surface — painful cysts that last 1–2 weeks rather than surface whiteheads. This is androgen-driven inflammation.' },
  { sign: 'Started or worsened in adulthood', detail: 'Adult acne (25+) appearing or worsening on the lower face is a hormonal indicator, especially if it was absent in teenage years when oil production was the driver.' },
  { sign: 'Doesn\'t respond to typical acne treatments', detail: 'If standard BHA, benzoyl peroxide, or retinol don\'t clear persistent chin acne, the root cause may be hormonal — and the skincare approach alone won\'t resolve it.' },
  { sign: 'Worsens under stress', detail: 'Cortisol (the stress hormone) stimulates androgen production, which directly increases sebum output. Stress acne clustering along the jaw is a hormonal chain reaction.' },
];

function buildCyclePhases(Colors: ReturnType<typeof shimColors>) {
  return [
  {
    phase: 'Menstrual (Day 1–5)',
    color: Colors.red,
    icon: '🔴',
    hormones: 'Estrogen and progesterone both low',
    skin: 'Often clearer than the week before, but sensitive and easily irritated. May have residual breakouts from the luteal phase.',
    skincare: 'Gentle, nourishing routine. Skip actives if skin is reactive. Heavy tallow application — skin is thirsty. Reduce inflammation-triggering products.',
    diet: 'Anti-inflammatory foods: omega-3, turmeric, ginger. Reduce salt (reduces bloating that affects lymphatic drainage). Warm foods support circulation.',
  },
  {
    phase: 'Follicular (Day 6–13)',
    color: Colors.green,
    icon: '🟢',
    hormones: 'Estrogen rising steadily',
    skin: 'Your best skin of the month. Estrogen supports collagen, hydration, and barrier function. Skin looks plump, luminous, clear.',
    skincare: 'Prime time for active treatments. Introduce BHA, AHA, retinol here — skin tolerates them best when estrogen is high. Great window for peels or any more intense treatments.',
    diet: 'Focus on zinc-rich foods (oysters, pumpkin seeds) that reduce excess androgen activity. Light, fresh meals suit this energetic phase.',
  },
  {
    phase: 'Ovulation (Day 14–16)',
    color: Colors.gold,
    icon: '🟡',
    hormones: 'Estrogen peak, LH surge',
    skin: 'Peak sebum production begins. Skin may look dewy but can become oily. Some may get a mid-cycle spot from the LH surge.',
    skincare: 'Begin preventive BHA use on chin and jaw area. Clay mask this week. Don\'t skip double cleansing.',
    diet: 'Reduce dairy intake this week — it has been associated with the mid-cycle sebum spike in some individuals. Increase antioxidant-rich foods.',
  },
  {
    phase: 'Luteal (Day 17–28)',
    color: Colors.pink,
    icon: '🩷',
    hormones: 'Progesterone high, estrogen declining, androgen activity peaks',
    skin: 'Hormonal acne appears here. Sebum production peaks. Skin may look dull and congested. Inflammation heightened.',
    skincare: 'Daily BHA on affected zones. Spot treatment with niacinamide or tallow + zinc. Increase anti-inflammatory actives. Do NOT over-exfoliate — barrier is more vulnerable now. Sleep is critical.',
    diet: 'Strict low-glycemic for this week. Reduce dairy and alcohol. Spearmint tea 2× daily. Increase zinc, magnesium, B6. Reduce inflammatory omega-6 oils.',
  },
  ];
}

const DIET = [
  {
    category: 'Supplements that help',
    icon: '💊',
    items: [
      { name: 'Zinc (30–50mg/day)', detail: 'Reduces androgen activity, inhibits 5-alpha reductase (which converts testosterone to DHT). One of the most evidence-backed acne supplements.' },
      { name: 'Spearmint (2 cups tea daily)', detail: 'Multiple clinical trials show anti-androgenic effects. Reduces free testosterone levels. More accessible than pharmaceutical anti-androgens for many.' },
      { name: 'Inositol (2–4g/day)', detail: 'Particularly effective for PCOS-related acne. Improves insulin sensitivity and reduces androgen production via the ovaries.' },
      { name: 'Magnesium Glycinate (400mg)', detail: 'Reduces cortisol (which triggers androgen spikes), improves sleep quality, and has direct anti-inflammatory effects on skin.' },
      { name: 'Vitamin B6 (50–100mg)', detail: 'Reduces PMS-related hormone fluctuations. Most effective in the week before period. Reduces the progesterone-driven sebum spike.' },
    ],
  },
  {
    category: 'Foods to reduce',
    icon: '🚫',
    items: [
      { name: 'Dairy', detail: 'Milk contains IGF-1 and bovine growth hormones that stimulate androgen receptors. Strong epidemiological link to acne, especially skim milk.' },
      { name: 'High-glycemic foods', detail: 'Refined carbs and sugar spike insulin, which directly stimulates androgen production. Low-GI diet shows significant acne reduction in clinical trials.' },
      { name: 'Alcohol (especially wine)', detail: 'Disrupts hormone metabolism in the liver, increases estrogen clearance issues, and triggers inflammatory cascades.' },
      { name: 'Soy (excessive)', detail: 'Phytoestrogens in soy can influence estrogen receptor activity. Moderate amounts may be fine, but high consumption around ovulation may worsen hormonal fluctuations.' },
    ],
  },
  {
    category: 'Foods to increase',
    icon: '✅',
    items: [
      { name: 'Omega-3 fatty acids (fatty fish, walnuts, flaxseed)', detail: 'Directly anti-inflammatory. Compete with omega-6 for the same enzymes, reducing pro-inflammatory prostaglandins.' },
      { name: 'Cruciferous vegetables (broccoli, kale, cabbage)', detail: 'Contain DIM (diindolylmethane) which supports liver estrogen detoxification and hormone balance.' },
      { name: 'Pumpkin seeds', detail: 'High zinc content. Anti-androgen support. Also rich in magnesium.' },
      { name: 'Fermented foods', detail: 'Support gut microbiome which plays a direct role in estrogen and androgen metabolism via the "estrobolome."' },
    ],
  },
];

const SKINCARE_STEPS = [
  { step: 'BHA (Salicylic Acid) daily on chin/jaw', detail: 'Oil-soluble — penetrates INTO the pore to dissolve the sebum plug before it becomes cystic. Use 2% every night on the affected zone only.' },
  { step: 'Niacinamide 10% AM', detail: 'Reduces sebum production, anti-inflammatory, reduces post-acne redness. Safe for all skin types and won\'t interfere with other actives when applied correctly.' },
  { step: 'Benzoyl Peroxide (spot, not all-over)', detail: 'For active cysts only. 2.5% is as effective as 10% with far less irritation. Apply as a spot treatment, not a wash.' },
  { step: 'Retinol 2–3× per week (follicular phase)', detail: 'Stimulates cell turnover to prevent comedone formation. Reduces post-acne marks. Use during follicular phase when skin tolerates actives best.' },
  { step: 'Barrier repair on non-active nights', detail: 'Recovery is as important as treatment. Use tallow or ceramide moisturizer to prevent the transepidermal water loss that worsens inflammation.' },
  { step: 'SPF every morning', detail: 'UV damage worsens post-acne hyperpigmentation significantly. Hormonal acne leaves marks that take months to fade without SPF protection.' },
  { step: 'Avoid: harsh scrubs, pore strips, extracting', detail: 'Physical manipulation of deep cystic acne spreads bacteria, worsens inflammation, and causes permanent scarring. Never extract deep hormonal spots.' },
];

export default function HormonalAcneScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const CYCLE_PHASES = useMemo(() => buildCyclePhases(Colors), [Colors]);
  const [activeTab, setActiveTab] = useState('signs');
  const [expandedSign, setExpandedSign] = useState<number | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [expandedDiet, setExpandedDiet] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Hormonal Acne</Text>
        <View style={{ width: 60 }} />
      </View>

      <LinearGradient colors={['#F472B622', '#0A0A0F']} style={styles.hero}>
        <Text style={styles.heroEmoji}>🌙</Text>
        <Text style={styles.heroTitle}>Hormonal Acne</Text>
        <Text style={styles.heroSub}>Understanding the cycle-driven root cause — and what actually works</Text>
      </LinearGradient>

      <View style={styles.tabRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabChip, activeTab === t.id && styles.tabChipActive]}
              onPress={() => setActiveTab(t.id)}
            >
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === t.id && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {activeTab === 'signs' && SIGNS.map((item, i) => (
          <TouchableOpacity key={i} style={styles.signCard} onPress={() => setExpandedSign(expandedSign === i ? null : i)} activeOpacity={0.8}>
            <View style={styles.signHeader}>
              <Text style={styles.signCheck}>✓</Text>
              <Text style={styles.signText}>{item.sign}</Text>
              <Text style={styles.expandIcon}>{expandedSign === i ? '▲' : '▼'}</Text>
            </View>
            {expandedSign === i && <Text style={styles.signDetail}>{item.detail}</Text>}
          </TouchableOpacity>
        ))}

        {activeTab === 'cycle' && (
          <>
            <Text style={styles.cycleIntro}>
              Understanding where you are in your cycle helps you predict, prevent, and respond to hormonal breakouts strategically instead of reactively.
            </Text>
            {CYCLE_PHASES.map((phase, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.phaseCard, { borderLeftColor: phase.color, borderLeftWidth: 4 }]}
                onPress={() => setExpandedPhase(expandedPhase === i ? null : i)}
                activeOpacity={0.8}
              >
                <View style={styles.phaseHeader}>
                  <Text style={styles.phaseIcon}>{phase.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.phaseName, { color: phase.color }]}>{phase.phase}</Text>
                    <Text style={styles.phaseHormones}>{phase.hormones}</Text>
                  </View>
                  <Text style={styles.expandIcon}>{expandedPhase === i ? '▲' : '▼'}</Text>
                </View>
                {expandedPhase === i && (
                  <View style={styles.phaseExpanded}>
                    <Text style={styles.phaseSkin}>{phase.skin}</Text>
                    <View style={styles.phaseSection}>
                      <Text style={styles.phaseSectionTitle}>🧴 Skincare Focus</Text>
                      <Text style={styles.phaseSectionText}>{phase.skincare}</Text>
                    </View>
                    <View style={styles.phaseSection}>
                      <Text style={styles.phaseSectionTitle}>🥗 Diet Focus</Text>
                      <Text style={styles.phaseSectionText}>{phase.diet}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === 'diet' && DIET.map((section, i) => (
          <View key={i} style={styles.dietSection}>
            <TouchableOpacity style={styles.dietSectionHeader} onPress={() => setExpandedDiet(expandedDiet === i ? null : i)}>
              <Text style={styles.dietIcon}>{section.icon}</Text>
              <Text style={styles.dietSectionTitle}>{section.category}</Text>
              <Text style={styles.expandIcon}>{expandedDiet === i ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {(expandedDiet === i || expandedDiet === null) && section.items.map((item, j) => (
              <View key={j} style={styles.dietItem}>
                <Text style={styles.dietItemName}>{item.name}</Text>
                <Text style={styles.dietItemDetail}>{item.detail}</Text>
              </View>
            ))}
          </View>
        ))}

        {activeTab === 'skincare' && SKINCARE_STEPS.map((step, i) => (
          <View key={i} style={styles.skincareStep}>
            <View style={styles.skincareNum}>
              <Text style={styles.skincareNumText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.skincareStepName}>{step.step}</Text>
              <Text style={styles.skincareStepDetail}>{step.detail}</Text>
            </View>
          </View>
        ))}

        {activeTab === 'tallow' && (
          <>
            <View style={styles.tallowHero}>
              <Text style={styles.tallowHeroTitle}>🌿 Tallow for Hormonal Acne</Text>
              <Text style={styles.tallowHeroText}>
                Tallow is not a cure for hormonal acne — the root cause is internal (hormones). But it plays a specific and important supporting role in managing it.
              </Text>
            </View>
            {[
              {
                title: 'Barrier repair between breakouts',
                detail: 'Hormonal acne treatments (BHA, benzoyl peroxide, retinol) are necessary but harsh. Tallow applied on non-active nights restores the barrier that treatments deplete, allowing you to stay consistent without sensitizing.',
              },
              {
                title: 'Spot treatment for healing cysts',
                detail: "Apply a tiny amount of tallow directly to a healing cyst PM. Its palmitoleic acid has antimicrobial properties; its fatty acids reduce inflammation and support faster healing. Don't apply to active open lesions.",
              },
              {
                title: 'Vitamin A gentle cell turnover',
                detail: "Tallow's fat-soluble Vitamin A provides gentle retinoid-like cell turnover without the irritation. On recovery nights when you're not using active retinol, tallow maintains mild cellular renewal.",
              },
              {
                title: 'Post-inflammation mark fading',
                detail: 'Vitamin E and K2 in tallow support healing of post-inflammatory hyperpigmentation (PIH) — the dark marks left after hormonal spots resolve. Combined with SPF, tallow applied to fading marks accelerates their disappearance.',
              },
              {
                title: 'What to watch — purging on oily skin',
                detail: 'Some oily/acne-prone users purge when first using tallow. Start with 2–3 applications per week, increasing slowly. Apply over niacinamide (which buffers sebum production) for best results. Purging typically resolves within 3–4 weeks as skin adapts.',
                caution: true,
              },
              {
                title: 'The protocol: actives and tallow together',
                detail: 'Night 1: BHA → wait → tallow. Night 2: niacinamide → retinol → wait → tallow. Night 3: tallow only (recovery). This cycling approach maximizes treatment while protecting barrier integrity.',
              },
            ].map((item, i) => (
              <View key={i} style={[styles.tallowPoint, item.caution && { borderColor: Colors.gold + '55' }]}>
                {item.caution && <Text style={styles.cautionLabel}>⚠️ NOTE</Text>}
                <Text style={styles.tallowPointTitle}>{item.title}</Text>
                <Text style={styles.tallowPointDetail}>{item.detail}</Text>
              </View>
            ))}
          </>
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  backText: { color: Colors.primary, fontSize: 16 },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  hero: {
    margin: 16, marginBottom: 4, borderRadius: 16,
    padding: 20, borderWidth: 1, borderColor: Colors.pink + '33', alignItems: 'center',
  },
  heroEmoji: { fontSize: 36, marginBottom: 6 },
  heroTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 6 },
  heroSub: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  tabRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabChipActive: { borderColor: Colors.pink, backgroundColor: Colors.pink + '22' },
  tabIcon: { fontSize: 13 },
  tabLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: Colors.pink },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  signCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  signHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  signCheck: { color: Colors.green, fontSize: 14, fontWeight: '700', marginTop: 1 },
  signText: { flex: 1, color: Colors.textPrimary, fontSize: 13, fontWeight: '600', lineHeight: 20 },
  expandIcon: { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
  signDetail: {
    color: Colors.textSecondary, fontSize: 13, lineHeight: 20,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  cycleIntro: {
    color: Colors.textSecondary, fontSize: 13, lineHeight: 20,
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 14,
  },
  phaseCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  phaseHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  phaseIcon: { fontSize: 20 },
  phaseName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  phaseHormones: { color: Colors.textMuted, fontSize: 11 },
  phaseExpanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  phaseSkin: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 10 },
  phaseSection: { marginBottom: 10 },
  phaseSectionTitle: { color: Colors.textPrimary, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  phaseSectionText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  dietSection: {
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10, overflow: 'hidden',
  },
  dietSectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
  },
  dietIcon: { fontSize: 18 },
  dietSectionTitle: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  dietItem: {
    paddingHorizontal: 14, paddingBottom: 12,
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10,
  },
  dietItemName: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  dietItemDetail: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  skincareStep: {
    flexDirection: 'row', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  skincareNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.pink + '22', alignItems: 'center', justifyContent: 'center',
  },
  skincareNumText: { color: Colors.pink, fontSize: 13, fontWeight: '700' },
  skincareStepName: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  skincareStepDetail: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  tallowHero: {
    backgroundColor: Colors.primary + '15', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.primary + '44', marginBottom: 14,
  },
  tallowHeroTitle: { color: Colors.primary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowHeroText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowPoint: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  cautionLabel: { color: Colors.gold, fontSize: 11, fontWeight: '700', marginBottom: 6 },
  tallowPointTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowPointDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  });
}
