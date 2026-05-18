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
    yellow: c.scoreFair,
    orange: '#FB923C',
  };
}

const TABS = [
  { id: 'basics', label: 'Basics', icon: '☀️' },
  { id: 'types', label: 'Chemical vs Mineral', icon: '⚗️' },
  { id: 'application', label: 'How to Apply', icon: '🖐️' },
  { id: 'myths', label: 'Myths', icon: '💡' },
  { id: 'tallow', label: 'SPF + Occlusive', icon: '🌿' },
];

const BASICS = [
  {
    title: 'What SPF number actually means',
    content: 'SPF 30 blocks ~97% of UVB rays. SPF 50 blocks ~98%. SPF 100 blocks ~99%. The protection difference between SPF 30 and 100 is about 2% — the application difference is enormous. SPF 15 is not adequate for daily use.',
  },
  {
    title: 'UVA vs UVB — both matter',
    content: 'UVB causes sunburn (blocked by SPF rating). UVA causes aging and skin cancer (requires "broad spectrum" or PA+++ rating). Most skin aging comes from UVA, which penetrates through clouds and windows year-round. You need BOTH covered.',
  },
  {
    title: 'PA rating system (UVA protection)',
    content: 'PA+ = some protection, PA++ = moderate, PA+++ = high, PA++++ = extremely high. Look for PA+++ or PA++++ on Asian sunscreens — this is the most reliable UVA measurement system. "Broad spectrum" on US labels is less precise.',
  },
  {
    title: 'Why daily SPF is the #1 anti-aging step',
    content: 'Studies on identical twins show sun exposure explains 80% of visible aging differences. Retinol, Vitamin C, and peptides undo damage — SPF prevents it. Prevention compounds permanently; correction requires constant maintenance.',
  },
  {
    title: 'SPF amount matters as much as SPF number',
    content: 'Standard SPF testing uses 2mg/cm² of product. Most people apply 20–25% of this. That means your SPF 50 is performing like SPF 9–15. Two-finger rule for face: apply a full two-finger strip (index + middle finger).',
  },
  {
    title: 'Reapplication is not optional',
    content: 'SPF degrades in UV light. Even water-resistant SPF requires reapplication every 2 hours of direct sun exposure. Indoor, low-light environments: once AM is sufficient. Outdoor activity: set a phone alarm.',
  },
];

function buildSpfTypes(Colors: ReturnType<typeof shimColors>) {
  return [
  {
    type: 'Chemical (Organic) Filters',
    icon: '⚗️',
    color: Colors.orange,
    how: 'Absorb UV photons and convert them to heat, releasing them through the skin.',
    examples: 'Avobenzone, Tinosorb S & M, Uvinul A+, Octinoxate, Oxybenzone (controversial), Mexoryl',
    pros: ['Lightweight, invisible finish', 'No white cast', 'Easy to formulate with cosmetic actives', 'Works well under makeup'],
    cons: ['Some filters are endocrine disruptors (oxybenzone, octinoxate)', 'Can cause irritation for sensitive/rosacea skin', 'Requires 20–30 min before sun exposure to activate', 'Some are not reef-safe'],
    forSkinTypes: 'Oily, normal, combination skin that tolerates them. Avoid if sensitive to fragrance or reactive skin.',
    tallowNote: 'Apply an occlusive BEFORE chemical SPF. Allow 60–90 seconds for it to absorb, then apply SPF on top. Chemical filters absorb differently if applied over a heavy occlusive — test your stack for finish.',
  },
  {
    type: 'Mineral (Physical) Filters',
    icon: '🪨',
    color: Colors.blue,
    how: 'Sit on the skin surface and reflect/scatter UV radiation. Also absorb some UV.',
    examples: 'Zinc Oxide, Titanium Dioxide (in combination or alone)',
    pros: ['Stable in sunlight (no degradation)', 'Reef-safe (zinc oxide)', 'Safe for sensitive, rosacea, eczema skin', 'Immediate protection on application', 'Anti-inflammatory properties (zinc)'],
    cons: ['White cast on darker skin tones (especially titanium dioxide)', 'Heavier texture', 'Can pill under makeup', 'Less cosmetically elegant'],
    forSkinTypes: 'Sensitive, rosacea, eczema, and deeper skin tones who find transparent mineral formulas. Excellent for daily use.',
    tallowNote: 'Mineral SPF is the ideal companion to an occlusive. Zinc oxide is anti-inflammatory — it amplifies the occlusive\'s barrier-repair, redness-reducing properties. Apply the occlusive → wait 60s → mineral SPF on top.',
  },
  ];
}

