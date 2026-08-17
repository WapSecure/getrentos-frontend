'use client';

import { CreditCard, Wrench, CalendarClock, UserPlus, Receipt } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatRelativeTime } from '@/lib/format';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';

type ActivityType = 'payment' | 'maintenance' | 'lease' | 'application' | 'expense';

const typeConfig: Record<ActivityType, { icon: React.ElementType; bg: string; color: string }> = {
  payment: {
    icon: CreditCard,
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  maintenance: {
    icon: Wrench,
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    color: 'text-purple-600 dark:text-purple-400',
  },
  lease: {
    icon: CalendarClock,
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    color: 'text-orange-600 dark:text-orange-400',
  },
  application: {
    icon: UserPlus,
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    color: 'text-blue-600 dark:text-blue-400',
  },
  expense: {
    icon: Receipt,
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    color: 'text-rose-600 dark:text-rose-400',
  },
};

const typeFor = (type: string): ActivityType => {
  switch (type) {
    case 'payment':
      return 'payment';
    case 'maintenance':
      return 'maintenance';
    case 'lease':
      return 'lease';
    case 'application':
      return 'application';
    case 'expense':
      return 'expense';
    default:
      return 'payment';
  }
};

export const LandlordActivityFeed = () => {
  const { data: activity = [] } = useQuery({
    queryKey: landlordKeys.dashboardActivity,
    queryFn: () => unwrap(landlordService.getDashboardActivity()),
  });

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Payments, maintenance, and lease updates
        </p>
      </div>

      <div className="divide-y divide-border">
        {activity.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-secondary flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
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
