import { apiFetch } from './client';

/** "Can I afford it?": every figure worked out by Sureground. Income is never stored. */
export interface Affordability {
  listingId: string;
  monthlyIncome: number | null;
  incomeSource: 'entered' | 'last_application' | null;
  band: 'comfortable' | 'stretched' | 'high' | 'unknown';
  verdict: string;
  rent: { amount: string; period: 'per month' | 'per year'; perYear: string };
  moveIn: { firstPayment: string; deposit: string | null; total: string };
  savingPlan: string | null;
  toAsk: string[];
}

export interface AffordabilityInput {
  monthlyIncome?: number | null;
  savings?: number | null;
  monthlySaving?: number | null;
}

/** One home in a shortlist comparison. */
export interface ComparedHome {
  listingId: string;
  label: string;
  title: string;
  rentPerYear: string;
  pricePosition: string;
  vsSimilar: string | null;
  moveInCash: string;
  listingCheck: 'looks_good' | 'check_carefully' | 'be_cautious';
  warnings: string[];
  standsOut: string;
}

export interface ShortlistComparison {
  overview: string;
  homes: ComparedHome[];
  source: 'ai' | 'heuristic';
  disclaimer: string;
}

export const rentDecisionApi = {
  affordability: (listingId: string, input: AffordabilityInput = {}) => {
    const qs = Object.entries(input)
      .filter(([, v]) => v != null && v > 0)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return apiFetch<Affordability>(
      `/renter/listings/${listingId}/affordability${qs ? `?${qs}` : ''}`
    );
  },
  compare: (listingIds: string[]) =>
    apiFetch<ShortlistComparison>('/renter/listings/compare', {
      method: 'POST',
      body: { listingIds },
    }),
};
