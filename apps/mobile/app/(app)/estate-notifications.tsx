import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Banknote,
  Bell,
  DoorOpen,
  Megaphone,
  MessageCircle,
  ShieldAlert,
  Wrench,
} from '@sureground/icons/native';
import { qk } from '@/lib/query/keys';
import { routeForNotification } from '@/lib/notificationRoutes';
import { estateManagerApi, type EstateNotification } from '@/lib/api/estateManager';
import { useOptimisticMutation } from '@/lib/query/optimistic';
import { NotificationsInbox } from '@/components/notifications/NotificationsInbox';

function iconFor(type: string) {
  if (type.includes('incident') || type.includes('panic') || type.includes('muster')) {
    return ShieldAlert;
  }
  if (type.includes('due') || type.includes('payment') || type.includes('payout')) return Banknote;
  if (type.includes('walk_in') || type.includes('visitor') || type.includes('gate')) {
    return DoorOpen;
  }
  if (type.includes('maintenance')) return Wrench;
  if (type.includes('announcement')) return Megaphone;
  if (type.includes('message')) return MessageCircle;
  return Bell;
}

export default function EstateNotifications() {
  const query = useQuery({
    queryKey: qk.estateManager.notifications,
    queryFn: estateManagerApi.notifications,
  });

  const readOne = useOptimisticMutation({
    mutationFn: (id: string) => estateManagerApi.markNotificationRead(id),
    patches: (id) => [
      {
        queryKey: qk.estateManager.notifications,
        update: (old) =>
          (old as EstateNotification[]).map((n) => (n.id === id ? { ...n, read: true } : n)),
      },
    ],
    errorMessage: 'Could not mark that as read.',
  });

  const readAll = useOptimisticMutation({
    mutationFn: () => estateManagerApi.markAllNotificationsRead(),
    patches: () => [
      {
        queryKey: qk.estateManager.notifications,
        update: (old) => (old as EstateNotification[]).map((n) => ({ ...n, read: true })),
      },
    ],
    successMessage: 'All caught up.',
    errorMessage: 'Could not mark those as read.',
  });

  return (
    <NotificationsInbox
      eyebrow="Estate office"
      items={query.data ?? []}
      loading={query.isPending}
      error={query.isError && !query.data}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      onOpen={(n) => {
        if (!n.read) readOne.mutate(n.id);
        const to = routeForNotification({ type: n.type.toUpperCase(), actionUrl: n.actionUrl }, 'estate');
        if (to !== '/(app)/notifications') router.push(to as Href);
      }}
      onReadAll={() => readAll.mutate()}
      readingAll={readAll.isPending}
      iconFor={iconFor}
      emptyDescription="Gate approvals, incidents and dues updates land here."
    />
  );
}
