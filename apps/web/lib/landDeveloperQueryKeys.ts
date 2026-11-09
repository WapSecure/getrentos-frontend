import type { LandPlotStatus, SellerLandPurchaseListParams } from '@/types/landDeveloper';

// Everything sits under ['land', 'developer'] so one invalidation refreshes it all.
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
  documents: (propertyId: string) =>
    ['land', 'developer', 'property', propertyId, 'documents'] as const,
  layouts: ['land', 'developer', 'layouts'] as const,
  purchases: ['land', 'developer', 'purchases'] as const,
  purchaseList: (params: SellerLandPurchaseListParams) =>
    ['land', 'developer', 'purchases', 'list', params] as const,
  collections: (layoutId?: string) =>
    ['land', 'developer', 'purchases', 'collections', layoutId ?? 'all'] as const,
  purchase: (purchaseId: string) => ['land', 'developer', 'purchases', purchaseId] as const,
  transactionMilestones: (txId: string) =>
    ['land', 'developer', 'transactions', txId, 'milestones'] as const,
  transactionConditions: (txId: string) =>
    ['land', 'developer', 'transactions', txId, 'conditions'] as const,
};
