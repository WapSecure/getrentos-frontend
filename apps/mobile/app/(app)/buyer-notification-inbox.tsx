import { router, type Href } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CalendarClock,
  FileSignature,
  MessageCircle,
  ShieldCheck,
  Wallet,
} from 'lucide-react-native';
import { useToast } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { routeForNotification } from '@/lib/notificationRoutes';
import { buyerSettingsApi, type BuyerNotification } from '@/lib/api/buyerSettings';
import type { Paginated } from '@/lib/api/buyer';
import { ApiError } from '@/lib/api/client';
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
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({ queryKey: KEY, queryFn: () => buyerSettingsApi.notifications(1, 50) });

  const readOne = useMutation({
    mutationFn: (id: string) => buyerSettingsApi.readNotification(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<Paginated<BuyerNotification>>(KEY);
      qc.setQueryData<Paginated<BuyerNotification>>(KEY, (old) =>
        old
          ? { ...old, items: old.items.map((n) => (n.id === id ? { ...n, read: true } : n)) }
          : old
      );
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
    },
  });

  const readAll = useMutation({
    mutationFn: buyerSettingsApi.readAllNotifications,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buyer', 'notifications'] });
      toast.show('All caught up.', 'success');
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not mark those as read.', 'error'),
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
        const to = routeForNotification({ type: n.type.toUpperCase() }, 'buyer');
        if (to !== '/(app)/notifications') router.push(to as Href);
      }}
      onReadAll={() => readAll.mutate()}
      readingAll={readAll.isPending}
      iconFor={iconFor}
      emptyDescription="Updates on your offers, viewings and purchases land here."
    />
  );
}
