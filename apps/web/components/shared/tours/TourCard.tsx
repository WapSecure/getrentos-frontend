'use client';

import type { ReactNode } from 'react';
import { Badge, Card } from '@sureground/ui';
import { CalendarClock, Video } from '@sureground/icons';
import type { ApiResponse } from '@/lib/apiHelpers';
import { formatDualTime, formatLagosDate } from '@/lib/format';
import type { TourJoin } from '@/services/siteTourService';
import { SITE_TOUR_STATUS_LABELS, SITE_TOUR_STATUS_VARIANT, type SiteTour } from '@/types/siteTour';
import { VideoCallButton } from '@/components/shared/VideoCallButton';

/** "12 Nov 2026 · 10:00 Lagos · 09:00 London": Lagos time next to the buyer's own. */
export const tourTime = (at: string, buyerTimeZone: string) =>
  `${formatLagosDate(at)} · ${formatDualTime(at, buyerTimeZone)}`;

export const TourCard = ({
  tour,
  who,
  join,
  children,
}: {
  tour: SiteTour;
  who: string;
  /** Opens the built-in call; tours on a pasted link show the link instead. */
  join?: () => Promise<ApiResponse<TourJoin>>;
  children?: ReactNode;
}) => (
  <li>
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{tour.land}</p>
          <p className="text-xs text-muted-foreground">
            {tour.city}, {tour.state} · {who}
            {tour.attendeeName ? ` · with ${tour.attendeeName}` : ''}
          </p>
        </div>
        <Badge variant={SITE_TOUR_STATUS_VARIANT[tour.status]}>
          {SITE_TOUR_STATUS_LABELS[tour.status]}
        </Badge>
      </div>
      {tour.scheduledAt && tour.status === 'SCHEDULED' && (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-foreground">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden />{' '}
          {tourTime(tour.scheduledAt, tour.buyerTimeZone)} · {tour.durationMinutes} minutes
        </p>
      )}
      {tour.videoCall === 'BUILT_IN' && join && tour.scheduledAt && (
        <div className="mt-2">
          <VideoCallButton
            viewing={{
              mode: 'video',
              status: tour.status === 'SCHEDULED' ? 'confirmed' : tour.status,
              scheduledAt: tour.scheduledAt,
            }}
            join={join}
            label="Join the video tour"
          />
        </div>
      )}
      {tour.meetingUrl && tour.status === 'SCHEDULED' && (
        <a
          href={tour.meetingUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Video className="h-4 w-4" aria-hidden /> Join the video call
        </a>
      )}
      {tour.preferredTimes && ['REQUESTED', 'PROPOSED'].includes(tour.status) && (
        <p className="mt-2 text-sm text-muted-foreground">Buyer’s note: “{tour.preferredTimes}”</p>
      )}
      {tour.hostNotes && (
        <p className="mt-2 whitespace-pre-line rounded-xl bg-secondary/50 p-3 text-sm text-foreground">
          {tour.hostNotes}
        </p>
      )}
      {tour.cancelReason && (
        <p className="mt-2 text-sm text-muted-foreground">Cancelled: {tour.cancelReason}</p>
      )}
      {children}
    </Card>
  </li>
);
