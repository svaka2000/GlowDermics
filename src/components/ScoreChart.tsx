import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../constants/colors';

interface DataPoint {
  date: string;
  value: number;
}

interface Props {
  data: DataPoint[];
  color?: string;
  height?: number;
  label?: string;
}

const PAD = { top: 16, right: 16, bottom: 32, left: 32 };

export function ScoreChart({ data, color = Colors.primary, height = 160, label }: Props) {
  const width = Dimensions.get('window').width - 64; // account for card padding

  if (data.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Scan at least twice to see trends</Text>
      </View>
    );
  }

  const chartW = width - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;

  const minVal = Math.max(0, Math.min(...data.map(d => d.value)) - 10);
  const maxVal = Math.min(100, Math.max(...data.map(d => d.value)) + 10);
  const range = maxVal - minVal || 1;

  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => PAD.top + chartH - ((v - minVal) / range) * chartH;

  // Build smooth path using cubic bezier
  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    pathD += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // Fill area under curve
  const areaD = `${pathD} L ${points[points.length - 1].x} ${PAD.top + chartH} L ${points[0].x} ${PAD.top + chartH} Z`;

  const gradId = `grad_${label || 'chart'}`.replace(/\s/g, '_');

  // Y axis labels
  const yLabels = [minVal, Math.round((minVal + maxVal) / 2), maxVal];

  return (
    <View>
      {label && <Text style={styles.chartLabel}>{label}</Text>}
      <Svg width={width} height={height}>
        <Defs>
          <SvgLinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        {/* Grid lines */}
        {yLabels.map((val, i) => {
          const y = toY(val);
          return (
            <Line
              key={i}
              x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
              stroke="rgba(250,243,224,0.06)" strokeWidth="1"
            />
          );
        })}

        {/* Y axis labels */}
        {yLabels.map((val, i) => (
          <SvgText
            key={i}
            x={PAD.left - 4}
            y={toY(val) + 4}
            fontSize="9"
            fill="rgba(250,243,224,0.35)"
            textAnchor="end"
          >
            {Math.round(val)}
          </SvgText>
        ))}

        {/* Area fill */}
        <Path d={areaD} fill={`url(#${gradId})`} />

        {/* Line */}
        <Path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r="4" fill={color} stroke={Colors.bg} strokeWidth="2" />
        ))}

        {/* X axis date labels — show first, middle, last */}
        {[0, Math.floor((data.length - 1) / 2), data.length - 1]
          .filter((v, i, arr) => arr.indexOf(v) === i)
          .map(i => (
            <SvgText
              key={i}
              x={toX(i)}
              y={height - 4}
              fontSize="9"
              fill="rgba(250,243,224,0.35)"
              textAnchor="middle"
            >
              {new Date(data[i].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </SvgText>
          ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  chartLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 6 },
});
