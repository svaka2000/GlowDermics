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
  green: '#4ADE80', red: '#F87171', blue: '#60A5FA', teal: '#2DD4BF',
};

const TABS = ['The Connection', 'Dysbiosis & Skin', 'Fix Your Gut', 'Skin-Gut Foods', 'Tallow Link'];

const CONNECTION_FACTS = [
  { fact: 'The gut-skin axis is a bidirectional communication system', detail: 'The gut microbiome communicates with skin through multiple pathways: immune modulation (70% of the immune system is in the gut), inflammatory cytokine production, short-chain fatty acid (SCFA) secretion, the enteric nervous system, and hormonal signalling. Skin changes can also affect gut microbiome — the relationship runs both ways.', icon: '🔄' },
  { fact: 'The gut microbiome contains 39 trillion microorganisms', detail: 'The human gut is home to approximately 39 trillion bacteria, archaea, fungi, and viruses — more than the number of human cells in the body. These organisms collectively produce neurotransmitters, vitamins (B12, K2, folate), short-chain fatty acids, and inflammatory mediators that directly affect skin health.', icon: '🦠' },
  { fact: 'Intestinal permeability ("leaky gut") triggers systemic inflammation', detail: 'The gut epithelium is a single cell-thick barrier. When tight junctions between these cells weaken (from poor diet, antibiotics, stress, alcohol), bacterial components (lipopolysaccharide — LPS) cross into the bloodstream. LPS triggers a potent systemic inflammatory response that manifests in skin as acne, rosacea, eczema flares, and accelerated aging.', icon: '🔓' },
  { fact: 'Gut bacteria produce SCFAs that regulate skin immunity', detail: 'When beneficial gut bacteria ferment dietary fibre, they produce short-chain fatty acids (SCFAs): butyrate, propionate, and acetate. SCFAs are anti-inflammatory systemically, regulate immune cell differentiation, and are now known to affect skin-specific immunity. Adequate dietary fibre directly improves skin inflammation markers.', icon: '⚗️' },
  { fact: 'Stress damages both gut and skin simultaneously', detail: 'The stress response (cortisol, CRH) directly: increases intestinal permeability, reduces beneficial gut bacteria, stimulates sebum production, reduces skin barrier function, and impairs wound healing. Skin and gut respond to stress in parallel — they share stress hormone receptors and neural connections through the gut-brain-skin axis.', icon: '🧠' },
  { fact: 'Probiotics show clinical effect on skin conditions', detail: 'Multiple randomised controlled trials show oral probiotics improve acne (Lactobacillus reuteri and L. acidophilus), atopic dermatitis (L. rhamnosus GG — one of the strongest findings in probiotic research), and rosacea (Lactobacillus species). The effect size is modest but statistically significant and clinically meaningful.', icon: '🧬' },
];

