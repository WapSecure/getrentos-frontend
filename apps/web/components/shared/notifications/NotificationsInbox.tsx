'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { Bell } from '@sureground/icons';
import { Button, Card, EmptyState, PageHeader, Pagination, Skeleton } from '@sureground/ui';
import { cn } from '@sureground/shared';
import { formatRelativeTime } from '@/lib/format';
import { notificationHref, type NotificationPortal } from '@/lib/notificationHref';
import type { BellFeed, BellNotification } from './NotificationBell';

const PAGE_SIZE = 20;

interface NotificationsInboxProps {
  portal: NotificationPortal;
  queryKey: QueryKey;
  /** Some feeds only return their latest page; those show it without paging. */
  fetchPage: (page: number, pageSize: number) => Promise<BellFeed>;
  markRead: (id: string) => Promise<unknown>;
  markAllRead: () => Promise<unknown>;
}

export function NotificationsInbox({
  portal,
  queryKey,
  fetchPage,
  markRead,
  markAllRead,
}: NotificationsInboxProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const feed = useQuery({
    queryKey: [...queryKey, 'inbox', page],
    queryFn: () => fetchPage(page, PAGE_SIZE),
  });
  const items: BellNotification[] = Array.isArray(feed.data) ? feed.data : (feed.data?.items ?? []);
  const total = Array.isArray(feed.data) ? items.length : (feed.data?.total ?? items.length);
  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const readOne = useMutation({ mutationFn: markRead, onSuccess: refresh });
  const readAll = useMutation({ mutationFn: markAllRead, onSuccess: refresh });
  const unread = items.filter((n) => !n.read).length;

  const open = (notification: BellNotification) => {
    if (!notification.read) readOne.mutate(notification.id);
    const href = notificationHref(portal, notification);
    if (href) router.push(href);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : 'You are up to date'}
        actions={
          unread ? (
            <Button
              variant="outline"
              isLoading={readAll.isPending}
              onClick={() => readAll.mutate()}
            >
              Mark all as read
            </Button>
          ) : null
        }
      />
      {feed.isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Updates about your properties and deals appear here."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((notification) => (
            <li key={notification.id}>
              <button
                type="button"
                className="w-full cursor-pointer text-left"
                onClick={() => open(notification)}
              >
                <Card
                  className={cn(
                    'flex items-start gap-3 rounded-2xl p-4 transition-colors hover:bg-secondary/60',
                    !notification.read && 'border-primary/40'
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                      notification.read ? 'bg-transparent' : 'bg-primary'
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-foreground', !notification.read && 'font-semibold')}>
                      {notification.title}
                      {!notification.read && <span className="sr-only"> (unread)</span>}
                    </p>
                    {(notification.body ?? notification.message) && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {notification.body ?? notification.message}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}
      {total > PAGE_SIZE && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      )}
    </div>
  );
}
