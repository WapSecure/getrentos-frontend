import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
import { qk } from '@/lib/query/keys';
import { ownerApi, type OwnerMessage } from '@/lib/api/owner';
import { ApiError } from '@/lib/api/client';
import { relativeTime } from '@/lib/format';
import { useAuth } from '@/lib/auth/AuthProvider';

const POLL_MS = 8000;

type Row =
  | { kind: 'sent'; m: OwnerMessage }
  | { kind: 'pending'; key: string; text: string; error?: string };

export default function OwnerConversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [pending, setPending] = useState<{ key: string; text: string; error?: string }[]>([]);

  const conversations = useQuery({
    queryKey: qk.owner.conversations,
    queryFn: () => ownerApi.conversations(1, 50),
  });
  const conversation = conversations.data?.items.find((c) => c.id === id);

  // Only this thread's messages are polled while it is open.
  const messages = useQuery({
    queryKey: qk.owner.messages(id),
    queryFn: () => ownerApi.messages(id),
    enabled: !!id,
    refetchInterval: POLL_MS,
  });

  // Mark read on open and whenever new messages arrive.
  const count = messages.data?.length ?? 0;
  useEffect(() => {
    if (!id || !count) return;
    ownerApi
      .markRead(id)
      .then(() => qc.invalidateQueries({ queryKey: qk.owner.conversations }))
      .catch(() => undefined);
  }, [id, count, qc]);

  const send = useMutation({
    mutationFn: (p: { key: string; text: string }) => ownerApi.send(id, p.text),
    onSuccess: (_m, p) => {
      setPending((list) => list.filter((x) => x.key !== p.key));
      qc.invalidateQueries({ queryKey: qk.owner.messages(id) });
      qc.invalidateQueries({ queryKey: qk.owner.conversations });
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
              description="Send a message about this property or offer."
            />
          }
          renderItem={({ item }) => {
            const mine = item.kind === 'pending' || item.m.senderId === profile?.id;
            const body = item.kind === 'sent' ? item.m.text : item.text;
            const failed = item.kind === 'pending' && !!item.error;
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
