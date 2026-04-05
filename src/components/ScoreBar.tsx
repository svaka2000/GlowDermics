import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  label: string;
  value: number;
  showValue?: boolean;
}

function scoreColor(score: number): string {
  if (score >= 80) return Colors.scoreExcellent;
  if (score >= 60) return Colors.scoreGood;
  if (score >= 40) return Colors.scoreFair;
  return Colors.scorePoor;
}

export function ScoreBar({ label, value, showValue = true }: Props) {
  const color = scoreColor(value);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        {showValue && <Text style={[styles.value, { color }]}>{value}</Text>}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${value}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  value: { fontSize: 12, fontWeight: '700' },
  track: { height: 5, backgroundColor: 'rgba(250,243,224,0.08)', borderRadius: 3 },
  fill: { height: '100%', borderRadius: 3 },
});
