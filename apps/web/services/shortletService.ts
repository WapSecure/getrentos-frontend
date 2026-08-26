import { authFetch, safeCall, toQuery, type Paginated } from '@/lib/apiHelpers';
import type {
  BlockShortletDatesInput,
  BlockedDateRange,
  CreateShortletBookingInput,
  CreateShortletListingInput,
  ShortletAvailability,
  ShortletBooking,
  ShortletListing,
  UpdateShortletListingInput,
} from '@/types/shortlet';

export interface ShortletListParams {
  page?: number;
  pageSize?: number;
  city?: string;
  state?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  checkIn?: string;
  checkOut?: string;
}

const listQuery = (params: ShortletListParams): string =>
  toQuery({
    page: params.page,
    pageSize: params.pageSize,
    city: params.city,
    state: params.state,
    guests: params.guests,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    sort: params.sort,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
  });

export const shortletService = {
  // -------- Public marketplace --------
  listPublic: (params: ShortletListParams = {}) =>
    safeCall(() => authFetch<Paginated<ShortletListing>>(`/shortlets${listQuery(params)}`)),

  getListing: (listingId: string) =>
    safeCall(() => authFetch<ShortletListing>(`/shortlets/${listingId}`)),

  availability: (listingId: string, checkIn?: string, checkOut?: string) =>
    safeCall(() =>
      authFetch<ShortletAvailability>(
        `/shortlets/${listingId}/availability${toQuery({ checkIn, checkOut })}`
      )
    ),

  // -------- Guest --------
  book: (listingId: string, input: CreateShortletBookingInput) =>
    safeCall(() =>
      authFetch<ShortletBooking>(`/shortlets/${listingId}/book`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    ),

  myBookings: (params: ShortletListParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<ShortletBooking>>(`/shortlets/bookings${listQuery(params)}`)
    ),

  cancelBooking: (bookingId: string) =>
    safeCall(() =>
      authFetch<ShortletBooking>(`/shortlets/bookings/${bookingId}/cancel`, { method: 'POST' })
    ),

  // -------- Host --------
  createListing: (input: CreateShortletListingInput) =>
    safeCall(() =>
      authFetch<ShortletListing>('/host/shortlets', { method: 'POST', body: JSON.stringify(input) })
    ),

  updateListing: (listingId: string, input: UpdateShortletListingInput) =>
    safeCall(() =>
      authFetch<ShortletListing>(`/host/shortlets/${listingId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      })
    ),

  setListingStatus: (listingId: string, status: 'PUBLISHED' | 'PAUSED' | 'CLOSED') =>
    safeCall(() =>
      authFetch<ShortletListing>(`/host/shortlets/${listingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),

  myListings: (params: ShortletListParams = {}) =>
    safeCall(() => authFetch<Paginated<ShortletListing>>(`/host/shortlets${listQuery(params)}`)),

  hostBookings: (params: ShortletListParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<ShortletBooking>>(`/host/shortlets/bookings${listQuery(params)}`)
    ),

  approveBooking: (bookingId: string) =>
    safeCall(() =>
      authFetch<ShortletBooking>(`/host/shortlets/bookings/${bookingId}/approve`, {
        method: 'POST',
      })
    ),

  declineBooking: (bookingId: string) =>
    safeCall(() =>
      authFetch<ShortletBooking>(`/host/shortlets/bookings/${bookingId}/decline`, {
        method: 'POST',
      })
    ),

  blockDates: (listingId: string, input: BlockShortletDatesInput) =>
    safeCall(() =>
      authFetch<BlockedDateRange>(`/host/shortlets/${listingId}/blocked-dates`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    ),

  listBlockedDates: (listingId: string) =>
    safeCall(() => authFetch<BlockedDateRange[]>(`/host/shortlets/${listingId}/blocked-dates`)),

  unblockDates: (blockedDateId: string) =>
    safeCall(() =>
      authFetch(`/host/shortlets/blocked-dates/${blockedDateId}`, { method: 'DELETE' })
    ),
};
