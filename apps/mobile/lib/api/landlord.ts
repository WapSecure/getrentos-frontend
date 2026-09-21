import { apiFetch } from './client';
import type { Paginated } from './properties';

/* ------------------------------ dashboard ------------------------------ */

export interface LandlordDashboardStats {
  totalProperties: number;
  occupiedUnits: number;
  reservedUnits: number;
  vacantUnits: number;
  annualRentRoll: number;
  outstandingPayments: number;
  outstandingAmount: number;
  activeMaintenanceRequests: number;
}

export type LandlordActivityType =
  | 'payment'
  | 'application'
  | 'maintenance'
  | 'lease'
  | 'message'
  | 'viewing';

export interface LandlordActivity {
  id: string;
  type: LandlordActivityType;
  title: string;
  description: string;
  timestamp: string;
}

/** One bar in the revenue trend — `label` is a short month name. */
export interface RevenuePoint {
  label: string;
  value: number;
}

/* ------------------------------ properties ----------------------------- */

export type VerificationStatus = 'verified' | 'pending' | 'unverified' | 'rejected';

export interface LandlordProperty {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  country: string;
  description?: string;
  coverImage?: string;
  galleryImages?: string[];
  verificationStatus: VerificationStatus;
  totalUnits: number;
  occupiedUnits: number;
  annualRentRoll: number;
  createdAt: string;
  archived: boolean;
}

/* -------------------------------- tenants ------------------------------ */

export type RentStatus = 'paid' | 'due' | 'overdue' | 'partial';

export interface LandlordTenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  propertyName: string;
  unitId?: string;
  unitName?: string;
  leaseId?: string;
  moveInDate: string;
  trustScore: number;
  verified: boolean;
  rentStatus: RentStatus;
}

export const RENT_STATUS_LABEL: Record<RentStatus, string> = {
  paid: 'Paid',
  due: 'Due',
  overdue: 'Overdue',
  partial: 'Part paid',
};

export const RENT_STATUS_TONE: Record<RentStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  paid: 'success',
  due: 'warning',
  overdue: 'danger',
  partial: 'info',
};

export const VERIFICATION_TONE: Record<
  VerificationStatus,
  'success' | 'warning' | 'danger' | 'neutral'
> = {
  verified: 'success',
  pending: 'warning',
  unverified: 'neutral',
  rejected: 'danger',
};

/* --------------------------------- units ------------------------------- */

export type OccupancyStatus = 'occupied' | 'vacant' | 'reserved';

export interface LandlordUnit {
  id: string;
  propertyId: string;
  propertyName: string;
  unitName: string;
  bedrooms: number;
  bathrooms: number;
  askingRent: number;
  askingRentPeriod: 'year' | 'month';
  occupancyStatus: OccupancyStatus;
}

export const OCCUPANCY_LABEL: Record<OccupancyStatus, string> = {
  occupied: 'Occupied',
  vacant: 'Vacant',
  reserved: 'Reserved',
};

export const OCCUPANCY_TONE: Record<OccupancyStatus, 'success' | 'warning' | 'neutral'> = {
  occupied: 'success',
  vacant: 'neutral',
  reserved: 'warning',
};

/* ----------------------------- applications ---------------------------- */

export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';

export interface LandlordApplication {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  propertyId: string;
  propertyName: string;
  unitId?: string;
  unitName?: string;
  monthlyIncome: number;
  employmentStatus: string;
  verificationStatus: string;
  trustScore: number;
  applicationDate: string;
  status: ApplicationStatus;
  documents: { id: string; name: string; url?: string }[];
  references: { name: string; relationship?: string; phone?: string }[];
}

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: 'Pending',
  under_review: 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const APPLICATION_STATUS_TONE: Record<
  ApplicationStatus,
  'success' | 'warning' | 'danger' | 'info' | 'neutral'
> = {
  pending: 'warning',
  under_review: 'info',
  approved: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
};

