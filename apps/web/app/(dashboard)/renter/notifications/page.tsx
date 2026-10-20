'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationsHeader } from '@/components/renter/notifications/NotificationsHeader';
import { NotificationsStats } from '@/components/renter/notifications/NotificationsStats';
import { NotificationsList } from '@/components/renter/notifications/NotificationsList';
import { NotificationFilters } from '@/components/renter/notifications/NotificationFilters';
import { NotificationPreferences } from '@/components/renter/notifications/NotificationPreferences';
import { NotificationAnalytics } from '@/components/renter/notifications/NotificationAnalytics';
import { NotificationSearch } from '@/components/renter/notifications/NotificationSearch';
import { renterService } from '@/services/renterService';
import { unwrap, type Paginated } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import type { Notification } from '@/types/notification';
import { useRealtimeEvent } from '@/hooks/useRealtime';
import {
  PageErrorState,
  PageLoadingState,
  Pagination,
  useOptimisticMutation,
  useToast,
} from '@getrentos/ui';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const notificationsQueryKey = [...renterKeys.notifications, { page, pageSize: PAGE_SIZE }];
  const notificationsQuery = useQuery({
    queryKey: notificationsQueryKey,
    queryFn: () => unwrap(renterService.listNotifications({ page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });
  const data = notificationsQuery.data;
  const notifications = data?.items ?? [];
  const total = data?.total ?? 0;
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  const invalidateNotifications = () =>
    queryClient.invalidateQueries({ queryKey: renterKeys.notifications });

  // Real-time: refresh the list when the backend pushes a new notification.
  useRealtimeEvent('notification:new', () => {
    invalidateNotifications();
  });

  const markRead = (old: unknown, id?: string) => {
    const page = old as Paginated<Notification>;
    return {
      ...page,
      items: page.items.map((n) => (id === undefined || n.id === id ? { ...n, read: true } : n)),
    };
  };

  const markAsReadMutation = useOptimisticMutation({
    mutationFn: (id: string) => unwrap(renterService.markNotificationAsRead(id)),
    patches: (id) => [{ queryKey: notificationsQueryKey, update: (old) => markRead(old, id) }],
    invalidate: [renterKeys.notifications],
    errorMessage: 'The notification could not be marked as read.',
  });

  const markAllAsReadMutation = useOptimisticMutation({
    mutationFn: (_vars: void) => unwrap(renterService.markAllNotificationsAsRead()),
    patches: () => [{ queryKey: notificationsQueryKey, update: (old) => markRead(old) }],
    invalidate: [renterKeys.notifications],
    errorMessage: 'Notifications could not be marked as read.',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.deleteNotification(id)),
    onSuccess: invalidateNotifications,
    onError: () => toast.error('The notification could not be deleted.'),
  });

  const clearAllMutation = useMutation({
    mutationFn: () => unwrap(renterService.clearAllNotifications()),
    onSuccess: invalidateNotifications,
    onError: () => toast.error('Notifications could not be cleared.'),
  });

  const handleMarkAsRead = (id: string) => markAsReadMutation.mutate(id);
  const handleMarkAllAsRead = () => markAllAsReadMutation.mutate();
  const handleDelete = (id: string) => deleteMutation.mutate(id);
  const handleClearAll = () => clearAllMutation.mutate();

  const filteredNotifications = notifications.filter((n) => {
    const matchesType = filterType === 'all' || n.type === filterType;
    const matchesRead =
      filterRead === 'all' ||
      (filterRead === 'read' && n.read) ||
      (filterRead === 'unread' && !n.read);
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesRead && matchesSearch;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (notificationsQuery.isLoading) return <PageLoadingState />;
  if (notificationsQuery.isError && !data) {
    return (
      <PageErrorState
        title="Notifications are unavailable"
        onRetry={() => void notificationsQuery.refetch()}
        isRetrying={notificationsQuery.isFetching}
      />
    );
  }

  return (
    <>
      <NotificationsHeader
        unreadCount={unreadCount}
        totalCount={notifications.length}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAll}
      />

      <NotificationsStats notifications={notifications} unreadCount={unreadCount} />

      <div className="space-y-4 mb-6">
        <NotificationSearch searchTerm={searchTerm} onSearch={setSearchTerm} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <NotificationFilters
            filterType={filterType}
            setFilterType={setFilterType}
            filterRead={filterRead}
            setFilterRead={setFilterRead}
          />
          <NotificationsList
            notifications={filteredNotifications}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
        </div>
        <div className="space-y-6">
          <NotificationPreferences />
          <NotificationAnalytics notifications={notifications} />
        </div>
      </div>

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
    </>
  );
}
