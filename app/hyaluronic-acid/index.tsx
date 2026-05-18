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
    green: c.scoreGood, red: c.scorePoor, blue: c.hydration, teal: '#2DD4BF',
  };
}
type ShimColors = ReturnType<typeof shimColors>;

const TABS = ['Science', 'Molecular Weights', 'Common Mistakes', 'Layering', 'With Occlusives'];

const HA_FACTS = [
  { fact: 'HA can hold 1,000× its weight in water', detail: 'Hyaluronic acid is a glycosaminoglycan — a polysaccharide that is naturally present in the skin, joints, and eyes. Each molecule can bind up to 1,000× its weight in water, making it one of the most effective humectants known. In the dermis, HA forms a gel-like matrix that maintains hydration and volume.', icon: '💧' },
  { fact: 'Natural HA depletes with age', detail: 'At age 20, the skin contains ~4g of HA. By 50, this falls to ~1g — a 75% reduction. This is one of the primary structural reasons skin loses volume and suppleness with age. The hyaluronic acid-rich "scaffolding" of the dermis literally thins.', icon: '📉' },
  { fact: 'Topical HA works on the surface, not the dermis', detail: 'Large molecular weight HA (>1,000 kDa) cannot penetrate the stratum corneum. It forms a film on the skin surface that draws moisture from the environment and locks it in. Smaller HA fragments (< 50 kDa) can penetrate slightly deeper. Despite marketing claims, no topical HA reaches the dermis where dermal HA is found.', icon: '🔬' },
  { fact: 'HA can dehydrate skin in dry climates', detail: 'HA is a humectant — it draws moisture from wherever it can find it. In humid environments (>60% humidity), it draws from the air. In dry environments (<40%), it draws moisture from deeper skin layers toward the surface, then that moisture evaporates. Net result: skin is drier. This is why HA must be sealed with an occlusive.', icon: '⚠️' },
  { fact: 'HA fragments are pro-inflammatory', detail: 'High molecular weight HA (intact native HA) is anti-inflammatory. When HA is broken down into low-molecular-weight fragments (< 20 kDa), these fragments act as damage signals that activate the immune system. Some HA products using very small fragments may actually be inflammatory. This is why MW specification matters.', icon: '🧬' },
  { fact: 'Skin makes its own HA via hyaluronidase balance', detail: 'The skin is constantly synthesising and degrading HA through hyaluronidase enzymes. UV radiation dramatically increases hyaluronidase activity — which is one mechanism by which UV ages skin (it breaks down the HA matrix that maintains skin volume and suppleness). SPF protection directly preserves the HA matrix.', icon: '☀️' },
];

function buildMolecularWeights(Colors: ShimColors) {
  return [
  {
    weight: 'Very High MW (>1,500 kDa)',
    penetration: 'Surface only',
    effect: 'Film formation on skin surface. Instant smoothing and plumping appearance. Reduces water evaporation. Does not penetrate.',
    best: 'Dry climates (with occlusive), immediate smoothing effect, sensitive skin',
    risk: 'In dry environments without occlusive: draws water from skin',
    color: Colors.blue,
    sizeLabel: '●●●●●',
  },
  {
    weight: 'High MW (500–1,500 kDa)',
    penetration: 'Upper stratum corneum',
    effect: 'Slightly more penetration than very high MW. Interacts with uppermost stratum corneum layers. Still primarily surface hydration but with some structural interaction.',
    best: 'General daily use, all skin types, balanced hydration',
    risk: 'Minimal',
    color: Colors.teal,
    sizeLabel: '●●●●○',
  },
  {
    weight: 'Medium MW (50–500 kDa)',
    penetration: 'Mid stratum corneum',
    effect: 'Penetrates into stratum corneum layers. More lasting hydration effect. Interacts with skin cells rather than just surface. This range is found in most premium HA serums.',
    best: 'Sustained hydration, aging skin, dehydration recovery',
    risk: 'Low',
    color: Colors.green,
    sizeLabel: '●●●○○',
  },
  {
    weight: 'Low MW (< 50 kDa)',
    penetration: 'Deep stratum corneum',
    effect: 'Reaches living cell layers. Stimulates native HA production in keratinocytes. Can activate HA synthase enzyme. Also has some pro-inflammatory signalling at very low concentrations — use with caution.',
    best: 'Anti-aging serums, professional formulations, HA production stimulation',
    risk: 'Pro-inflammatory at very small sizes (< 20 kDa). Not ideal for rosacea.',
    color: Colors.gold,
    sizeLabel: '●●○○○',
  },
  {
    weight: 'Nano HA (< 10 kDa)',
    penetration: 'Near epidermis/dermis junction',
    effect: 'Deepest penetration. Used in medical-grade products. Reaches the living epidermal layers. Strong pro-inflammatory signal at this size — typically only justified in clinical/medical applications.',
    best: 'Post-procedure, clinical applications, wound healing',
    risk: 'Pro-inflammatory signal fragments. Not for daily skincare without clinical guidance.',
    color: Colors.red,
    sizeLabel: '●○○○○',
  },
  ];
}

