import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { shortletsApi, type ShortletConversation } from '@/lib/api/shortlets';
import { relativeTime } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

/** Conversations with hosts, unread first. */
export default function GuestMessages() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const query = useQuery({
    queryKey: qk.shortlets.conversations,
    queryFn: () => shortletsApi.conversations(),
    refetchInterval: 30_000,
  });
  const items = useMemo(
    () =>
      [...(query.data?.items ?? [])].sort(
        (a, b) =>
          Number(b.unreadCount > 0) - Number(a.unreadCount > 0) ||
          b.lastMessageAt.localeCompare(a.lastMessageAt)
      ),
    [query.data]
  );

  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      tintColor={colors.mutedForeground}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.md,
        }}
      >
        <DetailHeader eyebrow="Short stays" title="Messages" onBack={() => router.back()} />
      </View>
      {query.isError && !query.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={72} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(c) => c.id}
          refreshControl={refresh}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          renderItem={({ item }: { item: ShortletConversation }) => <Row c={item} />}
          ListEmptyComponent={
            <EmptyState
              icon={<MessageCircle size={34} color={colors.mutedForeground} />}
              title="No messages yet"
              description="Ask a host about a stay from its page. Your conversations land here."
              action={
                <Button
                  label="Browse stays"
                  fullWidth={false}
                  onPress={() => router.push('/(app)/shortlets')}
                />
              }
            />
          }
        />
      )}
    </View>
  );
}

function Row({ c }: { c: ShortletConversation }) {
  const { colors, spacing } = useTheme();
  const unread = c.unreadCount > 0;
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/(app)/shortlet-conversation/[id]', params: { id: c.id } })
      }
      accessibilityRole="button"
      accessibilityLabel={`${c.participantName}, ${c.propertyName}${unread ? `, ${c.unreadCount} unread` : ''}. ${c.lastMessage}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Avatar name={c.participantName} size={46} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant={unread ? 'bodyStrong' : 'body'} numberOfLines={1} style={{ flex: 1 }}>
            {c.propertyName}
          </Text>
          <Text variant="caption" color={unread ? 'primary' : 'mutedForeground'}>
            {relativeTime(c.lastMessageAt)}
          </Text>
        </View>
        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          Host · {c.participantName}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text
            variant="callout"
            numberOfLines={1}
            style={{
              flex: 1,
              color: unread ? colors.foreground : colors.mutedForeground,
              fontWeight: unread ? '600' : '400',
            }}
          >
            {c.lastMessage}
          </Text>
          {unread ? (
            <View
              style={{
                minWidth: 20,
                height: 20,
                paddingHorizontal: 6,
                borderRadius: 10,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                variant="caption"
                style={{ color: colors.primaryForeground, fontWeight: '800' }}
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
