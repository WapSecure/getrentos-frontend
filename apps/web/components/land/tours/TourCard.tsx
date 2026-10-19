'use client';

import type { ReactNode } from 'react';
import { Badge, Card } from '@getrentos/ui';
import { CalendarClock, Video } from 'lucide-react';
import {
  LAND_SITE_TOUR_STATUS_LABELS,
  LAND_SITE_TOUR_STATUS_VARIANT,
  type LandSiteTour,
} from '@/types/landSiteTour';

/** One tour, as either side sees it; the actions are passed in. */
export const TourCard = ({
  tour,
  who,
  children,
}: {
  tour: LandSiteTour;
  /** The other party's name, with its role. */
  who: string;
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
        <Badge variant={LAND_SITE_TOUR_STATUS_VARIANT[tour.status]}>
          {LAND_SITE_TOUR_STATUS_LABELS[tour.status]}
        </Badge>
      </div>
      {tour.scheduledLocal && tour.status === 'SCHEDULED' && (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-foreground">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden /> {tour.scheduledLocal} ·{' '}
          {tour.durationMinutes} minutes
        </p>
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
