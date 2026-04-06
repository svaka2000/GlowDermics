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
  pink: '#F472B6',
  rose: '#FDA4AF',
};

const TABS = [
  { id: 'types', label: 'Types & Signs', icon: '🔍' },
  { id: 'triggers', label: 'Triggers', icon: '⚠️' },
  { id: 'ingredients', label: 'Ingredients', icon: '🧪' },
  { id: 'routine', label: 'Routine', icon: '📋' },
  { id: 'tallow', label: 'Tallow Approach', icon: '🌿' },
];

const SUBTYPES = [
  {
    type: 'ETR (Erythematotelangiectatic)',
    number: '1',
    color: Colors.rose,
    signs: ['Persistent central facial redness', 'Visible broken capillaries (telangiectasia)', 'Easy flushing and blushing', 'Burning or stinging sensation', 'Skin that stays red after triggers'],
    notes: 'Most common subtype. The redness is vascular — dilated capillaries, not inflammation per se. Focus: anti-redness routine, vascular strengthening.',
  },
  {
    type: 'Papulopustular',
    number: '2',
    color: '#FB923C',
    signs: ['Central redness plus bumps (papules) and pustules', 'Often mistaken for acne', 'No comedones (blackheads/whiteheads)', 'Sensitive and reactive skin'],
    notes: 'Rosacea pustules are different from acne. They respond to anti-inflammatory treatment, not antibacterial. Benzoyl peroxide often makes it worse.',
  },
  {
    type: 'Phymatous',
    number: '3',
    color: Colors.gold,
    signs: ['Skin thickening, especially on nose (rhinophyma)', 'Enlarged pores', 'Irregular skin texture', 'More common in men'],
    notes: 'Rare. Requires dermatologist intervention (laser, surgical). Skincare alone won\'t address structural changes. Maintain barrier to slow progression.',
  },
  {
    type: 'Ocular',
    number: '4',
    color: Colors.blue,
    signs: ['Red, irritated eyes', 'Frequent styes', 'Sensation of grit in the eyes', 'Light sensitivity', 'Watery or dry eyes'],
    notes: 'Often coexists with other subtypes. Requires ophthalmologist involvement. Lid hygiene and omega-3 supplementation are the main lifestyle interventions.',
  },
];

const TRIGGERS = [
  { trigger: 'Heat and hot drinks', icon: '🔥', detail: 'Heat dilates blood vessels. Hot showers, saunas, hot drinks, exercise-induced flushing — all cause vasodilation that worsens ETR rosacea. Switch to lukewarm water, room temperature drinks.' },
  { trigger: 'Alcohol (especially red wine)', icon: '🍷', detail: 'Alcohol causes vasodilation and histamine release. Red wine contains tannins, which are particularly triggering. All alcohol worsens rosacea; red wine is the most problematic.' },
  { trigger: 'Spicy food', icon: '🌶️', detail: 'Capsaicin binds to TRPV1 receptors in the face, causing vasodilation. Spicy food triggers flushing within minutes of consumption in most rosacea patients.' },
  { trigger: 'Sun exposure', icon: '☀️', detail: 'UV triggers immune response and inflammatory pathways in rosacea-prone skin. Mineral SPF (zinc oxide) is anti-inflammatory and the most critical daily rosacea management tool.' },
  { trigger: 'Emotional stress', icon: '😰', detail: 'Cortisol and adrenaline trigger vasoconstriction then rebound vasodilation. Stress management has measurable impact on rosacea flare frequency and severity.' },
  { trigger: 'Harsh skincare products', icon: '🧴', detail: 'Alcohol-based toners, physical scrubs, AHAs and BHAs (in most rosacea cases), fragrance, and preservatives like phenoxyethanol trigger barrier disruption and flares.' },
  { trigger: 'Demodex mites (overgrowth)', icon: '🔬', detail: 'Everyone has Demodex mites on their skin; rosacea patients often have 4× more. Overgrowth drives inflammation. Azelaic acid and ivermectin are effective; tallow does not feed Demodex (it prefers human sebum).' },
  { trigger: 'Extreme cold', icon: '❄️', detail: 'Cold wind causes vasomotor response — vessels constrict then dilate, causing redness. Barrier protection (tallow, occlusives) in cold weather reduces this response significantly.' },
  { trigger: 'Certain skincare actives', icon: '⚗️', detail: 'Retinol, AHAs, high-concentration Vitamin C, and most exfoliants trigger rosacea flares. Introduction must be extremely slow, if at all.' },
];

