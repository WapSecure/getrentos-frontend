import { authFetch, safeCall, toQuery } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import type { Paginated } from './adminService';
import type {
  AdminAgent,
  AdminAgentDetail,
  AdminMarketplaceListing,
  AdminMarketplaceOffer,
  AdminMarketplaceOfferDetail,
  AdminMarketplaceOverview,
  AdminRealtor,
  AdminRealtorDetail,
} from '@/types/marketplace';

export interface ListMarketplaceListingsParams {
  search?: string;
  status?: string;
  sellerId?: string;
  page?: number;
  pageSize?: number;
}

export interface ListMarketplaceOffersParams {
  status?: string;
  listingId?: string;
  buyerId?: string;
  sellerId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListProfessionalsParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListRealtorsParams extends ListProfessionalsParams {
  licenseStatus?: string;
}

/** Backoffice sales-domain oversight (marketplace sales + realtor/agent registers). */
export const adminMarketplaceService = {
  // ---------------- Marketplace sales ----------------

  overview(): Promise<ApiResponse<AdminMarketplaceOverview>> {
    return safeCall(() => authFetch<AdminMarketplaceOverview>('/admin/marketplace/overview'));
  },

  listListings(
    params: ListMarketplaceListingsParams = {}
  ): Promise<ApiResponse<Paginated<AdminMarketplaceListing>>> {
    const query = toQuery({
      search: params.search,
      status: params.status,
      sellerId: params.sellerId,
      page: params.page,
      pageSize: params.pageSize,
    });
    return safeCall(() =>
      authFetch<Paginated<AdminMarketplaceListing>>(`/admin/marketplace/listings${query}`)
    );
  },

  listOffers(
    params: ListMarketplaceOffersParams = {}
  ): Promise<ApiResponse<Paginated<AdminMarketplaceOffer>>> {
    const query = toQuery({
      status: params.status,
      listingId: params.listingId,
      buyerId: params.buyerId,
      sellerId: params.sellerId,
      search: params.search,
      page: params.page,
      pageSize: params.pageSize,
    });
    return safeCall(() =>
      authFetch<Paginated<AdminMarketplaceOffer>>(`/admin/marketplace/offers${query}`)
    );
  },

  offerDetail(offerId: string): Promise<ApiResponse<AdminMarketplaceOfferDetail>> {
    return safeCall(() =>
      authFetch<AdminMarketplaceOfferDetail>(`/admin/marketplace/offers/${offerId}`)
    );
  },

  // ---------------- Realtor register ----------------

  listRealtors(params: ListRealtorsParams = {}): Promise<ApiResponse<Paginated<AdminRealtor>>> {
    const query = toQuery({
      search: params.search,
      licenseStatus: params.licenseStatus,
      page: params.page,
      pageSize: params.pageSize,
    });
    return safeCall(() => authFetch<Paginated<AdminRealtor>>(`/admin/realtors${query}`));
  },

  realtorDetail(realtorId: string): Promise<ApiResponse<AdminRealtorDetail>> {
    return safeCall(() => authFetch<AdminRealtorDetail>(`/admin/realtors/${realtorId}`));
  },

  // ---------------- Agent register ----------------

  listAgents(params: ListProfessionalsParams = {}): Promise<ApiResponse<Paginated<AdminAgent>>> {
    const query = toQuery({
      search: params.search,
      page: params.page,
      pageSize: params.pageSize,
    });
    return safeCall(() => authFetch<Paginated<AdminAgent>>(`/admin/agents${query}`));
  },

  agentDetail(agentId: string): Promise<ApiResponse<AdminAgentDetail>> {
    return safeCall(() => authFetch<AdminAgentDetail>(`/admin/agents/${agentId}`));
  },
};
