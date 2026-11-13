'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, Video } from '@sureground/icons';
import { Badge, EmptyState, PageErrorState, PageLoadingState, Button } from '@sureground/ui';
import { renterService } from '@/services/renterService';
import { VideoCallButton } from '@/components/shared/VideoCallButton';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { viewingRequestStatusBadges } from '@/lib/statusBadge';
import { ROUTES } from '@/lib/constants/auth';
import { RenterPageHeader } from '@/components/renter/shared/RenterPageHeader';
import {
  RecordFacts,
  RecordIconTile,
  recordCardClass,
  type RecordFact,
} from '@/components/shared/records/RecordParts';

const formatWhen = (iso?: string) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : null;

export default function RenterViewingsPage() {
  const query = useQuery({
    queryKey: renterKeys.viewings,
    queryFn: () => unwrap(renterService.listViewingRequests()),
  });

  if (query.isLoading) return <PageLoadingState />;

  if (query.isError && !query.data) {
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
        eyebrow="Renting"
        icon={CalendarCheck}
        title="Viewing requests"
        description="Track every home you have asked to see and the times confirmed by the property owner."
        actions={
          <Button variant="primary" href={ROUTES.RENTER_DISCOVER}>
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
            <Button variant="primary" href={ROUTES.RENTER_DISCOVER}>
              Browse homes
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {viewings.map((viewing) => {
            const badge = viewingRequestStatusBadges[viewing.status];
            const facts: RecordFact[] = [
              {
                label: 'You asked for',
                value: formatWhen(viewing.preferredAt) ?? 'No particular time requested',
              },
            ];
            if (viewing.scheduledAt) {
              facts.push({
                label: 'Confirmed for',
                value: formatWhen(viewing.scheduledAt),
                tone: 'brand',
              });
            }
            return (
              <li key={viewing.id} className={recordCardClass()}>
                <div className="flex items-start gap-3">
                  <RecordIconTile icon={viewing.mode === 'video' ? Video : CalendarCheck} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-foreground">
                      {viewing.propertyName}
                    </h2>
                    {viewing.mode === 'video' && (
                      <p className="text-xs font-medium text-primary">Live video viewing</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Requested {formatWhen(viewing.requestedAt)}
                    </p>
                  </div>
                  <Badge
                    variant={badge.variant}
                    icon={badge.icon && <badge.icon className="w-3 h-3" />}
                    className="shrink-0"
                  >
                    {badge.label}
                  </Badge>
                </div>
                <RecordFacts facts={facts} />
                {viewing.notes && (
                  <p className="mt-3 text-sm text-muted-foreground">{viewing.notes}</p>
                )}
                <div className="mt-3 empty:hidden">
                  <VideoCallButton
                    viewing={viewing}
                    join={() => renterService.joinVideoCall(viewing.id)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
