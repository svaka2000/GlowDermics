import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

function shimColors(c: Palette) {
  return {
    bg: c.bg, card: c.bgCard, cardAlt: c.bgElevated, border: c.border,
    primary: c.primary, gold: c.gold, textPrimary: c.textPrimary,
    textSecondary: c.textSecondary, textMuted: c.textMuted,
    green: c.scoreGood, red: c.scorePoor, blue: c.hydration, purple: c.darkCircles, teal: '#2DD4BF',
  };
}

const TABS = ['Types', 'AHA', 'BHA', 'PHA', 'Frequency', 'Recovery'];

function buildExfolTypes(Colors: ReturnType<typeof shimColors>) {
  return [
  {
    name: 'AHA (Alpha-Hydroxy Acids)',
    subtitle: 'Water-soluble · Surface exfoliation · Brightening',
    icon: '💧',
    color: Colors.blue,
    bestFor: ['Sun damage', 'Dullness', 'Fine lines', 'Uneven texture', 'Hyperpigmentation', 'Normal to dry skin'],
    howWorks: 'AHAs break the bonds between dead corneocytes (the bonds that hold dead skin cells together on the surface). They do not penetrate pores. They work primarily on the surface of the stratum corneum — loosening and shedding the outermost layer to reveal fresher skin beneath.',
    examples: 'Glycolic acid (smallest, deepest), lactic acid (gentler, also humectant), mandelic acid (gentlest, anti-bacterial), malic acid, citric acid, tartaric acid',
    caution: 'Increases photosensitivity significantly. Always follow with SPF. Do not use on broken or compromised skin.',
  },
  {
    name: 'BHA (Beta-Hydroxy Acids)',
    subtitle: 'Oil-soluble · Pore-penetrating · Anti-bacterial',
    icon: '🔬',
    color: Colors.primary,
    bestFor: ['Clogged pores', 'Blackheads', 'Oily skin', 'Acne-prone', 'Congested skin', 'Rough texture'],
    howWorks: 'BHA\'s oil solubility is its defining advantage. It can dissolve through the sebum in the pore lining and travel down into the follicle to dissolve the waxy, keratinous plug that forms blackheads and whiteheads. AHAs cannot do this — they stay on the surface.',
    examples: 'Salicylic acid (the primary BHA — most products use this), betaine salicylate (gentler, better for sensitive skin)',
    caution: 'Avoid if aspirin-allergic (same molecular family). Can be drying with overuse. Start with 1× weekly.',
  },
  {
    name: 'PHA (Polyhydroxy Acids)',
    subtitle: 'Gentle · Humectant · Barrier-friendly',
    icon: '🌿',
    color: Colors.green,
    bestFor: ['Sensitive skin', 'Rosacea', 'Eczema', 'Post-procedure', 'Compromised barrier', 'Beginners'],
    howWorks: 'PHAs are large molecules — they cannot penetrate deeply. Exfoliation happens only at the very surface of the stratum corneum. Additionally, PHAs act as humectants (they bind water), so they exfoliate while simultaneously hydrating. Gentlest class by a significant margin.',
    examples: 'Gluconolactone, lactobionic acid, galactose',
    caution: 'Minimal caution needed. The gentlest class. Most sensitive skin can tolerate PHAs without issue.',
  },
  {
    name: 'Physical Exfoliation',
    subtitle: 'Mechanical · Immediate · Friction-based',
    icon: '✋',
    color: Colors.gold,
    bestFor: ['Body exfoliation', 'Rough/calloused areas', 'Scalp', 'Dry brushing before shower'],
    howWorks: 'Physical abrasives (sugar, salt, walnut shell, microbeads, washcloths, silicone brushes) manually dislodge dead cells via friction. Unlike chemical exfoliants, there is no enzymatic or acid activity — the effect stops immediately when you rinse.',
    examples: 'Sugar scrubs, salt scrubs, konjac sponge (gentlest), physical cleansing cloths, silicone facial brushes, pumice (feet)',
    caution: 'Avoid on face if acne-prone — can spread bacteria and cause micro-tears. Walnut shell and nut scrubs have irregular sharp edges that cause micro-lacerations. Konjac sponge is the exception — sufficiently gentle for facial use.',
  },
  {
    name: 'Enzymatic Exfoliation',
    subtitle: 'Enzymatic · Gentle · Targeting dead cells only',
    icon: '🍍',
    color: Colors.teal,
    bestFor: ['Sensitive skin', 'Hyperpigmentation', 'Those who cannot tolerate acids', 'Face masks'],
    howWorks: 'Proteolytic enzymes (papain from papaya, bromelain from pineapple) specifically digest the protein bonds in dead keratinocytes. They have a targeting affinity for denatured (dead) protein — meaning they only break down dead skin cells, leaving living tissue untouched.',
    examples: 'Papain enzyme masks, bromelain serums, pumpkin enzyme masks',
    caution: 'Latex allergy = potential cross-reactivity with papain. Enzyme activity requires specific temperature and pH — check formulation quality.',
  },
  ];
}

