import React from 'react';
import { Text, View, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';

type BadgeTone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'gold'
  | 'neutral'
  | 'premium';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  filled?: boolean;
  size?: 'xs' | 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  /** Show a small pulsing dot (for "live" / "active" states). */
  dot?: boolean;
}

const TONE: Record<BadgeTone, { bg: string; text: string; border: string; dot: string }> = {
  primary:  { bg: 'rgba(196,98,45,0.10)',  text: Colors.primary,        border: 'rgba(196,98,45,0.30)',  dot: Colors.primary },
  success:  { bg: 'rgba(22,163,74,0.10)',  text: Colors.scoreExcellent, border: 'rgba(22,163,74,0.30)',  dot: Colors.scoreExcellent },
  warning:  { bg: 'rgba(217,119,6,0.10)',  text: Colors.scoreFair,      border: 'rgba(217,119,6,0.30)',  dot: Colors.scoreFair },
  danger:   { bg: 'rgba(220,38,38,0.10)',  text: Colors.scorePoor,      border: 'rgba(220,38,38,0.30)',  dot: Colors.scorePoor },
  info:     { bg: 'rgba(14,165,233,0.10)', text: '#0EA5E9',             border: 'rgba(14,165,233,0.30)', dot: '#0EA5E9' },
  gold:     { bg: 'rgba(184,136,46,0.10)', text: Colors.gold,           border: 'rgba(184,136,46,0.30)', dot: Colors.gold },
  neutral:  { bg: 'rgba(28,24,20,0.06)',   text: Colors.textSecondary,  border: 'rgba(28,24,20,0.12)',   dot: Colors.textMuted },
  premium:  { bg: 'rgba(168,85,247,0.10)', text: '#A855F7',             border: 'rgba(168,85,247,0.30)', dot: '#A855F7' },
};

const SIZE_CONFIG = {
  xs: { paddingX: 6,  paddingY: 2, fontSize: 10, iconSize: 9,  gap: 3 },
  sm: { paddingX: 8,  paddingY: 4, fontSize: 11, iconSize: 11, gap: 4 },
  md: { paddingX: 10, paddingY: 5, fontSize: 12, iconSize: 13, gap: 5 },
};

/**
 * Badge — small pill for categories, statuses, score grades, premium tags.
 */
export function Badge({
  label,
  tone = 'primary',
  icon,
  filled = false,
  size = 'sm',
  style,
  dot,
}: BadgeProps) {
  const t = TONE[tone];
  const s = SIZE_CONFIG[size];

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: filled ? t.text : t.bg,
          borderColor: filled ? 'transparent' : t.border,
          paddingHorizontal: s.paddingX,
          paddingVertical: s.paddingY,
          gap: s.gap,
        },
        style,
      ]}
    >
      {dot && (
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: filled ? Colors.white : t.dot,
            shadowColor: t.dot,
            shadowOpacity: 0.8,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 0 },
          }}
        />
      )}
      {icon && (
        <Ionicons name={icon} size={s.iconSize} color={filled ? Colors.white : t.text} />
      )}
      <Text
        style={{
          fontSize: s.fontSize,
          fontWeight: '700',
          color: filled ? Colors.white : t.text,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
});