const MISTAKES = [
  { mistake: 'Applying HA to dry skin in dry conditions', fix: 'Always apply HA to damp skin (immediately after cleansing, while skin still has some moisture). If your environment is dry, seal immediately with an occlusive (a balm or moisturiser) within 30 seconds.', icon: '❌' },
  { mistake: 'Not sealing HA with an occlusive', fix: 'HA draws and holds water — but it needs to be locked in. Without an occlusive layer over it, the water HA attracted will simply evaporate, taking additional skin moisture with it. Always follow HA with a moisturiser or oil.', icon: '❌' },
  { mistake: 'Expecting HA to "replace" lost facial volume', fix: 'Topical HA stays in the stratum corneum. The volume loss from aging is in the dermis and fat layer. Only injectable HA fillers or dermal HA boosters reach this depth. Topical HA improves surface hydration and texture — not volume.', icon: '❌' },
  { mistake: 'Using HA only in summer', fix: 'HA is most important in dry conditions — which typically means winter (heating, low humidity) and air-conditioned environments. Year-round use is ideal. In summer with higher humidity, the occlusive-sealing step becomes slightly less critical.', icon: '❌' },
  { mistake: 'Choosing a product by "HA %" rather than MW', fix: 'A 2% large MW HA product is not twice as effective as a 1% product — it\'s just more of a surface film. MW (molecular weight) determines depth and mechanism. Look for products that specify multi-weight or low-MW HA for depth, not just percentage.', icon: '❌' },
  { mistake: 'Applying HA over oils', fix: 'HA is water-soluble. Oils sit on top of water. If you apply HA over oil, it cannot contact the aqueous skin surface — it just floats on the oil layer. Correct order: water-based serums (HA) first, oils and occlusives last.', icon: '❌' },
];

const LAYERING = [
  { step: 1, action: 'Cleanse', detail: 'Remove oil, sunscreen, and debris. Leave skin slightly damp — this is the optimal state for HA application.', timing: 'Immediate' },
  { step: 2, action: 'Toner / mist (optional)', detail: 'If using a hydrating toner or facial mist, apply now. This adds an extra aqueous layer for HA to bind. Particularly useful in dry climates.', timing: '30 sec after cleanse' },
  { step: 3, action: 'Hyaluronic Acid Serum', detail: 'Apply to damp skin. Pat gently — do not rub. Allow it to spread and absorb. The damp surface ensures HA has water to bind to immediately rather than drawing from deeper skin.', timing: 'While damp' },
  { step: 4, action: 'Active Serums (if using)', detail: 'Vitamin C, niacinamide, peptides — apply after HA. These are also water-based and can sit in the hydrated layer created by HA.', timing: '60 sec after HA' },
  { step: 5, action: 'Moisturiser (if using)', detail: 'Cream or lotion helps seal in the HA layer. If using a rich occlusive balm, this can replace the moisturiser step.', timing: '60-90 sec' },
  { step: 6, action: 'Occlusive seal', detail: 'The critical sealing step. Apply a balm or another occlusive to trap all the moisture and active ingredients underneath. This is what converts HA from a potential dehydrator to a genuine hydrator.', timing: 'Last step PM' },
];