const AHA_DETAIL = [
  { acid: 'Glycolic Acid', size: 'smallest (76 Da)', penetration: 'Deepest of all AHAs', effective: '5–10%', bestFor: 'Anti-aging, texture, established hyperpigmentation', risk: 'Highest irritation potential. Not for sensitive or rosacea-prone skin.' },
  { acid: 'Lactic Acid', size: 'medium (90 Da)', penetration: 'Surface to mid-stratum corneum', effective: '5–12%', bestFor: 'Dry skin (humectant + exfoliant), gentle brightening, beginners to AHAs', risk: 'Moderate irritation. Also draws water — well tolerated on dry skin.' },
  { acid: 'Mandelic Acid', size: 'largest (152 Da)', penetration: 'Superficial', effective: '5–10%', bestFor: 'Acne-prone (antimicrobial), sensitive skin, early pigmentation', risk: 'Lowest irritation of AHAs. Also anti-bacterial benefit.' },
  { acid: 'Malic Acid', size: 'medium', penetration: 'Surface', effective: '5–10% (often in blends)', bestFor: 'Typically used in combination products, not standalone', risk: 'Very mild when standalone. Often used to boost other AHAs.' },
];

const BHA_DETAIL = [
  { item: 'Salicylic acid concentration guide', detail: '0.5%: gentle introduction, 1%: daily use for mild congestion, 2%: standard clinical dose (most studied, most effective), 3%+: professional peels only. Most OTC products use 2% — the sweet spot of efficacy and tolerability.' },
  { item: 'Leave-on vs rinse-off', detail: 'Leave-on (toner, serum, liquid exfoliant): far more effective than rinse-off. The acid needs 20–30 minutes on skin to act. Rinse-off BHA cleansers have limited clinical efficacy — you rinse the active before it works. Use leave-on formats.' },
  { item: 'pH requirement: must be below 4', detail: 'Salicylic acid is only in its active (protonated) form at pH < 4. Many products are buffered to a higher pH to reduce irritation, which also reduces efficacy. Check that your BHA product is formulated at pH 3.2–4.0 for maximum effect.' },
  { item: 'How long to see results', detail: 'Blackheads: 2–4 weeks of consistent use. Congested pores: 4–6 weeks. Inflammatory acne (reducing new lesions): 8+ weeks. BHA is a long game. Daily or alternate-day use at 2% for 8 weeks is the standard clinical protocol.' },
];

const PHA_DETAIL = [
  { item: 'Why PHAs are different', detail: 'PHAs have multiple hydroxyl groups (-OH) which make them water-loving (hydrophilic). This means they can barely penetrate the lipid-rich stratum corneum barrier — they mostly work at the outermost surface. The result: exfoliation without irritation or photosensitivity.' },
  { item: 'PHAs and the microbiome', detail: 'Unlike stronger acids, PHAs do not significantly alter skin microbiome. They preserve beneficial bacterial balance while still exfoliating. This is clinically relevant for rosacea and eczema patients where microbiome disruption worsens the condition.' },
  { item: 'Humectant bonus', detail: 'Gluconolactone and lactobionic acid act as humectants — they attract and hold water in the skin. When used as exfoliants, they leave skin measurably more hydrated than before application. Unique among exfoliation acids.' },
  { item: 'Compatible with compromised barrier', detail: 'PHAs are the only exfoliant class generally considered safe during barrier repair phases. They work on the surface without further disrupting the barrier lipid structure. Can be used during active barrier repair when AHAs and BHAs must be paused.' },
];

