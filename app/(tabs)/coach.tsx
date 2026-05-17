import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Animated, Easing,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';
import { Auth } from '../../src/services/auth';
import { chatWithCoach } from '../../src/services/skinAnalysis';
import { PremiumGate, PremiumBanner } from '../../src/components/PremiumGate';
import { ChatMessage, SkinAnalysis, UserProfile } from '../../src/types';
import { runSkinProgressEngine } from '../../src/engine/SkinProgressEngine';

const FREE_MSG_LIMIT = 10;
const todayMsgKey = () => `gd_coach_msgs_${new Date().toISOString().slice(0, 10)}`;

const CHAT_HISTORY_KEY = 'gd_chat_history';
const MAX_STORED_MESSAGES = 60;

const STARTER_PROMPTS = [
  'What should I prioritize for my skin right now?',
  'Is tallow good for oily skin?',
  'How do I build a barrier-repair routine?',
  'What ingredients should I avoid?',
  'How long until I see results from a new routine?',
  "What's the difference between tallow and regular moisturizer?",
];

const QUICK_PROMPTS_BASE = [
  { label: 'My biggest issue?', icon: '🎯' },
  { label: 'Best routine for me?', icon: '🌅' },
  { label: 'Ingredients to avoid?', icon: '⛔' },
  { label: 'When will I see results?', icon: '⏱️' },
  { label: 'Why tallow?', icon: '🧪' },
  { label: 'Morning vs evening?', icon: '☀️' },
  { label: 'Fix my barrier?', icon: '🛡️' },
];

const SCAN_PROMPTS = [
  { label: 'Explain my score', icon: '📊' },
  { label: 'My skin strengths?', icon: '💪' },
  { label: "What's causing my low scores?", icon: '🔍' },
  { label: 'Routine from my results?', icon: '📋' },
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function TypingDots() {
  const colors = useColors();
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: -6, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay(400),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 5, paddingVertical: 4 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7, height: 7, borderRadius: 3.5,
            backgroundColor: colors.primary,
            transform: [{ translateY: dot }],
          }}
        />
      ))}
    </View>
  );
}

