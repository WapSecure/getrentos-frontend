import { apiFetch } from './client';
import type { Paginated } from './buyer';

export type ShortletBookingStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'COMPLETED';

export const SHORTLET_BOOKING_STATUS_LABEL: Record<ShortletBookingStatus, string> = {
  REQUESTED: 'Requested',
  CONFIRMED: 'Confirmed',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

export const SHORTLET_BOOKING_STATUS_TONE: Record<
  ShortletBookingStatus,
  'neutral' | 'info' | 'success' | 'warning' | 'danger'
> = {
  REQUESTED: 'warning',
  CONFIRMED: 'info',
  DECLINED: 'danger',
  CANCELLED: 'neutral',
  COMPLETED: 'success',
};

export type ShortletPaymentStatus = 'UNPAID' | 'PROCESSING' | 'PAID' | 'REFUNDED';
export type ShortletCancellationPolicy = 'FLEXIBLE' | 'MODERATE' | 'STRICT';

export const CANCELLATION_POLICY_LABEL: Record<ShortletCancellationPolicy, string> = {
  FLEXIBLE: 'Flexible',
  MODERATE: 'Moderate',
  STRICT: 'Strict',
};

export interface ShortletListing {
  id: string;
  listingId: string;
  propertyId: string;
  title: string;
  description: string;
  city: string;
  state: string;
  address: string;
  coverImageUrl?: string;
  images?: string[];
  videoUrl?: string;
  tourUrl?: string;
  cancellationPolicy: ShortletCancellationPolicy;
  deposit?: number;
  reviewCount: number;
  ratingAverage?: number;
  pricingMode: string;
  nightlyRate: number;
  cleaningFee?: number;
  minNights: number;
  weekendUpliftPct?: number;
  currency: string;
  instantBooking: boolean;
  maxGuests: number;
  checkInTime?: string;
  checkOutTime?: string;
  hostName: string;
  hostVerified: boolean;
  isVerified: boolean;
  status: string;
  amenities?: string[];
  furnished?: boolean;
  taxName?: string;
  taxPct?: number;
  latitude?: number;
  longitude?: number;
  publishedAt?: string;
}

export interface ShortletBooking {
  id: string;
  listingId: string;
  propertyId: string;
  propertyTitle: string;
  city: string;
  coverImageUrl?: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  nights: number;
  nightlyRate?: number;
  cleaningFee?: number;
  subtotal: number;
  total: number;
  status: ShortletBookingStatus;
  paymentStatus: ShortletPaymentStatus;
  paidAt?: string;
  paymentRequired: boolean;
  paymentReference?: string;
  cancellationPolicy: ShortletCancellationPolicy;
  refundAmount?: number;
  refundedAt?: string;
  deposit?: number;
  depositStatus: 'UNPAID' | 'HELD' | 'REFUNDED';
  depositRefundedAt?: string;
  platformFee?: number;
  taxAmount?: number;
  hostNet?: number;
  reviewed?: boolean;
  depositClaimStatus?: 'PENDING' | 'APPROVED' | 'PARTIAL' | 'REJECTED';
  depositClaimAmount?: number;
  depositClaimDeducted?: number;
  depositRefundedAmount?: number;
  hostName?: string;
  guestName?: string;
  createdAt: string;
}

/** Availability plus a live price quote for the requested range. */
export interface ShortletAvailability {
  listingId: string;
  available: boolean;
  estimatedNights?: number;
  estimatedTotal?: number;
  estimatedTax?: number;
  taxName?: string;
  taxPct?: number;
  reason?: string;
}

export interface ShortletReview {
  id: string;
  rating: number;
  comment?: string;
  authorName: string;
  createdAt: string;
}

export interface ShortletQuote {
  nights: number;
  subtotal: number;
  total: number;
}

export interface CreateShortletBookingInput {
  checkIn: string;
  checkOut: string;
  guestCount: number;
}

export interface ShortletFilters {
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  search?: string;
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const shortletsApi = {
  list: (filters: ShortletFilters = {}, page = 1, pageSize = 20) =>
    apiFetch<Paginated<ShortletListing>>(`/shortlets${toQuery({ ...filters, page, pageSize })}`),

  get: (listingId: string) => apiFetch<ShortletListing>(`/shortlets/${listingId}`),

  availability: (listingId: string, checkIn?: string, checkOut?: string) =>
    apiFetch<ShortletAvailability>(
      `/shortlets/${listingId}/availability${toQuery({ checkIn, checkOut })}`
    ),

  reviews: (listingId: string, page = 1, pageSize = 20) =>
    apiFetch<Paginated<ShortletReview>>(
      `/shortlets/${listingId}/reviews?page=${page}&pageSize=${pageSize}`
    ),

  recordView: (listingId: string) =>
    apiFetch<void>(`/shortlets/${listingId}/view`, { method: 'POST' }),

  book: (listingId: string, input: CreateShortletBookingInput) =>
    apiFetch<ShortletBooking>(`/shortlets/${listingId}/book`, { method: 'POST', body: input }),

  messageHost: (listingId: string, text: string) =>
    apiFetch<{ conversationId: string }>(`/shortlets/${listingId}/messages`, {
      method: 'POST',
      body: { text },
    }),

  /* ------------------------------- bookings ------------------------------ */

  myBookings: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<ShortletBooking>>(`/shortlets/bookings?page=${page}&pageSize=${pageSize}`),

  cancelBooking: (bookingId: string) =>
    apiFetch<ShortletBooking>(`/shortlets/bookings/${bookingId}/cancel`, { method: 'POST' }),

  payBooking: (bookingId: string) =>
    apiFetch<{ authorizationUrl?: string; reference?: string }>(
      `/shortlets/bookings/${bookingId}/pay`,
      { method: 'POST' }
    ),

  reviewBooking: (bookingId: string, rating: number, comment?: string) =>
    apiFetch<ShortletReview>(`/shortlets/bookings/${bookingId}/review`, {
      method: 'POST',
      body: { rating, comment },
    }),

  /* ------------------------------- wishlist ------------------------------ */

  wishlist: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<ShortletListing>>(`/shortlets/wishlist?page=${page}&pageSize=${pageSize}`),

  wishlistIds: () => apiFetch<string[]>('/shortlets/wishlist/ids'),

  addToWishlist: (listingId: string) =>
    apiFetch<void>(`/shortlets/${listingId}/wishlist`, { method: 'POST' }),

  removeFromWishlist: (listingId: string) =>
    apiFetch<void>(`/shortlets/${listingId}/wishlist`, { method: 'DELETE' }),
};
