import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

function shimColors(c: Palette) {
  return {
    bg: c.bg, card: c.bgCard, cardAlt: c.bgElevated, border: c.border,
    primary: c.primary, gold: c.gold, textPrimary: c.textPrimary,
    textSecondary: c.textSecondary, textMuted: c.textMuted,
    green: c.scoreGood, red: c.scorePoor, blue: c.hydration,
    purple: c.darkCircles, teal: '#2DD4BF',
  };
}
type ShimColors = ReturnType<typeof shimColors>;

const TABS = ['Overview', 'KP', 'Body Acne', 'Stretch Marks', 'Ingrown Hairs', 'Dry Body'];

const BODY_OVERVIEW = [
  { area: 'Body skin vs face skin', detail: 'Body skin is structurally different from facial skin: thicker dermis, larger pores (especially trunk), different sebaceous gland density, fewer sweat glands per area on arms/legs, and lower NMF content in exposed areas like shins. The same product applied to face vs body may behave differently.', icon: '🧬' },
  { area: 'Why body skin is usually neglected', detail: 'Most skincare education focuses on the face. Yet body skin represents 98% of total body surface area. Issues like KP, body acne, and severe dryness affect significantly more people than many facial conditions, and the body sees more UV exposure (arms, chest, neck) and occupational friction (hands, knees).', icon: '📊' },
  { area: 'Tallow for body skin', detail: 'Tallow is if anything MORE appropriate for body skin than face. Body skin has larger lipid needs given its surface area. Tallow on the body after showering (while still slightly damp) is highly efficient — a small amount covers a large area and absorbs in minutes. Particularly effective for elbows, knees, feet, and any area prone to extreme dryness.', icon: '🌿' },
  { area: 'Body skin and sunscreen', detail: 'Neck, chest, hands, and forearms receive nearly as much cumulative UV as the face. Photoaging of the hands and chest is one of the most reliable chronological age indicators — and completely preventable with SPF. Body SPF is often neglected because it requires more product to cover large areas.', icon: '☀️' },
];

const KP_DATA = {
  what: 'Keratosis Pilaris (KP) — sometimes called "chicken skin" — is a benign genetic condition where keratin (a protein in skin) builds up around hair follicles, forming tiny raised bumps. Affects approximately 40% of adults. Most common on upper arms, thighs, cheeks, and buttocks. Not infectious, not dangerous, just a keratin regulation issue.',
  causes: ['Genetic — autosomal dominant pattern. Family history is the primary predictor.', 'Dry skin exacerbates it — KP worsens in winter.', 'Associated with atopic dermatitis, eczema, and ichthyosis.', 'Low essential fatty acid status (linoleic acid deficiency worsens KP).'],
  treatments: [
    { treatment: 'Urea cream 10–20%', detail: 'Urea is a keratolytic — it breaks down and softens the keratin plugs. 10% for maintenance, 20% for active treatment. Apply to affected areas after shower, daily. Results in 4–8 weeks.' },
    { treatment: 'AHA body lotion (lactic acid or glycolic)', detail: '10–12% lactic acid or glycolic acid body lotion. Apply to affected areas after shower on damp skin. Chemical exfoliation dissolves the keratin accumulation. Results in 4–8 weeks.' },
    { treatment: 'BHA body wash (2% salicylic acid)', detail: 'Leave on affected areas for 2 minutes before rinsing. Salicylic acid penetrates hair follicles and dissolves the keratin blockage from inside. The most targeted approach for follicular KP.' },
    { treatment: 'Physical exfoliation: konjac sponge or dry brushing', detail: 'Gentle circular motion in the shower over affected areas loosens the dead keratin. Must follow with moisturiser immediately. Physical only is less effective than chemical but compatible.' },
    { treatment: 'Tallow as post-exfoliation moisturiser', detail: 'After KP treatment (urea or AHA), apply tallow to the treated area. The linoleic acid content helps address the underlying essential fatty acid deficiency associated with KP. The occlusive function maintains softening between treatments.' },
  ],
  avoid: ['Harsh scrubs that cause inflammation', 'Hot showers (dry out skin and worsen keratin buildup)', 'Picking at bumps (causes PIH and scarring)', 'Skipping moisturiser after treatment'],
};

