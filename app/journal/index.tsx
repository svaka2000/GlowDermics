import { useCallback, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Alert, KeyboardAvoidingView, Platform, Animated, Easing,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';
import { JournalEntry } from '../../src/types';

const MOODS = [
  { key: 'great' as const, emoji: '✨', label: 'Great', color: '#4ADE80' },
  { key: 'good' as const, emoji: '🌿', label: 'Good', color: '#86EFAC' },
  { key: 'okay' as const, emoji: '🌤', label: 'Okay', color: '#FCD34D' },
  { key: 'bad' as const, emoji: '🌧', label: 'Rough', color: '#F87171' },
];

const QUICK_TAGS = [
  'Slept well', 'Stressed', 'Ate well', 'Lots of water', 'Wore SPF',
  'Skipped routine', 'New product', 'Period', 'Gym', 'Travel',
];

function getMoodConfig(mood: JournalEntry['mood']) {
  return MOODS.find(m => m.key === mood) ?? MOODS[1];
}

export default function Journal() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [writing, setWriting] = useState(false);
  const [note, setNote] = useState('');
  const [mood, setMood] = useState<JournalEntry['mood']>('good');
  const [tags, setTags] = useState<string[]>([]);

  // Entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  // Compose card slide-in
  const composeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    Storage.getJournal().then(data => {
      setEntries(data);
      Animated.stagger(80, [
        Animated.timing(headerAnim, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(contentAnim, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
    resetForm();
  }, []));

  const openCompose = () => {
    composeAnim.setValue(0);
    setWriting(true);
    Animated.timing(composeAnim, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };

  const resetForm = () => {
    setNote('');
    setMood('good');
    setTags([]);
    setWriting(false);
  };

  const save = async () => {
    if (!note.trim()) return;
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mood,
      note: note.trim(),
      tags,
    };
    await Storage.saveJournalEntry(entry);
    const updated = await Storage.getJournal();
    setEntries(updated);
    resetForm();
  };

  const deleteEntry = async (id: string) => {
    const doDelete = async () => {
      await Storage.deleteJournalEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    };

    if (Platform.OS === 'web') {
      // Alert.alert doesn't work on web — use browser confirm
      if (typeof window !== 'undefined' && window.confirm('Delete this journal entry?')) {
        await doDelete();
      }
    } else {
      Alert.alert('Delete Entry', 'Remove this journal entry?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const todayStr = new Date().toDateString();
  const hasTodayEntry = entries.some(e => new Date(e.date).toDateString() === todayStr);

  // Group entries by month
  const grouped: Record<string, JournalEntry[]> = {};
  entries.forEach(e => {
    const key = new Date(e.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
        }]}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Skin Journal</Text>
            <Text style={styles.headerSub}>{entries.length} entries</Text>
          </View>
          <Pressable
            style={styles.addBtn}
            onPress={() => writing ? resetForm() : openCompose()}
          >
            <Ionicons name={writing ? 'close' : 'add'} size={22} color={colors.white} />
          </Pressable>
        </Animated.View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Write entry */}
        {writing && (
          <Animated.View style={[styles.composeCard, {
            opacity: composeAnim,
            transform: [{ translateY: composeAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
          }]}>
            <Text style={styles.composeTitle}>How's your skin today?</Text>

            {/* Mood selector */}
            <View style={styles.moodRow}>
              {MOODS.map(m => (
                <Pressable
                  key={m.key}
                  style={[styles.moodBtn, mood === m.key && { borderColor: m.color, backgroundColor: m.color + '18' }]}
                  onPress={() => setMood(m.key)}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, mood === m.key && { color: m.color }]}>{m.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Quick tags */}
            <Text style={styles.tagSectionLabel}>Quick tags</Text>
            <View style={styles.tagWrap}>
              {QUICK_TAGS.map(tag => (
                <Pressable
                  key={tag}
                  style={[styles.tagChip, tags.includes(tag) && styles.tagChipActive]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.tagChipText, tags.includes(tag) && styles.tagChipTextActive]}>{tag}</Text>
                </Pressable>
              ))}
            </View>

            {/* Note */}
            <Text style={styles.tagSectionLabel}>Note</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="How does your skin feel? Any new reactions, changes you noticed..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.composeBtns}>
              <Pressable style={styles.cancelBtn} onPress={resetForm}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.saveBtn, !note.trim() && { opacity: 0.4 }]} onPress={save} disabled={!note.trim()}>
                <LinearGradient colors={[colors.primaryLight, colors.primary]} style={styles.saveBtnGrad}>
                  <Text style={styles.saveBtnText}>Save Entry</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Today nudge */}
        {!writing && !hasTodayEntry && entries.length > 0 && (
          <Pressable style={styles.nudgeCard} onPress={openCompose}>
            <LinearGradient colors={['rgba(196,98,45,0.12)', 'rgba(196,98,45,0.04)']} style={StyleSheet.absoluteFill} />
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.nudgeTitle}>Log today's skin check-in</Text>
              <Text style={styles.nudgeSub}>Track how your skin feels, what you noticed</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        )}

        {/* Empty state */}
        {entries.length === 0 && !writing && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📓</Text>
            <Text style={styles.emptyTitle}>Your skin story starts here</Text>
            <Text style={styles.emptySub}>Daily check-ins let you track patterns, spot triggers, and celebrate your progress over time.</Text>
            <Pressable style={styles.startBtn} onPress={openCompose}>
              <LinearGradient colors={[colors.primaryLight, colors.primary]} style={styles.startBtnGrad}>
                <Text style={styles.startBtnText}>Write First Entry</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* Entry list grouped by month */}
        {Object.entries(grouped).map(([month, monthEntries], groupIdx) => (
          <Animated.View key={month} style={[styles.monthGroup, {
            opacity: contentAnim,
            transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20 + groupIdx * 8, 0] }) }],
          }]}>
            <Text style={styles.monthLabel}>{month}</Text>
            <View style={styles.monthEntries}>
              {monthEntries.map(entry => {
                const m = getMoodConfig(entry.mood);
                return (
                  <View key={entry.id} style={styles.entryCard}>
                    <View style={styles.entryHeader}>
                      <View style={[styles.moodDot, { backgroundColor: m.color }]} />
                      <Text style={styles.entryDate}>
                        {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </Text>
                      <View style={[styles.moodBadge, { backgroundColor: m.color + '18' }]}>
                        <Text style={styles.moodBadgeEmoji}>{m.emoji}</Text>
                        <Text style={[styles.moodBadgeLabel, { color: m.color }]}>{m.label}</Text>
                      </View>
                      <Pressable onPress={() => deleteEntry(entry.id)} style={styles.deleteBtn}>
                        <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
                      </Pressable>
                    </View>

                    {entry.tags.length > 0 && (
                      <View style={styles.entryTags}>
                        {entry.tags.map(tag => (
                          <View key={tag} style={styles.entryTag}>
                            <Text style={styles.entryTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <Text style={styles.entryNote}>{entry.note}</Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  headerTitle: { fontSize: 22, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16 },

  composeCard: {
    backgroundColor: c.bgCard, borderRadius: 20,
    borderWidth: 1, borderColor: c.borderStrong,
    padding: 20, marginBottom: 20, gap: 16,
  },
  composeTitle: { fontSize: 17, fontWeight: '700', color: c.textPrimary },
  moodRow: { flexDirection: 'row', gap: 8 },
  moodBtn: {
    flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1, borderColor: c.border,
    backgroundColor: c.bgElevated,
  },
  moodEmoji: { fontSize: 20 },
  moodLabel: { fontSize: 11, fontWeight: '600', color: c.textMuted },
  tagSectionLabel: { fontSize: 12, fontWeight: '600', color: c.textMuted, letterSpacing: 0.5 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated },
  tagChipActive: { borderColor: c.primary, backgroundColor: 'rgba(196,98,45,0.15)' },
  tagChipText: { fontSize: 12, color: c.textMuted },
  tagChipTextActive: { color: c.primary, fontWeight: '600' },
  noteInput: {
    backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.border,
    borderRadius: 14, padding: 14, fontSize: 14, color: c.textPrimary,
    minHeight: 100, lineHeight: 22,
  },
  composeBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: c.bgElevated, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderWidth: 1, borderColor: c.border },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: c.textMuted },
  saveBtn: { flex: 1.5, borderRadius: 14, overflow: 'hidden' },
  saveBtnGrad: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: c.white },

  nudgeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(196,98,45,0.2)',
    padding: 16, marginBottom: 20,
  },
  nudgeTitle: { fontSize: 14, fontWeight: '700', color: c.textPrimary },
  nudgeSub: { fontSize: 12, color: c.textMuted, marginTop: 2 },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: c.textPrimary },
  emptySub: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  startBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  startBtnGrad: { paddingHorizontal: 28, paddingVertical: 15 },
  startBtnText: { fontSize: 15, fontWeight: '700', color: c.white },

  monthGroup: { marginBottom: 24 },
  monthLabel: { fontSize: 13, fontWeight: '700', color: c.textMuted, letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },
  monthEntries: { gap: 10 },

  entryCard: {
    backgroundColor: c.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: c.border, padding: 16, gap: 10,
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moodDot: { width: 8, height: 8, borderRadius: 4 },
  entryDate: { fontSize: 12, color: c.textMuted, flex: 1 },
  moodBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  moodBadgeEmoji: { fontSize: 12 },
  moodBadgeLabel: { fontSize: 11, fontWeight: '600' },
  deleteBtn: { padding: 4 },
  entryTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  entryTag: { backgroundColor: c.bgElevated, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: c.border },
  entryTagText: { fontSize: 11, color: c.textSecondary },
  entryNote: { fontSize: 14, color: c.textSecondary, lineHeight: 22 },
  });
}