async function loadChatHistory(): Promise<ChatMessage[]> {
  const raw = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveChatHistory(messages: ChatMessage[]): Promise<void> {
  await AsyncStorage.setItem(
    CHAT_HISTORY_KEY,
    JSON.stringify(messages.slice(-MAX_STORED_MESSAGES))
  );
}

const SHELF_KEY = 'gd_product_shelf';

export default function Coach() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shelfContext, setShelfContext] = useState('');
  const [engineContext, setEngineContext] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [msgsUsed, setMsgsUsed] = useState(0);
  const [showGate, setShowGate] = useState(false);

  useFocusEffect(useCallback(() => {
    // Load message limit state
    (async () => {
      const user = await Auth.getCurrentUser();
      setIsPremium(user?.isPremium ?? false);
      const stored = await AsyncStorage.getItem(todayMsgKey());
      setMsgsUsed(stored ? parseInt(stored, 10) : 0);
    })();

    Promise.all([
      Storage.getLatestAnalysis(),
      Storage.getUserProfile(),
      loadChatHistory(),
      AsyncStorage.getItem(SHELF_KEY),
      runSkinProgressEngine(),
    ]).then(([a, p, history, shelfRaw, engineReport]) => {
      setAnalysis(a);
      setProfile(p);
      if (shelfRaw) {
        const shelf = JSON.parse(shelfRaw) as { name: string; brand: string; category: string; rating: number; notes: string }[];
        if (shelf.length > 0) {
          setShelfContext(
            'Current product shelf: ' +
            shelf.map(s => `${s.name}${s.brand ? ` by ${s.brand}` : ''} (${s.category}, rated ${s.rating}/5${s.notes ? `, note: ${s.notes}` : ''})`).join('; ')
          );
        }
      }
      if (engineReport) {
        setEngineContext(engineReport.coachContext);
      }
      if (!historyLoaded) {
        setMessages(history);
        setHistoryLoaded(true);
      }
    });
  }, [historyLoaded]));

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    // Daily limit for free users
    if (!isPremium && msgsUsed >= FREE_MSG_LIMIT) {
      setShowGate(true);
      return;
    }

    setInput('');

    const userMsg: ChatMessage = {
      id: generateId(), role: 'user', content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Only send last 20 messages to API to stay within token limits
      const apiMessages = newMessages.slice(-20).map(m => ({ role: m.role, content: m.content }));
      const reply = await chatWithCoach(apiMessages, analysis, profile, shelfContext || undefined, engineContext || undefined);
      const assistantMsg: ChatMessage = {
        id: generateId(), role: 'assistant', content: reply,
        timestamp: new Date().toISOString(),
      };
      const withReply = [...newMessages, assistantMsg];
      setMessages(withReply);
      await saveChatHistory(withReply);
      // Track daily message count
      if (!isPremium) {
        const newCount = msgsUsed + 1;
        setMsgsUsed(newCount);
        await AsyncStorage.setItem(todayMsgKey(), String(newCount));
      }
    } catch (err) {
      const errMsg: ChatMessage = {
        id: generateId(), role: 'assistant',
        content: "Sorry, I couldn't reach the AI right now. Check your connection and try again.",
        timestamp: new Date().toISOString(),
      };
      const withErr = [...newMessages, errMsg];
      setMessages(withErr);
      await saveChatHistory(withErr);
    } finally {
      setLoading(false);
    }
  };

  const confirmClear = async () => {
    const doClear = async () => {
      setMessages([]);
      await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this entire conversation?')) await doClear();
      return;
    }
    Alert.alert('Clear Chat', 'Delete this entire conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: doClear },
    ]);
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Group messages by date for date separators
  const groupedMessages = messages.reduce<{ date: string; messages: ChatMessage[] }[]>((groups, msg) => {
    const date = new Date(msg.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const last = groups[groups.length - 1];
    if (last && last.date === date) {
      last.messages.push(msg);
    } else {
      groups.push({ date, messages: [msg] });
    }
    return groups;
  }, []);

  return (
    <View style={styles.root}>
      <PremiumGate
        visible={showGate}
        onClose={async () => {
          setShowGate(false);
          const user = await Auth.getCurrentUser();
          setIsPremium(user?.isPremium ?? false);
        }}
        feature="AI coach messages"
        reason={`You've used ${msgsUsed}/${FREE_MSG_LIMIT} free messages today`}
      />
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <LinearGradient colors={[colors.primaryLight, colors.primary]} style={styles.avatar}>
              <Text style={styles.avatarText}>D</Text>
            </LinearGradient>
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerName}>Derm</Text>
            <Text style={styles.headerRole}>AI Skincare Coach · GlowDermics</Text>
          </View>
          {messages.length > 0 && (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear conversation" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={confirmClear} style={styles.clearBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Context banner when scan data is available */}
        {analysis && (
          <View style={styles.contextBanner}>
            <Ionicons name="scan" size={11} color={colors.primary} />
            <Text style={styles.contextBannerText}>
              Personalized to your scan · Score {analysis.scores.overall}/100 · {analysis.skinType} skin
            </Text>
          </View>
        )}
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
        >
          {/* Intro */}
          {messages.length === 0 && (
            <View style={styles.intro}>
              <LinearGradient colors={[colors.primaryLight, colors.primary]} style={styles.introIcon}>
                <Text style={styles.introIconText}>✦</Text>
              </LinearGradient>
              <Text style={styles.introTitle}>
                Hi{profile?.name ? `, ${profile.name}` : ''}!
              </Text>
              <Text style={styles.introSub}>
                {analysis
                  ? `I'm Derm — your personal skin coach. I've got your latest scan in front of me: ${analysis.scores.overall}/100, ${analysis.skinType} skin${analysis.concerns?.length ? `, with ${analysis.concerns.slice(0, 2).join(' & ')} as your main levers` : ''}. Ask me anything — I'll tailor it to you.`
                  : "I'm Derm — your personal skin coach. Ask me anything about skincare, ingredients, or your routine. Run a quick scan and I'll tailor everything to your exact skin."}
              </Text>
              <View style={styles.starters}>
                {STARTER_PROMPTS.map(p => (
                  <Pressable key={p} style={styles.starterChip} onPress={() => send(p)}>
                    <Text style={styles.starterText}>{p}</Text>
                    <Ionicons name="arrow-forward" size={12} color={colors.primary} />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Grouped messages with date separators */}
          {groupedMessages.map(group => (
            <View key={group.date}>
              <View style={styles.dateSeparator}>
                <View style={styles.dateLine} />
                <Text style={styles.dateLabel}>{group.date}</Text>
                <View style={styles.dateLine} />
              </View>
              {group.messages.map(msg => (
                <View key={msg.id} style={[styles.msgRow, msg.role === 'user' && styles.msgRowUser]}>
                  {msg.role === 'assistant' && (
                    <LinearGradient colors={[colors.primaryLight, colors.primary]} style={styles.msgAvatar}>
                      <Text style={styles.msgAvatarText}>D</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.bubbleWrap}>
                    <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
                      <Text style={[styles.bubbleText, msg.role === 'user' && styles.bubbleTextUser]}>
                        {msg.content}
                      </Text>
                    </View>
                    <Text style={[styles.timestamp, msg.role === 'user' && styles.timestampUser]}>
                      {formatTime(msg.timestamp)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))}

          {/* Animated typing indicator */}
          {loading && (
            <View style={styles.msgRow}>
              <LinearGradient colors={[colors.primaryLight, colors.primary]} style={styles.msgAvatar}>
                <Text style={styles.msgAvatarText}>D</Text>
              </LinearGradient>
              <View style={[styles.bubbleAssistant, styles.typingBubble]}>
                <TypingDots />
              </View>
            </View>
          )}

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Quick prompts bar */}
        {!loading && (
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptsContent}>
              {(analysis ? [...SCAN_PROMPTS, ...QUICK_PROMPTS_BASE] : QUICK_PROMPTS_BASE).map(p => (
                <Pressable
                  key={p.label}
                  style={styles.quickPromptChip}
                  onPress={() => send(p.label)}
                >
                  <Text style={styles.quickPromptIcon}>{p.icon}</Text>
                  <Text style={styles.quickPromptText}>{p.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Message count indicator */}
        {messages.length > 0 && (
          <View style={styles.msgCount}>
            <Text style={styles.msgCountText}>{messages.length} messages · history saved</Text>
          </View>
        )}

        {/* Free tier limit banner */}
        {!isPremium && msgsUsed >= FREE_MSG_LIMIT - 3 && msgsUsed < FREE_MSG_LIMIT && (
          <View style={{ paddingHorizontal: 12, paddingBottom: 4 }}>
            <PremiumBanner
              message={`${msgsUsed}/${FREE_MSG_LIMIT} free messages used today`}
              onUpgrade={() => setShowGate(true)}
            />
          </View>
        )}

        {/* Input bar — on web the tab bar overlaps, add explicit clearance */}
        <View style={[styles.inputBar, { paddingBottom: Platform.OS === 'web' ? 80 : Math.max(insets.bottom, 12) + 8 }]}>
          <TextInput
            style={styles.input}
            placeholder="Ask Derm anything…"
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={800}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => send(input)}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="arrow-up" size={18} color={colors.white} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  kav: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: c.white },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: c.scoreExcellent,
    borderWidth: 2, borderColor: c.bg,
  },
  headerText: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: c.textPrimary },
  headerRole: { fontSize: 11, color: c.textMuted },
  clearBtn: { padding: 8 },
  contextBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 7,
    backgroundColor: 'rgba(196,98,45,0.08)',
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  contextBannerText: { fontSize: 11, color: c.primary, fontWeight: '500' },
  messagesContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, flexGrow: 1 },
  intro: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 8 },
  introIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  introIconText: { fontSize: 22, color: c.white },
  introTitle: { fontSize: 22, fontWeight: '800', color: c.textPrimary, marginBottom: 8, textAlign: 'center' },
  introSub: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 20, maxWidth: 300 },
  starters: { width: '100%', gap: 8 },
  starterChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: c.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: c.border, padding: 14,
  },
  starterText: { fontSize: 14, color: c.textSecondary, flex: 1 },
  dateSeparator: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  dateLine: { flex: 1, height: 1, backgroundColor: c.border },
  dateLabel: { fontSize: 11, color: c.textMuted, fontWeight: '600' },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  msgRowUser: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msgAvatarText: { fontSize: 12, fontWeight: '800', color: c.white },
  bubbleWrap: { maxWidth: '82%', gap: 3 },
  bubble: { borderRadius: 20, padding: 14 },
  bubbleUser: {
    backgroundColor: c.primary,
    borderBottomRightRadius: 5,
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  bubbleAssistant: {
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
    borderBottomLeftRadius: 5,
  },
  bubbleText: { fontSize: 15, color: c.textPrimary, lineHeight: 23 },
  bubbleTextUser: { color: c.white },
  timestamp: { fontSize: 10, color: c.textMuted, paddingLeft: 4 },
  timestampUser: { textAlign: 'right', paddingRight: 4 },
  typingBubble: { paddingVertical: 16, paddingHorizontal: 16 },
  typingDots: { flexDirection: 'row', gap: 4 },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: c.primary },
  quickPromptsContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  quickPromptChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: c.bgCard, borderRadius: 20,
    borderWidth: 1, borderColor: c.border,
    paddingHorizontal: 13, paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quickPromptIcon: { fontSize: 14 },
  quickPromptText: { fontSize: 12, color: c.textSecondary, fontWeight: '600' },
  msgCount: { alignItems: 'center', paddingVertical: 4 },
  msgCountText: { fontSize: 10, color: c.textMuted },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: c.border,
    backgroundColor: c.bgSheet,
  },
  input: {
    flex: 1, backgroundColor: c.bgCard, borderWidth: 1,
    borderColor: c.border, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: c.textPrimary, maxHeight: 120,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  });
}
