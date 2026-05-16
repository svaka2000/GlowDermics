/**
 * FTC-compliant affiliate disclosure (16 CFR Part 255, 2023 revision).
 *
 * Per AFFILIATE_PLAYBOOK.md §5: the disclosure must be in the SAME medium, on
 * the SAME screen, ADJACENT to the recommendation, in PLAIN language, and
 * unavoidable (a one-time modal is NOT compliant). Render this once near the
 * top of any screen that has shoppable links: dupes, budget, products,
 * scanner results, learn articles, AI chat.
 *
 * `firstParty` switches the copy to a material-connection disclosure for
 * TallowDermics (self-promotion, not an affiliate relationship).
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '../../constants/colors';
import { useColors } from '../../state/theme';

interface AffiliateDisclosureProps {
  /** Compact inline style vs. full-width banner. Default: banner. */
  inline?: boolean;
  /** Use the TallowDermics material-connection wording instead. */
  firstParty?: boolean;
}

export function AffiliateDisclosure({ inline, firstParty }: AffiliateDisclosureProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const text = firstParty
    ? 'TallowDermics is made by the team behind GlowDermics. Some links on this page are to our own products; others may earn us a commission. This never changes what we recommend.'
    : 'GlowDermics may earn a commission when you buy through links on this page. This does not affect our recommendations.';

  return (
    <View style={[inline ? styles.inline : styles.banner]}>
      <Ionicons
        name="information-circle-outline"
        size={inline ? 12 : 14}
        color={colors.textMuted}
        style={{ marginTop: 1 }}
      />
      <Text style={[styles.text, inline && styles.textInline]}>{text}</Text>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 7,
      backgroundColor: c.bgElevated,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
      marginBottom: 12,
    },
    inline: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 5,
      paddingVertical: 4,
    },
    text: {
      flex: 1,
      fontSize: 11,
      lineHeight: 16,
      color: c.textMuted,
      fontWeight: '500',
    },
    textInline: {
      fontSize: 10,
      lineHeight: 14,
    },
  });
}
