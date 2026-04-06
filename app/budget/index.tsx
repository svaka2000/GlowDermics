import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';

type ProductCategory = {
  label: string;
  icon: string;
  placeholder: string;
  tdAlternative: string;
  tdPrice: number;
};

const CATEGORIES: ProductCategory[] = [
  { label: 'Cleanser', icon: '🧴', placeholder: '$28', tdAlternative: 'Honey Cleanse (Tallow + Honey)', tdPrice: 0 },
  { label: 'Moisturizer', icon: '💧', placeholder: '$65', tdAlternative: 'TallowDermics Balm', tdPrice: 48 },
  { label: 'Serum', icon: '✨', placeholder: '$80', tdAlternative: 'Olive Oil + Tallow layer', tdPrice: 0 },
  { label: 'Eye Cream', icon: '👁️', placeholder: '$55', tdAlternative: 'TallowDermics Balm (eyes)', tdPrice: 0 },
  { label: 'Face Oil', icon: '🌿', placeholder: '$45', tdAlternative: 'Included in Balm', tdPrice: 0 },
  { label: 'Toner', icon: '💦', placeholder: '$30', tdAlternative: 'Rosewater mist (DIY ~$5)', tdPrice: 5 },
  { label: 'SPF', icon: '☀️', placeholder: '$25', tdAlternative: 'SPF still recommended', tdPrice: 20 },
  { label: 'Exfoliant', icon: '🔮', placeholder: '$35', tdAlternative: 'Manuka honey mask', tdPrice: 0 },
];

const TALLOW_PRODUCT = {
  name: 'TallowDermics Signature Balm',
  price: 48,
  lasts: '3 months',
  description: 'Replaces moisturizer, face oil, eye cream, and serum for most users',
};

