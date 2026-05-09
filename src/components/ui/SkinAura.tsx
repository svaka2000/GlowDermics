/**
 * SkinAura — procedural watercolor-like aura unique to each user.
 *
 * Generates 5 overlapping radial-gradient blobs in a single SVG. Position,
 * size, and color are deterministically derived from the user's persona, glow
 * score, and total scans — so two users with the same scores get the same
 * aura, but most users will get something visually unique.
 *
 * Subtle breathing animation rendered via React Native Animated wrapping
 * a single SkiaCanvas-equivalent SVG that uses CSS-style transforms.
 *
 * Used as a hero element above the SkinIdentityCard.
 */
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Ellipse, Rect, G } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withTiming, withRepeat, withSequence,
  Easing as REasing,
} from 'react-native-reanimated';
import type { SkinIdentity } from '../../engine/SkinIdentityEngine';

interface BlobSpec {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  color: string;
  opacity: number;
  phase: number;
  rotation: number;
}

interface Props {
  identity: SkinIdentity;
  width: number;
  height: number;
}

function seededRandom(seed: string, salt: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  h ^= salt;
  h = (h * 16777619) >>> 0;
  return (h % 10000) / 10000;
}

function buildBlobs(identity: SkinIdentity, width: number, height: number): BlobSpec[] {
  const seed = `${identity.persona}|${identity.element}|${identity.glowScore}|${identity.totalScans}`;
  const accent = identity.colorway.accent;
  const tint = identity.colorway.tint;
  const grad0 = identity.colorway.gradient[0];
  const grad1 = identity.colorway.gradient[1];

  const whiteBlend = Math.max(0.2, identity.glowScore / 100);

  const palette: { color: string; weight: number }[] = [
    { color: accent, weight: 1 },
    { color: grad0, weight: 0.85 },
    { color: grad1, weight: 0.85 },
    { color: tint, weight: 0.7 },
    { color: '#FFFFFF', weight: whiteBlend },
  ];

  const blobs: BlobSpec[] = [];
  for (let i = 0; i < 5; i++) {
    const r0 = seededRandom(seed, i * 7 + 1);
    const r1 = seededRandom(seed, i * 7 + 2);
    const r2 = seededRandom(seed, i * 7 + 3);
    const r3 = seededRandom(seed, i * 7 + 4);
    const r4 = seededRandom(seed, i * 7 + 5);

    const colorPick = palette[i % palette.length];

    blobs.push({
      cx: width * (0.18 + r0 * 0.64),
      cy: height * (0.20 + r1 * 0.60),
      rx: width * (0.30 + r2 * 0.18),
      ry: height * (0.40 + r3 * 0.30),
      color: colorPick.color,
      opacity: 0.22 + colorPick.weight * 0.32 + r4 * 0.08,
      phase: r0,
      rotation: r1 * 60 - 30,
    });
  }
  return blobs;
}

export function SkinAura({ identity, width, height }: Props) {
  const blobs = useMemo(
    () => buildBlobs(identity, width, height),
    [identity.persona, identity.glowScore, identity.totalScans, width, height],
  );

  return (
    <View style={[styles.wrap, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          {blobs.map((b, i) => (
            <RadialGradient
              key={`gr-${i}`}
              id={`aura-grad-${i}`}
              cx="50%" cy="50%" r="50%"
            >
              <Stop offset="0" stopColor={b.color} stopOpacity={b.opacity.toFixed(3)} />
              <Stop offset="0.6" stopColor={b.color} stopOpacity={(b.opacity * 0.5).toFixed(3)} />
              <Stop offset="1" stopColor={b.color} stopOpacity="0" />
            </RadialGradient>
          ))}
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill={identity.colorway.tint + '14'} />
        {blobs.map((b, i) => (
          <G key={`g-${i}`} transform={`rotate(${b.rotation} ${b.cx} ${b.cy})`}>
            <Ellipse cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill={`url(#aura-grad-${i})`} />
          </G>
        ))}
      </Svg>
      <BreathingScrim phase={blobs[0]?.phase ?? 0} />
    </View>
  );
}

/** Subtle "breathing" surface tint that sits over the static aura,
 *  giving it a living quality without re-rendering 5 ellipses every frame. */
function BreathingScrim({ phase }: { phase: number }) {
  const op = useSharedValue(0);
  useEffect(() => {
    const dur = 1800 + Math.floor(phase * 1000);
    op.value = withRepeat(
      withSequence(
        withTiming(0.10, { duration: dur, easing: REasing.inOut(REasing.sin) }),
        withTiming(0.0, { duration: dur, easing: REasing.inOut(REasing.sin) }),
      ),
      -1,
      false,
    );
  }, [phase]);
  const s = useAnimatedStyle(() => ({
    opacity: op.value,
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.5)' }, s]} pointerEvents="none" />
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderRadius: 24,
  },
});