const BODY_ACNE_DATA = {
  what: 'Body acne (most commonly "bacne") follows the same pathology as facial acne — follicle blockage, C. acnes overgrowth, inflammation — but with body-specific factors: larger follicles, more frequent clothing occlusion, post-exercise sweat, and lower accessibility for topical treatment.',
  triggers: ['Post-exercise sweat (bacteria thrive in warm, moist environment)', 'Tight synthetic clothing (occlusion + friction)', 'Heavy conditioner or shampoo runoff down the back', 'Back-facing shower head leaving product residue', 'Hormonal factors (same as facial acne)', 'Comedogenic body lotions and sunscreens'],
  protocol: [
    { step: 1, action: 'BHA body wash: 2% salicylic acid', detail: 'Apply to wet skin on affected areas. Leave for 2 minutes before rinsing. The SA enters the follicle and dissolves keratin/sebum blockages. Use 3–5× weekly. Daily use for severe body acne during clearing phase.' },
    { step: 2, action: 'Benzoyl peroxide wash: 5%', detail: 'Leave on body acne areas for 2 minutes before rinsing. Bactericidal — kills C. acnes. Rotate with BHA wash or use on alternating days. Warning: bleaches fabric — rinse thoroughly, use white towels.' },
    { step: 3, action: 'Shower immediately after exercise', detail: 'Within 15 minutes of exercise ending. Do not allow post-exercise sweat to sit on skin. Cool water preferred — hot water opens pores further and increases inflammation.' },
    { step: 4, action: 'Change pillowcase weekly', detail: 'For back acne: back contact with pillowcase during sleep transfers sebum, bacteria, and dead skin cells to skin nightly. Silk pillowcase reduces friction and bacterial transfer.' },
    { step: 5, action: 'Loose, breathable clothing post-shower', detail: 'Tight synthetic fabrics maintain warmth and moisture next to skin — ideal bacterial conditions. Cotton or moisture-wicking fabrics for daily wear when body acne is active.' },
  ],
  tallowNote: 'Do not apply tallow over active body acne. Use tallow on non-acne areas (arms, legs, feet) for dryness. As body acne resolves, tallow can be applied to the cleared areas to support barrier recovery and reduce post-acne PIH.',
};

const STRETCH_MARKS = {
  what: 'Stretch marks (striae) form when skin is stretched faster than it can accommodate — during rapid growth (puberty), weight gain, pregnancy, or muscle building. The dermis (middle skin layer) tears, creating the characteristic pink-red (striae rubrae, fresh) or white-silver (striae albae, old) marks. They represent dermal scarring.',
  prevention: 'Prevention is far more effective than treatment. The window for prevention is during periods of rapid change. Keeping skin well-moisturised and elastic reduces the risk of dermal tearing. No topical fully prevents stretch marks when the growth rate exceeds the skin\'s elasticity limit.',
  treatments: [
    { treatment: 'Retinoids (tretinoin or retinol)', detail: 'Most clinically supported topical treatment. Retinoids stimulate new collagen synthesis and improve striated texture. Work best on pink/red (fresh) striae. On white/old striae, effect is minimal. Requires 6–12 months of consistent use.', evidence: 'strong' },
    { treatment: 'Centella asiatica (Cica)', detail: 'Contains madecassoside and asiaticoside — compounds that stimulate collagen synthesis and promote wound healing. Clinical studies show improvement in stretch mark appearance and skin elasticity at 4 months. Gentle option for during pregnancy (unlike retinoids).', evidence: 'moderate' },
    { treatment: 'Hyaluronic acid + occlusive (prevention)', detail: 'HA maintains skin plumpness and stretch capacity. Applied twice daily during high-risk periods (pregnancy, rapid growth). More effective as prevention than treatment. Must be sealed with occlusive.', evidence: 'moderate' },
    { treatment: 'Tallow during high-risk periods', detail: 'Tallow\'s lipid profile supports dermal elasticity. Vitamin A content (retinyl ester form) provides gentle retinoid activity. Applied twice daily during pregnancy (safe, natural source of vitamin A, unlike prescription retinoids) supports skin elasticity. Better as prevention than repair.', evidence: 'traditional' },
    { treatment: 'Professional: microneedling, laser, PRP', detail: 'For established white striae: microneedling, fractional laser, or PRP injections produce the most visible improvement. These are professional treatments requiring clinical consultation. Most effective within 5 years of formation.', evidence: 'strong (professional only)' },
  ],
};

