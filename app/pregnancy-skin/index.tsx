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

const TABS = ['Avoid', 'Safe Ingredients', 'Skin Changes', 'Routine', 'Tallow in Pregnancy'];

const AVOID_INGREDIENTS = [
  { ingredient: 'Retinoids (ALL forms)', reason: 'Retinol, tretinoin, retinaldehyde, adapalene, tazarotene, isotretinoin — all vitamin A derivatives are teratogenic at high systemic doses. While topical retinoids are minimally absorbed, the established animal and case study data means avoidance is universally recommended during pregnancy.', risk: 'High — avoid entirely', category: 'avoid', color: Colors.red },
  { ingredient: 'Salicylic acid (>2%, oral/systemic)', reason: 'Topical salicylic acid at low concentrations (≤2% as a leave-on, ≤3% as rinse-off) is generally considered low-risk. High-concentration peels and oral salicylate-containing medications are the concern. The systemic absorption from a 2% BHA toner is negligible.', risk: 'High concentration: avoid. Low % topical: generally accepted with caution', category: 'caution', color: Colors.gold },
  { ingredient: 'Hydroquinone', reason: 'Skin brightening agent with 35–45% systemic absorption (high for a topical). Limited pregnancy safety data. Most dermatologists recommend avoiding during pregnancy — the systemic exposure concern is real given its high topical absorption rate.', risk: 'Moderate-high — avoid', category: 'avoid', color: Colors.red },
  { ingredient: 'Chemical sunscreen filters (oxybenzone, avobenzone)', reason: 'Some chemical UV filters (particularly oxybenzone/benzophenone-3) are endocrine disruptors — they can interfere with hormone signalling. Detectable in blood, urine, and breast milk after application. Switch to mineral SPF (zinc oxide, titanium dioxide) during pregnancy.', risk: 'Moderate — switch to mineral SPF', category: 'avoid', color: Colors.red },
  { ingredient: 'Benzoyl peroxide (high concentration)', reason: 'At low concentrations (2.5%), absorption is minimal. At higher concentrations and large application areas, concern increases. Most guidance: 2.5–5% spot application is considered relatively safe but avoid large area application. Limited pregnancy-specific data.', risk: 'Caution — limit use, avoid large areas', category: 'caution', color: Colors.gold },
  { ingredient: 'Essential oils (high concentration)', reason: 'Certain essential oils (clary sage, rosemary, thyme, basil) are considered uterine stimulants. Even aromatherapy concentrations are concerning in the first trimester. Formulated skincare with trace fragrance amounts is different from applying essential oil concentrates directly.', risk: 'Some: high risk. Diluted fragrance in formulas: lower risk', category: 'caution', color: Colors.gold },
  { ingredient: 'Formaldehyde-releasing preservatives', reason: 'DMDM hydantoin, quaternium-15, diazolidinyl urea — found in some drugstore products. Formaldehyde is a known carcinogen. Avoid during pregnancy (and generally). Look for formaldehyde-free preservative systems.', risk: 'High — avoid', category: 'avoid', color: Colors.red },
  { ingredient: 'Dihydroxyacetone (DHA) in self-tanners', reason: 'DHA reacts with amino acids in dead skin cells to create colour. While topical DHA on intact skin has low systemic absorption, inhalation from spray tans is a concern. Avoid spray tan application (inhalation risk). Lotion-based self-tanners with minimal skin contact may be discussed with your OB.', risk: 'Spray application: avoid. Lotion: discuss with OB', category: 'caution', color: Colors.gold },
];

