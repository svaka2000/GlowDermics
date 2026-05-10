import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

function shimColors(c: Palette) {
  return {
    primary: c.primary, bg: c.bg, textPrimary: c.textPrimary,
    textSecondary: c.textSecondary, gold: c.gold, card: c.bgCard,
    cardAlt: c.bgElevated, border: c.border, green: c.scoreGood,
    red: c.scorePoor, blue: c.hydration, teal: '#2DD4BF',
  };
}

const TABS = ['Biology', 'Shaving Science', 'Common Issues', 'Routine', 'Tallow for Men'];

const BIOLOGY = [
  {
    aspect: 'Thicker Skin',
    icon: 'shield-outline',
    value: '~25% thicker than female skin',
    detail: 'Male skin has a thicker dermis due to higher collagen density, driven by testosterone. This means men generally age more slowly in terms of wrinkle formation — but when lines appear, they tend to be deeper.',
  },
  {
    aspect: 'Higher Sebum Output',
    icon: 'water-outline',
    value: '2–4× more sebum',
    detail: 'Testosterone stimulates sebaceous glands to produce significantly more oil than estrogen. This makes men more prone to acne, shine, and enlarged pores — but also less prone to dryness.',
  },
  {
    aspect: 'Collagen Density',
    icon: 'layers-outline',
    value: 'Higher baseline, same loss rate',
    detail: 'Men start with more collagen per square centimeter of skin. They lose it at a similar rate (~1% per year from mid-20s), but this higher baseline means visible aging signs appear later — typically in the late 30s rather than early 30s.',
  },
  {
    aspect: 'Skin pH',
    icon: 'flask-outline',
    value: '~5.0 vs ~5.5 (female)',
    detail: 'Male skin has a slightly lower (more acidic) pH, which can support a healthier microbiome and stronger barrier. However, alkaline cleansers and harsh shaving products disrupt this balance significantly.',
  },
  {
    aspect: 'Sweat & Hydration',
    icon: 'thermometer-outline',
    value: 'Sweats ~40% more',
    detail: 'Higher metabolic rate and more eccrine sweat glands mean men lose more water through perspiration. This creates both a hydration challenge and an opportunity — sweat is mildly antimicrobial and can help regulate skin microbiome.',
  },
  {
    aspect: 'Collagen Loss After 50',
    icon: 'trending-down-outline',
    value: 'No menopause equivalent — gradual decline',
    detail: 'Men do not have a hormonal event equivalent to menopause. Testosterone declines ~1% per year from age 30. This gradual decline means slower-but-steadier skin aging with less of the dramatic changes women experience in the perimenopausal phase.',
  },
];

const SHAVING = [
  {
    issue: 'Razor Burn',
    cause: 'Friction + heat + dull blade',
    fix: 'Always shave with the grain on first pass. Hydrate beard for 2+ minutes before shaving. Replace blade every 5–7 shaves. Use a single-blade safety razor if prone to irritation.',
  },
  {
    issue: 'Ingrown Hairs (Pseudofolliculitis)',
    cause: 'Curled hair growing back into follicle',
    fix: 'Exfoliate 2–3× per week with a chemical exfoliant (BHA/AHA). Shave with the grain, never against. Use post-shave toner to close follicles. Let beard grow for a few days periodically to allow hairs to straighten.',
  },
  {
    issue: 'Post-Shave Irritation & Barrier Damage',
    cause: 'Razor physically removes top layer of stratum corneum with each pass',
    fix: 'Shaving is a form of physical exfoliation. Post-shave skin needs immediate barrier support. Apply an alcohol-free balm or an occlusive rich in fatty acids within 60 seconds of shaving.',
  },
  {
    issue: 'Hyperpigmentation from Repeated Irritation',
    cause: 'Chronic inflammation signals melanocytes to overproduce pigment',
    fix: 'Reduce frequency of shaving, improve technique, and use an azelaic acid or niacinamide treatment on affected areas to calm pigment production over time.',
  },
  {
    issue: 'Folliculitis',
    cause: 'Bacterial infection (usually Staph aureus) of hair follicle',
    fix: 'Sanitise razor with isopropyl alcohol before each use. Use clean towels and face cloths. Salicylic acid cleanser helps. Persistent folliculitis warrants topical or oral antibiotics from a dermatologist.',
  },
];

