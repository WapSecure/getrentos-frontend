import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, CheckCheck, type LucideIcon } from 'lucide-react-native';
import { Card, EmptyState, ErrorState, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { relativeTime } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

/** What a notification row needs, whichever portal's API it came from. */
export interface InboxNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

/**
 * A portal's notification inbox: unread first to the eye (dot and tinted
 * icon), "Mark all read", and a tap that marks one read and opens what it is
 * about. Each portal supplies its data, its icons and where a tap goes.
 */
export function NotificationsInbox({
  eyebrow,
  items,
  loading,
  error,
  refreshing,
  onRefresh,
  onOpen,
  onReadAll,
  readingAll,
  iconFor,
  emptyDescription,
}: {
  eyebrow: string;
  items: InboxNotification[];
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  /** Mark it read if needed, then go where it points. */
  onOpen: (n: InboxNotification) => void;
  onReadAll: () => void;
  readingAll: boolean;
  iconFor: (type: string) => LucideIcon;
  emptyDescription: string;
}) {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const unread = items.filter((n) => !n.read).length;
  const refresh = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.mutedForeground}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow={eyebrow}
        title="Notifications"
        subtitle={
          unread > 0 ? `${unread} unread update${unread === 1 ? '' : 's'}` : 'You are all caught up'
        }
        onBack={() => router.back()}
        accessory={
          unread > 0 ? (
            <Pressable
              onPress={onReadAll}
              disabled={readingAll}
              accessibilityRole="button"
              accessibilityLabel="Mark all read"
              hitSlop={10}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
            >
              <CheckCheck size={16} color={colors.primary} />
              <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
                Mark all read
              </Text>
            </Pressable>
          ) : null
        }
      />

      {error && items.length === 0 ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={onRefresh} />
        </ScrollView>
      ) : loading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={86} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(n) => n.id}
          renderItem={({ item }: { item: InboxNotification }) => {
            const Icon = iconFor(item.type);
            return (
              <Pressable
                onPress={() => onOpen(item)}
                accessibilityRole="button"
                accessibilityLabel={`${item.read ? '' : 'Unread. '}${item.title}. ${item.body}`}
                style={{ marginBottom: spacing.sm }}
              >
                <Card padding={spacing.lg}>
                  <View style={{ flexDirection: 'row', gap: spacing.md }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: item.read ? colors.secondary : colors.accent,
                      }}
                    >
                      <Icon size={17} color={item.read ? colors.mutedForeground : colors.primary} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <Text variant="bodyStrong" style={{ flex: 1 }}>
                          {item.title}
                        </Text>
                        {item.read ? null : (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: colors.primary,
                            }}
                          />
                        )}
                      </View>
                      <Text variant="callout" color="mutedForeground">
                        {item.body}
                      </Text>
                      <Text variant="caption" color="mutedForeground">
                        {relativeTime(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          }}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={refresh}
          ListEmptyComponent={
            <EmptyState
              icon={<Bell size={34} color={colors.mutedForeground} />}
              title="Nothing new"
              description={emptyDescription}
            />
          }
        />
      )}
    </View>
  );
}
