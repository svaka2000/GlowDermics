/**
 * OutboundLink — the ONE component for "buy this product" across the app.
 *
 * Per AFFILIATE_PLAYBOOK.md §3.4: routes through the redirect domain and opens
 * via the system browser (Linking.openURL) so affiliate cookies survive. Shows
 * a brief "Opening <store>…" interstitial so the context switch feels
 * intentional. Use everywhere a product is recommended — never hardcode a
 * merchant URL.
 *
 * Usage:
 *   <OutboundLink productKey="cerave-moisturizing-cream" context="dupes" />
 *   <OutboundLink productKey="..." context="budget" label="Shop now" />
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '../../constants/colors';
import { useColors } from '../../state/theme';
import { getAffiliateLink } from '../../services/affiliateLinks';
import { openProduct, type ClickContext } from '../../services/affiliate';

const NETWORK_STORE_LABEL: Record<string, string> = {
  amazon: 'Amazon',
  skimlinks: 'the store',
  impact: 'the store',
  rakuten: 'the store',
  cj: 'the store',
  awin: 'the store',
  direct: 'the store',
};

interface OutboundLinkProps {
  productKey: string;
  context: ClickContext;
  /** Override the button label. Default: "Buy on <Store>". */
  label?: string;
  /** Visual treatment. Default: 'button'. */
  variant?: 'button' | 'inline';
}

export function OutboundLink({
  productKey,
  context,
  label,
  variant = 'button',
}: OutboundLinkProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [busy, setBusy] = useState(false);

  const link = getAffiliateLink(productKey);
  if (!link || !link.enabled) {
    // Unknown / disabled product — render nothing rather than a dead button.
    return null;
  }

  const store = NETWORK_STORE_LABEL[link.network] ?? 'the store';
  const text = label ?? `Buy on ${store}`;

  const onPress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await openProduct(productKey, context);
    } finally {
      // Brief delay so the interstitial reads as intentional, not a flicker.
      setTimeout(() => setBusy(false), 1200);
    }
  };

  if (variant === 'inline') {
    return (
      <Pressable onPress={onPress} hitSlop={8} style={styles.inlineWrap}>
        {busy ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <Text style={styles.inlineText}>{text}</Text>
            <Ionicons name="open-outline" size={13} color={colors.primary} />
          </>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
    >
      {busy ? (
        <>
          <ActivityIndicator size="small" color={colors.white} />
          <Text style={styles.btnText}>Opening {store}…</Text>
        </>
      ) : (
        <>
          <Text style={styles.btnText}>{text}</Text>
          <Ionicons name="open-outline" size={15} color={colors.white} />
        </>
      )}
    </Pressable>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingVertical: 11,
      paddingHorizontal: 16,
    },
    btnPressed: { opacity: 0.85 },
    btnText: {
      color: c.white,
      fontSize: 14,
      fontWeight: '800',
    },
    inlineWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    inlineText: {
      color: c.primary,
      fontSize: 13,
      fontWeight: '700',
    },
  });
}
