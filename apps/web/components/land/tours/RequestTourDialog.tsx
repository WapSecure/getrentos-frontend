'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
  Select,
  Textarea,
} from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import {
  landRepresentativeKeys,
  landRepresentativeService,
} from '@/services/landRepresentativeService';
import { landSiteTourKeys, landSiteTourService } from '@/services/landSiteTourService';
import { LAND_TOUR_DISCLAIMER } from '@/types/landSiteTour';

export const BUYER_TOURS_ROUTE = '/buyer/land/tours';

const browserZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';
  } catch {
    return 'Africa/Lagos';
  }
};

/**
 * Ask the land's owner or developer for a live guided video tour. The buyer
 * gives their time zone (their browser's by default), when suits them, and
 * may bring a representative; they accept that a tour is not a search.
 */
export const RequestTourDialog = ({
  open,
  onClose,
  target,
  landName,
}: {
  open: boolean;
  onClose: () => void;
  target: { listingId: string } | { plotId: string };
  landName: string;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [timeZone, setTimeZone] = useState(browserZone);
  const [preferredTimes, setPreferredTimes] = useState('');
  const [attendee, setAttendee] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reps = useQuery({
    queryKey: landRepresentativeKeys.mine,
    queryFn: () => unwrap(landRepresentativeService.mine()),
    enabled: open,
    retry: false,
  });
  const attendees = (reps.data ?? []).filter(
    (a) => a.status === 'ACTIVE' && a.scopes.includes('ATTEND')
  );

  const submit = useMutation({
    mutationFn: () =>
      unwrap(
        landSiteTourService.request({
          ...target,
          timeZone: timeZone.trim(),
          preferredTimes,
          attendeeAppointmentId: attendee || undefined,
        })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: landSiteTourKeys.buyer });
      router.push(BUYER_TOURS_ROUTE);
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
            {landName}. The seller offers up to three times in daylight at the land; you see them in
            your own time zone and pick one.
          </DialogDescription>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="tour-zone" className="text-sm font-medium text-foreground">
            Your time zone
          </label>
          <Input
            id="tour-zone"
            value={timeZone}
            maxLength={64}
            onChange={(e) => setTimeZone(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Detected from your browser, e.g. Europe/London or America/Toronto.
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="tour-times" className="text-sm font-medium text-foreground">
            When suits you (optional)
          </label>
          <Textarea
            id="tour-times"
            rows={2}
            maxLength={500}
            value={preferredTimes}
            onChange={(e) => setPreferredTimes(e.target.value)}
            placeholder="e.g. weekday mornings my time, or Saturday"
          />
        </div>
        {attendees.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-foreground">
              Invite a representative (optional)
            </span>
            <Select
              value={attendee}
              onValueChange={setAttendee}
              ariaLabel="Representative to invite"
              placeholder="No one"
              options={attendees.map((a) => ({ value: a.id, label: a.name ?? a.email ?? a.id }))}
            />
          </div>
        )}
        <label className="flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-sm text-foreground">
          <Checkbox
            checked={accepted}
            onCheckedChange={setAccepted}
            aria-label="I understand a video tour is not a search"
          />
          <span>{LAND_TOUR_DISCLAIMER}</span>
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