const INGROWN_HAIRS = {
  what: 'Ingrown hairs form when a shaved, waxed, or epilated hair grows back and curls into the follicle rather than emerging through the skin. The trapped hair triggers inflammation, forming a red, raised bump. Particularly common in areas with coarser, curlier hair texture: bikini area, neck (men), underarms, and inner thighs.',
  causes: ['Dead skin cell buildup blocking follicle opening', 'Shaving against the grain', 'Very close shaves with multi-blade razors (cut below the surface, hair retracts then grows sideways)', 'Tight clothing rubbing over shaved skin', 'Naturally curly or coarse hair texture'],
  prevention: [
    'Exfoliate with BHA (salicylic acid) 24–48 hours before hair removal — clears follicle openings',
    'Shave WITH the grain, not against, using a single-blade razor',
    'Apply a warm compress before shaving — softens hair for cleaner cut',
    'Use a shaving oil (tallow works well) rather than foam for closer, cleaner glide',
    'Exfoliate regularly in prone areas between hair removal sessions',
    'Wear loose clothing for 24 hours after hair removal',
  ],
  treatment: 'For existing ingrown hairs: apply 2% BHA to affected area 2× daily. The acid softens the dead skin over the ingrown and helps the hair emerge. Do NOT dig out ingrown hairs with fingers — causes infection and scarring. Warm compress 2× daily softens the skin and encourages natural release.',
  tallowNote: 'Tallow as shaving oil: apply a thin layer of softened tallow to the skin before shaving. It provides a slick, hydrating glide that reduces friction-related ingrown hair formation, while nourishing the skin simultaneously. Rinse the razor frequently. Follow shave with a thin layer of tallow applied to calm skin.',
};

const DRY_BODY = [
  { area: 'Elbows', notes: 'High-friction area, few sebaceous glands, thick skin. Requires both physical exfoliation (pumice or urea) and occlusive moisturiser. Urea 20–40% is the gold standard for elbow skin. Tallow applied after exfoliation locks in softening.', icon: '💪' },
  { area: 'Knees', notes: 'Same as elbows — high friction, thin sebaceous coverage, prone to hyperpigmentation from constant pressure. Exfoliate gently, moisturise daily, avoid kneeling on hard surfaces without padding.', icon: '🦵' },
  { area: 'Heels and feet', notes: 'Thickest skin on the body (no sebaceous glands at all — the only area of skin with zero glands). Requires mechanical exfoliation (pumice stone, foot file) to manage callus buildup. Apply urea 40% cream overnight with socks for severe cracked heels. Tallow provides extreme occlusion overnight.', icon: '🦶' },
  { area: 'Hands', notes: 'Washed 15–30× daily, exposed to detergents, frequent UV exposure. Use hand cream after every wash. Tallow on hands overnight (with cotton gloves) is one of the most effective treatments for extremely dry hands and cuticle repair.', icon: '🤲' },
  { area: 'Shins and calves', notes: 'Limited sebaceous glands. Common site for xerosis (abnormal dry skin), especially in winter. Apply body lotion or tallow immediately after shower to slightly damp skin for maximum penetration.', icon: '🏃' },
  { area: 'Lips', notes: 'The lips have the thinnest skin on the body with zero sebaceous glands. They depend entirely on topical moisturisation and the surrounding skin\'s sebum. Tallow is excellent for lip balm — a tiny amount applied to lips creates lasting hydration.', icon: '👄' },
];

