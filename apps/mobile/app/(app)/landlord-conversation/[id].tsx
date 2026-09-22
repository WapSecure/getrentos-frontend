import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUp, ChevronLeft, MessageCircle } from 'lucide-react-native';
import { EmptyState, ErrorState, Skeleton, Text, useTheme, useToast } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { landlordApi, type LandlordMessage } from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { relativeTime } from '@/lib/format';

export default function LandlordConversation() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<LandlordMessage>>(null);

  const query = useQuery({
    queryKey: qk.landlord.conversationMessages(id),
    queryFn: () => landlordApi.conversationMessages(id),
    enabled: !!id,
  });

  // Opening the thread is reading it, so clear the unread count upstream.
  const markRead = useMutation({
    mutationFn: () => landlordApi.markConversationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.landlord.conversations }),
  });
  const { mutate: markReadNow } = markRead;
  useEffect(() => {
    if (id) markReadNow();
  }, [id, markReadNow]);

  const send = useMutation({
    mutationFn: (text: string) => landlordApi.sendMessage(id, text),
    onSuccess: () => {
      setDraft('');
      qc.invalidateQueries({ queryKey: qk.landlord.conversationMessages(id) });
      qc.invalidateQueries({ queryKey: qk.landlord.conversations });
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not send that message.', 'error'),
  });

  // Oldest first, so the newest sits beside the composer.
  const messages = [...(query.data?.items ?? [])].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const submit = () => {
    const text = draft.trim();
    if (text && !send.isPending) send.mutate(text);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
        >
          <ChevronLeft size={26} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="heading" numberOfLines={1}>
            {name ?? 'Conversation'}
          </Text>
        </View>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={46} width={i % 2 ? '60%' : '72%'} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.sm, flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => <Bubble message={item} />}
          ListEmptyComponent={
            <EmptyState
              icon={<MessageCircle size={30} color={colors.mutedForeground} />}
              title="No messages yet"
              description="Say hello — replies land here."
            />
          }
        />
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Write a message"
          placeholderTextColor={colors.mutedForeground}
          multiline
          accessibilityLabel="Message"
          style={{
            flex: 1,
            maxHeight: 120,
            minHeight: 42,
            paddingHorizontal: spacing.md,
            paddingVertical: 10,
            borderRadius: radius.lg,
            backgroundColor: colors.secondary,
            color: colors.foreground,
            fontSize: 15,
          }}
        />
        <Pressable
          onPress={submit}
          disabled={!draft.trim() || send.isPending}
          accessibilityRole="button"
          accessibilityLabel="Send"
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary,
            opacity: !draft.trim() || send.isPending ? 0.4 : 1,
          }}
        >
          <ArrowUp size={19} color={colors.primaryForeground} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message: m }: { message: LandlordMessage }) {
  const { colors, spacing, radius } = useTheme();
  const mine = m.senderId === 'landlord';
  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
      <View
        style={{
          maxWidth: '80%',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.lg,
          backgroundColor: mine ? colors.primary : colors.secondary,
        }}
      >
        <Text
          variant="callout"
          style={{ color: mine ? colors.primaryForeground : colors.foreground }}
        >
          {m.text}
        </Text>
      </View>
      <Text variant="caption" color="mutedForeground" style={{ marginTop: 3, fontSize: 10 }}>
        {relativeTime(m.timestamp)}
      </Text>
    </View>
  );
}
