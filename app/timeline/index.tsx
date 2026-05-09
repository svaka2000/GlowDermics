import { useCallback, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Share,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import { ScanHistoryEntry, SkinAnalysis } from '../../src/types';
import {
  GlassHero, Card, Badge, Button, Section, PhotoTimeline, TimelineFrame,
} from '../../src/components/ui';

const { width: SCREEN_W } = Dimensions.get('window');

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysBetween(a: string, b: string): number {
  return Math.max(
    1,
    Math.round(Math.abs(new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24)),
  );
}

export default function Timeline() {
  const [analyses, setAnalyses] = useState<SkinAnalysis[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    Storage.getAnalyses().then(list => {
      if (!mounted) return;
      // Show oldest first so the timeline plays chronologically (Day 1 → Now).
      setAnalyses([...list].reverse());
    });
    return () => { mounted = false; };
  }, []));

  // Build timeline frames — only entries with a photo.
  const frames: TimelineFrame[] = useMemo(
    () =>
      analyses
        .filter(a => !!a.imageUri)
        .map(a => ({
          uri: a.imageUri,
          date: a.date,
          score: a.scores.overall,
          skinType: a.skinType,
        })),
    [analyses],
  );

  const oldest = frames[0];
  const newest = frames[frames.length - 1];
  const overallDelta =
    frames.length >= 2 ? newest.score - oldest.score : 0;
  const elapsedDays =
    frames.length >= 2 ? daysBetween(oldest.date, newest.date) : 0;

  const activeFrame = frames[activeIndex];

  const handleShare = async () => {
    if (!frames.length) return;
    const sign = overallDelta >= 0 ? '+' : '';
    const message = [
      `My ${elapsedDays}-day skin transformation with GlowDermics 🌿`,
      '',
      `Started: ${oldest.score}/100`,
      `Now:     ${newest.score}/100  (${sign}${overallDelta} pts)`,
      '',
      `${frames.length} scans tracked`,
      '',
      `#GlowDermics #SkinTransformation`,
    ].join('\n');
    await Share.share({ message });
  };

  if (frames.length === 0) {
    return (
      <View style={styles.root}>
        <GlassHero height={130} tint={Colors.primary} style={styles.heroWrap}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroHeader}>
              <Pressable
                style={styles.heroBackBtn}
                onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}
              >
                <Ionicons name="arrow-back" size={20} color={Colors.white} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Timeline</Text>
                <Text style={styles.heroSub}>Watch your skin transform</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </GlassHero>

        <View style={styles.emptyWrap}>
          <View style={styles.emptyEmojiBox}>
            <Ionicons name="film-outline" size={42} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No timeline yet</Text>
          <Text style={styles.emptySub}>
            Take 2+ scans with photos and your transformation will play back here as an animated
            visual story you can share with anyone.
          </Text>
          <View style={{ width: '100%', marginTop: 18 }}>
            <Button label="Take a scan" icon="scan" onPress={() => router.push('/scan')} />
          </View>
        </View>
      </View>
    );
  }

  // Dimensions: keep the player at most 360 wide on tablets.
  const playerWidth = Math.min(SCREEN_W - 32, 360);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <GlassHero height={150} tint={Colors.primary} style={styles.heroWrap}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroHeader}>
              <Pressable
                style={styles.heroBackBtn}
                onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}
              >
                <Ionicons name="arrow-back" size={20} color={Colors.white} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Timeline</Text>
                <Text style={styles.heroSub}>
                  {frames.length} frame{frames.length !== 1 ? 's' : ''}
                  {elapsedDays > 0 ? ` · ${elapsedDays} day${elapsedDays !== 1 ? 's' : ''}` : ''}
                </Text>
              </View>
              <Pressable style={styles.heroShareBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={18} color={Colors.white} />
              </Pressable>
            </View>
          </SafeAreaView>
        </GlassHero>

        <View style={styles.content}>
          {/* Hero player */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <PhotoTimeline
              frames={frames}
              width={playerWidth}
              onFrameChange={setActiveIndex}
            />
          </View>

          {/* Active frame meta + delta vs first */}
          {activeFrame && oldest && activeIndex > 0 && (
            <Card variant="elevated" padding={14} style={{ marginBottom: 14 }}>
              <View style={styles.deltaRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deltaCaption}>Versus your first scan</Text>
                  <Text style={styles.deltaDate}>
                    {fmtDate(oldest.date)} → {fmtDate(activeFrame.date)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.deltaBadge,
                    {
                      backgroundColor:
                        activeFrame.score - oldest.score >= 0
                          ? 'rgba(22,163,74,0.10)'
                          : 'rgba(220,38,38,0.10)',
                      borderColor:
                        activeFrame.score - oldest.score >= 0
                          ? 'rgba(22,163,74,0.30)'
                          : 'rgba(220,38,38,0.30)',
                    },
                  ]}
                >
                  <Ionicons
                    name={activeFrame.score - oldest.score >= 0 ? 'trending-up' : 'trending-down'}
                    size={11}
                    color={activeFrame.score - oldest.score >= 0 ? Colors.scoreExcellent : Colors.scorePoor}
                  />
                  <Text
                    style={[
                      styles.deltaBadgeText,
                      {
                        color:
                          activeFrame.score - oldest.score >= 0 ? Colors.scoreExcellent : Colors.scorePoor,
                      },
                    ]}
                  >
                    {activeFrame.score - oldest.score >= 0 ? '+' : ''}
                    {activeFrame.score - oldest.score} pts
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Story stats */}
          <Section title="The story so far" gap={10}>
            <View style={styles.statsRow}>
              <Stat label="First" value={`${oldest.score}`} sub={fmtDate(oldest.date)} />
              <Arrow />
              <Stat
                label="Latest"
                value={`${newest.score}`}
                sub={fmtDate(newest.date)}
                accent={
                  overallDelta > 0 ? Colors.scoreExcellent : overallDelta < 0 ? Colors.scorePoor : Colors.primary
                }
              />
            </View>
            <View style={styles.bigDeltaRow}>
              <View
                style={[
                  styles.bigDelta,
                  {
                    backgroundColor:
                      overallDelta > 0
                        ? 'rgba(22,163,74,0.08)'
                        : overallDelta < 0
                        ? 'rgba(220,38,38,0.08)'
                        : 'rgba(28,24,20,0.06)',
                    borderColor:
                      overallDelta > 0
                        ? 'rgba(22,163,74,0.22)'
                        : overallDelta < 0
                        ? 'rgba(220,38,38,0.22)'
                        : Colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.bigDeltaNum,
                    {
                      color:
                        overallDelta > 0
                          ? Colors.scoreExcellent
                          : overallDelta < 0
                          ? Colors.scorePoor
                          : Colors.textPrimary,
                    },
                  ]}
                >
                  {overallDelta > 0 ? '+' : ''}
                  {overallDelta}
                </Text>
                <Text style={styles.bigDeltaLabel}>
                  pt{Math.abs(overallDelta) === 1 ? '' : 's'} over {elapsedDays} day
                  {elapsedDays !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </Section>

          {/* Tip */}
          <Card variant="gradient" tint={Colors.gold} padding={14} style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={styles.tipIcon}>
                <Ionicons name="information-circle" size={14} color={Colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>Pro tip</Text>
                <Text style={styles.tipText}>
                  Tap the photo to pause. Drag the timeline ticks to jump to a specific scan.
                  Speed controls let you slow it down for a closer look.
                </Text>
              </View>
            </View>
          </Card>

          {/* Quick links */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
            <Pressable style={styles.quickLink} onPress={() => router.push('/scan-gallery')}>
              <Ionicons name="grid" size={14} color={Colors.primary} />
              <Text style={styles.quickLinkText}>Gallery</Text>
            </Pressable>
            <Pressable style={styles.quickLink} onPress={() => router.push('/compare')}>
              <Ionicons name="git-compare" size={14} color={Colors.primary} />
              <Text style={styles.quickLinkText}>Compare 2 scans</Text>
            </Pressable>
            <Pressable
              style={[styles.quickLink, styles.quickLinkPrimary]}
              onPress={() => router.push('/scan')}
            >
              <Ionicons name="add" size={14} color={Colors.white} />
              <Text style={[styles.quickLinkText, { color: Colors.white }]}>New scan</Text>
            </Pressable>
          </View>

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Sub-components ---------- */

function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
      <Text style={[styles.statValue, accent ? { color: accent } : null]}>{value}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

function Arrow() {
  return (
    <View style={styles.arrow}>
      <Ionicons name="arrow-forward" size={16} color={Colors.textMuted} />
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 40 },

  heroWrap: { marginBottom: 14 },
  heroHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12, gap: 12,
  },
  heroBackBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroShareBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22, fontWeight: '900', color: Colors.white, letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.78)', marginTop: 2, fontWeight: '600' },

  content: { paddingHorizontal: 16 },

  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 10, paddingTop: 60,
  },
  emptyEmojiBox: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(196,98,45,0.10)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.4 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },

  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deltaCaption: { fontSize: 10, fontWeight: '900', color: Colors.textMuted, letterSpacing: 1.2 },
  deltaDate: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  deltaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    borderWidth: 1,
  },
  deltaBadgeText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.2 },

  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statBlock: {
    flex: 1, alignItems: 'center',
    backgroundColor: Colors.bgCard, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
    gap: 2,
  },
  statLabel: { fontSize: 9, fontWeight: '900', color: Colors.textMuted, letterSpacing: 1.2 },
  statValue: { fontSize: 28, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.6 },
  statSub: { fontSize: 10, color: Colors.textSecondary, fontWeight: '700' },
  arrow: { width: 22, alignItems: 'center' },

  bigDeltaRow: { alignItems: 'center', marginTop: 4 },
  bigDelta: {
    flexDirection: 'row', alignItems: 'baseline', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1,
  },
  bigDeltaNum: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  bigDeltaLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },

  tipIcon: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(184,136,46,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  tipTitle: { fontSize: 12, fontWeight: '900', color: Colors.gold, letterSpacing: 0.4 },
  tipText: { fontSize: 12, color: Colors.textPrimary, lineHeight: 18, fontWeight: '500', marginTop: 2 },

  quickLink: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(196,98,45,0.06)',
    borderWidth: 1, borderColor: 'rgba(196,98,45,0.22)',
    borderRadius: 12,
    paddingVertical: 11,
  },
  quickLinkPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickLinkText: { fontSize: 11, fontWeight: '800', color: Colors.primary, letterSpacing: 0.2 },
});
