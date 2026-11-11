import { ROUTES } from '@sureground/shared';

/** Video tours and pre-purchase inspections, for land and built homes. */
export const VISIT_ROUTES = {
  /** Every tour the buyer asked for: homes and land. */
  BUYER_TOURS: '/buyer/tours',
  BUYER_LAND_TOURS: '/buyer/land/tours',
  OWNER_TOURS: '/owner/tours',
  OWNER_LAND_TOURS: '/owner/land/tours',
  BUYER_INSPECTIONS: '/buyer/inspections',
  BUYER_LAND_INSPECTIONS: '/buyer/land/inspections',
} as const;

/**
 * Where a buyer goes to find something to tour or inspect: tours and inspections are booked from a
 * listing, so the land screens point at land and the general ones at every property.
 */
export const findPropertyHref = (scope: 'land' | 'all') =>
  scope === 'land' ? ROUTES.LAND_MARKETPLACE : ROUTES.BUYER_DISCOVER;
