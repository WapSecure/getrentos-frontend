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
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ChevronLeft, Mic, Send, Square, Volume2 } from 'lucide-react-native';
import { Chip, Text, TextField, useTheme } from '@sureground/ui-native';
import {
  REPLY_LANGUAGES,
  languageLabel,
  loadReplyLanguage,
  saveReplyLanguage,
  type ReplyLanguage,
} from '@/lib/replyLanguage';
import { useReadAloud, useVoiceInput } from '@/lib/voice';
import { messagingConsentApi } from '@/lib/api/messagingConsent';
import { qk } from '@/lib/query/keys';
import {
  assistantApi,
  mobileRouteFor,
  type AssistantPersona,
  type AssistantLink,
  type AssistantTurn,
} from '@/lib/api/assistant';

interface ChatMessage extends AssistantTurn {
  /** The language an answer is in, for reading it aloud. */
  language?: ReplyLanguage;
  /** Set when the answer could not be given in the language asked for. */
  fellBackFrom?: ReplyLanguage;
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
  owner: {
    starters: [
      'Which offers need an answer?',
      'Where are my sales up to?',
      'Do I have viewings to confirm?',
      'Has a realtor asked to work with me?',
    ],
    scope: 'Ask about your properties, listings, offers, sales, viewings or realtors.',
    placeholder: 'Ask about offers, sales or viewings',
  },
  resident: {
    starters: [
      'Do I owe any dues?',
      'Is anyone waiting at the gate for me?',
      'Any parcels for me?',
      'Any new announcements?',
    ],
    scope: 'Ask about your dues, visitors, deliveries, repairs, announcements, polls or bookings.',
    placeholder: 'Ask about dues, visitors or deliveries',
  },
  estate: {
    starters: [
      'How many households owe dues?',
      'Are there any critical incidents?',
      'Which maintenance tickets are urgent?',
      'How many visitors are on site?',
    ],
    scope:
      'Ask about this estate’s dues, incidents, maintenance, violations, visitors or deliveries.',
    placeholder: 'Ask about dues, incidents or visitors',
  },
  agent: {
    starters: [
      'What should I do first today?',
      'Which inspections are still drafts?',
      'Do I have work orders to start?',
      'Has a client approved my invitation?',
    ],
    scope: 'Ask about your tasks, inspections, verifications, work orders or clients.',
    placeholder: 'Ask about tasks, inspections or work orders',
  },
  buyer: {
    starters: [
      'Which offers need my answer?',
      'Where are my purchases up to?',
      'Do I have a deposit to pay?',
      'When is my next viewing?',
    ],
    scope: 'Ask about your offers, purchases, viewings, saved homes or documents.',
    placeholder: 'Ask about offers, purchases or viewings',
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
  agency: {
    starters: [
      'How much rent have we collected this month?',
      'How much is in arrears?',
      'Which owner queries are waiting on me?',
      'Any work orders past their deadline?',
    ],
    scope:
      "Questions about your firm's owners, occupancy, rent collection, arrears, maintenance and owner queries.",
    placeholder: 'Ask about rent, arrears or owner queries',
  },
};

/** Ask Sureground: read-only answers from the user's own account (renter or landlord). */
export default function AskScreen() {
  const params = useLocalSearchParams<{ persona?: string; estateId?: string }>();
  const persona: AssistantPersona =
    params.persona === 'landlord' ||
    params.persona === 'realtor' ||
    params.persona === 'owner' ||
    params.persona === 'buyer' ||
    params.persona === 'agent' ||
    params.persona === 'resident' ||
    params.persona === 'agency' ||
    (params.persona === 'estate' && !!params.estateId)
      ? params.persona
      : 'renter';
  const copy = COPY[persona];
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [language, setLanguage] = useState<ReplyLanguage>('en');
  useEffect(() => {
    void loadReplyLanguage().then(setLanguage);
  }, []);
  const chooseLanguage = (next: ReplyLanguage) => {
    setLanguage(next);
    void saveReplyLanguage(next);
  };

  const ask = useMutation({
    mutationFn: ({ question, history }: { question: string; history: AssistantTurn[] }) =>
      assistantApi.ask(question, history, persona, params.estateId, language),
    onSuccess: (reply) =>
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply.answer,
          links: reply.links,
          suggestions: reply.suggestions,
          language: reply.language ?? 'en',
          fellBackFrom:
            reply.requestedLanguage && reply.language !== reply.requestedLanguage
              ? reply.requestedLanguage
              : undefined,
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

  // Spoken words land in the box, so the person can check them before sending.
  const voice = useVoiceInput(language, setText);
  const readAloud = useReadAloud();

  // The same assistant on WhatsApp, once it is set up and the person has WhatsApp turned on.
  const consent = useQuery({
    queryKey: qk.messagingConsent,
    queryFn: messagingConsentApi.get,
    staleTime: 10 * 60_000,
  });
  const whatsappNumber = consent.data?.whatsapp ? consent.data.whatsappChatNumber : null;

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
          <Text variant="bodyStrong">Ask Sureground</Text>
          <Text variant="caption" color="mutedForeground" numberOfLines={2}>
            Answers come from your account. Nothing is changed for you.
          </Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          gap: spacing.xs,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.sm,
          alignItems: 'center',
        }}
        accessibilityLabel="Reply language"
      >
        <Text variant="caption" color="mutedForeground">
          Reply in
        </Text>
        {REPLY_LANGUAGES.map((l) => (
          <Chip
            key={l.value}
            size="sm"
            label={l.label}
            selected={language === l.value}
            onPress={() => chooseLanguage(l.value)}
          />
        ))}
      </ScrollView>

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
            {whatsappNumber ? (
              <Text variant="caption" color="mutedForeground">
                You can also ask on WhatsApp: message {whatsappNumber} from your number and say
                &ldquo;hi&rdquo;.
              </Text>
            ) : null}
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
              {!mine && readAloud.canRead(m.language ?? 'en') ? (
                <Chip
                  size="sm"
                  label={readAloud.speaking === i ? 'Stop reading' : 'Read aloud'}
                  leadingIcon={
                    readAloud.speaking === i ? (
                      <Square size={12} color={colors.foreground} />
                    ) : (
                      <Volume2 size={13} color={colors.foreground} />
                    )
                  }
                  onPress={() => readAloud.toggle(i, m.content, m.language ?? 'en')}
                />
              ) : null}
              {m.fellBackFrom ? (
                <Text variant="caption" color="mutedForeground">
                  Answered in English: replies in {languageLabel(m.fellBackFrom)} are not available
                  right now.
                </Text>
              ) : null}
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

      {voice.error || voice.listening || !voice.available ? (
        <Text
          variant="caption"
          color={voice.error ? 'destructive' : 'mutedForeground'}
          accessibilityLiveRegion="polite"
          style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xs }}
        >
          {voice.error ??
            (voice.listening
              ? `Listening in ${languageLabel(language)}… tap the square when you finish.`
              : 'To speak your question, tap the microphone on your keyboard.')}
        </Text>
      ) : null}
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
        {voice.available ? (
          <Pressable
            onPress={() => (voice.listening ? voice.stop() : void voice.start())}
            disabled={ask.isPending}
            accessibilityRole="button"
            accessibilityLabel={voice.listening ? 'Stop listening' : 'Speak your question'}
            accessibilityState={{ disabled: ask.isPending }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: voice.listening ? colors.destructive : colors.secondary,
            }}
          >
            {voice.listening ? (
              <Square size={15} color={colors.destructiveForeground} />
            ) : (
              <Mic size={18} color={colors.foreground} />
            )}
          </Pressable>
        ) : null}
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
