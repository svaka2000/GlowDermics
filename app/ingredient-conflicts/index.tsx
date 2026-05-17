import { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';
import { analyzeRoutineConflicts } from '../../src/services/skinAnalysis';
import {
  GlassHero, Card, Badge, Button, Section, Skeleton,
} from '../../src/components/ui';
import {
  ConflictSeverity, IngredientConflict, RoutineConflictReport,
} from '../../src/types';

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
  { id: 'vitc', name: 'Vitamin C (L-ascorbic)', aliases: ['LAA', 'ascorbic acid'], category: 'Antioxidant', ph: '2.5–3.5' },
  { id: 'bha', name: 'BHA (Salicylic)', aliases: ['salicylic acid', 'BHA'], category: 'Exfoliant', ph: '3–4' },
  { id: 'aha', name: 'AHA (Glycolic/Lactic)', aliases: ['glycolic acid', 'lactic acid', 'AHA'], category: 'Exfoliant', ph: '3–4' },
  { id: 'retinol', name: 'Retinol / Retinoids', aliases: ['retinol', 'tretinoin', 'retin-a', 'retinoids'], category: 'Vitamin A' },
  { id: 'niacinamide', name: 'Niacinamide', aliases: ['vitamin b3'], category: 'Vitamin B' },
  { id: 'benzoyl', name: 'Benzoyl Peroxide', aliases: ['BP', 'BPO'], category: 'Antibacterial' },
  { id: 'copper', name: 'Copper Peptides', aliases: ['GHK-Cu', 'copper'], category: 'Peptide' },
  { id: 'pha', name: 'PHA', aliases: ['gluconolactone', 'lactobionic acid'], category: 'Exfoliant' },
  { id: 'bakuchiol', name: 'Bakuchiol', aliases: [], category: 'Plant Retinol' },
  { id: 'peptides', name: 'Peptides', aliases: ['matrixyl', 'argireline', 'palmitoyl'], category: 'Peptide' },
  { id: 'azelaic', name: 'Azelaic Acid', aliases: ['azelaic'], category: 'Multi-active' },
  { id: 'kojic', name: 'Kojic Acid', aliases: [], category: 'Brightener' },
  { id: 'hyaluronic', name: 'Hyaluronic Acid', aliases: ['HA', 'sodium hyaluronate'], category: 'Humectant' },
  { id: 'eo', name: 'Essential Oils', aliases: ['fragrance oil'], category: 'Fragrance' },
];

