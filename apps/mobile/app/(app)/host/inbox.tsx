import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import {
  Avatar,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  TextField,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { hostShortletsApi, type HostConversation } from '@/lib/api/hostShortlets';
import { relativeTime } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

/** Guests' messages, unread first. */
export default function HostInbox() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: qk.host.conversations,
    queryFn: () => hostShortletsApi.conversations(),
    refetchInterval: 30_000,
  });
  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (query.data?.items ?? [])
      .filter(
        (c) =>
          !q ||
          c.participantName.toLowerCase().includes(q) ||
          c.propertyName.toLowerCase().includes(q)
      )
      .sort(
        (a, b) =>
          Number(b.unreadCount > 0) - Number(a.unreadCount > 0) ||
          b.lastMessageAt.localeCompare(a.lastMessageAt)
      );
  }, [query.data, search]);

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
          gap: spacing.md,
        }}
      >
        <DetailHeader eyebrow="Hosting" title="Guest messages" onBack={() => router.back()} />
        {(query.data?.items.length ?? 0) > 4 ? (
          <TextField
            placeholder="Search guests or homes"
            accessibilityLabel="Search conversations"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        ) : null}
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
          renderItem={({ item }: { item: HostConversation }) => <Row c={item} />}
          ListEmptyComponent={
            <EmptyState
              icon={<MessageCircle size={34} color={colors.mutedForeground} />}
              title={search ? 'No matches' : 'No messages yet'}
              description={
                search
                  ? 'Try a guest or home name.'
                  : 'When guests ask about a stay, their messages land here.'
              }
            />
          }
        />
      )}
    </View>
  );
}

function Row({ c }: { c: HostConversation }) {
  const { colors, spacing } = useTheme();
  const unread = c.unreadCount > 0;
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/(app)/host/conversation/[id]', params: { id: c.id } })
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
            {c.participantName}
          </Text>
          <Text variant="caption" color={unread ? 'primary' : 'mutedForeground'}>
            {relativeTime(c.lastMessageAt)}
          </Text>
        </View>
        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          {c.propertyName}
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
