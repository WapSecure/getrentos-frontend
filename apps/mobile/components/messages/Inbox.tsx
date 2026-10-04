import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
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
import { relativeTime } from '@/lib/format';

/** What an inbox row needs, whichever portal's API it came from. */
export interface InboxConversation {
  id: string;
  participantName: string;
  /** What the thread is about or who they are: a property name, or a role. */
  context?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isPinned?: boolean;
  isArchived?: boolean;
}

/**
 * A portal's Messages tab: search, pinned threads first, then newest. Every
 * portal uses this one so the inbox looks and behaves the same everywhere.
 */
export function Inbox({
  subtitle,
  conversations,
  loading,
  error,
  refreshing,
  onRefresh,
  onOpen,
  emptyDescription,
}: {
  subtitle: string;
  conversations: InboxConversation[] | undefined;
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onOpen: (c: InboxConversation) => void;
  emptyDescription: string;
}) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    const time = (c: InboxConversation) =>
      c.lastMessageTime ? new Date(c.lastMessageTime).getTime() : 0;
    return (conversations ?? [])
      .filter((c) => !c.isArchived)
      .filter(
        (c) =>
          !q ||
          c.participantName.toLowerCase().includes(q) ||
          c.context?.toLowerCase().includes(q) ||
          c.lastMessage?.toLowerCase().includes(q)
      )
      .sort((a, b) => (!!a.isPinned !== !!b.isPinned ? (a.isPinned ? -1 : 1) : time(b) - time(a)));
  }, [conversations, search]);

  const refresh = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
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
        <DashboardHeader eyebrow="Inbox" title="Messages" subtitle={subtitle} />
        {conversations?.length ? (
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

      {error && !conversations ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={onRefresh} />
        </ScrollView>
      ) : loading ? (
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
                search ? 'Try a name, a property or a word from the message.' : emptyDescription
              }
            />
          }
          renderItem={({ item }: { item: InboxConversation }) => (
            <Row c={item} onPress={() => onOpen(item)} />
          )}
        />
      )}
    </View>
  );
}

function Row({ c, onPress }: { c: InboxConversation; onPress: () => void }) {
  const { colors, spacing } = useTheme();
  const unread = c.unreadCount > 0;
  const when = c.lastMessageTime ? relativeTime(c.lastMessageTime) : '';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[
        c.participantName,
        c.context,
        unread ? `${c.unreadCount} unread` : null,
        c.isPinned ? 'pinned' : null,
        c.lastMessage || 'No messages yet',
        when,
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
            {when}
          </Text>
        </View>
        {c.context ? (
          <Text variant="caption" color="mutedForeground" numberOfLines={1}>
            {c.context}
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
                paddingHorizontal: 6,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
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
