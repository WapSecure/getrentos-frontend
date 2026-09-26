import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';
import type { Paginated } from './properties';

/**
 * The property-owner portal (sellers). Mirrors the backend's /owner/* routes;
 * statuses arrive lowercase, as the API maps them.
 */

type Tone = 'warning' | 'info' | 'success' | 'danger' | 'neutral';

/* -------------------------------- dashboard -------------------------------- */

export interface OwnerDashboard {
  totalProperties: number;
  verifiedProperties: number;
  activeListings: number;
  pendingOffers: number;
  activeTransactions: number;
  completedSales: number;
  portfolioValue: number;
  recentActivity: { id: string; type: string; message: string; timestamp: string }[];
}

/* ------------------------------- properties ------------------------------- */

export type OwnerVerificationStatus =
  | 'pending_review'
  | 'verified'
  | 'rejected'
  | 'needs_clarification';

export const OWNER_VERIFICATION_LABEL: Record<OwnerVerificationStatus, string> = {
  pending_review: 'In review',
  verified: 'Verified',
  rejected: 'Rejected',
  needs_clarification: 'Needs info',
};

export const OWNER_VERIFICATION_TONE: Record<OwnerVerificationStatus, Tone> = {
  pending_review: 'info',
  verified: 'success',
  rejected: 'danger',
  needs_clarification: 'warning',
};

export interface OwnerProperty {
  id: string;
  name: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  country: string;
  ownerName: string;
  verificationStatus: OwnerVerificationStatus;
  rejectionReason?: string;
  estimatedValue: number;
  purchasePrice?: number;
  purchaseDate?: string;
  coverImageUrl?: string;
  galleryImageUrls?: string[];
  hasActiveSaleListing: boolean;
  createdAt: string;
}

export interface CreateOwnerPropertyInput {
  name: string;
  propertyType: 'APARTMENT' | 'DUPLEX' | 'CONDO' | 'COMMERCIAL' | 'LAND' | 'SHARED_APARTMENT';
  address: string;
  city: string;
  state: string;
  country: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  estimatedValue?: number;
  purchasePrice?: number;
  description?: string;
}

/* -------------------------------- listings -------------------------------- */

export type OwnerListingStatus =
  | 'draft'
  | 'pending_verification'
  | 'published'
  | 'paused'
  | 'closed';

export const OWNER_LISTING_LABEL: Record<OwnerListingStatus, string> = {
  draft: 'Draft',
  pending_verification: 'Awaiting verification',
  published: 'Live',
  paused: 'Paused',
  closed: 'Closed',
};

export const OWNER_LISTING_TONE: Record<OwnerListingStatus, Tone> = {
  draft: 'neutral',
  pending_verification: 'info',
  published: 'success',
  paused: 'warning',
  closed: 'neutral',
};

export interface OwnerListing {
  id: string;
  propertyId: string;
  propertyName: string;
  listingTitle: string;
  propertyType: string;
  askingPrice: number;
  description: string;
  bedrooms?: number;
  bathrooms?: number;
  features?: string[];
  status: OwnerListingStatus;
  createdAt: string;
}

/* --------------------------------- offers --------------------------------- */

export type OwnerOfferStatus =
  | 'submitted'
  | 'countered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'expired'
  | 'closed';

export const OWNER_OFFER_LABEL: Record<OwnerOfferStatus, string> = {
  submitted: 'New',
  countered: 'Countered',
  accepted: 'Accepted',
  rejected: 'Declined',
  withdrawn: 'Withdrawn',
  expired: 'Expired',
  closed: 'Closed',
};

export const OWNER_OFFER_TONE: Record<OwnerOfferStatus, Tone> = {
  submitted: 'info',
  countered: 'warning',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
  expired: 'neutral',
  closed: 'neutral',
};

export interface OwnerOffer {
  id: string;
  buyerId: string;
  buyerName: string;
  propertyId: string;
  propertyName: string;
  offerAmount: number;
  askingPrice: number;
  financingType: string;
  depositAmount?: number;
  message?: string;
  status: OwnerOfferStatus;
  submittedAt: string;
}