/* -------------------------------- leases ------------------------------- */

export type LeaseStatus = 'draft' | 'sent' | 'signed' | 'active' | 'expired' | 'terminated';

export interface LandlordLease {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  unitId?: string;
  unitName?: string;
  /** `yyyy-MM-dd` */
  leaseStart: string;
  leaseEnd: string;
  rentAmount: number;
  securityDeposit: number;
  status: LeaseStatus;
  tenantSigned: boolean;
  landlordSigned: boolean;
  createdAt: string;
}

export const LEASE_STATUS_TONE: Record<
  LeaseStatus,
  'success' | 'warning' | 'danger' | 'info' | 'neutral'
> = {
  draft: 'neutral',
  sent: 'info',
  signed: 'success',
  active: 'success',
  expired: 'warning',
  terminated: 'danger',
};

/* ----------------------------- maintenance ----------------------------- */

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus =
  | 'pending'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'cancelled';

export interface LandlordMaintenance {
  id: string;
  issueTitle: string;
  category: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  unitName?: string;
  vendorId?: string;
  vendorName?: string;
  createdAt: string;
  updatedAt: string;
}

export const MAINTENANCE_STATUS_LABEL: Record<MaintenanceStatus, string> = {
  pending: 'Pending',
  acknowledged: 'Acknowledged',
  in_progress: 'In progress',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
};

export const MAINTENANCE_STATUS_TONE: Record<
  MaintenanceStatus,
  'success' | 'warning' | 'danger' | 'info' | 'neutral'
> = {
  pending: 'warning',
  acknowledged: 'info',
  in_progress: 'info',
  resolved: 'success',
  cancelled: 'neutral',
};

export const PRIORITY_TONE: Record<MaintenancePriority, 'danger' | 'warning' | 'info' | 'neutral'> =
  {
    urgent: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'neutral',
  };

/* ------------------------------- payments ------------------------------ */

export type LandlordPaymentStatus = 'paid' | 'pending' | 'overdue' | 'processing' | 'failed';

export interface LandlordPayment {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  unitId?: string;
  unitName?: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: LandlordPaymentStatus;
  escrowStatus?: string;
  releaseDate?: string;
  /** Present once the tenant has disputed this payment. */
  disputeReason?: string;
}

export interface LandlordPaymentStats {
  totalCollected: number;
  outstandingBalance: number;
  escrowPending: number;
  upcomingPayments: number;
}

export interface ArrearsSummary {
  totalOverdue: number;
  overdueCount: number;
}

export const LANDLORD_PAYMENT_TONE: Record<
  LandlordPaymentStatus,
  'success' | 'warning' | 'danger' | 'info'
> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  processing: 'info',
  failed: 'danger',
};

/* ------------------------------ financials ----------------------------- */

export interface FinancialsStats {
  rentalIncome: number;
  outstandingRent: number;
  maintenanceCosts: number;
  netProfit: number;
}

/** One month of the income-vs-expenses chart. Both figures are Naira. */
export interface FinancialsPoint {
  period: string;
  income: number;
  expenses: number;
}

/* ------------------------------- expenses ------------------------------ */

export const EXPENSE_CATEGORIES = [
  'UTILITIES',
  'INSURANCE',
  'TAX',
  'REPAIRS',
  'MANAGEMENT_FEE',
  'OTHER',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  UTILITIES: 'Utilities',
  INSURANCE: 'Insurance',
  TAX: 'Tax',
  REPAIRS: 'Repairs',
  MANAGEMENT_FEE: 'Management fee',
  OTHER: 'Other',
};

export interface LandlordExpense {
  id: string;
  propertyId: string;
  propertyTitle: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  /** `yyyy-MM-dd` */
  incurredAt: string;
  note: string | null;
  maintenanceRequestId: string | null;
  createdAt: string;
}

