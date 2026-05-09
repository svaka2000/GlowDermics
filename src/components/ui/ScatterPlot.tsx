import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Line,
  Path,
  Text as SvgText,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

interface DataPoint {
  x: number;
  y: number;
  /** Optional tooltip / label. */
  label?: string;
}

interface ScatterPlotProps {
  data: DataPoint[];
  /** Display width. */
  width?: number;
  /** Display height. */
  height?: number;
  /** X-axis title (rendered below). */
  xLabel?: string;
  /** Y-axis title (rendered rotated on the left). */
  yLabel?: string;
  /** Force x-axis range. Defaults to nice rounding around data extremes. */
  xRange?: [number, number];
  /** Force y-axis range. Defaults to [0, 100] for skin scores. */
  yRange?: [number, number];
  /** Show a fitted linear trend line through the points. Default true. */
  showTrendLine?: boolean;
  /** Color of the data points. */
  pointColor?: string;
  /** Color of the trend line. */
  trendColor?: string;
}

/**
 * ScatterPlot — animated SVG scatter plot for behavioral correlations.
 * Each point fades + scales in with a stagger on mount. The optional trend
 * line draws on after the points settle, sweeping from left to right.
 *
 * Generic enough to swap in for sleep×skin, UV×skin, water×skin, etc.
 */
