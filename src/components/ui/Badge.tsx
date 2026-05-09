import React, { useMemo } from 'react';
import { Text, View, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radii } from '../../constants/theme';
import { useColors } from '../../state/theme';
import type { Palette } from '../../constants/colors';

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

interface ToneSpec {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

/**
 * Build the tone palette dynamically from the active theme. Memoized so
 * components don't recompute on every render unless the palette changes.
 */
function buildTones(colors: Palette): Record<BadgeTone, ToneSpec> {
  return {
    primary: { bg: colors.primary + '1A', text: colors.primary, border: colors.primary + '4D', dot: colors.primary },
    success: { bg: colors.scoreExcellent + '1A', text: colors.scoreExcellent, border: colors.scoreExcellent + '4D', dot: colors.scoreExcellent },
    warning: { bg: colors.scoreFair + '1A', text: colors.scoreFair, border: colors.scoreFair + '4D', dot: colors.scoreFair },
    danger:  { bg: colors.scorePoor + '1A', text: colors.scorePoor, border: colors.scorePoor + '4D', dot: colors.scorePoor },
    info:    { bg: colors.barrierHealth + '1A', text: colors.barrierHealth, border: colors.barrierHealth + '4D', dot: colors.barrierHealth },
    gold:    { bg: colors.gold + '1A', text: colors.gold, border: colors.gold + '4D', dot: colors.gold },
    neutral: { bg: colors.textPrimary + '0F', text: colors.textSecondary, border: colors.textPrimary + '1F', dot: colors.textMuted },
    premium: { bg: '#A855F71A', text: '#A855F7', border: '#A855F74D', dot: '#A855F7' },
  };
}

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
  const colors = useColors();
  const tones = useMemo(() => buildTones(colors), [colors]);
  const t = tones[tone];
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
            backgroundColor: filled ? colors.white : t.dot,
            shadowColor: t.dot,
            shadowOpacity: 0.8,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 0 },
          }}
        />
      )}
      {icon && (
        <Ionicons name={icon} size={s.iconSize} color={filled ? colors.white : t.text} />
      )}
      <Text
        style={{
          fontSize: s.fontSize,
          fontWeight: '700',
          color: filled ? colors.white : t.text,
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
