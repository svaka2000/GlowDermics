import { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Modal, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Auth } from '../services/auth';

interface PremiumGateProps {
  visible: boolean;
  onClose: () => void;
  feature?: string;
  reason?: string; // e.g. "You've used 3/3 free scans this month"
}

const PREMIUM_FEATURES = [
  { icon: 'scan-outline', label: 'Unlimited skin scans', sub: 'Free: 3/month' },
  { icon: 'chatbubble-ellipses-outline', label: 'Unlimited AI coach', sub: 'Free: 10 messages/day' },
  { icon: 'trending-up-outline', label: 'Advanced skin analytics', sub: 'Progress trends & predictions' },
  { icon: 'download-outline', label: 'Export scan history', sub: 'PDF reports' },
  { icon: 'flash-outline', label: 'Priority AI analysis', sub: 'Faster scan processing' },
];

export function PremiumGate({ visible, onClose, feature, reason }: PremiumGateProps) {
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  const handleActivate = async () => {
    setActivating(true);
    try {
      await Auth.activatePremium();
      setActivated(true);
      setTimeout(() => {
        setActivated(false);
        onClose();
      }, 1800);
    } catch {}
    setActivating(false);
  };

  const sheetContent = (
    <View style={styles.sheet}>
      <View style={styles.handle} />
      {activated ? (
        <View style={styles.successWrap}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={36} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Premium Activated!</Text>
          <Text style={styles.successSub}>Welcome to the full GlowDermics experience.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <LinearGradient colors={['rgba(196,98,45,0.12)', 'transparent']} style={styles.heroGlow} />
          <View style={styles.hero}>
            <View style={styles.crownWrap}>
              <LinearGradient colors={['#F0C94A', '#D4A96A']} style={styles.crownGrad}>
                <Ionicons name="star" size={24} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>GlowDermics Premium</Text>
            <Text style={styles.heroPrice}>$4.99 / month</Text>
          </View>
          {reason && (
            <View style={styles.reasonBox}>
              <Ionicons name="information-circle" size={14} color={Colors.primary} />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          )}
          <View style={styles.featureList}>
            {PREMIUM_FEATURES.map(f => (
              <View key={f.label} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon as any} size={16} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                  <Text style={styles.featureSub}>{f.sub}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
              </View>
            ))}
          </View>
          <Pressable style={styles.upgradeBtn} onPress={handleActivate} disabled={activating}>
            <LinearGradient
              colors={['#F0C94A', '#D4A96A', '#C4622D']}
              style={styles.upgradeBtnGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Ionicons name="star" size={16} color="#fff" />
              <Text style={styles.upgradeBtnText}>
                {activating ? 'Activating…' : 'Activate Premium'}
              </Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={onClose} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>Maybe later</Text>
          </Pressable>
          <Text style={styles.finePrint}>Cancel anytime · No commitment · Data stays private</Text>
        </ScrollView>
      )}
    </View>
  );

  // On web, Modal renders as a browser-level portal and escapes the phone frame.
  // Use an in-tree absolutely-positioned overlay instead so it stays inside the frame.
  if (Platform.OS === 'web') {
    if (!visible) return null;
    return (
      <View style={[StyleSheet.absoluteFillObject, styles.webOverlay]}>
        <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onClose} />
        {sheetContent}
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {sheetContent}
      </View>
    </Modal>
  );
}

// Inline banner for free-tier limit warnings (use inside screens)
export function PremiumBanner({ onUpgrade, message }: { onUpgrade: () => void; message: string }) {
  return (
    <Pressable style={styles.banner} onPress={onUpgrade}>
      <LinearGradient
        colors={['rgba(212,169,106,0.15)', 'rgba(196,98,45,0.08)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bannerStar}>
        <Ionicons name="star" size={12} color={Colors.gold} />
      </View>
      <Text style={styles.bannerText}>{message}</Text>
      <View style={styles.bannerBtn}>
        <Text style={styles.bannerBtnText}>Upgrade</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  webOverlay: {
    zIndex: 9999,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingBottom: 40,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginVertical: 12,
  },

  heroGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 120,
  },
  hero: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  crownWrap: { borderRadius: 20, overflow: 'hidden' },
  crownGrad: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  heroPrice: { fontSize: 15, color: Colors.primary, fontWeight: '700' },

  reasonBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(196,98,45,0.08)', borderRadius: 12,
    padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.borderStrong,
  },
  reasonText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },

  featureList: { gap: 12, marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(196,98,45,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  featureSub: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },

  upgradeBtn: { borderRadius: 18, overflow: 'hidden', marginBottom: 12 },
  upgradeBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 17,
  },
  upgradeBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  dismissBtn: { alignItems: 'center', paddingVertical: 10 },
  dismissText: { fontSize: 14, color: Colors.textMuted },

  finePrint: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 8 },

  // Success state
  successWrap: { alignItems: 'center', paddingVertical: 40, gap: 16 },
  successCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  successSub: { fontSize: 14, color: Colors.textSecondary },

  // Inline banner
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(196,98,45,0.25)',
    padding: 14, marginBottom: 16,
  },
  bannerStar: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(212,169,106,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerText: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  bannerBtn: {
    backgroundColor: Colors.primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  bannerBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
