'use client';

import { ShieldCheck, Gavel, AlertTriangle, UserPlus, Bell } from '@sureground/icons';
import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { formatRelativeTime } from '@sureground/shared';
import { adminService } from '@/services/adminService';
import { unwrap } from '@sureground/shared';
import { adminKeys } from '@/lib/queryKeys';
import { readableActivityDescription } from '@/lib/fraudAlertText';
import { Button, EmptyState, ListSkeleton, PageErrorState } from '@sureground/ui';

type ActivityType = 'verification' | 'dispute' | 'fraud' | 'signup';

const typeConfig: Record<ActivityType, { icon: React.ElementType; bg: string; color: string }> = {
  verification: { icon: ShieldCheck, bg: 'bg-primary/10', color: 'text-primary' },
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

// Six recent events keep the dashboard a glance; staff load older ones on request.
const PAGE = 6;
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
    // This screen shows its own error and retry, so a failure must not escalate to the route error boundary.
    throwOnError: false,
  });
  const canShowMore = (activity?.length ?? 0) >= limit && limit < MAX;

  return (
    <section
      aria-labelledby="admin-activity-title"
      className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
    >
      <div className="border-b border-border px-5 py-3">
        <h3
          id="admin-activity-title"
          className="text-sm font-semibold tracking-[-0.01em] text-foreground"
        >
          Recent activity
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
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
            const description = readableActivityDescription(item.type, item.description);
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-secondary/40"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
                >
                  <Icon className={`h-4 w-4 ${config.color}`} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground" title={description}>
                    {description}
                  </p>
                </div>
                <time
                  dateTime={item.timestamp}
                  className="shrink-0 text-xs text-muted-foreground tabular-nums"
                >
                  {formatRelativeTime(item.timestamp)}
                </time>
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
    </section>
  );
};
