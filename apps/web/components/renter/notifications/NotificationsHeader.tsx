'use client';

import { Bell, BellOff, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Stay updated on your property journey
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button variant="outline" className="gap-2" size="sm" onClick={onMarkAllAsRead}>
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </Button>
          )}
          {totalCount > 0 && (
            <Button
              variant="ghost"
              className="gap-2 text-red-500 hover:text-red-700"
              size="sm"
              onClick={onClearAll}
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
            {unreadCount > 0 ? (
              <Bell className="w-5 h-5 text-blue-600" />
            ) : (
              <BellOff className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              {totalCount} total notifications
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
