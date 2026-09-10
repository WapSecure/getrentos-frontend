import { authFetch, safeCall, toQuery } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import type { Paginated } from '@/services/adminService';
import type {
  AdminRentalApplication,
  AdminRentalEviction,
  AdminRentalLease,
  AdminRentalListing,
  AdminRentalListingDetail,
  AdminRentalOverview,
  AdminRentalRenewal,
  AdminRentalTermination,
  AdminRentalViewing,
  AdminRentalUnit,
  RentalEvictionStatus,
  RentalLeaseStatus,
} from '@/types/rental';

export interface RentalListParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface UnitListParams extends RentalListParams {
  propertyId?: string;
  occupancyStatus?: string;
}

const listResource = <T>(
  resource: string,
  params: RentalListParams = {}
): Promise<ApiResponse<Paginated<T>>> => {
  const query = toQuery({
    search: params.search,
    status: params.status,
    page: params.page,
    pageSize: params.pageSize,
  });
  return safeCall(() => authFetch<Paginated<T>>(`/admin/rentals/${resource}${query}`));
};

const post = <T>(path: string, body?: unknown): Promise<ApiResponse<T>> =>
  safeCall(() =>
    authFetch<T>(`/admin/rentals/${path}`, {
      method: 'POST',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  );

/** Backoffice oversight for the long-term rental vertical (listings → evictions). */
export const adminRentalService = {
  overview(): Promise<ApiResponse<AdminRentalOverview>> {
    return safeCall(() => authFetch<AdminRentalOverview>('/admin/rentals/overview'));
  },

  listUnits(params: UnitListParams = {}): Promise<ApiResponse<Paginated<AdminRentalUnit>>> {
    const query = toQuery({
      search: params.search,
      propertyId: params.propertyId,
      occupancyStatus: params.occupancyStatus,
      page: params.page,
      pageSize: params.pageSize,
    });
    return safeCall(() => authFetch<Paginated<AdminRentalUnit>>(`/admin/rentals/units${query}`));
  },
  assignUnitTenant(id: string, tenantName: string): Promise<ApiResponse<void>> {
    return post<void>(`units/${id}/tenant`, { tenantName });
  },
  removeUnitTenant(id: string): Promise<ApiResponse<void>> {
    return post<void>(`units/${id}/remove-tenant`);
  },
  bulkUnitPricing(unitIds: string[], monthlyRent: number): Promise<ApiResponse<{ requestedCount: number; updatedCount: number }>> {
    return post('units/bulk-pricing', { unitIds, monthlyRent });
  },
  bulkUnitCharges(input: { unitIds: string[]; amount: number; dueDate: string; category: string; billingCycle: string }): Promise<ApiResponse<{ requestedCount: number; createdCount: number; skippedUnitIds: string[] }>> {
    return post('units/bulk-charges', input);
  },

  listListings(params: RentalListParams = {}): Promise<ApiResponse<Paginated<AdminRentalListing>>> {
    return listResource<AdminRentalListing>('listings', params);
  },
  listingDetail(listingId: string): Promise<ApiResponse<AdminRentalListingDetail>> {
    return safeCall(() => authFetch<AdminRentalListingDetail>(`/admin/rentals/listings/${listingId}`));
  },
  pauseListing(listingId: string): Promise<ApiResponse<AdminRentalListing>> {
    return post<AdminRentalListing>(`listings/${listingId}/pause`);
  },
  resumeListing(listingId: string): Promise<ApiResponse<AdminRentalListing>> {
    return post<AdminRentalListing>(`listings/${listingId}/resume`);
  },
  closeListing(listingId: string): Promise<ApiResponse<AdminRentalListing>> {
    return post<AdminRentalListing>(`listings/${listingId}/close`);
  },
  flagListing(listingId: string): Promise<ApiResponse<AdminRentalListing>> {
    return post<AdminRentalListing>(`listings/${listingId}/flag`);
  },
  approveListing(listingId: string): Promise<ApiResponse<AdminRentalListing>> {
    return post<AdminRentalListing>(`listings/${listingId}/approve`);
  },

  listApplications(
    params: RentalListParams = {}
  ): Promise<ApiResponse<Paginated<AdminRentalApplication>>> {
    return listResource<AdminRentalApplication>('applications', params);
  },
  approveApplication(id: string): Promise<ApiResponse<AdminRentalApplication>> {
    return post<AdminRentalApplication>(`applications/${id}/approve`);
  },
  rejectApplication(id: string, reason?: string): Promise<ApiResponse<AdminRentalApplication>> {
    return post<AdminRentalApplication>(
      `applications/${id}/reject`,
      reason ? { reason } : undefined
    );
  },
  reopenApplication(id: string): Promise<ApiResponse<AdminRentalApplication>> {
    return post<AdminRentalApplication>(`applications/${id}/reopen`);
  },

  listViewings(params: RentalListParams = {}): Promise<ApiResponse<Paginated<AdminRentalViewing>>> {
    return listResource<AdminRentalViewing>('viewings', params);
  },
  confirmViewing(id: string): Promise<ApiResponse<AdminRentalViewing>> {
    return post<AdminRentalViewing>(`viewings/${id}/confirm`);
  },
  completeViewing(id: string): Promise<ApiResponse<AdminRentalViewing>> {
    return post<AdminRentalViewing>(`viewings/${id}/complete`);
  },
  cancelViewing(id: string): Promise<ApiResponse<AdminRentalViewing>> {
    return post<AdminRentalViewing>(`viewings/${id}/cancel`);
  },

  listLeases(params: RentalListParams = {}): Promise<ApiResponse<Paginated<AdminRentalLease>>> {
    return listResource<AdminRentalLease>('leases', params);
  },
  updateLeaseStatus(id: string, status: RentalLeaseStatus): Promise<ApiResponse<AdminRentalLease>> {
    return post<AdminRentalLease>(`leases/${id}/status`, { status });
  },

  listRenewals(params: RentalListParams = {}): Promise<ApiResponse<Paginated<AdminRentalRenewal>>> {
    return listResource<AdminRentalRenewal>('renewals', params);
  },
  acceptRenewal(id: string): Promise<ApiResponse<AdminRentalRenewal>> {
    return post<AdminRentalRenewal>(`renewals/${id}/accept`);
  },
  declineRenewal(id: string): Promise<ApiResponse<AdminRentalRenewal>> {
    return post<AdminRentalRenewal>(`renewals/${id}/decline`);
  },

  listTerminations(
    params: RentalListParams = {}
  ): Promise<ApiResponse<Paginated<AdminRentalTermination>>> {
    return listResource<AdminRentalTermination>('terminations', params);
  },
  approveTermination(id: string): Promise<ApiResponse<AdminRentalTermination>> {
    return post<AdminRentalTermination>(`terminations/${id}/approve`);
  },
  rejectTermination(id: string): Promise<ApiResponse<AdminRentalTermination>> {
    return post<AdminRentalTermination>(`terminations/${id}/reject`);
  },

  listEvictions(
    params: RentalListParams = {}
  ): Promise<ApiResponse<Paginated<AdminRentalEviction>>> {
    return listResource<AdminRentalEviction>('evictions', params);
  },
  updateEvictionStatus(
    id: string,
    status: RentalEvictionStatus
  ): Promise<ApiResponse<AdminRentalEviction>> {
    return post<AdminRentalEviction>(`evictions/${id}/status`, { status });
  },
};
