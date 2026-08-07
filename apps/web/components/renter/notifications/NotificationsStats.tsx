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
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  message: {
    icon: MessageCircle,
    label: 'Messages',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
  payment: {
    icon: CreditCard,
    label: 'Payments',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  maintenance: {
    icon: Wrench,
    label: 'Maintenance',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
  },
  lease: {
    icon: FileCheck,
    label: 'Lease',
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
  },
  system: {
    icon: AlertCircle,
    label: 'System',
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-800',
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
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: Bell,
      label: 'Unread',
      value: unreadCount,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      icon: Bell,
      label: 'Read',
      value: readCount,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`${stat.bg} rounded-xl p-4 border border-gray-200 dark:border-white/10`}
        >
          <div className="flex items-center gap-2">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</span>
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
                className={`${config.bg} rounded-xl p-3 border border-gray-200 dark:border-white/10 flex items-center gap-2`}
              >
                <Icon className={`w-4 h-4 ${config.color}`} />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{config.label}</p>
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
