import { router, type Href } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  Bell,
  FileText,
  MessageCircle,
  Star,
  UserPlus,
  Wrench,
} from 'lucide-react-native';
import { useToast } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { routeForNotification } from '@/lib/notificationRoutes';
import { landlordApi, type LandlordNotification } from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { NotificationsInbox } from '@/components/notifications/NotificationsInbox';

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
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: qk.landlord.notifications,
    queryFn: landlordApi.notifications,
  });

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
    <NotificationsInbox
      eyebrow="Renting"
      items={query.data ?? []}
      loading={query.isPending}
      error={query.isError}
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      onOpen={(n) => {
        if (!n.read) readOne.mutate(n.id);
        const to = routeForNotification({ type: n.type.toUpperCase() }, 'landlord');
        if (to !== '/(app)/notifications') router.push(to as Href);
      }}
      onReadAll={() => readAll.mutate()}
      readingAll={readAll.isPending}
      iconFor={iconFor}
      emptyDescription="Rent, applications and maintenance updates land here."
    />
  );
}