const SAFE_INGREDIENTS = [
  { ingredient: 'Hyaluronic acid', safety: 'Safe', note: 'Naturally occurring in the body. Topical HA has negligible systemic absorption. No pregnancy concerns. Excellent for the dehydration and skin stretching common in pregnancy.', icon: '💧', color: Colors.teal },
  { ingredient: 'Niacinamide (B3)', safety: 'Safe', note: 'Water-soluble vitamin. Topical absorption is low. No teratogenic concerns. Excellent for the hyperpigmentation (melasma) that commonly worsens during pregnancy. Safe at standard 2–10% concentrations.', icon: '💊', color: Colors.blue },
  { ingredient: 'Vitamin C (topical)', safety: 'Safe', note: 'Water-soluble, antioxidant. No pregnancy concerns with topical application. Excellent for melasma control (inhibits melanin at the synthesis step). Stable derivatives preferred for sensitive pregnancy skin.', icon: '🍊', color: Colors.gold },
  { ingredient: 'Glycolic acid (low %, rinse-off)', safety: 'Generally accepted', note: 'Low-concentration glycolic acid (≤8%) in rinse-off formulas is generally considered safe. Leave-on high-concentration peels: avoid. Discuss with your OB for individual guidance.', icon: '⚗️', color: Colors.green },
  { ingredient: 'Azelaic acid', safety: 'Safe (Category B)', note: 'FDA category B — no adverse fetal effects in animal studies. Excellent melasma and acne treatment during pregnancy. Often specifically recommended as the retinoid replacement for acne and pigmentation during pregnancy.', icon: '✨', color: Colors.green },
  { ingredient: 'Mineral SPF (zinc oxide, titanium dioxide)', safety: 'Safe', note: 'Physical UV filters that sit on top of skin rather than penetrating. No systemic absorption of the active UV-blocking compounds. The only SPF category fully endorsed for pregnancy use.', icon: '☀️', color: Colors.teal },
  { ingredient: 'Ceramides and barrier lipids', safety: 'Safe', note: 'Naturally occurring skin barrier components. Topical ceramide formulations have no systemic concerns. Highly recommended for barrier support during pregnancy when skin is stretched and more reactive.', icon: '🛡️', color: Colors.green },
  { ingredient: 'Centella asiatica (Cica)', safety: 'Generally accepted', note: 'Plant extract with wound healing and anti-inflammatory properties. Commonly used for stretch mark prevention during pregnancy. Topical application generally considered safe — not classified as a concern.', icon: '🌿', color: Colors.green },
  { ingredient: 'Vitamin E (tocopherol)', safety: 'Safe', note: 'Topical vitamin E is antioxidant and non-irritating. No pregnancy concerns with topical application. Supports the skin during rapid stretching. Found naturally in grass-fed tallow.', icon: '🌻', color: Colors.green },
];

const SKIN_CHANGES = [
  { change: 'Melasma ("mask of pregnancy")', detail: 'Estrogen stimulates melanocytes, causing hyperpigmentation particularly on the upper lip, forehead, and cheeks. Affects ~50–70% of pregnant women. Worsens dramatically with UV exposure. Primary treatment: strict mineral SPF + vitamin C + niacinamide. Melasma often resolves postpartum but may persist in some women.', trimester: 'Usually 2nd–3rd trimester', icon: '🎭' },
  { change: 'Increased oiliness and acne', detail: 'Progesterone stimulates sebum production. First trimester hormonal surge can produce the most severe acne. Many women who never had acne develop significant breakouts in pregnancy. Treatment options are limited — azelaic acid and topical clindamycin (consult OB) are the safest choices.', trimester: 'Often worst in 1st trimester', icon: '💧' },
  { change: 'Sensitivity and reactive skin', detail: 'Immune system modulation during pregnancy (to prevent rejection of the fetus) can make skin more reactive. Products previously tolerated may suddenly cause irritation. Simplify the routine during pregnancy — fewer products, gentler formulations.', trimester: 'Throughout pregnancy', icon: '🔴' },
  { change: 'Stretch marks', detail: 'Rapid skin stretching during growth phases can exceed the skin\'s elasticity capacity, causing dermal tears. Preventive moisturisation (twice daily, focusing on abdomen, hips, breasts, thighs) starting early in pregnancy is more effective than treating existing stretch marks.', trimester: '2nd–3rd trimester', icon: '〰️' },
  { change: 'Linea nigra', detail: 'Darkening of the vertical line from navel to pubis (or navel to chest). Caused by the same estrogen-driven melanocyte stimulation as melasma. Fades postpartum. No treatment needed or possible during pregnancy.', trimester: '2nd trimester onward', icon: '📏' },
  { change: 'PUPPP (pruritic urticarial papules)', detail: 'A specific pregnancy rash that appears in the third trimester — itchy red bumps first appearing in stretch mark areas. More common with first pregnancies and multiple pregnancies (twins). Usually resolves within days of delivery. OB consult required.', trimester: '3rd trimester', icon: '⚠️' },
];

