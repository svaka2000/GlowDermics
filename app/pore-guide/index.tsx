import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

function shimColors(c: Palette) {
  return {
    bg: c.bg,
    card: c.bgCard,
    cardAlt: c.bgElevated,
    border: c.border,
    primary: c.primary,
    gold: c.gold,
    textPrimary: c.textPrimary,
    textSecondary: c.textSecondary,
    textMuted: c.textMuted,
    green: c.scoreGood,
    red: c.scorePoor,
    blue: c.hydration,
    purple: c.darkCircles,
  };
}

function buildSections(Colors: ReturnType<typeof shimColors>) {
  return [
    { id: 'science', title: 'The Science of Pores', icon: '🔬', color: Colors.blue },
    { id: 'myths', title: 'Pore Myths Debunked', icon: '💡', color: Colors.gold },
    { id: 'causes', title: 'What Enlarges Pores', icon: '⚠️', color: Colors.red },
    { id: 'treatments', title: 'Treatments That Work', icon: '✅', color: Colors.green },
    { id: 'habits', title: 'Daily Habits', icon: '📅', color: Colors.primary },
    { id: 'tallow', title: "Occlusive's Role", icon: '🌿', color: Colors.purple },
  ];
}

const PORE_SCIENCE = [
  {
    fact: 'Pores are permanent structures',
    detail: 'Every pore is a hair follicle opening. You cannot permanently open or close them — they are fixed anatomy, not valves.',
  },
  {
    fact: 'Size is genetic first',
    detail: 'Pore size is primarily determined by genetics. If your parents had large pores, you are more likely to as well.',
  },
  {
    fact: 'Sebum = your natural protector',
    detail: 'Pores exist to deliver sebum to the skin surface. Sebum creates your acid mantle, the protective film that keeps skin healthy.',
  },
  {
    fact: 'Visible pores signal function',
    detail: 'Visible pores often mean active sebum production — which is actually protective and anti-aging. Dry skin types have finer pores but age faster.',
  },
  {
    fact: 'Age stretches pores',
    detail: 'As collagen breaks down with age, the walls around pores lose support and pores appear larger. This is irreversible without collagen stimulation.',
  },
  {
    fact: 'Sun damage worsens them',
    detail: 'UV exposure degrades collagen, causing pore walls to sag and appear enlarged. SPF is the most evidence-based pore prevention tool.',
  },
];

const MYTHS = [
  {
    myth: '"Pores open and close with temperature"',
    truth: 'False. Pores have no muscles. Hot water loosens debris for easier extraction; cold water slightly reduces redness. Neither opens or closes pores.',
  },
  {
    myth: '"You can shrink pores permanently"',
    truth: 'False. You can minimize their appearance temporarily with certain ingredients, but the follicle size itself does not change.',
  },
  {
    myth: '"Charcoal strips clean pores"',
    truth: 'Mostly false. Pore strips remove surface buildup but do not address the cause, and can traumatize skin, worsening enlarged pores over time.',
  },
  {
    myth: '"Oily skin has larger pores"',
    truth: 'Partially true. High sebum flow can stretch pores, but genetics is the primary driver — not oil production alone.',
  },
  {
    myth: '"Tightening toners minimize pores"',
    truth: 'Temporary. Alcohol-based astringents dehydrate skin, creating a short-term tightened look. But dehydration long-term triggers more oil, making pores worse.',
  },
  {
    myth: '"More cleansing = cleaner pores"',
    truth: 'False. Over-cleansing strips the acid mantle, triggers rebound sebum production, and causes oxidized oil buildup — worsening the appearance of pores.',
  },
];

const CAUSES = [
  {
    cause: 'Excess sebum production',
    explanation: 'More oil = more buildup inside the follicle. As sebum oxidizes, it turns into a dark plug (comedone), stretching the pore walls.',
    severity: 'high',
  },
  {
    cause: 'Sun damage (collagen loss)',
    explanation: 'Collagen provides the scaffolding around pores. UV degrades collagen, causing the walls to collapse outward, making pores look wider.',
    severity: 'high',
  },
  {
    cause: 'Comedogenic skincare',
    explanation: 'Pore-clogging ingredients (certain silicones, heavy oils, waxes) trap debris inside follicles, stretching them over time.',
    severity: 'medium',
  },
  {
    cause: 'Poor cleansing habits',
    explanation: 'Not removing makeup, SPF, or pollution at end of day allows oxidized residue to accumulate and harden inside pores.',
    severity: 'medium',
  },
  {
    cause: 'Aging',
    explanation: 'Natural collagen decline from your mid-20s onward reduces the structural support around each follicle.',
    severity: 'medium',
  },
  {
    cause: 'Picking and squeezing',
    explanation: 'Repeated extraction trauma damages the follicle wall permanently, causing pores to appear distorted and enlarged.',
    severity: 'medium',
  },
  {
    cause: 'Dehydration',
    explanation: 'Dehydrated cells swell around pore openings and can make them more visible. Paradoxically, dehydration also signals more oil production.',
    severity: 'low',
  },
];

