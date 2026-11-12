import type { LandWatchInspection } from '@sureground/shared';
import type { TourPlace } from './siteTour';

/** Mirrors `land-pre-purchase-inspection.service.ts`: land and built homes for sale. */
export interface PrePurchaseInspection extends LandWatchInspection {
  /** The place's name: the parcel, the plot or the home. */
  land: string;
  city: string;
  state: string;
  /** Set for a built home. */
  propertyId?: string | null;
  place?: 'land' | 'property';
  /** The listing's cover photo, once the API sends it; until then the list shows the place icon. */
  coverImageUrl?: string | null;
  instructions?: string | null;
  reinspectionOfId?: string;
  /** Can back a reservation held subject to it. */
  plotId?: string;
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

export type LandInspectionFocus =
  | 'BEACONS'
  | 'ACCESS'
  | 'OCCUPATION'
  | 'ENCROACHMENT'
  | 'DRAINAGE'
  | 'NEIGHBOURS';

export type HomeInspectionFocus =
  | 'STRUCTURE'
  | 'ROOF'
  | 'DAMP'
  | 'SERVICES'
  | 'ROOMS'
  | 'ACCESS'
  | 'NEIGHBOURS';

export type InspectionFocus = LandInspectionFocus | HomeInspectionFocus;

/** Match the backend lists; the API checks the keys fit the place. */
export const INSPECTION_FOCUS_LABELS: {
  land: Record<LandInspectionFocus, string>;
  home: Record<HomeInspectionFocus, string>;
} = {
  land: {
    BEACONS: 'Find and photograph every boundary beacon',
    ACCESS: 'Show the access road and how the land is reached',
    OCCUPATION: 'Check whether anyone is living on, farming or building on the land',
    ENCROACHMENT: 'Look for fences, foundations or structures crossing the boundary',
    DRAINAGE: 'Note drainage, flooding signs and the state of the ground',
    NEIGHBOURS: 'Photograph the neighbouring plots and anything notable nearby',
  },
  home: {
    STRUCTURE: 'Look for cracks in walls, floors and ceilings, and photograph any you find',
    ROOF: 'Check the roof and ceilings for leaks or water stains',
    DAMP: 'Look for damp, mould and signs of flooding',
    SERVICES: 'Check the water, power and drainage, and photograph the meters',
    ROOMS: 'Photograph every room, with its doors, windows and fittings',
    ACCESS: 'Show the road, the gate and how the property is reached',
    NEIGHBOURS: 'Photograph the neighbouring buildings and anything notable nearby',
  },
};

export const PRE_PURCHASE_DISCLAIMER: Record<TourPlace, string> = {
  land: 'An inspection records what the land looks like on the day. It is not a registry search or a survey, and it does not confirm who owns the land.',
  home: 'An inspection records what the property looks like on the day. It is not a structural survey or a valuation, and it does not confirm who owns the property.',
};
