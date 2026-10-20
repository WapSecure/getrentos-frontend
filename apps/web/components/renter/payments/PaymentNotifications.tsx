'use client';

import { Bell, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import {
  Button,
  EmptyState,
  IconButton,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from '@getrentos/ui';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

interface PaymentNotificationsProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export const PaymentNotifications = ({
  notifications,
  onMarkAsRead,
  onClearAll,
}: PaymentNotificationsProps) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      case 'warning':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-success bg-success-subtle';
      case 'error':
        return 'text-destructive bg-destructive-subtle';
      case 'warning':
        return 'text-warning bg-warning-subtle';
      default:
        return 'text-info bg-info-subtle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Popover>
      <div className="relative">
        <PopoverTrigger asChild>
          <IconButton
            label={
              unreadCount > 0 ? `Payment notifications, ${unreadCount} unread` : 'Payment notifications'
            }
            icon={<Bell aria-hidden="true" />}
          />
        </PopoverTrigger>
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full"
          />
        )}
      </div>

      <PopoverContent aria-label="Payment notifications" layout="sections">
        <PopoverHeader>
          <div>
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          </div>
          {unreadCount > 0 && (
            <Button size="xs" variant="ghost" className="text-primary" onClick={onClearAll}>
              Clear all
            </Button>
          )}
        </PopoverHeader>

        <PopoverBody className="divide-y divide-border">
          {notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" size="compact" bare />
          ) : (
            notifications.map((notification) => {
              const Icon = getIcon(notification.type);
              const color = getColor(notification.type);

              return (
                <button
                  type="button"
                  key={notification.id}
                  className={`block w-full text-left p-3 hover:bg-secondary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                    !notification.read ? 'bg-info-subtle/50' : ''
                  }`}
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-lg ${color} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(notification.date)}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-info rounded-full mt-2 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};
