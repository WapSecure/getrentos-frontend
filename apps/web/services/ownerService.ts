import { uploadVideoDirect } from '@/lib/videoUpload';
import type { ReplyLanguage } from '@/lib/replyLanguage';
import {
  authFetch,
  authUpload,
  safeCall,
  toQuery,
  type Paginated,
  type UploadOptions,
} from '@/lib/apiHelpers';
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
import type { AssistantReply, AssistantTurn } from '@/types/assistant';
import type { VideoCallJoin } from '@sureground/shared';
import { toApiPropertyType, toDisplayPropertyType } from '@/lib/propertyTypes';
import type { CommercialDetails } from '@sureground/shared/showroom';
import type { CommercialUpdatePayload } from '@/lib/commercialDetails';

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
  actionUrl?: string;
  conversationId?: string;
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
    size: number | null;
    soldMonthsAgo: number | null;
  }[];
  /** Null when there are no comparable sales. */
  lowEstimate: number | null;
  highEstimate: number | null;
  suggested: number | null;
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

export interface OwnerViewing {
  id: string;
  listingId: string;
  propertyId: string;
  propertyName: string;
  buyerId: string;
  buyerName: string;
  scheduledAt: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  mode: 'in_person' | 'video';
  notes?: string;
  requestedAt: string;
}

