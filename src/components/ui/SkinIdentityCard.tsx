/**
 * SkinIdentityCard
 *
 * The big shareable card that visualizes the user's Skin Identity:
 *   - persona archetype (gradient hero, large)
 *   - element badge (Earth/Water/Fire/Air/Crystal)
 *   - composite glow score (large numerical, animated count-up)
 *   - top 3 strengths and 3 challenges (vertical bars, animated fill-in)
 *   - signature quote
 *   - footer: streak · scans · member-since
 *
 * Designed to look great on the identity screen AND screenshotted/shared.
 * Reanimated 4: count-up + bar fill + sparkle pulse.
 */
import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps, useAnimatedReaction,
  withTiming, withDelay, withRepeat, withSequence, runOnJS,
  Easing as REasing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import type { SkinIdentity, SkinElement } from '../../engine/SkinIdentityEngine';
import { useColors } from '../../state/theme';
import type { Palette } from '../../constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.min(SCREEN_W - 40, 400);

const ELEMENT_ICON: Record<SkinElement, keyof typeof Ionicons.glyphMap> = {
  Earth: 'leaf-outline',
  Water: 'water-outline',
  Fire: 'flame-outline',
  Air: 'cloud-outline',
  Crystal: 'diamond-outline',
};

interface Props {
  identity: SkinIdentity;
}

export function SkinIdentityCard({ identity }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.outer}>
      {/* Hero band — persona gradient */}
      <LinearGradient
        colors={identity.colorway.gradient}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroTop}>
          <Text style={styles.heroBrand}>VELUMI AI</Text>
          <View style={styles.elementPill}>
            <Ionicons name={ELEMENT_ICON[identity.element]} size={11} color="#fff" />
            <Text style={styles.elementText}>{identity.element.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.heroPersona}>{identity.persona}</Text>
        <Text style={styles.heroName}>{identity.name}</Text>
        <Text style={styles.heroSig}>{identity.signature}</Text>

        {/* Sparkle accents */}
        <Sparkle x={CARD_W * 0.10} y={26} delay={0} />
        <Sparkle x={CARD_W * 0.85} y={50} delay={400} />
        <Sparkle x={CARD_W * 0.78} y={92} delay={900} />
      </LinearGradient>

      {/* Glow score ring */}
      <View style={styles.scoreSection}>
        <GlowScoreRing score={identity.glowScore} accent={identity.colorway.accent} />
      </View>

      {/* Strengths */}
      <View style={styles.dimSection}>
        <Text style={styles.dimSectionLabel}>STRONGEST DIMENSIONS</Text>
        {identity.strengths.length === 0 ? (
          <Text style={styles.dimNone}>Take a scan to unlock your top dimensions</Text>
        ) : identity.strengths.map((d, i) => (
          <DimRow key={d.key} label={d.label} value={d.value} delay={500 + i * 110} accent={identity.colorway.accent} />
        ))}
      </View>

      {/* Challenges */}
      {identity.challenges.length > 0 && (
        <View style={[styles.dimSection, { paddingTop: 0 }]}>
          <Text style={styles.dimSectionLabel}>FOCUS AREAS</Text>
          {identity.challenges.map((d, i) => (
            <DimRow key={d.key} label={d.label} value={d.value} delay={950 + i * 110} accent={colors.scorePoor} />
          ))}
        </View>
      )}

      {/* Footer stats */}
      <View style={styles.footer}>
        <FooterStat icon="flame" label="Streak" value={`${identity.streak}d`} accent={identity.colorway.accent} />
        <View style={styles.footerDivider} />
        <FooterStat icon="scan" label="Scans" value={`${identity.totalScans}`} accent={identity.colorway.accent} />
        <View style={styles.footerDivider} />
        <FooterStat icon="calendar" label="Member" value={`${identity.memberSinceDays}d`} accent={identity.colorway.accent} />
      </View>
    </View>
  );
}

function GlowScoreRing({ score, accent }: { score: number; accent: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const radius = 54;
  const stroke = 8;
  const circ = 2 * Math.PI * radius;
  const progress = useSharedValue(0);
  const display = useSharedValue(0);
  const [shown, setShown] = React.useState(0);

  useEffect(() => {
    progress.value = 0;
    display.value = 0;
    progress.value = withDelay(180, withTiming(score / 100, { duration: 1200, easing: REasing.out(REasing.cubic) }));
    display.value = withDelay(180, withTiming(score, { duration: 1200, easing: REasing.out(REasing.cubic) }));
  }, [score]);

  useAnimatedReaction(
    () => Math.round(display.value),
    (v) => runOnJS(setShown)(v),
    [score],
  );

  const aProps = useAnimatedProps(() => ({
    strokeDashoffset: circ * (1 - progress.value),
  }));

  return (
    <View style={styles.ringWrap}>
      <Svg width={radius * 2 + stroke * 2} height={radius * 2 + stroke * 2}>
        <Circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          stroke={colors.bgElevated}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          stroke={accent}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          transform={`rotate(-90 ${radius + stroke} ${radius + stroke})`}
          animatedProps={aProps}
        />
      </Svg>
      <View style={styles.ringInner}>
        <Text style={styles.ringValue}>{shown}</Text>
        <Text style={styles.ringLabel}>GLOW SCORE</Text>
      </View>
    </View>
  );
}

function DimRow({ label, value, delay, accent }: { label: string; value: number; delay: number; accent: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = 0;
    fill.value = withDelay(delay, withTiming(value / 100, { duration: 700, easing: REasing.out(REasing.cubic) }));
  }, [value]);
  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));

  return (
    <View style={styles.dimRow}>
      <Text style={styles.dimLabel}>{label}</Text>
      <View style={styles.dimBarTrack}>
        <Animated.View style={[styles.dimBarFill, { backgroundColor: accent }, fillStyle]} />
      </View>
      <Text style={styles.dimValue}>{value}</Text>
    </View>
  );
}

