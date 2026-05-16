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

const TABS = ['Science', 'Stages', 'PM Timing', 'Optimise', 'Tallow PM'];

const SLEEP_FACTS = [
  { fact: 'Skin repairs at 3× the rate during sleep', detail: 'Growth hormone (GH) is almost exclusively secreted during slow-wave sleep (SWS). GH triggers collagen synthesis, cell division, and tissue repair. The cellular repair rate during sleep is measurably 3× the waking rate.', icon: '🔬' },
  { fact: 'TEWL (water loss) is 25% higher during sleep', detail: 'The skin barrier relaxes at night — this is intentional, allowing CO2 and waste products to exit. But it also means water exits faster. This is why PM skincare with an occlusive is so effective: it catches the barrier in its most permeable state.', icon: '💧' },
  { fact: 'Cortisol hits its lowest at midnight', detail: 'Cortisol follows a circadian pattern: lowest at midnight–2am, highest at 8–9am. Low cortisol = reduced inflammation, lower sebum production, reduced collagen breakdown. Disrupting this rhythm (late nights, stress) maintains elevated cortisol and accelerates aging.', icon: '📉' },
  { fact: 'Blood flow to skin increases 3–4× during sleep', detail: 'Peripheral vasodilation during sleep dramatically increases nutrient and oxygen delivery to skin cells. This is why skin looks fuller and more radiant after a good night\'s sleep — it literally received more building materials.', icon: '❤️' },
  { fact: 'Skin temperature peaks between 11pm–2am', detail: 'Higher skin temperature = higher product absorption (blood vessels dilated, pores more open). This is when topicals penetrate deepest. The PM routine window between 9pm–midnight maximises ingredient penetration.', icon: '🌡️' },
  { fact: 'Melatonin is a potent antioxidant', detail: 'Melatonin produced during darkness is one of the most potent antioxidants known. It directly neutralises free radicals in the skin and upregulates antioxidant enzyme systems. Blue light exposure suppresses this, leaving skin without its nightly antioxidant defence.', icon: '🌙' },
  { fact: 'Less than 6 hours = measurably impaired barrier function', detail: 'Sleep deprivation studies show that 5–6 hours for 5 days significantly impairs TEWL regulation, increases inflammatory markers in skin, and measurably slows wound healing. The skin "keeps score" even without subjective sleepiness.', icon: '⏰' },
  { fact: 'Collagen synthesis peaks in deep sleep', detail: 'Pro-collagen mRNA expression peaks during slow-wave sleep. Collagen fibres require 6–8 hours of continuous synthesis time. Fragmented sleep interrupts the collagen synthesis window even if total hours are maintained.', icon: '🧬' },
];

function buildSleepStages(Colors: ShimColors) {
  return [
  { stage: 'NREM Stage 1 (N1)', duration: '5–10 min', action: 'Sleep onset', skin: 'Transition phase — minimal skin activity. Heart rate and skin temperature beginning to drop.', icon: '😪', color: Colors.blue },
  { stage: 'NREM Stage 2 (N2)', duration: '20–30 min', action: 'Light sleep', skin: 'Temperature regulation begins. Skin vasodilation increases blood flow. Sleep spindles (memory consolidation) also reduce cortisol-related inflammation.', icon: '😴', color: Colors.purple },
  { stage: 'NREM Stage 3 — Deep Sleep (SWS)', duration: '20–40 min', action: 'Growth hormone surge', skin: 'Primary skin repair window. GH secretion peaks, driving collagen synthesis and cell regeneration. Hardest to interrupt. Alcohol, late meals, and blue light reduce SWS time.', icon: '🔋', color: Colors.teal },
  { stage: 'REM Sleep', duration: '10–25 min (increases through night)', action: 'Emotional processing', skin: 'Skin temperature actively fluctuates. Cortisol begins rising in late REM cycles, triggering wake-up. Lower cortisol environment during first REM cycles is ideal for anti-inflammatory skin processes.', icon: '🌀', color: Colors.gold },
  { stage: 'Full Cycle (90 min)', duration: 'Repeats 4–6×', action: 'N1→N2→SWS→REM', skin: 'First 3 cycles (hours 1–4.5) are SWS-heavy = peak repair. Later cycles (hours 4.5–8) are REM-heavy = less skin repair, more emotional regulation. Both matter.', icon: '🔄', color: Colors.primary },
  ];
}

