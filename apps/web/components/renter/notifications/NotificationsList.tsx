'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BellOff } from 'lucide-react';
import { Card, EmptyState } from '@getrentos/ui';
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
      <EmptyState
        icon={BellOff}
        title="No notifications"
        description={
          notifications.length === 0 ? "You're all caught up!" : 'Try adjusting your filters'
        }
      />
    );
  }

  return (
    <Card>
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
    </Card>
  );
};
