import { apiFetch, apiFetchOrNull, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';
import type { Paginated } from './properties';
import type { TrustProfile } from './agentTrustProfile';

/**
 * The realtor's side of /realtor: clients who let them represent a property,
 * listings drafted on those properties, the lead → viewing → offer pipeline,
 * and commission earned when a sale's escrow releases.
 *
 * Realtor listings are created as drafts; the property's owner publishes them.
 * Commissions are Pro (402 PLAN_UPGRADE_REQUIRED otherwise).
 */

/* ---------------------------------- types --------------------------------- */

export type RelationshipStatus = 'PENDING' | 'ACTIVE' | 'REVOKED';
export type RealtorListingStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'CLOSED';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED' | 'LOST';
export type ViewingStatus = 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type RealtorOfferStatus = 'SUBMITTED' | 'COUNTERED' | 'ACCEPTED' | 'REJECTED' | 'CLOSED';
export type CommissionStatus = 'available' | 'paid' | 'void';
export type DocumentCategory =
  | 'agency_agreement'
  | 'listing_contract'
  | 'closing_document'
  | 'license'
  | 'other';

export interface RealtorDashboard {
  totalListings: number;
  publishedListings: number;
  offerCount: number;
  activeClients: number;
  activeLeads: number;
  upcomingViewings: number;
}

export interface RealtorActivity {
  id: string;
  type: 'lead' | 'viewing' | 'offer' | string;
  title: string;
  description: string;
  date: string;
}

export interface RealtorClient {
  /** The relationship id (not the client's user id). */
  id: string;
  clientId: string;
  status: RelationshipStatus;
  createdAt: string;
  client: {
    id?: string;
    legalName: string | null;
    email: string;
    phone: string | null;
    roles: { role: string }[];
  };
  _count: { properties: number };
}

export interface AssignedProperty {
  id: string;
  title: string;
  city: string;
  state: string;
}

export interface ClientEligibility {
  exists: boolean;
  isEligible: boolean;
  /** Only given for an owner or landlord the realtor can invite. */
  name: string | null;
}

export interface RealtorListing {
  id: string;
  propertyId: string;
  listingTitle: string | null;
  listingType: 'RENT' | 'SALE';
  price: number;
  status: RealtorListingStatus;
  createdAt: string;
  property: {
    id?: string;
    title: string;
    city: string;
    state: string;
    propertyType: string;
    bedrooms: number | null;
    bathrooms: number | null;
    owner: { legalName: string | null };
  };
}

export interface RealtorLead {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  listingId: string | null;
  source?: string | null;
  notes?: string | null;
  status: LeadStatus;
  createdAt: string;
  listing: { id: string; listingTitle: string | null } | null;
}

export interface RealtorViewing {
  id: string;
  scheduledAt: string;
  status: ViewingStatus;
  notes: string | null;
  lead: { id: string; fullName: string } | null;
  listing: { id: string; listingTitle: string | null; property: { title: string } };
}

export interface CounterOffer {
  id: string;
  fromUserId: string;
  amount: number;
  message: string | null;
  createdAt: string;
}

export interface RealtorOffer {
  id: string;
  amount: number;
  message?: string | null;
  status: RealtorOfferStatus;
  createdAt: string;
  buyer: { id: string; legalName: string | null; email: string };
  listing: {
    id: string;
    listingTitle: string | null;
    price?: number;
    property: { title: string; ownerId: string };
  };
  counterOffers?: CounterOffer[];
}

export interface Commission {
  id: string;
  side: 'listing' | 'buyer';
  propertyTitle: string;
  clientName: string;
  dealValue: number;
  ratePct: number;
  amount: number;
  status: CommissionStatus;
  earnedAt: string;
  paidAt?: string;
  voidReason?: string;
}

export interface CommissionSummary {
  available: number;
  pending: number;
  paid: number;
  totalEarned: number;
  dealsClosed: number;
}

export interface RealtorPayoutSummary extends CommissionSummary {
  accountSet: boolean;
  tier: number;
  withdrawTierRequired: number;
  canWithdraw: boolean;
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
  amount: number;
  status: 'pending' | 'success' | 'failed';
  transferRef?: string | null;
  paidAt?: string | null;
  failureReason?: string | null;
  commissionCount: number;
  createdAt: string;
}

export interface RealtorPayoutDetail extends RealtorPayout {
  commissions: Commission[];
}

export interface RealtorConversation {
  id: string;
  client: { id: string; legalName: string | null };
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface RealtorMessage {
  id: string;
  senderType: 'realtor' | 'contact';
  text: string;
  createdAt: string;
  read: boolean;
  contactMasked?: boolean;
  attachments?: { id: string; name: string; mimeType: string; url: string }[];
}

export interface RealtorDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  createdAt: string;
  sizeBytes: number;
  client?: { legalName: string | null } | null;
  listing?: { listingTitle: string | null } | null;
}

export interface RealtorReview {
  id: string;
  author: string | null;
  rating: number;
  date: string;
  comment?: string;
  category?: string;
}

export interface RealtorReviewsSummary {
  averageRating: number;
  reviewCount: number;
  distribution: Record<number, number>;
}

export interface RealtorNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface RealtorNotificationPreference {
  /** Category: offers, messages, clients, payments or reviews. */
  id: string;
  email: boolean;
  push: boolean;
}

export interface RealtorProfile {
  fullName: string;
  email: string;
  phone: string;
  companyName?: string | null;
  avatarUrl?: string | null;
}

/* ----------------------------------- api ---------------------------------- */

function q(params: Record<string, string | number | boolean | undefined | null>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    s.set(k, String(v));
  }
  const out = s.toString();
  return out ? `?${out}` : '';
}

