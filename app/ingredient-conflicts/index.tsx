import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, TextInput,
} from 'react-native';
import { router } from 'expo-router';

const Colors = {
  bg: '#0A0A0F', card: '#13131A', cardAlt: '#1A1A24', border: '#2A2A3A',
  primary: '#C4622D', gold: '#D4A96A', textPrimary: '#FAF3E0',
  textSecondary: '#9A9AAF', textMuted: '#5A5A6E',
  green: '#4ADE80', red: '#F87171', blue: '#60A5FA', yellow: '#FBBF24',
};

interface Ingredient {
  id: string;
  name: string;
  aliases?: string[];
  category: string;
  ph?: string;
}

interface Conflict {
  a: string;
  b: string;
  severity: 'avoid' | 'caution' | 'separate';
  reason: string;
  workaround?: string;
}

const INGREDIENTS: Ingredient[] = [
  { id: 'vitc', name: 'Vitamin C (L-ascorbic acid)', aliases: ['LAA', 'ascorbic acid'], category: 'Antioxidant', ph: '2.5–3.5' },
  { id: 'bha', name: 'BHA (Salicylic Acid)', aliases: ['salicylic acid', 'BHA'], category: 'Exfoliant', ph: '3–4' },
  { id: 'aha', name: 'AHA (Glycolic/Lactic)', aliases: ['glycolic acid', 'lactic acid', 'AHA'], category: 'Exfoliant', ph: '3–4' },
  { id: 'retinol', name: 'Retinol / Retinoids', aliases: ['retinol', 'tretinoin', 'retin-a', 'retinoids', 'retinoic acid'], category: 'Vitamin A' },
  { id: 'niacinamide', name: 'Niacinamide', aliases: ['vitamin b3', 'niacinamide'], category: 'Vitamin B' },
  { id: 'benzoyl', name: 'Benzoyl Peroxide', aliases: ['BP', 'benzoyl peroxide', 'BPO'], category: 'Antibacterial' },
  { id: 'copper', name: 'Copper Peptides', aliases: ['GHK-Cu', 'copper peptides', 'copper'], category: 'Peptide' },
  { id: 'pha', name: 'PHA (Gluconolactone)', aliases: ['PHA', 'gluconolactone', 'lactobionic acid'], category: 'Exfoliant' },
  { id: 'bakuchiol', name: 'Bakuchiol', aliases: ['bakuchiol'], category: 'Plant Retinol' },
  { id: 'peptides', name: 'Peptides (general)', aliases: ['peptides', 'matrixyl', 'argireline', 'palmitoyl'], category: 'Peptide' },
  { id: 'aha_pha', name: 'AHA + PHA combo', aliases: [], category: 'Exfoliant' },
  { id: 'azelaic', name: 'Azelaic Acid', aliases: ['azelaic acid'], category: 'Multi-active' },
  { id: 'kojic', name: 'Kojic Acid', aliases: ['kojic acid'], category: 'Brightener' },
  { id: 'hyaluronic', name: 'Hyaluronic Acid', aliases: ['HA', 'hyaluronic acid', 'sodium hyaluronate'], category: 'Humectant' },
  { id: 'eo', name: 'Essential Oils', aliases: ['essential oil', 'EO', 'fragrance oil'], category: 'Fragrance' },
];

