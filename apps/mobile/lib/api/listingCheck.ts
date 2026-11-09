import { apiFetch } from './client';

export type ListingCheckLevel = 'looks_good' | 'check_carefully' | 'be_cautious';

/** "Should I rent this?" — facts by Sureground, level by rule, wording possibly automated. */
export interface ListingCheck {
  listingId: string;
  level: ListingCheckLevel;
  headline: string;
  summary: string;
  checklist: string[];
  facts: {
    listingVerified: boolean;
    landlord: { verified: boolean; trustScore: number; memberForMonths: number | null };
    price: {
      amount: string;
      period: 'per year' | 'per night';
      comparables: number;
      median: string | null;
      typicalRange: { low: string; high: string } | null;
      vsMedianPercent: number | null;
    };
    daysListed: number | null;
    photos: number;
    warnings: string[];
  };
  source: 'ai' | 'heuristic';
}

export const listingCheckApi = {
  check: (listingId: string) => apiFetch<ListingCheck>(`/renter/listings/${listingId}/check`),
};
