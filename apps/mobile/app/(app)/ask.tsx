import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ChevronLeft, Send } from 'lucide-react-native';
import { Chip, Text, TextField, useTheme } from '@getrentos/ui-native';
import {
  assistantApi,
  mobileRouteFor,
  type AssistantPersona,
  type AssistantLink,
  type AssistantTurn,
} from '@/lib/api/assistant';

interface ChatMessage extends AssistantTurn {
  links?: AssistantLink[];
  suggestions?: string[];
}

const MAX_QUESTION = 500;
const HISTORY_TURNS = 6;
const COPY: Record<AssistantPersona, { starters: string[]; scope: string; placeholder: string }> = {
  renter: {
    starters: [
      'When is my next rent due?',
      'When does my lease end?',
      'Where is my application?',
      'How does payment protection work?',
    ],
    scope: 'Ask about your rent, lease, applications, viewings or repairs.',
    placeholder: 'Ask about your rent, lease or repairs',
  },
  realtor: {
    starters: [
      'Which offers need an answer?',
      'What commission can I withdraw?',
      'Do I have viewings coming up?',
      'How many open leads do I have?',
    ],
    scope: 'Ask about your listings, offers, leads, viewings, clients or commissions.',
    placeholder: 'Ask about offers, leads or commissions',
  },
  landlord: {
    starters: [
      'Who owes me rent?',
      'Which leases end in the next 60 days?',
      'Do I have urgent repairs?',
      'How many units are vacant?',
    ],
    scope: 'Ask about your rent and arrears, leases, repairs, applications or occupancy.',
    placeholder: 'Ask about rent, leases or repairs',
  },
};

/** Ask GetRentos: read-only answers from the user's own account (renter or landlord). */
export default function AskScreen() {
  const params = useLocalSearchParams<{ persona?: string }>();
  const persona: AssistantPersona =
    params.persona === 'landlord' || params.persona === 'realtor' ? params.persona : 'renter';
  const copy = COPY[persona];
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const ask = useMutation({
    mutationFn: ({ question, history }: { question: string; history: AssistantTurn[] }) =>
      assistantApi.ask(question, history, persona),
    onSuccess: (reply) =>
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply.answer,
          links: reply.links,
          suggestions: reply.suggestions,
        },
      ]),
  });

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length, ask.isPending]);

  const send = (raw: string) => {
    const question = raw.trim().slice(0, MAX_QUESTION);
    if (!question || ask.isPending) return;
    const history = messages.slice(-HISTORY_TURNS).map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setText('');
    ask.mutate({ question, history });
  };

  const lastIndex = messages.length - 1;
  const canSend = !!text.trim() && !ask.isPending;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">Ask GetRentos</Text>
          <Text variant="caption" color="mutedForeground" numberOfLines={2}>
            Answers come from your account. Nothing is changed for you.
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
        keyboardShouldPersistTaps="handled"
        accessibilityLiveRegion="polite"
      >
        {messages.length === 0 ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="callout" color="mutedForeground">
              {copy.scope} Try one of these:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {copy.starters.map((s) => (
                <Chip key={s} label={s} onPress={() => send(s)} />
              ))}
            </View>
          </View>
        ) : null}

        {messages.map((m, i) => {
          const mine = m.role === 'user';
          return (
            <View
              key={i}
              style={{
                alignSelf: mine ? 'flex-end' : 'flex-start',
                maxWidth: '86%',
                gap: spacing.sm,
              }}
            >
              <View
                style={{
                  borderRadius: radius.lg,
                  borderBottomRightRadius: mine ? 4 : radius.lg,
                  borderBottomLeftRadius: mine ? radius.lg : 4,
                  paddingVertical: 9,
                  paddingHorizontal: 13,
                  backgroundColor: mine ? colors.primary : colors.secondary,
                }}
              >
                <Text
                  variant="callout"
                  style={{ color: mine ? colors.primaryForeground : colors.foreground }}
                >
                  {m.content}
                </Text>
              </View>
              {m.links?.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {m.links.map((link) => {
                    const to = mobileRouteFor(link.path);
                    return to ? (
                      <Chip
                        key={link.path}
                        size="sm"
                        label={link.label}
                        leadingIcon={<ArrowRight size={13} color={colors.primary} />}
                        onPress={() => router.push(to as Href)}
                      />
                    ) : null;
                  })}
                </View>
              ) : null}
              {i === lastIndex && !ask.isPending && m.suggestions?.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {m.suggestions.map((s) => (
                    <Chip key={s} size="sm" label={s} onPress={() => send(s)} />
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}

        {ask.isPending ? (
          <Text variant="callout" color="mutedForeground" accessibilityRole="progressbar">
            Looking that up…
          </Text>
        ) : null}
        {ask.isError && !ask.isPending ? (
          <Text variant="callout" color="destructive" accessibilityRole="alert">
            That didn&apos;t go through. Please try again.
          </Text>
        ) : null}
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.sm,
        }}
      >
        <View style={{ flex: 1 }}>
          <TextField
            placeholder={copy.placeholder}
            accessibilityLabel="Your question"
            value={text}
            onChangeText={setText}
            maxLength={MAX_QUESTION}
            multiline
            containerStyle={{ maxHeight: 100 }}
          />
        </View>
        <Pressable
          onPress={() => send(text)}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send question"
          accessibilityState={{ disabled: !canSend, busy: ask.isPending }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: canSend ? colors.primary : colors.secondary,
          }}
        >
          <Send size={17} color={canSend ? colors.primaryForeground : colors.mutedForeground} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
