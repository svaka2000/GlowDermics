import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Radii } from '../../constants/theme';
import { useTheme } from '../../state/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Skeleton — shimmer loading placeholder for any size.
 *
 * Use `<Skeleton.Group>` to wrap multiple skeletons with a shared shimmer rhythm,
 * or use individual <Skeleton> instances for one-off placeholders.
 */
export function Skeleton({ width = '100%', height = 16, radius = Radii.sm, style }: SkeletonProps) {
  const { scheme } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;
  // Track color flips with the theme: subtle dark wash on light, subtle light wash on dark.
  const trackColor = scheme === 'dark' ? 'rgba(245,240,234,0.08)' : 'rgba(28,24,20,0.06)';
  // Shimmer highlight is the theme's "lighter than the track" color.
  const shimmerColors: [string, string, string] =
    scheme === 'dark'
      ? ['rgba(245,240,234,0)', 'rgba(245,240,234,0.18)', 'rgba(245,240,234,0)']
      : ['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)'];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: trackColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: 200,
          height: '100%',
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}
