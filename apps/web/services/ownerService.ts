import { authFetch, safeCall, toQuery, type Paginated } from '@/lib/apiHelpers';
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
import { toApiPropertyType, toDisplayPropertyType } from '@/lib/propertyTypes';

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

export interface OwnerRatingSummary {
  averageRating: number;
  reviewCount: number;
  categories: { category: string; average: number; count: number }[];
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

export interface OwnerPayoutAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
  verified: boolean;
}

export interface OwnerNotificationPreference {
  id: string;
  email: boolean;
  push: boolean;
}

export interface OwnerPreferences {
  minOfferPercent: number;
  autoDeclineLowOffers: boolean;
  allowRentalConversion: boolean;
}

export interface OwnerNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
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

export interface OwnerMarketInsights {
  comparables: {
    propertyType: string;
    city: string;
    soldPrice: number;
    size: number;
    soldMonthsAgo: number;
  }[];
  lowEstimate: number;
  highEstimate: number;
  suggested: number;
}

export type OwnerPropertyApi = OwnerProperty;
export type OwnerSaleListingApi = SaleListing;
export type OwnerOfferApi = SaleOffer;
export type OwnerTransactionApi = EscrowSaleTransaction;
export type OwnerMetricApi = InvestmentMetrics;
export type OwnerLeadApi = BuyerLead;
export type OwnerDocumentApi = OwnershipTransferDocument;

export interface RealtorOption {
  id: string;
  name: string;
  speciality?: string;
}

const mapOwnerProperty = (property: OwnerPropertyApi): OwnerPropertyApi => ({
  ...property,
  propertyType: toDisplayPropertyType(property.propertyType),
});

const toOwnerPropertyPayload = (property: Partial<OwnerPropertyApi>): Partial<OwnerPropertyApi> => {
  const apiPropertyType = toApiPropertyType(property.propertyType);
  return apiPropertyType ? { ...property, propertyType: apiPropertyType } : property;
};

