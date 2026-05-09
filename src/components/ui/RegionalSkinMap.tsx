import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, View, Text, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { Radii } from '../../constants/theme';
import { FaceRegion, RegionalFinding } from '../../types';
import { useColors } from '../../state/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

interface RegionalSkinMapProps {
  findings: RegionalFinding[];
  /** Width of the rendered map in points. Defaults to 280. */
  width?: number;
  /** When tapping a region, fires with the region key. */
  onRegionPress?: (region: FaceRegion) => void;
  /** Highlight a specific region (e.g., the one user just tapped). */
  selected?: FaceRegion | null;
}

const SEVERITY_COLOR: Record<RegionalFinding['severity'], string> = {
  none: 'rgba(22,163,74,0.45)',     // green
  mild: 'rgba(251,191,36,0.55)',    // amber
  moderate: 'rgba(217,119,6,0.65)', // orange
  severe: 'rgba(220,38,38,0.75)',   // red
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

/**
 * RegionalSkinMap — anatomically-grounded face SVG with severity heatmap zones.
 *
 * Each region (forehead, cheeks, nose, chin, under-eye, jawline) is rendered as
 * an ellipse over a face outline. Severity drives the fill color, and the
 * regions pulse softly to draw attention to active concerns.
 *
 * Designed to feel premium and clinical — Haut.AI / Lóvi style.
 */
export function RegionalSkinMap({
  findings,
  width = 280,
  onRegionPress,
  selected,
}: RegionalSkinMapProps) {
  const colors = useColors();
  const height = width * 1.2;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const findingByRegion = useMemo(() => {
    const map: Partial<Record<FaceRegion, RegionalFinding>> = {};
    for (const f of findings) map[f.region] = f;
    return map;
  }, [findings]);

  // Pulsing opacity animation for active regions.
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.95] });

  // Coordinates calibrated for a 280×336 viewBox (face filling most of it).
  const VB_W = 280;
  const VB_H = 336;

  const regionRects: { region: FaceRegion; cx: number; cy: number; rx: number; ry: number }[] = [
    { region: 'forehead',   cx: 140, cy: 80,  rx: 80, ry: 26 },
    { region: 'leftCheek',  cx: 88,  cy: 178, rx: 32, ry: 30 },
    { region: 'rightCheek', cx: 192, cy: 178, rx: 32, ry: 30 },
    { region: 'nose',       cx: 140, cy: 168, rx: 14, ry: 36 },
    { region: 'chin',       cx: 140, cy: 270, rx: 32, ry: 22 },
    { region: 'eyeArea',    cx: 140, cy: 145, rx: 80, ry: 14 },
    { region: 'jawline',    cx: 140, cy: 240, rx: 92, ry: 16 },
  ];

  const renderRegion = (r: typeof regionRects[number]) => {
    const finding = findingByRegion[r.region];
    const sev: RegionalFinding['severity'] = finding?.severity ?? 'none';
    const color = SEVERITY_COLOR[sev];
    const isSelected = selected === r.region;
    const isActive = sev !== 'none';

    const handle = onRegionPress
      ? (
          <Pressable
            key={r.region + '-press'}
            onPress={() => onRegionPress(r.region)}
            style={{
              position: 'absolute',
              left: (r.cx - r.rx) * (width / VB_W),
              top: (r.cy - r.ry) * (width / VB_W),
              width: 2 * r.rx * (width / VB_W),
              height: 2 * r.ry * (width / VB_W),
            }}
          />
        )
      : null;

    return { svg: (
      <React.Fragment key={r.region}>
        {/* outer halo for active regions */}
        {isActive && (
          <AnimatedEllipse
            cx={r.cx}
            cy={r.cy}
            rx={r.rx + 4}
            ry={r.ry + 4}
            fill={color}
            opacity={pulseOpacity as any}
          />
        )}
        <Ellipse
          cx={r.cx}
          cy={r.cy}
          rx={r.rx}
          ry={r.ry}
          fill={color}
          stroke={isSelected ? colors.primary : 'rgba(255,255,255,0.6)'}
          strokeWidth={isSelected ? 2.5 : 1}
        />
      </React.Fragment>
    ), pressable: handle };
  };

  const rendered = regionRects.map(renderRegion);

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <RadialGradient id="faceFill" cx="50%" cy="40%" r="60%">
            <Stop offset="0%" stopColor="#FFE4D2" stopOpacity={1} />
            <Stop offset="100%" stopColor="#E8C8B0" stopOpacity={1} />
          </RadialGradient>
          <SvgLinearGradient id="hairFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#1F1612" stopOpacity={1} />
            <Stop offset="100%" stopColor="#3A2A22" stopOpacity={1} />
          </SvgLinearGradient>
        </Defs>

        {/* Hair / shadow behind face */}
        <Path
          d="M70 70 Q140 -10 210 70 L220 130 Q224 70 200 50 Q140 0 80 50 Q56 70 60 130 Z"
          fill="url(#hairFill)"
          opacity={0.85}
        />

        {/* Face outline — soft oval */}
        <Path
          d={`
            M 60 130
            Q 60 70  140 60
            Q 220 70  220 130
            Q 224 200 200 250
            Q 180 295 140 308
            Q 100 295 80 250
            Q 56 200 60 130
            Z
          `}
          fill="url(#faceFill)"
          stroke="rgba(28,24,20,0.18)"
          strokeWidth={1}
        />

        {/* Eye sockets — subtle */}
        <Ellipse cx={108} cy={148} rx={11} ry={5} fill="rgba(28,24,20,0.55)" />
        <Ellipse cx={172} cy={148} rx={11} ry={5} fill="rgba(28,24,20,0.55)" />

        {/* Nose hint */}
        <Path d="M140 150 L134 195 Q140 200 146 195 Z" fill="rgba(28,24,20,0.10)" />

        {/* Lips */}
        <Path
          d="M120 232 Q140 240 160 232 Q150 248 140 248 Q130 248 120 232 Z"
          fill="rgba(196,98,45,0.45)"
        />

        {/* Severity heat regions — render on top */}
        {rendered.map(r => r.svg)}
      </Svg>

      {/* Pressable overlays mirror SVG ellipses */}
      {rendered.map(r => r.pressable).filter(Boolean)}

      {/* Legend */}
      <View style={styles.legend}>
        {(['none', 'mild', 'moderate', 'severe'] as const).map(sev => (
          <View key={sev} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: SEVERITY_COLOR[sev] }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{sev}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Small chip below the face map showing the selected region's finding. */
export function RegionDetailChip({
  finding,
}: {
  finding: RegionalFinding | undefined;
}) {
  const colors = useColors();
  if (!finding) return null;
  const color = SEVERITY_COLOR[finding.severity];
  return (
    <View style={[styles.chip, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.chipRegion, { color: colors.textPrimary }]}>
          {REGION_LABEL[finding.region] ?? finding.region}
        </Text>
        <Text style={[styles.chipObs, { color: colors.textSecondary }]}>{finding.observation}</Text>
      </View>
      <Text style={[styles.chipSev, { color: color.replace(/[\d.]+\)/, '1)') }]}>
        {finding.severity.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  legend: {
    position: 'absolute',
    bottom: -2,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: Radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(28,24,20,0.06)',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 9, height: 9, borderRadius: 4.5 },
  legendText: { fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: Radii.lg,
    padding: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  chipDot: { width: 10, height: 10, borderRadius: 5 },
  chipRegion: { fontSize: 13, fontWeight: '800' },
  chipObs: { fontSize: 12, marginTop: 1 },
  chipSev: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
});
