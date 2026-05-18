import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { ARTICLES } from '../../src/data/articles';

const TAGS = ['ALL', 'SKIN SCIENCE', 'INGREDIENTS', 'GUIDE', 'PHILOSOPHY', 'SKIN TYPE', 'TIMELINE', 'HISTORY', 'PROTECTION'];

const TAG_COLORS: Record<string, string> = {
  'SKIN SCIENCE': '#4ADE80',
  'INGREDIENTS': '#60A5FA',
  'GUIDE': '#8A7860',
  'PHILOSOPHY': '#B79B6E',
  'SKIN TYPE': '#6B85A8',
  'TIMELINE': '#F59E0B',
  'HISTORY': '#FB923C',
  'PROTECTION': '#38BDF8',
};

export default function Learn() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('ALL');

  const filtered = ARTICLES.filter(a => {
    const matchesTag = activeTag === 'ALL' || a.tag === activeTag;
    const matchesSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.subtitle.toLowerCase().includes(search.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const featured = ARTICLES[0];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>Skin Lab</Text>
            <Text style={styles.headerSub}>Evidence-based skin science</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search articles..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Featured article */}
        {!search && activeTag === 'ALL' && (
          <Pressable style={styles.featured} onPress={() => router.push(`/learn/${featured.slug}`)}>
            <LinearGradient
              colors={['rgba(138,120,96,0.18)', 'rgba(138,120,96,0.06)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>FEATURED</Text>
            </View>
            <Text style={styles.featuredHero}>{featured.hero}</Text>
            <View style={styles.tagPill}>
              <Text style={[styles.tagPillText, { color: TAG_COLORS[featured.tag] || colors.primary }]}>{featured.tag}</Text>
            </View>
            <Text style={styles.featuredTitle}>{featured.title}</Text>
            <Text style={styles.featuredSubtitle}>{featured.subtitle}</Text>
            <View style={styles.featuredMeta}>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <Text style={styles.metaText}>{featured.readTime} min read</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{featured.keyTakeaways.length} takeaways</Text>
            </View>
          </Pressable>
        )}

        {/* Tag filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll} contentContainerStyle={styles.tagScrollContent}>
          {TAGS.map(tag => (
            <Pressable
              key={tag}
              style={[styles.tagChip, activeTag === tag && styles.tagChipActive]}
              onPress={() => setActiveTag(tag)}
            >
              <Text style={[styles.tagChipText, activeTag === tag && styles.tagChipTextActive]}>{tag}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Article list */}
        <View style={styles.articleList}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No articles found</Text>
            </View>
          ) : (
            filtered.map(article => (
              <Pressable
                key={article.slug}
                style={styles.articleCard}
                onPress={() => router.push(`/learn/${article.slug}`)}
              >
                <View style={styles.articleCardLeft}>
                  <Text style={styles.articleHero}>{article.hero}</Text>
                </View>
                <View style={styles.articleCardBody}>
                  <View style={[styles.articleTagPill, { backgroundColor: (TAG_COLORS[article.tag] || colors.primary) + '18' }]}>
                    <Text style={[styles.articleTagText, { color: TAG_COLORS[article.tag] || colors.primary }]}>{article.tag}</Text>
                  </View>
                  <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
                  <Text style={styles.articleSubtitle} numberOfLines={2}>{article.subtitle}</Text>
                  <View style={styles.articleMeta}>
                    <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                    <Text style={styles.articleMetaText}>{article.readTime} min read</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ alignSelf: 'center' }} />
              </Pressable>
            ))
          )}
        </View>

        {/* Quick tools */}
        <View style={styles.quickToolsRow}>
          <Pressable style={styles.quickTool} onPress={() => router.push('/skin-type')}>
            <Text style={styles.quickToolEmoji}>🌿</Text>
            <Text style={styles.quickToolLabel}>Skin Type Guides</Text>
            <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
          </Pressable>
          <Pressable style={styles.quickTool} onPress={() => router.push('/ingredient')}>
            <Text style={styles.quickToolEmoji}>⚗️</Text>
            <Text style={styles.quickToolLabel}>Ingredient Decoder</Text>
            <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Science badge */}
        <View style={styles.scienceBadge}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
          <Text style={styles.scienceText}>Content is evidence-based and reviewed for accuracy</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  headerTitle: { fontSize: 22, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: c.border,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14, color: c.textPrimary },

  featured: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(138,120,96,0.2)',
    padding: 22, marginBottom: 16, gap: 10,
  },
  featuredBadge: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: c.primary, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  featuredBadgeText: { fontSize: 9, fontWeight: '800', color: c.white, letterSpacing: 1.5 },
  featuredHero: { fontSize: 36 },
  tagPill: { backgroundColor: 'rgba(138,120,96,0.12)', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagPillText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  featuredTitle: { fontSize: 20, fontWeight: '800', color: c.textPrimary, lineHeight: 27 },
  featuredSubtitle: { fontSize: 13, color: c.textSecondary, lineHeight: 19 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  metaText: { fontSize: 11, color: c.textMuted },
  metaDot: { fontSize: 11, color: c.textMuted },

  tagScroll: { marginBottom: 16 },
  tagScrollContent: { gap: 8, paddingRight: 16 },
  tagChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.bgCard,
  },
  tagChipActive: { borderColor: c.primary, backgroundColor: 'rgba(138,120,96,0.15)' },
  tagChipText: { fontSize: 11, fontWeight: '600', color: c.textMuted },
  tagChipTextActive: { color: c.primary },

  articleList: { gap: 10 },
  articleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: c.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: c.border, padding: 14,
  },
  articleCardLeft: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: c.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  articleHero: { fontSize: 24 },
  articleCardBody: { flex: 1, gap: 5 },
  articleTagPill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  articleTagText: { fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  articleTitle: { fontSize: 14, fontWeight: '700', color: c.textPrimary, lineHeight: 20 },
  articleSubtitle: { fontSize: 12, color: c.textSecondary, lineHeight: 17 },
  articleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  articleMetaText: { fontSize: 11, color: c.textMuted },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: 15, color: c.textMuted },

  quickToolsRow: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 10 },
  quickTool: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.bgCard, borderRadius: 12,
    borderWidth: 1, borderColor: c.border, padding: 12,
  },
  quickToolEmoji: { fontSize: 18 },
  quickToolLabel: { flex: 1, fontSize: 12, fontWeight: '600', color: c.textSecondary },

  scienceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(138,120,96,0.05)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(138,120,96,0.1)',
    padding: 14, marginTop: 16, justifyContent: 'center',
  },
  scienceText: { fontSize: 12, color: c.textMuted, flex: 1 },
  });
}
