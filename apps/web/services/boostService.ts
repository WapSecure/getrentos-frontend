import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type { PlanTier } from '@sureground/shared';

export type BoostPack = 'single' | 'ten';

export interface BoostSummary {
  tier: PlanTier;
  includedPerMonth: number;
  includedLeft: number;
  purchasedLeft: number;
  days: number;
  prices: { singleKobo: number; tenPackKobo: number };
}

export interface BoostResult {
  listingId: string;
  source: 'INCLUDED' | 'PURCHASED';
  boostedUntil: string;
  summary: BoostSummary;
}

export const boostService = {
  async summary(): Promise<ApiResponse<BoostSummary>> {
    return safeCall(() => authFetch<BoostSummary>('/boosts'));
  },

  async checkout(
    pack: BoostPack
  ): Promise<ApiResponse<{ authorizationUrl: string; reference: string }>> {
    return safeCall(() =>
      authFetch('/boosts/checkout', { method: 'POST', body: JSON.stringify({ pack }) })
    );
  },

  async verify(
    reference: string
  ): Promise<ApiResponse<{ status: 'PAID' | 'PENDING' | 'FAILED'; summary: BoostSummary }>> {
    return safeCall(() =>
      authFetch(`/boosts/checkout/${encodeURIComponent(reference)}/verify`, { method: 'POST' })
    );
  },

  async boostListing(listingId: string): Promise<ApiResponse<BoostResult>> {
    return safeCall(() =>
      authFetch<BoostResult>(`/boosts/listings/${encodeURIComponent(listingId)}`, {
        method: 'POST',
      })
    );
  },
};
