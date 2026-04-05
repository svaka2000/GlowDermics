import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
  Alert, Image, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import { analyzeSkin } from '../../src/services/skinAnalysis';

type Mode = 'choose' | 'camera' | 'analyzing';

export default function Scan() {
  const [mode, setMode] = useState<Mode>('choose');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      setCapturedUri(result.assets[0].uri);
      await runAnalysis(result.assets[0].uri);
    }
  };

  const handleOpenCamera = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Camera Permission', 'Camera access is needed to scan your skin.');
        return;
      }
    }
    setMode('camera');
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (photo) {
      setCapturedUri(photo.uri);
      await runAnalysis(photo.uri);
    }
  };

  const runAnalysis = async (uri: string) => {
    setMode('analyzing');
    try {
      const profile = await Storage.getUserProfile();

      // Read image as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const analysis = await analyzeSkin(base64, 'image/jpeg', profile);
      analysis.imageUri = uri;

      await Storage.saveAnalysis(analysis);
      router.replace(`/results/${analysis.id}`);
    } catch (err: any) {
      Alert.alert('Analysis Failed', err?.message || 'Something went wrong. Please try again.');
      setMode('choose');
    }
  };

  if (mode === 'analyzing') {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.analyzingWrap}>
          {capturedUri && (
            <Image source={{ uri: capturedUri }} style={styles.analyzingPreview} blurRadius={4} />
          )}
          <View style={styles.analyzingOverlay}>
            <View style={styles.analyzingCard}>
              <ActivityIndicator color={Colors.primary} size="large" style={{ marginBottom: 20 }} />
              <Text style={styles.analyzingTitle}>Analyzing your skin…</Text>
              <Text style={styles.analyzingSub}>Our AI is scanning texture, hydration, clarity, evenness, firmness, and pore health.</Text>
              <View style={styles.analyzingSteps}>
                {['Detecting skin regions', 'Measuring hydration markers', 'Scoring texture & clarity', 'Building your routine'].map(s => (
                  <View key={s} style={styles.analyzingStep}>
                    <View style={styles.analyzingDot} />
                    <Text style={styles.analyzingStepText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
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
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
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
              Get scores for hydration, texture, clarity, evenness, firmness, and pores — plus a personalized routine built for your skin.
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
  // analyzing
  analyzingWrap: { flex: 1 },
  analyzingPreview: { ...StyleSheet.absoluteFillObject },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.88)',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  analyzingCard: {
    backgroundColor: Colors.bgCard, borderRadius: 24,
    borderWidth: 1, borderColor: Colors.border, padding: 28,
    width: '100%', alignItems: 'center',
  },
  analyzingTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10, textAlign: 'center' },
  analyzingSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  analyzingSteps: { width: '100%', gap: 12 },
  analyzingStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  analyzingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  analyzingStepText: { fontSize: 13, color: Colors.textSecondary },
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
