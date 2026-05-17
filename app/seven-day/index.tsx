import { useCallback, useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withSpring, withTiming, withDelay, Easing as REasing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useColors } from '../../src/state/theme';
import type { Palette } from '../../src/constants/colors';
import { runSkinForecast, ForecastReport, ForecastDay, ForecastDriver } from '../../src/engine/SkinForecastEngine';
import { GlassHero, Card, Section, Skeleton } from '../../src/components/ui';

const { width: SCREEN_W } = Dimensions.get('window');

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Seven-Day Forecast — deterministic short-term prediction from your habit pattern. */
export default function SevenDayForecastScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [report, setReport] = useState<ForecastReport | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await runSkinForecast();
        if (!cancelled) setReport(r);
      } catch {
        if (!cancelled) setReport(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []));

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>7-Day Forecast</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? <LoadingState /> : report ? <ForecastBody report={report} /> : <EmptyState />}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ForecastBody({ report }: { report: ForecastReport }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const heroTint =
    report.trend === 'rising' ? colors.scoreGood :
    report.trend === 'falling' ? colors.scorePoor :
    colors.primary;

  const trendIcon =
    report.trend === 'rising' ? 'trending-up' :
    report.trend === 'falling' ? 'trending-down' :
    'remove-outline';

  return (
    <>
      <GlassHero height={210} tint={heroTint} style={styles.heroWrap}>
        <View style={styles.heroInner}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Ionicons name={trendIcon as any} size={12} color="#fff" />
              <Text style={styles.heroBadgeText}>
                {report.trend === 'rising' ? 'TRENDING UP' : report.trend === 'falling' ? 'TRENDING DOWN' : 'STEADY'}
              </Text>
            </View>
          </View>
          <Text style={styles.heroLabel}>NEXT 7 DAYS</Text>
          <View style={styles.heroScoreRow}>
            <Text style={styles.heroBaseline}>{report.days[6].score}</Text>
            <Text style={styles.heroDelta}>
              {report.trendDelta >= 0 ? '+' : ''}{report.trendDelta} pts
            </Text>
          </View>
          <Text style={styles.heroSub}>{report.headline}</Text>
        </View>
      </GlassHero>

      <Section title="Predicted skin score" caption="Based on your last 7-day habit pattern">
        <Card style={styles.chartCard}>
          <ForecastChart days={report.days} />
        </Card>
      </Section>

      <Section title="Day-by-day breakdown" caption="Top drivers behind each day's prediction">
        {report.days.map((d, i) => <DayRow key={d.date} day={d} index={i} />)}
      </Section>

      {report.topLever && (
        <Section title="Biggest lever this week">
          <Card style={styles.leverCard}>
            <View style={styles.leverIconWrap}>
              <Ionicons name="flash" size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.leverFeature}>{report.topLever.feature.toUpperCase()}</Text>
              <Text style={styles.leverSuggestion}>{report.topLever.suggestion}</Text>
            </View>
          </Card>
        </Section>
      )}

      <Card style={styles.confidenceCard}>
        <View style={styles.confidenceRow}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
          <Text style={styles.confidenceText}>
            {report.hasEnoughData
              ? `Forecast based on ${report.sampleSize} days of your data (last 30 days). Predictions assume your last-7-day pattern continues.`
              : `Need ${6 - report.sampleSize} more daily logs for a confident forecast — keep tracking and check back.`}
          </Text>
        </View>
      </Card>

      <Pressable style={styles.aiCta} onPress={() => router.push('/forecast')}>
        <View style={styles.aiCtaLeft}>
          <Ionicons name="sparkles" size={18} color={colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aiCtaTitle}>Want the 30/60/90 day view?</Text>
          <Text style={styles.aiCtaSub}>AI-generated long-term forecast with risks and action plan</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <View style={{ height: 40 }} />
    </>
  );
}