const INGREDIENTS = {
  safe: [
    { name: 'Azelaic Acid', note: 'Anti-inflammatory, anti-Demodex, anti-redness. One of the most evidence-backed rosacea ingredients. 10–15% concentration. Slow introduction.' },
    { name: 'Niacinamide (5%)', note: 'Anti-inflammatory, barrier-supporting, reduces redness. Very well-tolerated. Start at 2% if very sensitive.' },
    { name: 'Centella Asiatica (CICA)', note: 'Anti-inflammatory, wound-healing, barrier repair. A staple in rosacea routines. Look for "tiger grass" or CICA in Asian skincare.' },
    { name: 'Zinc Oxide (mineral SPF)', note: 'Anti-inflammatory UV filter. The ideal SPF for rosacea. No chemical irritants, reduces redness on application.' },
    { name: 'Ceramides', note: 'Repair the impaired skin barrier common in rosacea. Ceramides 1, 3, and 6-II are most effective.' },
    { name: 'Green tea extract (EGCG)', note: 'Anti-inflammatory antioxidant. Reduces erythema and vascular response. Effective in both topical and dietary form.' },
    { name: 'Allantoin', note: 'Soothing, barrier-supporting, calming. Excellent in cleansers and moisturizers for rosacea.' },
    { name: 'Hyaluronic Acid (low molecular weight)', note: 'Hydration without irritation. Low molecular weight penetrates; high molecular weight sits on surface. Both are generally safe.' },
  ],
  avoid: [
    { name: 'Alcohol-based products', note: 'Dehydrates and irritates. Immediate vasodilation trigger.' },
    { name: 'Fragrance (synthetic or natural)', note: 'Fragrance is the #1 contact dermatitis trigger and consistently worsens rosacea.' },
    { name: 'Physical scrubs and exfoliants', note: 'Mechanical friction triggers flushing and worsens vascular sensitivity. Avoid completely.' },
    { name: 'High-concentration Vitamin C (>10%)', note: 'Acidic pH destabilizes the rosacea barrier. If using Vitamin C, choose ascorbyl glucoside (gentler derivative) at low concentration.' },
    { name: 'Most chemical exfoliants (AHA/BHA)', note: 'Glycolic, lactic, salicylic acid — all trigger rosacea in most people. Azelaic acid is the one acid-class ingredient that is rosacea-safe.' },
    { name: 'Peppermint, menthol, eucalyptus', note: 'Cooling sensation is actually vasodilating. Triggers flushing despite the cooling feeling.' },
    { name: 'Cinnamon and clove extracts', note: 'Warming ingredients — trigger vasodilation and inflammation immediately on rosacea skin.' },
    { name: 'High-irritant preservatives (phenoxyethanol)', note: 'Common sensitizer. Avoid in leave-on products. Rinse-off products are less concerning.' },
  ],
};

const ROUTINE = {
  am: [
    { step: 'Cool water rinse (lukewarm, not hot)', note: 'No cleanser AM unless night was sweaty. Cleansers may be too stripping for daily AM use on rosacea skin.' },
    { step: 'Azelaic acid or niacinamide serum', note: 'Apply to redness-prone areas. Let absorb 60 seconds.' },
    { step: 'Centella or ceramide moisturizer', note: 'Anti-inflammatory moisturizer. Barrier first.' },
    { step: 'Tallow balm (thin layer over moisturizer)', note: 'Optional but beneficial — see Tallow tab for rationale.' },
    { step: 'Mineral SPF (zinc oxide)', note: 'Non-negotiable. Apply generously. Reapply if outdoors.' },
  ],
  pm: [
    { step: 'Gentle oil cleanse (30 seconds only)', note: 'Remove SPF and debris without rubbing. A light jojoba or tallow oil cleanse is very well-tolerated.' },
    { step: 'Centella or gentle cleanser rinse', note: 'pH-balanced, fragrance-free, minimal ingredients. Rinse with cool water only.' },
    { step: 'Azelaic acid (if not used AM) or nothing', note: 'Azelaic acid can be used once or twice daily. On reactive nights, skip and use only moisturizer.' },
    { step: 'Tallow balm — generous application', note: 'PM is when tallow shines for rosacea. Full barrier repair overnight. See Tallow tab.' },
    { step: 'No retinol, no AHA, no exfoliants', note: 'These belong in non-rosacea routines. If you must use retinol, use bakuchiol or encapsulated retinol at very low frequency (once per week maximum).' },
  ],
};

