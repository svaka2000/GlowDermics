/**
 * HabitMatrix — GitHub-contributions-style heatmap of daily habit completion.
 *
 * Renders a 7×N grid (default 12 weeks). Each cell is one day, colored by the
 * fraction of habits completed that day:
 *   0%      → bgElevated (empty)
 *   1-25%   → primary @ 30% alpha
 *   26-50%  → primary @ 55%
 *   51-75%  → primary @ 80%
 *   76-100% → primary full
 *
 * Layout: weeks run left→right, days top→bottom (Mon–Sun). Today is the rightmost cell.
 * Cells are 14px squares with 3px gap. The whole matrix is ~196px tall, ~~250px wide.
 *
 * Tap a cell to invoke onCellPress with that day's data.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay,
} from 'react-native-reanimated';
import { useColors } from '../../state/theme';
import type { Palette } from '../../constants/colors';

const TOTAL_HABITS = 12;
const CELL = 14;
const GAP = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

export interface HabitDay {
  date: string;
  /** ISO date YYYY-MM-DD (for stable keys). */
  iso: string;
  /** Completed count 0-12. */
  count: number;
  /** Pct 0-1. */
  pct: number;
}

interface Props {
  /** Logs from AsyncStorage gd_daily_habits — array of { date, checked }. */
  logs: { date: string; checked?: string[] }[];
  /** Number of weeks to render. Default 12. */
  weeks?: number;
  onCellPress?: (day: HabitDay) => void;
}

function intensityForPct(pct: number): 0 | 1 | 2 | 3 | 4 {
  if (pct === 0) return 0;
  if (pct <= 0.25) return 1;
  if (pct <= 0.5) return 2;
  if (pct <= 0.75) return 3;
  return 4;
}

function buildGrid(logs: { date: string; checked?: string[] }[], weeks: number): HabitDay[][] {
  const byDate = new Map<string, number>();
  for (const l of logs) {
    byDate.set(l.date, l.checked?.length ?? 0);
  }

  const today = new Date();
  // Today's day-of-week (Sun=0..Sat=6 in JS) → we want Mon-first index (Mon=0..Sun=6).
  const todayMonIdx = (today.getDay() + 6) % 7;

  // Total cells = 7 days/col × `weeks` cols. Today should sit at column `weeks-1`, row `todayMonIdx`.
  const cols: HabitDay[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: HabitDay[] = [];
    for (let d = 0; d < 7; d++) {
      // Days from today to this cell. Today is (weeks-1, todayMonIdx). All other cells are in the past.
      const daysAgo = (weeks - 1 - w) * 7 + (todayMonIdx - d);
      const date = new Date(today.getTime() - daysAgo * MS_PER_DAY);
      const dateStr = date.toDateString();
      const isoStr = date.toISOString().slice(0, 10);
      const count = byDate.get(dateStr) ?? 0;
      // Future cells (daysAgo<0) — empty placeholders
      col.push({
        date: daysAgo < 0 ? '' : dateStr,
        iso: isoStr,
        count: daysAgo < 0 ? 0 : count,
        pct: daysAgo < 0 ? 0 : count / TOTAL_HABITS,
      });
    }
    cols.push(col);
  }
  return cols;
}

export function HabitMatrix({ logs, weeks = 12, onCellPress }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const grid = useMemo(() => buildGrid(logs, weeks), [logs, weeks]);

  // Compute month labels along the top
  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    for (let w = 0; w < grid.length; w++) {
      const firstDay = grid[w][0];
      if (!firstDay.date) continue;
      const d = new Date(firstDay.date);
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        labels.push({ col: w, label: d.toLocaleString('en-US', { month: 'short' }) });
      }
    }
    return labels;
  }, [grid]);

  return (
    <View style={styles.wrap}>
      {/* Month labels */}
      <View style={styles.monthRow}>
        {monthLabels.map((m, i) => (
          <Text
            key={i}
            style={[styles.monthLabel, { left: m.col * (CELL + GAP) + 24 }]}
          >
            {m.label}
          </Text>
        ))}
      </View>

      <View style={styles.body}>
        {/* Day-of-week labels */}
        <View style={styles.dayCol}>
          {DAY_LABELS.map((d, i) => (
            <Text key={i} style={[styles.dayLabel, { height: CELL, marginBottom: GAP }]}>
              {d}
            </Text>
          ))}
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {grid.map((col, w) => (
            <View key={w} style={[styles.col, { marginRight: w === grid.length - 1 ? 0 : GAP }]}>
              {col.map((day, d) => (
                <Cell
                  key={d}
                  day={day}
                  weekIdx={w}
                  dayIdx={d}
                  onPress={onCellPress}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Less</Text>
        {[0, 1, 2, 3, 4].map(level => (
          <View
            key={level}
            style={[
              styles.legendCell,
              { backgroundColor: cellColorFor(level, colors), marginRight: 3 },
            ]}
          />
        ))}
        <Text style={styles.legendLabel}>More</Text>
      </View>
    </View>
  );
}

function cellColorFor(intensity: number, c: Palette): string {
  if (intensity === 0) return c.bgElevated;
  if (intensity === 1) return c.primary + '4D';   // ~30%
  if (intensity === 2) return c.primary + '8C';   // ~55%
  if (intensity === 3) return c.primary + 'CC';   // ~80%
  return c.primary;
}

function Cell({
  day, weekIdx, dayIdx, onPress,
}: {
  day: HabitDay;
  weekIdx: number;
  dayIdx: number;
  onPress?: (day: HabitDay) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const intensity = intensityForPct(day.pct);
  const bg = cellColorFor(intensity, colors);
  const isFuture = !day.date;

  // Staggered fade-in
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  useEffect(() => {
    const delay = weekIdx * 18 + dayIdx * 6;
    opacity.value = withDelay(delay, withTiming(1, { duration: 240 }));
    scale.value = withDelay(delay, withTiming(1, { duration: 240 }));
  }, [day.iso]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (isFuture) {
    // Empty placeholder for future days in the current week
    return (
      <Animated.View style={[styles.cell, { backgroundColor: 'transparent' }, animStyle]} />
    );
  }

  return (
    <Pressable onPress={() => onPress?.(day)} disabled={!onPress}>
      <Animated.View
        style={[
          styles.cell,
          { backgroundColor: bg, marginBottom: GAP },
          animStyle,
        ]}
      />
    </Pressable>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: {
      paddingVertical: 8,
    },
    monthRow: {
      height: 14,
      position: 'relative',
      marginBottom: 4,
    },
    monthLabel: {
      position: 'absolute',
      fontSize: 9,
      color: c.textMuted,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    body: {
      flexDirection: 'row',
    },
    dayCol: {
      width: 24,
      paddingRight: 4,
    },
    dayLabel: {
      fontSize: 8,
      color: c.textMuted,
      fontWeight: '700',
      lineHeight: CELL,
      textAlign: 'right',
    },
    grid: {
      flexDirection: 'row',
    },
    col: {
      flexDirection: 'column',
    },
    cell: {
      width: CELL,
      height: CELL,
      borderRadius: 3,
    },
    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 14,
      paddingLeft: 24,
    },
    legendLabel: {
      fontSize: 9,
      color: c.textMuted,
      fontWeight: '700',
    },
    legendCell: {
      width: 10,
      height: 10,
      borderRadius: 2,
    },
  });
}
