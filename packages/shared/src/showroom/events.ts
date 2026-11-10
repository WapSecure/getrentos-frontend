import type { MediaRoom } from './types';

/** Must match the backend allow-list on POST /analytics/events. */
export const SHOWROOM_EVENT_NAMES = [
  'property_impression',
  'property_card_click',
  'property_detail_view',
  'gallery_open',
  'media_category_select',
  'video_start',
  'video_complete',
  'tour_start',
  'floor_plan_view',
  'property_save',
  'property_compare',
  'property_share',
  'inquiry_start',
  'inspection_request_start',
  'booking_start',
  'offer_start',
] as const;

export type ShowroomEventName = (typeof SHOWROOM_EVENT_NAMES)[number];

export type ShowroomEventMarket = 'rent' | 'sale' | 'land' | 'shortlet';

export interface ShowroomEventProps {
  position?: number;
  mediaIndex?: number;
  room?: MediaRoom;
  percent?: number;
  durationSeconds?: number;
  variant?: string;
}

/** What callers pass; the transport adds session, time, device and connection. */
export interface ShowroomEventInput {
  name: ShowroomEventName;
  listingId?: string;
  market?: ShowroomEventMarket;
  surface?: string;
  props?: ShowroomEventProps;
}

export interface ShowroomEvent extends ShowroomEventInput {
  occurredAt: string;
  sessionId: string;
  device: 'phone' | 'tablet' | 'desktop';
  connection?: 'slow-2g' | '2g' | '3g' | '4g';
}
