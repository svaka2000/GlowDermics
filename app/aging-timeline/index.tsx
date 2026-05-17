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

const TABS = ['Decades', 'Science', 'Accelerators', 'Slow It', 'Tallow Age'];

function buildDecades(Colors: ReturnType<typeof shimColors>) {
  return [
  {
    age: '20s',
    color: Colors.green,
    headline: 'Peak skin — but habits now define your 40s',
    collagen: '100% — production at full speed',
    turnover: 'Every ~28 days',
    concerns: ['Sun damage accumulating invisibly', 'First fine lines around eyes', 'Uneven texture from teen acne'],
    musts: ['Daily SPF 50+', 'Antioxidant serum (Vit C)', 'Retinol introduction at 25+', 'Hydration habit'],
    whatHappens: 'Collagen and elastin synthesis are at lifetime peak. Cell turnover is rapid. The invisible sun damage you accumulate in your 20s becomes wrinkles in your 40s. Habits set now are the biggest lever on future skin.',
  },
  {
    age: '30s',
    color: Colors.gold,
    headline: 'Collagen decline begins — visible changes emerge',
    collagen: '~1% lost per year from mid-20s onward',
    turnover: 'Every ~35 days',
    concerns: ['Fine lines deepen', 'Loss of facial volume', 'Hyperpigmentation', 'Reduced skin bounce'],
    musts: ['Retinol/retinoid (0.025–0.05%)', 'Peptide serums', 'Consistent SPF', 'Barrier support'],
    whatHappens: 'Collagen synthesis slows noticeably. The dermis begins thinning. Estrogen fluctuations can trigger melasma. First nasolabial fold definition appears. Early intervention with retinoids now yields the best long-term results.',
  },
  {
    age: '40s',
    color: Colors.primary,
    headline: 'Hormonal shifts reshape skin structure',
    collagen: 'Accelerated loss around menopause',
    turnover: 'Every ~45 days',
    concerns: ['Deeper wrinkles and creases', 'Skin laxity', 'Dullness from slower turnover', 'Perimenopause-triggered dryness'],
    musts: ['Retinoid upgrade (0.1%+)', 'Hyaluronic acid + occlusives', 'Collagen-supporting peptides', 'Professional treatments'],
    whatHappens: 'Perimenopause causes estrogen to fluctuate dramatically — estrogen supports collagen synthesis, so its decline accelerates structural changes. Skin becomes drier, less elastic. Cell turnover slows significantly, causing dullness.',
  },
  {
    age: '50s',
    color: Colors.red,
    headline: 'Post-menopause: the greatest skin transformation',
    collagen: '30% lost in first 5 years post-menopause',
    turnover: 'Every ~55 days',
    concerns: ['Significant volume loss', 'Jowls and drooping', 'Deep etched lines', 'Very dry, thin skin'],
    musts: ['Rich occlusives + ceramides', 'High-strength retinoids', 'Facial massage for circulation', 'Dietary collagen + protein'],
    whatHappens: 'Estrogen withdrawal triggers a 30% collagen loss in just 5 years post-menopause. Skin thins dramatically, the fat pads in the face redistribute downward, and wound healing slows. Hydration becomes critical as sebaceous glands produce less oil.',
  },
  {
    age: '60s+',
    color: Colors.blue,
    headline: 'Long-term cumulative effects dominate',
    collagen: '~50% less than peak',
    turnover: 'Every ~60–70 days',
    concerns: ['Sun spots and rough texture from decades of UV', 'Very slow healing', 'Extreme fragility', 'Chronic dryness'],
    musts: ['Gentle cleansing only', 'Heavy barrier creams', 'SPF daily (still!)', 'Anti-inflammatory diet'],
    whatHappens: 'Decades of accumulated UV damage, oxidative stress, and lifestyle choices manifest fully. The skin is thin, fragile, and slow to heal. Sebaceous gland activity is very low. Consistent, gentle, moisture-focused care is essential.',
  },
  ];
}

