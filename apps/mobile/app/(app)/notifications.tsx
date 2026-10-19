import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  CreditCard,
  FileText,
  Home,
  MessageSquare,
  Settings2,
  ShieldAlert,
  Trash2,
  Wrench,
} from 'lucide-react-native';
import {
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { routeForActionUrl } from '@/lib/notificationRoutes';
import { qk } from '@/lib/query/keys';
import { useOptimisticMutation } from '@/lib/query/optimistic';
import { notificationsApi, type RenterNotification } from '@/lib/api/notifications';
import type { NotificationCategory } from '@/lib/api/notificationPreferences';
import { ApiError } from '@/lib/api/client';
import { relativeTime } from '@/lib/format';

const PAGE_SIZE = 30;

const CATEGORY_ICON: Record<NotificationCategory, typeof Bell> = {
  application: FileText,
  message: MessageSquare,
  payment: CreditCard,
  maintenance: Wrench,
  lease: Home,
  system: ShieldAlert,
};

export default function Notifications() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [page] = useState(1);

  const query = useQuery({
    queryKey: qk.renter.notifications(page, PAGE_SIZE),
    queryFn: () => notificationsApi.list(page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  });
  const listKey = qk.renter.notifications(page, PAGE_SIZE);

  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['renter', 'notifications'] });
  }, [qc]);

  // Read, read-all and remove show at once and roll back with a toast if the server refuses.
  type Page = { items: RenterNotification[] };
  const readOne = useOptimisticMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    patches: (id) => [
      {
        queryKey: listKey,
        update: (old) => ({
          ...(old as Page),
          items: (old as Page).items.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }),
      },
    ],
    invalidate: [['renter', 'notifications']],
    errorMessage: 'Could not mark that as read.',
  });

  const readAll = useOptimisticMutation<void, void>({
    mutationFn: () => notificationsApi.markAllRead(),
    patches: () => [
      {
        queryKey: listKey,
        update: (old) => ({
          ...(old as Page),
          items: (old as Page).items.map((n) => ({ ...n, read: true })),
        }),
      },
    ],
    invalidate: [['renter', 'notifications']],
    errorMessage: 'Could not mark those as read.',
    successMessage: 'All caught up.',
  });

  const removeOne = useOptimisticMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    patches: (id) => [
      {
        queryKey: listKey,
        update: (old) => ({
          ...(old as Page),
          items: (old as Page).items.filter((n) => n.id !== id),
        }),
      },
    ],
    invalidate: [['renter', 'notifications']],
    errorMessage: 'Could not remove that.',
  });

  const clearAll = useMutation({
    mutationFn: notificationsApi.clearAll,
    onSuccess: () => {
      invalidate();
      toast.show('Notifications cleared.', 'success');
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not clear those.', 'error'),
  });

  const confirmClearAll = () => {
    if (!items.length) return;
    Alert.alert('Clear all notifications?', 'This removes every notification on this account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear all', style: 'destructive', onPress: () => clearAll.mutate() },
    ]);
  };

  const open = (n: RenterNotification) => {
    if (!n.read) readOne.mutate(n.id);
    const route = routeForActionUrl(n.action?.url);
    if (route) router.push(route as never);
  };

  const renderItem = ({ item }: { item: RenterNotification }) => {
    const Icon = CATEGORY_ICON[item.type] ?? Bell;
    const route = routeForActionUrl(item.action?.url);
    return (
      <Pressable
        onPress={() => open(item)}
        accessibilityRole="button"
        accessibilityLabel={item.title}
        style={{ marginBottom: spacing.sm }}
      >
        <Card padding={spacing.lg}>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: item.read ? colors.secondary : colors.primary + '1f',
              }}
            >
              <Icon size={18} color={item.read ? colors.mutedForeground : colors.primary} />
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
                {item.message}
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  marginTop: 4,
                }}
              >
                <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                  {relativeTime(item.createdAt)}
                </Text>
                {route && item.action ? (
                  <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
                    {item.action.label}
                  </Text>
                ) : null}
                <Pressable
                  onPress={() => removeOne.mutate(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.title}`}
                  hitSlop={10}
                >
                  <Trash2 size={15} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
        >
          <ChevronLeft size={26} color={colors.foreground} />
        </Pressable>
        <Text variant="title" style={{ flex: 1 }}>
          Notifications
        </Text>
        <Pressable
          onPress={() => router.push('/(app)/notification-settings')}
          accessibilityRole="button"
          accessibilityLabel="Notification settings"
          hitSlop={10}
        >
          <Settings2 size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {unread > 0 || items.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.sm,
          }}
        >
          <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
            {unread > 0 ? `${unread} unread` : 'All read'}
          </Text>
          {unread > 0 ? (
            <Pressable
              onPress={() => readAll.mutate()}
              disabled={readAll.isPending}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <CheckCheck size={15} color={colors.primary} />
              <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
                Mark all read
              </Text>
            </Pressable>
          ) : null}
          {items.length ? (
            <Pressable onPress={confirmClearAll} accessibilityRole="button">
              <Text variant="caption" color="destructive" style={{ fontWeight: '600' }}>
                Clear all
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Cached notifications stay on screen if a refresh fails. */}
      {query.data === undefined ? (
        query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : (
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={92} radius={radius.lg} />
            ))}
          </View>
        )
      ) : (
        <FlashList
          data={items}
          keyExtractor={(n) => n.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
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
              icon={<Bell size={30} color={colors.mutedForeground} />}
              title="Nothing new"
              description="Updates on your applications, rent and maintenance will show up here."
            />
          }
        />
      )}
    </View>
  );
}
