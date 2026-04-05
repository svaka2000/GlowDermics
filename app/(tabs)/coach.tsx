import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import { chatWithCoach } from '../../src/services/skinAnalysis';
import { ChatMessage, SkinAnalysis, UserProfile } from '../../src/types';

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

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
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

export default function Coach() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(useCallback(() => {
    Promise.all([
      Storage.getLatestAnalysis(),
      Storage.getUserProfile(),
      loadChatHistory(),
    ]).then(([a, p, history]) => {
      setAnalysis(a);
      setProfile(p);
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
      const reply = await chatWithCoach(apiMessages, analysis, profile);
      const assistantMsg: ChatMessage = {
        id: generateId(), role: 'assistant', content: reply,
        timestamp: new Date().toISOString(),
      };
      const withReply = [...newMessages, assistantMsg];
      setMessages(withReply);
      await saveChatHistory(withReply);
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

  const confirmClear = () => {
    Alert.alert('Clear Chat', 'Delete this entire conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          setMessages([]);
          await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
        },
      },
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
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.avatar}>
              <Text style={styles.avatarText}>D</Text>
            </LinearGradient>
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerName}>Derm</Text>
            <Text style={styles.headerRole}>AI Skincare Coach · GlowDermics</Text>
          </View>
          {messages.length > 0 && (
            <Pressable onPress={confirmClear} style={styles.clearBtn}>
              <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Context banner when scan data is available */}
        {analysis && (
          <View style={styles.contextBanner}>
            <Ionicons name="scan" size={11} color={Colors.primary} />
            <Text style={styles.contextBannerText}>
              Personalized to your scan · Score {analysis.scores.overall}/100 · {analysis.skinType} skin
            </Text>
          </View>
        )}
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
              <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.introIcon}>
                <Text style={styles.introIconText}>✦</Text>
              </LinearGradient>
              <Text style={styles.introTitle}>
                Hi{profile?.name ? `, ${profile.name}` : ''}!
              </Text>
              <Text style={styles.introSub}>
                I'm Derm — your AI skin coach. Ask me anything about skincare, ingredients, your routine, or what your scan results mean.
              </Text>
              <View style={styles.starters}>
                {STARTER_PROMPTS.map(p => (
                  <Pressable key={p} style={styles.starterChip} onPress={() => send(p)}>
                    <Text style={styles.starterText}>{p}</Text>
                    <Ionicons name="arrow-forward" size={12} color={Colors.primary} />
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
                    <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.msgAvatar}>
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

          {/* Loading indicator */}
          {loading && (
            <View style={styles.msgRow}>
              <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.msgAvatar}>
                <Text style={styles.msgAvatarText}>D</Text>
              </LinearGradient>
              <View style={[styles.bubbleAssistant, styles.typingBubble]}>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, { opacity: 0.4 }]} />
                  <View style={[styles.typingDot, { opacity: 0.65 }]} />
                  <View style={[styles.typingDot, { opacity: 0.9 }]} />
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Message count indicator */}
        {messages.length > 0 && (
          <View style={styles.msgCount}>
            <Text style={styles.msgCountText}>{messages.length} messages · history saved</Text>
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask Derm anything…"
            placeholderTextColor={Colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={800}
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => send(input)}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="arrow-up" size={18} color={Colors.white} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  kav: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.white },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.scoreExcellent,
    borderWidth: 2, borderColor: Colors.bg,
  },
  headerText: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  headerRole: { fontSize: 11, color: Colors.textMuted },
  clearBtn: { padding: 8 },
  contextBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 7,
    backgroundColor: 'rgba(196,98,45,0.08)',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  contextBannerText: { fontSize: 11, color: Colors.primary, fontWeight: '500' },
  messagesContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, flexGrow: 1 },
  intro: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 8 },
  introIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  introIconText: { fontSize: 22, color: Colors.white },
  introTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  introSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 20, maxWidth: 300 },
  starters: { width: '100%', gap: 8 },
  starterChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  starterText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  dateSeparator: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  dateLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dateLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  msgRowUser: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msgAvatarText: { fontSize: 12, fontWeight: '800', color: Colors.white },
  bubbleWrap: { maxWidth: '80%', gap: 3 },
  bubble: { borderRadius: 18, padding: 13 },
  bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  bubbleTextUser: { color: Colors.white },
  timestamp: { fontSize: 10, color: Colors.textMuted, paddingLeft: 4 },
  timestampUser: { textAlign: 'right', paddingRight: 4 },
  typingBubble: { paddingVertical: 16, paddingHorizontal: 16 },
  typingDots: { flexDirection: 'row', gap: 4 },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.primary },
  msgCount: { alignItems: 'center', paddingVertical: 4 },
  msgCountText: { fontSize: 10, color: Colors.textMuted },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.bgSheet,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
  input: {
    flex: 1, backgroundColor: Colors.bgCard, borderWidth: 1,
    borderColor: Colors.border, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: Colors.textPrimary, maxHeight: 120,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
