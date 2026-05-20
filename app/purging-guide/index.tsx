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
    green: c.scoreGood, red: c.scorePoor, blue: c.hydration, yellow: c.scoreFair,
  };
}

const PURGING_SIGNS = [
  'Appears within first 2–6 weeks of starting a new active (retinol, BHA, AHA)',
  'Breakouts occur in your USUAL acne locations (not new areas)',
  'Increased frequency of your USUAL type of blemish (not new types)',
  'Blemishes come up faster and heal faster than normal',
  'Improves progressively — each cycle gets less intense',
  'Resolves within 4–8 weeks if you continue',
];

const BREAKOUT_SIGNS = [
  'Appears more than 6 weeks after starting a product',
  'Breakouts in NEW areas where you don\'t normally break out',
  'New type of blemish you don\'t normally get',
  'Progressively getting WORSE, not better',
  'Accompanied by redness, itching, or irritation beyond the acne itself',
  'Occurred after starting a non-active product (moisturizer, cleanser, SPF)',
];

const PURGING_SCIENCE = `When you introduce a cell-turnover accelerant (retinol, AHAs, BHAs), it speeds up the skin's natural exfoliation cycle from ~28 days to potentially 14–21 days. This acceleration brings pre-existing microcomedones (microscopic clogged follicles not yet visible on the surface) to the surface faster than they would normally appear.

Think of it like a conveyor belt suddenly moving faster: all the congestion that was slowly making its way to the surface now arrives within a compressed timeframe — making it look like you're breaking out badly, when in reality you're clearing out congestion that was already there.

Purging is temporary, predictable, and ultimately beneficial. A genuine breakout reaction is your skin rejecting something incompatible.`;

const PURGING_PRODUCTS = [
  'Retinol and all retinoids (including tretinoin)',
  'AHAs: glycolic acid, lactic acid, mandelic acid',
  'BHA: salicylic acid',
  'Chemical peels',
  'Vitamin C (in some people with congested pores)',
  'Azelaic acid (occasionally)',
];

const NO_PURGE_PRODUCTS = [
  'Physical SPF (mineral sunscreen)',
  'Moisturizers and occlusives (balms, ceramide creams)',
  'Cleansers',
  'Niacinamide',
  'Hyaluronic acid',
  'Peptides',
  'Non-active serums',
  'New makeup or primers',
];

const SURVIVE_TIPS = [
  {
    tip: 'Don\'t stop — this is the most important rule',
    detail: 'Most people quit during purging, which is the worst time to stop. If you stop now, the accelerated turnover stops before the skin clears. When you restart, you\'ll experience the same purge again. Push through if there is no sign of genuine irritation.',
  },
  {
    tip: 'Reduce frequency, not elimination',
    detail: 'If purging is severe: drop from nightly to every other night. Don\'t stop completely. Maintain the cell turnover stimulus at a gentler level. This extends the purge period slightly but makes it more tolerable.',
  },
  {
    tip: 'Double down on barrier repair',
    detail: 'Heavy occlusive application on non-active nights. Ceramide moisturizers. Minimum other actives during purge period. The barrier is under stress — support it aggressively.',
  },
  {
    tip: 'Don\'t introduce other new products',
    detail: 'During purging, you cannot distinguish a purge from a reaction if you introduce multiple new products simultaneously. Introduce one product at a time, always.',
  },
  {
    tip: 'Hydrocolloid patches on blemishes',
    detail: 'Protect active purging blemishes, reduce inflammation, and prevent you from touching/picking them. Change in the morning.',
  },
  {
    tip: 'SPF without fail',
    detail: 'Active purging + increased cell turnover + fresh skin = extreme photosensitivity. SPF every morning, no exceptions. Every UV exposure during this window causes lasting damage.',
  },
  {
    tip: 'Track: photograph and journal',
    detail: 'Take a selfie in identical lighting weekly. Progress in purging often isn\'t visible day-to-day but is very clear week-to-week. Without documentation, it\'s easy to feel like "it\'s just getting worse" when it\'s actually clearing.',
  },
];

