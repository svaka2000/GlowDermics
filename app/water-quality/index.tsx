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
  { id: 'science', label: 'The Problem', icon: '🔬' },
  { id: 'signs', label: 'Signs You Have It', icon: '⚠️' },
  { id: 'solutions', label: 'Solutions', icon: '💡' },
  { id: 'routine', label: 'Hard Water Routine', icon: '📋' },
];

const HARD_WATER_SCIENCE = [
  {
    title: 'What makes water "hard"?',
    content: 'Hard water contains high concentrations of dissolved minerals — primarily calcium and magnesium ions. These come from the water passing through limestone and chalk rock deposits before reaching your tap.',
  },
  {
    title: 'How does it affect cleansing?',
    content: "Hard water minerals react with soap and cleanser surfactants to form calcium stearate — soap scum. This film deposits on the skin's surface instead of rinsing clean, leaving a residue that blocks pores and disrupts the acid mantle.",
  },
  {
    title: 'Chlorine: the other problem',
    content: 'Most municipal water is chlorinated to kill bacteria. Chlorine is an oxidizer that strips skin lipids, denatures proteins, and disrupts the microbiome. Daily chlorine exposure from washing significantly contributes to barrier dysfunction.',
  },
  {
    title: 'pH incompatibility',
    content: "Tap water is typically pH 7–8 (alkaline). Your skin's acid mantle sits at pH 4.5–5.5. Repeated alkaline water contact raises skin pH, disrupting barrier enzyme function and creating conditions favorable for bacterial overgrowth.",
  },
  {
    title: 'Who is most affected?',
    content: 'People with eczema, psoriasis, rosacea, and sensitive skin are most severely impacted — but even normal skin types see long-term barrier damage from daily hard water exposure. Studies show a direct correlation between water hardness and childhood eczema rates.',
  },
];

const SIGNS = [
  {
    sign: 'Tightness after washing',
    detail: 'Soap scum residue and mineral deposits pull at the skin, causing that "tight" feeling after cleansing — even with moisturizing cleansers.',
    icon: '😬',
  },
  {
    sign: 'Persistent dryness despite moisturizing',
    detail: 'If your moisturizer seems to stop working within hours, mineral residue on the skin surface may be blocking absorption and disrupting the barrier.',
    icon: '🏜️',
  },
  {
    sign: 'Flakiness and rough texture',
    detail: 'Calcium deposits accumulate on the skin surface and between cells, creating a rough, uneven texture that exfoliants temporarily fix but water quality keeps recreating.',
    icon: '❄️',
  },
  {
    sign: 'Increased breakouts after moving',
    detail: "If your skin was clear in one location and broke out after moving to a new city, hard water is a likely culprit — water hardness varies dramatically by geography.",
    icon: '🏠',
  },
  {
    sign: 'Scalp dryness and flaking',
    detail: 'The same mineral buildup affects the scalp — hard water is a major underappreciated cause of scalp dryness, irritation, and dandruff.',
    icon: '😣',
  },
  {
    sign: 'Soap scum in your bathroom',
    detail: 'White chalky buildup on your shower walls and faucets is calcium carbonate — the same mineral depositing on your skin with every wash.',
    icon: '🚿',
  },
];

