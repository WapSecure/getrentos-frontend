export type ListingPropertyType =
  | 'Apartment'
  | 'Duplex'
  | 'Bungalow'
  | 'Terrace'
  | 'Land'
  | 'Commercial';
export type ViewingRequestStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type BuyerOfferStatus =
  | 'submitted'
  | 'countered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'expired'
  | 'closed';
export type FinancingType = 'cash' | 'mortgage' | 'installment';
export type BuyerEscrowStatus =
  | 'deposit_pending'
  | 'funds_held'
  | 'verification'
  | 'final_payment'
  | 'released'
  | 'frozen'
  | 'disputed'
  | 'refunded';

export interface BuyerPropertyListing {
  id: string;
  title: string;
  propertyType: ListingPropertyType;
  askingPrice: number;
  address: string;
  city: string;
  state: string;
  bedrooms?: number;
  bathrooms?: number;
  propertySize?: number;
  features: string[];
  description: string;
  ownerName: string;
  ownerVerified: boolean;
  listedDate: string;
}

export interface ViewingRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  requestedDate: string;
  requestedTime: string;
  status: ViewingRequestStatus;
  notes?: string;
}

export interface BuyerOffer {
  id: string;
  propertyId: string;
  propertyTitle: string;
  ownerName: string;
  offerAmount: number;
  askingPrice: number;
  financingType: FinancingType;
  depositAmount?: number;
  message?: string;
  status: BuyerOfferStatus;
  submittedAt: string;
}

export interface BuyerOfferMessage {
  id: string;
  offerId: string;
  senderId: 'buyer' | 'owner';
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
  actor: 'buyer' | 'owner' | 'system' | 'compliance';
  action: string;
  timestamp: string;
}

export interface BuyerEscrowTransaction {
  id: string;
  offerId: string;
  propertyId: string;
  propertyTitle: string;
  ownerName: string;
  purchasePrice: number;
  escrowStatus: BuyerEscrowStatus;
  milestones: EscrowMilestone[];
  activityLog: EscrowActivityLogEntry[];
  disputeReason?: string;
  createdAt: string;
  releasedAt?: string;
}

export interface BuyerDocument {
  id: string;
  name: string;
  category:
    | 'proof_of_funds'
    | 'mortgage_preapproval'
    | 'identity'
    | 'transfer_agreement'
    | 'title_deed'
    | 'payment_receipt';
  propertyTitle?: string;
  uploadedAt: string;
  sizeLabel: string;
}