function buildFrequencyGuide(Colors: ReturnType<typeof shimColors>) {
  return [
    { skin: 'Sensitive / Rosacea', rec: 'PHA 1× weekly or enzymatic 2× weekly. No AHA or BHA until skin is stable.', color: Colors.teal },
    { skin: 'Dry / Dehydrated', rec: 'Lactic acid (AHA) 2× weekly PM. Or PHA 3× weekly. No BHA (too drying).', color: Colors.blue },
    { skin: 'Normal', rec: 'AHA or BHA 2–3× weekly PM. Can rotate: AHA Mon/Thu, BHA Wed/Sat.', color: Colors.green },
    { skin: 'Oily / Congested', rec: 'BHA 2% daily (build up to this over 4–6 weeks). AHA 1× weekly for surface texture.', color: Colors.primary },
    { skin: 'Acne-Prone', rec: 'BHA 2% daily. Avoid AHA on active acne — can spread bacteria. Add AHA 1× weekly once stable.', color: Colors.red },
    { skin: 'Beginner', rec: 'Start with 1× weekly PHA or lactic acid. Add a second session after 2 weeks if no reaction. Build slowly over 2 months.', color: Colors.gold },
  ];
}

const RECOVERY_TIPS = [
  { tip: 'Signs of over-exfoliation', detail: 'Persistent redness that doesn\'t fade. Burning or stinging from products that didn\'t used to sting. Texture that feels raw or papery. Sudden breakouts from products previously tolerated. Tightness after washing. If 3+ of these: stop all exfoliants immediately.', icon: '⚠️' },
  { tip: 'Recovery protocol', detail: 'Week 1–2: no exfoliants of any kind. Only gentle cleanser and occlusive moisturiser (ceramide cream or petrolatum). No actives. Week 3: introduce PHA 1× weekly. Week 4–5: add back gentle AHA or BHA if skin responds well.', icon: '🛡️' },
  { tip: 'SPF after exfoliation is non-negotiable', detail: 'AHAs increase UV sensitivity for 48–72 hours after use. BHAs: 24–48 hours. Not using SPF the day after exfoliation negates the brightening benefits and risks UV-induced PIH on fresh skin. Mineral SPF 30+ minimum.', icon: '☀️' },
  { tip: 'Occlusive after exfoliation', detail: 'After chemical exfoliation, the skin surface is temporarily more permeable and slightly compromised. Applying a lipid-rich occlusive moisturiser 30–60 minutes after acid (give the acid time to work first) provides immediate barrier support. Its ceramide precursors and fatty acids feed into the barrier that the exfoliant temporarily disrupted.', icon: '🌿' },
  { tip: 'Do not combine multiple exfoliants in one session', detail: 'AHA + BHA + physical + enzyme in one routine is never necessary and frequently damages the barrier. Choose one exfoliant per session. If using multiple in a week, alternate types — AHA one night, BHA another night. More is not better with exfoliation.', icon: '🚫' },
];

