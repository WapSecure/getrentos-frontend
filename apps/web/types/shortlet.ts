export type ShortletPricingMode = 'PER_NIGHT' | 'FLAT_STAY';
export type ShortletDiscountType = 'WEEKLY' | 'TWO_WEEK' | 'MONTHLY' | 'LAST_MINUTE';

/** A date range with its own nightly rate and/or minimum stay; start/end are the first and last night. */
export interface ShortletSeason {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  nightlyRate?: number;
  minNights?: number;
}

export interface ShortletSeasonInput {
  name: string;
  startDate: string;
  endDate: string;
  nightlyRate?: number | null;
  minNights?: number | null;
}

/** The peak-season rules a host sets on a listing. */
export interface ShortletPricingRules {
  weeklyDiscountPct?: number;
  twoWeekDiscountPct?: number;
  monthlyDiscountPct?: number;
  lastMinuteDiscountPct?: number;
  lastMinuteDays?: number;
  advanceNoticeDays?: number;
  prepDays?: number;
}
export type ShortletCancellationPolicy = 'FLEXIBLE' | 'MODERATE' | 'STRICT';
export type ShortletBookingStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface ShortletListing {
  id: string;
  listingId: string;
  propertyId: string;
  title: string;
  description?: string;
  city: string;
  state: string;
  address: string;
  coverImageUrl?: string;
  imageKeys: string[];
  images: string[];
  videoKey?: string;
  videoUrl?: string;
  tourUrl?: string;
  cancellationPolicy: ShortletCancellationPolicy;
  deposit?: number;
  /**
   * Hours after check-out this listing keeps the deposit claimable. Absent means
   * the platform default from the admin Fees tab applies.
   */
  depositClaimWindowHours?: number;
  ratingAverage?: number;
  reviewCount: number;
  pricingMode: ShortletPricingMode;
  nightlyRate?: number;
  cleaningFee?: number;
  minNights: number;
  maxNights?: number;
  weekendUpliftPct?: number;
  weeklyDiscountPct: number;
  twoWeekDiscountPct: number;
  monthlyDiscountPct: number;
  lastMinuteDiscountPct: number;
  lastMinuteDays: number;
  advanceNoticeDays: number;
  prepDays: number;
  /** Current and upcoming seasons. */
  seasons: ShortletSeason[];
  /** Confirmed stays the host cancelled on this listing in the last 12 months (detail view). */
  hostCancellations12m?: number;
  /** Newest inspection by an independent, licensed agent; absent when none qualifies. */
  inspection?: ShortletInspectionBadge;
  /** Search with dates: the all-in price for those dates, or why they can't be booked. */
  stayQuote?: StayQuoteResult;
  /** Present when the nightly rate is at or below the typical rate of 5+ comparable stays. */
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
  /** Host view only. */
  checkInInstructions?: string;
  currency: string;
  instantBooking: boolean;
  maxGuests: number;
  checkInTime?: string;
  checkOutTime?: string;
  status: string;
  hostName: string;
  hostVerified: boolean;
  isVerified: boolean;
  amenities: string[];
  furnished: boolean;
  bedrooms?: number;
  bathrooms?: number;
  propertySize?: number;
  taxName?: string;
  taxPct?: number;
  publishedAt: string;
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
  /** Who cancelled, when the booking is CANCELLED and it is known. */
  cancelledBy?: 'GUEST' | 'HOST' | 'ADMIN';
  /** The host's reason, when the host cancelled. */
  cancellationReason?: string;
  /** How to get in; only on a confirmed, paid stay. */
  checkInInstructions?: string;
  /** Guest view only. */
  guestPromise?: GuestPromiseStatus;
  /** Host view only: the guest at a glance. */
  guestSummary?: GuestSummary;
  paymentStatus?: 'UNPAID' | 'PROCESSING' | 'PAID' | 'REFUNDED';
  paidAt?: string;
  paymentRequired?: boolean;
  paymentReference?: string;
  cancellationPolicy?: ShortletCancellationPolicy;
  refundAmount?: number;
  refundedAt?: string;
  deposit?: number;
  depositStatus: 'UNPAID' | 'HELD' | 'REFUNDED';
  depositRefundedAt?: string;
  platformFee?: number;
  taxAmount?: number;
  hostNet?: number;
  depositClaimStatus?: ShortletDepositClaimStatus;
  depositClaimAmount?: number;
  /** Naira withheld from the guest deposit by the latest resolved claim. */
  depositClaimDeducted?: number;
  /** Naira actually returned to the guest from the deposit (after any claim deduction). */
  depositRefundedAmount?: number;
  reviewed?: boolean;
  guestReviewed?: boolean;
  guestRatingAverage?: number;
  guestRatingCount?: number;
  notes?: string;
  hostName: string;
  guestName?: string;
  createdAt: string;
}

