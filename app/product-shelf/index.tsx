import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, TextInput, Alert, Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const Colors = {
  bg: '#0A0A0F',
  card: '#13131A',
  cardAlt: '#1A1A24',
  border: '#2A2A3A',
  primary: '#C4622D',
  gold: '#D4A96A',
  textPrimary: '#FAF3E0',
  textSecondary: '#9A9AAF',
  textMuted: '#5A5A6E',
  green: '#4ADE80',
  red: '#F87171',
  blue: '#60A5FA',
  yellow: '#FBBF24',
};

const STORAGE_KEY = 'gd_product_shelf';

const CATEGORIES = ['Cleanser', 'Toner', 'Serum', 'Moisturizer', 'SPF', 'Treatment', 'Eye Care', 'Mask', 'Oil', 'Balm', 'Other'];
const TIMES = ['AM', 'PM', 'AM & PM'];
const RATINGS = [
  { value: 5, label: 'Love it ✨' },
  { value: 4, label: 'Really like it' },
  { value: 3, label: 'Okay' },
  { value: 2, label: "Doesn't wow me" },
  { value: 1, label: 'Not for me' },
];

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  timeOfUse: string;
  dateAdded: string;
  rating: number;
  notes: string;
  isActive: boolean;
  reactions: string[];
}

const today = () => new Date().toISOString().split('T')[0];
const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const daysSince = (d: string) => Math.floor((Date.now() - new Date(d + 'T00:00:00').getTime()) / 86400000);

const REACTION_OPTIONS = ['Breakout', 'Redness', 'Irritation', 'Dryness', 'Pilling', 'Stinging', 'Purging', 'Great results', 'No reaction'];

const ratingColor = (r: number) => {
  if (r >= 4) return Colors.green;
  if (r >= 3) return Colors.gold;
  return Colors.red;
};

const categoryEmoji: Record<string, string> = {
  Cleanser: '🫧', Toner: '💧', Serum: '🧪', Moisturizer: '🧴', SPF: '☀️',
  Treatment: '⚗️', 'Eye Care': '👁️', Mask: '🫙', Oil: '🌿', Balm: '🌱', Other: '📦',
};

