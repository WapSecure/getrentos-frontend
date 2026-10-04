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
import { AlertCircle, ChevronLeft, MessageCircle, Send } from 'lucide-react-native';
import {
  Avatar,
  EmptyState,
  ErrorState,
  IconButton,
  Skeleton,
  Text,
  TextField,
  useTheme,
} from '@getrentos/ui-native';
import { ApiError } from '@/lib/api/client';
import { relativeTime } from '@/lib/format';

const POLL_MS = 8000;

/** One message, already told whose side it is on. */
export interface ThreadMessage {
  id: string;
  text: string;
  timestamp: string;
  mine: boolean;
  /** Read out for the other side's messages. */
  senderName?: string;
}

type Row =
  | { kind: 'sent'; m: ThreadMessage }
  | { kind: 'pending'; key: string; text: string; error?: string };

/**
 * One conversation, for any portal: it refreshes while open, shows a message
 * the moment it is sent, and offers a retry when sending fails. Callers supply
 * their own API and say who the thread is with.
 */
export function MessageThread({
  id,
  name,
  context,
  messagesKey,
  fetchMessages,
  send: sendMessage,
  markRead,
  conversationsKey,
  emptyDescription,
}: {
  id: string;
  /** Who the thread is with. */
  name?: string;
  /** A second line under the name: the property, or their role. */
  context?: string;
  messagesKey: readonly unknown[];
  /** Oldest first. */
  fetchMessages: () => Promise<ThreadMessage[]>;
  send: (text: string) => Promise<unknown>;
  markRead: () => Promise<unknown>;
  /** The inbox list to refresh when something here changes. */
  conversationsKey: readonly unknown[];
  emptyDescription: string;
}) {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [pending, setPending] = useState<{ key: string; text: string; error?: string }[]>([]);

  // Only this thread's messages are polled while it is open.
  const messages = useQuery({
    queryKey: messagesKey,
    queryFn: fetchMessages,
    enabled: !!id,
    refetchInterval: POLL_MS,
  });

  // Mark read on open and whenever new messages arrive.
  const count = messages.data?.length ?? 0;
  useEffect(() => {
    if (!id || !count) return;
    markRead()
      .then(() => qc.invalidateQueries({ queryKey: conversationsKey }))
      .catch(() => undefined);
    // markRead and the key are stable per thread; re-running on a new function
    // identity would mark read on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, count, qc]);

  const send = useMutation({
    mutationFn: (p: { key: string; text: string }) => sendMessage(p.text),
    onSuccess: (_m, p) => {
      setPending((list) => list.filter((x) => x.key !== p.key));
      qc.invalidateQueries({ queryKey: messagesKey });
      qc.invalidateQueries({ queryKey: conversationsKey });
    },
    onError: (err, p) => {
      const error =
        err instanceof ApiError
          ? err.isNetwork
            ? 'Not sent: you’re offline.'
            : err.message
          : 'Not sent.';
      setPending((list) => list.map((x) => (x.key === p.key ? { ...x, error } : x)));
    },
  });

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    const p = { key: `${Date.now()}`, text: body };
    setPending((list) => [...list, p]);
    setText('');
    send.mutate(p);
  };

  const rows = useMemo<Row[]>(
    () =>
      [
        ...(messages.data ?? []).map<Row>((m) => ({ kind: 'sent', m })),
        ...pending.map<Row>((p) => ({ kind: 'pending', ...p })),
      ].reverse(),
    [messages.data, pending]
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
          accessibilityLabel="Back to messages"
          icon={<ChevronLeft size={22} color={colors.foreground} />}
          style={{ borderWidth: 0, backgroundColor: 'transparent' }}
        />
        <Avatar name={name} size={36} />
        <View style={{ flex: 1 }} accessible accessibilityRole="header">
          <Text variant="bodyStrong" numberOfLines={1}>
            {name ?? 'Conversation'}
          </Text>
          {context ? (
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {context}
            </Text>
          ) : null}
        </View>
      </View>

      {messages.isError && !messages.data ? (
        <ErrorState onRetry={() => messages.refetch()} />
      ) : messages.isPending ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Skeleton height={40} width="60%" />
          <Skeleton height={40} width="75%" />
        </View>
      ) : (
        <FlatList
          data={rows}
          inverted
          keyExtractor={(r) => (r.kind === 'sent' ? r.m.id : `p-${r.key}`)}
          contentContainerStyle={{ flexGrow: 1, padding: spacing.lg, gap: spacing.sm }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          initialNumToRender={20}
          maxToRenderPerBatch={12}
          windowSize={9}
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={
            <EmptyState
              icon={<MessageCircle size={34} color={colors.mutedForeground} />}
              title="Start the conversation"
              description={emptyDescription}
            />
          }
          renderItem={({ item }) => {
            const mine = item.kind === 'pending' || item.m.mine;
            const body = item.kind === 'sent' ? item.m.text : item.text;
            const failed = item.kind === 'pending' && !!item.error;
            const who = mine
              ? 'You'
              : item.kind === 'sent'
                ? (item.m.senderName ?? name ?? '')
                : '';
            return (
              <View
                style={{ maxWidth: '82%', alignSelf: mine ? 'flex-end' : 'flex-start' }}
                accessible
                accessibilityLabel={`${who}, ${body}, ${
                  item.kind === 'sent'
                    ? relativeTime(item.m.timestamp)
                    : failed
                      ? `not sent. ${item.error}`
                      : 'sending'
                }`}
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
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
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
                        setPending((list) =>
                          list.map((x) => (x.key === item.key ? { ...x, error: undefined } : x))
                        );
                        send.mutate({ key: item.key, text: item.text });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Retry sending"
                      style={{ minHeight: 44, justifyContent: 'center' }}
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
