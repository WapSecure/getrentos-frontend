import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  CalendarClock,
  FileSignature,
  MessageCircle,
  ShieldCheck,
  Wallet,
} from 'lucide-react-native';
import { qk } from '@/lib/query/keys';
import { routeForNotification } from '@/lib/notificationRoutes';
import { buyerSettingsApi, type BuyerNotification } from '@/lib/api/buyerSettings';
import type { Paginated } from '@/lib/api/buyer';
import { useOptimisticMutation } from '@/lib/query/optimistic';
import { NotificationsInbox } from '@/components/notifications/NotificationsInbox';

const KEY = qk.buyer.notifications(1, 50);

/** The API's `type` is an open string: match the meaningful part, fall back to a bell. */
function iconFor(type: string) {
  const t = type.toLowerCase();
  if (t.startsWith('offer')) return FileSignature;
  if (t.startsWith('escrow') || t.includes('payment')) return Wallet;
  if (t.includes('viewing')) return CalendarClock;
  if (t.includes('verif') || t.includes('kyc')) return ShieldCheck;
  if (t.includes('message')) return MessageCircle;
  return Bell;
}

/** What has happened on the buyer's offers, viewings and purchases. */
export default function BuyerNotificationInbox() {
  const query = useQuery({ queryKey: KEY, queryFn: () => buyerSettingsApi.notifications(1, 50) });

  const readOne = useOptimisticMutation({
    mutationFn: (id: string) => buyerSettingsApi.readNotification(id),
    patches: (id) => [
      {
        queryKey: KEY,
        update: (old) => {
          const page = old as Paginated<BuyerNotification>;
          return {
            ...page,
            items: page.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
          };
        },
      },
    ],
    errorMessage: 'Could not mark that as read.',
  });

  const readAll = useOptimisticMutation({
    mutationFn: () => buyerSettingsApi.readAllNotifications(),
    patches: () => [
      {
        queryKey: KEY,
        update: (old) => {
          const page = old as Paginated<BuyerNotification>;
          return { ...page, items: page.items.map((n) => ({ ...n, read: true })) };
        },
      },
    ],
    invalidate: [['buyer', 'notifications']],
    errorMessage: 'Could not mark those as read.',
    successMessage: 'All caught up.',
  });

  return (
    <NotificationsInbox
      eyebrow="Buying"
      items={query.data?.items ?? []}
      loading={query.isPending}
      error={query.isError}
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      onOpen={(n) => {
        if (!n.read) readOne.mutate(n.id);
        const to = routeForNotification(
          { type: n.type.toUpperCase(), actionUrl: n.actionUrl, conversationId: n.conversationId },
          'buyer'
        );
        if (to !== '/(app)/notifications') router.push(to as Href);
      }}
      onReadAll={() => readAll.mutate()}
      readingAll={readAll.isPending}
      iconFor={iconFor}
      emptyDescription="Updates on your offers, viewings and purchases land here."
    />
  );
}
