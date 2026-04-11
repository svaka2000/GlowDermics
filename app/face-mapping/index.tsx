import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, Easing,
} from 'react-native';
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
  purple: '#6B85A8',
  orange: '#FB923C',
};

interface Zone {
  id: string;
  label: string;
  emoji: string;
  position: { top: number; left: number };
  color: string;
  causes: string[];
  solutions: string[];
  tallowNote: string;
  science: string;
}

const ZONES: Zone[] = [
  {
    id: 'forehead',
    label: 'Forehead',
    emoji: '🧠',
    position: { top: 60, left: 130 },
    color: Colors.blue,
    causes: [
      'Digestive stress and poor gut health',
      'Sugar and processed food spikes',
      'Stress hormones (cortisol) elevation',
      'Hair products migrating to skin',
      'Bangs or hair covering forehead',
    ],
    solutions: [
      'Reduce sugar and refined carbohydrates',
      'Support digestion with probiotics and fiber',
      'Stress management: sleep, breathwork, movement',
      'Switch to non-comedogenic hair products',
      'Keep hair off forehead',
      'BHA along hairline 2× per week',
    ],
    tallowNote: 'Tallow applied sparingly works well here. Avoid the hairline if using heavy hair products that could combine with tallow and clog follicles.',
    science: 'Traditional face mapping associates the forehead with the digestive system. Modern dermatology supports a gut-skin axis: dysbiosis (gut microbiome imbalance) can manifest as forehead breakouts via inflammatory cytokines. Hair product contamination is also a major practical cause.',
  },
  {
    id: 'temples',
    label: 'Temples',
    emoji: '💆',
    position: { top: 95, left: 60 },
    color: Colors.purple,
    causes: [
      'Dehydration (inadequate water intake)',
      'Caffeine and alcohol excess',
      'Phone screen contact contamination',
      'Hair product runoff',
      'Poor sleep quality',
    ],
    solutions: [
      'Increase water intake to 8+ cups daily',
      'Reduce caffeine to 1–2 cups maximum',
      'Wipe phone with antibacterial wipe daily',
      'Keep phone away from face (use speaker/earbuds)',
      'Prioritize 7–9 hours quality sleep',
    ],
    tallowNote: 'Temple breakouts often respond well to tallow due to hydration support. Use lightly — the area is close to the hairline.',
    science: 'Temple breakouts are often linked to the kidneys and bladder in traditional Chinese face mapping — organs closely tied to hydration. Modern evidence points to phone contamination (phones harbor more bacteria than a toilet seat) and dehydration-triggered sebum changes.',
  },
  {
    id: 'between_brows',
    label: 'Between Brows',
    emoji: '🍷',
    position: { top: 145, left: 130 },
    color: Colors.red,
    causes: [
      'Liver stress from alcohol consumption',
      'Fatty and fried food excess',
      'Dairy products for some individuals',
      'Poor sleep (liver detoxifies during sleep)',
      'Contact irritation from eyebrow grooming',
    ],
    solutions: [
      'Reduce alcohol for 2–4 weeks and observe',
      'Decrease fried and processed fats',
      'Trial 2-week dairy elimination',
      'Prioritize sleep before midnight',
      'Avoid waxing/threading irritation',
    ],
    tallowNote: "The glabella (between-brow area) is a sebum-dense zone. Tallow used here should be applied after BHA exfoliation to avoid trapping debris in already-active follicles.",
    science: 'The glabella has high sebaceous gland density. Traditional mapping links this zone to liver function. Alcohol metabolism is heavily liver-dependent — excess alcohol creates oxidative stress that can manifest systemically, including as skin inflammation.',
  },
  {
    id: 'nose',
    label: 'Nose',
    emoji: '👃',
    position: { top: 185, left: 130 },
    color: Colors.orange,
    causes: [
      'Highest sebaceous gland density on face',
      'Cardiovascular stress (traditional)',
      'Poor circulation',
      'Large pores that trap oxidized sebum',
      'Touching nose frequently',
    ],
    solutions: [
      'Weekly clay mask on nose specifically',
      'BHA 2–3× per week to clear pores',
      'Cardiovascular exercise for circulation',
      'Stop touching your nose',
      'Oil cleansing to dissolve sebum plugs',
    ],
    tallowNote: 'The nose is the highest-sebum zone. Apply tallow sparingly here — a thin layer after BHA exfoliation. Clay mask weekly before applying tallow gives best results.',
    science: 'The nose has the highest density of sebaceous glands on the face. Blackheads here (sebaceous filaments) are normal and nearly universal — they are not dirt but oxidized sebum. BHA is the only ingredient that penetrates into the follicle to address this.',
  },
  {
    id: 'cheeks_left',
    label: 'Left Cheek',
    emoji: '🫁',
    position: { top: 215, left: 55 },
    color: Colors.green,
    causes: [
      'Respiratory system stress (smoking, pollution)',
      'Allergens and poor air quality',
      'Pillowcase contamination',
      'Phone contact (right side mirrors this)',
      'Makeup brushes not cleaned regularly',
    ],
    solutions: [
      'Change pillowcase 2× per week',
      'Wash makeup brushes weekly',
      'Air purifier in bedroom',
      'Wipe phone screen daily',
      'Reduce dairy if allergies are present',
    ],
    tallowNote: 'Cheek skin often responds best to tallow — it tends to be less congested than the T-zone and benefits greatly from barrier repair. Apply generously here as part of PM routine.',
    science: "Traditional mapping links cheeks to the lungs and respiratory system. Modern evidence: the cheek microbiome is heavily influenced by air quality. Pollution particles deposit on cheeks and trigger inflammatory breakouts. Pillowcase bacteria is the most practical cause — one pillow can harbor billions of bacteria after 1 week.",
  },
  {
    id: 'cheeks_right',
    label: 'Right Cheek',
    emoji: '📱',
    position: { top: 215, left: 210 },
    color: Colors.green,
    causes: [
      'Phone contact contamination',
      'Dental issues (traditional)',
      'Same causes as left cheek',
      'Sleeping on right side',
      'Touching face with right hand',
    ],
    solutions: [
      'Hold phone away from face (speaker mode)',
      'Wipe phone with alcohol wipe before calls',
      'Change pillowcase frequently',
      'Be mindful of hand-to-face contact',
    ],
    tallowNote: 'Same as left cheek — cheeks love tallow. The right cheek often responds to phone hygiene improvements within 2 weeks.',
    science: 'Right cheek breakouts have an unusually strong correlation with phone use — the right ear is the dominant phone-holding side for most people. Studies show phones carry Staphylococcus aureus and other acne-triggering bacteria. Regular disinfection makes a measurable difference.',
  },
  {
    id: 'chin',
    label: 'Chin & Jawline',
    emoji: '🌙',
    position: { top: 330, left: 130 },
    color: Colors.gold,
    causes: [
      'Hormonal fluctuations (progesterone/estrogen)',
      'Androgen excess (PCOS)',
      'Menstrual cycle timing',
      'Stress hormones (cortisol triggers androgen)',
      'Touching chin frequently',
    ],
    solutions: [
      'Track breakout timing vs menstrual cycle',
      'Reduce stress through sleep and movement',
      'Spearmint tea (anti-androgenic, 2 cups daily)',
      'Consider zinc supplementation',
      'Consult dermatologist if severe (spironolactone)',
    ],
    tallowNote: "Tallow's vitamin A content supports gentle cell turnover that helps hormonal breakouts heal faster. Apply as spot treatment PM on active spots here, not just as an area moisturizer.",
    science: "Chin and jawline acne is the strongest predictor of hormonal causation. Androgen receptors are most dense along the jawline. Progesterone spikes in the luteal phase increase sebum production — which is why 80% of women report chin/jaw breakouts in the week before their period.",
  },
  {
    id: 'under_eyes',
    label: 'Under Eyes',
    emoji: '😴',
    position: { top: 185, left: 65 },
    color: Colors.blue,
    causes: [
      'Sleep deprivation (blood pools under thin skin)',
      'Dehydration (worsens darkness)',
      'Genetics and thin skin',
      'Iron deficiency anemia',
      'Rubbing eyes habitually',
    ],
    solutions: [
      '7–9 hours quality sleep (most impactful)',
      'Sleep elevated with an extra pillow',
      'Increase iron-rich foods or supplement',
      'Cold spoon or ice roller in morning',
      'Stay well hydrated',
    ],
    tallowNote: 'Tallow is gentle enough for the under-eye area (no fragrance, no harsh actives). Apply a tiny amount PM for barrier support and hydration. Vitamin K in tallow may help with dark circles over time.',
    science: "Under-eye skin is the thinnest on the face (0.5mm vs 2mm elsewhere). Blood vessels showing through are the primary cause of dark circles. Sleep deprivation increases fluid retention and blood pooling. Vitamin K helps with vascular permeability — tallow's K2 content is a genuine advantage here.",
  },
];

