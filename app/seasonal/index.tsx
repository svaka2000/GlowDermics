import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Groq from 'groq-sdk';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

const CACHE_KEY = 'gd_seasonal_guide';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCurrentSeason(): { season: string; emoji: string; months: string; color: string; bg: string } {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return { season: 'Spring', emoji: '🌸', months: 'Mar – May', color: '#4ADE80', bg: 'rgba(74,222,128,0.10)' };
  if (month >= 5 && month <= 7) return { season: 'Summer', emoji: '☀️', months: 'Jun – Aug', color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' };
  if (month >= 8 && month <= 10) return { season: 'Autumn', emoji: '🍂', months: 'Sep – Nov', color: '#C4622D', bg: 'rgba(196,98,45,0.12)' };
  return { season: 'Winter', emoji: '❄️', months: 'Dec – Feb', color: '#60A5FA', bg: 'rgba(96,165,250,0.10)' };
}

type SeasonalGuide = {
  headline: string;
  overview: string;
  keyChanges: string[];
  morningRoutineAdjustments: { step: string; why: string }[];
  eveningRoutineAdjustments: { step: string; why: string }[];
  ingredientsToAdd: { name: string; reason: string }[];
  ingredientsToReduce: { name: string; reason: string }[];
  lifestyleTips: string[];
  tallowNote: string;
  watchOutFor: string[];
};

export default function Seasonal() {
  const [guide, setGuide] = useState<SeasonalGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'routine' | 'ingredients' | 'lifestyle'>('routine');

  const season = getCurrentSeason();

  useFocusEffect(useCallback(() => {
    loadGuide();
  }, []));

  const loadGuide = async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const { guide: cached, timestamp, season: cachedSeason } = JSON.parse(raw);
        const age = Date.now() - timestamp;
        if (age < CACHE_TTL_MS && cachedSeason === season.season) {
          setGuide(cached);
          return;
        }
      }
    } catch {}
    generate();
  };

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const profile = await Storage.getUserProfile();
      const history = await Storage.getScanHistory();
      const latest = history[0];

      const prompt = `You are GlowDermics AI, an expert skincare coach for TallowDermics — an ancestral, minimal skincare brand using grass-fed tallow, manuka honey, olive oil, and calendula.

Current season: ${season.season} (${season.months})
User skin type: ${profile?.skinType || 'not specified'}
User concerns: ${profile?.primaryConcerns?.join(', ') || 'none listed'}
User goals: ${profile?.goals?.join(', ') || 'none listed'}
Latest skin score: ${latest?.overallScore ?? 'no scan yet'}/100
Lifestyle: sleep ${profile?.lifestyle?.sleepHours ?? 7}hrs, water ${profile?.lifestyle?.waterIntake ?? 'moderate'}, diet ${profile?.lifestyle?.diet ?? 'balanced'}

Generate a comprehensive seasonal skincare guide for ${season.season}. Focus on practical, science-backed adjustments. Mention tallow/TallowDermics where relevant and natural.

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "headline": "<punchy seasonal headline, e.g. 'Winter is stripping your barrier — here's the fix'>",
  "overview": "<3-4 sentence overview of how ${season.season} affects skin and what to do about it>",
  "keyChanges": ["<top 4 key skin changes that happen in ${season.season}>"],
  "morningRoutineAdjustments": [
    {"step": "<routine adjustment for morning>", "why": "<why it matters this season>"},
    {"step": "<another morning adjustment>", "why": "<reason>"},
    {"step": "<third morning adjustment>", "why": "<reason>"}
  ],
  "eveningRoutineAdjustments": [
    {"step": "<evening routine adjustment>", "why": "<reason>"},
    {"step": "<another evening adjustment>", "why": "<reason>"},
    {"step": "<third evening adjustment>", "why": "<reason>"}
  ],
  "ingredientsToAdd": [
    {"name": "<ingredient to add or increase>", "reason": "<why this season>"},
    {"name": "<another ingredient>", "reason": "<reason>"},
    {"name": "<third ingredient>", "reason": "<reason>"}
  ],
  "ingredientsToReduce": [
    {"name": "<ingredient to cut back on>", "reason": "<why this season>"},
    {"name": "<another to reduce>", "reason": "<reason>"}
  ],
  "lifestyleTips": ["<lifestyle tip for skin in ${season.season}>", "<second lifestyle tip>", "<third tip>", "<fourth tip>"],
  "tallowNote": "<specific advice on how TallowDermics tallow balm fits this season — e.g. heavier application in winter, lighter in summer>",
  "watchOutFor": ["<seasonal skin risk 1>", "<risk 2>", "<risk 3>"]
}`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1100,
      });

      const text = response.choices[0].message.content?.trim() || '';
      const json = text.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '');
      const parsed: SeasonalGuide = JSON.parse(json);
      setGuide(parsed);

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        guide: parsed,
        timestamp: Date.now(),
        season: season.season,
      }));
    } catch (e: any) {
      setError(e?.message || 'Failed to generate guide.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>{season.emoji} {season.season} Guide</Text>
            <Text style={styles.headerSub}>Seasonal skincare adjustments</Text>
          </View>
          <Pressable style={styles.reloadBtn} onPress={generate}>
            <Ionicons name="refresh-outline" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Season hero */}
        <View style={[styles.heroCard, { borderColor: season.color + '40', backgroundColor: season.bg }]}>
          <Text style={styles.heroEmoji}>{season.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroSeason, { color: season.color }]}>{season.season.toUpperCase()} {new Date().getFullYear()}</Text>
            <Text style={styles.heroMonths}>{season.months}</Text>
          </View>
          <View style={[styles.heroBadge, { backgroundColor: season.color + '20' }]}>
            <Text style={[styles.heroBadgeText, { color: season.color }]}>NOW</Text>
          </View>
        </View>

        {loading && (
          <View style={styles.loadCard}>
            <ActivityIndicator color={Colors.primary} size="large" style={{ marginBottom: 14 }} />
            <Text style={styles.loadTitle}>Generating your {season.season} guide…</Text>
            <Text style={styles.loadSub}>Personalizing to your skin type and goals</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={generate}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {guide && (
          <>
            {/* Headline */}
            <View style={styles.headlineCard}>
              <LinearGradient
                colors={[season.color + '18', season.color + '06']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <Text style={[styles.headline, { color: season.color }]}>{guide.headline}</Text>
              <Text style={styles.overview}>{guide.overview}</Text>
            </View>

            {/* Key changes */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>What Changes in {season.season}</Text>
              {guide.keyChanges.map((c, i) => (
                <View key={i} style={styles.changeRow}>
                  <View style={[styles.changeDot, { backgroundColor: season.color }]} />
                  <Text style={styles.changeText}>{c}</Text>
                </View>
              ))}
            </View>

            {/* Watch out for */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⚠ Watch Out For</Text>
              {guide.watchOutFor.map((w, i) => (
                <View key={i} style={styles.warnRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={Colors.scoreFair} />
                  <Text style={styles.warnText}>{w}</Text>
                </View>
              ))}
            </View>

            {/* Tab bar */}
            <View style={styles.tabBar}>
              {(['routine', 'ingredients', 'lifestyle'] as const).map(t => (
                <Pressable
                  key={t}
                  style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                  onPress={() => setTab(t)}
                >
                  <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                    {t === 'routine' ? 'Routine' : t === 'ingredients' ? 'Ingredients' : 'Lifestyle'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Routine tab */}
            {tab === 'routine' && (
              <>
                <View style={styles.card}>
                  <View style={styles.routineHeader}>
                    <Ionicons name="sunny-outline" size={16} color={Colors.gold} />
                    <Text style={styles.cardTitle}>Morning Adjustments</Text>
                  </View>
                  {guide.morningRoutineAdjustments.map((a, i) => (
                    <View key={i} style={styles.adjustRow}>
                      <View style={styles.adjustNum}>
                        <Text style={styles.adjustNumText}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.adjustStep}>{a.step}</Text>
                        <Text style={styles.adjustWhy}>{a.why}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.card}>
                  <View style={styles.routineHeader}>
                    <Ionicons name="moon-outline" size={16} color="#A78BFA" />
                    <Text style={styles.cardTitle}>Evening Adjustments</Text>
                  </View>
                  {guide.eveningRoutineAdjustments.map((a, i) => (
                    <View key={i} style={styles.adjustRow}>
                      <View style={[styles.adjustNum, { backgroundColor: 'rgba(167,139,250,0.15)' }]}>
                        <Text style={[styles.adjustNumText, { color: '#A78BFA' }]}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.adjustStep}>{a.step}</Text>
                        <Text style={styles.adjustWhy}>{a.why}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Ingredients tab */}
            {tab === 'ingredients' && (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Add or Increase</Text>
                  {guide.ingredientsToAdd.map((ing, i) => (
                    <Pressable
                      key={i}
                      style={styles.ingRow}
                      onPress={() => router.push(`/ingredient/${encodeURIComponent(ing.name)}`)}
                    >
                      <View style={styles.ingIconWrap}>
                        <Ionicons name="add-circle" size={18} color={Colors.scoreExcellent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ingName}>{ing.name}</Text>
                        <Text style={styles.ingReason}>{ing.reason}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
                    </Pressable>
                  ))}
                </View>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Reduce or Skip</Text>
                  {guide.ingredientsToReduce.map((ing, i) => (
                    <Pressable
                      key={i}
                      style={styles.ingRow}
                      onPress={() => router.push(`/ingredient/${encodeURIComponent(ing.name)}`)}
                    >
                      <View style={styles.ingIconWrap}>
                        <Ionicons name="remove-circle" size={18} color={Colors.scorePoor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ingName}>{ing.name}</Text>
                        <Text style={styles.ingReason}>{ing.reason}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {/* Lifestyle tab */}
            {tab === 'lifestyle' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Lifestyle Tips for {season.season}</Text>
                {guide.lifestyleTips.map((tip, i) => (
                  <View key={i} style={styles.lifestyleTipRow}>
                    <Ionicons name="leaf-outline" size={14} color={season.color} />
                    <Text style={styles.lifestyleTipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* TallowDermics note */}
            <Pressable style={styles.tallowCard} onPress={() => router.push('/product')}>
              <LinearGradient colors={['rgba(196,98,45,0.18)', 'rgba(196,98,45,0.06)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.tallowEmoji}>🌿</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.tallowTitle}>TallowDermics This {season.season}</Text>
                <Text style={styles.tallowText}>{guide.tallowNote}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </Pressable>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  reloadBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  heroCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16,
  },
  heroEmoji: { fontSize: 32 },
  heroSeason: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  heroMonths: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  heroBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  heroBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  loadCard: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  loadTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  loadSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },

  errorCard: { alignItems: 'center', padding: 24, gap: 12 },
  errorText: { fontSize: 13, color: Colors.scorePoor, textAlign: 'center' },
  retryBtn: { borderRadius: 12, borderWidth: 1, borderColor: Colors.borderStrong, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  headlineCard: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)',
    padding: 20, gap: 12, marginBottom: 14,
  },
  headline: { fontSize: 20, fontWeight: '800', lineHeight: 27 },
  overview: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 12, marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  changeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  changeDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  changeText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  warnRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  warnText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 14,
    padding: 4, marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: Colors.bgElevated },
  tabLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  tabLabelActive: { color: Colors.textPrimary },

  routineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  adjustRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 4 },
  adjustNum: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(196,98,45,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  adjustNumText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  adjustStep: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 3, lineHeight: 20 },
  adjustWhy: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  ingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ingIconWrap: { width: 28, alignItems: 'center' },
  ingName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  ingReason: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },

  lifestyleTipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  lifestyleTipText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  tallowCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)',
    padding: 16, marginTop: 4, marginBottom: 14,
  },
  tallowEmoji: { fontSize: 24 },
  tallowTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  tallowText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
});
