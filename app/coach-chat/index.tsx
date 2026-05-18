import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Groq from 'groq-sdk';
import type { Palette } from '../../src/constants/colors';
import { useColors } from '../../src/state/theme';
import { Storage } from '../../src/services/storage';
import { Auth } from '../../src/services/auth';
import { PremiumGate, PremiumBanner } from '../../src/components/PremiumGate';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FREE_MSG_LIMIT = 10;
const todayKey = () => `gd_coach_msgs_${new Date().toISOString().slice(0, 10)}`;

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
  'What actually repairs the skin barrier?',
  'Best routine order for my concerns?',
  'How long before I see results?',
];

const SYSTEM_PROMPT = `You are Vera, an expert AI skincare advisor inside Velumi AI — a premium, brand-agnostic skin-intelligence app.

Your role: give personalized, science-backed skincare advice. Be warm, direct, and conversational. Keep answers concise (2-4 short paragraphs max) unless more detail is needed.

Evidence stance: ground advice in dermatology consensus and ingredient science. Favor a healthy skin barrier, daily sun protection, and a small set of proven actives over fads or hype.

When recommending products: suggest widely-available, well-formulated options matched to their skin — never a house or first-party brand, never pushy. Focus on education and the actual active ingredients.

Key rules:
- Never diagnose medical conditions. If asked about serious conditions (cystic acne, eczema, rosacea flares), advise seeing a dermatologist.
- Be specific and actionable. Not "drink more water" — but why and how much.
- Back claims with mechanism (e.g., "retinol speeds cell turnover by binding to retinoid receptors").
- Avoid filler phrases like "Great question!" or "Of course!"`;

export default function CoachChat() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<{ skinType?: string; concerns?: string[] } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [msgsUsed, setMsgsUsed] = useState(0);
  const [showGate, setShowGate] = useState(false);

  useFocusEffect(useCallback(() => {
    (async () => {
      const p = await Storage.getUserProfile();
      if (p) setProfile({ skinType: p.skinType, concerns: p.primaryConcerns });

      const user = await Auth.getCurrentUser();
      setIsPremium(user?.isPremium ?? false);
      const stored = await AsyncStorage.getItem(todayKey());
      setMsgsUsed(stored ? parseInt(stored, 10) : 0);

      if (messages.length === 0) {
        const greeting = p
          ? `Hi! I'm Vera. I can see you have ${p.skinType} skin${p.primaryConcerns?.length ? ` with concerns around ${p.primaryConcerns.slice(0, 2).join(' and ')}` : ''}. What's on your mind?`
          : 'Hi! I\'m Vera — your personal AI skincare advisor. Ask me anything about your skin, ingredients, or routine — I\'ll keep it specific to you.';
        setMessages([{ role: 'assistant', content: greeting }]);
      }
    })();
  }, []));

  const sendMessage = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    // Check daily limit for free users
    if (!isPremium && msgsUsed >= FREE_MSG_LIMIT) {
      setShowGate(true);
      return;
    }

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
      // Track message count for free users
      if (!isPremium) {
        const newCount = msgsUsed + 1;
        setMsgsUsed(newCount);
        await AsyncStorage.setItem(todayKey(), String(newCount));
      }
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
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.coachAvatar}>
              <LinearGradient colors={[colors.primary, colors.gold]} style={StyleSheet.absoluteFill} />
              <Text style={styles.coachAvatarText}>✨</Text>
            </View>
            <View>
              <Text style={styles.headerTitle} numberOfLines={1}>Vera</Text>
              <Text style={styles.headerSub}>AI Skincare Advisor</Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Clear chat" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.clearBtn} onPress={clearChat}>
            <Ionicons name="refresh-outline" size={18} color={colors.textMuted} />
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
                  <LinearGradient colors={[colors.primary, colors.gold]} style={StyleSheet.absoluteFill} />
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
                <LinearGradient colors={[colors.primary, colors.gold]} style={StyleSheet.absoluteFill} />
                <Text style={{ fontSize: 10 }}>✨</Text>
              </View>
              <View style={styles.assistantBubbleContent}>
                <ActivityIndicator size="small" color={colors.primary} />
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

        {/* Usage indicator for free users */}
        {!isPremium && msgsUsed >= FREE_MSG_LIMIT - 3 && msgsUsed < FREE_MSG_LIMIT && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
            <PremiumBanner
              message={`${msgsUsed}/${FREE_MSG_LIMIT} free messages used today`}
              onUpgrade={() => setShowGate(true)}
            />
          </View>
        )}

        {/* Input */}
        <View style={styles.inputWrap}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask anything about your skin..."
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage()}
              returnKeyType="send"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <LinearGradient
                colors={[colors.primary, colors.gold]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Ionicons name="send" size={16} color={colors.white} />
            </Pressable>
          </View>
          <Text style={styles.disclaimer}>AI advice is educational only — see a dermatologist for medical concerns.</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coachAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  coachAvatarText: { fontSize: 18 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: c.textPrimary },
  headerSub: { fontSize: 11, color: c.textMuted },
  clearBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
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
    backgroundColor: c.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubbleContent: {
    backgroundColor: c.bgCard,
    borderWidth: 1, borderColor: c.border,
    borderBottomLeftRadius: 4,
    minWidth: 60, minHeight: 36, justifyContent: 'center',
  },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  userBubbleText: { color: c.white },
  assistantBubbleText: { color: c.textSecondary },

  quickPromptsWrap: { marginVertical: 16 },
  quickPromptsLabel: { fontSize: 11, color: c.textMuted, fontWeight: '700', marginBottom: 8, paddingHorizontal: 4 },
  quickPromptsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickPromptChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
  },
  quickPromptText: { fontSize: 12, color: c.textSecondary, fontWeight: '600' },

  inputWrap: {
    borderTopWidth: 1, borderTopColor: c.border,
    backgroundColor: c.bg, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 16,
    gap: 6,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  textInput: {
    flex: 1, minHeight: 44, maxHeight: 110,
    backgroundColor: c.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: c.border,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: c.textPrimary,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  disclaimer: { fontSize: 10, color: c.textMuted, textAlign: 'center' },
  });
}
