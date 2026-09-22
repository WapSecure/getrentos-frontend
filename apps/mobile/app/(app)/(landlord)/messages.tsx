import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import {
  Avatar,
  Badge,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { landlordApi, type LandlordConversation } from '@/lib/api/landlord';
import { relativeTime } from '@/lib/format';

export default function LandlordMessages() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const query = useQuery({
    queryKey: qk.landlord.conversations,
    queryFn: () => landlordApi.conversations(),
  });

  const items = [...(query.data?.items ?? [])].sort(
    (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Text variant="title">Messages</Text>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
              <Skeleton height={48} width={48} radius={24} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton height={14} width="50%" />
                <Skeleton height={12} width="80%" />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(c) => c.id}
          renderItem={({ item }: { item: LandlordConversation }) => <ConversationRow c={item} />}
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
          ListEmptyComponent={
            <EmptyState
              icon={<MessageCircle size={32} color={colors.mutedForeground} />}
              title="No conversations yet"
              description="Messages from tenants, applicants and agents land here."
            />
          }
        />
      )}
    </View>
  );
}

function ConversationRow({ c }: { c: LandlordConversation }) {
  const { colors, spacing } = useTheme();
  const unread = c.unreadCount > 0;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/(app)/landlord-conversation/[id]',
          params: { id: c.id, name: c.participantName },
        })
      }
      accessibilityRole="button"
      accessibilityLabel={`Open conversation with ${c.participantName}`}
      style={{ flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md }}
    >
      <Avatar name={c.participantName} size={48} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
            {c.participantName}
          </Text>
          <Badge label={c.participantRole} tone="neutral" />
          <View style={{ flex: 1 }} />
          <Text variant="caption" color="mutedForeground">
            {relativeTime(c.lastMessageTime)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text
            variant="callout"
            color={unread ? 'foreground' : 'mutedForeground'}
            numberOfLines={1}
            style={{ flex: 1, fontWeight: unread ? '600' : '400' }}
          >
            {c.lastMessage}
          </Text>
          {unread ? (
            <View
              style={{
                minWidth: 18,
                height: 18,
                paddingHorizontal: 5,
                borderRadius: 9,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
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
        </View>
      </View>
    </Pressable>
  );
}
