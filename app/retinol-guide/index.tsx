import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const Colors = {
  bg: '#0A0A0F', card: '#13131A', cardAlt: '#1A1A24', border: '#2A2A3A',
  primary: '#C4622D', gold: '#D4A96A', textPrimary: '#FAF3E0',
  textSecondary: '#9A9AAF', textMuted: '#5A5A6E',
  green: '#4ADE80', red: '#F87171', blue: '#60A5FA', purple: '#A78BFA',
};

const TABS = [
  { id: 'intro', label: 'What Is It?', icon: '🔬' },
  { id: 'types', label: 'Types', icon: '⚗️' },
  { id: 'start', label: 'Starting Guide', icon: '🚀' },
  { id: 'mistakes', label: 'Mistakes', icon: '❌' },
  { id: 'tallow', label: 'Tallow Buffer', icon: '🌿' },
];

const INTRO_FACTS = [
  {
    title: 'Retinol = vitamin A derivative',
    content: 'Retinol is a form of vitamin A. When applied to skin, it converts: retinol → retinaldehyde → retinoic acid. The conversion process takes time and causes the initial irritation many users experience.',
  },
  {
    title: 'What it actually does',
    content: 'Retinoids activate RAR (Retinoic Acid Receptors) in skin cells. This: (1) directly stimulates collagen synthesis in fibroblasts, (2) accelerates keratinocyte turnover (cell cycling), (3) inhibits metalloproteinase enzymes that break down collagen, (4) increases hyaluronic acid production.',
  },
  {
    title: 'Results timeline — real expectations',
    content: 'Weeks 1–4: adjustment, possible irritation, peeling. Weeks 4–8: cell turnover increases, texture begins improving. Months 3–6: visible pore reduction, fine lines soften, tone evens. Months 6–12: significant collagen improvement visible. Results are cumulative — most people quit before they start working.',
  },
  {
    title: 'PM only — always',
    content: 'Retinol degrades in UV light and increases photosensitivity. AM use is not just ineffective — it is counterproductive. Apply at night, SPF every morning without exception.',
  },
  {
    title: 'Who benefits most',
    content: 'Anti-aging: collagen stimulation, fine line reduction. Acne: reduces comedone formation, speeds healing. Hyperpigmentation: accelerates pigmented cell shedding. Retinol is one of the only topical ingredients with clinical evidence across all three.',
  },
  {
    title: 'Who should not use retinol',
    content: 'Pregnant or breastfeeding (use bakuchiol instead). Active eczema flare. Rosacea without professional guidance. Children. Severely compromised or sensitized skin — heal the barrier first.',
  },
];

const RETINOID_TYPES = [
  {
    name: 'Bakuchiol',
    strength: 0,
    strengthLabel: 'Gentlest',
    color: Colors.green,
    prescription: false,
    description: 'Plant-derived retinol alternative. Activates similar pathways without the conversion irritation. Pregnancy-safe. No photosensitivity.',
    convert: 'Works directly — no conversion required',
    bestFor: 'Beginners, sensitive skin, pregnancy, rosacea',
  },
  {
    name: 'Retinyl Esters (Retinyl Palmitate, Retinyl Acetate)',
    strength: 1,
    strengthLabel: 'Very Mild',
    color: Colors.green,
    prescription: false,
    description: 'The gentlest true vitamin A form. Requires multiple conversion steps. Very slow-acting but very low irritation. Appropriate for true beginners.',
    convert: 'Ester → retinol → retinaldehyde → retinoic acid',
    bestFor: 'True beginners, very sensitive skin',
  },
  {
    name: 'Retinol (OTC)',
    strength: 2,
    strengthLabel: 'Mild-Moderate',
    color: Colors.gold,
    prescription: false,
    description: 'The standard over-the-counter vitamin A. 0.025–1.0% concentration range. Most widely available and studied. Where the majority of users should start.',
    convert: 'Retinol → retinaldehyde → retinoic acid',
    bestFor: 'General users, anti-aging, acne, hyperpigmentation',
  },
  {
    name: 'Retinaldehyde (Retinal)',
    strength: 3,
    strengthLabel: 'Moderate-Strong',
    color: Colors.primary,
    prescription: false,
    description: 'One conversion step from retinoic acid. More potent than retinol, less irritating than tretinoin. Available OTC in Europe; prescription in some markets. Emerging as the sweet spot between efficacy and tolerability.',
    convert: 'Retinaldehyde → retinoic acid (one step)',
    bestFor: 'Advanced users wanting prescription-adjacent results OTC',
  },
  {
    name: 'Tretinoin (Prescription)',
    strength: 4,
    strengthLabel: 'Strong',
    color: Colors.red,
    prescription: true,
    description: 'Retinoic acid — the active form. No conversion needed. Significantly more potent than OTC retinol. Most extensive clinical research. Gold standard for acne and anti-aging.',
    convert: 'Active form — no conversion',
    bestFor: 'Severe acne, significant anti-aging goals, professional guidance',
  },
  {
    name: 'Adapalene (OTC 0.1% / Prescription 0.3%)',
    strength: 3,
    strengthLabel: 'Moderate',
    color: Colors.blue,
    prescription: false,
    description: 'Third-generation synthetic retinoid. Most targeted acne retinoid — binds specifically to RAR-γ in skin. Well-tolerated compared to tretinoin. OTC 0.1% is a strong option for acne-focused users.',
    convert: 'Binds directly — no conversion',
    bestFor: 'Acne-focused users, comedonal acne, less anti-aging than tretinoin',
  },
];

