'use client';

import { ShieldCheck, Gavel, AlertTriangle, UserPlus, Bell } from 'lucide-react';
import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { formatRelativeTime } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { Button, EmptyState, ListSkeleton, PageErrorState } from '@getrentos/ui';

type ActivityType = 'verification' | 'dispute' | 'fraud' | 'signup';

const typeConfig: Record<ActivityType, { icon: React.ElementType; bg: string; color: string }> = {
  verification: { icon: ShieldCheck, bg: 'bg-accent', color: 'text-primary' },
  dispute: { icon: Gavel, bg: 'bg-warning-subtle', color: 'text-warning' },
  fraud: { icon: AlertTriangle, bg: 'bg-destructive-subtle', color: 'text-destructive' },
  signup: { icon: UserPlus, bg: 'bg-info-subtle', color: 'text-info' },
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

const PAGE = 12;
/** The API returns at most this many events. */
const MAX = 48;

export const AdminActivityFeed = () => {
  const [limit, setLimit] = useState(PAGE);
  const {
    data: activity,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [...adminKeys.dashboardActivity, limit],
    queryFn: () => unwrap(adminService.getDashboardActivity(limit)),
    placeholderData: keepPreviousData,
    // This screen shows its own error and retry in place, so a failure must
    // not escalate to the route error boundary and take the page with it.
    throwOnError: false,
  });
  // A full page back means there may be older events to show.
  const canShowMore = (activity?.length ?? 0) >= limit && limit < MAX;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Verifications, disputes, fraud alerts, and signups
        </p>
      </div>

      <div className="divide-y divide-border">
        {isLoading ? (
          <ListSkeleton label="Loading recent activity" className="rounded-none border-0" />
        ) : isError && !activity ? (
          <PageErrorState
            title="Recent activity could not be loaded"
            onRetry={() => void refetch()}
            isRetrying={isFetching}
            headingLevel="h2"
            className="min-h-0 border-0 py-10"
          />
        ) : !activity || activity.length === 0 ? (
          <EmptyState icon={Bell} title="No activity yet" size="compact" bare />
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
      {canShowMore && (
        <div className="border-t border-border p-3 text-center">
          <Button
            variant="ghost"
            size="sm"
            isLoading={isFetching}
            onClick={() => setLimit((current) => Math.min(current + PAGE, MAX))}
          >
            Show older activity
          </Button>
        </div>
      )}
    </div>
  );
};
