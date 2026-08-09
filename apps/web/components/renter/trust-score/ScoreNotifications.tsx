'use client';

import { Bell, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const notifications = [
  {
    id: '1',
    type: 'success',
    message: 'Identity verification completed! +15 points',
    time: '2 hours ago',
  },
  {
    id: '2',
    type: 'info',
    message: 'Complete your phone verification for +10 points',
    time: '1 day ago',
  },
  {
    id: '3',
    type: 'warning',
    message: 'Your property verification is pending review',
    time: '3 days ago',
  },
];

export const ScoreNotifications = () => {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Score Updates</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Recent activity affecting your score</p>
      </div>

      <div className="divide-y divide-border">
        {notifications.map((notification) => (
          <div key={notification.id} className="p-3 hover:bg-secondary transition-colors">
            <div className="flex items-start gap-3">
              {notification.type === 'success' && (
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              )}
              {notification.type === 'info' && (
                <Clock className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              )}
              {notification.type === 'warning' && (
                <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
              )}
              <div>
                <p className="text-sm text-foreground">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-0.5">{notification.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