const START_GUIDE = [
  {
    phase: 'Week 1–2: Introduction',
    color: Colors.green,
    steps: [
      'Start at lowest available concentration (0.025% retinol or retinyl ester)',
      'Apply every 3rd night only (Monday/Thursday schedule works)',
      'Apply to dry skin (not damp — increases penetration and irritation)',
      'Pea-sized amount for full face — less is genuinely more',
      'Follow immediately with tallow or heavy moisturizer as buffer',
    ],
  },
  {
    phase: 'Week 3–4: Assessment',
    color: Colors.gold,
    steps: [
      'Evaluate tolerance: no irritation? Increase to every other night',
      'Mild flaking or dryness? Continue 3× weekly for another 2 weeks',
      'Significant irritation? Reduce frequency and add tallow buffer BEFORE retinol ("sandwich method")',
      'Purging? Small breakouts in existing congested areas — expected, not a reaction. Continue.',
    ],
  },
  {
    phase: 'Month 2–3: Building',
    color: Colors.primary,
    steps: [
      'If tolerating well: increase to nightly application',
      'Can increase concentration: 0.025% → 0.05% → 0.1%',
      'Maintain SPF every morning without exception — photosensitivity persists',
      'Keep tallow in PM routine — buffer support prevents the burnout that makes people quit',
    ],
  },
  {
    phase: 'Month 3+: Maintenance',
    color: Colors.purple,
    steps: [
      'Results become visible from Month 3 onward',
      'Skin should now tolerate nightly application at working concentration',
      'Continue at consistent concentration — do not constantly chase higher concentrations if results are showing',
      'Introduce skin cycling if daily use causes buildup of sensitivity',
    ],
  },
];

const MISTAKES = [
  { mistake: 'Starting too strong', detail: 'Beginning with 0.5%+ or tretinoin without tolerance building causes severe irritation that damages the barrier and forces people to quit. Start low, build slow.' },
  { mistake: 'Using on damp skin', detail: 'Damp skin dramatically increases retinol absorption and therefore irritation. Always apply retinol to completely dry skin (10+ minutes after cleansing).' },
  { mistake: 'Using too much', detail: 'More product does not mean more results. A pea-sized amount covers the entire face. Excess product increases irritation with no added efficacy.' },
  { mistake: 'Skipping SPF', detail: 'Retinol increases photosensitivity significantly. UV undoes retinol\'s work daily. Without SPF, retinol is ineffective and even counterproductive in daylight hours.' },
  { mistake: 'Mixing with incompatible actives', detail: 'Same night use with AHA/BHA doubles irritation risk. Same night use with benzoyl peroxide deactivates retinol. Use retinol alone on its dedicated nights.' },
  { mistake: 'Quitting during the purging phase', detail: 'Weeks 2–6 often involve "retinol uglies" — temporary increased purging, peeling, and sensitivity as turnover accelerates. This is normal and passes. Most people quit here — the worst time to stop.' },
  { mistake: 'Using during active eczema or rosacea flares', detail: 'Retinol thins the epidermis temporarily. On an already-compromised barrier, this causes severe reactions. Heal the barrier fully before introducing retinol.' },
  { mistake: 'Not buffering with moisturizer', detail: 'Applying retinol to bare, unbuffered skin (especially dry skin types) causes unnecessary irritation. The sandwich method — moisturize, wait, retinol, moisturize — dramatically improves tolerability.' },
];

