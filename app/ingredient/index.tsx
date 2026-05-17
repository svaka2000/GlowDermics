import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

const POPULAR_INGREDIENTS = [
  { name: 'Retinol', category: 'Active', emoji: '⚡' },
  { name: 'Niacinamide', category: 'Active', emoji: '✦' },
  { name: 'Hyaluronic Acid', category: 'Humectant', emoji: '💧' },
  { name: 'Vitamin C (L-Ascorbic Acid)', category: 'Antioxidant', emoji: '🍊' },
  { name: 'Glycerin', category: 'Humectant', emoji: '🌊' },
  { name: 'Salicylic Acid', category: 'Exfoliant', emoji: '🔬' },
  { name: 'Ceramides', category: 'Barrier Builder', emoji: '🛡' },
  { name: 'Zinc Oxide', category: 'UV Filter', emoji: '☀️' },
  { name: 'Benzoyl Peroxide', category: 'Antibacterial', emoji: '🔴' },
  { name: 'AHA Glycolic Acid', category: 'Exfoliant', emoji: '🧪' },
  { name: 'Squalane', category: 'Emollient', emoji: '🌿' },
  { name: 'Peptides', category: 'Anti-aging', emoji: '🔗' },
  { name: 'Oleic Acid', category: 'Fatty Acid', emoji: '🥑' },
  { name: 'Manuka Honey', category: 'Antibacterial', emoji: '🍯' },
  { name: 'Tallow (Beef Tallow)', category: 'Emollient', emoji: '🌱' },
  { name: 'Phenoxyethanol', category: 'Preservative', emoji: '⚗️' },
  { name: 'Fragrance (Parfum)', category: 'Sensitizer', emoji: '⚠️' },
  { name: 'Dimethicone', category: 'Silicone', emoji: '🔷' },
];

export default function IngredientSearch() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [search, setSearch] = useState('');

  const handleSearch = () => {
    if (!search.trim()) return;
    router.push(`/ingredient/${encodeURIComponent(search.trim())}`);
  };

  const filtered = search
    ? POPULAR_INGREDIENTS.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.category.toLowerCase().includes(search.toLowerCase())
      )
    : POPULAR_INGREDIENTS;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>Ingredient Decoder</Text>
            <Text style={styles.headerSub}>Search any cosmetic ingredient</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Search + submit */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Type any ingredient name..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {search ? (
            <Pressable style={styles.searchBtn} onPress={handleSearch}>
              <Text style={styles.searchBtnText}>Decode →</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.popularLabel}>Popular ingredients</Text>

        {/* Popular grid */}
        <View style={styles.ingredientList}>
          {filtered.map(ingredient => (
            <Pressable
              key={ingredient.name}
              style={styles.ingredientCard}
              onPress={() => router.push(`/ingredient/${encodeURIComponent(ingredient.name)}`)}
            >
              <Text style={styles.ingredientEmoji}>{ingredient.emoji}</Text>
              <View style={styles.ingredientInfo}>
                <Text style={styles.ingredientName}>{ingredient.name}</Text>
                <Text style={styles.ingredientCategory}>{ingredient.category}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <View style={{ height: 60 }} />
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

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: c.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: c.borderStrong,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 15, color: c.textPrimary },
  searchBtn: { backgroundColor: c.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  searchBtnText: { fontSize: 13, fontWeight: '700', color: c.white },

  popularLabel: { fontSize: 13, fontWeight: '700', color: c.textMuted, letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' },

  ingredientList: { gap: 8 },
  ingredientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: c.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: c.border, padding: 14,
  },
  ingredientEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  ingredientInfo: { flex: 1 },
  ingredientName: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
  ingredientCategory: { fontSize: 11, color: c.textMuted, marginTop: 2 },
  });
}
