import React from 'react';
import { View, Text, Pressable, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, Typography } from '../../constants/theme';

interface SectionProps {
  title: string;
  caption?: string;
  /** Right-side action (e.g., "See all"). */
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: number;
}

/**
 * Section — visual group with title + optional caption + optional right action.
 * Used to break up screens into scannable chunks.
 */
export function Section({
  title,
  caption,
  actionLabel,
  onAction,
  children,
  style,
  gap = Spacing.md,
}: SectionProps) {
  return (
    <View style={[{ gap }, style]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 2 }}>
        <View style={{ flex: 1 }}>
          <Text style={[Typography.h3, { color: Colors.textPrimary }]}>{title}</Text>
          {caption && (
            <Text style={[Typography.small, { color: Colors.textSecondary, marginTop: 2 }]}>
              {caption}
            </Text>
          )}
        </View>
        {actionLabel && onAction && (
          <Pressable
            onPress={onAction}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Text style={[Typography.smallStrong, { color: Colors.primary }]}>{actionLabel}</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}