const PM_TIMING = [
  { window: '8:00–9:00 PM', phase: 'Wind-down', action: 'Blue light off, dim lights', skinRelevance: 'Melatonin production begins when light dims. Screen use during this window suppresses melatonin by up to 2 hours, robbing skin of its antioxidant protection.', priority: 'high' },
  { window: '9:00–10:00 PM', phase: 'PM Skincare Window', action: 'Apply full PM routine', skinRelevance: 'Optimal window: skin temperature rising (best absorption), TEWL beginning to increase (occlusive locks it in), cortisol still dropping. Retinol and actives applied here have maximum dwell time before sleep.', priority: 'critical' },
  { window: '10:00–11:00 PM', phase: 'Sleep onset target', action: 'Asleep by 10:30–11PM', skinRelevance: 'Circadian skin repair peaks between 11pm–1am. Being asleep before 11pm captures the early deep-sleep SWS cycles when GH secretion is highest.', priority: 'critical' },
  { window: '11PM–2AM', phase: 'Deep repair window', action: 'Uninterrupted sleep', skinRelevance: 'Growth hormone peaks, collagen synthesis at maximum, cortisol at minimum. This is the irreplaceable skin repair window. Phone notifications, inconsistent schedule, or alcohol all fragment this.', priority: 'critical' },
  { window: '2AM–6AM', phase: 'REM-heavy phase', action: 'Continue uninterrupted sleep', skinRelevance: 'Later cycles contain more REM. Less skin repair here but cortisol begins rising toward morning. Waking during this window and going back to sleep disrupts the hormonal transition.', priority: 'moderate' },
  { window: '7:00–9:00 AM', phase: 'Morning cortisol peak', action: 'Wake naturally near 7–8am', skinRelevance: 'Cortisol peaks at 8–9am (Cortisol Awakening Response). This is normal and healthy — it powers AM anti-inflammatory skin function. Waking with an alarm to this window is fine.', priority: 'moderate' },
];

const OPTIMISATIONS = [
  { tip: 'Temperature: 17–19°C room', detail: 'Core body temperature must drop 1–2°C to initiate sleep. A cool room accelerates this. Skin temperature inversely rises during this drop, improving blood flow and product penetration overnight.', impact: 'high' },
  { tip: 'Silk or satin pillowcase', detail: 'Cotton creates friction that drags at skin and deposits sebum, bacteria, and skincare products. Silk reduces friction (anti-wrinkle, anti-breakout), allows skincare to stay on skin rather than being absorbed by the pillow, and regulates temperature better.', impact: 'medium' },
  { tip: 'Elevate head 10–20°', detail: 'Reduces morning puffiness (facial lymphatic drainage improves). Also reduces overnight acid reflux that can impair sleep quality.', impact: 'medium' },
  { tip: 'Humidifier (40–60% humidity)', detail: 'Low humidity dramatically increases TEWL. A humidifier in dry climates or during winter reduces overnight water loss, keeping skin plumper by morning. Especially important if using heating/air conditioning.', impact: 'high' },
  { tip: 'No alcohol within 3 hours of sleep', detail: 'Alcohol suppresses SWS (deep sleep), preventing the GH secretion window. Even moderate alcohol consumption measurably reduces collagen synthesis for that night. One drink at dinner is fine; two drinks at 10pm is not.', impact: 'high' },
  { tip: 'Consistent sleep/wake time — even weekends', detail: 'Circadian rhythm is calibrated by consistent light/dark cues. Social jet lag (sleeping 2+ hours later on weekends) throws off the skin\'s repair rhythm just as effectively as actual jet lag.', impact: 'high' },
  { tip: 'No eating within 2–3 hours of sleep', detail: 'Digestion competes with sleep-stage repair processes. Insulin spikes disrupt GH secretion timing. Elevated blood sugar overnight measurably increases glycation damage to collagen.', impact: 'medium' },
  { tip: 'Magnesium glycinate 200–400mg PM', detail: 'Magnesium is essential for GABA receptor function (relaxation), melatonin synthesis, and cortisol regulation. Most adults are deficient. Glycinate form is well-absorbed and less likely to cause digestive issues than oxide.', impact: 'medium' },
];

const TALLOW_PM = [
  { step: 1, action: 'Double cleanse', detail: 'First cleanse: cleansing balm or oil (removes sunscreen, makeup). Second cleanse: gentle pH-balanced gel. Do not skip the first cleanse if you wore SPF — it will not fully remove with gel alone.' },
  { step: 2, action: 'Active treatment (optional)', detail: 'If using retinol, AHA, or BHA, apply now on dry skin. Wait 20–30 minutes. Do not apply tallow before actives — it creates a barrier that reduces penetration.' },
  { step: 3, action: 'Serum (if using)', detail: 'Hydrating serums: hyaluronic acid, peptides, niacinamide. Apply on slightly damp skin for maximum HA uptake. Pat in gently — no dragging.' },
  { step: 4, action: 'Tallow application', detail: 'Take a pea-sized amount of tallow. Warm between fingertips for 5 seconds (body heat melts it). Press gently into face. Concentrates where skin feels driest — cheeks, temples, around eyes, neck. Thin layer is enough — it is rich.' },
  { step: 5, action: 'Timing to bed', detail: 'Aim to apply tallow 30–60 minutes before bed. This lets it sink in slightly before pillow contact. A silk pillow reduces transfer further. On nights with heavy tallow application (during barrier repair), apply 60 minutes before sleep.' },
  { step: 6, action: 'No phone after tallow', detail: 'This is also the blue light cutoff window. Tallow is applied, wind-down begins. The two habits reinforce each other: PM skincare complete = screen time over = melatonin protected = better skin repair.' },
];

