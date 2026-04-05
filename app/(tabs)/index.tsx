import { useEffect, useState, useCallback } from 'react';
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

export default function Home() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latest, setLatest] = useState<SkinAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [p, a] = await Promise.all([Storage.getUserProfile(), Storage.getLatestAnalysis()]);
    setProfile(p);
    setLatest(a);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

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
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.name}>{profile?.name || 'Friend'} ✦</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.brandBadge}>GlowDermics</Text>
            </View>
          </View>
        </SafeAreaView>

        {/* Scan CTA */}
        <Pressable style={styles.scanCard} onPress={() => router.push('/scan')}>
          <LinearGradient
            colors={['#1E1218', '#0F0A0A']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <View style={styles.scanCardInner}>
            <View style={styles.scanIconWrap}>
              <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.scanIconGrad}>
                <Ionicons name="scan" size={28} color={Colors.white} />
              </LinearGradient>
            </View>
            <View style={styles.scanCardText}>
              <Text style={styles.scanCardTitle}>
                {latest ? 'New Skin Scan' : 'Take Your First Scan'}
              </Text>
              <Text style={styles.scanCardSub}>
                {latest ? 'See how your skin has changed' : 'Get your AI-powered skin analysis'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </View>
          <View style={styles.scanCardBorder} />
        </Pressable>

        {/* Latest Analysis */}
        {latest ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Scan</Text>
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
                    <Ionicons name="person" size={28} color={Colors.textMuted} />
                  </View>
                )}
                <View style={styles.analysisInfo}>
                  <Text style={styles.analysisSub}>
                    {new Date(latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <Text style={styles.skinTypeLabel}>{latest.skinType?.toUpperCase()} SKIN</Text>
                  <View style={styles.concernChips}>
                    {latest.concerns.slice(0, 2).map(c => (
                      <View key={c} style={styles.concernChip}>
                        <Text style={styles.concernText}>{c}</Text>
                      </View>
                    ))}
                  </View>
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
            </Pressable>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyTitle}>Your skin story starts here</Text>
            <Text style={styles.emptySub}>Take your first scan to get a full AI-powered analysis of your skin in under 30 seconds.</Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore</Text>
          <View style={styles.quickGrid}>
            {[
              { icon: 'list-outline' as const, label: 'My Routine', sub: 'Daily steps', dest: '/(tabs)/routine' },
              { icon: 'trending-up-outline' as const, label: 'Progress', sub: 'Track changes', dest: '/(tabs)/progress' },
              { icon: 'chatbubble-ellipses-outline' as const, label: 'AI Coach', sub: 'Ask anything', dest: '/(tabs)/coach' },
            ].map(({ icon, label, sub, dest }) => (
              <Pressable key={label} style={styles.quickCard} onPress={() => router.push(dest as any)}>
                <Ionicons name={icon} size={22} color={Colors.primary} />
                <Text style={styles.quickLabel}>{label}</Text>
                <Text style={styles.quickSub}>{sub}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Brand strip */}
        <View style={styles.brandStrip}>
          <LinearGradient colors={['rgba(196,98,45,0.08)', 'rgba(196,98,45,0.04)']} style={styles.brandGrad}>
            <Text style={styles.brandEyebrow}>POWERED BY TALLOWDERMICS SCIENCE</Text>
            <Text style={styles.brandTagline}>4 ingredients. Ancestral wisdom. Zero synthetic fillers.</Text>
          </LinearGradient>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 16, paddingBottom: 24 },
  greeting: { fontSize: 14, color: Colors.textMuted, fontWeight: '400' },
  name: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  headerRight: { alignItems: 'flex-end', paddingTop: 4 },
  brandBadge: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 1 },
  scanCard: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 28,
    borderWidth: 1, borderColor: Colors.borderStrong,
  },
  scanCardInner: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 14 },
  scanIconWrap: { borderRadius: 16, overflow: 'hidden' },
  scanIconGrad: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  scanCardText: { flex: 1 },
  scanCardTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  scanCardSub: { fontSize: 13, color: Colors.textSecondary },
  scanCardBorder: { height: 2, backgroundColor: Colors.primary, marginHorizontal: 20, marginBottom: 0, borderRadius: 1, marginTop: 0, opacity: 0.5 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  analysisCard: {
    backgroundColor: Colors.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border, padding: 18,
  },
  analysisTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 18 },
  analysisThumb: { width: 70, height: 70, borderRadius: 12, backgroundColor: Colors.bgElevated },
  analysisThumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  analysisInfo: { flex: 1 },
  analysisSub: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  skinTypeLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: Colors.primary, marginBottom: 8 },
  concernChips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  concernChip: { backgroundColor: 'rgba(196,98,45,0.1)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  concernText: { fontSize: 10, color: Colors.gold, fontWeight: '600' },
  scoreGrid: { gap: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 36, color: Colors.primary, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 10 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  quickGrid: { flexDirection: 'row', gap: 12 },
  quickCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 8,
  },
  quickLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  quickSub: { fontSize: 11, color: Colors.textMuted },
  brandStrip: { borderRadius: 16, overflow: 'hidden', marginBottom: 8 },
  brandGrad: { padding: 20, alignItems: 'center', gap: 6 },
  brandEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: Colors.primary },
  brandTagline: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', fontStyle: 'italic' },
});