export interface OwnerOfferThreadMessage {
  id: string;
  offerId: string;
  senderId: string;
  senderName: string;
  type: string;
  amount?: number;
  text?: string;
  timestamp: string;
}

/** How far an offer sits from the asking price, e.g. "8% under asking". */
export function offerGap(offer: number, asking: number): string {
  if (!asking) return '';
  const pct = Math.round(((offer - asking) / asking) * 100);
  if (pct === 0) return 'At asking';
  return `${Math.abs(pct)}% ${pct < 0 ? 'under' : 'over'} asking`;
}

/* ------------------------------ transactions ------------------------------ */

export type OwnerEscrowStatus =
  | 'deposit_pending'
  | 'funds_held'
  | 'verification'
  | 'final_payment'
  | 'released'
  | 'frozen'
  | 'disputed'
  | 'refunded';

export interface OwnerTransaction {
  id: string;
  offerId: string;
  propertyId: string;
  propertyName: string;
  buyerName: string;
  salePrice: number;
  escrowStatus: OwnerEscrowStatus;
  milestones?: { label: string; completed: boolean }[];
  activityLog?: { id: string; actor: string; action: string; timestamp: string }[];
  disputeReason?: string;
  createdAt: string;
  releasedAt?: string;
  /** Once released: whether your payout has gone out. */
  sellerPayoutStatus?: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  sellerPaidAt?: string;
}

/* ------------------------------ leads & more ------------------------------ */

export type OwnerLeadStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'viewing_scheduled'
  | 'offer_made'
  | 'closed'
  | 'lost';

export const OWNER_LEAD_LABEL: Record<OwnerLeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  viewing_scheduled: 'Viewing booked',
  offer_made: 'Offer made',
  closed: 'Closed',
  lost: 'Lost',
};

export interface OwnerLead {
  id: string;
  buyerName: string;
  email: string;
  phone: string;
  propertyId: string;
  propertyName: string;
  inquiryDate: string;
  trustScore: number;
  verified: boolean;
  stage: OwnerLeadStage;
  assignedRealtor?: string;
  offerAmount?: number;
}

export interface OwnerDocument {
  id: string;
  propertyId?: string;
  propertyName: string;
  name: string;
  category: string;
  uploadedAt: string;
  sizeLabel: string;
  sharedWithBuyer: boolean;
  downloadUrl?: string;
}

export interface OwnerReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment?: string;
  category?: string;
}

export interface OwnerRatingSummary {
  averageRating: number;
  reviewCount: number;
  categories: { category: string; average: number; count: number }[];
}

export interface OwnerInvestmentMetric {
  propertyId: string;
  propertyName: string;
  purchasePrice: number;
  currentValue: number;
  appreciationRate: number;
  rentalYield?: number;
  roiPercentage: number;
}

export interface OwnerPreferences {
  minOfferPercent: number;
  autoDeclineLowOffers: boolean;
  allowRentalConversion: boolean;
}

/* -------------------------------- messages -------------------------------- */

export interface OwnerConversation {
  id: string;
  propertyId?: string;
  propertyName?: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
}

export interface OwnerMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  read: boolean;
}

/** Accepted proof-of-ownership documents (mirrors the API's OWNERSHIP_DOCUMENT_TYPES). */
export const OWNERSHIP_DOCUMENTS = [
  { value: 'C_OF_O', label: 'Certificate of Occupancy' },
  { value: 'GOVERNOR_CONSENT', label: "Governor's Consent" },
  { value: 'DEED_OF_ASSIGNMENT', label: 'Deed of Assignment' },
  { value: 'DEED', label: 'Title deed' },
  { value: 'REGISTERED_CONVEYANCE', label: 'Registered Conveyance' },
  { value: 'ALLOCATION_LETTER', label: 'Allocation letter' },
  { value: 'EXCISION_GAZETTE', label: 'Excision / Gazette' },
  { value: 'GOVERNMENT_RECEIPT', label: 'Government receipt' },
] as const;
export type OwnershipDocumentType = (typeof OWNERSHIP_DOCUMENTS)[number]['value'];

/* ----------------------------------- api ----------------------------------- */