const CONFLICTS: Conflict[] = [
  { a: 'vitc', b: 'niacinamide', severity: 'separate', reason: "L-ascorbic acid and niacinamide can form niacin when mixed, causing temporary flushing. Both are stable at different pH levels — Vitamin C needs pH 2.5–3.5 while niacinamide is pH-neutral.", workaround: 'Apply Vitamin C AM, niacinamide PM. Or wait 30 minutes between application.' },
  { a: 'retinol', b: 'bha', severity: 'caution', reason: 'Combining doubles sensitivity risk and barrier compromise. Both are potent on their own.', workaround: 'Skin cycle: BHA Night 1, retinol Night 2. Never the same night.' },
  { a: 'retinol', b: 'aha', severity: 'caution', reason: 'Excessive cell turnover when combined. The pH difference can also deactivate retinol.', workaround: 'Alternate on different nights. Never together.' },
  { a: 'vitc', b: 'retinol', severity: 'separate', reason: 'pH ranges deactivate each other. Vitamin C is an AM ingredient; retinol is PM.', workaround: 'Vitamin C always AM, retinol always PM.' },
  { a: 'benzoyl', b: 'retinol', severity: 'avoid', reason: 'Benzoyl peroxide oxidizes and destroys retinol on contact. True deactivation conflict.', workaround: 'BP as AM spot treatment; retinol PM on different skin areas.' },
  { a: 'vitc', b: 'bha', severity: 'caution', reason: 'Both highly acidic. Doubles acid load and irritation risk.', workaround: 'Vitamin C AM, BHA PM. Or stagger across days.' },
  { a: 'vitc', b: 'aha', severity: 'caution', reason: 'High acid load when combined. Risk of barrier disruption.', workaround: 'Use on separate times of day, or different nights.' },
  { a: 'copper', b: 'vitc', severity: 'avoid', reason: 'Copper ions catalyze ascorbic acid oxidation (Fenton reaction). Both cancel out.', workaround: 'Use AM and PM in separate sessions, minimum.' },
  { a: 'copper', b: 'aha', severity: 'avoid', reason: 'Acids destabilize copper peptide complexes — peptide dissociates at low pH.', workaround: 'Copper PM (no acids), acids on separate exfoliation nights.' },
  { a: 'copper', b: 'retinol', severity: 'caution', reason: 'Conflicting cellular signals — rebuilding vs turning over. Can sensitize.', workaround: 'Alternate nights: retinol on retinol nights, copper on recovery nights.' },
  { a: 'peptides', b: 'aha', severity: 'avoid', reason: 'Acids denature peptide bonds. True deactivation.', workaround: 'Apply AHA, wait 20+ min for pH to normalize, then peptides. Or PM-only peptides.' },
  { a: 'eo', b: 'retinol', severity: 'caution', reason: 'Citrus / peppermint / lavender oils increase photosensitivity alongside retinol.', workaround: 'Avoid fragranced products in retinol routines.' },
  { a: 'bha', b: 'aha', severity: 'caution', reason: 'Double exfoliation multiplies irritation risk.', workaround: 'BHA one exfoliation night, AHA another.' },
];

const SAFE_COMBOS = [
  { a: 'Retinol', b: 'Niacinamide', note: 'Niacinamide reduces retinol irritation. Synergistic.' },
  { a: 'Vitamin C', b: 'Vitamin E', note: 'Vitamin E stabilizes Vitamin C. Classic antioxidant pairing.' },
  { a: 'BHA', b: 'Niacinamide', note: 'Both fight acne via different mechanisms. BHA first, then niacinamide.' },
  { a: 'Retinol', b: 'Hyaluronic Acid', note: 'HA buffers retinol irritation.' },
  { a: 'AHA', b: 'Hyaluronic Acid', note: 'HA on damp skin restores moisture without interfering.' },
  { a: 'Niacinamide', b: 'Hyaluronic Acid', note: 'Perfect daily hydration pairing. AM and PM.' },
  { a: 'Azelaic Acid', b: 'Niacinamide', note: 'Both anti-inflammatory + brightening. Synergistic for PIH and rosacea.' },
  { a: 'Bakuchiol', b: 'AHA', note: 'Plant retinol tolerates AHA better than synthetic retinol.' },
  { a: 'Peptides', b: 'Niacinamide', note: 'Both skin-repairing. No interaction.' },
  { a: 'Vitamin C', b: 'Ferulic Acid', note: 'Ferulic acid stabilizes Vitamin C. Classic combo.' },
];

const SEVERITY_TONE: Record<ConflictSeverity, 'danger' | 'warning' | 'gold' | 'success'> = {
  avoid: 'danger',
  caution: 'warning',
  separate: 'gold',
  safe: 'success',
};

const SEVERITY_LABEL: Record<ConflictSeverity, string> = {
  avoid: 'AVOID',
  caution: 'CAUTION',
  separate: 'SEPARATE',
  safe: 'SAFE',
};

function buildSeverityColor(c: Palette): Record<ConflictSeverity, string> {
  return {
    avoid: c.scorePoor,
    caution: c.scoreFair,
    separate: c.gold,
    safe: c.scoreExcellent,
  };
}

const PRESET_AM = 'AM: gentle cleanser, vitamin C serum, niacinamide, moisturizer, SPF 50';
const PRESET_PM = 'PM: oil cleanser, salicylic acid 2%, retinol 0.5%, ceramide moisturizer';
const PRESET_RECOVERY = 'PM recovery: hyaluronic acid serum, peptide serum, tallow cream';

