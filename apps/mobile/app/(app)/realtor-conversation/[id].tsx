import { useEffect, useMemo, useState } from 'react';
import {
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
import {
  AlertCircle,
  ChevronLeft,
  MessageCircle,
  Paperclip,
  Send,
  ShieldCheck,
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
import { qk } from '@/lib/query/keys';
import { realtorApi, type RealtorMessage } from '@/lib/api/realtor';
import type { PickedFile } from '@/lib/api/documents';
import { ApiError } from '@/lib/api/client';
import { pickDocument } from '@/lib/filePicker';
import { relativeTime } from '@/lib/format';

const POLL_MS = 8000;
const MAX_FILES = 5;

type Pending = { key: string; text: string; files: PickedFile[]; error?: string };
type Row = { kind: 'sent'; m: RealtorMessage } | ({ kind: 'pending' } & Pending);

export default function RealtorConversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);

  const conversations = useQuery({
    queryKey: qk.realtor.conversations,
    queryFn: realtorApi.conversations,
  });
  const conversation = conversations.data?.items.find((c) => c.id === id);
  const name = conversation?.client.legalName ?? 'Client';

  // Reading the thread marks it read on the server; refresh the inbox badge after.
  const messages = useQuery({
    queryKey: qk.realtor.messages(id),
    queryFn: () => realtorApi.messages(id),
    enabled: !!id,
    refetchInterval: POLL_MS,
  });
  const count = messages.data?.items.length ?? 0;
  useEffect(() => {
    if (count) qc.invalidateQueries({ queryKey: qk.realtor.conversations });
  }, [count, qc]);

  const send = useMutation({
    mutationFn: (p: Pending) => realtorApi.send(id, p.text, p.files),
    onSuccess: (_m, p) => {
      setPending((list) => list.filter((x) => x.key !== p.key));
      qc.invalidateQueries({ queryKey: qk.realtor.messages(id) });
      qc.invalidateQueries({ queryKey: qk.realtor.conversations });
    },
    onError: (err, p) => {
      const error =
        err instanceof ApiError
          ? err.isNetwork
            ? 'Not sent — you’re offline.'
            : err.message
          : 'Not sent.';
      setPending((list) => list.map((x) => (x.key === p.key ? { ...x, error } : x)));
    },
  });

  const canSend = !!text.trim() || files.length > 0;
  const submit = () => {
    if (!canSend) return;
    const p: Pending = { key: `${Date.now()}`, text: text.trim(), files };
    setPending((list) => [...list, p]);
    setText('');
    setFiles([]);
    send.mutate(p);
  };

  const attach = async () => {
    const f = await pickDocument();
    if (f) setFiles((list) => [...list, f].slice(0, MAX_FILES));
  };

  const rows = useMemo<Row[]>(
    () =>
      [
        ...(messages.data?.items ?? []).map<Row>((m) => ({ kind: 'sent', m })),
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
            {name}
          </Text>
          <Text variant="caption" color="mutedForeground">
            Your client
          </Text>
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
              description="Talk through a listing, an offer or a viewing."
            />
          }
          renderItem={({ item }) => {
            const mine = item.kind === 'pending' || item.m.senderType === 'realtor';
            const body = item.kind === 'sent' ? item.m.text : item.text;
            const attachments =
              item.kind === 'sent'
                ? (item.m.attachments ?? []).map((a) => ({ key: a.id, name: a.name, url: a.url }))
                : item.files.map((f, i) => ({ key: `${i}`, name: f.name, url: undefined }));
            const failed = item.kind === 'pending' && !!item.error;
            return (
              <View
                style={{ maxWidth: '82%', alignSelf: mine ? 'flex-end' : 'flex-start', gap: 4 }}
                accessible={!attachments.some((a) => a.url)}
                accessibilityLabel={`${mine ? 'You' : name}, ${body || `${attachments.length} attachment${attachments.length === 1 ? '' : 's'}`}, ${
                  item.kind === 'sent'
                    ? relativeTime(item.m.createdAt)
                    : failed
                      ? `not sent. ${item.error}`
                      : 'sending'
                }`}
              >
                {body ? (
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
                ) : null}
                {attachments.map((a) => (
                  <Pressable
                    key={a.key}
                    disabled={!a.url}
                    onPress={() => a.url && Linking.openURL(a.url)}
                    accessibilityRole={a.url ? 'link' : undefined}
                    accessibilityLabel={`Attachment ${a.name}${a.url ? ', open' : ''}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                      alignSelf: mine ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <Paperclip size={14} color={colors.primary} />
                    <Text variant="caption" numberOfLines={1} style={{ maxWidth: 200 }}>
                      {a.name}
                    </Text>
                  </Pressable>
                ))}
                {item.kind === 'sent' ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      alignSelf: mine ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {item.m.contactMasked ? (
                      <ShieldCheck size={12} color={colors.mutedForeground} />
                    ) : null}
                    <Text variant="caption" color="mutedForeground">
                      {item.m.contactMasked ? 'Contact details hidden · ' : ''}
                      {relativeTime(item.m.createdAt)}
                    </Text>
                  </View>
                ) : failed ? (
                  <View
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      alignSelf: 'flex-end',
                    }}
                  >
                    <AlertCircle size={13} color={colors.destructive} />
                    <Text variant="caption" style={{ color: colors.destructive }}>
                      {item.error}
                    </Text>
                    <Pressable
                      onPress={() => {
                        const retry = { ...item, error: undefined };
                        setPending((list) => list.map((x) => (x.key === item.key ? retry : x)));
                        send.mutate(retry);
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
                  <Text variant="caption" color="mutedForeground" style={{ alignSelf: 'flex-end' }}>
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
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.sm,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
          gap: spacing.sm,
        }}
      >
        {files.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {files.map((f, i) => (
              <Pressable
                key={`${f.uri}-${i}`}
                onPress={() => setFiles((list) => list.filter((_, j) => j !== i))}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${f.name}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: radius.full,
                  backgroundColor: colors.secondary,
                }}
              >
                <Text variant="caption" numberOfLines={1} style={{ maxWidth: 160 }}>
                  {f.name}
                </Text>
                <X size={12} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs }}>
          <IconButton
            onPress={attach}
            disabled={files.length >= MAX_FILES}
            accessibilityLabel="Attach a file"
            icon={<Paperclip size={18} color={colors.mutedForeground} />}
            style={{ marginBottom: 5, borderWidth: 0, backgroundColor: 'transparent' }}
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
      </View>
    </KeyboardAvoidingView>
  );
}
