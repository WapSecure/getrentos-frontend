import { Pressable, RefreshControl, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import { Avatar, EmptyState, ErrorState, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { agentMessagesApi, type AgentConversation } from '@/lib/api/agentMessages';
import { relativeTime } from '@/lib/format';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default function AgentMessages() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: qk.agent.conversations,
    queryFn: () => agentMessagesApi.list(1, 30),
  });

  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: qk.agent.conversations });
    }, [qc])
  );

  const items = query.data?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: insets.top + spacing.lg,
          paddingBottom: spacing.sm,
        }}
      >
        <DashboardHeader
          eyebrow="Field operations"
          title="Messages"
          subtitle="Stay aligned with clients and property teams"
        />
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
          description="Message a client from a task or their property to start a conversation."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: AgentConversation }) => (
            <ConversationRow
              conversation={item}
              onPress={() => router.push(`/(app)/agent-conversation/${item.id}`)}
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
  conversation: AgentConversation;
  onPress: () => void;
}) {
  const { spacing } = useTheme();
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
      <Avatar name={c.client.legalName} size={48} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {c.client.legalName}
        </Text>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text variant="callout" color="mutedForeground" numberOfLines={1} style={{ flex: 1 }}>
            {c.lastMessage || 'No messages yet'}
          </Text>
          {c.lastMessageAt ? (
            <Text variant="caption" color="mutedForeground">
              {relativeTime(c.lastMessageAt)}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
