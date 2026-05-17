import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

function buildSkinTypes(c: Palette) {
  return [
  {
    type: 'oily',
    emoji: '✨',
    name: 'Oily Skin',
    tagline: 'Sebum overproduction, shine, enlarged pores',
    color: c.scoreFair,
  },
  {
    type: 'dry',
    emoji: '🏜',
    name: 'Dry Skin',
    tagline: 'Tight, rough, easily irritated, low lipid production',
    color: '#60A5FA',
  },
  {
    type: 'combination',
    emoji: '🌗',
    name: 'Combination Skin',
    tagline: 'Oily T-zone, normal or dry cheeks',
    color: c.gold,
  },
  {
    type: 'normal',
    emoji: '🌿',
    name: 'Normal Skin',
    tagline: 'Well-balanced, minimal issues, forgiving',
    color: c.scoreExcellent,
  },
  {
    type: 'sensitive',
    emoji: '🌡',
    name: 'Sensitive Skin',
    tagline: 'Reactive, prone to redness, barrier disruption',
    color: c.scorePoor,
  },
  ];
}

export default function SkinTypeLibrary() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const SKIN_TYPES = useMemo(() => buildSkinTypes(colors), [colors]);
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>Skin Type Guides</Text>
            <Text style={styles.headerSub}>Deep-dives on every skin type</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>Select your skin type for a comprehensive guide — causes, best ingredients, routine, and pro tips.</Text>

        <View style={styles.typeList}>
          {SKIN_TYPES.map(st => (
            <Pressable
              key={st.type}
              style={styles.typeCard}
              onPress={() => router.push(`/skin-type/${st.type}`)}
            >
              <LinearGradient colors={[st.color + '12', st.color + '04']} style={StyleSheet.absoluteFill} />
              <Text style={styles.typeEmoji}>{st.emoji}</Text>
              <View style={styles.typeInfo}>
                <Text style={[styles.typeName, { color: st.color }]}>{st.name}</Text>
                <Text style={styles.typeTagline}>{st.tagline}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.quizCta} onPress={() => router.push('/quiz')}>
          <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} />
          <View style={styles.quizCtaContent}>
            <Ionicons name="help-circle-outline" size={20} color={colors.white} />
            <View>
              <Text style={styles.quizCtaTitle}>Not sure of your skin type?</Text>
              <Text style={styles.quizCtaSub}>Take the 6-question quiz</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
        </Pressable>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },
  intro: { fontSize: 14, color: c.textSecondary, lineHeight: 22, marginBottom: 20 },
  typeList: { gap: 10, marginBottom: 16 },
  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: c.border,
    padding: 18,
  },
  typeEmoji: { fontSize: 28 },
  typeInfo: { flex: 1, gap: 4 },
  typeName: { fontSize: 16, fontWeight: '700' },
  typeTagline: { fontSize: 12, color: c.textMuted, lineHeight: 17 },
  quizCta: { borderRadius: 16, overflow: 'hidden' },
  quizCtaContent: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  quizCtaTitle: { fontSize: 15, fontWeight: '700', color: c.white },
  quizCtaSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  });
}
