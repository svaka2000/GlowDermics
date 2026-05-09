import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';
import { SkinAge } from '../../types';

interface SkinAgeBadgeProps {
  skinAge: SkinAge;
  /** User's chronological age — when provided, shows a delta arrow. */
  userAge?: number;
  delay?: number;
}

const BRACKET_CONFIG = {
  younger: {
    label: 'YOUNGER THAN AVG',
    gradient: ['#22C55E', '#16A34A'] as [string, string],
    icon: 'arrow-up' as const,
  },
  'on-track': {
    label: 'ON TRACK',
    gradient: ['#0EA5E9', '#0284C7'] as [string, string],
    icon: 'remove' as const,
  },
  older: {
    label: 'AGING SIGNALS',
    gradient: ['#EF4444', '#B91C1C'] as [string, string],
    icon: 'arrow-down' as const,
  },
};

/**
 * SkinAgeBadge — premium hero-card showing the AI-estimated biological skin age,
 * with optional delta vs user's chronological age. Designed as a focal point
 * on the results screen — counts up on mount.
 */
export function SkinAgeBadge({ skinAge, userAge, delay = 0 }: SkinAgeBadgeProps) {
  const counter = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const cfg = BRACKET_CONFIG[skinAge.bracket];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(counter, {
        toValue: skinAge.estimated,
        duration: 1100,
        delay: delay + 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [skinAge.estimated, delay, counter, fade]);

  const [displayValue, setDisplayValue] = React.useState(0);
  useEffect(() => {
    const id = counter.addListener(({ value }) => setDisplayValue(Math.round(value)));
    return () => counter.removeListener(id);
  }, [counter]);

  const delta = userAge !== undefined ? skinAge.estimated - userAge : undefined;

  return (
    <Animated.View style={[styles.card, { opacity: fade }]}>
      <LinearGradient
        colors={cfg.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Subtle glow overlay */}
      <View style={styles.glow} pointerEvents="none" />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.bracketChip}>
            <Ionicons name={cfg.icon as any} size={11} color={Colors.white} />
            <Text style={styles.bracketLabel}>{cfg.label}</Text>
          </View>
          {delta !== undefined && (
            <View style={styles.deltaChip}>
              <Text style={styles.deltaText}>
                {delta === 0 ? 'matches age' : delta > 0 ? `+${delta} vs age` : `${delta} vs age`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.valueRow}>
          <Text style={styles.value}>{displayValue}</Text>
          <View style={styles.unitWrap}>
            <Text style={styles.unitTop}>SKIN</Text>
            <Text style={styles.unitBot}>AGE</Text>
          </View>
        </View>

        <Text style={styles.caption}>
          AI-estimated biological skin age based on visible markers
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
    minHeight: 130,
    shadowColor: '#0D0B09',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  content: {
    padding: 22,
    gap: 8,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bracketChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  bracketLabel: { fontSize: 9, fontWeight: '900', color: Colors.white, letterSpacing: 1.2 },
  deltaChip: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  deltaText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 6 },
  value: {
    fontSize: 60,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: -2,
    lineHeight: 60,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  unitWrap: { paddingBottom: 10 },
  unitTop: { fontSize: 12, fontWeight: '900', color: Colors.white, letterSpacing: 2 },
  unitBot: { fontSize: 12, fontWeight: '900', color: Colors.white, letterSpacing: 2 },
  caption: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontWeight: '500',
  },
});