export default function BodyCareScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedKP, setExpandedKP] = useState<number | null>(null);
  const [expandedSM, setExpandedSM] = useState<number | null>(null);
  const [expandedOverview, setExpandedOverview] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Body Care Guide</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>🧴 Body Skin Guide</Text>
        <Text style={styles.heroSub}>98% of your skin is on your body. KP, body acne, stretch marks, extreme dryness — these are the most common skin concerns and the most undertreated.</Text>
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
            {BODY_OVERVIEW.map((o, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedOverview(expandedOverview === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{o.icon}</Text>
                  <Text style={[styles.cardTitle, { flex: 1 }]}>{o.area}</Text>
                  <Text style={styles.expandIcon}>{expandedOverview === i ? '▲' : '▼'}</Text>
                </View>
                {expandedOverview === i && <Text style={styles.cardDetail}>{o.detail}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 1 && (
          <View>
            <View style={styles.whatBlock}>
              <Text style={styles.whatLabel}>What is KP?</Text>
              <Text style={styles.whatText}>{KP_DATA.what}</Text>
            </View>
            <Text style={styles.sectionHeader}>Causes</Text>
            {KP_DATA.causes.map((c, i) => (
              <Text key={i} style={styles.bulletItem}>• {c}</Text>
            ))}
            <Text style={[styles.sectionHeader, { marginTop: 14 }]}>Treatments</Text>
            {KP_DATA.treatments.map((t, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedKP(expandedKP === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardTitle, { flex: 1 }]}>{t.treatment}</Text>
                  <Text style={styles.expandIcon}>{expandedKP === i ? '▲' : '▼'}</Text>
                </View>
                {expandedKP === i && <Text style={styles.cardDetail}>{t.detail}</Text>}
              </TouchableOpacity>
            ))}
            <Text style={[styles.sectionHeader, { marginTop: 4 }]}>Avoid</Text>
            {KP_DATA.avoid.map((a, i) => (
              <Text key={i} style={[styles.bulletItem, { color: Colors.red }]}>✗ {a}</Text>
            ))}
          </View>
        )}

        {activeTab === 2 && (
          <View>
            <View style={styles.whatBlock}>
              <Text style={styles.whatLabel}>Body Acne</Text>
              <Text style={styles.whatText}>{BODY_ACNE_DATA.what}</Text>
            </View>
            <Text style={styles.sectionHeader}>Common Triggers</Text>
            {BODY_ACNE_DATA.triggers.map((t, i) => (
              <Text key={i} style={styles.bulletItem}>• {t}</Text>
            ))}
            <Text style={[styles.sectionHeader, { marginTop: 14 }]}>Treatment Protocol</Text>
            {BODY_ACNE_DATA.protocol.map((s, i) => (
              <View key={i} style={styles.stepCard}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{s.step}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{s.action}</Text>
                  <Text style={styles.stepDetail}>{s.detail}</Text>
                </View>
              </View>
            ))}
            <View style={styles.tallowNote}>
              <Text style={styles.tallowNoteTitle}>🌿 Tallow Note</Text>
              <Text style={styles.tallowNoteText}>{BODY_ACNE_DATA.tallowNote}</Text>
            </View>
          </View>
        )}

        {activeTab === 3 && (
          <View>
            <View style={styles.whatBlock}>
              <Text style={styles.whatLabel}>Stretch Marks</Text>
              <Text style={styles.whatText}>{STRETCH_MARKS.what}</Text>
            </View>
            <View style={[styles.infoBlock, { borderColor: Colors.gold + '44' }]}>
              <Text style={[styles.infoBlockTitle, { color: Colors.gold }]}>Prevention Window</Text>
              <Text style={styles.infoBlockText}>{STRETCH_MARKS.prevention}</Text>
            </View>
            <Text style={styles.sectionHeader}>Treatments</Text>
            {STRETCH_MARKS.treatments.map((t, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedSM(expandedSM === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{t.treatment}</Text>
                    <Text style={styles.evidenceText}>Evidence: {t.evidence}</Text>
                  </View>
                  <Text style={styles.expandIcon}>{expandedSM === i ? '▲' : '▼'}</Text>
                </View>
                {expandedSM === i && <Text style={styles.cardDetail}>{t.detail}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 4 && (
          <View>
            <View style={styles.whatBlock}>
              <Text style={styles.whatLabel}>Ingrown Hairs</Text>
              <Text style={styles.whatText}>{INGROWN_HAIRS.what}</Text>
            </View>
            <Text style={styles.sectionHeader}>Causes</Text>
            {INGROWN_HAIRS.causes.map((c, i) => (
              <Text key={i} style={styles.bulletItem}>• {c}</Text>
            ))}
            <Text style={[styles.sectionHeader, { marginTop: 14 }]}>Prevention</Text>
            {INGROWN_HAIRS.prevention.map((p, i) => (
              <Text key={i} style={[styles.bulletItem, { color: Colors.green }]}>✓ {p}</Text>
            ))}
            <View style={[styles.infoBlock, { borderColor: Colors.teal + '44', marginTop: 14 }]}>
              <Text style={[styles.infoBlockTitle, { color: Colors.teal }]}>Treatment</Text>
              <Text style={styles.infoBlockText}>{INGROWN_HAIRS.treatment}</Text>
            </View>
            <View style={styles.tallowNote}>
              <Text style={styles.tallowNoteTitle}>🌿 Tallow as Shaving Oil</Text>
              <Text style={styles.tallowNoteText}>{INGROWN_HAIRS.tallowNote}</Text>
            </View>
          </View>
        )}

        {activeTab === 5 && (
          <View>
            <Text style={styles.sectionNote}>Each body zone has unique skin characteristics. Targeted treatment is more effective than applying one product to everything.</Text>
            {DRY_BODY.map((d, i) => (
              <View key={i} style={styles.bodyZoneCard}>
                <View style={styles.bodyZoneHeader}>
                  <Text style={styles.bodyZoneIcon}>{d.icon}</Text>
                  <Text style={styles.bodyZoneArea}>{d.area}</Text>
                </View>
                <Text style={styles.bodyZoneNotes}>{d.notes}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  cardDetail: { color: c.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8 },
  expandIcon: { color: c.textMuted, fontSize: 12, marginTop: 4 },
  whatBlock: { backgroundColor: c.cardAlt, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.border, marginBottom: 14 },
  whatLabel: { color: c.gold, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  whatText: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  sectionHeader: { color: c.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  bulletItem: { color: c.textSecondary, fontSize: 13, lineHeight: 22, marginBottom: 2 },
  stepCard: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  stepNum: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  stepTitle: { color: c.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  stepDetail: { color: c.textSecondary, fontSize: 12, lineHeight: 18 },
  tallowNote: { backgroundColor: c.primary + '11', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: c.primary + '44', marginTop: 12 },
  tallowNoteTitle: { color: c.primary, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  tallowNoteText: { color: c.textSecondary, fontSize: 12, lineHeight: 18 },
  infoBlock: { borderRadius: 10, padding: 12, borderWidth: 1, backgroundColor: c.cardAlt, marginBottom: 14 },
  infoBlockTitle: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  infoBlockText: { color: c.textSecondary, fontSize: 13, lineHeight: 19 },
  evidenceText: { color: c.textMuted, fontSize: 11 },
  bodyZoneCard: { backgroundColor: c.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.border, marginBottom: 10 },
  bodyZoneHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  bodyZoneIcon: { fontSize: 20 },
  bodyZoneArea: { color: c.gold, fontSize: 15, fontWeight: '700' },
  bodyZoneNotes: { color: c.textSecondary, fontSize: 13, lineHeight: 19 },
  });
}
