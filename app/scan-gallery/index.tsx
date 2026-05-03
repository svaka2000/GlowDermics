import { useCallback, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image,
  Share, Animated, Easing, Dimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import { ScanHistoryEntry } from '../../src/types';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48 - 10) / 3;

function scoreColor(score: number): string {
  if (score >= 80) return Colors.scoreExcellent;
  if (score >= 65) return Colors.scoreGood;
  if (score >= 50) return Colors.scoreFair;
  return Colors.scorePoor;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ScanGallery() {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    headerAnim.setValue(0);
    contentAnim.setValue(0);
    Storage.getScanHistory().then(h => {
      setHistory(h);
      Animated.stagger(80, [
        Animated.timing(headerAnim, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
  }, []));

  const handleShare = async () => {
    if (!history.length) return;
    const first = history[history.length - 1];
    const latest = history[0];
    const delta = latest.overallScore - first.overallScore;
    const sign = delta > 0 ? '+' : '';
    const message = `My skin journey with GlowDermics — ${history.length} scans tracked!\n\nFrom ${first.overallScore} → ${latest.overallScore} (${sign}${delta} points)\n\nTracking my skin health one scan at a time. 🌿\n#GlowDermics #Skincare #SkinHealth`;
    await Share.share({ message });
  };

  const withPhotos = history.filter(h => h.imageUri);
  const latest = history[0];
  const oldest = history[history.length - 1];
  const improvement = history.length >= 2 ? latest?.overallScore - oldest?.overallScore : 0;

  if (history.length === 0) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Skin Gallery</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>📸</Text>
          <Text style={styles.emptyTitle}>Start your skin journey</Text>
          <Text style={styles.emptySub}>Your scan photos will appear here. Build a visual timeline of your skin's transformation over time.</Text>
          <Pressable style={styles.scanBtn} onPress={() => router.push('/scan')}>
            <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.scanBtnGrad}>
              <Text style={styles.scanBtnText}>Take First Scan →</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Animated.View style={{
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
      }}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.headerTitle}>Skin Gallery</Text>
              <Text style={styles.headerSub}>{history.length} scan{history.length !== 1 ? 's' : ''}</Text>
            </View>
            <Pressable style={styles.shareBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color={Colors.primary} />
            </Pressable>
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        style={{ opacity: contentAnim }}
      >

        {/* Journey stats banner */}
        {history.length >= 2 && (
          <LinearGradient
            colors={[Colors.primaryDark, Colors.primary]}
            style={styles.journeyBanner}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={styles.journeyStat}>
              <Text style={styles.journeyStatNum}>{history.length}</Text>
              <Text style={styles.journeyStatLabel}>Scans</Text>
            </View>
            <View style={styles.journeySep} />
            <View style={styles.journeyStat}>
              <Text style={[styles.journeyStatNum, { color: improvement >= 0 ? '#4ADE80' : '#F87171' }]}>
                {improvement > 0 ? '+' : ''}{improvement}
              </Text>
              <Text style={styles.journeyStatLabel}>Score Change</Text>
            </View>
            <View style={styles.journeySep} />
            <View style={styles.journeyStat}>
              <Text style={styles.journeyStatNum}>
                {Math.round((new Date(latest?.date).getTime() - new Date(oldest?.date).getTime()) / 86400000)}
              </Text>
              <Text style={styles.journeyStatLabel}>Days Tracked</Text>
            </View>
          </LinearGradient>
        )}

        {/* Latest scan hero */}
        {latest && (
          <Pressable style={styles.heroCard} onPress={() => router.push(`/results/${latest.id}`)}>
            {latest.imageUri ? (
              <Image source={{ uri: latest.imageUri }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={[styles.heroImage, styles.heroImageEmpty]}>
                <Ionicons name="person" size={48} color={Colors.textMuted} />
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              style={styles.heroOverlay}
            >
              <View style={styles.heroContent}>
                <View>
                  <Text style={styles.heroLabel}>LATEST SCAN</Text>
                  <Text style={styles.heroDate}>{formatDate(latest.date)}</Text>
                </View>
                <View style={styles.heroScore}>
                  <Text style={styles.heroScoreNum}>{latest.overallScore}</Text>
                  <Text style={styles.heroScoreLabel}>score</Text>
                </View>
              </View>
            </LinearGradient>
            <View style={styles.heroViewBtn}>
              <Text style={styles.heroViewBtnText}>View Full Report →</Text>
            </View>
          </Pressable>
        )}

        {/* View mode toggle */}
        <View style={styles.modeRow}>
          <Text style={styles.modeLabel}>All Scans</Text>
          <View style={styles.modeToggle}>
            <Pressable
              style={[styles.modeBtn, viewMode === 'grid' && styles.modeBtnActive]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons name="grid-outline" size={16} color={viewMode === 'grid' ? Colors.primary : Colors.textMuted} />
            </Pressable>
            <Pressable
              style={[styles.modeBtn, viewMode === 'list' && styles.modeBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list-outline" size={16} color={viewMode === 'list' ? Colors.primary : Colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Grid view */}
        {viewMode === 'grid' && (
          <View style={styles.grid}>
            {history.map((scan, i) => {
              const isFirst = i === history.length - 1;
              const isLatest = i === 0;
              const delta = i < history.length - 1 ? scan.overallScore - history[i + 1].overallScore : null;
              return (
                <Pressable
                  key={scan.id}
                  style={styles.gridCard}
                  onPress={() => router.push(`/results/${scan.id}`)}
                >
                  {scan.imageUri ? (
                    <Image source={{ uri: scan.imageUri }} style={styles.gridImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.gridImage, styles.gridImageEmpty]}>
                      <Ionicons name="person-outline" size={24} color={Colors.textMuted} />
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.65)']}
                    style={styles.gridOverlay}
                  >
                    <Text style={[styles.gridScore, { color: scoreColor(scan.overallScore) }]}>
                      {scan.overallScore}
                    </Text>
                    <Text style={styles.gridDate}>{formatDate(scan.date)}</Text>
                  </LinearGradient>
                  {(isFirst || isLatest) && (
                    <View style={[styles.gridBadge, { backgroundColor: isLatest ? Colors.primary : '#6B85A8' }]}>
                      <Text style={styles.gridBadgeText}>{isLatest ? 'NOW' : 'START'}</Text>
                    </View>
                  )}
                  {delta !== null && delta !== 0 && (
                    <View style={[styles.deltaBadge, { backgroundColor: delta > 0 ? 'rgba(74,222,128,0.9)' : 'rgba(248,113,113,0.9)' }]}>
                      <Text style={styles.deltaBadgeText}>{delta > 0 ? '+' : ''}{delta}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* List view */}
        {viewMode === 'list' && (
          <View style={styles.listWrap}>
            {history.map((scan, i) => {
              const delta = i < history.length - 1 ? scan.overallScore - history[i + 1].overallScore : null;
              return (
                <Pressable
                  key={scan.id}
                  style={styles.listCard}
                  onPress={() => router.push(`/results/${scan.id}`)}
                >
                  {scan.imageUri ? (
                    <Image source={{ uri: scan.imageUri }} style={styles.listThumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.listThumb, styles.listThumbEmpty]}>
                      <Ionicons name="person" size={22} color={Colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.listInfo}>
                    <Text style={styles.listDate}>{new Date(scan.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                    <View style={styles.listMeta}>
                      <View style={styles.listSkinBadge}>
                        <Text style={styles.listSkinText}>SCAN #{history.length - i}</Text>
                      </View>
                      {[
                        'hydration', 'texture', 'clarity',
                      ].map(m => {
                        const val = scan.scores[m as keyof typeof scan.scores];
                        if (val >= 70) return null;
                        return (
                          <View key={m} style={styles.concernChip}>
                            <Text style={styles.concernText}>{m}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                  <View style={styles.listRight}>
                    <Text style={[styles.listScore, { color: scoreColor(scan.overallScore) }]}>{scan.overallScore}</Text>
                    {delta !== null && (
                      <Text style={[styles.listDelta, { color: delta > 0 ? Colors.scoreExcellent : delta < 0 ? Colors.scorePoor : Colors.textMuted }]}>
                        {delta > 0 ? '+' : ''}{delta !== 0 ? delta : '—'}
                      </Text>
                    )}
                    <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Photo-only note */}
        {withPhotos.length < history.length && (
          <View style={styles.photoNote}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.photoNoteText}>
              {history.length - withPhotos.length} scan{history.length - withPhotos.length !== 1 ? 's' : ''} without a photo (quiz scans or older records)
            </Text>
          </View>
        )}

        {/* Share journey CTA */}
        {history.length >= 3 && (
          <Pressable style={styles.shareCta} onPress={handleShare}>
            <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Ionicons name="share-social-outline" size={20} color={Colors.white} />
            <View style={{ flex: 1 }}>
              <Text style={styles.shareCtaTitle}>Share your skin journey</Text>
              <Text style={styles.shareCtaSub}>{history.length} scans · {improvement >= 0 ? '+' : ''}{improvement} points total</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
          </Pressable>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  scanBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  scanBtnGrad: { paddingHorizontal: 28, paddingVertical: 15 },
  scanBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },

  journeyBanner: {
    borderRadius: 18, padding: 18, flexDirection: 'row', marginBottom: 16,
    alignItems: 'center',
  },
  journeyStat: { flex: 1, alignItems: 'center', gap: 2 },
  journeyStatNum: { fontSize: 26, fontWeight: '900', color: Colors.white },
  journeyStatLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5 },
  journeySep: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },

  heroCard: {
    borderRadius: 22, overflow: 'hidden', marginBottom: 16,
    height: 220,
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border,
  },
  heroImage: { width: '100%', height: '100%' },
  heroImageEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgElevated },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 16,
  },
  heroContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  heroLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.75)', letterSpacing: 1.5, marginBottom: 3 },
  heroDate: { fontSize: 17, fontWeight: '700', color: Colors.white },
  heroScore: { alignItems: 'center' },
  heroScoreNum: { fontSize: 36, fontWeight: '900', color: Colors.white },
  heroScoreLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: -3 },
  heroViewBtn: {
    position: 'absolute', top: 14, right: 14,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  heroViewBtnText: { fontSize: 11, fontWeight: '700', color: Colors.white },

  modeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modeLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  modeToggle: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: Colors.border },
  modeBtn: { width: 32, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  modeBtnActive: { backgroundColor: Colors.bgElevated },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 16 },
  gridCard: {
    width: CARD_SIZE, height: CARD_SIZE * 1.2,
    borderRadius: 14, overflow: 'hidden',
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border,
  },
  gridImage: { width: '100%', height: '100%' },
  gridImageEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgElevated },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 6,
  },
  gridScore: { fontSize: 16, fontWeight: '900' },
  gridDate: { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  gridBadge: {
    position: 'absolute', top: 6, left: 6,
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  gridBadgeText: { fontSize: 8, fontWeight: '900', color: Colors.white, letterSpacing: 0.5 },
  deltaBadge: {
    position: 'absolute', top: 6, right: 6,
    borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2,
  },
  deltaBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.white },

  listWrap: { gap: 8, marginBottom: 16 },
  listCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, padding: 12,
  },
  listThumb: { width: 60, height: 60, borderRadius: 12, backgroundColor: Colors.bgElevated },
  listThumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  listInfo: { flex: 1, gap: 5 },
  listDate: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  listMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  listSkinBadge: { backgroundColor: 'rgba(196,98,45,0.12)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  listSkinText: { fontSize: 9, fontWeight: '800', color: Colors.primary, letterSpacing: 1 },
  concernChip: { backgroundColor: 'rgba(212,169,106,0.12)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  concernText: { fontSize: 9, color: Colors.gold, fontWeight: '600' },
  listRight: { alignItems: 'flex-end', gap: 3 },
  listScore: { fontSize: 22, fontWeight: '900' },
  listDelta: { fontSize: 11, fontWeight: '700' },

  photoNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.bgCard, borderRadius: 12,
    padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  photoNoteText: { fontSize: 12, color: Colors.textMuted, flex: 1 },

  shareCta: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, overflow: 'hidden', padding: 18, marginBottom: 16,
  },
  shareCtaTitle: { fontSize: 15, fontWeight: '700', color: Colors.white },
  shareCtaSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
});
