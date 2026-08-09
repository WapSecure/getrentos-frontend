'use client';

import { Bell } from 'lucide-react';

interface MessagesHeaderProps {
  unreadCount: number;
}

export const MessagesHeader = ({ unreadCount }: MessagesHeaderProps) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground mt-1">Communicate with landlords and agents</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border">
            <Bell className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{unreadCount}</span>
            <span className="text-xs text-gray-500">unread</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            All landlords are online
          </span>
          <span className="text-xs text-green-600 dark:text-green-400 ml-auto">
            Response time: ~5 min
          </span>
        </div>
      </div>
    </div>
  );
};
