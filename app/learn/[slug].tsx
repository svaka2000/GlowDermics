import { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { ARTICLES, Article } from '../../src/data/articles';
import { Storage } from '../../src/services/storage';

function tagColors(c: Palette): Record<string, string> {
  return {
    'SKIN SCIENCE': c.scoreGood,
    'INGREDIENTS': c.hydration,
    'GUIDE': c.primary,
    'PHILOSOPHY': c.gold,
    'SKIN TYPE': c.darkCircles,
    'TIMELINE': c.evenness,
    'HISTORY': c.firmness,
    'PROTECTION': c.barrierHealth,
  };
}

export default function ArticleDetail() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    const found = ARTICLES.find(a => a.slug === slug);
    setArticle(found || null);
    if (slug) Storage.markArticleRead(slug);
  }, [slug]);

  if (!article) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
        </SafeAreaView>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Article not found</Text>
        </View>
      </View>
    );
  }

  const tagColor = tagColors(colors)[article.tag] || colors.primary;
  const relatedArticles = ARTICLES.filter(a => a.slug !== article.slug && (a.tag === article.tag || a.editorialAngle)).slice(0, 2);

  return (
    <View style={styles.root}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${readProgress}%` as any }]} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={50}
        onScroll={(e) => {
          const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
          const progress = (contentOffset.y / (contentSize.height - layoutMeasurement.height)) * 100;
          setReadProgress(Math.min(100, Math.max(0, progress)));
        }}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient
            colors={['rgba(10,10,15,0)', colors.bg]}
            style={styles.heroFade}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          />
          <SafeAreaView edges={['top']}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtnHero} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
          </SafeAreaView>
          <View style={styles.heroContent}>
            <Text style={styles.heroEmoji}>{article.hero}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Tag + meta */}
          <View style={styles.metaRow}>
            <View style={[styles.tagPill, { backgroundColor: tagColor + '18' }]}>
              <Text style={[styles.tagText, { color: tagColor }]}>{article.tag}</Text>
            </View>
            <View style={styles.readTimePill}>
              <Ionicons name="time-outline" size={11} color={colors.textMuted} />
              <Text style={styles.readTimeText}>{article.readTime} min read</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.subtitle}>{article.subtitle}</Text>

          <View style={styles.divider} />

          {/* Body sections */}
          {article.sections.map((section, i) => (
            <View key={i} style={styles.section}>
              {section.heading && (
                <Text style={styles.sectionHeading}>{section.heading}</Text>
              )}
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}

          {/* Key takeaways */}
          <View style={styles.takeawaysCard}>
            <LinearGradient
              colors={['rgba(138,120,96,0.12)', 'rgba(138,120,96,0.04)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.takeawaysHeader}>
              <Ionicons name="bulb-outline" size={18} color={colors.gold} />
              <Text style={styles.takeawaysTitle}>Key Takeaways</Text>
            </View>
            {article.keyTakeaways.map((item, i) => (
              <View key={i} style={styles.takeawayRow}>
                <View style={styles.takeawayDot} />
                <Text style={styles.takeawayText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Skin-barrier angle */}
          {article.editorialAngle && (
            <View style={styles.tdCard}>
              <LinearGradient
                colors={['rgba(138,120,96,0.15)', 'rgba(138,120,96,0.05)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.tdHeader}>
                <Text style={styles.tdEyebrow}>SKIN BARRIER</Text>
              </View>
              <Text style={styles.tdBody}>{article.editorialAngle}</Text>
            </View>
          )}

          {/* Related articles */}
          {relatedArticles.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>Continue Reading</Text>
              <View style={styles.relatedList}>
                {relatedArticles.map(a => (
                  <Pressable
                    key={a.slug}
                    style={styles.relatedCard}
                    onPress={() => router.push(`/learn/${a.slug}`)}
                  >
                    <Text style={styles.relatedEmoji}>{a.hero}</Text>
                    <View style={styles.relatedBody}>
                      <Text style={styles.relatedName} numberOfLines={2}>{a.title}</Text>
                      <Text style={styles.relatedMeta}>{a.readTime} min read</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Ask coach */}
          <Pressable style={styles.coachBanner} onPress={() => router.push('/(tabs)/coach')}>
            <LinearGradient
              colors={[colors.primaryDark, colors.primary]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
            <View style={styles.coachBannerInner}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.white} />
              <View>
                <Text style={styles.coachBannerTitle}>Have questions?</Text>
                <Text style={styles.coachBannerSub}>Ask your AI skin coach</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </Pressable>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  progressBar: { height: 3, backgroundColor: 'rgba(250,243,224,0.06)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  progressFill: { height: '100%', backgroundColor: c.primary },

  hero: {
    height: 220, backgroundColor: c.bgCard,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  heroFade: { ...StyleSheet.absoluteFillObject },
  backBtnHero: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.bgElevated,
    borderWidth: 1, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center',
    // SafeAreaView edges={['top']} returns 0 inset on web, so without a
    // top margin this hero back button jams against the very top edge
    // (and under the notch). marginTop matches the sibling backBtn's
    // margin:16; harmless on native where SafeAreaView already insets.
    marginLeft: 16, marginTop: 16,
  },
  backBtn: { margin: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  heroContent: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  heroEmoji: { fontSize: 72, marginTop: -20 },

  content: { paddingHorizontal: 20, paddingTop: 24 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  tagPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  readTimePill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readTimeText: { fontSize: 11, color: c.textMuted },

  title: { fontSize: 26, fontWeight: '800', color: c.textPrimary, lineHeight: 34, marginBottom: 10 },
  subtitle: { fontSize: 15, color: c.textSecondary, lineHeight: 23, marginBottom: 24 },
  divider: { height: 1, backgroundColor: c.border, marginBottom: 28 },

  section: { marginBottom: 24 },
  sectionHeading: { fontSize: 16, fontWeight: '700', color: c.textPrimary, marginBottom: 10, lineHeight: 22 },
  sectionBody: { fontSize: 15, color: c.textSecondary, lineHeight: 26 },

  takeawaysCard: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(138,120,96,0.15)',
    padding: 20, marginBottom: 20, gap: 12,
  },
  takeawaysHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  takeawaysTitle: { fontSize: 14, fontWeight: '700', color: c.gold },
  takeawayRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  takeawayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.primary, marginTop: 8 },
  takeawayText: { fontSize: 13, color: c.textSecondary, lineHeight: 20, flex: 1 },

  tdCard: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(138,120,96,0.2)',
    padding: 20, marginBottom: 20, gap: 10,
  },
  tdHeader: { marginBottom: 2 },
  tdEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: c.primary },
  tdBody: { fontSize: 14, color: c.textSecondary, lineHeight: 22 },
  tdCta: { alignSelf: 'flex-start', marginTop: 4 },
  tdCtaText: { fontSize: 13, color: c.primary, fontWeight: '600' },

  relatedSection: { marginBottom: 20 },
  relatedTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary, marginBottom: 12 },
  relatedList: { gap: 10 },
  relatedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: c.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: c.border, padding: 14,
  },
  relatedEmoji: { fontSize: 24 },
  relatedBody: { flex: 1, gap: 4 },
  relatedName: { fontSize: 13, fontWeight: '700', color: c.textPrimary, lineHeight: 18 },
  relatedMeta: { fontSize: 11, color: c.textMuted },

  coachBanner: {
    borderRadius: 18, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 18, marginBottom: 8,
  },
  coachBannerInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  coachBannerTitle: { fontSize: 15, fontWeight: '700', color: c.white },
  coachBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, color: c.textMuted },
  });
}
