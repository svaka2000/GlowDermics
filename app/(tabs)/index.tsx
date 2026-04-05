import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import { SkinAnalysis, UserProfile } from '../../src/types';
import { ScoreRing } from '../../src/components/ScoreRing';
import { ScoreBar } from '../../src/components/ScoreBar';

const SKIN_TIPS = [
  { tip: 'Less is more. A 2-step routine done consistently beats a 10-step routine done once a week.', tag: 'ROUTINE' },
  { tip: "Your skin barrier needs fat, not water. That's why tallow outperforms every water-based moisturizer.", tag: 'SCIENCE' },
  { tip: 'SPF is the only anti-aging ingredient with decades of clinical proof behind it. Use it daily.', tag: 'PROTECTION' },
  { tip: 'Changing products too often is one of the top causes of sensitive skin. Give products 4-6 weeks.', tag: 'PATIENCE' },
  { tip: 'Dehydrated skin produces more oil to compensate. If you have oily skin, you might just need more moisture.', tag: 'HYDRATION' },
  { tip: "Your skin renews itself every 28 days. That's how long it takes to actually see results from a new product.", tag: 'TIMELINE' },
  { tip: 'Manuka honey is antibacterial without stripping your microbiome. Regular honey lacks the MGO compound.', tag: 'INGREDIENTS' },
  { tip: 'Pillowcases harbour bacteria and oils. Change yours every 3-4 days for clearer skin — overnight.', tag: 'LIFESTYLE' },
  { tip: "Tallow's oleic acid content (45%) nearly matches human sebum. It absorbs, not just sits.", tag: 'SCIENCE' },
  { tip: 'The longer an ingredient list, the more chances for irritation. Minimal formulas win long-term.', tag: 'FORMULATION' },
];

