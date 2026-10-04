import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import {
  AlertCircle,
  ChevronLeft,
  FileText,
  MessageCircle,
  Paperclip,
  Send,
  X,
} from 'lucide-react-native';
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
import type { PickedFile } from '@/lib/api/documents';
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
  /** Files sent with the message, shown by name. */
  attachments?: { id: string; name: string }[];
}

interface Pending {
  key: string;
  text: string;
  file?: PickedFile;
  error?: string;
}

type Row = { kind: 'sent'; m: ThreadMessage } | ({ kind: 'pending' } & Pending);

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
  headerAccessory,
  pickAttachment,
}: {
  id: string;
  /** Who the thread is with. */
  name?: string;
  /** A second line under the name: the property, or their role. */
  context?: string;
  messagesKey: readonly unknown[];
  /** Oldest first. */
  fetchMessages: () => Promise<ThreadMessage[]>;
  send: (text: string, file?: PickedFile) => Promise<unknown>;
  /** Omit when the portal's API marks a thread read as it is fetched. */
  markRead?: () => Promise<unknown>;
  /** The inbox list to refresh when something here changes. */
  conversationsKey: readonly unknown[];
  emptyDescription: string;
  /** An action beside the name, e.g. pin this conversation. */
  headerAccessory?: ReactNode;
  /** Provide to let the user attach one file to a message. */
  pickAttachment?: () => Promise<PickedFile | null>;
}) {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);

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
    if (!id || !count || !markRead) return;
    markRead()
      .then(() => qc.invalidateQueries({ queryKey: conversationsKey }))
      .catch(() => undefined);
    // markRead and the key are stable per thread; re-running on a new function
    // identity would mark read on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, count, qc]);

  const send = useMutation({
    mutationFn: (p: Pending) => sendMessage(p.text, p.file),
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
    if (!body && !file) return;
    const p: Pending = { key: `${Date.now()}`, text: body, file: file ?? undefined };
    setPending((list) => [...list, p]);
    setText('');
    setFile(null);
    send.mutate(p);
  };

  const canSend = !!text.trim() || !!file;

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
        {headerAccessory}
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
            const files =
              item.kind === 'sent'
                ? (item.m.attachments ?? []).map((a) => a.name)
                : item.file
                  ? [item.file.name]
                  : [];
            const who = mine
              ? 'You'
              : item.kind === 'sent'
                ? (item.m.senderName ?? name ?? '')
                : '';
            return (
              <View
                style={{ maxWidth: '82%', alignSelf: mine ? 'flex-end' : 'flex-start' }}
                accessible
                accessibilityLabel={`${who}, ${[body, ...files.map((f) => `file ${f}`)].filter(Boolean).join(', ')}, ${
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
                  {body ? (
                    <Text
                      variant="callout"
                      style={{ color: mine ? colors.primaryForeground : colors.foreground }}
                    >
                      {body}
                    </Text>
                  ) : null}
                  {files.map((name, i) => (
                    <View
                      key={`${name}-${i}`}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: body || i ? 6 : 0,
                      }}
                    >
                      <FileText
                        size={13}
                        color={mine ? colors.primaryForeground : colors.mutedForeground}
                      />
                      <Text
                        variant="caption"
                        numberOfLines={1}
                        style={{
                          flexShrink: 1,
                          color: mine ? colors.primaryForeground : colors.mutedForeground,
                        }}
                      >
                        {name}
                      </Text>
                    </View>
                  ))}
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
                        send.mutate({ key: item.key, text: item.text, file: item.file });
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

      {file ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            backgroundColor: colors.secondary,
          }}
        >
          <FileText size={15} color={colors.mutedForeground} />
          <Text variant="caption" numberOfLines={1} style={{ flex: 1 }}>
            {file.name}
          </Text>
          <Pressable
            onPress={() => setFile(null)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${file.name}`}
            hitSlop={12}
          >
            <X size={15} color={colors.mutedForeground} />
          </Pressable>
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
        {pickAttachment ? (
          <IconButton
            onPress={async () => {
              const picked = await pickAttachment();
              if (picked) setFile(picked);
            }}
            haptic={false}
            accessibilityLabel="Attach a file"
            icon={<Paperclip size={19} color={colors.mutedForeground} />}
            style={{ marginBottom: 5, borderWidth: 0, backgroundColor: 'transparent' }}
          />
        ) : null}
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
          disabled={!canSend}
          accessibilityLabel="Send message"
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
