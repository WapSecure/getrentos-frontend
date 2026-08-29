import { authFetch, safeCall, toQuery } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import type { Paginated } from '@/services/adminService';
import type {
  AdminShortletBooking,
  AdminShortletDepositClaim,
  AdminShortletDispute,
  AdminShortletDisputeMessage,
  AdminShortletListing,
  AdminShortletOverview,
  AdminShortletPayout,
  ShortletBookingStatus,
  ShortletListingStatus,
} from '@/types/shortlet';

export interface ListShortletListingsParams {
  search?: string;
  status?: ShortletListingStatus;
  page?: number;
  pageSize?: number;
}

export interface ListShortletBookingsParams {
  status?: ShortletBookingStatus;
  listingId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

/** Backoffice-only oversight for the Shortlets v1 marketplace. */
export const adminShortletService = {
  overview(): Promise<ApiResponse<AdminShortletOverview>> {
    return safeCall(() => authFetch<AdminShortletOverview>('/admin/shortlets/overview'));
  },

  listListings(
    params: ListShortletListingsParams = {}
  ): Promise<ApiResponse<Paginated<AdminShortletListing>>> {
    const query = toQuery({
      search: params.search,
      status: params.status,
      page: params.page,
      pageSize: params.pageSize,
    });
    return safeCall(() =>
      authFetch<Paginated<AdminShortletListing>>(`/admin/shortlets/listings${query}`)
    );
  },

  listBookings(
    params: ListShortletBookingsParams = {}
  ): Promise<ApiResponse<Paginated<AdminShortletBooking>>> {
    const query = toQuery({
      status: params.status,
      listingId: params.listingId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      page: params.page,
      pageSize: params.pageSize,
    });
    return safeCall(() =>
      authFetch<Paginated<AdminShortletBooking>>(`/admin/shortlets/bookings${query}`)
    );
  },

  pauseListing(listingId: string): Promise<ApiResponse<AdminShortletListing>> {
    return safeCall(() =>
      authFetch<AdminShortletListing>(`/admin/shortlets/listings/${listingId}/pause`, {
        method: 'POST',
      })
    );
  },

  resumeListing(listingId: string): Promise<ApiResponse<AdminShortletListing>> {
    return safeCall(() =>
      authFetch<AdminShortletListing>(`/admin/shortlets/listings/${listingId}/resume`, {
        method: 'POST',
      })
    );
  },

  closeListing(listingId: string): Promise<ApiResponse<AdminShortletListing>> {
    return safeCall(() =>
      authFetch<AdminShortletListing>(`/admin/shortlets/listings/${listingId}/close`, {
        method: 'POST',
      })
    );
  },

  flagListing(listingId: string): Promise<ApiResponse<AdminShortletListing>> {
    return safeCall(() =>
      authFetch<AdminShortletListing>(`/admin/shortlets/listings/${listingId}/flag`, {
        method: 'POST',
      })
    );
  },

  approveListing(listingId: string): Promise<ApiResponse<AdminShortletListing>> {
    return safeCall(() =>
      authFetch<AdminShortletListing>(`/admin/shortlets/listings/${listingId}/approve`, {
        method: 'POST',
      })
    );
  },

  listPayouts(
    params: { page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<AdminShortletPayout>>> {
    const query = toQuery({ page: params.page, pageSize: params.pageSize });
    return safeCall(() =>
      authFetch<Paginated<AdminShortletPayout>>(`/admin/shortlets/payouts${query}`)
    );
  },

  listDisputes(
    params: {
      status?: string;
      category?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<ApiResponse<Paginated<AdminShortletDispute>>> {
    const query = toQuery({
      status: params.status,
      category: params.category,
      search: params.search,
      page: params.page,
      pageSize: params.pageSize,
    });
    return safeCall(() =>
      authFetch<Paginated<AdminShortletDispute>>(`/admin/shortlets/disputes${query}`)
    );
  },

  disputeMessages(disputeId: string): Promise<ApiResponse<AdminShortletDisputeMessage[]>> {
    return safeCall(() =>
      authFetch<AdminShortletDisputeMessage[]>(`/admin/shortlets/disputes/${disputeId}/messages`)
    );
  },

  sendDisputeMessage(
    disputeId: string,
    text: string
  ): Promise<ApiResponse<AdminShortletDisputeMessage>> {
    return safeCall(() =>
      authFetch<AdminShortletDisputeMessage>(`/admin/shortlets/disputes/${disputeId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
    );
  },

  resolveDispute(
    disputeId: string,
    resolution?: string
  ): Promise<ApiResponse<AdminShortletDispute>> {
    return safeCall(() =>
      authFetch<AdminShortletDispute>(`/admin/shortlets/disputes/${disputeId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution: resolution ?? '' }),
      })
    );
  },

  escalateDispute(disputeId: string): Promise<ApiResponse<AdminShortletDispute>> {
    return safeCall(() =>
      authFetch<AdminShortletDispute>(`/admin/shortlets/disputes/${disputeId}/escalate`, {
        method: 'POST',
      })
    );
  },

  listDepositClaims(
    params: {
      status?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<ApiResponse<Paginated<AdminShortletDepositClaim>>> {
    const query = toQuery({
      status: params.status,
      search: params.search,
      page: params.page,
      pageSize: params.pageSize,
    });
    return safeCall(() =>
      authFetch<Paginated<AdminShortletDepositClaim>>(`/admin/shortlets/deposit-claims${query}`)
    );
  },

  adjudicateDepositClaim(
    claimId: string,
    input: {
      decision: 'APPROVED' | 'PARTIAL' | 'REJECTED';
      resolution?: string;
      deductedAmount?: number;
    }
  ): Promise<ApiResponse<AdminShortletDepositClaim>> {
    return safeCall(() =>
      authFetch<AdminShortletDepositClaim>(
        `/admin/shortlets/deposit-claims/${claimId}/adjudicate`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        }
      )
    );
  },
};