export type ShortletDepositClaimStatus = 'PENDING' | 'APPROVED' | 'PARTIAL' | 'REJECTED';

export interface ShortletDepositClaim {
  id: string;
  bookingId: string;
  listingTitle?: string;
  claimedBy: string;
  guestName: string;
  /** First night of the stay the claim is against. */
  checkIn?: string;
  /** Checkout of the stay the claim is against. */
  checkOut?: string;
  amount: number;
  reason: string;
  evidence: string[];
  status: ShortletDepositClaimStatus;
  /** Naira withheld from the guest refund by this claim (resolved claims only). */
  deductedAmount?: number;
  /** Naira refunded to the guest = deposit - deducted (resolved claims only). */
  refundedAmount?: number;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface OpenDepositClaimInput {
  amount: number;
  reason: string;
  imageKeys?: string[];
}

export interface AdjudicateDepositClaimInput {
  decision: 'APPROVED' | 'PARTIAL' | 'REJECTED';
  resolution?: string;
  deductedAmount?: number;
}

export interface ShortletPayResponse {
  id: string;
  total: number;
  deposit?: number;
  taxAmount?: number;
  chargeTotal?: number;
  paymentStatus: 'UNPAID' | 'PROCESSING' | 'PAID' | 'REFUNDED';
  authorizationUrl?: string;
  reference?: string;
}

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
  /** Booked/blocked nights (`YYYY-MM-DD`); only sent when no range is asked for. */
  unavailableDates?: string[];
}

export interface CreateShortletListingInput extends ShortletPricingRules {
  propertyId: string;
  unitId?: string;
  listingTitle?: string;
  amenities?: string[];
  furnished?: boolean;
  pricingMode?: ShortletPricingMode;
  nightlyRate?: number;
  cleaningFee?: number;
  minNights?: number;
  maxNights?: number;
  weekendUpliftPct?: number;
  currency?: string;
  instantBooking?: boolean;
  maxGuests?: number;
  checkInTime?: string;
  checkOutTime?: string;
  imageKeys?: string[];
  videoKey?: string;
  videoUrl?: string;
  tourUrl?: string;
  cancellationPolicy?: ShortletCancellationPolicy;
  deposit?: number;
}

