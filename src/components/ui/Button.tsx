import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Radii, Spacing } from '../../constants/theme';
import { useColors } from '../../state/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'gold';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconRight?: React.ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Button — premium tap target with haptics + spring press feedback.
 *
 * Variants:
 * - primary:     terracotta gradient (main CTA)
 * - secondary:   outlined terracotta on cream (secondary CTA)
 * - ghost:       transparent w/ primary text (low-emphasis)
 * - destructive: red gradient (delete/cancel/sign-out)
 * - gold:        gold gradient (premium/upgrade)
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled = false,
  loading = false,
  fullWidth = true,
  haptic = true,
  style,
}: ButtonProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      damping: 14,
      stiffness: 220,
      mass: 0.7,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 14,
      stiffness: 220,
      mass: 0.7,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    if (haptic) {
      Haptics.impactAsync(
        variant === 'destructive'
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Light,
      ).catch(() => {});
    }
    onPress();
  };

  const sizeStyles = SIZE[size];
  const isGradient = variant === 'primary' || variant === 'destructive' || variant === 'gold';

  const textColor =
    variant === 'secondary'
      ? colors.primary
      : variant === 'ghost'
      ? colors.primary
      : colors.white;

  const baseStyle: ViewStyle = {
    borderRadius: Radii.lg,
    paddingHorizontal: sizeStyles.paddingX,
    height: sizeStyles.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    opacity: disabled ? 0.45 : 1,
    width: fullWidth ? '100%' : undefined,
  };

  const variantStyle: ViewStyle =
    variant === 'secondary'
      ? {
          backgroundColor: colors.primary + '10',
          borderWidth: 1.5,
          borderColor: colors.borderStrong,
        }
      : variant === 'ghost'
      ? { backgroundColor: 'transparent' }
      : {};

  const gradientColors: [string, string] =
    variant === 'destructive'
      ? ['#EF4444', '#B91C1C']
      : variant === 'gold'
      ? [colors.goldLight, colors.gold]
      : [colors.primaryLight, colors.primary];

  const Inner = (
    <>
      {icon && (
        <Ionicons
          name={loading ? 'sync' : icon}
          size={sizeStyles.iconSize}
          color={textColor}
        />
      )}
      <Text style={[textStyles[size], { color: textColor }]}>{label}</Text>
      {iconRight && (
        <Ionicons name={iconRight} size={sizeStyles.iconSize} color={textColor} />
      )}
    </>
  );

  return (
    <Animated.View style={[{ transform: [{ scale }], width: fullWidth ? '100%' : undefined }, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[baseStyle, variantStyle]}
      >
        {isGradient && (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        {Inner}
      </Pressable>
    </Animated.View>
  );
}

const SIZE = {
  sm: { height: 38, paddingX: Spacing.lg, iconSize: 16 },
  md: { height: 50, paddingX: Spacing.xl, iconSize: 18 },
  lg: { height: 60, paddingX: Spacing.xxl, iconSize: 20 },
};

const textStyles: Record<ButtonSize, TextStyle> = StyleSheet.create({
  sm: { fontSize: 14, fontWeight: '700', letterSpacing: -0.1 },
  md: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  lg: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
}) as Record<ButtonSize, TextStyle>;