function getDailyTip() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return SKIN_TIPS[dayOfYear % SKIN_TIPS.length];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latest, setLatest] = useState<SkinAnalysis | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [p, a, s] = await Promise.all([
      Storage.getUserProfile(),
      Storage.getLatestAnalysis(),
      Storage.getStreak(),
    ]);
    setProfile(p);
    setLatest(a);
    setStreak(s);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const dailyTip = getDailyTip();

  if (loading) {
    return (
      <View style={styles.loadWrap}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.name}>{profile?.name || 'Friend'}</Text>
            </View>
            <Pressable style={styles.profileBtn} onPress={() => router.push('/(tabs)/settings')}>
              <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{profile?.name?.[0]?.toUpperCase() || '?'}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>

        {/* Streak + stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{streak}</Text>
            <Text style={styles.statLabel}>🔥 Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{latest ? latest.scores.overall : '—'}</Text>
            <Text style={styles.statLabel}>Last Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{profile?.primaryConcerns?.length || 0}</Text>
            <Text style={styles.statLabel}>Concerns</Text>
          </View>
        </View>

        {/* Primary scan CTA */}
        <Pressable style={styles.scanCard} onPress={() => router.push('/scan')}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <View style={styles.scanCardContent}>
            <View>
              <Text style={styles.scanCardEyebrow}>AI SKIN SCAN</Text>
              <Text style={styles.scanCardTitle}>
                {latest ? 'Scan Again' : 'Take Your First Scan'}
              </Text>
              <Text style={styles.scanCardSub}>
                {latest
                  ? `Last scanned ${new Date(latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  : 'Get your full skin analysis in 30 seconds'}
              </Text>
            </View>
            <View style={styles.scanIconCircle}>
              <Ionicons name="scan" size={30} color={Colors.white} />
            </View>
          </View>
        </Pressable>

        {/* Latest scan summary */}
        {latest && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Analysis</Text>
              <Pressable onPress={() => router.push(`/results/${latest.id}`)}>
                <Text style={styles.seeAll}>Full Report →</Text>
              </Pressable>
            </View>

            <Pressable style={styles.analysisCard} onPress={() => router.push(`/results/${latest.id}`)}>
              <View style={styles.analysisTop}>
                {latest.imageUri ? (
                  <Image source={{ uri: latest.imageUri }} style={styles.analysisThumb} />
                ) : (
                  <View style={[styles.analysisThumb, styles.analysisThumbEmpty]}>
                    <Ionicons name="person" size={26} color={Colors.textMuted} />
                  </View>
                )}
                <View style={styles.analysisInfo}>
                  <View style={styles.skinTypeBadge}>
                    <Text style={styles.skinTypeText}>{latest.skinType?.toUpperCase()} SKIN</Text>
                  </View>
                  <View style={styles.concernChips}>
                    {latest.concerns.slice(0, 2).map(c => (
                      <View key={c} style={styles.concernChip}>
                        <Text style={styles.concernText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.analysisDate}>
                    {new Date(latest.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
                <ScoreRing score={latest.scores.overall} size={72} />
              </View>

              <View style={styles.scoreGrid}>
                {[
                  { label: 'Hydration', val: latest.scores.hydration },
                  { label: 'Texture', val: latest.scores.texture },
                  { label: 'Clarity', val: latest.scores.clarity },
                  { label: 'Evenness', val: latest.scores.evenness },
                ].map(({ label, val }) => (
                  <ScoreBar key={label} label={label} value={val} />
                ))}
              </View>

              {latest.insights ? (
                <View style={styles.insightBox}>
                  <Ionicons name="bulb-outline" size={14} color={Colors.gold} />
                  <Text style={styles.insightText} numberOfLines={2}>{latest.insights}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        )}

        {/* Quick actions — 2 rows of 3 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            <Pressable style={styles.quickCard} onPress={() => router.push('/scanner')}>
              <LinearGradient colors={['rgba(196,98,45,0.15)', 'rgba(196,98,45,0.05)']} style={StyleSheet.absoluteFill} />
              <Ionicons name="flask-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Ingredient{'\n'}Scanner</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/dupes')}>
              <Ionicons name="cash-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Dupe{'\n'}Finder</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/goals')}>
              <Ionicons name="flag-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Skin{'\n'}Goals</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/(tabs)/routine')}>
              <Ionicons name="list-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>My{'\n'}Routine</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/(tabs)/coach')}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>Ask{'\n'}Derm</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push('/product')}>
              <Ionicons name="leaf-outline" size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>The{'\n'}Formula</Text>
            </Pressable>
          </View>
        </View>

        {/* Daily tip */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Tip</Text>
          <View style={styles.tipCard}>
            <LinearGradient colors={['rgba(212,169,106,0.12)', 'rgba(212,169,106,0.04)']} style={StyleSheet.absoluteFill} />
            <View style={styles.tipHeader}>
              <View style={styles.tipTagWrap}>
                <Text style={styles.tipTag}>{dailyTip.tag}</Text>
              </View>
              <Text style={styles.tipCalendar}>
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <Text style={styles.tipText}>"{dailyTip.tip}"</Text>
            <Text style={styles.tipSource}>— GlowDermics Skin Science</Text>
          </View>
        </View>

        {/* Empty state */}
        {!latest && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyTitle}>Your skin story starts here</Text>
            <Text style={styles.emptySub}>Take your first scan to get a full AI-powered analysis of your skin in under 30 seconds.</Text>
          </View>
        )}

        {/* Brand strip */}
        <View style={styles.brandStrip}>
          <Text style={styles.brandEyebrow}>POWERED BY TALLOWDERMICS SCIENCE</Text>
          <Text style={styles.brandTagline}>4 ingredients. Ancestral wisdom. Zero synthetic fillers.</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  loadWrap: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 20 },
  greeting: { fontSize: 13, color: Colors.textMuted },
  name: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  profileBtn: {},
  profileAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { fontSize: 18, fontWeight: '800', color: Colors.white },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 14, alignItems: 'center', gap: 4,
  },
  statNum: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', textAlign: 'center' },

  scanCard: {
    borderRadius: 22, overflow: 'hidden', marginBottom: 24,
  },
  scanCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 22 },
  scanCardEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  scanCardTitle: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  scanCardSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  scanIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
  },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  analysisCard: {
    backgroundColor: Colors.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border, padding: 16,
  },
  analysisTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  analysisThumb: { width: 66, height: 66, borderRadius: 12, backgroundColor: Colors.bgElevated },
  analysisThumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  analysisInfo: { flex: 1, gap: 6 },
  skinTypeBadge: { backgroundColor: 'rgba(196,98,45,0.12)', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  skinTypeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Colors.primary },
  concernChips: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  concernChip: { backgroundColor: 'rgba(212,169,106,0.12)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  concernText: { fontSize: 10, color: Colors.gold, fontWeight: '600' },
  analysisDate: { fontSize: 11, color: Colors.textMuted },
  scoreGrid: { gap: 10, marginBottom: 14 },
  insightBox: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: 'rgba(212,169,106,0.08)', borderRadius: 10, padding: 10,
  },
  insightText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, flex: 1 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    width: '31%', backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
    alignItems: 'center', gap: 8, overflow: 'hidden',
  },
  quickLabel: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', lineHeight: 15 },

  tipCard: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(212,169,106,0.2)', padding: 20,
  },
  tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  tipTagWrap: { backgroundColor: 'rgba(212,169,106,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tipTag: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Colors.gold },
  tipCalendar: { fontSize: 11, color: Colors.textMuted },
  tipText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 24, fontStyle: 'italic', marginBottom: 10 },
  tipSource: { fontSize: 11, color: Colors.textMuted },

  emptyState: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 32, color: Colors.primary, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  brandStrip: {
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(196,98,45,0.12)',
    backgroundColor: 'rgba(196,98,45,0.05)', padding: 18, alignItems: 'center', gap: 6,
  },
  brandEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: Colors.primary },
  brandTagline: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', fontStyle: 'italic' },
});
