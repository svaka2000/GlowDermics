import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { fonts } from '../../src/constants/typography';
import { Storage } from '../../src/services/storage';
import { PhotoCompareSlider } from '../../src/components/ui/PhotoCompareSlider';
import { deriveBeforeAfter, type BeforeAfterReport } from '../../src/engine/BeforeAfterEngine';

const SLIDER_W = Math.max(160, Math.round(Dimensions.get('window').width) - 48);

export default function BeforeAfterScreen() {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [report, setReport] = useState<BeforeAfterReport | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Storage.getAnalyses().then((list) => {
        const result = deriveBeforeAfter(Array.isArray(list) ? list : [], Date.now());
        if (alive) setReport(result);
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  const handleShare = useCallback(async () => {
    if (!report || !report.hasPair) return;
    const dir = report.overallDelta >= 0 ? 'up' : 'down';
    const message =
      `My skin is ${dir} ${Math.abs(report.overallDelta)} pts over ${report.daysBetween} ` +
      `${report.daysBetween === 1 ? 'day' : 'days'} on Velumi AI. velumi.ai`;
    try {
      await Share.share({ message, title: 'My Velumi AI transformation' });
    } catch {
      /* user dismissed the share sheet — no-op */
    }
  }, [report]);

  const hasPhotos = !!report?.before?.imageUri && !!report?.after?.imageUri;
  const deltaColor = !report
    ? c.textMuted
    : report.overallDelta >= 0
      ? c.scoreGood
      : c.gold;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={c.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Before / After
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        {!report ? null : !report.hasPair ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.eyebrow}>YOUR TRANSFORMATION</Text>
            <Text style={styles.emptyTitle}>Two scans unlock{'\n'}your before / after</Text>
            <Text style={styles.emptySub}>
              Take another scan a few weeks apart and Velumi AI will line them up side by side with your score change.
            </Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/scan' as any)} accessibilityRole="button">
              <Text style={styles.emptyBtnText}>Take a scan</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.eyebrow}>YOUR TRANSFORMATION</Text>

            {hasPhotos ? (
              <View style={styles.sliderWrap}>
                <PhotoCompareSlider
                  leftSource={report.before!.imageUri}
                  rightSource={report.after!.imageUri}
                  width={SLIDER_W}
                  aspectRatio={0.8}
                  leftCaption="BEFORE"
                  rightCaption="AFTER"
                />
              </View>
            ) : (
              <View style={styles.noPhotoCard}>
                <Ionicons name="image-outline" size={26} color={c.textMuted} />
                <Text style={styles.noPhotoText}>
                  Photos will appear here once your scans include images. Your score change is still tracked below.
                </Text>
              </View>
            )}

            <View style={styles.deltaBlock}>
              <Text style={[styles.deltaNum, { color: deltaColor }]}>
                {report.overallDelta >= 0 ? '+' : ''}
                {report.overallDelta}
              </Text>
              <Text style={styles.deltaCaption}>
                overall · over {report.daysBetween} {report.daysBetween === 1 ? 'day' : 'days'}
              </Text>
            </View>

            {report.topMovers.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>BIGGEST MOVERS</Text>
                <View style={styles.chips}>
                  {report.topMovers.map((m) => {
                    const up = m.delta >= 0;
                    return (
                      <View key={m.key} style={[styles.chip, { borderColor: up ? c.scoreGood : c.gold }]}>
                        <Text style={styles.chipLabel}>{m.label}</Text>
                        <Text style={[styles.chipDelta, { color: up ? c.scoreGood : c.gold }]}>
                          {up ? '+' : ''}
                          {m.delta}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            <Pressable style={styles.shareBtn} onPress={handleShare} accessibilityRole="button" accessibilityLabel="Share my transformation">
              <Ionicons name="share-outline" size={18} color={c.white} />
              <Text style={styles.shareText}>Share my transformation</Text>
            </Pressable>
            <View style={{ height: 60 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontFamily: fonts.display, fontSize: 18, fontWeight: '600', color: c.textPrimary, letterSpacing: 0.3 },
    content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
    eyebrow: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', letterSpacing: 2.4, color: c.primary, textTransform: 'uppercase', marginBottom: 16 },
    sliderWrap: { alignItems: 'center', marginBottom: 22 },
    noPhotoCard: {
      backgroundColor: c.bgCard,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      alignItems: 'center',
      gap: 10,
      marginBottom: 22,
    },
    noPhotoText: { fontFamily: fonts.body, fontSize: 13, color: c.textSecondary, textAlign: 'center', lineHeight: 19, letterSpacing: 0.1 },
    deltaBlock: { alignItems: 'center', marginBottom: 24 },
    deltaNum: { fontFamily: fonts.display, fontSize: 44, fontWeight: '600', letterSpacing: 0.2 },
    deltaCaption: { fontFamily: fonts.body, fontSize: 12, fontWeight: '600', letterSpacing: 1.6, color: c.textMuted, textTransform: 'uppercase', marginTop: 4 },
    sectionLabel: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', letterSpacing: 2.4, color: c.textMuted, textTransform: 'uppercase', marginBottom: 12 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    chipLabel: { fontFamily: fonts.body, fontSize: 13, color: c.textSecondary, letterSpacing: 0.1 },
    chipDelta: { fontFamily: fonts.display, fontSize: 15, fontWeight: '600' },
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      alignSelf: 'stretch',
      backgroundColor: c.primary,
      borderRadius: 16,
      paddingVertical: 16,
    },
    shareText: { fontFamily: fonts.body, fontSize: 15, fontWeight: '700', color: c.white, letterSpacing: 0.4 },
    emptyWrap: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 12 },
    emptyTitle: { fontFamily: fonts.display, fontSize: 27, fontWeight: '600', color: c.textPrimary, textAlign: 'center', letterSpacing: 0.2, lineHeight: 34, marginTop: 14 },
    emptySub: { fontFamily: fonts.body, fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: 12, maxWidth: 300, letterSpacing: 0.1 },
    emptyBtn: { marginTop: 24, borderRadius: 14, borderWidth: 1, borderColor: c.borderStrong, paddingHorizontal: 24, paddingVertical: 13 },
    emptyBtnText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', color: c.primary, letterSpacing: 0.3 },
  });
}