export const realtorApi = {
  dashboard: () => apiFetch<RealtorDashboard>('/realtor/dashboard'),
  activity: () => apiFetch<RealtorActivity[]>('/realtor/dashboard/activity'),

  clients: (opts: { status?: RelationshipStatus; search?: string; page?: number } = {}) =>
    apiFetch<Paginated<RealtorClient>>(
      `/realtor/clients${q({ page: opts.page ?? 1, pageSize: 100, status: opts.status, search: opts.search })}`
    ),
  checkClient: (email: string) =>
    apiFetch<ClientEligibility>('/realtor/clients/check', { method: 'POST', body: { email } }),
  inviteClient: (email: string) =>
    apiFetch<RealtorClient>('/realtor/clients', { method: 'POST', body: { email } }),
  assignedProperties: (relationshipId: string) =>
    apiFetch<Paginated<AssignedProperty>>(
      `/realtor/clients/${relationshipId}/assigned-properties${q({ page: 1, pageSize: 100 })}`
    ),

  listings: (status?: RealtorListingStatus) =>
    apiFetch<Paginated<RealtorListing>>(
      `/realtor/listings${q({ page: 1, pageSize: 100, status })}`
    ),
  createListing: (body: {
    propertyId: string;
    listingTitle: string;
    listingType: 'RENT' | 'SALE';
    price: number;
    availableFrom?: string;
  }) => apiFetch<RealtorListing>('/realtor/listings', { method: 'POST', body }),

  leads: (opts: { status?: LeadStatus; search?: string; page?: number } = {}) =>
    apiFetch<Paginated<RealtorLead>>(
      `/realtor/leads${q({ page: opts.page ?? 1, pageSize: 30, status: opts.status, search: opts.search })}`
    ),
  lead: (id: string) => apiFetch<RealtorLead>(`/realtor/leads/${id}`),
  createLead: (body: {
    fullName: string;
    email?: string;
    phone?: string;
    listingId?: string;
    source?: string;
    notes?: string;
  }) => apiFetch<RealtorLead>('/realtor/leads', { method: 'POST', body }),
  updateLead: (id: string, status: LeadStatus) =>
    apiFetch<RealtorLead>(`/realtor/leads/${id}`, { method: 'PATCH', body: { status } }),

  viewings: (status?: ViewingStatus) =>
    apiFetch<Paginated<RealtorViewing>>(
      `/realtor/viewings${q({ page: 1, pageSize: 100, status })}`
    ),
  createViewing: (body: {
    listingId: string;
    leadId?: string;
    scheduledAt: string;
    notes?: string;
  }) => apiFetch<RealtorViewing>('/realtor/viewings', { method: 'POST', body }),
  updateViewing: (id: string, status: ViewingStatus) =>
    apiFetch<RealtorViewing>(`/realtor/viewings/${id}`, { method: 'PATCH', body: { status } }),

  offers: (status?: RealtorOfferStatus) =>
    apiFetch<Paginated<RealtorOffer>>(`/realtor/offers${q({ page: 1, pageSize: 100, status })}`),
  counter: (id: string, amount: number, message?: string) =>
    apiFetch<CounterOffer>(`/realtor/offers/${id}/counter`, {
      method: 'POST',
      body: { amount, ...(message ? { message } : {}) },
    }),

  commissions: (status?: 'AVAILABLE' | 'PAID' | 'VOID', page = 1) =>
    apiFetch<Paginated<Commission>>(`/realtor/commissions${q({ page, pageSize: 30, status })}`),
  commissionTrend: () => apiFetch<{ label: string; value: number }[]>('/realtor/commissions/trend'),
  payoutSummary: () => apiFetch<RealtorPayoutSummary>('/realtor/commissions/payouts/summary'),
  payoutAccount: () => apiFetchOrNull<RealtorPayoutAccount>('/realtor/commissions/payout-account'),
  // Behind "confirm it's you": apiFetch prompts for it automatically.
  savePayoutAccount: (bankCode: string, accountNumber: string) =>
    apiFetch<RealtorPayoutAccount>('/realtor/commissions/payout-account', {
      method: 'POST',
      body: { bankCode, accountNumber },
    }),
  payouts: (page = 1) =>
    apiFetch<Paginated<RealtorPayout>>(`/realtor/commissions/payouts${q({ page, pageSize: 30 })}`),
  payout: (id: string) => apiFetch<RealtorPayoutDetail>(`/realtor/commissions/payouts/${id}`),
  withdraw: () =>
    apiFetch<RealtorPayout>('/realtor/commissions/payouts/request', { method: 'POST' }),

  conversations: () =>
    apiFetch<Paginated<RealtorConversation>>(`/realtor/messages${q({ page: 1, pageSize: 100 })}`),
  startConversation: (clientId: string, propertyId?: string) =>
    apiFetch<{ id: string }>('/realtor/messages', {
      method: 'POST',
      body: { clientId, ...(propertyId ? { propertyId } : {}) },
    }),
  messages: (id: string) =>
    apiFetch<Paginated<RealtorMessage>>(`/realtor/messages/${id}${q({ page: 1, pageSize: 100 })}`),
  send: (id: string, text: string, files: PickedFile[] = []) => {
    const form = new FormData();
    if (text.trim()) form.append('text', text.trim());
    files.forEach((f) => appendFile(form, 'files', f));
    return apiUpload<RealtorMessage>(`/realtor/messages/${id}`, form);
  },

  documents: (category?: DocumentCategory) =>
    apiFetch<Paginated<RealtorDocument>>(
      `/realtor/documents${q({ page: 1, pageSize: 100, category })}`
    ),
  uploadDocument: (file: PickedFile, name: string, category: DocumentCategory) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    form.append('name', name);
    form.append('category', category);
    return apiUpload<RealtorDocument>('/realtor/documents', form);
  },
  downloadDocument: (id: string) =>
    apiFetch<{ name: string; url: string }>(`/realtor/documents/${id}/download`),

  reviews: () =>
    apiFetch<Paginated<RealtorReview>>(`/realtor/reviews${q({ page: 1, pageSize: 50 })}`),
  reviewsSummary: () => apiFetch<RealtorReviewsSummary>('/realtor/reviews/summary'),

  trustProfile: () => apiFetch<TrustProfile>('/realtor/trust-profile'),

  profile: () => apiFetch<RealtorProfile>('/realtor/settings/profile'),
  // `email` is required and must be the current one; changing it goes through verification.
  updateProfile: (body: {
    fullName: string;
    email: string;
    companyName?: string;
    phone?: string;
  }) => apiFetch<RealtorProfile>('/realtor/settings/profile', { method: 'PUT', body }),

  uploadAvatar: (file: PickedFile) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    return apiUpload<RealtorProfile>('/realtor/settings/profile/avatar', form);
  },

  notificationPreferences: () =>
    apiFetch<RealtorNotificationPreference[]>('/realtor/settings/notifications'),
  updateNotificationPreferences: (preferences: RealtorNotificationPreference[]) =>
    apiFetch<RealtorNotificationPreference[]>('/realtor/settings/notifications', {
      method: 'PUT',
      body: { preferences },
    }),

  notifications: () =>
    apiFetch<Paginated<RealtorNotification>>(
      `/realtor/notifications${q({ page: 1, pageSize: 50 })}`
    ),
  readNotification: (id: string) =>
    apiFetch<void>(`/realtor/notifications/${id}/read`, { method: 'PATCH' }),
  readAllNotifications: () => apiFetch<void>('/realtor/notifications/read-all', { method: 'POST' }),
};

