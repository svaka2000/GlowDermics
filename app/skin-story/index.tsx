import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Share,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '', dangerouslyAllowBrowser: true });
const CACHE_KEY = 'gd_skin_story';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

type SkylightMoment = {
  label: string;
  value: string;
  emoji: string;
};

type SkinStory = {
  headline: string;
  openingLine: string;
  chapters: { title: string; paragraph: string }[];
  biggestWin: string;
  currentChapter: string;
  nextChapter: string;
  tallowMoment: string;
  socialCaption: string;
  highlights: SkylightMoment[];
  ts: number;
};

export default function SkinStoryPage() {
  const [story, setStory] = useState<SkinStory | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useFocusEffect(useCallback(() => {
    loadStory();
  }, []));

  const loadStory = async () => {
    const [history, profile, journal, routineLog, articles] = await Promise.all([
      Storage.getScanHistory(),
      Storage.getUserProfile(),
      Storage.getJournal(),
      Storage.getFullRoutineLog(),
      Storage.getReadArticles(),
    ]);

    const dnaRaw = await AsyncStorage.getItem('gd_skin_dna');
    const dna = dnaRaw ? JSON.parse(dnaRaw) : null;

    const oldestScan = history[history.length - 1];
    const latestScan = history[0];
    const bestScore = history.length ? Math.max(...history.map(h => h.overallScore)) : 0;
    const daysTracking = oldestScan
      ? Math.ceil((Date.now() - new Date(oldestScan.date).getTime()) / 86400000)
      : 0;
    const routineDays = routineLog.filter(r => r.morning || r.evening).length;
    const scoreImprovement = history.length >= 2
      ? latestScan.overallScore - oldestScan.overallScore
      : 0;

    const computed = {
      scanCount: history.length,
      daysTracking,
      latestScore: latestScan?.overallScore ?? null,
      firstScore: oldestScan?.overallScore ?? null,
      bestScore,
      scoreImprovement,
      skinType: profile?.skinType ?? 'unknown',
      concerns: profile?.primaryConcerns ?? [],
      name: profile?.name ?? 'there',
      journalCount: journal.length,
      routineDays,
      articlesRead: articles.length,
      archetype: dna?.archetype ?? null,
      dnaTagline: dna?.tagline ?? null,
    };
    setStats(computed);

    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: SkinStory = JSON.parse(cached);
      if (Date.now() - parsed.ts < CACHE_TTL) {
        setStory(parsed);
        return;
      }
    }

    if (computed.scanCount === 0) return;
    await generate(computed);
  };

  const generate = async (s: any) => {
    setLoading(true);
    try {
      const prompt = `You are a personal skin coach writing a user's "Skin Story" — a narrative of their skincare journey so far.

User data:
- Name: ${s.name}
- Skin type: ${s.skinType}
- Concerns: ${s.concerns.join(', ') || 'general health'}
- Skin archetype: ${s.archetype || 'not yet determined'}
- Days tracking: ${s.daysTracking}
- Total scans: ${s.scanCount}
- First score: ${s.firstScore ?? 'N/A'}
- Latest score: ${s.latestScore ?? 'N/A'}
- Best ever score: ${s.bestScore}
- Score improvement: ${s.scoreImprovement > 0 ? '+' + s.scoreImprovement : s.scoreImprovement} points
- Routine days logged: ${s.routineDays}
- Journal entries: ${s.journalCount}
- Articles read: ${s.articlesRead}

Write an inspiring but honest narrative of this person's skin journey. Reference actual data points. Keep it personal, warm, and motivating.

Return ONLY valid JSON (no markdown):
{
  "headline": "<5-7 word powerful headline for their story — their skin journey in a nutshell>",
  "openingLine": "<1 compelling opening sentence about their journey>",
  "chapters": [
    { "title": "<chapter title e.g. 'The Beginning'>", "paragraph": "<2-3 sentences narrating this phase of their journey>" },
    { "title": "<chapter title e.g. 'Building Consistency'>", "paragraph": "<2-3 sentences>" },
    { "title": "<chapter title e.g. 'Where They Are Now'>", "paragraph": "<2-3 sentences about current state and momentum>" }
  ],
  "biggestWin": "<their single biggest achievement in this journey — be specific with numbers>",
  "currentChapter": "<1 sentence on where they are right now in their journey>",
  "nextChapter": "<1 sentence on what comes next — what they should be building toward>",
  "tallowMoment": "<1 sentence connecting their journey to ancestral/tallow-based skincare philosophy>",
  "socialCaption": "<a short, shareable Instagram-style caption for their journey — 2-3 sentences, include relevant emojis>",
  "highlights": [
    { "label": "Days tracking", "value": "${s.daysTracking}", "emoji": "📅" },
    { "label": "Scans taken", "value": "${s.scanCount}", "emoji": "📸" },
    { "label": "Best score", "value": "${s.bestScore}/100", "emoji": "🌟" },
    { "label": "Score change", "value": "${s.scoreImprovement > 0 ? '+' : ''}${s.scoreImprovement} pts", "emoji": "${s.scoreImprovement >= 0 ? '📈' : '📉'}" }
  ]
}`;

      const resp = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.75,
        max_tokens: 1200,
      });

      const text = resp.choices[0].message.content ?? '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('no json');
      const parsed: SkinStory = { ...JSON.parse(match[0]), ts: Date.now() };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      setStory(parsed);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!story) return;
    await Share.share({
      message: [
        story.socialCaption,
        '',
        `📊 My Skin Journey Stats:`,
        ...story.highlights.map(h => `${h.emoji} ${h.label}: ${h.value}`),
        '',
        `🌿 ${story.tallowMoment}`,
        '',
        '— Tracked with GlowDermics × TallowDermics',
        'trytallowdermics.com',
      ].join('\n'),
    });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>My Skin Story</Text>
            <Text style={styles.headerSub}>Your journey so far</Text>
          </View>
          {story ? (
            <Pressable style={styles.backBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={20} color={Colors.primary} />
            </Pressable>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {loading && (
          <View style={styles.loadingCard}>
            <LinearGradient colors={['rgba(196,98,45,0.12)', 'rgba(196,98,45,0.02)']} style={StyleSheet.absoluteFill} />
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.loadingTitle}>Writing your story...</Text>
            <Text style={styles.loadingSub}>Analyzing your skin journey</Text>
          </View>
        )}

        {!loading && !story && stats?.scanCount === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📖</Text>
            <Text style={styles.emptyTitle}>Your story hasn't started yet</Text>
            <Text style={styles.emptySub}>Take your first skin scan to begin your GlowDermics journey.</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/scan')}>
              <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={StyleSheet.absoluteFill} />
              <Text style={styles.emptyBtnText}>Take First Scan</Text>
            </Pressable>
          </View>
        )}

        {story && !loading && (
          <>
            {/* Hero gradient card */}
            <View style={styles.heroCard}>
              <LinearGradient
                colors={[Colors.primaryDark, Colors.primary, '#D4A96A']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={styles.heroLabel}>MY SKIN STORY</Text>
              <Text style={styles.heroHeadline}>{story.headline}</Text>
              <Text style={styles.heroOpening}>{story.openingLine}</Text>
            </View>

            {/* Stats highlights */}
            <View style={styles.highlightsRow}>
              {story.highlights.map((h, i) => (
                <View key={i} style={styles.highlightCard}>
                  <Text style={styles.highlightEmoji}>{h.emoji}</Text>
                  <Text style={styles.highlightValue}>{h.value}</Text>
                  <Text style={styles.highlightLabel}>{h.label}</Text>
                </View>
              ))}
            </View>

            {/* Chapters */}
            <View style={styles.chaptersCard}>
              {story.chapters.map((ch, i) => (
                <View key={i} style={[styles.chapter, i < story.chapters.length - 1 && styles.chapterBorder]}>
                  <View style={styles.chapterNum}>
                    <Text style={styles.chapterNumText}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.chapterTitle}>{ch.title}</Text>
                    <Text style={styles.chapterParagraph}>{ch.paragraph}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Biggest win */}
            <View style={styles.winCard}>
              <LinearGradient colors={['rgba(74,222,128,0.12)', 'rgba(74,222,128,0.03)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.winLabel}>BIGGEST WIN</Text>
              <Text style={styles.winText}>🏆 {story.biggestWin}</Text>
            </View>

            {/* Current + Next chapter */}
            <View style={styles.chapterStatusCard}>
              <View style={styles.chapterStatusItem}>
                <Text style={styles.chapterStatusLabel}>WHERE YOU ARE NOW</Text>
                <Text style={styles.chapterStatusText}>{story.currentChapter}</Text>
              </View>
              <View style={[styles.chapterStatusItem, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 14 }]}>
                <Text style={[styles.chapterStatusLabel, { color: Colors.primary }]}>WHAT'S NEXT</Text>
                <Text style={styles.chapterStatusText}>{story.nextChapter}</Text>
              </View>
            </View>

            {/* Tallow moment */}
            <Pressable style={styles.tallowCard} onPress={() => router.push('/product')}>
              <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <Text style={styles.tallowEmoji}>🌿</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.tallowLabel}>THE ANCESTRAL CONNECTION</Text>
                <Text style={styles.tallowText}>{story.tallowMoment}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.6)" />
            </Pressable>

            {/* Social caption preview */}
            <View style={styles.captionCard}>
              <View style={styles.captionHeader}>
                <Ionicons name="logo-instagram" size={18} color={Colors.textMuted} />
                <Text style={styles.captionLabel}>Share-Ready Caption</Text>
              </View>
              <Text style={styles.captionText}>{story.socialCaption}</Text>
              <Pressable style={styles.shareBtn} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={16} color={Colors.primary} />
                <Text style={styles.shareBtnText}>Share My Story</Text>
              </Pressable>
            </View>

            {/* Regenerate */}
            <Pressable
              style={styles.regenBtn}
              onPress={() => { AsyncStorage.removeItem(CACHE_KEY); stats && generate(stats); }}
            >
              <Ionicons name="refresh-outline" size={15} color={Colors.textMuted} />
              <Text style={styles.regenText}>Regenerate story</Text>
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  loadingCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 40, alignItems: 'center', gap: 14, marginBottom: 14 },
  loadingTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  loadingSub: { fontSize: 13, color: Colors.textMuted },

  emptyCard: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  emptyBtn: { height: 50, borderRadius: 14, overflow: 'hidden', paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },

  heroCard: { borderRadius: 24, overflow: 'hidden', padding: 28, gap: 10, marginBottom: 14, minHeight: 200, justifyContent: 'flex-end' },
  heroLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 2, textTransform: 'uppercase' },
  heroHeadline: { fontSize: 26, fontWeight: '900', color: Colors.white, lineHeight: 32 },
  heroOpening: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 22, marginTop: 4 },

  highlightsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  highlightCard: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center', gap: 3 },
  highlightEmoji: { fontSize: 20 },
  highlightValue: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  highlightLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '600', textAlign: 'center', lineHeight: 13 },

  chaptersCard: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 0, marginBottom: 14 },
  chapter: { flexDirection: 'row', gap: 14, paddingBottom: 16 },
  chapterBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 16 },
  chapterNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(196,98,45,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(196,98,45,0.3)', marginTop: 2 },
  chapterNumText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  chapterTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  chapterParagraph: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  winCard: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', padding: 16, gap: 6, marginBottom: 14 },
  winLabel: { fontSize: 9, fontWeight: '800', color: '#4ADE80', letterSpacing: 1.5, textTransform: 'uppercase' },
  winText: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, lineHeight: 22 },

  chapterStatusCard: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 0, marginBottom: 14 },
  chapterStatusItem: { gap: 6, paddingBottom: 14 },
  chapterStatusLabel: { fontSize: 9, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
  chapterStatusText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  tallowCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 16, overflow: 'hidden', padding: 16, marginBottom: 14 },
  tallowEmoji: { fontSize: 24 },
  tallowLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  tallowText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },

  captionCard: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12, marginBottom: 14 },
  captionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  captionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  captionText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 22, fontStyle: 'italic' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(196,98,45,0.3)', paddingVertical: 10, backgroundColor: 'rgba(196,98,45,0.08)' },
  shareBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  regenBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  regenText: { fontSize: 12, color: Colors.textMuted },
});
