export const Colors = {
  // Primary brand — Velumi warm taupe / mocha
  primary: '#8A7860',       // Velumi taupe
  primaryLight: '#A89A86',
  primaryDark: '#665845',

  // Backgrounds — warm ivory (quiet luxury)
  bg: '#F7F3EC',            // warm ivory base
  bgCard: '#FFFFFF',        // clean white cards
  bgElevated: '#EFE9DF',    // soft sand for elevated areas
  bgSheet: '#FBF8F2',       // tab bar / bottom sheet

  // Text — espresso ink
  textPrimary: '#2B2722',
  textSecondary: 'rgba(43,39,34,0.58)',
  textMuted: 'rgba(43,39,34,0.34)',

  // Accent — champagne
  gold: '#B79B6E',
  goldLight: '#D8C29A',

  // Skin score colors — softened to harmonize with the warm palette
  scoreExcellent: '#4F9D77',
  scoreGood: '#6FB58F',
  scoreFair: '#C8923E',
  scorePoor: '#C75D4A',

  // Borders
  border: 'rgba(43,39,34,0.08)',
  borderStrong: 'rgba(138,120,96,0.28)',

  // Glass — warm white
  glass: 'rgba(255,255,255,0.92)',
  glassDeep: 'rgba(255,253,250,0.75)',
  glassDark: 'rgba(43,39,34,0.55)',

  // Semantic accents — refined earthy-jewel (re-toned from neon for premium data viz)
  hydration: '#5E8BA8',     // dusty blue (water)
  texture: '#9A86A8',       // muted mauve (granular)
  clarity: '#5FA3A0',       // soft teal (clean)
  evenness: '#C29A5B',      // warm sand (tone)
  firmness: '#B5705F',      // clay rose (collagen)
  pores: '#8C7CA6',         // lavender-grey
  radiance: '#CBA86A',      // champagne (glow)
  redness: '#C16B6B',       // dusty rose (inflammation)
  darkSpots: '#9A6B4A',     // cocoa (hyperpigmentation)
  darkCircles: '#6E7686',   // slate (under eye)
  wrinkles: '#7E6F94',      // deep mauve (lines)
  acne: '#C25C52',          // clay alert
  oiliness: '#6E9A7E',      // sage (sebum)
  sensitivity: '#C07C99',   // rosé (reactive)
  barrierHealth: '#5C93A6', // sky-slate (protective)

  // Tier badges
  tierBronze: '#A87C4F',
  tierSilver: '#9A938A',
  tierGold: '#C9A86A',
  tierPlatinum: '#7FA0A8',
  tierDiamond: '#9A86A8',

  // White / black
  white: '#FFFFFF',
  black: '#000000',
  ink: '#2B2722',           // soft espresso for dark surfaces
  inkSoft: '#3A352E',
};

/**
 * ColorsDark — Velumi refined night.
 *
 * Strategy: warm espresso-charcoal surfaces (NOT pure black), lit
 * champagne-taupe brand accent, and brightened earthy-jewel semantic
 * tints that read clearly on dark without going neon. Text inverts to
 * warm ivory. Glass variants become dark-tinted.
 *
 * Same key set as `Colors` so a `useColors()` hook can return either
 * palette without callers branching. The `ink` semantic flips to a
 * light value on dark — every screen relies on this contract.
 */
export const ColorsDark: typeof Colors = {
  // Primary brand — lit champagne-taupe for dark surfaces
  primary: '#B7A083',
  primaryLight: '#D0BE9F',
  primaryDark: '#8A7860',

  // Backgrounds — warm espresso-charcoal
  bg: '#1A1714',                 // soft warm charcoal (not pure black)
  bgCard: '#241F1A',             // elevated card surface
  bgElevated: '#2E2823',         // hovered/pressed
  bgSheet: '#1F1B17',            // tab bar / bottom sheet

  // Text — warm ivory
  textPrimary: '#F2EDE3',
  textSecondary: 'rgba(242,237,227,0.66)',
  textMuted: 'rgba(242,237,227,0.40)',

  // Accent — brighter champagne
  gold: '#CBAE80',
  goldLight: '#E4CFA3',

  // Skin score colors — slightly brighter for contrast
  scoreExcellent: '#5FB386',
  scoreGood: '#7FC79E',
  scoreFair: '#D9A85A',
  scorePoor: '#D9745E',

  // Borders
  border: 'rgba(242,237,227,0.10)',
  borderStrong: 'rgba(183,160,131,0.34)',

  // Glass — invert toward warm dark
  glass: 'rgba(26,23,20,0.92)',
  glassDeep: 'rgba(36,31,26,0.76)',
  glassDark: 'rgba(26,23,20,0.88)',

  // Semantic accents — brightened earthy-jewel for dark
  hydration: '#7FA8C2',
  texture: '#B6A2C2',
  clarity: '#7FBCB8',
  evenness: '#D9B57A',
  firmness: '#CE8B79',
  pores: '#A99AC0',
  radiance: '#E0C088',
  redness: '#D78B8B',
  darkSpots: '#BA8765',
  darkCircles: '#8C94A4',
  wrinkles: '#9B8BB0',
  acne: '#D6766B',
  oiliness: '#88B59A',
  sensitivity: '#D295B0',
  barrierHealth: '#7DB0C2',

  // Tier badges — brighten for dark
  tierBronze: '#C2925F',
  tierSilver: '#B3ABA0',
  tierGold: '#E0C088',
  tierPlatinum: '#9ABBC2',
  tierDiamond: '#B6A2C2',

  // White / black — keep absolutes; ink flips to light text on dark
  white: '#FFFFFF',
  black: '#000000',
  ink: '#F2EDE3',                // "ink" semantic flips to light on dark
  inkSoft: '#E4DCCB',
};

/**
 * Palette type — useful for building theme-aware utilities.
 * `Colors` and `ColorsDark` are guaranteed to share the exact same shape.
 */
export type Palette = typeof Colors;
