'use client';

import { Bell, BellOff, AlertCircle, Clock, Wrench, User } from 'lucide-react';
import {
  Button,
  EmptyState,
  IconButton,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from '@getrentos/ui';

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
  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <Popover>
      <div className="relative">
        <PopoverTrigger asChild>
          <IconButton
            label={unreadCount > 0 ? `Maintenance alerts, ${unreadCount} unread` : 'Maintenance alerts'}
            icon={<Bell />}
          />
        </PopoverTrigger>
        {unreadCount > 0 && (
          <span className="pointer-events-none absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        )}
      </div>

      <PopoverContent aria-label="Maintenance alerts" layout="sections">
        <PopoverHeader>
          <div>
            <h3 className="font-semibold text-foreground">Maintenance Alerts</h3>
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="xs" onClick={onClearAll}>
              Mark all read
            </Button>
          )}
        </PopoverHeader>

        <PopoverBody className="divide-y divide-border">
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
                  className={`block w-full p-3 text-left hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
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
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(alert.date)}
                      </p>
                    </div>
                    {!alert.read && (
                      <span className="w-2 h-2 bg-info rounded-full mt-2 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};
