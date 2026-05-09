import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';
import { FaceRegion, RegionalFinding } from '../../types';

const SEVERITY_RANK: Record<RegionalFinding['severity'], number> = {
  none: 0,
  mild: 1,
  moderate: 2,
  severe: 3,
};

const DELTA_COLOR = {
  improved: '#16A34A',  // green
  same: 'rgba(28,24,20,0.18)',
  worsened: '#DC2626',  // red
};

const REGION_LABEL: Record<FaceRegion, string> = {
  forehead: 'Forehead',
  leftCheek: 'L Cheek',
  rightCheek: 'R Cheek',
  nose: 'Nose',
  chin: 'Chin',
  eyeArea: 'Under Eyes',
  jawline: 'Jawline',
  lipArea: 'Lips',
};

// Same coordinates as RegionalSkinMap so visuals stay consistent.
const REGION_COORDS: { region: FaceRegion; cx: number; cy: number; rx: number; ry: number }[] = [
  { region: 'forehead',   cx: 140, cy: 80,  rx: 80, ry: 26 },
  { region: 'leftCheek',  cx: 88,  cy: 178, rx: 32, ry: 30 },
  { region: 'rightCheek', cx: 192, cy: 178, rx: 32, ry: 30 },
  { region: 'nose',       cx: 140, cy: 168, rx: 14, ry: 36 },
  { region: 'chin',       cx: 140, cy: 270, rx: 32, ry: 22 },
  { region: 'eyeArea',    cx: 140, cy: 145, rx: 80, ry: 14 },
  { region: 'jawline',    cx: 140, cy: 240, rx: 92, ry: 16 },
];

interface RegionalDeltaMapProps {
  before: RegionalFinding[];
  after: RegionalFinding[];
  width?: number;
}

/**
 * RegionalDeltaMap — face SVG showing PER-REGION DELTA between two scans.
 *
 * Each region is colored by the change in severity:
 *   - improved (severity decreased) → green
 *   - same (no change) → neutral
 *   - worsened (severity increased) → red
 *
 * Region opacity reflects magnitude of change. A small delta arrow icon sits
 * inside each active zone.
 */
