import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
import { router } from 'expo-router';

const Colors = {
  bg: '#0A0A0F', card: '#13131A', cardAlt: '#1A1A24', border: '#2A2A3A',
  primary: '#C4622D', gold: '#D4A96A', textPrimary: '#FAF3E0',
  textSecondary: '#9A9AAF', textMuted: '#5A5A6E',
  green: '#4ADE80', red: '#F87171', blue: '#60A5FA', purple: '#A78BFA', orange: '#FB923C',
};

const ACNE_TYPES = [
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
    tallowNote: 'Tallow on comedone-prone skin: apply after BHA exfoliation (not before). Give BHA 20+ minutes to act, then a thin layer of tallow seals in the cleared pore area.',
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
    tallowNote: 'Apply tallow around (not on) active pustules. Its palmitoleic acid is antimicrobial. Use as a recovery layer on healing papules to support barrier and reduce PIH formation.',
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
    tallowNote: 'Tiny amount of tallow directly on healing (not active) cyst PM. Vitamin A in tallow supports healing. Vitamin E and K2 reduce the post-cyst mark. Do not apply over active inflamed cysts.',
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
    tallowNote: 'See the Hormonal Acne Guide for full details. Tallow\'s vitamin A content supports turnover of hormonal spots. Apply as spot treatment PM on healing zones.',
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
    tallowNote: 'Important: Malassezia feeds on specific fatty acids — C12–C24 chain lengths. Tallow\'s primary acids (oleic C18, stearic C18, palmitic C16) are within the Malassezia-feedable range. If you suspect fungal acne, test tallow very cautiously or avoid temporarily until the infection is cleared.',
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
    tallowNote: 'Tallow under masks or tight clothing can worsen occlusion-related acne. Use tallow only on clean, non-occluded skin. Avoid in areas where fabric presses against skin for extended periods.',
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
    tallowNote: 'Tallow works well on body acne in remission (not active inflammatory acne). Apply after BHA-treated body skin on recovery days. Particularly effective on dry back and shoulder areas prone to both acne and dryness.',
  },
];

export default function AcneTypesScreen() {
  const [selectedType, setSelectedType] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Acne Types</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.intro}>
        <Text style={styles.introText}>
          Not all acne is the same. Different types have different causes, different treatments — and some standard acne treatments make specific types dramatically worse. Identify yours first.
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

                <View style={[styles.tallowNote, { borderColor: Colors.primary + '44' }]}>
                  <Text style={styles.tallowNoteTitle}>🌿 Tallow Note</Text>
                  <Text style={styles.tallowNoteText}>{type.tallowNote}</Text>
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
  intro: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  introText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  typeCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  typeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  typeIcon: { fontSize: 20, marginTop: 2 },
  typeName: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  typeAppearance: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  expandIcon: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  typeExpanded: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  causeBlock: { backgroundColor: Colors.cardAlt, borderRadius: 10, padding: 10, marginBottom: 12 },
  causeLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  causeText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  blockLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  triggerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  triggerChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  triggerChipText: { fontSize: 11, fontWeight: '600' },
  treatmentRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  treatmentBullet: { fontSize: 14, fontWeight: '700', marginTop: 1 },
  treatmentText: { flex: 1, color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  tallowNote: { backgroundColor: Colors.primary + '15', borderRadius: 10, padding: 10, borderWidth: 1, marginTop: 12 },
  tallowNoteTitle: { color: Colors.primary, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  tallowNoteText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  disclaimer: { backgroundColor: Colors.cardAlt, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, marginTop: 6 },
  disclaimerText: { color: Colors.textMuted, fontSize: 12, lineHeight: 19 },
});
