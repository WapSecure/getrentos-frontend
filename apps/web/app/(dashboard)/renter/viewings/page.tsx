'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { CalendarCheck } from 'lucide-react';
import { Badge, EmptyState, PageErrorState, PageLoadingState, Button } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { viewingRequestStatusBadges } from '@/lib/statusBadge';
import { ROUTES } from '@/lib/constants/auth';
import { RenterPageHeader } from '@/components/renter/shared/RenterPageHeader';

const formatWhen = (iso?: string) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : null;

export default function RenterViewingsPage() {
  const router = useRouter();
  const query = useQuery({
    queryKey: renterKeys.viewings,
    queryFn: () => unwrap(renterService.listViewingRequests()),
  });

  if (query.isLoading) return <PageLoadingState />;

  if (query.isError) {
    return (
      <PageErrorState
        title="Viewings are unavailable"
        description="We could not load your viewing requests. Please try again."
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    );
  }

  const viewings = query.data ?? [];

  return (
    <div className="space-y-6">
      <RenterPageHeader
        eyebrow="Property search"
        icon={CalendarCheck}
        title="Viewing requests"
        description="Track every home you have asked to see and the times confirmed by the property owner."
        actions={
          <Button variant="primary" onClick={() => router.push(ROUTES.RENTER_DISCOVER)}>
            Browse homes
          </Button>
        }
      />

      {viewings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No viewing requests yet"
          description="When you ask to view a home, it shows up here so you can track whether the landlord has confirmed a time."
          action={
            <Button variant="primary" onClick={() => router.push(ROUTES.RENTER_DISCOVER)}>
              Browse homes
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {viewings.map((viewing) => {
            const badge = viewingRequestStatusBadges[viewing.status];
            return (
              <li
                key={viewing.id}
                className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-foreground">{viewing.propertyName}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Requested {formatWhen(viewing.requestedAt)}
                    </p>
                  </div>
                  <Badge
                    variant={badge.variant}
                    icon={badge.icon && <badge.icon className="w-3 h-3" />}
                  >
                    {badge.label}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {viewing.preferredAt ? (
                    <>
                      You asked for{' '}
                      <span className="text-foreground">{formatWhen(viewing.preferredAt)}</span>
                    </>
                  ) : (
                    'No particular time requested'
                  )}
                  {viewing.scheduledAt && (
                    <>
                      {' '}
                      · confirmed for{' '}
                      <span className="text-foreground">{formatWhen(viewing.scheduledAt)}</span>
                    </>
                  )}
                </p>
                {viewing.notes && (
                  <p className="mt-2 text-xs text-muted-foreground">{viewing.notes}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
