import type { CommercialDetails } from '@sureground/shared/showroom';
import type { PropertyMediaDetails } from '@/types/landlord';
export type OwnershipVerificationStatus =
  | 'pending_review'
  | 'verified'
  | 'rejected'
  | 'needs_clarification';
export type SaleListingStatus =
  | 'draft'
  | 'pending_verification'
  | 'published'
  | 'paused'
  | 'closed';
export type OfferStatus =
  | 'submitted'
  | 'countered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'expired'
  | 'closed';
export type FinancingType = 'cash' | 'mortgage' | 'installment';
// Only these states are written (a dispute sets FROZEN); VERIFICATION_PENDING,
// SETTLEMENT_PENDING and DISPUTED are never surfaced.
export type SaleEscrowStatus =
  | 'deposit_pending'
  | 'funds_held'
  | 'released'
  | 'frozen'
  | 'refunded';
export type BuyerLeadStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'viewing_scheduled'
  | 'offer_made'
  | 'closed'
  | 'lost';

export interface OwnerProperty {
  id: string;
  name: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  country: string;
  /** Absent: a guess from the address. */
  latitude?: number;
  longitude?: number;
  locationConfirmedAt?: string;
  /** The Google place the address was checked against; absent for a typed address. */
  placeId?: string;
  addressVerifiedAt?: string;
  lga?: string;
  ownerName: string;
  verificationStatus: OwnershipVerificationStatus;
  rejectionReason?: string;
  /** Absent when the owner has never entered a valuation. */
  estimatedValue?: number;
  purchasePrice?: number;
  purchaseDate?: string;
  coverImageKey?: string;
  galleryImageKeys?: string[];
  coverImageUrl?: string;
  galleryImageUrls?: string[];
  /** A 360 tour link on an allowed host; null on an update clears it. */
  tourUrl?: string | null;
  /** Room and caption per photo, keyed by storage key; null on an update clears it. */
  mediaDetails?: PropertyMediaDetails | null;
  /** Storage key of the video tour; null on an update removes it. */
  videoTourKey?: string | null;
  /** Valid for a few hours. */
  videoTourUrl?: string;
  hasActiveSaleListing: boolean;
  /** Share it so an agent can request to act for the property. */
  referenceCode?: string | null;
  createdAt: string;
}

export interface SaleListing {
  id: string;
  propertyId: string;
  propertyName: string;
  listingTitle: string;
  propertyType: string;
  askingPrice: number;
  description: string;
  propertySize?: number;
  bedrooms?: number;
  bathrooms?: number;
  features: string[];
  /** Commercial properties only: what the seller stated. */
  commercial?: CommercialDetails;
  status: SaleListingStatus;
  createdAt: string;
}

export interface BuyerLead {
  id: string;
  buyerName: string;
  email: string;
  phone: string;
  propertyId: string;
  propertyName: string;
  inquiryDate: string;
  trustScore: number;
  verified: boolean;
  stage: BuyerLeadStage;
  assignedRealtor?: string;
}

export interface SaleOffer {
  id: string;
  buyerId: string;
  buyerName: string;
  propertyId: string;
  propertyName: string;
  offerAmount: number;
  askingPrice: number;
  financingType: FinancingType;
  depositAmount?: number;
  message?: string;
  status: OfferStatus;
  /** Absent from older APIs (then open means the owner). */
  awaiting?: 'owner' | 'buyer' | null;
  submittedAt: string;
}

export interface OfferMessage {
  id: string;
  offerId: string;
  senderId: 'owner' | 'buyer';
  senderName: string;
  type: 'message' | 'offer' | 'counter' | 'accepted' | 'rejected';
  amount?: number;
  text: string;
  timestamp: string;
}

export interface EscrowMilestone {
  label: string;
  completed: boolean;
}

export interface EscrowActivityLogEntry {
  id: string;
  actor: 'owner' | 'buyer' | 'system' | 'compliance';
  action: string;
  timestamp: string;
}

export interface EscrowSaleTransaction {
  id: string;
  offerId: string;
  propertyId: string;
  propertyName: string;
  /** 'LAND' sales carry conveyance steps. */
  propertyType?: string;
  buyerName: string;
  salePrice: number;
  escrowStatus: SaleEscrowStatus;
  milestones: EscrowMilestone[];
  activityLog: EscrowActivityLogEntry[];
  disputeReason?: string;
  createdAt: string;
  releasedAt?: string;
  /** Absent before escrow is released. */
  sellerPayoutStatus?: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  sellerPaidAt?: string;
}

export interface OwnershipTransferDocument {
  id: string;
  propertyId: string;
  propertyName: string;
  name: string;
  category:
    | 'transfer_agreement'
    | 'payment_receipt'
    | 'government_filing'
    | 'title_transfer'
    | 'other';
  uploadedAt: string;
  sizeLabel: string;
  sharedWithBuyer: boolean;
  /** Signed preview/download URL returned by the backend for this document. */
  downloadUrl?: string;
}

export interface InvestmentMetrics {
  propertyId: string;
  propertyName: string;
  purchasePrice: number;
  currentValue: number;
  appreciationRate: number;
  rentalYield?: number;
  roiPercentage: number;
}
