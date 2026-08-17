'use client';

import { ShieldCheck, Gavel, AlertTriangle, UserPlus, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatRelativeTime } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';

type ActivityType = 'verification' | 'dispute' | 'fraud' | 'signup';

const typeConfig: Record<ActivityType, { icon: React.ElementType; bg: string; color: string }> = {
  verification: { icon: ShieldCheck, bg: 'bg-accent', color: 'text-primary' },
  dispute: {
    icon: Gavel,
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    color: 'text-orange-600 dark:text-orange-400',
  },
  fraud: {
    icon: AlertTriangle,
    bg: 'bg-red-50 dark:bg-red-950/20',
    color: 'text-red-600 dark:text-red-400',
  },
  signup: {
    icon: UserPlus,
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    color: 'text-blue-600 dark:text-blue-400',
  },
};

const typeFor = (type: string): ActivityType => {
  switch (type) {
    case 'verification':
      return 'verification';
    case 'dispute':
      return 'dispute';
    case 'fraud':
      return 'fraud';
    case 'user':
      return 'signup';
    default:
      return 'verification';
  }
};

export const AdminActivityFeed = () => {
  const { data: activity = [] } = useQuery({
    queryKey: adminKeys.dashboardActivity,
    queryFn: () => unwrap(adminService.getDashboardActivity()),
  });

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Verifications, disputes, fraud alerts, and signups
        </p>
      </div>

      <div className="divide-y divide-border">
        {activity.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-secondary flex items-center justify-center">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          activity.map((item) => {
            const config = typeConfig[typeFor(item.type)];
            const Icon = config.icon;
            return (
              <div
                key={item.id}
                className="p-4 flex items-start gap-3 hover:bg-secondary transition-colors"
              >
                <div className={`p-2 rounded-lg ${config.bg} shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(item.timestamp)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
