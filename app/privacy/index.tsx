import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `GlowDermics collects only the data you provide directly within the app:

• Skin photos taken for AI analysis (stored locally on your device)
• Skin type, concerns, and goals you enter during onboarding
• Daily journal entries, habit logs, water tracking, and routine logs
• Product shelf entries and notes
• Challenge progress and milestone data

All personal data is stored locally on your device using AsyncStorage. We do not upload your photos or personal skin data to any server.`,
  },
  {
    title: '2. AI Analysis',
    body: `When you use AI features (skin scan, coach chat, ingredient analysis, etc.), your data is sent to:

• Groq AI (groq.com) — for AI inference via their API
• Image data for skin scans is processed by Groq's vision model

Groq processes data according to their Privacy Policy. We do not store or retain your data after the API call completes. Groq may retain API request data per their own data retention policies.`,
  },
  {
    title: '3. How We Use Your Data',
    body: `We use your data exclusively to:

• Provide personalized skin analysis and recommendations
• Generate AI coaching responses tailored to your profile
• Show your progress over time within the app
• Enable AI features (routine builder, forecasts, ingredient analysis)

We do NOT:
• Sell your data to third parties
• Share your data with advertisers
• Use your photos for training AI models
• Collect analytics or behavioral tracking data`,
  },
  {
    title: '4. Data Storage & Security',
    body: `All your personal data (profile, journal, scans, logs) is stored exclusively on your device using React Native AsyncStorage. This data:

• Never leaves your device (except when sent to Groq for AI processing)
• Is not backed up to our servers
• Is deleted if you use the "Reset All Data" feature or uninstall the app
• Is not accessible to GlowDermics or TallowDermics staff`,
  },
  {
    title: '5. Children\'s Privacy',
    body: `GlowDermics is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has used this app, please contact us and we will help them remove their data from their device.`,
  },
  {
    title: '6. Your Rights',
    body: `You have full control over your data:

• Delete all data: Settings → Reset All Data
• Stop data collection: Uninstall the app
• Access your data: All data is stored locally and visible within the app

Since we don't store data on our servers, there is no account to delete or data portability request to fulfill — your data lives entirely on your device.`,
  },
  {
    title: '7. Third-Party Services',
    body: `GlowDermics integrates with:

• Groq AI (groq.com) — AI inference for skin analysis and coaching
• Expo (expo.dev) — App development platform

TallowDermics (tallowdermics.com) — Referenced brand within the app. Visiting their website is subject to TallowDermics' own Privacy Policy.`,
  },
  {
    title: '8. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of significant changes through the app. Continued use of GlowDermics after changes constitutes your acceptance of the updated policy.`,
  },
  {
    title: '9. Contact',
    body: `Questions about this Privacy Policy? Contact us through the GlowDermics support channel or via TallowDermics at tallowdermics.com.`,
  },
];

export default function Privacy() {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🔒</Text>
          <Text style={styles.heroTitle}>Your Privacy Matters</Text>
          <Text style={styles.heroSub}>GlowDermics is designed privacy-first. Your skin data stays on your device.</Text>
          <Text style={styles.heroDate}>Last updated: April 2026</Text>
        </View>

        <View style={styles.highlightCard}>
          <Text style={styles.highlightTitle}>TL;DR — Key Points</Text>
          {[
            '📱 All data stored locally on your device',
            '🤖 Groq AI processes requests — we don\'t store them',
            '🚫 No ads, no data selling, no tracking',
            '🗑 Delete everything via Settings anytime',
          ].map((pt, i) => (
            <Text key={i} style={styles.highlightPoint}>{pt}</Text>
          ))}
        </View>

        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },

  scroll: { paddingHorizontal: 20 },

  heroCard: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 24, alignItems: 'center', gap: 8, marginBottom: 16 },
  heroEmoji: { fontSize: 40 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  heroSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  heroDate: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },

  highlightCard: { backgroundColor: 'rgba(74,222,128,0.07)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', padding: 16, gap: 8, marginBottom: 20 },
  highlightTitle: { fontSize: 14, fontWeight: '700', color: '#4ADE80', marginBottom: 4 },
  highlightPoint: { fontSize: 13, color: Colors.textSecondary, lineHeight: 22 },

  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  sectionBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 22 },
});
