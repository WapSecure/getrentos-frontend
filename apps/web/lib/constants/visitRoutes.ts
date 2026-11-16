import { ROUTES } from '@sureground/shared';

export const VISIT_ROUTES = {
  BUYER_TOURS: '/buyer/tours',
  BUYER_LAND_TOURS: '/buyer/land/tours',
  OWNER_TOURS: '/owner/tours',
  OWNER_LAND_TOURS: '/owner/land/tours',
  BUYER_INSPECTIONS: '/buyer/inspections',
  BUYER_LAND_INSPECTIONS: '/buyer/land/inspections',
} as const;

export const findPropertyHref = (scope: 'land' | 'all') =>
  scope === 'land' ? ROUTES.LAND_MARKETPLACE : ROUTES.BUYER_DISCOVER;
