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
// deposit → held → released, with frozen (a dispute is open) and refunded as
// terminal branches. VERIFICATION_PENDING / SETTLEMENT_PENDING / DISPUTED exist
// in the enum but no service writes them (a dispute sets FROZEN), so they are
// not surfaced (DEF-240).
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
  /** The map pin, and when the owner confirmed it (absent: a guess from the address). */
  latitude?: number;
  longitude?: number;
  locationConfirmedAt?: string;
  ownerName: string;
  verificationStatus: OwnershipVerificationStatus;
  rejectionReason?: string;
  estimatedValue: number;
  purchasePrice?: number;
  purchaseDate?: string;
  coverImageKey?: string;
  galleryImageKeys?: string[];
  coverImageUrl?: string;
  galleryImageUrls?: string[];
  /** Storage key of the video tour; null on an update removes it. */
  videoTourKey?: string | null;
  /** Signed link to the video tour, valid for a few hours. */
  videoTourUrl?: string;
  hasActiveSaleListing: boolean;
  /** Human-friendly shareable handle, e.g. "PR-AB7K-9Q". Owners share it so an agent can request to act for the property. */
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
  /** The property's type, e.g. 'LAND' (whose sales carry conveyance steps). */
  propertyType?: string;
  buyerName: string;
  salePrice: number;
  escrowStatus: SaleEscrowStatus;
  milestones: EscrowMilestone[];
  activityLog: EscrowActivityLogEntry[];
  disputeReason?: string;
  createdAt: string;
  releasedAt?: string;
  /** Once escrow is released: whether the transfer to your payout account went out. Absent before release. */
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
