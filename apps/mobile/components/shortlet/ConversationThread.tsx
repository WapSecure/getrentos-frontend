import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, ChevronLeft, EyeOff, Send } from 'lucide-react-native';
import {
  Avatar,
  ErrorState,
  IconButton,
  Skeleton,
  Text,
  TextField,
  useTheme,
} from '@getrentos/ui-native';
import type { Paginated } from '@/lib/api/properties';
import { ApiError } from '@/lib/api/client';
import { relativeTime } from '@/lib/format';
import { useAuth } from '@/lib/auth/AuthProvider';

const POLL_MS = 8000;

/** The fields a thread needs; host and guest conversations both have them. */
export interface ThreadMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  contactMasked?: boolean;
}

export interface ThreadConversation {
  id: string;
  propertyName: string;
  participantName: string;
  unreadCount: number;
  messages: ThreadMessage[];
}

type Row =
  | { kind: 'sent'; m: ThreadMessage }
  | { kind: 'pending'; key: string; text: string; error?: string };

/**
 * One shortlet thread, for either side. Conversations carry their messages
 * inline, so the open thread polls the conversation list; sending returns the
 * updated conversation, which is written straight into the cache.
 */
export function ConversationThread<C extends ThreadConversation>({
  id,
  queryKey,
  list,
  send: sendMessage,
  markRead,
  fallbackName,
  backLabel = 'Back to messages',
}: {
  id: string;
  queryKey: readonly unknown[];
  list: () => Promise<Paginated<C>>;
  send: (conversationId: string, text: string) => Promise<C>;
  markRead: (conversationId: string) => Promise<unknown>;
  /** Who's on the other side when the name hasn't loaded ("Guest", "Host"). */
  fallbackName: string;
  backLabel?: string;
}) {
  const { profile } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [pending, setPending] = useState<{ key: string; text: string; error?: string }[]>([]);

  const conversations = useQuery({
    queryKey,
    queryFn: list,
    refetchInterval: POLL_MS,
  });
  const c = conversations.data?.items.find((x) => x.id === id);
  const messages = useMemo(
    () => [...(c?.messages ?? [])].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [c]
  );

  const count = messages.length;
  useEffect(() => {
    if (!id || !c?.unreadCount) return;
    markRead(id)
      .then(() =>
        qc.setQueryData<Paginated<C>>(queryKey, (old) =>
          old
            ? { ...old, items: old.items.map((x) => (x.id === id ? { ...x, unreadCount: 0 } : x)) }
            : old
        )
      )
      .catch(() => undefined);
  }, [id, count, c?.unreadCount, qc, markRead, queryKey]);

  const send = useMutation({
    mutationFn: (p: { key: string; text: string }) => sendMessage(id, p.text),
    onSuccess: (updated, p) => {
      setPending((rows) => rows.filter((x) => x.key !== p.key));
      qc.setQueryData<Paginated<C>>(queryKey, (old) =>
        old ? { ...old, items: old.items.map((x) => (x.id === id ? updated : x)) } : old
      );
    },
    onError: (err, p) => {
      const error =
        err instanceof ApiError
          ? err.isNetwork
            ? 'Not sent: you’re offline.'
            : err.message
          : 'Not sent.';
      setPending((rows) => rows.map((x) => (x.key === p.key ? { ...x, error } : x)));
    },
  });

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    const p = { key: `${Date.now()}`, text: body };
    setPending((rows) => [...rows, p]);
    setText('');
    send.mutate(p);
  };

  const rows = useMemo<Row[]>(
    () =>
      [
        ...messages.map<Row>((m) => ({ kind: 'sent', m })),
        ...pending.map<Row>((p) => ({ kind: 'pending', ...p })),
      ].reverse(),
    [messages, pending]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
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
          accessibilityLabel={backLabel}
          icon={<ChevronLeft size={22} color={colors.foreground} />}
          style={{ borderWidth: 0, backgroundColor: 'transparent' }}
        />
        <Avatar name={c?.participantName} size={36} />
        <View style={{ flex: 1 }} accessible accessibilityRole="header">
          <Text variant="bodyStrong" numberOfLines={1}>
            {c?.participantName ?? fallbackName}
          </Text>
          {c?.propertyName ? (
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {c.propertyName}
            </Text>
          ) : null}
        </View>
      </View>

      {conversations.isError && !conversations.data ? (
        <ErrorState onRetry={() => conversations.refetch()} />
      ) : conversations.isPending ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Skeleton height={40} width="60%" />
          <Skeleton height={40} width="75%" />
        </View>
      ) : (
        <FlatList
          data={rows}
          inverted
          keyExtractor={(r) => (r.kind === 'sent' ? r.m.id : `p-${r.key}`)}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          keyboardDismissMode="interactive"
          ListFooterComponent={
            <Text
              variant="caption"
              color="mutedForeground"
              center
              style={{ marginBottom: spacing.md }}
            >
              Phone numbers and emails stay hidden until a stay is paid. Keep payments on GetRentos
              so you’re protected.
            </Text>
          }
          renderItem={({ item }) => {
            const mine = item.kind === 'pending' || item.m.senderId === profile?.id;
            const body = item.kind === 'sent' ? item.m.text : item.text;
            const failed = item.kind === 'pending' && !!item.error;
            const masked = item.kind === 'sent' && item.m.contactMasked;
            return (
              <View
                style={{ maxWidth: '82%', alignSelf: mine ? 'flex-end' : 'flex-start' }}
                accessible
                accessibilityLabel={`${mine ? 'You' : item.kind === 'sent' ? item.m.senderName : ''}, ${body}, ${
                  item.kind === 'sent'
                    ? relativeTime(item.m.timestamp)
                    : failed
                      ? `not sent. ${item.error}`
                      : 'sending'
                }${masked ? '. Contact details hidden' : ''}`}
              >
                <View
                  style={{
                    paddingVertical: 9,
                    paddingHorizontal: 13,
                    borderRadius: radius.lg,
                    borderBottomRightRadius: mine ? 4 : radius.lg,
                    borderBottomLeftRadius: mine ? radius.lg : 4,
                    backgroundColor: mine ? colors.primary : colors.secondary,
                    opacity: item.kind === 'pending' && !failed ? 0.7 : 1,
                    borderWidth: failed ? 1.5 : 0,
                    borderColor: colors.destructive,
                  }}
                >
                  <Text
                    variant="callout"
                    style={{ color: mine ? colors.primaryForeground : colors.foreground }}
                  >
                    {body}
                  </Text>
                </View>
                {masked ? (
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}
                  >
                    <EyeOff size={12} color={colors.mutedForeground} />
                    <Text variant="caption" color="mutedForeground">
                      Contact details hidden until the stay is paid
                    </Text>
                  </View>
                ) : null}
                {item.kind === 'sent' ? (
                  <Text
                    variant="caption"
                    color="mutedForeground"
                    style={{ marginTop: 3, alignSelf: mine ? 'flex-end' : 'flex-start' }}
                  >
                    {relativeTime(item.m.timestamp)}
                  </Text>
                ) : failed ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      marginTop: 3,
                      alignSelf: 'flex-end',
                    }}
                  >
                    <AlertCircle size={13} color={colors.destructive} />
                    <Text variant="caption" style={{ color: colors.destructive }}>
                      {item.error}
                    </Text>
                    <Pressable
                      onPress={() => {
                        setPending((rows) =>
                          rows.map((x) => (x.key === item.key ? { ...x, error: undefined } : x))
                        );
                        send.mutate({ key: item.key, text: item.text });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Retry sending"
                      hitSlop={12}
                    >
                      <Text variant="caption" color="primary" style={{ fontWeight: '700' }}>
                        Retry
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text
                    variant="caption"
                    color="mutedForeground"
                    style={{ marginTop: 3, alignSelf: 'flex-end' }}
                  >
                    Sending…
                  </Text>
                )}
              </View>
            );
          }}
        />
      )}

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
          onPress={submit}
          disabled={!text.trim()}
          accessibilityLabel="Send message"
          icon={
            <Send
              size={18}
              color={text.trim() ? colors.primaryForeground : colors.mutedForeground}
            />
          }
          style={{
            marginBottom: 5,
            borderWidth: 0,
            backgroundColor: text.trim() ? colors.primary : colors.secondary,
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
