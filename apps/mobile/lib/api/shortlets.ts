import { apiFetch, apiUpload } from './client';
import type { Paginated } from './buyer';
import { appendFile, type PickedFile } from './documents';
import type {
  DepositClaim,
  DisputeCategory,
  DisputeMessage,
  ShortletDispute,
  ShortletSeason,
} from './hostShortlets';

export type { DisputeMessage, ShortletDispute, ShortletSeason };

/** A host's claim on the guest's deposit, with signed previews of the evidence. */
export type GuestDepositClaim = DepositClaim & { evidenceUrls?: string[] };

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

export type ShortletDiscountType = 'WEEKLY' | 'TWO_WEEK' | 'MONTHLY' | 'LAST_MINUTE';

/** Search with dates: the all-in price for those dates. */
export interface StayQuote {
  nights: number;
  /** Nights after any discount. */
  nightsTotal: number;
  cleaningFee: number;
  tax: number;
  taxName?: string;
  /** What the guest pays, excluding the refundable deposit. */
  total: number;
  /** total ÷ nights, rounded. */
  perNight: number;
  discountAmount?: number;
  deposit?: number;
}

export type StayQuoteResult =
  | { bookable: true; quote: StayQuote }
  | { bookable: false; reason: string };

/** The nightly rate is at or below the typical rate of 5+ comparable stays. */
export interface FairPrice {
  typicalNightly: number;
  comparables: number;
  city: string;
  bedrooms: number;
}

/** A poor room means no badge, so a shown inspection is never worse than fair. */
export type InspectedRoomCondition = 'excellent' | 'good' | 'fair';

/** Newest inspection by an independent, licensed agent. */
export interface ShortletInspection {
  inspectedAt: string;
  /** First name and initial. */
  agentName: string;
  type: 'MOVE_IN' | 'MOVE_OUT' | 'PERIODIC' | 'OTHER';
  rooms: { room: string; condition: InspectedRoomCondition }[];
  condition: InspectedRoomCondition;
}

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
  maxNights?: number;
  weekendUpliftPct?: number;
  weeklyDiscountPct?: number;
  twoWeekDiscountPct?: number;
  monthlyDiscountPct?: number;
  lastMinuteDiscountPct?: number;
  lastMinuteDays?: number;
  advanceNoticeDays?: number;
  prepDays?: number;
  /** Current and upcoming seasons. */
  seasons?: ShortletSeason[];
  /** Confirmed stays the host cancelled in the last 12 months (detail only). */
  hostCancellations12m?: number;
  inspection?: ShortletInspection;
  /** Only on a search with dates. */
  stayQuote?: StayQuoteResult;
  fairPrice?: FairPrice;
  houseRules?: string;
  /** Unset = the host hasn't said. */
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  partiesAllowed?: boolean;
  powerSources?: string[];
  powerHoursPerDay?: number;
  waterSupply?: string;
  internetType?: string;
  internetSpeedMbps?: number;
  bedrooms?: number;
  bathrooms?: number;
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

export type GuestPromiseProblem =
  | 'NOT_AS_DESCRIBED'
  | 'NO_ACCESS'
  | 'UNSAFE_OR_UNCLEAN'
  | 'MISSING_ESSENTIALS';

export type GuestPromiseOutcome = 'FULL_REFUND' | 'PARTIAL_REFUND' | 'NOT_UPHELD';

/** Where the guest stands with the Guest Promise on one booking. */
export interface GuestPromiseStatus {
  canReport: boolean;
  opensAt: string;
  closesAt: string;
  reportId?: string;
  reportStatus?: string;
  outcome?: GuestPromiseOutcome;
  refundAmount?: number;
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
  /** Nights after any discount. */
  subtotal: number;
  discountType?: ShortletDiscountType;
  discountAmount?: number;
  total: number;
  status: ShortletBookingStatus;
  cancelledBy?: 'GUEST' | 'HOST' | 'ADMIN';
  /** The host's reason, when the host cancelled. */
  cancellationReason?: string;
  /** How to get in; only on a confirmed, paid stay. */
  checkInInstructions?: string;
  guestPromise?: GuestPromiseStatus;
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
  reason?: string;
  estimatedNights?: number;
  estimatedTotal?: number;
  estimatedTax?: number;
  /** Nights before any discount. */
  estimatedBaseSubtotal?: number;
  /** Nights after the discount. */
  estimatedSubtotal?: number;
  estimatedCleaningFee?: number;
  discountType?: ShortletDiscountType;
  discountPct?: number;
  discountAmount?: number;
  /** Nights priced at a season rate. */
  seasonalNights?: number;
  taxName?: string;
  taxPct?: number;
  /** Booked or blocked nights (yyyy-MM-dd); only when no range is asked for. */
  unavailableDates?: string[];
}

