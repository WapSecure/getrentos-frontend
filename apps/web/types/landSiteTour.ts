/** Live guided video tours (blueprint §8.4); mirrors `land-site-tour.service.ts`. */

export type LandSiteTourStatus =
  | 'REQUESTED'
  | 'PROPOSED'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'HOST_NO_SHOW';

export interface LandSiteTourSlot {
  at: string;
  /** Formatted in the viewer's zone (`timeZone`). */
  local: string;
}

export interface LandSiteTour {
  id: string;
  status: LandSiteTourStatus;
  land: string;
  propertyId: string;
  listingId?: string;
  plotId?: string;
  city: string;
  state: string;
  buyerName: string;
  hostName: string;
  attendeeName?: string;
  /** The zone the `local` times are shown in for this viewer. */
  timeZone: string;
  buyerTimeZone: string;
  preferredTimes?: string;
  proposedSlots: LandSiteTourSlot[];
  scheduledAt?: string;
  scheduledLocal?: string;
  durationMinutes: number;
  meetingUrl?: string;
  hostNotes?: string;
  cancelReason?: string;
  buyerRating?: number;
  buyerFeedback?: string;
  disclaimer: string;
  createdAt: string;
}

export const LAND_SITE_TOUR_STATUS_LABELS: Record<LandSiteTourStatus, string> = {
  REQUESTED: 'Waiting for times',
  PROPOSED: 'Times offered',
  SCHEDULED: 'Booked',
  COMPLETED: 'Done',
  CANCELLED: 'Cancelled',
  HOST_NO_SHOW: 'Host did not join',
};

export const LAND_SITE_TOUR_STATUS_VARIANT: Record<
  LandSiteTourStatus,
  'success' | 'warning' | 'info' | 'neutral' | 'danger'
> = {
  REQUESTED: 'warning',
  PROPOSED: 'info',
  SCHEDULED: 'success',
  COMPLETED: 'neutral',
  CANCELLED: 'neutral',
  HOST_NO_SHOW: 'danger',
};

/** Shown before booking, and kept on every tour: matches the backend wording. */
export const LAND_TOUR_DISCLAIMER =
  'A video tour shows the land as it looks today. It is not a registry search, a survey or an inspection, and it does not confirm who owns the land or where its boundaries are.';