function buildIssues(Colors: ReturnType<typeof shimColors>) {
  return [
  {
    issue: 'Oily Skin / Shine',
    prevalence: 'Very Common',
    color: Colors.primary,
    approach: [
      'Niacinamide 5–10% — reduces sebum secretion by regulating lipid synthesis in sebocytes',
      'Zinc (topical or oral) — inhibits 5-alpha reductase, the enzyme that converts testosterone to DHT (the main sebum driver)',
      'Clay mask 1–2× per week for oil absorption without stripping',
      'Lightweight gel moisturiser — skipping moisturiser backfires, triggering compensatory oil production',
    ],
  },
  {
    issue: 'Acne',
    prevalence: 'Common',
    color: Colors.red,
    approach: [
      'Salicylic acid (BHA) cleanser: 0.5–2%, oil-soluble — penetrates pores to dissolve comedones',
      'Benzoyl peroxide spot treatment for active pustules (2.5% is as effective as 10% with less irritation)',
      'Zinc supplementation: 30mg elemental zinc — comparable to low-dose doxycycline in RCTs',
      'Avoid whey protein supplements — strongly linked to acne in males via IGF-1 pathway',
    ],
  },
  {
    issue: 'Beard Itch & Flaking',
    prevalence: 'Very Common',
    color: Colors.gold,
    approach: [
      'Seborrhoeic dermatitis (fungal — Malassezia) is the most common cause of beard flaking',
      'Ketoconazole shampoo 1–2× per week on beard area, leave on 5 minutes before rinsing',
      'Beard oil with anti-inflammatory fatty acids (jojoba, tallow) reduces follicular irritation',
      'Never scratch — mechanical trauma worsens the inflammatory cycle',
    ],
  },
  {
    issue: 'Dark Under-Eye Circles',
    prevalence: 'Common',
    color: Colors.blue,
    approach: [
      'Primary causes: sleep deprivation, thin periorbital skin, venous pooling, hyperpigmentation',
      'Caffeine eye cream — vasoconstricts to reduce pooled blood visibility',
      'Vitamin K cream — evidence-based for vascular dark circles',
      'Sleep 7–9 hours — the most effective non-topical intervention',
    ],
  },
  {
    issue: 'Dry Skin in Winter',
    prevalence: 'Common',
    color: Colors.teal,
    approach: [
      'Drop to once-daily cleansing in cold/dry conditions — over-cleansing is a primary cause',
      'Switch to cream cleanser or oil cleanser in winter months',
      'Layer humectant (hyaluronic acid) then occlusive (tallow, shea) to trap moisture',
      'Shower in lukewarm water — hot showers strip the acid mantle and strip natural oils',
    ],
  },
  ];
}

function buildRoutine(Colors: ReturnType<typeof shimColors>) {
  return [
  {
    time: 'Morning',
    icon: 'sunny-outline',
    color: Colors.gold,
    steps: [
      { step: '1. Cleanse', detail: 'Gentle cleanser if needed (or just water rinse if skin isn\'t dirty). Avoid stripping AM cleanse — skin has produced minimal sebum overnight.' },
      { step: '2. Toner/Niacinamide', detail: 'Optional but effective: niacinamide 5% serum addresses shine, hyperpigmentation, and barrier support simultaneously.' },
      { step: '3. Moisturiser', detail: 'Lightweight gel or cream. Gel for oily skin, cream for normal/dry. Look for ceramides, glycerin, or hyaluronic acid.' },
      { step: '4. SPF 50+', detail: 'Non-negotiable. The most powerful anti-aging and skin cancer prevention step. Look for tinted formulas that reduce shine simultaneously.' },
    ],
  },
  {
    time: 'Post-Shave',
    icon: 'cut-outline',
    color: Colors.teal,
    steps: [
      { step: '1. Cold Water Rinse', detail: 'Closes follicles and reduces immediate redness. Do not rub — gentle pat only.' },
      { step: '2. Alcohol-Free Balm', detail: 'Alcohol-based aftershaves feel fresh but are barrier-destroying. Use a fatty acid-rich balm instead within 60 seconds.' },
      { step: '3. Niacinamide or Azelaic Acid', detail: 'If prone to ingrown hair hyperpigmentation, apply after balm has absorbed. Do not apply immediately after shaving — wait 5 minutes.' },
    ],
  },
  {
    time: 'Evening',
    icon: 'moon-outline',
    color: Colors.blue,
    steps: [
      { step: '1. Cleanse', detail: 'More thorough cleanse in the evening: remove SPF, pollution particles, excess sebum. Salicylic acid cleanser if acne-prone.' },
      { step: '2. Treatment', detail: 'Active ingredient night: retinol (0.025–0.05% to start) 3–4× per week, or niacinamide nightly. Not both simultaneously until skin is acclimatised.' },
      { step: '3. Moisturise / Occlusive', detail: 'Richer moisturiser or occlusive at night. Growth hormone peaks during sleep — well-moisturised skin uses this window more effectively.' },
    ],
  },
  ];
}