const DYSBIOSIS_CONDITIONS = [
  { condition: 'Acne', connection: 'Dysbiotic gut → higher systemic inflammatory cytokines (IL-1β, TNF-α) → inflammatory acne. High-sugar diet → dysbiosis → elevated IGF-1 → sebum overproduction → comedones. C. acnes skin overgrowth often correlates with gut Propionibacterium species disruption.', intervention: 'Low-glycaemic diet, probiotic supplementation, prebiotics (fibre), reduce dairy and alcohol.', color: Colors.red },
  { condition: 'Rosacea', connection: 'Studies find significantly elevated rates of SIBO (small intestinal bacterial overgrowth) in rosacea patients (46% vs 5% controls). Treating SIBO with rifaximin produced measurable rosacea improvement. H. pylori is also associated with rosacea in some studies.', intervention: 'Screen for SIBO, H. pylori. Low FODMAP trial. L. acidophilus probiotic. Anti-inflammatory diet.', color: Colors.primary },
  { condition: 'Eczema (Atopic Dermatitis)', connection: 'One of the strongest gut-skin connections. Reduced diversity of gut microbiome in early infancy predicts eczema development. Specific bacteria (Bacteroides, Clostridium) are found at lower levels in eczema patients. L. rhamnosus GG supplementation during pregnancy and infancy reduces eczema risk by ~30%.', intervention: 'Probiotic supplementation (especially in pregnancy/infancy for prevention), prebiotic-rich diet, reduce maternal antibiotic use.', color: Colors.blue },
  { condition: 'Psoriasis', connection: 'Psoriasis patients have significantly altered gut microbiome composition with reduced Akkermansia muciniphila (a key barrier-supporting bacterium) and higher inflammatory Firmicutes:Bacteroidetes ratios. Metabolic syndrome (associated with gut dysbiosis) dramatically worsens psoriasis severity.', intervention: 'Anti-inflammatory diet, psoriasis-specific probiotic trials are ongoing. Reduce alcohol and ultra-processed foods.', color: Colors.teal },
  { condition: 'Perioral Dermatitis', connection: 'Often triggered by gut dysbiosis from antibiotic overuse (a paradox — antibiotics are sometimes prescribed for it). Disruption of normal gut microbiome from long-term topical steroid use and systemic antibiotics is strongly associated. Antibiotic-associated dysbiosis can manifest as perioral rash.', intervention: 'Probiotic supplementation during and after antibiotic courses. Fermented foods. Avoid steroid creams on face.', color: Colors.gold },
];

const GUT_FIX = [
  { step: 1, title: 'Eat 30 different plants per week', detail: 'The single strongest predictor of gut microbiome diversity is plant variety — not just quantity. Each plant species feeds different bacterial species. Studies show 30+ different plant foods per week corresponds to significantly higher microbiome diversity and lower inflammatory markers. Count every vegetable, fruit, grain, legume, nut, seed, and herb.' },
  { step: 2, title: 'Fermented foods daily', detail: 'Kefir, yoghurt (live cultures), kimchi, sauerkraut, miso, tempeh, kombucha. A Stanford study showed fermented food diet increased microbiome diversity and reduced 19 inflammatory markers — outperforming a high-fibre diet for microbiome impact. Even 1–2 servings daily makes a measurable difference.' },
  { step: 3, title: 'Prebiotic fibre: 25–35g daily', detail: 'Prebiotics are non-digestible fibres that feed beneficial gut bacteria. Sources: garlic, onion, leeks, asparagus, chicory root, Jerusalem artichoke, oats, bananas, apples. Resistant starch (cooked-and-cooled potato and rice) is particularly effective for producing butyrate — the SCFA most relevant to gut barrier integrity.' },
  { step: 4, title: 'Probiotic supplementation', detail: 'Multi-strain probiotics with clinically validated strains: L. rhamnosus GG, L. reuteri, L. acidophilus, B. longum, B. breve. 10–50 billion CFU per day. Take with food. Consistency over at least 8–12 weeks required to see skin effects. Refrigerated strains have better viability.' },
  { step: 5, title: 'Eliminate microbiome disruptors', detail: 'Alcohol (measurably increases gut permeability within 24 hours of consumption), artificial sweeteners (saccharin, aspartame, sucralose — reduce Lactobacillus populations), NSAIDs (ibuprofen — damages gut epithelium), unnecessary antibiotics, and ultra-processed foods (emulsifiers carboxymethylcellulose and polysorbate-80 are documented dysbiosis inducers).' },
  { step: 6, title: 'Reduce stress for gut integrity', detail: 'Psychological stress increases corticotropin-releasing hormone (CRH) in the gut, which directly increases gut permeability. Chronic stress produces the same intestinal changes as poor diet — impaired barrier, reduced Lactobacillus populations, increased inflammatory LPS translocation. Stress management is gut medicine.' },
  { step: 7, title: 'Bone broth for gut lining repair', detail: 'Bone broth contains gelatin (cooked collagen), glutamine (the primary fuel of gut epithelial cells), and glycine. Glutamine supplementation specifically repairs intestinal tight junctions and reduces permeability in clinical studies. Bone broth provides all three gut-repairing compounds simultaneously in bioavailable form.' },
];

