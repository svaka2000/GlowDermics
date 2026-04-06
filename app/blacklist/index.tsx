import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';

const BLACKLIST_KEY = 'gd_ingredient_blacklist';

type BlacklistEntry = {
  id: string;
  name: string;
  reason: string;
  addedDate: string;
};

const SUGGESTIONS_BY_TYPE: Record<string, { name: string; reason: string }[]> = {
  oily: [
    { name: 'Coconut Oil', reason: 'Highly comedogenic — clogs pores' },
    { name: 'Isopropyl Myristate', reason: 'Can worsen acne and oiliness' },
    { name: 'Sodium Lauryl Sulfate', reason: 'Strips skin, triggers rebound oiliness' },
  ],
  dry: [
    { name: 'Alcohol Denat', reason: 'Severely drying — strips barrier' },
    { name: 'Salicylic Acid (high %)', reason: 'Over-exfoliates dry skin' },
    { name: 'Fragrance', reason: 'Common irritant for dry/sensitive skin' },
  ],
  sensitive: [
    { name: 'Fragrance', reason: 'Top irritant for sensitive skin' },
    { name: 'Essential Oils', reason: 'Can cause contact dermatitis' },
    { name: 'Formaldehyde Releasers', reason: 'Allergen — DMDM Hydantoin etc.' },
    { name: 'Parabens', reason: 'Potential sensitizer' },
  ],
  combination: [
    { name: 'Coconut Oil', reason: 'Comedogenic on oily zones' },
    { name: 'Heavy Mineral Oil', reason: 'Occlusive, can congest pores' },
  ],
  normal: [
    { name: 'Fragrance', reason: 'Unnecessary irritant' },
    { name: 'Alcohol Denat', reason: 'Can disrupt barrier over time' },
  ],
};