export default function RosaceaGuideScreen() {
  const [activeTab, setActiveTab] = useState('types');
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [expandedTrigger, setExpandedTrigger] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rosacea Guide</Text>
        <View style={{ width: 60 }} />
      </View>

      <LinearGradient colors={['#F472B622', '#0A0A0F']} style={styles.hero}>
        <Text style={styles.heroEmoji}>🌹</Text>
        <Text style={styles.heroTitle}>Managing Rosacea</Text>
        <Text style={styles.heroSub}>Understanding triggers, what to use, and what to avoid</Text>
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

        {activeTab === 'types' && (
          <>
            <Text style={styles.sectionNote}>
              Rosacea has 4 subtypes. Many people have multiple. Identifying your primary subtype helps target the right interventions.
            </Text>
            {SUBTYPES.map((st, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.typeCard, { borderLeftColor: st.color, borderLeftWidth: 4 }]}
                onPress={() => setExpandedType(expandedType === st.type ? null : st.type)}
                activeOpacity={0.85}
              >
                <View style={styles.typeHeader}>
                  <View style={[styles.typeNumBadge, { backgroundColor: st.color + '33' }]}>
                    <Text style={[styles.typeNum, { color: st.color }]}>Type {st.number}</Text>
                  </View>
                  <Text style={styles.typeName}>{st.type}</Text>
                  <Text style={styles.expandIcon}>{expandedType === st.type ? '▲' : '▼'}</Text>
                </View>
                {expandedType === st.type && (
                  <View style={styles.typeExpanded}>
                    <Text style={styles.signsLabel}>Signs</Text>
                    {st.signs.map((s, j) => (
                      <Text key={j} style={styles.signItem}>• {s}</Text>
                    ))}
                    <Text style={styles.typeNotes}>{st.notes}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === 'triggers' && TRIGGERS.map((item, i) => (
          <TouchableOpacity key={i} style={styles.triggerCard} onPress={() => setExpandedTrigger(expandedTrigger === i ? null : i)} activeOpacity={0.8}>
            <View style={styles.triggerHeader}>
              <Text style={styles.triggerIcon}>{item.icon}</Text>
              <Text style={styles.triggerName}>{item.trigger}</Text>
              <Text style={styles.expandIcon}>{expandedTrigger === i ? '▲' : '▼'}</Text>
            </View>
            {expandedTrigger === i && <Text style={styles.triggerDetail}>{item.detail}</Text>}
          </TouchableOpacity>
        ))}

        {activeTab === 'ingredients' && (
          <>
            <View style={styles.ingredientSection}>
              <Text style={styles.ingredientSectionTitle}>✅ Generally Safe for Rosacea</Text>
              {INGREDIENTS.safe.map((item, i) => (
                <View key={i} style={styles.ingredientCard}>
                  <Text style={styles.ingredientName}>{item.name}</Text>
                  <Text style={styles.ingredientNote}>{item.note}</Text>
                </View>
              ))}
            </View>
            <View style={styles.ingredientSection}>
              <Text style={[styles.ingredientSectionTitle, { color: Colors.red }]}>🚫 Avoid with Rosacea</Text>
              {INGREDIENTS.avoid.map((item, i) => (
                <View key={i} style={[styles.ingredientCard, { borderColor: Colors.red + '33' }]}>
                  <Text style={styles.ingredientName}>{item.name}</Text>
                  <Text style={styles.ingredientNote}>{item.note}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'routine' && (
          <>
            <Text style={styles.routineNote}>
              Rosacea routines must be minimal, gentle, and consistent. Less is genuinely more. Every product added is a potential trigger.
            </Text>
            <Text style={styles.routineSection}>🌅 Morning</Text>
            {ROUTINE.am.map((step, i) => (
              <View key={i} style={styles.routineStep}>
                <View style={styles.routineNum}>
                  <Text style={styles.routineNumText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routineStepName}>{step.step}</Text>
                  <Text style={styles.routineStepNote}>{step.note}</Text>
                </View>
              </View>
            ))}
            <Text style={[styles.routineSection, { marginTop: 20 }]}>🌙 Evening</Text>
            {ROUTINE.pm.map((step, i) => (
              <View key={i} style={styles.routineStep}>
                <View style={styles.routineNum}>
                  <Text style={styles.routineNumText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routineStepName}>{step.step}</Text>
                  <Text style={styles.routineStepNote}>{step.note}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === 'tallow' && (
          <>
            {[
              {
                title: 'Why tallow is well-suited for rosacea',
                detail: "Grass-fed tallow contains no fragrance, no synthetic preservatives, no alcohol — the three most common rosacea triggers in skincare. Its biocompatible fatty acid profile means it doesn't trigger the immune response that foreign synthetic compounds do.",
              },
              {
                title: 'Palmitoleic acid: anti-inflammatory',
                detail: 'Tallow contains palmitoleic acid (5-8%), an omega-7 fatty acid with significant anti-inflammatory and antimicrobial properties. Applied to the skin, it actively reduces redness and supports the compromised barrier of rosacea skin.',
              },
              {
                title: 'Zinc amplification with mineral SPF',
                detail: 'For rosacea: apply tallow PM and use zinc oxide SPF AM. Tallow + zinc is an anti-inflammatory stack. Zinc oxide itself has mild anti-redness effects that stack with tallow\'s barrier repair.',
              },
              {
                title: 'How to introduce for rosacea skin',
                detail: 'Start with a small amount on the least reactive area (outer cheek) every other night. Observe for 1 week. If no flare: extend to full face. If purging-like response occurs, reduce frequency further and persist — rosacea skin often needs 4–6 weeks to adapt to new actives, even gentle ones.',
              },
              {
                title: 'Demodex consideration',
                detail: 'Demodex mites, which are elevated in rosacea, feed on human sebum. Tallow, being derived from animal fat, is not their preferred substrate. However, extremely heavy application on congested skin should be monitored. Most rosacea users find tallow in normal amounts does not worsen Demodex-related symptoms.',
              },
              {
                title: 'Combined approach',
                detail: 'Best results for rosacea: azelaic acid or niacinamide as the active treatment, tallow as the barrier support and occlusive. These are complementary mechanisms. Azelaic acid targets Demodex and inflammation; tallow repairs the barrier so actives can work without triggering further sensitivity.',
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

const orange = '#FB923C';

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
  tabChipActive: { borderColor: Colors.rose, backgroundColor: Colors.rose + '22' },
  tabIcon: { fontSize: 13 },
  tabLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: Colors.rose },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionNote: {
    color: Colors.textSecondary, fontSize: 13, lineHeight: 20,
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 14,
  },
  typeCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  typeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeNumBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeNum: { fontSize: 11, fontWeight: '700' },
  typeName: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  expandIcon: { color: Colors.textMuted, fontSize: 12 },
  typeExpanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  signsLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  signItem: { color: Colors.textSecondary, fontSize: 13, lineHeight: 22 },
  typeNotes: {
    color: Colors.textMuted, fontSize: 12, lineHeight: 19,
    marginTop: 10, fontStyle: 'italic',
  },
  triggerCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  triggerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  triggerIcon: { fontSize: 18 },
  triggerName: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  triggerDetail: {
    color: Colors.textSecondary, fontSize: 13, lineHeight: 20,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  ingredientSection: { marginBottom: 16 },
  ingredientSectionTitle: { color: Colors.green, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  ingredientCard: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  ingredientName: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  ingredientNote: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  routineNote: {
    color: Colors.textSecondary, fontSize: 13, lineHeight: 20,
    backgroundColor: Colors.rose + '15', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.rose + '44', marginBottom: 14,
  },
  routineSection: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  routineStep: {
    flexDirection: 'row', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  routineNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.rose + '33', alignItems: 'center', justifyContent: 'center',
  },
  routineNumText: { color: Colors.rose, fontSize: 13, fontWeight: '700' },
  routineStepName: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  routineStepNote: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  tallowCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  tallowCardTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowCardDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