const GUT_SKIN_FOODS = [
  { food: 'Kefir', benefit: 'Higher probiotic concentration than yoghurt, with diverse Lactobacillus and Bifidobacterium species plus yeasts. Kefir probiotics survive gastric acid better than capsule strains. Studies show kefir consumption reduces systemic inflammatory markers relevant to acne and eczema.', emoji: '🥛' },
  { food: 'Kimchi and sauerkraut', benefit: 'Lacto-fermented vegetables contain L. plantarum (shown to reduce skin transepidermal water loss in studies) and other strains that survive to the large intestine. Also rich in vitamin C and K2. More diverse microbial species than dairy-based ferments.', emoji: '🥬' },
  { food: 'Garlic and onion', benefit: 'Prebiotic inulin and FOS (fructooligosaccharides) that selectively feed Lactobacillus and Bifidobacterium populations. Garlic also contains allicin — antimicrobial that selectively targets pathogenic bacteria without harming Lactobacillus species.', emoji: '🧄' },
  { food: 'Bone broth', benefit: 'Glycine (gut epithelium fuel), glutamine (tight junction repair), gelatin (gut lining coating). Traditional gut healing food across cultures. 2–3 cups per week during gut repair provides these compounds alongside collagen peptides relevant to skin.', emoji: '🍖' },
  { food: 'Asparagus and chicory', benefit: 'Highest prebiotic inulin concentration. Specifically stimulate Bifidobacterium growth — a genus particularly associated with healthy skin microbiome. Chicory root extract is one of the most studied prebiotics with the strongest effect on Bifidobacterium counts.', emoji: '🥦' },
  { food: 'Oily fish', benefit: 'Omega-3 EPA/DHA reduce gut inflammation and improve the Firmicutes:Bacteroidetes ratio (imbalance is associated with inflammatory conditions). Also directly anti-inflammatory in skin. Dual gut+skin benefit from a single food.', emoji: '🐟' },
];

const TALLOW_LINK = [
  { title: 'Tallow and the gut microbiome: dietary fat quality matters', body: 'Grass-fed tallow is saturated fat with a balanced palmitic:stearic:oleic ratio, plus CLA and omega-3 fatty acids (though less than fish). Unlike refined vegetable oils, grass-fed animal fats do not contain trans fats, oxidised lipids, or the high omega-6 content that promotes gut dysbiosis. Quality of dietary fat is a key gut microbiome modulator.' },
  { title: 'Butyric acid: the gut-skin SCFA', body: 'Butyric acid (butyrate) is a short-chain fatty acid produced by gut bacteria fermenting fibre — and also found in grass-fed butter and tallow. Topical butyrate has been studied for eczema with promising results. Dietary butyrate from fermented fibre and from grass-fed animal fats addresses the gut-skin inflammation pathway simultaneously.' },
  { title: 'Vitamin K2 MK-4 and gut-skin health', body: 'Grass-fed tallow is one of the richest dietary sources of vitamin K2 MK-4. K2 is produced by gut bacteria AND obtained from grass-fed animal products. K2 deficiency is increasingly associated with systemic inflammation and impaired skin elasticity. Adequate K2 from diet supports both gut-based immune regulation and skin structural integrity.' },
  { title: 'Tallow-based skin probiotics: emerging research', body: 'The skin has its own microbiome that communicates with gut microbiome through immune crosstalk. Tallow\'s antimicrobial fatty acids (palmitoleic acid) selectively inhibit pathogenic skin bacteria while being compatible with Staphylococcus epidermidis (a key beneficial skin commensal). Topical tallow may support skin microbiome health — complementary to gut microbiome support through diet.' },
];

