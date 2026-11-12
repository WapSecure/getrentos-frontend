'use client';

import type { ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Switch } from '@sureground/ui';
import { Video, VideoOff } from '@sureground/icons';
import { unwrap } from '@/lib/apiHelpers';
import { siteTourService, type TourSide } from '@/services/siteTourService';
import type { SiteTour, TourScope } from '@/types/siteTour';

const OPEN = ['REQUESTED', 'PROPOSED', 'SCHEDULED'];

const Line = ({ off = false, children }: { off?: boolean; children: ReactNode }) => {
  const Icon = off ? VideoOff : Video;
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
};

/**
 * One party's say on recording, kept to a line. Recording needs both, and either may withdraw at
 * any time. The switch shows only when the call can actually be recorded; otherwise a line says
 * recording is off, with a way to withdraw an agreement already given.
 */
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
    return recording.hasRecording ? <Line>Recorded, as you both agreed.</Line> : null;
  }

  const mine = Boolean(
    side === 'buyer' ? recording.requesterConsentedAt : recording.hostConsentedAt
  );
  const theirs = Boolean(
    side === 'buyer' ? recording.hostConsentedAt : recording.requesterConsentedAt
  );
  const other = side === 'buyer' ? 'the host' : 'the buyer';

  if (!recording.recordingAvailable) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Line off>Recording: off for this tour, so nothing will be recorded.</Line>
        {mine && (
          <Button
            variant="link"
            className="text-xs"
            disabled={set.isPending}
            onClick={() => set.mutate(false)}
          >
            Withdraw my agreement
          </Button>
        )}
      </div>
    );
  }

  return (
    <Switch
      checked={mine}
      disabled={set.isPending}
      onCheckedChange={(next) => set.mutate(next)}
      label="I agree to this tour being recorded"
      description={
        recording.recordingEnabled
          ? 'You have both agreed, so the host can record the call. Either of you can withdraw at any time, which stops any recording.'
          : `${theirs ? 'Agreed' : 'Not agreed yet'} by ${other}. It is recorded only if you both agree, and either of you can withdraw at any time.`
      }
      size="sm"
    />
  );
};
