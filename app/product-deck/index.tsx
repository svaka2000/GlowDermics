import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Animated, Easing,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '', dangerouslyAllowBrowser: true });
const CACHE_KEY = 'gd_product_deck';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

type Product = {
  name: string;
  brand: string;
  category: string;
  priceRange: string;
  whyItWorks: string;
  keyIngredients: string[];
  avoid: string;
  isKeyStep: boolean;
  priority: 'essential' | 'recommended' | 'optional';
};

type ProductDeck = {
  products: Product[];
  totalMonthly: string;
  philosophy: string;
  tallowNote: string;
  ts: number;
};

const BUDGETS = ['Budget ($0-30/mo)', 'Mid-range ($30-80/mo)', 'Premium ($80+/mo)'];
function buildPriorityColors(c: Palette): Record<string, string> {
  return {
    essential: c.primary,
    recommended: c.gold,
    optional: c.textMuted,
  };
}

export default function ProductDeck() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const PRIORITY_COLORS = useMemo(() => buildPriorityColors(colors), [colors]);
  const [deck, setDeck] = useState<ProductDeck | null>(null);
  const [loading, setLoading] = useState(false);
  const [budget, setBudget] = useState('');
  const [skinType, setSkinType] = useState('');
  const [concerns, setConcerns] = useState<string[]>([]);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    headerAnim.setValue(0);
    contentAnim.setValue(0);
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    (async () => {
      const profile = await Storage.getUserProfile();
      if (profile) {
        setSkinType(profile.skinType);
        setConcerns(profile.primaryConcerns);
      }
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: ProductDeck = JSON.parse(cached);
        if (Date.now() - parsed.ts < CACHE_TTL) {
          setDeck(parsed);
        }
      }
    })();
  }, []));

  const generate = async () => {
    if (!budget) return;
    setLoading(true);

    try {
      const blacklistRaw = await AsyncStorage.getItem('gd_ingredient_blacklist');
      const blacklist: { name: string }[] = blacklistRaw ? JSON.parse(blacklistRaw) : [];
      const blacklistNames = blacklist.map(b => b.name).join(', ') || 'none';

      const analysis = await Storage.getLatestAnalysis();
      const weakMetrics = analysis ? Object.entries(analysis.scores)
        .filter(([k, v]) => k !== 'overall' && v < 65)
        .map(([k]) => k)
        .join(', ') : '';

      const prompt = `You are a dermatologist and skincare expert curating a personalized product deck.

User profile:
- Skin type: ${skinType || 'unknown'}
- Primary concerns: ${concerns.join(', ') || 'general health'}
- Budget: ${budget}
- Ingredients to avoid: ${blacklistNames}
- Weak skin metrics: ${weakMetrics || 'none identified'}

Rules:
1. A rich occlusive balm ($40-50/3 months, replaces moisturizer + face oil + eye cream) MUST be included as an essential product
2. Recommend 5-7 total products total (including the occlusive balm)
3. Respect the budget constraint
4. Avoid recommending products with ingredients from the avoid list
5. Be specific — use real product names and brands when possible
6. Justify each pick with the user's specific profile

Return ONLY valid JSON (no markdown):
{
  "products": [
    {
      "name": "<specific product name>",
      "brand": "<brand name>",
      "category": "<e.g. Cleanser, Moisturizer, Serum, SPF, Toner>",
      "priceRange": "<e.g. $12-18 / 3 months>",
      "whyItWorks": "<1-2 sentences why this is ideal for their specific profile>",
      "keyIngredients": ["<ingredient 1>", "<ingredient 2>"],
      "avoid": "<what this replaces or what to avoid using it with>",
      "isKeyStep": <true|false>,
      "priority": "<essential|recommended|optional>"
    }
  ],
  "totalMonthly": "<estimated total monthly spend for this full deck>",
  "philosophy": "<2 sentences on the philosophy behind this deck — why these specific choices>",
  "tallowNote": "<1-2 sentences specifically about the occlusive balm and why it's the cornerstone of this deck>"
}`;

      const resp = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.65,
        max_tokens: 2000,
      });

      const text = resp.choices[0].message.content ?? '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('no json');
      const parsed: ProductDeck = { ...JSON.parse(match[0]), ts: Date.now() };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      setDeck(parsed);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  const categoryIcons: Record<string, string> = {
    Cleanser: 'water-outline',
    Moisturizer: 'leaf-outline',
    Serum: 'sparkles-outline',
    SPF: 'sunny-outline',
    Toner: 'flask-outline',
    'Eye Cream': 'eye-outline',
    Exfoliant: 'refresh-outline',
    Balm: 'heart-outline',
    'Face Oil': 'droplet-outline',
  };

  const getIcon = (cat: string) => categoryIcons[cat] ?? 'cube-outline';

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>My Product Deck</Text>
            <Text style={styles.headerSub}>AI-curated just for you</Text>
          </View>
          {deck && (
            <Pressable style={styles.backBtn} onPress={() => { AsyncStorage.removeItem(CACHE_KEY); setDeck(null); }}>
              <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            </Pressable>
          )}
          {!deck && <View style={{ width: 36 }} />}
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ opacity: contentAnim }}>

        {/* Budget picker */}
        {!deck && (
          <View style={styles.setupCard}>
            <Text style={styles.setupTitle}>What's your budget?</Text>
            <Text style={styles.setupSub}>We'll build the best possible deck within your range</Text>
            <View style={styles.budgetRow}>
              {BUDGETS.map(b => (
                <Pressable
                  key={b}
                  style={[styles.budgetChip, budget === b && styles.budgetChipActive]}
                  onPress={() => setBudget(b)}
                >
                  <Text style={[styles.budgetText, budget === b && styles.budgetTextActive]}>{b}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={[styles.generateBtn, (!budget || loading) && { opacity: 0.5 }]}
              onPress={generate}
              disabled={!budget || loading}
            >
              <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} />
              {loading ? <ActivityIndicator color={colors.white} /> : (
                <><Ionicons name="sparkles-outline" size={18} color={colors.white} /><Text style={styles.generateBtnText}>Build My Deck</Text></>
              )}
            </Pressable>
          </View>
        )}

        {/* Results */}
        {deck && !loading && (
          <>
            {/* Summary */}
            <View style={styles.summaryCard}>
              <LinearGradient colors={['rgba(138,120,96,0.12)', 'rgba(138,120,96,0.02)']} style={StyleSheet.absoluteFill} />
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNum}>{deck.products.length}</Text>
                  <Text style={styles.summaryLabel}>Products</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNum}>{deck.totalMonthly}</Text>
                  <Text style={styles.summaryLabel}>Est. monthly</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNum}>{deck.products.filter(p => p.priority === 'essential').length}</Text>
                  <Text style={styles.summaryLabel}>Essentials</Text>
                </View>
              </View>
              <Text style={styles.summaryPhilosophy}>{deck.philosophy}</Text>
            </View>

            {/* Products by priority */}
            {(['essential', 'recommended', 'optional'] as const).map(priority => {
              const products = deck.products.filter(p => p.priority === priority);
              if (!products.length) return null;
              return (
                <View key={priority} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[priority] }]} />
                    <Text style={[styles.sectionTitle, { color: PRIORITY_COLORS[priority] }]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </View>
                  {products.map((product, i) => (
                    <View key={i} style={[styles.productCard, product.isKeyStep && styles.productCardTD]}>
                      {product.isKeyStep && (
                        <LinearGradient colors={['rgba(138,120,96,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />
                      )}
                      <View style={styles.productTop}>
                        <View style={[styles.productIcon, product.isKeyStep && { backgroundColor: 'rgba(138,120,96,0.15)', borderColor: 'rgba(138,120,96,0.3)' }]}>
                          <Ionicons name={getIcon(product.category) as any} size={18} color={product.isKeyStep ? colors.primary : colors.textMuted} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.productNameRow}>
                            <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                            {product.isKeyStep && (
                              <View style={styles.tdBadge}><Text style={styles.tdBadgeText}>🌿 TD</Text></View>
                            )}
                          </View>
                          <Text style={styles.productBrand}>{product.brand}</Text>
                        </View>
                        <Text style={styles.productPrice}>{product.priceRange}</Text>
                      </View>

                      <Text style={styles.productCategory}>{product.category}</Text>
                      <Text style={styles.productWhy}>{product.whyItWorks}</Text>

                      <View style={styles.ingredientsRow}>
                        {product.keyIngredients.slice(0, 3).map((ing, j) => (
                          <Pressable
                            key={j}
                            style={styles.ingredientChip}
                            onPress={() => router.push(`/ingredient/${encodeURIComponent(ing)}`)}
                          >
                            <Text style={styles.ingredientText}>{ing}</Text>
                          </Pressable>
                        ))}
                      </View>

                      {product.avoid && (
                        <Text style={styles.avoidText}>⚠️ {product.avoid}</Text>
                      )}

                      {product.isKeyStep && (
                        <Pressable style={styles.tdBtn} onPress={() => router.push('/product')}>
                          <Text style={styles.tdBtnText}>View Product →</Text>
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>
              );
            })}

            {/* Occlusive cornerstone */}
            <Pressable style={styles.tallowCard} onPress={() => router.push('/product')}>
              <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <Text style={styles.tallowEmoji}>🌿</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.tallowTitle}>Why the Occlusive Is the Cornerstone</Text>
                <Text style={styles.tallowText}>{deck.tallowNote}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  setupCard: { backgroundColor: c.bgCard, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 18, gap: 12, marginBottom: 14 },
  setupTitle: { fontSize: 18, fontWeight: '800', color: c.textPrimary },
  setupSub: { fontSize: 13, color: c.textMuted },
  budgetRow: { gap: 8 },
  budgetChip: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated },
  budgetChipActive: { borderColor: c.primary, backgroundColor: 'rgba(138,120,96,0.12)' },
  budgetText: { fontSize: 14, color: c.textMuted, fontWeight: '500' },
  budgetTextActive: { color: c.primary, fontWeight: '700' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 14, overflow: 'hidden' },
  generateBtnText: { fontSize: 15, fontWeight: '700', color: c.white },

  summaryCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(138,120,96,0.2)', padding: 16, gap: 12, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', gap: 3 },
  summaryNum: { fontSize: 22, fontWeight: '800', color: c.primary },
  summaryLabel: { fontSize: 10, color: c.textMuted, fontWeight: '600' },
  summaryPhilosophy: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },

  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },

  productCard: { backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 14, gap: 8, marginBottom: 10, overflow: 'hidden' },
  productCardTD: { borderColor: 'rgba(138,120,96,0.35)' },
  productTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  productIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  productNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  productName: { fontSize: 14, fontWeight: '700', color: c.textPrimary, flex: 1 },
  tdBadge: { backgroundColor: 'rgba(138,120,96,0.15)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  tdBadgeText: { fontSize: 10, fontWeight: '700', color: c.primary },
  productBrand: { fontSize: 11, color: c.textMuted, marginTop: 2 },
  productPrice: { fontSize: 12, fontWeight: '700', color: c.primary },
  productCategory: { fontSize: 10, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  productWhy: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  ingredientsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ingredientChip: { backgroundColor: c.bgElevated, borderRadius: 8, borderWidth: 1, borderColor: c.border, paddingHorizontal: 8, paddingVertical: 4 },
  ingredientText: { fontSize: 11, color: c.primary, fontWeight: '600' },
  avoidText: { fontSize: 11, color: c.textMuted, lineHeight: 16 },
  tdBtn: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(138,120,96,0.3)', backgroundColor: 'rgba(138,120,96,0.08)' },
  tdBtnText: { fontSize: 12, fontWeight: '700', color: c.primary },

  tallowCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 16, overflow: 'hidden', padding: 16, marginBottom: 14 },
  tallowEmoji: { fontSize: 24 },
  tallowTitle: { fontSize: 13, fontWeight: '700', color: c.white, marginBottom: 4 },
  tallowText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  });
}
