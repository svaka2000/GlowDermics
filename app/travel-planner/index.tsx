import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Groq from 'groq-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

const CACHE_KEY = 'gd_travel_plan';
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

type TravelPlan = {
  generatedAt: number;
  destination: string;
  climate: string;
  climateNote: string;
  packingList: { item: string; essential: boolean; note: string }[];
  morningRoutine: { step: string; product: string; why: string }[];
  eveningRoutine: { step: string; product: string; why: string }[];
  flightRoutine: { step: string; why: string }[];
  adjustments: string[];
  tallowTip: string;
  watchOut: string[];
};

const CLIMATE_TYPES = [
  { id: 'hot_humid', label: 'Hot & Humid', emoji: '🌴', desc: 'Tropical, rainforest, beach' },
  { id: 'hot_dry', label: 'Hot & Dry', emoji: '🏜️', desc: 'Desert, arid, Mediterranean' },
  { id: 'cold_dry', label: 'Cold & Dry', emoji: '❄️', desc: 'Winter, mountain, continental' },
  { id: 'cold_wet', label: 'Cold & Wet', emoji: '🌧️', desc: 'Nordic, rainforest, overcast' },
  { id: 'mild', label: 'Mild & Temperate', emoji: '🌤️', desc: 'Similar to home climate' },
  { id: 'high_altitude', label: 'High Altitude', emoji: '⛰️', desc: 'Mountain, thin air, intense UV' },
];

const TRIP_DURATIONS = ['3-5 days', '1 week', '2 weeks', '3+ weeks'];

