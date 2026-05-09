import React from 'react';
import { View, ViewStyle, StyleProp, StyleSheet, Pressable, GestureResponderEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { Radii, Shadows, Spacing } from '../../constants/theme';

type CardVariant = 'flat' | 'elevated' | 'glass' | 'outline' | 'gradient' | 'glow';

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
      variantStyle = {
        backgroundColor: Colors.glassDeep,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
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
      {extraLayer}
      <View style={{ position: 'relative' }}>{children}</View>
    </Wrapper>
  );
}