/** House rules, power, water, internet and check-in instructions; null clears a field. */
export interface ShortletEssentialsInput {
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

export interface UpdateShortletListingInput extends ShortletPricingRules, ShortletEssentialsInput {
  pricingMode?: ShortletPricingMode;
  nightlyRate?: number;
  cleaningFee?: number;
  minNights?: number;
  maxNights?: number;
  weekendUpliftPct?: number;
  currency?: string;
  instantBooking?: boolean;
  maxGuests?: number;
  checkInTime?: string;
  checkOutTime?: string;
  imageKeys?: string[];
  videoKey?: string;
  videoUrl?: string;
  tourUrl?: string;
  cancellationPolicy?: ShortletCancellationPolicy;
  deposit?: number;
  /** Null clears the override so the platform default applies again. */
  depositClaimWindowHours?: number | null;
}

export interface CreateShortletBookingInput {
  checkIn: string;
  checkOut: string;
  guestCount?: number;
  notes?: string;
}

export interface ShortletReview {
  id: string;
  bookingId: string;
  listingId: string;
  guestId: string;
  guestName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ShortletGuestReview {
  id: string;
  bookingId: string;
  listingId: string;
  listingTitle?: string;
  guestId: string;
  guestName: string;
  hostName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface CreateShortletReviewInput {
  rating: number;
  comment?: string;
}

export interface ShortletMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
  /** Contact details in this message were hidden (no paid stay yet). */
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

export interface SendShortletMessageInput {
  text: string;
}

export interface ShortletPayoutAccount {
  id: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface ShortletPayout {
  id: string;
  hostId: string;
  hostName?: string;
  /** Sent to the bank, after any cancellation fees. */
  amount: number;
  /** Cancellation fees taken out of this payout. */
  penaltyDeducted?: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  transferRef?: string;
  paidAt?: string;
  bookingCount: number;
  createdAt: string;
}

export interface UpsertPayoutAccountInput {
  bankCode: string;
  accountNumber: string;
}

export interface BlockShortletDatesInput {
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface BlockedDateRange {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
  /** Name of the outside calendar these dates came from; the host can't remove them here. */
  importedFrom?: string;
  /** Closed because the host cancelled a booking on them; can't be reopened. */
  lockedByCancellation?: boolean;
}

/** An outside calendar (Airbnb, Booking.com, ...) whose events block dates here. */
export interface ShortletCalendarFeed {
  id: string;
  name: string;
  url: string;
  lastSyncedAt?: string;
  lastError?: string;
  eventCount: number;
  /** Imported stays that overlap a GetRentos booking. */
  conflictCount: number;
}

export interface ShortletCalendarSync {
  /** The link other sites subscribe to. */
  exportUrl: string;
  feeds: ShortletCalendarFeed[];
}

export type ShortletDisputeCategory =
  | 'SERVICE_QUALITY'
  | 'PAYMENT'
  | 'DAMAGE'
  | 'CANCELLATION'
  | 'OTHER';
export type ShortletDisputePriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ShortletDisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED';

export interface ShortletDispute {
  id: string;
  bookingId: string;
  listingTitle?: string;
  title: string;
  category: ShortletDisputeCategory;
  priority: ShortletDisputePriority;
  status: ShortletDisputeStatus;
  raisedBy: string;
  against: string;
  amount?: number;
  description: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
  /** A Guest Promise report (filed within 24h of check-in). */
  guestPromise?: boolean;
  problemType?: GuestPromiseProblem;
  evidenceUrls?: string[];
  outcome?: GuestPromiseOutcome;
  refundAmount?: number;
}

export type GuestPromiseProblem =
  | 'NOT_AS_DESCRIBED'
  | 'NO_ACCESS'
  | 'UNSAFE_OR_UNCLEAN'
  | 'MISSING_ESSENTIALS';
export type GuestPromiseOutcome = 'FULL_REFUND' | 'PARTIAL_REFUND' | 'NOT_UPHELD';

/** The Guest Promise on one of the guest's bookings. */
export interface GuestPromiseStatus {
  canReport: boolean;
  opensAt: string;
  closesAt: string;
  reportId?: string;
  reportStatus?: string;
  outcome?: GuestPromiseOutcome;
  refundAmount?: number;
}

export interface ShortletDisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface OpenShortletDisputeInput {
  title: string;
  category: ShortletDisputeCategory;
  priority?: ShortletDisputePriority;
  description: string;
}

export interface ShortletEarningsAnalytics {
  totalEarned: number;
  grossEarned: number;
  platformFees: number;
  commissionPct?: number;
  taxName?: string;
  taxPct?: number;
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

export interface ShortletViewsAnalytics {
  totalViews: number;
  totalUniqueViewers: number;
  byListing: {
    listingId: string;
    title: string;
    views: number;
    uniqueViewers: number;
  }[];
  daily: { date: string; views: number }[];
}

/** What cancelling a confirmed stay would refund the guest and cost the host. */
export interface HostCancelPreview {
  canCancel: boolean;
  blockedReason?: string;
  daysBeforeCheckIn: number;
  guestPaid: boolean;
  /** Stay, tax and deposit, in naira. */
  guestRefund: number;
  feePercent: number;
  /** Taken from the host's future payouts, in naira. */
  fee: number;
}

export interface ShortletHostPenalty {
  id: string;
  bookingId: string;
  listingTitle: string;
  checkIn: string;
  checkOut: string;
  cancelledAt?: string;
  cancellationReason?: string;
  daysBeforeCheckIn: number;
  percent: number;
  amount: number;
  settledAmount: number;
  outstanding: number;
  status: 'OUTSTANDING' | 'SETTLED' | 'WAIVED';
  waiverReason?: string;
  createdAt: string;
}

export type InspectedRoomCondition = 'excellent' | 'good' | 'fair';

/** An inspection that earns the "Inspected" badge (see backend shortlet-inspection.ts). */
export interface ShortletInspectionBadge {
  inspectedAt: string;
  /** First name and initial. */
  agentName: string;
  type: 'MOVE_IN' | 'MOVE_OUT' | 'PERIODIC' | 'OTHER';
  rooms: { room: string; condition: InspectedRoomCondition }[];
  /** The worst room rating. */
  condition: InspectedRoomCondition;
}

/** What a host sees about a guest: counts across GetRentos only. */
export interface GuestSummary {
  identityVerified: boolean;
  memberSince: string;
  completedStays: number;
  ratingAverage?: number;
  ratingCount: number;
  /** Stays the guest cancelled in the last 12 months. */
  cancellations12m: number;
  /** Deposit claims upheld against the guest. */
  damageClaimsUpheld: number;
}

/** The all-in price for given dates, as the checkout will charge it. */
/** The GetRentos fee on a booking made now; taken from the host payout, never charged to guests. */
export interface HostShortletFees {
  commissionPct: number;
  standardCommissionPct: number;
  /** When the launch rate ends, if one is running. */
  introEndsAt?: string;
}

export interface StayQuote {
  nights: number;
  nightsTotal: number;
  cleaningFee: number;
  tax: number;
  taxName?: string;
  /** Excludes the refundable deposit. */
  total: number;
  perNight: number;
  discountAmount?: number;
  deposit?: number;
}

export interface StayQuoteResult {
  bookable: boolean;
  quote?: StayQuote;
  reason?: string;
}

export interface FairPrice {
  typicalNightly: number;
  comparables: number;
  city: string;
  bedrooms: number;
}
