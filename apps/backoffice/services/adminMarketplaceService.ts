import { authDownload, authFetch, safeCall, toQuery } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import type { Paginated } from './adminService';
import type {
  AdminAgent,
  AdminAgentDetail,
  AdminMarketplaceListing,
  AdminMarketplaceListingDetail,
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

  listingDetail(listingId: string): Promise<ApiResponse<AdminMarketplaceListingDetail>> {
    return safeCall(() =>
      authFetch<AdminMarketplaceListingDetail>(`/admin/marketplace/listings/${listingId}`)
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

  pauseListing(id: string) {
    return safeCall(() => authFetch(`/admin/marketplace/listings/${id}/pause`, { method: 'POST' }));
  },
  resumeListing(id: string) {
    return safeCall(() =>
      authFetch(`/admin/marketplace/listings/${id}/resume`, { method: 'POST' })
    );
  },
  closeListing(id: string) {
    return safeCall(() => authFetch(`/admin/marketplace/listings/${id}/close`, { method: 'POST' }));
  },
  flagListing(id: string) {
    return safeCall(() => authFetch(`/admin/marketplace/listings/${id}/flag`, { method: 'POST' }));
  },
  approveListing(id: string) {
    return safeCall(() =>
      authFetch(`/admin/marketplace/listings/${id}/approve`, { method: 'POST' })
    );
  },
  expireOffer(id: string, reason: string) {
    return safeCall(() =>
      authFetch(`/admin/marketplace/offers/${id}/expire`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
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

  suspendRealtor(id: string, reason: string, expiresAt?: string) {
    return safeCall(() =>
      authFetch(`/admin/realtors/${id}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason, expiresAt }),
      })
    );
  },
  restoreRealtor(id: string, reason: string) {
    return safeCall(() =>
      authFetch(`/admin/realtors/${id}/restore`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    );
  },
  revokeRealtorClient(realtorId: string, relationshipId: string, reason: string) {
    return safeCall(() =>
      authFetch(`/admin/realtors/${realtorId}/clients/${relationshipId}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    );
  },
  exportRealtors(params: ListRealtorsParams = {}): Promise<Blob> {
    const query = toQuery({
      search: params.search,
      licenseStatus: params.licenseStatus,
      page: params.page,
      pageSize: params.pageSize,
    });
    return authDownload(`/admin/realtors/export${query}`);
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

  suspendAgent(id: string, reason: string, expiresAt?: string) {
    return safeCall(() =>
      authFetch(`/admin/agents/${id}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason, expiresAt }),
      })
    );
  },
  restoreAgent(id: string, reason: string) {
    return safeCall(() =>
      authFetch(`/admin/agents/${id}/restore`, { method: 'POST', body: JSON.stringify({ reason }) })
    );
  },
  revokeAgentClient(agentId: string, relationshipId: string, reason: string) {
    return safeCall(() =>
      authFetch(`/admin/agents/${agentId}/clients/${relationshipId}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    );
  },
  reassignAgentTask(taskId: string, newAgentId: string, reason: string) {
    return safeCall(() =>
      authFetch(`/admin/agents/tasks/${taskId}/reassign`, {
        method: 'POST',
        body: JSON.stringify({ newAgentId, reason }),
      })
    );
  },
  setAgentTaskStatus(taskId: string, status: string, reason: string) {
    return safeCall(() =>
      authFetch(`/admin/agents/tasks/${taskId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, reason }),
      })
    );
  },
  exportAgents(params: ListProfessionalsParams = {}): Promise<Blob> {
    const query = toQuery({
      search: params.search,
      page: params.page,
      pageSize: params.pageSize,
    });
    return authDownload(`/admin/agents/export${query}`);
  },
};
