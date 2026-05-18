import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, View, Text, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { Radii } from '../../constants/theme';
import { FaceRegion, RegionalFinding } from '../../types';
import { useColors } from '../../state/theme';

const AnimatedG = Animated.createAnimatedComponent(G);

type Severity = RegionalFinding['severity'];

/**
 * Solid reference swatch per severity — used by the legend dots and the
 * detail chip (a CSS background can't be an SVG gradient). The on-face
 * heatmap uses the RadialGradients defined in <Defs> instead, which fade
 * to transparent so the underlying skin + features stay visible.
 */
const SEVERITY_SWATCH: Record<Severity, string> = {
  none: 'rgba(34,197,94,0.85)',     // soft green
  mild: 'rgba(245,176,65,0.92)',    // warm amber
  moderate: 'rgba(234,118,40,0.95)',// orange
  severe: 'rgba(225,49,49,0.96)',   // red
};

/** Strong (gradient-center) color per severity. */
const SEVERITY_CORE: Record<Severity, string> = {
  none: '#22C55E',
  mild: '#F5B041',
  moderate: '#EA7628',
  severe: '#E13131',
};

/**
 * Center opacity for each severity's radial gradient. Severity reads through
 * saturation + center opacity rather than brute global opacity, so the face
 * never turns into a muddy puddle. "none" is barely-there on purpose.
 */
