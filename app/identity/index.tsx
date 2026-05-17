import { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../src/state/theme';
import type { Palette } from '../../src/constants/colors';
import { runSkinIdentity, SkinIdentity } from '../../src/engine/SkinIdentityEngine';
import { SkinIdentityCard, Skeleton, SkinAura } from '../../src/components/ui';
import { Dimensions } from 'react-native';

/** Identity — full-screen Skin Persona reveal with shareable card. */
export default function IdentityScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [identity, setIdentity] = useState<SkinIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await runSkinIdentity();
        if (!cancelled) setIdentity(r);
      } catch {
        if (!cancelled) setIdentity(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []));

  const onShare = async () => {
    if (!identity) return;
    try {
      await Share.share({
        title: 'My Skin Identity',
        message: `I'm "${identity.persona}" on GlowDermics — Glow Score ${identity.glowScore}/100. ${identity.signature}`,
      });
    } catch {}
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Skin Identity</Text>
          <Pressable
            onPress={onShare}
            style={styles.shareBtn}
            hitSlop={8}
            disabled={!identity}
          >
            <Ionicons name="share-outline" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}>
              <Skeleton width={'95%' as any} height={520} radius={24} />
            </View>
          ) : identity ? (
            <>
              <View style={styles.auraWrap}>
                <SkinAura
                  identity={identity}
                  width={Dimensions.get('window').width - 40}
                  height={140}
                />
              </View>
              <View style={styles.cardWrap}>
                <SkinIdentityCard identity={identity} />
              </View>

              <View style={styles.byline}>
                <Text style={styles.bylineText}>
                  Your identity is computed from your scan history, journal, streak, and habits.
                  It evolves as your skin evolves.
                </Text>
              </View>

              <Pressable style={styles.shareCta} onPress={onShare}>
                <Ionicons name="share-outline" size={18} color="#fff" />
                <Text style={styles.shareCtaText}>Share my identity</Text>
              </Pressable>
            </>
          ) : (
            <EmptyState />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function EmptyState() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name="finger-print-outline" size={56} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>Identity not ready yet</Text>
      <Text style={styles.emptySub}>Take your first scan to unlock your Skin Persona.</Text>
      <Pressable style={styles.emptyCta} onPress={() => router.push('/scan')}>
        <Text style={styles.emptyCtaText}>Take a scan</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    safe: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 8,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
    },
    shareBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: c.textPrimary, letterSpacing: -0.2 },
    content: { paddingBottom: 40 },
    cardWrap: { paddingHorizontal: 20, paddingTop: 8 },
    auraWrap: { paddingHorizontal: 20, paddingTop: 18, marginBottom: -8 },
    byline: {
      paddingHorizontal: 36,
      paddingTop: 22,
    },
    bylineText: {
      fontSize: 12,
      color: c.textMuted,
      lineHeight: 18,
      textAlign: 'center',
    },
    shareCta: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: c.primary,
      borderRadius: 14,
      paddingVertical: 14,
      marginHorizontal: 24,
      marginTop: 22,
    },
    shareCtaText: { fontSize: 14, fontWeight: '700', color: '#fff' },

    emptyWrap: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
    emptySub: { fontSize: 13, color: c.textMuted, textAlign: 'center', lineHeight: 18 },
    emptyCta: {
      marginTop: 16, backgroundColor: c.primary,
      paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12,
    },
    emptyCtaText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  });
}
