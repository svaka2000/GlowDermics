export const Colors = {
  // Primary brand
  primary: '#C4622D',       // TallowDermics burnt orange
  primaryLight: '#E08250',
  primaryDark: '#A04D24',

  // Backgrounds — marble white
  bg: '#F5F0EA',            // warm marble base
  bgCard: '#FFFFFF',        // pure white cards
  bgElevated: '#EDE9E2',   // slightly deeper for elevated areas
  bgSheet: '#FAFAF7',       // tab bar / bottom sheet

  // Text — dark warm
  textPrimary: '#1C1814',
  textSecondary: 'rgba(28,24,20,0.55)',
  textMuted: 'rgba(28,24,20,0.32)',

  // Accent gold
  gold: '#B8882E',
  goldLight: '#D4A84A',

  // Skin score colors
  scoreExcellent: '#16A34A',
  scoreGood: '#22C55E',
  scoreFair: '#D97706',
  scorePoor: '#DC2626',

  // Borders
  border: 'rgba(28,24,20,0.07)',
  borderStrong: 'rgba(196,98,45,0.25)',

  // Glass
  glass: 'rgba(255,255,255,0.9)',
  glassDeep: 'rgba(255,255,255,0.72)',
  glassDark: 'rgba(13,11,9,0.72)',

  // Semantic accents — for new v2 dimensions
  hydration: '#3B82F6',     // blue (water)
  texture: '#A855F7',       // purple (granular)
  clarity: '#06B6D4',       // cyan (clean)
  evenness: '#F59E0B',      // amber (tone)
  firmness: '#EF4444',      // red (collagen)
  pores: '#8B5CF6',         // violet
  radiance: '#FBBF24',      // gold/yellow (glow)
  redness: '#F43F5E',       // rose (inflammation)
  darkSpots: '#92400E',     // deep amber (hyperpigmentation)
  darkCircles: '#475569',   // slate (under eye)
  wrinkles: '#7C3AED',      // deep purple (lines)
  acne: '#DC2626',          // red alert
  oiliness: '#10B981',      // green (sebum)
  sensitivity: '#EC4899',   // pink (reactive)
  barrierHealth: '#0EA5E9', // sky (protective)

  // Tier badges
  tierBronze: '#A16207',
  tierSilver: '#737373',
  tierGold: '#D4A84A',
  tierPlatinum: '#0EA5E9',
  tierDiamond: '#A855F7',

  // White / black
  white: '#FFFFFF',
  black: '#000000',
  ink: '#0D0B09',           // near-black for dark surfaces
  inkSoft: '#1A1612',
};

/**
 * ColorsDark — warm-marble inverse for dark mode.
 *
 * Strategy: invert the surface lightness while preserving the brand
 * terracotta/gold accents and semantic dimension tints (which are already
 * vivid enough to read on dark surfaces). Text inverts cleanly. Glass
 * variants become dark-tinted instead of white-tinted.
 *
 * Same key set as `Colors` so a `useColors()` hook can return either
 * palette without callers branching.
 */
export const ColorsDark: typeof Colors = {
  // Primary brand — slightly brighter for dark surfaces
  primary: '#E08250',
  primaryLight: '#F0A07A',
  primaryDark: '#C4622D',

  // Backgrounds — warm dark marble
  bg: '#0D0B09',                 // deep ink with warm undertone
  bgCard: '#1A1612',             // elevated card surface
  bgElevated: '#241F19',         // hovered/pressed
  bgSheet: '#15110D',            // tab bar / bottom sheet

  // Text — light warm
  textPrimary: '#F5F0EA',        // warm marble inverted
  textSecondary: 'rgba(245,240,234,0.65)',
  textMuted: 'rgba(245,240,234,0.40)',

  // Accent gold — slightly brighter
  gold: '#D4A84A',
  goldLight: '#F0C94A',

  // Skin score colors — slightly brighter for contrast
  scoreExcellent: '#22C55E',
  scoreGood: '#4ADE80',
  scoreFair: '#FBBF24',
  scorePoor: '#F87171',

  // Borders
  border: 'rgba(245,240,234,0.10)',
  borderStrong: 'rgba(232,131,74,0.30)',

  // Glass — invert toward dark
  glass: 'rgba(13,11,9,0.92)',
  glassDeep: 'rgba(26,22,18,0.74)',
  glassDark: 'rgba(13,11,9,0.86)',

  // Semantic accents — keep as-is, vivid enough for dark
  hydration: '#60A5FA',
  texture: '#C084FC',
  clarity: '#22D3EE',
  evenness: '#FBBF24',
  firmness: '#F87171',
  pores: '#A78BFA',
  radiance: '#FCD34D',
  redness: '#FB7185',
  darkSpots: '#D97706',
  darkCircles: '#94A3B8',
  wrinkles: '#A78BFA',
  acne: '#F87171',
  oiliness: '#34D399',
  sensitivity: '#F472B6',
  barrierHealth: '#38BDF8',

  // Tier badges — brighten for dark
  tierBronze: '#D97706',
  tierSilver: '#A3A3A3',
  tierGold: '#F0C94A',
  tierPlatinum: '#38BDF8',
  tierDiamond: '#C084FC',

  // White / black — keep absolutes but ink is now equal to bg
  white: '#FFFFFF',
  black: '#000000',
  ink: '#F5F0EA',                // "ink" semantic flips to light text on dark
  inkSoft: '#E8DFCE',
};

/**
 * Palette type — useful for building theme-aware utilities.
 * `Colors` and `ColorsDark` are guaranteed to share the exact same shape.
 */
export type Palette = typeof Colors;
