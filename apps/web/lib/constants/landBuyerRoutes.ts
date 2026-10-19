/**
 * Web routes for developer estates, the buyer's land hub, land market
 * intelligence and the outside reviewer's desk.
 *
 * Kept out of the shared ROUTES map because only the web app has these screens.
 */
export const LAND_BUYER_ROUTES = {
  /** Public: estates selling plots. */
  LAYOUTS: '/land/layouts',
  layout: (layoutId: string, plotId?: string) =>
    `/land/layouts/${layoutId}${plotId ? `?plot=${encodeURIComponent(plotId)}` : ''}`,
  /** Public: asking prices per square metre across verified land. */
  MARKET_INSIGHTS: '/land/market',
  /** Public listing detail (rendered by the shared public listing page). */
  listing: (listingId: string) => `/land/${listingId}`,

  /** Buyer: reservations and purchases. */
  HUB: '/buyer/land/purchases',
  HUB_RESERVATIONS: '/buyer/land/purchases?tab=reservations',
  purchase: (purchaseId: string) => `/buyer/land/purchases/${purchaseId}`,
  /** Buyer: conveyance steps on a single-parcel resale (a marketplace transaction). */
  transactionConveyance: (txId: string) => `/buyer/land/transactions/${txId}`,

  /** Any signed-in account with a seat. */
  REVIEWS: '/land/reviews',
  ACCREDITATION: '/land/reviews/accreditation',
  review: (seatId: string) => `/land/reviews/${seatId}`,
} as const;

/** The sign-in page, sending the visitor back to `path` afterwards. */
export const signInThen = (path: string) => `/login?next=${encodeURIComponent(path)}`;
