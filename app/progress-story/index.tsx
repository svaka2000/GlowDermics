import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { fonts } from '../../src/constants/typography';
import { Storage } from '../../src/services/storage';
import type { SkinAnalysis } from '../../src/types';
import { ProgressStoryCard, deriveProgressStory } from '../../src/components/ui/ProgressStoryCard';

export default function ProgressStoryScreen() {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [analyses, setAnalyses] = useState<SkinAnalysis[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Storage.getAnalyses().then((list) => {
        if (alive) setAnalyses(Array.isArray(list) ? list : []);
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  const stats = useMemo(() => (analyses ? deriveProgressStory(analyses) : null), [analyses]);
  const hasData = !!analyses && analyses.length > 0;

  const handleShare = useCallback(async () => {
    if (!stats) return;
    const sinceClause = stats.multi
      ? `, ${stats.overallDelta >= 0 ? '+' : ''}${stats.overallDelta} since ${stats.sinceLabel}`
      : '';
    const message =
      `My skin is at ${stats.overall}/100 on Velumi AI${sinceClause}. ` +
      `${stats.scans} ${stats.scans === 1 ? 'scan' : 'scans'} tracked — clinical-grade AI skin analysis. velumi.ai`;
    try {
      await Share.share({ message, title: 'My Velumi AI Skin Story' });
    } catch {
      /* user dismissed the share sheet — no-op */
    }
  }, [stats]);

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
            Progress Story
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        {!analyses ? null : hasData ? (
          <>
            <ProgressStoryCard analyses={analyses} />
            <Pressable style={styles.shareBtn} onPress={handleShare} accessibilityRole="button" accessibilityLabel="Share your skin story">
              <Ionicons name="share-outline" size={18} color={c.white} />
              <Text style={styles.shareText}>Share my story</Text>
            </Pressable>
            <Pressable style={styles.inviteBtn} onPress={() => router.push('/invite' as any)} accessibilityRole="button" accessibilityLabel="Invite a friend">
              <Ionicons name="people-outline" size={18} color={c.primary} />
              <Text style={styles.inviteBtnText}>Invite a friend</Text>
            </Pressable>
            <Text style={styles.caption}>A premium recap of your skin journey, ready to share.</Text>
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyEyebrow}>SKIN PROGRESS</Text>
            <Text style={styles.emptyTitle}>Your story starts{'\n'}with one scan</Text>
            <Text style={styles.emptySub}>
              Run your first analysis and Velumi AI will start tracking how your skin evolves over time.
            </Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/scanner' as any)} accessibilityRole="button" accessibilityLabel="Take a scan">
              <Text style={styles.emptyBtnText}>Take a scan</Text>
            </Pressable>
          </View>
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
    content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 48, alignItems: 'center' },
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 28,
      paddingVertical: 15,
      paddingHorizontal: 28,
      borderRadius: 16,
      backgroundColor: c.primary,
      alignSelf: 'stretch',
    },
    shareText: { fontFamily: fonts.body, fontSize: 15, fontWeight: '700', color: c.white, letterSpacing: 0.4 },
    inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'stretch', marginTop: 12, borderWidth: 1, borderColor: c.borderStrong, borderRadius: 16, paddingVertical: 15 },
    inviteBtnText: { fontFamily: fonts.body, fontSize: 15, fontWeight: '700', color: c.primary, letterSpacing: 0.4 },
    caption: { fontFamily: fonts.body, fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 14, letterSpacing: 0.1 },
    empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 12 },
    emptyEyebrow: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', letterSpacing: 2.4, color: c.primary, textTransform: 'uppercase', marginBottom: 14 },
    emptyTitle: { fontFamily: fonts.display, fontSize: 27, fontWeight: '600', color: c.textPrimary, textAlign: 'center', letterSpacing: 0.2, lineHeight: 34 },
    emptySub: { fontFamily: fonts.body, fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: 12, maxWidth: 300, letterSpacing: 0.1 },
    emptyBtn: { marginTop: 24, borderRadius: 14, borderWidth: 1, borderColor: c.borderStrong, paddingHorizontal: 24, paddingVertical: 13 },
    emptyBtnText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', color: c.primary, letterSpacing: 0.3 },
  });
}
