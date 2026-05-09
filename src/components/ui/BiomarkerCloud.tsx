import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';

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
      <Wrap onPress={onPress} style={styles.chip}>
        <Ionicons name="pulse" size={11} color={Colors.primary} />
        <Text style={styles.chipText}>{label}</Text>
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
    backgroundColor: 'rgba(196,98,45,0.08)',
    borderColor: 'rgba(196,98,45,0.25)',
    borderWidth: 1,
    borderRadius: Radii.pill,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  chipText: { fontSize: 12, fontWeight: '700', color: Colors.primary, letterSpacing: -0.1 },
});
