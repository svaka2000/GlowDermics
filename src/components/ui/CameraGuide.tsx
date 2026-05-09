/**
 * CameraGuide — pre-capture face-frame overlay for the scan camera.
 *
 * Renders bottom→top:
 *   1. Soft inner glow inside the face oval
 *   2. Animated scan-line traveling top → bottom continuously (vertical sweep)
 *   3. SVG oval face-frame outline with subtle pulse
 *   4. Four corner brackets pulsing in/out
 *   5. Status text + hint copy
 *
 * Reanimated 4 worklets — runs on UI thread, no JS bridge per frame.
 * No camera-specific dependencies (face-detector etc.) — purely visual.
 */
import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Ellipse, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withRepeat, withSequence, withDelay,
  Easing as REasing,
  cancelAnimation,
  type SharedValue,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  /** Inner copy (state + hint). */
  title?: string;
  hint?: string;
  /** Override the oval width as % of screen width. Default 0.66 (264dp on 400dp). */
  ovalWidthPct?: number;
}

export function CameraGuide({
  title = 'Position your face in the frame',
  hint = 'Good lighting · Straight face · No glasses',
  ovalWidthPct = 0.66,
}: Props) {
  const ovalW = SCREEN_W * ovalWidthPct;
  const ovalH = ovalW * 1.28;

  // Scan-line sweep — travels top → bottom continuously
  const sweepY = useSharedValue(-1);
  // Pulsing opacity for the oval outline
  const ovalPulse = useSharedValue(0.65);
  // Corner brackets in/out pulse
  const cornerPulse = useSharedValue(0);
  // Glow breathing
  const glowPulse = useSharedValue(0.5);

  useEffect(() => {
    sweepY.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: REasing.inOut(REasing.cubic) }),
        withTiming(-1, { duration: 0 }),
      ),
      -1,
      false,
    );
    ovalPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: REasing.inOut(REasing.sin) }),
        withTiming(0.65, { duration: 1100, easing: REasing.inOut(REasing.sin) }),
      ),
      -1,
      false,
    );
    cornerPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: REasing.inOut(REasing.sin) }),
        withTiming(0, { duration: 900, easing: REasing.inOut(REasing.sin) }),
      ),
      -1,
      false,
    );
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: REasing.inOut(REasing.sin) }),
        withTiming(0.5, { duration: 1500, easing: REasing.inOut(REasing.sin) }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(sweepY);
      cancelAnimation(ovalPulse);
      cancelAnimation(cornerPulse);
      cancelAnimation(glowPulse);
    };
  }, []);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (sweepY.value * ovalH) / 2 }],
    opacity: 1 - Math.abs(sweepY.value) * 0.6, // fade at edges
  }));
  const ovalOutlineStyle = useAnimatedStyle(() => ({ opacity: ovalPulse.value }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowPulse.value }));

  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={[styles.ovalWrap, { width: ovalW, height: ovalH }]}>
        {/* Soft inner glow */}
        <Animated.View style={[StyleSheet.absoluteFillObject, glowStyle]}>
          <Svg width={ovalW} height={ovalH} viewBox={`0 0 ${ovalW} ${ovalH}`}>
            <Defs>
              <RadialGradient id="cg-glow" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#FFE8D4" stopOpacity="0.35" />
                <Stop offset="1" stopColor="#FFE8D4" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Ellipse cx={ovalW / 2} cy={ovalH / 2} rx={ovalW / 2 - 6} ry={ovalH / 2 - 6} fill="url(#cg-glow)" />
          </Svg>
        </Animated.View>

        {/* Oval outline */}
        <Animated.View style={[StyleSheet.absoluteFillObject, ovalOutlineStyle]}>
          <Svg width={ovalW} height={ovalH} viewBox={`0 0 ${ovalW} ${ovalH}`}>
            <Ellipse
              cx={ovalW / 2}
              cy={ovalH / 2}
              rx={ovalW / 2 - 4}
              ry={ovalH / 2 - 4}
              stroke="#FFFFFF"
              strokeWidth={2}
              strokeDasharray="6 8"
              fill="none"
            />
          </Svg>
        </Animated.View>

        {/* Scan line — gradient horizontal bar that sweeps vertically */}
        <Animated.View style={[styles.sweepWrap, { width: ovalW, top: ovalH / 2 - 14 }, sweepStyle]}>
          <LinearGradient
            colors={['rgba(255,232,212,0)', 'rgba(255,232,212,0.85)', 'rgba(255,232,212,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sweepBar}
          />
        </Animated.View>

        {/* Four corner brackets */}
        <CornerBracket position="tl" pulse={cornerPulse} ovalW={ovalW} ovalH={ovalH} />
        <CornerBracket position="tr" pulse={cornerPulse} ovalW={ovalW} ovalH={ovalH} />
        <CornerBracket position="bl" pulse={cornerPulse} ovalW={ovalW} ovalH={ovalH} />
        <CornerBracket position="br" pulse={cornerPulse} ovalW={ovalW} ovalH={ovalH} />
      </View>

      <View style={styles.copyWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
    </View>
  );
}

function CornerBracket({
  position, pulse, ovalW, ovalH,
}: {
  position: 'tl' | 'tr' | 'bl' | 'br';
  pulse: SharedValue<number>;
  ovalW: number;
  ovalH: number;
}) {
  const styleAnim = useAnimatedStyle(() => ({
    transform: [
      {
        scale: 1 + pulse.value * 0.15,
      },
    ],
    opacity: 0.8 + pulse.value * 0.2,
  }));

  // Corners sit on the bounding box of the oval, just outside.
  const offset = -10;
  const wrapStyle: any = { position: 'absolute' };
  if (position === 'tl') { wrapStyle.top = offset; wrapStyle.left = offset; }
  if (position === 'tr') { wrapStyle.top = offset; wrapStyle.right = offset; }
  if (position === 'bl') { wrapStyle.bottom = offset; wrapStyle.left = offset; }
  if (position === 'br') { wrapStyle.bottom = offset; wrapStyle.right = offset; }

  return (
    <Animated.View style={[wrapStyle, styleAnim]}>
      <View style={[
        styles.bracket,
        position === 'tl' && { borderTopLeftRadius: 4, borderTopWidth: 3, borderLeftWidth: 3 },
        position === 'tr' && { borderTopRightRadius: 4, borderTopWidth: 3, borderRightWidth: 3 },
        position === 'bl' && { borderBottomLeftRadius: 4, borderBottomWidth: 3, borderLeftWidth: 3 },
        position === 'br' && { borderBottomRightRadius: 4, borderBottomWidth: 3, borderRightWidth: 3 },
      ]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ovalWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sweepWrap: {
    position: 'absolute',
    height: 28,
    overflow: 'hidden',
  },
  sweepBar: {
    height: 2,
    width: '100%',
    marginTop: 12,
  },
  bracket: {
    width: 22,
    height: 22,
    borderColor: '#FFE8D4',
  },
  copyWrap: {
    marginTop: 32,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  hint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