const SEVERITY_CENTER_OPACITY: Record<Severity, number> = {
  none: 0.16,
  mild: 0.34,
  moderate: 0.46,
  severe: 0.58,
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

const SEVERITIES: Severity[] = ['none', 'mild', 'moderate', 'severe'];

interface RegionalSkinMapProps {
  findings: RegionalFinding[];
  /** Width of the rendered map in points. Defaults to 280. */
  width?: number;
  /** When tapping a region, fires with the region key. */
  onRegionPress?: (region: FaceRegion) => void;
  /** Highlight a specific region (e.g., the one user just tapped). */
  selected?: FaceRegion | null;
}

// Coordinates calibrated for a 280×336 viewBox (face filling most of it).
const VB_W = 280;
const VB_H = 336;

/**
 * The face silhouette, defined once and reused as: (a) the skin fill,
 * (b) the clip-path geometry that contains every heatmap zone, and
 * (c) the visible rim. Keeping a single source of truth guarantees the
 * heatmap can never bleed past the face edge.
 */
const FACE_PATH = `
  M 60 132
  Q 58 70  140 60
  Q 222 70  220 132
  Q 224 198 202 248
  Q 182 296 140 309
  Q 98 296 78 248
  Q 56 198 60 132
  Z
`;

/**
 * Per-region heatmap geometry. Each zone is an ellipse painted with a soft
 * radial gradient (strong center → transparent edge) so zones feather out
 * instead of showing hard borders, and adjacent zones blend rather than
 * stacking as opaque puddles. Sized + placed to actually sit where the
 * facial region is; nothing spans the full face width any more.
 */
const REGION_ZONES: {
  region: FaceRegion;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Optional clockwise rotation in degrees (for the angled cheek zones). */
  rot?: number;
}[] = [
  { region: 'forehead', cx: 140, cy: 96, rx: 58, ry: 30 },
  { region: 'eyeArea', cx: 140, cy: 150, rx: 62, ry: 16 },
  { region: 'leftCheek', cx: 99, cy: 196, rx: 30, ry: 34, rot: -14 },
  { region: 'rightCheek', cx: 181, cy: 196, rx: 30, ry: 34, rot: 14 },
  { region: 'nose', cx: 140, cy: 182, rx: 13, ry: 34 },
  { region: 'chin', cx: 140, cy: 276, rx: 30, ry: 24 },
  { region: 'jawline', cx: 140, cy: 256, rx: 78, ry: 52 },
];

/**
 * RegionalSkinMap — anatomically-grounded face SVG with a contained,
 * clinical severity heatmap.
 *
 * Every severity zone is clipped to the face silhouette and painted with a
 * soft radial gradient, so the heatmap reads as a premium Haut.AI / Lóvi
 * style overlay rather than floating colored blobs. Active (non-"none")
 * regions pulse with a gentle whole-zone opacity oscillation.
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
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
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

  // Subtle whole-zone opacity pulse for active regions (no halo ring).
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 0.96],
  });

  const scale = width / VB_W;

  const zones = REGION_ZONES.map(z => {
    const finding = findingByRegion[z.region];
    const sev: Severity = finding?.severity ?? 'none';
    const isSelected = selected === z.region;
    const isActive = sev !== 'none';

    const transform = z.rot ? `rotate(${z.rot} ${z.cx} ${z.cy})` : undefined;

    // Heatmap fill, clipped to the face so it can never spill outside.
    const fill = (
      <React.Fragment key={z.region}>
        {isActive ? (
          <AnimatedG opacity={pulseOpacity as unknown as number}>
            <Ellipse
              cx={z.cx}
              cy={z.cy}
              rx={z.rx}
              ry={z.ry}
              fill={`url(#sev-${sev})`}
              transform={transform}
            />
          </AnimatedG>
        ) : (
          <Ellipse
            cx={z.cx}
            cy={z.cy}
            rx={z.rx}
            ry={z.ry}
            fill={`url(#sev-${sev})`}
            transform={transform}
          />
        )}
        {isSelected && (
          <Ellipse
            cx={z.cx}
            cy={z.cy}
            rx={z.rx}
            ry={z.ry}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2}
            strokeOpacity={0.9}
            transform={transform}
          />
        )}
      </React.Fragment>
    );

    // Transparent press target mirroring the zone's bounding box.
    const pressable = onRegionPress ? (
      <Pressable
        key={z.region + '-press'}
        onPress={() => onRegionPress(z.region)}
        accessibilityRole="button"
        accessibilityLabel={`${REGION_LABEL[z.region]} region${
          isActive ? `, ${sev} concern` : ''
        }`}
        style={{
          position: 'absolute',
          left: (z.cx - z.rx) * scale,
          top: (z.cy - z.ry) * scale,
          width: 2 * z.rx * scale,
          height: 2 * z.ry * scale,
        }}
      />
    ) : null;

    return { fill, pressable };
  });

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          {/* Skin + hair base */}
          <RadialGradient id="faceFill" cx="50%" cy="38%" r="62%">
            <Stop offset="0%" stopColor="#FFE7D6" stopOpacity={1} />
            <Stop offset="70%" stopColor="#F2CDB4" stopOpacity={1} />
            <Stop offset="100%" stopColor="#E4BC9F" stopOpacity={1} />
          </RadialGradient>
          <SvgLinearGradient id="hairFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#231915" stopOpacity={1} />
            <Stop offset="100%" stopColor="#3C2B22" stopOpacity={1} />
          </SvgLinearGradient>

          {/* One soft radial heatmap gradient per severity: a saturated but
              low-opacity core that fades fully to transparent at the rim. */}
          {SEVERITIES.map(sev => (
            <RadialGradient
              key={sev}
              id={`sev-${sev}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <Stop
                offset="0%"
                stopColor={SEVERITY_CORE[sev]}
                stopOpacity={SEVERITY_CENTER_OPACITY[sev]}
              />
              <Stop
                offset="55%"
                stopColor={SEVERITY_CORE[sev]}
                stopOpacity={SEVERITY_CENTER_OPACITY[sev] * 0.55}
              />
              <Stop
                offset="100%"
                stopColor={SEVERITY_CORE[sev]}
                stopOpacity={0}
              />
            </RadialGradient>
          ))}

          {/* The clip-path is the face silhouette itself. */}
          <ClipPath id="faceClip">
            <Path d={FACE_PATH} />
          </ClipPath>
        </Defs>

        {/* Hair / shadow behind the face */}
        <Path
          d="M68 78 Q140 -6 212 78 L222 138 Q226 78 200 54 Q140 4 80 54 Q54 78 58 138 Z"
          fill="url(#hairFill)"
          opacity={0.9}
        />

        {/* Face skin */}
        <Path
          d={FACE_PATH}
          fill="url(#faceFill)"
          stroke="rgba(28,24,20,0.16)"
          strokeWidth={1}
        />

        {/* Brows */}
        <Path
          d="M88 134 Q108 126 128 133"
          stroke="rgba(28,24,20,0.30)"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M152 133 Q172 126 192 134"
          stroke="rgba(28,24,20,0.30)"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />

        {/* Eyes */}
        <Ellipse cx={108} cy={150} rx={12} ry={5.5} fill="rgba(255,255,255,0.55)" />
        <Ellipse cx={172} cy={150} rx={12} ry={5.5} fill="rgba(255,255,255,0.55)" />
        <Circle cx={108} cy={150} r={3.4} fill="rgba(28,24,20,0.72)" />
        <Circle cx={172} cy={150} r={3.4} fill="rgba(28,24,20,0.72)" />

        {/* Nose */}
        <Path
          d="M140 156 L133 200 Q140 206 147 200"
          stroke="rgba(28,24,20,0.16)"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />

        {/* Lips */}
        <Path
          d="M118 236 Q140 244 162 236 Q151 252 140 252 Q129 252 118 236 Z"
          fill="rgba(138,120,96,0.42)"
        />

        {/* Severity heatmap — entirely contained within the face outline. */}
        <G clipPath="url(#faceClip)">{zones.map(z => z.fill)}</G>

        {/* Crisp face rim drawn last so the heatmap reads as inside the skin. */}
        <Path
          d={FACE_PATH}
          fill="none"
          stroke="rgba(28,24,20,0.20)"
          strokeWidth={1.25}
        />
      </Svg>

      {/* Pressable overlays mirror the SVG zones */}
      {zones.map(z => z.pressable).filter(Boolean)}

      {/* Legend */}
      <View
        style={[
          styles.legend,
          { backgroundColor: colors.bgCard, borderColor: colors.border },
        ]}
      >
        {SEVERITIES.map(sev => (
          <View key={sev} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: SEVERITY_SWATCH[sev] }]} />
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
  const swatch = SEVERITY_SWATCH[finding.severity];
  const core = SEVERITY_CORE[finding.severity];
  return (
    <View style={[styles.chip, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={[styles.chipDot, { backgroundColor: swatch }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.chipRegion, { color: colors.textPrimary }]}>
          {REGION_LABEL[finding.region] ?? finding.region}
        </Text>
        <Text style={[styles.chipObs, { color: colors.textSecondary }]}>{finding.observation}</Text>
      </View>
      <Text style={[styles.chipSev, { color: core }]}>
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
