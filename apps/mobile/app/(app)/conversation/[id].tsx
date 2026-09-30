import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, ChevronLeft, FileText, Paperclip, Send, X } from 'lucide-react-native';
import {
  Avatar,
  ErrorState,
  IconButton,
  Skeleton,
  Text,
  TextField,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { messagesApi, type Message } from '@/lib/api/messages';
import { ApiError } from '@/lib/api/client';
import { pickDocument } from '@/lib/filePicker';
import type { PickedFile } from '@/lib/api/documents';
import { relativeTime } from '@/lib/format';
import { useAuth } from '@/lib/auth/AuthProvider';
import { patchConversation } from '@/lib/conversationCache';
import { haptics } from '@/lib/haptics';

const POLL_MS = 8000;

/** A message on its way to the server (or that failed to get there). */
interface Outgoing {
  key: string;
  text: string;
  attachment: PickedFile | null;
  status: 'sending' | 'failed';
  error?: string;
}

type Row = { kind: 'message'; message: Message } | { kind: 'outgoing'; outgoing: Outgoing };

export default function ConversationThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<PickedFile | null>(null);
  const [outgoing, setOutgoing] = useState<Outgoing[]>([]);

  // Just this thread: polled lightly while open (React Query pauses it when
  // the app is in the background or the screen is not focused).
  const query = useQuery({
    queryKey: qk.renter.conversation(id),
    queryFn: () => messagesApi.get(id),
    enabled: !!id,
    refetchInterval: POLL_MS,
  });
  const conversation = query.data;

  // Mark read whenever unread messages are showing: including replies that
  // arrive while the thread is open, not just the first time it loads.
  const marking = useRef(false);
  useEffect(() => {
    if (!conversation || conversation.unreadCount === 0 || marking.current) return;
    marking.current = true;
    messagesApi
      .markRead(id)
      .then((updated) => patchConversation(qc, updated))
      .catch(() => undefined)
      .finally(() => {
        marking.current = false;
      });
  }, [conversation, id, qc]);

  // Announce new incoming messages to screen-reader users.
  const lastSeen = useRef<string | null>(null);
  useEffect(() => {
    const last = conversation?.messages.at(-1);
    if (!last) return;
    if (lastSeen.current && last.id !== lastSeen.current && last.senderId !== profile?.id) {
      AccessibilityInfo.announceForAccessibility(
        `New message from ${last.senderName}: ${last.text}`
      );
    }
    lastSeen.current = last.id;
  }, [conversation?.messages, profile?.id]);

  const sendMutation = useMutation({
    mutationFn: (o: Outgoing) => messagesApi.send(id, o.text, o.attachment ?? undefined),
    onSuccess: (updated, o) => {
      patchConversation(qc, updated);
      setOutgoing((list) => list.filter((x) => x.key !== o.key));
    },
    onError: (err, o) => {
      haptics.error();
      const error =
        err instanceof ApiError
          ? err.isNetwork
            ? 'Not sent: you’re offline.'
            : err.message
          : 'Not sent.';
      setOutgoing((list) =>
        list.map((x) => (x.key === o.key ? { ...x, status: 'failed', error } : x))
      );
      AccessibilityInfo.announceForAccessibility(`Message not sent. ${error}`);
    },
  });

  const send = () => {
    const body = text.trim();
    if (!body && !attachment) return;
    const o: Outgoing = {
      key: `${Date.now()}`,
      text: body,
      attachment,
      status: 'sending',
    };
    // Show it straight away; clear the composer so the next message can start.
    setOutgoing((list) => [...list, o]);
    setText('');
    setAttachment(null);
    sendMutation.mutate(o);
  };

  const retry = (o: Outgoing) => {
    const again = { ...o, status: 'sending' as const, error: undefined };
    setOutgoing((list) => list.map((x) => (x.key === o.key ? again : x)));
    sendMutation.mutate(again);
  };

  const discard = (o: Outgoing) => setOutgoing((list) => list.filter((x) => x.key !== o.key));

  // Newest first: the list is inverted, so it opens at the latest message and
  // only renders what is on screen, however long the thread gets.
  const rows = useMemo<Row[]>(() => {
    const sent = (conversation?.messages ?? []).map<Row>((m) => ({ kind: 'message', message: m }));
    const pending = outgoing.map<Row>((o) => ({ kind: 'outgoing', outgoing: o }));
    return [...sent, ...pending].reverse();
  }, [conversation?.messages, outgoing]);

  const pickAttachment = useCallback(async () => {
    const file = await pickDocument();
    if (file) setAttachment(file);
  }, []);

  const canSend = text.trim().length > 0 || !!attachment;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      // Android runs edge-to-edge, so the window no longer resizes for the keyboard.
      behavior={Platform.OS === 'web' ? undefined : 'padding'}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + spacing.xs,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.sm,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        }}
      >
        <IconButton
          onPress={() => router.back()}
          haptic={false}
          accessibilityLabel="Back to messages"
          icon={<ChevronLeft size={22} color={colors.foreground} />}
          style={{ borderWidth: 0, backgroundColor: 'transparent' }}
        />
        <Avatar name={conversation?.participantName} size={36} />
        <View style={{ flex: 1 }} accessible accessibilityRole="header">
          <Text variant="bodyStrong" numberOfLines={1}>
            {conversation?.participantName ?? 'Conversation'}
          </Text>
          {conversation?.propertyName ? (
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {conversation.propertyName}
            </Text>
          ) : null}
        </View>
      </View>

      {query.isError && !conversation ? (
        <ErrorState
          title="We couldn’t open this conversation"
          description="Check your connection and try again."
          onRetry={() => query.refetch()}
        />
      ) : !conversation ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Skeleton height={40} width="60%" />
          <Skeleton height={40} width="75%" />
          <Skeleton height={40} width="50%" />
        </View>
      ) : (
        <FlatList
          data={rows}
          inverted
          keyExtractor={(r) => (r.kind === 'message' ? r.message.id : `out-${r.outgoing.key}`)}
          renderItem={({ item }) =>
            item.kind === 'message' ? (
              <MessageBubble message={item.message} mine={item.message.senderId === profile?.id} />
            ) : (
              <OutgoingBubble
                outgoing={item.outgoing}
                onRetry={() => retry(item.outgoing)}
                onDiscard={() => discard(item.outgoing)}
              />
            )
          }
          ListEmptyComponent={
            <View style={{ padding: spacing.xl, transform: [{ scaleY: -1 }] }}>
              <Text variant="callout" color="mutedForeground" center>
                No messages yet: say hello.
              </Text>
            </View>
          }
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />
      )}

      {attachment ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginHorizontal: spacing.lg,
            marginBottom: spacing.xs,
            paddingLeft: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.secondary,
          }}
        >
          <FileText size={15} color={colors.mutedForeground} />
          <Text variant="caption" numberOfLines={1} style={{ flex: 1 }}>
            {attachment.name}
          </Text>
          <IconButton
            onPress={() => setAttachment(null)}
            haptic={false}
            accessibilityLabel={`Remove attachment ${attachment.name}`}
            icon={<X size={16} color={colors.mutedForeground} />}
            style={{ borderWidth: 0, backgroundColor: 'transparent' }}
          />
        </View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.sm,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        <IconButton
          onPress={pickAttachment}
          haptic={false}
          accessibilityLabel="Attach a file"
          icon={<Paperclip size={20} color={colors.mutedForeground} />}
          style={{ borderWidth: 0, backgroundColor: 'transparent', marginBottom: 5 }}
        />
        <View style={{ flex: 1 }}>
          <TextField
            placeholder="Message"
            accessibilityLabel="Message"
            value={text}
            onChangeText={setText}
            multiline
            containerStyle={{ maxHeight: 120 }}
          />
        </View>
        <IconButton
          onPress={send}
          disabled={!canSend}
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !canSend }}
          icon={
            <Send size={18} color={canSend ? colors.primaryForeground : colors.mutedForeground} />
          }
          style={{
            marginBottom: 5,
            borderWidth: 0,
            backgroundColor: canSend ? colors.primary : colors.secondary,
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

/* -------------------------------- bubbles -------------------------------- */

function Bubble({
  mine,
  children,
  footer,
  label,
  tone = 'normal',
}: {
  mine: boolean;
  children: React.ReactNode;
  footer: React.ReactNode;
  label: string;
  tone?: 'normal' | 'pending' | 'failed';
}) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={{ maxWidth: '82%', alignSelf: mine ? 'flex-end' : 'flex-start' }}
      accessible
      accessibilityLabel={label}
    >
      <View
        style={{
          borderRadius: radius.lg,
          borderBottomRightRadius: mine ? 4 : radius.lg,
          borderBottomLeftRadius: mine ? radius.lg : 4,
          paddingVertical: 9,
          paddingHorizontal: 13,
          backgroundColor: mine ? colors.primary : colors.secondary,
          opacity: tone === 'pending' ? 0.7 : 1,
          borderWidth: tone === 'failed' ? 1.5 : 0,
          borderColor: colors.destructive,
        }}
      >
        {children}
      </View>
      <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', marginTop: 3 }}>{footer}</View>
    </View>
  );
}