const TALLOW_NOTES = [
  { title: 'Why an occlusive and HA are complementary, not redundant', body: 'A lipid occlusive is lipid-based. HA is water-based (humectant). These mechanisms are not the same — they are complementary. HA draws water into the surface layers; the occlusive prevents that water from evaporating. Used together they address hydration from both angles: attract and retain.' },
  { title: 'The correct application sequence', body: 'HA must go on first — it is water-soluble and needs direct contact with the skin surface. Apply HA to damp skin, allow 60 seconds, then apply the occlusive over. It acts as the seal that converts the HA from a humectant into a sustained hydrator.' },
  { title: 'Some occlusives\' glycerin content adds humectant action', body: 'Some natural fat-based occlusives contain glycerin (glycerol), a humectant that binds water similarly to HA. Combined, you get a lipid occlusive + a built-in humectant, on top of the aqueous HA layer beneath. A multi-layer hydration system.' },
  { title: 'For very dry skin: HA + an occlusive is the stack', body: 'For clinical-level dry skin (TEWL-impaired, eczema, atopic dermatitis, desert environments), the most effective protocol is: damp skin → HA serum (30 seconds) → a lipid-rich occlusive applied generously → sleep. Wake to noticeably different skin. The occlusion is what makes HA effective in true dehydration.' },
  { title: 'Eye area: both together work well', body: 'The eye area has fewer sebaceous glands and thinner skin. It dehydrates faster and shows volume loss earlier. Low-MW HA serum (for depth) patted around the eye area, followed by a pea-sized amount of a gentle occlusive pressed (not rubbed) around the orbital bone is the most effective natural eye anti-aging protocol.' },
];

