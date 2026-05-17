import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, Easing,
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
  };
}

const TABS = [
  { id: 'basics', label: 'What Is It?', icon: '🔬' },
  { id: 'disruptors', label: 'What Harms It', icon: '⚠️' },
  { id: 'supporters', label: 'What Helps It', icon: '✅' },
  { id: 'tallow', label: 'Tallow & Microbiome', icon: '🌿' },
];

const BASICS = [
  {
    title: 'Your skin is a living ecosystem',
    content: 'The average person carries over 1,000 bacterial species and more than 80 fungal species on their skin surface — all forming a complex ecosystem called the skin microbiome. Most are neutral or beneficial.',
  },
  {
    title: 'The acid mantle is their habitat',
    content: 'The acid mantle (pH 4.5–5.5) is the environmental condition that protective bacteria thrive in. When the pH rises (from alkaline cleansers, hard water), opportunistic pathogens outcompete beneficial bacteria.',
  },
  {
    title: 'Cutibacterium acnes — the acne paradox',
    content: 'C. acnes (formerly P. acnes) exists on all skin — acne and clear alike. The difference is strain diversity. Specific strains are protective; an imbalance toward inflammatory strains causes acne. The goal is diversity, not elimination.',
  },
  {
    title: 'Staphylococcus epidermidis: your protector',
    content: 'S. epidermidis is the dominant beneficial bacterium on skin. It produces antimicrobial peptides, occupies space that pathogens need to colonize, and regulates inflammation. Disrupting it is the hidden cost of antibacterial products.',
  },
  {
    title: 'The gut-skin axis',
    content: 'The gut and skin microbiomes communicate directly via the "gut-skin axis" — inflammatory signals from gut dysbiosis reach the skin through cytokines and the bloodstream. Healing the gut often visibly improves the skin.',
  },
  {
    title: 'Microbiome diversity = resilience',
    content: 'Like a forest ecosystem, skin microbiome health correlates with diversity. A monoculture (dominated by one strain) is fragile. High diversity means the ecosystem can absorb disruptions without pathogenic takeover.',
  },
];

const DISRUPTORS = [
  {
    disruptor: 'Antibacterial soaps and cleansers',
    severity: 'high',
    detail: 'Triclosan, benzalkonium chloride, and other broad-spectrum antimicrobials eliminate protective bacteria along with pathogens. Regular use has been linked to C. acnes resistance and loss of S. epidermidis populations.',
  },
  {
    disruptor: 'Excessive cleansing',
    severity: 'high',
    detail: 'Washing more than twice daily strips sebum — the nutrient source for your protective bacteria. Over-cleansed skin loses its microbial diversity within days.',
  },
  {
    disruptor: 'Alkaline cleansers',
    severity: 'high',
    detail: 'Bar soaps and many liquid cleansers are pH 8–10. At this pH, the habitat that protective bacteria need is destroyed and pathogens can colonize freely.',
  },
  {
    disruptor: 'Oral antibiotics for acne',
    severity: 'medium',
    detail: 'While effective short-term, long-term antibiotic use eliminates the bacterial diversity in both gut and skin microbiomes. When stopped, the previously dominant strains often regrow faster, causing rebound acne.',
  },
  {
    disruptor: 'Synthetic preservatives (parabens, phenoxyethanol)',
    severity: 'medium',
    detail: "Preservatives in skincare products are antimicrobial by design — they prevent product contamination. Applied to skin daily, they continue antimicrobial activity and affect the skin's own microbiome.",
  },
  {
    disruptor: 'Alcohol-based products',
    severity: 'medium',
    detail: 'Toners, hand sanitizers, and astringents containing ethanol kill bacteria indiscriminately on contact. Regular facial use damages microbiome diversity significantly.',
  },
  {
    disruptor: 'UV radiation (without protection)',
    severity: 'medium',
    detail: 'UVB radiation alters skin microbiome composition and reduces diversity. SPF use is as much a microbiome-protective strategy as an anti-aging one.',
  },
  {
    disruptor: 'Processed sugar and refined carbs',
    severity: 'medium',
    detail: 'High glycemic foods elevate blood sugar, which feeds inflammatory bacterial strains in both the gut and skin. This is the mechanism behind the sugar-acne connection.',
  },
  {
    disruptor: 'Stress (chronic)',
    severity: 'low',
    detail: 'Cortisol alters sebum composition and suppresses antimicrobial peptide production, making the skin more susceptible to pathogenic colonization.',
  },
];

