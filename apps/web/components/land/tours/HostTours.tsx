'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, EmptyState, Input, PageErrorState, Textarea, Toast } from '@getrentos/ui';
import { Video } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import {
  lagosLocalToIso,
  landSiteTourKeys,
  landSiteTourService,
} from '@/services/landSiteTourService';
import type { LandSiteTour } from '@/types/landSiteTour';
import { TourCard } from './TourCard';

type Notify = (message: string, variant?: 'success' | 'error') => void;

const HostActions = ({ tour, notify }: { tour: LandSiteTour; notify: Notify }) => {
  const queryClient = useQueryClient();
  // Captured once at mount: render must not read the clock.
  const [now] = useState(() => Date.now());
  const [slots, setSlots] = useState(['', '', '']);
  const [link, setLink] = useState(tour.meetingUrl ?? '');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const done = (message: string) => () => {
    void queryClient.invalidateQueries({ queryKey: landSiteTourKeys.host });
    notify(message);
  };
  const fail = (e: Error) => notify(e.message, 'error');
  const isoSlots = slots
    .map((s) => (s ? lagosLocalToIso(s) : null))
    .filter((s): s is string => Boolean(s));
  const propose = useMutation({
    mutationFn: () => unwrap(landSiteTourService.propose(tour.id, isoSlots, link)),
    onSuccess: done('Times sent to the buyer, in their own time zone.'),
    onError: fail,
  });
  const complete = useMutation({
    mutationFn: () => unwrap(landSiteTourService.complete(tour.id, notes)),
    onSuccess: done('Tour recorded.'),
    onError: fail,
  });
  const cancel = useMutation({
    mutationFn: () => unwrap(landSiteTourService.cancel('owner', tour.id, reason)),
    onSuccess: done('Tour cancelled; the buyer was told.'),
    onError: fail,
  });
  const started = tour.scheduledAt ? now >= new Date(tour.scheduledAt).getTime() : false;

  return (
    <div className="mt-3 space-y-3">
      {(tour.status === 'REQUESTED' || tour.status === 'PROPOSED') && (
        <div className="space-y-2 rounded-xl border border-border p-3">
          <p className="text-sm font-medium text-foreground">
            {tour.status === 'PROPOSED' ? 'Offer different times' : 'Offer up to three times'}
          </p>
          <p className="text-xs text-muted-foreground">
            Lagos time, between 08:00 and 16:30 so there is daylight at the land. The buyer is in{' '}
            {tour.buyerTimeZone} and sees them in their own time.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {slots.map((value, index) => (
              <Input
                key={index}
                type="datetime-local"
                value={value}
                aria-label={`Time ${index + 1} (Lagos)`}
                onChange={(e) =>
                  setSlots((current) => current.map((s, i) => (i === index ? e.target.value : s)))
                }
              />
            ))}
          </div>
          <Input
            type="url"
            value={link}
            maxLength={500}
            onChange={(e) => setLink(e.target.value)}
            aria-label="Video call link"
            placeholder="https:// link to the video call"
          />
          <Button
            size="sm"
            disabled={isoSlots.length === 0 || !link.startsWith('https://') || propose.isPending}
            isLoading={propose.isPending}
            onClick={() => propose.mutate()}
          >
            Send times
          </Button>
        </div>
      )}
      {tour.status === 'PROPOSED' && (
        <ul className="text-sm text-muted-foreground">
          {tour.proposedSlots.map((s) => (
            <li key={s.at}>Offered: {s.local}</li>
          ))}
        </ul>
      )}
      {tour.status === 'SCHEDULED' && started && (
        <div className="space-y-2">
          <Textarea
            rows={3}
            maxLength={4000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            aria-label="What you showed"
            placeholder="What you showed (beacons, access road, neighbours) and anything the buyer asked"
          />
          <Button
            size="sm"
            disabled={notes.trim().length < 10 || complete.isPending}
            isLoading={complete.isPending}
            onClick={() => complete.mutate()}
          >
            Record the tour
          </Button>
        </div>
      )}
      {['REQUESTED', 'PROPOSED', 'SCHEDULED'].includes(tour.status) &&
        (cancelling ? (
          <div className="flex flex-wrap gap-2">
            <Input
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              aria-label="Why you are cancelling"
              placeholder="Why you are cancelling"
            />
            <Button
              size="sm"
              variant="danger"
              disabled={reason.trim().length < 3 || cancel.isPending}
              isLoading={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              Cancel tour
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setCancelling(true)}>
            Cancel
          </Button>
        ))}
      {tour.buyerRating && (
        <p className="text-sm text-muted-foreground">
          Buyer rated it {tour.buyerRating}/5{tour.buyerFeedback ? `: “${tour.buyerFeedback}”` : ''}
        </p>
      )}
    </div>
  );
};

/** Video tours buyers have asked the owner or developer for. */
export const HostTours = () => {
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );
  const list = useQuery({
    queryKey: landSiteTourKeys.host,
    queryFn: () => unwrap(landSiteTourService.hosting()),
  });
  const notify: Notify = (message, variant = 'success') => setToast({ message, variant });

  if (list.isLoading)
    return <div className="h-40 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  if (list.isError) {
    return (
      <PageErrorState
        description={list.error instanceof Error ? list.error.message : undefined}
        onRetry={() => list.refetch()}
        isRetrying={list.isRefetching}
      />
    );
  }
  const tours = list.data ?? [];
  return (
    <>
      {tours.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No tour requests"
          description="When a buyer asks for a live video tour of your land, it appears here."
        />
      ) : (
        <ul className="space-y-4">
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} who={`Buyer: ${tour.buyerName}`}>
              <HostActions tour={tour} notify={notify} />
            </TourCard>
          ))}
        </ul>
      )}
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
};
