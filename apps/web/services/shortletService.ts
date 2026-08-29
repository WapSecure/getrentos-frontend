import { authFetch, safeCall, toQuery, type Paginated } from '@/lib/apiHelpers';
import type {
  BlockShortletDatesInput,
  BlockedDateRange,
  CreateShortletBookingInput,
  CreateShortletListingInput,
  CreateShortletReviewInput,
  OpenShortletDisputeInput,
  ShortletAvailability,
  ShortletBooking,
  ShortletConversation,
  ShortletDispute,
  ShortletDisputeMessage,
  ShortletEarningsAnalytics,
  ShortletListing,
  ShortletPayResponse,
  ShortletPayout,
  ShortletPayoutAccount,
  ShortletReview,
  UpdateShortletListingInput,
  UpsertPayoutAccountInput,
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

  payBooking: (bookingId: string) =>
    safeCall(() =>
      authFetch<ShortletPayResponse>(`/shortlets/bookings/${bookingId}/pay`, { method: 'POST' })
    ),

  createReview: (bookingId: string, input: CreateShortletReviewInput) =>
    safeCall(() =>
      authFetch<ShortletReview>(`/shortlets/bookings/${bookingId}/review`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    ),

  reviews: (listingId: string, page = 1, pageSize = 20) =>
    safeCall(() =>
      authFetch<Paginated<ShortletReview>>(
        `/shortlets/${listingId}/reviews${toQuery({ page, pageSize })}`
      )
    ),

  // -------- Guest wishlist --------
  wishlistIds: () => safeCall(() => authFetch<string[]>(`/shortlets/wishlist/ids`)),

  myWishlist: (params: ShortletListParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<ShortletListing>>(`/shortlets/wishlist${listQuery(params)}`)
    ),

  saveWishlist: (listingId: string) =>
    safeCall(() =>
      authFetch<{ saved: boolean }>(`/shortlets/${listingId}/wishlist`, { method: 'POST' })
    ),

  unsaveWishlist: (listingId: string) =>
    safeCall(() =>
      authFetch<{ saved: boolean }>(`/shortlets/${listingId}/wishlist`, { method: 'DELETE' })
    ),

  // -------- Guest messaging --------
  startConversation: (listingId: string, text: string) =>
    safeCall(() =>
      authFetch<ShortletConversation>(`/shortlets/${listingId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
    ),

  myMessages: (params: ShortletListParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<ShortletConversation>>(`/shortlets/messages${listQuery(params)}`)
    ),

  sendMessage: (conversationId: string, text: string) =>
    safeCall(() =>
      authFetch<ShortletConversation>(`/shortlets/messages/${conversationId}/send`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
    ),

  markRead: (conversationId: string) =>
    safeCall(() => authFetch(`/shortlets/messages/${conversationId}/read`, { method: 'POST' })),

  // -------- Host messaging --------
  hostMessages: (params: ShortletListParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<ShortletConversation>>(`/host/shortlets/messages${listQuery(params)}`)
    ),

  hostSendMessage: (conversationId: string, text: string) =>
    safeCall(() =>
      authFetch<ShortletConversation>(`/host/shortlets/messages/${conversationId}/send`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
    ),

  hostMarkRead: (conversationId: string) =>
    safeCall(() =>
      authFetch(`/host/shortlets/messages/${conversationId}/read`, { method: 'POST' })
    ),

  // -------- Host payouts --------
  payoutAccount: () =>
    safeCall(() => authFetch<ShortletPayoutAccount | null>('/host/shortlets/payout-account')),

  savePayoutAccount: (input: UpsertPayoutAccountInput) =>
    safeCall(() =>
      authFetch<ShortletPayoutAccount>('/host/shortlets/payout-account', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    ),

  myPayouts: (params: ShortletListParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<ShortletPayout>>(`/host/shortlets/payouts${listQuery(params)}`)
    ),

  payoutSummary: () =>
    safeCall(() =>
      authFetch<{ available: number; accountSet: boolean }>('/host/shortlets/payouts/summary')
    ),

  requestPayout: () =>
    safeCall(() =>
      authFetch<ShortletPayout>('/host/shortlets/payouts/request', { method: 'POST' })
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

  uploadMedia: (kind: 'image' | 'video', file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('kind', kind);
    return safeCall(() =>
      authFetch<{ key: string; kind: 'image' | 'video' }>('/host/shortlets/media/upload', {
        method: 'POST',
        body: fd,
      })
    );
  },

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

  hostEarningsAnalytics: () =>
    safeCall(() => authFetch<ShortletEarningsAnalytics>('/host/shortlets/analytics')),

  // -------- Disputes --------
  openDispute: (bookingId: string, input: OpenShortletDisputeInput) =>
    safeCall(() =>
      authFetch<ShortletDispute>(`/shortlets/bookings/${bookingId}/dispute`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    ),

  myDisputes: (params: ShortletListParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<ShortletDispute>>(`/shortlets/disputes${listQuery(params)}`)
    ),

  disputeMessages: (disputeId: string) =>
    safeCall(() =>
      authFetch<ShortletDisputeMessage[]>(`/shortlets/disputes/${disputeId}/messages`)
    ),

  sendDisputeMessage: (disputeId: string, text: string) =>
    safeCall(() =>
      authFetch<ShortletDisputeMessage>(`/shortlets/disputes/${disputeId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
    ),
};
