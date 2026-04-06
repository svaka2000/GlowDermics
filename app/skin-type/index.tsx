import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';

const SKIN_TYPES = [
  {
    type: 'oily',
    emoji: '✨',
    name: 'Oily Skin',
    tagline: 'Sebum overproduction, shine, enlarged pores',
    color: Colors.scoreFair,
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
    color: Colors.gold,
  },
  {
    type: 'normal',
    emoji: '🌿',
    name: 'Normal Skin',
    tagline: 'Well-balanced, minimal issues, forgiving',
    color: Colors.scoreExcellent,
  },
  {
    type: 'sensitive',
    emoji: '🌡',
    name: 'Sensitive Skin',
    tagline: 'Reactive, prone to redness, barrier disruption',
    color: Colors.scorePoor,
  },
];

export default function SkinTypeLibrary() {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Skin Type Guides</Text>
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
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.quizCta} onPress={() => router.push('/quiz')}>
          <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={StyleSheet.absoluteFill} />
          <View style={styles.quizCtaContent}>
            <Ionicons name="help-circle-outline" size={20} color={Colors.white} />
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },
  intro: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 20 },
  typeList: { gap: 10, marginBottom: 16 },
  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
    padding: 18,
  },
  typeEmoji: { fontSize: 28 },
  typeInfo: { flex: 1, gap: 4 },
  typeName: { fontSize: 16, fontWeight: '700' },
  typeTagline: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  quizCta: { borderRadius: 16, overflow: 'hidden' },
  quizCtaContent: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  quizCtaTitle: { fontSize: 15, fontWeight: '700', color: Colors.white },
  quizCtaSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
});