const CONFLICTS: Conflict[] = [
  {
    a: 'vitc',
    b: 'niacinamide',
    severity: 'separate',
    reason: "L-ascorbic acid and niacinamide can form niacin when mixed, causing temporary flushing. Both are stable at different pH levels — Vitamin C needs pH 2.5–3.5 while niacinamide is pH-neutral.",
    workaround: 'Apply Vitamin C AM, niacinamide PM. Or wait 30 minutes between application of each.',
  },
  {
    a: 'retinol',
    b: 'bha',
    severity: 'caution',
    reason: 'Using retinol and BHA on the same night significantly increases risk of irritation, redness, and barrier compromise. Both are potent — combining them doubles the sensitivity risk.',
    workaround: 'Skin cycle: retinol on Night 2, BHA on Night 1. Never on the same night.',
  },
  {
    a: 'retinol',
    b: 'aha',
    severity: 'caution',
    reason: 'Same as retinol + BHA. Combining retinol with AHA causes excessive cell turnover and sensitivity. The pH difference can also deactivate retinol.',
    workaround: 'Alternate on different nights. Never use together.',
  },
  {
    a: 'vitc',
    b: 'retinol',
    severity: 'separate',
    reason: 'Vitamin C is unstable at retinol\'s pH range and vice versa. Using together can deactivate both. Also: Vitamin C is an AM ingredient; retinol is PM.',
    workaround: 'Natural separation: Vitamin C always AM, retinol always PM.',
  },
  {
    a: 'benzoyl',
    b: 'retinol',
    severity: 'avoid',
    reason: 'Benzoyl peroxide oxidizes and destroys retinol on contact, making retinol completely ineffective. This is a true deactivation conflict.',
    workaround: 'Benzoyl peroxide as AM spot treatment; retinol PM on different skin areas. Never apply over each other.',
  },
  {
    a: 'vitc',
    b: 'bha',
    severity: 'caution',
    reason: 'Both are highly acidic. Using together doesn\'t cause a reaction but doubles acid load on the skin, increasing irritation risk significantly.',
    workaround: 'Use Vitamin C AM, BHA PM. Or use BHA on exfoliation nights and Vitamin C every morning.',
  },
  {
    a: 'vitc',
    b: 'aha',
    severity: 'caution',
    reason: 'High acid load when combined. Risk of irritation and barrier disruption, especially for sensitive skin. Not a deactivation conflict — just an irritation risk.',
    workaround: 'Use on separate times of day, or on different nights.',
  },
  {
    a: 'copper',
    b: 'vitc',
    severity: 'avoid',
    reason: 'Copper ions catalyze ascorbic acid oxidation (Fenton reaction). Both are active and cancel out each other\'s benefits. Vitamin C becomes pro-oxidant in the presence of copper.',
    workaround: 'Do not use in the same routine step. If using both, use them AM and PM on separate sessions minimum.',
  },
  {
    a: 'copper',
    b: 'aha',
    severity: 'avoid',
    reason: 'Acids (AHAs, BHAs) destabilize copper peptide complexes and reduce their efficacy. Low pH causes copper ions to dissociate from the peptide.',
    workaround: 'Use copper peptides PM (no acids), acids on separate exfoliation nights.',
  },
  {
    a: 'copper',
    b: 'retinol',
    severity: 'caution',
    reason: 'Can cause irritation when combined. Copper peptides are rebuilding; retinol is turning over — conflicting cellular signals that can cause sensitization.',
    workaround: 'Alternate nights: retinol on retinol nights, copper on recovery nights.',
  },
  {
    a: 'peptides',
    b: 'aha',
    severity: 'avoid',
    reason: 'Acids (AHAs) denature peptide bonds, destroying the active peptide molecules and rendering them ineffective. This is a true deactivation conflict.',
    workaround: 'Apply AHA first, wait 20+ minutes for pH to normalize, then apply peptides. Or use peptides PM without acids.',
  },
  {
    a: 'retinol',
    b: 'benzoyl',
    severity: 'avoid',
    reason: 'Benzoyl peroxide oxidizes retinol, making it completely ineffective.',
    workaround: 'Separate by AM/PM or use BP spot-only + retinol on different skin zones.',
  },
  {
    a: 'eo',
    b: 'retinol',
    severity: 'caution',
    reason: 'Many essential oils (citrus, peppermint, lavender) increase photosensitivity and skin reactivity when used alongside retinol, which already sensitizes skin.',
    workaround: 'Avoid fragrance/EO products entirely in retinol routines.',
  },
  {
    a: 'bha',
    b: 'aha',
    severity: 'caution',
    reason: 'Double acid exfoliation. Each is effective alone — combining multiplies irritation risk and over-exfoliates the skin barrier, leading to sensitization and more problems.',
    workaround: 'Use BHA on one exfoliation night, AHA on another (not both together).',
  },
];

const SAFE_COMBOS = [
  { a: 'Retinol', b: 'Niacinamide', note: 'Niacinamide reduces retinol irritation. A synergistic pairing.' },
  { a: 'Vitamin C', b: 'Vitamin E', note: 'Vitamin E stabilizes and potentiates Vitamin C. Classic antioxidant combo.' },
  { a: 'BHA', b: 'Niacinamide', note: 'Both fight acne via different mechanisms. Apply BHA first, then niacinamide.' },
  { a: 'Retinol', b: 'Hyaluronic Acid', note: 'HA buffers retinol irritation. Apply HA before retinol or mix the application sequence.' },
  { a: 'AHA', b: 'Hyaluronic Acid', note: 'HA on damp skin after AHA restores moisture without interfering with exfoliation.' },
  { a: 'Niacinamide', b: 'Hyaluronic Acid', note: 'Perfect daily hydration pairing. No interaction. Both safe for AM and PM.' },
  { a: 'Azelaic Acid', b: 'Niacinamide', note: 'Both anti-inflammatory and brightening. Synergistic for PIH and rosacea.' },
  { a: 'Bakuchiol', b: 'AHA', note: 'Bakuchiol (plant retinol) tolerates AHA better than synthetic retinol. Can be used same night for experienced users.' },
  { a: 'Peptides', b: 'Niacinamide', note: 'Both skin-repairing. No interaction. Good recovery night stack.' },
  { a: 'Vitamin C', b: 'Ferulic Acid', note: 'Ferulic acid significantly stabilizes and extends Vitamin C shelf life. Classic combo.' },
];

