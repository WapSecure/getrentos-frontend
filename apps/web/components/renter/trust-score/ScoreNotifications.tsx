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
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#c4a747]" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Score Updates</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Recent activity affecting your score
        </p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-white/10">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-start gap-3">
              {notification.type === 'success' && (
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              )}
              {notification.type === 'info' && (
                <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              )}
              {notification.type === 'warning' && (
                <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-0.5">{notification.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
