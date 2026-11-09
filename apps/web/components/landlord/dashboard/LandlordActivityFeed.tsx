'use client';

import { CreditCard, Wrench, CalendarClock, UserPlus, ReceiptText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, EmptyState, Skeleton } from '@sureground/ui';
import { formatRelativeTime } from '@/lib/format';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';

type ActivityType = 'payment' | 'maintenance' | 'lease' | 'application' | 'expense';

const typeConfig: Record<ActivityType, React.ElementType> = {
  payment: CreditCard,
  maintenance: Wrench,
  lease: CalendarClock,
  application: UserPlus,
  expense: ReceiptText,
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
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-base font-semibold tracking-[-0.015em] text-foreground">
          Recent activity
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Payments, maintenance, and lease updates
        </p>
      </div>

      <div className="divide-y divide-border">
        {isPending ? (
          <div role="status" aria-label="Loading">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-start gap-3 px-6 py-4">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
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
            const Icon = typeConfig[typeFor(item.type)];
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 px-6 py-4 transition-colors hover:bg-secondary/60"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <Icon className="h-4 w-4" aria-hidden="true" />
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
