import { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSpring,
} from 'react-native-reanimated';
import { useColors } from '../../src/state/theme';
import type { Palette } from '../../src/constants/colors';
import {
  runNotifications, dismissNotification, dismissAll,
  Notification, NotifAccent,
} from '../../src/engine/NotificationsEngine';
import { GlassHero, Card, Section } from '../../src/components/ui';

function accentColor(accent: NotifAccent, c: Palette): string {
  switch (accent) {
    case 'gold': return c.gold;
    case 'green': return c.scoreGood;
    case 'red': return c.scorePoor;
    case 'primary': return c.primary;
    case 'purple': return '#9B5BA8';
    case 'blue': return '#3B82F6';
  }
}

/** Notifications — surfaces important moments (badges, milestones, persona shifts, warnings). */
export default function NotificationsScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await runNotifications();
      setItems(r.all);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  const onDismiss = async (id: string) => {
    await dismissNotification(id);
    setItems(curr => curr.map(n => n.id === id ? { ...n, dismissed: true } : n));
  };

  const onClearAll = async () => {
    const ids = items.filter(n => !n.dismissed).map(n => n.id);
    if (ids.length === 0) return;
    await dismissAll(ids);
    setItems(curr => curr.map(n => ({ ...n, dismissed: true })));
  };

  const unread = items.filter(n => !n.dismissed);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Notifications</Text>
          {unread.length > 0 ? (
            <Pressable onPress={onClearAll} style={styles.clearBtn} hitSlop={8}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassHero height={130} tint={colors.primary} style={styles.heroWrap}>
            <View style={styles.heroInner}>
              <Text style={styles.heroLabel}>UPDATES</Text>
              <Text style={styles.heroTitle}>
                {loading ? 'Loading…' :
                  unread.length === 0 ? 'You\'re all caught up' :
                  `${unread.length} new ${unread.length === 1 ? 'update' : 'updates'}`}
              </Text>
            </View>
          </GlassHero>

          {!loading && unread.length > 0 && (
            <Section title="New" caption="Tap to open · swipe to dismiss">
              {unread.map((n, i) => (
                <NotifCard key={n.id} notif={n} index={i} onDismiss={() => onDismiss(n.id)} />
              ))}
            </Section>
          )}

          {!loading && items.filter(n => n.dismissed).length > 0 && (
            <Section title="Earlier" caption="Already seen">
              {items.filter(n => n.dismissed).slice(0, 10).map((n, i) => (
                <NotifCard key={n.id} notif={n} index={i + unread.length} onDismiss={() => {}} />
              ))}
            </Section>
          )}

          {!loading && items.length === 0 && (
            <View style={styles.emptyWrap}>
              <Ionicons name="notifications-off-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptySub}>You'll see updates here when you unlock badges, hit milestones, or your persona shifts.</Text>
            </View>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function NotifCard({ notif, index, onDismiss }: { notif: Notification; index: number; onDismiss: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tint = accentColor(notif.accent, colors);

  const opacity = useSharedValue(0);
  const ty = useSharedValue(8);
  useEffect(() => {
    opacity.value = withDelay(index * 50, withTiming(1, { duration: 320 }));
    ty.value = withDelay(index * 50, withSpring(0, { damping: 14 }));
  }, []);
  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  const handlePress = () => {
    if (notif.link) router.push(notif.link as any);
  };

  return (
    <Animated.View style={cardStyle}>
      <Pressable
        style={[
          styles.notifCard,
          notif.dismissed && { opacity: 0.6 },
          { borderLeftColor: tint, borderLeftWidth: 3 },
        ]}
        onPress={handlePress}
      >
        <View style={[styles.iconWrap, { backgroundColor: tint + '14', borderColor: tint + '40' }]}>
          <Ionicons name={notif.icon as any} size={18} color={tint} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.notifTitle}>{notif.title}</Text>
          <Text style={styles.notifBody}>{notif.body}</Text>
        </View>
        {!notif.dismissed && (
          <Pressable hitSlop={6} onPress={onDismiss} style={styles.dismissBtn}>
            <Ionicons name="close" size={14} color={colors.textMuted} />
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
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
    clearBtn: {
      paddingHorizontal: 14, paddingVertical: 9,
      borderRadius: 100,
      backgroundColor: c.bgCard,
      borderWidth: 1, borderColor: c.border,
    },
    clearText: { fontSize: 11, fontWeight: '700', color: c.textPrimary, letterSpacing: 0.4 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: c.textPrimary, letterSpacing: -0.2 },
    content: { paddingHorizontal: 20, paddingBottom: 30 },

    heroWrap: { marginHorizontal: -20, marginBottom: 18 },
    heroInner: { padding: 22 },
    heroLabel: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '900', letterSpacing: 1.6 },
    heroTitle: {
      fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5,
      marginTop: 6,
      textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
    },

    notifCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.bgCard,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 8,
    },
    iconWrap: {
      width: 38, height: 38, borderRadius: 19,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1,
    },
    notifTitle: { fontSize: 13, fontWeight: '800', color: c.textPrimary, letterSpacing: -0.1 },
    notifBody: { fontSize: 11, color: c.textMuted, marginTop: 2, lineHeight: 15 },
    dismissBtn: {
      width: 22, height: 22, borderRadius: 11,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.bgElevated,
    },

    emptyWrap: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 10 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
    emptySub: { fontSize: 13, color: c.textMuted, textAlign: 'center', lineHeight: 18 },
  });
}