export default function ExfoliationScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const EXFOL_TYPES = useMemo(() => buildExfolTypes(Colors), [Colors]);
  const FREQUENCY_GUIDE = useMemo(() => buildFrequencyGuide(Colors), [Colors]);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedType, setExpandedType] = useState<number | null>(null);
  const [expandedRecovery, setExpandedRecovery] = useState<number | null>(null);

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
        <Text style={styles.headerTitle} numberOfLines={1}>Exfoliation Guide</Text>
        <View style={{ width: 60 }} />
      </Animated.View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>⚗️ Exfoliation Science</Text>
        <Text style={styles.heroSub}>The most misused skincare step. More is not better — strategic exfoliation improves texture and absorption. Over-exfoliation is one of the top causes of skin barrier damage.</Text>
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
            {EXFOL_TYPES.map((t, i) => (
              <TouchableOpacity key={i} style={[styles.card, { borderLeftColor: t.color, borderLeftWidth: 3 }]} onPress={() => setExpandedType(expandedType === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{t.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: t.color }]}>{t.name}</Text>
                    <Text style={styles.cardSubtitle}>{t.subtitle}</Text>
                  </View>
                  <Text style={styles.expandIcon}>{expandedType === i ? '▲' : '▼'}</Text>
                </View>
                {expandedType === i && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.blockLabel}>How It Works</Text>
                    <Text style={styles.cardDetail}>{t.howWorks}</Text>
                    <Text style={[styles.blockLabel, { marginTop: 10 }]}>Best For</Text>
                    <View style={styles.chips}>
                      {t.bestFor.map((b, j) => (
                        <View key={j} style={[styles.chip, { borderColor: t.color + '66' }]}>
                          <Text style={[styles.chipText, { color: t.color }]}>{b}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={[styles.blockLabel, { marginTop: 10 }]}>Examples</Text>
                    <Text style={styles.cardDetail}>{t.examples}</Text>
                    <View style={styles.cautionBlock}>
                      <Text style={styles.cautionText}>⚠️ {t.caution}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 1 && (
          <View>
            <Text style={styles.sectionNote}>Not all AHAs are equal. Glycolic is strongest and most penetrating. Mandelic is gentlest. Match to your skin's tolerance.</Text>
            {AHA_DETAIL.map((a, i) => (
              <View key={i} style={styles.detailCard}>
                <Text style={[styles.detailTitle, { color: Colors.blue }]}>{a.acid}</Text>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Molecule size</Text><Text style={styles.detailVal}>{a.size}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Penetration</Text><Text style={styles.detailVal}>{a.penetration}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Effective %</Text><Text style={styles.detailVal}>{a.effective}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Best for</Text><Text style={styles.detailVal}>{a.bestFor}</Text></View>
                <View style={[styles.riskBlock, { borderColor: Colors.red + '33', backgroundColor: Colors.red + '0A' }]}>
                  <Text style={styles.riskText}>⚠️ {a.risk}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 2 && (
          <View>
            {BHA_DETAIL.map((b, i) => (
              <View key={i} style={styles.detailCard}>
                <Text style={[styles.detailTitle, { color: Colors.primary }]}>{b.item}</Text>
                <Text style={styles.cardDetail}>{b.detail}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 3 && (
          <View>
            <View style={[styles.phaHero, { borderColor: Colors.green + '44' }]}>
              <Text style={styles.phaHeroTitle}>🌿 PHAs: The Barrier-Friendly Exfoliant</Text>
              <Text style={styles.phaHeroSub}>For anyone who has damaged their barrier with over-exfoliation, PHAs are the path back to exfoliation without harm.</Text>
            </View>
            {PHA_DETAIL.map((p, i) => (
              <View key={i} style={styles.detailCard}>
                <Text style={[styles.detailTitle, { color: Colors.green }]}>{p.item}</Text>
                <Text style={styles.cardDetail}>{p.detail}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 4 && (
          <View>
            <Text style={styles.sectionNote}>These are recommendations, not rules. Always listen to your skin — reduce frequency if you see redness, tightness, or increased sensitivity.</Text>
            {FREQUENCY_GUIDE.map((f, i) => (
              <View key={i} style={[styles.freqCard, { borderLeftColor: f.color }]}>
                <Text style={[styles.freqSkin, { color: f.color }]}>{f.skin}</Text>
                <Text style={styles.freqRec}>{f.rec}</Text>
              </View>
            ))}
            <View style={styles.noteCard}>
              <Text style={styles.noteTitle}>⏱️ Golden Rule</Text>
              <Text style={styles.noteText}>Always exfoliate in the PM, never in the AM (except PHA — that's fine AM). The skin repairs overnight; you want the exfoliation effect to work while you sleep and give skin 8 hours before UV exposure.</Text>
            </View>
          </View>
        )}

        {activeTab === 5 && (
          <View>
            {RECOVERY_TIPS.map((r, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedRecovery(expandedRecovery === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{r.icon}</Text>
                  <Text style={[styles.cardTitle, { flex: 1 }]}>{r.tip}</Text>
                  <Text style={styles.expandIcon}>{expandedRecovery === i ? '▲' : '▼'}</Text>
                </View>
                {expandedRecovery === i && <Text style={styles.cardDetail}>{r.detail}</Text>}
              </TouchableOpacity>
            ))}
          </View>
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
  cardSubtitle: { color: Colors.textMuted, fontSize: 12 },
  cardDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  expandIcon: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  blockLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  chip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 11, fontWeight: '600' },
  cautionBlock: { marginTop: 12, backgroundColor: Colors.gold + '11', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: Colors.gold + '33' },
  cautionText: { color: Colors.gold, fontSize: 12, lineHeight: 18 },
  detailCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  detailTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  detailRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  detailLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', width: 90 },
  detailVal: { color: Colors.textSecondary, fontSize: 12, flex: 1 },
  riskBlock: { marginTop: 10, borderRadius: 8, padding: 10, borderWidth: 1 },
  riskText: { color: Colors.red, fontSize: 12, lineHeight: 18 },
  phaHero: { backgroundColor: Colors.green + '11', borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 14 },
  phaHeroTitle: { color: Colors.green, fontSize: 15, fontWeight: '800', marginBottom: 6 },
  phaHeroSub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  freqCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 4, marginBottom: 10 },
  freqSkin: { fontSize: 14, fontWeight: '800', marginBottom: 6 },
  freqRec: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  noteCard: { backgroundColor: Colors.cardAlt, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginTop: 4 },
  noteTitle: { color: Colors.gold, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  noteText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  });
}