const SCIENCE = [
  {
    mechanism: 'Collagen Loss',
    icon: 'layers-outline',
    detail: 'Type I and III collagen decline ~1% per year from mid-20s. Post-menopause, the rate accelerates due to estrogen withdrawal. By 60, approximately 50% of peak collagen is gone.',
  },
  {
    mechanism: 'Elastin Degradation',
    icon: 'resize-outline',
    detail: 'Elastin — the protein that lets skin snap back — is produced only during childhood development. Adult skin cannot make new elastin. UV exposure and oxidative stress degrade existing elastin fibers.',
  },
  {
    mechanism: 'Cell Turnover Slowdown',
    icon: 'refresh-outline',
    detail: 'Keratinocyte turnover slows from ~28 days at 20 to ~70 days at 60+. Dead cells accumulate on the surface, causing dullness. Exfoliation becomes more important with age.',
  },
  {
    mechanism: 'GAG Depletion',
    icon: 'water-outline',
    detail: 'Glycosaminoglycans like hyaluronic acid and chondroitin sulfate decline with age. These molecules hold 1000x their weight in water. Their loss causes structural dehydration, not just surface dryness.',
  },
  {
    mechanism: 'Mitochondrial Dysfunction',
    icon: 'flash-outline',
    detail: 'Aging cells produce less ATP (cellular energy). Skin cells have less energy for collagen synthesis, DNA repair, and barrier maintenance. This is a key driver of intrinsic aging.',
  },
  {
    mechanism: 'Sebaceous Decline',
    icon: 'droplet-outline',
    detail: 'Oil gland activity peaks in the teens/20s and steadily declines. Post-menopause, sebum production drops 40–50%. The skin\'s natural moisturising factor also decreases, reducing water retention.',
  },
  {
    mechanism: 'Microbiome Shift',
    icon: 'bug-outline',
    detail: 'The skin microbiome changes composition with age. Diversity decreases, Staphylococcus aureus colonisation increases, and the acid mantle weakens — all contributing to barrier dysfunction.',
  },
];

function buildAccelerators(Colors: ReturnType<typeof shimColors>) {
  return [
  { factor: 'UV Radiation', impact: 'Critical', icon: 'sunny-outline', color: Colors.red,
    detail: 'Accounts for ~80–90% of visible skin aging (photoaging). UV destroys collagen via MMP enzymes, crosslinks elastin, causes DNA mutations, and creates free radicals that oxidise cellular components.' },
  { factor: 'Smoking', impact: 'Severe', icon: 'flame-outline', color: Colors.red,
    detail: 'Narrows blood vessels reducing oxygen delivery to skin. Generates massive oxidative stress. Activates MMPs that break down collagen. Smokers typically appear 10–15 years older than their chronological age.' },
  { factor: 'High Glycaemic Diet', impact: 'High', icon: 'restaurant-outline', color: Colors.primary,
    detail: 'Sugar bonds to collagen through glycation, forming Advanced Glycation End-products (AGEs). AGEs make collagen stiff and yellow, causing sallowness and deep wrinkles. Processed carbohydrates are primary culprits.' },
  { factor: 'Chronic Stress', impact: 'High', icon: 'alert-circle-outline', color: Colors.primary,
    detail: 'Sustained cortisol elevation suppresses collagen synthesis, impairs wound healing, and degrades the skin barrier. Stress also triggers telomere shortening — accelerating cellular aging at the DNA level.' },
  { factor: 'Poor Sleep', impact: 'High', icon: 'moon-outline', color: Colors.primary,
    detail: 'Growth hormone — the primary collagen synthesis trigger — is released almost entirely during deep sleep. Chronic sleep deprivation cuts GH output dramatically, slowing collagen repair.' },
  { factor: 'Air Pollution', impact: 'Moderate', icon: 'cloud-outline', color: Colors.gold,
    detail: 'Particulate matter (PM2.5) penetrates pores, generating oxidative stress and inflammation. Urban pollution is associated with more pronounced nasolabial folds and age spots.' },
  { factor: 'Alcohol', impact: 'Moderate', icon: 'wine-outline', color: Colors.gold,
    detail: 'Dehydrates skin, depletes antioxidants (especially vitamin A), and promotes systemic inflammation. Regular drinking accelerates collagen breakdown and causes redness, puffiness, and broken capillaries.' },
  ];
}

function buildSlowIt(Colors: ReturnType<typeof shimColors>) {
  return [
  {
    category: 'Daily Non-Negotiables',
    color: Colors.green,
    items: [
      'SPF 50+ every morning — no exception, even indoors (UVA penetrates glass)',
      'Antioxidant serum (vitamin C, niacinamide, resveratrol) to neutralise free radicals',
      'Night retinoid — the most evidence-backed anti-aging ingredient in existence',
    ],
  },
  {
    category: 'Structural Support',
    color: Colors.blue,
    items: [
      'Peptide serum — signals fibroblasts to produce more collagen and elastin',
      'Hyaluronic acid with occlusive seal — prevents transepidermal water loss',
      'Facial massage — stimulates fibroblasts, improves lymphatic drainage',
    ],
  },
  {
    category: 'Dietary Interventions',
    color: Colors.gold,
    items: [
      'Collagen peptides (10g/day) — shown to increase dermal collagen density',
      'Anti-glycation diet: reduce sugar and refined carbs to prevent AGE formation',
      'Polyphenol-rich foods (berries, green tea, olive oil) — systemic antioxidant protection',
    ],
  },
  {
    category: 'Lifestyle Architecture',
    color: Colors.teal,
    items: [
      '7–9 hours sleep for growth hormone-driven overnight collagen repair',
      'Stress management — chronic cortisol is a collagen destroyer',
      'Never smoke; minimise alcohol; limit pollution exposure when possible',
    ],
  },
  ];
}

