import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import {
  Archive,
  ArchiveRestore,
  MessageCircle,
  MessageSquareText,
  Pin,
  PinOff,
  Search,
  X,
} from 'lucide-react-native';
import {
  Avatar,
  EmptyState,
  ErrorState,
  IconButton,
  Skeleton,
  Text,
  TextField,
  useReducedMotion,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { messagesApi, type Conversation } from '@/lib/api/messages';
import { relativeTime } from '@/lib/format';
import { ApiError } from '@/lib/api/client';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import {
  patchConversation,
  updateInboxConversation,
  type ConversationPages,
} from '@/lib/conversationCache';

const PAGE_SIZE = 20;

export default function Messages() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState('');

  const query = useInfiniteQuery({
    queryKey: qk.renter.conversations,
    queryFn: ({ pageParam }) => messagesApi.list(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });

  const pinMutation = useConversationToggle(messagesApi.togglePin, (c) => ({
    ...c,
    isPinned: !c.isPinned,
  }));
  const archiveMutation = useConversationToggle(messagesApi.toggleArchive, (c) => ({
    ...c,
    isArchived: !c.isArchived,
  }));

  // Refresh on return to the tab so read state stays current — skipping the
  // first focus, which the initial fetch already covers.
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current)
        qc.invalidateQueries({ queryKey: qk.renter.conversations, exact: true });
      focusedOnce.current = true;
    }, [qc])
  );

  const all = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const archivedCount = useMemo(() => all.filter((c) => c.isArchived).length, [all]);
  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all
      .filter((c) => c.isArchived === showArchived)
      .filter(
        (c) =>
          !q ||
          c.participantName.toLowerCase().includes(q) ||
          c.propertyName?.toLowerCase().includes(q) ||
          c.lastMessage?.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
  }, [all, showArchived, search]);

  const pin = pinMutation.mutate;
  const archive = archiveMutation.mutate;
  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConversationRow
        conversation={item}
        onPress={() => router.push(`/(app)/conversation/${item.id}`)}
        onTogglePin={() => pin(item.id)}
        onToggleArchive={() => archive(item.id)}
      />
    ),
    [pin, archive]
  );

  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching && !query.isFetchingNextPage}
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
        <DashboardHeader
          eyebrow={showArchived ? 'Archived' : 'Inbox'}
          title="Messages"
          accessory={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              {archivedCount > 0 || showArchived ? (
                <IconButton
                  onPress={() => setShowArchived((v) => !v)}
                  accessibilityLabel={
                    showArchived ? 'Back to inbox' : `Show archived, ${archivedCount} conversations`
                  }
                  selected={showArchived}
                  icon={
                    <Archive size={20} color={showArchived ? colors.primary : colors.foreground} />
                  }
                />
              ) : null}
              <IconButton
                onPress={() => router.push('/(app)/message-tools')}
                accessibilityLabel="Templates, quick replies and reminders"
                icon={<MessageSquareText size={20} color={colors.foreground} />}
              />
            </View>
          }
        />
        {all.length > 0 ? (
          <TextField
            placeholder="Search people, properties or messages"
            accessibilityLabel="Search conversations"
            leftIcon={<Search size={18} color={colors.mutedForeground} />}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
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

      {query.isError && all.length === 0 ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
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
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          extraData={items}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              icon={<MessageCircle size={34} color={colors.mutedForeground} />}
              title={
                search ? 'No matches' : showArchived ? 'Nothing archived' : 'No conversations yet'
              }
              description={
                search
                  ? 'Try a name, a property or a word from the message.'
                  : showArchived
                    ? 'Conversations you archive are kept here.'
                    : 'Message a landlord from any listing to start a conversation.'
              }
            />
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View style={{ paddingVertical: spacing.lg }}>
                <ActivityIndicator
                  color={colors.mutedForeground}
                  accessibilityLabel="Loading more conversations"
                />
              </View>
            ) : (
              <View style={{ height: spacing['3xl'] }} />
            )
          }
          refreshControl={refresh}
        />
      )}
    </View>
  );
}

/** Optimistic pin/archive toggle with rollback. */
function useConversationToggle(
  call: (id: string) => Promise<Conversation>,
  flip: (c: Conversation) => Conversation
) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: call,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: qk.renter.conversations, exact: true });
      const previous = qc.getQueryData<ConversationPages>(qk.renter.conversations);
      updateInboxConversation(qc, id, flip);
      return { previous };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.renter.conversations, ctx.previous);
      toast.show(
        err instanceof ApiError ? err.message : 'Could not update that conversation.',
        'error'
      );
    },
    onSuccess: (updated) => patchConversation(qc, updated),
  });
}

/* ------------------------------- row ------------------------------- */

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
  const reduceMotion = useReducedMotion();
  const swipe = useRef<SwipeableMethods>(null);
  const unread = c.unreadCount > 0;

  const act = (fn: () => void) => () => {
    swipe.current?.close();
    fn();
  };

  const spoken = [
    c.participantName,
    c.propertyName,
    unread ? `${c.unreadCount} unread` : null,
    c.isPinned ? 'pinned' : null,
    c.lastMessage || 'No messages yet',
    relativeTime(c.lastMessageTime),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <ReanimatedSwipeable
      ref={swipe}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      animationOptions={reduceMotion ? { duration: 0 } : undefined}
      renderRightActions={() => (
        <View style={{ flexDirection: 'row' }}>
          <SwipeAction
            label={c.isPinned ? 'Unpin' : 'Pin'}
            color={colors.primary}
            icon={c.isPinned ? PinOff : Pin}
            onPress={act(onTogglePin)}
          />
          <SwipeAction
            label={c.isArchived ? 'Unarchive' : 'Archive'}
            color={colors.mutedForeground}
            icon={c.isArchived ? ArchiveRestore : Archive}
            onPress={act(onToggleArchive)}
          />
        </View>
      )}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={spoken}
        accessibilityHint="Opens the conversation. Pin and archive are in the actions menu."
        // Screen readers can't swipe a row open, so its actions are offered here too.
        accessibilityActions={[
          { name: 'pin', label: c.isPinned ? 'Unpin' : 'Pin' },
          { name: 'archive', label: c.isArchived ? 'Unarchive' : 'Archive' },
        ]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'pin') onTogglePin();
          if (e.nativeEvent.actionName === 'archive') onToggleArchive();
        }}
        style={({ pressed }) => ({
          flexDirection: 'row',
          gap: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          backgroundColor: pressed ? colors.secondary : colors.background,
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
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
                  maxFontSizeMultiplier={1.4}
                  style={{ color: colors.primaryForeground, fontWeight: '700', fontSize: 11 }}
                >
                  {c.unreadCount > 99 ? '99+' : c.unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

function SwipeAction({
  label,
  color,
  icon: Icon,
  onPress,
}: {
  label: string;
  color: string;
  icon: typeof Pin;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: 84,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <Icon size={20} color={colors.primaryForeground} />
      <Text variant="caption" style={{ color: colors.primaryForeground, fontWeight: '700' }}>
        {label}
      </Text>
    </Pressable>
  );
}