export interface CreateExpenseInput {
  propertyId: string;
  category: ExpenseCategory;
  amount: number;
  incurredAt: string;
  note?: string;
}

/* --------------------------- owner statements -------------------------- */

export type OwnerStatementStatus = 'draft' | 'issued' | 'paid';
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface OwnerStatementLineItem {
  id: string;
  label: string;
  amount: number;
}

export interface OwnerStatement {
  id: string;
  periodStart: string;
  periodEnd: string;
  grossIncome: number;
  totalExpenses: number;
  managementFee: number;
  netPayout: number;
  status: OwnerStatementStatus;
  payoutStatus: PayoutStatus;
  transferRef?: string;
  paidAt: string | null;
  generatedAt: string;
  issuedAt: string | null;
  lineItems?: OwnerStatementLineItem[];
}

export const PAYOUT_TONE: Record<PayoutStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  paid: 'success',
  pending: 'warning',
  processing: 'info',
  failed: 'danger',
};

/* ------------------------------- listings ------------------------------ */

export type ListingStatus = 'draft' | 'published' | 'paused' | 'archived';

export interface LandlordListing {
  id: string;
  unitId: string;
  propertyId: string;
  propertyName: string;
  unitName: string;
  listingTitle: string;
  askingRent: number;
  rentPeriod: 'month' | 'year';
  allowsMonthlyPayment: boolean;
  amenities: string[];
  availabilityDate: string;
  allowPets: boolean;
  furnished: boolean;
  shortLetEnabled: boolean;
  status: ListingStatus;
  createdAt: string;
  coverImage?: string;
  galleryImages?: string[];
  videoTourUrl?: string;
}

export const LISTING_STATUS_TONE: Record<
  ListingStatus,
  'success' | 'warning' | 'neutral' | 'info'
> = {
  published: 'success',
  paused: 'warning',
  draft: 'info',
  archived: 'neutral',
};

/* --------------------------------- leads ------------------------------- */

export type LeadStage = 'inquiry' | 'viewing' | 'application' | 'lease' | 'lost';

export interface LandlordLead {
  id: string;
  leadName: string;
  email: string;
  phone: string;
  leadUserId?: string;
  propertyId: string;
  propertyName: string;
  inquiryDate: string;
  trustScore: number;
  verified: boolean;
  stage: LeadStage;
  lastActivityAt: string;
  daysSinceActivity: number;
  /** The API's own judgement that this lead has gone cold. */
  stale: boolean;
}

export const LEAD_STAGE_LABEL: Record<LeadStage, string> = {
  inquiry: 'Inquiry',
  viewing: 'Viewing',
  application: 'Application',
  lease: 'Lease',
  lost: 'Lost',
};

export const LEAD_STAGE_TONE: Record<LeadStage, 'info' | 'warning' | 'success' | 'neutral'> = {
  inquiry: 'info',
  viewing: 'warning',
  application: 'warning',
  lease: 'success',
  lost: 'neutral',
};

/* ------------------------------- microsite ----------------------------- */

export interface MicrositeSettings {
  slug: string;
  bio?: string;
  bannerUrl?: string;
  enabled: boolean;
}

/* ------------------------------ evictions ------------------------------ */

export type EvictionStatus = 'draft' | 'issued' | 'filed' | 'resolved' | 'withdrawn';

