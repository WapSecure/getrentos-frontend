import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';
import type { Paginated } from './properties';
import type { ShortletBookingStatus, ShortletCancellationPolicy } from './shortlets';

/**
 * Hosting short stays: the host's side of /host/shortlets. Owners, landlords,
 * realtors and agents with a mandate all host through the same API, on any
 * plan. GetRentos takes a percentage of each stay from the host payout.
 */

export type PricingMode = 'PER_NIGHT' | 'FLAT_STAY';
export type HostListingStatus = 'PUBLISHED' | 'PAUSED' | 'CLOSED' | 'PENDING_VERIFICATION' | string;

export interface ShortletSeason {
  id: string;
  name: string;
  /** First night, yyyy-MM-dd. */
  startDate: string;
  /** Last night, yyyy-MM-dd. */
  endDate: string;
  nightlyRate?: number;
  minNights?: number;
}

export interface HostListing {
  id: string;
  listingId: string;
  propertyId: string;
  title: string;
  city: string;
  state: string;
  address: string;
  coverImageUrl?: string;
  imageKeys: string[];
  images: string[];
  videoKey?: string;
  videoUrl?: string;
  tourUrl?: string;
  status: HostListingStatus;
  pricingMode: PricingMode;
  nightlyRate?: number;
  cleaningFee?: number;
  deposit?: number;
  minNights: number;
  maxNights?: number;
  weekendUpliftPct?: number;
  weeklyDiscountPct: number;
  /** Stays of 14+ nights. */
  twoWeekDiscountPct?: number;
  monthlyDiscountPct: number;
  lastMinuteDiscountPct: number;
  lastMinuteDays: number;
  advanceNoticeDays: number;
  prepDays: number;
  seasons: ShortletSeason[];
  cancellationPolicy: ShortletCancellationPolicy;
  instantBooking: boolean;
  maxGuests: number;
  checkInTime?: string;
  checkOutTime?: string;
  amenities: string[];
  furnished: boolean;
  ratingAverage?: number;
  reviewCount: number;
  houseRules?: string;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  partiesAllowed?: boolean;
  powerSources?: string[];
  powerHoursPerDay?: number;
  waterSupply?: string;
  internetType?: string;
  internetSpeedMbps?: number;
  checkInInstructions?: string;
  publishedAt: string;
}

export interface ListingPricingInput {
  pricingMode?: PricingMode;
  nightlyRate?: number;
  cleaningFee?: number;
  deposit?: number;
  minNights?: number;
  weekendUpliftPct?: number;
  instantBooking?: boolean;
  maxGuests?: number;
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicy?: ShortletCancellationPolicy;
  imageKeys?: string[];
  videoKey?: string;
  videoUrl?: string;
  tourUrl?: string;
}

export interface CreateHostListingInput extends ListingPricingInput {
  propertyId: string;
  listingTitle?: string;
  amenities?: string[];
  furnished?: boolean;
}

export interface PricingRulesInput {
  weeklyDiscountPct?: number;
  twoWeekDiscountPct?: number;
  monthlyDiscountPct?: number;
  lastMinuteDiscountPct?: number;
  lastMinuteDays?: number;
  advanceNoticeDays?: number;
  prepDays?: number;
}

/** House rules, power, water, internet and check-in instructions; null clears a field. */
export interface EssentialsInput {
  houseRules?: string | null;
  petsAllowed?: boolean | null;
  smokingAllowed?: boolean | null;
  partiesAllowed?: boolean | null;
  powerSources?: string[];
  powerHoursPerDay?: number | null;
  waterSupply?: string | null;
  internetType?: string | null;
  internetSpeedMbps?: number | null;
  checkInInstructions?: string | null;
}

export interface GuestSummary {
  identityVerified: boolean;
  memberSince: string;
  completedStays: number;
  ratingAverage?: number;
  ratingCount: number;
  cancellations12m: number;
  damageClaimsUpheld: number;
}

export type DepositClaimStatus = 'PENDING' | 'APPROVED' | 'PARTIAL' | 'REJECTED';

