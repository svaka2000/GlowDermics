import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const Colors = {
  bg: '#0A0A0F',
  card: '#13131A',
  cardAlt: '#1A1A24',
  border: '#2A2A3A',
  primary: '#C4622D',
  gold: '#D4A96A',
  textPrimary: '#FAF3E0',
  textSecondary: '#9A9AAF',
  textMuted: '#5A5A6E',
  green: '#4ADE80',
  red: '#F87171',
  blue: '#60A5FA',
  purple: '#6B85A8',
};

const TABS = [
  { id: 'science', label: 'How Aging Works', icon: '🔬' },
  { id: 'pillars', label: 'Pillars', icon: '🏛️' },
  { id: 'actives', label: 'Key Actives', icon: '⚗️' },
  { id: 'lifestyle', label: 'Lifestyle', icon: '🌿' },
  { id: 'tallow', label: 'Tallow Approach', icon: '✨' },
];

const AGING_SCIENCE = [
  {
    title: 'Intrinsic aging — unavoidable',
    content: 'Genetic aging: collagen production declines ~1% per year after 25. Elastin cross-links and loses flexibility. Cell turnover slows. This is written in your DNA and cannot be fully prevented — only slowed.',
  },
  {
    title: 'Extrinsic aging — mostly preventable',
    content: 'UV radiation accounts for 80% of visible facial aging. Pollution, smoking, sugar (glycation), stress, and sleep deprivation account for the rest. These are all modifiable. Prevention here is exponentially more effective than correction.',
  },
  {
    title: 'Collagen — the structural framework',
    content: 'Type I and III collagen form the dermis scaffold. Collagen loss creates wrinkles, sagging, and enlarged pores. UV radiation destroys collagen via metalloproteinase activation. Retinoids and Vitamin C directly stimulate new collagen synthesis.',
  },
  {
    title: 'Glycation — sugar\'s silent damage',
    content: 'Excess blood sugar molecules attach to collagen and elastin fibers (Advanced Glycation End-products, AGEs). This cross-links and stiffens them, causing rigidity, yellowing, and loss of resilience. Low-glycemic diet is the anti-aging diet.',
  },
  {
    title: 'Telomere shortening — cellular aging',
    content: 'Each time a skin cell divides, telomeres (chromosome end-caps) shorten. Shorter telomeres = accelerated aging, impaired repair, reduced barrier function. UV, smoking, and chronic stress all accelerate telomere shortening.',
  },
  {
    title: 'Inflammaging — the silent accelerator',
    content: 'Chronic low-grade inflammation ("inflammaging") is the underlying driver of accelerated aging. Sources: poor diet, poor sleep, stress, UV, and gut dysbiosis. Anti-inflammatory diet and lifestyle directly slow skin aging.',
  },
];