function MessageBubble({ message, mine }: { message: Message; mine: boolean }) {
  const { colors } = useTheme();
  const fg = mine ? colors.primaryForeground : colors.foreground;
  const files = message.attachments ?? [];
  return (
    <Bubble
      mine={mine}
      label={[
        mine ? 'You' : message.senderName,
        message.text,
        files.length ? `${files.length} attachment${files.length === 1 ? '' : 's'}` : null,
        relativeTime(message.timestamp),
      ]
        .filter(Boolean)
        .join(', ')}
      footer={
        <Text variant="caption" color="mutedForeground">
          {relativeTime(message.timestamp)}
        </Text>
      }
    >
      {message.text ? (
        <Text variant="callout" style={{ color: fg }}>
          {message.text}
        </Text>
      ) : null}
      {files.map((a) => (
        <Pressable
          key={a.url}
          onPress={() => Linking.openURL(a.url)}
          accessibilityRole="link"
          accessibilityLabel={`Open attachment ${a.name}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            minHeight: 32,
            marginTop: message.text ? 4 : 0,
          }}
        >
          <FileText size={13} color={mine ? colors.primaryForeground : colors.mutedForeground} />
          <Text
            variant="caption"
            numberOfLines={1}
            style={{
              color: mine ? colors.primaryForeground : colors.mutedForeground,
              textDecorationLine: 'underline',
            }}
          >
            {a.name}
          </Text>
        </Pressable>
      ))}
    </Bubble>
  );
}

function OutgoingBubble({
  outgoing: o,
  onRetry,
  onDiscard,
}: {
  outgoing: Outgoing;
  onRetry: () => void;
  onDiscard: () => void;
}) {
  const { colors, spacing } = useTheme();
  const failed = o.status === 'failed';
  return (
    <Bubble
      mine
      tone={failed ? 'failed' : 'pending'}
      label={`You, ${o.text || o.attachment?.name || ''}, ${failed ? `not sent. ${o.error ?? ''}` : 'sending'}`}
      footer={
        failed ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <AlertCircle size={13} color={colors.destructive} />
            <Text variant="caption" style={{ color: colors.destructive }}>
              {o.error}
            </Text>
            <Pressable
              onPress={onRetry}
              accessibilityRole="button"
              accessibilityLabel="Retry sending"
              hitSlop={12}
            >
              <Text variant="caption" color="primary" style={{ fontWeight: '700' }}>
                Retry
              </Text>
            </Pressable>
            <Pressable
              onPress={onDiscard}
              accessibilityRole="button"
              accessibilityLabel="Discard unsent message"
              hitSlop={12}
            >
              <Text variant="caption" color="mutedForeground" style={{ fontWeight: '600' }}>
                Discard
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text variant="caption" color="mutedForeground">
            Sending…
          </Text>
        )
      }
    >
      {o.text ? (
        <Text variant="callout" style={{ color: colors.primaryForeground }}>
          {o.text}
        </Text>
      ) : null}
      {o.attachment ? (
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: o.text ? 4 : 0 }}
        >
          <FileText size={13} color={colors.primaryForeground} />
          <Text variant="caption" numberOfLines={1} style={{ color: colors.primaryForeground }}>
            {o.attachment.name}
          </Text>
        </View>
      ) : null}
    </Bubble>
  );
}
