import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Send } from 'lucide-react-native';
import {
  Badge,
  ErrorState,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  supportApi,
  SUPPORT_CATEGORIES,
  type SupportMessage,
  type SupportThread,
} from '@/lib/api/support';
import { ApiError } from '@/lib/api/client';
import { relativeTime } from '@/lib/format';

const POLL_MS = 8000;

export default function SupportThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const scrollRef = useRef<ScrollView>(null);
  const [text, setText] = useState('');

  const threadsQuery = useQuery({
    queryKey: qk.renter.supportThreads,
    queryFn: supportApi.listThreads,
  });
  const thread = threadsQuery.data?.find((t) => t.id === id);

  const messagesQuery = useQuery({
    queryKey: qk.renter.supportMessages(id),
    queryFn: () => supportApi.getMessages(id),
  });

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => messagesQuery.refetch(), POLL_MS);
      return () => clearInterval(interval);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])
  );

  useEffect(() => {
    if (messagesQuery.data?.length) {
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: false }));
    }
  }, [messagesQuery.data?.length]);

  const sendMutation = useMutation({
    mutationFn: () => supportApi.sendMessage(id, text.trim()),
    onSuccess: (message) => {
      qc.setQueryData<SupportMessage[]>(qk.renter.supportMessages(id), (old) =>
        old ? [...old, message] : [message]
      );
      qc.invalidateQueries({ queryKey: qk.renter.supportThreads });
      setText('');
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not send this message.', 'error'),
  });

  const resolveMutation = useMutation({
    mutationFn: () => supportApi.resolveThread(id),
    onSuccess: (updated) => {
      qc.setQueryData<SupportThread[]>(qk.renter.supportThreads, (old) =>
        old?.map((t) => (t.id === updated.id ? updated : t))
      );
      toast.show('Marked as resolved.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not resolve this thread.', 'error'),
  });

  const resolved = thread?.status === 'RESOLVED';

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
          <Text variant="bodyStrong" numberOfLines={1}>
            {SUPPORT_CATEGORIES.find((c) => c.value === thread?.category)?.label ?? 'Support'}
          </Text>
        </View>
        {thread ? (
          <Badge label={resolved ? 'Resolved' : 'Open'} tone={resolved ? 'success' : 'warning'} />
        ) : null}
        {!resolved && thread ? (
          <Pressable
            onPress={() => resolveMutation.mutate()}
            hitSlop={8}
            style={{ marginLeft: spacing.sm }}
          >
            <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
              Resolve
            </Text>
          </Pressable>
        ) : null}
      </View>

      {messagesQuery.isError ? (
        <ErrorState onRetry={() => messagesQuery.refetch()} />
      ) : !messagesQuery.data ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Skeleton height={40} width="60%" />
          <Skeleton height={40} width="75%" />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.sm }}
          keyboardShouldPersistTaps="handled"
        >
          {messagesQuery.data.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </ScrollView>
      )}

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
            placeholder={resolved ? 'Send a message to reopen this conversation' : 'Message'}
            value={text}
            onChangeText={setText}
            multiline
            containerStyle={{ maxHeight: 100 }}
          />
        </View>
        <Pressable
          onPress={() => sendMutation.mutate()}
          disabled={!text.trim() || sendMutation.isPending}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: text.trim() ? colors.primary : colors.secondary,
          }}
        >
          <Send size={17} color={text.trim() ? colors.primaryForeground : colors.mutedForeground} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message }: { message: SupportMessage }) {
  const { colors, radius } = useTheme();
  const mine = message.senderType === 'contact';
  return (
    <View
      style={{
        alignItems: mine ? 'flex-end' : 'flex-start',
        maxWidth: '82%',
        alignSelf: mine ? 'flex-end' : 'flex-start',
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
          {message.text}
        </Text>
      </View>
      <Text variant="caption" color="mutedForeground" style={{ marginTop: 3 }}>
        {relativeTime(message.createdAt)}
      </Text>
    </View>
  );
}
