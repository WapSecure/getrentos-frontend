import { authFetch, safeCall, toQuery } from '@/lib/apiHelpers';
import type {
  BuyerPropertyListing,
  ViewingRequest,
  BuyerOffer,
  BuyerEscrowTransaction,
  BuyerDocument,
} from '@/types/buyer';
import type { TrustProfile } from '@/types/trust-score';

export interface BuyerDashboard {
  savedListings: number;
  activeOffers: number;
  upcomingViewings: number;
  activeTransactions: number;
  recommendations?: { id: string; title: string; price: number; city: string }[];
  recentActivity: { id: string; type: string; message: string; timestamp: string }[];
}

export interface BuyerProfile {
  legalName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  trustScore: number;
  verificationStatus: string;
}

export interface BuyerReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment?: string;
  category?: string;
}

export interface BuyerConversation {
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

export interface BuyerMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  read: boolean;
}

/** Backend API shapes (already mapped camelCase). */
export type BuyerListingApi = BuyerPropertyListing;
export type BuyerViewingApi = ViewingRequest;
export type BuyerOfferApi = BuyerOffer;
export type BuyerTransactionApi = BuyerEscrowTransaction;
export type BuyerDocumentApi = BuyerDocument;

export interface DiscoverFilters {
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  propertyType?: string;
  sort?: string;
  search?: string;
}

export const buyerService = {
  // Dashboard
  getDashboard: () => safeCall(() => authFetch<BuyerDashboard>('/buyer/dashboard')),

  // Discover listings
  discover: (filters: DiscoverFilters = {}) =>
    safeCall(() =>
      authFetch<BuyerListingApi[]>(
        `/buyer/listings${toQuery({
          city: filters.city,
          state: filters.state,
          minPrice: filters.minPrice?.toString(),
          maxPrice: filters.maxPrice?.toString(),
          bedrooms: filters.bedrooms?.toString(),
          propertyType: filters.propertyType,
          sort: filters.sort,
          search: filters.search,
        })}`
      )
    ),
  getListing: (id: string) => safeCall(() => authFetch<BuyerListingApi>(`/buyer/listings/${id}`)),
  getRecommendations: () =>
    safeCall(() => authFetch<BuyerListingApi[]>('/buyer/listings/recommendations')),

  // Saved listings
  listSaved: () => safeCall(() => authFetch<BuyerListingApi[]>('/buyer/saved')),
  saveListing: (listingId: string) =>
    safeCall(() => authFetch(`/buyer/saved/${listingId}`, { method: 'POST' })),
  unsaveListing: (listingId: string) =>
    safeCall(() => authFetch(`/buyer/saved/${listingId}`, { method: 'DELETE' })),

  // Viewings
  listViewings: () => safeCall(() => authFetch<BuyerViewingApi[]>('/buyer/viewings')),
  requestViewing: (data: { listingId: string; scheduledAt: string; notes?: string }) =>
    safeCall(() => authFetch('/buyer/viewings', { method: 'POST', body: JSON.stringify(data) })),
  updateViewing: (id: string, data: { status?: string; scheduledAt?: string; notes?: string }) =>
    safeCall(() =>
      authFetch(`/buyer/viewings/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    ),

  // Offers
  listOffers: () => safeCall(() => authFetch<BuyerOfferApi[]>('/buyer/offers')),
  createOffer: (data: {
    listingId: string;
    amount: number;
    depositAmount?: number;
    financingType?: string;
    message?: string;
  }) => safeCall(() => authFetch('/buyer/offers', { method: 'POST', body: JSON.stringify(data) })),
  withdrawOffer: (id: string) =>
    safeCall(() => authFetch(`/buyer/offers/${id}/withdraw`, { method: 'POST' })),

  // Transactions / escrow
  listTransactions: () => safeCall(() => authFetch<BuyerTransactionApi[]>('/buyer/transactions')),
  depositTransaction: (id: string) =>
    safeCall(() => authFetch(`/buyer/transactions/${id}/deposit`, { method: 'POST' })),
  releaseTransaction: (id: string) =>
    safeCall(() => authFetch(`/buyer/transactions/${id}/release`, { method: 'POST' })),
  refundTransaction: (id: string) =>
    safeCall(() => authFetch(`/buyer/transactions/${id}/refund`, { method: 'POST' })),

  // Documents
  listDocuments: () => safeCall(() => authFetch<BuyerDocumentApi[]>('/buyer/documents')),
  uploadDocument: (
    file: File,
    name: string,
    type: string,
    offerId?: string,
    transactionId?: string
  ) => {
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    form.append('type', type);
    if (offerId) form.append('offerId', offerId);
    if (transactionId) form.append('transactionId', transactionId);
    return safeCall(() => authFetch('/buyer/documents', { method: 'POST', body: form }));
  },
  deleteDocument: (id: string) =>
    safeCall(() => authFetch(`/buyer/documents/${id}`, { method: 'DELETE' })),

  // Reviews
  listReviews: () => safeCall(() => authFetch<BuyerReview[]>('/buyer/reviews')),

  // Profile / settings
  getProfile: () => safeCall(() => authFetch<BuyerProfile>('/buyer/profile')),
  getTrustProfile: () => safeCall(() => authFetch<TrustProfile>('/buyer/trust-profile')),
  updateProfile: (data: Partial<BuyerProfile>) =>
    safeCall(() => authFetch('/buyer/profile', { method: 'PUT', body: JSON.stringify(data) })),

  // Messages
  listConversations: () =>
    safeCall(() => authFetch<BuyerConversation[]>('/buyer/messages/conversations')),
  listMessages: (conversationId: string) =>
    safeCall(() =>
      authFetch<BuyerMessage[]>(`/buyer/messages/conversations/${conversationId}/messages`)
    ),
  sendMessage: (conversationId: string, text: string) =>
    safeCall(() =>
      authFetch(`/buyer/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
    ),
  markConversationRead: (conversationId: string) =>
    safeCall(() =>
      authFetch(`/buyer/messages/conversations/${conversationId}/read`, { method: 'PATCH' })
    ),
  toggleConversationPinned: (conversationId: string) =>
    safeCall(() =>
      authFetch(`/buyer/messages/conversations/${conversationId}/pin`, { method: 'PATCH' })
    ),
};