/* --------------------------------- helpers -------------------------------- */

export const clientName = (c: RealtorClient) => c.client.legalName || c.client.email;
export const clientRole = (c: RealtorClient) =>
  c.client.roles.some((r) => r.role === 'LANDLORD') ? 'Landlord' : 'Property owner';

export const listingTitle = (l: RealtorListing) => l.listingTitle || l.property.title;

export type Tone = 'success' | 'warning' | 'info' | 'neutral' | 'danger';

export const LISTING_STATUS: Record<RealtorListingStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Draft · owner to publish', tone: 'neutral' },
  PENDING_VERIFICATION: { label: 'In review', tone: 'warning' },
  PUBLISHED: { label: 'Live', tone: 'success' },
  PAUSED: { label: 'Paused', tone: 'neutral' },
  CLOSED: { label: 'Closed', tone: 'neutral' },
};

/** The lead pipeline, in order. Won and lost both end it. */
export const LEAD_STAGES: { value: LeadStatus; label: string; tone: Tone }[] = [
  { value: 'NEW', label: 'New', tone: 'info' },
  { value: 'CONTACTED', label: 'Contacted', tone: 'info' },
  { value: 'QUALIFIED', label: 'Qualified', tone: 'warning' },
  { value: 'CLOSED', label: 'Won', tone: 'success' },
  { value: 'LOST', label: 'Lost', tone: 'neutral' },
];
export const leadStage = (s: LeadStatus) => LEAD_STAGES.find((x) => x.value === s)!;
export const isLeadOpen = (s: LeadStatus) => s !== 'CLOSED' && s !== 'LOST';