export default function MensSkin() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const ISSUES = useMemo(() => buildIssues(Colors), [Colors]);
  const ROUTINE = useMemo(() => buildRoutine(Colors), [Colors]);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [expandedBio, setExpandedBio] = useState<number | null>(null);
  const [expandedShave, setExpandedShave] = useState<number | null>(null);
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Men's Skin Guide</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Skin Care Built for Male Biology</Text>
        <Text style={styles.heroSub}>Thicker skin, more sebum, and the shaving variable — science-backed guidance</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {TABS.map((t, i) => (
          <Pressable key={t} onPress={() => setActiveTab(i)} style={[styles.tab, activeTab === i && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* BIOLOGY */}
        {activeTab === 0 && (
          <View style={{ gap: 10 }}>
            <View style={[styles.noticeCard, { borderColor: Colors.blue }]}>
              <Text style={[styles.noticeTitle, { color: Colors.blue }]}>Key Biological Differences</Text>
              <Text style={styles.noticePara}>Male skin differs from female skin in 5 clinically meaningful ways. Skincare that ignores these differences is less effective. Understanding your biology lets you select the right products and build a routine that actually works.</Text>
            </View>
            {BIOLOGY.map((b, i) => (
              <Pressable key={b.aspect} onPress={() => setExpandedBio(expandedBio === i ? null : i)} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name={b.icon as any} size={20} color={Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{b.aspect}</Text>
                    <Text style={[styles.subValue, { color: Colors.gold }]}>{b.value}</Text>
                  </View>
                  <Ionicons name={expandedBio === i ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
                </View>
                {expandedBio === i && <Text style={[styles.para, { marginTop: 10 }]}>{b.detail}</Text>}
              </Pressable>
            ))}
          </View>
        )}

        {/* SHAVING SCIENCE */}
        {activeTab === 1 && (
          <View style={{ gap: 10 }}>
            <Text style={styles.sectionNote}>Shaving is a daily barrier assault. Here's how to minimise the damage.</Text>
            <View style={styles.card}>
              <Text style={[styles.subLabel, { marginBottom: 8 }]}>The Shaving-Skin Relationship</Text>
              <Text style={styles.para}>A razor blade removes approximately 2 cell layers of the stratum corneum with every pass. Men who shave daily are effectively exfoliating daily — which explains why shaved skin can be temporarily smoother, but also more reactive and susceptible to transepidermal water loss.</Text>
            </View>
            {SHAVING.map((s, i) => (
              <Pressable key={s.issue} onPress={() => setExpandedShave(expandedShave === i ? null : i)} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { flex: 1 }]}>{s.issue}</Text>
                  <Ionicons name={expandedShave === i ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
                </View>
                {expandedShave === i && (
                  <View style={{ gap: 8, marginTop: 10 }}>
                    <View style={styles.causeRow}>
                      <Text style={styles.causeLabel}>Cause</Text>
                      <Text style={styles.causeText}>{s.cause}</Text>
                    </View>
                    <View style={[styles.card, { backgroundColor: Colors.cardAlt }]}>
                      <Text style={[styles.subLabel, { color: Colors.green, marginBottom: 6 }]}>Fix</Text>
                      <Text style={styles.para}>{s.fix}</Text>
                    </View>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* COMMON ISSUES */}
        {activeTab === 2 && (
          <View style={{ gap: 10 }}>
            <Text style={styles.sectionNote}>The most common male skin concerns with targeted solutions</Text>
            {ISSUES.map((iss, i) => (
              <Pressable key={iss.issue} onPress={() => setExpandedIssue(expandedIssue === i ? null : i)} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{iss.issue}</Text>
                    <View style={[styles.badge, { backgroundColor: iss.color + '22', alignSelf: 'flex-start', marginTop: 4 }]}>
                      <Text style={[styles.badgeText, { color: iss.color }]}>{iss.prevalence}</Text>
                    </View>
                  </View>
                  <Ionicons name={expandedIssue === i ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
                </View>
                {expandedIssue === i && (
                  <View style={{ gap: 8, marginTop: 12 }}>
                    {iss.approach.map(a => (
                      <View key={a} style={styles.bulletRow}>
                        <View style={[styles.dot, { backgroundColor: iss.color }]} />
                        <Text style={styles.bulletText}>{a}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* ROUTINE */}
        {activeTab === 3 && (
          <View style={{ gap: 14 }}>
            <Text style={styles.sectionNote}>An evidence-based routine designed for male skin biology</Text>
            {ROUTINE.map(r => (
              <View key={r.time} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name={r.icon as any} size={22} color={r.color} />
                  <Text style={[styles.cardTitle, { color: r.color }]}>{r.time}</Text>
                </View>
                <View style={{ gap: 10, marginTop: 12 }}>
                  {r.steps.map(s => (
                    <View key={s.step} style={[styles.card, { backgroundColor: Colors.cardAlt }]}>
                      <Text style={[styles.subLabel, { color: r.color, marginBottom: 4 }]}>{s.step}</Text>
                      <Text style={styles.para}>{s.detail}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            <View style={[styles.noticeCard, { borderColor: Colors.gold }]}>
              <Text style={[styles.noticeTitle, { color: Colors.gold }]}>The Minimal Viable Routine</Text>
              <Text style={styles.noticePara}>If you will only do 3 things: (1) Wash your face once at night, (2) Apply SPF in the morning, (3) Moisturise after shaving. These three habits alone prevent the majority of premature skin aging and common skin problems in men.</Text>
            </View>
          </View>
        )}

        {/* TALLOW FOR MEN */}
        {activeTab === 4 && (
          <View style={{ gap: 14 }}>
            <View style={[styles.card, { borderColor: Colors.primary }]}>
              <Text style={[styles.cardTitle, { color: Colors.primary, marginBottom: 8 }]}>Why Tallow Works for Male Skin</Text>
              <Text style={styles.para}>
                Male skin produces more sebum, has a thicker dermis, and is subjected to daily mechanical trauma from shaving. Tallow's saturated fat composition — closest to human sebum of any animal or plant fat — means it integrates rather than sits on top. It provides exactly what overproduced sebum cannot: the fat-soluble vitamins and phospholipids that support collagen production, barrier repair, and anti-inflammation.
              </Text>
            </View>
            {[
              {
                title: 'Post-Shave Application',
                color: Colors.teal,
                detail: 'Tallow is one of the best post-shave balms available. Applied within 60 seconds of shaving, its fatty acids — particularly oleic acid — immediately penetrate the freshly exfoliated stratum corneum and begin barrier reconstruction. The vitamin A content supports rapid cell turnover to repair razor-induced micro-abrasions.',
              },
              {
                title: 'Beard Skin Conditioning',
                color: Colors.gold,
                detail: 'The skin beneath a beard is chronically under-moisturised, as the beard itself absorbs sebum before it can reach the skin. Tallow penetrates the beard hair shaft and reaches the skin surface, conditioning both the beard and preventing the follicular dryness that causes beard itch and flaking.',
              },
              {
                title: 'Oil Control Counter-intuitively',
                color: Colors.blue,
                detail: 'Applying oil to oily skin seems wrong, but sebum overproduction is often the skin\'s response to barrier damage and perceived dryness. Providing the correct fatty acids — palmitic acid and oleic acid — signals to sebaceous glands that the barrier is intact and oil production can normalise. Tallow provides these specific fatty acids.',
              },
              {
                title: 'No Synthetic Fragrance',
                color: Colors.green,
                detail: 'Most men\'s skincare products use heavy synthetic fragrances — one of the most common contact allergens and a major driver of contact dermatitis. Tallow used unfragranced or with essential oils is far less likely to trigger sensitivity, particularly important on post-shave barrier-compromised skin.',
              },
              {
                title: 'Vitamin D3 Support',
                color: Colors.primary,
                detail: 'Male skin\'s higher collagen density is maintained partly by adequate vitamin D3. Tallow contains cholecalciferol (D3), which plays a role in keratinocyte differentiation and immune modulation of the skin. Most men are D3-deficient — topical D3 through tallow provides direct skin-level support.',
              },
            ].map(p => (
              <View key={p.title} style={[styles.card, { borderLeftWidth: 3, borderLeftColor: p.color }]}>
                <Text style={[styles.subLabel, { color: p.color, marginBottom: 6 }]}>{p.title}</Text>
                <Text style={styles.para}>{p.detail}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: Palette) {
  const Colors = shimColors(c);
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  back: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  hero: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  heroTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  heroSub: { fontSize: 13, color: Colors.textSecondary },
  tabBar: { maxHeight: 44, marginBottom: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionNote: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4, fontStyle: 'italic' },
  card: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  subValue: { fontSize: 12, fontWeight: '600' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  para: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  subLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletText: { fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 19 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  causeRow: { backgroundColor: Colors.cardAlt, borderRadius: 10, padding: 10, flexDirection: 'row', gap: 8 },
  causeLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', width: 50 },
  causeText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  noticeCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1 },
  noticeTitle: { fontSize: 14, fontWeight: '800', marginBottom: 6 },
  noticePara: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  });
}
