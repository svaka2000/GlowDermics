import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SHELF_KEY = 'gd_product_shelf';

type ShelfProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  rating: 1 | 2 | 3 | 4 | 5;
  notes: string;
  addedAt: string;
};

const CATEGORIES = [
  'Cleanser', 'Toner', 'Serum', 'Moisturizer', 'SPF',
  'Eye Cream', 'Oil', 'Exfoliant', 'Mask', 'Treatment', 'Other',
];

const RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Not for me', color: '#F87171' },
  2: { label: 'Meh', color: '#FB923C' },
  3: { label: 'OK', color: '#FCD34D' },
  4: { label: 'Good', color: '#86EFAC' },
  5: { label: 'Love it', color: '#4ADE80' },
};

async function getShelf(): Promise<ShelfProduct[]> {
  const raw = await AsyncStorage.getItem(SHELF_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveShelf(shelf: ShelfProduct[]): Promise<void> {
  await AsyncStorage.setItem(SHELF_KEY, JSON.stringify(shelf));
}

export default function ProductShelf() {
  const [shelf, setShelf] = useState<ShelfProduct[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Moisturizer');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [notes, setNotes] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  useFocusEffect(useCallback(() => {
    getShelf().then(setShelf);
    resetForm();
  }, []));

  const resetForm = () => {
    setName('');
    setBrand('');
    setCategory('Moisturizer');
    setRating(4);
    setNotes('');
    setAdding(false);
  };

  const save = async () => {
    if (!name.trim()) return;
    const product: ShelfProduct = {
      id: Date.now().toString(),
      name: name.trim(),
      brand: brand.trim(),
      category,
      rating,
      notes: notes.trim(),
      addedAt: new Date().toISOString(),
    };
    const updated = [product, ...shelf];
    await saveShelf(updated);
    setShelf(updated);
    resetForm();
  };

  const deleteProduct = (id: string) => {
    Alert.alert('Remove Product', 'Remove this from your shelf?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          const updated = shelf.filter(p => p.id !== id);
          await saveShelf(updated);
          setShelf(updated);
        },
      },
    ]);
  };

  const cats = ['All', ...Array.from(new Set(shelf.map(p => p.category)))];
  const displayed = filterCat === 'All' ? shelf : shelf.filter(p => p.category === filterCat);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>My Shelf</Text>
            <Text style={styles.headerSub}>{shelf.length} product{shelf.length !== 1 ? 's' : ''} saved</Text>
          </View>
          <Pressable style={styles.addBtn} onPress={() => setAdding(!adding)}>
            <Ionicons name={adding ? 'close' : 'add'} size={22} color={Colors.white} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Add form */}
        {adding && (
          <View style={styles.addCard}>
            <Text style={styles.addCardTitle}>Add a product</Text>

            <Text style={styles.fieldLabel}>Product Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. CeraVe Moisturizing Cream"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Brand</Text>
            <TextInput
              style={styles.input}
              value={brand}
              onChangeText={setBrand}
              placeholder="Brand name"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              <View style={styles.catRow}>
                {CATEGORIES.map(c => (
                  <Pressable
                    key={c}
                    style={[styles.catChip, category === c && styles.catChipActive]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Rating</Text>
            <View style={styles.ratingRow}>
              {([1, 2, 3, 4, 5] as const).map(r => (
                <Pressable
                  key={r}
                  style={[styles.ratingBtn, rating === r && { borderColor: RATING_LABELS[r].color, backgroundColor: RATING_LABELS[r].color + '18' }]}
                  onPress={() => setRating(r)}
                >
                  <Text style={styles.ratingStars}>{'★'.repeat(r)}{'☆'.repeat(5 - r)}</Text>
                  <Text style={[styles.ratingLabel, rating === r && { color: RATING_LABELS[r].color }]}>{RATING_LABELS[r].label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, { minHeight: 70 }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="How your skin reacted, when you use it..."
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.formBtns}>
              <Pressable style={styles.cancelBtn} onPress={resetForm}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.saveBtn, !name.trim() && { opacity: 0.4 }]} onPress={save} disabled={!name.trim()}>
                <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.saveBtnGrad}>
                  <Text style={styles.saveBtnText}>Save to Shelf</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        )}

        {/* Category filter */}
        {shelf.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
            {cats.map(c => (
              <Pressable
                key={c}
                style={[styles.filterChip, filterCat === c && styles.filterChipActive]}
                onPress={() => setFilterCat(c)}
              >
                <Text style={[styles.filterChipText, filterCat === c && styles.filterChipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Empty state */}
        {shelf.length === 0 && !adding && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧴</Text>
            <Text style={styles.emptyTitle}>Your shelf is empty</Text>
            <Text style={styles.emptySub}>
              Track everything you're using. Your AI skin coach will use your shelf to give you personalized advice.
            </Text>
            <Pressable style={styles.emptyBtn} onPress={() => setAdding(true)}>
              <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.emptyBtnGrad}>
                <Text style={styles.emptyBtnText}>Add Your First Product</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* Product list */}
        <View style={styles.productList}>
          {displayed.map(product => {
            const r = RATING_LABELS[product.rating];
            return (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productTop}>
                  <View style={styles.productInfo}>
                    <View style={styles.productCatBadge}>
                      <Text style={styles.productCatText}>{product.category.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.productName}>{product.name}</Text>
                    {product.brand ? <Text style={styles.productBrand}>{product.brand}</Text> : null}
                  </View>
                  <View style={styles.productRight}>
                    <View style={[styles.ratingBadge, { backgroundColor: r.color + '18' }]}>
                      <Text style={[styles.ratingBadgeText, { color: r.color }]}>{r.label}</Text>
                    </View>
                    <Pressable onPress={() => deleteProduct(product.id)} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={14} color={Colors.textMuted} />
                    </Pressable>
                  </View>
                </View>
                {product.notes ? (
                  <Text style={styles.productNotes}>{product.notes}</Text>
                ) : null}
                <Text style={styles.productDate}>
                  Added {new Date(product.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Coach tip */}
        {shelf.length > 0 && (
          <Pressable style={styles.coachTip} onPress={() => router.push('/(tabs)/coach')}>
            <LinearGradient colors={['rgba(196,98,45,0.12)', 'rgba(196,98,45,0.04)']} style={StyleSheet.absoluteFill} />
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.coachTipTitle}>Ask your AI coach about your routine</Text>
              <Text style={styles.coachTipSub}>Your shelf gives it full context about what you're using</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          </Pressable>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16 },

  addCard: {
    backgroundColor: Colors.bgCard, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.borderStrong,
    padding: 20, marginBottom: 16, gap: 4,
  },
  addCardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: Colors.textPrimary,
  },
  catRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated },
  catChipActive: { borderColor: Colors.primary, backgroundColor: 'rgba(196,98,45,0.15)' },
  catChipText: { fontSize: 12, color: Colors.textMuted },
  catChipTextActive: { color: Colors.primary, fontWeight: '600' },
  ratingRow: { gap: 6 },
  ratingBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated, paddingHorizontal: 14, paddingVertical: 10 },
  ratingStars: { fontSize: 14, color: Colors.gold, letterSpacing: 2 },
  ratingLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  formBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, backgroundColor: Colors.bgElevated, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderWidth: 1, borderColor: Colors.border },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  saveBtn: { flex: 1.5, borderRadius: 14, overflow: 'hidden' },
  saveBtnGrad: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },

  filterScroll: { marginBottom: 14 },
  filterContent: { gap: 8, paddingVertical: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  filterChipActive: { borderColor: Colors.primary, backgroundColor: 'rgba(196,98,45,0.15)' },
  filterChipText: { fontSize: 12, color: Colors.textMuted },
  filterChipTextActive: { color: Colors.primary, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  emptyBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  emptyBtnGrad: { paddingHorizontal: 28, paddingVertical: 15 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },

  productList: { gap: 10 },
  productCard: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 8 },
  productTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  productInfo: { flex: 1, gap: 4 },
  productCatBadge: { backgroundColor: 'rgba(196,98,45,0.12)', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  productCatText: { fontSize: 8, fontWeight: '800', letterSpacing: 1.5, color: Colors.primary },
  productName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, lineHeight: 21 },
  productBrand: { fontSize: 12, color: Colors.textMuted },
  productRight: { alignItems: 'flex-end', gap: 8 },
  ratingBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  ratingBadgeText: { fontSize: 11, fontWeight: '700' },
  deleteBtn: { padding: 4 },
  productNotes: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  productDate: { fontSize: 11, color: Colors.textMuted },

  coachTip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)',
    padding: 16, marginTop: 6,
  },
  coachTipTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  coachTipSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});
