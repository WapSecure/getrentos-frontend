import { authFetch, safeCall, toQuery } from '@/lib/apiHelpers';
import type { ApiResponse, Paginated } from '@/lib/apiHelpers';
import type {
  RealtorClient,
  RealtorListing,
  RealtorLead,
  ViewingAppointment,
  RealtorOffer,
  RealtorReview,
  RealtorDocument,
  Commission,
  OfferThreadMessage,
} from '@/types/realtor';
import type { TrustProfile } from '@/types/trust-score';

export interface RealtorDashboardStats {
  totalListings: number;
  publishedListings: number;
  offerCount: number;
  activeClients?: number;
  activeLeads?: number;
  upcomingViewings?: number;
}

export interface RealtorClientApi {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'REVOKED';
  createdAt: string;
  client: {
    legalName: string | null;
    email: string;
    phone: string | null;
    roles: { role: string }[];
  };
  _count: { properties: number };
}

export interface RealtorAssignedPropertyApi {
  id: string;
  title: string;
  city: string;
  state: string;
}

export interface RealtorClientInvitationApi {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'REVOKED';
  realtor: {
    id: string;
    legalName: string | null;
    email: string;
    phone: string | null;
    companyName: string | null;
  };
}

export interface RealtorAssignablePropertyApi {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  verificationStatus: string;
  isVerified: boolean;
}

export interface RealtorListingApi {
  id: string;
  propertyId: string;
  listingTitle: string | null;
  listingType: 'RENT' | 'SALE';
  price: number;
  status: 'DRAFT' | 'PENDING_VERIFICATION' | 'PUBLISHED' | 'PAUSED' | 'CLOSED';
  createdAt: string;
  property: {
    title: string;
    city: string;
    state: string;
    propertyType: string;
    bedrooms: number | null;
    bathrooms: number | null;
    owner: { legalName: string | null };
  };
}

export interface RealtorLeadApi {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  listingId: string | null;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED' | 'LOST';
  createdAt: string;
  listing: { id: string; listingTitle: string | null } | null;
}
export interface RealtorViewingApi {
  id: string;
  scheduledAt: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes: string | null;
  lead: { id: string; fullName: string } | null;
  listing: { id: string; listingTitle: string | null; property: { title: string } };
}
export interface RealtorOfferApi {
  id: string;
  amount: number;
  status: 'SUBMITTED' | 'COUNTERED' | 'ACCEPTED' | 'REJECTED' | 'CLOSED';
  createdAt: string;
  buyer: { id: string; legalName: string | null; email: string };
  listing: {
    id: string;
    listingTitle: string | null;
    price?: number;
    property: { title: string; ownerId: string };
  };
  counterOffers?: {
    id: string;
    fromUserId: string;
    amount: number;
    message: string | null;
    createdAt: string;
  }[];
}

export interface RealtorDocumentApi {
  id: string;
  name: string;
  category: string;
  createdAt: string;
  sizeBytes: number;
  client?: { legalName: string | null } | null;
  listing?: { listingTitle: string | null } | null;
}