const TREATMENTS = [
  {
    ingredient: 'BHA (Salicylic Acid)',
    how: '0.5–2%, 2–3× per week',
    why: 'Oil-soluble. Penetrates INTO the pore, dissolving the sebum and debris that stretches pore walls from the inside.',
    rating: 'best',
  },
  {
    ingredient: 'Niacinamide (Vitamin B3)',
    how: '5–10%, morning or evening',
    why: 'Reduces sebum production, shrinks the appearance of pores via oil regulation, and strengthens the barrier. Very well-tolerated.',
    rating: 'best',
  },
  {
    ingredient: 'Retinol / Retinoids',
    how: '0.025–0.3%, 2× per week to start',
    why: 'Stimulates collagen production to support pore walls, increases cell turnover to prevent comedone formation.',
    rating: 'best',
  },
  {
    ingredient: 'Clay (Kaolin / Bentonite)',
    how: 'Weekly mask, 10–15 minutes',
    why: 'Absorbs excess sebum from inside the follicle. Reduces the oil load that stretches pores. Best as a weekly reset.',
    rating: 'good',
  },
  {
    ingredient: 'AHA (Glycolic/Lactic Acid)',
    how: '5–10%, 1–2× per week',
    why: 'Exfoliates surface cells that can pile up around pore openings. Improves skin texture around pores.',
    rating: 'good',
  },
  {
    ingredient: 'SPF 30+',
    how: 'Every morning, every day',
    why: 'Prevents UV-induced collagen degradation — the #1 cause of age-related pore enlargement. Most evidence-based long-term intervention.',
    rating: 'essential',
  },
  {
    ingredient: 'Double Cleansing',
    how: 'Oil cleanse → gentle water cleanser at night',
    why: 'Oil cleanser dissolves sebum, SPF, and makeup. Follow with gentle cleanser to remove residue without stripping barrier.',
    rating: 'good',
  },
];

const HABITS = [
  {
    habit: 'Never sleep with makeup on',
    frequency: 'nightly',
    detail: 'Overnight buildup oxidizes inside pores by morning. This single habit causes more pore enlargement than almost anything else.',
  },
  {
    habit: 'Cleanse morning and night',
    frequency: 'daily',
    detail: 'Morning removes overnight oil and sweat. Evening removes pollution, SPF, and sebum. Both are necessary — not just one.',
  },
  {
    habit: 'Apply SPF every morning',
    frequency: 'daily',
    detail: 'The most evidence-backed pore intervention. Prevents collagen loss that causes pores to sag open permanently.',
  },
  {
    habit: 'Use BHA 2–3× per week',
    frequency: 'weekly',
    detail: 'Consistent BHA use prevents the oil buildup cycle inside follicles that stretches pores over time.',
  },
  {
    habit: 'Clay mask weekly',
    frequency: 'weekly',
    detail: 'Resets sebum levels in pores. Most effective 24–48 hours after BHA for maximum pore clearing.',
  },
  {
    habit: 'Check your products for comedogenics',
    frequency: 'ongoing',
    detail: 'Avoid: isopropyl myristate, coconut oil on face, algae extract, heavy silicones if prone to congestion.',
  },
  {
    habit: 'Do not squeeze pores manually',
    frequency: 'never',
    detail: 'Manual extraction damages the follicle wall permanently. Let BHA and clay do the clearing chemically instead.',
  },
];

const TALLOW_PORE = [
  {
    point: 'Biocompatible, non-comedogenic fat profile',
    detail: "A sebum-similar occlusive's fatty acid profile closely mirrors human sebum — primarily oleic and stearic acid. This means it does not trigger the clogging response that foreign oils do.",
  },
  {
    point: 'Sebum regulation, not addition',
    detail: "When the barrier is intact, the skin signals it doesn't need to produce excess sebum. A lipid-rich occlusive helps repair the barrier, reducing the overproduction that causes pore-stretching oil buildup.",
  },
  {
    point: 'Vitamin A supports cell turnover',
    detail: 'Some lipid occlusives contain fat-soluble Vitamin A (retinol precursors), which promotes gentle cell turnover that helps keep pore openings clear — without the irritation of synthetic retinoids.',
  },
  {
    point: 'Less stripping = less rebound oil',
    detail: "Harsh synthetic cleansers strip the acid mantle and trigger rebound oil production. Gentle oil-cleansing methods preserve barrier integrity, breaking the strip→overcompensate→clog cycle.",
  },
  {
    point: 'What to watch',
    detail: 'Start slowly if you have very congested skin (purging is possible in weeks 1–2). Always patch test. Use on clean, BHA-cleared skin for best results on pore-prone areas.',
    caution: true,
  },
];

