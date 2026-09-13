'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@getrentos/ui';
import { formatRelativeTime, unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { adminService } from '@/services/adminService';

export function AdminNotificationMenu() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: adminKeys.notifications,
    queryFn: () => unwrap(adminService.getNotificationPage(1, 10)),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: adminKeys.notifications });
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
  const unreadCount = query.data?.unreadTotal ?? 0;
  const pending = markRead.isPending || markAll.isPending;

  return (
    <DropdownMenu open={open} onOpenChange={(next) => { setOpen(next); if (next) setActionError(null); }}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={query.isError ? 'Notifications unavailable' : `Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
          className="relative rounded-lg p-2 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          {unreadCount > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-2rem))] p-1.5">
        <div className="flex items-center justify-between gap-2 px-2 py-1">
          <DropdownMenuLabel className="px-0 py-1 font-semibold">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <DropdownMenuItem
              disabled={pending}
              onSelect={(event) => { event.preventDefault(); markAll.mutate(); }}
              className="text-xs text-primary"
            >
              {markAll.isPending ? 'Updating…' : 'Mark all read'}
            </DropdownMenuItem>
          )}
        </div>
        <DropdownMenuSeparator />
        {actionError && <p role="alert" className="px-3 py-2 text-xs text-destructive">{actionError}</p>}
        <div className="max-h-96 overflow-y-auto">
          {query.isPending ? (
            <p role="status" className="px-3 py-4 text-sm text-muted-foreground">Loading notifications…</p>
          ) : query.isError ? (
            <>
              <p role="alert" className="px-3 py-2 text-sm text-destructive">Could not load notifications.</p>
              <DropdownMenuItem onSelect={(event) => { event.preventDefault(); void query.refetch(); }}>Retry loading</DropdownMenuItem>
            </>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">No notifications</p>
          ) : notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              disabled={pending}
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
