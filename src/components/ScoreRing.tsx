import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../constants/colors';

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
  /** When true, animates the ring from 0 on mount */
  animate?: boolean;
  label?: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return Colors.scoreExcellent;
  if (score >= 60) return Colors.scoreGood;
  if (score >= 40) return Colors.scoreFair;
  return Colors.scorePoor;
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'EXCELLENT';
  if (score >= 60) return 'GOOD';
  if (score >= 40) return 'FAIR';
  return 'NEEDS WORK';
}

// Animated SVG circle wrapper
import Svg_Animated, { Circle as AnimatedCircle } from 'react-native-svg';

export function ScoreRing({ score, size = 80, strokeWidth = 6, animate = false, label }: Props) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressValue = (score / 100) * circumference;
  const color = scoreColor(score);

  // Animated dash offset for fill animation
  const dashAnim = useRef(new Animated.Value(animate ? circumference : circumference - progressValue)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.timing(dashAnim, {
      toValue: circumference - progressValue,
      duration: 1000,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const gradId = `sgr_${score}`;
  const outerRadius = radius + strokeWidth * 0.7;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer ambient glow ring */}
      <View style={[
        StyleSheet.absoluteFillObject,
        { alignItems: 'center', justifyContent: 'center' },
      ]}>
        <View style={{
          width: size * 0.88,
          height: size * 0.88,
          borderRadius: size * 0.44,
          backgroundColor: color,
          opacity: 0.08,
        }} />
      </View>

      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.7" />
            <Stop offset="100%" stopColor={color} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Track ring */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(250,243,224,0.08)"
          strokeWidth={strokeWidth} fill="none"
        />

        {/* Progress arc */}
        {animate ? (
          <AnimatedCircle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth} fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashAnim as any}
            strokeLinecap="round"
            rotation="-90" origin={`${size / 2}, ${size / 2}`}
          />
        ) : (
          <Circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth} fill="none"
            strokeDasharray={`${progressValue} ${circumference}`}
            strokeLinecap="round"
            rotation="-90" origin={`${size / 2}, ${size / 2}`}
          />
        )}
      </Svg>

      <Text style={[styles.score, { fontSize: size * 0.27, color }]}>{score}</Text>
      <Text style={[styles.label, { fontSize: Math.max(size * 0.095, 8), color: color + 'AA' }]}>
        {label ?? scoreLabel(score)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  score: { fontWeight: '800' },
  label: { fontWeight: '700', letterSpacing: 0.8, marginTop: 1 },
});