const PILLARS = [
  {
    pillar: 'Prevention (SPF)',
    priority: 1,
    color: Colors.gold,
    icon: '☀️',
    detail: 'The highest ROI anti-aging intervention is SPF applied correctly, every day. It prevents 80% of visible aging causes. Nothing else comes close. Retinol undoes damage; SPF prevents it from happening.',
    action: 'SPF 30+ broad spectrum, minimum two-finger application, daily including cloudy days and winter.',
  },
  {
    pillar: 'Cell Turnover (Retinoids)',
    priority: 2,
    color: Colors.purple,
    icon: '🔄',
    detail: 'Retinoids (vitamin A derivatives) are the most evidence-backed anti-aging topical category. They stimulate collagen synthesis, accelerate cell turnover, fade hyperpigmentation, and reduce fine lines. No other single ingredient does all of this.',
    action: 'Start at 0.025%, twice weekly PM. Increase concentration and frequency over months. Use skin cycling to avoid barrier damage.',
  },
  {
    pillar: 'Antioxidant Defense (Vitamin C)',
    priority: 3,
    color: Colors.gold,
    icon: '🍊',
    detail: 'Free radicals from UV, pollution, and metabolic processes damage collagen and DNA. Vitamin C neutralizes free radicals (antioxidant), directly stimulates collagen synthesis, and inhibits melanin production. AM-only ingredient.',
    action: '10–20% L-ascorbic acid (or more stable derivative) every morning before SPF. Store in opaque, airtight container.',
  },
  {
    pillar: 'Barrier Repair (Ceramides + Occlusives)',
    priority: 4,
    color: Colors.blue,
    icon: '🛡️',
    detail: 'A compromised barrier accelerates aging — it cannot retain moisture, which magnifies the appearance of fine lines. It cannot prevent pollutant penetration. Barrier repair is the foundation everything else builds on.',
    action: 'Ceramide moisturizer or tallow-based occlusive PM. Apply on damp skin to lock in moisture.',
  },
  {
    pillar: 'Collagen Synthesis Support',
    priority: 5,
    color: Colors.green,
    icon: '💪',
    detail: 'Beyond retinoids: peptides signal fibroblasts to produce collagen. Niacinamide improves barrier and reduces glycation. Vitamin C is a cofactor for collagen synthesis. Diet (vitamin C, protein) is as important as topicals.',
    action: 'Peptide serum alternated with retinol nights. Adequate protein intake (1.2-1.6g/kg body weight daily).',
  },
  {
    pillar: 'Volume Maintenance (Hydration)',
    priority: 6,
    color: Colors.blue,
    icon: '💧',
    detail: 'Dehydrated skin exaggerates fine lines dramatically. Hyaluronic acid holds 1000× its weight in water — but must be applied to damp skin or it draws moisture FROM the skin. Drinking water hydrates from within.',
    action: 'HA serum on damp skin, followed by occlusive to seal. Adequate water intake (8+ glasses). Humidifier in dry environments.',
  },
];

const KEY_ACTIVES = [
  {
    active: 'Retinol / Retinoids',
    tier: 'S Tier',
    tierColor: Colors.gold,
    evidence: 'Highest clinical evidence for anti-aging',
    mechanism: 'Activates RAR receptors, directly stimulating collagen synthesis and accelerating cell turnover. Increases hyaluronic acid production in dermis. Reduces melanin transfer.',
    howToUse: 'Start at 0.025–0.05%, twice weekly PM. Build to 0.1–0.5% over months. Always follow with moisturizer. Never use AM (UV degrades retinol and increases photosensitivity).',
    warning: 'Can cause initial irritation, dryness, and peeling. Slow introduction is essential. Not for use during pregnancy.',
  },
  {
    active: 'Vitamin C (L-ascorbic acid)',
    tier: 'S Tier',
    tierColor: Colors.gold,
    evidence: 'Extensive clinical evidence for collagen synthesis and photo-protection',
    mechanism: 'Cofactor for collagen-synthesizing enzymes (prolyl and lysyl hydroxylase). Neutralizes UV-induced free radicals. Inhibits tyrosinase (melanin production). Regenerates vitamin E.',
    howToUse: '10–20% LAA, pH 2.5–3.5, AM only before SPF. Allow 30–60 seconds to absorb. Store in dark, airtight, cool location.',
    warning: 'Unstable ingredient — oxidizes to dehydroascorbic acid (yellow/orange). Replace when discoloured. May sting sensitive skin.',
  },
  {
    active: 'Peptides',
    tier: 'A Tier',
    tierColor: Colors.blue,
    evidence: 'Good clinical evidence for collagen stimulation at specific peptide types',
    mechanism: 'Short amino acid chains that act as cell-signaling molecules. Matrixyl (palmitoyl pentapeptide) signals fibroblasts to produce more collagen. Argireline inhibits muscle contractions (botox-like, mild effect).',
    howToUse: 'Apply in serum form on alternate nights to retinol. Leave on — do not rinse. Require consistent daily use for weeks to show effect.',
    warning: 'Do not mix with direct acid exfoliants — they denature peptides. Apply after pH normalizes (20 min post-acid).',
  },
  {
    active: 'Niacinamide',
    tier: 'A Tier',
    tierColor: Colors.blue,
    evidence: 'Strong clinical evidence for multiple anti-aging mechanisms',
    mechanism: 'Reduces glycation (anti-AGE), strengthens barrier, reduces sebum (secondary anti-aging), fades hyperpigmentation, and reduces skin yellowing. One of the most versatile anti-aging actives.',
    howToUse: '5–10%, AM and PM. Extremely well-tolerated. One of the few actives that is low-irritation from the start.',
    warning: 'At high concentrations with Vitamin C — may cause temporary flushing. Apply separately or at different times.',
  },
  {
    active: 'AHA (Glycolic/Lactic Acid)',
    tier: 'B Tier',
    tierColor: Colors.green,
    evidence: 'Clinical evidence for surface renewal and pigmentation',
    mechanism: 'Loosens corneocyte (dead skin cell) attachments, accelerating desquamation. Stimulates collagen synthesis at higher concentrations. Glycolic penetrates deepest (smallest molecule).',
    howToUse: '5–10% glycolic or 10% lactic, 1–2× per week PM (not retinol nights). Always use SPF next morning — AHAs increase photosensitivity.',
    warning: 'Increases UV sensitivity for 5–7 days. Do not skip SPF. Not for sensitive or rosacea skin.',
  },
  {
    active: 'SPF (Broad Spectrum)',
    tier: 'S Tier (prevention)',
    tierColor: Colors.gold,
    evidence: 'Overwhelming evidence — prevents 80% of extrinsic aging causes',
    mechanism: 'Prevents UVA from degrading collagen via MMP activation. Prevents UVB-induced DNA damage. Prevents free radical generation. The only intervention that prevents damage rather than repairing it.',
    howToUse: 'SPF 30–50 broad spectrum, last skincare step AM, 2-finger rule for coverage, reapply every 2 hours outdoors.',
    warning: 'Most people underapply by 60–80%. Correct application is as important as formula choice.',
  },
];

