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
export type CommissionStatus = 'pending' | 'invoiced' | 'paid';

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
  trustScore: number;
  verified: boolean;
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
  listingTitle: string;
  clientName: string;
  dealValue: number;
  commissionRate: number;
  commissionAmount: number;
  status: CommissionStatus;
  closedDate: string;
  paidDate?: string;
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
