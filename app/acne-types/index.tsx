import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';

function shimColors(c: Palette) {
  return {
    bg: c.bg, card: c.bgCard, cardAlt: c.bgElevated, border: c.border,
    primary: c.primary, gold: c.gold, textPrimary: c.textPrimary,
    textSecondary: c.textSecondary, textMuted: c.textMuted,
    green: c.scoreGood, red: c.scorePoor, blue: c.hydration,
    purple: c.darkCircles, orange: '#FB923C',
  };
}
type ShimColors = ReturnType<typeof shimColors>;

function buildAcneTypes(Colors: ShimColors) {
  return [
  {
    type: 'Comedonal Acne',
    icon: '⚫',
    color: Colors.gold,
    appearance: 'Blackheads (open comedones) and whiteheads (closed comedones). Non-inflammatory — no redness.',
    cause: 'Sebum and dead skin cells clogging follicle openings. Oxidation of trapped sebum turns it black (blackheads). Closed comedones are trapped sebum under intact skin.',
    notInflammatory: true,
    treatment: [
      'BHA (salicylic acid) 2–3× weekly — penetrates into the pore to dissolve the blockage',
      'Retinol — increases cell turnover, preventing follicle blockage',
      'Clay masks weekly — absorbs excess sebum',
      'Never squeeze — pushes debris deeper and causes inflammatory acne',
    ],
    triggers: ['Heavy, comedogenic oils', 'Insufficient cleansing', 'High sebum production'],
    barrierNote: 'Occlusives on comedone-prone skin: apply after BHA exfoliation (not before). Give BHA 20+ minutes to act, then a thin layer of a non-comedogenic occlusive seals in the cleared pore area.',
  },
  {
    type: 'Inflammatory Acne (Papules and Pustules)',
    icon: '🔴',
    color: Colors.red,
    appearance: 'Red, raised papules (solid) and pustules (white/yellow pus-filled centre). Tender to touch.',
    cause: 'Bacteria (C. acnes) infect a comedone. Immune response causes inflammation. Pustule = the body isolating the infection with white blood cells.',
    notInflammatory: false,
    treatment: [
      'BHA — reduces comedone formation upstream',
      'Benzoyl peroxide (2.5–5%) — bactericidal, reduces C. acnes count',
      'Retinol — prevents comedone→papule progression',
      'Niacinamide — anti-inflammatory, reduces redness',
      'Never pop — spreads bacteria, causes scarring and PIH',
    ],
    triggers: ['Propionibacterium/Cutibacterium acnes overgrowth', 'Comedone progression', 'Immune response'],
    barrierNote: 'Apply emollients around (not on) active pustules. Fatty acids such as palmitoleic acid have mild antimicrobial activity. Use a light recovery layer on healing papules to support the barrier and reduce PIH formation.',
  },
  {
    type: 'Cystic Acne',
    icon: '💜',
    color: Colors.purple,
    appearance: 'Deep, painful nodules and cysts. No visible pus head. Can last weeks. High scarring risk.',
    cause: 'Deep inflammatory infection in the dermis. Often hormonal (androgen-driven). The immune response is so deep and intense that it can permanently damage skin tissue and cause boxcar or icepick scars.',
    notInflammatory: false,
    treatment: [
      'Dermatologist required for severe cases — isotretinoin, spironolactone, or oral antibiotics',
      'BHA on surrounding skin, not the cyst itself',
      'Hydrocolloid patches on open cysts — protect while healing',
      'Ice wrapped in cloth — reduces inflammation temporarily',
      'Absolutely no extraction — permanent scarring risk',
    ],
    triggers: ['Androgens (testosterone/DHT)', 'Severe C. acnes infection', 'Genetic predisposition'],
    barrierNote: 'A tiny amount of a barrier-repair occlusive directly on healing (not active) cysts PM. Vitamin A supports healing; vitamins E and K2 help fade the post-cyst mark. Do not apply over active inflamed cysts.',
  },
  {
    type: 'Hormonal Acne',
    icon: '🌙',
    color: Colors.primary,
    appearance: 'Deep, cystic-type papules along jawline, chin, and lower cheeks. Often cyclical.',
    cause: 'Androgen hormones stimulate sebaceous glands. Peaks in luteal phase (week before period), stress, PCOS, and androgen excess conditions.',
    notInflammatory: false,
    treatment: [
      'Internal approach required — skincare alone is insufficient',
      'Spearmint tea (anti-androgenic)',
      'Zinc 30–50mg daily',
      'Low-glycemic diet strictly in luteal phase',
      'Niacinamide + BHA on affected zones',
      'Dermatologist: spironolactone, combined OCP, or retinoids',
    ],
    triggers: ['Androgens', 'Progesterone spike in luteal phase', 'Cortisol → androgen conversion', 'PCOS'],
    barrierNote: 'See the Hormonal Acne Guide for full details. A vitamin-A-containing occlusive supports turnover of hormonal spots. Apply as a spot treatment PM on healing zones.',
  },
  {
    type: 'Fungal Acne (Malassezia Folliculitis)',
    icon: '🍄',
    color: Colors.blue,
    appearance: 'Uniform, small (~1mm), very itchy pustules on forehead, chest, or back. Often mistaken for comedonal acne. Does NOT respond to standard acne treatments.',
    cause: 'Overgrowth of Malassezia yeast (a fungus, not bacteria) in hair follicles. Triggered by humidity, sweat, antibiotic use, and certain oils (fatty acids Malassezia feeds on).',
    notInflammatory: false,
    treatment: [
      'Zinc pyrithione cleanser (anti-fungal — leave on 2 min)',
      'Ketoconazole shampoo used as face/body wash (off-label)',
      'Avoid oils that feed Malassezia: fatty acids C11–C24 (coconut oil, olive oil, almond oil)',
      'Anti-fungal ingredients: sulfur, azelaic acid, tea tree oil (diluted)',
      'Dermatologist if severe — oral antifungals',
    ],
    triggers: ['Humidity and heat', 'Occlusive non-mineral oils', 'Antibiotic use', 'Sweating'],
    barrierNote: 'Important: Malassezia feeds on specific fatty acids — C12–C24 chain lengths. Most occlusive oils and animal fats (oleic C18, stearic C18, palmitic C16) fall within the Malassezia-feedable range. If you suspect fungal acne, patch-test any oil-based occlusive very cautiously, or avoid it until the infection is cleared.',
  },
  {
    type: 'Mechanical Acne (Acne Mechanica)',
    icon: '🎽',
    color: Colors.orange,
    appearance: 'Papules, pustules, or comedones in areas of friction, pressure, or occlusion. Common under straps, masks, helmets, or where clothing rubs.',
    cause: 'Repeated friction and pressure cause micro-tears in the skin barrier and trap sebum under occluded areas. Heat and sweat worsen it.',
    notInflammatory: false,
    treatment: [
      'Remove or reduce friction source',
      'Moisture-wicking fabrics for exercise',
      'Clean equipment regularly (phone, helmet pads)',
      'Shower immediately after sweating',
      'BHA on affected zones',
      'Breathable skincare products in affected areas',
    ],
    triggers: ['Friction', 'Pressure', 'Heat + occlusion', 'Masks', 'Sports equipment'],
    barrierNote: 'Heavy occlusives under masks or tight clothing can worsen occlusion-related acne. Use them only on clean, non-occluded skin. Avoid areas where fabric presses against skin for extended periods.',
  },
  {
    type: 'Body Acne',
    icon: '🦱',
    color: Colors.green,
    appearance: 'Acne on back ("bacne"), chest, shoulders, and buttocks. Same types as facial acne but often more persistent due to follicle size and body sebum production.',
    cause: 'High density of sebaceous glands, harder to reach for proper cleansing, clothing occlusion, post-exercise sweat, and harder water in the shower.',
    notInflammatory: false,
    treatment: [
      'BHA body wash (2% salicylic acid) used on affected areas',
      'Benzoyl peroxide wash left on for 2 minutes before rinsing',
      'Exfoliate 2–3× weekly with chemical exfoliant',
      'Change pillowcase and sheets weekly',
      'Shower immediately after exercise, cool water',
      'Loose, breathable clothing',
    ],
    triggers: ['Post-exercise sweat', 'Tight clothing', 'Heavy conditioner or shampoo runoff', 'Not showering immediately after exercise'],
    barrierNote: 'Emollient occlusives work well on body acne in remission (not active inflammatory acne). Apply after BHA-treated body skin on recovery days. Particularly helpful on dry back and shoulder areas prone to both acne and dryness.',
  },
  ];
}