const APPLICATION_STEPS = [
  {
    step: 'Amount: 2-finger rule for face',
    detail: 'Squeeze SPF along your index and middle finger — full length of both. This covers face and neck to the standard 2mg/cm². Most people apply a third to half of this. Underapplication is the #1 SPF mistake.',
    critical: true,
  },
  {
    step: 'Apply as LAST skincare step (before makeup)',
    detail: 'SPF goes after moisturizer. If using an occlusive, apply it, let it absorb 60 seconds, then SPF. Layering product over SPF dilutes and disrupts its UV-filtering film.',
  },
  {
    step: 'Include neck and the V of chest',
    detail: 'These areas age visibly and receive constant UVA exposure. The neck-to-face age discrepancy is one of the most consistent signs of SPF neglect — most people only apply to the face.',
  },
  {
    step: 'Include ears, hands, and any exposed skin',
    detail: 'Ears are a high-risk site for skin cancer and rarely protected. Hands age visibly from sun exposure and are almost never SPF\'d. Make it a habit.',
  },
  {
    step: 'Pat, don\'t rub into eyes area',
    detail: 'Chemical filters can cause eye stinging. Pat gently around eye orbital bone area rather than rubbing. Stay 1cm from lash line.',
  },
  {
    step: 'Reapply every 2 hours in direct sun',
    detail: 'Set a timer. Use SPF powder or spray for reapplication over makeup. SPF degrades from UV exposure — the protection expires. Indoor, cloudy weather: once is sufficient.',
    critical: true,
  },
  {
    step: 'Apply to dry skin — not over serum still wet',
    detail: 'Wet skin dilutes SPF film. Apply serum, wait for it to dry (30–60 seconds), moisturize, wait, then SPF. Rushing this step reduces effective SPF dramatically.',
  },
];

const MYTHS = [
  { myth: '"I don\'t need SPF on cloudy days"', truth: 'UVA penetrates clouds. UVA causes the aging damage, not UVB. Up to 80% of UVA reaches you on overcast days.' },
  { myth: '"Foundation with SPF 15 is enough"', truth: 'You apply 10× less foundation than the SPF-test amount. Foundation SPF 15 provides approximately SPF 2 protection in real application.' },
  { myth: '"Dark skin doesn\'t need SPF"', truth: 'Darker skin has more melanin protection (SPF 8–13 equivalent naturally). But sun damage still occurs, and hyperpigmentation is actually more visible on darker tones.' },
  { myth: '"SPF causes breakouts"', truth: 'Certain formulas are comedogenic. The SPF ingredient itself isn\'t the problem — it\'s the base formula. Switch to a non-comedogenic mineral SPF or lightweight chemical SPF.' },
  { myth: '"I stay indoors, so I don\'t need SPF"', truth: 'UVA penetrates glass windows. If you sit near a window — especially in cars — you are receiving significant UVA exposure.' },
  { myth: '"Higher SPF means I can stay in sun longer"', truth: 'SPF 100 provides ~1% more protection than SPF 50. It is not a license to extend sun exposure — behavior (shade, reapplication) matters more than rating.' },
  { myth: '"Antioxidants (Vitamin C) replace SPF"', truth: 'Antioxidants reduce UV-induced free radical damage and enhance SPF efficacy by ~30%. They complement, never replace, physical UV protection.' },
  { myth: '"SPF is only needed in summer"', truth: 'UVA intensity varies less by season than UVB. A January commuter receives meaningful UVA exposure. 365-day SPF is the only protocol that prevents long-term photoaging.' },
];

