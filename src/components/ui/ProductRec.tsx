/**
 * ProductRec — a single product recommendation card.
 *
 * Brand-agnostic. The retail URL is wrapped by affiliateLink() at render time
 * so any user-driven click earns the tag configured in .env.local.
 *
 * Usage:
 *   <ProductRec rec={recsFor('barrier')[0]} />
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { useColors } from '../../state/theme';
import type { Palette } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { affiliateLink } from '../../services/affiliateLink';
import type { ProductRec as Rec } from '../../data/productRecommendations';

interface Props {
  rec: Rec;
}

const TIER_LABEL: Record<Rec['priceTier'], string> = {
  entry: 'Entry',
  mid: 'Mid',
  premium: 'Premium',
};

export function ProductRec({ rec }: Props) {
  const c = useColors();
  const styles = makeStyles(c);

  const handlePress = () => {
    const url = affiliateLink(rec.url, rec.brand);
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Pressable onPress={handlePress} style={styles.card} accessibilityRole="link">
      <View style={styles.row}>
        <Text style={styles.brand}>{rec.brand.toUpperCase()}</Text>
        <View style={styles.tierPill}>
          <Text style={styles.tierText}>{TIER_LABEL[rec.priceTier]}</Text>
        </View>
      </View>
      <Text style={styles.name}>{rec.name}</Text>
      <Text style={styles.why}>{rec.why}</Text>
      <Text style={styles.cta}>View product →</Text>
    </Pressable>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.bgCard,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    brand: {
      fontSize: 10,
      letterSpacing: 2,
      fontWeight: '700',
      color: c.gold,
    },
    tierPill: {
      backgroundColor: c.bgElevated,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    tierText: {
      fontSize: 9,
      letterSpacing: 1,
      fontWeight: '700',
      color: c.textSecondary,
      textTransform: 'uppercase',
    },
    name: {
      fontFamily: fonts.display,
      fontSize: 17,
      fontWeight: '600',
      color: c.textPrimary,
      marginBottom: 6,
      lineHeight: 22,
    },
    why: {
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 19,
      marginBottom: 10,
    },
    cta: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.3,
      color: c.primary,
    },
  });
}

export default ProductRec;
