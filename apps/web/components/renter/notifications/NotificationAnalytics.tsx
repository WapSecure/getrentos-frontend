'use client';

import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Notification {
  read: boolean;
  createdAt: string;
}

interface NotificationAnalyticsProps {
  notifications: Notification[];
}

export const NotificationAnalytics = ({ notifications }: NotificationAnalyticsProps) => {
  const total = notifications.length;
  const readCount = notifications.filter((n) => n.read).length;
  const unreadCount = total - readCount;
  const readRate = total > 0 ? Math.round((readCount / total) * 100) : 0;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Notification Analytics</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Your notification engagement</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-secondary">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-success" />
              <span className="text-xs text-muted-foreground">Read Rate</span>
            </div>
            <p className="text-lg font-bold text-foreground">{readRate}%</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-info" />
              <span className="text-xs text-muted-foreground">Unread</span>
            </div>
            <p className="text-lg font-bold text-foreground">{unreadCount}</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-secondary">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Read</span>
            <span className="font-medium text-foreground">{readCount}</span>
          </div>
          <div className="h-2 bg-muted rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${readRate}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Unread: {unreadCount}</span>
            <span>{readRate}%</span>
          </div>
        </div>

        {unreadCount > 0 && (
          <div className="p-2 rounded-lg bg-warning-subtle border border-warning/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
              <p className="text-xs text-warning">
                You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}. Stay
                informed!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
