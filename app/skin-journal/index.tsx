import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, TextInput, KeyboardAvoidingView,
  Platform, Alert,
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
  purple: '#A78BFA',
};

const STORAGE_KEY = 'gd_skin_journal';

const CONDITIONS = [
  { value: 1, label: 'Rough day', emoji: '😰' },
  { value: 2, label: 'Not great', emoji: '😕' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 5, label: 'Glowing', emoji: '✨' },
];

const FACTORS = [
  { id: 'stress', label: 'High Stress', icon: '😤', category: 'lifestyle' },
  { id: 'poor_sleep', label: 'Poor Sleep', icon: '😴', category: 'lifestyle' },
  { id: 'great_sleep', label: 'Great Sleep', icon: '💤', category: 'lifestyle' },
  { id: 'exercise', label: 'Exercised', icon: '🏃', category: 'lifestyle' },
  { id: 'junk_food', label: 'Junk Food', icon: '🍔', category: 'diet' },
  { id: 'sugar', label: 'High Sugar', icon: '🍭', category: 'diet' },
  { id: 'dairy', label: 'Dairy', icon: '🥛', category: 'diet' },
  { id: 'hydrated', label: 'Well Hydrated', icon: '💧', category: 'diet' },
  { id: 'healthy_food', label: 'Ate Well', icon: '🥗', category: 'diet' },
  { id: 'new_product', label: 'New Product', icon: '🧴', category: 'skincare' },
  { id: 'skipped_routine', label: 'Skipped Routine', icon: '⏭️', category: 'skincare' },
  { id: 'full_routine', label: 'Full Routine', icon: '✅', category: 'skincare' },
  { id: 'sun_exposure', label: 'Sun Exposure', icon: '☀️', category: 'environment' },
  { id: 'travel', label: 'Travel / Change', icon: '✈️', category: 'environment' },
  { id: 'menstrual', label: 'Period', icon: '🌙', category: 'hormonal' },
  { id: 'pms', label: 'PMS Week', icon: '📅', category: 'hormonal' },
];

interface JournalEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  condition: number;
  factors: string[];
  notes: string;
  timestamp: number;
}

const today = () => new Date().toISOString().split('T')[0];

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const conditionColor = (v: number) => {
  if (v >= 5) return Colors.green;
  if (v >= 4) return '#86EFAC';
  if (v >= 3) return Colors.gold;
  if (v >= 2) return '#FB923C';
  return Colors.red;
};