const page = (p: number, size: number, extra = '') => `?page=${p}&pageSize=${size}${extra}`;

export const ownerApi = {
  dashboard: () => apiFetch<OwnerDashboard>('/owner/dashboard'),

  properties: (p = 1, size = 50) =>
    apiFetch<Paginated<OwnerProperty>>(`/owner/properties${page(p, size)}`),
  property: (id: string) => apiFetch<OwnerProperty>(`/owner/properties/${id}`),
  createProperty: (input: CreateOwnerPropertyInput) =>
    apiFetch<OwnerProperty>('/owner/properties', { method: 'POST', body: input }),

  /** Starts ownership verification for a property with one proof document. */
  submitOwnershipProof: (
    propertyId: string,
    documentType: OwnershipDocumentType,
    file: PickedFile
  ) => {
    const form = new FormData();
    form.append('documentType', documentType);
    appendFile(form, 'document', file);
    return apiUpload<unknown>(`/users/me/kyc/ownership-proof/${propertyId}`, form);
  },

  listings: (p = 1, size = 50) =>
    apiFetch<Paginated<OwnerListing>>(`/owner/listings${page(p, size)}`),
  createListing: (input: { propertyId: string; price: number; listingTitle?: string }) =>
    apiFetch<OwnerListing>('/owner/listings', { method: 'POST', body: input }),
  setListingStatus: (id: string, status: 'PUBLISHED' | 'PAUSED' | 'CLOSED') =>
    apiFetch<OwnerListing>(`/owner/listings/${id}/status`, { method: 'PATCH', body: { status } }),

  offers: (p = 1, size = 50) => apiFetch<Paginated<OwnerOffer>>(`/owner/offers${page(p, size)}`),
  offerThread: (id: string) => apiFetch<OwnerOfferThreadMessage[]>(`/owner/offers/${id}/thread`),
  acceptOffer: (id: string) => apiFetch<unknown>(`/owner/offers/${id}/accept`, { method: 'POST' }),
  rejectOffer: (id: string) => apiFetch<unknown>(`/owner/offers/${id}/reject`, { method: 'POST' }),
  counterOffer: (id: string, amount: number, message?: string) =>
    apiFetch<unknown>(`/owner/offers/${id}/counter`, { method: 'POST', body: { amount, message } }),

  transactions: (p = 1, size = 50) =>
    apiFetch<Paginated<OwnerTransaction>>(`/owner/transactions${page(p, size)}`),

  leads: (p = 1, size = 50) => apiFetch<Paginated<OwnerLead>>(`/owner/leads${page(p, size)}`),

  documents: (p = 1, size = 50) =>
    apiFetch<Paginated<OwnerDocument>>(`/owner/documents${page(p, size)}`),
  setDocumentShared: (id: string, sharedWithBuyer: boolean) =>
    apiFetch<OwnerDocument>(`/owner/documents/${id}/shared`, {
      method: 'PATCH',
      body: { sharedWithBuyer },
    }),

  reviews: (p = 1, size = 30) => apiFetch<Paginated<OwnerReview>>(`/owner/reviews${page(p, size)}`),
  ratingSummary: () => apiFetch<OwnerRatingSummary>('/owner/reviews/summary'),

  metrics: () => apiFetch<OwnerInvestmentMetric[]>('/owner/analytics/metrics'),

  preferences: () => apiFetch<OwnerPreferences>('/owner/settings/preferences'),
  updatePreferences: (input: Partial<OwnerPreferences>) =>
    apiFetch<OwnerPreferences>('/owner/settings/preferences', { method: 'PUT', body: input }),

  conversations: (p = 1, size = 30) =>
    apiFetch<Paginated<OwnerConversation>>(`/owner/messages/conversations${page(p, size)}`),
  messages: (conversationId: string) =>
    apiFetch<OwnerMessage[]>(`/owner/messages/conversations/${conversationId}/messages`),
  send: (conversationId: string, text: string) =>
    apiFetch<OwnerMessage>(`/owner/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { text },
    }),
  markRead: (conversationId: string) =>
    apiFetch<unknown>(`/owner/messages/conversations/${conversationId}/read`, { method: 'PATCH' }),
};
