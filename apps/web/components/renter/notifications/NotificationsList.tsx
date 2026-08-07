'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BellOff } from 'lucide-react';
import { NotificationCard } from './NotificationCard';

interface Notification {
  id: string;
  type: 'application' | 'message' | 'payment' | 'maintenance' | 'lease' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  action?: {
    label: string;
    url: string;
  };
}

interface NotificationsListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export const NotificationsList = ({
  notifications,
  onMarkAsRead,
  onDelete,
}: NotificationsListProps) => {
  if (notifications.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 p-12 text-center">
        <BellOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No notifications</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {notifications.length === 0 ? "You're all caught up!" : 'Try adjusting your filters'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="divide-y divide-gray-200 dark:divide-white/10">
        <AnimatePresence>
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.03 }}
            >
              <NotificationCard
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