export default function PoreGuideScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const SECTIONS = useMemo(() => buildSections(Colors), [Colors]);
  const [activeSection, setActiveSection] = useState('science');
  const [expandedTreatment, setExpandedTreatment] = useState<string | null>(null);
  const [expandedMyth, setExpandedMyth] = useState<number | null>(null);

  const getRatingColor = (rating: string) => {
    if (rating === 'best') return Colors.green;
    if (rating === 'essential') return Colors.primary;
    return Colors.gold;
  };

  const getRatingLabel = (rating: string) => {
    if (rating === 'best') return 'BEST';
    if (rating === 'essential') return 'ESSENTIAL';
    return 'GOOD';
  };

  const getSeverityColor = (s: string) => {
    if (s === 'high') return Colors.red;
    if (s === 'medium') return Colors.gold;
    return Colors.blue;
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'science':
        return (
          <View>
            <View style={styles.introCard}>
              <Text style={styles.introTitle}>What Are Pores, Really?</Text>
              <Text style={styles.introText}>
                Pores are the openings of hair follicles. They exist to deliver sebum — your skin's natural oil — to the surface.
                They are not dirt collectors or open windows. Understanding their true nature is the first step to treating them correctly.
              </Text>
            </View>
            {PORE_SCIENCE.map((item, i) => (
              <View key={i} style={styles.scienceCard}>
                <View style={styles.scienceNumber}>
                  <Text style={styles.scienceNumberText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scienceFact}>{item.fact}</Text>
                  <Text style={styles.scienceDetail}>{item.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        );

      case 'myths':
        return (
          <View>
            {MYTHS.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.mythCard}
                onPress={() => setExpandedMyth(expandedMyth === i ? null : i)}
                activeOpacity={0.8}
              >
                <View style={styles.mythHeader}>
                  <Text style={styles.mythLabel}>MYTH</Text>
                  <Text style={styles.mythTitle}>{item.myth}</Text>
                  <Text style={styles.expandIcon}>{expandedMyth === i ? '▲' : '▼'}</Text>
                </View>
                {expandedMyth === i && (
                  <View style={styles.mythTruth}>
                    <Text style={styles.truthLabel}>TRUTH</Text>
                    <Text style={styles.truthText}>{item.truth}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'causes':
        return (
          <View>
            {CAUSES.map((item, i) => (
              <View key={i} style={styles.causeCard}>
                <View style={styles.causeHeader}>
                  <Text style={styles.causeName}>{item.cause}</Text>
                  <View style={[styles.severityBadge, { borderColor: getSeverityColor(item.severity) }]}>
                    <Text style={[styles.severityText, { color: getSeverityColor(item.severity) }]}>
                      {item.severity.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.causeExplanation}>{item.explanation}</Text>
              </View>
            ))}
          </View>
        );

      case 'treatments':
        return (
          <View>
            <Text style={styles.sectionNote}>
              These are the evidence-backed actives for pore appearance. Start with one at a time and introduce slowly.
            </Text>
            {TREATMENTS.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.treatmentCard}
                onPress={() => setExpandedTreatment(expandedTreatment === item.ingredient ? null : item.ingredient)}
                activeOpacity={0.8}
              >
                <View style={styles.treatmentHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ingredientName}>{item.ingredient}</Text>
                    <Text style={styles.ingredientHow}>{item.how}</Text>
                  </View>
                  <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(item.rating) + '22', borderColor: getRatingColor(item.rating) }]}>
                    <Text style={[styles.ratingText, { color: getRatingColor(item.rating) }]}>
                      {getRatingLabel(item.rating)}
                    </Text>
                  </View>
                </View>
                {expandedTreatment === item.ingredient && (
                  <Text style={styles.ingredientWhy}>{item.why}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'habits':
        return (
          <View>
            {HABITS.map((item, i) => (
              <View key={i} style={styles.habitCard}>
                <View style={styles.habitHeader}>
                  <Text style={styles.habitTitle}>{item.habit}</Text>
                  <View style={styles.freqBadge}>
                    <Text style={styles.freqText}>{item.frequency}</Text>
                  </View>
                </View>
                <Text style={styles.habitDetail}>{item.detail}</Text>
              </View>
            ))}
          </View>
        );

      case 'tallow':
        return (
          <View>
            <LinearGradient
              colors={['#8A786022', '#0A0A0F']}
              style={styles.tallowHero}
            >
              <Text style={styles.tallowHeroTitle}>Occlusives & Pore Health</Text>
              <Text style={styles.tallowHeroSub}>
                How a lipid-rich occlusive fits into a pore-conscious routine — and what to watch out for.
              </Text>
            </LinearGradient>
            {TALLOW_PORE.map((item, i) => (
              <View
                key={i}
                style={[styles.tallowCard, item.caution && { borderColor: Colors.gold + '66' }]}
              >
                {item.caution && (
                  <Text style={styles.cautionLabel}>⚠️ CAUTION</Text>
                )}
                <Text style={styles.tallowPoint}>{item.point}</Text>
                <Text style={styles.tallowDetail}>{item.detail}</Text>
              </View>
            ))}
            <View style={styles.tallowConclusion}>
              <Text style={styles.conclusionText}>
                Bottom line: a sebum-similar occlusive is not inherently pore-clogging when chosen well and used on a clean, BHA-maintained skin barrier.
                It works best as a finishing moisturizer after your actives — not as a heavy occlusive on congested skin.
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Pore Guide</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.heroBar}>
        <Text style={styles.heroEmoji}>🕳️</Text>
        <Text style={styles.heroTitle}>The Complete Pore Guide</Text>
        <Text style={styles.heroSub}>Science-backed, myth-free</Text>
      </View>

      <View style={styles.tabRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {SECTIONS.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.tabBtn, activeSection === s.id && { borderColor: s.color, backgroundColor: s.color + '22' }]}
              onPress={() => setActiveSection(s.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.tabIcon}>{s.icon}</Text>
              <Text style={[styles.tabLabel, activeSection === s.id && { color: s.color }]}>{s.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderContent()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: Palette) {
  const Colors = shimColors(c);
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  backText: { color: Colors.primary, fontSize: 16 },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  heroBar: {
    alignItems: 'center', paddingVertical: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  heroEmoji: { fontSize: 36, marginBottom: 6 },
  heroTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  heroSub: { color: Colors.textSecondary, fontSize: 14 },
  tabRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  tabIcon: { fontSize: 14 },
  tabLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  // Science
  introCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
  },
  introTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  introText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 21 },
  scienceCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  scienceNumber: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.blue + '22', alignItems: 'center', justifyContent: 'center',
  },
  scienceNumberText: { color: Colors.blue, fontSize: 13, fontWeight: '700' },
  scienceFact: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  scienceDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },

  // Myths
  mythCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  mythHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  mythLabel: {
    color: Colors.red, fontSize: 10, fontWeight: '700',
    backgroundColor: Colors.red + '22', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, marginTop: 2,
  },
  mythTitle: { flex: 1, color: Colors.textPrimary, fontSize: 13, fontWeight: '600', lineHeight: 20 },
  expandIcon: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  mythTruth: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  truthLabel: {
    color: Colors.green, fontSize: 10, fontWeight: '700',
    backgroundColor: Colors.green + '22', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, alignSelf: 'flex-start', marginBottom: 6,
  },
  truthText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },

  // Causes
  sectionNote: {
    color: Colors.textSecondary, fontSize: 13, lineHeight: 20,
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 14,
  },
  causeCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  causeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  causeName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  severityBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  severityText: { fontSize: 10, fontWeight: '700' },
  causeExplanation: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },

  // Treatments
  treatmentCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  treatmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ingredientName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  ingredientHow: { color: Colors.textSecondary, fontSize: 12 },
  ratingBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  ratingText: { fontSize: 10, fontWeight: '700' },
  ingredientWhy: {
    color: Colors.textSecondary, fontSize: 13, lineHeight: 20,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border,
  },

  // Habits
  habitCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  habitHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  habitTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  freqBadge: {
    backgroundColor: Colors.primary + '22', borderWidth: 1, borderColor: Colors.primary,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  freqText: { color: Colors.primary, fontSize: 10, fontWeight: '700' },
  habitDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },

  // Occlusive
  tallowHero: {
    borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.primary + '33',
  },
  tallowHeroTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  tallowHeroSub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  cautionLabel: { color: Colors.gold, fontSize: 11, fontWeight: '700', marginBottom: 6 },
  tallowPoint: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowConclusion: {
    backgroundColor: Colors.primary + '15', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.primary + '44', marginTop: 4,
  },
  conclusionText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 21, fontStyle: 'italic' },
  });
}
