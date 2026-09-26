import { Pressable, RefreshControl, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Archive, MessageCircle, MessageSquareText, Pin } from 'lucide-react-native';
import {
  Avatar,
  EmptyState,
  ErrorState,
  IconButton,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { messagesApi, type Conversation } from '@/lib/api/messages';
import type { Paginated } from '@/lib/api/properties';
import { relativeTime } from '@/lib/format';
import { ApiError } from '@/lib/api/client';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default function Messages() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: qk.renter.conversations,
    queryFn: () => messagesApi.list(1, 30),
  });

  const [showArchived, setShowArchived] = useState(false);

  const pinMutation = useMutation({
    mutationFn: (conversationId: string) => messagesApi.togglePin(conversationId),
    onMutate: async (conversationId) => {
      await qc.cancelQueries({ queryKey: qk.renter.conversations });
      const previous = qc.getQueryData<Paginated<Conversation>>(qk.renter.conversations);
      qc.setQueryData<Paginated<Conversation>>(qk.renter.conversations, (old) =>
        old
          ? {
              ...old,
              items: old.items.map((c) =>
                c.id === conversationId ? { ...c, isPinned: !c.isPinned } : c
              ),
            }
          : old
      );
      return { previous };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.renter.conversations, ctx.previous);
      toast.show(
        err instanceof ApiError ? err.message : 'Could not update that conversation.',
        'error'
      );
    },
    onSuccess: (updated) => {
      qc.setQueryData<Paginated<Conversation>>(qk.renter.conversations, (old) =>
        old ? { ...old, items: old.items.map((c) => (c.id === updated.id ? updated : c)) } : old
      );
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (conversationId: string) => messagesApi.toggleArchive(conversationId),
    onMutate: async (conversationId) => {
      await qc.cancelQueries({ queryKey: qk.renter.conversations });
      const previous = qc.getQueryData<Paginated<Conversation>>(qk.renter.conversations);
      qc.setQueryData<Paginated<Conversation>>(qk.renter.conversations, (old) =>
        old
          ? {
              ...old,
              items: old.items.map((c) =>
                c.id === conversationId ? { ...c, isArchived: !c.isArchived } : c
              ),
            }
          : old
      );
      return { previous };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.renter.conversations, ctx.previous);
      toast.show(
        err instanceof ApiError ? err.message : 'Could not update that conversation.',
        'error'
      );
    },
    onSuccess: (updated) => {
      qc.setQueryData<Paginated<Conversation>>(qk.renter.conversations, (old) =>
        old ? { ...old, items: old.items.map((c) => (c.id === updated.id ? updated : c)) } : old
      );
    },
  });

  // Refresh whenever the tab regains focus so read/unread state stays current.
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: qk.renter.conversations });
    }, [qc])
  );

  const all = query.data?.items ?? [];
  const archivedCount = all.filter((c) => c.isArchived).length;
  const items = all
    .filter((c) => c.isArchived === showArchived)
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

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
          eyebrow="Renter workspace"
          title="Messages"
          subtitle="Keep every property conversation together"
          accessory={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              {archivedCount > 0 || showArchived ? (
                <IconButton
                  onPress={() => setShowArchived((v) => !v)}
                  accessibilityLabel={showArchived ? 'Show inbox' : 'Show archived'}
                  selected={showArchived}
                  badge={archivedCount}
                  icon={
                    <Archive size={20} color={showArchived ? colors.primary : colors.foreground} />
                  }
                />
              ) : null}
              <IconButton
                onPress={() => router.push('/(app)/message-tools')}
                accessibilityLabel="Message tools"
                icon={<MessageSquareText size={20} color={colors.foreground} />}
              />
            </View>
          }
        />
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
      ) : items.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={34} color={colors.mutedForeground} />}
          title={showArchived ? 'Nothing archived' : 'No conversations yet'}
          description={
            showArchived
              ? 'Conversations you archive are kept here.'
              : 'Message a landlord from any listing to start a conversation.'
          }
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: Conversation }) => (
            <ConversationRow
              conversation={item}
              onPress={() => router.push(`/(app)/conversation/${item.id}`)}
              onTogglePin={() => pinMutation.mutate(item.id)}
              onToggleArchive={() => archiveMutation.mutate(item.id)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] }}
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
  onTogglePin,
  onToggleArchive,
}: {
  conversation: Conversation;
  onPress: () => void;
  onTogglePin: () => void;
  onToggleArchive: () => void;
}) {
  const { colors, spacing } = useTheme();
  const unread = c.unreadCount > 0;
  return (
    <Pressable
      onPress={onPress}
      // Long-press is the row's secondary action; archiving is rare enough
      // that it does not warrant permanent chrome on every row.
      onLongPress={onToggleArchive}
      accessibilityHint={c.isArchived ? 'Long press to unarchive' : 'Long press to archive'}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: spacing.md,
        paddingVertical: spacing.md,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Avatar name={c.participantName} size={48} />
      <View style={{ flex: 1, gap: 2 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 }}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
              {c.participantName}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text variant="caption" color="mutedForeground">
              {relativeTime(c.lastMessageTime)}
            </Text>
            <Pressable
              onPress={onTogglePin}
              accessibilityRole="button"
              accessibilityLabel={c.isPinned ? 'Unpin conversation' : 'Pin conversation'}
              hitSlop={10}
            >
              <Pin
                size={14}
                color={c.isPinned ? colors.primary : colors.mutedForeground}
                fill={c.isPinned ? colors.primary : 'transparent'}
              />
            </Pressable>
          </View>
        </View>
        {c.propertyName ? (
          <Text variant="caption" color="mutedForeground" numberOfLines={1}>
            {c.propertyName}
          </Text>
        ) : null}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.sm,
          }}
        >
          <Text
            variant="callout"
            color={unread ? 'foreground' : 'mutedForeground'}
            numberOfLines={1}
            style={{ flex: 1, fontWeight: unread ? '600' : '400' }}
          >
            {c.lastMessage || 'No messages yet'}
          </Text>
          {unread ? (
            <View
              style={{
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                paddingHorizontal: 6,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                variant="caption"
                style={{ color: colors.primaryForeground, fontWeight: '700', fontSize: 11 }}
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
