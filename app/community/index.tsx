import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Animated, Easing, RefreshControl, Image,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { fonts } from '../../src/constants/typography';
import { Storage } from '../../src/services/storage';
import { Auth } from '../../src/services/auth';
import { ScoreRing } from '../../src/components/ScoreRing';

// Simulated community data — in a real app this comes from a backend
const COMMUNITY_MEMBERS = [
  { id: '1', initials: 'S', name: 'Sophia K.', skinType: 'Combination', streak: 47, score: 84, badge: '🔥', city: 'New York' },
  { id: '2', initials: 'A', name: 'Anika P.', skinType: 'Dry', streak: 38, score: 79, badge: '🌿', city: 'London' },
  { id: '3', initials: 'J', name: 'James R.', skinType: 'Oily', streak: 32, score: 76, badge: '💧', city: 'Sydney' },
  { id: '4', initials: 'M', name: 'Mia L.', skinType: 'Normal', streak: 29, score: 91, badge: '✨', city: 'Paris' },
  { id: '5', initials: 'C', name: 'Carlos V.', skinType: 'Sensitive', streak: 21, score: 73, badge: '🛡️', city: 'Toronto' },
  { id: '6', initials: 'Y', name: 'Yuki T.', skinType: 'Combination', streak: 18, score: 88, badge: '🌸', city: 'Tokyo' },
  { id: '7', initials: 'R', name: 'Riya M.', skinType: 'Oily', streak: 14, score: 71, badge: '🌊', city: 'Mumbai' },
];

const COMMUNITY_TIPS = [
  { skinType: 'Oily', tip: 'Double cleansing changed my skin overnight. Oil cleanser first, then gentle foam.', author: 'Jordan', daysAgo: 2, likes: 234 },
  { skinType: 'Dry', tip: 'Applying moisturizer while my face is still damp from washing made a 40% difference in hydration.', author: 'Priya', daysAgo: 1, likes: 189 },
  { skinType: 'Combination', tip: 'Multi-masking: clay on my T-zone, hydrating mask on cheeks. Game changer.', author: 'Alex', daysAgo: 3, likes: 312 },
  { skinType: 'Sensitive', tip: "Eliminated fragrance from all products. My redness is 80% gone after 3 weeks.", author: 'Sam', daysAgo: 4, likes: 421 },
  { skinType: 'Normal', tip: '7 glasses of water daily + 15-min walk. My glow score jumped 12 points.', author: 'Maya', daysAgo: 1, likes: 156 },
  { skinType: 'All Types', tip: 'A rich occlusive at night. Woke up with the softest skin of my life.', author: 'Chris', daysAgo: 2, likes: 567 },
];

const TRENDING_CHALLENGES = [
  { id: 'tallow-30', title: '30-Day Barrier Reset', emoji: '🌿', joined: 8421, completedToday: 1203, hot: true },
  { id: 'hydration-14', title: '14-Day Glow Hydration', emoji: '💧', joined: 5832, completedToday: 891, hot: false },
  { id: 'minimal-7', title: '7-Day Minimal Routine', emoji: '✨', joined: 12940, completedToday: 2104, hot: true },
  { id: 'sleep-skin-14', title: '14-Day Sleep for Skin', emoji: '🌙', joined: 3291, completedToday: 443, hot: false },
];

const WEEKLY_WINNERS = [
  { initials: 'M', name: 'Mia L.', achievement: 'Score jumped +18 in 7 days', badge: '🏆', city: 'Paris' },
  { initials: 'S', name: 'Sophia K.', achievement: '47-day unbroken streak', badge: '🔥', city: 'New York' },
  { initials: 'Y', name: 'Yuki T.', achievement: 'Perfect habits week', badge: '⭐', city: 'Tokyo' },
];

