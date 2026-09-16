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
import { ChevronLeft, FileText, Paperclip, Send, X } from 'lucide-react-native';
import { Avatar, ErrorState, Skeleton, Text, TextField, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { agentMessagesApi, type AgentMessage } from '@/lib/api/agentMessages';
import { pickDocument } from '@/lib/filePicker';
import type { PickedFile } from '@/lib/api/documents';
import { relativeTime } from '@/lib/format';
import { useAuth } from '@/lib/auth/AuthProvider';

const POLL_MS = 8000;

export default function AgentConversationThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);

  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<PickedFile | null>(null);

  const conversationsQuery = useQuery({
    queryKey: qk.agent.conversations,
    queryFn: () => agentMessagesApi.list(1, 30),
  });
  const conversation = conversationsQuery.data?.items.find((c) => c.id === id);

  const messagesQuery = useQuery({
    queryKey: qk.agent.messages(id),
    queryFn: () => agentMessagesApi.messages(id),
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
    mutationFn: () => agentMessagesApi.send(id, text.trim(), attachment ?? undefined),
    onSuccess: (message) => {
      qc.setQueryData<AgentMessage[]>(qk.agent.messages(id), (old) =>
        old ? [...old, message] : [message]
      );
      qc.invalidateQueries({ queryKey: qk.agent.conversations });
      setText('');
      setAttachment(null);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    },
  });

  const canSend = (text.trim().length > 0 || !!attachment) && !sendMutation.isPending;

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
        <Avatar name={conversation?.client.legalName} size={34} />
        <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
          {conversation?.client.legalName ?? 'Conversation'}
        </Text>
      </View>

      {messagesQuery.isError && !messagesQuery.data ? (
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
            <MessageBubble key={m.id} message={m} mine={m.senderId === profile?.id} />
          ))}
        </ScrollView>
      )}

      {attachment ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginHorizontal: spacing.xl,
            marginBottom: spacing.sm,
            padding: spacing.sm,
            borderRadius: radius.md,
            backgroundColor: colors.secondary,
          }}
        >
          <FileText size={15} color={colors.mutedForeground} />
          <Text variant="caption" numberOfLines={1} style={{ flex: 1 }}>
            {attachment.name}
          </Text>
          <Pressable onPress={() => setAttachment(null)} hitSlop={8}>
            <X size={15} color={colors.mutedForeground} />
          </Pressable>
        </View>
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
        <Pressable
          onPress={async () => {
            const file = await pickDocument();
            if (file) setAttachment(file);
          }}
          hitSlop={8}
          style={{ paddingBottom: 10 }}
        >
          <Paperclip size={20} color={colors.mutedForeground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <TextField
            placeholder="Message"
            value={text}
            onChangeText={setText}
            multiline
            containerStyle={{ maxHeight: 100 }}
          />
        </View>
        <Pressable
          onPress={() => sendMutation.mutate()}
          disabled={!canSend}
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

function MessageBubble({ message, mine }: { message: AgentMessage; mine: boolean }) {
  const { colors, radius } = useTheme();
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
        {message.text ? (
          <Text
            variant="callout"
            style={{ color: mine ? colors.primaryForeground : colors.foreground }}
          >
            {message.text}
          </Text>
        ) : null}
        {message.attachments?.map((a) => (
          <View
            key={a.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: message.text ? 6 : 0,
            }}
          >
            <FileText size={13} color={mine ? colors.primaryForeground : colors.mutedForeground} />
            <Text
              variant="caption"
              numberOfLines={1}
              style={{ color: mine ? colors.primaryForeground : colors.mutedForeground }}
            >
              {a.name}
            </Text>
          </View>
        ))}
      </View>
      <Text variant="caption" color="mutedForeground" style={{ marginTop: 3 }}>
        {relativeTime(message.createdAt)}
      </Text>
    </View>
  );
}
