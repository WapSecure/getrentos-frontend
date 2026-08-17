import { authFetch, safeCall } from '@/lib/apiHelpers';
import type {
  OwnerProperty,
  SaleListing,
  SaleOffer,
  EscrowSaleTransaction,
  InvestmentMetrics,
  BuyerLead,
  OwnershipTransferDocument,
} from '@/types/owner';
import type { TrustProfile } from '@/types/trust-score';

export interface OwnerDashboard {
  totalProperties: number;
  verifiedProperties: number;
  activeListings: number;
  pendingOffers: number;
  activeTransactions: number;
  portfolioValue: number;
  recentActivity: { id: string; type: string; message: string; timestamp: string }[];
}

export interface OwnerProfile {
  legalName: string;
  email: string;
  phone?: string;
  companyName?: string;
  avatarUrl?: string;
  trustScore: number;
  verificationStatus: string;
}

export interface OwnerReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment?: string;
  category?: string;
}

export interface OwnerConversation {
  id: string;
  propertyId?: string;
  propertyName?: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  participantAvatar?: string;
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

/** API response shapes from the backend (camelCase already mapped by the API). */
export type OwnerPropertyApi = OwnerProperty;
export type OwnerSaleListingApi = SaleListing;
export type OwnerOfferApi = SaleOffer;
export type OwnerTransactionApi = EscrowSaleTransaction;
export type OwnerMetricApi = InvestmentMetrics;
export type OwnerLeadApi = BuyerLead;
export type OwnerDocumentApi = OwnershipTransferDocument;

export const ownerService = {
  // Dashboard
  getDashboard: () => safeCall(() => authFetch<OwnerDashboard>('/owner/dashboard')),

  // Properties
  listProperties: () => safeCall(() => authFetch<OwnerPropertyApi[]>('/owner/properties')),
  getProperty: (id: string) =>
    safeCall(() => authFetch<OwnerPropertyApi>(`/owner/properties/${id}`)),
  createProperty: (data: Partial<OwnerPropertyApi>) =>
    safeCall(() => authFetch('/owner/properties', { method: 'POST', body: JSON.stringify(data) })),
  updateProperty: (id: string, data: Partial<OwnerPropertyApi>) =>
    safeCall(() =>
      authFetch(`/owner/properties/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    ),
  archiveProperty: (id: string) =>
    safeCall(() => authFetch(`/owner/properties/${id}`, { method: 'DELETE' })),

  // Sale listings
  listListings: () => safeCall(() => authFetch<OwnerSaleListingApi[]>('/owner/listings')),
  createListing: (data: {
    propertyId: string;
    price: number;
    listingTitle?: string;
    amenities?: string[];
  }) =>
    safeCall(() => authFetch('/owner/listings', { method: 'POST', body: JSON.stringify(data) })),
  setListingStatus: (id: string, status: 'PUBLISHED' | 'PAUSED' | 'CLOSED') =>
    safeCall(() =>
      authFetch(`/owner/listings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),

  // Offers
  listOffers: () => safeCall(() => authFetch<OwnerOfferApi[]>('/owner/offers')),
  acceptOffer: (id: string) =>
    safeCall(() => authFetch(`/owner/offers/${id}/accept`, { method: 'POST' })),
  rejectOffer: (id: string) =>
    safeCall(() => authFetch(`/owner/offers/${id}/reject`, { method: 'POST' })),
  counterOffer: (id: string, amount: number, message?: string) =>
    safeCall(() =>
      authFetch(`/owner/offers/${id}/counter`, {
        method: 'POST',
        body: JSON.stringify({ amount, message }),
      })
    ),

  // Transactions / escrow
  listTransactions: () => safeCall(() => authFetch<OwnerTransactionApi[]>('/owner/transactions')),
  releaseTransaction: (id: string) =>
    safeCall(() => authFetch(`/owner/transactions/${id}/release`, { method: 'POST' })),

  // Analytics
  getAnalyticsMetrics: () =>
    safeCall(() => authFetch<OwnerMetricApi[]>('/owner/analytics/metrics')),
  getAnalyticsSummary: () => safeCall(() => authFetch('/owner/analytics/summary')),

  // Leads
  listLeads: () => safeCall(() => authFetch<OwnerLeadApi[]>('/owner/leads')),

  // Documents
  listDocuments: () => safeCall(() => authFetch<OwnerDocumentApi[]>('/owner/documents')),
  uploadDocument: (file: File, name: string, type: string, propertyId?: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    form.append('type', type);
    if (propertyId) form.append('propertyId', propertyId);
    return safeCall(() => authFetch('/owner/documents', { method: 'POST', body: form }));
  },
  toggleDocumentShared: (id: string, sharedWithBuyer: boolean) =>
    safeCall(() =>
      authFetch(`/owner/documents/${id}/shared`, {
        method: 'PATCH',
        body: JSON.stringify({ sharedWithBuyer }),
      })
    ),
  deleteDocument: (id: string) =>
    safeCall(() => authFetch(`/owner/documents/${id}`, { method: 'DELETE' })),

  // Reviews
  listReviews: () => safeCall(() => authFetch<OwnerReview[]>('/owner/reviews')),
  getRatingSummary: () => safeCall(() => authFetch('/owner/reviews/summary')),

  // Profile / settings
  getProfile: () => safeCall(() => authFetch<OwnerProfile>('/owner/profile')),
  getTrustProfile: () => safeCall(() => authFetch<TrustProfile>('/owner/trust-profile')),
  updateProfile: (data: Partial<OwnerProfile>) =>
    safeCall(() => authFetch('/owner/profile', { method: 'PUT', body: JSON.stringify(data) })),

  // Messages
  listConversations: () =>
    safeCall(() => authFetch<OwnerConversation[]>('/owner/messages/conversations')),
  listMessages: (conversationId: string) =>
    safeCall(() =>
      authFetch<OwnerMessage[]>(`/owner/messages/conversations/${conversationId}/messages`)
    ),
  sendMessage: (conversationId: string, text: string) =>
    safeCall(() =>
      authFetch(`/owner/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
    ),
  markConversationRead: (conversationId: string) =>
    safeCall(() =>
      authFetch(`/owner/messages/conversations/${conversationId}/read`, { method: 'PATCH' })
    ),
  toggleConversationPinned: (conversationId: string) =>
    safeCall(() =>
      authFetch(`/owner/messages/conversations/${conversationId}/pin`, { method: 'PATCH' })
    ),
};
