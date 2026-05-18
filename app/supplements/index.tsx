import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '', dangerouslyAllowBrowser: true });
const CACHE_KEY = 'gd_supplement_guide';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

type Supplement = {
  name: string;
  emoji: string;
  whatItDoes: string;
  bestFor: string[];
  dosage: string;
  bestForm: string;
  foodSources: string[];
  synergy: string;
  priority: 'high' | 'medium' | 'low';
};

type SupplementGuide = {
  supplements: Supplement[];
  ancestralNote: string;
  topPick: string;
  caution: string;
  ts: number;
};

function buildPriorityColors(c: Palette) {
  return { high: c.primary, medium: c.gold, low: c.textMuted };
}

export default function Supplements() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const PRIORITY_COLORS = useMemo(() => buildPriorityColors(colors), [colors]);
  const [guide, setGuide] = useState<SupplementGuide | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(useCallback(() => {
    (async () => {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: SupplementGuide = JSON.parse(cached);
        if (Date.now() - parsed.ts < CACHE_TTL) {
          setGuide(parsed);
          return;
        }
      }
      await generate();
    })();
  }, []));

  const generate = async () => {
    setLoading(true);
    try {
      const [profile, analysis] = await Promise.all([
        Storage.getUserProfile(),
        Storage.getLatestAnalysis(),
      ]);

      const concerns = profile?.primaryConcerns?.join(', ') || 'general skin health';
      const skinType = profile?.skinType || 'unknown';
      const lifestyle = profile?.lifestyle;
      const weakMetrics = analysis ? Object.entries(analysis.scores)
        .filter(([k, v]) => k !== 'overall' && v < 65)
        .map(([k]) => k).join(', ') : '';

      const prompt = `You are a dermatology-informed nutritionist. Create a personalized supplement guide for skin health.

User profile:
- Skin type: ${skinType}
- Concerns: ${concerns}
- Diet quality: ${lifestyle?.diet || 'mixed'}
- Sleep: ${lifestyle?.sleepHours || 7} hours/night
- Weak skin metrics: ${weakMetrics || 'none identified'}

Generate 7-9 supplements most relevant to this user. Include nutrients found naturally in whole foods (like organ meats, wild fish, leafy greens).

Return ONLY valid JSON (no markdown):
{
  "supplements": [
    {
      "name": "<supplement name>",
      "emoji": "<single emoji>",
      "whatItDoes": "<2 sentences on mechanism and skin benefits>",
      "bestFor": ["<skin concern 1>", "<skin concern 2>"],
      "dosage": "<recommended daily dose range>",
      "bestForm": "<most bioavailable form e.g. Zinc Picolinate, not Zinc Oxide>",
      "foodSources": ["<food source 1>", "<food source 2>", "<food source 3>"],
      "synergy": "<1 sentence on what it works best with or what enhances absorption>",
      "priority": "<high|medium|low — for this specific user's concerns>"
    }
  ],
  "ancestralNote": "<2 sentences on how whole foods (organ meats, wild-caught fish, leafy greens) naturally provide these nutrients and why modern diets are deficient>",
  "topPick": "<name of the single most important supplement for this user and why — 2 sentences>",
  "caution": "<1 important caution about supplements that doesn't alarm users — e.g. consult doctor before starting, quality matters>"
}`;

      const resp = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 2000,
      });

      const text = resp.choices[0].message.content ?? '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('no json');
      const parsed: SupplementGuide = { ...JSON.parse(match[0]), ts: Date.now() };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      setGuide(parsed);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>Supplement Guide</Text>
            <Text style={styles.headerSub}>Nutrients for your skin</Text>
          </View>
          {guide && (
            <Pressable accessibilityRole="button" accessibilityLabel="Refresh guide" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => { AsyncStorage.removeItem(CACHE_KEY); setGuide(null); generate(); }}>
              <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            </Pressable>
          )}
          {!guide && <View style={{ width: 36 }} />}
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {loading && (
          <View style={styles.loadingCard}>
            <LinearGradient colors={['rgba(196,98,45,0.10)', 'rgba(196,98,45,0.02)']} style={StyleSheet.absoluteFill} />
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>Building your supplement guide...</Text>
          </View>
        )}

        {guide && !loading && (
          <>
            {/* Intro card */}
            <View style={styles.introCard}>
              <LinearGradient colors={['rgba(196,98,45,0.12)', 'rgba(196,98,45,0.02)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.introEmoji}>💊</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.introTitle}>Inside-Out Skin Health</Text>
                <Text style={styles.introSub}>Topical care works best when supported by internal nutrition.</Text>
              </View>
            </View>

            {/* Top pick */}
            <View style={styles.topPickCard}>
              <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={styles.topPickBadge}><Text style={styles.topPickBadgeText}>⭐ TOP PICK FOR YOU</Text></View>
              <Text style={styles.topPickText}>{guide.topPick}</Text>
            </View>

            {/* Supplements by priority */}
            {(['high', 'medium', 'low'] as const).map(priority => {
              const sups = guide.supplements.filter(s => s.priority === priority);
              if (!sups.length) return null;
              return (
                <View key={priority} style={styles.section}>
                  <Text style={[styles.priorityLabel, { color: PRIORITY_COLORS[priority] }]}>
                    {priority === 'high' ? '🎯 High Priority' : priority === 'medium' ? '📌 Recommended' : '✅ Optional'}
                  </Text>
                  {sups.map((sup, i) => (
                    <View key={i} style={styles.supCard}>
                      <View style={styles.supTop}>
                        <Text style={styles.supEmoji}>{sup.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.supName}>{sup.name}</Text>
                          <Text style={styles.supBestForm}>{sup.bestForm}</Text>
                        </View>
                        <Text style={styles.supDosage}>{sup.dosage}</Text>
                      </View>

                      <Text style={styles.supWhat}>{sup.whatItDoes}</Text>

                      <View style={styles.supMetaRow}>
                        <View style={styles.supConcernsWrap}>
                          <Text style={styles.supMetaLabel}>BEST FOR</Text>
                          <View style={styles.supConcerns}>
                            {sup.bestFor.map((c, j) => (
                              <View key={j} style={styles.supConcernChip}>
                                <Text style={styles.supConcernText}>{c}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>

                      {sup.foodSources.length > 0 && (
                        <View style={styles.foodSourcesRow}>
                          <Text style={styles.supMetaLabel}>FOOD SOURCES</Text>
                          <Text style={styles.foodSourcesText}>{sup.foodSources.join(' · ')}</Text>
                        </View>
                      )}

                      <View style={styles.synergyRow}>
                        <Ionicons name="git-merge-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.synergyText}>{sup.synergy}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}

            {/* Ancestral note */}
            <Pressable style={styles.ancestralCard} onPress={() => router.push('/product')}>
              <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <Text style={styles.ancestralEmoji}>🥩</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.ancestralTitle}>The Ancestral Advantage</Text>
                <Text style={styles.ancestralText}>{guide.ancestralNote}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
            </Pressable>

            {/* Caution */}
            <View style={styles.cautionCard}>
              <Ionicons name="information-circle-outline" size={18} color={colors.gold} />
              <Text style={styles.cautionText}>{guide.caution}</Text>
            </View>

            {/* Diet link */}
            <Pressable style={styles.dietLink} onPress={() => router.push('/diet')}>
              <LinearGradient colors={['rgba(196,98,45,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />
              <Ionicons name="restaurant-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.dietLinkTitle}>See the Full Diet Guide</Text>
                <Text style={styles.dietLinkSub}>Foods, nutrients, and meal plans for your skin type</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
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
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  loadingCard: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 40, alignItems: 'center', gap: 14 },
  loadingText: { fontSize: 14, color: c.textSecondary },

  introCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 14, marginBottom: 14 },
  introEmoji: { fontSize: 28 },
  introTitle: { fontSize: 14, fontWeight: '700', color: c.textPrimary },
  introSub: { fontSize: 12, color: c.textMuted, marginTop: 2 },

  topPickCard: { borderRadius: 16, overflow: 'hidden', padding: 18, gap: 10, marginBottom: 20 },
  topPickBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  topPickBadgeText: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 1 },
  topPickText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 22 },

  section: { marginBottom: 16 },
  priorityLabel: { fontSize: 13, fontWeight: '800', marginBottom: 10 },

  supCard: { backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 14, gap: 8, marginBottom: 10 },
  supTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  supEmoji: { fontSize: 24, width: 32, textAlign: 'center' },
  supName: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  supBestForm: { fontSize: 11, color: c.primary, fontWeight: '600', marginTop: 2 },
  supDosage: { fontSize: 11, color: c.textMuted, fontWeight: '600' },
  supWhat: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  supMetaRow: {},
  supConcernsWrap: { gap: 6 },
  supMetaLabel: { fontSize: 9, fontWeight: '800', color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  supConcerns: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  supConcernChip: { backgroundColor: 'rgba(196,98,45,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)' },
  supConcernText: { fontSize: 11, color: c.primary, fontWeight: '600' },

  foodSourcesRow: { gap: 4 },
  foodSourcesText: { fontSize: 12, color: c.textMuted },

  synergyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  synergyText: { flex: 1, fontSize: 11, color: c.textMuted, lineHeight: 17 },

  ancestralCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 16, overflow: 'hidden', padding: 16, marginBottom: 14 },
  ancestralEmoji: { fontSize: 26 },
  ancestralTitle: { fontSize: 13, fontWeight: '700', color: c.white, marginBottom: 4 },
  ancestralText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },

  cautionCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(212,169,106,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,169,106,0.2)', padding: 12, marginBottom: 14 },
  cautionText: { flex: 1, fontSize: 12, color: c.textMuted, lineHeight: 18 },

  dietLink: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 14, marginBottom: 14 },
  dietLinkTitle: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
  dietLinkSub: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  });
}
