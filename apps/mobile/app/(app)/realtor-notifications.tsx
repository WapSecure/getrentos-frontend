import { Pressable, RefreshControl, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  CheckCheck,
  FileSignature,
  Lock,
  MessageCircle,
  ShieldCheck,
  Star,
} from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  QueryState,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { realtorApi, type RealtorNotification } from '@/lib/api/realtor';
import type { Paginated } from '@/lib/api/properties';
import { routeForNotification } from '@/lib/notificationRoutes';
import { useOptimisticMutation } from '@/lib/query/optimistic';
import { relativeTime } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/**
 * The API's `type` is an open string, so match on the meaningful prefix and
 * fall back to a bell rather than assuming a closed set.
 */
function iconFor(type: string) {
  if (type.startsWith('offer')) return FileSignature;
  if (type.startsWith('escrow') || type.includes('commission') || type.includes('payout'))
    return Lock;
  if (type.includes('verif') || type.includes('kyc')) return ShieldCheck;
  if (type.includes('message')) return MessageCircle;
  if (type.includes('review')) return Star;
  return Bell;
}

export default function RealtorNotifications() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const query = useQuery({
    queryKey: qk.realtor.notifications,
    queryFn: realtorApi.notifications,
  });

  const items = query.data?.items ?? [];
  const unread = items.filter((n) => !n.read).length;

  // Marking read shows at once and rolls back with a toast if the server refuses.
  const markRead = (old: unknown, id?: string) => {
    const page = old as Paginated<RealtorNotification>;
    return {
      ...page,
      items: page.items.map((n) => (!id || n.id === id ? { ...n, read: true } : n)),
    };
  };

  const readOne = useOptimisticMutation({
    mutationFn: (id: string) => realtorApi.readNotification(id),
    patches: (id) => [{ queryKey: qk.realtor.notifications, update: (old) => markRead(old, id) }],
  });

  const readAll = useOptimisticMutation({
    mutationFn: () => realtorApi.readAllNotifications(),
    patches: () => [{ queryKey: qk.realtor.notifications, update: (old) => markRead(old) }],
    successMessage: 'All caught up.',
    errorMessage: 'Could not mark those as read.',
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Updates"
        title="Notifications"
        subtitle={
          unread > 0 ? `${unread} unread update${unread === 1 ? '' : 's'}` : 'You are all caught up'
        }
        onBack={() => goBack()}
        accessory={
          unread > 0 ? (
            <Button
              label="Mark all read"
              variant="ghost"
              size="sm"
              fullWidth={false}
              icon={<CheckCheck size={16} color={colors.primary} />}
              onPress={() => readAll.mutate()}
            />
          ) : null
        }
      />

      <QueryState
        query={query}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={86} radius={radius.lg} />
            ))}
          </View>
        }
      >
        <FlashList
          data={items}
          keyExtractor={(n) => n.id}
          renderItem={({ item }: { item: RealtorNotification }) => {
            const Icon = iconFor(item.type);
            return (
              <Pressable
                onPress={() => {
                  if (!item.read) readOne.mutate(item.id);
                  const to = routeForNotification(
                    {
                      type: item.type.toUpperCase(),
                      actionUrl: item.actionUrl,
                      conversationId: item.conversationId,
                    },
                    'realtor'
                  );
                  if (to !== '/(app)/notifications') router.push(to as Href);
                }}
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
              description="New offers, commission earned and client updates land here."
            />
          }
        />
      </QueryState>
    </View>
  );
}
