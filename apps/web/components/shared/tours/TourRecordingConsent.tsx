'use client';

import { useMutation } from '@tanstack/react-query';
import { Alert, Switch } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { siteTourService, type TourSide } from '@/services/siteTourService';
import type { SiteTour, TourScope } from '@/types/siteTour';

const OPEN = ['REQUESTED', 'PROPOSED', 'SCHEDULED'];

/** One party's say on recording. Recording needs both, and either may withdraw at any time. */
export const TourRecordingConsent = ({
  tour,
  scope,
  side,
  onUpdated,
  onError,
}: {
  tour: SiteTour;
  scope: TourScope;
  side: TourSide;
  onUpdated: (tour: SiteTour, message: string) => void;
  onError: (error: Error) => void;
}) => {
  const set = useMutation({
    mutationFn: (consent: boolean) =>
      unwrap(siteTourService.recordingConsent(scope, side, tour.id, consent)),
    onSuccess: (updated, consent) =>
      onUpdated(
        updated,
        consent ? 'You agreed to recording.' : 'You withdrew your agreement to recording.'
      ),
    onError,
  });
  const recording = tour.recording;
  if (!recording) return null;
  if (!OPEN.includes(tour.status)) {
    return recording.hasRecording ? (
      <p className="text-xs text-muted-foreground">This tour was recorded, as you both agreed.</p>
    ) : null;
  }

  const mine = Boolean(
    side === 'buyer' ? recording.requesterConsentedAt : recording.hostConsentedAt
  );
  const theirs = Boolean(
    side === 'buyer' ? recording.hostConsentedAt : recording.requesterConsentedAt
  );
  const other = side === 'buyer' ? 'the host' : 'the buyer';

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <Switch
        checked={mine}
        disabled={set.isPending}
        onCheckedChange={(next) => set.mutate(next)}
        label="I agree to this tour being recorded"
        description={`${theirs ? 'Agreed' : 'Not agreed yet'} by ${other}. You can withdraw at any time, which stops any recording.`}
        size="sm"
      />
      <Alert variant="info">
        {!recording.recordingAvailable
          ? 'Recording is off for this tour, so nothing will be recorded whatever you choose.'
          : recording.recordingEnabled
            ? 'You have both agreed, so the host can record the call. Either of you can withdraw at any time.'
            : 'The tour is recorded only if you and the other party both agree.'}
      </Alert>
    </div>
  );
};
