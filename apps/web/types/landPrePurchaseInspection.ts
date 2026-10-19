import type { LandWatchInspection } from '@getrentos/shared';

/**
 * A buyer's pre-purchase inspection (blueprint §8.4, US-06): the shared
 * inspection the Land Watch screens use, plus the land and the buyer's
 * questions. Mirrors `land-pre-purchase-inspection.service.ts`.
 */
export interface PrePurchaseInspection extends LandWatchInspection {
  land: string;
  city: string;
  state: string;
  instructions?: string | null;
  reinspectionOfId?: string;
  questions: PrePurchaseInspectionQuestion[];
  disclaimer: string;
}

export interface PrePurchaseInspectionQuestion {
  id: string;
  question: string;
  askedAt: string;
  answer?: string;
  answeredAt?: string;
}

export type InspectionFocus =
  | 'BEACONS'
  | 'ACCESS'
  | 'OCCUPATION'
  | 'ENCROACHMENT'
  | 'DRAINAGE'
  | 'NEIGHBOURS';

/** What the buyer can ask the inspector to look at; matches the backend list. */
export const INSPECTION_FOCUS_LABELS: Record<InspectionFocus, string> = {
  BEACONS: 'Find and photograph every boundary beacon',
  ACCESS: 'Show the access road and how the land is reached',
  OCCUPATION: 'Check whether anyone is living on, farming or building on the land',
  ENCROACHMENT: 'Look for fences, foundations or structures crossing the boundary',
  DRAINAGE: 'Note drainage, flooding signs and the state of the ground',
  NEIGHBOURS: 'Photograph the neighbouring plots and anything notable nearby',
};

export const PRE_PURCHASE_DISCLAIMER =
  'An inspection records what the land looks like on the day. It is not a registry search or a survey, and it does not confirm who owns the land.';
