import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';
import { chatWithCoach } from '../../src/services/skinAnalysis';
import { ChatMessage, SkinAnalysis, UserProfile } from '../../src/types';

const STARTER_PROMPTS = [
  'What should I prioritize for my skin right now?',
  'Is tallow good for oily skin?',
  'How do I build a barrier-repair routine?',
  'What ingredients should I avoid?',
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function Coach() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(useCallback(() => {
    Promise.all([Storage.getLatestAnalysis(), Storage.getUserProfile()]).then(([a, p]) => {
      setAnalysis(a);
      setProfile(p);
    });
  }, []));

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
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const reply = await chatWithCoach(apiMessages, analysis, profile);
      const assistantMsg: ChatMessage = {
        id: generateId(), role: 'assistant', content: reply,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: generateId(), role: 'assistant',
        content: "Sorry, I couldn't reach the AI right now. Check your connection and try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

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
            <Pressable onPress={() => setMessages([])} style={styles.clearBtn}>
              <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
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
                Hi{profile?.name ? `, ${profile.name}` : ''}! I'm Derm.
              </Text>
              <Text style={styles.introSub}>
                Your AI skin coach built on TallowDermics science. Ask me anything about your skin, routine, or ingredients.
              </Text>
              {analysis && (
                <View style={styles.contextBadge}>
                  <Ionicons name="scan" size={12} color={Colors.primary} />
                  <Text style={styles.contextBadgeText}>Personalized to your latest scan (Score: {analysis.scores.overall}/100)</Text>
                </View>
              )}
              <View style={styles.starters}>
                {STARTER_PROMPTS.map(p => (
                  <Pressable key={p} style={styles.starterChip} onPress={() => send(p)}>
                    <Text style={styles.starterText}>{p}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Messages */}
          {messages.map(msg => (
            <View key={msg.id} style={[styles.msgRow, msg.role === 'user' && styles.msgRowUser]}>
              {msg.role === 'assistant' && (
                <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.msgAvatar}>
                  <Text style={styles.msgAvatarText}>D</Text>
                </LinearGradient>
              )}
              <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
                <Text style={[styles.bubbleText, msg.role === 'user' && styles.bubbleTextUser]}>
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}

          {/* Loading */}
          {loading && (
            <View style={styles.msgRow}>
              <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.msgAvatar}>
                <Text style={styles.msgAvatarText}>D</Text>
              </LinearGradient>
              <View style={styles.bubbleAssistant}>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 16 }} />
        </ScrollView>

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
            onSubmitEditing={() => send(input)}
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
  messagesContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, flexGrow: 1 },
  intro: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 8 },
  introIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  introIconText: { fontSize: 24, color: Colors.white },
  introTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  introSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 16, maxWidth: 300 },
  contextBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(196,98,45,0.1)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, marginBottom: 20,
  },
  contextBadgeText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  starters: { width: '100%', gap: 8 },
  starterChip: {
    backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  starterText: { fontSize: 14, color: Colors.textSecondary },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  msgRowUser: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msgAvatarText: { fontSize: 13, fontWeight: '800', color: Colors.white },
  bubble: { maxWidth: '80%', borderRadius: 18, padding: 13 },
  bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  bubbleTextUser: { color: Colors.white },
  typingDots: { flexDirection: 'row', gap: 4, padding: 4 },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.primary, opacity: 0.4 },
  typingDot1: {},
  typingDot2: { opacity: 0.6 },
  typingDot3: { opacity: 0.8 },
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
