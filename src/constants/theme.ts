/**
 * GlowDermics Design System v2
 *
 * Single source of truth for typography, spacing, radii, shadows, and motion.
 * Pair with `colors.ts` for full design tokens.
 */

export const Typography = {
  // System font with iOS native feel; fallback handled by RN.
  fontFamily: undefined as string | undefined,

  // Type scale — modular, mobile-first. All in px/sp.
  display: { fontSize: 40, lineHeight: 46, fontWeight: '900' as const, letterSpacing: -0.8 },
  h1:      { fontSize: 30, lineHeight: 36, fontWeight: '800' as const, letterSpacing: -0.6 },
  h2:      { fontSize: 24, lineHeight: 30, fontWeight: '800' as const, letterSpacing: -0.4 },
  h3:      { fontSize: 19, lineHeight: 24, fontWeight: '700' as const, letterSpacing: -0.2 },
  h4:      { fontSize: 16, lineHeight: 22, fontWeight: '700' as const, letterSpacing: -0.1 },
  body:    { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  small:   { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  smallStrong: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  caption: { fontSize: 11, lineHeight: 15, fontWeight: '500' as const, letterSpacing: 0.3 },
  micro:   { fontSize: 9,  lineHeight: 12, fontWeight: '700' as const, letterSpacing: 1.5 },
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 56,
};

export const Radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 999,
};

export const Shadows = {
  // Soft, premium shadows — never harsh.
  none: { shadowOpacity: 0 },
  subtle: {
    shadowColor: '#1C1814',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  card: {
    shadowColor: '#1C1814',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#1C1814',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  floating: {
    shadowColor: '#1C1814',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 12,
  },
  glow: {
    shadowColor: '#C4622D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const Motion = {
  // Durations
  fast: 180,
  base: 280,
  slow: 480,
  slower: 720,

  // Spring presets
  spring: {
    soft:   { damping: 18, stiffness: 120, mass: 1 },
    snappy: { damping: 14, stiffness: 220, mass: 0.9 },
    bouncy: { damping: 10, stiffness: 180, mass: 1 },
  },

  // Press feedback
  pressScale: 0.97,
  pressOpacity: 0.85,
};

export const Layout = {
  screenPadding: 20,
  cardPadding: 18,
  sectionGap: 28,
  itemGap: 12,
  maxContentWidth: 720,
};