export interface HostBooking {
  id: string;
  listingId: string;
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
  discountType?: 'WEEKLY' | 'TWO_WEEK' | 'MONTHLY' | 'LAST_MINUTE';
  discountAmount?: number;
  total: number;
  status: ShortletBookingStatus;
  cancelledBy?: 'GUEST' | 'HOST' | 'ADMIN';
  cancellationReason?: string;
  guestSummary?: GuestSummary;
  guestRatingAverage?: number;
  guestRatingCount?: number;
  paymentStatus?: 'UNPAID' | 'PROCESSING' | 'PAID' | 'REFUNDED';
  paidAt?: string;
  deposit?: number;
  depositStatus: 'UNPAID' | 'HELD' | 'REFUNDED';
  depositRefundedAmount?: number;
  depositClaimStatus?: DepositClaimStatus;
  depositClaimAmount?: number;
  depositClaimDeducted?: number;
  platformFee?: number;
  taxAmount?: number;
  hostNet?: number;
  guestReviewed?: boolean;
  notes?: string;
  guestName?: string;
  createdAt: string;
}

export interface BlockedRange {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
  /** From an outside calendar; removed there, not here. */
  importedFrom?: string;
  /** Closed because the host cancelled a booking on them; can't be reopened. */
  lockedByCancellation?: boolean;
}

export interface CalendarFeed {
  id: string;
  name: string;
  url: string;
  lastSyncedAt?: string;
  lastError?: string;
  eventCount: number;
  conflictCount: number;
}

export interface CalendarSync {
  exportUrl: string;
  feeds: CalendarFeed[];
}

export interface HostCancelPreview {
  canCancel: boolean;
  blockedReason?: string;
  daysBeforeCheckIn: number;
  guestPaid: boolean;
  guestRefund: number;
  feePercent: number;
  fee: number;
}

export interface HostMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
  /** Contact details were hidden because the stay isn't paid yet. */
  contactMasked?: boolean;
}

export interface HostConversation {
  id: string;
  propertyId: string;
  propertyName: string;
  participantId: string;
  participantName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: HostMessage[];
}

export interface EarningsAnalytics {
  totalEarned: number;
  grossEarned: number;
  platformFees: number;
  commissionPct?: number;
  paidOut: number;
  available: number;
  bookingsCount: number;
  nightsSold: number;
  avgNightlyRate?: number;
  byListing: {
    listingId: string;
    title: string;
    bookings: number;
    earned: number;
    nights: number;
  }[];
  monthly: { month: string; earned: number }[];
}

export interface ViewsAnalytics {
  totalViews: number;
  totalUniqueViewers: number;
  byListing: { listingId: string; title: string; views: number; uniqueViewers: number }[];
  daily: { date: string; views: number }[];
}

