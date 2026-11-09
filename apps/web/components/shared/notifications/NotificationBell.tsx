'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { Bell } from '@sureground/icons';
import {
  Button,
  EmptyState,
  IconButton,
  Pagination,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  useOptimisticMutation,
} from '@sureground/ui';
import { authFetch, safeCall, unwrap } from '@/lib/apiHelpers';
import { formatRelativeTime } from '@/lib/format';
import { notificationHref, type NotificationPortal } from '@/lib/notificationHref';
import { useRealtimeEvent } from '@/hooks/useRealtime';

export interface BellNotification {
  id: string;
  type: string;
  title: string;
  body?: string;
  message?: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  conversationId?: string;
  action?: { url: string };
}

export type BellFeed = BellNotification[] | { items: BellNotification[]; total?: number };

interface FeedSourceProps {
  queryKey: QueryKey;
  fetchNotifications: (params: { page: number; pageSize?: number }) => Promise<BellFeed>;
  markRead: (id: string) => Promise<unknown>;
  markAllRead: () => Promise<unknown>;
  pageSize?: number;
  paginate?: boolean;
  refetchAfterMarking?: boolean;
  realtime?: boolean;
  viewAllHref?: string;
  viewAllLabel?: string;
}

interface BasePathProps {
  basePath: string;
}

type NotificationBellProps = { portal: NotificationPortal } & (FeedSourceProps | BasePathProps);

const basePathSource = (portal: NotificationPortal, basePath: string): FeedSourceProps => ({
  queryKey: ['notifications', portal],
  fetchNotifications: () => unwrap(safeCall(() => authFetch<BellNotification[]>(basePath))),
  markRead: (id) =>
    unwrap(safeCall(() => authFetch(`${basePath}/${id}/read`, { method: 'PATCH' }))),
  markAllRead: () => unwrap(safeCall(() => authFetch(`${basePath}/read-all`, { method: 'POST' }))),
});

const markFeedRead = (old: unknown, isTarget: (id: string) => boolean): unknown => {
  const read = (n: BellNotification) => (isTarget(n.id) ? { ...n, read: true } : n);
  if (Array.isArray(old)) return (old as BellNotification[]).map(read);
  const page = old as { items: BellNotification[] };
  return { ...page, items: page.items.map(read) };
};

function RealtimeRefresh({ onNotification }: { onNotification: () => void }) {
  useRealtimeEvent('notification:new', onNotification);
  return null;
}

export function NotificationBell(props: NotificationBellProps) {
  const { portal } = props;
  const {
    queryKey: baseKey,
    fetchNotifications,
    markRead: markReadFn,
    markAllRead: markAllReadFn,
    pageSize,
    paginate = false,
    refetchAfterMarking = false,
    realtime = true,
    viewAllHref,
    viewAllLabel = 'View all notifications',
  } = 'basePath' in props ? basePathSource(portal, props.basePath) : props;

  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const queryKey: QueryKey = pageSize ? [...baseKey, { page, pageSize }] : baseKey;

  const { data } = useQuery({
    queryKey,
    queryFn: () => fetchNotifications({ page, pageSize }),
    placeholderData: paginate ? keepPreviousData : undefined,
    // The bell sits in the layout: thrown, a failed fetch took down the whole page.
    throwOnError: false,
  });
  const notifications = (Array.isArray(data) ? data : data?.items) ?? [];
  const total = (Array.isArray(data) ? data.length : data?.total) ?? 0;

  const invalidate = refetchAfterMarking ? [baseKey] : [];
  const markRead = useOptimisticMutation({
    mutationFn: (id: string) => markReadFn(id),
    patches: (id: string) => [{ queryKey, update: (old) => markFeedRead(old, (n) => n === id) }],
    invalidate,
  });
  const markAllRead = useOptimisticMutation<unknown, void>({
    mutationFn: () => markAllReadFn(),
    patches: () => [{ queryKey, update: (old) => markFeedRead(old, () => true) }],
    invalidate,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const openNotification = (notification: BellNotification) => {
    if (!notification.read) markRead.mutate(notification.id);
    const href = notificationHref(portal, notification);
    if (href) {
      setOpen(false);
      router.push(href);
    }
  };

  return (
    <>
      {realtime && (
        <RealtimeRefresh
          onNotification={() => queryClient.invalidateQueries({ queryKey: baseKey })}
        />
      )}
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) setPage(1);
          setOpen(next);
        }}
      >
        <div className="relative">
          <PopoverTrigger asChild>
            <IconButton
              label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
              icon={<Bell className="w-5 h-5" />}
            />
          </PopoverTrigger>
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background"
            />
          )}
        </div>

        <PopoverContent aria-label="Notifications" layout="sections">
          <PopoverHeader>
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="xs" onClick={() => markAllRead.mutate()}>
                Mark all as read
              </Button>
            )}
          </PopoverHeader>
          <PopoverBody>
            {notifications.length === 0 ? (
              <EmptyState icon={Bell} title="No notifications" size="compact" bare />
            ) : (
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={`block w-full p-3 text-left border-b border-border hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                    !notification.read ? 'bg-accent' : ''
                  }`}
                  onClick={() => openNotification(notification)}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className="min-w-0 text-sm font-medium text-foreground">
                      {notification.title}
                    </h4>
                    <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {notification.body ?? notification.message}
                  </p>
                </button>
              ))
            )}
          </PopoverBody>
          {paginate && pageSize && total > pageSize && (
            <PopoverFooter className="px-0 py-0">
              <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
            </PopoverFooter>
          )}
          {viewAllHref && (
            <PopoverFooter className="p-2">
              <Link
                href={viewAllHref}
                onClick={() => setOpen(false)}
                className="block w-full rounded-md text-center text-sm text-primary hover:text-primary-hover py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {viewAllLabel}
              </Link>
            </PopoverFooter>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}
