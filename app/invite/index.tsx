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
import { deriveReferral, type ReferralResult } from '../../src/engine/ReferralEngine';

export default function InviteScreen() {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [ref, setRef] = useState<ReferralResult | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [analyses, streak] = await Promise.all([
          Storage.getAnalyses(),
          Storage.getStreak(),
        ]);
        const list: SkinAnalysis[] = Array.isArray(analyses) ? analyses : [];
        const seed = list.length ? list[list.length - 1].id : 'velumi-guest';
        const latest = list[0];
        const rawOverall = latest?.scores?.overall;
        const overall = typeof rawOverall === 'number' && Number.isFinite(rawOverall)
          ? Math.round(rawOverall)
          : null;
        const result = deriveReferral({
          seed,
          scans: list.length,
          streak: typeof streak === 'number' ? streak : 0,
          overall,
        });
        if (alive) setRef(result);
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  const handleShare = useCallback(async () => {
    if (!ref) return;
    try {
      await Share.share({ message: ref.shareMessage, title: ref.shareTitle });
    } catch {
      /* user dismissed the share sheet — no-op */
    }
  }, [ref]);

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
            Invite a friend
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>SHARE VELUMI AI</Text>
        <Text style={styles.headline}>Share your skin{'\n'}journey</Text>
        <Text style={styles.sub}>
          Pass Velumi AI to someone whose skin you'd want tracked — clinical-grade analysis, free to start.
        </Text>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>YOUR INVITE CODE</Text>
          <Text style={styles.codeText}>{ref ? ref.code : '· · · · · ·'}</Text>
        </View>

        <Pressable
          style={styles.shareBtn}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share invite"
        >
          <Ionicons name="share-outline" size={18} color={c.white} />
          <Text style={styles.shareText}>Share invite</Text>
        </Pressable>

        <Text style={styles.footnote}>
          No account needed — your code just personalizes the message you send.
        </Text>
        <View style={{ height: 60 }} />
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
    eyebrow: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', letterSpacing: 2.4, color: c.primary, textTransform: 'uppercase', marginBottom: 14 },
    headline: { fontFamily: fonts.display, fontSize: 28, fontWeight: '600', color: c.textPrimary, letterSpacing: 0.2, lineHeight: 35 },
    sub: { fontFamily: fonts.body, fontSize: 14, color: c.textSecondary, lineHeight: 22, letterSpacing: 0.1, marginTop: 12, maxWidth: 320 },
    codeCard: {
      marginTop: 28,
      backgroundColor: c.bgCard,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 26,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    codeLabel: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', letterSpacing: 2.4, color: c.textMuted, textTransform: 'uppercase', marginBottom: 12 },
    codeText: { fontFamily: fonts.display, fontSize: 26, fontWeight: '600', color: c.textPrimary, letterSpacing: 3 },
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      alignSelf: 'stretch',
      backgroundColor: c.primary,
      borderRadius: 16,
      paddingVertical: 16,
      marginTop: 28,
    },
    shareText: { fontFamily: fonts.body, fontSize: 15, fontWeight: '700', color: c.white, letterSpacing: 0.4 },
    footnote: { fontFamily: fonts.body, fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 18, lineHeight: 18, letterSpacing: 0.1 },
  });
}
