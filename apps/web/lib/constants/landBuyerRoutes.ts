export const LAND_BUYER_ROUTES = {
  LAYOUTS: '/land/layouts',
  layout: (layoutId: string, plotId?: string) =>
    `/land/layouts/${layoutId}${plotId ? `?plot=${encodeURIComponent(plotId)}` : ''}`,
  MARKET_INSIGHTS: '/land/market',
  listing: (listingId: string) => `/land/${listingId}`,

  HUB: '/buyer/land/purchases',
  HUB_RESERVATIONS: '/buyer/land/purchases?tab=reservations',
  purchase: (purchaseId: string) => `/buyer/land/purchases/${purchaseId}`,
  transactionConveyance: (txId: string) => `/buyer/land/transactions/${txId}`,

  REVIEWS: '/land/reviews',
  ACCREDITATION: '/land/reviews/accreditation',
  review: (seatId: string) => `/land/reviews/${seatId}`,
} as const;

export const signInThen = (path: string) => `/login?next=${encodeURIComponent(path)}`;
