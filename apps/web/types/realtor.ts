export type ClientRole = 'owner' | 'landlord';
export type ClientStatus = 'active' | 'pending' | 'inactive';
export type ListingCategory = 'sale' | 'rental';
export type RealtorListingStatus = 'draft' | 'pending_approval' | 'published' | 'paused' | 'closed';
export type LeadStage =
  | 'new'
  | 'contacted'
  | 'viewing_scheduled'
  | 'offer_made'
  | 'closed_won'
  | 'closed_lost';
export type ViewingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type RealtorOfferStatus = 'submitted' | 'countered' | 'accepted' | 'rejected' | 'closed';

/**
 * The ledger's own states. There is no "invoiced": commission becomes real when
 * the sale's escrow releases, and a sale reversed before any payout claimed it
 * is voided with a reason rather than quietly disappearing.
 */
export type CommissionStatus = 'available' | 'paid' | 'void';

/** Which side of the deal earned the commission. */
export type CommissionSide = 'listing' | 'buyer';

export type RealtorPayoutStatus = 'pending' | 'success' | 'failed';

export interface RealtorClient {
  id: string;
  clientName: string;
  role: ClientRole;
  email: string;
  phone: string;
  status: ClientStatus;
  propertiesRepresented: number;
  joinedDate: string;
}

export interface RealtorListing {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  category: ListingCategory;
  propertyType: string;
  price: number;
  city: string;
  state: string;
  bedrooms?: number;
  bathrooms?: number;
  status: RealtorListingStatus;
  createdAt: string;
}

export interface RealtorLead {
  id: string;
  leadName: string;
  leadType: 'buyer' | 'renter';
  email: string;
  phone: string;
  listingId: string;
  listingTitle: string;
  stage: LeadStage;
  inquiryDate: string;
}

export interface ViewingAppointment {
  id: string;
  leadName: string;
  listingId: string;
  listingTitle: string;
  scheduledDate: string;
  scheduledTime: string;
  status: ViewingStatus;
  notes?: string;
}

export interface RealtorOffer {
  id: string;
  listingId: string;
  listingTitle: string;
  clientName: string;
  leadName: string;
  offerAmount: number;
  askingPrice: number;
  status: RealtorOfferStatus;
  submittedAt: string;
  thread: OfferThreadMessage[];
}

export interface OfferThreadMessage {
  id: string;
  offerId: string;
  senderId: 'realtor' | 'lead' | 'client';
  senderName: string;
  type: 'message' | 'offer' | 'counter' | 'accepted' | 'rejected';
  amount?: number;
  text: string;
  timestamp: string;
}

export interface Commission {
  id: string;
  side: CommissionSide;
  propertyTitle: string;
  clientName: string;
  dealValue: number;
  /** The rate snapshotted when this was earned — later config changes never restate it. */
  ratePct: number;
  amount: number;
  status: CommissionStatus;
  /** When the sale settled: the moment this became real. */
  earnedAt: string;
  paidAt?: string;
  voidReason?: string;
}

export interface RealtorCommissionSummary {
  /** Earned and withdrawable right now. */
  available: number;
  /** Commission on deals still under escrow — not owed yet. */
  pending: number;
  /** Already settled to the bank. */
  paid: number;
  totalEarned: number;
  dealsClosed: number;
}

export interface RealtorPayoutSummary extends RealtorCommissionSummary {
  accountSet: boolean;
  tier: number;
  withdrawTierRequired: number;
  canWithdraw: boolean;
  /** Set when the tier is held back by something other than missing evidence. */
  withdrawWithheldReason?: string | null;
}

export interface RealtorPayoutAccount {
  id: string;
  bankCode: string;
  bankName: string;
  /** Masked: only the last four digits are ever returned. */
  accountNumber: string;
  accountName: string;
}

export interface RealtorPayout {
  id: string;
  realtorId: string;
  realtorName?: string;
  amount: number;
  status: RealtorPayoutStatus;
  transferRef?: string | null;
  paidAt?: string | null;
  failureReason?: string | null;
  /** How many commission rows this batch settled. */
  commissionCount: number;
  createdAt: string;
}

export interface RealtorPayoutDetail extends RealtorPayout {
  commissions: Commission[];
}

export interface RealtorDocument {
  id: string;
  name: string;
  category: 'agency_agreement' | 'listing_contract' | 'closing_document' | 'license' | 'other';
  clientName?: string;
  uploadedAt: string;
  sizeLabel: string;
}

export interface RealtorReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment?: string;
  category?: string;
}
