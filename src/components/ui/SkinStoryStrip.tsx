/**
 * SkinStoryStrip
 *
 * Horizontal carousel of "Skin Stories" — personalized 1-card daily insights
 * computed by SkinStoryEngine. Renders on the home tab to surface the most
 * relevant context for the user RIGHT NOW.
 *
 * Each card shows:
 *   - colored icon badge
 *   - headline (1 line)
 *   - subline (1-2 lines)
 *   - tap handler routes to story.link if set
 *
 * Carousel uses a paging ScrollView with snap-to-interval. Cards stagger in
 * from the right with a 60ms cascade.
 */
import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withDelay,
} from 'react-native-reanimated';
import type { SkinStory, StoryAccent } from '../../engine/SkinStoryEngine';
import { useColors } from '../../state/theme';
import type { Palette } from '../../constants/colors';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 60;
const CARD_GAP = 12;

interface Props {
  stories: SkinStory[];
  /** Outer horizontal padding (default 20). */
  paddingHorizontal?: number;
}

const ACCENT_MAP = (c: Palette): Record<StoryAccent, { tint: string; bg: string; text: string }> => ({
  primary: { tint: c.primary, bg: c.primary + '14', text: c.primary },
  gold: { tint: c.gold, bg: c.gold + '20', text: c.gold },
  green: { tint: c.scoreGood, bg: c.scoreGood + '14', text: c.scoreGood },
  red: { tint: c.scorePoor, bg: c.scorePoor + '14', text: c.scorePoor },
  blue: { tint: '#3B82F6', bg: 'rgba(59,130,246,0.14)', text: '#3B82F6' },
  purple: { tint: '#9B5BA8', bg: 'rgba(155,91,168,0.14)', text: '#9B5BA8' },
});

export function SkinStoryStrip({ stories, paddingHorizontal = 20 }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (stories.length === 0) return null;

  return (
    <View style={{ marginBottom: 18 }}>
      <View style={[styles.headerRow, { paddingHorizontal }]}>
        <Text style={styles.title}>For you today</Text>
        <Text style={styles.count}>{stories.length}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal, gap: CARD_GAP }}
      >
        {stories.map((s, i) => <StoryCard key={s.id} story={s} index={i} />)}
      </ScrollView>
    </View>
  );
}

function StoryCard({ story, index }: { story: SkinStory; index: number }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const accent = ACCENT_MAP(colors)[story.accent];

  const opacity = useSharedValue(0);
  const tx = useSharedValue(40);
  useEffect(() => {
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 380 }));
    tx.value = withDelay(index * 80, withSpring(0, { damping: 14 }));
  }, [story.id]);
  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: tx.value }],
  }));

  const onPress = () => {
    if (story.link) router.push(story.link as any);
  };

  return (
    <Animated.View style={cardStyle}>
      <Pressable
        style={styles.card}
        onPress={onPress}
        disabled={!story.link}
      >
        <LinearGradient
          colors={[accent.bg, 'transparent']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.cardInner}>
          <View style={[styles.iconWrap, { backgroundColor: accent.bg, borderColor: accent.tint + '40' }]}>
            <Ionicons name={story.icon as any} size={20} color={accent.tint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headline}>{story.headline}</Text>
            {story.subline && <Text style={styles.subline}>{story.subline}</Text>}
          </View>
          {story.link && (
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 8 }} />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    headerRow: {
      flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
      marginBottom: 10,
    },
    title: { fontSize: 15, fontWeight: '700', color: c.textPrimary, letterSpacing: -0.2 },
    count: { fontSize: 11, color: c.textMuted, fontWeight: '700' },
    card: {
      width: CARD_W,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: c.bgCard,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    cardInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconWrap: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1,
    },
    headline: { fontSize: 14, fontWeight: '700', color: c.textPrimary, lineHeight: 19 },
    subline: { fontSize: 11, color: c.textMuted, marginTop: 3, lineHeight: 16 },
  });
}