export default function AcneTypesScreen() {
  const palette = useColors();
  const Colors = useMemo(() => shimColors(palette), [palette]);
  const ACNE_TYPES = useMemo(() => buildAcneTypes(Colors), [Colors]);
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const [selectedType, setSelectedType] = useState<number | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Acne Types</Text>
        <View style={{ width: 60 }} />
      </Animated.View>

      <View style={styles.intro}>
        <Text style={styles.introText}>
          Not all acne is the same. Different types have different causes, different treatments — and some standard acne treatments make specific types dramatically worse. Identify yours first.
        </Text>
      </View>

      <Animated.ScrollView style={[styles.scroll, { opacity: contentAnim }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {ACNE_TYPES.map((type, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.typeCard, { borderLeftColor: type.color, borderLeftWidth: 4 }, selectedType === i && { borderColor: type.color }]}
            onPress={() => setSelectedType(selectedType === i ? null : i)}
            activeOpacity={0.85}
          >
            <View style={styles.typeHeader}>
              <Text style={styles.typeIcon}>{type.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.typeName, { color: type.color }]}>{type.type}</Text>
                <Text style={styles.typeAppearance}>{type.appearance}</Text>
              </View>
              <Text style={styles.expandIcon}>{selectedType === i ? '▲' : '▼'}</Text>
            </View>

            {selectedType === i && (
              <View style={styles.typeExpanded}>
                <View style={styles.causeBlock}>
                  <Text style={styles.causeLabel}>Root Cause</Text>
                  <Text style={styles.causeText}>{type.cause}</Text>
                </View>

                <Text style={styles.blockLabel}>Triggers</Text>
                <View style={styles.triggerChips}>
                  {type.triggers.map((t, j) => (
                    <View key={j} style={[styles.triggerChip, { borderColor: type.color + '66' }]}>
                      <Text style={[styles.triggerChipText, { color: type.color }]}>{t}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.blockLabel}>Treatment</Text>
                {type.treatment.map((t, j) => (
                  <View key={j} style={styles.treatmentRow}>
                    <Text style={[styles.treatmentBullet, { color: type.color }]}>→</Text>
                    <Text style={styles.treatmentText}>{t}</Text>
                  </View>
                ))}

                <View style={[styles.barrierNote, { borderColor: Colors.primary + '44' }]}>
                  <Text style={styles.barrierNoteTitle}>🌿 Barrier Note</Text>
                  <Text style={styles.barrierNoteText}>{type.barrierNote}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            🩺 Severe or persistent acne (especially cystic) warrants a dermatologist visit. Oral medications (isotretinoin, spironolactone, antibiotics) are significantly more effective than topicals for severe cases and are best managed with professional oversight.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ShimColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  backText: { color: c.primary, fontSize: 16 },
  headerTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700' },
  intro: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  introText: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  typeCard: { backgroundColor: c.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.border, marginBottom: 10 },
  typeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  typeIcon: { fontSize: 20, marginTop: 2 },
  typeName: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  typeAppearance: { color: c.textSecondary, fontSize: 12, lineHeight: 18 },
  expandIcon: { color: c.textMuted, fontSize: 12, marginTop: 4 },
  typeExpanded: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.border },
  causeBlock: { backgroundColor: c.cardAlt, borderRadius: 10, padding: 10, marginBottom: 12 },
  causeLabel: { color: c.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  causeText: { color: c.textSecondary, fontSize: 12, lineHeight: 19 },
  blockLabel: { color: c.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  triggerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  triggerChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  triggerChipText: { fontSize: 11, fontWeight: '600' },
  treatmentRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  treatmentBullet: { fontSize: 14, fontWeight: '700', marginTop: 1 },
  treatmentText: { flex: 1, color: c.textSecondary, fontSize: 12, lineHeight: 19 },
  barrierNote: { backgroundColor: c.primary + '15', borderRadius: 10, padding: 10, borderWidth: 1, marginTop: 12 },
  barrierNoteTitle: { color: c.primary, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  barrierNoteText: { color: c.textSecondary, fontSize: 12, lineHeight: 18 },
  disclaimer: { backgroundColor: c.cardAlt, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: c.border, marginTop: 6 },
  disclaimerText: { color: c.textMuted, fontSize: 12, lineHeight: 19 },
  });
}
