/**
 * Video tours (land and built homes): which list a tour sits in, and what happens next. Used by
 * the web and mobile tours screens. Works on any tour shape that carries the fields it reads.
 */

export type SiteTourStatus =
  | 'REQUESTED'
  | 'PROPOSED'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'HOST_NO_SHOW';

/** Each party's say on recording the call. Recording needs both, and either may withdraw. */
export interface SiteTourRecording {
  requesterConsentedAt: string | null;
  hostConsentedAt: string | null;
  bothConsented: boolean;
  /** True only when the call will actually let the host record. */
  recordingEnabled: boolean;
  /** Recording is switched on for this tour's call at all. */
  recordingAvailable: boolean;
  hasRecording: boolean;
}

/** The fields the grouping reads. */
export interface GroupableTour {
  status: SiteTourStatus;
  scheduledAt?: string | null;
  createdAt?: string | null;
}

/** Which list a tour sits in on the tours screens. */
export type TourGroup = 'upcoming' | 'waiting' | 'past';
export type TourViewer = 'buyer' | 'host';

export const TOUR_GROUPS: readonly TourGroup[] = ['upcoming', 'waiting', 'past'];

const GROUP: Record<SiteTourStatus, TourGroup> = {
  // Times are on the table or fixed: there is something to do or attend.
  PROPOSED: 'upcoming',
  SCHEDULED: 'upcoming',
  // No times yet.
  REQUESTED: 'waiting',
  COMPLETED: 'past',
  CANCELLED: 'past',
  HOST_NO_SHOW: 'past',
};

export const tourGroup = (status: SiteTourStatus): TourGroup => GROUP[status];

export const TOUR_GROUP_LABELS: Record<TourViewer, Record<TourGroup, string>> = {
  buyer: { upcoming: 'Upcoming', waiting: 'Waiting for times', past: 'Past' },
  host: { upcoming: 'Upcoming', waiting: 'Needs your times', past: 'Past' },
};

const time = (value?: string | null) => (value ? new Date(value).getTime() : Number.NaN);

/**
 * Splits tours into the three lists. Upcoming puts booked tours first, soonest first, then tours
 * with times offered; the other lists show the newest request first.
 */
export const groupTours = <T extends GroupableTour>(
  tours: readonly T[]
): Record<TourGroup, T[]> => {
  const groups: Record<TourGroup, T[]> = { upcoming: [], waiting: [], past: [] };
  for (const tour of tours) groups[tourGroup(tour.status)].push(tour);
  const newest = (a: T, b: T) => time(b.createdAt) - time(a.createdAt);
  groups.upcoming.sort((a, b) => {
    const booked = Number(b.status === 'SCHEDULED') - Number(a.status === 'SCHEDULED');
    if (booked !== 0) return booked;
    const at = time(a.scheduledAt) - time(b.scheduledAt);
    return Number.isNaN(at) || at === 0 ? newest(a, b) : at;
  });
  groups.waiting.sort(newest);
  groups.past.sort((a, b) => {
    const at = time(b.scheduledAt) - time(a.scheduledAt);
    return Number.isNaN(at) || at === 0 ? newest(a, b) : at;
  });
  return groups;
};

/** The list to open on: the first one with something in it. */
export const firstGroupWithTours = (groups: Record<TourGroup, readonly unknown[]>): TourGroup =>
  TOUR_GROUPS.find((group) => groups[group].length > 0) ?? 'upcoming';

/** The booked tour that starts soonest, from now on. */
export const nextBookedTour = <T extends GroupableTour>(
  tours: readonly T[],
  now: number
): T | undefined =>
  tours
    .filter((t) => t.status === 'SCHEDULED' && time(t.scheduledAt) >= now)
    .sort((a, b) => time(a.scheduledAt) - time(b.scheduledAt))[0];

/**
 * What happens next, in one plain sentence, for the person looking at the tour. `started` is true
 * once a booked tour's start time has passed.
 */
export const tourNextStep = (
  tour: { status: SiteTourStatus; buyerRating?: number | null },
  viewer: TourViewer,
  started = false
): string => {
  const other = viewer === 'buyer' ? 'the seller' : 'the buyer';
  switch (tour.status) {
    case 'REQUESTED':
      return viewer === 'buyer'
        ? 'Waiting for the seller to offer up to three times.'
        : 'Offer up to three times, in daylight at the property.';
    case 'PROPOSED':
      return viewer === 'buyer'
        ? 'Pick one of the times the seller offered, or ask for others.'
        : 'Waiting for the buyer to pick one of your times.';
    case 'SCHEDULED':
      if (started) {
        return viewer === 'buyer'
          ? 'Under way. Join now, or report it if the seller did not join.'
          : 'Once the tour ends, record what you showed.';
      }
      return `Booked. You and ${other} are reminded a day and an hour before.`;
    case 'COMPLETED':
      if (viewer === 'host') return 'Done. Your notes are shared with the buyer.';
      return tour.buyerRating
        ? 'Done. Thank you for rating it.'
        : 'Done. Rate the tour to help other buyers.';
    case 'CANCELLED':
      return 'Cancelled.';
    case 'HOST_NO_SHOW':
      return viewer === 'buyer'
        ? 'The seller did not join. You can ask for another tour from the listing.'
        : 'The buyer reported that you did not join.';
  }
};
