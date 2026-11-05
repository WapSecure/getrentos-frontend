import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { OfferComparison } from '@/types/offerComparison';

export const offerComparisonService = {
  /** Live offers side by side for every listing the seller (owner, landlord or manager) controls. */
  compare: () => safeCall<OfferComparison>(() => authFetch('/seller/offers/compare')),
};
