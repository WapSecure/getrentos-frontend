import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { qk } from '@/lib/query/keys';
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

/**
 * The API sends `action.url` as a web path (e.g. `/renter/payments`). Map the
 * ones the app implements onto their native routes; anything unmapped simply
 * renders without a tap target rather than pushing a dead route.
 */
const WEB_PATH_TO_ROUTE: Record<string, string> = {
  '/renter/payments': '/(app)/payments',
  '/renter/applications': '/(app)/(renter)/applications',
  '/renter/maintenance': '/(app)/renter-maintenance',
  '/renter/messages': '/(app)/(renter)/messages',
  '/renter/lease': '/(app)/lease',
  '/renter/documents': '/(app)/documents',
  '/renter/saved': '/(app)/saved',
  '/renter/trust-score': '/(app)/trust-score',
};

function routeForAction(url?: string): string | null {
  if (!url) return null;
  const path = url.split('?')[0].replace(/\/$/, '');
  return WEB_PATH_TO_ROUTE[path] ?? null;
}

export default function Notifications() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [page] = useState(1);

  const query = useQuery({
    queryKey: qk.renter.notifications(page, PAGE_SIZE),
    queryFn: () => notificationsApi.list(page, PAGE_SIZE),
  });

  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['renter', 'notifications'] });
  }, [qc]);

  const readOne = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      const key = qk.renter.notifications(page, PAGE_SIZE);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<{ items: RenterNotification[] }>(key);
      if (previous) {
        qc.setQueryData(key, {
          ...previous,
          items: previous.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
        });
      }
      return { previous, key };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(ctx.key, ctx.previous);
    },
  });

  const readAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      invalidate();
      toast.show('All caught up.', 'success');
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not mark those as read.', 'error'),
  });

  const removeOne = useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: invalidate,
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not remove that.', 'error'),
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
    const route = routeForAction(n.action?.url);
    if (route) router.push(route as never);
  };

  const renderItem = ({ item }: { item: RenterNotification }) => {
    const Icon = CATEGORY_ICON[item.type] ?? Bell;
    const route = routeForAction(item.action?.url);
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

      {query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={92} radius={radius.lg} />
          ))}
        </View>
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
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
