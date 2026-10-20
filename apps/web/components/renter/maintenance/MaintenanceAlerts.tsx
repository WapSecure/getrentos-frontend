'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, AlertCircle, Clock, Wrench, User } from 'lucide-react';
import { Button, EmptyState, IconButton } from '@getrentos/ui';

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
  status_update: { icon: Wrench, color: 'text-info' },
  vendor_assigned: { icon: User, color: 'text-purple' },
  sla_breach: { icon: AlertCircle, color: 'text-destructive' },
  scheduled: { icon: Clock, color: 'text-success' },
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
      <IconButton
        label={unreadCount > 0 ? `Maintenance alerts, ${unreadCount} unread` : 'Maintenance alerts'}
        icon={<Bell />}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      />
      {unreadCount > 0 && (
        <span className="pointer-events-none absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-card rounded-xl shadow-lg border border-border z-50"
          >
            <div className="p-3 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Maintenance Alerts</h3>
                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
              </div>
              {unreadCount > 0 && (
                <Button variant="ghost" size="xs" onClick={onClearAll}>
                  Mark all read
                </Button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-border">
              {alerts.length === 0 ? (
                <EmptyState icon={BellOff} title="No alerts" size="compact" bare />
              ) : (
                alerts.map((alert) => {
                  const config = alertIcons[alert.type];
                  const Icon = config.icon;

                  return (
                    <button
                      type="button"
                      key={alert.id}
                      className={`block w-full p-3 text-left hover:bg-secondary transition-colors ${
                        !alert.read ? 'bg-info-subtle/50' : ''
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
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(alert.date)}</p>
                        </div>
                        {!alert.read && (
                          <span className="w-2 h-2 bg-info rounded-full mt-2 shrink-0" />
                        )}
                      </div>
                    </button>
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