const COMMON_IRRITANTS = [
  { name: 'Fragrance / Parfum', reason: 'Most common skin allergen' },
  { name: 'Alcohol Denat', reason: 'Drying and disruptive to skin barrier' },
  { name: 'Sodium Lauryl Sulfate', reason: 'Harsh surfactant — strips natural oils' },
  { name: 'Parabens', reason: 'Potential allergen and hormone disruptor' },
  { name: 'Formaldehyde', reason: 'Carcinogen and sensitizer' },
  { name: 'Cocamidopropyl Betaine', reason: 'Common allergy trigger' },
  { name: 'Methylisothiazolinone', reason: 'Preservative — frequent sensitizer' },
  { name: 'Phenoxyethanol (high %)', reason: 'Can irritate in high concentrations' },
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function Blacklist() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [ingredientInput, setIngredientInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [skinType, setSkinType] = useState('normal');
  const [checkMode, setCheckMode] = useState(false);
  const [checkInput, setCheckInput] = useState('');
  const [checkResults, setCheckResults] = useState<{ found: string[]; safe: boolean } | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(BLACKLIST_KEY);
      setEntries(raw ? JSON.parse(raw) : []);
      const profile = await Storage.getUserProfile();
      if (profile) setSkinType(profile.skinType || 'normal');
    })();
  }, []));

  const save = async (updated: BlacklistEntry[]) => {
    setEntries(updated);
    await AsyncStorage.setItem(BLACKLIST_KEY, JSON.stringify(updated));
  };

  const addEntry = async () => {
    const name = ingredientInput.trim();
    if (!name) return;
    const entry: BlacklistEntry = {
      id: generateId(),
      name,
      reason: reasonInput.trim() || 'Personal sensitivity',
      addedDate: new Date().toISOString(),
    };
    await save([entry, ...entries]);
    setIngredientInput('');
    setReasonInput('');
    setShowAdd(false);
  };

  const addSuggestion = async (item: { name: string; reason: string }) => {
    if (entries.find(e => e.name.toLowerCase() === item.name.toLowerCase())) return;
    const entry: BlacklistEntry = {
      id: generateId(),
      name: item.name,
      reason: item.reason,
      addedDate: new Date().toISOString(),
    };
    await save([entry, ...entries]);
  };

  const deleteEntry = (id: string) => {
    Alert.alert('Remove', 'Remove this ingredient from your blacklist?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: () => {
          save(entries.filter(e => e.id !== id));
        },
      },
    ]);
  };

  const runCheck = () => {
    if (!checkInput.trim() || !entries.length) return;
    const listed = checkInput.toLowerCase();
    const found = entries
      .filter(e => listed.includes(e.name.toLowerCase()))
      .map(e => e.name);
    setCheckResults({ found, safe: found.length === 0 });
  };

  const suggestions = SUGGESTIONS_BY_TYPE[skinType] ?? SUGGESTIONS_BY_TYPE.normal;
  const alreadyAdded = (name: string) => entries.some(e => e.name.toLowerCase() === name.toLowerCase());

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Ingredient Blacklist</Text>
            <Text style={styles.headerSub}>Your personal avoid list</Text>
          </View>
          <Pressable style={styles.backBtn} onPress={() => { setCheckMode(!checkMode); setCheckResults(null); }}>
            <Ionicons name={checkMode ? 'list-outline' : 'search-outline'} size={20} color={Colors.primary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Check mode */}
        {checkMode && (
          <View style={styles.checkCard}>
            <Text style={styles.checkTitle}>Check a Product</Text>
            <Text style={styles.checkSub}>Paste a product's ingredient list below</Text>
            <TextInput
              style={styles.checkInput}
              multiline
              numberOfLines={5}
              value={checkInput}
              onChangeText={v => { setCheckInput(v); setCheckResults(null); }}
              placeholder="Paste ingredients here..."
              placeholderTextColor={Colors.textMuted}
            />
            <Pressable style={[styles.checkBtn, !checkInput.trim() && { opacity: 0.5 }]} onPress={runCheck} disabled={!checkInput.trim()}>
              <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={StyleSheet.absoluteFill} />
              <Text style={styles.checkBtnText}>Check Against My List</Text>
            </Pressable>

            {checkResults && (
              <View style={[styles.resultCard, { borderColor: checkResults.safe ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)', backgroundColor: checkResults.safe ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)' }]}>
                {checkResults.safe ? (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#4ADE80" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultTitle, { color: '#4ADE80' }]}>Looks Safe!</Text>
                      <Text style={styles.resultNote}>No blacklisted ingredients found in this product.</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Ionicons name="warning" size={24} color={Colors.scorePoor} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultTitle, { color: Colors.scorePoor }]}>{checkResults.found.length} Warning{checkResults.found.length > 1 ? 's' : ''}</Text>
                      {checkResults.found.map(f => (
                        <Text key={f} style={styles.resultFound}>• {f}</Text>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {/* Stats */}
        {!checkMode && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{entries.length}</Text>
              <Text style={styles.statLabel}>Ingredients avoided</Text>
            </View>
            <Pressable style={[styles.statCard, styles.addCard]} onPress={() => setShowAdd(true)}>
              <Ionicons name="add-circle" size={24} color={Colors.primary} />
              <Text style={styles.addCardText}>Add ingredient</Text>
            </Pressable>
          </View>
        )}

        {/* Add form */}
        {showAdd && !checkMode && (
          <View style={styles.addForm}>
            <Text style={styles.addFormTitle}>Add to Blacklist</Text>
            <TextInput
              style={styles.formInput}
              value={ingredientInput}
              onChangeText={setIngredientInput}
              placeholder="Ingredient name (e.g. Fragrance)"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <TextInput
              style={styles.formInput}
              value={reasonInput}
              onChangeText={setReasonInput}
              placeholder="Why you avoid it (optional)"
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.formActions}>
              <Pressable style={styles.cancelBtn} onPress={() => { setShowAdd(false); setIngredientInput(''); setReasonInput(''); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.saveBtn, !ingredientInput.trim() && { opacity: 0.5 }]} onPress={addEntry} disabled={!ingredientInput.trim()}>
                <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={StyleSheet.absoluteFill} />
                <Text style={styles.saveBtnText}>Add</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* My list */}
        {!checkMode && entries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Avoid List</Text>
            {entries.map(entry => (
              <View key={entry.id} style={styles.entryRow}>
                <View style={styles.entryDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryName}>{entry.name}</Text>
                  <Text style={styles.entryReason}>{entry.reason}</Text>
                </View>
                <Pressable onPress={() => deleteEntry(entry.id)} style={styles.deleteBtn}>
                  <Ionicons name="close-circle-outline" size={20} color={Colors.textMuted} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Suggestions for skin type */}
        {!checkMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>For Your Skin Type</Text>
            <Text style={styles.sectionSub}>Common irritants for {skinType} skin — tap to add</Text>
            {suggestions.map(s => (
              <Pressable
                key={s.name}
                style={[styles.suggRow, alreadyAdded(s.name) && styles.suggRowAdded]}
                onPress={() => !alreadyAdded(s.name) && addSuggestion(s)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.suggName, alreadyAdded(s.name) && { color: Colors.textMuted }]}>{s.name}</Text>
                  <Text style={styles.suggReason}>{s.reason}</Text>
                </View>
                {alreadyAdded(s.name)
                  ? <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
                  : <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                }
              </Pressable>
            ))}
          </View>
        )}

        {/* Universal irritants */}
        {!checkMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Common Irritants (All Skin)</Text>
            {COMMON_IRRITANTS.map(s => (
              <Pressable
                key={s.name}
                style={[styles.suggRow, alreadyAdded(s.name) && styles.suggRowAdded]}
                onPress={() => !alreadyAdded(s.name) && addSuggestion(s)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.suggName, alreadyAdded(s.name) && { color: Colors.textMuted }]}>{s.name}</Text>
                  <Text style={styles.suggReason}>{s.reason}</Text>
                </View>
                {alreadyAdded(s.name)
                  ? <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
                  : <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                }
              </Pressable>
            ))}
          </View>
        )}

        {/* Empty state */}
        {!checkMode && entries.length === 0 && !showAdd && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🚫</Text>
            <Text style={styles.emptyTitle}>Your blacklist is empty</Text>
            <Text style={styles.emptySub}>Add ingredients you're sensitive to, then use the search tool to check any product.</Text>
          </View>
        )}

        {/* CTA to scanner */}
        <Pressable style={styles.scanCta} onPress={() => router.push('/scanner')}>
          <LinearGradient colors={['rgba(196,98,45,0.1)', 'rgba(196,98,45,0.02)']} style={StyleSheet.absoluteFill} />
          <Ionicons name="flask-outline" size={20} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.scanCtaTitle}>Scan a Product Label</Text>
            <Text style={styles.scanCtaSub}>Full ingredient analysis + your personal blacklist</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </Pressable>

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
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: 16 },

  checkCard: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 10, marginBottom: 14 },
  checkTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  checkSub: { fontSize: 12, color: Colors.textMuted, marginTop: -6 },
  checkInput: {
    backgroundColor: Colors.bgElevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    padding: 12, fontSize: 13, color: Colors.textPrimary, minHeight: 100, textAlignVertical: 'top',
  },
  checkBtn: { height: 48, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  checkBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  resultCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  resultTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  resultNote: { fontSize: 12, color: Colors.textSecondary },
  resultFound: { fontSize: 12, color: Colors.scorePoor, fontWeight: '600', marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 28, fontWeight: '900', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textAlign: 'center' },
  addCard: { borderColor: 'rgba(196,98,45,0.3)', backgroundColor: 'rgba(196,98,45,0.06)' },
  addCardText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  addForm: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 10, marginBottom: 14 },
  addFormTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  formInput: {
    backgroundColor: Colors.bgElevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.textPrimary,
  },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  cancelText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  saveBtn: { flex: 2, height: 44, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: Colors.textMuted, marginBottom: 10 },

  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, marginBottom: 8 },
  entryDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.scorePoor },
  entryName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  entryReason: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  deleteBtn: { padding: 4 },

  suggRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, marginBottom: 8 },
  suggRowAdded: { opacity: 0.6, borderColor: 'rgba(74,222,128,0.2)' },
  suggName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  suggReason: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  scanCta: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)', padding: 14, marginBottom: 14 },
  scanCtaTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  scanCtaSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