const PREGNANCY_ROUTINE = {
  am: [
    { step: 1, action: 'Gentle pH-balanced cleanser', note: 'No SLS. Cream or mild gel. Skin may be more sensitive.' },
    { step: 2, action: 'Vitamin C serum (stable form)', note: 'Ascorbyl glucoside or SAP — gentler than LAA for sensitive pregnancy skin. Melasma control.' },
    { step: 3, action: 'Niacinamide serum 5%', note: 'Melasma inhibition (blocks melanosome transfer). Anti-inflammatory.' },
    { step: 4, action: 'Hyaluronic acid', note: 'Hydration — pregnancy skin can be dehydrated despite appearing oily.' },
    { step: 5, action: 'Mineral SPF 50 (zinc oxide)', note: 'Non-negotiable. Melasma worsens dramatically without protection.' },
  ],
  pm: [
    { step: 1, action: 'Double cleanse (if wearing SPF)', note: 'Oil cleanser first to remove mineral SPF thoroughly.' },
    { step: 2, action: 'Azelaic acid 10–15% (2–3×/week)', note: 'Safest retinoid replacement for acne and pigmentation during pregnancy. FDA category B.' },
    { step: 3, action: 'Niacinamide serum', note: 'Continued melasma management.' },
    { step: 4, action: 'Barrier moisturiser — tallow or ceramide cream', note: 'Occlusive support. Extra application on stretching areas: abdomen, hips, thighs.' },
  ],
};

const TALLOW_PREGNANCY = [
  { title: 'Is tallow safe during pregnancy?', body: 'Yes — grass-fed tallow is one of the safest skincare ingredients during pregnancy. It contains no synthetic chemicals, no retinoids (in the prescription sense), no endocrine disruptors, and no high-risk preservatives. It is essentially rendered fat from grass-fed cattle — the same type of fat humans have eaten for hundreds of thousands of years.' },
  { title: 'Vitamin A in tallow: the retinoid question', body: 'Tallow contains vitamin A in retinyl ester form. The concern with retinoids in pregnancy relates to HIGH systemic doses (oral isotretinoin is severely teratogenic). Topical vitamin A as retinyl esters (not retinoic acid) at the concentrations in food and natural skincare is in a fundamentally different category. The vitamin A in tallow is the same form found in liver, butter, and egg yolks — foods eaten safely throughout pregnancy for millennia. No evidence exists linking topical retinyl esters from tallow to adverse pregnancy outcomes.' },
  { title: 'Stretch mark prevention: tallow twice daily', body: 'Start stretch mark prevention early — ideally from week 12. Apply tallow twice daily to the abdomen, hips, breasts, and inner thighs. The occlusive barrier and lipid content maintains skin suppleness and elasticity. Pair with centella asiatica cream on alternating applications. Consistent twice-daily application from early second trimester is more effective than intensive application starting in the third trimester when stretching is already rapid.' },
  { title: 'Barrier support for reactive pregnancy skin', body: 'Pregnancy immune modulation can make skin reactive to previously tolerated ingredients. Tallow, with its minimal ingredient list and bioidentical lipid profile, is unlikely to be a new sensitiser. For women whose skin has suddenly become reactive during pregnancy, switching to tallow as the sole moisturiser often helps — removing potential sensitising ingredients from complex formulations.' },
  { title: 'Postpartum skin repair', body: 'After delivery, hormone levels drop rapidly, causing the opposite skin effects: potential dryness, dull skin, increased TEWL, and hair shedding. Tallow in the postpartum period supports barrier recovery. As retinoid use can resume postpartum (with OB guidance on breastfeeding considerations), the retinol → tallow PM routine can be reintroduced in the weeks following delivery.' },
];

