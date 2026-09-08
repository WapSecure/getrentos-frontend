import type { ShortletListingStatus } from './shortlet';

/** Marketplace (sale) domain admin types. */

export type SaleListingStatus = ShortletListingStatus;

export type SaleOfferStatus =
  | 'SUBMITTED'
  | 'COUNTERED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'EXPIRED'
  | 'CLOSED';

export type EscrowState =
  | 'DEPOSIT_PENDING'
  | 'FUNDS_HELD'
  | 'VERIFICATION_PENDING'
  | 'SETTLEMENT_PENDING'
  | 'RELEASED'
  | 'FROZEN'
  | 'DISPUTED'
  | 'REFUNDED';

export interface AdminMarketplaceOverview {
  totalListings: number;
  publishedListings: number;
  pendingListings: number;
  totalOffers: number;
  openOffers: number;
  activeEscrows: number;
  closedDeals: number;
  totalDealValue: number;
}

export interface AdminMarketplaceListing {
  id: string;
  propertyId: string;
  title: string;
  city: string;
  state: string;
  price: number;
  status: SaleListingStatus;
  sellerId: string;
  sellerName: string;
  sellerEmail?: string;
  offerCount: number;
  openOfferCount: number;
  createdAt: string;
  publishedAt?: string;
}

export interface AdminMarketplaceOffer {
  id: string;
  listingId: string;
  listingTitle: string;
  city: string;
  buyerId: string;
  buyerName: string;
  buyerEmail?: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  depositAmount?: number;
  financingType?: string;
  status: SaleOfferStatus;
  counterOfferCount: number;
  transactionId?: string;
  escrowStatus?: EscrowState;
  createdAt: string;
}

export interface AdminMarketplaceCounterOffer {
  id: string;
  fromUserId: string;
  fromName: string;
  amount: number;
  message?: string;
  createdAt: string;
}

export interface AdminMarketplaceEscrowEvent {
  id: string;
  eventType: string;
  status: string;
  createdAt: string;
}

export interface AdminMarketplaceEscrow {
  id: string;
  amount: number;
  depositAmount?: number;
  escrowStatus: EscrowState;
  flagged: boolean;
  createdAt: string;
  events: AdminMarketplaceEscrowEvent[];
}

export interface AdminMarketplaceOfferDetail {
  id: string;
  listingId: string;
  listingTitle: string;
  city: string;
  state: string;
  amount: number;
  depositAmount?: number;
  financingType?: string;
  message?: string;
  status: SaleOfferStatus;
  expiresAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  withdrawnAt?: string;
  createdAt: string;
  buyerId: string;
  buyerName: string;
  buyerEmail?: string;
  sellerId: string;
  sellerName: string;
  sellerEmail?: string;
  counterOffers: AdminMarketplaceCounterOffer[];
  transaction?: AdminMarketplaceEscrow;
}

/** Realtor professional register types. */

export type LicenseStatus =
  | 'PENDING_REVIEW'
  | 'NEEDS_CLARIFICATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'NONE';

export interface AdminRealtor {
  id: string;
  legalName: string;
  email?: string;
  phone?: string;
  accountStatus: string;
  verificationStatus: string;
  trustScore: number;
  licenseStatus: LicenseStatus;
  licenseNumber?: string;
  commissionRate: number;
  payoutReady: boolean;
  listingCount: number;
  publishedListingCount: number;
  activeClientCount: number;
  openOfferCount: number;
  dealsClosed: number;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface AdminRealtorLicense {
  id: string;
  licenseNumber: string;
  status: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface AdminRealtorBusinessSettings {
  serviceAreas: string[];
  propertyTypes: string[];
  commissionRate: number;
}

export interface AdminRealtorPayout {
  bankName?: string;
  accountName?: string;
  accountNumberMasked?: string;
  verified: boolean;
}

export interface AdminRealtorListing {
  id: string;
  listingType: string;
  title: string;
  price: number;
  status: string;
  offerCount: number;
  createdAt: string;
}

export interface AdminRealtorClient {
  id: string;
  clientId: string;
  clientName: string;
  status: string;
  propertyCount?: number;
  createdAt: string;
}

export interface AdminRealtorCommissionSummary {
  totalEarned: number;
  pending: number;
  paid: number;
  dealsClosed: number;
}

export interface AdminRealtorReviewSummary {
  averageRating: number;
  reviewCount: number;
}

export interface AdminRealtorDetail {
  id: string;
  legalName: string;
  email?: string;
  phone?: string;
  accountStatus: string;
  verificationStatus: string;
  trustScore: number;
  createdAt: string;
  licenses: AdminRealtorLicense[];
  businessSettings?: AdminRealtorBusinessSettings;
  payout?: AdminRealtorPayout;
  listingCount: number;
  publishedListingCount: number;
  activeClientCount: number;
  pendingClientCount: number;
  openOfferCount: number;
  leadCount: number;
  recentListings: AdminRealtorListing[];
  recentClients: AdminRealtorClient[];
  commissions?: AdminRealtorCommissionSummary;
  reviews?: AdminRealtorReviewSummary;
}

/** Agent professional register types. */

export interface AdminAgent {
  id: string;
  legalName: string;
  email?: string;
  phone?: string;
  accountStatus: string;
  verificationStatus: string;
  trustScore: number;
  activeClientCount: number;
  propertyCount: number;
  openTaskCount: number;
  completedTaskCount: number;
  inspectionCount: number;
  verificationCount: number;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface AdminAgentTaskSummary {
  assigned: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export interface AdminAgentClient {
  id: string;
  clientId: string;
  clientName: string;
  status: string;
  propertyCount?: number;
  createdAt: string;
}

export interface AdminAgentTask {
  id: string;
  type: string;
  title: string;
  status: string;
  priority?: string;
  propertyTitle?: string;
  assignedByName?: string;
  dueAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface AdminAgentReviewSummary {
  averageRating: number;
  reviewCount: number;
}

export interface AdminAgentDetail {
  id: string;
  legalName: string;
  email?: string;
  phone?: string;
  accountStatus: string;
  verificationStatus: string;
  trustScore: number;
  createdAt: string;
  activeClientCount: number;
  pendingClientCount: number;
  propertyCount: number;
  inspectionCount: number;
  verificationCount: number;
  tasks?: AdminAgentTaskSummary;
  recentClients: AdminAgentClient[];
  recentTasks: AdminAgentTask[];
  reviews?: AdminAgentReviewSummary;
}
