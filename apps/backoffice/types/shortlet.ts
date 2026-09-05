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
