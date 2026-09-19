import { Pressable, RefreshControl, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, Pin } from 'lucide-react-native';
import { Avatar, EmptyState, ErrorState, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { buyerMessagesApi, type BuyerConversation } from '@/lib/api/buyerMessages';
import { relativeTime } from '@/lib/format';

export default function BuyerMessages() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: qk.buyer.conversations,
    queryFn: () => buyerMessagesApi.list(1, 30),
  });

  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: qk.buyer.conversations });
    }, [qc])
  );

  const items = [...(query.data?.items ?? [])].sort(
    (a, b) => Number(b.isPinned) - Number(a.isPinned)
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: insets.top + spacing.lg,
          paddingBottom: spacing.sm,
        }}
      >
        <Text variant="title">Messages</Text>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
              <Skeleton height={48} width={48} radius={24} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton height={14} width="50%" />
                <Skeleton height={12} width="80%" />
              </View>
            </View>
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={34} color={colors.mutedForeground} />}
          title="No conversations yet"
          description="Message a seller or agent from a listing to start a conversation."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: BuyerConversation }) => (
            <ConversationRow
              conversation={item}
              onPress={() => router.push(`/(app)/buyer-conversation/${item.id}`)}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}
    </View>
  );
}

function ConversationRow({
  conversation: c,
  onPress,
}: {
  conversation: BuyerConversation;
  onPress: () => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: spacing.md,
        paddingVertical: spacing.md,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Avatar name={c.participantName} size={48} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {c.participantName}
          </Text>
          {c.isPinned ? <Pin size={12} color={colors.mutedForeground} /> : null}
        </View>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text variant="callout" color="mutedForeground" numberOfLines={1} style={{ flex: 1 }}>
            {c.lastMessage || 'No messages yet'}
          </Text>
          {c.lastMessageTime ? (
            <Text variant="caption" color="mutedForeground">
              {relativeTime(c.lastMessageTime)}
            </Text>
          ) : null}
        </View>
      </View>
      {c.unreadCount > 0 ? (
        <View
          style={{
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            paddingHorizontal: 5,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary,
            alignSelf: 'center',
          }}
        >
          <Text
            variant="caption"
            style={{ color: colors.primaryForeground, fontSize: 10, fontWeight: '700' }}
          >
            {c.unreadCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