export default function SkinJournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [view, setView] = useState<'log' | 'history'>('log');
  const [condition, setCondition] = useState(3);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const todayEntry = entries.find(e => e.date === today());

  useFocusEffect(useCallback(() => {
    loadEntries();
  }, []));

  const loadEntries = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: JournalEntry[] = JSON.parse(raw);
        data.sort((a, b) => b.timestamp - a.timestamp);
        setEntries(data);
        const te = data.find(e => e.date === today());
        if (te) {
          setCondition(te.condition);
          setSelectedFactors(te.factors);
          setNotes(te.notes);
        }
      }
    } catch {}
  };

  const toggleFactor = (id: string) => {
    setSelectedFactors(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const saveEntry = async () => {
    setSaving(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const data: JournalEntry[] = raw ? JSON.parse(raw) : [];
      const existing = data.findIndex(e => e.date === today());
      const entry: JournalEntry = {
        id: `je_${Date.now()}`,
        date: today(),
        condition,
        factors: selectedFactors,
        notes: notes.trim(),
        timestamp: Date.now(),
      };
      if (existing >= 0) {
        entry.id = data[existing].id;
        data[existing] = entry;
      } else {
        data.unshift(entry);
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setEntries(data);
      Alert.alert('Saved', "Today's journal entry saved.");
    } catch {}
    setSaving(false);
  };

  const deleteEntry = (id: string) => {
    Alert.alert('Delete Entry', 'Remove this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const updated = entries.filter(e => e.id !== id);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          setEntries(updated);
        },
      },
    ]);
  };

  // Find most common negative factors across all entries
  const factorFrequency = () => {
    const freq: Record<string, number> = {};
    entries.forEach(e => e.factors.forEach(f => { freq[f] = (freq[f] || 0) + 1; }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  // Average condition over last 14 days
  const recentAvg = () => {
    const cutoff = Date.now() - 14 * 86400000;
    const recent = entries.filter(e => e.timestamp > cutoff);
    if (!recent.length) return null;
    return (recent.reduce((sum, e) => sum + e.condition, 0) / recent.length).toFixed(1);
  };

  const avg = recentAvg();
  const topFactors = factorFrequency();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Skin Journal</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.tabBar}>
          {(['log', 'history'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, view === t && styles.tabBtnActive]}
              onPress={() => setView(t)}
            >
              <Text style={[styles.tabLabel, view === t && styles.tabLabelActive]}>
                {t === 'log' ? "Today's Log" : 'History'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {view === 'log' && (
            <>
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>{formatDate(today())}</Text>
                {todayEntry && <Text style={styles.savedBadge}>✓ Saved today</Text>}
              </View>

              <Text style={styles.sectionLabel}>How does your skin feel today?</Text>
              <View style={styles.conditionRow}>
                {CONDITIONS.map(c => (
                  <TouchableOpacity
                    key={c.value}
                    style={[styles.conditionBtn, condition === c.value && { borderColor: conditionColor(c.value), backgroundColor: conditionColor(c.value) + '22' }]}
                    onPress={() => setCondition(c.value)}
                  >
                    <Text style={styles.conditionEmoji}>{c.emoji}</Text>
                    <Text style={[styles.conditionLabel, condition === c.value && { color: conditionColor(c.value) }]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>What factors apply today?</Text>
              <View style={styles.factorsGrid}>
                {FACTORS.map(f => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.factorChip, selectedFactors.includes(f.id) && styles.factorChipActive]}
                    onPress={() => toggleFactor(f.id)}
                  >
                    <Text style={styles.factorIcon}>{f.icon}</Text>
                    <Text style={[styles.factorLabel, selectedFactors.includes(f.id) && styles.factorLabelActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Notes (optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any observations, new products, reactions..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={saveEntry} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : todayEntry ? 'Update Entry' : 'Save Entry'}</Text>
              </TouchableOpacity>
            </>
          )}

          {view === 'history' && (
            <>
              {entries.length > 0 && (
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{entries.length}</Text>
                    <Text style={styles.statLabel}>Total Entries</Text>
                  </View>
                  {avg && (
                    <View style={styles.statCard}>
                      <Text style={[styles.statValue, { color: conditionColor(parseFloat(avg)) }]}>{avg}</Text>
                      <Text style={styles.statLabel}>14-Day Avg</Text>
                    </View>
                  )}
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{topFactors.length > 0 ? topFactors[0][1] : 0}×</Text>
                    <Text style={styles.statLabel}>Top Factor</Text>
                  </View>
                </View>
              )}

              {topFactors.length > 0 && (
                <View style={styles.insightCard}>
                  <Text style={styles.insightTitle}>Most Logged Factors</Text>
                  {topFactors.map(([fid, count]) => {
                    const factor = FACTORS.find(f => f.id === fid);
                    if (!factor) return null;
                    return (
                      <View key={fid} style={styles.insightRow}>
                        <Text style={styles.insightIcon}>{factor.icon}</Text>
                        <Text style={styles.insightFactor}>{factor.label}</Text>
                        <Text style={styles.insightCount}>{count}×</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {entries.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📔</Text>
                  <Text style={styles.emptyText}>No entries yet. Start logging today.</Text>
                </View>
              ) : (
                entries.map(entry => (
                  <View key={entry.id} style={styles.entryCard}>
                    <View style={styles.entryHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                        <View style={styles.entryConditionRow}>
                          <Text style={styles.entryEmoji}>{CONDITIONS.find(c => c.value === entry.condition)?.emoji}</Text>
                          <Text style={[styles.entryConditionText, { color: conditionColor(entry.condition) }]}>
                            {CONDITIONS.find(c => c.value === entry.condition)?.label}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => deleteEntry(entry.id)} style={styles.deleteBtn}>
                        <Text style={styles.deleteBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    {entry.factors.length > 0 && (
                      <View style={styles.entryFactors}>
                        {entry.factors.map(fid => {
                          const f = FACTORS.find(x => x.id === fid);
                          return f ? (
                            <View key={fid} style={styles.miniChip}>
                              <Text style={styles.miniChipText}>{f.icon} {f.label}</Text>
                            </View>
                          ) : null;
                        })}
                      </View>
                    )}
                    {entry.notes ? <Text style={styles.entryNotes}>{entry.notes}</Text> : null}
                  </View>
                ))
              )}
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabLabel: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  tabLabelActive: { color: Colors.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  dateHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  dateText: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  savedBadge: {
    color: Colors.green, fontSize: 12, fontWeight: '700',
    backgroundColor: Colors.green + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  sectionLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 10, marginTop: 4 },
  conditionRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  conditionBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    backgroundColor: Colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  conditionEmoji: { fontSize: 20, marginBottom: 4 },
  conditionLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '600', textAlign: 'center' },
  factorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  factorChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 7,
    backgroundColor: Colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  factorChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  factorIcon: { fontSize: 13 },
  factorLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  factorLabelActive: { color: Colors.primary },
  notesInput: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    color: Colors.textPrimary, fontSize: 14, lineHeight: 21,
    borderWidth: 1, borderColor: Colors.border, minHeight: 80,
    textAlignVertical: 'top', marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginBottom: 16,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 12,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { color: Colors.gold, fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { color: Colors.textMuted, fontSize: 11 },
  insightCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
  },
  insightTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  insightRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  insightIcon: { fontSize: 14, width: 20 },
  insightFactor: { flex: 1, color: Colors.textSecondary, fontSize: 13 },
  insightCount: { color: Colors.gold, fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
  entryCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  entryHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  entryDate: { color: Colors.textSecondary, fontSize: 12, marginBottom: 4 },
  entryConditionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entryEmoji: { fontSize: 16 },
  entryConditionText: { fontSize: 14, fontWeight: '700' },
  deleteBtn: { padding: 4 },
  deleteBtnText: { color: Colors.textMuted, fontSize: 16 },
  entryFactors: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  miniChip: {
    backgroundColor: Colors.cardAlt, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  miniChipText: { color: Colors.textSecondary, fontSize: 11 },
  entryNotes: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, fontStyle: 'italic' },
});
