'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import {
  Button,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  Pagination,
  useOptimisticMutation,
} from '@getrentos/ui';
import { formatRelativeTime, unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { adminService } from '@/services/adminService';

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: adminKeys.notificationPage(page),
    queryFn: () => unwrap(adminService.getNotificationPage(page, PAGE_SIZE)),
    placeholderData: keepPreviousData,
  });
  const markReadIn = (old: unknown, id?: string) => {
    const feed = old as typeof query.data;
    if (!feed) return old;
    const newlyRead = feed.items.filter((n) => !n.read && (!id || n.id === id)).length;
    return {
      ...feed,
      items: feed.items.map((n) => (!id || n.id === id ? { ...n, read: true } : n)),
      unreadTotal: id ? Math.max(0, feed.unreadTotal - newlyRead) : 0,
    };
  };
  const markRead = useOptimisticMutation({
    mutationFn: (id: string) => unwrap(adminService.markNotificationRead(id)),
    patches: (id) => [
      { queryKey: adminKeys.notificationPage(page), update: (old) => markReadIn(old, id) },
      { queryKey: adminKeys.notifications, update: (old) => markReadIn(old, id) },
    ],
    invalidate: [adminKeys.notifications],
    errorMessage: 'Could not mark this notification as read. Please try again.',
  });
  const markAll = useOptimisticMutation({
    mutationFn: () => unwrap(adminService.markAllNotificationsRead()),
    patches: () => [
      { queryKey: adminKeys.notificationPage(page), update: (old) => markReadIn(old) },
      { queryKey: adminKeys.notifications, update: (old) => markReadIn(old) },
    ],
    invalidate: [adminKeys.notifications],
    errorMessage: 'Could not mark all notifications as read. Please try again.',
  });
  const notifications = query.data?.items ?? [];
  const unread = query.data?.unreadTotal ?? 0;

  if (query.isError && !query.data) return <PageErrorState title="Could not load notifications" description="Your notification feed is temporarily unavailable." onRetry={() => void query.refetch()} isRetrying={query.isFetching} />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Notification centre</p><h1 className="mt-1 text-2xl font-semibold">Operational notifications</h1><p className="mt-1 text-sm text-muted-foreground">Review alerts and workflow updates assigned to your account.</p></div>
        <Button variant="outline" disabled={!unread} icon={<CheckCheck className="h-4 w-4" />} onClick={() => markAll.mutate(undefined)}>{`Mark all read${unread ? ` (${unread})` : ''}`}</Button>
      </header>
      {query.isLoading ? <ListSkeleton rows={3} label="Loading notifications" /> : notifications.length === 0 ? <EmptyState icon={Bell} title={page > 1 ? 'No notifications on this page' : 'No notifications'} description="New operational alerts will appear here." /> : <div className="overflow-hidden rounded-xl border border-border bg-card">{notifications.map((item) => <button key={item.id} type="button" disabled={item.read} onClick={() => markRead.mutate(item.id)} className={`block w-full border-b border-border p-4 text-left last:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${item.read ? '' : 'bg-primary/5 hover:bg-primary/10'}`}><div className="flex items-start justify-between gap-4"><div><p className="font-medium text-foreground">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.body}</p></div><span className="whitespace-nowrap text-xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</span></div>{!item.read && <span className="mt-2 inline-block text-xs font-medium text-primary">Mark as read</span>}</button>)}</div>}
      {query.data && query.data.total > PAGE_SIZE && <Pagination page={page} pageSize={PAGE_SIZE} total={query.data.total} onPageChange={setPage} />}
    </div>
  );
}
