import type { DisplayPropertyType } from '@/lib/propertyTypes';

export type ListingPropertyType = DisplayPropertyType;
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
// Only these states are written (a dispute sets FROZEN); VERIFICATION_PENDING,
// SETTLEMENT_PENDING and DISPUTED are never surfaced.
export type BuyerEscrowStatus =
  | 'deposit_pending'
  | 'funds_held'
  | 'released'
  | 'frozen'
  | 'refunded';

export interface BuyerPropertyListing {
  id: string;
  title: string;
  propertyType: ListingPropertyType;
  askingPrice: number;
  /** False once under offer or sold. */
  acceptingOffers?: boolean;
  /** Left out until the property is verified; see addressHidden. */
  address?: string;
  addressHidden?: boolean;
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
  image?: string;
  /** Valid for a few hours. */
  videoTourUrl?: string;
  /** The tour was filmed in the Sureground app at the property. */
  videoTourFilmedOnSite?: boolean;
}

export interface ViewingRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  requestedDate: string;
  requestedTime: string;
  scheduledAt?: string;
  status: ViewingRequestStatus;
  /** 'video': a live video call the seller hosts at scheduledAt. */
  mode?: 'in_person' | 'video';
  notes?: string;
}

export interface BuyerOffer {
  id: string;
  /** The id discover shows as the listing. */
  listingId?: string;
  propertyId: string;
  propertyTitle: string;
  ownerName: string;
  offerAmount: number;
  askingPrice: number;
  financingType: FinancingType;
  depositAmount?: number;
  message?: string;
  /** Land only: keys of the not-verified checks the buyer accepted when offering. */
  acknowledgedNotVerified?: string[];
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
  /** 'LAND' sales carry conveyance steps. */
  propertyType?: string;
  ownerName: string;
  purchasePrice: number;
  /** The agreed deposit, else the price. */
  depositAmount?: number;
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
  /** Signed preview/download URL returned by the backend for this document. */
  downloadUrl?: string;
}
