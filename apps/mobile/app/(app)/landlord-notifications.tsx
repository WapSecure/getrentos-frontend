import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Banknote,
  Bell,
  FileText,
  MessageCircle,
  Star,
  UserPlus,
  Wrench,
} from 'lucide-react-native';
import { qk } from '@/lib/query/keys';
import { routeForNotification } from '@/lib/notificationRoutes';
import { landlordApi, type LandlordNotification } from '@/lib/api/landlord';
import { useOptimisticMutation } from '@/lib/query/optimistic';
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
  const query = useQuery({
    queryKey: qk.landlord.notifications,
    queryFn: landlordApi.notifications,
  });

  // Reading is instant; a refused change is rolled back with a toast.
  const readOne = useOptimisticMutation({
    mutationFn: (id: string) => landlordApi.markNotificationRead(id),
    patches: (id) => [
      {
        queryKey: qk.landlord.notifications,
        update: (old) =>
          (old as LandlordNotification[]).map((n) => (n.id === id ? { ...n, read: true } : n)),
      },
    ],
    errorMessage: 'Could not mark that as read.',
  });

  const readAll = useOptimisticMutation({
    mutationFn: () => landlordApi.markAllNotificationsRead(),
    patches: () => [
      {
        queryKey: qk.landlord.notifications,
        update: (old) => (old as LandlordNotification[]).map((n) => ({ ...n, read: true })),
      },
    ],
    successMessage: 'All caught up.',
    errorMessage: 'Could not mark those as read.',
  });

  return (
    <NotificationsInbox
      eyebrow="Renting"
      items={query.data ?? []}
      loading={query.isPending}
      error={query.isError && !query.data}
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      onOpen={(n) => {
        if (!n.read) readOne.mutate(n.id);
        const to = routeForNotification(
          { type: n.type.toUpperCase(), actionUrl: n.actionUrl, conversationId: n.conversationId },
          'landlord'
        );
        if (to !== '/(app)/notifications') router.push(to as Href);
      }}
      onReadAll={() => readAll.mutate()}
      readingAll={readAll.isPending}
      iconFor={iconFor}
      emptyDescription="Rent, applications and maintenance updates land here."
    />
  );
}
