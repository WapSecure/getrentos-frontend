'use client';

import { formatLocation } from '@sureground/shared';
import type { ReactNode } from 'react';
import {
  Badge,
  Button,
  Card,
  CardFooter,
  CardTitle,
  DescriptionList,
  type DescriptionItem,
} from '@sureground/ui';
import { CalendarClock, MapPin, UserRound, Video } from '@sureground/icons';
import type { ApiResponse } from '@/lib/apiHelpers';
import { formatDualTime, formatLagosDate } from '@/lib/format';
import type { TourJoin as TourJoinLink } from '@/services/siteTourService';
import {
  SITE_TOUR_STATUS_LABELS,
  SITE_TOUR_STATUS_VARIANT,
  tourPlace,
  type SiteTour,
} from '@/types/siteTour';
import { VideoCallButton } from '@/components/shared/VideoCallButton';
import { PropertyThumb } from '@/components/shared/property/PropertyThumb';

/** "12 Nov 2026 · 10:00 Lagos · 09:00 London": Lagos time next to the buyer's own. */
export const tourTime = (at: string, buyerTimeZone: string) =>
  `${formatLagosDate(at)} · ${formatDualTime(at, buyerTimeZone)}`;

type Join = () => Promise<ApiResponse<TourJoinLink>>;

const canJoin = (tour: SiteTour, join?: Join) =>
  tour.status === 'SCHEDULED' &&
  Boolean((tour.videoCall === 'BUILT_IN' && join && tour.scheduledAt) || tour.meetingUrl);

/** The way into a booked tour: the built-in call, or the link the host shared. */
export const TourJoin = ({ tour, join }: { tour: SiteTour; join?: Join }) => {
  if (!canJoin(tour, join)) return null;
  if (tour.videoCall === 'BUILT_IN' && join && tour.scheduledAt) {
    return (
      <VideoCallButton
        viewing={{ mode: 'video', status: 'confirmed', scheduledAt: tour.scheduledAt }}
        join={join}
        label="Join the video tour"
        size="md"
        opensAtLabel={(opensAt) => formatDualTime(opensAt, tour.buyerTimeZone)}
      />
    );
  }
  return (
    <Button
      href={tour.meetingUrl}
      target="_blank"
      rel="noreferrer"
      icon={<Video className="h-4 w-4" aria-hidden="true" />}
    >
      Join the video call
    </Button>
  );
};

const Meta = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <li className="inline-flex min-w-0 items-center gap-1.5">
    <span aria-hidden="true" className="shrink-0 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
      {icon}
    </span>
    <span className="min-w-0">{children}</span>
  </li>
);

/**
 * One video tour: the place, who is involved, its status and the next step, with the time in
 * Lagos next to the buyer's own. `children` holds anything to fill in (picking a time, notes);
 * `actions` and `aside` sit in the footer, actions on the right next to the join button.
 */
export const TourCard = ({
  tour,
  who,
  join,
  nextStep,
  actions,
  aside,
  children,
}: {
  tour: SiteTour;
  who: string;
  /** Opens the built-in call; tours on a pasted link show the link instead. */
  join?: Join;
  /** One plain sentence on what happens next. */
  nextStep?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) => {
  const showTime =
    Boolean(tour.scheduledAt) && ['SCHEDULED', 'COMPLETED', 'HOST_NO_SHOW'].includes(tour.status);
  const notes: DescriptionItem[] = [];
  if (tour.preferredTimes && ['REQUESTED', 'PROPOSED'].includes(tour.status)) {
    notes.push({ label: 'Buyer’s note on times', value: `“${tour.preferredTimes}”` });
  }
  if (tour.cancelReason) notes.push({ label: 'Why it was cancelled', value: tour.cancelReason });
  if (tour.hostNotes) {
    notes.push({
      label: 'What the seller showed',
      value: <span className="whitespace-pre-line">{tour.hostNotes}</span>,
      wide: true,
    });
  }
  const joinable = canJoin(tour, join);

  return (
    <li>
      <Card>
        <div className="flex gap-4 p-4 sm:p-5">
          <PropertyThumb src={tour.coverImageUrl} alt="" place={tourPlace(tour)} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
              <div className="min-w-0">
                <CardTitle as="h3" className="break-words">
                  {tour.land}
                </CardTitle>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {formatLocation(tour.city, tour.state)}
                </p>
              </div>
              <Badge dot variant={SITE_TOUR_STATUS_VARIANT[tour.status]}>
                {SITE_TOUR_STATUS_LABELS[tour.status]}
              </Badge>
            </div>
            {nextStep && <p className="text-sm font-medium text-foreground">{nextStep}</p>}
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <Meta icon={<UserRound />}>
                {who}
                {tour.attendeeName ? `, with ${tour.attendeeName}` : ''}
              </Meta>
              {showTime && tour.scheduledAt && (
                <Meta icon={<CalendarClock />}>
                  <span className="font-medium text-foreground">
                    {tourTime(tour.scheduledAt, tour.buyerTimeZone)}
                  </span>{' '}
                  · {tour.durationMinutes} min
                </Meta>
              )}
              {tour.videoCall && (
                <Meta icon={<Video />}>
                  {tour.videoCall === 'BUILT_IN' ? 'Sureground video call' : 'Seller’s own link'}
                </Meta>
              )}
            </ul>
          </div>
        </div>
        {(notes.length > 0 || children) && (
          <div className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">
            {notes.length > 0 && <DescriptionList items={notes} columns={2} />}
            {children}
          </div>
        )}
        {(actions || aside || joinable) && (
          <CardFooter className="justify-between gap-3">
            <div className="min-w-0 flex-1 basis-56">{aside}</div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {actions}
              <TourJoin tour={tour} join={join} />
            </div>
          </CardFooter>
        )}
      </Card>
    </li>
  );
};
