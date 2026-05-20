/**
 * VelumiWordmark — the Velumi AI brand lockup.
 *
 * Typographic "VELUMI" in the elegant serif display face, generously
 * letter-spaced, with a small champagne spark accent and an optional
 * "AI SKINCARE" overline (matching the brand logo). Theme-aware.
 *
 * Usage:
 *   <VelumiWordmark />                       // md, with tagline
 *   <VelumiWordmark size="lg" />             // hero / splash / onboarding
 *   <VelumiWordmark size="sm" tagline={false} color={colors.white} />
 */
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useColors } from '../../state/theme';
import type { Palette } from '../../constants/colors';
import { fonts } from '../../constants/typography';

// Brand mark — drop user-provided artwork at assets/velumi-logo.png and it shows here automatically.
// Placeholder is a 1×1 transparent PNG so require() resolves before real art lands.
const LOGO_SOURCE = require('../../../assets/velumi-logo.png');

// Heuristic so the placeholder doesn't render in production: if useLogo is true,
// the Image is shown. Default flips to true once the real logo is dropped in
// (see assets/velumi-logo.png).
type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, { word: number; spacing: number; spark: number; tag: number; tagSpacing: number; logo: number }> = {
  sm: { word: 18, spacing: 5, spark: 5, tag: 8, tagSpacing: 3, logo: 56 },
  md: { word: 26, spacing: 7, spark: 6, tag: 10, tagSpacing: 4, logo: 96 },
  lg: { word: 40, spacing: 10, spark: 9, tag: 12, tagSpacing: 5, logo: 168 },
};

interface Props {
  size?: Size;
  /** Show the "AI SKINCARE" overline under the wordmark. Default true. */
  tagline?: boolean;
  /** Override the wordmark color (e.g. white on a dark hero). */
  color?: string;
  /** Override the spark/tagline accent color. */
  accent?: string;
  align?: 'center' | 'flex-start';
  /** Render the brand image mark (assets/velumi-logo.png) above the wordmark. */
  useLogo?: boolean;
}

export function VelumiWordmark({
  size = 'md',
  tagline = true,
  color,
  accent,
  align = 'center',
  useLogo = false,
}: Props) {
  const colors = useColors();
  const s = SIZES[size];
  const word = color ?? colors.textPrimary;
  const spark = accent ?? colors.gold;

  return (
    <View style={[styles.root, { alignItems: align }]}>
      {useLogo && (
        <Image
          source={LOGO_SOURCE}
          style={{ width: s.logo, height: s.logo, marginBottom: 6 }}
          resizeMode="contain"
          accessibilityLabel="Velumi mark"
        />
      )}
      <View style={styles.row}>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: s.word,
            letterSpacing: s.spacing,
            color: word,
            fontWeight: '600',
            // optical: trailing letter-spacing adds right pad; nudge back
            marginRight: -s.spacing,
          }}
          accessibilityRole="header"
          accessibilityLabel="Velumi AI"
        >
          VELUMI
        </Text>
        {/* champagne 4-point spark, echoing the logo mark */}
        <View
          style={{
            width: s.spark * 2,
            height: s.spark * 2,
            marginLeft: s.spacing * 0.9,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={[styles.spark, { width: s.spark * 2, height: 1.6, backgroundColor: spark }]} />
          <View style={[styles.spark, { width: 1.6, height: s.spark * 2, backgroundColor: spark }]} />
        </View>
      </View>
      {tagline && (
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: s.tag,
            letterSpacing: s.tagSpacing,
            color: spark,
            fontWeight: '600',
            marginTop: size === 'lg' ? 8 : 5,
          }}
        >
          AI SKINCARE
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center' },
  spark: { position: 'absolute', borderRadius: 1 },
});

export default VelumiWordmark;