/** The single most useful move for a lead at this stage. */
export function leadNextStep(s: LeadStatus): { to: LeadStatus; label: string } | null {
  switch (s) {
    case 'NEW':
      return { to: 'CONTACTED', label: 'Mark as contacted' };
    case 'CONTACTED':
      return { to: 'QUALIFIED', label: 'Mark as qualified' };
    case 'QUALIFIED':
      return { to: 'CLOSED', label: 'Mark as won' };
    default:
      return null;
  }
}

export const VIEWING_STATUS: Record<ViewingStatus, { label: string; tone: Tone }> = {
  REQUESTED: { label: 'To confirm', tone: 'warning' },
  CONFIRMED: { label: 'Confirmed', tone: 'success' },
  COMPLETED: { label: 'Done', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};

/** Viewings split the way a realtor plans a day: today, coming up, and done. */
export function viewingBuckets(viewings: RealtorViewing[], now: Date = new Date()) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTomorrow = startOfToday + 24 * 60 * 60 * 1000;
  const today: RealtorViewing[] = [];
  const upcoming: RealtorViewing[] = [];
  const past: RealtorViewing[] = [];
  for (const v of viewings) {
    const t = new Date(v.scheduledAt).getTime();
    const live = v.status === 'REQUESTED' || v.status === 'CONFIRMED';
    if (!live || t < startOfToday) past.push(v);
    else if (t < startOfTomorrow) today.push(v);
    else upcoming.push(v);
  }
  const asc = (a: RealtorViewing, b: RealtorViewing) => a.scheduledAt.localeCompare(b.scheduledAt);
  return {
    today: today.sort(asc),
    upcoming: upcoming.sort(asc),
    past: past.sort((a, b) => -asc(a, b)),
  };
}

