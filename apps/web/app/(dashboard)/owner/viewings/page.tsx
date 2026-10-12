'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck } from 'lucide-react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  PageErrorState,
  PageLoadingState,
  Pagination,
} from '@getrentos/ui';
import { ownerService, type OwnerViewing } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import { viewingRequestStatusBadges } from '@/lib/statusBadge';
import { DateTimeField, isCompleteDateTime } from '@/components/shared/forms/DateTimeField';
import { VideoCallButton } from '@/components/shared/VideoCallButton';

const FILTERS = [
  { value: 'requested', label: 'To confirm' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'all', label: 'All' },
] as const;

const PAGE_SIZE = 20;

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** The API calls a request "pending"; the badges call it "requested". */
const badgeFor = (status: OwnerViewing['status']) =>
  viewingRequestStatusBadges[status === 'pending' ? 'requested' : status];

export default function OwnerViewingsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('requested');
  const [rescheduling, setRescheduling] = useState<OwnerViewing | null>(null);
  const [newTime, setNewTime] = useState('');
  // When the page opened; close enough to "now" for offering "Mark as done".
  const [openedAt] = useState(() => Date.now());

  const query = useQuery({
    queryKey: [...ownerKeys.viewings, { filter, page }],
    queryFn: () =>
      unwrap(
        ownerService.listViewings({
          status: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ownerKeys.viewings });

  const confirm = useMutation({
    mutationFn: ({ id, at }: { id: string; at?: string }) =>
      unwrap(ownerService.confirmViewing(id, at)),
    onSuccess: () => {
      setRescheduling(null);
      setNewTime('');
      refresh();
    },
  });
  const decline = useMutation({
    mutationFn: (id: string) => unwrap(ownerService.declineViewing(id)),
    onSuccess: refresh,
  });
  const complete = useMutation({
    mutationFn: (id: string) => unwrap(ownerService.completeViewing(id)),
    onSuccess: refresh,
  });

  if (query.isLoading) return <PageLoadingState />;
  if (query.isError) {
    return (
      <PageErrorState
        title="Viewings are unavailable"
        description="We could not load buyers' viewing requests. Please try again."
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    );
  }

  const { items, total } = query.data ?? { items: [], total: 0 };
  const failed = confirm.error ?? decline.error ?? complete.error;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Viewings</h1>
        <p className="text-muted-foreground mt-1">
          Buyers who want to see a property you are selling. Confirm their time, offer another, or
          decline.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'primary' : 'outline'}
            onClick={() => {
              setFilter(f.value);
              setPage(1);
            }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {failed && (
        <p className="text-sm text-destructive">
          {failed instanceof Error ? failed.message : 'That did not work. Please try again.'}
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={filter === 'requested' ? 'Nothing to confirm' : 'No viewings'}
          description="When buyers ask to view a property you are selling, their requests show up here."
        />
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((viewing) => {
              const badge = badgeFor(viewing.status);
              const past = new Date(viewing.scheduledAt).getTime() < openedAt;
              return (
                <li key={viewing.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-foreground">{viewing.buyerName}</h2>
                      <p className="text-sm text-muted-foreground">
                        {viewing.propertyName}
                        {viewing.mode === 'video' && ' · Video call'}
                      </p>
                      <p className="text-sm text-foreground mt-1">
                        {viewing.status === 'pending' ? 'Asked for ' : ''}
                        {formatWhen(viewing.scheduledAt)}
                        {viewing.status === 'pending' && past && (
                          <span className="text-muted-foreground"> (passed)</span>
                        )}
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

                  {viewing.status === 'pending' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {/* A time already gone can't be confirmed; offer another. */}
                      {!past && (
                        <Button
                          variant="primary"
                          disabled={confirm.isPending}
                          onClick={() => confirm.mutate({ id: viewing.id })}
                        >
                          Confirm this time
                        </Button>
                      )}
                      <Button
                        variant={past ? 'primary' : 'outline'}
                        onClick={() => {
                          setRescheduling(viewing);
                          setNewTime('');
                        }}
                      >
                        Offer another time
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={decline.isPending}
                        onClick={() => decline.mutate(viewing.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                  {viewing.status === 'confirmed' && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <VideoCallButton
                        viewing={viewing}
                        label="Start video call"
                        join={() => ownerService.joinViewingCall(viewing.id)}
                      />
                      {past && (
                        <Button
                          variant="ghost"
                          disabled={complete.isPending}
                          onClick={() => complete.mutate(viewing.id)}
                        >
                          Mark as done
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}

      <Dialog open={!!rescheduling} onOpenChange={(open) => !open && setRescheduling(null)}>
        <DialogContent className="max-w-md p-0">
          <div className="p-4 border-b border-border">
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Offer another time
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {rescheduling?.propertyName}
            </DialogDescription>
          </div>
          <div className="p-4 space-y-4">
            {rescheduling && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{rescheduling.buyerName}</span> asked
                for {formatWhen(rescheduling.scheduledAt)}. The viewing is confirmed at the time you
                choose.
              </p>
            )}
            <DateTimeField label="New time" value={newTime} onChange={setNewTime} requireFuture />
          </div>
          <div className="p-4 border-t border-border flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRescheduling(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!isCompleteDateTime(newTime) || confirm.isPending}
              onClick={() =>
                rescheduling &&
                confirm.mutate({ id: rescheduling.id, at: new Date(newTime).toISOString() })
              }
            >
              Confirm new time
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