function ForecastChart({ days }: { days: ForecastDay[] }) {
  const colors = useColors();
  const W = SCREEN_W - 80;
  const H = 180;
  const PAD_TOP = 20;
  const PAD_BOTTOM = 36;

  const xs = days.map((_, i) => (i / 6) * W);
  const minScore = Math.min(...days.map(d => d.score)) - 4;
  const maxScore = Math.max(...days.map(d => d.score)) + 4;
  const range = Math.max(maxScore - minScore, 4);
  const ys = days.map(d => PAD_TOP + (1 - (d.score - minScore) / range) * (H - PAD_TOP - PAD_BOTTOM));

  const buildPath = () => {
    let d = `M ${xs[0]},${ys[0]}`;
    for (let i = 0; i < xs.length - 1; i++) {
      const x0 = xs[Math.max(0, i - 1)];
      const y0 = ys[Math.max(0, i - 1)];
      const x1 = xs[i];
      const y1 = ys[i];
      const x2 = xs[i + 1];
      const y2 = ys[i + 1];
      const x3 = xs[Math.min(xs.length - 1, i + 2)];
      const y3 = ys[Math.min(ys.length - 1, i + 2)];
      const c1x = x1 + (x2 - x0) / 6;
      const c1y = y1 + (y2 - y0) / 6;
      const c2x = x2 - (x3 - x1) / 6;
      const c2y = y2 - (y3 - y1) / 6;
      d += ` C ${c1x},${c1y} ${c2x},${c2y} ${x2},${y2}`;
    }
    return d;
  };
  const linePath = buildPath();
  const areaPath = `${linePath} L ${xs[xs.length - 1]},${H - PAD_BOTTOM} L ${xs[0]},${H - PAD_BOTTOM} Z`;

  const pathProgress = useSharedValue(0);
  useEffect(() => {
    pathProgress.value = 0;
    pathProgress.value = withDelay(150, withTiming(1, { duration: 1200, easing: REasing.out(REasing.cubic) }));
  }, [days]);

  const animatedLineProps = useAnimatedProps(() => ({
    strokeDashoffset: 1500 * (1 - pathProgress.value),
  }));

  return (
    <View style={{ width: W, height: H, alignSelf: 'center' }}>
      <Svg width={W} height={H}>
        <Defs>
          <SvgGradient id="forecast-fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.32" />
            <Stop offset="1" stopColor={colors.primary} stopOpacity="0.02" />
          </SvgGradient>
        </Defs>

        <Path d={areaPath} fill="url(#forecast-fill)" />

        <AnimatedPath
          d={linePath}
          stroke={colors.primary}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={1500}
          animatedProps={animatedLineProps}
        />

        {xs.map((x, i) => (
          <Circle
            key={i}
            cx={x}
            cy={ys[i]}
            r={i === 0 ? 5 : 4}
            fill={i === 0 ? colors.primary : colors.bgCard}
            stroke={colors.primary}
            strokeWidth={2}
          />
        ))}
      </Svg>

      <View style={{ flexDirection: 'row', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        {days.map((d) => (
          <View key={d.date} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.5 }}>
              {d.dayLabel}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '800', marginTop: 2 }}>
              {d.score}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function DayRow({ day, index }: { day: ForecastDay; index: number }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const opacity = useSharedValue(0);
  const ty = useSharedValue(8);
  useEffect(() => {
    opacity.value = withDelay(index * 60, withTiming(1, { duration: 320 }));
    ty.value = withDelay(index * 60, withSpring(0, { damping: 14 }));
  }, [day.date]);
  const rowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  const isToday = index === 0;
  const tone =
    day.score >= 75 ? colors.scoreGood :
    day.score >= 60 ? colors.gold :
    colors.scorePoor;

  return (
    <Animated.View style={[styles.dayRow, rowStyle]}>
      <View style={styles.dayLeft}>
        <Text style={styles.dayLabel}>{day.dayLabel}</Text>
        {isToday && <Text style={styles.todayPill}>TODAY</Text>}
      </View>

      <View style={styles.dayCenter}>
        <View style={styles.dayBarTrack}>
          <View style={[styles.dayBarFill, { width: `${day.score}%`, backgroundColor: tone }]} />
        </View>
        <View style={styles.dayDriversWrap}>
          {day.drivers.length === 0 ? (
            <Text style={styles.driverNone}>No strong drivers — tracking baseline</Text>
          ) : day.drivers.map((dr, i) => <DriverChip key={i} driver={dr} />)}
        </View>
      </View>

      <Text style={[styles.dayScore, { color: tone }]}>{day.score}</Text>
    </Animated.View>
  );
}

function DriverChip({ driver }: { driver: ForecastDriver }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const positive = driver.delta >= 0;
  const featureIcon: Record<ForecastDriver['feature'], string> = {
    sleep: 'moon-outline',
    water: 'water-outline',
    routine: 'checkmark-circle-outline',
    habits: 'list-outline',
    mood: 'happy-outline',
  };
  const iconName = featureIcon[driver.feature] ?? 'sparkles-outline';

  return (
    <View style={[styles.chip, { backgroundColor: positive ? colors.scoreGood + '14' : colors.scorePoor + '14' }]}>
      <Ionicons name={iconName as any} size={10} color={positive ? colors.scoreGood : colors.scorePoor} />
      <Text style={[styles.chipText, { color: positive ? colors.scoreGood : colors.scorePoor }]}>
        {driver.label}
      </Text>
    </View>
  );
}

function LoadingState() {
  return (
    <>
      <Skeleton width="100%" height={210} radius={20} style={{ marginBottom: 24 }} />
      <Skeleton width="60%" height={20} radius={6} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={200} radius={18} style={{ marginBottom: 24 }} />
      <Skeleton width="100%" height={80} radius={16} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={80} radius={16} style={{ marginBottom: 12 }} />
    </>
  );
}

function EmptyState() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name="cloud-offline-outline" size={56} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>No data yet</Text>
      <Text style={styles.emptySub}>Take a scan and log a few days of habits to unlock your forecast.</Text>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    safe: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 8,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: c.textPrimary, letterSpacing: -0.2 },
    content: { paddingHorizontal: 20, paddingBottom: 30 },

    heroWrap: { marginHorizontal: -20, marginBottom: 18 },
    heroInner: { padding: 22, paddingTop: 16 },
    heroTopRow: { flexDirection: 'row', justifyContent: 'flex-end' },
    heroBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: 'rgba(255,255,255,0.20)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
      borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4,
    },
    heroBadgeText: { fontSize: 9, color: '#fff', fontWeight: '900', letterSpacing: 1 },
    heroLabel: { fontSize: 10, color: 'rgba(255,255,255,0.78)', fontWeight: '800', letterSpacing: 1.6, marginTop: 8 },
    heroScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 4 },
    heroBaseline: {
      fontSize: 56, fontWeight: '900', color: '#fff', letterSpacing: -2,
      textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
    },
    heroDelta: { fontSize: 17, fontWeight: '800', color: 'rgba(255,255,255,0.95)' },
    heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 6, lineHeight: 18 },

    chartCard: { padding: 16, paddingTop: 18 },

    dayRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: c.bgCard,
      borderWidth: 1, borderColor: c.border,
      borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
      marginBottom: 8,
    },
    dayLeft: { width: 44, alignItems: 'center' },
    dayLabel: { fontSize: 13, fontWeight: '700', color: c.textPrimary },
    todayPill: { fontSize: 8, fontWeight: '900', color: c.primary, letterSpacing: 1, marginTop: 2 },
    dayCenter: { flex: 1 },
    dayBarTrack: {
      height: 6, borderRadius: 3, backgroundColor: c.bgElevated, marginBottom: 8, overflow: 'hidden',
    },
    dayBarFill: { height: 6, borderRadius: 3 },
    dayDriversWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    driverNone: { fontSize: 10, color: c.textMuted, fontStyle: 'italic' },

    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 7, paddingVertical: 3,
      borderRadius: 100,
    },
    chipText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.2 },

    dayScore: { fontSize: 22, fontWeight: '900', minWidth: 36, textAlign: 'right' },

    leverCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      padding: 18,
    },
    leverIconWrap: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: c.gold,
      alignItems: 'center', justifyContent: 'center',
    },
    leverFeature: { fontSize: 9, fontWeight: '900', color: c.gold, letterSpacing: 2, marginBottom: 4 },
    leverSuggestion: { fontSize: 13, color: c.textPrimary, fontWeight: '600', lineHeight: 18 },

    confidenceCard: { padding: 14 },
    confidenceRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
    confidenceText: { fontSize: 11, color: c.textMuted, flex: 1, lineHeight: 16 },

    aiCta: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
      borderRadius: 14, padding: 14, marginTop: 12,
    },
    aiCtaLeft: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: c.gold + '14', alignItems: 'center', justifyContent: 'center',
    },
    aiCtaTitle: { fontSize: 13, fontWeight: '700', color: c.textPrimary },
    aiCtaSub: { fontSize: 11, color: c.textMuted, marginTop: 2 },

    emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 10 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
    emptySub: { fontSize: 13, color: c.textMuted, textAlign: 'center', maxWidth: 280, lineHeight: 18 },
  });
}