const WHEN_TO_STOP = [
  'Redness and burning that lasts more than 2 hours after product application',
  'Blistering, severe peeling, or raw skin',
  'Breakouts spreading beyond your normal acne zones to previously clear areas',
  'Itching or stinging that worsens with each application',
  'New type of blemish you have never had before',
  'Skin progressively deteriorating after 8 weeks with no improvement trend',
];

export default function PurgingGuideScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [view, setView] = useState<'identify' | 'science' | 'survive'>('identify');
  const [showStop, setShowStop] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Purging vs Breakout</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.heroBanner}>
        <Text style={styles.heroTitle}>Is it purging or a reaction?</Text>
        <Text style={styles.heroSub}>The most common reason people quit products that are actually working</Text>
      </View>

      <View style={styles.tabBar}>
        {(['identify', 'science', 'survive'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tabBtn, view === t && styles.tabBtnActive]} onPress={() => setView(t)}>
            <Text style={[styles.tabLabel, view === t && styles.tabLabelActive]}>
              {t === 'identify' ? '🔍 Identify' : t === 'science' ? '🔬 Science' : '💪 Survive It'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {view === 'identify' && (
          <>
            <View style={styles.comparisonCard}>
              <View style={[styles.compColumn, { borderRightWidth: 1, borderRightColor: Colors.border }]}>
                <View style={[styles.compHeader, { backgroundColor: Colors.green + '22' }]}>
                  <Text style={[styles.compHeaderText, { color: Colors.green }]}>✓ PURGING</Text>
                  <Text style={styles.compHeaderSub}>Expected. Push through.</Text>
                </View>
                {PURGING_SIGNS.map((s, i) => (
                  <View key={i} style={styles.compRow}>
                    <Text style={[styles.compBullet, { color: Colors.green }]}>✓</Text>
                    <Text style={styles.compText}>{s}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.compColumn}>
                <View style={[styles.compHeader, { backgroundColor: Colors.red + '22' }]}>
                  <Text style={[styles.compHeaderText, { color: Colors.red }]}>✕ REACTION</Text>
                  <Text style={styles.compHeaderSub}>Stop the product.</Text>
                </View>
                {BREAKOUT_SIGNS.map((s, i) => (
                  <View key={i} style={styles.compRow}>
                    <Text style={[styles.compBullet, { color: Colors.red }]}>✕</Text>
                    <Text style={styles.compText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.sectionLabel}>Products That CAN Cause Purging</Text>
            <View style={styles.listCard}>
              {PURGING_PRODUCTS.map((p, i) => (
                <View key={i} style={styles.listRow}>
                  <Text style={styles.listBulletGreen}>✓</Text>
                  <Text style={styles.listText}>{p}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 10 }]}>Products That CANNOT Cause Purging</Text>
            <Text style={styles.noLurgeNote}>If you broke out after starting any of these, it's a reaction — not purging.</Text>
            <View style={styles.listCard}>
              {NO_PURGE_PRODUCTS.map((p, i) => (
                <View key={i} style={styles.listRow}>
                  <Text style={styles.listBulletRed}>✕</Text>
                  <Text style={styles.listText}>{p}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {view === 'science' && (
          <>
            <View style={styles.scienceCard}>
              <Text style={styles.scienceTitle}>Why Purging Happens</Text>
              <Text style={styles.scienceText}>{PURGING_SCIENCE}</Text>
            </View>

            <View style={styles.timelineCard}>
              <Text style={styles.timelineTitle}>Purging Timeline</Text>
              {[
                { period: 'Week 1–2', label: 'Early purge', color: Colors.red, detail: 'Microcomedones rush to surface. Worst week for most people. Do not quit.' },
                { period: 'Week 3–4', label: 'Peak purge', color: Colors.yellow, detail: 'Typically most visible. Blemishes forming faster than before. Completely normal.' },
                { period: 'Week 5–6', label: 'Clearing phase', color: Colors.gold, detail: 'New blemishes begin reducing. Old ones resolve faster. Progress becoming visible.' },
                { period: 'Week 7–8', label: 'Resolved', color: Colors.green, detail: 'Purging complete. Skin stabilizing. Cell turnover normalized at new rate.' },
              ].map((phase, i) => (
                <View key={i} style={styles.timelineRow}>
                  <View style={[styles.timelineDot, { backgroundColor: phase.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.timelinePeriod, { color: phase.color }]}>{phase.period} — {phase.label}</Text>
                    <Text style={styles.timelineDetail}>{phase.detail}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.barrierNote}>
              <Text style={styles.barrierNoteTitle}>🌿 Occlusives During Purging</Text>
              <Text style={styles.barrierNoteText}>
                A vitamin-A-containing occlusive can cause an initial purge in congested skin — the barrier repair and mild vitamin A activity accelerates microcomedone clearing in the same way as retinol.
                {'\n\n'}
                This is expected and normal. Keep using it. Apply after any BHA treatment (not before). The purge typically resolves in 2–4 weeks, after which skin noticeably improves.
                {'\n\n'}
                Signs it's NOT occlusive purging: redness, burning, spreading to new areas. These indicate sensitivity, not purging.
              </Text>
            </View>
          </>
        )}

        {view === 'survive' && (
          <>
            {SURVIVE_TIPS.map((item, i) => (
              <View key={i} style={styles.tipCard}>
                <View style={styles.tipNum}>
                  <Text style={styles.tipNumText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tipTitle}>{item.tip}</Text>
                  <Text style={styles.tipDetail}>{item.detail}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.stopToggle} onPress={() => setShowStop(!showStop)}>
              <Text style={styles.stopToggleText}>{showStop ? '▲' : '▼'} When to actually stop (warning signs)</Text>
            </TouchableOpacity>

            {showStop && (
              <View style={styles.stopCard}>
                <Text style={styles.stopTitle}>🛑 Stop the Product If:</Text>
                {WHEN_TO_STOP.map((sign, i) => (
                  <View key={i} style={styles.listRow}>
                    <Text style={styles.listBulletRed}>✕</Text>
                    <Text style={styles.listText}>{sign}</Text>
                  </View>
                ))}
                <Text style={styles.stopNote}>
                  If you stop: wait 2 weeks for skin to calm, then consider a gentler version of the same active at lower concentration, or use the sandwich method (an occlusive before and after) to buffer.
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  heroBanner: {
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  heroTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 4 },
  heroSub: { color: Colors.textSecondary, fontSize: 13 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: Colors.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  comparisonCard: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 16 },
  compColumn: { flex: 1 },
  compHeader: { padding: 10 },
  compHeaderText: { fontSize: 12, fontWeight: '800', marginBottom: 2 },
  compHeaderSub: { color: Colors.textMuted, fontSize: 10 },
  compRow: { flexDirection: 'row', gap: 6, padding: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  compBullet: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  compText: { flex: 1, color: Colors.textSecondary, fontSize: 10, lineHeight: 16 },
  sectionLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  noLurgeNote: { color: Colors.red, fontSize: 12, marginBottom: 8 },
  listCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  listRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  listBulletGreen: { color: Colors.green, fontSize: 13, fontWeight: '700' },
  listBulletRed: { color: Colors.red, fontSize: 13, fontWeight: '700' },
  listText: { flex: 1, color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  scienceCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 14 },
  scienceTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 8 },
  scienceText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 21 },
  timelineCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 14 },
  timelineTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  timelineRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timelinePeriod: { fontSize: 12, fontWeight: '700', marginBottom: 3 },
  timelineDetail: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  barrierNote: { backgroundColor: Colors.primary + '15', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.primary + '44' },
  barrierNoteTitle: { color: Colors.primary, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  barrierNoteText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 21 },
  tipCard: { flexDirection: 'row', gap: 12, backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  tipNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary + '22', alignItems: 'center', justifyContent: 'center' },
  tipNumText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  tipTitle: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  tipDetail: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  stopToggle: { alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 8 },
  stopToggleText: { color: Colors.red, fontSize: 13, fontWeight: '600' },
  stopCard: { backgroundColor: Colors.red + '15', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.red + '44' },
  stopTitle: { color: Colors.red, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  stopNote: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19, marginTop: 10, fontStyle: 'italic' },
  });
}