export default function FaceMappingScreen() {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [detailTab, setDetailTab] = useState<'causes' | 'solutions' | 'science'>('causes');
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
        <Text style={styles.headerTitle}>Face Mapping</Text>
        <View style={{ width: 60 }} />
      </Animated.View>

      <Animated.ScrollView style={[styles.scroll, { opacity: contentAnim }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Tap a zone to learn what causes breakouts there and how to address them.
          Face mapping blends traditional wisdom with modern dermatology.
        </Text>

        {/* Face diagram */}
        <View style={styles.faceContainer}>
          <View style={styles.faceShape}>
            {/* Face outline using nested views */}
            <View style={styles.faceInner}>
              {/* Zone buttons overlaid */}
              {ZONES.map(zone => (
                <TouchableOpacity
                  key={zone.id}
                  style={[
                    styles.zoneBtn,
                    {
                      top: zone.position.top,
                      left: zone.position.left,
                      borderColor: selectedZone?.id === zone.id ? zone.color : Colors.border,
                      backgroundColor: selectedZone?.id === zone.id ? zone.color + '33' : Colors.card + 'CC',
                    },
                  ]}
                  onPress={() => {
                    setSelectedZone(selectedZone?.id === zone.id ? null : zone);
                    setDetailTab('causes');
                  }}
                >
                  <Text style={styles.zoneEmoji}>{zone.emoji}</Text>
                  <Text style={[styles.zoneLabel, { color: selectedZone?.id === zone.id ? zone.color : Colors.textMuted }]}>
                    {zone.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Zone list as alternative selector */}
        <Text style={styles.orText}>Or select a zone:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {ZONES.map(zone => (
            <TouchableOpacity
              key={zone.id}
              style={[
                styles.zoneChip,
                selectedZone?.id === zone.id && { borderColor: zone.color, backgroundColor: zone.color + '22' },
              ]}
              onPress={() => {
                setSelectedZone(selectedZone?.id === zone.id ? null : zone);
                setDetailTab('causes');
              }}
            >
              <Text style={styles.zoneChipEmoji}>{zone.emoji}</Text>
              <Text style={[styles.zoneChipLabel, selectedZone?.id === zone.id && { color: zone.color }]}>
                {zone.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedZone && (
          <View style={[styles.detailCard, { borderColor: selectedZone.color + '55' }]}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailEmoji}>{selectedZone.emoji}</Text>
              <Text style={[styles.detailTitle, { color: selectedZone.color }]}>{selectedZone.label}</Text>
            </View>

            <View style={styles.detailTabRow}>
              {(['causes', 'solutions', 'science'] as const).map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.detailTab, detailTab === tab && { borderColor: selectedZone.color, backgroundColor: selectedZone.color + '22' }]}
                  onPress={() => setDetailTab(tab)}
                >
                  <Text style={[styles.detailTabText, detailTab === tab && { color: selectedZone.color }]}>
                    {tab === 'causes' ? 'Causes' : tab === 'solutions' ? 'Solutions' : 'Science'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {detailTab === 'causes' && (
              <View style={styles.listSection}>
                {selectedZone.causes.map((c, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={[styles.listBullet, { color: selectedZone.color }]}>•</Text>
                    <Text style={styles.listText}>{c}</Text>
                  </View>
                ))}
              </View>
            )}

            {detailTab === 'solutions' && (
              <View style={styles.listSection}>
                {selectedZone.solutions.map((s, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={[styles.listBullet, { color: Colors.green }]}>✓</Text>
                    <Text style={styles.listText}>{s}</Text>
                  </View>
                ))}
                <View style={styles.tallowNote}>
                  <Text style={styles.tallowNoteTitle}>🌿 Tallow Note</Text>
                  <Text style={styles.tallowNoteText}>{selectedZone.tallowNote}</Text>
                </View>
              </View>
            )}

            {detailTab === 'science' && (
              <View style={styles.listSection}>
                <Text style={styles.scienceText}>{selectedZone.science}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Face mapping is a guide, not a diagnosis. Breakout patterns can have multiple causes and may overlap zones. Use this as a starting point for identifying lifestyle triggers.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
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
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  intro: {
    color: Colors.textSecondary, fontSize: 13, lineHeight: 20,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 12,
  },
  faceContainer: { alignItems: 'center', paddingVertical: 12 },
  faceShape: {
    width: 300, height: 420,
    backgroundColor: Colors.cardAlt,
    borderRadius: 150,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  faceInner: { width: 300, height: 420 },
  zoneBtn: {
    position: 'absolute',
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 5,
    alignItems: 'center', flexDirection: 'row', gap: 4,
  },
  zoneEmoji: { fontSize: 12 },
  zoneLabel: { fontSize: 9, fontWeight: '700' },
  orText: {
    color: Colors.textMuted, fontSize: 12, fontWeight: '600',
    paddingHorizontal: 16, marginBottom: 8,
  },
  zoneChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  zoneChipEmoji: { fontSize: 14 },
  zoneChipLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  detailCard: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, padding: 16,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  detailEmoji: { fontSize: 24 },
  detailTitle: { fontSize: 18, fontWeight: '800' },
  detailTabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  detailTab: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  detailTabText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  listSection: {},
  listItem: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  listBullet: { fontSize: 14, fontWeight: '700', marginTop: 1 },
  listText: { flex: 1, color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowNote: {
    backgroundColor: Colors.primary + '15', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.primary + '44', marginTop: 8,
  },
  tallowNoteTitle: { color: Colors.primary, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  tallowNoteText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  scienceText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 21 },
  disclaimer: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: Colors.cardAlt, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  disclaimerText: { color: Colors.textMuted, fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
});
