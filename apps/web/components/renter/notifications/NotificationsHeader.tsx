'use client';

import { Bell, BellOff, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { RenterPageHeader } from '../shared/RenterPageHeader';

interface NotificationsHeaderProps {
  unreadCount: number;
  totalCount: number;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export const NotificationsHeader = ({
  unreadCount,
  totalCount,
  onMarkAllAsRead,
  onClearAll,
}: NotificationsHeaderProps) => {
  return (
    <RenterPageHeader
      eyebrow="Activity centre"
      icon={Bell}
      title="Notifications"
      description="Stay current on applications, payments, messages, viewings, and your home."
      actions={
        <>
          {unreadCount > 0 && (
            <Button variant="outline" className="gap-2" size="sm" onClick={onMarkAllAsRead}>
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </Button>
          )}
          {totalCount > 0 && (
            <Button
              variant="ghost"
              className="gap-2 text-destructive hover:text-destructive"
              size="sm"
              onClick={onClearAll}
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </>
      }
    >
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
            {unreadCount > 0 ? (
              <Bell className="w-5 h-5 text-blue-600" />
            ) : (
              <BellOff className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
            <p className="text-xs text-muted-foreground">{totalCount} total notifications</p>
          </div>
        </div>
      </div>
    </RenterPageHeader>
  );
};
