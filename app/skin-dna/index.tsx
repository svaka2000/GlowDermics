import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Share,
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

const CACHE_KEY = 'gd_skin_dna';
const CACHE_TTL = 14 * 24 * 60 * 60 * 1000; // 14 days

type SkinDNA = {
  archetype: string;
  archetypeTagline: string;
  archetypeEmoji: string;
  coreTraits: string[];
  skinPersonality: string;
  optimalIngredients: { name: string; why: string }[];
  ingredientsToAvoid: { name: string; why: string }[];
  lifestyleScore: number;
  lifestyleInsight: string;
  routineBlueprint: { step: string; note: string }[];
  tallowFit: string;
  growthAreas: string[];
  uniqueStrength: string;
  shareCard: string;
};

export default function SkinDNA() {
  const [dna, setDna] = useState<SkinDNA | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [tab, setTab] = useState<'profile' | 'ingredients' | 'routine'>('profile');

  useFocusEffect(useCallback(() => {
    loadOrGenerate();
  }, []));

  const loadOrGenerate = async () => {
    const p = await Storage.getUserProfile();
    setProfile(p);
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const { dna: cached, ts } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL) {
          setDna(cached);
          return;
        }
      }
    } catch {}
    generate(p);
  };

  const generate = async (p?: any) => {
    setLoading(true);
    setError('');
    try {
      const prof = p ?? profile ?? await Storage.getUserProfile();
      const [history, readArticles, journal, routineLog] = await Promise.all([
        Storage.getScanHistory(),
        Storage.getReadArticles(),
        Storage.getJournal(),
        Storage.getFullRoutineLog(),
      ]);

      let avgHabit = 0;
      try {
        const raw = await AsyncStorage.getItem('gd_daily_habits');
        if (raw) {
          const logs = JSON.parse(raw);
          if (logs.length) avgHabit = Math.round(logs.slice(0, 7).reduce((s: number, l: any) => s + (l.checked?.length ?? 0), 0) / Math.min(logs.length, 7) / 12 * 100);
        }
      } catch {}

      const streak = routineLog.filter((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - i);
        return routineLog.find(e => e.date === d.toDateString() && (e.morning || e.evening));
      }).length;

      const latestScore = history[0]?.overallScore;
      const trendDir = history.length >= 2 ? (history[0].overallScore > history[history.length - 1].overallScore ? 'improving' : 'declining') : 'new';

      const prompt = `You are GlowDermics AI, generating a unique "Skin DNA" identity profile for a user. This should feel premium, personal, and insightful — like a dermatologist who knows them deeply.

User data:
- Name: ${prof?.name || 'Unknown'}
- Skin type: ${prof?.skinType || 'unknown'}
- Primary concerns: ${prof?.primaryConcerns?.join(', ') || 'none'}
- Skin goals: ${prof?.goals?.join(', ') || 'none'}
- Lifestyle: sleep ${prof?.lifestyle?.sleepHours ?? 7}hrs, water ${prof?.lifestyle?.waterIntake ?? 'moderate'}, diet ${prof?.lifestyle?.diet ?? 'balanced'}
- Latest skin score: ${latestScore ?? 'no scan'}
- Score trend: ${trendDir}
- Total scans: ${history.length}
- Routine streak: ${streak} days
- Daily habit score: ${avgHabit}%
- Articles read: ${readArticles.length}
- Journal entries: ${journal.length}

Generate a deeply personalized Skin DNA profile. The archetype should be a creative, memorable 2-3 word title (e.g. "The Barrier Architect", "The Glow Seeker", "The Minimal Purist", "The Ancestral Healer"). Make it feel like a premium skin personality type.

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "archetype": "<2-3 word creative skin archetype title>",
  "archetypeTagline": "<one punchy sentence that captures this skin personality>",
  "archetypeEmoji": "<1 emoji that represents this archetype>",
  "coreTraits": ["<trait 1 — e.g. 'Barrier-sensitive'>", "<trait 2>", "<trait 3>", "<trait 4>"],
  "skinPersonality": "<2-3 sentences: who this person is as a skin type, their tendencies, what drives their skin behavior — make it feel personal and true>",
  "optimalIngredients": [
    {"name": "<ingredient>", "why": "<why it's perfect for this DNA>"},
    {"name": "<ingredient>", "why": "<why>"},
    {"name": "<ingredient>", "why": "<why>"},
    {"name": "<ingredient>", "why": "<why>"}
  ],
  "ingredientsToAvoid": [
    {"name": "<ingredient to avoid>", "why": "<specific reason for this DNA>"},
    {"name": "<ingredient>", "why": "<reason>"},
    {"name": "<ingredient>", "why": "<reason>"}
  ],
  "lifestyleScore": <0-100, based on their sleep/water/diet/habits>,
  "lifestyleInsight": "<1-2 sentences on how their lifestyle is affecting their skin, honest and specific>",
  "routineBlueprint": [
    {"step": "<step name e.g. Oil Cleanse>", "note": "<why this step matters for their specific DNA>"},
    {"step": "<step>", "note": "<note>"},
    {"step": "<step>", "note": "<note>"},
    {"step": "<step>", "note": "<note>"},
    {"step": "<step>", "note": "<note>"}
  ],
  "tallowFit": "<1-2 sentences: how TallowDermics tallow specifically fits or doesn't fit this skin DNA — be honest and specific>",
  "growthAreas": ["<area where they can improve>", "<second area>", "<third area>"],
  "uniqueStrength": "<one sentence: what is genuinely working in their favor — something to feel good about>",
  "shareCard": "<one shareable quote-style text for social media, max 140 chars — e.g. 'My skin DNA says I'm The Barrier Architect 🧱 — building my barrier one tallow layer at a time. #GlowDermics'>"
}`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 1100,
      });

      const text = response.choices[0].message.content?.trim() || '';
      const json = text.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '');
      const parsed: SkinDNA = JSON.parse(json);
      setDna(parsed);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ dna: parsed, ts: Date.now() }));
    } catch (e: any) {
      setError(e?.message || 'Failed to generate your Skin DNA.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!dna) return;
    await Share.share({ message: dna.shareCard + '\n\nDiscovered with GlowDermics × TallowDermics' });
  };

  const lifecycleColor = (score: number) =>
    score >= 75 ? Colors.scoreExcellent : score >= 55 ? Colors.scoreGood : score >= 35 ? Colors.scoreFair : Colors.scorePoor;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>My Skin DNA</Text>
            <Text style={styles.headerSub}>Your unique skin identity</Text>
          </View>
          {dna ? (
            <Pressable style={styles.shareBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color={Colors.primary} />
            </Pressable>
          ) : <View style={{ width: 36 }} />}
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {loading && (
          <View style={styles.loadCard}>
            <ActivityIndicator color={Colors.primary} size="large" style={{ marginBottom: 16 }} />
            <Text style={styles.loadTitle}>Reading your skin's signature…</Text>
            <Text style={styles.loadSub}>Synthesizing scans, habits, lifestyle, and goals into your unique profile</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => generate()}>
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        ) : null}

        {!dna && !loading && !error && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🧬</Text>
            <Text style={styles.emptyTitle}>Generating your Skin DNA…</Text>
          </View>
        )}

        {dna && (
          <>
            {/* Archetype hero card */}
            <LinearGradient
              colors={[Colors.primaryDark, Colors.primary, Colors.primaryLight]}
              style={styles.heroCard}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={styles.heroEmoji}>{dna.archetypeEmoji}</Text>
              <Text style={styles.heroEyebrow}>YOUR SKIN ARCHETYPE</Text>
              <Text style={styles.heroTitle}>{dna.archetype}</Text>
              <Text style={styles.heroTagline}>{dna.archetypeTagline}</Text>
              <View style={styles.traitRow}>
                {dna.coreTraits.map(t => (
                  <View key={t} style={styles.traitChip}>
                    <Text style={styles.traitChipText}>{t}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>

            {/* Skin personality */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>SKIN PERSONALITY</Text>
              <Text style={styles.personalityText}>{dna.skinPersonality}</Text>
            </View>

            {/* Lifestyle score */}
            <View style={styles.lifestyleCard}>
              <View style={styles.lifestyleLeft}>
                <Text style={styles.lifestyleLabel}>LIFESTYLE IMPACT</Text>
                <Text style={[styles.lifestyleScore, { color: lifecycleColor(dna.lifestyleScore) }]}>
                  {dna.lifestyleScore}<Text style={styles.lifestyleOf}>/100</Text>
                </Text>
              </View>
              <View style={styles.lifestyleRight}>
                <Text style={styles.lifestyleInsight}>{dna.lifestyleInsight}</Text>
              </View>
            </View>

            {/* Unique strength */}
            <View style={styles.strengthCard}>
              <LinearGradient colors={['rgba(74,222,128,0.12)', 'rgba(74,222,128,0.04)']} style={StyleSheet.absoluteFill} />
              <Ionicons name="star-outline" size={16} color={Colors.scoreExcellent} />
              <Text style={styles.strengthText}>{dna.uniqueStrength}</Text>
            </View>

            {/* Tab bar */}
            <View style={styles.tabBar}>
              {(['profile', 'ingredients', 'routine'] as const).map(t => (
                <Pressable key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
                  <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                    {t === 'profile' ? 'Growth' : t === 'ingredients' ? 'Ingredients' : 'Routine'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Profile tab */}
            {tab === 'profile' && (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Growth Areas</Text>
                  {dna.growthAreas.map((g, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Ionicons name="chevron-up-circle-outline" size={16} color={Colors.primary} />
                      <Text style={styles.bulletText}>{g}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.tallowCard}>
                  <LinearGradient colors={['rgba(196,98,45,0.18)', 'rgba(196,98,45,0.05)']} style={StyleSheet.absoluteFill} />
                  <Text style={styles.tallowEmoji}>🌿</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tallowTitle}>TallowDermics Fit</Text>
                    <Text style={styles.tallowText}>{dna.tallowFit}</Text>
                  </View>
                </View>
              </>
            )}

            {/* Ingredients tab */}
            {tab === 'ingredients' && (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Your Optimal Ingredients</Text>
                  <Text style={styles.cardSub}>Seek these out in your products</Text>
                  {dna.optimalIngredients.map((ing, i) => (
                    <Pressable
                      key={i}
                      style={styles.ingRow}
                      onPress={() => router.push(`/ingredient/${encodeURIComponent(ing.name)}`)}
                    >
                      <Ionicons name="checkmark-circle" size={18} color={Colors.scoreExcellent} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ingName}>{ing.name}</Text>
                        <Text style={styles.ingWhy}>{ing.why}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={12} color={Colors.textMuted} />
                    </Pressable>
                  ))}
                </View>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Your Kryptonite</Text>
                  <Text style={styles.cardSub}>Avoid or minimize for your DNA</Text>
                  {dna.ingredientsToAvoid.map((ing, i) => (
                    <Pressable
                      key={i}
                      style={styles.ingRow}
                      onPress={() => router.push(`/ingredient/${encodeURIComponent(ing.name)}`)}
                    >
                      <Ionicons name="close-circle" size={18} color={Colors.scorePoor} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ingName}>{ing.name}</Text>
                        <Text style={styles.ingWhy}>{ing.why}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={12} color={Colors.textMuted} />
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {/* Routine tab */}
            {tab === 'routine' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Your DNA Routine Blueprint</Text>
                <Text style={styles.cardSub}>Optimized for your skin identity</Text>
                {dna.routineBlueprint.map((step, i) => (
                  <View key={i} style={styles.blueprintStep}>
                    <View style={styles.blueprintNum}>
                      <Text style={styles.blueprintNumText}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.blueprintStepName}>{step.step}</Text>
                      <Text style={styles.blueprintNote}>{step.note}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Regenerate */}
            <Pressable style={styles.regenBtn} onPress={() => generate()}>
              <Ionicons name="refresh-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.regenText}>Regenerate profile</Text>
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
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  shareBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(196,98,45,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  loadCard: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  loadTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  loadSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', maxWidth: 280, lineHeight: 20 },
  errorCard: { alignItems: 'center', padding: 24, gap: 12 },
  errorText: { fontSize: 13, color: Colors.scorePoor, textAlign: 'center' },
  retryBtn: { borderRadius: 12, borderWidth: 1, borderColor: Colors.borderStrong, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  emptyCard: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },

  heroCard: {
    borderRadius: 22, padding: 28, marginBottom: 14, gap: 10,
    alignItems: 'center',
  },
  heroEmoji: { fontSize: 52, marginBottom: 4 },
  heroEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 2, color: 'rgba(255,255,255,0.65)' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: Colors.white, textAlign: 'center', letterSpacing: -0.5 },
  heroTagline: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 21, maxWidth: 280 },
  traitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 },
  traitChip: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  traitChipText: { fontSize: 11, fontWeight: '700', color: Colors.white },

  card: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12, marginBottom: 12 },
  cardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Colors.textMuted },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardSub: { fontSize: 11, color: Colors.textMuted, marginTop: -6 },
  personalityText: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24, fontStyle: 'italic' },

  lifestyleCard: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 16, marginBottom: 12 },
  lifestyleLeft: { alignItems: 'center', gap: 4 },
  lifestyleLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1.5, color: Colors.textMuted },
  lifestyleScore: { fontSize: 34, fontWeight: '800' },
  lifestyleOf: { fontSize: 16, fontWeight: '400', color: Colors.textMuted },
  lifestyleRight: { flex: 1, justifyContent: 'center' },
  lifestyleInsight: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  strengthCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', padding: 14, marginBottom: 12 },
  strengthText: { flex: 1, fontSize: 14, color: Colors.textPrimary, lineHeight: 21, fontWeight: '500' },

  tabBar: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 14, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: Colors.bgElevated },
  tabLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  tabLabelActive: { color: Colors.textPrimary },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },

  tallowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 16, marginBottom: 12 },
  tallowEmoji: { fontSize: 24 },
  tallowTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  tallowText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },

  ingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ingName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  ingWhy: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },

  blueprintStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  blueprintNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(196,98,45,0.12)', alignItems: 'center', justifyContent: 'center' },
  blueprintNumText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  blueprintStepName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  blueprintNote: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  regenBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  regenText: { fontSize: 13, color: Colors.textMuted },
});