const LIFESTYLE = [
  { factor: 'Sleep (7–9 hours)', impact: 'critical', detail: 'During deep sleep: growth hormone peaks (collagen synthesis), cortisol drops (reduced glycation and inflammation), skin barrier repairs. Chronic sleep deprivation visibly ages skin by 3–5 years in appearance.' },
  { factor: 'Diet: protein and collagen co-factors', impact: 'high', detail: 'Adequate protein provides amino acids for collagen synthesis. Vitamin C (cofactor), copper (lysyl oxidase), zinc (wound healing) are essential. Bone broth provides precursor amino acids directly.' },
  { factor: 'Low-glycemic diet', impact: 'high', detail: 'Dietary AGEs from high-heat cooking (charred meat, fried food) and high sugar intake accelerate glycation of collagen. Mediterranean diet consistently shows anti-aging benefits in long-term studies.' },
  { factor: 'Hydration (internal)', impact: 'medium', detail: 'Adequate water intake maintains dermal hydration from within. Dehydrated dermis is less plump and resilient. 8+ glasses minimum, more in heat/exercise.' },
  { factor: 'Stress management', impact: 'high', detail: 'Chronic cortisol suppresses collagen synthesis, increases glycation, and accelerates telomere shortening. Breathwork, meditation, and adequate leisure time directly protect skin at the cellular level.' },
  { factor: 'Exercise (moderate)', impact: 'medium', detail: 'Moderate cardiovascular exercise increases circulation (collagen delivery) and reduces cortisol. Recent research shows exercise reverses some skin aging markers at the cellular level. Excessive exercise without recovery increases oxidative stress.' },
  { factor: 'Don\'t smoke', impact: 'critical', detail: 'Smoking destroys vitamin C (required for collagen), triggers MMP enzymes that break down collagen, causes vasoconstriction reducing nutrient delivery, and generates massive free radical burden. Smokers age 10–15 years faster visibly.' },
  { factor: 'Facial sleep position', impact: 'low', detail: 'Side sleeping creates compression wrinkles (sleep lines) over decades. Silk pillowcase reduces friction. Back sleeping eliminates the problem entirely but is difficult to maintain.' },
];

