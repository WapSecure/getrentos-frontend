'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@sureground/ui/Button';
import { Checkbox } from '@sureground/ui/Checkbox';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@sureground/ui/Dialog';
import { Field } from '@sureground/ui/Field';
import { Select } from '@sureground/ui/Select';
import { Textarea } from '@sureground/ui/Textarea';
import { unwrap } from '@/lib/apiHelpers';
import { VISIT_ROUTES } from '@/lib/constants/visitRoutes';
import { representativeKeys, representativeService } from '@/services/representativeService';
import { siteTourKeys, siteTourService } from '@/services/siteTourService';
import { TOUR_DISCLAIMER, type TourPlace } from '@/types/siteTour';
import { browserTimeZone, TimeZoneSelect } from '@/components/shared/forms/TimeZoneSelect';

const COPY: Record<TourPlace, { where: string; route: string }> = {
  land: { where: 'at the land', route: VISIT_ROUTES.BUYER_LAND_TOURS },
  home: { where: 'at the property', route: VISIT_ROUTES.BUYER_TOURS },
};

/** Ask for a live video tour of land (land routes) or a built home for sale (general routes). */
export const RequestTourDialog = ({
  open,
  onClose,
  target,
  placeName,
  place = 'land',
}: {
  open: boolean;
  onClose: () => void;
  target: { listingId: string } | { plotId: string };
  placeName: string;
  place?: TourPlace;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scope = place === 'land' ? 'land' : 'all';
  const [timeZone, setTimeZone] = useState(() => browserTimeZone('Africa/Lagos'));
  const [preferredTimes, setPreferredTimes] = useState('');
  const [attendee, setAttendee] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Representatives are a land feature for now.
  const reps = useQuery({
    queryKey: representativeKeys.mine,
    queryFn: () => unwrap(representativeService.mine()),
    enabled: open && place === 'land',
    retry: false,
  });
  const attendees = (reps.data ?? []).filter(
    (a) => a.status === 'ACTIVE' && a.scopes.includes('ATTEND')
  );

  const submit = useMutation({
    mutationFn: () =>
      unwrap(
        siteTourService.request(scope, {
          ...target,
          timeZone: timeZone.trim(),
          preferredTimes,
          attendeeAppointmentId: attendee || undefined,
        })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: siteTourKeys.buyer(scope) });
      router.push(COPY[place].route);
    },
    onError: (reason: Error) => setError(reason.message),
  });

  const close = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-w-lg space-y-4">
        <div>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Ask for a live video tour
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {placeName}. The seller offers up to three times in daylight {COPY[place].where}; you
            see them in your own time zone and pick one.
          </DialogDescription>
        </div>
        <Field
          label="Your time zone"
          hint="Detected from your browser. Change it if you are booking for another place."
        >
          <TimeZoneSelect value={timeZone} onValueChange={setTimeZone} ariaLabel="Your time zone" />
        </Field>
        <Field label="When suits you (optional)" htmlFor="tour-times">
          <Textarea
            id="tour-times"
            rows={2}
            maxLength={500}
            value={preferredTimes}
            onChange={(e) => setPreferredTimes(e.target.value)}
            placeholder="e.g. weekday mornings my time, or Saturday"
          />
        </Field>
        {attendees.length > 0 && (
          <Field label="Invite a representative (optional)">
            <Select
              value={attendee}
              onValueChange={setAttendee}
              ariaLabel="Representative to invite"
              placeholder="No one"
              options={attendees.map((a) => ({ value: a.id, label: a.name ?? a.email ?? a.id }))}
            />
          </Field>
        )}
        <label className="flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-sm text-foreground">
          <Checkbox
            checked={accepted}
            onCheckedChange={setAccepted}
            aria-label="I understand a video tour is not a search"
          />
          <span>{TOUR_DISCLAIMER[place]}</span>
        </label>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={close} disabled={submit.isPending}>
            Cancel
          </Button>
          <Button
            disabled={!accepted || timeZone.trim().length === 0 || submit.isPending}
            isLoading={submit.isPending}
            onClick={() => {
              setError(null);
              submit.mutate();
            }}
          >
            Send request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
