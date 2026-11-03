'use client';

import { CreditCard, Wrench, CalendarClock, UserPlus, ReceiptText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, EmptyState, Skeleton } from '@getrentos/ui';
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
    icon: ReceiptText,
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
  const { data: activity = [], isPending } = useQuery({
    queryKey: landlordKeys.dashboardActivity,
    queryFn: () => unwrap(landlordService.getDashboardActivity()),
  });

  return (
    <Card>
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Payments, maintenance, and lease updates
        </p>
      </div>

      <div className="divide-y divide-border">
        {isPending ? (
          <div role="status" aria-label="Loading">
            {[0, 1, 2].map((row) => (
              <div key={row} className="p-4 flex items-start gap-3">
                <Skeleton className="h-8 w-8 shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <EmptyState icon={CreditCard} title="No activity yet" size="compact" bare />
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
    </Card>
  );
};