export interface RealtorConversationApi {
  id: string;
  client: { id: string; legalName: string };
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface RealtorMessageApi {
  id: string;
  senderType: 'realtor' | 'contact';
  text: string;
  createdAt: string;
  read: boolean;
}

export interface RealtorNotificationApi {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface RealtorReviewsSummary {
  averageRating: number;
  reviewCount: number;
  distribution: Record<number, number>;
}

export interface RealtorPageParams {
  page?: number;
  pageSize?: number;
}

export interface RealtorClientsParams extends RealtorPageParams {
  search?: string;
  role?: 'LANDLORD' | 'PROPERTY_OWNER';
  status?: RealtorClientApi['status'];
}

export interface RealtorClientInvitationsParams extends RealtorPageParams {
  search?: string;
  status?: RealtorClientInvitationApi['status'];
}

export interface RealtorAssignablePropertiesParams extends RealtorPageParams {
  search?: string;
}

export interface RealtorListingsParams extends RealtorPageParams {
  search?: string;
  status?: RealtorListingApi['status'];
}

export interface RealtorLeadsParams extends RealtorPageParams {
  search?: string;
  status?: RealtorLeadApi['status'];
  hasListing?: boolean;
}

export interface RealtorViewingsParams extends RealtorPageParams {
  status?: RealtorViewingApi['status'];
}

export interface RealtorOffersParams extends RealtorPageParams {
  search?: string;
  status?: RealtorOfferApi['status'];
}

export interface RealtorDocumentsParams extends RealtorPageParams {
  search?: string;
  category?: Uppercase<RealtorDocument['category']>;
}

export interface RealtorConversationsParams extends RealtorPageParams {
  search?: string;
}

export function mapRealtorClient(client: RealtorClientApi): RealtorClient {
  const role = client.client.roles.some(({ role: userRole }) => userRole === 'LANDLORD')
    ? 'landlord'
    : 'owner';

  return {
    id: client.id,
    clientName: client.client.legalName || client.client.email,
    role,
    email: client.client.email,
    phone: client.client.phone || '',
    status:
      client.status === 'ACTIVE' ? 'active' : client.status === 'PENDING' ? 'pending' : 'inactive',
    propertiesRepresented: client._count.properties,
    joinedDate: client.createdAt,
  };
}

export function mapRealtorListing(listing: RealtorListingApi): RealtorListing {
  const statuses: Record<RealtorListingApi['status'], RealtorListing['status']> = {
    DRAFT: 'draft',
    PENDING_VERIFICATION: 'pending_approval',
    PUBLISHED: 'published',
    PAUSED: 'paused',
    CLOSED: 'closed',
  };
  return {
    id: listing.id,
    clientId: listing.propertyId,
    clientName: listing.property.owner.legalName || 'Property owner',
    title: listing.listingTitle || listing.property.title,
    category: listing.listingType === 'SALE' ? 'sale' : 'rental',
    propertyType: listing.property.propertyType,
    price: listing.price,
    city: listing.property.city,
    state: listing.property.state,
    bedrooms: listing.property.bedrooms ?? undefined,
    bathrooms: listing.property.bathrooms ?? undefined,
    status: statuses[listing.status],
    createdAt: listing.createdAt,
  };
}

export function mapRealtorLead(lead: RealtorLeadApi): RealtorLead {
  const stages: Record<RealtorLeadApi['status'], RealtorLead['stage']> = {
    NEW: 'new',
    CONTACTED: 'contacted',
    QUALIFIED: 'viewing_scheduled',
    CLOSED: 'closed_won',
    LOST: 'closed_lost',
  };
  return {
    id: lead.id,
    leadName: lead.fullName,
    leadType: 'buyer',
    email: lead.email || '',
    phone: lead.phone || '',
    listingId: lead.listingId || '',
    listingTitle: lead.listing?.listingTitle || 'Unassigned listing',
    stage: stages[lead.status],
    inquiryDate: lead.createdAt,
  };
}

export function mapRealtorViewing(viewing: RealtorViewingApi): ViewingAppointment {
  const scheduledAt = new Date(viewing.scheduledAt);
  const statuses: Record<RealtorViewingApi['status'], ViewingAppointment['status']> = {
    REQUESTED: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };
  return {
    id: viewing.id,
    leadName: viewing.lead?.fullName || 'Unassigned lead',
    listingId: viewing.listing.id,
    listingTitle: viewing.listing.listingTitle || viewing.listing.property.title,
    scheduledDate: scheduledAt.toISOString().slice(0, 10),
    scheduledTime: scheduledAt.toISOString().slice(11, 16),
    status: statuses[viewing.status],
    notes: viewing.notes || undefined,
  };
}

export function mapRealtorOffer(offer: RealtorOfferApi): RealtorOffer {
  const statuses: Record<RealtorOfferApi['status'], RealtorOffer['status']> = {
    SUBMITTED: 'submitted',
    COUNTERED: 'countered',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    CLOSED: 'closed',
  };
  const buyerName = offer.buyer.legalName || 'Lead';
  const thread: OfferThreadMessage[] = [
    {
      id: `offer_${offer.id}`,
      offerId: offer.id,
      senderId: 'lead',
      senderName: buyerName,
      type: 'offer',
      amount: offer.amount,
      text: 'Submitted an offer of',
      timestamp: offer.createdAt,
    },
    ...(offer.counterOffers ?? []).map((c) => {
      const isRealtor = c.fromUserId !== offer.buyer.id;
      return {
        id: c.id,
        offerId: offer.id,
        senderId: (isRealtor ? 'realtor' : 'lead') as 'realtor' | 'lead',
        senderName: isRealtor ? 'You' : buyerName,
        type: 'counter' as const,
        amount: c.amount,
        text: 'Countered with',
        timestamp: c.createdAt,
      };
    }),
  ];
  return {
    id: offer.id,
    listingId: offer.listing.id,
    listingTitle: offer.listing.listingTitle || offer.listing.property.title,
    clientName: 'Property owner',
    leadName: offer.buyer.legalName || offer.buyer.email,
    offerAmount: offer.amount,
    askingPrice: offer.listing.price || 0,
    status: statuses[offer.status],
    submittedAt: offer.createdAt,
    thread,
  };
}

export const realtorService = {
  getDashboard: (): Promise<ApiResponse<RealtorDashboardStats>> =>
    safeCall(() => authFetch('/realtor/dashboard')),
  listClients: (params: RealtorClientsParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<RealtorClientApi>>(`/realtor/clients${toQuery({ ...params })}`)
    ),
  listAssignedProperties: (
    relationshipId: string,
    params: RealtorAssignablePropertiesParams = {}
  ) =>
    safeCall(() =>
      authFetch<Paginated<RealtorAssignedPropertyApi>>(
        `/realtor/clients/${relationshipId}/assigned-properties${toQuery({ ...params })}`
      )
    ),
  inviteClient: (email: string) =>
    safeCall(() =>
      authFetch('/realtor/clients', { method: 'POST', body: JSON.stringify({ email }) })
    ),
  checkClientEmail: (email: string) =>
    safeCall(() =>
      authFetch<{
        exists: boolean;
        isEligible: boolean;
        name: string | null;
        role: 'OWNER_OR_LANDLORD' | 'OTHER' | null;
      }>('/realtor/clients/check', { method: 'POST', body: JSON.stringify({ email }) })
    ),
  listListings: (params: RealtorListingsParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<RealtorListingApi>>(`/realtor/listings${toQuery({ ...params })}`)
    ),
  createListing: (data: {
    propertyId: string;
    listingTitle: string;
    listingType: 'RENT' | 'SALE';
    price: number;
  }) =>
    safeCall(() => authFetch('/realtor/listings', { method: 'POST', body: JSON.stringify(data) })),
  listLeads: (params: RealtorLeadsParams = {}) =>
    safeCall(() => authFetch<Paginated<RealtorLeadApi>>(`/realtor/leads${toQuery({ ...params })}`)),
  getLead: (id: string) => safeCall(() => authFetch<RealtorLeadApi>(`/realtor/leads/${id}`)),
  createLead: (data: Record<string, unknown>) =>
    safeCall(() => authFetch('/realtor/leads', { method: 'POST', body: JSON.stringify(data) })),
  updateLeadStatus: (id: string, status: 'CLOSED' | 'LOST') =>
    safeCall(() =>
      authFetch(`/realtor/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    ),
  listViewings: (params: RealtorViewingsParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<RealtorViewingApi>>(`/realtor/viewings${toQuery({ ...params })}`)
    ),
  createViewing: (data: Record<string, unknown>) =>
    safeCall(() => authFetch('/realtor/viewings', { method: 'POST', body: JSON.stringify(data) })),
  updateViewingStatus: (id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') =>
    safeCall(() =>
      authFetch(`/realtor/viewings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    ),
  listOffers: (params: RealtorOffersParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<RealtorOfferApi>>(`/realtor/offers${toQuery({ ...params })}`)
    ),
  counterOffer: (id: string, data: { amount: number; message?: string }) =>
    safeCall(() =>
      authFetch(`/realtor/offers/${id}/counter`, { method: 'POST', body: JSON.stringify(data) })
    ),
  listDocuments: (params: RealtorDocumentsParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<RealtorDocumentApi>>(`/realtor/documents${toQuery({ ...params })}`)
    ),
  uploadDocument: (file: File, name: string, category: string) => {
    const body = new FormData();
    body.append('file', file);
    body.append('name', name);
    body.append('category', category);
    return safeCall(() => authFetch('/realtor/documents', { method: 'POST', body }));
  },
  getDocumentDownload: (id: string) =>
    safeCall(() => authFetch<{ name: string; url: string }>(`/realtor/documents/${id}/download`)),
  getTrustProfile: () => safeCall(() => authFetch<TrustProfile>('/realtor/trust-profile')),
  getReviews: (params: RealtorPageParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<RealtorReview>>(`/realtor/reviews${toQuery({ ...params })}`)
    ),
  getReviewsSummary: () =>
    safeCall(() => authFetch<RealtorReviewsSummary>('/realtor/reviews/summary')),
  getCommissions: (params: RealtorPageParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<Commission>>(`/realtor/commissions${toQuery({ ...params })}`)
    ),
  getCommissionsSummary: () =>
    safeCall(() =>
      authFetch<{
        totalEarned: number;
        pending: number;
        paid: number;
        dealsClosed: number;
      }>('/realtor/commissions/summary')
    ),
  listConversations: (params: RealtorConversationsParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<RealtorConversationApi>>(`/realtor/messages${toQuery({ ...params })}`)
    ),
  getConversationMessages: (id: string, params: RealtorPageParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<RealtorMessageApi>>(`/realtor/messages/${id}${toQuery({ ...params })}`)
    ),
  startConversation: (clientId: string, propertyId?: string) =>
    safeCall(() =>
      authFetch<{ id: string }>('/realtor/messages', {
        method: 'POST',
        body: JSON.stringify(propertyId ? { clientId, propertyId } : { clientId }),
      })
    ),
  sendMessage: (id: string, text: string, files: File[] = []) => {
    const body = new FormData();
    if (text.trim()) body.append('text', text);
    files.forEach((file) => body.append('files', file));
    return safeCall(() => authFetch(`/realtor/messages/${id}`, { method: 'POST', body }));
  },
  listRealtorInvitations: (params: RealtorClientInvitationsParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<RealtorClientInvitationApi>>(
        `/realtor/clients/invitations${toQuery({ ...params })}`
      )
    ),
  approveRealtorInvitation: (id: string) =>
    safeCall(() => authFetch(`/realtor/clients/${id}/approve`, { method: 'PATCH' })),
  revokeRealtorAccess: (id: string) =>
    safeCall(() => authFetch(`/realtor/clients/${id}/revoke`, { method: 'POST' })),
  getAssignableProperties: (id: string, params: RealtorAssignablePropertiesParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<RealtorAssignablePropertyApi>>(
        `/realtor/clients/${id}/properties${toQuery({ ...params })}`
      )
    ),
  assignProperty: (relationshipId: string, propertyId: string) =>
    safeCall(() =>
      authFetch(`/realtor/clients/${relationshipId}/properties`, {
        method: 'POST',
        body: JSON.stringify({ propertyId }),
      })
    ),

  // Settings
  getSettingsProfile: () =>
    safeCall(() =>
      authFetch<{
        fullName: string;
        email: string;
        phone?: string;
        companyName?: string;
        avatarUrl?: string;
      }>('/realtor/settings/profile')
    ),
  updateSettingsProfile: (data: {
    fullName: string;
    email: string;
    phone?: string;
    companyName?: string;
  }) =>
    safeCall(() =>
      authFetch('/realtor/settings/profile', { method: 'PUT', body: JSON.stringify(data) })
    ),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return safeCall(() =>
      authFetch<{ avatarUrl?: string }>('/realtor/settings/profile/avatar', {
        method: 'POST',
        body: form,
      })
    );
  },
  getPayoutAccount: () =>
    safeCall(() =>
      authFetch<{
        bankName: string;
        accountNumber: string;
        accountName: string;
        verified: boolean;
      }>('/realtor/settings/payout')
    ),
  updatePayoutAccount: (data: { bankName: string; accountNumber: string; accountName: string }) =>
    safeCall(() =>
      authFetch<{
        bankName: string;
        accountNumber: string;
        accountName: string;
        verified: boolean;
      }>('/realtor/settings/payout', { method: 'PUT', body: JSON.stringify(data) })
    ),
  getNotificationPreferences: () =>
    safeCall(() =>
      authFetch<{ id: string; email: boolean; push: boolean }[]>('/realtor/settings/notifications')
    ),
  updateNotificationPreferences: (
    preferences: {
      id: string;
      email: boolean;
      push: boolean;
    }[]
  ) =>
    safeCall(() =>
      authFetch('/realtor/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify({ preferences }),
      })
    ),
  getBusinessPreferences: () =>
    safeCall(() =>
      authFetch<{
        serviceAreas: string[];
        propertyTypes: string[];
        commissionRate: number;
      }>('/realtor/settings/preferences')
    ),
  updateBusinessPreferences: (data: {
    serviceAreas: string[];
    propertyTypes: string[];
    commissionRate: number;
  }) =>
    safeCall(() =>
      authFetch('/realtor/settings/preferences', { method: 'PUT', body: JSON.stringify(data) })
    ),

  // Notifications feed
  getNotifications: (params: RealtorPageParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<RealtorNotificationApi>>(
        `/realtor/notifications${toQuery({ ...params })}`
      )
    ),
  markNotificationRead: (id: string) =>
    safeCall(() => authFetch(`/realtor/notifications/${id}/read`, { method: 'PATCH' })),
  markAllNotificationsRead: () =>
    safeCall(() => authFetch('/realtor/notifications/read-all', { method: 'POST' })),

  // Dashboard extras
  getDashboardActivity: () =>
    safeCall(() =>
      authFetch<{ id: string; type: string; title: string; description: string; date: string }[]>(
        '/realtor/dashboard/activity'
      )
    ),
  getCommissionTrend: () =>
    safeCall(() => authFetch<{ label: string; value: number }[]>('/realtor/commissions/trend')),
};
