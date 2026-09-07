export type ShortletPricingMode = 'PER_NIGHT' | 'FLAT_STAY';
export type ShortletListingStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'CLOSED';
export type ShortletBookingStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'COMPLETED';
export type ShortletPaymentStatus = 'UNPAID' | 'PROCESSING' | 'PAID' | 'REFUNDED';
export type ShortletDepositStatus = 'UNPAID' | 'HELD' | 'REFUNDED';
export type ShortletCancellationPolicy = 'FLEXIBLE' | 'MODERATE' | 'STRICT';

export interface AdminShortletListing {
  id: string;
  title: string;
  city: string;
  state: string;
  nightlyRate?: number;
  pricingMode: ShortletPricingMode;
  status: ShortletListingStatus;
  instantBooking: boolean;
  maxGuests: number;
  hostId: string;
  hostName: string;
  bookingCount: number;
  createdAt: string;
}

export interface AdminShortletBooking {
  id: string;
  listingId: string;
  propertyTitle: string;
  city: string;
  guestId: string;
  guestName: string;
  hostName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  status: ShortletBookingStatus;
  paymentStatus: ShortletPaymentStatus;
  paidAt?: string;
  paidOut?: boolean;
  depositStatus: ShortletDepositStatus;
  deposit?: number;
  refundAmount?: number;
  paymentReference?: string;
  createdAt: string;
}

export interface AdminShortletOverview {
  totalListings: number;
  activeListings: number;
  pausedListings: number;
  pendingRequests: number;
  confirmedBookings: number;
  totalBookingValue: number;
}

export interface AdminShortletPayout {
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

/** A host payout bank account on the admin register (account number masked). */
export interface AdminShortletPayoutAccount {
  id: string;
  hostId: string;
  hostName: string;
  hostEmail?: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  recipientReady: boolean;
  createdAt: string;
}

/** A booking covered by a payout (payout detail view). */
export interface AdminShortletPayoutBooking {
  id: string;
  listingTitle?: string;
  total: number;
  status: string;
  checkIn: string;
  checkOut: string;
  createdAt: string;
}

/** Full payout detail: host + account + the bookings it covered. */
export interface AdminShortletPayoutDetail extends AdminShortletPayout {
  hostEmail?: string;
  account?: AdminShortletPayoutAccount;
  bookings?: AdminShortletPayoutBooking[];
}

/** Result of a booking intervention (decline/cancel/refund/complete). */
export interface AdminShortletBookingDetail {
  id: string;
  listingId: string;
  propertyTitle: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  status: ShortletBookingStatus;
  paymentStatus: ShortletPaymentStatus;
  paidAt?: string;
  cancellationPolicy?: ShortletCancellationPolicy;
  refundAmount?: number;
  refundedAt?: string;
  deposit?: number;
  depositStatus: ShortletDepositStatus;
  depositRefundedAt?: string;
  hostName: string;
  guestName?: string;
  createdAt: string;
}

/** Admin review-moderation row for a guest's review of a stay. */
export interface AdminShortletReview {
  id: string;
  bookingId: string;
  listingId: string;
  listingTitle?: string;
  guestId: string;
  guestName: string;
  hostId: string;
  hostName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

/** Admin review-moderation row for a host's review of a guest. */
export type AdminShortletGuestReview = AdminShortletReview;

export type AdminShortletDisputeCategory =
  | 'SERVICE_QUALITY'
  | 'PAYMENT'
  | 'DAMAGE'
  | 'CANCELLATION'
  | 'OTHER';
export type AdminShortletDisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED';
export type AdminShortletDisputePriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AdminShortletDispute {
  id: string;
  bookingId: string;
  listingTitle?: string;
  title: string;
  category: AdminShortletDisputeCategory;
  priority: AdminShortletDisputePriority;
  status: AdminShortletDisputeStatus;
  raisedBy: string;
  against: string;
  amount?: number;
  description: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AdminShortletDisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export type AdminShortletDepositClaimStatus = 'PENDING' | 'APPROVED' | 'PARTIAL' | 'REJECTED';

export interface AdminShortletDepositClaim {
  id: string;
  bookingId: string;
  listingTitle?: string;
  claimedBy: string;
  guestName: string;
  amount: number;
  reason: string;
  evidence: string[];
  /** Signed preview URLs of the evidence photos (returned on the admin list). */
  evidenceUrls?: string[];
  status: AdminShortletDepositClaimStatus;
  /** Naira withheld from the guest refund by this claim (resolved claims only). */
  deductedAmount?: number;
  /** Naira refunded to the guest = deposit - deducted (resolved claims only). */
  refundedAmount?: number;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AdminShortletFeeConfig {
  commissionPct: number;
  taxName?: string;
  taxPct: number;
  updatedAt: string;
}