export default function SleepSkinScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const SLEEP_STAGES = useMemo(() => buildSleepStages(Colors), [Colors]);
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedFact, setExpandedFact] = useState<number | null>(null);
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const [expandedOpt, setExpandedOpt] = useState<number | null>(null);

  const impactColor = (i: string) => i === 'high' ? Colors.green : i === 'critical' ? Colors.red : Colors.gold;
  const priorityColor = (p: string) => p === 'critical' ? Colors.red : p === 'high' ? Colors.gold : Colors.teal;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sleep & Skin</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>🌙 Sleep is Skincare</Text>
        <Text style={styles.heroSub}>Sleep is not passive downtime. It is the primary skin repair window. No topical can replicate what happens during deep sleep — and poor sleep actively accelerates aging.</Text>
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
            {SLEEP_FACTS.map((f, i) => (
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
            <Text style={styles.sectionNote}>Sleep cycles 90 minutes each. You need 4–6 full cycles (6–9 hours). First half = repair. Second half = consolidation and hormonal transition.</Text>
            {SLEEP_STAGES.map((s, i) => (
              <TouchableOpacity key={i} style={[styles.card, { borderLeftColor: s.color, borderLeftWidth: 3 }]} onPress={() => setExpandedStage(expandedStage === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{s.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: s.color }]}>{s.stage}</Text>
                    <Text style={styles.stageDuration}>{s.duration} · {s.action}</Text>
                  </View>
                  <Text style={styles.expandIcon}>{expandedStage === i ? '▲' : '▼'}</Text>
                </View>
                {expandedStage === i && <Text style={styles.cardDetail}>{s.skin}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 2 && (
          <View>
            <Text style={styles.sectionNote}>The timing of your PM routine matters almost as much as the products you use. Align your skincare with your circadian rhythm.</Text>
            {PM_TIMING.map((t, i) => (
              <View key={i} style={[styles.timingCard, { borderLeftColor: priorityColor(t.priority) }]}>
                <View style={styles.timingHeader}>
                  <Text style={[styles.timingWindow, { color: priorityColor(t.priority) }]}>{t.window}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: priorityColor(t.priority) + '22', borderColor: priorityColor(t.priority) + '55' }]}>
                    <Text style={[styles.priorityText, { color: priorityColor(t.priority) }]}>{t.priority.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.timingPhase}>{t.phase}</Text>
                <Text style={styles.timingAction}>→ {t.action}</Text>
                <Text style={styles.timingRelevance}>{t.skinRelevance}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 3 && (
          <View>
            {OPTIMISATIONS.map((o, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedOpt(expandedOpt === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{o.tip}</Text>
                    <View style={[styles.impactBadge, { backgroundColor: impactColor(o.impact) + '22', borderColor: impactColor(o.impact) + '55' }]}>
                      <Text style={[styles.impactText, { color: impactColor(o.impact) }]}>{o.impact.toUpperCase()} IMPACT</Text>
                    </View>
                  </View>
                  <Text style={styles.expandIcon}>{expandedOpt === i ? '▲' : '▼'}</Text>
                </View>
                {expandedOpt === i && <Text style={styles.cardDetail}>{o.detail}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 4 && (
          <View>
            <View style={styles.tallowHero}>
              <Text style={styles.tallowHeroTitle}>🌿 Tallow PM Protocol</Text>
              <Text style={styles.tallowHeroSub}>Aligned with the circadian window. Tallow applied at the right time traps water during peak TEWL, supports overnight repair, and primes skin for the growth hormone surge.</Text>
            </View>
            {TALLOW_PM.map((s, i) => (
              <View key={i} style={styles.pmStep}>
                <View style={styles.pmStepNum}>
                  <Text style={styles.pmStepNumText}>{s.step}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pmStepAction}>{s.action}</Text>
                  <Text style={styles.pmStepDetail}>{s.detail}</Text>
                </View>
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
  cardDetail: { color: c.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 10 },
  expandIcon: { color: c.textMuted, fontSize: 12, marginTop: 4 },
  stageDuration: { color: c.textMuted, fontSize: 12, marginTop: 2 },
  timingCard: { backgroundColor: c.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.border, borderLeftWidth: 4, marginBottom: 10 },
  timingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  timingWindow: { fontSize: 15, fontWeight: '800' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  timingPhase: { color: c.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  timingAction: { color: c.gold, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  timingRelevance: { color: c.textSecondary, fontSize: 12, lineHeight: 18 },
  impactBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginTop: 2 },
  impactText: { fontSize: 10, fontWeight: '700' },
  tallowHero: { backgroundColor: c.primary + '11', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.primary + '44', marginBottom: 14 },
  tallowHeroTitle: { color: c.primary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  tallowHeroSub: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  pmStep: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  pmStepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  pmStepNumText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  pmStepAction: { color: c.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  pmStepDetail: { color: c.textSecondary, fontSize: 13, lineHeight: 19 },
  });
}
