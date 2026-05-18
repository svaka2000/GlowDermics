import { Platform, View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const PHONE_W = 393;
const PHONE_H = 852;
const BEZEL = 14;
const RADIUS = 48;

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const { width: winW, height: winH } = useWindowDimensions();

  if (Platform.OS !== 'web' || winW < 500) {
    return <>{children}</>;
  }

  // Scale phone to fit viewport with some padding
  const scaleH = (winH - 48) / PHONE_H;
  const scaleW = (winW * 0.5) / PHONE_W;
  const scale = Math.min(1, scaleH, scaleW);

  const frameW = Math.round(PHONE_W * scale);
  const frameH = Math.round(PHONE_H * scale);

  return (
    <View style={styles.desktop}>
      {/* Background */}
      <LinearGradient
        colors={['#0E0C1A', '#1A1230', '#0A1628', '#0E0C1A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {/* Decorative ambient glows */}
      <View style={[styles.glow, { top: -100, left: -80, width: 500, height: 500, backgroundColor: 'rgba(138,120,96,0.06)' }]} />
      <View style={[styles.glow, { bottom: -80, right: -60, width: 400, height: 400, backgroundColor: 'rgba(100,60,200,0.05)' }]} />

      {/* Grid lines */}
      <View style={[styles.grid, { borderColor: 'rgba(255,255,255,0.025)' }]} />

      {/* Brand watermark */}
      <View style={styles.watermark}>
        <View style={styles.watermarkDot} />
      </View>

      {/* Phone device */}
      <View style={[styles.deviceShadow, { width: frameW + 6, height: frameH + 8 }]}>
        <View style={[
          styles.deviceBody,
          { width: frameW, height: frameH, borderRadius: RADIUS * scale }
        ]}>
          {/* Left buttons */}
          <View style={[styles.btnVolUp, { top: Math.round(140 * scale), left: -3 * scale, height: Math.round(34 * scale), borderRadius: 2 * scale }]} />
          <View style={[styles.btnVolDown, { top: Math.round(186 * scale), left: -3 * scale, height: Math.round(34 * scale), borderRadius: 2 * scale }]} />
          <View style={[styles.btnSilent, { top: Math.round(96 * scale), left: -3 * scale, height: Math.round(26 * scale), borderRadius: 2 * scale }]} />
          {/* Right button */}
          <View style={[styles.btnPower, { top: Math.round(156 * scale), right: -3 * scale, height: Math.round(58 * scale), borderRadius: 2 * scale }]} />

          {/* Screen */}
          <View style={[
            styles.screen,
            { borderRadius: (RADIUS - 4) * scale, margin: BEZEL * scale, overflow: 'hidden' }
          ]}>
            {children}
          </View>

          {/* Dynamic island / notch */}
          <View style={[
            styles.island,
            {
              top: Math.round(10 * scale),
              width: Math.round(120 * scale),
              height: Math.round(32 * scale),
              borderRadius: Math.round(20 * scale),
            }
          ]}>
            <View style={[styles.islandCamera, { width: Math.round(10 * scale), height: Math.round(10 * scale), borderRadius: Math.round(5 * scale) }]} />
          </View>

          {/* Home indicator */}
          <View style={[
            styles.homeBar,
            {
              bottom: Math.round(8 * scale),
              width: Math.round(120 * scale),
              height: Math.round(5 * scale),
              borderRadius: Math.round(3 * scale),
            }
          ]} />
        </View>
      </View>

      {/* Device label */}
      <View style={styles.deviceLabel}>
        <View style={styles.deviceLabelDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  desktop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    borderRadius: 300,
  },
  grid: {
    position: 'absolute',
    inset: 0,
  },
  watermark: {
    position: 'absolute',
    bottom: 16,
    alignItems: 'center',
  },
  watermarkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  deviceShadow: {
    borderRadius: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
    elevation: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceBody: {
    backgroundColor: '#1C1C1E',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  screen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F0EA',
  },
  island: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#000',
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 8,
  },
  islandCamera: {
    backgroundColor: '#1A3A2A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  homeBar: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  btnVolUp: {
    position: 'absolute',
    width: 3,
    backgroundColor: '#2A2A2E',
  },
  btnVolDown: {
    position: 'absolute',
    width: 3,
    backgroundColor: '#2A2A2E',
  },
  btnSilent: {
    position: 'absolute',
    width: 3,
    backgroundColor: '#2A2A2E',
  },
  btnPower: {
    position: 'absolute',
    width: 3,
    backgroundColor: '#2A2A2E',
  },
  deviceLabel: {
    marginTop: 20,
    alignItems: 'center',
  },
  deviceLabelDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
