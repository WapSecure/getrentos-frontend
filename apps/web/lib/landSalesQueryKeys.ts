import type { BuyerLandPurchaseListParams, PublicLandLayoutListParams } from '@/types/landBuyer';
import type { LandMarketInsightsParams } from '@/types/landMarket';

/**
 * Query keys for estate sales, land market intelligence and outside reviews.
 * Separate from `lib/queryKeys.ts` so the land-enterprise screens can evolve
 * without touching the shared key map.
 */
export const landLayoutKeys = {
  all: ['land', 'layouts'] as const,
  list: (params: PublicLandLayoutListParams) => ['land', 'layouts', 'list', params] as const,
  detail: (layoutId: string) => ['land', 'layouts', 'detail', layoutId] as const,
};

export const buyerLandKeys = {
  all: ['buyer', 'land'] as const,
  reservations: ['buyer', 'land', 'reservations'] as const,
  purchases: ['buyer', 'land', 'purchases'] as const,
  purchaseList: (params: BuyerLandPurchaseListParams) =>
    ['buyer', 'land', 'purchases', 'list', params] as const,
  purchase: (purchaseId: string) => ['buyer', 'land', 'purchases', 'detail', purchaseId] as const,
  statement: (purchaseId: string) =>
    ['buyer', 'land', 'purchases', 'statement', purchaseId] as const,
  transactionMilestones: (txId: string) =>
    ['buyer', 'land', 'transactions', txId, 'milestones'] as const,
};

export const landMarketKeys = {
  insights: (params: LandMarketInsightsParams) => ['land', 'market', 'insights', params] as const,
  comparables: (listingId: string) => ['land', 'market', 'comparables', listingId] as const,
};

export const landReviewKeys = {
  all: ['land', 'reviews'] as const,
  list: (page: number) => ['land', 'reviews', 'list', page] as const,
  seat: (seatId: string) => ['land', 'reviews', 'seat', seatId] as const,
};
