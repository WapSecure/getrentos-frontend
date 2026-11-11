/** Mirrors `land-site-tour.service.ts`: one shape for video tours of land and of built homes. */

export type SiteTourStatus =
  | 'REQUESTED'
  | 'PROPOSED'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'HOST_NO_SHOW';

/** Which API a screen talks to: the land routes (behind the land rollout) or the general ones. */
export type TourScope = 'land' | 'all';

/** What is being visited, for copy: a land listing or estate plot, or a built home for sale. */
export type TourPlace = 'land' | 'home';

export interface SiteTourSlot {
  at: string;
  /** In the viewer's zone (`timeZone`). */
  local: string;
}

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

export interface SiteTour {
  id: string;
  status: SiteTourStatus;
  /** The place's name: the parcel, the plot or the home. */
  land: string;
  propertyId: string;
  listingId?: string;
  plotId?: string;
  city: string;
  state: string;
  buyerName: string;
  hostName: string;
  attendeeName?: string;
  timeZone: string;
  buyerTimeZone: string;
  preferredTimes?: string;
  proposedSlots: SiteTourSlot[];
  scheduledAt?: string;
  scheduledLocal?: string;
  durationMinutes: number;
  meetingUrl?: string;
  propertyType?: string;
  videoCall?: 'BUILT_IN' | 'LINK' | null;
  recording?: SiteTourRecording;
  hostNotes?: string;
  cancelReason?: string;
  buyerRating?: number;
  buyerFeedback?: string;
  disclaimer: string;
  createdAt: string;
}

export const tourPlace = (tour: Pick<SiteTour, 'plotId' | 'propertyType'>): TourPlace =>
  tour.plotId || !tour.propertyType || tour.propertyType === 'LAND' ? 'land' : 'home';

export const SITE_TOUR_STATUS_LABELS: Record<SiteTourStatus, string> = {
  REQUESTED: 'Waiting for times',
  PROPOSED: 'Times offered',
  SCHEDULED: 'Booked',
  COMPLETED: 'Done',
  CANCELLED: 'Cancelled',
  HOST_NO_SHOW: 'Host did not join',
};

export const SITE_TOUR_STATUS_VARIANT: Record<
  SiteTourStatus,
  'success' | 'warning' | 'info' | 'neutral' | 'danger'
> = {
  REQUESTED: 'warning',
  PROPOSED: 'info',
  SCHEDULED: 'success',
  COMPLETED: 'neutral',
  CANCELLED: 'neutral',
  HOST_NO_SHOW: 'danger',
};

/** Match the backend wording; shown before a tour exists, after which the API sends its own. */
export const TOUR_DISCLAIMER: Record<TourPlace, string> = {
  land: 'A video tour shows the land as it looks today. It is not a registry search, a survey or an inspection, and it does not confirm who owns the land or where its boundaries are.',
  home: 'A video tour shows the property as it looks today. It is not a survey or an inspection, and it does not confirm who owns the property or that it is free of defects.',
};
