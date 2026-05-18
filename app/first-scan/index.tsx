import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { fonts } from '../../src/constants/typography';
import { VelumiWordmark } from '../../src/components/ui/VelumiWordmark';

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; label: string; sub: string }[] = [
  { icon: 'sparkles-outline', label: 'Clinical-grade AI analysis', sub: 'Sixteen skin dimensions scored from a single photo.' },
  { icon: 'list-outline', label: 'A routine personalized to you', sub: 'Built around what your skin actually needs right now.' },
  { icon: 'trending-up-outline', label: 'Track progress over time', sub: 'See what’s improving and adapt as your skin changes.' },
];

export default function FirstScanScreen() {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.dismissRow}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
            style={styles.dismissBtn}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={c.textMuted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.brand}>
            <VelumiWordmark size="lg" />
          </View>

          <Text style={styles.eyebrow}>YOUR FIRST SCAN</Text>
          <Text style={styles.headline}>Your skin,{'\n'}analyzed in 30 seconds</Text>

          <View style={styles.benefits}>
            {BENEFITS.map((b) => (
              <View key={b.label} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name={b.icon} size={20} color={c.primary} />
                </View>
                <View style={styles.benefitText}>
                  <Text style={styles.benefitLabel}>{b.label}</Text>
                  <Text style={styles.benefitSub}>{b.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            style={styles.cta}
            onPress={() => router.push('/scan' as any)}
            accessibilityRole="button"
            accessibilityLabel="Start your first scan"
          >
            <Text style={styles.ctaText}>Start scan</Text>
            <Ionicons name="arrow-forward" size={18} color={c.white} />
          </Pressable>

          <Pressable
            style={styles.later}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
            accessibilityRole="button"
            accessibilityLabel="Maybe later"
          >
            <Text style={styles.laterText}>Maybe later</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    safe: { flex: 1 },
    dismissRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8 },
    dismissBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    content: { paddingHorizontal: 28, paddingTop: 12, paddingBottom: 48, alignItems: 'center' },
    brand: { marginTop: 12, marginBottom: 28 },
    eyebrow: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600', letterSpacing: 2.4, color: c.primary, textTransform: 'uppercase', marginBottom: 12 },
    headline: { fontFamily: fonts.display, fontSize: 30, fontWeight: '600', color: c.textPrimary, textAlign: 'center', letterSpacing: 0.2, lineHeight: 38, marginBottom: 36 },
    benefits: { width: '100%', gap: 18, marginBottom: 40 },
    benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
    benefitIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.bgCard,
      borderWidth: 1,
      borderColor: c.border,
    },
    benefitText: { flex: 1, gap: 3, paddingTop: 2 },
    benefitLabel: { fontFamily: fonts.display, fontSize: 17, fontWeight: '600', color: c.textPrimary, letterSpacing: 0.2 },
    benefitSub: { fontFamily: fonts.body, fontSize: 13, color: c.textSecondary, lineHeight: 19, letterSpacing: 0.1 },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      alignSelf: 'stretch',
      backgroundColor: c.primary,
      borderRadius: 16,
      paddingVertical: 17,
    },
    ctaText: { fontFamily: fonts.body, fontSize: 16, fontWeight: '700', color: c.white, letterSpacing: 0.4 },
    later: { marginTop: 18, paddingVertical: 8 },
    laterText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', color: c.textMuted, letterSpacing: 0.3 },
  });
}