export default function GutSkinScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedFact, setExpandedFact] = useState<number | null>(null);
  const [expandedCond, setExpandedCond] = useState<number | null>(null);
  const [expandedFood, setExpandedFood] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gut-Skin Axis</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>🦠 Gut-Skin Connection</Text>
        <Text style={styles.heroSub}>The gut is the most underrated organ for skin health. Acne, eczema, rosacea, and psoriasis all have measurable gut microbiome connections with clinical intervention evidence.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={i} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {activeTab === 0 && (
          <View>
            {CONNECTION_FACTS.map((f, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedFact(expandedFact === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{f.icon}</Text>
                  <Text style={[styles.cardTitle, { flex: 1 }]}>{f.fact}</Text>
                  <Text style={styles.expandIcon}>{expandedFact === i ? '▲' : '▼'}</Text>
                </View>
                {expandedFact === i && <Text style={styles.cardDetail}>{f.detail}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 1 && (
          <View>
            <Text style={styles.sectionNote}>Each skin condition has a specific gut pathway. Targeting the right intervention improves results significantly.</Text>
            {DYSBIOSIS_CONDITIONS.map((c, i) => (
              <TouchableOpacity key={i} style={[styles.card, { borderLeftColor: c.color, borderLeftWidth: 3 }]} onPress={() => setExpandedCond(expandedCond === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardTitle, { flex: 1, color: c.color }]}>{c.condition}</Text>
                  <Text style={styles.expandIcon}>{expandedCond === i ? '▲' : '▼'}</Text>
                </View>
                {expandedCond === i && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.mechLabel}>Gut-Skin Mechanism</Text>
                    <Text style={styles.cardDetail}>{c.connection}</Text>
                    <View style={styles.interventionBlock}>
                      <Text style={styles.interventionLabel}>Interventions</Text>
                      <Text style={styles.interventionText}>{c.intervention}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 2 && (
          <View>
            {GUT_FIX.map((s, i) => (
              <View key={i} style={styles.stepCard}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{s.step}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepDetail}>{s.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 3 && (
          <View>
            {GUT_SKIN_FOODS.map((f, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedFood(expandedFood === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{f.emoji}</Text>
                  <Text style={[styles.cardTitle, { flex: 1 }]}>{f.food}</Text>
                  <Text style={styles.expandIcon}>{expandedFood === i ? '▲' : '▼'}</Text>
                </View>
                {expandedFood === i && <Text style={styles.cardDetail}>{f.benefit}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 4 && (
          <View>
            <View style={styles.tallowHero}>
              <Text style={styles.tallowHeroTitle}>🌿 Tallow in the Gut-Skin Framework</Text>
              <Text style={styles.tallowHeroSub}>Tallow addresses the gut-skin axis from both directions: as a dietary fat that supports microbiome health, and as a topical that supports the skin microbiome.</Text>
            </View>
            {TALLOW_LINK.map((p, i) => (
              <View key={i} style={styles.tallowCard}>
                <Text style={styles.tallowCardTitle}>{p.title}</Text>
                <Text style={styles.tallowCardBody}>{p.body}</Text>
              </View>
            ))}
          </View>
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
  hero: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  heroTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 6 },
  heroSub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  tabScroll: { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary + '22', borderColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionNote: { color: Colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 12, fontStyle: 'italic' },
  card: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardEmoji: { fontSize: 18, marginTop: 2 },
  cardTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  cardDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  expandIcon: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  mechLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  interventionBlock: { marginTop: 10, backgroundColor: Colors.green + '0D', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: Colors.green + '33' },
  interventionLabel: { color: Colors.green, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  interventionText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  stepCard: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  stepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  stepTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  stepDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  tallowHero: { backgroundColor: Colors.primary + '11', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.primary + '44', marginBottom: 14 },
  tallowHeroTitle: { color: Colors.primary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  tallowHeroSub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  tallowCardTitle: { color: Colors.gold, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowCardBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
