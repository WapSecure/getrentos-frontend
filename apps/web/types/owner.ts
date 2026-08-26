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
export type OfferStatus = 'submitted' | 'countered' | 'accepted' | 'rejected' | 'closed';
export type FinancingType = 'cash' | 'mortgage' | 'installment';
export type SaleEscrowStatus =
  | 'deposit_pending'
  | 'funds_held'
  | 'verification'
  | 'final_payment'
  | 'released'
  | 'frozen'
  | 'disputed'
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
  hasActiveSaleListing: boolean;
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
  buyerName: string;
  salePrice: number;
  escrowStatus: SaleEscrowStatus;
  milestones: EscrowMilestone[];
  activityLog: EscrowActivityLogEntry[];
  disputeReason?: string;
  createdAt: string;
  releasedAt?: string;
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