const TALLOW_SPF = [
  {
    title: 'The layering protocol',
    detail: 'An occlusive → 60 seconds absorption time → SPF. Never reverse this. Applying SPF first and the occlusive on top dilutes and disrupts the UV-filter film formation. Test your combo at home before relying on it outdoors.',
  },
  {
    title: 'An occlusive doesn\'t replace SPF',
    detail: 'An occlusive has no meaningful SPF value. Its benefits are barrier repair, nutrient delivery, and sebum compatibility. SPF protects against the UV damage that causes collagen breakdown — the mechanism an occlusive cannot address.',
  },
  {
    title: 'Mineral SPF is an occlusive\'s best partner',
    detail: 'Zinc oxide (mineral SPF) shares anti-inflammatory properties with lipid-rich occlusives. The combination of an anti-inflammatory occlusive + an anti-inflammatory UV filter (zinc) is particularly beneficial for sensitive and rosacea-prone skin.',
  },
  {
    title: 'Evening: occlusive without SPF',
    detail: 'PM routine: no SPF needed. Apply the occlusive as the final step after all actives and serums. This is when it does its barrier repair work uninterrupted by UV filter formulation.',
  },
  {
    title: 'Very oily skin: occlusive + SPF finish',
    detail: 'For oily skin types concerned about an occlusive adding shine under SPF, apply it only to dry/sensitive zones (cheeks, around eyes) and use your SPF over the full face. This controls shine while maintaining barrier support where needed.',
  },
];

