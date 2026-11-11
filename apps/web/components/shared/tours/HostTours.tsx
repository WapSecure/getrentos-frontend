'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  EmptyState,
  Input,
  ListSkeleton,
  PageErrorState,
  RadioGroup,
  Textarea,
  Toast,
} from '@sureground/ui';
import { Video } from '@sureground/icons';
import { unwrap } from '@/lib/apiHelpers';
import { lagosLocalToIso, siteTourKeys, siteTourService } from '@/services/siteTourService';
import { videoCallAvailabilityQuery, videoCallService } from '@/services/videoCallService';
import { formatDualTime } from '@/lib/format';
import { tourPlace, type SiteTour, type TourScope } from '@/types/siteTour';
import { DateTimeField } from '@/components/shared/forms/DateTimeField';
import { TourCard } from './TourCard';
import { TourRecordingConsent } from './TourRecordingConsent';

/** Starts from 08:00 to 16:30 Lagos time, as the API requires. */
const EARLIEST_TOUR_HOUR = 8;
const LATEST_TOUR_HOUR_EXCLUSIVE = 17;

type Notify = (message: string, variant?: 'success' | 'error') => void;

const PLACE_COPY = {
  land: {
    where: 'at the land',
    notes: 'What you showed (beacons, access road, neighbours) and anything the buyer asked',
  },
  home: {
    where: 'at the property',
    notes: 'What you showed (rooms, roof, services, the street) and anything the buyer asked',
  },
} as const;

type CallChoice = 'builtIn' | 'link';

const HostActions = ({
  tour,
  scope,
  canUseBuiltIn,
  notify,
}: {
  tour: SiteTour;
  scope: TourScope;
  canUseBuiltIn: boolean;
  notify: Notify;
}) => {
  const queryClient = useQueryClient();
  const copy = PLACE_COPY[tourPlace(tour)];
  // Until the host chooses, follow whether the built-in call is available (it loads separately).
  const [chosen, setCall] = useState<CallChoice | null>(null);
  const call = chosen ?? (canUseBuiltIn && !tour.meetingUrl ? 'builtIn' : 'link');
  const builtIn = canUseBuiltIn && call === 'builtIn';
  // Captured once at mount: render must not read the clock.
  const [now] = useState(() => Date.now());
  const [slots, setSlots] = useState(['', '', '']);
  const [link, setLink] = useState(tour.meetingUrl ?? '');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const key = siteTourKeys.host(scope);
  const update = (updated: SiteTour, message: string) => {
    queryClient.setQueryData<SiteTour[]>(key, (list) =>
      list?.map((t) => (t.id === updated.id ? updated : t))
    );
    void queryClient.invalidateQueries({ queryKey: key });
    notify(message);
  };
  const done = (message: string) => (updated: SiteTour) => update(updated, message);
  const fail = (e: Error) => notify(e.message, 'error');
  const isoSlots = slots
    .map((s) => (s ? lagosLocalToIso(s) : null))
    .filter((s): s is string => Boolean(s));
  const propose = useMutation({
    mutationFn: () =>
      unwrap(
        siteTourService.propose(
          scope,
          tour.id,
          isoSlots,
          builtIn ? { useBuiltInVideo: true } : { meetingUrl: link }
        )
      ),
    onSuccess: done('Times sent to the buyer, in their own time zone.'),
    onError: fail,
  });
  const complete = useMutation({
    mutationFn: () => unwrap(siteTourService.complete(scope, tour.id, notes)),
    onSuccess: done('Tour recorded.'),
    onError: fail,
  });
  const cancel = useMutation({
    mutationFn: () => unwrap(siteTourService.cancel(scope, 'owner', tour.id, reason)),
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
            Lagos time, between 08:00 and 16:30 so there is daylight {copy.where}. The buyer is in{' '}
            {tour.buyerTimeZone} and sees them in their own time.
          </p>
          <div className="grid gap-3 lg:grid-cols-3">
            {slots.map((value, index) => (
              <DateTimeField
                key={index}
                label={`Time ${index + 1} (Lagos)`}
                value={value}
                onChange={(next) =>
                  setSlots((current) => current.map((s, i) => (i === index ? next : s)))
                }
                requireFuture
                minHour={EARLIEST_TOUR_HOUR}
                maxHour={LATEST_TOUR_HOUR_EXCLUSIVE}
              />
            ))}
          </div>
          {canUseBuiltIn && (
            <RadioGroup<CallChoice>
              aria-label="How you will hold the call"
              value={call}
              onValueChange={setCall}
              orientation="horizontal"
              options={[
                {
                  value: 'builtIn',
                  label: 'Sureground video call',
                  description: 'You both join from here; no link to share.',
                },
                { value: 'link', label: 'My own link', description: 'Paste an https link.' },
              ]}
            />
          )}
          {!builtIn && (
            <Input
              type="url"
              value={link}
              maxLength={500}
              onChange={(e) => setLink(e.target.value)}
              aria-label="Video call link"
              placeholder="https:// link to the video call"
            />
          )}
          <Button
            size="sm"
            disabled={
              isoSlots.length === 0 ||
              (!builtIn && !link.startsWith('https://')) ||
              propose.isPending
            }
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
            <li key={s.at}>
              Offered: {s.local} ({formatDualTime(s.at, tour.buyerTimeZone)})
            </li>
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
            placeholder={copy.notes}
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
      <TourRecordingConsent
        tour={tour}
        scope={scope}
        side="owner"
        onUpdated={update}
        onError={fail}
      />
      {tour.buyerRating && (
        <p className="text-sm text-muted-foreground">
          Buyer rated it {tour.buyerRating}/5{tour.buyerFeedback ? `: “${tour.buyerFeedback}”` : ''}
        </p>
      )}
    </div>
  );
};

/** `land`: land tours only (land routes). `all`: every tour, homes and land. */
export const HostTours = ({ scope }: { scope: TourScope }) => {
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );
  const list = useQuery({
    queryKey: siteTourKeys.host(scope),
    queryFn: () => unwrap(siteTourService.hosting(scope)),
  });
  const { data: videoCalls } = useQuery({
    ...videoCallAvailabilityQuery,
    queryFn: () => unwrap(videoCallService.availability()),
  });
  const canUseBuiltIn = videoCalls?.available === true;
  const notify: Notify = (message, variant = 'success') => setToast({ message, variant });

  if (list.isLoading) return <ListSkeleton rows={3} variant="cards" label="Loading tours" />;
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
          description={
            scope === 'land'
              ? 'When a buyer asks for a live video tour of your land, it appears here.'
              : 'When a buyer asks for a live video tour of your home or land for sale, it appears here.'
          }
        />
      ) : (
        <ul className="space-y-4">
          {tours.map((tour) => (
            <TourCard
              key={tour.id}
              tour={tour}
              who={`Buyer: ${tour.buyerName}`}
              join={() => siteTourService.join(scope, 'owner', tour.id)}
            >
              <HostActions
                tour={tour}
                scope={scope}
                canUseBuiltIn={canUseBuiltIn}
                notify={notify}
              />
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