const getImpactColor = (i: string) => {
  if (i === 'critical') return Colors.red;
  if (i === 'high') return Colors.gold;
  return Colors.blue;
};

export default function AntiAgingScreen() {
  const [activeTab, setActiveTab] = useState('science');
  const [expandedPillar, setExpandedPillar] = useState<number | null>(null);
  const [expandedActive, setExpandedActive] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Anti-Aging Protocol</Text>
        <View style={{ width: 60 }} />
      </View>

      <LinearGradient colors={['#D4A96A22', '#0A0A0F']} style={styles.hero}>
        <Text style={styles.heroEmoji}>⏳</Text>
        <Text style={styles.heroTitle}>Anti-Aging Protocol</Text>
        <Text style={styles.heroSub}>Evidence-based strategies to slow aging — and what actually moves the needle</Text>
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

        {activeTab === 'science' && AGING_SCIENCE.map((item, i) => (
          <View key={i} style={styles.sciCard}>
            <Text style={styles.sciTitle}>{item.title}</Text>
            <Text style={styles.sciContent}>{item.content}</Text>
          </View>
        ))}

        {activeTab === 'pillars' && (
          <>
            <Text style={styles.pillarsIntro}>
              These are the 6 pillars of an evidence-based anti-aging routine — ranked by impact. Stack them in order.
            </Text>
            {PILLARS.map((pillar, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.pillarCard, { borderLeftColor: pillar.color, borderLeftWidth: 4 }]}
                onPress={() => setExpandedPillar(expandedPillar === i ? null : i)}
                activeOpacity={0.85}
              >
                <View style={styles.pillarHeader}>
                  <View style={[styles.pillarNum, { backgroundColor: pillar.color + '22' }]}>
                    <Text style={[styles.pillarNumText, { color: pillar.color }]}>{pillar.priority}</Text>
                  </View>
                  <Text style={styles.pillarIcon}>{pillar.icon}</Text>
                  <Text style={styles.pillarName}>{pillar.pillar}</Text>
                  <Text style={styles.expandIcon}>{expandedPillar === i ? '▲' : '▼'}</Text>
                </View>
                {expandedPillar === i && (
                  <View style={styles.pillarExpanded}>
                    <Text style={styles.pillarDetail}>{pillar.detail}</Text>
                    <View style={styles.pillarAction}>
                      <Text style={styles.pillarActionLabel}>ACTION</Text>
                      <Text style={styles.pillarActionText}>{pillar.action}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === 'actives' && KEY_ACTIVES.map((active, i) => (
          <TouchableOpacity
            key={i}
            style={styles.activeCard}
            onPress={() => setExpandedActive(expandedActive === active.active ? null : active.active)}
            activeOpacity={0.85}
          >
            <View style={styles.activeHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.activeName}>{active.active}</Text>
                <Text style={styles.activeEvidence}>{active.evidence}</Text>
              </View>
              <View style={[styles.tierBadge, { borderColor: active.tierColor, backgroundColor: active.tierColor + '22' }]}>
                <Text style={[styles.tierText, { color: active.tierColor }]}>{active.tier}</Text>
              </View>
            </View>
            {expandedActive === active.active && (
              <View style={styles.activeExpanded}>
                <Text style={styles.activeMechLabel}>How it works</Text>
                <Text style={styles.activeMech}>{active.mechanism}</Text>
                <Text style={styles.activeMechLabel}>How to use</Text>
                <Text style={styles.activeMech}>{active.howToUse}</Text>
                <Text style={[styles.activeMechLabel, { color: Colors.red }]}>Watch out</Text>
                <Text style={styles.activeMech}>{active.warning}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {activeTab === 'lifestyle' && LIFESTYLE.map((item, i) => (
          <View key={i} style={styles.lifestyleCard}>
            <View style={styles.lifestyleHeader}>
              <Text style={styles.lifestyleTitle}>{item.factor}</Text>
              <View style={[styles.impactBadge, { borderColor: getImpactColor(item.impact) }]}>
                <Text style={[styles.impactText, { color: getImpactColor(item.impact) }]}>{item.impact.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.lifestyleDetail}>{item.detail}</Text>
          </View>
        ))}

        {activeTab === 'tallow' && (
          <>
            <View style={styles.tallowIntro}>
              <Text style={styles.tallowIntroText}>
                Tallow is not a single-solution anti-aging product — it's a foundational barrier ingredient that makes the entire anti-aging stack more effective. Here's how.
              </Text>
            </View>
            {[
              {
                title: 'Fat-soluble vitamins delivered in biocompatible form',
                detail: "Tallow contains vitamins A, D, E, and K2 in their fat-soluble, bioavailable forms. Vitamin A (retinol precursor) supports cell turnover. Vitamin E is a lipophilic antioxidant. Vitamin K2 supports skin elasticity. These come packaged in a fatty acid matrix the skin recognizes.",
              },
              {
                title: 'Retinol buffer on active nights',
                detail: 'Applied after retinol (15–20 minute wait), tallow buffers irritation and accelerates the barrier repair between retinol nights. This allows you to maintain retinol consistency without the barrier burnout that causes most people to quit.',
              },
              {
                title: 'Collagen support via barrier integrity',
                detail: 'A compromised barrier allows collagen-degrading metalloproteinases (MMPs) to reach the dermis more easily. By maintaining barrier integrity with tallow, you protect collagen from breakdown that occurs not just from UV, but from a damaged barrier.',
              },
              {
                title: 'CLA and anti-inflammatory action',
                detail: 'Grass-fed tallow contains conjugated linoleic acid (CLA), which has demonstrated anti-inflammatory and potentially anti-glycation effects in research. Reduced inflammation directly slows the inflammaging process.',
              },
              {
                title: 'Ancestral anti-aging context',
                detail: "Humans have used animal fats on skin for tens of thousands of years. The molecular compatibility isn't accidental — it's evolutionary. The skin's protective sebum closely matches tallow, making it the most compatible exogenous fat available.",
              },
              {
                title: 'The anti-aging stack with tallow',
                detail: 'AM: Vitamin C → tallow (thin) → mineral SPF. PM: double cleanse → retinol → 20 min wait → tallow (generous, as buffer + occlusive). This stack addresses all 6 pillars simultaneously.',
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    padding: 20, borderWidth: 1, borderColor: Colors.gold + '44', alignItems: 'center',
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
  tabChipActive: { borderColor: Colors.gold, backgroundColor: Colors.gold + '22' },
  tabIcon: { fontSize: 13 },
  tabLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: Colors.gold },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  sciCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  sciTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  sciContent: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  pillarsIntro: {
    color: Colors.textSecondary, fontSize: 13, lineHeight: 20,
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 14,
  },
  pillarCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  pillarHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pillarNum: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  pillarNumText: { fontSize: 13, fontWeight: '800' },
  pillarIcon: { fontSize: 16 },
  pillarName: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  expandIcon: { color: Colors.textMuted, fontSize: 12 },
  pillarExpanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  pillarDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 10 },
  pillarAction: {
    backgroundColor: Colors.primary + '15', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: Colors.primary + '33',
  },
  pillarActionLabel: { color: Colors.primary, fontSize: 10, fontWeight: '700', marginBottom: 4 },
  pillarActionText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  activeCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  activeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  activeName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 3 },
  activeEvidence: { color: Colors.textMuted, fontSize: 11, lineHeight: 17 },
  tierBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  tierText: { fontSize: 10, fontWeight: '700' },
  activeExpanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  activeMechLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: 4, marginTop: 8 },
  activeMech: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  lifestyleCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  lifestyleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  lifestyleTitle: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginRight: 10 },
  impactBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  impactText: { fontSize: 10, fontWeight: '700' },
  lifestyleDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowIntro: {
    backgroundColor: Colors.primary + '15', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.primary + '44', marginBottom: 14,
  },
  tallowIntroText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 21, fontStyle: 'italic' },
  tallowCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  tallowCardTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowCardDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
