import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../constants/colors';

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
}

function scoreColor(score: number): string {
  if (score >= 80) return Colors.scoreExcellent;
  if (score >= 60) return Colors.scoreGood;
  if (score >= 40) return Colors.scoreFair;
  return Colors.scorePoor;
}

export function ScoreRing({ score, size = 80, strokeWidth = 6 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(250,243,224,0.08)"
          strokeWidth={strokeWidth} fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={[styles.score, { fontSize: size * 0.26, color }]}>{score}</Text>
      <Text style={[styles.label, { fontSize: size * 0.1 }]}>SCORE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  score: { fontWeight: '800', lineHeight: undefined },
  label: { color: Colors.textMuted, fontWeight: '600', letterSpacing: 1, marginTop: -2 },
});
