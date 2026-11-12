import type { FunnelEventName, FunnelEventProps } from './funnelEvents';
import type { MediaRoom } from './types';
import type { ListingAnswerSource, ListingQuestionTopic } from './listingQuestions';

/**
 * When a listing card counts as seen (`property_impression`), the same on web and mobile so the two
 * funnels compare: at least half the card on screen for one continuous second, once per page or
 * screen visit. A card scrolled past quickly is not counted.
 */
export const CARD_IMPRESSION_RULE = { visiblePercent: 50, minimumMs: 1000 } as const;

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
  'listing_question',
] as const;

export type ShowroomEventName = (typeof SHOWROOM_EVENT_NAMES)[number] | FunnelEventName;

export type ShowroomEventMarket = 'rent' | 'sale' | 'land' | 'shortlet';

export interface ShowroomEventProps extends FunnelEventProps {
  position?: number;
  mediaIndex?: number;
  room?: MediaRoom;
  percent?: number;
  durationSeconds?: number;
  variant?: string;
  /** listing_question only: the topic answered, never the question's text. */
  topic?: ListingQuestionTopic | 'unmatched';
  source?: ListingAnswerSource;
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