export interface ShortletMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
  /** Contact details were hidden (no paid stay yet). */
  contactMasked?: boolean;
}

export interface ShortletConversation {
  id: string;
  propertyId: string;
  propertyName: string;
  participantId: string;
  participantName: string;
  participantRole: 'guest' | 'host';
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: ShortletMessage[];
}

export interface ShortletGuestReview {
  id: string;
  bookingId: string;
  listingId: string;
  listingTitle?: string;
  hostName: string;
  rating: number;
  comment?: string;
  createdAt: string;
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

export type ShortletSort = 'newest' | 'price_asc' | 'price_desc';

export interface ShortletFilters {
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  bedrooms?: number;
  search?: string;
  /** yyyy-MM-dd; with checkOut, every result carries the all-in price for those dates. */
  checkIn?: string;
  checkOut?: string;
  instantBooking?: boolean;
  verifiedOnly?: boolean;
  power24h?: boolean;
  petsAllowed?: boolean;
  amenities?: string[];
  sort?: ShortletSort;
}

export interface OpenDisputeInput {
  category: DisputeCategory;
  /** Up to 120 characters. */
  title: string;
  /** Up to 2000 characters. */
  description: string;
}

type QueryValue = string | number | boolean | string[] | undefined;

function toQuery(params: Record<string, QueryValue>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '' || v === false) continue;
    if (Array.isArray(v)) {
      if (v.length) q.set(k, v.join(','));
      continue;
    }
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

  /** Starts (or continues) the conversation with this stay's host. */
  messageHost: (listingId: string, text: string) =>
    apiFetch<ShortletConversation>(`/shortlets/${listingId}/messages`, {
      method: 'POST',
      body: { text },
    }),

  /* ------------------------------- messages ------------------------------ */

  conversations: (page = 1, pageSize = 50) =>
    apiFetch<Paginated<ShortletConversation>>(
      `/shortlets/messages?page=${page}&pageSize=${pageSize}`
    ),

  send: (conversationId: string, text: string) =>
    apiFetch<ShortletConversation>(`/shortlets/messages/${conversationId}/send`, {
      method: 'POST',
      body: { text },
    }),

  markRead: (conversationId: string) =>
    apiFetch<void>(`/shortlets/messages/${conversationId}/read`, { method: 'POST' }),

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

  /** What hosts have said about this guest. */
  reviewsOfMe: (page = 1, pageSize = 50) =>
    apiFetch<Paginated<ShortletGuestReview>>(
      `/shortlets/bookings/guest-reviews?page=${page}&pageSize=${pageSize}`
    ),

  /* ----------------------- guest promise & disputes ---------------------- */

  uploadPromisePhoto: (bookingId: string, file: PickedFile) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    return apiUpload<{ key: string }>(
      `/shortlets/bookings/${bookingId}/guest-promise/photos`,
      form
    );
  },

  reportGuestPromise: (
    bookingId: string,
    input: { problemType: GuestPromiseProblem; description: string; imageKeys?: string[] }
  ) =>
    apiFetch<ShortletDispute>(`/shortlets/bookings/${bookingId}/guest-promise`, {
      method: 'POST',
      body: input,
    }),

  openDispute: (bookingId: string, input: OpenDisputeInput) =>
    apiFetch<ShortletDispute>(`/shortlets/bookings/${bookingId}/dispute`, {
      method: 'POST',
      body: input,
    }),

  disputes: (page = 1, pageSize = 50) =>
    apiFetch<Paginated<ShortletDispute>>(`/shortlets/disputes?page=${page}&pageSize=${pageSize}`),

  disputeMessages: (disputeId: string) =>
    apiFetch<DisputeMessage[]>(`/shortlets/disputes/${disputeId}/messages`),

  sendDisputeMessage: (disputeId: string, text: string) =>
    apiFetch<DisputeMessage>(`/shortlets/disputes/${disputeId}/messages`, {
      method: 'POST',
      body: { text },
    }),

  /** Claims hosts have made on this guest's deposits. */
  depositClaims: (page = 1, pageSize = 50) =>
    apiFetch<Paginated<GuestDepositClaim>>(
      `/shortlets/bookings/deposit-claims?page=${page}&pageSize=${pageSize}`
    ),

  /* ------------------------------- wishlist ------------------------------ */

  wishlist: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<ShortletListing>>(`/shortlets/wishlist?page=${page}&pageSize=${pageSize}`),

  wishlistIds: () => apiFetch<string[]>('/shortlets/wishlist/ids'),

  addToWishlist: (listingId: string) =>
    apiFetch<void>(`/shortlets/${listingId}/wishlist`, { method: 'POST' }),

  removeFromWishlist: (listingId: string) =>
    apiFetch<void>(`/shortlets/${listingId}/wishlist`, { method: 'DELETE' }),
};
