'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { Button, EmptyState, PageErrorState, Pagination } from '@getrentos/ui';
import { formatRelativeTime, unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { adminService } from '@/services/adminService';

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: adminKeys.notificationPage(page),
    queryFn: () => unwrap(adminService.getNotificationPage(page, PAGE_SIZE)),
  });
  const refresh = () => client.invalidateQueries({ queryKey: adminKeys.notifications });
  const markRead = useMutation({
    mutationFn: (id: string) => unwrap(adminService.markNotificationRead(id)),
    onMutate: () => setActionError(null),
    onSuccess: refresh,
    onError: () => setActionError('Could not mark this notification as read. Please try again.'),
  });
  const markAll = useMutation({
    mutationFn: () => unwrap(adminService.markAllNotificationsRead()),
    onMutate: () => setActionError(null),
    onSuccess: refresh,
    onError: () => setActionError('Could not mark all notifications as read. Please try again.'),
  });
  const notifications = query.data?.items ?? [];
  const unread = query.data?.unreadTotal ?? 0;

  if (query.isError) return <PageErrorState title="Could not load notifications" description="Your notification feed is temporarily unavailable." onRetry={() => void query.refetch()} isRetrying={query.isFetching} />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Notification centre</p><h1 className="mt-1 text-2xl font-semibold">Operational notifications</h1><p className="mt-1 text-sm text-muted-foreground">Review alerts and workflow updates assigned to your account.</p></div>
        <Button variant="outline" disabled={!unread || markAll.isPending} onClick={() => markAll.mutate()}><CheckCheck className="mr-2 h-4 w-4" />{markAll.isPending ? 'Updating…' : `Mark all read${unread ? ` (${unread})` : ''}`}</Button>
      </header>
      {actionError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{actionError}</p>}
      {query.isLoading ? <div className="space-y-3" role="status" aria-label="Loading notifications">{[1,2,3].map((key) => <div key={key} className="h-24 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />)}</div> : notifications.length === 0 ? <EmptyState icon={Bell} title={page > 1 ? 'No notifications on this page' : 'No notifications'} description="New operational alerts will appear here." /> : <div className="overflow-hidden rounded-xl border border-border bg-card">{notifications.map((item) => <button key={item.id} type="button" disabled={item.read || markRead.isPending || markAll.isPending} onClick={() => markRead.mutate(item.id)} className={`block w-full border-b border-border p-4 text-left last:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${item.read ? '' : 'bg-primary/5 hover:bg-primary/10'}`}><div className="flex items-start justify-between gap-4"><div><p className="font-medium text-foreground">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.body}</p></div><span className="whitespace-nowrap text-xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</span></div>{!item.read && <span className="mt-2 inline-block text-xs font-medium text-primary">Mark as read</span>}</button>)}</div>}
      {query.data && query.data.total > PAGE_SIZE && <Pagination page={page} pageSize={PAGE_SIZE} total={query.data.total} onPageChange={setPage} />}
    </div>
  );
}
