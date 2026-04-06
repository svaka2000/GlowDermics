import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Auth } from '../../src/services/auth';
import { Colors } from '../../src/constants/colors';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const shakeX = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      shake();
      return;
    }
    setLoading(true);
    setError('');
    try {
      await Auth.login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Sign in failed. Please try again.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          {/* Logo area */}
          <View style={styles.logoWrap}>
            <LinearGradient
              colors={['#E8834A', '#C4622D', '#9E4D22']}
              style={styles.logoGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoMark}>✦</Text>
            </LinearGradient>
            <Text style={styles.appName}>GlowDermics</Text>
            <Text style={styles.tagline}>Your skin, decoded.</Text>
          </View>

          {/* Card */}
          <Animated.View style={[styles.card, { transform: [{ translateX: shakeX }] }]}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to continue your skin journey</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={14} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={16} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPw}
                  autoComplete="password"
                />
                <Pressable onPress={() => setShowPw(p => !p)} style={styles.eyeBtn}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={16} color={Colors.textMuted} />
                </Pressable>
              </View>
            </View>

            {/* Sign in button */}
            <Pressable style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
              <LinearGradient
                colors={['#E8834A', '#C4622D']}
                style={styles.primaryBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.primaryBtnText}>Sign In</Text>
                }
              </LinearGradient>
            </Pressable>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register link */}
            <Pressable style={styles.secondaryBtn} onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.secondaryBtnText}>Create a new account</Text>
            </Pressable>
          </Animated.View>

          {/* Skip / Guest */}
          <Pressable style={styles.skipBtn} onPress={async () => {
            await Auth.loginAsGuest();
            router.replace('/(auth)/onboarding');
          }}>
            <Text style={styles.skipText}>Continue as guest</Text>
            <Ionicons name="chevron-forward" size={12} color={Colors.textMuted} />
          </Pressable>

          {/* Brand note */}
          <Text style={styles.brandNote}>By TallowDermics™ · Science-backed ancestral skincare</Text>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  logoWrap: { alignItems: 'center', paddingTop: 48, paddingBottom: 32, gap: 10 },
  logoGrad: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C4622D', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
  logoMark: { fontSize: 34, color: '#fff' },
  appName: { fontSize: 28, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 },
  tagline: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic' },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    gap: 16,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  cardSub: { fontSize: 14, color: Colors.textSecondary, marginTop: -8 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#FCA5A5',
  },
  errorText: { fontSize: 13, color: '#DC2626', flex: 1 },

  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgElevated, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 14 },
  eyeBtn: { padding: 4 },

  primaryBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  primaryBtnGrad: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },

  secondaryBtn: {
    borderWidth: 1.5, borderColor: Colors.borderStrong,
    borderRadius: 16, paddingVertical: 15,
    alignItems: 'center', backgroundColor: 'rgba(196,98,45,0.04)',
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: Colors.primary },

  skipBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 20,
  },
  skipText: { fontSize: 13, color: Colors.textMuted },
  brandNote: {
    textAlign: 'center', fontSize: 11,
    color: Colors.textMuted, paddingBottom: 8,
  },
});