export function RegionalDeltaMap({ before, after, width = 280 }: RegionalDeltaMapProps) {
  const height = width * 1.2;
  const VB_W = 280;
  const VB_H = 336;

  const beforeMap = useMemo(() => {
    const m: Partial<Record<FaceRegion, RegionalFinding>> = {};
    for (const f of before) m[f.region] = f;
    return m;
  }, [before]);

  const afterMap = useMemo(() => {
    const m: Partial<Record<FaceRegion, RegionalFinding>> = {};
    for (const f of after) m[f.region] = f;
    return m;
  }, [after]);

  const regionDeltas = REGION_COORDS.map(r => {
    const b = beforeMap[r.region];
    const a = afterMap[r.region];
    const bRank = b ? SEVERITY_RANK[b.severity] : 0;
    const aRank = a ? SEVERITY_RANK[a.severity] : 0;
    const delta = aRank - bRank; // negative = improved, positive = worsened
    const dir: 'improved' | 'same' | 'worsened' =
      delta < 0 ? 'improved' : delta > 0 ? 'worsened' : 'same';
    const magnitude = Math.min(3, Math.abs(delta));
    return { ...r, delta, dir, magnitude };
  });

  const summary = regionDeltas.reduce(
    (acc, r) => {
      acc[r.dir] += 1;
      return acc;
    },
    { improved: 0, same: 0, worsened: 0 } as Record<'improved' | 'same' | 'worsened', number>,
  );

  return (
    <View style={[styles.wrap, { width }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <RadialGradient id="dmFaceFill" cx="50%" cy="40%" r="60%">
            <Stop offset="0%" stopColor="#FFE4D2" stopOpacity={1} />
            <Stop offset="100%" stopColor="#E8C8B0" stopOpacity={1} />
          </RadialGradient>
          <SvgLinearGradient id="dmHairFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#1F1612" stopOpacity={1} />
            <Stop offset="100%" stopColor="#3A2A22" stopOpacity={1} />
          </SvgLinearGradient>
        </Defs>

        <Path
          d="M70 70 Q140 -10 210 70 L220 130 Q224 70 200 50 Q140 0 80 50 Q56 70 60 130 Z"
          fill="url(#dmHairFill)"
          opacity={0.85}
        />
        <Path
          d="M 60 130 Q 60 70 140 60 Q 220 70 220 130 Q 224 200 200 250 Q 180 295 140 308 Q 100 295 80 250 Q 56 200 60 130 Z"
          fill="url(#dmFaceFill)"
          stroke="rgba(28,24,20,0.18)"
          strokeWidth={1}
        />
        <Ellipse cx={108} cy={148} rx={11} ry={5} fill="rgba(28,24,20,0.55)" />
        <Ellipse cx={172} cy={148} rx={11} ry={5} fill="rgba(28,24,20,0.55)" />
        <Path d="M140 150 L134 195 Q140 200 146 195 Z" fill="rgba(28,24,20,0.10)" />
        <Path
          d="M120 232 Q140 240 160 232 Q150 248 140 248 Q130 248 120 232 Z"
          fill="rgba(196,98,45,0.45)"
        />

        {regionDeltas.map(r => {
          const color = DELTA_COLOR[r.dir];
          const opacity = r.dir === 'same' ? 0.45 : 0.45 + r.magnitude * 0.18;
          return (
            <React.Fragment key={r.region}>
              <Ellipse
                cx={r.cx}
                cy={r.cy}
                rx={r.rx}
                ry={r.ry}
                fill={color}
                fillOpacity={opacity}
                stroke="rgba(255,255,255,0.6)"
                strokeWidth={1}
              />
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Summary pills */}
      <View style={styles.summary}>
        <View style={[styles.pill, { backgroundColor: 'rgba(22,163,74,0.10)' }]}>
          <Ionicons name="trending-up" size={11} color={DELTA_COLOR.improved} />
          <Text style={[styles.pillText, { color: DELTA_COLOR.improved }]}>
            {summary.improved} improved
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: 'rgba(28,24,20,0.06)' }]}>
          <Ionicons name="remove" size={11} color={Colors.textMuted} />
          <Text style={[styles.pillText, { color: Colors.textMuted }]}>
            {summary.same} same
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: 'rgba(220,38,38,0.10)' }]}>
          <Ionicons name="trending-down" size={11} color={DELTA_COLOR.worsened} />
          <Text style={[styles.pillText, { color: DELTA_COLOR.worsened }]}>
            {summary.worsened} regressed
          </Text>
        </View>
      </View>

      {/* Per-region delta list */}
      <View style={styles.list}>
        {regionDeltas
          .filter(r => r.dir !== 'same')
          .sort((a, b) => b.magnitude - a.magnitude)
          .map(r => {
            const a = afterMap[r.region];
            const b = beforeMap[r.region];
            const color = DELTA_COLOR[r.dir];
            return (
              <View key={r.region} style={styles.row}>
                <View style={[styles.rowDot, { backgroundColor: color }]} />
                <Text style={styles.rowLabel}>{REGION_LABEL[r.region]}</Text>
                <View style={styles.rowMid}>
                  <Text style={styles.rowSev}>{b?.severity ?? 'none'}</Text>
                  <Ionicons name="arrow-forward" size={10} color={Colors.textMuted} />
                  <Text style={[styles.rowSev, { color }]}>{a?.severity ?? 'none'}</Text>
                </View>
                <Text style={[styles.rowDir, { color }]}>
                  {r.dir === 'improved' ? '↑' : '↓'} {r.magnitude}
                </Text>
              </View>
            );
          })}
        {regionDeltas.every(r => r.dir === 'same') && (
          <Text style={styles.empty}>No regional changes between scans.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', alignSelf: 'center', gap: 12 },
  summary: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  pillText: { fontSize: 11, fontWeight: '800' },
  list: { width: '100%', gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowDot: { width: 8, height: 8, borderRadius: 4 },
  rowLabel: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  rowMid: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowSev: { fontSize: 10, color: Colors.textSecondary, fontWeight: '700', textTransform: 'capitalize' },
  rowDir: { fontSize: 12, fontWeight: '900' },
  empty: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingVertical: 6 },
});
