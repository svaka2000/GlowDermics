import { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Groq from 'groq-sdk';
import { Colors } from '../../src/constants/colors';
import { Storage } from '../../src/services/storage';

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const QUICK_PROMPTS = [
  'Why do I keep breaking out on my chin?',
  'What ingredients work for my skin type?',
  'How can I minimize my pores naturally?',
  'Is tallow actually good for skin?',
  'Best routine order for my concerns?',
  'How long before I see results?',
];

const SYSTEM_PROMPT = `You are Glow Coach, an expert AI skincare advisor for the GlowDermics app — the official companion app for TallowDermics, a premium tallow-based skincare brand.

Your role: give personalized, science-backed skincare advice. Be warm, direct, and conversational. Keep answers concise (2-4 short paragraphs max) unless more detail is needed.

TallowDermics philosophy: grass-fed beef tallow closely mimics human sebum, providing unmatched barrier repair, anti-inflammatory fatty acids (CLA, palmitoleic acid), and fat-soluble vitamins (A, D, E, K). It's ancestral skincare backed by modern science.

When recommending products: you may mention TallowDermics by name when relevant, but don't be pushy. Focus on education and genuine advice. Mention tallow's scientific benefits when appropriate.

Key rules:
- Never diagnose medical conditions. If asked about serious conditions (cystic acne, eczema, rosacea flares), advise seeing a dermatologist.
- Be specific and actionable. Not "drink more water" — but why and how much.
- Back claims with mechanism (e.g., "retinol speeds cell turnover by binding to retinoid receptors").
- Avoid filler phrases like "Great question!" or "Of course!"`;

export default function CoachChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<{ skinType?: string; concerns?: string[] } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      const p = await Storage.getUserProfile();
      if (p) setProfile({ skinType: p.skinType, concerns: p.primaryConcerns });

      if (messages.length === 0) {
        const greeting = p
          ? `Hi! I'm Glow Coach. I can see you have ${p.skinType} skin${p.primaryConcerns?.length ? ` with concerns around ${p.primaryConcerns.slice(0, 2).join(' and ')}` : ''}. What's on your mind?`
          : 'Hi! I\'m Glow Coach — your personal AI skincare advisor. Ask me anything about your skin, ingredients, routines, or how to get the most out of TallowDermics.';
        setMessages([{ role: 'assistant', content: greeting }]);
      }
    })();
  }, []));

  const sendMessage = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    setInput('');
    const userMsg: Message = { role: 'user', content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const systemWithProfile = profile
        ? `${SYSTEM_PROMPT}\n\nUser profile: ${profile.skinType} skin type. Primary concerns: ${profile.concerns?.join(', ') || 'none specified'}.`
        : SYSTEM_PROMPT;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemWithProfile },
          ...newMessages.map(m => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.7,
        max_tokens: 600,
      });

      const reply = response.choices[0]?.message?.content ?? 'I had trouble responding. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please check your connection and try again.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const clearChat = () => {
    const greeting = profile
      ? `Starting fresh! I'm here to help with anything skin-related. What's on your mind?`
      : "Starting fresh! What would you like to know about your skin?";
    setMessages([{ role: 'assistant', content: greeting }]);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.coachAvatar}>
              <LinearGradient colors={[Colors.primary, Colors.gold]} style={StyleSheet.absoluteFill} />
              <Text style={styles.coachAvatarText}>✨</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>Glow Coach</Text>
              <Text style={styles.headerSub}>AI Skincare Advisor</Text>
            </View>
          </View>
          <Pressable style={styles.clearBtn} onPress={clearChat}>
            <Ionicons name="refresh-outline" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesScroll}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              {msg.role === 'assistant' && (
                <View style={styles.assistantAvatarSmall}>
                  <LinearGradient colors={[Colors.primary, Colors.gold]} style={StyleSheet.absoluteFill} />
                  <Text style={{ fontSize: 10 }}>✨</Text>
                </View>
              )}
              <View style={[
                styles.bubbleContent,
                msg.role === 'user' ? styles.userBubbleContent : styles.assistantBubbleContent,
              ]}>
                <Text style={[
                  styles.bubbleText,
                  msg.role === 'user' ? styles.userBubbleText : styles.assistantBubbleText,
                ]}>
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={[styles.bubble, styles.assistantBubble]}>
              <View style={styles.assistantAvatarSmall}>
                <LinearGradient colors={[Colors.primary, Colors.gold]} style={StyleSheet.absoluteFill} />
                <Text style={{ fontSize: 10 }}>✨</Text>
              </View>
              <View style={styles.assistantBubbleContent}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            </View>
          )}

          {/* Quick prompts shown when no user messages yet */}
          {messages.filter(m => m.role === 'user').length === 0 && (
            <View style={styles.quickPromptsWrap}>
              <Text style={styles.quickPromptsLabel}>Try asking:</Text>
              <View style={styles.quickPromptsGrid}>
                {QUICK_PROMPTS.map((p, i) => (
                  <Pressable
                    key={i}
                    style={styles.quickPromptChip}
                    onPress={() => sendMessage(p)}
                  >
                    <Text style={styles.quickPromptText}>{p}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Input */}
        <View style={styles.inputWrap}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask anything about your skin..."
              placeholderTextColor={Colors.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage()}
              returnKeyType="send"
            />
            <Pressable
              style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.gold]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Ionicons name="send" size={16} color={Colors.white} />
            </Pressable>
          </View>
          <Text style={styles.disclaimer}>AI advice is educational only — see a dermatologist for medical concerns.</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coachAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  coachAvatarText: { fontSize: 18 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 11, color: Colors.textMuted },
  clearBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },

  messagesScroll: { paddingHorizontal: 12, paddingTop: 12 },

  bubble: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 6 },
  userBubble: { justifyContent: 'flex-end' },
  assistantBubble: { justifyContent: 'flex-start' },

  assistantAvatarSmall: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    flexShrink: 0,
  },

  bubbleContent: { maxWidth: '80%', borderRadius: 16, padding: 12 },
  userBubbleContent: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubbleContent: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border,
    borderBottomLeftRadius: 4,
    minWidth: 60, minHeight: 36, justifyContent: 'center',
  },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  userBubbleText: { color: Colors.white },
  assistantBubbleText: { color: Colors.textSecondary },

  quickPromptsWrap: { marginVertical: 16 },
  quickPromptsLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '700', marginBottom: 8, paddingHorizontal: 4 },
  quickPromptsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickPromptChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
  },
  quickPromptText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  inputWrap: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.bg, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 16,
    gap: 6,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  textInput: {
    flex: 1, minHeight: 44, maxHeight: 110,
    backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: Colors.textPrimary,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  disclaimer: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
});
