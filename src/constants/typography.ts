import { Platform } from 'react-native';

/**
 * Velumi typography — quiet-luxury editorial system.
 *
 * `display` is an elegant serif used for brand moments and screen titles
 * (the Aesop / Tata Harper register). `body` is the clean platform sans
 * for everything functional. No binary font asset is bundled — we use a
 * refined platform serif stack so this works everywhere with zero setup.
 */
export const fonts = {
  // Elegant serif — brand voice, headlines, the Velumi wordmark
  display: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: "'Cormorant Garamond', 'Hoefler Text', Georgia, 'Times New Roman', serif",
  }) as string,
  // Clean sans — body, controls, data
  body: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  }) as string,
};

/**
 * Type scale. Pair `fontFamily` from `fonts` with these. Sizes/spacing
 * tuned for the warm-ivory palette: generous, calm, editorial.
 */
export const type = {
  // Big brand / hero moments — serif
  display: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: 0.3,
    fontWeight: '600' as const,
  },
  // Screen titles — serif
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: 0.2,
    fontWeight: '600' as const,
  },
  // Section headings — serif, lighter
  heading: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0.2,
    fontWeight: '600' as const,
  },
  // Card / list emphasis — sans
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
    fontWeight: '600' as const,
  },
  // Body copy — sans
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  // Secondary / captions — sans
  caption: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.1,
    fontWeight: '400' as const,
  },
  // Eyebrow / overline — letter-spaced uppercase label
  overline: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 2.4,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
};

export type TypeScale = typeof type;
