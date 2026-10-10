'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { authFetch, safeCall, unwrap } from '@/lib/apiHelpers';
import { formatRelativeTime } from '@/lib/format';
import { notificationHref, type NotificationPortal } from '@/lib/notificationHref';
import { useRealtimeEvent } from '@/hooks/useRealtime';

interface BellNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  conversationId?: string;
}

/**
 * A portal's notification bell over a `GET <basePath>`, `PATCH <basePath>/:id/read`
 * and `POST <basePath>/read-all` feed. Clicking an item marks it read and opens
 * what it is about (lib/notificationHref.ts).
 */
export function NotificationBell({
  portal,
  basePath,
}: {
  portal: NotificationPortal;
  basePath: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const queryKey = ['notifications', portal] as const;

  const { data: notifications = [] } = useQuery({
    queryKey,
    queryFn: () => unwrap(safeCall(() => authFetch<BellNotification[]>(basePath))),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const markRead = useMutation({
    mutationFn: (id: string) =>
      unwrap(safeCall(() => authFetch(`${basePath}/${id}/read`, { method: 'PATCH' }))),
    onSuccess: refresh,
  });
  const markAllRead = useMutation({
    mutationFn: () => unwrap(safeCall(() => authFetch(`${basePath}/read-all`, { method: 'POST' }))),
    onSuccess: refresh,
  });

  // Real-time: refresh the bell when the backend pushes a new notification.
  useRealtimeEvent('notification:new', refresh);

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
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-card rounded-xl shadow-lg border border-border z-50"
          >
            <div className="p-3 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-xs text-primary hover:text-primary-hover"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No notifications</div>
              ) : (
                notifications.map((notification) => (
                  <button
                    type="button"
                    key={notification.id}
                    className={`block w-full text-left p-3 border-b border-border hover:bg-secondary transition-colors ${
                      !notification.read ? 'bg-accent' : ''
                    }`}
                    onClick={() => openNotification(notification)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-medium text-foreground">{notification.title}</h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{notification.body}</p>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