export interface EvictionCase {
  id: string;
  leaseId: string;
  propertyId: string;
  propertyName: string;
  unitName: string;
  tenantName: string;
  reason: string;
  status: string;
  noticeIssuedAt?: string;
  cureDeadline?: string;
  filedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export const EVICTION_TONE: Record<EvictionStatus, 'neutral' | 'warning' | 'danger' | 'success'> = {
  draft: 'neutral',
  issued: 'warning',
  filed: 'danger',
  resolved: 'success',
  withdrawn: 'neutral',
};

/* ------------------------------- reviews ------------------------------- */

export interface LandlordReviewSummary {
  averageRating: number;
  reviewCount: number;
  averageCommunication: number;
  averagePropertyCondition: number;
  averageResponsiveness: number;
}

export interface LandlordReview {
  id: string;
  tenantName: string;
  propertyName: string;
  rating: number;
  communication: number;
  propertyCondition: number;
  responsiveness: number;
  comment: string;
  createdAt: string;
}

/* ------------------------------ documents ------------------------------ */

export const DOCUMENT_CATEGORIES = [
  'lease_agreements',
  'ownership_docs',
  'escrow_contracts',
  'inspection_reports',
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CATEGORY_LABEL: Record<DocumentCategory, string> = {
  lease_agreements: 'Lease agreements',
  ownership_docs: 'Ownership docs',
  escrow_contracts: 'Escrow contracts',
  inspection_reports: 'Inspection reports',
};

export interface LandlordDocument {
  id: string;
  name: string;
  category: string;
  propertyName: string;
  uploadedAt: string;
  sizeLabel: string;
}

/* ------------------------------- messages ------------------------------ */

export interface LandlordConversation {
  id: string;
  participantName: string;
  participantRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export const landlordApi = {
  dashboardStats: () => apiFetch<LandlordDashboardStats>('/landlord/dashboard/stats'),

  activity: () => apiFetch<LandlordActivity[]>('/landlord/dashboard/activity'),

  revenueTrend: () => apiFetch<RevenuePoint[]>('/landlord/dashboard/revenue-trend'),

  properties: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<LandlordProperty>>(`/landlord/properties?page=${page}&pageSize=${pageSize}`),

  units: (propertyId: string) =>
    apiFetch<Paginated<LandlordUnit>>(`/landlord/units?propertyId=${propertyId}`),

  tenants: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<LandlordTenant>>(`/landlord/tenants?page=${page}&pageSize=${pageSize}`),

  applications: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<LandlordApplication>>(
      `/landlord/applications?page=${page}&pageSize=${pageSize}`
    ),

  setApplicationStatus: (id: string, status: ApplicationStatus, reason?: string) =>
    apiFetch<LandlordApplication>(`/landlord/applications/${id}/status`, {
      method: 'PATCH',
      body: { status, reason },
    }),

  leases: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<LandlordLease>>(`/landlord/leases?page=${page}&pageSize=${pageSize}`),

  maintenance: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<LandlordMaintenance>>(
      `/landlord/maintenance?page=${page}&pageSize=${pageSize}`
    ),

  maintenanceSummary: () => apiFetch<{ openCount: number }>('/landlord/maintenance/summary'),

  resolveMaintenance: (id: string, note?: string) =>
    apiFetch<LandlordMaintenance>(`/landlord/maintenance/${id}/resolve`, {
      method: 'PATCH',
      body: { note },
    }),

  escalateMaintenance: (id: string, reason?: string) =>
    apiFetch<LandlordMaintenance>(`/landlord/maintenance/${id}/escalate`, {
      method: 'PATCH',
      body: { reason },
    }),

  assignVendor: (id: string, vendorId: string) =>
    apiFetch<LandlordMaintenance>(`/landlord/maintenance/${id}/assign-vendor`, {
      method: 'PATCH',
      body: { vendorId },
    }),

  payments: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<LandlordPayment>>(`/landlord/payments?page=${page}&pageSize=${pageSize}`),

  paymentStats: () => apiFetch<LandlordPaymentStats>('/landlord/payments/stats'),

  arrearsSummary: () => apiFetch<ArrearsSummary>('/landlord/payments/arrears-summary'),

  financialsStats: () => apiFetch<FinancialsStats>('/landlord/financials/stats'),

  financialsChart: () => apiFetch<FinancialsPoint[]>('/landlord/financials/chart'),

  expenses: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<LandlordExpense>>(`/landlord/expenses?page=${page}&pageSize=${pageSize}`),

  createExpense: (input: CreateExpenseInput) =>
    apiFetch<LandlordExpense>('/landlord/expenses', { method: 'POST', body: input }),

  deleteExpense: (id: string) => apiFetch<void>(`/landlord/expenses/${id}`, { method: 'DELETE' }),

  ownerStatements: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<OwnerStatement>>(
      `/landlord/owner-statements?page=${page}&pageSize=${pageSize}`
    ),

  ownerStatement: (id: string) => apiFetch<OwnerStatement>(`/landlord/owner-statements/${id}`),

  issueOwnerStatement: (id: string) =>
    apiFetch<OwnerStatement>(`/landlord/owner-statements/${id}/issue`, { method: 'POST' }),

  retryPayout: (id: string) =>
    apiFetch<OwnerStatement>(`/landlord/owner-statements/${id}/retry-payout`, { method: 'POST' }),

  /** Returns a bare array, not a paginated envelope. */
  listings: () => apiFetch<LandlordListing[]>('/landlord/listings'),

  toggleListingPause: (id: string) =>
    apiFetch<LandlordListing>(`/landlord/listings/${id}/toggle-pause`, { method: 'PATCH' }),

  leads: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<LandlordLead>>(`/landlord/leads?page=${page}&pageSize=${pageSize}`),

  nudgeLead: (leadId: string) =>
    apiFetch<{ nudged: boolean }>(`/landlord/leads/${leadId}/nudge`, { method: 'POST' }),

  bulkNudgeLeads: () =>
    apiFetch<{ nudged: number }>('/landlord/leads/bulk-nudge', { method: 'POST' }),

  microsite: () => apiFetch<MicrositeSettings>('/landlord/microsite'),

  updateMicrosite: (patch: { slug?: string; bio?: string; enabled?: boolean }) =>
    apiFetch<MicrositeSettings>('/landlord/microsite', { method: 'PATCH', body: patch }),

  evictions: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<EvictionCase>>(`/landlord/evictions?page=${page}&pageSize=${pageSize}`),

  issueEvictionNotice: (id: string, cureDays?: number) =>
    apiFetch<EvictionCase>(`/landlord/evictions/${id}/issue-notice`, {
      method: 'PATCH',
      body: { cureDays },
    }),

  fileEviction: (id: string) =>
    apiFetch<EvictionCase>(`/landlord/evictions/${id}/file`, { method: 'PATCH' }),

  resolveEviction: (id: string, resolutionNotes?: string) =>
    apiFetch<EvictionCase>(`/landlord/evictions/${id}/resolve`, {
      method: 'PATCH',
      body: { resolutionNotes },
    }),

  withdrawEviction: (id: string) =>
    apiFetch<EvictionCase>(`/landlord/evictions/${id}/withdraw`, { method: 'PATCH' }),

  reviewsSummary: () => apiFetch<LandlordReviewSummary>('/landlord/reviews/summary'),

  reviews: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<LandlordReview>>(`/landlord/reviews?page=${page}&pageSize=${pageSize}`),

  documents: (page = 1, pageSize = 20, search?: string, category?: DocumentCategory) =>
    apiFetch<Paginated<LandlordDocument>>(
      `/landlord/documents?page=${page}&pageSize=${pageSize}` +
        (search ? `&search=${encodeURIComponent(search)}` : '') +
        (category ? `&category=${category}` : '')
    ),

  documentDownloadUrl: (id: string) =>
    apiFetch<{ url: string; name: string }>(`/landlord/documents/${id}/download`),

  conversations: (page = 1, pageSize = 30) =>
    apiFetch<Paginated<LandlordConversation>>(
      `/landlord/messages/conversations?page=${page}&pageSize=${pageSize}`
    ),

  markConversationRead: (id: string) =>
    apiFetch<void>(`/landlord/messages/conversations/${id}/read`, { method: 'PATCH' }),
};
