import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radii } from '../../constants/theme';
import { useColors } from '../../state/theme';

interface BiomarkerCloudProps {
  biomarkers: string[];
  onPress?: (biomarker: string) => void;
  delay?: number;
}

/**
 * BiomarkerCloud — animated chip cluster for AI-extracted biomarker tags.
 *
 * Each chip fades + scales in with a stagger. Tapping a chip can route to a
 * deeper-dive screen (e.g., "compromised barrier" → barrier-repair article).
 */
export function BiomarkerCloud({ biomarkers, onPress, delay = 0 }: BiomarkerCloudProps) {
  if (!biomarkers || biomarkers.length === 0) return null;

  return (
    <View style={styles.cloud}>
      {biomarkers.map((tag, i) => (
        <BiomarkerChip
          key={tag + i}
          label={tag}
          delay={delay + i * 80}
          onPress={onPress ? () => onPress(tag) : undefined}
        />
      ))}
    </View>
  );
}

function BiomarkerChip({
  label,
  onPress,
  delay,
}: {
  label: string;
  onPress?: () => void;
  delay: number;
}) {
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        delay,
        damping: 14,
        stiffness: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, scale]);

  const Wrap: any = onPress ? Pressable : View;

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <Wrap
        onPress={onPress}
        style={[
          styles.chip,
          { backgroundColor: colors.primary + '14', borderColor: colors.primary + '40' },
        ]}
      >
        <Ionicons name="pulse" size={11} color={colors.primary} />
        <Text style={[styles.chipText, { color: colors.primary }]}>{label}</Text>
      </Wrap>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: Radii.pill,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  chipText: { fontSize: 12, fontWeight: '700', letterSpacing: -0.1 },
});
