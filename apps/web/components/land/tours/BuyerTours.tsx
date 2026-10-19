'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, EmptyState, Input, PageErrorState, Textarea, Toast } from '@getrentos/ui';
import { Star, Video } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { landSiteTourKeys, landSiteTourService } from '@/services/landSiteTourService';
import type { LandSiteTour } from '@/types/landSiteTour';
import { TourCard } from './TourCard';

type Notify = (message: string, variant?: 'success' | 'error') => void;

const BuyerActions = ({ tour, notify }: { tour: LandSiteTour; notify: Notify }) => {
  const queryClient = useQueryClient();
  // Captured once at mount: render must not read the clock.
  const [now] = useState(() => Date.now());
  const [mode, setMode] = useState<'none' | 'other' | 'cancel' | 'rate'>('none');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const done = (message: string) => () => {
    void queryClient.invalidateQueries({ queryKey: landSiteTourKeys.buyer });
    setMode('none');
    setText('');
    notify(message);
  };
  const fail = (reason: Error) => notify(reason.message, 'error');
  const choose = useMutation({
    mutationFn: (slot: string) => unwrap(landSiteTourService.choose(tour.id, slot)),
    onSuccess: done('Booked. You will be reminded a day and an hour before.'),
    onError: fail,
  });
  const other = useMutation({
    mutationFn: () => unwrap(landSiteTourService.otherTimes(tour.id, text)),
    onSuccess: done('Asked the seller for other times.'),
    onError: fail,
  });
  const cancel = useMutation({
    mutationFn: () => unwrap(landSiteTourService.cancel('buyer', tour.id, text)),
    onSuccess: done('Tour cancelled.'),
    onError: fail,
  });
  const noShow = useMutation({
    mutationFn: () => unwrap(landSiteTourService.reportNoShow(tour.id)),
    onSuccess: done('Reported. You can ask for another tour.'),
    onError: fail,
  });
  const rate = useMutation({
    mutationFn: () => unwrap(landSiteTourService.feedback(tour.id, rating, text)),
    onSuccess: done('Thanks for your feedback.'),
    onError: fail,
  });
  const open = ['REQUESTED', 'PROPOSED', 'SCHEDULED'].includes(tour.status);
  const started = tour.scheduledAt
    ? now > new Date(tour.scheduledAt).getTime() + 15 * 60_000
    : false;

  return (
    <div className="mt-3 space-y-3">
      {tour.status === 'REQUESTED' && (
        <p className="text-sm text-muted-foreground">Waiting for the seller to offer times.</p>
      )}
      {tour.status === 'PROPOSED' && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Pick a time (your time zone):</p>
          <div className="flex flex-wrap gap-2">
            {tour.proposedSlots.map((slot) => (
              <Button
                key={slot.at}
                size="sm"
                variant="outline"
                isLoading={choose.isPending && choose.variables === slot.at}
                disabled={choose.isPending}
                onClick={() => choose.mutate(slot.at)}
              >
                {slot.local}
              </Button>
            ))}
          </div>
        </div>
      )}
      {mode === 'other' || mode === 'cancel' ? (
        <div className="space-y-2">
          <Input
            value={text}
            maxLength={500}
            onChange={(e) => setText(e.target.value)}
            aria-label={mode === 'other' ? 'Times that would suit you' : 'Why you are cancelling'}
            placeholder={mode === 'other' ? 'Times that would suit you' : 'Why you are cancelling'}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={mode === 'cancel' ? 'danger' : 'primary'}
              disabled={text.trim().length < 3}
              isLoading={other.isPending || cancel.isPending}
              onClick={() => (mode === 'other' ? other.mutate() : cancel.mutate())}
            >
              {mode === 'other' ? 'Ask for other times' : 'Cancel tour'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setMode('none')}>
              Back
            </Button>
          </div>
        </div>
      ) : mode === 'rate' ? (
        <div className="space-y-2">
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
                onClick={() => setRating(n)}
                className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Star
                  className={`h-5 w-5 ${n <= rating ? 'fill-warning text-warning' : 'text-muted-foreground'}`}
                  aria-hidden
                />
              </button>
            ))}
          </div>
          <Textarea
            rows={2}
            maxLength={2000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Comment"
            placeholder="Anything others should know (optional)"
          />
          <Button
            size="sm"
            disabled={rating === 0}
            isLoading={rate.isPending}
            onClick={() => rate.mutate()}
          >
            Send rating
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tour.status === 'PROPOSED' && (
            <Button size="sm" variant="ghost" onClick={() => setMode('other')}>
              None of these work
            </Button>
          )}
          {tour.status === 'SCHEDULED' && started && (
            <Button
              size="sm"
              variant="ghost"
              isLoading={noShow.isPending}
              onClick={() => noShow.mutate()}
            >
              The seller did not join
            </Button>
          )}
          {tour.status === 'COMPLETED' && !tour.buyerRating && (
            <Button size="sm" variant="outline" onClick={() => setMode('rate')}>
              Rate this tour
            </Button>
          )}
          {open && (
            <Button size="sm" variant="ghost" onClick={() => setMode('cancel')}>
              Cancel
            </Button>
          )}
        </div>
      )}
      {['SCHEDULED', 'COMPLETED'].includes(tour.status) && (
        <p className="text-xs text-muted-foreground">{tour.disclaimer}</p>
      )}
    </div>
  );
};

/** The buyer's video tour requests and bookings. */
export const BuyerTours = () => {
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );
  const list = useQuery({
    queryKey: landSiteTourKeys.buyer,
    queryFn: () => unwrap(landSiteTourService.mine()),
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
          title="No video tours yet"
          description="Ask for one from a land listing or an estate plot."
        />
      ) : (
        <ul className="space-y-4">
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} who={`Host: ${tour.hostName}`}>
              <BuyerActions tour={tour} notify={notify} />
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
