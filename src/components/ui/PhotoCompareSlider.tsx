import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';

interface PhotoCompareSliderProps {
  /** Photo on the LEFT side (typically the older / "before"). */
  leftSource: ImageSourcePropType | string | null;
  /** Photo on the RIGHT side (typically the newer / "after"). */
  rightSource: ImageSourcePropType | string | null;
  /** Visible width in points. Height is derived (1:1 by default). */
  width: number;
  /** Aspect ratio (height = width / aspectRatio). Default 1.0 (square). */
  aspectRatio?: number;
  /** Initial slider position 0..1. Default 0.5. */
  initial?: number;
  /** Optional captions rendered as gradient pill at top corners. */
  leftCaption?: string;
  rightCaption?: string;
  /** Called whenever the slider changes (debounced ~16ms). */
  onChange?: (fraction: number) => void;
}

const HANDLE_SIZE = 44;
const LINE_WIDTH = 2.5;

/**
 * PhotoCompareSlider — drag the vertical handle left/right to wipe between
 * two photos. Reanimated worklet drives the wipe so every frame stays on the
 * UI thread (60fps even mid-gesture).
 *
 * Exemplar: Lóvi / SkinPal "before/after" interaction. This is a marquee
 * feature for the Compare screen.
 */
export function PhotoCompareSlider({
  leftSource,
  rightSource,
  width,
  aspectRatio = 1.0,
  initial = 0.5,
  leftCaption,
  rightCaption,
  onChange,
}: PhotoCompareSliderProps) {
  const height = width / aspectRatio;

  // sliderX is the absolute pixel position of the handle; sliderFraction is 0..1.
  const sliderX = useSharedValue(width * initial);
  const dragStartX = useSharedValue(0);
  const handleScale = useSharedValue(1);
  const [hint, setHint] = useState(true);

  const reportFraction = (frac: number) => onChange?.(Math.max(0, Math.min(1, frac)));

  const pan = Gesture.Pan()
    .onBegin(() => {
      dragStartX.value = sliderX.value;
      handleScale.value = withSpring(1.18, { damping: 12, stiffness: 220 });
      runOnJS(setHint)(false);
    })
    .onUpdate(e => {
      const next = Math.max(0, Math.min(width, dragStartX.value + e.translationX));
      sliderX.value = next;
      runOnJS(reportFraction)(next / width);
    })
    .onEnd(() => {
      handleScale.value = withSpring(1, { damping: 12, stiffness: 220 });
    });

  // Tap-to-jump anywhere on the surface.
  const tap = Gesture.Tap().onEnd(e => {
    const next = Math.max(0, Math.min(width, e.x));
    sliderX.value = withSpring(next, { damping: 18, stiffness: 200 });
    runOnJS(reportFraction)(next / width);
    runOnJS(setHint)(false);
  });

  const composed = Gesture.Simultaneous(pan, tap);

  // Right photo is clipped from sliderX → width; we animate `width` of the clip.
  const rightClipStyle = useAnimatedStyle(() => ({
    width: width - sliderX.value,
  }));

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sliderX.value - HANDLE_SIZE / 2 }, { scale: handleScale.value }],
  }));

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sliderX.value - LINE_WIDTH / 2 }],
  }));

  const renderImage = (src: PhotoCompareSliderProps['leftSource']) => {
    if (!src) {
      return (
        <View style={[styles.empty, { width, height }]}>
          <Ionicons name="person" size={64} color={Colors.textMuted} />
        </View>
      );
    }
    const source = typeof src === 'string' ? { uri: src } : src;
    return <Image source={source as ImageSourcePropType} style={{ width, height }} resizeMode="cover" />;
  };

  return (
    <GestureDetector gesture={composed}>
      <View style={[styles.container, { width, height }]}>
        {/* Left photo — full layer */}
        <View style={[styles.layer, { width, height }]}>{renderImage(leftSource)}</View>

        {/* Right photo — clipped from the slider rightward */}
        <Animated.View style={[styles.rightClip, { right: 0, height }, rightClipStyle]}>
          <View style={{ position: 'absolute', right: 0, top: 0, width, height }}>
            {renderImage(rightSource)}
          </View>
        </Animated.View>

        {/* Caption pills — small, semi-transparent */}
        {leftCaption && (
          <View style={[styles.caption, { left: 10, top: 10 }]}>
            <Text style={styles.captionText}>{leftCaption}</Text>
          </View>
        )}
        {rightCaption && (
          <View style={[styles.caption, { right: 10, top: 10 }]}>
            <Text style={styles.captionText}>{rightCaption}</Text>
          </View>
        )}

        {/* Vertical divider line */}
        <Animated.View
          pointerEvents="none"
          style={[styles.line, { width: LINE_WIDTH, height }, lineStyle]}
        />

        {/* Drag handle */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.handle,
            { top: height / 2 - HANDLE_SIZE / 2 },
            handleStyle,
          ]}
        >
          <Ionicons name="chevron-back" size={14} color={Colors.white} />
          <Ionicons name="chevron-forward" size={14} color={Colors.white} />
        </Animated.View>

        {/* First-time hint */}
        {hint && (
          <View pointerEvents="none" style={styles.hintWrap}>
            <View style={styles.hint}>
              <Ionicons name="swap-horizontal" size={11} color={Colors.white} />
              <Text style={styles.hintText}>Drag to compare</Text>
            </View>
          </View>
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    backgroundColor: Colors.bgElevated,
    shadowColor: '#1C1814',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    position: 'relative',
  },
  layer: { position: 'absolute', top: 0, left: 0 },
  rightClip: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
  },
  empty: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgElevated },
  line: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  handle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  caption: {
    position: 'absolute',
    backgroundColor: 'rgba(13,11,9,0.78)',
    borderRadius: Radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  captionText: { fontSize: 10, fontWeight: '900', color: Colors.white, letterSpacing: 1 },
  hintWrap: { position: 'absolute', bottom: 12, alignSelf: 'center', width: '100%', alignItems: 'center' },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(13,11,9,0.72)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  hintText: { fontSize: 11, color: Colors.white, fontWeight: '700' },
});