const SOLUTIONS = [
  {
    solution: 'Vitamin C (Ascorbic Acid) Rinse',
    difficulty: 'Easy',
    cost: '💰',
    howTo: 'Add 1 teaspoon of powdered Vitamin C (L-ascorbic acid) to a 1-litre jug of tap water. Stir to dissolve. Use as your final face rinse after cleansing. Vitamin C neutralizes chlorine and chelates (binds and removes) calcium minerals.',
    why: 'Most effective single intervention for tap water damage. Neutralizes both chlorine and mineral deposits simultaneously. Used daily, it restores the water used in cleansing to near-soft quality.',
    rating: 'best',
  },
  {
    solution: 'Shower Filter (KDF / Carbon)',
    difficulty: 'Moderate',
    cost: '💰💰',
    howTo: 'Install a KDF-55 + activated carbon shower filter. Replace every 6 months. KDF reduces chlorine, heavy metals, and partially softens water. Carbon removes chloramines and organic compounds.',
    why: 'Addresses the problem at the source. Protects skin AND hair. Most impactful for people with eczema or rosacea. Worth the investment for anyone with chronic barrier issues.',
    rating: 'best',
  },
  {
    solution: 'Micellar Water Pre-Cleanse',
    difficulty: 'Easy',
    cost: '💰',
    howTo: 'Apply micellar water to a cotton pad and wipe face before your oil cleanse. Micellar molecules are amphiphilic — they lift debris without water contact, reducing the time hard water minerals sit on skin.',
    why: 'Reduces cleanser contact time with hard water. Particularly useful for morning routines where a full double cleanse feels excessive.',
    rating: 'good',
  },
  {
    solution: 'Oil Cleansing (No-Rinse Option)',
    difficulty: 'Easy',
    cost: '💰',
    howTo: 'Use an oil cleanser (or tallow balm) and remove with a damp warm muslin cloth — wrung out with filtered or bottled water. Minimizes tap water contact while still cleansing effectively.',
    why: 'Oil emulsifies makeup, SPF, and sebum without requiring a water rinse. The cloth removal method further reduces hard water mineral deposition.',
    rating: 'good',
  },
  {
    solution: 'Water Softener System',
    difficulty: 'Major',
    cost: '💰💰💰',
    howTo: 'Whole-house ion exchange water softener. Replaces calcium and magnesium ions with sodium ions. Professional installation required.',
    why: 'Complete solution for the entire home. Most impactful for families with multiple people suffering from skin or eczema issues. Note: softened water can taste salty and adds sodium to drinking water.',
    rating: 'premium',
  },
  {
    solution: 'Apple Cider Vinegar Toner',
    difficulty: 'Easy',
    cost: '💰',
    howTo: 'Dilute 1 part raw ACV with 5 parts filtered water. Apply with cotton pad after cleansing as a pH-balancing toner. The acetic acid chelates minerals and restores acid mantle pH.',
    why: 'Helps counteract the alkaline pH of tap water by re-acidifying the skin surface after cleansing. Use sparingly — overly acidic application can cause irritation.',
    rating: 'supplementary',
  },
];

const HARD_WATER_ROUTINE = {
  am: [
    { step: 1, action: 'Splash with Vitamin C water (1 tsp powder per 1L jug kept by sink)', note: 'Neutralizes chlorine and minerals from overnight face contact with pillow' },
    { step: 2, action: 'Apply tallow balm or moisturizer to damp skin', note: 'Lock in moisture while skin is still damp from the Vitamin C rinse' },
    { step: 3, action: 'SPF 30+ last', note: 'Filters as additional buffer to environmental oxidants' },
  ],
  pm: [
    { step: 1, action: 'First cleanse: oil cleanser applied to dry face, massage 60 seconds', note: 'Emulsify all SPF, makeup, and sebum with zero water contact so far' },
    { step: 2, action: 'Emulsify with minimal water or damp warm cloth (filtered preferred)', note: 'Remove with as little tap water as possible' },
    { step: 3, action: 'Optional: second gentle cleanser if needed, rinse with Vitamin C water', note: 'The Vitamin C water as final rinse neutralizes mineral buildup from any tap water contact' },
    { step: 4, action: 'ACV toner (1:5) if skin feels alkaline/tight', note: 'Restores acid mantle pH. Skip if skin is not reactive.' },
    { step: 5, action: 'Actives, then tallow balm to finish', note: 'Seal everything with a biocompatible occlusive' },
  ],
};

const getRatingColor = (r: string) => {
  if (r === 'best') return Colors.green;
  if (r === 'good') return Colors.blue;
  if (r === 'premium') return Colors.purple;
  return Colors.gold;
};

const getRatingLabel = (r: string) => {
  if (r === 'best') return 'MOST EFFECTIVE';
  if (r === 'good') return 'GOOD';
  if (r === 'premium') return 'PREMIUM';
  return 'SUPPLEMENTARY';
};

