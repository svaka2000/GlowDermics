/**
 * SkinSpectrum — 16-axis radar chart of a SkinScoreV2.
 *
 * Renders an SVG polygon over a polar grid where each axis represents one
 * skin dimension. Optional overlay of a previous scan (rendered in a lighter
 * tint behind the current polygon) for trend visualization.
 *
 * Animated reveal: polygon scales from a small inner radius to its full shape
 * via a Reanimated 4 worklet (no per-frame JS).
 *
 * Usage:
 *   <SkinSpectrum current={scan.scoresV2} previous={prev?.scoresV2} size={300} />
 */
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Circle, Line, Text as SvgText, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedProps,
  withTiming, withDelay, Easing as REasing,
} from 'react-native-reanimated';
import type { SkinScoreV2 } from '../../types';
import { useColors } from '../../state/theme';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

/** The 15 non-overall dimensions, ordered around the circle. */
const AXES: { key: keyof SkinScoreV2; label: string }[] = [
  { key: 'hydration',     label: 'Hydra' },
  { key: 'barrierHealth', label: 'Barrier' },
  { key: 'radiance',      label: 'Radiance' },
  { key: 'evenness',      label: 'Even' },
  { key: 'clarity',       label: 'Clarity' },
  { key: 'texture',       label: 'Texture' },
  { key: 'firmness',      label: 'Firm' },
  { key: 'pores',         label: 'Pores' },
  { key: 'oiliness',      label: 'Oil' },
  { key: 'acne',          label: 'Acne' },
  { key: 'redness',       label: 'Redness' },
  { key: 'sensitivity',   label: 'Sens' },
  { key: 'darkSpots',     label: 'Spots' },
  { key: 'darkCircles',   label: 'Circles' },
  { key: 'wrinkles',      label: 'Lines' },
];

interface Props {
  current: SkinScoreV2;
  previous?: SkinScoreV2 | null;
  /** Chart diameter (rendered region is a circle inscribed in this size). */
  size?: number;
  /** Animation reveal delay. */
  delay?: number;
}

/** Polar coordinates → cartesian. */
function polar(cx: number, cy: number, radius: number, angle: number) {
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

function buildPoints(values: number[], cx: number, cy: number, maxR: number, angles: number[]): string {
  return values
    .map((v, i) => {
      const r = (Math.max(0, Math.min(100, v)) / 100) * maxR;
      const p = polar(cx, cy, r, angles[i]);
      return `${p.x},${p.y}`;
    })
    .join(' ');
}

export function SkinSpectrum({
  current,
  previous,
  size = 280,
  delay = 0,
}: Props) {
  const colors = useColors();

  // pad must leave horizontal room for the side axis labels (≈46px wide at
  // fontSize 8). With labelDist = maxR + 16, the rightmost label edge is
  // cx + (maxR+16) + labelWidth = size + 16 - pad + labelWidth, so pad must
  // be ≥ 16 + labelWidth (~62) or the 3/9-o'clock labels clip the SVG edge.
  const pad = 70;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = (size / 2) - pad;

  const angles = useMemo(
    () => AXES.map((_, i) => -Math.PI / 2 + (i / AXES.length) * Math.PI * 2),
    [],
  );

  const currentValues = useMemo(
    () => AXES.map(a => current[a.key]),
    [current],
  );
  const previousValues = useMemo(
    () => previous ? AXES.map(a => previous[a.key]) : null,
    [previous],
  );

  const currentPoints = useMemo(
    () => buildPoints(currentValues, cx, cy, maxR, angles),
    [currentValues, cx, cy, maxR, angles],
  );

  const previousPoints = useMemo(
    () => previousValues ? buildPoints(previousValues, cx, cy, maxR, angles) : null,
    [previousValues, cx, cy, maxR, angles],
  );

  // Reveal animation — current polygon scales from 0 → full
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = 0;
    reveal.value = withDelay(delay, withTiming(1, { duration: 900, easing: REasing.out(REasing.cubic) }));
  }, [current, delay]);

  const animProps = useAnimatedProps(() => {
    const scale = reveal.value;
    const scaledPoints = currentValues
      .map((v, i) => {
        const r = ((Math.max(0, Math.min(100, v)) / 100) * maxR) * scale;
        const p = polar(cx, cy, r, angles[i]);
        return `${p.x},${p.y}`;
      })
      .join(' ');
    return {
      points: scaledPoints,
    };
  });

  // Grid rings at 25, 50, 75, 100
  const gridRings = [0.25, 0.5, 0.75, 1].map(r => maxR * r);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="spectrum-fill" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.45" />
            <Stop offset="1" stopColor={colors.primary} stopOpacity="0.15" />
          </RadialGradient>
        </Defs>

        {/* Grid rings */}
        {gridRings.map((r, i) => (
          <Circle
            key={`ring-${i}`}
            cx={cx}
            cy={cy}
            r={r}
            stroke={colors.border}
            strokeWidth={1}
            fill="none"
          />
        ))}

        {/* Axis spokes */}
        {angles.map((a, i) => {
          const end = polar(cx, cy, maxR, a);
          return (
            <Line
              key={`spoke-${i}`}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke={colors.border}
              strokeWidth={0.6}
              opacity={0.6}
            />
          );
        })}

        {/* Previous scan polygon (no animation, sits behind current) */}
        {previousPoints && (
          <Polygon
            points={previousPoints}
            fill={colors.textMuted + '22'}
            stroke={colors.textMuted}
            strokeWidth={1.2}
            strokeDasharray="3 3"
          />
        )}

        {/* Current scan polygon — animated reveal */}
        <AnimatedPolygon
          animatedProps={animProps}
          fill="url(#spectrum-fill)"
          stroke={colors.primary}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Vertex dots */}
        {angles.map((a, i) => {
          const v = currentValues[i] / 100;
          const r = v * maxR;
          const p = polar(cx, cy, r, a);
          return (
            <Circle
              key={`dot-${i}`}
              cx={p.x}
              cy={p.y}
              r={2.5}
              fill={colors.primary}
            />
          );
        })}

        {/* Axis labels */}
        {AXES.map((axis, i) => {
          const labelAngle = angles[i];
          const labelDist = maxR + 16;
          const p = polar(cx, cy, labelDist, labelAngle);
          // Adjust anchor so labels don't overlap the chart
          let anchor: 'start' | 'middle' | 'end' = 'middle';
          const cosAngle = Math.cos(labelAngle);
          if (cosAngle > 0.2) anchor = 'start';
          else if (cosAngle < -0.2) anchor = 'end';

          return (
            <SvgText
              key={`label-${i}`}
              x={p.x}
              y={p.y + 3}
              fill={colors.textMuted}
              fontSize={8}
              fontWeight="700"
              textAnchor={anchor}
              letterSpacing={0.3}
            >
              {axis.label.toUpperCase()}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
  },
});
