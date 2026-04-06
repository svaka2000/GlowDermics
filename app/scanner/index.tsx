import { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import { Colors } from '../../src/constants/colors';
import { scanIngredients } from '../../src/services/ingredientScanner';
import { IngredientReport } from '../../src/types/ingredients';

type Mode = 'choose' | 'analyzing' | 'results' | 'manual';

export default function Scanner() {
  const [mode, setMode] = useState<Mode>('choose');
  const [report, setReport] = useState<IngredientReport | null>(null);
  const [manualText, setManualText] = useState('');

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      await runScan(result.assets[0].uri);
    }
  };

  const handleCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      await runScan(result.assets[0].uri);
    }
  };

  const runScan = async (uri: string) => {
    setMode('analyzing');
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });
      const result = await scanIngredients(base64, 'image/jpeg');
      setReport(result);
      setMode('results');
    } catch (err: any) {
      Alert.alert('Scan Failed', err?.message || 'Could not read the ingredients. Try better lighting or type them manually.');
      setMode('choose');
    }
  };

  const runManual = async () => {
    if (!manualText.trim()) return;
    setMode('analyzing');
    try {
      const result = await scanIngredients(null, null, manualText.trim());
      setReport(result);
      setMode('results');
    } catch (err: any) {
      Alert.alert('Analysis Failed', err?.message || 'Something went wrong.');
      setMode('choose');
    }
  };

  if (mode === 'analyzing') {
    return (
      <View style={styles.root}>
        <View style={styles.centerWrap}>
          <ActivityIndicator color={Colors.primary} size="large" style={{ marginBottom: 20 }} />
          <Text style={styles.analyzingTitle}>Scanning ingredients…</Text>
          <Text style={styles.analyzingSub}>Checking for irritants, toxins, beneficial actives, and compatibility with your skin type.</Text>
        </View>
      </View>
    );
  }

  if (mode === 'results' && report) {
    return <IngredientResults report={report} onReset={() => { setReport(null); setMode('choose'); }} />;
  }

  if (mode === 'manual') {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable onPress={() => setMode('choose')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Type Ingredients</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.manualContent}>
            <Text style={styles.manualLabel}>Paste or type the full ingredient list:</Text>
            <TextInput
              style={styles.manualInput}
              value={manualText}
              onChangeText={setManualText}
              multiline
              placeholder="Aqua, Glycerin, Niacinamide, Retinol..."
              placeholderTextColor={Colors.textMuted}
              textAlignVertical="top"
            />
            <Text style={styles.manualHint}>Copy from the brand's website or type from the back of the product.</Text>
          </ScrollView>
          <View style={styles.manualFooter}>
            <Pressable
              style={[styles.mainBtn, !manualText.trim() && styles.mainBtnDisabled]}
              onPress={runManual}
              disabled={!manualText.trim()}
            >
              <LinearGradient
                colors={manualText.trim() ? [Colors.primaryLight, Colors.primary] : ['#333', '#222']}
                style={styles.mainBtnGrad}
              >
                <Ionicons name="flask-outline" size={20} color={Colors.white} />
                <Text style={styles.mainBtnText}>Analyze Ingredients</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Ingredient Scanner</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <LinearGradient colors={['rgba(196,98,45,0.15)', 'transparent']} style={styles.heroGlow} />
          <View style={styles.heroIconWrap}>
            <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.heroIconGrad}>
              <Ionicons name="flask" size={38} color={Colors.white} />
            </LinearGradient>
          </View>
          <Text style={styles.heroTitle}>Know What's In Your Products</Text>
          <Text style={styles.heroSub}>Scan any product's ingredient list and get an instant AI breakdown — what's helping, what's harmful, and what to avoid for your skin type.</Text>
        </View>

        <View style={styles.howCard}>
          <Text style={styles.howTitle}>What you'll get</Text>
          {[
            { icon: 'shield-checkmark-outline', text: 'Safety rating out of 100' },
            { icon: 'alert-circle-outline', text: 'Flagged irritants, toxins & comedogenics' },
            { icon: 'star-outline', text: 'Beneficial actives highlighted' },
            { icon: 'person-outline', text: 'Compatibility with your skin type' },
            { icon: 'leaf-outline', text: 'Natural vs synthetic breakdown' },
          ].map(({ icon, text }) => (
            <View key={text} style={styles.howRow}>
              <Ionicons name={icon as any} size={16} color={Colors.primary} />
              <Text style={styles.howText}>{text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.btnGroup}>
          <Pressable style={styles.mainBtn} onPress={handleCamera}>
            <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.mainBtnGrad}>
              <Ionicons name="camera" size={22} color={Colors.white} />
              <Text style={styles.mainBtnText}>Scan Product Label</Text>
            </LinearGradient>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={handlePickPhoto}>
            <Ionicons name="images-outline" size={20} color={Colors.primary} />
            <Text style={styles.secondaryBtnText}>Upload Photo</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => setMode('manual')}>
            <Ionicons name="create-outline" size={20} color={Colors.primary} />
            <Text style={styles.secondaryBtnText}>Type Ingredients Manually</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function IngredientResults({ report, onReset }: { report: IngredientReport; onReset: () => void }) {
  const safetyColor = report.safetyScore >= 75 ? Colors.scoreExcellent : report.safetyScore >= 50 ? Colors.scoreFair : Colors.scorePoor;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={onReset} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Ingredient Report</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.resultsScroll}>

        {/* Safety score */}
        <View style={styles.safetyCard}>
          <LinearGradient colors={[Colors.bgCard, Colors.bgElevated]} style={StyleSheet.absoluteFill} />
          <View style={styles.safetyTop}>
            <View>
              <Text style={styles.safetyLabel}>Safety Score</Text>
              <Text style={[styles.safetyScore, { color: safetyColor }]}>{report.safetyScore}<Text style={styles.safetyOut}>/100</Text></Text>
            </View>
            <View style={[styles.safetyBadge, { backgroundColor: safetyColor + '22' }]}>
              <Text style={[styles.safetyBadgeText, { color: safetyColor }]}>{report.verdict}</Text>
            </View>
          </View>
          <Text style={styles.safetySummary}>{report.summary}</Text>
          <View style={styles.naturalRow}>
            <View style={styles.naturalStat}>
              <Text style={[styles.naturalNum, { color: Colors.scoreExcellent }]}>{report.naturalPercent}%</Text>
              <Text style={styles.naturalLabel}>Natural</Text>
            </View>
            <View style={styles.naturalDivider} />
            <View style={styles.naturalStat}>
              <Text style={[styles.naturalNum, { color: Colors.textSecondary }]}>{100 - report.naturalPercent}%</Text>
              <Text style={styles.naturalLabel}>Synthetic</Text>
            </View>
            <View style={styles.naturalDivider} />
            <View style={styles.naturalStat}>
              <Text style={[styles.naturalNum, { color: Colors.primary }]}>{report.totalIngredients}</Text>
              <Text style={styles.naturalLabel}>Ingredients</Text>
            </View>
          </View>
        </View>

        {/* Flagged ingredients */}
        {report.flagged.length > 0 && (
          <View style={styles.resultSection}>
            <Text style={[styles.resultSectionTitle, { color: Colors.scorePoor }]}>
              ⚠ Flagged ({report.flagged.length})
            </Text>
            {report.flagged.map((ing, i) => (
              <View key={i} style={[styles.ingredientCard, styles.ingredientCardDanger]}>
                <View style={styles.ingTop}>
                  <Text style={styles.ingName}>{ing.name}</Text>
                  <View style={[styles.ingBadge, { backgroundColor: ing.severity === 'high' ? Colors.scorePoor + '22' : Colors.scoreFair + '22' }]}>
                    <Text style={[styles.ingBadgeText, { color: ing.severity === 'high' ? Colors.scorePoor : Colors.scoreFair }]}>
                      {ing.severity?.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.ingReason}>{ing.reason}</Text>
                {ing.commonlyFoundIn && <Text style={styles.ingMeta}>Also in: {ing.commonlyFoundIn}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Beneficial actives */}
        {report.beneficial.length > 0 && (
          <View style={styles.resultSection}>
            <Text style={[styles.resultSectionTitle, { color: Colors.scoreExcellent }]}>
              ✓ Beneficial Actives ({report.beneficial.length})
            </Text>
            {report.beneficial.map((ing, i) => (
              <View key={i} style={[styles.ingredientCard, styles.ingredientCardGood]}>
                <Text style={styles.ingName}>{ing.name}</Text>
                <Text style={styles.ingReason}>{ing.benefit}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Skin compatibility */}
        <View style={styles.resultSection}>
          <Text style={styles.resultSectionTitle}>Skin Type Compatibility</Text>
          <View style={styles.compatCard}>
            {report.skinCompatibility.map((compat, i) => (
              <View key={i} style={[styles.compatRow, i < report.skinCompatibility.length - 1 && styles.compatBorder]}>
                <Text style={styles.compatSkinType}>{compat.skinType}</Text>
                <View style={[styles.compatBadge, { backgroundColor: compat.compatible ? Colors.scoreExcellent + '22' : Colors.scorePoor + '22' }]}>
                  <Text style={[styles.compatBadgeText, { color: compat.compatible ? Colors.scoreExcellent : Colors.scorePoor }]}>
                    {compat.compatible ? 'Compatible' : 'Caution'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* TallowDermics comparison */}
        <View style={styles.tdCompareCard}>
          <LinearGradient colors={['rgba(196,98,45,0.12)', 'rgba(196,98,45,0.04)']} style={StyleSheet.absoluteFill} />
          <Text style={styles.tdCompareEyebrow}>TALLOWDERMICS COMPARISON</Text>
          <Text style={styles.tdCompareText}>{report.tallowDermicsComparison}</Text>
        </View>

        <Pressable style={styles.scanAgainBtn} onPress={onReset}>
          <Text style={styles.scanAgainText}>Scan Another Product →</Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  analyzingTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 10 },
  analyzingSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  hero: { alignItems: 'center', paddingVertical: 32, position: 'relative' },
  heroGlow: { position: 'absolute', top: 0, left: '5%', right: '5%', height: 100, borderRadius: 50 },
  heroIconWrap: { borderRadius: 26, overflow: 'hidden', marginBottom: 20 },
  heroIconGrad: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center', borderRadius: 26 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 10 },
  heroSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 320 },
  howCard: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 18, marginBottom: 24, gap: 12 },
  howTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  howText: { fontSize: 14, color: Colors.textSecondary },
  btnGroup: { gap: 12 },
  mainBtn: { borderRadius: 18, overflow: 'hidden' },
  mainBtnDisabled: { opacity: 0.5 },
  mainBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 20 },
  mainBtnText: { fontSize: 17, fontWeight: '700', color: Colors.white },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 18, borderWidth: 1.5, borderColor: Colors.borderStrong, backgroundColor: 'rgba(196,98,45,0.05)' },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  manualContent: { padding: 24, flexGrow: 1 },
  manualLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12 },
  manualInput: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, fontSize: 14, color: Colors.textPrimary, minHeight: 200 },
  manualHint: { fontSize: 12, color: Colors.textMuted, marginTop: 10, lineHeight: 18 },
  manualFooter: { padding: 20 },
  resultsScroll: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },
  safetyCard: { borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 20, marginBottom: 16, overflow: 'hidden' },
  safetyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  safetyLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: Colors.textMuted, marginBottom: 4 },
  safetyScore: { fontSize: 52, fontWeight: '900', lineHeight: 58 },
  safetyOut: { fontSize: 20, fontWeight: '400', color: Colors.textMuted },
  safetyBadge: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  safetyBadgeText: { fontSize: 13, fontWeight: '800' },
  safetySummary: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21, marginBottom: 16 },
  naturalRow: { flexDirection: 'row', alignItems: 'center' },
  naturalStat: { flex: 1, alignItems: 'center' },
  naturalNum: { fontSize: 20, fontWeight: '800' },
  naturalLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  naturalDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  resultSection: { marginBottom: 16 },
  resultSectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  ingredientCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8 },
  ingredientCardDanger: { backgroundColor: 'rgba(248,113,113,0.06)', borderColor: 'rgba(248,113,113,0.2)' },
  ingredientCardGood: { backgroundColor: 'rgba(74,222,128,0.06)', borderColor: 'rgba(74,222,128,0.2)' },
  ingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ingName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  ingBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  ingBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  ingReason: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  ingMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  compatCard: { backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16 },
  compatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  compatBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  compatSkinType: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  compatBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  compatBadgeText: { fontSize: 11, fontWeight: '700' },
  tdCompareCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderStrong, padding: 18, marginBottom: 16 },
  tdCompareEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: Colors.primary, marginBottom: 8 },
  tdCompareText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  scanAgainBtn: { alignItems: 'center', paddingVertical: 16 },
  scanAgainText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
});
