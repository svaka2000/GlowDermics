import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
  Alert, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';
import { Auth } from '../../src/services/auth';
import { analyzeSkin } from '../../src/services/skinAnalysis';
import { preflightPhotoQuality, mergePhotoQuality } from '../../src/services/photoQuality';
import { PremiumGate, PremiumBanner } from '../../src/components/PremiumGate';
import { ScannerOverlay } from '../../src/components/ui';

type Mode = 'choose' | 'camera' | 'analyzing';

export default function Scan() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [mode, setMode] = useState<Mode>('choose');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [scanInfo, setScanInfo] = useState<{ used: number; limit: number; isPremium: boolean } | null>(null);
  const [showGate, setShowGate] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const isCapturing = useRef(false);

  // Step-reveal sequencer — overlay animations now live in <ScannerOverlay /> on Reanimated 4 worklets.
  useEffect(() => {
    if (mode !== 'analyzing') {
      setCompletedSteps([]);
      return;
    }
    const STEP_DELAYS = [800, 2600, 4400, 6200];
    const timers = STEP_DELAYS.map((delay, i) =>
      setTimeout(() => setCompletedSteps(prev => [...prev, i]), delay)
    );
    return () => { timers.forEach(clearTimeout); };
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

    return (
      <View style={styles.root}>
        <ScannerOverlay imageUri={capturedUri} height={300} />

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
                        ? <ActivityIndicator size="small" color={colors.primary} />
                        : <Ionicons name={s.icon as any} size={12} color={colors.textMuted} />
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
      </View>
    );
  }

  if (mode === 'camera') {
    return (
      <View style={styles.root}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front">
          <SafeAreaView style={styles.cameraUi}>
            <Pressable style={styles.backBtn} onPress={() => setMode('choose')}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
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
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
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
              <LinearGradient colors={[colors.primaryLight, colors.primary]} style={styles.heroIconGrad}>
                <Ionicons name="scan" size={40} color={colors.white} />
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
                <Ionicons name={icon as any} size={16} color={colors.primary} />
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
                colors={[colors.primaryLight, colors.primary]}
                style={styles.mainBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Ionicons name="camera" size={22} color={colors.white} />
                <Text style={styles.mainBtnText}>Take a Selfie</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.secondaryBtn} onPress={handlePickPhoto}>
              <Ionicons name="images-outline" size={20} color={colors.primary} />
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

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    safe: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 14,
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: c.textPrimary },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    content: { paddingHorizontal: 24, paddingBottom: 40 },
    heroSection: { alignItems: 'center', paddingVertical: 32, position: 'relative' },
    heroGlow: {
      position: 'absolute', top: 0, left: '10%', right: '10%',
      height: 120, borderRadius: 60,
    },
    heroIconWrap: { borderRadius: 28, overflow: 'hidden', marginBottom: 20 },
    heroIconGrad: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center', borderRadius: 28 },
    heroTitle: { fontSize: 26, fontWeight: '800', color: c.textPrimary, marginBottom: 10 },
    heroSub: { fontSize: 15, color: c.textSecondary, textAlign: 'center', lineHeight: 23, maxWidth: 300 },
    tipsCard: {
      backgroundColor: c.bgCard, borderRadius: 18,
      borderWidth: 1, borderColor: c.border, padding: 20,
      marginBottom: 28, gap: 12,
    },
    tipsTitle: { fontSize: 14, fontWeight: '700', color: c.textPrimary, marginBottom: 4 },
    tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    tipText: { fontSize: 14, color: c.textSecondary },
    btnGroup: { gap: 12, marginBottom: 20 },
    mainBtn: { borderRadius: 18, overflow: 'hidden' },
    mainBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 20 },
    mainBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
    secondaryBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 10, paddingVertical: 18,
      borderRadius: 18, borderWidth: 1.5, borderColor: c.borderStrong,
      backgroundColor: c.primary + '0D',
    },
    secondaryBtnText: { fontSize: 16, fontWeight: '600', color: c.primary },
    disclaimer: { fontSize: 11, color: c.textMuted, textAlign: 'center', lineHeight: 17 },
    // analyzing — always uses dark surfaces (overlay over photo) regardless of theme
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
    stepIconActive: { borderColor: c.primary, backgroundColor: c.primary + '26' },
    stepIconDone: { backgroundColor: c.scoreExcellent, borderColor: c.scoreExcellent },
    analyzingStepText: { fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
    stepTextActive: { color: c.primary, fontWeight: '600' },
    stepTextDone: { color: 'rgba(255,255,255,0.6)' },
    // camera — always over a live camera feed, theme-agnostic
    cameraUi: { flex: 1, justifyContent: 'space-between', padding: 24 },
    cameraGuide: { alignItems: 'center' },
    guideFrame: {
      width: 240, height: 300, borderRadius: 120,
      borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
      borderStyle: 'dashed', marginBottom: 16,
    },
    guideText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' },
    guideHint: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
    captureBtn: {
      alignSelf: 'center', width: 76, height: 76, borderRadius: 38,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 3, borderColor: '#FFFFFF',
    },
    captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF' },
  });
}
