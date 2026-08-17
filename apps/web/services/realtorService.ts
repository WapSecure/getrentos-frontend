import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type {
  RealtorClient,
  RealtorListing,
  RealtorLead,
  ViewingAppointment,
  RealtorOffer,
  RealtorReview,
  Commission,
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
  properties: { property: { id: string; title: string; city: string; state: string } }[];
}

interface RealtorListingApi {
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

interface RealtorLeadApi {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  listingId: string | null;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED' | 'LOST';
  createdAt: string;
  listing: { id: string; listingTitle: string | null } | null;
}
interface RealtorViewingApi {
  id: string;
  scheduledAt: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes: string | null;
  lead: { id: string; fullName: string } | null;
  listing: { id: string; listingTitle: string | null; property: { title: string } };
}
interface RealtorOfferApi {
  id: string;
  amount: number;
  status: 'SUBMITTED' | 'COUNTERED' | 'ACCEPTED' | 'REJECTED' | 'CLOSED';
  createdAt: string;
  buyer: { legalName: string | null; email: string };
  listing: {
    id: string;
    listingTitle: string | null;
    price?: number;
    property: { title: string; ownerId: string };
  };
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
    propertiesRepresented: client.properties.length,
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
    trustScore: 0,
    verified: false,
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
  };
}

export const realtorService = {
  getDashboard: (): Promise<ApiResponse<RealtorDashboardStats>> =>
    safeCall(() => authFetch('/realtor/dashboard')),
  listClients: () => safeCall(() => authFetch<RealtorClientApi[]>('/realtor/clients')),
  inviteClient: (email: string) =>
    safeCall(() =>
      authFetch('/realtor/clients', { method: 'POST', body: JSON.stringify({ email }) })
    ),
  listListings: () => safeCall(() => authFetch<RealtorListingApi[]>('/realtor/listings')),
  createListing: (data: {
    propertyId: string;
    listingTitle: string;
    listingType: 'RENT' | 'SALE';
    price: number;
  }) =>
    safeCall(() => authFetch('/realtor/listings', { method: 'POST', body: JSON.stringify(data) })),
  listLeads: () => safeCall(() => authFetch<RealtorLeadApi[]>('/realtor/leads')),
  createLead: (data: Record<string, unknown>) =>
    safeCall(() => authFetch('/realtor/leads', { method: 'POST', body: JSON.stringify(data) })),
  updateLeadStatus: (id: string, status: 'CLOSED' | 'LOST') =>
    safeCall(() =>
      authFetch(`/realtor/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    ),
  listViewings: () => safeCall(() => authFetch<RealtorViewingApi[]>('/realtor/viewings')),
  createViewing: (data: Record<string, unknown>) =>
    safeCall(() => authFetch('/realtor/viewings', { method: 'POST', body: JSON.stringify(data) })),
  updateViewingStatus: (id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') =>
    safeCall(() =>
      authFetch(`/realtor/viewings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    ),
  listOffers: () => safeCall(() => authFetch<RealtorOfferApi[]>('/realtor/offers')),
  counterOffer: (id: string, data: { amount: number; message?: string }) =>
    safeCall(() =>
      authFetch(`/realtor/offers/${id}/counter`, { method: 'POST', body: JSON.stringify(data) })
    ),
  listDocuments: () => safeCall(() => authFetch('/realtor/documents')),
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
  getReviews: () => safeCall(() => authFetch<RealtorReview[]>('/realtor/reviews')),
  getReviewsSummary: () =>
    safeCall(() =>
      authFetch<{ averageRating: number; reviewCount: number }>('/realtor/reviews/summary')
    ),
  getCommissions: () => safeCall(() => authFetch<Commission[]>('/realtor/commissions')),
  getCommissionsSummary: () =>
    safeCall(() =>
      authFetch<{
        totalEarned: number;
        pending: number;
        paid: number;
        dealsClosed: number;
      }>('/realtor/commissions/summary')
    ),
  listConversations: () => safeCall(() => authFetch('/realtor/messages')),
  getConversationMessages: (id: string) => safeCall(() => authFetch(`/realtor/messages/${id}`)),
  sendMessage: (id: string, text: string, files: File[] = []) => {
    const body = new FormData();
    if (text.trim()) body.append('text', text);
    files.forEach((file) => body.append('files', file));
    return safeCall(() => authFetch(`/realtor/messages/${id}`, { method: 'POST', body }));
  },
  listRealtorInvitations: () => safeCall(() => authFetch('/realtor/clients/invitations')),
  approveRealtorInvitation: (id: string) =>
    safeCall(() => authFetch(`/realtor/clients/${id}/approve`, { method: 'PATCH' })),
  revokeRealtorAccess: (id: string) =>
    safeCall(() => authFetch(`/realtor/clients/${id}/revoke`, { method: 'POST' })),
  getAssignableProperties: (id: string) =>
    safeCall(() => authFetch(`/realtor/clients/${id}/properties`)),
  assignProperty: (relationshipId: string, propertyId: string) =>
    safeCall(() =>
      authFetch(`/realtor/clients/${relationshipId}/properties`, {
        method: 'POST',
        body: JSON.stringify({ propertyId }),
      })
    ),
};
