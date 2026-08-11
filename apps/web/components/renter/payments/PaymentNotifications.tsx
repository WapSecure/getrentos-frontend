'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, AlertCircle, Clock, CreditCard } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
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
        return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 bg-card rounded-xl shadow-lg border border-border z-50"
          >
            <div className="p-3 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Notifications</h3>
                <p className="text-xs text-gray-500">{unreadCount} unread</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-xs text-primary hover:text-primary-hover"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.length === 0 ? (
                <div className="p-4 text-center">
                  <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = getIcon(notification.type);
                  const color = getColor(notification.type);

                  return (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-secondary transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
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
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(notification.date)}
                          </p>
                        </div>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