export default function RetinolGuideScreen() {
  const [activeTab, setActiveTab] = useState('intro');
  const [expandedType, setExpandedType] = useState<string | null>(null);

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
        <Text style={styles.headerTitle}>Retinol Guide</Text>
        <View style={{ width: 60 }} />
      </Animated.View>

      <LinearGradient colors={['#A78BFA22', '#0A0A0F']} style={styles.hero}>
        <Text style={styles.heroEmoji}>✨</Text>
        <Text style={styles.heroTitle}>The Complete Retinol Guide</Text>
        <Text style={styles.heroSub}>From beginner to advanced — everything you need to start correctly</Text>
      </LinearGradient>

      <View style={styles.tabRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {TABS.map(t => (
            <TouchableOpacity key={t.id} style={[styles.tabChip, activeTab === t.id && styles.tabChipActive]} onPress={() => setActiveTab(t.id)}>
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === t.id && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Animated.ScrollView style={[styles.scroll, { opacity: contentAnim }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {activeTab === 'intro' && INTRO_FACTS.map((item, i) => (
          <View key={i} style={styles.introCard}>
            <Text style={styles.introTitle}>{item.title}</Text>
            <Text style={styles.introContent}>{item.content}</Text>
          </View>
        ))}

        {activeTab === 'types' && (
          <>
            <Text style={styles.typesNote}>
              All retinoids convert to retinoic acid in the skin. The more conversion steps, the gentler but slower the effect. Choose based on your skin tolerance.
            </Text>
            {RETINOID_TYPES.map((type, i) => (
              <TouchableOpacity key={i} style={[styles.typeCard, { borderLeftColor: type.color, borderLeftWidth: 3 }]} onPress={() => setExpandedType(expandedType === type.name ? null : type.name)} activeOpacity={0.85}>
                <View style={styles.typeHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.typeNameRow}>
                      <Text style={styles.typeName}>{type.name}</Text>
                      {type.prescription && <Text style={styles.rxBadge}>Rx</Text>}
                    </View>
                    <Text style={[styles.strengthLabel, { color: type.color }]}>{type.strengthLabel}</Text>
                  </View>
                  <View style={styles.strengthBar}>
                    {[0,1,2,3,4].map(s => (
                      <View key={s} style={[styles.strengthDot, s <= type.strength && { backgroundColor: type.color }]} />
                    ))}
                  </View>
                </View>
                {expandedType === type.name && (
                  <View style={styles.typeExpanded}>
                    <Text style={styles.typeDesc}>{type.description}</Text>
                    <Text style={styles.typeConvertLabel}>Conversion pathway:</Text>
                    <Text style={styles.typeConvert}>{type.convert}</Text>
                    <Text style={styles.typeBestFor}>Best for: {type.bestFor}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === 'start' && START_GUIDE.map((phase, i) => (
          <View key={i} style={[styles.phaseCard, { borderLeftColor: phase.color, borderLeftWidth: 4 }]}>
            <Text style={[styles.phaseName, { color: phase.color }]}>{phase.phase}</Text>
            {phase.steps.map((step, j) => (
              <View key={j} style={styles.stepRow}>
                <Text style={[styles.stepNum, { color: phase.color }]}>{j + 1}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        ))}

        {activeTab === 'mistakes' && MISTAKES.map((item, i) => (
          <View key={i} style={styles.mistakeCard}>
            <View style={styles.mistakeHeader}>
              <Text style={styles.mistakeX}>✕</Text>
              <Text style={styles.mistakeName}>{item.mistake}</Text>
            </View>
            <Text style={styles.mistakeDetail}>{item.detail}</Text>
          </View>
        ))}

        {activeTab === 'tallow' && (
          <>
            <View style={styles.tallowIntro}>
              <Text style={styles.tallowIntroTitle}>🌿 The Tallow-Retinol Buffer System</Text>
              <Text style={styles.tallowIntroText}>
                Tallow is one of the most effective buffers for retinol. Its biocompatible fatty acid profile reduces irritation while preserving efficacy.
              </Text>
            </View>
            {[
              {
                title: 'The sandwich method',
                detail: 'Moisturize (or apply tallow) → wait 5 minutes → apply retinol → wait 15 minutes → apply tallow again as the final occlusive layer. This dramatically reduces irritation for beginners without significantly reducing retinol efficacy.',
              },
              {
                title: 'Why tallow over other moisturizers',
                detail: "Most buffer moisturizers contain synthetic emollients that can interfere with retinol's mechanism or cause their own reactions. Tallow's sebum-identical profile provides buffering without foreign compounds. No fragrance, no alcohol, no preservatives that could compound retinol's irritation.",
              },
              {
                title: 'Vitamin A in tallow + retinol',
                detail: "Tallow's fat-soluble Vitamin A (precursor to retinol) adds a gentle baseline of retinoid-like activity. This means on recovery nights (when not using synthetic retinol), tallow maintains mild cell turnover continuity.",
              },
              {
                title: 'Recovery nights: tallow only',
                detail: 'Skin cycling protocol: Night 1 (exfoliate) → Night 2 (retinol → tallow buffer) → Night 3 (tallow only) → Night 4 (tallow only). The two tallow-only recovery nights allow the barrier to fully restore between retinol applications. This is why skin cycling produces better long-term results than daily retinol in many users.',
              },
              {
                title: 'Tallow and tretinoin',
                detail: 'For prescription tretinoin users: the sandwich method with tallow is especially effective. Tretinoin is significantly more potent — tallow buffering allows many users to use it 5–7 nights per week instead of the 2–3 nights they could tolerate without the buffer.',
              },
            ].map((item, i) => (
              <View key={i} style={styles.tallowCard}>
                <Text style={styles.tallowCardTitle}>{item.title}</Text>
                <Text style={styles.tallowCardDetail}>{item.detail}</Text>
              </View>
            ))}
          </>
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
  hero: { margin: 16, marginBottom: 4, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.purple + '44', alignItems: 'center' },
  heroEmoji: { fontSize: 36, marginBottom: 6 },
  heroTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  heroSub: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  tabRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  tabChipActive: { borderColor: Colors.purple, backgroundColor: Colors.purple + '22' },
  tabIcon: { fontSize: 13 },
  tabLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: Colors.purple },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  introCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  introTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  introContent: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  typesNote: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, backgroundColor: Colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 14 },
  typeCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  typeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  typeName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', flex: 1 },
  rxBadge: { color: Colors.red, fontSize: 9, fontWeight: '700', backgroundColor: Colors.red + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  strengthLabel: { fontSize: 11, fontWeight: '600' },
  strengthBar: { flexDirection: 'row', gap: 4 },
  strengthDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  typeExpanded: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  typeDesc: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19, marginBottom: 8 },
  typeConvertLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', marginBottom: 2 },
  typeConvert: { color: Colors.gold, fontSize: 12, marginBottom: 6 },
  typeBestFor: { color: Colors.blue, fontSize: 12, fontWeight: '600' },
  phaseCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  phaseName: { fontSize: 14, fontWeight: '800', marginBottom: 10 },
  stepRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  stepNum: { fontSize: 13, fontWeight: '700', width: 16 },
  stepText: { flex: 1, color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  mistakeCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.red + '22', marginBottom: 8 },
  mistakeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  mistakeX: { color: Colors.red, fontSize: 16, fontWeight: '900' },
  mistakeName: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  mistakeDetail: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  tallowIntro: { backgroundColor: Colors.primary + '15', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.primary + '44', marginBottom: 14 },
  tallowIntroTitle: { color: Colors.primary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowIntroText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  tallowCardTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowCardDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
