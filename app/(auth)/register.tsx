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

export default function Register() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const shakeX = useRef(new Animated.Value(0)).current;

  const shake = () =>
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();

  const validate = () => {
    if (!name.trim() || name.trim().length < 2) return 'Please enter your name.';
    if (!email.includes('@') || !email.includes('.')) return 'Please enter a valid email.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  };

  const handleRegister = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); shake(); return; }
    setLoading(true);
    setError('');
    try {
      await Auth.register(name.trim(), email.trim(), password);
      // Go to onboarding to set skin profile
      router.replace('/(auth)/onboarding');
    } catch (e: any) {
      setError(e.message || 'Registration failed. Please try again.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;

  const strengthColor = ['transparent', '#F87171', '#FCD34D', '#60A5FA', '#4ADE80'][strength];
  const strengthLabel = ['', 'Too short', 'Weak', 'Good', 'Strong'][strength];

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/login' as any)}>
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.topSection}>
            <LinearGradient
              colors={['#E8834A', '#C4622D', '#9E4D22']}
              style={styles.logoGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoMark}>✦</Text>
            </LinearGradient>
            <Text style={styles.pageTitle}>Create your account</Text>
            <Text style={styles.pageSub}>Join thousands tracking their skin health</Text>
          </View>

          {/* Free tier badge */}
          <View style={styles.freeBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
            <Text style={styles.freeBadgeText}>Free forever · No credit card needed</Text>
          </View>

          <Animated.View style={[styles.card, { transform: [{ translateX: shakeX }] }]}>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={14} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Name */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Your name</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={16} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="First name or nickname"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
            </View>

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
                  placeholder="Min 6 characters"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPw}
                />
                <Pressable onPress={() => setShowPw(p => !p)} style={styles.eyeBtn}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={16} color={Colors.textMuted} />
                </Pressable>
              </View>
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  {[1, 2, 3, 4].map(i => (
                    <View key={i} style={[styles.strengthBar, { backgroundColor: i <= strength ? strengthColor : Colors.border }]} />
                  ))}
                  <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
                </View>
              )}
            </View>

            {/* Confirm password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Confirm password</Text>
              <View style={[styles.inputWrap, confirm && confirm !== password && { borderColor: '#FCA5A5' }]}>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Repeat password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPw}
                />
                {confirm.length > 0 && (
                  <Ionicons
                    name={confirm === password ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={confirm === password ? '#16A34A' : '#DC2626'}
                  />
                )}
              </View>
            </View>

            {/* Create account */}
            <Pressable style={styles.primaryBtn} onPress={handleRegister} disabled={loading}>
              <LinearGradient
                colors={['#E8834A', '#C4622D']}
                style={styles.primaryBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.primaryBtnText}>Create Account →</Text>
                }
              </LinearGradient>
            </Pressable>

            <Text style={styles.termsNote}>
              By creating an account you agree to our Terms of Service and Privacy Policy.
            </Text>
          </Animated.View>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginRowText}>Already have an account?</Text>
            <Pressable onPress={() => router.replace('/(auth)/login' as any)}>
              <Text style={styles.loginLink}> Sign In</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  header: { paddingTop: 8, paddingBottom: 8 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  topSection: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  logoGrad: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C4622D', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  logoMark: { fontSize: 28, color: '#fff' },
  pageTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  pageSub: { fontSize: 13, color: Colors.textSecondary },

  freeBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, paddingHorizontal: 16,
    backgroundColor: '#F0FDF4', borderRadius: 20, borderWidth: 1, borderColor: '#86EFAC',
    alignSelf: 'center', marginBottom: 20,
  },
  freeBadgeText: { fontSize: 12, color: '#16A34A', fontWeight: '600' },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    gap: 16,
  },

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

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 10, fontWeight: '700', width: 50, textAlign: 'right' },

  primaryBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  primaryBtnGrad: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  termsNote: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 17 },

  loginRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 20 },
  loginRowText: { fontSize: 13, color: Colors.textSecondary },
  loginLink: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
});