export interface HostPayoutAccount {
  id: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface HostPayout {
  id: string;
  amount: number;
  penaltyDeducted?: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  transferRef?: string;
  paidAt?: string;
  bookingCount: number;
  createdAt: string;
}

export interface PayoutSummary {
  available: number;
  upcoming: number;
  frozen: number;
  inFailedPayout: number;
  inTransit: number;
  penaltiesOutstanding: number;
  nextReleaseAt: string | null;
  holdHours: number;
  accountSet: boolean;
  hostTier: number;
  withdrawTierRequired: number;
  canWithdraw: boolean;
  withdrawWithheldReason?: string | null;
}

export interface HostPenalty {
  id: string;
  bookingId: string;
  listingTitle: string;
  checkIn: string;
  daysBeforeCheckIn: number;
  percent: number;
  amount: number;
  outstanding: number;
  status: 'OUTSTANDING' | 'SETTLED' | 'WAIVED';
  createdAt: string;
}

export type DisputeCategory = 'SERVICE_QUALITY' | 'PAYMENT' | 'DAMAGE' | 'CANCELLATION' | 'OTHER';
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED';

export interface ShortletDispute {
  id: string;
  bookingId: string;
  listingTitle?: string;
  title: string;
  category: DisputeCategory;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: DisputeStatus;
  raisedBy: string;
  against: string;
  amount?: number;
  description: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
  guestPromise?: boolean;
  outcome?: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'NOT_UPHELD';
  refundAmount?: number;
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface DepositClaim {
  id: string;
  bookingId: string;
  listingTitle?: string;
  guestName: string;
  amount: number;
  reason: string;
  evidence: string[];
  status: DepositClaimStatus;
  deductedAmount?: number;
  refundedAmount?: number;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export type BookingView = 'requests' | 'upcoming' | 'past' | 'cancelled';

/** Server-side filters for each inbox view, so paging is right. */
export const BOOKING_VIEW_QUERY: Record<BookingView, string> = {
  requests: 'status=REQUESTED',
  upcoming: 'status=CONFIRMED&when=upcoming',
  past: 'status=CONFIRMED,COMPLETED&when=past',
  cancelled: 'status=CANCELLED,DECLINED',
};

const page = (p: number, size: number, extra = '') =>
  `?page=${p}&pageSize=${size}${extra ? `&${extra}` : ''}`;

/** The GetRentos fee on a booking made now; taken from the host payout, never charged to guests. */
export interface HostFees {
  commissionPct: number;
  standardCommissionPct: number;
  /** When the launch rate ends, if one is running. */
  introEndsAt?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The fee in words: the rate now, and the last day (Lagos) a launch rate applies. */
export function feeNote(f: HostFees): string {
  const now =
    f.commissionPct === 0
      ? 'GetRentos takes no fee on new bookings right now'
      : `GetRentos fee: ${f.commissionPct}% of each stay, taken from your payout`;
  let launch = '';
  if (f.introEndsAt && f.standardCommissionPct !== f.commissionPct) {
    // The launch rate ends at midnight Lagos (UTC+1, no DST); name the last day it applies.
    const d = new Date(Date.parse(f.introEndsAt) - 1 + 60 * 60 * 1000);
    const day = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    launch = `: launch rate for bookings made by ${day}, then ${f.standardCommissionPct}%`;
  }
  return `${now}${launch}. Guests don’t pay it, and each booking keeps the rate it was made at.`;
}

export const hostShortletsApi = {
  // ---- listings ----
  // The API caps pages at 100; screens find a listing in this one page.
  listings: (p = 1, size = 100) =>
    apiFetch<Paginated<HostListing>>(`/host/shortlets${page(p, size)}`),
  create: (input: CreateHostListingInput) =>
    apiFetch<HostListing>('/host/shortlets', { method: 'POST', body: input }),
  update: (listingId: string, input: ListingPricingInput & PricingRulesInput & EssentialsInput) =>
    apiFetch<HostListing>(`/host/shortlets/${listingId}`, { method: 'PATCH', body: input }),
  setStatus: (listingId: string, status: 'PUBLISHED' | 'PAUSED' | 'CLOSED') =>
    apiFetch<HostListing>(`/host/shortlets/${listingId}/status`, {
      method: 'PATCH',
      body: { status },
    }),
  uploadImage: (file: PickedFile) => {
    const form = new FormData();
    form.append('kind', 'image');
    appendFile(form, 'file', file);
    return apiUpload<{ key: string; kind: 'image' | 'video' }>(
      '/host/shortlets/media/upload',
      form
    );
  },

  // ---- bookings ----
  bookings: (view: BookingView, p = 1, size = 20) =>
    apiFetch<Paginated<HostBooking>>(
      `/host/shortlets/bookings${page(p, size, BOOKING_VIEW_QUERY[view])}`
    ),
  bookingsForListing: (listingId: string) =>
    apiFetch<Paginated<HostBooking>>(
      `/host/shortlets/bookings${page(1, 100, `status=REQUESTED,CONFIRMED&when=upcoming&listingId=${listingId}`)}`
    ),
  booking: (id: string) => apiFetch<HostBooking>(`/host/shortlets/bookings/${id}`),
  approve: (id: string) =>
    apiFetch<HostBooking>(`/host/shortlets/bookings/${id}/approve`, { method: 'POST' }),
  decline: (id: string) =>
    apiFetch<HostBooking>(`/host/shortlets/bookings/${id}/decline`, { method: 'POST' }),
  cancelPreview: (id: string) =>
    apiFetch<HostCancelPreview>(`/host/shortlets/bookings/${id}/cancel-preview`),
  cancel: (id: string, reason: string) =>
    apiFetch<HostBooking>(`/host/shortlets/bookings/${id}/cancel`, {
      method: 'POST',
      body: { reason },
    }),
  reviewGuest: (id: string, rating: number, comment?: string) =>
    apiFetch<void>(`/host/shortlets/bookings/${id}/guest-review`, {
      method: 'POST',
      body: { rating, ...(comment ? { comment } : {}) },
    }),
  openDepositClaim: (id: string, amount: number, reason: string) =>
    apiFetch<DepositClaim>(`/host/shortlets/bookings/${id}/deposit-claim`, {
      method: 'POST',
      body: { amount, reason },
    }),
  openDispute: (
    id: string,
    input: { title: string; category: DisputeCategory; description: string }
  ) =>
    apiFetch<ShortletDispute>(`/shortlets/bookings/${id}/dispute`, { method: 'POST', body: input }),

  // ---- calendar ----
  blocked: (listingId: string) =>
    apiFetch<BlockedRange[]>(`/host/shortlets/${listingId}/blocked-dates`),
  block: (listingId: string, startDate: string, endDate: string, reason?: string) =>
    apiFetch<BlockedRange>(`/host/shortlets/${listingId}/blocked-dates`, {
      method: 'POST',
      body: { startDate, endDate, ...(reason ? { reason } : {}) },
    }),
  unblock: (blockedId: string) =>
    apiFetch<void>(`/host/shortlets/blocked-dates/${blockedId}`, { method: 'DELETE' }),
  calendarSync: (listingId: string) =>
    apiFetch<CalendarSync>(`/host/shortlets/${listingId}/calendar-sync`),
  resetExport: (listingId: string) =>
    apiFetch<{ exportUrl: string }>(`/host/shortlets/${listingId}/calendar-sync/reset-export`, {
      method: 'POST',
    }),
  addFeed: (listingId: string, name: string, url: string) =>
    apiFetch<CalendarFeed>(`/host/shortlets/${listingId}/calendar-feeds`, {
      method: 'POST',
      body: { name, url },
    }),
  syncFeed: (feedId: string) =>
    apiFetch<CalendarFeed>(`/host/shortlets/calendar-feeds/${feedId}/sync`, { method: 'POST' }),
  removeFeed: (feedId: string) =>
    apiFetch<void>(`/host/shortlets/calendar-feeds/${feedId}`, { method: 'DELETE' }),

  // ---- seasons ----
  seasons: (listingId: string) =>
    apiFetch<ShortletSeason[]>(`/host/shortlets/${listingId}/seasons`),
  addSeason: (
    listingId: string,
    input: {
      name: string;
      startDate: string;
      endDate: string;
      nightlyRate?: number;
      minNights?: number;
    }
  ) =>
    apiFetch<ShortletSeason>(`/host/shortlets/${listingId}/seasons`, {
      method: 'POST',
      body: input,
    }),
  deleteSeason: (seasonId: string) =>
    apiFetch<void>(`/host/shortlets/seasons/${seasonId}`, { method: 'DELETE' }),

  // ---- messages ----
  conversations: (p = 1, size = 50) =>
    apiFetch<Paginated<HostConversation>>(`/host/shortlets/messages${page(p, size)}`),
  send: (conversationId: string, text: string) =>
    apiFetch<HostConversation>(`/host/shortlets/messages/${conversationId}/send`, {
      method: 'POST',
      body: { text },
    }),
  markRead: (conversationId: string) =>
    apiFetch<void>(`/host/shortlets/messages/${conversationId}/read`, { method: 'POST' }),

  // ---- money ----
  earnings: () => apiFetch<EarningsAnalytics>('/host/shortlets/analytics'),
  views: () => apiFetch<ViewsAnalytics>('/host/shortlets/analytics/views'),
  payoutAccount: () => apiFetch<HostPayoutAccount | null>('/host/shortlets/payout-account'),
  savePayoutAccount: (bankCode: string, accountNumber: string) =>
    apiFetch<HostPayoutAccount>('/host/shortlets/payout-account', {
      method: 'POST',
      body: { bankCode, accountNumber },
    }),
  payouts: (p = 1, size = 20) =>
    apiFetch<Paginated<HostPayout>>(`/host/shortlets/payouts${page(p, size)}`),
  payoutSummary: () => apiFetch<PayoutSummary>('/host/shortlets/payouts/summary'),
  fees: () => apiFetch<HostFees>('/host/shortlets/fees'),
  requestPayout: () => apiFetch<HostPayout>('/host/shortlets/payouts/request', { method: 'POST' }),
  penalties: (p = 1, size = 20) =>
    apiFetch<Paginated<HostPenalty>>(`/host/shortlets/cancellation-fees${page(p, size)}`),

  // ---- disputes & claims ----
  disputes: (p = 1, size = 50) =>
    apiFetch<Paginated<ShortletDispute>>(`/shortlets/disputes${page(p, size)}`),
  disputeMessages: (disputeId: string) =>
    apiFetch<DisputeMessage[]>(`/shortlets/disputes/${disputeId}/messages`),
  sendDisputeMessage: (disputeId: string, text: string) =>
    apiFetch<DisputeMessage>(`/shortlets/disputes/${disputeId}/messages`, {
      method: 'POST',
      body: { text },
    }),
  depositClaims: (p = 1, size = 50) =>
    apiFetch<Paginated<DepositClaim>>(`/host/shortlets/deposit-claims${page(p, size)}`),
};

/* ---------------------------- shared vocabulary ---------------------------- */

export const AMENITIES = [
  'WiFi',
  'Parking',
  'Swimming Pool',
  'Security',
  '24/7 Power',
  'Gym',
  'Elevator',
  'Air Conditioning',
  'Kitchen',
  'Washer',
] as const;

export const CANCELLATION_POLICIES: {
  value: ShortletCancellationPolicy;
  label: string;
  hint: string;
}[] = [
  { value: 'FLEXIBLE', label: 'Flexible', hint: 'Full refund up to 1 day before check-in.' },
  {
    value: 'MODERATE',
    label: 'Moderate',
    hint: 'Full refund 5+ days before; 50% up to 1 day before.',
  },
  {
    value: 'STRICT',
    label: 'Strict',
    hint: 'Full refund 7+ days before; 50% 3+ days before; nothing after.',
  },
];

export const POWER_SOURCES = [
  { value: 'GRID', label: 'Grid' },
  { value: 'GENERATOR', label: 'Generator' },
  { value: 'INVERTER', label: 'Inverter' },
  { value: 'SOLAR', label: 'Solar' },
] as const;

export const WATER_SUPPLY = [
  { value: 'BOREHOLE', label: 'Borehole' },
  { value: 'PUBLIC_MAINS', label: 'Public mains' },
  { value: 'WATER_TANKER', label: 'Water tanker' },
  { value: 'TREATED', label: 'Treated water' },
] as const;

export const INTERNET_TYPES = [
  { value: 'NONE', label: 'None' },
  { value: 'FIBRE', label: 'Fibre' },
  { value: 'MOBILE_ROUTER', label: '4G/5G router' },
  { value: 'SATELLITE', label: 'Satellite' },
] as const;

export const DISPUTE_CATEGORIES: { value: DisputeCategory; label: string }[] = [
  { value: 'DAMAGE', label: 'Damage' },
  { value: 'SERVICE_QUALITY', label: 'Guest conduct' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'CANCELLATION', label: 'Cancellation' },
  { value: 'OTHER', label: 'Other' },
];

/** "20 Dec – 3 Jan". */
export function stayRange(checkIn: string, checkOut: string): string {
  const fmt = (iso: string) =>
    new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
    });
  return `${fmt(checkIn)} – ${fmt(checkOut)}`;
}

/** Whole days from today (local) to a date; negative in the past. */
export function daysUntil(iso: string, now = new Date()): number {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((d.getTime() - t.getTime()) / 86_400_000);
}

/** "Today", "Tomorrow", "In 5 days", "3 days ago". */
export function relativeDay(iso: string, now = new Date()): string {
  const n = daysUntil(iso, now);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  return n > 0 ? `In ${n} days` : `${-n} days ago`;
}

/** Dec 20 – Jan 3 of the coming Detty December, when diaspora guests fly home. */
export function dettyDecember(now = new Date()): { startDate: string; endDate: string } {
  const year =
    now.getMonth() === 0 && now.getDate() <= 3 ? now.getFullYear() - 1 : now.getFullYear();
  return { startDate: `${year}-12-20`, endDate: `${year + 1}-01-03` };
}

/** One line naming the pricing rules in force, or null when there are none. */
export function rulesSummary(l: HostListing): string | null {
  const parts: string[] = [];
  if (l.seasons?.length)
    parts.push(l.seasons.length === 1 ? l.seasons[0].name : `${l.seasons.length} seasons`);
  if (l.weeklyDiscountPct) parts.push(`${l.weeklyDiscountPct}% weekly`);
  if (l.twoWeekDiscountPct) parts.push(`${l.twoWeekDiscountPct}% two-week`);
  if (l.monthlyDiscountPct) parts.push(`${l.monthlyDiscountPct}% monthly`);
  if (l.lastMinuteDiscountPct) parts.push(`${l.lastMinuteDiscountPct}% last-minute`);
  if (l.advanceNoticeDays) parts.push(`${l.advanceNoticeDays}d notice`);
  if (l.prepDays) parts.push(`${l.prepDays}d prep`);
  return parts.length ? parts.join(' · ') : null;
}
