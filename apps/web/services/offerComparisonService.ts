import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { OfferComparison } from '@/types/offerComparison';

export const offerComparisonService = {
  compare: () => safeCall<OfferComparison>(() => authFetch('/seller/offers/compare')),
};