export default function ProductShelfScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [adding, setAdding] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Add form state
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Moisturizer');
  const [timeOfUse, setTimeOfUse] = useState('PM');
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState('');
  const [reactions, setReactions] = useState<string[]>([]);

  useFocusEffect(useCallback(() => { load(); }, []));

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setProducts(JSON.parse(raw));
    } catch {}
  };

  const save = async (updated: Product[]) => {
    setProducts(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addProduct = async () => {
    if (!name.trim()) return;
    const product: Product = {
      id: `p_${Date.now()}`,
      name: name.trim(),
      brand: brand.trim(),
      category,
      timeOfUse,
      dateAdded: today(),
      rating,
      notes: notes.trim(),
      isActive: true,
      reactions,
    };
    await save([product, ...products]);
    setAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setName(''); setBrand(''); setCategory('Moisturizer');
    setTimeOfUse('PM'); setRating(3); setNotes(''); setReactions([]);
  };

  const toggleActive = async (id: string) => {
    const updated = products.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p);
    await save(updated);
    if (viewingProduct?.id === id) setViewingProduct(updated.find(p => p.id === id) || null);
  };

  const deleteProduct = (id: string) => {
    Alert.alert('Remove Product', 'Remove this product from your shelf?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await save(products.filter(p => p.id !== id));
          setViewingProduct(null);
        },
      },
    ]);
  };

  const toggleReaction = (r: string) => {
    setReactions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const filtered = products.filter(p => {
    if (filter === 'active' && !p.isActive) return false;
    if (filter === 'inactive' && p.isActive) return false;
    if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
    return true;
  });

  const allCategories = ['All', ...CATEGORIES.filter(c => products.some(p => p.category === c))];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Shelf</Text>
        <TouchableOpacity onPress={() => { resetForm(); setAdding(true); }} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{products.filter(p => p.isActive).length}</Text>
          <Text style={styles.statLbl}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{products.filter(p => p.rating >= 4).length}</Text>
          <Text style={styles.statLbl}>Loved</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{products.length}</Text>
          <Text style={styles.statLbl}>Total</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['active', 'all', 'inactive'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
              {f === 'active' ? 'In Use' : f === 'all' ? 'All' : 'Retired'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {allCategories.length > 2 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
          {allCategories.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.catChip, categoryFilter === c && styles.catChipActive]}
              onPress={() => setCategoryFilter(c)}
            >
              <Text style={[styles.catChipText, categoryFilter === c && styles.catChipTextActive]}>
                {c !== 'All' ? categoryEmoji[c] + ' ' : ''}{c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🧴</Text>
            <Text style={styles.emptyText}>
              {products.length === 0
                ? 'Your shelf is empty. Add your first product.'
                : 'No products match this filter.'}
            </Text>
          </View>
        ) : (
          filtered.map(product => (
            <TouchableOpacity
              key={product.id}
              style={[styles.productCard, !product.isActive && styles.productCardInactive]}
              onPress={() => setViewingProduct(product)}
              activeOpacity={0.8}
            >
              <View style={styles.productLeft}>
                <Text style={styles.productEmoji}>{categoryEmoji[product.category] || '📦'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{product.name}</Text>
                  {product.brand ? <Text style={styles.productBrand}>{product.brand}</Text> : null}
                  <View style={styles.productMeta}>
                    <Text style={styles.productTime}>{product.timeOfUse}</Text>
                    <Text style={styles.productDays}>{daysSince(product.dateAdded)}d</Text>
                    {'★'.repeat(product.rating).split('').map((_, i) => (
                      <Text key={i} style={[styles.productStar, { color: ratingColor(product.rating) }]}>★</Text>
                    ))}
                  </View>
                </View>
              </View>
              {!product.isActive && <Text style={styles.retiredBadge}>RETIRED</Text>}
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Product Modal */}
      <Modal visible={adding} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAdding(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Product</Text>
            <TouchableOpacity onPress={addProduct}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Product name *" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="Brand (optional)" placeholderTextColor={Colors.textMuted} />
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c} style={[styles.optionChip, category === c && styles.optionChipActive]} onPress={() => setCategory(c)}>
                  <Text style={[styles.optionChipText, category === c && styles.optionChipTextActive]}>{categoryEmoji[c]} {c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.fieldLabel}>When do you use it?</Text>
            <View style={styles.timeRow}>
              {TIMES.map(t => (
                <TouchableOpacity key={t} style={[styles.optionChip, timeOfUse === t && styles.optionChipActive]} onPress={() => setTimeOfUse(t)}>
                  <Text style={[styles.optionChipText, timeOfUse === t && styles.optionChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Rating</Text>
            <View style={styles.ratingRow}>
              {RATINGS.map(r => (
                <TouchableOpacity key={r.value} style={[styles.ratingChip, rating === r.value && styles.ratingChipActive]} onPress={() => setRating(r.value)}>
                  <Text style={[styles.ratingChipText, rating === r.value && { color: ratingColor(r.value) }]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Skin reactions (optional)</Text>
            <View style={styles.reactionsGrid}>
              {REACTION_OPTIONS.map(r => (
                <TouchableOpacity key={r} style={[styles.reactionChip, reactions.includes(r) && styles.reactionChipActive]} onPress={() => toggleReaction(r)}>
                  <Text style={[styles.reactionChipText, reactions.includes(r) && { color: Colors.primary }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={notes} onChangeText={setNotes}
              placeholder="Notes (optional)"
              placeholderTextColor={Colors.textMuted}
              multiline
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* View Product Modal */}
      {viewingProduct && (
        <Modal visible={!!viewingProduct} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setViewingProduct(null)}>
                <Text style={styles.modalCancel}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{categoryEmoji[viewingProduct.category]}</Text>
              <TouchableOpacity onPress={() => deleteProduct(viewingProduct.id)}>
                <Text style={[styles.modalCancel, { color: Colors.red }]}>Delete</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.viewName}>{viewingProduct.name}</Text>
              {viewingProduct.brand ? <Text style={styles.viewBrand}>{viewingProduct.brand}</Text> : null}
              <View style={styles.viewMeta}>
                <Text style={styles.viewMetaItem}>{viewingProduct.category}</Text>
                <Text style={styles.viewMetaItem}>{viewingProduct.timeOfUse}</Text>
                <Text style={styles.viewMetaItem}>Since {formatDate(viewingProduct.dateAdded)}</Text>
              </View>
              <Text style={[styles.viewDays, { color: ratingColor(viewingProduct.rating) }]}>
                {'★'.repeat(viewingProduct.rating)} {RATINGS.find(r => r.value === viewingProduct.rating)?.label}
              </Text>
              <Text style={styles.viewDays}>{daysSince(viewingProduct.dateAdded)} days on your shelf</Text>
              {viewingProduct.reactions.length > 0 && (
                <View style={styles.viewSection}>
                  <Text style={styles.viewSectionTitle}>Reactions Noted</Text>
                  <View style={styles.viewChips}>
                    {viewingProduct.reactions.map(r => (
                      <View key={r} style={styles.viewChip}>
                        <Text style={styles.viewChipText}>{r}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {viewingProduct.notes ? (
                <View style={styles.viewSection}>
                  <Text style={styles.viewSectionTitle}>Notes</Text>
                  <Text style={styles.viewNotes}>{viewingProduct.notes}</Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={[styles.toggleActiveBtn, viewingProduct.isActive && { backgroundColor: Colors.border }]}
                onPress={() => toggleActive(viewingProduct.id)}
              >
                <Text style={styles.toggleActiveBtnText}>
                  {viewingProduct.isActive ? '📦 Move to Retired' : '✅ Mark as Active'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  backText: { color: Colors.primary, fontSize: 16 },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  addBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  statsBar: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  statItem: { alignItems: 'center' },
  statNum: { color: Colors.gold, fontSize: 20, fontWeight: '800' },
  statLbl: { color: Colors.textMuted, fontSize: 11 },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: Colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  filterBtnText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  filterBtnTextActive: { color: Colors.primary },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  catChipActive: { borderColor: Colors.gold, backgroundColor: Colors.gold + '22' },
  catChipText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  catChipTextActive: { color: Colors.gold },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center' },
  productCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  productCardInactive: { opacity: 0.5 },
  productLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  productEmoji: { fontSize: 24 },
  productName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  productBrand: { color: Colors.textMuted, fontSize: 12, marginBottom: 4 },
  productMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productTime: {
    color: Colors.primary, fontSize: 10, fontWeight: '700',
    backgroundColor: Colors.primary + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  productDays: { color: Colors.textMuted, fontSize: 11 },
  productStar: { fontSize: 10 },
  retiredBadge: {
    color: Colors.textMuted, fontSize: 10, fontWeight: '700',
    backgroundColor: Colors.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalCancel: { color: Colors.primary, fontSize: 16 },
  modalTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  modalSave: { color: Colors.green, fontSize: 16, fontWeight: '700' },
  input: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    color: Colors.textPrimary, fontSize: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  fieldLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  timeRow: { flexDirection: 'row', gap: 8 },
  optionChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  optionChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  optionChipText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  optionChipTextActive: { color: Colors.primary },
  ratingRow: { gap: 8 },
  ratingChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: Colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  ratingChipActive: { borderColor: Colors.gold },
  ratingChipText: { color: Colors.textMuted, fontSize: 13 },
  reactionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reactionChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  reactionChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  reactionChipText: { color: Colors.textMuted, fontSize: 12 },
  // View modal
  viewName: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  viewBrand: { color: Colors.textSecondary, fontSize: 15, marginBottom: 10 },
  viewMeta: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  viewMetaItem: {
    color: Colors.textMuted, fontSize: 12,
    backgroundColor: Colors.card, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.border,
  },
  viewDays: { color: Colors.textSecondary, fontSize: 14, marginBottom: 6 },
  viewSection: { marginTop: 16 },
  viewSectionTitle: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  viewChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  viewChip: {
    backgroundColor: Colors.card, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.border,
  },
  viewChipText: { color: Colors.textSecondary, fontSize: 12 },
  viewNotes: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  toggleActiveBtn: {
    backgroundColor: Colors.primary, marginTop: 24, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  toggleActiveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
