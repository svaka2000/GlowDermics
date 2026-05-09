import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
  Alert, Image, ScrollView, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import { Auth } from '../../src/services/auth';
import { analyzeSkin } from '../../src/services/skinAnalysis';
import { preflightPhotoQuality, mergePhotoQuality } from '../../src/services/photoQuality';
import { PremiumGate, PremiumBanner } from '../../src/components/PremiumGate';

type Mode = 'choose' | 'camera' | 'analyzing';

export default function Scan() {
  const [mode, setMode] = useState<Mode>('choose');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [scanInfo, setScanInfo] = useState<{ used: number; limit: number; isPremium: boolean } | null>(null);
  const [showGate, setShowGate] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const isCapturing = useRef(false);

  // Animation values
  const scanLineY = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.85)).current;
  const overlayFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (mode !== 'analyzing') {
      setCompletedSteps([]);
      return;
    }

    // Fade in overlay
    Animated.timing(overlayFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    // Scanning line loop
    const lineAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(scanLineY, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    lineAnim.start();

    // Glow pulse
    const glowAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.9, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.3, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    glowAnim.start();

    // Outer ring rotate
    const rotateAnim = Animated.loop(
      Animated.timing(ringRotate, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    );
    rotateAnim.start();

    // Ring breathe
    const scaleAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(ringScale, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(ringScale, { toValue: 0.85, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    scaleAnim.start();

    // Sequential step reveals
    const STEP_DELAYS = [800, 2600, 4400, 6200];
    const timers = STEP_DELAYS.map((delay, i) =>
      setTimeout(() => setCompletedSteps(prev => [...prev, i]), delay)
    );

    return () => {
      lineAnim.stop(); glowAnim.stop(); rotateAnim.stop(); scaleAnim.stop();
      timers.forEach(clearTimeout);
    };
  }, [mode]);

  useEffect(() => {
    (async () => {
      const user = await Auth.getCurrentUser();
      if (!user) return;
      const { used, limit } = await Auth.canScan();
      setScanInfo({ used, limit, isPremium: user.isPremium });
    })();
  }, []);

  const checkScanLimit = async (): Promise<boolean> => {
    try {
      const { allowed, used, limit } = await Auth.canScan();
      const user = await Auth.getCurrentUser();
      setScanInfo({ used, limit, isPremium: user?.isPremium ?? false });
      if (!allowed) { setShowGate(true); return false; }
      return true;
    } catch {
      return true; // don't block scanning on a limit-check error
    }
  };

  const handlePickPhoto = async () => {
    try {
      if (!(await checkScanLimit())) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCapturedUri(asset.uri);
        const mime = (asset.mimeType === 'image/png') ? 'image/png' : 'image/jpeg';
        await runAnalysis(asset.uri, asset.base64 ?? null, mime);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not open photo library.');
    }
  };

  const handleOpenCamera = async () => {
    try {
      if (!(await checkScanLimit())) return;
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          Alert.alert('Camera Permission Needed', 'Go to Settings → GlowDermics → Camera and enable access, then try again.');
          return;
        }
      }
      setMode('camera');
    } catch (err: any) {
      Alert.alert('Camera Error', err?.message || 'Could not open camera.');
    }
  };

  const handleCapture = async () => {
    if (isCapturing.current) return; // prevent double-tap
    try {
      if (!cameraRef.current) return;
      isCapturing.current = true;
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: true });
      if (photo) {
        setCapturedUri(photo.uri);
        await runAnalysis(photo.uri, photo.base64 ?? null, 'image/jpeg');
      }
    } catch (err: any) {
      // Camera unmounted means user navigated away — not a user-facing error
      if (err?.message?.toLowerCase().includes('unmounted')) return;
      Alert.alert('Capture Error', err?.message || 'Could not take photo. Try uploading from gallery instead.');
      setMode('choose');
    } finally {
      isCapturing.current = false;
    }
  };

  const runAnalysis = async (uri: string, inlineBase64: string | null, mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg') => {
    setMode('analyzing');
    try {
      const profile = await Storage.getUserProfile();

      let base64 = inlineBase64;

      // Strip data URI prefix if ImagePicker returned a full data URL
      if (base64 && base64.includes(';base64,')) {
        base64 = base64.split(';base64,')[1];
      }

      // Fallback for native: read from filesystem
      if (!base64 && Platform.OS !== 'web') {
        base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64' as any,
        });
      }

      // Fallback for web: fetch the blob/data URL and convert to base64
      if (!base64 && Platform.OS === 'web') {
        const resp = await fetch(uri);
        const blob = await resp.blob();
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new (window as any).FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            resolve(dataUrl.split(';base64,')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      if (!base64) {
        throw new Error('Could not read image data. Please try uploading again.');
      }

      // v2 pre-flight: cheap client-side quality check before burning an API call.
      const preflight = preflightPhotoQuality({ base64, mimeType });
      if (!preflight.ok) {
        const tips = preflight.recommendations?.length
          ? '\n\n' + preflight.recommendations.map(t => '• ' + t).join('\n')
          : '';
        Alert.alert(
          'Photo quality too low',
          (preflight.warning ?? 'The photo looks unclear. Please retake.') + tips,
          [{ text: 'Try Again', onPress: () => setMode('choose') }],
        );
        return;
      }

      const analysis = await analyzeSkin(base64, mimeType, profile);
      analysis.imageUri = uri;
      analysis.photoQuality = mergePhotoQuality(preflight, analysis.photoQuality);

      await Auth.recordScan();
      await Storage.saveAnalysis(analysis);
      router.replace(`/results/${analysis.id}`);
    } catch (err: any) {
      Alert.alert('Analysis Failed', err?.message || 'Something went wrong. Please try again.');
      setMode('choose');
    }
  };

  if (mode === 'analyzing') {
    const STEPS = [
      { label: 'Mapping facial regions', icon: 'scan-outline' },
      { label: 'Extracting 16 biomarkers', icon: 'pulse-outline' },
      { label: 'Estimating skin age', icon: 'hourglass-outline' },
      { label: 'Building your routine', icon: 'list-outline' },
    ];
    const IMAGE_H = 300;
    const scanLineTranslate = scanLineY.interpolate({ inputRange: [0, 1], outputRange: [0, IMAGE_H - 4] });
    const ringRotateDeg = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    return (
      <Animated.View style={[styles.root, { opacity: overlayFade }]}>
        {/* Face photo — full bleed */}
        <View style={styles.analyzingPhotoWrap}>
          {capturedUri ? (
            <Image source={{ uri: capturedUri }} style={styles.analyzingPhoto} />
          ) : (
            <View style={[styles.analyzingPhoto, { backgroundColor: '#1C1814' }]} />
          )}

          {/* Dark gradient bottom fade */}
          <LinearGradient
            colors={['transparent', 'rgba(10,8,6,0.92)']}
            style={[StyleSheet.absoluteFillObject, { top: IMAGE_H * 0.4 }]}
          />

          {/* Scanning line */}
          <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineTranslate }] }]}>
            <LinearGradient
              colors={['transparent', Colors.primary, 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>

          {/* Corner brackets */}
          <View style={[styles.bracket, styles.bracketTL]} />
          <View style={[styles.bracket, styles.bracketTR]} />
          <View style={[styles.bracket, styles.bracketBL]} />
          <View style={[styles.bracket, styles.bracketBR]} />

          {/* Pulsing glow ring around face */}
          <Animated.View style={[styles.glowRingWrap, { transform: [{ scale: ringScale }, { rotate: ringRotateDeg }] }]}>
            <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />
          </Animated.View>

          {/* Scanning badge */}
          <View style={styles.scanBadge}>
            <View style={styles.scanBadgeDot} />
            <Text style={styles.scanBadgeText}>AI SCANNING</Text>
          </View>
        </View>

        {/* Analysis steps */}
        <View style={styles.analyzingBottom}>
          <Text style={styles.analyzingTitle}>Reading your skin…</Text>
          <View style={styles.analyzingSteps}>
            {STEPS.map((s, i) => {
              const done = completedSteps.includes(i);
              const active = completedSteps.length === i;
              return (
                <View key={s.label} style={styles.analyzingStep}>
                  <View style={[
                    styles.stepIconWrap,
                    done && styles.stepIconDone,
                    active && styles.stepIconActive,
                  ]}>
                    {done
                      ? <Ionicons name="checkmark" size={12} color="#fff" />
                      : active
                        ? <ActivityIndicator size="small" color={Colors.primary} />
                        : <Ionicons name={s.icon as any} size={12} color={Colors.textMuted} />
                    }
                  </View>
                  <Text style={[
                    styles.analyzingStepText,
                    done && styles.stepTextDone,
                    active && styles.stepTextActive,
                  ]}>
                    {s.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </Animated.View>
    );
  }

  if (mode === 'camera') {
    return (
      <View style={styles.root}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front">
          <SafeAreaView style={styles.cameraUi}>
            <Pressable style={styles.backBtn} onPress={() => setMode('choose')}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </Pressable>
            <View style={styles.cameraGuide}>
              <View style={styles.guideFrame} />
              <Text style={styles.guideText}>Position your face in the frame</Text>
              <Text style={styles.guideHint}>Good lighting · Straight face · No glasses</Text>
            </View>
            <Pressable style={styles.captureBtn} onPress={handleCapture}>
              <View style={styles.captureInner} />
            </Pressable>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <PremiumGate
        visible={showGate}
        onClose={() => setShowGate(false)}
        feature="skin scans"
        reason={scanInfo ? `You've used ${scanInfo.used}/${scanInfo.limit} free scans this month` : undefined}
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Skin Scan</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.heroSection}>
            <LinearGradient
              colors={['rgba(196,98,45,0.12)', 'transparent']}
              style={styles.heroGlow}
            />
            <View style={styles.heroIconWrap}>
              <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.heroIconGrad}>
                <Ionicons name="scan" size={40} color={Colors.white} />
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>AI Skin Analysis</Text>
            <Text style={styles.heroSub}>
              16 clinical dimensions, regional heat-map, biomarker signals, and an estimated skin age — plus a personalized routine built for your skin.
            </Text>
          </View>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>For best results</Text>
            {[
              { icon: 'sunny-outline', tip: 'Natural or bright even lighting' },
              { icon: 'remove-circle-outline', tip: 'No makeup or heavy filters' },
              { icon: 'glasses-outline', tip: 'Remove glasses' },
              { icon: 'person-circle-outline', tip: 'Face centered, looking straight' },
            ].map(({ icon, tip }) => (
              <View key={tip} style={styles.tipRow}>
                <Ionicons name={icon as any} size={16} color={Colors.primary} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {scanInfo && !scanInfo.isPremium && scanInfo.used >= 2 && (
            <PremiumBanner
              message={`${scanInfo.used}/${scanInfo.limit} free scans used this month`}
              onUpgrade={() => setShowGate(true)}
            />
          )}

          <View style={styles.btnGroup}>
            <Pressable style={styles.mainBtn} onPress={handleOpenCamera}>
              <LinearGradient
                colors={[Colors.primaryLight, Colors.primary]}
                style={styles.mainBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Ionicons name="camera" size={22} color={Colors.white} />
                <Text style={styles.mainBtnText}>Take a Selfie</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.secondaryBtn} onPress={handlePickPhoto}>
              <Ionicons name="images-outline" size={20} color={Colors.primary} />
              <Text style={styles.secondaryBtnText}>Upload from Gallery</Text>
            </Pressable>
          </View>

          <Text style={styles.disclaimer}>
            Your photos are processed securely and never stored on our servers.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  heroSection: { alignItems: 'center', paddingVertical: 32, position: 'relative' },
  heroGlow: {
    position: 'absolute', top: 0, left: '10%', right: '10%',
    height: 120, borderRadius: 60,
  },
  heroIconWrap: { borderRadius: 28, overflow: 'hidden', marginBottom: 20 },
  heroIconGrad: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center', borderRadius: 28 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  heroSub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 23, maxWidth: 300 },
  tipsCard: {
    backgroundColor: Colors.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border, padding: 20,
    marginBottom: 28, gap: 12,
  },
  tipsTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipText: { fontSize: 14, color: Colors.textSecondary },
  btnGroup: { gap: 12, marginBottom: 20 },
  mainBtn: { borderRadius: 18, overflow: 'hidden' },
  mainBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 20 },
  mainBtnText: { fontSize: 17, fontWeight: '700', color: Colors.white },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18,
    borderRadius: 18, borderWidth: 1.5, borderColor: Colors.borderStrong,
    backgroundColor: 'rgba(196,98,45,0.05)',
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '600', color: Colors.primary },
  disclaimer: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 17 },
  // analyzing — new animated version
  analyzingPhotoWrap: { height: 300, position: 'relative', overflow: 'hidden' },
  analyzingPhoto: { width: '100%', height: 300 },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 3,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 8,
  },
  bracket: {
    position: 'absolute', width: 20, height: 20,
    borderColor: Colors.primary, borderWidth: 2.5,
  },
  bracketTL: { top: 16, left: 16, borderBottomWidth: 0, borderRightWidth: 0 },
  bracketTR: { top: 16, right: 16, borderBottomWidth: 0, borderLeftWidth: 0 },
  bracketBL: { bottom: 16, left: 16, borderTopWidth: 0, borderRightWidth: 0 },
  bracketBR: { bottom: 16, right: 16, borderTopWidth: 0, borderLeftWidth: 0 },
  glowRingWrap: {
    position: 'absolute', top: '50%', left: '50%',
    marginTop: -70, marginLeft: -70,
  },
  glowRing: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 2, borderColor: Colors.primary,
    borderStyle: 'dashed',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 12,
  },
  scanBadge: {
    position: 'absolute', top: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(10,8,6,0.75)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(196,98,45,0.4)',
  },
  scanBadgeDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 4,
  },
  scanBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.primary, letterSpacing: 1.5 },
  analyzingBottom: {
    flex: 1, backgroundColor: '#0D0B09',
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16,
  },
  analyzingTitle: { fontSize: 19, fontWeight: '800', color: '#FFFFFF', marginBottom: 16 },
  analyzingSteps: { gap: 14 },
  analyzingStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepIconActive: { borderColor: Colors.primary, backgroundColor: 'rgba(196,98,45,0.15)' },
  stepIconDone: { backgroundColor: Colors.scoreExcellent, borderColor: Colors.scoreExcellent },
  analyzingStepText: { fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
  stepTextActive: { color: Colors.primary, fontWeight: '600' },
  stepTextDone: { color: 'rgba(255,255,255,0.6)' },
  // camera
  cameraUi: { flex: 1, justifyContent: 'space-between', padding: 24 },
  cameraGuide: { alignItems: 'center' },
  guideFrame: {
    width: 240, height: 300, borderRadius: 120,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed', marginBottom: 16,
  },
  guideText: { fontSize: 16, fontWeight: '600', color: Colors.white, textAlign: 'center' },
  guideHint: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  captureBtn: {
    alignSelf: 'center', width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.white,
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.white },
});