export default function AgingTimeline() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const DECADES = useMemo(() => buildDecades(Colors), [Colors]);
  const ACCELERATORS = useMemo(() => buildAccelerators(Colors), [Colors]);
  const SLOW_IT = useMemo(() => buildSlowIt(Colors), [Colors]);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [expandedDecade, setExpandedDecade] = useState<number | null>(0);
  const [expandedSci, setExpandedSci] = useState<number | null>(null);
  const [expandedAcc, setExpandedAcc] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Skin Aging Timeline</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>How Skin Ages — Decade by Decade</Text>
        <Text style={styles.heroSub}>Biology, accelerators, and what actually slows the clock</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {TABS.map((t, i) => (
          <Pressable key={t} onPress={() => setActiveTab(i)} style={[styles.tab, activeTab === i && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* DECADES */}
        {activeTab === 0 && (
          <View style={{ gap: 10 }}>
            <Text style={styles.sectionNote}>Tap each decade to expand the full picture</Text>
            {DECADES.map((d, i) => (
              <Pressable key={d.age} onPress={() => setExpandedDecade(expandedDecade === i ? null : i)} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: d.color + '22' }]}>
                    <Text style={[styles.badgeText, { color: d.color }]}>{d.age}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{d.headline}</Text>
                  <Ionicons name={expandedDecade === i ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
                </View>
                {expandedDecade === i && (
                  <View style={{ gap: 10, marginTop: 12 }}>
                    <Text style={styles.para}>{d.whatHappens}</Text>
                    <View style={styles.infoRow}>
                      <View style={styles.infoBlock}>
                        <Text style={styles.infoLabel}>Collagen Status</Text>
                        <Text style={[styles.infoValue, { color: d.color }]}>{d.collagen}</Text>
                      </View>
                      <View style={styles.infoBlock}>
                        <Text style={styles.infoLabel}>Cell Turnover</Text>
                        <Text style={[styles.infoValue, { color: d.color }]}>{d.turnover}</Text>
                      </View>
                    </View>
                    <Text style={styles.subLabel}>Key Concerns</Text>
                    {d.concerns.map(c => (
                      <View key={c} style={styles.bulletRow}>
                        <View style={[styles.dot, { backgroundColor: d.color }]} />
                        <Text style={styles.bulletText}>{c}</Text>
                      </View>
                    ))}
                    <Text style={styles.subLabel}>Must-Haves This Decade</Text>
                    {d.musts.map(m => (
                      <View key={m} style={styles.bulletRow}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.green} />
                        <Text style={styles.bulletText}>{m}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* SCIENCE */}
        {activeTab === 1 && (
          <View style={{ gap: 10 }}>
            <Text style={styles.sectionNote}>The biological mechanisms behind visible aging</Text>
            {SCIENCE.map((s, i) => (
              <Pressable key={s.mechanism} onPress={() => setExpandedSci(expandedSci === i ? null : i)} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name={s.icon as any} size={20} color={Colors.primary} />
                  <Text style={[styles.cardTitle, { flex: 1 }]}>{s.mechanism}</Text>
                  <Ionicons name={expandedSci === i ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
                </View>
                {expandedSci === i && <Text style={[styles.para, { marginTop: 10 }]}>{s.detail}</Text>}
              </Pressable>
            ))}
          </View>
        )}

        {/* ACCELERATORS */}
        {activeTab === 2 && (
          <View style={{ gap: 10 }}>
            <Text style={styles.sectionNote}>Lifestyle factors that age skin faster than biology alone</Text>
            {ACCELERATORS.map((a, i) => (
              <Pressable key={a.factor} onPress={() => setExpandedAcc(expandedAcc === i ? null : i)} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name={a.icon as any} size={20} color={a.color} />
                  <Text style={[styles.cardTitle, { flex: 1 }]}>{a.factor}</Text>
                  <View style={[styles.badge, { backgroundColor: a.color + '22' }]}>
                    <Text style={[styles.badgeText, { color: a.color }]}>{a.impact}</Text>
                  </View>
                  <Ionicons name={expandedAcc === i ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
                </View>
                {expandedAcc === i && <Text style={[styles.para, { marginTop: 10 }]}>{a.detail}</Text>}
              </Pressable>
            ))}
          </View>
        )}

        {/* SLOW IT */}
        {activeTab === 3 && (
          <View style={{ gap: 14 }}>
            <Text style={styles.sectionNote}>Evidence-backed strategies that demonstrably slow skin aging</Text>
            {SLOW_IT.map(cat => (
              <View key={cat.category} style={styles.card}>
                <View style={[styles.catHeader, { borderLeftColor: cat.color }]}>
                  <Text style={[styles.catTitle, { color: cat.color }]}>{cat.category}</Text>
                </View>
                <View style={{ gap: 8, marginTop: 10 }}>
                  {cat.items.map(item => (
                    <View key={item} style={styles.bulletRow}>
                      <View style={[styles.dot, { backgroundColor: cat.color }]} />
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TALLOW AGE */}
        {activeTab === 4 && (
          <View style={{ gap: 14 }}>
            <View style={[styles.card, { borderColor: Colors.primary }]}>
              <Text style={[styles.cardTitle, { color: Colors.primary, marginBottom: 8 }]}>Tallow as an Anti-Aging Ingredient</Text>
              <Text style={styles.para}>
                Tallow's lipid profile — dominated by oleic acid (47%), palmitic acid (26%), and stearic acid (21%) — mirrors the fatty acid composition of human sebum more closely than any plant oil. This structural similarity enables genuine integration into the skin matrix, not just surface-level moisturisation.
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={[styles.subLabel, { marginBottom: 8 }]}>Why Tallow Works for Aging Skin</Text>
              {[
                { point: 'Fat-Soluble Vitamins A, D, E, K', detail: 'Tallow contains retinyl esters (vitamin A precursors), tocopherols (vitamin E), cholecalciferol (D3), and vitamin K2. These are precisely the vitamins depleted by aging — retinoids regulate gene expression for collagen synthesis, vitamin E quenches oxidative stress, K2 activates matrix Gla-protein which prevents elastin calcification.' },
                { point: 'Conjugated Linoleic Acid (CLA)', detail: 'Grass-fed tallow contains CLA — a fatty acid with anti-inflammatory and antioxidant properties. CLA has been shown to modulate inflammatory signalling pathways that accelerate photoaging.' },
                { point: 'Barrier Restoration', detail: 'Aging skin loses barrier integrity, leading to accelerated transepidermal water loss (TEWL). Tallow\'s phospholipid and cholesterol content directly rebuilds the lipid lamellae of the stratum corneum, reducing TEWL and improving structural hydration.' },
                { point: 'No Endocrine Disruption', detail: 'Unlike many synthetic anti-aging ingredients (parabens, phthalates, oxybenzone in chemical SPF), tallow contains no endocrine disruptors. Hormone-disrupting chemicals accelerate aging processes — avoiding them is itself an anti-aging strategy.' },
              ].map(p => (
                <View key={p.point} style={[styles.card, { backgroundColor: Colors.cardAlt, marginBottom: 10 }]}>
                  <Text style={[styles.subLabel, { color: Colors.gold, marginBottom: 4 }]}>{p.point}</Text>
                  <Text style={styles.para}>{p.detail}</Text>
                </View>
              ))}
            </View>
            <View style={styles.card}>
              <Text style={[styles.subLabel, { marginBottom: 10 }]}>Decade-Specific Tallow Application</Text>
              {[
                { decade: '20s', use: 'Light application as moisturiser, habit building. Focus on occlusive finish after serum.' },
                { decade: '30s', use: 'Primary evening moisturiser. Layer over retinoid to buffer without blocking absorption.' },
                { decade: '40s', use: 'AM and PM. Richer application on areas of laxity. Face massage technique amplifies delivery.' },
                { decade: '50s+', use: 'Primary skin care anchor. Provides lipid replenishment that no longer comes from aging sebaceous glands.' },
              ].map(r => (
                <View key={r.decade} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { color: Colors.primary, fontWeight: '700', width: 50 }]}>{r.decade}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{r.use}</Text>
                </View>
              ))}
            </View>
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
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  para: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  subLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletText: { fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 19 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  infoRow: { flexDirection: 'row', gap: 10 },
  infoBlock: { flex: 1, backgroundColor: Colors.cardAlt, borderRadius: 10, padding: 10 },
  infoLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 3 },
  infoValue: { fontSize: 13, fontWeight: '700' },
  catHeader: { borderLeftWidth: 3, paddingLeft: 10 },
  catTitle: { fontSize: 14, fontWeight: '800' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableCell: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  });
}
