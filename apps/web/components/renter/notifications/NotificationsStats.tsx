'use client';

import {
  Bell,
  MessageCircle,
  FileText,
  CreditCard,
  Wrench,
  FileCheck,
  AlertCircle,
} from 'lucide-react';

interface Notification {
  type: string;
  read: boolean;
}

interface NotificationsStatsProps {
  notifications: Notification[];
  unreadCount: number;
}

const typeConfig: Record<
  string,
  { icon: React.ElementType; label: string; color: string; bg: string }
> = {
  application: {
    icon: FileText,
    label: 'Applications',
    color: 'text-info',
    bg: 'bg-info-subtle',
  },
  message: {
    icon: MessageCircle,
    label: 'Messages',
    color: 'text-purple',
    bg: 'bg-purple-subtle',
  },
  payment: {
    icon: CreditCard,
    label: 'Payments',
    color: 'text-success',
    bg: 'bg-success-subtle',
  },
  maintenance: {
    icon: Wrench,
    label: 'Maintenance',
    color: 'text-warning',
    bg: 'bg-warning-subtle',
  },
  lease: {
    icon: FileCheck,
    label: 'Lease',
    color: 'text-info',
    bg: 'bg-info-subtle',
  },
  system: {
    icon: AlertCircle,
    label: 'System',
    color: 'text-muted-foreground',
    bg: 'bg-secondary',
  },
};

export const NotificationsStats = ({ notifications, unreadCount }: NotificationsStatsProps) => {
  const total = notifications.length;
  const readCount = notifications.filter((n) => n.read).length;

  // Calculate type counts
  const typeCounts = notifications.reduce(
    (acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Get top 3 notification types
  const sortedTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const stats = [
    {
      icon: Bell,
      label: 'Total',
      value: total,
      color: 'text-info',
      bg: 'bg-info-subtle',
    },
    {
      icon: Bell,
      label: 'Unread',
      value: unreadCount,
      color: 'text-destructive',
      bg: 'bg-destructive-subtle',
    },
    {
      icon: Bell,
      label: 'Read',
      value: readCount,
      color: 'text-success',
      bg: 'bg-success-subtle',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-border`}>
          <div className="flex items-center gap-2">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <p className={`text-lg font-bold ${stat.color} mt-1`}>{stat.value}</p>
        </div>
      ))}

      {sortedTypes.length > 0 && (
        <div className="col-span-3 grid grid-cols-3 gap-4">
          {sortedTypes.map(([type, count]) => {
            const config = typeConfig[type];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <div
                key={type}
                className={`${config.bg} rounded-xl p-3 border border-border flex items-center gap-2`}
              >
                <Icon className={`w-4 h-4 ${config.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                  <p className={`text-sm font-bold ${config.color}`}>{count}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
