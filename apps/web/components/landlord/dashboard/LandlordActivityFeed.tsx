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
    bg: 'bg-success-subtle',
    color: 'text-success',
  },
  maintenance: {
    icon: Wrench,
    bg: 'bg-purple-subtle',
    color: 'text-purple',
  },
  lease: {
    icon: CalendarClock,
    bg: 'bg-warning-subtle',
    color: 'text-warning',
  },
  application: {
    icon: UserPlus,
    bg: 'bg-info-subtle',
    color: 'text-info',
  },
  expense: {
    icon: Receipt,
    bg: 'bg-destructive/10',
    color: 'text-destructive',
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(item.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
