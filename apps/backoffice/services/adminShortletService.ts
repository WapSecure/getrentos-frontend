import { authFetch, safeCall, toQuery } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import type { Paginated } from '@/services/adminService';
import type {
  AdminShortletBooking,
  AdminShortletListing,
  AdminShortletOverview,
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
};