export default function SPFGuideScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const SPF_TYPES = useMemo(() => buildSpfTypes(Colors), [Colors]);
  const [activeTab, setActiveTab] = useState('basics');
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [expandedMyth, setExpandedMyth] = useState<number | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>SPF Guide</Text>
        <View style={{ width: 60 }} />
      </Animated.View>

      <LinearGradient colors={['#D8C29A22', '#0A0A0F']} style={styles.hero}>
        <Text style={styles.heroEmoji}>☀️</Text>
        <Text style={styles.heroTitle}>The Complete SPF Guide</Text>
        <Text style={styles.heroSub}>The highest-ROI skincare step you can take — if you use it correctly</Text>
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

      <Animated.ScrollView style={[styles.scroll, { opacity: contentAnim }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {activeTab === 'basics' && BASICS.map((item, i) => (
          <View key={i} style={styles.basicCard}>
            <Text style={styles.basicTitle}>{item.title}</Text>
            <Text style={styles.basicContent}>{item.content}</Text>
          </View>
        ))}

        {activeTab === 'types' && SPF_TYPES.map((type, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.typeCard, { borderLeftColor: type.color, borderLeftWidth: 4 }]}
            onPress={() => setExpandedType(expandedType === type.type ? null : type.type)}
            activeOpacity={0.85}
          >
            <View style={styles.typeHeader}>
              <Text style={styles.typeIcon}>{type.icon}</Text>
              <Text style={[styles.typeName, { color: type.color }]}>{type.type}</Text>
              <Text style={styles.expandIcon}>{expandedType === type.type ? '▲' : '▼'}</Text>
            </View>
            <Text style={styles.typeHow}>{type.how}</Text>
            {expandedType === type.type && (
              <View style={styles.typeExpanded}>
                <Text style={styles.typeExamplesLabel}>Examples: <Text style={styles.typeExamples}>{type.examples}</Text></Text>
                <View style={styles.prosConsRow}>
                  <View style={styles.prosBlock}>
                    <Text style={styles.prosLabel}>Pros</Text>
                    {type.pros.map((p, j) => <Text key={j} style={styles.proItem}>✓ {p}</Text>)}
                  </View>
                  <View style={styles.consBlock}>
                    <Text style={styles.consLabel}>Cons</Text>
                    {type.cons.map((c, j) => <Text key={j} style={styles.conItem}>✗ {c}</Text>)}
                  </View>
                </View>
                <View style={styles.tallowNoteCard}>
                  <Text style={styles.tallowNoteTitle}>🌿 Barrier Note</Text>
                  <Text style={styles.tallowNoteText}>{type.tallowNote}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {activeTab === 'application' && APPLICATION_STEPS.map((step, i) => (
          <View key={i} style={[styles.appStep, step.critical && { borderColor: Colors.yellow + '55', backgroundColor: Colors.yellow + '08' }]}>
            {step.critical && <Text style={styles.criticalLabel}>⚡ CRITICAL</Text>}
            <View style={styles.appStepHeader}>
              <View style={styles.appStepNum}>
                <Text style={styles.appStepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.appStepTitle}>{step.step}</Text>
            </View>
            <Text style={styles.appStepDetail}>{step.detail}</Text>
          </View>
        ))}

        {activeTab === 'myths' && MYTHS.map((item, i) => (
          <TouchableOpacity key={i} style={styles.mythCard} onPress={() => setExpandedMyth(expandedMyth === i ? null : i)} activeOpacity={0.8}>
            <View style={styles.mythHeader}>
              <Text style={styles.mythLabel}>MYTH</Text>
              <Text style={styles.mythText}>{item.myth}</Text>
              <Text style={styles.expandIcon}>{expandedMyth === i ? '▲' : '▼'}</Text>
            </View>
            {expandedMyth === i && (
              <View style={styles.mythTruth}>
                <Text style={styles.truthLabel}>TRUTH</Text>
                <Text style={styles.truthText}>{item.truth}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {activeTab === 'tallow' && TALLOW_SPF.map((item, i) => (
          <View key={i} style={styles.tallowPoint}>
            <Text style={styles.tallowPointTitle}>{item.title}</Text>
            <Text style={styles.tallowPointDetail}>{item.detail}</Text>
          </View>
        ))}

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
    padding: 20, borderWidth: 1, borderColor: Colors.yellow + '44', alignItems: 'center',
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
  tabChipActive: { borderColor: Colors.yellow, backgroundColor: Colors.yellow + '22' },
  tabIcon: { fontSize: 13 },
  tabLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: Colors.yellow },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  basicCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  basicTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  basicContent: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  typeCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 12,
  },
  typeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  typeIcon: { fontSize: 20 },
  typeName: { flex: 1, fontSize: 15, fontWeight: '700' },
  expandIcon: { color: Colors.textMuted, fontSize: 12 },
  typeHow: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  typeExpanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  typeExamplesLabel: { color: Colors.textMuted, fontSize: 12, marginBottom: 10 },
  typeExamples: { color: Colors.textSecondary },
  prosConsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  prosBlock: { flex: 1 },
  consBlock: { flex: 1 },
  prosLabel: { color: Colors.green, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  consLabel: { color: Colors.red, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  proItem: { color: Colors.textSecondary, fontSize: 11, lineHeight: 18 },
  conItem: { color: Colors.textSecondary, fontSize: 11, lineHeight: 18 },
  tallowNoteCard: {
    backgroundColor: Colors.primary + '15', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: Colors.primary + '44',
  },
  tallowNoteTitle: { color: Colors.primary, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  tallowNoteText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  appStep: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  criticalLabel: { color: Colors.yellow, fontSize: 10, fontWeight: '700', marginBottom: 6 },
  appStepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  appStepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.yellow + '22', alignItems: 'center', justifyContent: 'center',
  },
  appStepNumText: { color: Colors.yellow, fontSize: 12, fontWeight: '700' },
  appStepTitle: { flex: 1, color: Colors.textPrimary, fontSize: 13, fontWeight: '700' },
  appStepDetail: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  mythCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  mythHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  mythLabel: {
    color: Colors.red, fontSize: 9, fontWeight: '700',
    backgroundColor: Colors.red + '22', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, marginTop: 2,
  },
  mythText: { flex: 1, color: Colors.textPrimary, fontSize: 13, fontWeight: '600', lineHeight: 20 },
  mythTruth: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  truthLabel: {
    color: Colors.green, fontSize: 9, fontWeight: '700',
    backgroundColor: Colors.green + '22', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, alignSelf: 'flex-start', marginBottom: 6,
  },
  truthText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowPoint: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  tallowPointTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowPointDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  });
}