export default function PregnancySkinScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedAvoid, setExpandedAvoid] = useState<number | null>(null);
  const [expandedSafe, setExpandedSafe] = useState<number | null>(null);
  const [expandedChange, setExpandedChange] = useState<number | null>(null);

  const riskColor = (r: string) => r.startsWith('High') ? Colors.red : r.startsWith('Moderate') ? Colors.gold : Colors.teal;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pregnancy Skincare</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>🤱 Pregnancy-Safe Skincare</Text>
        <Text style={styles.heroSub}>Many common skincare actives should be avoided during pregnancy. Melasma, acne, and stretch marks are the top pregnancy skin concerns — all manageable with the right ingredients.</Text>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>🩺 Always consult your OB or dermatologist for personal guidance. This information is educational, not medical advice.</Text>
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
            {AVOID_INGREDIENTS.map((a, i) => (
              <TouchableOpacity key={i} style={[styles.card, { borderLeftColor: a.color, borderLeftWidth: 3 }]} onPress={() => setExpandedAvoid(expandedAvoid === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: a.color }]}>{a.ingredient}</Text>
                    <Text style={[styles.riskText, { color: a.color }]}>{a.risk}</Text>
                  </View>
                  <Text style={styles.expandIcon}>{expandedAvoid === i ? '▲' : '▼'}</Text>
                </View>
                {expandedAvoid === i && <Text style={styles.cardDetail}>{a.reason}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 1 && (
          <View>
            {SAFE_INGREDIENTS.map((s, i) => (
              <TouchableOpacity key={i} style={[styles.card, { borderLeftColor: s.color, borderLeftWidth: 3 }]} onPress={() => setExpandedSafe(expandedSafe === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{s.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: s.color }]}>{s.ingredient}</Text>
                    <View style={[styles.safetyBadge, { backgroundColor: s.color + '22', borderColor: s.color + '55' }]}>
                      <Text style={[styles.safetyText, { color: s.color }]}>{s.safety}</Text>
                    </View>
                  </View>
                  <Text style={styles.expandIcon}>{expandedSafe === i ? '▲' : '▼'}</Text>
                </View>
                {expandedSafe === i && <Text style={styles.cardDetail}>{s.note}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 2 && (
          <View>
            {SKIN_CHANGES.map((c, i) => (
              <TouchableOpacity key={i} style={styles.card} onPress={() => setExpandedChange(expandedChange === i ? null : i)} activeOpacity={0.85}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{c.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{c.change}</Text>
                    <Text style={styles.trimesterText}>{c.trimester}</Text>
                  </View>
                  <Text style={styles.expandIcon}>{expandedChange === i ? '▲' : '▼'}</Text>
                </View>
                {expandedChange === i && <Text style={styles.cardDetail}>{c.detail}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 3 && (
          <View>
            <Text style={styles.timeLabel}>☀️ Morning</Text>
            {PREGNANCY_ROUTINE.am.map((s, i) => (
              <View key={i} style={styles.stepCard}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{s.step}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepAction}>{s.action}</Text>
                  <Text style={styles.stepNote}>{s.note}</Text>
                </View>
              </View>
            ))}
            <Text style={[styles.timeLabel, { marginTop: 16 }]}>🌙 Evening</Text>
            {PREGNANCY_ROUTINE.pm.map((s, i) => (
              <View key={i} style={styles.stepCard}>
                <View style={[styles.stepNum, { backgroundColor: Colors.blue }]}><Text style={styles.stepNumText}>{s.step}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepAction}>{s.action}</Text>
                  <Text style={styles.stepNote}>{s.note}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 4 && (
          <View>
            <View style={styles.tallowHero}>
              <Text style={styles.tallowHeroTitle}>🌿 Tallow During Pregnancy</Text>
              <Text style={styles.tallowHeroSub}>Tallow is among the safest skincare choices during pregnancy — minimal ingredients, no synthetic actives, and a biological profile compatible with the skin it is applied to.</Text>
            </View>
            {TALLOW_PREGNANCY.map((p, i) => (
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
  hero: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0 },
  heroTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 6 },
  heroSub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  disclaimer: { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.red + '11', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.red + '33' },
  disclaimerText: { color: Colors.red, fontSize: 12, lineHeight: 18 },
  tabScroll: { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary + '22', borderColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  card: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardEmoji: { fontSize: 18, marginTop: 2 },
  cardTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  cardDetail: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 10 },
  expandIcon: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  riskText: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  safetyBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginTop: 2 },
  safetyText: { fontSize: 10, fontWeight: '700' },
  trimesterText: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  timeLabel: { color: Colors.gold, fontSize: 15, fontWeight: '800', marginBottom: 10 },
  stepCard: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  stepAction: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  stepNote: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  tallowHero: { backgroundColor: Colors.primary + '11', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.primary + '44', marginBottom: 14 },
  tallowHeroTitle: { color: Colors.primary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  tallowHeroSub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  tallowCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  tallowCardTitle: { color: Colors.gold, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tallowCardBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
