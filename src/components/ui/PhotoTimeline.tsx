import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Image, Pressable, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from '../../state/theme';
import type { Palette } from '../../constants/colors';
import { Radii } from '../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface TimelineFrame {
  /** Image URI for this frame. Required — frames without an image are filtered out by the parent. */
  uri: string;
  /** ISO date string. */
  date: string;
  /** Overall skin score 0–100. */
  score: number;
  /** Optional skin type for the badge. */
  skinType?: string;
}

interface PhotoTimelineProps {
  frames: TimelineFrame[];
  /** Square width. Defaults to 320. */
  width?: number;
  /** Auto-advance frames after mount. Default true. */
  autoPlay?: boolean;
  /** Milliseconds per frame at 1× speed. Default 1500. */
  framesMs?: number;
  /** Called whenever the active frame changes (debounced). */
  onFrameChange?: (index: number) => void;
}

type Speed = 0.5 | 1 | 2 | 4;
const SPEED_OPTIONS: Speed[] = [0.5, 1, 2, 4];

function scoreColor(score: number, palette: Palette): string {
  if (score >= 80) return palette.scoreExcellent;
  if (score >= 65) return palette.scoreGood;
  if (score >= 50) return palette.scoreFair;
  return palette.scorePoor;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * PhotoTimeline — animated transformation player for a sequence of scan
 * photos. Smooth crossfade between adjacent frames, animated score ring
 * that ticks up as frames advance, scrubbable timeline ruler, play/pause
 * + speed controls.
 *
 * Reanimated 4 worklets for crossfade and score-ring fill — keeps the
 * playback locked to the UI thread even while the JS thread is busy.
 */
export function PhotoTimeline({
  frames,
  width = 320,
  autoPlay = true,
  framesMs = 1500,
  onFrameChange,
}: PhotoTimelineProps) {
  const colors = useColors();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState<Speed>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fade = useSharedValue(1);          // current frame opacity
  const ringFill = useSharedValue(0);      // score ring progress 0..1
  const counter = useSharedValue(0);       // displayed score number

  const ringSize = Math.round(width * 0.22);
  const ringStroke = Math.max(4, ringSize * 0.08);
  const ringRadius = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * ringRadius;

  const advanceTo = (next: number) => {
    if (next < 0 || next >= frames.length) return;
    // Crossfade: fade out current, swap, fade in.
    fade.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) }, () => {
      // setState must run on JS thread.
    });
    setTimeout(() => {
      setIndex(next);
      fade.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    }, 220);
  };

  // Animate score ring + counter to current frame's score.
  useEffect(() => {
    const f = frames[index];
    if (!f) return;
    ringFill.value = withTiming(Math.max(0, Math.min(1, f.score / 100)), {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    counter.value = withTiming(f.score, { duration: 600, easing: Easing.out(Easing.cubic) });
    onFrameChange?.(index);
  }, [index, frames]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bridge counter → React state for the text node.
  const [displayScore, setDisplayScore] = useState(0);
  // Update displayed score on every render frame via interval — cheaper than
  // useAnimatedReaction here since we're already managing other timers.
  useEffect(() => {
    const id = setInterval(() => {
      setDisplayScore(Math.round(counter.value));
    }, 16);
    return () => clearInterval(id);
  }, [counter]);

  // Auto-advance loop.
  useEffect(() => {
    if (!playing || frames.length < 2) return;
    timerRef.current = setTimeout(() => {
      const next = index + 1 >= frames.length ? 0 : index + 1;
      advanceTo(next);
    }, framesMs / speed);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, index, speed, frames.length, framesMs]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      cancelAnimation(fade);
      cancelAnimation(ringFill);
      cancelAnimation(counter);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (frames.length === 0) return null;
  const current = frames[index];
  const tint = scoreColor(current.score, colors);

  const photoStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - ringFill.value),
  }));

  // Progress fraction across the timeline.
  const progressFraction = frames.length > 1 ? index / (frames.length - 1) : 0;

  return (
    <View style={[styles.wrap, { width }]}>
      {/* Photo card — square, full bleed */}
      <Pressable
        style={[styles.photoFrame, { width, height: width, backgroundColor: colors.bgElevated }]}
        onPress={() => setPlaying(p => !p)}
      >
        <Animated.View style={[StyleSheet.absoluteFillObject, photoStyle]}>
          <ImageBackground source={{ uri: current.uri }} style={styles.photo} resizeMode="cover">
            {/* Top gradient + date pill */}
            <LinearGradient
              colors={['rgba(10,8,6,0.45)', 'transparent']}
              style={[StyleSheet.absoluteFillObject, { height: '50%' }]}
              pointerEvents="none"
            />
            <View style={styles.topRow}>
              <View style={styles.datePill}>
                <Ionicons name="calendar" size={11} color={colors.white} />
                <Text style={styles.dateText}>{fmtDate(current.date)}</Text>
              </View>
              {current.skinType && (
                <View style={styles.skinTypePill}>
                  <Text style={styles.skinTypeText}>{current.skinType.toUpperCase()}</Text>
                </View>
              )}
            </View>

            {/* Score ring overlay — bottom-right */}
            <View style={[styles.ringWrap, { width: ringSize, height: ringSize, bottom: 16, right: 16 }]}>
              <Svg width={ringSize} height={ringSize}>
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth={ringStroke}
                  fill="none"
                />
                <AnimatedCircle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  stroke={tint}
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${circumference} ${circumference}`}
                  transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                  animatedProps={ringProps}
                />
              </Svg>
              <View style={styles.ringCenter}>
                <Text style={[styles.ringScore, { color: colors.white }]}>{displayScore}</Text>
              </View>
            </View>

            {/* Bottom gradient + frame counter */}
            <LinearGradient
              colors={['transparent', 'rgba(10,8,6,0.55)']}
              style={[StyleSheet.absoluteFillObject, { top: '50%' }]}
              pointerEvents="none"
            />
            <View style={styles.bottomMeta}>
              <Text style={styles.frameCounter}>
                {index + 1} <Text style={styles.frameCounterDim}>of {frames.length}</Text>
              </Text>
            </View>
          </ImageBackground>
        </Animated.View>

        {/* Play/pause overlay icon (briefly visible on tap) */}
        {!playing && (
          <View pointerEvents="none" style={styles.playOverlay}>
            <View style={styles.playCircle}>
              <Ionicons name="play" size={24} color={colors.white} />
            </View>
          </View>
        )}
      </Pressable>

      {/* Timeline ruler */}
      <View style={styles.ruler}>
        <View style={styles.rulerTrack}>
          <View
            style={[
              styles.rulerFill,
              { width: `${progressFraction * 100}%`, backgroundColor: tint },
            ]}
          />
        </View>
        <View style={styles.tickRow}>
          {frames.map((f, i) => {
            const active = i === index;
            return (
              <Pressable
                key={i}
                onPress={() => {
                  setPlaying(false);
                  advanceTo(i);
                }}
                hitSlop={6}
                style={[styles.tick, active && styles.tickActive]}
              >
                <View style={[styles.tickDot, { backgroundColor: active ? tint : 'rgba(28,24,20,0.18)' }]} />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable
          style={styles.ctrlBtn}
          onPress={() => {
            setPlaying(false);
            advanceTo(Math.max(0, index - 1));
          }}
          disabled={index === 0}
        >
          <Ionicons
            name="play-skip-back"
            size={18}
            color={index === 0 ? colors.textMuted : colors.primary}
          />
        </Pressable>

        <Pressable
          style={[styles.playBtn, { backgroundColor: tint }]}
          onPress={() => setPlaying(p => !p)}
        >
          <Ionicons name={playing ? 'pause' : 'play'} size={18} color={colors.white} />
        </Pressable>

        <Pressable
          style={styles.ctrlBtn}
          onPress={() => {
            setPlaying(false);
            advanceTo(Math.min(frames.length - 1, index + 1));
          }}
          disabled={index === frames.length - 1}
        >
          <Ionicons
            name="play-skip-forward"
            size={18}
            color={index === frames.length - 1 ? colors.textMuted : colors.primary}
          />
        </Pressable>

        <View style={styles.speedDivider} />

        {SPEED_OPTIONS.map(s => (
          <Pressable
            key={s}
            style={[styles.speedChip, speed === s && styles.speedChipActive]}
            onPress={() => setSpeed(s)}
          >
            <Text style={[styles.speedChipText, { color: speed === s ? colors.primary : colors.textMuted }]}>
              {s}×
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  photoFrame: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    shadowColor: '#1C1814',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    position: 'relative',
  },
  photo: { width: '100%', height: '100%' },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(10,8,6,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  dateText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
  skinTypePill: {
    backgroundColor: 'rgba(196,98,45,0.55)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  skinTypeText: { fontSize: 9, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },

  ringWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScore: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },

  bottomMeta: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  frameCounter: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 4,
  },
  frameCounterDim: { color: 'rgba(255,255,255,0.65)', fontWeight: '700' },

  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(10,8,6,0.55)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },

  ruler: { gap: 6 },
  rulerTrack: {
    height: 3,
    backgroundColor: 'rgba(28,24,20,0.07)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  rulerFill: { height: '100%', borderRadius: 2 },
  tickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  tick: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tickActive: {},
  tickDot: { width: 7, height: 7, borderRadius: 3.5 },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  ctrlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(196,98,45,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(196,98,45,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1C1814',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  speedDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(28,24,20,0.10)',
    marginHorizontal: 4,
  },
  speedChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: 'transparent',
  },
  speedChipActive: { backgroundColor: 'rgba(196,98,45,0.12)' },
  speedChipText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  speedChipTextActive: {},
});