const severityColor = (s: string) => {
  if (s === 'avoid') return Colors.red;
  if (s === 'caution') return Colors.yellow;
  return Colors.gold;
};

const severityLabel = (s: string) => {
  if (s === 'avoid') return 'AVOID';
  if (s === 'caution') return 'CAUTION';
  return 'SEPARATE TIMES';
};

export default function IngredientConflictsScreen() {
  const [view, setView] = useState<'conflicts' | 'safe' | 'check'>('conflicts');
  const [search, setSearch] = useState('');
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<Conflict | null | 'safe'>(null);
  const [expandedConflict, setExpandedConflict] = useState<number | null>(null);

  const filteredConflicts = CONFLICTS.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    const a = INGREDIENTS.find(i => i.id === c.a);
    const b = INGREDIENTS.find(i => i.id === c.b);
    return a?.name.toLowerCase().includes(s) || b?.name.toLowerCase().includes(s) ||
      a?.aliases?.some(al => al.toLowerCase().includes(s)) ||
      b?.aliases?.some(al => al.toLowerCase().includes(s));
  });

  const checkConflict = () => {
    if (!selectedA || !selectedB) return;
    const conflict = CONFLICTS.find(c =>
      (c.a === selectedA && c.b === selectedB) || (c.a === selectedB && c.b === selectedA)
    );
    setCheckResult(conflict || 'safe');
  };

  const ingNameById = (id: string) => INGREDIENTS.find(i => i.id === id)?.name || id;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ingredient Conflicts</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.tabBar}>
        {(['conflicts', 'safe', 'check'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tabBtn, view === t && styles.tabBtnActive]} onPress={() => setView(t)}>
            <Text style={[styles.tabLabel, view === t && styles.tabLabelActive]}>
              {t === 'conflicts' ? '⚠️ Conflicts' : t === 'safe' ? '✅ Safe Combos' : '🔍 Check Two'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {view === 'conflicts' && (
          <>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search by ingredient name..."
              placeholderTextColor={Colors.textMuted}
            />
            {filteredConflicts.map((conflict, i) => (
              <TouchableOpacity key={i} style={styles.conflictCard} onPress={() => setExpandedConflict(expandedConflict === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.conflictHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.conflictPair}>
                      {ingNameById(conflict.a)} <Text style={styles.conflictPlus}>+</Text> {ingNameById(conflict.b)}
                    </Text>
                  </View>
                  <View style={[styles.severityBadge, { borderColor: severityColor(conflict.severity) }]}>
                    <Text style={[styles.severityText, { color: severityColor(conflict.severity) }]}>{severityLabel(conflict.severity)}</Text>
                  </View>
                </View>
                {expandedConflict === i && (
                  <View style={styles.conflictExpanded}>
                    <Text style={styles.conflictReason}>{conflict.reason}</Text>
                    {conflict.workaround && (
                      <View style={styles.workaroundCard}>
                        <Text style={styles.workaroundLabel}>✅ Workaround</Text>
                        <Text style={styles.workaroundText}>{conflict.workaround}</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {view === 'safe' && (
          <>
            <Text style={styles.sectionNote}>These ingredient pairs work well together — no deactivation, no excess irritation, and often synergistic effects.</Text>
            {SAFE_COMBOS.map((combo, i) => (
              <View key={i} style={styles.safeCard}>
                <View style={styles.safePairRow}>
                  <Text style={styles.safeIngA}>{combo.a}</Text>
                  <Text style={styles.safePlus}>+</Text>
                  <Text style={styles.safeIngB}>{combo.b}</Text>
                  <View style={styles.safeBadge}><Text style={styles.safeBadgeText}>✓ SAFE</Text></View>
                </View>
                <Text style={styles.safeNote}>{combo.note}</Text>
              </View>
            ))}
          </>
        )}

        {view === 'check' && (
          <>
            <Text style={styles.checkTitle}>Select two ingredients to check for conflicts</Text>
            <Text style={styles.checkLabel}>Ingredient A</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
              {INGREDIENTS.map(ing => (
                <TouchableOpacity
                  key={ing.id}
                  style={[styles.ingChip, selectedA === ing.id && styles.ingChipActiveA, selectedB === ing.id && { opacity: 0.4 }]}
                  onPress={() => { setSelectedA(ing.id === selectedA ? null : ing.id); setCheckResult(null); }}
                  disabled={selectedB === ing.id}
                >
                  <Text style={[styles.ingChipText, selectedA === ing.id && { color: Colors.blue }]}>{ing.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.checkLabel}>Ingredient B</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
              {INGREDIENTS.map(ing => (
                <TouchableOpacity
                  key={ing.id}
                  style={[styles.ingChip, selectedB === ing.id && styles.ingChipActiveB, selectedA === ing.id && { opacity: 0.4 }]}
                  onPress={() => { setSelectedB(ing.id === selectedB ? null : ing.id); setCheckResult(null); }}
                  disabled={selectedA === ing.id}
                >
                  <Text style={[styles.ingChipText, selectedB === ing.id && { color: Colors.red }]}>{ing.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.checkBtn, (!selectedA || !selectedB) && { opacity: 0.4 }]} onPress={checkConflict} disabled={!selectedA || !selectedB}>
              <Text style={styles.checkBtnText}>Check Compatibility</Text>
            </TouchableOpacity>
            {checkResult !== null && (
              <View style={checkResult === 'safe'
                ? [styles.resultCard, { borderColor: Colors.green + '55' }]
                : [styles.resultCard, { borderColor: severityColor((checkResult as Conflict).severity) + '55' }]}>
                {checkResult === 'safe' ? (
                  <>
                    <Text style={[styles.resultTitle, { color: Colors.green }]}>✅ No Known Conflicts</Text>
                    <Text style={styles.resultText}>
                      {ingNameById(selectedA!)} and {ingNameById(selectedB!)} can generally be used together without conflict. Always introduce one new product at a time to identify personal reactions.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.resultTitle, { color: severityColor((checkResult as Conflict).severity) }]}>
                      {severityLabel((checkResult as Conflict).severity)}
                    </Text>
                    <Text style={styles.resultText}>{(checkResult as Conflict).reason}</Text>
                    {(checkResult as Conflict).workaround && (
                      <View style={styles.workaroundCard}>
                        <Text style={styles.workaroundLabel}>✅ Workaround</Text>
                        <Text style={styles.workaroundText}>{(checkResult as Conflict).workaround}</Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  backText: { color: Colors.primary, fontSize: 16 },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: Colors.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  searchInput: { backgroundColor: Colors.card, borderRadius: 12, padding: 12, color: Colors.textPrimary, fontSize: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  conflictCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  conflictHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  conflictPair: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', lineHeight: 20 },
  conflictPlus: { color: Colors.textMuted },
  severityBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  severityText: { fontSize: 9, fontWeight: '700' },
  conflictExpanded: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  conflictReason: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19, marginBottom: 8 },
  workaroundCard: { backgroundColor: Colors.green + '15', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.green + '33' },
  workaroundLabel: { color: Colors.green, fontSize: 10, fontWeight: '700', marginBottom: 4 },
  workaroundText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  sectionNote: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, backgroundColor: Colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 14 },
  safeCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  safePairRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  safeIngA: { color: Colors.blue, fontSize: 13, fontWeight: '700' },
  safePlus: { color: Colors.textMuted, fontSize: 14 },
  safeIngB: { color: Colors.green, fontSize: 13, fontWeight: '700' },
  safeBadge: { backgroundColor: Colors.green + '22', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  safeBadgeText: { color: Colors.green, fontSize: 10, fontWeight: '700' },
  safeNote: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  checkTitle: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 14 },
  checkLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  ingChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  ingChipActiveA: { borderColor: Colors.blue, backgroundColor: Colors.blue + '22' },
  ingChipActiveB: { borderColor: Colors.red, backgroundColor: Colors.red + '22' },
  ingChipText: { color: Colors.textSecondary, fontSize: 12 },
  checkBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginVertical: 16 },
  checkBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resultCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 16 },
  resultTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  resultText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