export default function IngredientConflictsScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const SEVERITY_COLOR = useMemo(() => buildSeverityColor(colors), [colors]);
  type View = 'ai' | 'conflicts' | 'safe' | 'check';
  const [view, setView] = useState<View>('ai');
  const [search, setSearch] = useState('');
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<Conflict | null | 'safe'>(null);
  const [expandedConflict, setExpandedConflict] = useState<number | null>(null);

  // AI tab state
  const [routineText, setRoutineText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<RoutineConflictReport | null>(null);

  const headerAnim = useSharedValue(0);
  const contentAnim = useSharedValue(0);

  useEffect(() => {
    headerAnim.value = withTiming(1, { duration: 340, easing: Easing.out(Easing.cubic) });
    contentAnim.value = withDelay(80, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    return () => {
      cancelAnimation(headerAnim);
      cancelAnimation(contentAnim);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerAnim.value,
    transform: [{ translateY: (1 - headerAnim.value) * -14 }],
  }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentAnim.value }));

  const filteredConflicts = CONFLICTS.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    const a = INGREDIENTS.find(i => i.id === c.a);
    const b = INGREDIENTS.find(i => i.id === c.b);
    return (
      a?.name.toLowerCase().includes(s) ||
      b?.name.toLowerCase().includes(s) ||
      a?.aliases?.some(al => al.toLowerCase().includes(s)) ||
      b?.aliases?.some(al => al.toLowerCase().includes(s))
    );
  });

  const checkConflict = () => {
    if (!selectedA || !selectedB) return;
    const conflict = CONFLICTS.find(
      c => (c.a === selectedA && c.b === selectedB) || (c.a === selectedB && c.b === selectedA),
    );
    setCheckResult(conflict ?? 'safe');
  };

  const ingNameById = (id: string) => INGREDIENTS.find(i => i.id === id)?.name || id;

  const runAI = async (text?: string) => {
    const input = (text ?? routineText).trim();
    if (!input) return;
    if (text) setRoutineText(text);
    setAiLoading(true);
    setAiReport(null);
    try {
      const profile = await Storage.getUserProfile();
      const report = await analyzeRoutineConflicts(input, profile);
      setAiReport(report);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Glass hero with back button */}
        <GlassHero height={130} tint={colors.primary} style={styles.heroWrap}>
          <Animated.View style={[headerStyle, styles.heroHeader]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.backBtn}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
            >
              <Ionicons name="arrow-back" size={20} color={colors.white} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Ingredient conflicts</Text>
              <Text style={styles.heroSub}>AI checks · curated rules · safe combos</Text>
            </View>
            <View style={{ width: 36 }} />
          </Animated.View>
        </GlassHero>

        {/* Tab pill row */}
        <View style={styles.tabRow}>
          {(
            [
              { id: 'ai', label: 'AI Analyze', icon: 'sparkles' as const },
              { id: 'conflicts', label: 'Conflicts', icon: 'warning' as const },
              { id: 'safe', label: 'Safe Combos', icon: 'checkmark-circle' as const },
              { id: 'check', label: 'Check Two', icon: 'git-compare' as const },
            ] as const
          ).map(t => {
            const active = view === t.id;
            return (
              <Pressable
                key={t.id}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => setView(t.id as View)}
              >
                <Ionicons
                  name={t.icon}
                  size={13}
                  color={active ? colors.white : colors.primary}
                />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Animated.View style={[styles.content, contentStyle]}>
          {/* AI Analyze tab */}
          {view === 'ai' && (
            <View style={{ gap: 14 }}>
              <Card variant="gradient" tint={colors.primary} padding={18}>
                <View style={styles.aiHeaderRow}>
                  <View style={styles.aiSparkleIcon}>
                    <Ionicons name="sparkles" size={14} color={colors.primary} />
                  </View>
                  <Text style={styles.aiHeaderTitle}>AI routine analyzer</Text>
                </View>
                <Text style={styles.aiHeaderSub}>
                  Paste your full AM/PM routine. We'll normalize the actives, score compatibility,
                  and call out every interaction.
                </Text>

                <TextInput
                  style={styles.aiInput}
                  multiline
                  numberOfLines={5}
                  value={routineText}
                  onChangeText={setRoutineText}
                  placeholder={`e.g. AM — gentle cleanser, vit C serum, SPF 50\nPM — BHA 2%, retinol 0.5%, moisturizer`}
                  placeholderTextColor={colors.textMuted}
                  textAlignVertical="top"
                />

                <View style={styles.presetRow}>
                  <Text style={styles.presetLabel}>Quick fill:</Text>
                  <Pressable style={styles.presetChip} onPress={() => runAI(PRESET_AM)}>
                    <Text style={styles.presetChipText}>☀️ AM example</Text>
                  </Pressable>
                  <Pressable style={styles.presetChip} onPress={() => runAI(PRESET_PM)}>
                    <Text style={styles.presetChipText}>🌙 PM example</Text>
                  </Pressable>
                  <Pressable style={styles.presetChip} onPress={() => runAI(PRESET_RECOVERY)}>
                    <Text style={styles.presetChipText}>🌱 Recovery</Text>
                  </Pressable>
                </View>

                <Button
                  label={aiLoading ? 'Analyzing routine…' : 'Analyze My Routine'}
                  icon={aiLoading ? undefined : 'sparkles'}
                  loading={aiLoading}
                  disabled={aiLoading || routineText.trim().length === 0}
                  onPress={() => runAI()}
                />
              </Card>

              {/* Loading skeleton */}
              {aiLoading && !aiReport && (
                <Card variant="elevated" padding={16}>
                  <View style={{ gap: 10 }}>
                    <Skeleton height={26} width="60%" />
                    <Skeleton height={14} />
                    <Skeleton height={14} width="85%" />
                    <Skeleton height={14} width="72%" />
                    <View style={{ height: 6 }} />
                    <Skeleton height={48} radius={14} />
                    <Skeleton height={48} radius={14} />
                  </View>
                </Card>
              )}

              {/* Result */}
              {aiReport && !aiLoading && (
                <View style={{ gap: 12 }}>
                  <RoutineScoreCard report={aiReport} />

                  {aiReport.detected.length > 0 && (
                    <Section
                      title="Detected actives"
                      caption={`${aiReport.detected.length} ingredient${aiReport.detected.length === 1 ? '' : 's'} parsed from your routine`}
                      gap={8}
                    >
                      <View style={styles.chipWrap}>
                        {aiReport.detected.map(d => (
                          <Badge key={d} label={d} tone="primary" size="sm" />
                        ))}
                      </View>
                    </Section>
                  )}

                  {aiReport.conflicts.length > 0 && (
                    <Section title="Conflicts found" gap={8}>
                      {aiReport.conflicts.map((c, i) => (
                        <AIConflictCard key={i} conflict={c} delay={i * 80} />
                      ))}
                    </Section>
                  )}

                  {aiReport.warnings.length > 0 && (
                    <Card variant="elevated" padding={14}>
                      <View style={styles.warnHeader}>
                        <Ionicons name="alert-circle-outline" size={14} color={colors.scoreFair} />
                        <Text style={styles.warnTitle}>Watch for these</Text>
                      </View>
                      {aiReport.warnings.map((w, i) => (
                        <View key={i} style={styles.bulletRow}>
                          <View style={styles.warnDot} />
                          <Text style={styles.bulletText}>{w}</Text>
                        </View>
                      ))}
                    </Card>
                  )}

                  {aiReport.recommendations.length > 0 && (
                    <Card variant="gradient" tint={colors.scoreExcellent} padding={14}>
                      <View style={styles.warnHeader}>
                        <Ionicons name="bulb-outline" size={14} color={colors.scoreExcellent} />
                        <Text style={[styles.warnTitle, { color: colors.scoreExcellent }]}>
                          Recommendations
                        </Text>
                      </View>
                      {aiReport.recommendations.map((r, i) => (
                        <View key={i} style={styles.bulletRow}>
                          <View style={[styles.warnDot, { backgroundColor: colors.scoreExcellent }]} />
                          <Text style={styles.bulletText}>{r}</Text>
                        </View>
                      ))}
                    </Card>
                  )}

                  {aiReport.conflicts.length === 0 && aiReport.routineScore >= 90 && (
                    <Card variant="gradient" tint={colors.scoreExcellent} padding={16}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Ionicons name="shield-checkmark" size={22} color={colors.scoreExcellent} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.allClearTitle}>Routine looks compatible</Text>
                          <Text style={styles.allClearSub}>{aiReport.verdict}</Text>
                        </View>
                      </View>
                    </Card>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Curated conflicts tab */}
          {view === 'conflicts' && (
            <View style={{ gap: 12 }}>
              <View style={styles.searchWrap}>
                <Ionicons name="search" size={14} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search ingredient name…"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {filteredConflicts.map((conflict, i) => {
                const expanded = expandedConflict === i;
                return (
                  <Card
                    key={`${conflict.a}-${conflict.b}-${i}`}
                    variant="elevated"
                    padding={14}
                    onPress={() => setExpandedConflict(expanded ? null : i)}
                  >
                    <View style={styles.conflictHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.conflictPair}>
                          {ingNameById(conflict.a)}
                          <Text style={styles.conflictPlus}>  +  </Text>
                          {ingNameById(conflict.b)}
                        </Text>
                      </View>
                      <Badge
                        label={SEVERITY_LABEL[conflict.severity]}
                        tone={SEVERITY_TONE[conflict.severity]}
                        size="sm"
                      />
                    </View>
                    {expanded && (
                      <View style={styles.conflictExpanded}>
                        <Text style={styles.conflictReason}>{conflict.reason}</Text>
                        {conflict.workaround && (
                          <View style={styles.workaroundCard}>
                            <View style={styles.workaroundLabelRow}>
                              <Ionicons name="checkmark-circle" size={12} color={colors.scoreExcellent} />
                              <Text style={styles.workaroundLabel}>Workaround</Text>
                            </View>
                            <Text style={styles.workaroundText}>{conflict.workaround}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </Card>
                );
              })}
            </View>
          )}

          {/* Safe combos */}
          {view === 'safe' && (
            <View style={{ gap: 12 }}>
              <Text style={styles.sectionNote}>
                These pairs are validated by dermatology consensus — no deactivation, no excess
                irritation, often synergistic.
              </Text>
              {SAFE_COMBOS.map((combo, i) => (
                <Card key={i} variant="elevated" padding={14}>
                  <View style={styles.safePairRow}>
                    <Text style={styles.safeIngA}>{combo.a}</Text>
                    <Text style={styles.safePlus}>+</Text>
                    <Text style={styles.safeIngB}>{combo.b}</Text>
                    <View style={{ marginLeft: 'auto' }}>
                      <Badge label="SAFE" tone="success" size="xs" icon="checkmark" />
                    </View>
                  </View>
                  <Text style={styles.safeNote}>{combo.note}</Text>
                </Card>
              ))}
            </View>
          )}

          {/* Check Two ingredients */}
          {view === 'check' && (
            <View style={{ gap: 12 }}>
              <Text style={styles.checkTitle}>Pick two ingredients to check for conflicts</Text>

              <Text style={styles.checkLabel}>INGREDIENT A</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
                {INGREDIENTS.map(ing => (
                  <Pressable
                    key={ing.id}
                    style={[
                      styles.ingChip,
                      selectedA === ing.id && styles.ingChipActiveA,
                      selectedB === ing.id && { opacity: 0.4 },
                    ]}
                    onPress={() => {
                      setSelectedA(ing.id === selectedA ? null : ing.id);
                      setCheckResult(null);
                    }}
                    disabled={selectedB === ing.id}
                  >
                    <Text style={[styles.ingChipText, selectedA === ing.id && styles.ingChipTextActiveA]}>
                      {ing.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.checkLabel}>INGREDIENT B</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
                {INGREDIENTS.map(ing => (
                  <Pressable
                    key={ing.id}
                    style={[
                      styles.ingChip,
                      selectedB === ing.id && styles.ingChipActiveB,
                      selectedA === ing.id && { opacity: 0.4 },
                    ]}
                    onPress={() => {
                      setSelectedB(ing.id === selectedB ? null : ing.id);
                      setCheckResult(null);
                    }}
                    disabled={selectedA === ing.id}
                  >
                    <Text style={[styles.ingChipText, selectedB === ing.id && styles.ingChipTextActiveB]}>
                      {ing.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Button
                label="Check Compatibility"
                icon="git-compare"
                onPress={checkConflict}
                disabled={!selectedA || !selectedB}
              />

              {checkResult !== null && selectedA && selectedB && (
                <Card
                  variant="elevated"
                  padding={16}
                  style={{
                    borderWidth: 2,
                    borderColor:
                      checkResult === 'safe'
                        ? colors.scoreExcellent + '55'
                        : SEVERITY_COLOR[(checkResult as Conflict).severity] + '55',
                  }}
                >
                  {checkResult === 'safe' ? (
                    <>
                      <View style={styles.resultTitleRow}>
                        <Ionicons name="shield-checkmark" size={16} color={colors.scoreExcellent} />
                        <Text style={[styles.resultTitle, { color: colors.scoreExcellent }]}>
                          No known conflicts
                        </Text>
                      </View>
                      <Text style={styles.resultText}>
                        {ingNameById(selectedA)} and {ingNameById(selectedB)} can be used together
                        without conflict. Always introduce one new product at a time to identify
                        personal reactions.
                      </Text>
                    </>
                  ) : (
                    <>
                      <View style={styles.resultTitleRow}>
                        <Ionicons
                          name={
                            (checkResult as Conflict).severity === 'avoid'
                              ? 'close-circle'
                              : 'warning'
                          }
                          size={16}
                          color={SEVERITY_COLOR[(checkResult as Conflict).severity]}
                        />
                        <Text
                          style={[
                            styles.resultTitle,
                            { color: SEVERITY_COLOR[(checkResult as Conflict).severity] },
                          ]}
                        >
                          {SEVERITY_LABEL[(checkResult as Conflict).severity]}
                        </Text>
                      </View>
                      <Text style={styles.resultText}>{(checkResult as Conflict).reason}</Text>
                      {(checkResult as Conflict).workaround && (
                        <View style={styles.workaroundCard}>
                          <View style={styles.workaroundLabelRow}>
                            <Ionicons name="checkmark-circle" size={12} color={colors.scoreExcellent} />
                            <Text style={styles.workaroundLabel}>Workaround</Text>
                          </View>
                          <Text style={styles.workaroundText}>
                            {(checkResult as Conflict).workaround}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </Card>
              )}
            </View>
          )}

          <View style={{ height: 60 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/* ---------- Sub-components ---------- */

function RoutineScoreCard({ report }: { report: RoutineConflictReport }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withDelay(
      120,
      withTiming(report.routineScore / 100, { duration: 1000, easing: Easing.out(Easing.cubic) }),
    );
  }, [report.routineScore]); // eslint-disable-line react-hooks/exhaustive-deps

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));

  const tint =
    report.routineScore >= 80
      ? colors.scoreExcellent
      : report.routineScore >= 60
      ? colors.scoreFair
      : colors.scorePoor;

  return (
    <Card variant="elevated" padding={18}>
      <View style={styles.routineRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.routineLabel}>ROUTINE COMPATIBILITY</Text>
          <View style={styles.routineNumberRow}>
            <Text style={[styles.routineNumber, { color: tint }]}>{report.routineScore}</Text>
            <Text style={styles.routineUnit}>/100</Text>
          </View>
        </View>
        <View style={[styles.routineBadge, { backgroundColor: tint + '15', borderColor: tint + '40' }]}>
          <Text style={[styles.routineBadgeText, { color: tint }]}>
            {report.conflicts.length === 0
              ? 'NO CONFLICTS'
              : `${report.conflicts.length} ISSUE${report.conflicts.length === 1 ? '' : 'S'}`}
          </Text>
        </View>
      </View>

      <View style={styles.routineTrack}>
        <Animated.View style={[styles.routineFill, fillStyle]}>
          <LinearGradient
            colors={[tint + 'CC', tint]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      <Text style={styles.routineVerdict}>{report.verdict}</Text>
    </Card>
  );
}

function AIConflictCard({ conflict, delay }: { conflict: IngredientConflict; delay: number }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const SEVERITY_COLOR = useMemo(() => buildSeverityColor(colors), [colors]);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 320 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 13, stiffness: 130 }));
  }, [delay]); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const tint = SEVERITY_COLOR[conflict.severity];

  return (
    <Animated.View style={animStyle}>
      <Card variant="elevated" padding={14} style={{ borderLeftWidth: 4, borderLeftColor: tint }}>
        <View style={styles.conflictHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.conflictPair}>
              {conflict.a}
              <Text style={styles.conflictPlus}>  +  </Text>
              {conflict.b}
            </Text>
          </View>
          <Badge
            label={SEVERITY_LABEL[conflict.severity]}
            tone={SEVERITY_TONE[conflict.severity]}
            size="sm"
          />
        </View>
        <Text style={[styles.conflictReason, { marginTop: 8 }]}>{conflict.reason}</Text>
        {conflict.workaround && (
          <View style={styles.workaroundCard}>
            <View style={styles.workaroundLabelRow}>
              <Ionicons name="checkmark-circle" size={12} color={colors.scoreExcellent} />
              <Text style={styles.workaroundLabel}>Workaround</Text>
            </View>
            <Text style={styles.workaroundText}>{conflict.workaround}</Text>
          </View>
        )}
      </Card>
    </Animated.View>
  );
}

/* ---------- Styles ---------- */

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingBottom: 40 },

  heroWrap: { marginBottom: 12 },
  heroHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22, fontWeight: '900', color: c.white,
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.78)', marginTop: 2, fontWeight: '600' },

  tabRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: 'rgba(196,98,45,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(196,98,45,0.20)',
  },
  tabBtnActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  tabLabel: { fontSize: 11, fontWeight: '700', color: c.primary, letterSpacing: 0.2 },
  tabLabelActive: { color: c.white },

  content: { paddingHorizontal: 16 },

  /* AI tab */
  aiHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  aiSparkleIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(196,98,45,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  aiHeaderTitle: { fontSize: 14, fontWeight: '900', color: c.textPrimary, letterSpacing: 0.2 },
  aiHeaderSub: { fontSize: 12, color: c.textSecondary, lineHeight: 18, marginBottom: 12, fontWeight: '500' },
  aiInput: {
    backgroundColor: c.bgElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 110,
    fontSize: 14,
    color: c.textPrimary,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 10,
  },
  presetRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  presetLabel: { fontSize: 10, fontWeight: '900', color: c.textMuted, letterSpacing: 1 },
  presetChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(196,98,45,0.08)',
    borderWidth: 1, borderColor: 'rgba(196,98,45,0.22)',
  },
  presetChipText: { fontSize: 11, fontWeight: '700', color: c.primary },

  /* AI score card */
  routineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  routineLabel: { fontSize: 9, fontWeight: '900', color: c.textMuted, letterSpacing: 1.4 },
  routineNumberRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 2 },
  routineNumber: { fontSize: 38, fontWeight: '900', letterSpacing: -1, lineHeight: 38 },
  routineUnit: { fontSize: 13, fontWeight: '700', color: c.textSecondary, paddingBottom: 4 },
  routineBadge: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1,
  },
  routineBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  routineTrack: {
    height: 8,
    backgroundColor: 'rgba(28,24,20,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  routineFill: { height: '100%', borderRadius: 4, overflow: 'hidden' },
  routineVerdict: { fontSize: 13, color: c.textPrimary, lineHeight: 19, fontWeight: '500' },

  /* Curated conflicts */
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.bgCard,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: c.border,
  },
  searchInput: { flex: 1, color: c.textPrimary, fontSize: 14, fontWeight: '500' },
  conflictHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  conflictPair: { fontSize: 13, fontWeight: '800', color: c.textPrimary, lineHeight: 19 },
  conflictPlus: { color: c.textMuted, fontWeight: '500' },
  conflictExpanded: {
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: c.border,
  },
  conflictReason: { fontSize: 12.5, color: c.textSecondary, lineHeight: 19, marginBottom: 8 },

  workaroundCard: {
    backgroundColor: 'rgba(22,163,74,0.08)',
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: 'rgba(22,163,74,0.22)',
    marginTop: 10,
  },
  workaroundLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  workaroundLabel: { fontSize: 10, fontWeight: '900', color: c.scoreExcellent, letterSpacing: 0.6 },
  workaroundText: { fontSize: 12, color: c.textPrimary, lineHeight: 17, fontWeight: '500' },

  /* Safe combos */
  sectionNote: {
    fontSize: 13, color: c.textSecondary, lineHeight: 19,
    backgroundColor: 'rgba(22,163,74,0.06)',
    borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: 'rgba(22,163,74,0.20)',
    marginBottom: 4,
    fontWeight: '500',
  },
  safePairRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  safeIngA: { fontSize: 13, fontWeight: '800', color: c.primary },
  safePlus: { fontSize: 14, color: c.textMuted, fontWeight: '700' },
  safeIngB: { fontSize: 13, fontWeight: '800', color: c.scoreExcellent },
  safeNote: { fontSize: 12.5, color: c.textSecondary, lineHeight: 19 },

  /* Check Two */
  checkTitle: { fontSize: 13, color: c.textSecondary, lineHeight: 19, fontWeight: '500', marginBottom: 4 },
  checkLabel: { fontSize: 9, fontWeight: '900', color: c.textMuted, letterSpacing: 1.4, marginBottom: 6, marginTop: 8 },
  ingChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: c.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: c.border,
  },
  ingChipActiveA: { borderColor: c.primary, backgroundColor: 'rgba(196,98,45,0.10)' },
  ingChipActiveB: { borderColor: c.scorePoor, backgroundColor: 'rgba(220,38,38,0.10)' },
  ingChipText: { fontSize: 12, color: c.textPrimary, fontWeight: '600' },
  ingChipTextActiveA: { color: c.primary, fontWeight: '800' },
  ingChipTextActiveB: { color: c.scorePoor, fontWeight: '800' },

  resultTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  resultTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.4 },
  resultText: { fontSize: 13, color: c.textPrimary, lineHeight: 19, fontWeight: '500' },

  /* Misc */
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  warnHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  warnTitle: { fontSize: 12, fontWeight: '900', color: c.scoreFair, letterSpacing: 0.4 },
  warnDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: c.scoreFair, marginTop: 7 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 3 },
  bulletText: { fontSize: 12.5, color: c.textPrimary, lineHeight: 19, fontWeight: '500', flex: 1 },

  allClearTitle: { fontSize: 14, fontWeight: '900', color: c.scoreExcellent },
  allClearSub: { fontSize: 12, color: c.textSecondary, marginTop: 2, fontWeight: '500' },
  });
}
