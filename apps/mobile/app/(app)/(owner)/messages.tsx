import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, Pin, Search, X } from 'lucide-react-native';
import {
  Avatar,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  TextField,
  useTheme,
} from '@getrentos/ui-native';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { qk } from '@/lib/query/keys';
import { ownerApi, type OwnerConversation } from '@/lib/api/owner';
import { relativeTime } from '@/lib/format';

export default function OwnerMessages() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: qk.owner.conversations,
    queryFn: () => ownerApi.conversations(1, 50),
  });

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (query.data?.items ?? [])
      .filter((c) => !c.isArchived)
      .filter(
        (c) =>
          !q ||
          c.participantName.toLowerCase().includes(q) ||
          c.propertyName?.toLowerCase().includes(q) ||
          c.lastMessage?.toLowerCase().includes(q)
      )
      .sort((a, b) =>
        a.isPinned !== b.isPinned
          ? a.isPinned
            ? -1
            : 1
          : new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
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
          paddingHorizontal: spacing.xl,
          paddingTop: insets.top + spacing.lg,
          paddingBottom: spacing.sm,
          gap: spacing.md,
        }}
      >
        <DashboardHeader eyebrow="Inbox" title="Messages" subtitle="Buyers, realtors and agents" />
        {query.data?.items.length ? (
          <TextField
            placeholder="Search people, properties or messages"
            accessibilityLabel="Search conversations"
            leftIcon={<Search size={18} color={colors.mutedForeground} />}
            autoCapitalize="none"
            value={search}
            onChangeText={setSearch}
            rightAccessory={
              search ? (
                <Pressable
                  onPress={() => setSearch('')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  hitSlop={12}
                >
                  <X size={18} color={colors.mutedForeground} />
                </Pressable>
              ) : null
            }
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
            <Skeleton key={i} height={64} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(c) => c.id}
          keyboardDismissMode="on-drag"
          refreshControl={refresh}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing['3xl'] }}
          ListEmptyComponent={
            <EmptyState
              icon={<MessageCircle size={34} color={colors.mutedForeground} />}
              title={search ? 'No matches' : 'No conversations yet'}
              description={
                search
                  ? 'Try a name, a property or a word from the message.'
                  : 'Buyers who ask about your listings will appear here.'
              }
            />
          }
          renderItem={({ item }: { item: OwnerConversation }) => <Row c={item} />}
        />
      )}
    </View>
  );
}

function Row({ c }: { c: OwnerConversation }) {
  const { colors, spacing } = useTheme();
  const unread = c.unreadCount > 0;
  return (
    <Pressable
      onPress={() => router.push(`/(app)/owner-conversation/${c.id}`)}
      accessibilityRole="button"
      accessibilityLabel={[
        c.participantName,
        c.propertyName,
        unread ? `${c.unreadCount} unread` : null,
        c.isPinned ? 'pinned' : null,
        c.lastMessage || 'No messages yet',
        relativeTime(c.lastMessageTime),
      ]
        .filter(Boolean)
        .join(', ')}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        backgroundColor: pressed ? colors.secondary : 'transparent',
      })}
    >
      <Avatar name={c.participantName} size={48} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text
            variant="bodyStrong"
            numberOfLines={1}
            style={{ flex: 1, fontWeight: unread ? '800' : '600' }}
          >
            {c.participantName}
          </Text>
          {c.isPinned ? <Pin size={12} color={colors.primary} fill={colors.primary} /> : null}
          <Text variant="caption" color={unread ? 'primary' : 'mutedForeground'}>
            {relativeTime(c.lastMessageTime)}
          </Text>
        </View>
        {c.propertyName ? (
          <Text variant="caption" color="mutedForeground" numberOfLines={1}>
            {c.propertyName}
          </Text>
        ) : null}
        <Text
          variant="callout"
          color={unread ? 'foreground' : 'mutedForeground'}
          numberOfLines={1}
          style={{ fontWeight: unread ? '600' : '400' }}
        >
          {c.lastMessage || 'No messages yet'}
        </Text>
      </View>
    </Pressable>
  );
}