export const ownerService = {
  // Dashboard
  getDashboard: () => safeCall(() => authFetch<OwnerDashboard>('/owner/dashboard')),

  // Properties
  listProperties: (
    params: { search?: string; verificationStatus?: string; page?: number; pageSize?: number } = {}
  ) =>
    safeCall(async () => {
      const response = await authFetch<Paginated<OwnerPropertyApi>>(
        `/owner/properties${toQuery(params)}`
      );
      return { ...response, items: response.items.map(mapOwnerProperty) };
    }),
  getProperty: (id: string) =>
    safeCall(async () =>
      mapOwnerProperty(await authFetch<OwnerPropertyApi>(`/owner/properties/${id}`))
    ),
  createProperty: (data: Partial<OwnerPropertyApi>) =>
    safeCall(async () =>
      mapOwnerProperty(
        await authFetch<OwnerPropertyApi>('/owner/properties', {
          method: 'POST',
          body: JSON.stringify(toOwnerPropertyPayload(data)),
        })
      )
    ),
  updateProperty: (id: string, data: Partial<OwnerPropertyApi>) =>
    safeCall(async () =>
      mapOwnerProperty(
        await authFetch<OwnerPropertyApi>(`/owner/properties/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(toOwnerPropertyPayload(data)),
        })
      )
    ),
  archiveProperty: (id: string) =>
    safeCall(() => authFetch(`/owner/properties/${id}`, { method: 'DELETE' })),

  // Sale listings
  listListings: (
    params: { search?: string; status?: string; page?: number; pageSize?: number } = {}
  ) =>
    safeCall(() => authFetch<Paginated<OwnerSaleListingApi>>(`/owner/listings${toQuery(params)}`)),
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
  listOffers: (
    params: { search?: string; status?: string; page?: number; pageSize?: number } = {}
  ) => safeCall(() => authFetch<Paginated<OwnerOfferApi>>(`/owner/offers${toQuery(params)}`)),
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
  listTransactions: (
    params: { search?: string; status?: string; page?: number; pageSize?: number } = {}
  ) =>
    safeCall(() =>
      authFetch<Paginated<OwnerTransactionApi>>(`/owner/transactions${toQuery(params)}`)
    ),
  releaseTransaction: (id: string) =>
    safeCall(() => authFetch(`/owner/transactions/${id}/release`, { method: 'POST' })),

  // Analytics
  getAnalyticsMetrics: () =>
    safeCall(() => authFetch<OwnerMetricApi[]>('/owner/analytics/metrics')),
  getAnalyticsSummary: () => safeCall(() => authFetch('/owner/analytics/summary')),

  // Leads
  listLeads: (params: { search?: string; stage?: string; page?: number; pageSize?: number } = {}) =>
    safeCall(() => authFetch<Paginated<OwnerLeadApi>>(`/owner/leads${toQuery(params)}`)),
  getRealtors: (params: { search?: string; page?: number; pageSize?: number } = {}) =>
    safeCall(() => authFetch<Paginated<RealtorOption>>(`/owner/leads/realtors${toQuery(params)}`)),

  // Documents
  listDocuments: (
    params: { search?: string; category?: string; page?: number; pageSize?: number } = {}
  ) => safeCall(() => authFetch<Paginated<OwnerDocumentApi>>(`/owner/documents${toQuery(params)}`)),
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
  listReviews: (params: { page?: number; pageSize?: number } = {}) =>
    safeCall(() => authFetch<Paginated<OwnerReview>>(`/owner/reviews${toQuery(params)}`)),
  getRatingSummary: () => safeCall(() => authFetch<OwnerRatingSummary>('/owner/reviews/summary')),

  // Profile / settings
  getProfile: () => safeCall(() => authFetch<OwnerProfile>('/owner/profile')),
  getTrustProfile: () => safeCall(() => authFetch<TrustProfile>('/owner/trust-profile')),
  updateProfile: (data: Partial<OwnerProfile>) =>
    safeCall(() => authFetch('/owner/profile', { method: 'PUT', body: JSON.stringify(data) })),

  // Payout account
  getPayoutSettings: () => safeCall(() => authFetch<OwnerPayoutAccount>('/owner/settings/payout')),
  updatePayoutSettings: (data: { bankName: string; accountNumber: string; accountName: string }) =>
    safeCall(() =>
      authFetch<OwnerPayoutAccount>('/owner/settings/payout', {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    ),

  // Notification preferences
  getNotificationPreferences: () =>
    safeCall(() => authFetch<OwnerNotificationPreference[]>('/owner/settings/notifications')),
  updateNotificationPreferences: (preferences: OwnerNotificationPreference[]) =>
    safeCall(() =>
      authFetch<OwnerNotificationPreference[]>('/owner/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify({ preferences }),
      })
    ),

  // Preferences
  getPreferences: () => safeCall(() => authFetch<OwnerPreferences>('/owner/settings/preferences')),
  updatePreferences: (data: Partial<OwnerPreferences>) =>
    safeCall(() =>
      authFetch<OwnerPreferences>('/owner/settings/preferences', {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    ),

  // Notifications feed
  getNotifications: (params: { page?: number; pageSize?: number } = {}) =>
    safeCall(() =>
      authFetch<Paginated<OwnerNotification>>(`/owner/notifications${toQuery(params)}`)
    ),
  markNotificationRead: (id: string) =>
    safeCall(() => authFetch(`/owner/notifications/${id}/read`, { method: 'PATCH' })),
  markAllNotificationsRead: () =>
    safeCall(() => authFetch('/owner/notifications/read-all', { method: 'POST' })),

  // Portfolio trend
  getPortfolioTrend: () =>
    safeCall(() =>
      authFetch<{ label: string; value: number }[]>('/owner/analytics/portfolio-trend')
    ),

  // Market insights (comparable sales)
  getMarketInsights: (city?: string) =>
    safeCall(() =>
      authFetch<OwnerMarketInsights>(
        `/owner/analytics/market-insights${city ? `?city=${encodeURIComponent(city)}` : ''}`
      )
    ),

  // Offer negotiation thread
  getOfferThread: (offerId: string) =>
    safeCall(() => authFetch<OwnerOfferThreadMessage[]>(`/owner/offers/${offerId}/thread`)),

  // Messages
  listConversations: (params: { search?: string; page?: number; pageSize?: number } = {}) =>
    safeCall(() =>
      authFetch<Paginated<OwnerConversation>>(`/owner/messages/conversations${toQuery(params)}`)
    ),
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