export function ScatterPlot({
  data,
  width = 320,
  height = 220,
  xLabel,
  yLabel,
  xRange,
  yRange = [0, 100],
  showTrendLine = true,
  pointColor = Colors.primary,
  trendColor = Colors.gold,
}: ScatterPlotProps) {
  const padLeft = 36;
  const padRight = 12;
  const padTop = 12;
  const padBottom = 28;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  // Compute domain: x from data extents (with a small pad), y fixed by prop.
  const xs = data.map(d => d.x);
  const xMin = xRange ? xRange[0] : Math.max(0, Math.floor(Math.min(...xs, 0) * 2) / 2 - 0.5);
  const xMaxRaw = xRange ? xRange[1] : Math.ceil(Math.max(...xs, 1) * 2) / 2 + 0.5;
  const xMax = xMaxRaw <= xMin ? xMin + 1 : xMaxRaw;
  const yMin = yRange[0];
  const yMax = yRange[1];

  const sx = (x: number) => padLeft + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => padTop + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  // Linear regression for trend line.
  let slope = 0, intercept = 0, hasTrend = false;
  if (showTrendLine && data.length >= 3) {
    const meanX = xs.reduce((a, b) => a + b, 0) / data.length;
    const meanY = data.reduce((a, b) => a + b.y, 0) / data.length;
    let num = 0, den = 0;
    for (const p of data) {
      num += (p.x - meanX) * (p.y - meanY);
      den += (p.x - meanX) ** 2;
    }
    if (den !== 0) {
      slope = num / den;
      intercept = meanY - slope * meanX;
      hasTrend = true;
    }
  }

  // Reanimated entrance.
  const entry = useSharedValue(0);
  const trendEntry = useSharedValue(0);

  useEffect(() => {
    entry.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    trendEntry.value = withDelay(
      400,
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.cubic) }),
    );
    return () => {
      cancelAnimation(entry);
      cancelAnimation(trendEntry);
    };
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Y-axis grid lines at every 20 units.
  const yTicks: number[] = [];
  for (let v = yMin; v <= yMax; v += 20) yTicks.push(v);

  // X-axis ticks — pick 4-5 evenly spaced.
  const xTickCount = 5;
  const xTicks: number[] = Array.from({ length: xTickCount }, (_, i) =>
    +((xMin + ((xMax - xMin) * i) / (xTickCount - 1)).toFixed(1)),
  );

  // Trend line endpoints (clipped to plot area).
  let trendX1 = padLeft, trendY1 = sy(intercept + slope * xMin);
  let trendX2 = padLeft + plotW, trendY2 = sy(intercept + slope * xMax);

  return (
    <View style={[styles.wrap, { width }]}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgLinearGradient id="scatterPointFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={pointColor} stopOpacity={1} />
            <Stop offset="100%" stopColor={pointColor} stopOpacity={0.55} />
          </SvgLinearGradient>
        </Defs>

        {/* Grid lines */}
        {yTicks.map(t => (
          <Line
            key={`grid-${t}`}
            x1={padLeft}
            x2={padLeft + plotW}
            y1={sy(t)}
            y2={sy(t)}
            stroke="rgba(28,24,20,0.07)"
            strokeWidth={1}
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map(t => (
          <SvgText
            key={`ylab-${t}`}
            x={padLeft - 6}
            y={sy(t) + 3}
            fontSize="9"
            fill={Colors.textMuted}
            textAnchor="end"
            fontWeight="700"
          >
            {t}
          </SvgText>
        ))}

        {/* X-axis baseline */}
        <Line
          x1={padLeft}
          y1={padTop + plotH}
          x2={padLeft + plotW}
          y2={padTop + plotH}
          stroke="rgba(28,24,20,0.18)"
          strokeWidth={1}
        />

        {/* X-axis labels */}
        {xTicks.map(t => (
          <SvgText
            key={`xlab-${t}`}
            x={sx(t)}
            y={padTop + plotH + 14}
            fontSize="9"
            fill={Colors.textMuted}
            textAnchor="middle"
            fontWeight="700"
          >
            {t}
          </SvgText>
        ))}

        {/* Trend line (drawn behind points) */}
        {hasTrend && <TrendLine x1={trendX1} y1={trendY1} x2={trendX2} y2={trendY2} stroke={trendColor} progress={trendEntry} />}

        {/* Data points */}
        {data.map((p, i) => (
          <Point
            key={i}
            cx={sx(p.x)}
            cy={sy(p.y)}
            color={pointColor}
            delay={i * 40}
            entry={entry}
          />
        ))}
      </Svg>

      {xLabel && <Text style={[styles.xLabel, { width }]}>{xLabel}</Text>}
      {yLabel && (
        <Text style={[styles.yLabel, { top: height / 2 - 8 }]} numberOfLines={1}>
          {yLabel}
        </Text>
      )}
    </View>
  );
}

function Point({
  cx,
  cy,
  color,
  delay,
  entry,
}: {
  cx: number;
  cy: number;
  color: string;
  delay: number;
  entry: ReturnType<typeof useSharedValue<number>>;
}) {
  const innerScale = useSharedValue(0);
  useEffect(() => {
    innerScale.value = withDelay(delay, withTiming(1, { duration: 380, easing: Easing.out(Easing.back(1.2)) }));
  }, [delay]); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedProps = useAnimatedProps(() => ({
    r: innerScale.value * 5,
    opacity: innerScale.value,
  }));
  const haloProps = useAnimatedProps(() => ({
    r: innerScale.value * 9,
    opacity: innerScale.value * 0.18,
  }));

  return (
    <>
      <AnimatedCircle cx={cx} cy={cy} fill={color} animatedProps={haloProps} />
      <AnimatedCircle cx={cx} cy={cy} fill="url(#scatterPointFill)" stroke="#fff" strokeWidth={1.5} animatedProps={animatedProps} />
    </>
  );
}

function TrendLine({
  x1,
  y1,
  x2,
  y2,
  stroke,
  progress,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  progress: ReturnType<typeof useSharedValue<number>>;
}) {
  const animatedProps = useAnimatedProps(() => ({
    x2: x1 + (x2 - x1) * progress.value,
    y2: y1 + (y2 - y1) * progress.value,
    opacity: progress.value,
  }));
  return (
    <AnimatedLine
      x1={x1}
      y1={y1}
      stroke={stroke}
      strokeWidth={2.2}
      strokeDasharray="6 4"
      animatedProps={animatedProps}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  xLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  yLabel: {
    position: 'absolute',
    left: -28,
    fontSize: 10,
    fontWeight: '900',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    transform: [{ rotate: '-90deg' }],
  },
});
