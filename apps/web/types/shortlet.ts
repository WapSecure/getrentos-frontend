export type ShortletPricingMode = 'PER_NIGHT' | 'FLAT_STAY';
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
  ratingAverage?: number;
  reviewCount: number;
  pricingMode: ShortletPricingMode;
  nightlyRate?: number;
  cleaningFee?: number;
  minNights: number;
  maxNights?: number;
  weekendUpliftPct?: number;
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
  subtotal: number;
  total: number;
  status: ShortletBookingStatus;
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
  taxName?: string;
  taxPct?: number;
}

export interface CreateShortletListingInput {
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

export interface UpdateShortletListingInput {
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
  amount: number;
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