const STAT_PULSE_INTERVAL = 4000;
const LIVE_STATS = [
  { label: 'Users Active Today', value: '24,891' },
  { label: 'Scans Today', value: '8,203' },
  { label: 'Routines Logged', value: '61,447' },
  { label: 'Water Glasses Logged', value: '189,330' },
];

function LiveStatTicker() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [idx, setIdx] = useState(0);
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setIdx(i => (i + 1) % LIVE_STATS.length), 250);
    }, STAT_PULSE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const stat = LIVE_STATS[idx];
  return (
    <View style={styles.liveStat}>
      <View style={styles.liveDot} />
      <Animated.Text style={[styles.liveStatText, { opacity: anim }]}>
        <Text style={styles.liveStatVal}>{stat.value}</Text>  {stat.label}
      </Animated.Text>
    </View>
  );
}

function LeaderboardRow({ member, rank, isYou }: { member: typeof COMMUNITY_MEMBERS[0]; rank: number; isYou: boolean }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const isTopThree = rank <= 3;
  return (
    <View style={[styles.lbRow, isYou && styles.lbRowYou]}>
      <View style={[styles.lbRank, isTopThree && { backgroundColor: rankColors[rank - 1] + '22' }]}>
        <Text style={[styles.lbRankText, isTopThree && { color: rankColors[rank - 1], fontWeight: '800' }]}>
          {isTopThree ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
        </Text>
      </View>
      <View style={[styles.lbAvatar, { backgroundColor: isYou ? colors.primary : colors.primaryLight }]}>
        <Text style={styles.lbAvatarText}>{member.initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Text style={[styles.lbName, isYou && { color: colors.primary }]}>
            {isYou ? 'You' : member.name}
          </Text>
          {isYou && <View style={styles.youBadge}><Text style={styles.youBadgeText}>YOU</Text></View>}
        </View>
        <Text style={styles.lbSkinType}>{member.skinType} · {member.city}</Text>
      </View>
      <View style={styles.lbRight}>
        <Text style={styles.lbStreakNum}>{member.streak}</Text>
        <Text style={styles.lbStreakLabel}>🔥 days</Text>
      </View>
      <View style={styles.lbScoreWrap}>
        <Text style={styles.lbScore}>{member.score}</Text>
      </View>
    </View>
  );
}

export default function Community() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [refreshing, setRefreshing] = useState(false);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [userStreak, setUserStreak] = useState(0);
  const [userName, setUserName] = useState('');
  const [userSkinType, setUserSkinType] = useState('');
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'leaderboard' | 'challenges' | 'tips' | 'winners'>('leaderboard');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const tabAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  const runEntrance = () => {
    headerAnim.setValue(0);
    tabAnim.setValue(0);
    contentAnim.setValue(0);
    Animated.stagger(80, [
      Animated.timing(headerAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(tabAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  const load = async () => {
    const [analysis, streak, profile, user] = await Promise.all([
      Storage.getLatestAnalysis(),
      Storage.getStreak(),
      Storage.getUserProfile(),
      Auth.getCurrentUser(),
    ]);
    setUserScore(analysis?.scores.overall ?? null);
    setUserStreak(streak);
    setUserName(user?.name || profile?.name || 'You');
    setUserSkinType(analysis?.skinType || profile?.skinType || 'all');

    try {
      const raw = await AsyncStorage.getItem('gd_active_challenge');
      if (raw) setActiveChallengeId(JSON.parse(raw).challengeId);
    } catch {}
    runEntrance();
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Build leaderboard with user inserted at rank 8
  const leaderboard = [
    ...COMMUNITY_MEMBERS,
    {
      id: 'me',
      initials: (userName[0] || 'Y').toUpperCase(),
      name: userName,
      skinType: userSkinType || 'All Types',
      streak: userStreak,
      score: userScore ?? 60,
      badge: '🌟',
      city: 'Your City',
    },
  ].sort((a, b) => b.streak - a.streak);

  const userRank = leaderboard.findIndex(m => m.id === 'me') + 1;

  const joinChallenge = async (challengeId: string) => {
    const data = { challengeId, startDate: new Date().toISOString(), completedDays: [] };
    await AsyncStorage.setItem('gd_active_challenge', JSON.stringify(data));
    setActiveChallengeId(challengeId);
    router.push('/challenge');
  };

  const tips = COMMUNITY_TIPS.filter(t =>
    t.skinType === 'All Types' || t.skinType.toLowerCase() === userSkinType.toLowerCase()
  ).concat(
    COMMUNITY_TIPS.filter(t => t.skinType !== 'All Types' && t.skinType.toLowerCase() !== userSkinType.toLowerCase())
  );

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <Animated.View style={{
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
        }}>
          <SafeAreaView edges={['top']}>
            <LinearGradient
              colors={[colors.primary + '18', 'transparent']}
              style={styles.headerGrad}
            >
              <View style={styles.header}>
                <View>
                  <Text style={styles.headerEyebrow}>VELUMI AI</Text>
                  <Text style={styles.headerTitle} numberOfLines={1}>Community</Text>
                </View>
                <Pressable style={styles.shareBtn} onPress={() => router.push('/skin-scorecard')}>
                  <LinearGradient colors={[colors.primaryLight, colors.primary]} style={styles.shareBtnGrad}>
                    <Ionicons name="share-outline" size={16} color="#fff" />
                    <Text style={styles.shareBtnText}>My Card</Text>
                  </LinearGradient>
                </Pressable>
              </View>

              {/* Live stat ticker */}
              <LiveStatTicker />

              {/* User rank card */}
              {userScore !== null && (
                <View style={styles.myRankCard}>
                  <LinearGradient colors={[colors.primary + '20', colors.primary + '08']} style={StyleSheet.absoluteFill} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.myRankLabel}>YOUR GLOBAL RANK</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text style={styles.myRankNum}>#{userRank}</Text>
                      <Text style={styles.myRankSub}>of {leaderboard.length.toLocaleString()}+ members</Text>
                    </View>
                    <Text style={styles.myRankDetail}>{userStreak} day streak · Score {userScore}/100</Text>
                  </View>
                  <ScoreRing score={userScore} size={64} />
                </View>
              )}
            </LinearGradient>
          </SafeAreaView>
        </Animated.View>

        {/* Tab selector */}
        <Animated.View style={{
          opacity: tabAnim,
          transform: [{ translateY: tabAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
            {([
              { key: 'leaderboard', label: 'Leaderboard', icon: 'trophy-outline' },
              { key: 'challenges', label: 'Challenges', icon: 'flash-outline' },
              { key: 'tips', label: 'Community Tips', icon: 'chatbubble-outline' },
              { key: 'winners', label: "Week's Wins", icon: 'star-outline' },
            ] as const).map(tab => (
              <Pressable
                key={tab.key}
                style={[styles.tabChip, selectedTab === tab.key && styles.tabChipActive]}
                onPress={() => setSelectedTab(tab.key)}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={selectedTab === tab.key ? colors.white : colors.textSecondary}
                />
                <Text style={[styles.tabChipText, selectedTab === tab.key && styles.tabChipTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Content */}
        <Animated.View style={{
          opacity: contentAnim,
          transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }}>

          {/* LEADERBOARD */}
          {selectedTab === 'leaderboard' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Streak Leaderboard</Text>
                <Text style={styles.sectionSub}>Updated daily</Text>
              </View>
              <View style={styles.card}>
                {leaderboard.map((member, i) => (
                  <View key={member.id}>
                    <LeaderboardRow member={member} rank={i + 1} isYou={member.id === 'me'} />
                    {i < leaderboard.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
              <View style={styles.lbFootnote}>
                <Ionicons name="information-circle-outline" size={12} color={colors.textMuted} />
                <Text style={styles.lbFootnoteText}>Rankings update every 24 hours based on streak length and score</Text>
              </View>
            </View>
          )}

          {/* CHALLENGES */}
          {selectedTab === 'challenges' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Challenges</Text>
                <Text style={styles.sectionSub}>Join the community</Text>
              </View>
              {TRENDING_CHALLENGES.map(ch => (
                <View key={ch.id} style={styles.challengeCard}>
                  <LinearGradient
                    colors={ch.hot ? [colors.primary + '14', colors.primary + '05'] : ['transparent', 'transparent']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.challengeTop}>
                    <Text style={styles.challengeEmoji}>{ch.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.challengeTitle}>{ch.title}</Text>
                        {ch.hot && (
                          <View style={styles.hotBadge}>
                            <Text style={styles.hotBadgeText}>🔥 HOT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.challengeStats}>
                        {ch.joined.toLocaleString()} joined · {ch.completedToday.toLocaleString()} checked in today
                      </Text>
                    </View>
                  </View>

                  {/* Participation bar */}
                  <View style={styles.challengeBarWrap}>
                    <View style={[styles.challengeBarFill, {
                      width: `${Math.min(100, (ch.completedToday / ch.joined) * 100 * 3)}%` as any,
                    }]} />
                  </View>

                  <View style={styles.challengeFooter}>
                    <Text style={styles.challengePct}>
                      {Math.round((ch.completedToday / ch.joined) * 100)}% active today
                    </Text>
                    {activeChallengeId === ch.id ? (
                      <Pressable style={styles.challengeActiveBadge} onPress={() => router.push('/challenge')}>
                        <Ionicons name="checkmark-circle" size={14} color="#4ADE80" />
                        <Text style={styles.challengeActiveBadgeText}>Active</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        style={[styles.joinBtn, activeChallengeId && { opacity: 0.5 }]}
                        onPress={() => joinChallenge(ch.id)}
                        disabled={!!activeChallengeId && activeChallengeId !== ch.id}
                      >
                        <Text style={styles.joinBtnText}>Join →</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TIPS */}
          {selectedTab === 'tips' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Community Wisdom</Text>
                <Text style={styles.sectionSub}>Real people, real results</Text>
              </View>
              {tips.map((tip, i) => (
                <View key={i} style={styles.tipCard}>
                  <View style={styles.tipTop}>
                    <View style={styles.tipSkinBadge}>
                      <Text style={styles.tipSkinText}>{tip.skinType}</Text>
                    </View>
                    <View style={styles.tipLikes}>
                      <Ionicons name="heart" size={12} color={colors.primary} />
                      <Text style={styles.tipLikesText}>{tip.likes.toLocaleString()}</Text>
                    </View>
                  </View>
                  <Text style={styles.tipText}>"{tip.tip}"</Text>
                  <View style={styles.tipFooter}>
                    <View style={styles.tipAuthorDot}>
                      <Text style={styles.tipAuthorDotText}>{tip.author[0]}</Text>
                    </View>
                    <Text style={styles.tipAuthor}>{tip.author}</Text>
                    <Text style={styles.tipAgo}>{tip.daysAgo}d ago</Text>
                  </View>
                </View>
              ))}

              {/* CTA to share your tip */}
              <Pressable style={styles.shareTipCta} onPress={() => router.push('/skin-scorecard')}>
                <LinearGradient colors={[colors.primaryLight, colors.primary]} style={StyleSheet.absoluteFill} />
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.shareTipCtaText}>Share Your Journey Card</Text>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
          )}

          {/* WEEKLY WINNERS */}
          {selectedTab === 'winners' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>This Week's Top Performers</Text>
                <Text style={styles.sectionSub}>April 20–26, 2026</Text>
              </View>

              {WEEKLY_WINNERS.map((winner, i) => (
                <View key={i} style={styles.winnerCard}>
                  <LinearGradient
                    colors={
                      i === 0
                        ? ['rgba(255,215,0,0.12)', 'rgba(255,215,0,0.03)']
                        : i === 1
                          ? ['rgba(192,192,192,0.10)', 'rgba(192,192,192,0.02)']
                          : ['rgba(205,127,50,0.10)', 'rgba(205,127,50,0.02)']
                    }
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.winnerBadge}>{winner.badge}</Text>
                  <View style={styles.winnerAvatar}>
                    <Text style={styles.winnerAvatarText}>{winner.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.winnerName}>{winner.name}</Text>
                    <Text style={styles.winnerCity}>{winner.city}</Text>
                    <Text style={styles.winnerAchievement}>{winner.achievement}</Text>
                  </View>
                </View>
              ))}

              {/* Could you be next? */}
              <View style={styles.couldYouCard}>
                <LinearGradient colors={[colors.primary + '15', colors.primary + '05']} style={StyleSheet.absoluteFill} />
                <Text style={styles.couldYouTitle}>Could you be next week's winner?</Text>
                <Text style={styles.couldYouSub}>Log your routine daily, hit your water goal, and keep your streak alive to climb the rankings.</Text>
                <Pressable style={styles.couldYouBtn} onPress={() => router.push('/(tabs)/routine')}>
                  <Text style={styles.couldYouBtnText}>Log Today's Routine →</Text>
                </Pressable>
              </View>
            </View>
          )}

        </Animated.View>

        {/* Invite friends CTA */}
        <Pressable style={styles.inviteCta} onPress={() => router.push('/skin-scorecard')}>
          <LinearGradient
            colors={[colors.primaryLight, colors.primary]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.inviteTitle}>Share Your Skin Score</Text>
            <Text style={styles.inviteSub}>Generate your personalized scorecard and share your journey</Text>
          </View>
          <View style={styles.inviteIcon}>
            <Ionicons name="share-social" size={22} color="#fff" />
          </View>
        </Pressable>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingHorizontal: 20 },

  headerGrad: { borderRadius: 0, paddingBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 16, paddingBottom: 12 },
  headerEyebrow: { fontSize: 10, fontWeight: '600', letterSpacing: 2.4, color: c.primary, marginBottom: 2, textTransform: 'uppercase', fontFamily: fonts.body },
  headerTitle: { fontSize: 28, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.display },
  shareBtn: { borderRadius: 14, overflow: 'hidden' },
  shareBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9 },
  shareBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  liveStat: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  liveStatText: { fontSize: 12, color: c.textSecondary },
  liveStatVal: { fontWeight: '700', color: c.textPrimary },

  myRankCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: c.borderStrong,
    padding: 16,
  },
  myRankLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 2, color: c.primary, marginBottom: 4, textTransform: 'uppercase', fontFamily: fonts.body },
  myRankNum: { fontSize: 32, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.display },
  myRankSub: { fontSize: 13, color: c.textSecondary, fontWeight: '500' },
  myRankDetail: { fontSize: 12, color: c.textMuted, marginTop: 2 },

  tabsContent: { paddingVertical: 16, gap: 8 },
  tabChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1, borderColor: c.border,
    backgroundColor: c.bgCard,
  },
  tabChipActive: { backgroundColor: c.primary, borderColor: c.primary },
  tabChipText: { fontSize: 12, fontWeight: '600', color: c.textSecondary },
  tabChipTextActive: { color: c.white },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: c.textPrimary, fontFamily: fonts.display },
  sectionSub: { fontSize: 11, color: c.textMuted, fontFamily: fonts.body },

  card: {
    backgroundColor: c.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: c.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  divider: { height: 1, backgroundColor: c.border, marginHorizontal: 16 },

  lbRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  lbRowYou: { backgroundColor: c.primary + '08' },
  lbRank: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bgElevated },
  lbRankText: { fontSize: 13, fontWeight: '700', color: c.textSecondary },
  lbAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  lbAvatarText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  lbName: { fontSize: 14, fontWeight: '700', color: c.textPrimary },
  youBadge: { backgroundColor: c.primary, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  youBadgeText: { fontSize: 8, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  lbSkinType: { fontSize: 11, color: c.textMuted, marginTop: 1 },
  lbRight: { alignItems: 'center' },
  lbStreakNum: { fontSize: 16, fontWeight: '800', color: c.textPrimary },
  lbStreakLabel: { fontSize: 9, color: c.textMuted },
  lbScoreWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center',
  },
  lbScore: { fontSize: 13, fontWeight: '800', color: c.primary },

  lbFootnote: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  lbFootnoteText: { fontSize: 10, color: c.textMuted, flex: 1 },

  challengeCard: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: c.border,
    padding: 16, marginBottom: 12,
    backgroundColor: c.bgCard,
  },
  challengeTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  challengeEmoji: { fontSize: 28 },
  challengeTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary, fontFamily: fonts.display },
  challengeStats: { fontSize: 11, color: c.textMuted, marginTop: 3 },
  hotBadge: { backgroundColor: c.primary + '15', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  hotBadgeText: { fontSize: 8, fontWeight: '800', color: c.primary },
  challengeBarWrap: { height: 6, backgroundColor: c.bgElevated, borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  challengeBarFill: { height: 6, backgroundColor: c.primary, borderRadius: 3 },
  challengeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  challengePct: { fontSize: 11, color: c.textMuted, fontWeight: '600' },
  joinBtn: { backgroundColor: c.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  joinBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  challengeActiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, borderWidth: 1, borderColor: '#4ADE80', paddingHorizontal: 12, paddingVertical: 6 },
  challengeActiveBadgeText: { fontSize: 12, fontWeight: '700', color: '#4ADE80' },

  tipCard: {
    backgroundColor: c.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: c.border,
    padding: 16, marginBottom: 12,
  },
  tipTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tipSkinBadge: { backgroundColor: c.primary + '14', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  tipSkinText: { fontSize: 10, fontWeight: '700', color: c.primary },
  tipLikes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tipLikesText: { fontSize: 12, color: c.textSecondary, fontWeight: '600' },
  tipText: { fontSize: 14, color: c.textPrimary, lineHeight: 22, fontStyle: 'italic', marginBottom: 12, fontFamily: fonts.body },
  tipFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipAuthorDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: c.primaryLight, alignItems: 'center', justifyContent: 'center' },
  tipAuthorDotText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  tipAuthor: { fontSize: 12, fontWeight: '600', color: c.textSecondary },
  tipAgo: { fontSize: 11, color: c.textMuted },

  shareTipCta: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, overflow: 'hidden', padding: 16, marginTop: 4,
  },
  shareTipCtaText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#fff' },

  winnerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: c.border,
    padding: 16, marginBottom: 10,
    backgroundColor: c.bgCard,
  },
  winnerBadge: { fontSize: 22 },
  winnerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  winnerAvatarText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  winnerName: { fontSize: 15, fontWeight: '700', color: c.textPrimary, fontFamily: fonts.display },
  winnerCity: { fontSize: 11, color: c.textMuted, marginBottom: 2 },
  winnerAchievement: { fontSize: 12, color: c.primary, fontWeight: '600' },

  couldYouCard: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: c.borderStrong,
    padding: 20, marginTop: 8,
  },
  couldYouTitle: { fontSize: 16, fontWeight: '800', color: c.textPrimary, marginBottom: 8, fontFamily: fonts.display },
  couldYouSub: { fontSize: 13, color: c.textSecondary, lineHeight: 20, marginBottom: 14, fontFamily: fonts.body },
  couldYouBtn: { backgroundColor: c.primary, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  couldYouBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  inviteCta: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 20, overflow: 'hidden', padding: 20, marginBottom: 16,
  },
  inviteTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 4, fontFamily: fonts.display },
  inviteSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  inviteIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  });
}
