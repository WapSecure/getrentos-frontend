import {
  authFetch,
  safeCall,
  toQuery,
  unwrapOptional,
  type ApiResponse,
  type Paginated,
} from '@/lib/apiHelpers';
import type {
  HomeManagementWorkOrder,
  HomeManagementWorkOrdersParams,
} from '@/services/homeManagementService';
import type {
  InvestorAvailability,
  InvestorOverview,
  InvestorProfile,
  InvestorProfileInput,
  ListingAnalysis,
  ListingAnalysisInput,
  RiskDeclaration,
} from '@/types/investor';
import type { InvestorManaged } from '@/types/managed';

export const investorService = {
  availability(): Promise<ApiResponse<InvestorAvailability>> {
    return safeCall(() => authFetch<InvestorAvailability>('/investor/availability'));
  },

  /** Null before the first save: the API answers with an empty 200, which arrives as undefined. */
  getProfile(): Promise<InvestorProfile | null> {
    return unwrapOptional(
      safeCall(() => authFetch<InvestorProfile | null>('/investor/profile')),
      null
    );
  },

  saveProfile(input: InvestorProfileInput): Promise<ApiResponse<InvestorProfile>> {
    return safeCall(() =>
      authFetch<InvestorProfile>('/investor/profile', {
        method: 'PUT',
        body: JSON.stringify(input),
      })
    );
  },

  getRiskDeclaration(): Promise<ApiResponse<RiskDeclaration>> {
    return safeCall(() => authFetch<RiskDeclaration>('/investor/declarations/risk'));
  },

  /** 200 with the declaration; 409 when `version` is no longer current: reload the points and ask again. */
  acceptRiskDeclaration(version: string): Promise<ApiResponse<RiskDeclaration>> {
    return safeCall(() =>
      authFetch<RiskDeclaration>('/investor/declarations/risk', {
        method: 'POST',
        body: JSON.stringify({ version }),
      })
    );
  },

  getOverview(): Promise<ApiResponse<InvestorOverview>> {
    return safeCall(() => authFetch<InvestorOverview>('/investor/overview'));
  },

  /** Every property under Sureground Managed, with what waits on the owner. */
  getManaged(): Promise<ApiResponse<InvestorManaged>> {
    return safeCall(() => authFetch<InvestorManaged>('/investor/managed'));
  },

  /** The jobs on one of my managed properties: read-only, no Pro plan needed, same shape as home management. */
  getManagedWorkOrders(
    propertyId: string,
    params: Omit<HomeManagementWorkOrdersParams, 'propertyId'> = {}
  ): Promise<ApiResponse<Paginated<HomeManagementWorkOrder>>> {
    return safeCall(() =>
      authFetch<Paginated<HomeManagementWorkOrder>>(
        `/investor/managed/${encodeURIComponent(propertyId)}/work-orders${toQuery(params)}`
      )
    );
  },

  /** Public. 404 unless the listing is investment eligible. Only the figures given replace the defaults. */
  getListingAnalysis(
    listingId: string,
    input: ListingAnalysisInput = {}
  ): Promise<ApiResponse<ListingAnalysis>> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'number' && Number.isFinite(value)) query.set(key, String(value));
    }
    const qs = query.toString();
    return safeCall(() =>
      authFetch<ListingAnalysis>(
        `/marketplace/listings/${encodeURIComponent(listingId)}/analysis${qs ? `?${qs}` : ''}`
      )
    );
  },
};
