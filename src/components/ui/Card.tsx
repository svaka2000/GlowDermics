import React from 'react';
import { View, ViewStyle, StyleProp, StyleSheet, Pressable, GestureResponderEvent, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/colors';
import { Radii, Shadows, Spacing } from '../../constants/theme';

type CardVariant = 'flat' | 'elevated' | 'glass' | 'outline' | 'gradient' | 'glow';
type BlurTint = 'light' | 'dark' | 'default';

interface CardProps {
  variant?: CardVariant;
  padding?: number;
  radius?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (e: GestureResponderEvent) => void;
  /** Tint color for gradient/glow variants. Defaults to primary. */
  tint?: string;
  /** When true, the card scales slightly on press. */
  pressable?: boolean;
  /**
   * Apply native frosted-glass blur behind the card. iOS gets full BlurView,
   * Android falls back to a translucent surface, web uses CSS backdrop-filter.
   * Pass a number 0–100 for intensity, or `true` for the default (40).
   * Best paired with `variant="glass"`.
   */
  blur?: boolean | number;
  /** Blur tint when `blur` is set. Default: 'light'. */
  blurTint?: BlurTint;
}

/**
 * Card — the workhorse container of the v2 design system.
 *
 * Variants:
 * - flat:     plain white surface, no shadow (use inside cards)
 * - elevated: white surface with soft shadow (default for primary content)
 * - glass:    semi-transparent over photo/gradient backgrounds
 * - outline:  bordered, no fill (lightweight separation)
 * - gradient: subtle tint gradient overlay (hero/featured cards)
 * - glow:     elevated + colored shadow (premium / CTA emphasis)
 */
export function Card({
  variant = 'elevated',
  padding = Spacing.xl,
  radius = Radii.lg,
  children,
  style,
  onPress,
  tint = Colors.primary,
  pressable = !!onPress,
  blur = false,
  blurTint = 'light',
}: CardProps) {
  const baseStyle: ViewStyle = {
    borderRadius: radius,
    padding,
    overflow: 'hidden',
  };

  let variantStyle: ViewStyle = {};
  let extraLayer: React.ReactNode = null;

  switch (variant) {
    case 'flat':
      variantStyle = { backgroundColor: Colors.bgCard };
      break;
    case 'elevated':
      variantStyle = { backgroundColor: Colors.bgCard, ...Shadows.card };
      break;
    case 'glass':
      // When `blur` is enabled, BlurView handles the translucent surface.
      // Otherwise fall back to a solid translucent fill.
      variantStyle = {
        backgroundColor: blur ? 'transparent' : Colors.glassDeep,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.55)',
        ...Shadows.subtle,
      };
      break;
    case 'outline':
      variantStyle = {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.border,
      };
      break;
    case 'gradient':
      variantStyle = {
        backgroundColor: Colors.bgCard,
        ...Shadows.card,
      };
      extraLayer = (
        <LinearGradient
          pointerEvents="none"
          colors={[`${tint}1A`, `${tint}05`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      );
      break;
    case 'glow':
      variantStyle = {
        backgroundColor: Colors.bgCard,
        shadowColor: tint,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 22,
        elevation: 8,
      };
      break;
  }

  // Compute blur layer. On iOS BlurView is native and crisp; on Android it works
  // with a fallback experimentalBlurMethod, and on web it relies on backdrop-filter.
  const blurIntensity = typeof blur === 'number' ? blur : blur ? 40 : 0;
  const blurLayer =
    blurIntensity > 0 ? (
      <BlurView
        intensity={blurIntensity}
        tint={blurTint}
        // experimentalBlurMethod is the most reliable on Android; iOS ignores.
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
      />
    ) : null;

  const Wrapper: any = pressable ? Pressable : View;
  const wrapperProps = pressable
    ? {
        onPress,
        style: ({ pressed }: { pressed: boolean }) => [
          baseStyle,
          variantStyle,
          style,
          pressed && { opacity: 0.92, transform: [{ scale: 0.992 }] },
        ],
      }
    : { style: [baseStyle, variantStyle, style] };

  return (
    <Wrapper {...wrapperProps}>
      {blurLayer}
      {extraLayer}
      <View style={{ position: 'relative' }}>{children}</View>
    </Wrapper>
  );
}