export default function TravelPlanner() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [destination, setDestination] = useState('');
  const [climate, setClimate] = useState('');
  const [duration, setDuration] = useState('1 week');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    loadCached();
  }, []));

  const loadCached = async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Date.now() - cached.generatedAt < CACHE_TTL) {
          setPlan(cached);
          setDestination(cached.destination);
        }
      }
    } catch {}
  };

  const generate = async () => {
    if (!destination.trim() || !climate) return;
    setLoading(true);
    setError('');

    try {
      const profile = await Storage.getUserProfile();
      const climateInfo = CLIMATE_TYPES.find(c => c.id === climate);

      const prompt = `You are a skincare travel expert. Generate a detailed travel skincare plan. Return ONLY valid JSON.

Traveler:
- Name: ${profile?.name || 'Traveler'}
- Skin type: ${profile?.skinType || 'normal'}
- Concerns: ${profile?.primaryConcerns?.join(', ') || 'general'}
- Destination: ${destination}
- Climate: ${climateInfo?.label} (${climateInfo?.desc})
- Trip duration: ${duration}

Note: TallowDermics is their primary skincare brand — a premium grass-fed tallow balm that is their go-to moisturizer.

Return this exact JSON:
{
  "destination": "${destination}",
  "climate": "${climateInfo?.label}",
  "climateNote": "2-3 sentences about how this specific climate affects skin and the main challenges",
  "packingList": [
    {"item": "Product or item name", "essential": true, "note": "Why and how much to bring"}
  ],
  "morningRoutine": [
    {"step": "Step name", "product": "What to use", "why": "Why this matters in this climate"}
  ],
  "eveningRoutine": [
    {"step": "Step name", "product": "What to use", "why": "Why this matters in this climate"}
  ],
  "flightRoutine": [
    {"step": "Step name", "why": "Cabin air is 20% humidity — what to do"}
  ],
  "adjustments": ["3-4 key adjustments from their normal routine specific to this destination"],
  "tallowTip": "1-2 sentences on specifically how to use TallowDermics tallow balm for this climate",
  "watchOut": ["2-3 common travel skincare mistakes specific to this climate/destination"]
}

Provide 5-7 packing list items, 3-4 morning steps, 3-4 evening steps, 3-4 flight steps.`;

      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 1200,
      });

      const text = res.choices[0]?.message?.content || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Invalid response');

      const parsed: TravelPlan = JSON.parse(match[0]);
      parsed.generatedAt = Date.now();

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      setPlan(parsed);
    } catch {
      setError('Could not generate plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedClimate = CLIMATE_TYPES.find(c => c.id === climate);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Travel Skin Planner</Text>
            <Text style={styles.headerSub}>Adapt your routine for any climate</Text>
          </View>
          {plan && (
            <Pressable style={styles.resetBtn} onPress={() => { setPlan(null); setDestination(''); setClimate(''); }}>
              <Ionicons name="refresh-outline" size={16} color={colors.textMuted} />
            </Pressable>
          )}
          {!plan && <View style={{ width: 36 }} />}
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {!plan && !loading && (
          <>
            <View style={styles.setupCard}>
              <Text style={styles.setupTitle}>Where are you going?</Text>
              <TextInput
                style={styles.textInput}
                placeholder="City, country, or region..."
                placeholderTextColor={colors.textMuted}
                value={destination}
                onChangeText={setDestination}
              />

              <Text style={styles.fieldLabel}>Climate</Text>
              <View style={styles.climateGrid}>
                {CLIMATE_TYPES.map(c => (
                  <Pressable
                    key={c.id}
                    style={[styles.climateChip, climate === c.id && styles.climateChipActive]}
                    onPress={() => setClimate(c.id)}
                  >
                    <Text style={styles.climateEmoji}>{c.emoji}</Text>
                    <Text style={[styles.climateLabel, climate === c.id && { color: colors.primary }]}>{c.label}</Text>
                    <Text style={styles.climateDesc}>{c.desc}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Trip Duration</Text>
              <View style={styles.durationRow}>
                {TRIP_DURATIONS.map(d => (
                  <Pressable
                    key={d}
                    style={[styles.durationChip, duration === d && styles.durationChipActive]}
                    onPress={() => setDuration(d)}
                  >
                    <Text style={[styles.durationText, duration === d && { color: colors.primary }]}>{d}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[styles.generateBtn, (!destination.trim() || !climate) && { opacity: 0.5 }]}
                onPress={generate}
                disabled={!destination.trim() || !climate}
              >
                <LinearGradient colors={[colors.primaryDark, colors.primary, colors.gold]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Ionicons name="airplane" size={18} color={colors.white} />
                <Text style={styles.generateBtnText}>Generate Travel Plan</Text>
              </Pressable>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.tipCard}>
              <Text style={styles.tipCardTitle}>Why routines need to adapt</Text>
              {[
                { climate: '🏜️ Hot & Dry', tip: 'Low humidity causes 3x faster moisture loss. Layer humectants before your moisturizer.' },
                { climate: '🌴 Hot & Humid', tip: 'Excess humidity triggers more oil and fungal issues. Simplify and go lighter.' },
                { climate: '❄️ Cold', tip: 'Cold air is dry air. Your barrier works harder. Rich occlusives (like tallow) are essential.' },
                { climate: '⛰️ Altitude', tip: 'UV intensity increases 10% every 1,000m. SPF needs to go higher at altitude.' },
              ].map((item, i) => (
                <View key={i} style={styles.tipRow}>
                  <Text style={styles.tipClimate}>{item.climate}</Text>
                  <Text style={styles.tipText}>{item.tip}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingTitle}>Building your travel plan...</Text>
            <Text style={styles.loadingDesc}>Analyzing {destination} climate for your skin type</Text>
          </View>
        )}

        {plan && (
          <>
            {/* Destination hero */}
            <View style={styles.destinationHero}>
              <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={styles.destTop}>
                <Text style={styles.destPlane}>✈️</Text>
                <View>
                  <Text style={styles.destName}>{plan.destination}</Text>
                  <Text style={styles.destClimate}>{plan.climate}</Text>
                </View>
              </View>
              <Text style={styles.destNote}>{plan.climateNote}</Text>
            </View>

            {/* Flight routine */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>✈️ In-Flight Routine</Text>
              <Text style={styles.cardSubtitle}>Cabin air is ~20% humidity — your skin will dehydrate fast</Text>
              {plan.flightRoutine.map((step, i) => (
                <View key={i} style={styles.routineRow}>
                  <View style={styles.stepNumBadge}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routineStep}>{step.step}</Text>
                    <Text style={styles.routineWhy}>{step.why}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Morning routine */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🌅 Morning Routine in {plan.destination}</Text>
              {plan.morningRoutine.map((step, i) => (
                <View key={i} style={styles.routineRow}>
                  <View style={[styles.stepNumBadge, { backgroundColor: `${colors.gold}20` }]}>
                    <Text style={[styles.stepNumText, { color: colors.gold }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routineStep}>{step.step}</Text>
                    <Text style={styles.routineProduct}>{step.product}</Text>
                    <Text style={styles.routineWhy}>{step.why}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Evening routine */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🌙 Evening Routine</Text>
              {plan.eveningRoutine.map((step, i) => (
                <View key={i} style={styles.routineRow}>
                  <View style={[styles.stepNumBadge, { backgroundColor: '#6B85A820' }]}>
                    <Text style={[styles.stepNumText, { color: '#6B85A8' }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routineStep}>{step.step}</Text>
                    <Text style={styles.routineProduct}>{step.product}</Text>
                    <Text style={styles.routineWhy}>{step.why}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Packing list */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🧳 Packing Checklist</Text>
              {plan.packingList.map((item, i) => (
                <View key={i} style={[styles.packRow, item.essential && styles.essentialRow]}>
                  {item.essential && <View style={styles.essentialBadge}><Text style={styles.essentialText}>MUST</Text></View>}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.packItem}>{item.item}</Text>
                    <Text style={styles.packNote}>{item.note}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Key adjustments */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🔄 Key Routine Adjustments</Text>
              {plan.adjustments.map((adj, i) => (
                <View key={i} style={styles.adjustRow}>
                  <View style={styles.adjustDot} />
                  <Text style={styles.adjustText}>{adj}</Text>
                </View>
              ))}
            </View>

            {/* Tallow tip */}
            <View style={styles.tallowCard}>
              <LinearGradient colors={[`${colors.primary}12`, `${colors.primary}04`]} style={StyleSheet.absoluteFill} />
              <Text style={styles.tallowTitle}>🌿 TallowDermics for {plan.climate}</Text>
              <Text style={styles.tallowText}>{plan.tallowTip}</Text>
            </View>

            {/* Watch out */}
            <View style={styles.watchCard}>
              <LinearGradient colors={['rgba(239,68,68,0.08)', 'rgba(239,68,68,0.02)']} style={StyleSheet.absoluteFill} />
              <Text style={[styles.cardTitle, { color: colors.scorePoor }]}>⚠️ Common Mistakes to Avoid</Text>
              {plan.watchOut.map((item, i) => (
                <View key={i} style={styles.watchRow}>
                  <Ionicons name="warning-outline" size={14} color={colors.scorePoor} />
                  <Text style={styles.watchText}>{item}</Text>
                </View>
              ))}
            </View>

            <Pressable style={styles.newPlanBtn} onPress={() => { setPlan(null); setDestination(''); setClimate(''); }}>
              <Text style={styles.newPlanText}>Plan Another Trip</Text>
            </Pressable>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  resetBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  scroll: { paddingHorizontal: 16 },

  setupCard: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border,
    padding: 16, gap: 12, marginBottom: 14,
  },
  setupTitle: { fontSize: 18, fontWeight: '800', color: c.textPrimary },
  textInput: {
    backgroundColor: c.bgElevated, borderRadius: 12, borderWidth: 1, borderColor: c.border,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: c.textPrimary,
  },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },

  climateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  climateChip: {
    flex: 1, minWidth: 120, padding: 10, borderRadius: 12, gap: 2,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated,
  },
  climateChipActive: { borderColor: c.primary, backgroundColor: `${c.primary}15` },
  climateEmoji: { fontSize: 20 },
  climateLabel: { fontSize: 13, fontWeight: '700', color: c.textMuted },
  climateDesc: { fontSize: 10, color: c.textMuted },

  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  durationChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated,
  },
  durationChipActive: { borderColor: c.primary, backgroundColor: `${c.primary}15` },
  durationText: { fontSize: 13, fontWeight: '700', color: c.textMuted },

  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 14, overflow: 'hidden',
  },
  generateBtnText: { fontSize: 15, fontWeight: '800', color: c.white },
  errorText: { fontSize: 13, color: c.scorePoor, textAlign: 'center', marginBottom: 14 },

  tipCard: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border,
    padding: 16, gap: 10, marginBottom: 14,
  },
  tipCardTitle: { fontSize: 14, fontWeight: '700', color: c.textPrimary, marginBottom: 4 },
  tipRow: { gap: 2 },
  tipClimate: { fontSize: 12, fontWeight: '800', color: c.textSecondary },
  tipText: { fontSize: 12, color: c.textMuted, lineHeight: 18 },

  loadingCard: {
    backgroundColor: c.bgCard, borderRadius: 20, borderWidth: 1, borderColor: c.border,
    padding: 40, gap: 12, alignItems: 'center', marginBottom: 14,
  },
  loadingTitle: { fontSize: 18, fontWeight: '800', color: c.textPrimary },
  loadingDesc: { fontSize: 13, color: c.textMuted, textAlign: 'center' },

  destinationHero: {
    borderRadius: 20, overflow: 'hidden', padding: 20, gap: 10, marginBottom: 14,
  },
  destTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  destPlane: { fontSize: 32 },
  destName: { fontSize: 22, fontWeight: '900', color: c.white },
  destClimate: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  destNote: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 20 },

  card: {
    backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border,
    padding: 16, gap: 10, marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  cardSubtitle: { fontSize: 12, color: c.textMuted },

  routineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNumBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: `${c.primary}20`, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNumText: { fontSize: 12, fontWeight: '900', color: c.primary },
  routineStep: { fontSize: 14, fontWeight: '800', color: c.textPrimary },
  routineProduct: { fontSize: 12, color: c.primary, fontWeight: '600', marginTop: 1 },
  routineWhy: { fontSize: 12, color: c.textMuted, lineHeight: 18, marginTop: 2 },

  packRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
  essentialRow: { borderLeftWidth: 3, borderLeftColor: c.primary, paddingLeft: 8 },
  essentialBadge: { backgroundColor: `${c.primary}20`, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  essentialText: { fontSize: 8, fontWeight: '900', color: c.primary, letterSpacing: 1 },
  packItem: { fontSize: 13, fontWeight: '700', color: c.textPrimary },
  packNote: { fontSize: 11, color: c.textMuted, lineHeight: 17 },

  adjustRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  adjustDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: c.primary, marginTop: 6, flexShrink: 0 },
  adjustText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  tallowCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: `${c.primary}30`,
    padding: 16, gap: 6, marginBottom: 14,
  },
  tallowTitle: { fontSize: 14, fontWeight: '700', color: c.primary },
  tallowText: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  watchCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
    padding: 16, gap: 8, marginBottom: 14,
  },
  watchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  watchText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 19 },

  newPlanBtn: {
    height: 48, borderRadius: 12, borderWidth: 1, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  newPlanText: { fontSize: 14, fontWeight: '700', color: c.textMuted },
  });
}