export const ownerService = {
  askAssistant: (question: string, history: AssistantTurn[], language?: ReplyLanguage) =>
    safeCall<AssistantReply>(() =>
      authFetch('/owner/assistant/ask', {
        method: 'POST',
        body: JSON.stringify({ question, history, language }),
      })
    ),
  getDashboard: () => safeCall(() => authFetch<OwnerDashboard>('/owner/dashboard')),

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

  /** Adds the landlord workspace to the account so this property can be rented out. */
  convertToRental: (id: string) =>
    safeCall(() =>
      authFetch<{ propertyId: string; landlordRoleGranted: boolean; roles: string[] }>(
        `/owner/properties/${id}/convert-to-rental`,
        { method: 'POST' }
      )
    ),

  /**
   * Two steps on purpose: the key only joins the property when sent back through `updateProperty`
   * as `coverImageKey`.
   */
  uploadPropertyMedia: (file: File, kind: 'image' | 'video' = 'image', upload?: UploadOptions) =>
    safeCall(async () => {
      // Videos go straight to storage, so a large tour never passes through the API.
      if (kind === 'video') return uploadVideoDirect('/owner/properties', file, upload);
      const form = new FormData();
      form.append('kind', kind);
      form.append('file', file);
      const path = '/owner/properties/media/upload';
      // With `upload` options it goes over XHR so it can report progress and be cancelled.
      return upload
        ? authUpload<{ key: string; kind: 'image' | 'video' }>(path, form, upload)
        : authFetch<{ key: string; kind: 'image' | 'video' }>(path, { method: 'POST', body: form });
    }),

  removePropertyMedia: (key: string) =>
    safeCall(() =>
      authFetch<{ deleted: boolean }>('/owner/properties/media/upload', {
        method: 'DELETE',
        body: JSON.stringify({ key }),
      })
    ),

  listViewings: (params: { status?: string; page?: number; pageSize?: number } = {}) =>
    safeCall(() => authFetch<Paginated<OwnerViewing>>(`/owner/viewings${toQuery(params)}`)),
  /** Pass another ISO time to offer that instead. */
  confirmViewing: (id: string, scheduledAt?: string) =>
    safeCall(() =>
      authFetch<OwnerViewing>(`/owner/viewings/${id}/confirm`, {
        method: 'PATCH',
        body: JSON.stringify(scheduledAt ? { scheduledAt } : {}),
      })
    ),
  declineViewing: (id: string) =>
    safeCall(() => authFetch<OwnerViewing>(`/owner/viewings/${id}/decline`, { method: 'PATCH' })),
  completeViewing: (id: string) =>
    safeCall(() => authFetch<OwnerViewing>(`/owner/viewings/${id}/complete`, { method: 'PATCH' })),
  /** Available from 15 minutes before the viewing. */
  joinViewingCall: (id: string) =>
    safeCall(() =>
      authFetch<VideoCallJoin>(`/owner/viewings/${id}/video-call`, { method: 'POST' })
    ),

  listListings: (
    params: { search?: string; status?: string; page?: number; pageSize?: number } = {}
  ) =>
    safeCall(() => authFetch<Paginated<OwnerSaleListingApi>>(`/owner/listings${toQuery(params)}`)),
  createListing: (data: {
    propertyId: string;
    price: number;
    listingTitle?: string;
    amenities?: string[];
    /** Left out, the listing waits for review. */
    intent?: 'draft' | 'publish';
    /** Commercial properties only; the API refuses it on any other type. */
    commercial?: CommercialDetails;
  }) =>
    safeCall(() => authFetch('/owner/listings', { method: 'POST', body: JSON.stringify(data) })),
  /** Every field is sent; null clears one. */
  updateListingCommercial: (id: string, details: CommercialUpdatePayload) =>
    safeCall(() =>
      authFetch<OwnerSaleListingApi>(`/owner/listings/${id}/commercial`, {
        method: 'PATCH',
        body: JSON.stringify(details),
      })
    ),
  setListingStatus: (id: string, status: 'PUBLISHED' | 'PAUSED' | 'CLOSED') =>
    safeCall(() =>
      authFetch(`/owner/listings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),

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

  listTransactions: (
    params: { search?: string; status?: string; page?: number; pageSize?: number } = {}
  ) =>
    safeCall(() =>
      authFetch<Paginated<OwnerTransactionApi>>(`/owner/transactions${toQuery(params)}`)
    ),
  releaseTransaction: (id: string) =>
    safeCall(() => authFetch(`/owner/transactions/${id}/release`, { method: 'POST' })),

  getAnalyticsMetrics: () =>
    safeCall(() => authFetch<OwnerMetricApi[]>('/owner/analytics/metrics')),
  getAnalyticsSummary: () => safeCall(() => authFetch('/owner/analytics/summary')),

  listLeads: (params: { search?: string; stage?: string; page?: number; pageSize?: number } = {}) =>
    safeCall(() => authFetch<Paginated<OwnerLeadApi>>(`/owner/leads${toQuery(params)}`)),
  getRealtors: (params: { search?: string; page?: number; pageSize?: number } = {}) =>
    safeCall(() => authFetch<Paginated<RealtorOption>>(`/owner/leads/realtors${toQuery(params)}`)),

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

  listReviews: (params: { page?: number; pageSize?: number } = {}) =>
    safeCall(() => authFetch<Paginated<OwnerReview>>(`/owner/reviews${toQuery(params)}`)),
  getRatingSummary: () => safeCall(() => authFetch<OwnerRatingSummary>('/owner/reviews/summary')),

  getProfile: () => safeCall(() => authFetch<OwnerProfile>('/owner/profile')),
  getTrustProfile: () => safeCall(() => authFetch<TrustProfile>('/owner/trust-profile')),
  updateProfile: (data: Partial<OwnerProfile>) =>
    safeCall(() => authFetch('/owner/profile', { method: 'PUT', body: JSON.stringify(data) })),

  getNotificationPreferences: () =>
    safeCall(() => authFetch<OwnerNotificationPreference[]>('/owner/settings/notifications')),
  updateNotificationPreferences: (preferences: OwnerNotificationPreference[]) =>
    safeCall(() =>
      authFetch<OwnerNotificationPreference[]>('/owner/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify({ preferences }),
      })
    ),

  getPreferences: () => safeCall(() => authFetch<OwnerPreferences>('/owner/settings/preferences')),
  updatePreferences: (data: Partial<OwnerPreferences>) =>
    safeCall(() =>
      authFetch<OwnerPreferences>('/owner/settings/preferences', {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    ),

  getNotifications: (params: { page?: number; pageSize?: number } = {}) =>
    safeCall(() =>
      authFetch<Paginated<OwnerNotification>>(`/owner/notifications${toQuery(params)}`)
    ),
  markNotificationRead: (id: string) =>
    safeCall(() => authFetch(`/owner/notifications/${id}/read`, { method: 'PATCH' })),
  markAllNotificationsRead: () =>
    safeCall(() => authFetch('/owner/notifications/read-all', { method: 'POST' })),

  getPortfolioTrend: () =>
    safeCall(() =>
      authFetch<{ label: string; value: number }[]>('/owner/analytics/portfolio-trend')
    ),

  getMarketInsights: (city?: string) =>
    safeCall(() =>
      authFetch<OwnerMarketInsights>(
        `/owner/analytics/market-insights${city ? `?city=${encodeURIComponent(city)}` : ''}`
      )
    ),

  getOfferThread: (offerId: string) =>
    safeCall(() => authFetch<OwnerOfferThreadMessage[]>(`/owner/offers/${offerId}/thread`)),

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
