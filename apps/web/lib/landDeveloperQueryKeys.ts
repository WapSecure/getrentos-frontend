import type { LandPlotStatus, SellerLandPurchaseListParams } from '@/types/landDeveloper';

/**
 * React Query keys for the developer / seller side of land. Everything sits
 * under `['land', 'developer']` so a single invalidation can refresh it all.
 */
export const landDeveloperKeys = {
  all: ['land', 'developer'] as const,
  property: (propertyId: string) => ['land', 'developer', 'property', propertyId] as const,
  layout: (propertyId: string) => ['land', 'developer', 'property', propertyId, 'layout'] as const,
  dashboard: (propertyId: string) =>
    ['land', 'developer', 'property', propertyId, 'dashboard'] as const,
  plots: (propertyId: string, params: { status?: LandPlotStatus } = {}) =>
    ['land', 'developer', 'property', propertyId, 'plots', params] as const,
  analytics: (propertyId: string) =>
    ['land', 'developer', 'property', propertyId, 'analytics'] as const,
  risk: (propertyId: string) => ['land', 'developer', 'property', propertyId, 'risk'] as const,
  titleHistory: (propertyId: string) =>
    ['land', 'developer', 'property', propertyId, 'title-history'] as const,
  /** The property's documents; their usage changes whenever something cites one. */
  documents: (propertyId: string) =>
    ['land', 'developer', 'property', propertyId, 'documents'] as const,
  /** Every layout the owner can sell from (owned or under a mandate). */
  layouts: ['land', 'developer', 'layouts'] as const,
  purchases: ['land', 'developer', 'purchases'] as const,
  purchaseList: (params: SellerLandPurchaseListParams) =>
    ['land', 'developer', 'purchases', 'list', params] as const,
  collections: (layoutId?: string) =>
    ['land', 'developer', 'purchases', 'collections', layoutId ?? 'all'] as const,
  purchase: (purchaseId: string) => ['land', 'developer', 'purchases', purchaseId] as const,
  transactionMilestones: (txId: string) =>
    ['land', 'developer', 'transactions', txId, 'milestones'] as const,
};
