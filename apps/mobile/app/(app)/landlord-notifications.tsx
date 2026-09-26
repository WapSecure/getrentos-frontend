import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Banknote,
  Bell,
  CheckCheck,
  FileText,
  MessageCircle,
  Star,
  UserPlus,
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
import { landlordApi, type LandlordNotification } from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { relativeTime } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

/**
 * The API's `type` is an open string, so match on the meaningful prefix and
 * fall back to a bell rather than assuming a closed set.
 */
function iconFor(type: string) {
  if (type.startsWith('payment') || type.includes('rent')) return Banknote;
  if (type.startsWith('lead')) return UserPlus;
  if (type.startsWith('maintenance')) return Wrench;
  if (type.startsWith('application') || type.startsWith('lease')) return FileText;
  if (type.startsWith('message')) return MessageCircle;
  if (type.startsWith('review')) return Star;
  return Bell;
}

export default function LandlordNotifications() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: qk.landlord.notifications,
    queryFn: landlordApi.notifications,
  });

  const items = query.data ?? [];
  const unread = items.filter((n) => !n.read).length;

  const readOne = useMutation({
    mutationFn: (id: string) => landlordApi.markNotificationRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk.landlord.notifications });
      const previous = qc.getQueryData<LandlordNotification[]>(qk.landlord.notifications);
      qc.setQueryData<LandlordNotification[]>(qk.landlord.notifications, (old) =>
        old?.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.landlord.notifications, ctx.previous);
    },
  });

  const readAll = useMutation({
    mutationFn: landlordApi.markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.landlord.notifications });
      toast.show('All caught up.', 'success');
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not mark those as read.', 'error'),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Landlord workspace"
        title="Notifications"
        subtitle={
          unread > 0 ? `${unread} unread update${unread === 1 ? '' : 's'}` : 'You are all caught up'
        }
        onBack={() => router.back()}
        accessory={
          unread > 0 ? (
            <Pressable
              onPress={() => readAll.mutate()}
              disabled={readAll.isPending}
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

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={86} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(n) => n.id}
          renderItem={({ item }: { item: LandlordNotification }) => {
            const Icon = iconFor(item.type);
            return (
              <Pressable
                onPress={() => {
                  if (!item.read) readOne.mutate(item.id);
                }}
                accessibilityRole="button"
                accessibilityLabel={item.title}
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
                        backgroundColor: item.read ? colors.secondary : colors.primary + '1f',
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
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Bell size={32} color={colors.mutedForeground} />}
              title="Nothing new"
              description="Rent, applications and maintenance updates land here."
            />
          }
        />
      )}
    </View>
  );
}
