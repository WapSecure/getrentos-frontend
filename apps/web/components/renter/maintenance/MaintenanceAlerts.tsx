'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, Check, AlertCircle, Clock, Wrench, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Alert {
  id: string;
  type: 'status_update' | 'vendor_assigned' | 'sla_breach' | 'scheduled';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

interface MaintenanceAlertsProps {
  alerts: Alert[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

const alertIcons = {
  status_update: { icon: Wrench, color: 'text-blue-500' },
  vendor_assigned: { icon: User, color: 'text-purple-500' },
  sla_breach: { icon: AlertCircle, color: 'text-red-500' },
  scheduled: { icon: Clock, color: 'text-green-500' },
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

export const MaintenanceAlerts = ({ alerts, onMarkAsRead, onClearAll }: MaintenanceAlertsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = alerts.filter((a) => !a.read).length;

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
                <h3 className="font-semibold text-foreground">Maintenance Alerts</h3>
                <p className="text-xs text-gray-500">{unreadCount} unread</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-xs text-primary hover:text-primary-hover"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
              {alerts.length === 0 ? (
                <div className="p-4 text-center">
                  <BellOff className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No alerts</p>
                </div>
              ) : (
                alerts.map((alert) => {
                  const config = alertIcons[alert.type];
                  const Icon = config.icon;

                  return (
                    <div
                      key={alert.id}
                      className={`p-3 hover:bg-secondary transition-colors cursor-pointer ${
                        !alert.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      }`}
                      onClick={() => onMarkAsRead(alert.id)}
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg bg-secondary`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{alert.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(alert.date)}</p>
                        </div>
                        {!alert.read && (
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