export default function WaterQualityScreen() {
  const [activeTab, setActiveTab] = useState('science');
  const [expandedSolution, setExpandedSolution] = useState<string | null>(null);
  const [expandedSign, setExpandedSign] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Water Quality & Skin</Text>
        <View style={{ width: 60 }} />
      </View>

      <LinearGradient colors={['#60A5FA22', '#0A0A0F']} style={styles.hero}>
        <Text style={styles.heroEmoji}>💧</Text>
        <Text style={styles.heroTitle}>Hard Water & Your Skin</Text>
        <Text style={styles.heroSub}>Why your tap water may be sabotaging your routine — and what to do about it</Text>
      </LinearGradient>

      <View style={styles.tabScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabChip, activeTab === t.id && styles.tabChipActive]}
              onPress={() => setActiveTab(t.id)}
            >
              <Text style={styles.tabChipIcon}>{t.icon}</Text>
              <Text style={[styles.tabChipLabel, activeTab === t.id && styles.tabChipLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {activeTab === 'science' && (
          <>
            {HARD_WATER_SCIENCE.map((item, i) => (
              <View key={i} style={styles.scienceCard}>
                <Text style={styles.scienceTitle}>{item.title}</Text>
                <Text style={styles.scienceContent}>{item.content}</Text>
              </View>
            ))}
            <View style={styles.statCard}>
              <Text style={styles.statTitle}>Did You Know?</Text>
              <Text style={styles.statText}>
                Around 60% of the UK and 85% of the US have hard or very hard water. Water hardness is measured in mg/L (ppm) — above 120 ppm is considered hard, above 180 ppm is very hard. London water averages around 290 ppm.
              </Text>
            </View>
          </>
        )}

        {activeTab === 'signs' && (
          <>
            <Text style={styles.signsIntro}>
              Not sure if hard water is affecting you? These are the telltale signs. The more that apply, the more likely water quality is a factor in your skin concerns.
            </Text>
            {SIGNS.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.signCard}
                onPress={() => setExpandedSign(expandedSign === i ? null : i)}
                activeOpacity={0.8}
              >
                <View style={styles.signHeader}>
                  <Text style={styles.signIcon}>{item.icon}</Text>
                  <Text style={styles.signTitle}>{item.sign}</Text>
                  <Text style={styles.expandIcon}>{expandedSign === i ? '▲' : '▼'}</Text>
                </View>
                {expandedSign === i && (
                  <Text style={styles.signDetail}>{item.detail}</Text>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === 'solutions' && (
          <>
            <Text style={styles.signsIntro}>
              Solutions ranked by effectiveness. You don't need all of these — start with the Vitamin C rinse (easiest, cheapest, most impactful) and layer in others based on severity.
            </Text>
            {SOLUTIONS.map((sol, i) => (
              <TouchableOpacity
                key={i}
                style={styles.solutionCard}
                onPress={() => setExpandedSolution(expandedSolution === sol.solution ? null : sol.solution)}
                activeOpacity={0.8}
              >
                <View style={styles.solutionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.solutionName}>{sol.solution}</Text>
                    <View style={styles.solutionMeta}>
                      <Text style={styles.solutionCost}>{sol.cost}</Text>
                      <Text style={styles.solutionDifficulty}>{sol.difficulty}</Text>
                    </View>
                  </View>
                  <View style={[styles.ratingBadge, { borderColor: getRatingColor(sol.rating), backgroundColor: getRatingColor(sol.rating) + '22' }]}>
                    <Text style={[styles.ratingText, { color: getRatingColor(sol.rating) }]}>{getRatingLabel(sol.rating)}</Text>
                  </View>
                </View>
                {expandedSolution === sol.solution && (
                  <View style={styles.solutionExpanded}>
                    <Text style={styles.solutionHowLabel}>HOW TO USE</Text>
                    <Text style={styles.solutionHow}>{sol.howTo}</Text>
                    <Text style={styles.solutionWhyLabel}>WHY IT WORKS</Text>
                    <Text style={styles.solutionWhy}>{sol.why}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === 'routine' && (
          <>
            <View style={styles.routineIntro}>
              <Text style={styles.routineIntroText}>
                This routine is optimized for hard water areas. Core principle: minimize tap water contact time, neutralize damage when contact is unavoidable, and prioritize barrier repair.
              </Text>
            </View>

            <Text style={styles.routineSection}>🌅 Morning</Text>
            {HARD_WATER_ROUTINE.am.map(step => (
              <View key={step.step} style={styles.routineStep}>
                <View style={styles.routineStepNum}>
                  <Text style={styles.routineStepNumText}>{step.step}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routineStepAction}>{step.action}</Text>
                  <Text style={styles.routineStepNote}>{step.note}</Text>
                </View>
              </View>
            ))}

            <Text style={[styles.routineSection, { marginTop: 20 }]}>🌙 Evening</Text>
            {HARD_WATER_ROUTINE.pm.map(step => (
              <View key={step.step} style={styles.routineStep}>
                <View style={styles.routineStepNum}>
                  <Text style={styles.routineStepNumText}>{step.step}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routineStepAction}>{step.action}</Text>
                  <Text style={styles.routineStepNote}>{step.note}</Text>
                </View>
              </View>
            ))}

            <View style={styles.tallowNote}>
              <Text style={styles.tallowNoteTitle}>🌿 Tallow in a Hard Water Routine</Text>
              <Text style={styles.tallowNoteText}>
                Grass-fed tallow is a particularly good fit for hard water skin. Its sebum-like fatty acid profile penetrates and repairs the barrier damage from mineral deposits without adding synthetic comedogenic compounds that hard-water skin is already prone to reacting to.
                {'\n\n'}
                Use it as the final PM step — after all actives and the Vitamin C rinse — to seal everything in and allow overnight repair.
              </Text>
            </View>
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
    padding: 20, marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.blue + '33',
    alignItems: 'center',
  },
  heroEmoji: { fontSize: 36, marginBottom: 6 },
  heroTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  heroSub: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  tabScroll: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabChipActive: { borderColor: Colors.blue, backgroundColor: Colors.blue + '22' },
  tabChipIcon: { fontSize: 13 },
  tabChipLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tabChipLabelActive: { color: Colors.blue },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  scienceCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  scienceTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  scienceContent: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  statCard: {
    backgroundColor: Colors.blue + '15', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.blue + '44', marginTop: 4,
  },
  statTitle: { color: Colors.blue, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  statText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  signsIntro: {
    color: Colors.textSecondary, fontSize: 13, lineHeight: 20,
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 14,
  },
  signCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  signHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  signIcon: { fontSize: 18 },
  signTitle: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  expandIcon: { color: Colors.textMuted, fontSize: 12 },
  signDetail: {
    color: Colors.textSecondary, fontSize: 13, lineHeight: 20,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  solutionCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  solutionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  solutionName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4, flex: 1 },
  solutionMeta: { flexDirection: 'row', gap: 10 },
  solutionCost: { color: Colors.gold, fontSize: 12 },
  solutionDifficulty: { color: Colors.textMuted, fontSize: 12 },
  ratingBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  ratingText: { fontSize: 9, fontWeight: '700' },
  solutionExpanded: {
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  solutionHowLabel: { color: Colors.blue, fontSize: 10, fontWeight: '700', marginBottom: 4 },
  solutionHow: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 10 },
  solutionWhyLabel: { color: Colors.green, fontSize: 10, fontWeight: '700', marginBottom: 4 },
  solutionWhy: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  routineIntro: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
  },
  routineIntroText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  routineSection: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  routineStep: {
    flexDirection: 'row', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  routineStepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary + '33', alignItems: 'center', justifyContent: 'center',
  },
  routineStepNumText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  routineStepAction: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  routineStepNote: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  tallowNote: {
    backgroundColor: Colors.primary + '15', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.primary + '44', marginTop: 16,
  },
  tallowNoteTitle: { color: Colors.primary, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  tallowNoteText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 21 },
});
