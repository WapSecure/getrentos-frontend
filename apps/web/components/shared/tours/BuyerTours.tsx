'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Field,
  Input,
  ListSkeleton,
  PageErrorState,
  Textarea,
  Toast,
} from '@sureground/ui';
import { ArrowRight, CalendarClock } from '@sureground/icons';
import { unwrap } from '@/lib/apiHelpers';
import { findPropertyHref } from '@/lib/constants/visitRoutes';
import { tourNextStep } from '@/lib/siteTours';
import { siteTourKeys, siteTourService } from '@/services/siteTourService';
import type { SiteTour, TourScope } from '@/types/siteTour';
import { StarRating } from '@/components/landlord/vendors/StarRating';
import { TourCard } from './TourCard';
import { TourList } from './TourList';
import { TourRecordingConsent } from './TourRecordingConsent';

type Notify = (message: string, variant?: 'success' | 'error') => void;

const BuyerTourRow = ({
  tour,
  scope,
  notify,
}: {
  tour: SiteTour;
  scope: TourScope;
  notify: Notify;
}) => {
  const queryClient = useQueryClient();
  // Captured once at mount: render must not read the clock.
  const [now] = useState(() => Date.now());
  const [mode, setMode] = useState<'none' | 'other' | 'cancel' | 'rate'>('none');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const key = siteTourKeys.buyer(scope);
  const update = (updated: SiteTour, message: string) => {
    queryClient.setQueryData<SiteTour[]>(key, (list) =>
      list?.map((t) => (t.id === updated.id ? updated : t))
    );
    void queryClient.invalidateQueries({ queryKey: key });
    notify(message);
  };
  const done = (message: string) => (updated: SiteTour) => {
    update(updated, message);
    setMode('none');
    setText('');
  };
  const fail = (reason: Error) => notify(reason.message, 'error');
  const choose = useMutation({
    mutationFn: (slot: string) => unwrap(siteTourService.choose(scope, tour.id, slot)),
    onSuccess: done('Booked. You will be reminded a day and an hour before.'),
    onError: fail,
  });
  const other = useMutation({
    mutationFn: () => unwrap(siteTourService.otherTimes(scope, tour.id, text)),
    onSuccess: done('Asked the seller for other times.'),
    onError: fail,
  });
  const cancel = useMutation({
    mutationFn: () => unwrap(siteTourService.cancel(scope, 'buyer', tour.id, text)),
    onSuccess: done('Tour cancelled.'),
    onError: fail,
  });
  const noShow = useMutation({
    mutationFn: () => unwrap(siteTourService.reportNoShow(scope, tour.id)),
    onSuccess: done('Reported. You can ask for another tour.'),
    onError: fail,
  });
  const rate = useMutation({
    mutationFn: () => unwrap(siteTourService.feedback(scope, tour.id, rating, text)),
    onSuccess: done('Thanks for your feedback.'),
    onError: fail,
  });
  const open = ['REQUESTED', 'PROPOSED', 'SCHEDULED'].includes(tour.status);
  const started = tour.scheduledAt
    ? now > new Date(tour.scheduledAt).getTime() + 15 * 60_000
    : false;
  const back = () => {
    setMode('none');
    setText('');
  };
  const fieldId = `tour-${tour.id}-${mode}`;

  const body =
    mode === 'other' || mode === 'cancel' ? (
      <Field
        label={mode === 'other' ? 'Times that would suit you' : 'Why you are cancelling'}
        htmlFor={fieldId}
      >
        <Input
          id={fieldId}
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            mode === 'other' ? 'For example, weekday mornings Lagos time' : 'A short reason'
          }
        />
      </Field>
    ) : mode === 'rate' ? (
      <div className="space-y-3">
        <StarRating value={rating} onRate={setRating} size="md" label="Your rating" />
        <Field label="Comment (optional)" htmlFor={fieldId}>
          <Textarea
            id={fieldId}
            rows={2}
            maxLength={2000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Anything others should know"
          />
        </Field>
      </div>
    ) : tour.status === 'PROPOSED' ? (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">
          Pick a time (shown in your time zone)
        </legend>
        <div className="flex flex-wrap gap-2">
          {tour.proposedSlots.map((slot) => (
            <Button
              key={slot.at}
              variant="outline"
              icon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
              isLoading={choose.isPending && choose.variables === slot.at}
              disabled={choose.isPending}
              onClick={() => choose.mutate(slot.at)}
              aria-label={`Book ${slot.local}`}
            >
              {slot.local}
            </Button>
          ))}
        </div>
      </fieldset>
    ) : null;

  const actions =
    mode === 'other' || mode === 'cancel' ? (
      <>
        <Button variant="ghost" onClick={back}>
          Back
        </Button>
        <Button
          variant={mode === 'cancel' ? 'danger' : 'primary'}
          disabled={text.trim().length < 3}
          isLoading={other.isPending || cancel.isPending}
          onClick={() => (mode === 'other' ? other.mutate() : cancel.mutate())}
        >
          {mode === 'other' ? 'Ask for other times' : 'Cancel tour'}
        </Button>
      </>
    ) : mode === 'rate' ? (
      <>
        <Button variant="ghost" onClick={back}>
          Back
        </Button>
        <Button disabled={rating === 0} isLoading={rate.isPending} onClick={() => rate.mutate()}>
          Send rating
        </Button>
      </>
    ) : (
      <>
        {open && (
          <Button
            variant="danger-ghost"
            onClick={() => setMode('cancel')}
            aria-label={`Cancel the tour of ${tour.land}`}
          >
            Cancel
          </Button>
        )}
        {tour.status === 'PROPOSED' && (
          <Button variant="outline" onClick={() => setMode('other')}>
            None of these work
          </Button>
        )}
        {tour.status === 'SCHEDULED' && started && (
          <Button variant="outline" isLoading={noShow.isPending} onClick={() => noShow.mutate()}>
            The seller did not join
          </Button>
        )}
        {tour.status === 'COMPLETED' && tour.buyerRating && (
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            You rated it <StarRating value={tour.buyerRating} label="Your rating" />
          </span>
        )}
        {tour.status === 'COMPLETED' && !tour.buyerRating && (
          <Button onClick={() => setMode('rate')}>Rate this tour</Button>
        )}
      </>
    );

  return (
    <TourCard
      tour={tour}
      who={`Host: ${tour.hostName}`}
      join={() => siteTourService.join(scope, 'buyer', tour.id)}
      nextStep={tourNextStep(tour, 'buyer', started)}
      aside={
        <TourRecordingConsent
          tour={tour}
          scope={scope}
          side="buyer"
          onUpdated={update}
          onError={fail}
        />
      }
      actions={actions}
    >
      {body}
      {['SCHEDULED', 'COMPLETED'].includes(tour.status) && (
        <p className="text-xs leading-5 text-muted-foreground">{tour.disclaimer}</p>
      )}
    </TourCard>
  );
};

/** `land`: land tours only (land routes). `all`: every tour, homes and land. */
export const BuyerTours = ({ scope }: { scope: TourScope }) => {
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );
  const list = useQuery({
    queryKey: siteTourKeys.buyer(scope),
    queryFn: () => unwrap(siteTourService.mine(scope)),
  });
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
  return (
    <>
      <TourList
        tours={list.data ?? []}
        viewer="buyer"
        empty={{
          title: 'No video tours yet',
          description: 'Book one from any listing. The seller offers times in your time zone.',
          action: (
            <Button
              href={findPropertyHref(scope)}
              icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
              iconPosition="right"
            >
              Find a property to tour
            </Button>
          ),
        }}
        renderTour={(tour) => (
          <BuyerTourRow key={tour.id} tour={tour} scope={scope} notify={notify} />
        )}
      />
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
};