export default function HyaluronicAcidScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const MOLECULAR_WEIGHTS = useMemo(() => buildMolecularWeights(Colors), [Colors]);
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedFact, setExpandedFact] = useState<number | null>(null);
  const [expandedMW, setExpandedMW] = useState<number | null>(null);
  const [expandedMistake, setExpandedMistake] = useState<number | null>(null);

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
        <Text style={styles.headerTitle} numberOfLines={1}>Hyaluronic Acid</Text>
        <View style={{ width: 60 }} />
      </Animated.View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>💧 Hyaluronic Acid</Text>
        <Text style={styles.heroSub}>The most popular humectant in skincare — and the most commonly misused. HA can hydrate deeply or dehydrate skin depending entirely on how it is applied.</Text>
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
            {HA_FACTS.map((f, i) => (
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
            <Text style={styles.sectionNote}>Molecular weight determines where HA works. Most "hyaluronic acid" serums do not specify MW. The best products use multi-weight HA for both surface and depth effects.</Text>
            {MOLECULAR_WEIGHTS.map((mw, i) => (
              <TouchableOpacity key={i} style={[styles.card, { borderLeftColor: mw.color, borderLeftWidth: 3 }]} onPress={() => setExpandedMW(expandedMW === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: mw.color }]}>{mw.weight}</Text>
                    <Text style={styles.sizeLabel}>{mw.sizeLabel}</Text>
                    <Text style={styles.penetrationText}>Reaches: {mw.penetration}</Text>
                  </View>
                  <Text style={styles.expandIcon}>{expandedMW === i ? '▲' : '▼'}</Text>
                </View>
                {expandedMW === i && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.cardDetail}>{mw.effect}</Text>
                    <View style={styles.infoRow}><Text style={styles.infoLabel}>Best for</Text><Text style={styles.infoVal}>{mw.best}</Text></View>
                    {mw.risk !== 'Minimal' && mw.risk !== 'Low' && (
                      <View style={styles.riskBlock}>
                        <Text style={styles.riskText}>⚠️ {mw.risk}</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 2 && (
          <View>
            {MISTAKES.map((m, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedMistake(expandedMistake === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{m.icon}</Text>
                  <Text style={[styles.cardTitle, { flex: 1 }]}>{m.mistake}</Text>
                  <Text style={styles.expandIcon}>{expandedMistake === i ? '▲' : '▼'}</Text>
                </View>
                {expandedMistake === i && (
                  <View style={styles.fixBlock}>
                    <Text style={styles.fixLabel}>Fix</Text>
                    <Text style={styles.fixText}>{m.fix}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 3 && (
          <View>
            <Text style={styles.sectionNote}>This layering sequence maximises HA effectiveness. The key principle: water-based → water-based → oil-based (seal last).</Text>
            {LAYERING.map((s, i) => (
              <View key={i} style={styles.stepCard}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{s.step}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.stepHeader}>
                    <Text style={styles.stepTitle}>{s.action}</Text>
                    <Text style={styles.stepTiming}>{s.timing}</Text>
                  </View>
                  <Text style={styles.stepDetail}>{s.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 4 && (
          <View>
            <View style={styles.tallowHero}>
              <Text style={styles.tallowHeroTitle}>🌿 HA + Occlusive: The Hydration System</Text>
              <Text style={styles.tallowHeroSub}>Humectant + occlusive = attract and retain. This is the principle behind the most effective hydration protocols — HA with a lipid-rich occlusive is the natural skincare version.</Text>
            </View>
            {TALLOW_NOTES.map((p, i) => (
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

function makeStyles(c: ShimColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  backText: { color: c.primary, fontSize: 16 },
  headerTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700' },
  hero: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: c.border },
  heroTitle: { color: c.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 6 },
  heroSub: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  tabScroll: { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: c.border },
  tabRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
  tabActive: { backgroundColor: c.primary + '22', borderColor: c.primary },
  tabText: { color: c.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: c.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionNote: { color: c.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 12, fontStyle: 'italic' },
  card: { backgroundColor: c.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.border, marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardEmoji: { fontSize: 18, marginTop: 2 },
  cardTitle: { color: c.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  cardDetail: { color: c.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 10 },
  expandIcon: { color: c.textMuted, fontSize: 12, marginTop: 4 },
  sizeLabel: { color: c.gold, fontSize: 12, letterSpacing: 3, marginBottom: 2 },
  penetrationText: { color: c.textMuted, fontSize: 12 },
  infoRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  infoLabel: { color: c.textMuted, fontSize: 12, fontWeight: '600', width: 65 },
  infoVal: { color: c.textSecondary, fontSize: 12, flex: 1 },
  riskBlock: { marginTop: 8, backgroundColor: c.red + '0D', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: c.red + '33' },
  riskText: { color: c.red, fontSize: 12, lineHeight: 18 },
  fixBlock: { marginTop: 10, backgroundColor: c.teal + '11', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: c.teal + '33' },
  fixLabel: { color: c.teal, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  fixText: { color: c.textSecondary, fontSize: 13, lineHeight: 19 },
  stepCard: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  stepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  stepTitle: { color: c.textPrimary, fontSize: 14, fontWeight: '700' },
  stepTiming: { color: c.textMuted, fontSize: 11 },
  stepDetail: { color: c.textSecondary, fontSize: 13, lineHeight: 19 },
  tallowHero: { backgroundColor: c.primary + '11', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.primary + '44', marginBottom: 14 },
  tallowHeroTitle: { color: c.primary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  tallowHeroSub: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowCard: { backgroundColor: c.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.border, marginBottom: 10 },
  tallowCardTitle: { color: c.gold, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowCardBody: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  });
}