export const OFFER_STATUS: Record<RealtorOfferStatus, { label: string; tone: Tone }> = {
  SUBMITTED: { label: 'New offer', tone: 'warning' },
  COUNTERED: { label: 'Countered', tone: 'info' },
  ACCEPTED: { label: 'Accepted', tone: 'success' },
  REJECTED: { label: 'Declined', tone: 'neutral' },
  CLOSED: { label: 'Closed', tone: 'neutral' },
};
export const canCounter = (s: RealtorOfferStatus) => s === 'SUBMITTED' || s === 'COUNTERED';

export interface OfferStep {
  id: string;
  who: 'buyer' | 'you';
  amount: number;
  message?: string | null;
  at: string;
}

/** The negotiation in order: the buyer's offer, then every counter from either side. */
export function offerThread(o: RealtorOffer): OfferStep[] {
  return [
    { id: o.id, who: 'buyer' as const, amount: o.amount, message: o.message, at: o.createdAt },
    ...[...(o.counterOffers ?? [])]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((c) => ({
        id: c.id,
        who: c.fromUserId === o.buyer.id ? ('buyer' as const) : ('you' as const),
        amount: c.amount,
        message: c.message,
        at: c.createdAt,
      })),
  ];
}

/** The amount currently on the table: the latest step of the thread. */
export const currentAmount = (o: RealtorOffer) => offerThread(o).at(-1)!.amount;

/** How far an amount sits from the asking price, e.g. "8% under asking". */
export function vsAsking(amount: number, asking?: number): string | null {
  if (!asking) return null;
  const pct = Math.round(((amount - asking) / asking) * 100);
  if (pct === 0) return 'At asking';
  return `${Math.abs(pct)}% ${pct < 0 ? 'under' : 'over'} asking`;
}

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: 'agency_agreement', label: 'Agency agreement' },
  { value: 'listing_contract', label: 'Listing contract' },
  { value: 'closing_document', label: 'Closing document' },
  { value: 'license', label: 'Licence' },
  { value: 'other', label: 'Other' },
];
export const documentCategoryLabel = (c: string) =>
  DOCUMENT_CATEGORIES.find((x) => x.value === c.toLowerCase())?.label ?? 'Other';

export function sizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * A WhatsApp link for a Nigerian number as people type it (0803…, +234 803…,
 * 234803…). Null when it isn't a usable mobile number.
 */
export function whatsappLink(phone?: string | null): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  const intl = digits.startsWith('234')
    ? digits
    : digits.startsWith('0') && digits.length === 11
      ? `234${digits.slice(1)}`
      : null;
  return intl && intl.length === 13 ? `https://wa.me/${intl}` : null;
}

/** A local date (yyyy-MM-dd) and time (HH:mm) as the instant the realtor means. */
export function localInstant(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const d = new Date(`${date}T${time}:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
