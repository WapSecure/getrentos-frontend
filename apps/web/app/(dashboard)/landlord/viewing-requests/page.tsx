'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck } from '@sureground/icons';
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  EmptyState,
  PageErrorState,
  Pagination,
  Alert,
  ListSkeleton,
  Skeleton,
  useToast,
  PageHeader,
} from '@sureground/ui';
import { landlordService } from '@/services/landlordService';
import { VideoCallButton } from '@/components/shared/VideoCallButton';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { viewingRequestStatusBadges } from '@/lib/statusBadge';
import type { ViewingRequestStatus } from '@/types/landlord';
import { DateTimeField, isCompleteDateTime } from '@/components/shared/forms/DateTimeField';
import { LandlordLettingsNav } from '@/components/shared/navigation/WorkflowNavs';
import { preferredSlotValue } from '@/lib/viewingPrefill';
import { viewingCancelCopy, type ViewingCancelTarget } from '@/lib/viewingCancel';

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
  const [cancelTarget, setCancelTarget] = useState<(ViewingCancelTarget & { id: string }) | null>(
    null
  );
  const cancelCopy = cancelTarget ? viewingCancelCopy(cancelTarget) : null;

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
    placeholderData: keepPreviousData,
  });

  const toast = useToast();
  const [openedAt] = useState(() => Date.now());
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
    mutationFn: (target: ViewingCancelTarget & { id: string }) =>
      unwrap(landlordService.cancelViewingRequest(target.id)),
    onSuccess: (_data, target) => {
      setCancelTarget(null);
      toast.success(viewingCancelCopy(target).success);
      void queryClient.invalidateQueries({ queryKey: landlordKeys.viewingRequests() });
    },
    onError: (error: Error) => toast.error(error.message || 'Could not cancel this viewing.'),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.completeViewingRequest(id)),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: landlordKeys.viewingRequests() }),
    onError: (error: Error) => toast.error(error.message || 'Could not mark this viewing done.'),
  });

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <ListSkeleton rows={5} label="Loading viewing requests" />
      </div>
    );
  }

  if (query.isError && !query.data) {
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
      <PageHeader
        title="Viewing requests"
        description="Renters who want to see a property before applying. Confirm a time or decline."
      />
      <LandlordLettingsNav />

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
                      <p className="text-sm text-muted-foreground">
                        {viewing.propertyName}
                        {viewing.mode === 'video' && ' · Video call'}
                      </p>
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
                          // Start from the renter's requested slot; the landlord can still change it.
                          setScheduledAt(preferredSlotValue(viewing.preferredAt));
                        }}
                      >
                        Confirm time
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={cancelMutation.isPending}
                        onClick={() => setCancelTarget(viewing)}
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
                  {viewing.status === 'confirmed' && (
                    <div className="mt-3 flex gap-2">
                      {viewing.scheduledAt && new Date(viewing.scheduledAt).getTime() < openedAt ? (
                        <Button
                          variant="outline"
                          disabled={completeMutation.isPending}
                          isLoading={
                            completeMutation.isPending && completeMutation.variables === viewing.id
                          }
                          onClick={() => completeMutation.mutate(viewing.id)}
                        >
                          Mark as done
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          disabled={cancelMutation.isPending}
                          onClick={() => setCancelTarget(viewing)}
                        >
                          Cancel viewing
                        </Button>
                      )}
                    </div>
                  )}
                  <div className="mt-2">
                    <VideoCallButton
                      viewing={viewing}
                      label="Start video call"
                      join={() => landlordService.joinVideoCall(viewing.id)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open && !cancelMutation.isPending) setCancelTarget(null);
        }}
        title={cancelCopy?.title ?? ''}
        description={cancelCopy?.description ?? ''}
        confirmLabel={cancelCopy?.confirmLabel}
        onConfirm={() => cancelTarget && cancelMutation.mutateAsync(cancelTarget)}
        isLoading={cancelMutation.isPending}
      />

      <Dialog open={!!confirmTarget} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <DialogContent className="max-w-md p-0">
          <div className="p-4 border-b border-border">
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Confirm viewing
            </DialogTitle>
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
              <Alert variant="danger">Could not confirm the viewing. Please try again.</Alert>
            )}
          </div>

          <div className="p-4 border-t border-border flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!isCompleteDateTime(scheduledAt)}
              isLoading={confirmMutation.isPending}
              loadingText="Confirming…"
              onClick={() => confirmMutation.mutate(new Date(scheduledAt).toISOString())}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
