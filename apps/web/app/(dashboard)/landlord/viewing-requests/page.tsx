'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck } from 'lucide-react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  EmptyState,
  PageErrorState,
  PageLoadingState,
  Pagination,
} from '@getrentos/ui';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { viewingRequestStatusBadges } from '@/lib/statusBadge';
import type { ViewingRequestStatus } from '@/types/landlord';
import { DateTimeField, isCompleteDateTime } from '@/components/shared/forms/DateTimeField';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'requested', label: 'Requested' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

const formatWhen = (iso?: string) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : null;

export default function LandlordViewingRequestsPage() {
  const queryClient = useQueryClient();
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'all' | ViewingRequestStatus>('all');
  const [confirmTarget, setConfirmTarget] = useState<{
    id: string;
    propertyName: string;
    renterName: string;
    preferredAt?: string;
  } | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');

  const query = useQuery({
    queryKey: [...landlordKeys.viewingRequests(status), { page, pageSize: PAGE_SIZE }],
    queryFn: () =>
      unwrap(
        landlordService.listViewingRequests({
          page,
          pageSize: PAGE_SIZE,
          status: status === 'all' ? undefined : status,
        })
      ),
  });

  const confirmMutation = useMutation({
    mutationFn: (iso: string) =>
      unwrap(landlordService.confirmViewingRequest(confirmTarget!.id, iso)),
    onSuccess: () => {
      setConfirmTarget(null);
      setScheduledAt('');
      void queryClient.invalidateQueries({ queryKey: landlordKeys.viewingRequests() });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.cancelViewingRequest(id)),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: landlordKeys.viewingRequests() }),
  });

  if (query.isLoading) return <PageLoadingState />;

  if (query.isError) {
    return (
      <PageErrorState
        title="Viewing requests are unavailable"
        description="We could not load the viewing requests for your properties. Please try again."
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    );
  }

  const { items, total } = query.data ?? { items: [], total: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Viewing requests</h1>
        <p className="text-muted-foreground mt-1">
          Renters who want to see a property before applying. Confirm a time or decline.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={status === f.value ? 'primary' : 'outline'}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No viewing requests"
          description="Requests to view your properties will appear here."
        />
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((viewing) => {
              const badge = viewingRequestStatusBadges[viewing.status];
              return (
                <li key={viewing.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-foreground">{viewing.renterName}</h2>
                      <p className="text-sm text-muted-foreground">{viewing.propertyName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Requested {formatWhen(viewing.requestedAt)}
                        {viewing.preferredAt && <> · asked for {formatWhen(viewing.preferredAt)}</>}
                      </p>
                    </div>
                    <Badge
                      variant={badge.variant}
                      icon={badge.icon && <badge.icon className="w-3 h-3" />}
                    >
                      {badge.label}
                    </Badge>
                  </div>
                  {viewing.notes && (
                    <p className="mt-2 text-xs text-muted-foreground">{viewing.notes}</p>
                  )}
                  {viewing.status === 'requested' && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="primary"
                        onClick={() => {
                          setConfirmTarget({
                            id: viewing.id,
                            propertyName: viewing.propertyName,
                            renterName: viewing.renterName,
                            preferredAt: viewing.preferredAt,
                          });
                          setScheduledAt('');
                        }}
                      >
                        Confirm time
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={cancelMutation.isPending}
                        onClick={() => cancelMutation.mutate(viewing.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                  {viewing.status === 'confirmed' && viewing.scheduledAt && (
                    <p className="mt-2 text-sm text-foreground">
                      Confirmed for {formatWhen(viewing.scheduledAt)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}

      <Dialog open={!!confirmTarget} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <DialogContent className="max-w-md">
          <div className="p-4 border-b border-border">
            <DialogTitle className="font-semibold text-foreground">Confirm viewing</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {confirmTarget?.propertyName}
            </DialogDescription>
          </div>

          <div className="p-4 space-y-4">
            {confirmTarget?.renterName && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{confirmTarget.renterName}</span>
                {confirmTarget.preferredAt && (
                  <> asked for {formatWhen(confirmTarget.preferredAt)}</>
                )}
              </p>
            )}

            <DateTimeField
              label="Scheduled time"
              value={scheduledAt}
              onChange={setScheduledAt}
              requireFuture
            />

            {confirmMutation.isError && (
              <p className="text-xs text-red-500">
                Could not confirm the viewing. Please try again.
              </p>
            )}
          </div>

          <div className="p-4 border-t border-border flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!isCompleteDateTime(scheduledAt) || confirmMutation.isPending}
              onClick={() => confirmMutation.mutate(new Date(scheduledAt).toISOString())}
            >
              {confirmMutation.isPending ? 'Confirming…' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