export default function BudgetCalculator() {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const updatePrice = (label: string, val: string) => {
    setPrices(prev => ({ ...prev, [label]: val }));
  };

  const parsePrice = (val: string) => {
    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const conventionalMonthly = CATEGORIES.reduce((sum, cat) => {
    const monthly = parsePrice(prices[cat.label] || '0') / 3; // assume 3 months per product
    return sum + monthly;
  }, 0);

  const tdMonthly = (TALLOW_PRODUCT.price / 3) + (5 / 3); // balm + rosewater + spf avg
  const tdMonthlyFull = 48 / 3 + 5 / 3 + 20 / 3; // full TD setup monthly

  const conventionalAnnual = conventionalMonthly * 12;
  const tdAnnual = tdMonthlyFull * 12;
  const savings = Math.max(0, conventionalAnnual - tdAnnual);
  const pctSaved = conventionalAnnual > 0 ? Math.round((savings / conventionalAnnual) * 100) : 0;

  const hasInput = Object.values(prices).some(v => parsePrice(v) > 0);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Budget Calculator</Text>
            <Text style={styles.headerSub}>Conventional vs TallowDermics</Text>
          </View>
          <View style={{ width: 36 }} />
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ opacity: contentAnim }}>

        {/* Intro */}
        <View style={styles.introCard}>
          <LinearGradient colors={['rgba(196,98,45,0.12)', 'rgba(196,98,45,0.03)']} style={StyleSheet.absoluteFill} />
          <Text style={styles.introEmoji}>💰</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>What are you spending?</Text>
            <Text style={styles.introSub}>Enter what you pay for each product to see how TallowDermics compares.</Text>
          </View>
        </View>

        {/* Product price inputs */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Current Routine</Text>
          <Text style={styles.cardSub}>Enter per-product prices (skip what you don't use)</Text>
          {CATEGORIES.map(cat => (
            <View key={cat.label} style={styles.productRow}>
              <Text style={styles.productIcon}>{cat.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.productLabel}>{cat.label}</Text>
              </View>
              <View style={styles.priceInputWrap}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder={cat.placeholder.replace('$', '')}
                  placeholderTextColor={Colors.textMuted}
                  value={prices[cat.label] || ''}
                  onChangeText={val => updatePrice(cat.label, val)}
                  keyboardType="decimal-pad"
                  maxLength={6}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Results */}
        {hasInput && (
          <>
            <View style={styles.compCard}>
              <Text style={styles.compTitle}>Annual Cost Breakdown</Text>

              <View style={styles.compRow}>
                <View style={styles.compItem}>
                  <Text style={styles.compLabel}>CONVENTIONAL</Text>
                  <Text style={styles.compAmount}>${Math.round(conventionalAnnual)}</Text>
                  <Text style={styles.compSub}>per year</Text>
                  <Text style={styles.compMonthly}>(${Math.round(conventionalMonthly)}/month)</Text>
                </View>
                <View style={styles.vsCircle}>
                  <Text style={styles.vsText}>VS</Text>
                </View>
                <View style={[styles.compItem, { alignItems: 'flex-end' }]}>
                  <Text style={[styles.compLabel, { color: Colors.primary }]}>TALLOWDERMICS</Text>
                  <Text style={[styles.compAmount, { color: Colors.primary }]}>${Math.round(tdAnnual)}</Text>
                  <Text style={styles.compSub}>per year</Text>
                  <Text style={styles.compMonthly}>(${Math.round(tdMonthlyFull)}/month)</Text>
                </View>
              </View>

              {/* Savings bar */}
              {savings > 0 && (
                <View style={styles.savingsCard}>
                  <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                  <View>
                    <Text style={styles.savingsLabel}>YOU'D SAVE</Text>
                    <Text style={styles.savingsAmount}>${Math.round(savings)}</Text>
                    <Text style={styles.savingsSub}>per year ({pctSaved}% less)</Text>
                  </View>
                  <Ionicons name="trending-down" size={36} color="rgba(255,255,255,0.7)" />
                </View>
              )}
              {savings <= 0 && conventionalAnnual > 0 && (
                <View style={[styles.savingsCard, { backgroundColor: Colors.bgElevated }]}>
                  <View>
                    <Text style={[styles.savingsLabel, { color: Colors.textMuted }]}>SIMILAR COST</Text>
                    <Text style={[styles.savingsAmount, { color: Colors.textPrimary }]}>With fewer products</Text>
                    <Text style={[styles.savingsSub, { color: Colors.textMuted }]}>Simpler routine, same or better results</Text>
                  </View>
                </View>
              )}
            </View>

            {/* What TallowDermics replaces */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>What One Balm Replaces</Text>
              <Text style={styles.cardSub}>${TALLOW_PRODUCT.price} lasts {TALLOW_PRODUCT.lasts}</Text>
              <Text style={styles.replaceDesc}>{TALLOW_PRODUCT.description}</Text>
              <View style={styles.replacesGrid}>
                {['Moisturizer', 'Face Oil', 'Eye Cream', 'Night Cream'].map(r => (
                  <View key={r} style={styles.replacesChip}>
                    <Ionicons name="checkmark" size={12} color={Colors.scoreExcellent} />
                    <Text style={styles.replacesChipText}>{r}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* TD product breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>The Minimal TallowDermics Stack</Text>
          {[
            { item: 'TallowDermics Balm', price: '$48 / 3 months', note: 'Core moisturizer — replaces 4 products' },
            { item: 'Rosewater Mist (DIY)', price: '~$5 / 3 months', note: 'Optional hydrating toner' },
            { item: 'Mineral SPF', price: '$18-25 / 3 months', note: 'Non-negotiable sun protection' },
            { item: 'Gentle Cleanser', price: 'Optional', note: 'Or oil cleanse with tallow' },
          ].map((row, i) => (
            <View key={i} style={styles.tdRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tdItem}>{row.item}</Text>
                <Text style={styles.tdNote}>{row.note}</Text>
              </View>
              <Text style={styles.tdPrice}>{row.price}</Text>
            </View>
          ))}
          <View style={styles.tdTotal}>
            <Text style={styles.tdTotalLabel}>Total Monthly</Text>
            <Text style={styles.tdTotalAmount}>~${Math.round(tdMonthlyFull)}</Text>
          </View>
        </View>

        {/* CTA */}
        <Pressable style={styles.ctaCard} onPress={() => router.push('/product')}>
          <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>See What's in the Balm</Text>
            <Text style={styles.ctaSub}>4 ingredients. Ancestral formula. No synthetics.</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </Pressable>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  introCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 16, marginBottom: 16 },
  introEmoji: { fontSize: 30 },
  introTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  introSub: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginTop: 3 },

  card: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 10, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardSub: { fontSize: 11, color: Colors.textMuted, marginTop: -6 },

  productRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  productIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  productLabel: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  priceInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgElevated, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 7 },
  dollarSign: { fontSize: 14, color: Colors.textMuted, marginRight: 2 },
  priceInput: { fontSize: 14, color: Colors.textPrimary, width: 60 },

  compCard: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 18, gap: 16, marginBottom: 14 },
  compTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  compRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  compItem: { flex: 1, gap: 2 },
  compLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Colors.textMuted },
  compAmount: { fontSize: 30, fontWeight: '900', color: Colors.textPrimary },
  compSub: { fontSize: 11, color: Colors.textMuted },
  compMonthly: { fontSize: 11, color: Colors.textMuted },
  vsCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  vsText: { fontSize: 10, fontWeight: '800', color: Colors.textMuted },

  savingsCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, overflow: 'hidden', padding: 16 },
  savingsLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  savingsAmount: { fontSize: 26, fontWeight: '900', color: Colors.white },
  savingsSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  replaceDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  replacesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  replacesChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)' },
  replacesChipText: { fontSize: 12, color: Colors.scoreExcellent, fontWeight: '600' },

  tdRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 10 },
  tdItem: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  tdNote: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  tdPrice: { fontSize: 13, color: Colors.primary, fontWeight: '700', marginTop: 2 },
  tdTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  tdTotalLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  tdTotalAmount: { fontSize: 18, fontWeight: '800', color: Colors.primary },

  ctaCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, overflow: 'hidden', padding: 18, marginBottom: 14 },
  ctaTitle: { fontSize: 15, fontWeight: '700', color: Colors.white },
  ctaSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
});
