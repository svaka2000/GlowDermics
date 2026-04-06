import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';
import { findDupes, DupeResult } from '../../src/services/dupeFinder';

const POPULAR = [
  { name: 'Drunk Elephant Protini', brand: 'Drunk Elephant' },
  { name: 'La Mer Moisturizing Cream', brand: 'La Mer' },
  { name: 'SK-II Facial Treatment Essence', brand: 'SK-II' },
  { name: 'Tatcha The Dewy Skin Cream', brand: 'Tatcha' },
  { name: 'Sunday Riley Good Genes', brand: 'Sunday Riley' },
];

export default function Dupes() {
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DupeResult | null>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const search = async (name = productName, b = brand) => {
    if (!name.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await findDupes(name.trim(), b.trim() || 'Unknown');
      setResult(res);
    } catch (err: any) {
      Alert.alert('Search Failed', err?.message || 'Could not find dupes. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickSearch = (item: typeof POPULAR[0]) => {
    setProductName(item.name);
    setBrand(item.brand);
    search(item.name, item.brand);
  };

  if (result) {
    return <DupeResults result={result} onBack={() => setResult(null)} onNewSearch={() => { setResult(null); setProductName(''); setBrand(''); }} />;
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Dupe Finder</Text>
          <View style={{ width: 40 }} />
        </Animated.View>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={{ opacity: contentAnim }}>

          <View style={styles.hero}>
            <LinearGradient colors={['rgba(196,98,45,0.12)', 'transparent']} style={styles.heroGlow} />
            <View style={styles.heroIconWrap}>
              <LinearGradient colors={[Colors.gold, '#C4622D']} style={styles.heroIconGrad}>
                <Text style={styles.heroIcon}>💰</Text>
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>Stop Overpaying</Text>
            <Text style={styles.heroSub}>Find cheaper products with the same active ingredients. Same results, fraction of the price.</Text>
          </View>

          <View style={styles.searchCard}>
            <Text style={styles.searchLabel}>Product Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Drunk Elephant Protini"
              placeholderTextColor={Colors.textMuted}
              value={productName}
              onChangeText={setProductName}
              returnKeyType="next"
            />
            <Text style={[styles.searchLabel, { marginTop: 12 }]}>Brand (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Drunk Elephant"
              placeholderTextColor={Colors.textMuted}
              value={brand}
              onChangeText={setBrand}
              returnKeyType="search"
              onSubmitEditing={() => search()}
            />
            <Pressable
              style={[styles.searchBtn, (!productName.trim() || loading) && styles.searchBtnDisabled]}
              onPress={() => search()}
              disabled={!productName.trim() || loading}
            >
              <LinearGradient
                colors={productName.trim() ? [Colors.gold, Colors.primary] : ['#333', '#222']}
                style={styles.searchBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="search" size={18} color={Colors.white} />
                    <Text style={styles.searchBtnText}>Find Dupes</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          <Text style={styles.popularTitle}>Popular Searches</Text>
          <View style={styles.popularList}>
            {POPULAR.map((item) => (
              <Pressable key={item.name} style={styles.popularItem} onPress={() => quickSearch(item)}>
                <View style={styles.popularInfo}>
                  <Text style={styles.popularName}>{item.name}</Text>
                  <Text style={styles.popularBrand}>{item.brand}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </Pressable>
            ))}
          </View>

        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function DupeResults({ result, onBack, onNewSearch }: { result: DupeResult; onBack: () => void; onNewSearch: () => void }) {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Dupe Results</Text>
          <Pressable onPress={onNewSearch} style={styles.backBtn}>
            <Ionicons name="search" size={20} color={Colors.primary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.resultsScroll}>

        {/* Original product */}
        <View style={styles.originalCard}>
          <Text style={styles.originalEyebrow}>YOU SEARCHED</Text>
          <Text style={styles.originalName}>{result.originalProduct}</Text>
          <Text style={styles.originalBrand}>{result.originalBrand} · {result.estimatedPrice}</Text>
          <View style={styles.keyIngredients}>
            <Text style={styles.keyIngrLabel}>Key actives:</Text>
            {result.keyIngredients.map(ing => (
              <View key={ing} style={styles.ingChip}>
                <Text style={styles.ingChipText}>{ing}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Why they work */}
        <View style={styles.whyCard}>
          <Ionicons name="bulb-outline" size={16} color={Colors.gold} />
          <Text style={styles.whyText}>{result.whyTheyWork}</Text>
        </View>

        {/* Dupes */}
        <Text style={styles.dupesTitle}>Best Dupes Found</Text>
        {result.dupes.map((dupe, i) => (
          <View key={i} style={[styles.dupeCard, i === 0 && styles.dupeCardBest]}>
            {i === 0 && (
              <LinearGradient colors={['rgba(212,169,106,0.12)', 'rgba(196,98,45,0.06)']} style={StyleSheet.absoluteFill} />
            )}
            <View style={styles.dupeTop}>
              <View style={styles.dupeMatch}>
                <Text style={[styles.dupeMatchNum, { color: dupe.matchScore >= 80 ? Colors.scoreExcellent : dupe.matchScore >= 60 ? Colors.scoreFair : Colors.scorePoor }]}>
                  {dupe.matchScore}%
                </Text>
                <Text style={styles.dupeMatchLabel}>Match</Text>
              </View>
              <View style={styles.dupeInfo}>
                <View style={styles.dupeNameRow}>
                  {i === 0 && <Text style={styles.bestBadge}>BEST DUPE</Text>}
                </View>
                <Text style={styles.dupeName}>{dupe.name}</Text>
                <Text style={styles.dupeBrand}>{dupe.brand}</Text>
              </View>
              <View style={styles.dupePriceWrap}>
                <Text style={styles.dupePrice}>{dupe.estimatedPrice}</Text>
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>-{dupe.savingsPercent}%</Text>
                </View>
              </View>
            </View>

            {dupe.sharedIngredients.length > 0 && (
              <View style={styles.sharedRow}>
                <Text style={styles.sharedLabel}>Shares: </Text>
                <Text style={styles.sharedIngredients}>{dupe.sharedIngredients.join(', ')}</Text>
              </View>
            )}

            <Text style={styles.dupeDiff}>{dupe.differences}</Text>

            <View style={styles.whereToBuyRow}>
              <Ionicons name="storefront-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.whereToBuy}>{dupe.whereToBuy}</Text>
            </View>
          </View>
        ))}

        {/* TallowDermics note */}
        {result.tallowDermicsNote && (
          <View style={styles.tdNote}>
            <LinearGradient colors={['rgba(196,98,45,0.1)', 'rgba(196,98,45,0.04)']} style={StyleSheet.absoluteFill} />
            <Text style={styles.tdNoteEyebrow}>TALLOWDERMICS PERSPECTIVE</Text>
            <Text style={styles.tdNoteText}>{result.tallowDermicsNote}</Text>
          </View>
        )}

        <Pressable style={styles.newSearchBtn} onPress={onNewSearch}>
          <Text style={styles.newSearchText}>Search Another Product →</Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  hero: { alignItems: 'center', paddingVertical: 28, position: 'relative' },
  heroGlow: { position: 'absolute', top: 0, left: '10%', right: '10%', height: 80, borderRadius: 40 },
  heroIconWrap: { borderRadius: 26, overflow: 'hidden', marginBottom: 16 },
  heroIconGrad: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', borderRadius: 26 },
  heroIcon: { fontSize: 36 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  heroSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 300 },

  searchCard: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 18, marginBottom: 24 },
  searchLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 8 },
  input: { backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.textPrimary },
  searchBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 16 },
  searchBtnDisabled: { opacity: 0.5 },
  searchBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  searchBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },

  popularTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  popularList: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  popularItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  popularInfo: { flex: 1 },
  popularName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  popularBrand: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  resultsScroll: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },
  originalCard: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 18, marginBottom: 12 },
  originalEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: Colors.textMuted, marginBottom: 6 },
  originalName: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  originalBrand: { fontSize: 13, color: Colors.textSecondary, marginBottom: 14 },
  keyIngredients: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  keyIngrLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  ingChip: { backgroundColor: 'rgba(196,98,45,0.1)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  ingChipText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },

  whyCard: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: 'rgba(212,169,106,0.08)', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(212,169,106,0.15)' },
  whyText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, flex: 1 },

  dupesTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  dupeCard: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 10, overflow: 'hidden' },
  dupeCardBest: { borderColor: Colors.borderStrong },
  dupeTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  dupeMatch: { alignItems: 'center', minWidth: 44 },
  dupeMatchNum: { fontSize: 18, fontWeight: '900' },
  dupeMatchLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  dupeInfo: { flex: 1 },
  dupeNameRow: { marginBottom: 2 },
  bestBadge: { fontSize: 8, fontWeight: '800', letterSpacing: 1.5, color: Colors.gold, backgroundColor: 'rgba(212,169,106,0.15)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  dupeName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  dupeBrand: { fontSize: 12, color: Colors.textMuted },
  dupePriceWrap: { alignItems: 'flex-end', gap: 4 },
  dupePrice: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  savingsBadge: { backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  savingsText: { fontSize: 11, fontWeight: '700', color: Colors.scoreExcellent },
  sharedRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, alignItems: 'flex-start' },
  sharedLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  sharedIngredients: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  dupeDiff: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 10 },
  whereToBuyRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  whereToBuy: { fontSize: 11, color: Colors.textMuted },

  tdNote: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderStrong, padding: 16, marginBottom: 14 },
  tdNoteEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: Colors.primary, marginBottom: 8 },
  tdNoteText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  newSearchBtn: { alignItems: 'center', paddingVertical: 16 },
  newSearchText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
});
