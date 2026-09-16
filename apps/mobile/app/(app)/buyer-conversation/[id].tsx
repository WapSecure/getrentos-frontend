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
import { ChevronLeft, Pin, Send } from 'lucide-react-native';
import { Avatar, ErrorState, Skeleton, Text, TextField, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { buyerMessagesApi, type BuyerMessage } from '@/lib/api/buyerMessages';
import { relativeTime } from '@/lib/format';
import { useAuth } from '@/lib/auth/AuthProvider';

const POLL_MS = 8000;

export default function BuyerConversationThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);

  const [text, setText] = useState('');

  const conversationsQuery = useQuery({
    queryKey: qk.buyer.conversations,
    queryFn: () => buyerMessagesApi.list(1, 30),
  });
  const conversation = conversationsQuery.data?.items.find((c) => c.id === id);

  const messagesQuery = useQuery({
    queryKey: qk.buyer.messages(id),
    queryFn: () => buyerMessagesApi.messages(id),
  });

  useFocusEffect(
    useCallback(() => {
      buyerMessagesApi
        .markRead(id)
        .then(() => qc.invalidateQueries({ queryKey: qk.buyer.conversations }));
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
    mutationFn: () => buyerMessagesApi.send(id, text.trim()),
    onSuccess: (message) => {
      qc.setQueryData<BuyerMessage[]>(qk.buyer.messages(id), (old) =>
        old ? [...old, message] : [message]
      );
      qc.invalidateQueries({ queryKey: qk.buyer.conversations });
      setText('');
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    },
  });

  const pinMutation = useMutation({
    mutationFn: () => buyerMessagesApi.togglePinned(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.buyer.conversations }),
  });

  const canSend = text.trim().length > 0 && !sendMutation.isPending;

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
        <Avatar name={conversation?.participantName} size={34} />
        <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
          {conversation?.participantName ?? 'Conversation'}
        </Text>
        <Pressable onPress={() => pinMutation.mutate()} hitSlop={10}>
          <Pin
            size={19}
            color={conversation?.isPinned ? colors.primary : colors.mutedForeground}
            fill={conversation?.isPinned ? colors.primary : 'transparent'}
          />
        </Pressable>
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

function MessageBubble({ message, mine }: { message: BuyerMessage; mine: boolean }) {
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
        <Text
          variant="callout"
          style={{ color: mine ? colors.primaryForeground : colors.foreground }}
        >
          {message.text}
        </Text>
      </View>
      <Text variant="caption" color="mutedForeground" style={{ marginTop: 3 }}>
        {relativeTime(message.timestamp)}
      </Text>
    </View>
  );
}
