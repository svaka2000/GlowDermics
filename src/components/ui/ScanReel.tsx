/**
 * ScanReel — Instagram-style horizontal carousel of recent scan thumbnails.
 *
 * Each thumbnail is a circular avatar with:
 *   - the scan photo
 *   - a colored score-ring around the edge (green/gold/red by score band)
 *   - a small score chip in the bottom-right
 *   - "TODAY" / day-of-week label below
 *
 * The first item is always a "+" card that routes to the scan flow.
 *
 * Designed to live at the top of the home tab as a fast visual recall of
 * "what your skin has looked like recently".
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Dimensions } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSpring,
} from 'react-native-reanimated';
import { Storage } from '../../services/storage';
import { useColors } from '../../state/theme';
import type { Palette } from '../../constants/colors';
import type { ScanHistoryEntry } from '../../types';

const ITEM_SIZE = 68;
const STROKE = 3;
const RING_R = ITEM_SIZE / 2 - STROKE / 2;
const RING_CIRC = 2 * Math.PI * RING_R;

interface Props {
  /** Maximum number of scans to render (default 8). */
  limit?: number;
  /** Outer horizontal padding for the scrollview content (default 20). */
  paddingHorizontal?: number;
}

export function ScanReel({ limit = 8, paddingHorizontal = 20 }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [scans, setScans] = useState<ScanHistoryEntry[] | null>(null);

  useEffect(() => {
    let mounted = true;
    Storage.getScanHistory().then(h => {
      if (!mounted) return;
      setScans(h.slice(0, limit));
    }).catch(() => setScans([]));
    return () => { mounted = false; };
  }, [limit]);

  // Hide entirely if no data ever — but show the "+ scan" CTA if there are zero scans
  if (scans == null) {
    return null; // skeleton invisible — strip is short, no need
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, { paddingHorizontal }]}
    >
      <NewScanCard index={0} />
      {scans.map((scan, i) => (
        <ScanItem key={scan.id} scan={scan} index={i + 1} isLatest={i === 0} />
      ))}
    </ScrollView>
  );
}

function NewScanCard({ index }: { index: number }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const op = useSharedValue(0);
  const scale = useSharedValue(0.85);
  useEffect(() => {
    op.value = withDelay(index * 50, withTiming(1, { duration: 320 }));
    scale.value = withDelay(index * 50, withSpring(1, { damping: 12 }));
  }, []);
  const s = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.itemWrap, s]}>
      <Pressable style={styles.item} onPress={() => router.push('/scan' as any)}>
        <View style={[styles.thumbWrap, styles.newScanThumb]}>
          <Ionicons name="add" size={26} color={colors.primary} />
        </View>
      </Pressable>
      <Text style={styles.label}>NEW</Text>
    </Animated.View>
  );
}

function ScanItem({ scan, index, isLatest }: { scan: ScanHistoryEntry; index: number; isLatest: boolean }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const ringColor =
    scan.overallScore >= 75 ? colors.scoreGood :
    scan.overallScore >= 60 ? colors.gold :
    colors.scorePoor;

  const op = useSharedValue(0);
  const scale = useSharedValue(0.85);
  useEffect(() => {
    op.value = withDelay(index * 50, withTiming(1, { duration: 320 }));
    scale.value = withDelay(index * 50, withSpring(1, { damping: 12 }));
  }, []);
  const s = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ scale: scale.value }],
  }));

  const dateLabel = (() => {
    const d = new Date(scan.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDay = new Date(d);
    targetDay.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - targetDay.getTime()) / (24 * 60 * 60 * 1000));
    if (diff === 0) return 'TODAY';
    if (diff === 1) return 'YESTERDAY';
    if (diff <= 6) return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  })();

  return (
    <Animated.View style={[styles.itemWrap, s]}>
      <Pressable style={styles.item} onPress={() => router.push(`/results/${scan.id}` as any)}>
        <Svg width={ITEM_SIZE} height={ITEM_SIZE} style={styles.ring}>
          <Circle
            cx={ITEM_SIZE / 2}
            cy={ITEM_SIZE / 2}
            r={RING_R}
            stroke={colors.bgElevated}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={ITEM_SIZE / 2}
            cy={ITEM_SIZE / 2}
            r={RING_R}
            stroke={ringColor}
            strokeWidth={STROKE}
            strokeDasharray={RING_CIRC}
            strokeDashoffset={RING_CIRC * (1 - scan.overallScore / 100)}
            strokeLinecap="round"
            transform={`rotate(-90 ${ITEM_SIZE / 2} ${ITEM_SIZE / 2})`}
            fill="none"
          />
        </Svg>
        <View style={styles.thumbWrap}>
          {scan.imageUri ? (
            <Image source={{ uri: scan.imageUri }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbEmpty]}>
              <Ionicons name="person" size={20} color={colors.textMuted} />
            </View>
          )}
        </View>
        <View style={[styles.scoreChip, { backgroundColor: ringColor }]}>
          <Text style={styles.scoreChipText}>{scan.overallScore}</Text>
        </View>
      </Pressable>
      <Text style={[styles.label, isLatest && { color: colors.primary }]}>{dateLabel}</Text>
    </Animated.View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    scroll: { gap: 12, paddingVertical: 8 },
    itemWrap: { alignItems: 'center', gap: 6 },
    item: {
      width: ITEM_SIZE, height: ITEM_SIZE,
      alignItems: 'center', justifyContent: 'center',
    },
    ring: {
      position: 'absolute',
    },
    thumbWrap: {
      width: ITEM_SIZE - STROKE * 2 - 4,
      height: ITEM_SIZE - STROKE * 2 - 4,
      borderRadius: (ITEM_SIZE - STROKE * 2 - 4) / 2,
      overflow: 'hidden',
      backgroundColor: c.bgElevated,
    },
    thumb: { width: '100%', height: '100%' },
    thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
    newScanThumb: {
      borderWidth: 2,
      borderColor: c.primary,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary + '0F',
    },
    scoreChip: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      borderRadius: 100,
      paddingHorizontal: 5,
      paddingVertical: 2,
      minWidth: 22,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: c.bg,
    },
    scoreChipText: {
      fontSize: 9,
      fontWeight: '900',
      color: '#fff',
      letterSpacing: 0.2,
    },
    label: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1.2,
      color: c.textMuted,
    },
  });
}
