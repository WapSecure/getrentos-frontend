import type { LandAssuranceTier, LandTitleType } from '@/types/land';

/**
 * Public land market intelligence, mirroring the backend's `land-insights.dto.ts`.
 * Figures cover verified, in-date listings only. Money is whole naira.
 */

export interface LandMarketInsightsParams {
  state?: string;
  city?: string;
  /** An estate's public storefront slug. */
  estate?: string;
  titleType?: LandTitleType;
}

export interface NairaDistribution {
  /** Listings that contributed (those with a recorded area, for ₦/m²). */
  sampleSize: number;
  min?: number;
  p25?: number;
  median?: number;
  p75?: number;
  max?: number;
}

export interface LandTitleTypeBreakdown {
  /** Null groups listings whose title type was never recorded. */
  titleType: LandTitleType | null;
  count: number;
  medianPricePerSqm?: number;
}

export interface LandMarketTrendPoint {
  /** "YYYY-MM", UTC. */
  month: string;
  count: number;
  medianPricePerSqm?: number;
}

export interface LandMarketInsights {
  count: number;
  pricePerSqm: NairaDistribution;
  medianPrice?: number;
  medianAreaSqm?: number;
  byTitleType: LandTitleTypeBreakdown[];
  /** Six months, oldest first. */
  trend: LandMarketTrendPoint[];
  /** True when the sample hit the scan cap, so figures cover the newest listings only. */
  truncated: boolean;
  generatedAt: string;
}

export interface LandComparable {
  /** Listing id. */
  id: string;
  title: string;
  city: string;
  state: string;
  estateName?: string;
  price: number;
  areaSqm?: number;
  pricePerSqm?: number;
  titleType?: LandTitleType;
  /** 0-1; location dominates, then ₦/m² and area closeness. */
  similarity: number;
}

export interface LandComparables {
  listingId: string;
  subjectPricePerSqm?: number;
  /** Where the subject's ₦/m² sits among the comparables returned, 0-100. */
  subjectPercentile?: number;
  comparablesMedianPricePerSqm?: number;
  comparables: LandComparable[];
}

/** Assurance tiers from weakest to strongest, for "at least this tier" filters. */
export const LAND_ASSURANCE_TIER_ORDER: LandAssuranceTier[] = ['BASIC', 'STANDARD', 'PREMIUM'];

export const LAND_ASSURANCE_TIER_DESCRIPTIONS: Record<LandAssuranceTier, string> = {
  BASIC: 'Ownership and diligence verified by GetRentos.',
  STANDARD: 'Verified, with a registry search on the title.',
  PREMIUM: 'Registry-searched and reviewed by an independent professional.',
};
