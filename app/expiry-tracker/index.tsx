import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/colors';

const LOG_KEY = 'gd_expiry_tracker';

type ProductEntry = {
  id: string;
  name: string;
  category: string;
  openedDate: string;
  paoMonths: number; // Period After Opening in months
  notes: string;
};

const PAO_OPTIONS = [1, 2, 3, 6, 9, 12, 18, 24, 36];

const CATEGORIES = [
  'Cleanser', 'Moisturizer', 'Serum', 'SPF', 'Toner', 'Exfoliant',
  'Eye Cream', 'Mask', 'Oil/Balm', 'Other',
];

const CATEGORY_ICONS: Record<string, string> = {
  'Cleanser': '🧴',
  'Moisturizer': '💧',
  'Serum': '🔬',
  'SPF': '☀️',
  'Toner': '✨',
  'Exfoliant': '💎',
  'Eye Cream': '👁️',
  'Mask': '😌',
  'Oil/Balm': '🌿',
  'Other': '📦',
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getDaysUntilExpiry(openedDate: string, paoMonths: number): number {
  const opened = new Date(openedDate);
  const expiry = new Date(opened);
  expiry.setMonth(expiry.getMonth() + paoMonths);
  return Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getExpiryLabel(daysLeft: number): { label: string; color: string; emoji: string } {
  if (daysLeft < 0) return { label: 'Expired', color: Colors.scorePoor, emoji: '🚨' };
  if (daysLeft === 0) return { label: 'Expires today', color: Colors.scorePoor, emoji: '⚠️' };
  if (daysLeft <= 7) return { label: `${daysLeft}d left`, color: Colors.scorePoor, emoji: '⚠️' };
  if (daysLeft <= 30) return { label: `${daysLeft}d left`, color: Colors.gold, emoji: '⏰' };
  if (daysLeft <= 60) return { label: `${daysLeft}d left`, color: '#86EFAC', emoji: '🟡' };
  const months = Math.floor(daysLeft / 30);
  return { label: `~${months}mo left`, color: '#4ADE80', emoji: '✅' };
}

function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ExpiryTracker() {
  const [products, setProducts] = useState<ProductEntry[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Moisturizer');
  const [paoMonths, setPaoMonths] = useState(12);
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'expiring' | 'expired'>('all');

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  const load = async () => {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    setProducts(raw ? JSON.parse(raw) : []);
  };

  const save = async (updated: ProductEntry[]) => {
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(updated));
    setProducts(updated);
  };

  const addProduct = async () => {
    if (!name.trim()) return;
    const product: ProductEntry = {
      id: generateId(),
      name: name.trim(),
      category,
      openedDate: new Date().toISOString(),
      paoMonths,
      notes: notes.trim(),
    };
    await save([product, ...products]);
    setAdding(false);
    setName('');
    setCategory('Moisturizer');
    setPaoMonths(12);
    setNotes('');
  };

  const deleteProduct = (id: string) => {
    Alert.alert('Remove Product', 'Remove this product from tracking?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => save(products.filter(p => p.id !== id)) },
    ]);
  };

  const sorted = [...products].sort((a, b) => {
    const da = getDaysUntilExpiry(a.openedDate, a.paoMonths);
    const db = getDaysUntilExpiry(b.openedDate, b.paoMonths);
    return da - db;
  });

  const expired = sorted.filter(p => getDaysUntilExpiry(p.openedDate, p.paoMonths) < 0);
  const expiring = sorted.filter(p => {
    const d = getDaysUntilExpiry(p.openedDate, p.paoMonths);
    return d >= 0 && d <= 30;
  });
  const active = sorted.filter(p => getDaysUntilExpiry(p.openedDate, p.paoMonths) > 30);

  const filtered = filter === 'expiring'
    ? [...expired, ...expiring]
    : filter === 'expired'
    ? expired
    : sorted;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Expiry Tracker</Text>
            <Text style={styles.headerSub}>Know when to toss your products</Text>
          </View>
          <Pressable style={styles.addBtn} onPress={() => setAdding(true)}>
            <Ionicons name="add" size={20} color={Colors.white} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Add form */}
        {adding && (
          <View style={styles.addCard}>
            <Text style={styles.addCardTitle}>Add Product</Text>

            <TextInput
              style={styles.textInput}
              placeholder="Product name (e.g. CeraVe Moisturizer)"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              <View style={styles.categoryRow}>
                {CATEGORIES.map(c => (
                  <Pressable
                    key={c}
                    style={[styles.categoryChip, category === c && styles.categoryChipActive]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={styles.categoryEmoji}>{CATEGORY_ICONS[c]}</Text>
                    <Text style={[styles.categoryLabel, category === c && { color: Colors.primary }]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.fieldLabel}>Period After Opening (PAO)</Text>
            <View style={styles.paoGrid}>
              {PAO_OPTIONS.map(m => (
                <Pressable
                  key={m}
                  style={[styles.paoChip, paoMonths === m && styles.paoChipActive]}
                  onPress={() => setPaoMonths(m)}
                >
                  <Text style={[styles.paoLabel, paoMonths === m && { color: Colors.primary }]}>
                    {m < 12 ? `${m}mo` : `${m / 12}yr`}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.textInput}
              placeholder="Notes (optional)"
              placeholderTextColor={Colors.textMuted}
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.formBtns}>
              <Pressable style={styles.cancelBtn} onPress={() => setAdding(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, !name.trim() && { opacity: 0.5 }]}
                onPress={addProduct}
                disabled={!name.trim()}
              >
                <Text style={styles.saveBtnText}>Add Product</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Alerts */}
        {expired.length > 0 && (
          <View style={styles.alertCard}>
            <LinearGradient colors={['rgba(239,68,68,0.12)', 'rgba(239,68,68,0.04)']} style={StyleSheet.absoluteFill} />
            <View style={styles.alertHeader}>
              <Text style={styles.alertEmoji}>🚨</Text>
              <Text style={styles.alertTitle}>{expired.length} product{expired.length > 1 ? 's' : ''} expired</Text>
            </View>
            <Text style={styles.alertDesc}>Using expired products can cause irritation, breakouts, or infections. Time to toss these.</Text>
          </View>
        )}

        {expiring.length > 0 && (
          <View style={styles.warningCard}>
            <LinearGradient colors={['rgba(212,169,106,0.1)', 'rgba(212,169,106,0.03)']} style={StyleSheet.absoluteFill} />
            <View style={styles.alertHeader}>
              <Text style={styles.alertEmoji}>⏰</Text>
              <Text style={[styles.alertTitle, { color: Colors.gold }]}>{expiring.length} expiring in 30 days</Text>
            </View>
          </View>
        )}

        {/* Filter tabs */}
        {products.length > 0 && (
          <View style={styles.filterRow}>
            {(['all', 'expiring', 'expired'] as const).map(f => (
              <Pressable
                key={f}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterTabText, filter === f && { color: Colors.primary }]}>
                  {f === 'all' ? `All (${products.length})` : f === 'expiring' ? `Expiring (${expired.length + expiring.length})` : `Expired (${expired.length})`}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Products list */}
        {filtered.length === 0 && !adding && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🗓️</Text>
            <Text style={styles.emptyTitle}>Nothing tracked yet</Text>
            <Text style={styles.emptyDesc}>Add your skincare products to track when they expire. Most products have a PAO symbol (open jar icon) on the packaging.</Text>
            <Pressable style={styles.emptyBtn} onPress={() => setAdding(true)}>
              <Text style={styles.emptyBtnText}>Add First Product</Text>
            </Pressable>
          </View>
        )}

        {filtered.map(product => {
          const daysLeft = getDaysUntilExpiry(product.openedDate, product.paoMonths);
          const { label, color, emoji } = getExpiryLabel(daysLeft);
          const expiryDate = new Date(product.openedDate);
          expiryDate.setMonth(expiryDate.getMonth() + product.paoMonths);

          return (
            <View key={product.id} style={[styles.productCard, daysLeft < 0 && styles.expiredCard]}>
              <View style={styles.productTop}>
                <View style={[styles.categoryBadge, { backgroundColor: `${color}15` }]}>
                  <Text style={{ fontSize: 18 }}>{CATEGORY_ICONS[product.category] || '📦'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productCategory}>{product.category}</Text>
                </View>
                <Pressable onPress={() => deleteProduct(product.id)}>
                  <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
                </Pressable>
              </View>

              <View style={styles.productMeta}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Opened</Text>
                  <Text style={styles.metaValue}>{formatDate(product.openedDate)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>PAO</Text>
                  <Text style={styles.metaValue}>{product.paoMonths < 12 ? `${product.paoMonths}M` : `${product.paoMonths / 12}Y`}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Expires</Text>
                  <Text style={styles.metaValue}>{formatDate(expiryDate.toISOString())}</Text>
                </View>
              </View>

              <View style={[styles.expiryBadge, { backgroundColor: `${color}15`, borderColor: `${color}40` }]}>
                <Text style={styles.expiryEmoji}>{emoji}</Text>
                <Text style={[styles.expiryLabel, { color }]}>{label}</Text>
              </View>

              {product.notes ? <Text style={styles.productNotes}>{product.notes}</Text> : null}
            </View>
          );
        })}

        {/* PAO Guide */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>Common Product Lifespans</Text>
          {[
            { product: 'Sunscreen', pao: '6-12 months', note: 'After opening, UV filters degrade. Expired SPF is dangerous.' },
            { product: 'Vitamin C Serum', pao: '3-6 months', note: 'Oxidizes quickly. Discard when it turns orange/brown.' },
            { product: 'Retinol', pao: '6-12 months', note: 'Degrades in light and air. Use airtight, opaque packaging.' },
            { product: 'Cleanser', pao: '12-18 months', note: 'Generally stable but watch for changes in smell/texture.' },
            { product: 'Tallow Balm', pao: '12-24 months', note: 'TallowDermics uses no water (anhydrous) — much longer stable than water-based products.' },
            { product: 'Eye Cream', pao: '6-12 months', note: 'Fingers introduce bacteria directly. Use a spatula.' },
            { product: 'Exfoliants (AHA/BHA)', pao: '12 months', note: 'Acids degrade over time and may become irritating or ineffective.' },
          ].map((item, i) => (
            <View key={i} style={styles.guideRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.guideProduct}>{item.product}</Text>
                <Text style={styles.guidePao}>{item.pao}</Text>
              </View>
              <Text style={styles.guideNote}>{item.note}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  scroll: { paddingHorizontal: 16 },

  addCard: {
    backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: `${Colors.primary}40`,
    padding: 16, gap: 10, marginBottom: 14,
  },
  addCardTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  textInput: {
    backgroundColor: Colors.bgElevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary,
  },
  categoryScroll: { marginHorizontal: -4 },
  categoryRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 4 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated,
  },
  categoryChipActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}15` },
  categoryEmoji: { fontSize: 12 },
  categoryLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  paoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  paoChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated,
  },
  paoChipActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}15` },
  paoLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  formBtns: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  saveBtn: {
    flex: 1, height: 44, borderRadius: 12, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  alertCard: {
    borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    padding: 14, gap: 6, marginBottom: 10,
  },
  warningCard: {
    borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: `${Colors.gold}50`,
    padding: 14, gap: 6, marginBottom: 10,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertEmoji: { fontSize: 18 },
  alertTitle: { fontSize: 15, fontWeight: '800', color: Colors.scorePoor },
  alertDesc: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  filterTab: {
    flex: 1, height: 34, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  filterTabActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}12` },
  filterTabText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },

  emptyCard: {
    backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
    padding: 24, gap: 10, alignItems: 'center', marginBottom: 14,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  emptyDesc: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  productCard: {
    backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: 14, gap: 10, marginBottom: 10,
  },
  expiredCard: { borderColor: 'rgba(239,68,68,0.25)', opacity: 0.85 },
  productTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryBadge: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  productCategory: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  productMeta: { flexDirection: 'row', gap: 0 },
  metaItem: { flex: 1, gap: 2 },
  metaLabel: { fontSize: 9, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  metaValue: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  expiryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  expiryEmoji: { fontSize: 12 },
  expiryLabel: { fontSize: 12, fontWeight: '800' },
  productNotes: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' },

  guideCard: {
    backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 12, marginBottom: 14,
  },
  guideTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  guideRow: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  guideProduct: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  guidePao: { fontSize: 12, color: Colors.primary, fontWeight: '700', marginTop: 1 },
  guideNote: { flex: 1, fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
});
