import { authFetch, safeCall, toQuery, type Paginated } from '@/lib/apiHelpers';
import type {
  BuyerPropertyListing,
  ViewingRequest,
  BuyerOffer,
  BuyerEscrowTransaction,
  BuyerDocument,
} from '@/types/buyer';
import type { TrustProfile } from '@/types/trust-score';
import { toDisplayPropertyType } from '@/lib/propertyTypes';

export interface BuyerDashboard {
  savedListings: number;
  activeOffers: number;
  upcomingViewings: number;
  activeTransactions: number;
  documentsUploaded: number;
  completedPurchases: number;
  recommendations?: { id: string; title: string; price: number; city: string }[];
  recentActivity: { id: string; type: string; message: string; timestamp: string }[];
}

export interface BuyerPaymentMethod {
  bankName: string;
  accountNumber: string;
  accountName: string;
  verified: boolean;
}

export interface BuyerNotificationPreference {
  id: string;
  email: boolean;
  push: boolean;
}

export interface BuyerSearchPreferences {
  minBudget: number;
  maxBudget: number;
  preferredTypes: string[];
  preferredLocations: string;
  notifyOnMatch: boolean;
}

export interface BuyerNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface BuyerOfferThreadMessage {
  id: string;
  offerId: string;
  senderId: string;
  senderName: string;
  type: string;
  amount?: number;
  text?: string;
  timestamp: string;
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

const mapBuyerListing = (listing: BuyerListingApi): BuyerListingApi => ({
  ...listing,
  propertyType: toDisplayPropertyType(listing.propertyType) as BuyerPropertyListing['propertyType'],
});

export interface DiscoverFilters {
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  propertyType?: string;
  sort?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface BuyerListOptions {
  page?: number;
  pageSize?: number;
}

export interface BuyerOffersFilters extends BuyerListOptions {
  status?: BuyerOffer['status'];
  search?: string;
}

export interface BuyerTransactionsFilters extends BuyerListOptions {
  status?: BuyerEscrowTransaction['escrowStatus'];
  search?: string;
}

export interface BuyerDocumentsFilters extends BuyerListOptions {
  type?: BuyerDocument['category'];
  search?: string;
}

export interface BuyerConversationsFilters extends BuyerListOptions {
  search?: string;
}

const ESCROW_STATUS_QUERY: Record<BuyerEscrowTransaction['escrowStatus'], string> = {
  deposit_pending: 'DEPOSIT_PENDING',
  funds_held: 'FUNDS_HELD',
  verification: 'VERIFICATION_PENDING',
  final_payment: 'SETTLEMENT_PENDING',
  released: 'RELEASED',
  frozen: 'FROZEN',
  disputed: 'DISPUTED',
  refunded: 'REFUNDED',
};

const VIEWING_STATUS_QUERY: Record<ViewingRequest['status'], string> = {
  pending: 'REQUESTED',
  confirmed: 'CONFIRMED',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
};

export const buyerService = {
  // Dashboard
  getDashboard: () => safeCall(() => authFetch<BuyerDashboard>('/buyer/dashboard')),

  // Discover listings
  discover: (filters: DiscoverFilters = {}) =>
    safeCall(async () => {
      const response = await authFetch<Paginated<BuyerListingApi>>(
        `/buyer/listings${toQuery({
          city: filters.city,
          state: filters.state,
          minPrice: filters.minPrice?.toString(),
          maxPrice: filters.maxPrice?.toString(),
          bedrooms: filters.bedrooms?.toString(),
          propertyType: filters.propertyType,
          sort: filters.sort,
          search: filters.search,
          page: filters.page?.toString(),
          pageSize: filters.pageSize?.toString(),
        })}`
      );
      return { ...response, items: response.items.map(mapBuyerListing) };
    }),
  getListing: (id: string) =>
    safeCall(async () =>
      mapBuyerListing(await authFetch<BuyerListingApi>(`/buyer/listings/${id}`))
    ),
  getRecommendations: () =>
    safeCall(async () =>
      (await authFetch<BuyerListingApi[]>('/buyer/listings/recommendations')).map(mapBuyerListing)
    ),

  // Saved listings
  listSaved: (options: BuyerListOptions = {}) =>
    safeCall(async () => {
      const response = await authFetch<Paginated<BuyerListingApi>>(
        `/buyer/saved${toQuery({ page: options.page, pageSize: options.pageSize })}`
      );
      return { ...response, items: response.items.map(mapBuyerListing) };
    }),
  saveListing: (listingId: string) =>
    safeCall(() => authFetch(`/buyer/saved/${listingId}`, { method: 'POST' })),
  unsaveListing: (listingId: string) =>
    safeCall(() => authFetch(`/buyer/saved/${listingId}`, { method: 'DELETE' })),

  // Viewings
  listViewings: (options: BuyerListOptions & { status?: ViewingRequest['status'] } = {}) =>
    safeCall(() =>
      authFetch<Paginated<BuyerViewingApi>>(
        `/buyer/viewings${toQuery({
          status: options.status ? VIEWING_STATUS_QUERY[options.status] : undefined,
          page: options.page,
          pageSize: options.pageSize,
        })}`
      )
    ),
  requestViewing: (data: { listingId: string; scheduledAt: string; notes?: string }) =>
    safeCall(() => authFetch('/buyer/viewings', { method: 'POST', body: JSON.stringify(data) })),
  updateViewing: (id: string, data: { status?: string; scheduledAt?: string; notes?: string }) =>
    safeCall(() =>
      authFetch(`/buyer/viewings/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    ),

  // Offers
  listOffers: (filters: BuyerOffersFilters = {}) =>
    safeCall(() =>
      authFetch<Paginated<BuyerOfferApi>>(
        `/buyer/offers${toQuery({
          status: filters.status?.toUpperCase(),
          search: filters.search,
          page: filters.page,
          pageSize: filters.pageSize,
        })}`
      )
    ),
  createOffer: (data: {
    listingId: string;
    amount: number;
    depositAmount?: number;
    financingType?: string;
    message?: string;
  }) => safeCall(() => authFetch('/buyer/offers', { method: 'POST', body: JSON.stringify(data) })),
  withdrawOffer: (id: string) =>
    safeCall(() => authFetch(`/buyer/offers/${id}/withdraw`, { method: 'POST' })),
  counterOffer: (id: string, amount: number, message?: string) =>
    safeCall(() =>
      authFetch(`/buyer/offers/${id}/counter`, {
        method: 'POST',
        body: JSON.stringify({ amount, message }),
      })
    ),
  acceptOffer: (id: string) =>
    safeCall(() => authFetch(`/buyer/offers/${id}/accept`, { method: 'POST' })),
  getOfferThread: (id: string) =>
    safeCall(() => authFetch<BuyerOfferThreadMessage[]>(`/buyer/offers/${id}/thread`)),

  // Transactions / escrow
  listTransactions: (filters: BuyerTransactionsFilters = {}) =>
    safeCall(() =>
      authFetch<Paginated<BuyerTransactionApi>>(
        `/buyer/transactions${toQuery({
          status: filters.status ? ESCROW_STATUS_QUERY[filters.status] : undefined,
          search: filters.search,
          page: filters.page,
          pageSize: filters.pageSize,
        })}`
      )
    ),
  depositTransaction: (id: string) =>
    safeCall(() => authFetch(`/buyer/transactions/${id}/deposit`, { method: 'POST' })),
  releaseTransaction: (id: string) =>
    safeCall(() => authFetch(`/buyer/transactions/${id}/release`, { method: 'POST' })),
  refundTransaction: (id: string) =>
    safeCall(() => authFetch(`/buyer/transactions/${id}/refund`, { method: 'POST' })),

  // Documents
  listDocuments: (filters: BuyerDocumentsFilters = {}) =>
    safeCall(() =>
      authFetch<Paginated<BuyerDocumentApi>>(
        `/buyer/documents${toQuery({
          type: filters.type?.toUpperCase(),
          search: filters.search,
          page: filters.page,
          pageSize: filters.pageSize,
        })}`
      )
    ),
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
  listReviews: (options: BuyerListOptions = {}) =>
    safeCall(() =>
      authFetch<Paginated<BuyerReview>>(
        `/buyer/reviews${toQuery({ page: options.page, pageSize: options.pageSize })}`
      )
    ),

  // Profile / settings
  getProfile: () => safeCall(() => authFetch<BuyerProfile>('/buyer/profile')),
  getTrustProfile: () => safeCall(() => authFetch<TrustProfile>('/buyer/trust-profile')),
  updateProfile: (data: Partial<BuyerProfile>) =>
    safeCall(() => authFetch('/buyer/profile', { method: 'PUT', body: JSON.stringify(data) })),

  // Payment method
  getPaymentMethod: () =>
    safeCall(() => authFetch<BuyerPaymentMethod>('/buyer/settings/payment-method')),
  updatePaymentMethod: (data: { bankName: string; accountNumber: string; accountName: string }) =>
    safeCall(() =>
      authFetch<BuyerPaymentMethod>('/buyer/settings/payment-method', {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    ),

  // Notification preferences
  getNotificationPreferences: () =>
    safeCall(() => authFetch<BuyerNotificationPreference[]>('/buyer/settings/notifications')),
  updateNotificationPreferences: (preferences: BuyerNotificationPreference[]) =>
    safeCall(() =>
      authFetch<BuyerNotificationPreference[]>('/buyer/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify({ preferences }),
      })
    ),

  // Search preferences
  getSearchPreferences: () =>
    safeCall(() => authFetch<BuyerSearchPreferences>('/buyer/settings/search-preferences')),
  updateSearchPreferences: (data: Partial<BuyerSearchPreferences>) =>
    safeCall(() =>
      authFetch<BuyerSearchPreferences>('/buyer/settings/search-preferences', {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    ),

  // Notifications feed
  getNotifications: (options: BuyerListOptions = {}) =>
    safeCall(() =>
      authFetch<Paginated<BuyerNotification>>(
        `/buyer/notifications${toQuery({ page: options.page, pageSize: options.pageSize })}`
      )
    ),
  markNotificationRead: (id: string) =>
    safeCall(() => authFetch(`/buyer/notifications/${id}/read`, { method: 'PATCH' })),
  markAllNotificationsRead: () =>
    safeCall(() => authFetch('/buyer/notifications/read-all', { method: 'POST' })),

  // Messages
  listConversations: (filters: BuyerConversationsFilters = {}) =>
    safeCall(() =>
      authFetch<Paginated<BuyerConversation>>(
        `/buyer/messages/conversations${toQuery({
          search: filters.search,
          page: filters.page,
          pageSize: filters.pageSize,
        })}`
      )
    ),
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
