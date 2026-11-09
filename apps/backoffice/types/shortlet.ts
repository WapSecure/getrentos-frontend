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
  // After any cancellation fees.
  amount: number;
  penaltyDeducted?: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  transferRef?: string;
  paidAt?: string;
  bookingCount: number;
  createdAt: string;
}

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

export interface AdminShortletPayoutBooking {
  id: string;
  listingTitle?: string;
  total: number;
  status: string;
  checkIn: string;
  checkOut: string;
  createdAt: string;
}

export interface AdminShortletPayoutDetail extends AdminShortletPayout {
  hostEmail?: string;
  account?: AdminShortletPayoutAccount;
  bookings?: AdminShortletPayoutBooking[];
}

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
  guestPromise?: boolean;
  problemType?: string;
  evidenceUrls?: string[];
  outcome?: AdminGuestPromiseOutcome;
  refundAmount?: number;
}

export type AdminGuestPromiseOutcome = 'FULL_REFUND' | 'PARTIAL_REFUND' | 'NOT_UPHELD';

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
  checkIn?: string;
  // A claim can only be filed after this.
  checkOut?: string;
  amount: number;
  reason: string;
  evidence: string[];
  evidenceUrls?: string[];
  status: AdminShortletDepositClaimStatus;
  // Resolved claims only.
  deductedAmount?: number;
  // deposit - deducted; resolved claims only.
  refundedAmount?: number;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AdminShortletFeeConfig {
  commissionPct: number;
  // Used instead for bookings made before introEndsAt.
  introCommissionPct?: number;
  introEndsAt?: string;
  currentCommissionPct: number;
  taxName?: string;
  taxPct: number;
  depositClaimWindowHours: number;
  updatedAt: string;
}

export interface AdminShortletFeeConfigInput {
  commissionPct: number;
  taxName?: string;
  taxPct: number;
  introCommissionPct: number | null;
  introEndsAt: string | null;
  depositClaimWindowHours: number;
}

export type AdminHostPenaltyStatus = 'OUTSTANDING' | 'SETTLED' | 'WAIVED';

export interface AdminHostPenalty {
  id: string;
  hostId: string;
  hostName?: string;
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
  status: AdminHostPenaltyStatus;
  waiverReason?: string;
  waivedAt?: string;
  createdAt: string;
}
