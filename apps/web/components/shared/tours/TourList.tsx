'use client';

import { useState, type ReactNode } from 'react';
import { EmptyState, SegmentedControl } from '@sureground/ui';
import { CalendarClock, History, Hourglass, Video, type SgIcon } from '@sureground/icons';
import {
  firstGroupWithTours,
  groupTours,
  nextBookedTour,
  TOUR_GROUP_LABELS,
  TOUR_GROUPS,
  type TourGroup,
  type TourViewer,
} from '@/lib/siteTours';
import type { SiteTour } from '@/types/siteTour';
import { tourTime } from './TourCard';

const GROUP_EMPTY: Record<
  TourViewer,
  Record<TourGroup, { icon: SgIcon; title: string; body: string }>
> = {
  buyer: {
    upcoming: {
      icon: CalendarClock,
      title: 'Nothing booked',
      body: 'Tours with times to pick, or a time agreed, appear here.',
    },
    waiting: {
      icon: Hourglass,
      title: 'Nothing waiting for times',
      body: 'Once you ask for a tour, it waits here until the seller offers times.',
    },
    past: {
      icon: History,
      title: 'No past tours',
      body: 'Finished and cancelled tours appear here.',
    },
  },
  host: {
    upcoming: {
      icon: CalendarClock,
      title: 'Nothing booked',
      body: 'Tours where you have offered times, or a time is agreed, appear here.',
    },
    waiting: {
      icon: Hourglass,
      title: 'No requests need times',
      body: 'New requests from buyers wait here until you offer times.',
    },
    past: {
      icon: History,
      title: 'No past tours',
      body: 'Finished and cancelled tours appear here.',
    },
  },
};

/**
 * The tours screens' list: a switch between upcoming, waiting and past with counts, the next
 * booked tour in one line, and an empty state with a way forward when there are no tours at all.
 */
export const TourList = ({
  tours,
  viewer,
  empty,
  renderTour,
}: {
  tours: readonly SiteTour[];
  viewer: TourViewer;
  /** Shown when there are no tours at all. */
  empty: { title: string; description: ReactNode; action?: ReactNode };
  renderTour: (tour: SiteTour) => ReactNode;
}) => {
  const groups = groupTours(tours);
  const [picked, setPicked] = useState<TourGroup | null>(null);
  // Captured once at mount: render must not read the clock.
  const [now] = useState(() => Date.now());
  const group = picked ?? firstGroupWithTours(groups);
  const next = nextBookedTour(tours, now);

  if (tours.length === 0) {
    return (
      <EmptyState
        icon={Video}
        title={empty.title}
        description={empty.description}
        action={empty.action}
      />
    );
  }

  const labels = TOUR_GROUP_LABELS[viewer];
  const needsYou = (g: TourGroup) =>
    viewer === 'buyer'
      ? g === 'upcoming' && groups.upcoming.some((t) => t.status === 'PROPOSED')
      : g === 'waiting' && groups.waiting.length > 0;
  const emptyGroup = GROUP_EMPTY[viewer][group];
  const shown = groups[group];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl<TourGroup>
          aria-label="Which tours to show"
          value={group}
          onValueChange={setPicked}
          segments={TOUR_GROUPS.map((g) => ({
            value: g,
            label: labels[g],
            count: groups[g].length,
            countTone: needsYou(g) ? 'warning' : 'neutral',
          }))}
          className="max-w-full overflow-x-auto"
        />
        {next?.scheduledAt && (
          <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0">
              Next: <span className="font-medium text-foreground">{next.land}</span>,{' '}
              {tourTime(next.scheduledAt, next.buyerTimeZone)}
            </span>
          </p>
        )}
      </div>
      {shown.length === 0 ? (
        <EmptyState
          size="compact"
          icon={emptyGroup.icon}
          title={emptyGroup.title}
          description={emptyGroup.body}
        />
      ) : (
        <ul className="space-y-3" aria-label={labels[group]}>
          {shown.map((tour) => renderTour(tour))}
        </ul>
      )}
    </div>
  );
};