const SUPPORTERS = [
  {
    action: 'pH-balanced cleansing',
    impact: 'high',
    how: 'Use cleansers with pH 4.5–5.5. Check product pH or look for labels claiming "pH balanced for skin." This preserves the habitat that protective bacteria need to survive.',
  },
  {
    action: 'Probiotic skincare',
    impact: 'high',
    how: 'Look for Lactobacillus ferment, bifida ferment lysate, or live probiotic cultures in skincare. These introduce or support beneficial bacterial strains directly on the skin surface.',
  },
  {
    action: 'Gut probiotics',
    impact: 'high',
    how: 'Via the gut-skin axis, oral probiotics (especially Lactobacillus rhamnosus GG and Bifidobacterium strains) have shown clinical improvement in acne and eczema in multiple trials. Take with food.',
  },
  {
    action: 'Fermented foods',
    impact: 'high',
    how: 'Kimchi, sauerkraut, kefir, yogurt, miso, and kombucha provide diverse live bacteria for the gut. Higher gut microbiome diversity correlates with clearer, more resilient skin.',
  },
  {
    action: 'Prebiotic fibers in diet',
    impact: 'medium',
    how: 'Prebiotic fibers (garlic, leeks, onions, chicory, oats, bananas) feed beneficial gut bacteria. A microbiome without the right food starves out regardless of probiotic supplementation.',
  },
  {
    action: 'Shorter, cooler showers',
    impact: 'medium',
    how: 'Hot water above 40°C (104°F) kills protective skin bacteria. Cooler water and shorter exposure times preserve the microbiome more effectively than hot long showers.',
  },
  {
    action: 'Minimal, targeted actives',
    impact: 'medium',
    how: 'Use actives (BHA, retinol) sparingly and on targeted areas rather than all-over face applications. This reduces the surface area of microbiome disruption.',
  },
  {
    action: 'Avoid over-washing',
    impact: 'medium',
    how: 'Twice daily maximum. If exercising, a gentle rinse (no cleanser) is sufficient unless you have heavy sweating. Over-cleansing starves the microbiome.',
  },
  {
    action: 'Sleep (7–9 hours)',
    impact: 'medium',
    how: 'During sleep, antimicrobial peptide production increases and the skin microbiome rebalances. Chronic sleep deprivation measurably reduces microbiome diversity.',
  },
  {
    action: 'Reduce sugar',
    impact: 'medium',
    how: 'A low-glycemic diet reduces the substrate available to inflammatory bacterial strains. Even a 3-week low-glycemic trial shows measurable skin microbiome shifts.',
  },
];

const TALLOW_MICROBIOME = [
  {
    title: 'Biocompatibility = microbiome compatibility',
    detail: 'Tallow\'s fatty acid profile matches human sebum so closely that beneficial bacteria recognize it as native material. They can continue their symbiotic activity on tallow-moisturized skin in ways they cannot on petrolatum or synthetic silicones.',
  },
  {
    title: 'No synthetic preservatives',
    detail: 'Properly rendered grass-fed tallow does not require preservatives. Most conventional moisturizers contain phenoxyethanol or parabens — antimicrobials that continuously suppress the skin microbiome. Clean tallow is preservative-free by nature.',
  },
  {
    title: 'Fatty acids as prebiotic nutrients',
    detail: 'Oleic, stearic, and palmitic acids in tallow serve as nutrient sources for beneficial skin bacteria. Think of them as prebiotics for the skin surface — feeding the protective microbiome rather than starving it.',
  },
  {
    title: 'Supports the acid mantle',
    detail: 'Tallow is slightly acidic (pH ~5.0), matching the optimal bacterial habitat. Applying it after cleansing helps restore acid mantle pH that alkaline cleansers or hard water may have raised.',
  },
  {
    title: 'Vitamin A and antimicrobial peptides',
    detail: 'Vitamin A (present in tallow) supports keratinocyte production of antimicrobial peptides — the skin\'s own innate immune defense that keeps pathogenic bacteria in check without broad-spectrum elimination.',
  },
  {
    title: 'The purging phenomenon explained',
    detail: 'Some users experience a purging period (weeks 1–3) when switching to tallow. This may reflect the microbiome rebalancing as protective strains re-establish over previously synthetic-moisturized skin. It typically resolves as diversity returns.',
    note: true,
  },
];

function getSeverityColor(s: string, Colors: ReturnType<typeof shimColors>) {
  if (s === 'high') return Colors.red;
  if (s === 'medium') return Colors.gold;
  return Colors.blue;
}

function getImpactColor(s: string, Colors: ReturnType<typeof shimColors>) {
  if (s === 'high') return Colors.green;
  return Colors.blue;
}

