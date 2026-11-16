import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Bell, ClipboardList, MessageCircle } from '@sureground/icons/native';
import { qk } from '@/lib/query/keys';
import { routeForNotification } from '@/lib/notificationRoutes';
import { agentApi, type AgentNotification } from '@/lib/api/agent';
import { useOptimisticMutation } from '@/lib/query/optimistic';
import { NotificationsInbox } from '@/components/notifications/NotificationsInbox';

function iconFor(type: string) {
  if (type.includes('task') || type.includes('inspection')) return ClipboardList;
  if (type.includes('payout') || type.includes('commission') || type.includes('payment')) return Banknote;
  if (type.includes('message')) return MessageCircle;
  return Bell;
}

export default function AgentNotifications() {
  const query = useQuery({
    queryKey: qk.agent.notifications,
    queryFn: agentApi.notifications,
  });

  const readOne = useOptimisticMutation({
    mutationFn: (id: string) => agentApi.markNotificationRead(id),
    patches: (id) => [
      {
        queryKey: qk.agent.notifications,
        update: (old) =>
          (old as AgentNotification[]).map((n) => (n.id === id ? { ...n, read: true } : n)),
      },
    ],
    errorMessage: 'Could not mark that as read.',
  });

  const readAll = useOptimisticMutation({
    mutationFn: () => agentApi.markAllNotificationsRead(),
    patches: () => [
      {
        queryKey: qk.agent.notifications,
        update: (old) => (old as AgentNotification[]).map((n) => ({ ...n, read: true })),
      },
    ],
    successMessage: 'All caught up.',
    errorMessage: 'Could not mark those as read.',
  });

  return (
    <NotificationsInbox
      eyebrow="Field work"
      items={query.data ?? []}
      loading={query.isPending}
      error={query.isError && !query.data}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      onOpen={(n) => {
        if (!n.read) readOne.mutate(n.id);
        const to = routeForNotification({ type: n.type.toUpperCase(), actionUrl: n.actionUrl }, 'agent');
        if (to !== '/(app)/notifications') router.push(to as Href);
      }}
      onReadAll={() => readAll.mutate()}
      readingAll={readAll.isPending}
      iconFor={iconFor}
      emptyDescription="New tasks, client requests and schedule changes land here."
    />
  );
}
