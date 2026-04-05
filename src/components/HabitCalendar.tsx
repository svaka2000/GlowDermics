import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../constants/colors';

type DayEntry = {
  date: string;
  morning: boolean;
  evening: boolean;
};

type Props = {
  log: DayEntry[];
  onDayPress?: (date: string) => void;
};

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function HabitCalendar({ log, onDayPress }: Props) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // First day of the month and total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getDayStatus = (day: number): 'both' | 'morning' | 'evening' | 'none' | 'future' => {
    const d = new Date(year, month, day);
    if (d > today) return 'future';
    const dateStr = d.toDateString();
    const entry = log.find(e => new Date(e.date).toDateString() === dateStr);
    if (!entry) return 'none';
    if (entry.morning && entry.evening) return 'both';
    if (entry.morning) return 'morning';
    if (entry.evening) return 'evening';
    return 'none';
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to fill last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={styles.root}>
      <Text style={styles.monthLabel}>{monthName}</Text>

      {/* Day headers */}
      <View style={styles.dayHeaders}>
        {DAYS.map((d, i) => (
          <Text key={i} style={styles.dayHeader}>{d}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={i} style={styles.emptyCell} />;
          const status = getDayStatus(day);
          const isToday = day === today.getDate();
          return (
            <Pressable
              key={i}
              style={[styles.dayCell, isToday && styles.todayCell]}
              onPress={() => onDayPress && onDayPress(new Date(year, month, day).toDateString())}
            >
              {status === 'both' && (
                <View style={styles.bothDot} />
              )}
              {status === 'morning' && (
                <View style={[styles.halfDot, styles.morningDot]} />
              )}
              {status === 'evening' && (
                <View style={[styles.halfDot, styles.eveningDot]} />
              )}
              <Text style={[
                styles.dayNum,
                isToday && styles.todayNum,
                status === 'future' && styles.futureNum,
              ]}>{day}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.scoreExcellent }]} />
          <Text style={styles.legendText}>Both</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.gold }]} />
          <Text style={styles.legendText}>Morning</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#818CF8' }]} />
          <Text style={styles.legendText}>Evening</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.border }]} />
          <Text style={styles.legendText}>Missed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  monthLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14, textAlign: 'center' },
  dayHeaders: { flexDirection: 'row', marginBottom: 8 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  emptyCell: { width: '14.28%', aspectRatio: 1 },
  dayCell: {
    width: '14.28%', aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  todayCell: {
    backgroundColor: 'rgba(196,98,45,0.08)',
    borderRadius: 8,
  },
  dayNum: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  todayNum: { color: Colors.primary, fontWeight: '800' },
  futureNum: { color: Colors.textMuted, opacity: 0.4 },
  bothDot: {
    position: 'absolute', top: 4, width: 6, height: 6,
    borderRadius: 3, backgroundColor: Colors.scoreExcellent,
  },
  halfDot: {
    position: 'absolute', top: 4, width: 6, height: 6, borderRadius: 3,
  },
  morningDot: { backgroundColor: Colors.gold },
  eveningDot: { backgroundColor: '#818CF8' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: Colors.textMuted },
});
