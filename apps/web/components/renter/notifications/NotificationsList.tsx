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
      <div className="bg-card rounded-xl border border-border p-12 text-center">
        <BellOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground">No notifications</h3>
        <p className="text-muted-foreground mt-2">
          {notifications.length === 0 ? "You're all caught up!" : 'Try adjusting your filters'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="divide-y divide-border">
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
