'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationsHeader } from '@/components/renter/notifications/NotificationsHeader';
import { NotificationsStats } from '@/components/renter/notifications/NotificationsStats';
import { NotificationsList } from '@/components/renter/notifications/NotificationsList';
import { NotificationFilters } from '@/components/renter/notifications/NotificationFilters';
import { NotificationPreferences } from '@/components/renter/notifications/NotificationPreferences';
import { NotificationAnalytics } from '@/components/renter/notifications/NotificationAnalytics';
import { DoNotDisturb } from '@/components/renter/notifications/DoNotDisturb';
import { NotificationSearch } from '@/components/renter/notifications/NotificationSearch';
import { NotificationSound } from '@/components/renter/notifications/NotificationSound';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { useRealtimeEvent } from '@/hooks/useRealtime';
import { PageErrorState, PageLoadingState, Pagination } from '@getrentos/ui';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const notificationsQuery = useQuery({
    queryKey: [...renterKeys.notifications, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(renterService.listNotifications({ page, pageSize: PAGE_SIZE })),
  });
  const data = notificationsQuery.data;
  const notifications = data?.items ?? [];
  const total = data?.total ?? 0;
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const invalidateNotifications = () =>
    queryClient.invalidateQueries({ queryKey: renterKeys.notifications });

  // Real-time: refresh the list when the backend pushes a new notification.
  useRealtimeEvent('notification:new', () => {
    invalidateNotifications();
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.markNotificationAsRead(id)),
    onSuccess: invalidateNotifications,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => unwrap(renterService.markAllNotificationsAsRead()),
    onSuccess: invalidateNotifications,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.deleteNotification(id)),
    onSuccess: invalidateNotifications,
  });

  const clearAllMutation = useMutation({
    mutationFn: () => unwrap(renterService.clearAllNotifications()),
    onSuccess: invalidateNotifications,
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
  if (notificationsQuery.isError) {
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
          <NotificationSound />
          <DoNotDisturb />
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