function Sparkle({ x, y, delay }: { x: number; y: number; delay: number }) {
  const op = useSharedValue(0);
  const sc = useSharedValue(0.6);
  useEffect(() => {
    op.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 700 }),
        withTiming(0, { duration: 700 }),
      ),
      -1,
      false,
    ));
    sc.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.2, { duration: 700 }),
        withTiming(0.6, { duration: 700 }),
      ),
      -1,
      false,
    ));
  }, []);
  const s = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ scale: sc.value }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y }, s]} pointerEvents="none">
      <Ionicons name="sparkles" size={12} color="rgba(255,255,255,0.85)" />
    </Animated.View>
  );
}

function FooterStat({ icon, label, value, accent }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; accent: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.footerStat}>
      <Ionicons name={icon} size={14} color={accent} />
      <Text style={styles.footerStatValue}>{value}</Text>
      <Text style={styles.footerStatLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    outer: {
      width: CARD_W,
      alignSelf: 'center',
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: c.bgCard,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
    hero: {
      paddingHorizontal: 22,
      paddingTop: 18,
      paddingBottom: 24,
    },
    heroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    heroBrand: {
      fontSize: 9,
      letterSpacing: 2.2,
      color: 'rgba(255,255,255,0.78)',
      fontWeight: '900',
    },
    elementPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255,255,255,0.20)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.35)',
      borderRadius: 100,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    elementText: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2, color: '#fff' },
    heroPersona: {
      fontSize: 30,
      fontWeight: '900',
      color: '#fff',
      letterSpacing: -0.8,
      marginTop: 2,
      textShadowColor: 'rgba(0,0,0,0.18)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    heroName: {
      fontSize: 14,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.9)',
      letterSpacing: 0.2,
      marginTop: 2,
    },
    heroSig: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.85)',
      lineHeight: 17,
      marginTop: 10,
      fontStyle: 'italic',
    },

    scoreSection: {
      alignItems: 'center',
      paddingTop: 22,
      paddingBottom: 4,
    },
    ringWrap: {
      width: 124, height: 124,
      alignItems: 'center', justifyContent: 'center',
    },
    ringInner: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      alignItems: 'center', justifyContent: 'center',
    },
    ringValue: {
      fontSize: 32,
      fontWeight: '900',
      color: c.textPrimary,
      letterSpacing: -1,
    },
    ringLabel: {
      fontSize: 8,
      fontWeight: '900',
      color: c.textMuted,
      letterSpacing: 1.4,
      marginTop: 2,
    },

    dimSection: {
      paddingHorizontal: 22,
      paddingTop: 18,
    },
    dimSectionLabel: {
      fontSize: 9,
      fontWeight: '900',
      color: c.textMuted,
      letterSpacing: 1.4,
      marginBottom: 10,
    },
    dimRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
    },
    dimLabel: {
      width: 100,
      fontSize: 12,
      color: c.textPrimary,
      fontWeight: '600',
    },
    dimBarTrack: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.bgElevated,
      overflow: 'hidden',
    },
    dimBarFill: {
      height: 6,
      borderRadius: 3,
    },
    dimValue: {
      width: 28,
      fontSize: 12,
      fontWeight: '700',
      color: c.textPrimary,
      textAlign: 'right',
    },
    dimNone: {
      fontSize: 11,
      color: c.textMuted,
      fontStyle: 'italic',
    },

    footer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingHorizontal: 22,
      paddingVertical: 14,
      marginTop: 18,
    },
    footerStat: {
      alignItems: 'center',
      gap: 2,
    },
    footerStatValue: {
      fontSize: 17,
      fontWeight: '900',
      color: c.textPrimary,
      letterSpacing: -0.4,
      marginTop: 2,
    },
    footerStatLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: c.textMuted,
      letterSpacing: 1.2,
    },
    footerDivider: {
      width: 1,
      backgroundColor: c.border,
    },
  });
}