export default function MicrobiomeScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [activeTab, setActiveTab] = useState('basics');
  const [expanded, setExpanded] = useState<number | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const toggle = (i: number) => setExpanded(expanded === i ? null : i);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Skin Microbiome</Text>
        <View style={{ width: 60 }} />
      </Animated.View>

      <LinearGradient colors={['#4ADE8022', '#0A0A0F']} style={styles.hero}>
        <Text style={styles.heroEmoji}>🦠</Text>
        <Text style={styles.heroTitle}>Your Skin's Hidden Ecosystem</Text>
        <Text style={styles.heroSub}>The bacteria living on your skin aren't the enemy — they're your first line of defense</Text>
      </LinearGradient>

      <View style={styles.tabRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabChip, activeTab === t.id && styles.tabChipActive]}
              onPress={() => { setActiveTab(t.id); setExpanded(null); }}
            >
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === t.id && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Animated.ScrollView style={[styles.scroll, { opacity: contentAnim }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {activeTab === 'basics' && BASICS.map((item, i) => (
          <View key={i} style={styles.basicCard}>
            <Text style={styles.basicTitle}>{item.title}</Text>
            <Text style={styles.basicContent}>{item.content}</Text>
          </View>
        ))}

        {activeTab === 'disruptors' && (
          <>
            <Text style={styles.sectionNote}>Ranked by severity of microbiome impact. Avoid the HIGH items if you care about microbiome health.</Text>
            {DISRUPTORS.map((item, i) => (
              <TouchableOpacity key={i} style={styles.disruptorCard} onPress={() => toggle(i)} activeOpacity={0.8}>
                <View style={styles.disruptorHeader}>
                  <Text style={styles.disruptorName}>{item.disruptor}</Text>
                  <View style={[styles.severityBadge, { borderColor: getSeverityColor(item.severity, Colors) }]}>
                    <Text style={[styles.severityText, { color: getSeverityColor(item.severity, Colors) }]}>{item.severity.toUpperCase()}</Text>
                  </View>
                </View>
                {expanded === i && <Text style={styles.disruptorDetail}>{item.detail}</Text>}
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === 'supporters' && SUPPORTERS.map((item, i) => (
          <TouchableOpacity key={i} style={styles.supportCard} onPress={() => toggle(i)} activeOpacity={0.8}>
            <View style={styles.supportHeader}>
              <Text style={styles.supportAction}>{item.action}</Text>
              <View style={[styles.impactBadge, { borderColor: getImpactColor(item.impact, Colors) }]}>
                <Text style={[styles.impactText, { color: getImpactColor(item.impact, Colors) }]}>{item.impact.toUpperCase()}</Text>
              </View>
            </View>
            {expanded === i && <Text style={styles.supportHow}>{item.how}</Text>}
          </TouchableOpacity>
        ))}

        {activeTab === 'tallow' && (
          <>
            <View style={styles.tallowIntro}>
              <Text style={styles.tallowIntroText}>
                Tallow is uniquely aligned with the skin microbiome's needs — not by accident, but because both evolved alongside each other over millions of years of human development.
              </Text>
            </View>
            {TALLOW_MICROBIOME.map((item, i) => (
              <View key={i} style={[styles.tallowCard, item.note && { borderColor: Colors.gold + '55' }]}>
                {item.note && <Text style={styles.noteLabel}>📝 NOTE</Text>}
                <Text style={styles.tallowTitle}>{item.title}</Text>
                <Text style={styles.tallowDetail}>{item.detail}</Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
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
    padding: 20, borderWidth: 1, borderColor: Colors.green + '33', alignItems: 'center',
  },
  heroEmoji: { fontSize: 36, marginBottom: 6 },
  heroTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  heroSub: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  tabRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabChipActive: { borderColor: Colors.green, backgroundColor: Colors.green + '22' },
  tabIcon: { fontSize: 13 },
  tabLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: Colors.green },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  basicCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  basicTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  basicContent: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  sectionNote: {
    color: Colors.textSecondary, fontSize: 13, lineHeight: 20,
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 14,
  },
  disruptorCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  disruptorHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  disruptorName: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  severityBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  severityText: { fontSize: 10, fontWeight: '700' },
  disruptorDetail: {
    color: Colors.textSecondary, fontSize: 13, lineHeight: 20,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  supportCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  supportHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  supportAction: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  impactBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  impactText: { fontSize: 10, fontWeight: '700' },
  supportHow: {
    color: Colors.textSecondary, fontSize: 13, lineHeight: 20,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  tallowIntro: {
    backgroundColor: Colors.primary + '15', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.primary + '44', marginBottom: 14,
  },
  tallowIntroText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 21, fontStyle: 'italic' },
  tallowCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  noteLabel: { color: Colors.gold, fontSize: 11, fontWeight: '700', marginBottom: 6 },
  tallowTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  });
}
