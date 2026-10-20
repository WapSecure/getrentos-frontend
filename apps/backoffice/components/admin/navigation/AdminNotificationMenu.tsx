'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Skeleton,
  useOptimisticMutation,
} from '@getrentos/ui';
import { formatRelativeTime, unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { adminService } from '@/services/adminService';

export function AdminNotificationMenu() {
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: adminKeys.notifications,
    queryFn: () => unwrap(adminService.getNotificationPage(1, 10)),
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
    patches: (id) => [{ queryKey: adminKeys.notifications, update: (old) => markReadIn(old, id) }],
    errorMessage: 'Could not mark this notification as read. Please try again.',
  });
  const markAll = useOptimisticMutation({
    mutationFn: () => unwrap(adminService.markAllNotificationsRead()),
    patches: () => [{ queryKey: adminKeys.notifications, update: (old) => markReadIn(old) }],
    errorMessage: 'Could not mark all notifications as read. Please try again.',
  });
  const notifications = query.data?.items ?? [];
  const unreadCount = query.data?.unreadTotal ?? 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <IconButton
          label={query.isError ? 'Notifications unavailable' : `Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
          className="relative"
          icon={
            <>
              <Bell aria-hidden="true" />
              {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />}
            </>
          }
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-2rem))] p-1.5">
        <div className="flex items-center justify-between gap-2 px-2 py-1">
          <DropdownMenuLabel className="px-0 py-1 font-semibold">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <DropdownMenuItem
              onSelect={(event) => { event.preventDefault(); markAll.mutate(undefined); }}
              className="text-xs text-primary"
            >
              Mark all read
            </DropdownMenuItem>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {query.isPending ? (
            <div role="status" aria-label="Loading notifications" className="space-y-2 p-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : query.isError && !query.data ? (
            <>
              <p role="alert" className="px-3 py-2 text-sm text-destructive">Could not load notifications.</p>
              <DropdownMenuItem onSelect={(event) => { event.preventDefault(); void query.refetch(); }}>Retry loading</DropdownMenuItem>
            </>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">No notifications</p>
          ) : notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onSelect={(event) => {
                event.preventDefault();
                if (!notification.read) markRead.mutate(notification.id);
              }}
              className={`block border-b border-border px-3 py-2.5 last:border-0 ${notification.read ? '' : 'bg-primary/5'}`}
              aria-label={`${notification.title}. ${notification.body}${notification.read ? '' : '. Mark as read'}`}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium">{notification.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(notification.createdAt)}</span>
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">{notification.body}</span>
              {!notification.read && <span className="mt-1 block text-xs font-medium text-primary">Mark as read</span>}
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/notifications" className="justify-center text-primary">View all notifications</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
