import { authDownload, authFetch, safeCall, toQuery, type Paginated } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type {
  Property,
  Unit,
  Listing,
  RentalApplication,
  ApplicationStatus,
  Lease,
  Tenant,
  RentPayment,
  Vendor,
  LandlordMaintenanceRequest,
  RentIncreaseCheck,
  TenancyStanding,
  LandlordLead,
  LandlordViewingRequest,
  LandlordOffer,
  LandlordOfferMessage,
  LeadNudgeResult,
  BulkNudgeResult,
  LandlordMicrositeSettings,
  PropertyUpdatePayload,
  PortfolioAnalytics,
  VendorDetail,
  VendorInput,
  ScreeningReport,
  ScreeningReference,
  ReferenceOutcome,
} from '@/types/landlord';
import type {
  EnforcementMethod,
  HearingOutcome,
  LegalCase,
  LegalCaseKind,
  LegalCaseOutcome,
  LegalCaseStatus,
} from '@/types/legal-case';
import type {
  LeaseLadder,
  NoticeKind,
  NoticePeriodEntry,
  NoticePeriodSettings,
  NoticeServiceMethod,
  NoticeState,
  TenancyNotice,
} from '@/types/tenancy-notice';
import type { Conversation } from '@/components/landlord/messages/ConversationList';
import type { ThreadMessage } from '@/components/landlord/messages/MessageThread';

export interface RentCollectionStats {
  totalCollected: number;
  outstandingBalance: number;
  escrowPending: number;
  upcomingPayments: number;
}

export interface LandlordArrearsSummary {
  totalOverdue: number;
  overdueCount: number;
}

export interface FinancialStats {
  rentalIncome: number;
  outstandingRent: number;
  maintenanceCosts: number;
  netProfit: number;
}

export interface FinancialChartPoint {
  period: string;
  income: number;
  expenses: number;
}

export type ChargeCategory = 'RENT' | 'SERVICE_CHARGE' | 'DEPOSIT' | 'LEVY';

export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

export interface BulkChargeResult {
  created: number;
  skipped: { unitId: string; reason: string }[];
}

export type ExpenseCategory =
  | 'UTILITIES'
  | 'INSURANCE'
  | 'TAX'
  | 'REPAIRS'
  | 'MANAGEMENT_FEE'
  | 'LEGAL'
  | 'OTHER';

export interface Expense {
  id: string;
  propertyId: string;
  propertyTitle: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  incurredAt: string;
  note: string | null;
  createdAt: string;
}

export type ManagementFeeType = 'PERCENTAGE' | 'FLAT';

export interface ManagementFeeConfig {
  id: string;
  propertyId: string;
  type: ManagementFeeType;
  value: number;
}

export type OwnerStatementStatus = 'DRAFT' | 'ISSUED';
/**
 * Where a payout has got to.
 *
 * `AWAITING_APPROVAL` and `REJECTED` are not failure states and must not be
 * rendered as one. Above the platform threshold the money is held on purpose for
 * a second person, and a refusal holds it further rather than losing it — the
 * owner is still owed the money either way.
 */
export type OwnerStatementPayoutStatus =
  | 'PENDING'
  | 'AWAITING_APPROVAL'
  | 'PAID'
  | 'FAILED'
  | 'REJECTED';

/** Why a payout is not on its way, when a second person is holding it. */
export interface StatementRelease {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  decidedAt: string | null;
  /** What the approver said. The reason a refusal is not an unexplained silence. */
  decisionNote: string | null;
  /** The threshold in force when it was raised, so the gate explains itself. */
  thresholdAtRequest: number;
}

export interface OwnerStatementLineItem {
  id: string;
  label: string;
  amount: number; /**
   * Where the line came from. The statement is a view of the ledger, so a line
   * cites the movement it renders and the document behind it. Null on a line
   * written before the ledger became the source of truth.
   */
  ledgerEntryId?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  sourceDetail?: string | null;
  propertyId?: string | null;
}

/**
 * An owner saying one line of an issued statement is wrong.
 *
 * `moneyEffect` is the field that matters and the reason this is not a boolean:
 * `HELD` means the payout can still be stopped, `IN_FLIGHT` and `PAID` mean it
 * cannot. Telling an owner their money is held while a transfer is with the bank
 * is how one problem becomes two.
 */
export interface StatementLineDispute {
  id: string;
  statementId: string;
  lineId: string;
  lineLabel: string;
  lineAmount: number;
  reason: string;
  status: StatementLineDisputeStatus;
  raisedById: string;
  raisedByName: string | null;
  raisedByMe: boolean;
  firmResponse: string | null;
  firmRespondedByName: string | null;
  firmRespondedAt: string | null;
  resolvedByName: string | null;
  resolvedAt: string | null;
  /** What the owner is told, and the whole reason the field is required. */
  outcomeNote: string | null;
  adjustmentEntryId: string | null;
  createdAt: string;
  moneyEffect: 'HELD' | 'IN_FLIGHT' | 'PAID' | 'NONE';
}

export type StatementLineDisputeStatus = 'OPEN' | 'UPHELD' | 'REJECTED' | 'WITHDRAWN';

/** What disputes are doing to one statement's payout, when there are any. */
export interface StatementDisputeSummary {
  openCount: number;
  totalCount: number;
  moneyEffect: 'HELD' | 'IN_FLIGHT' | 'PAID' | 'NONE';
  /** The oldest undecided complaint, which is the one to read first. */
  reason: string | null;
}

export interface OwnerStatement {
  id: string;
  periodStart: string;
  periodEnd: string;
  grossIncome: number;
  totalExpenses: number;
  managementFee: number;
  /** Charged on top of the fee and held for the tax authority, not earned. */
  vatAmount: number;
  /** Charged apart from the expense it applies to, so expenses still add up. */
  maintenanceMarkup: number;
  /** Withheld from the manager. Disclosed to the owner, never deducted from the payout. */
  whtAmount: number;
  netPayout: number;
  status: OwnerStatementStatus;
  payoutStatus: OwnerStatementPayoutStatus;
  transferRef?: string;
  /** The most recent ask to release this payout. Detail response only. */
  release?: StatementRelease | null;
  /** Disputes against lines of this statement, newest first. Detail only. */
  disputes?: StatementLineDispute[];
  disputeSummary?: StatementDisputeSummary | null;
  paidAt: string | null;
  generatedAt: string;
  issuedAt: string | null;
  /** When the owner was last emailed this statement, or null if not yet sent. */
  emailSentAt: string | null;
  /** The last email failure, when the most recent send did not land. */
  emailError: string | null;
  lineItems?: OwnerStatementLineItem[];
}

export interface LandlordDocument {
  id: string;
  name: string;
  category: string;
  propertyName: string;
  uploadedAt: string;
  sizeLabel: string;
}

export interface TenantReview {
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

export interface LandlordReviewSummary {
  averageRating: number;
  reviewCount: number;
  averageCommunication: number;
  averagePropertyCondition: number;
  averageResponsiveness: number;
}

export interface LandlordMaintenanceSummary {
  openCount: number;
}

export interface LandlordNotificationPreference {
  id: 'payments' | 'applications' | 'maintenance' | 'messages' | 'reviews';
  email: boolean;
  push: boolean;
}

export interface LandlordProfile {
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  avatarUrl?: string;
}

export interface LandlordPayoutAccount {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  verified: boolean;
}

export interface LandlordAutomationSettings {
  rentReminders: boolean;
  overdueAlerts: boolean;
  autoInvoices: boolean;
  leaseExpiry: boolean;
  /** Days rent may run past its due date before it is flagged overdue. */
  graceDays: number;
}

export interface LandlordDashboardStats {
  totalProperties: number;
  /** Units with an executed tenancy. */
  occupiedUnits: number;
  /** Units off the market but not yet let: awaiting signature or payment. */
  reservedUnits: number;
  vacantUnits: number;
  /** Contracted rent per year across let units, normalised to a year. */
  annualRentRoll: number;
  outstandingPayments: number;
  outstandingAmount: number;
  activeMaintenanceRequests: number;
}

export const landlordService = {
  // ---- Dashboard ----
  async getDashboardStats(): Promise<ApiResponse<LandlordDashboardStats>> {
    return safeCall(() => authFetch('/landlord/dashboard/stats'));
  },

  async getDashboardActivity(): Promise<
    ApiResponse<
      { id: string; type: string; title: string; description: string; timestamp: string }[]
    >
  > {
    return safeCall(() => authFetch('/landlord/dashboard/activity'));
  },

  async getRevenueTrend(): Promise<ApiResponse<{ label: string; value: number }[]>> {
    return safeCall(() => authFetch('/landlord/dashboard/revenue-trend'));
  },

  // ---- Notifications feed ----
  async getNotifications(): Promise<
    ApiResponse<
      { id: string; type: string; title: string; body: string; read: boolean; createdAt: string }[]
    >
  > {
    return safeCall(() => authFetch('/landlord/notifications'));
  },

  async markNotificationRead(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return safeCall(() => authFetch(`/landlord/notifications/${id}/read`, { method: 'PATCH' }));
  },

  async markAllNotificationsRead(): Promise<ApiResponse<{ success: boolean }>> {
    return safeCall(() => authFetch('/landlord/notifications/read-all', { method: 'POST' }));
  },

  // ---- Properties ----
  async listProperties(
    params: {
      search?: string;
      verificationStatus?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<ApiResponse<Paginated<Property>>> {
    return safeCall(() => authFetch<Paginated<Property>>(`/landlord/properties${toQuery(params)}`));
  },

  async createProperty(
    data: Omit<
      Property,
      | 'id'
      | 'occupiedUnits'
      | 'annualRentRoll'
      | 'createdAt'
      | 'coverImage'
      | 'verificationStatus'
      | 'archived'
      | 'totalUnits'
    > & {
      totalUnits?: number;
      coverImageKey?: string;
      galleryImageKeys?: string[];
      videoTourKey?: string;
    }
  ): Promise<ApiResponse<Property>> {
    return safeCall(() =>
      authFetch('/landlord/properties', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async uploadPropertyMedia(
    kind: 'image' | 'video',
    file: File
  ): Promise<ApiResponse<{ key: string; kind: 'image' | 'video' }>> {
    const form = new FormData();
    form.append('kind', kind);
    form.append('file', file);
    return safeCall(() =>
      authFetch<{ key: string; kind: 'image' | 'video' }>('/landlord/properties/media/upload', {
        method: 'POST',
        body: form,
      })
    );
  },

  async removeUploadedPropertyMedia(key: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return safeCall(() =>
      authFetch<{ deleted: boolean }>('/landlord/properties/media/upload', {
        method: 'DELETE',
        body: JSON.stringify({ key }),
      })
    );
  },

  async updateProperty(id: string, updates: PropertyUpdatePayload): Promise<ApiResponse<Property>> {
    return safeCall(() =>
      authFetch(`/landlord/properties/${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
    );
  },

  async toggleArchiveProperty(id: string): Promise<ApiResponse<Property>> {
    return safeCall(() => authFetch(`/landlord/properties/${id}/archive`, { method: 'PATCH' }));
  },

  async deleteProperty(id: string): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch(`/landlord/properties/${id}`, { method: 'DELETE' }));
  },

  // ---- Units ----
  async listUnits(
    params: { search?: string; propertyId?: string; page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<Unit>>> {
    return safeCall(() => authFetch<Paginated<Unit>>(`/landlord/units${toQuery(params)}`));
  },

  async createUnit(
    data: Omit<Unit, 'id' | 'occupancyStatus' | 'tenantId' | 'tenantName' | 'propertyName'>
  ): Promise<ApiResponse<Unit>> {
    return safeCall(() =>
      authFetch('/landlord/units', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async markUnitVacant(id: string): Promise<ApiResponse<Unit>> {
    return safeCall(() => authFetch(`/landlord/units/${id}/vacant`, { method: 'PATCH' }));
  },

  async assignUnitTenant(id: string, tenantName: string): Promise<ApiResponse<Unit>> {
    return safeCall(() =>
      authFetch(`/landlord/units/${id}/assign-tenant`, {
        method: 'PATCH',
        body: JSON.stringify({ tenantName }),
      })
    );
  },

  async bulkUpdateUnitPricing(
    unitIds: string[],
    askingRent: number,
    askingRentPeriod: 'year' | 'month' = 'year'
  ): Promise<ApiResponse<{ updated: number; listingsUpdated: number }>> {
    return safeCall(() =>
      authFetch('/landlord/units/bulk-price', {
        method: 'PATCH',
        body: JSON.stringify({ unitIds, askingRent, askingRentPeriod }),
      })
    );
  },

  // ---- Listings ----
  async listListings(status?: string): Promise<ApiResponse<Listing[]>> {
    return safeCall(() => authFetch(`/landlord/listings${toQuery({ status })}`));
  },

  async listVacantUnits(): Promise<ApiResponse<Unit[]>> {
    return safeCall(() => authFetch('/landlord/listings/vacant-units'));
  },

  async publishListing(
    data: Pick<
      Listing,
      | 'unitId'
      | 'listingTitle'
      | 'askingRent'
      | 'rentPeriod'
      | 'allowsMonthlyPayment'
      | 'securityDeposit'
      | 'amenities'
      | 'availabilityDate'
      | 'allowPets'
      | 'furnished'
      | 'shortLetEnabled'
    >
  ): Promise<ApiResponse<Listing>> {
    return safeCall(() =>
      authFetch('/landlord/listings', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async toggleListingPause(id: string): Promise<ApiResponse<Listing>> {
    return safeCall(() => authFetch(`/landlord/listings/${id}/toggle-pause`, { method: 'PATCH' }));
  },

  // ---- Applications ----
  async listApplications(
    params: { status?: string; page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<RentalApplication>>> {
    return safeCall(() =>
      authFetch<Paginated<RentalApplication>>(`/landlord/applications${toQuery(params)}`)
    );
  },

  async updateApplicationStatus(
    id: string,
    status: ApplicationStatus
  ): Promise<ApiResponse<RentalApplication>> {
    return safeCall(() =>
      authFetch(`/landlord/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    );
  },

  async getApplicationScreening(applicationId: string): Promise<ApiResponse<ScreeningReport>> {
    return safeCall(() => authFetch(`/landlord/applications/${applicationId}/screening`));
  },

  async updateReferenceCheck(
    applicationId: string,
    referenceId: string,
    body: { status: ReferenceOutcome; note?: string }
  ): Promise<ApiResponse<ScreeningReference>> {
    return safeCall(() =>
      authFetch(`/landlord/applications/${applicationId}/references/${referenceId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
    );
  },

  async getTenancyStanding(id: string): Promise<ApiResponse<TenancyStanding>> {
    return safeCall(() => authFetch(`/landlord/applications/${id}/tenancy-standing`));
  },

  // ---- Leases ----
  async listLeases(
    params: { status?: string; page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<Lease>>> {
    return safeCall(() => authFetch<Paginated<Lease>>(`/landlord/leases${toQuery(params)}`));
  },

  async listVacantUnitsForLease(): Promise<ApiResponse<Unit[]>> {
    return safeCall(() => authFetch('/landlord/leases/vacant-units'));
  },

  async createLease(
    data: Pick<
      Lease,
      'unitId' | 'tenantName' | 'leaseStart' | 'leaseEnd' | 'rentAmount' | 'securityDeposit'
    > & { tenantId?: string; rentPeriod?: 'month' | 'year' },
    sendImmediately: boolean
  ): Promise<ApiResponse<Lease>> {
    return safeCall(() =>
      authFetch('/landlord/leases', {
        method: 'POST',
        // tenantId is omitted when there is no linked applicant: the API then
        // falls back to this unit's approved applicant, or to the name alone.
        body: JSON.stringify({
          unitId: data.unitId,
          tenantName: data.tenantName,
          leaseStart: data.leaseStart,
          leaseEnd: data.leaseEnd,
          rentAmount: data.rentAmount,
          securityDeposit: data.securityDeposit,
          ...(data.tenantId ? { tenantId: data.tenantId } : {}),
          ...(data.rentPeriod ? { rentPeriod: data.rentPeriod } : {}),
          sendImmediately,
        }),
      })
    );
  },

  async sendLease(id: string): Promise<ApiResponse<Lease>> {
    return safeCall(() => authFetch(`/landlord/leases/${id}/send`, { method: 'PATCH' }));
  },

  async renewLease(id: string, rentAmount: number, leaseEnd: string): Promise<ApiResponse<Lease>> {
    return safeCall(() =>
      authFetch(`/landlord/leases/${id}/renew`, {
        method: 'PATCH',
        body: JSON.stringify({ rentAmount, leaseEnd }),
      })
    );
  },

  async previewRenewalCheck(
    id: string,
    rentAmount: number
  ): Promise<ApiResponse<RentIncreaseCheck>> {
    return safeCall(() =>
      authFetch(`/landlord/leases/${id}/renewal-check`, {
        method: 'POST',
        body: JSON.stringify({ rentAmount }),
      })
    );
  },

  async signLease(id: string, signatureData: string): Promise<ApiResponse<Lease>> {
    return safeCall(() =>
      authFetch(`/landlord/leases/${id}/sign`, {
        method: 'POST',
        body: JSON.stringify({ signatureData }),
      })
    );
  },

  async downloadLeasePdf(id: string): Promise<ApiResponse<void>> {
    return safeCall(async () => {
      const blob = await authDownload(`/landlord/leases/${id}/pdf`);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lease-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  },

  // ---- Legal cases ----
  //
  // An eviction is `kind: 'EVICTION'` rather than its own endpoint. The notice
  // steps that used to live here (`issue-notice` with a hand-typed cure period)
  // are gone: notices belong to the tenancy's ladder, which resolves the period,
  // records where the number came from, and refuses to invent one.

  async listLegalCases(
    params: {
      propertyId?: string;
      leaseId?: string;
      status?: LegalCaseStatus;
      kind?: LegalCaseKind;
      limit?: number;
    } = {}
  ): Promise<ApiResponse<{ cases: LegalCase[]; limit: number; truncated: boolean }>> {
    return safeCall(() => authFetch(`/landlord/legal-cases${toQuery(params)}`));
  },

  /** Cases that still have something to do — for a worklist rather than an archive. */
  async listOutstandingLegalCases(limit?: number): Promise<ApiResponse<LegalCase[]>> {
    return safeCall(() => authFetch(`/landlord/legal-cases/outstanding${toQuery({ limit })}`));
  },

  async getLegalCase(id: string): Promise<ApiResponse<LegalCase>> {
    return safeCall(() => authFetch(`/landlord/legal-cases/${id}`));
  },

  async openLegalCase(data: {
    kind: LegalCaseKind;
    propertyId: string;
    /** Required for an eviction: the notices are what the claim is built on. */
    leaseId?: string;
    tenantId?: string;
    description: string;
  }): Promise<ApiResponse<LegalCase>> {
    return safeCall(() =>
      authFetch('/landlord/legal-cases', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  /**
   * File in court. For a possession case this is refused until the notice to
   * quit and the notice of intention have both run out, so the server's refusal
   * is worth showing verbatim rather than replacing with something generic.
   */
  async fileLegalCase(
    id: string,
    data: { court: string; suitNumber: string }
  ): Promise<ApiResponse<LegalCase>> {
    return safeCall(() =>
      authFetch(`/landlord/legal-cases/${id}/file`, { method: 'PATCH', body: JSON.stringify(data) })
    );
  },

  async decideLegalCase(
    id: string,
    data: { outcome: LegalCaseOutcome; notes?: string; decidedAt?: string }
  ): Promise<ApiResponse<LegalCase>> {
    return safeCall(() =>
      authFetch(`/landlord/legal-cases/${id}/decide`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    );
  },

  async enforceLegalCase(
    id: string,
    data: { method: EnforcementMethod; notes?: string; enforcedAt?: string }
  ): Promise<ApiResponse<LegalCase>> {
    return safeCall(() =>
      authFetch(`/landlord/legal-cases/${id}/enforce`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    );
  },

  async recordLegalCaseAdvocate(
    id: string,
    data: { name: string; firm?: string; contact?: string; feeAgreement?: string }
  ): Promise<ApiResponse<LegalCase>> {
    return safeCall(() =>
      authFetch(`/landlord/legal-cases/${id}/advocate`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    );
  },

  async recordLegalCaseCost(
    id: string,
    data: { amount: number; note: string; incurredAt?: string }
  ): Promise<ApiResponse<LegalCase>> {
    return safeCall(() =>
      authFetch(`/landlord/legal-cases/${id}/costs`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  async closeLegalCase(id: string, notes?: string): Promise<ApiResponse<LegalCase>> {
    return safeCall(() =>
      authFetch(`/landlord/legal-cases/${id}/close`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      })
    );
  },

  async withdrawLegalCase(id: string, reason: string): Promise<ApiResponse<LegalCase>> {
    return safeCall(() =>
      authFetch(`/landlord/legal-cases/${id}/withdraw`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      })
    );
  },

  async scheduleHearing(
    id: string,
    data: { scheduledFor: string; purpose?: string }
  ): Promise<ApiResponse<LegalCase>> {
    return safeCall(() =>
      authFetch(`/landlord/legal-cases/${id}/hearings`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  /**
   * Record what happened at a sitting. An adjournment must name the date it was
   * adjourned to, and the server books that as the next sitting.
   */
  async recordHearing(
    id: string,
    hearingId: string,
    data: { heldAt: string; outcome: HearingOutcome; notes?: string; adjournNextFor?: string }
  ): Promise<ApiResponse<LegalCase>> {
    return safeCall(() =>
      authFetch(`/landlord/legal-cases/${id}/hearings/${hearingId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    );
  },

  /**
   * The printable notice record. Still an internal draft rather than a certified
   * notice — the PDF says so on its face.
   */
  async downloadNoticePdf(noticeId: string): Promise<ApiResponse<void>> {
    return safeCall(async () => {
      const blob = await authDownload(`/landlord/tenancy-notices/${noticeId}/document`);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tenancy-notice-${noticeId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  },

  // ---- Tenants ----
  async listTenants(
    params: { page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<Tenant>>> {
    return safeCall(() => authFetch<Paginated<Tenant>>(`/landlord/tenants${toQuery(params)}`));
  },

  // ---- Payments ----
  async listPayments(
    params: {
      status?: string;
      sort?: 'due_date_asc' | 'due_date_desc';
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<ApiResponse<Paginated<RentPayment>>> {
    return safeCall(() =>
      authFetch<Paginated<RentPayment>>(`/landlord/payments${toQuery(params)}`)
    );
  },

  async getRentCollectionStats(): Promise<ApiResponse<RentCollectionStats>> {
    return safeCall(() => authFetch('/landlord/payments/stats'));
  },

  async getArrearsSummary(): Promise<ApiResponse<LandlordArrearsSummary>> {
    return safeCall(() => authFetch('/landlord/payments/arrears-summary'));
  },

  async bulkCharge(data: {
    unitIds: string[];
    category: ChargeCategory;
    amount: number;
    dueDate: string;
    billingCycle: BillingCycle;
  }): Promise<ApiResponse<BulkChargeResult>> {
    return safeCall(() =>
      authFetch('/landlord/payments/bulk-charge', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  /**
   * Charge one unit. Separate from bulkCharge because charging a single tenant
   * is core rent collection and stays available on the Free plan.
   */
  async chargeUnit(data: {
    unitId: string;
    category: ChargeCategory;
    amount: number;
    dueDate: string;
    billingCycle: BillingCycle;
  }): Promise<ApiResponse<BulkChargeResult>> {
    return safeCall(() =>
      authFetch('/landlord/payments/charge', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  // ---- Portfolio ----
  async getPortfolioAnalytics(): Promise<ApiResponse<PortfolioAnalytics>> {
    return safeCall(() => authFetch('/landlord/portfolio/analytics'));
  },

  // ---- Financials ----
  async getFinancialStats(period: string): Promise<ApiResponse<FinancialStats>> {
    return safeCall(() => authFetch(`/landlord/financials/stats${toQuery({ period })}`));
  },

  async getFinancialChart(): Promise<ApiResponse<FinancialChartPoint[]>> {
    return safeCall(() => authFetch('/landlord/financials/chart'));
  },

  async exportFinancialsCsv(): Promise<ApiResponse<void>> {
    return safeCall(async () => {
      const blob = await authDownload('/landlord/financials/export');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'getrentos-financials.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  },

  // ---- Expenses ----
  async listExpenses(
    params: { propertyId?: string; category?: string; page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<Expense>>> {
    return safeCall(() => authFetch<Paginated<Expense>>(`/landlord/expenses${toQuery(params)}`));
  },

  async createExpense(data: {
    propertyId: string;
    category: ExpenseCategory;
    amount: number;
    incurredAt: string;
    note?: string;
  }): Promise<ApiResponse<Expense>> {
    return safeCall(() =>
      authFetch('/landlord/expenses', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async deleteExpense(id: string): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch(`/landlord/expenses/${id}`, { method: 'DELETE' }));
  },

  // ---- Management fee configuration ----
  async getManagementFeeConfig(
    propertyId: string
  ): Promise<ApiResponse<ManagementFeeConfig | null>> {
    return safeCall(() => authFetch(`/landlord/management-fee-config${toQuery({ propertyId })}`));
  },

  async upsertManagementFeeConfig(data: {
    propertyId: string;
    type: ManagementFeeType;
    value: number;
  }): Promise<ApiResponse<ManagementFeeConfig>> {
    return safeCall(() =>
      authFetch('/landlord/management-fee-config', { method: 'PUT', body: JSON.stringify(data) })
    );
  },

  // ---- Owner statements ----
  async listOwnerStatements(
    params: { page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<OwnerStatement>>> {
    return safeCall(() =>
      authFetch<Paginated<OwnerStatement>>(`/landlord/owner-statements${toQuery(params)}`)
    );
  },

  async getOwnerStatement(id: string): Promise<ApiResponse<OwnerStatement>> {
    return safeCall(() => authFetch(`/landlord/owner-statements/${id}`));
  },

  async generateOwnerStatement(data: {
    propertyId?: string;
    periodStart: string;
    periodEnd: string;
  }): Promise<ApiResponse<OwnerStatement>> {
    return safeCall(() =>
      authFetch('/landlord/owner-statements/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  async issueOwnerStatement(id: string): Promise<ApiResponse<OwnerStatement>> {
    return safeCall(() => authFetch(`/landlord/owner-statements/${id}/issue`, { method: 'POST' }));
  },

  async retryOwnerStatementPayout(id: string): Promise<ApiResponse<OwnerStatement>> {
    return safeCall(() =>
      authFetch(`/landlord/owner-statements/${id}/retry-payout`, { method: 'POST' })
    );
  },

  /** Email the owner their copy of an issued statement again. */
  async resendOwnerStatementEmail(
    id: string
  ): Promise<ApiResponse<{ emailSentAt: string | null; emailError: string | null }>> {
    return safeCall(() =>
      authFetch(`/landlord/owner-statements/${id}/resend-email`, { method: 'POST' })
    );
  },

  /**
   * Say that one line is wrong.
   *
   * An issued statement is never edited, so this does not change the figure. If
   * it is upheld the correction arrives on the NEXT statement, and until it is
   * decided a payout that has not been sent is held.
   */
  async disputeStatementLine(
    statementId: string,
    lineId: string,
    reason: string
  ): Promise<ApiResponse<StatementLineDispute>> {
    return safeCall(() =>
      authFetch<StatementLineDispute>(
        `/landlord/owner-statements/${statementId}/lines/${lineId}/disputes`,
        { method: 'POST', body: JSON.stringify({ reason }) }
      )
    );
  },

  /** Take back your own complaint, before anybody has decided it. */
  async withdrawStatementLineDispute(
    statementId: string,
    disputeId: string
  ): Promise<ApiResponse<StatementLineDispute>> {
    return safeCall(() =>
      authFetch<StatementLineDispute>(
        `/landlord/owner-statements/${statementId}/disputes/${disputeId}/withdraw`,
        { method: 'POST' }
      )
    );
  },

  // ---- Vendors ----
  async listVendors(
    params: { page?: number; pageSize?: number; activeOnly?: boolean } = {}
  ): Promise<ApiResponse<Paginated<Vendor>>> {
    return safeCall(() => authFetch<Paginated<Vendor>>(`/landlord/vendors${toQuery(params)}`));
  },

  async getVendorDetail(id: string): Promise<ApiResponse<VendorDetail>> {
    return safeCall(() => authFetch(`/landlord/vendors/${id}`));
  },

  async addVendor(data: VendorInput): Promise<ApiResponse<Vendor>> {
    return safeCall(() =>
      authFetch('/landlord/vendors', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async updateVendor(
    id: string,
    updates: Partial<VendorInput> & { isActive?: boolean }
  ): Promise<ApiResponse<Vendor>> {
    return safeCall(() =>
      authFetch(`/landlord/vendors/${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
    );
  },

  async removeVendor(id: string): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch(`/landlord/vendors/${id}`, { method: 'DELETE' }));
  },

  // ---- Maintenance ----
  async listMaintenanceRequests(
    params: { status?: string; page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<LandlordMaintenanceRequest>>> {
    return safeCall(() =>
      authFetch<Paginated<LandlordMaintenanceRequest>>(`/landlord/maintenance${toQuery(params)}`)
    );
  },

  async getMaintenanceSummary(): Promise<ApiResponse<LandlordMaintenanceSummary>> {
    return safeCall(() => authFetch('/landlord/maintenance/summary'));
  },

  async assignMaintenanceVendor(
    requestId: string,
    vendorId: string,
    scheduledFor?: string
  ): Promise<ApiResponse<LandlordMaintenanceRequest>> {
    return safeCall(() =>
      authFetch(`/landlord/maintenance/${requestId}/assign-vendor`, {
        method: 'PATCH',
        body: JSON.stringify({ vendorId, scheduledFor }),
      })
    );
  },

  async scheduleMaintenanceVisit(
    requestId: string,
    scheduledFor: string
  ): Promise<ApiResponse<LandlordMaintenanceRequest>> {
    return safeCall(() =>
      authFetch(`/landlord/maintenance/${requestId}/schedule-visit`, {
        method: 'PATCH',
        body: JSON.stringify({ scheduledFor }),
      })
    );
  },

  async rateMaintenanceVendor(
    requestId: string,
    rating: number
  ): Promise<ApiResponse<LandlordMaintenanceRequest>> {
    return safeCall(() =>
      authFetch(`/landlord/maintenance/${requestId}/rate-vendor`, {
        method: 'PATCH',
        body: JSON.stringify({ rating }),
      })
    );
  },

  async markMaintenanceResolved(
    requestId: string
  ): Promise<ApiResponse<LandlordMaintenanceRequest>> {
    return safeCall(() =>
      authFetch(`/landlord/maintenance/${requestId}/resolve`, { method: 'PATCH' })
    );
  },

  async escalateMaintenance(requestId: string): Promise<ApiResponse<LandlordMaintenanceRequest>> {
    return safeCall(() =>
      authFetch(`/landlord/maintenance/${requestId}/escalate`, { method: 'PATCH' })
    );
  },

  // ---- Documents ----
  async listDocuments(
    params: { search?: string; category?: string; page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<LandlordDocument>>> {
    return safeCall(() =>
      authFetch<Paginated<LandlordDocument>>(`/landlord/documents${toQuery(params)}`)
    );
  },

  async uploadDocument(
    name: string,
    category: string,
    file: File
  ): Promise<ApiResponse<LandlordDocument>> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('file', file);
    return safeCall(() => authFetch('/landlord/documents', { method: 'POST', body: formData }));
  },

  async getDocumentDownloadUrl(id: string): Promise<ApiResponse<{ url: string; name: string }>> {
    return safeCall(() => authFetch(`/landlord/documents/${id}/download`));
  },

  // ---- Reviews ----
  async listReviews(
    params: { page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<TenantReview>>> {
    return safeCall(() =>
      authFetch<Paginated<TenantReview>>(`/landlord/reviews${toQuery(params)}`)
    );
  },

  async getReviewSummary(): Promise<ApiResponse<LandlordReviewSummary>> {
    return safeCall(() => authFetch('/landlord/reviews/summary'));
  },

  // ---- Messages ----
  async listConversations(
    params: { search?: string; page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<Conversation>>> {
    return safeCall(() =>
      authFetch<Paginated<Conversation>>(`/landlord/messages/conversations${toQuery(params)}`)
    );
  },

  async getConversationMessages(
    conversationId: string,
    params: { page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<ThreadMessage>>> {
    return safeCall(() =>
      authFetch<Paginated<ThreadMessage>>(
        `/landlord/messages/conversations/${conversationId}/messages${toQuery(params)}`
      )
    );
  },

  async sendConversationMessage(
    conversationId: string,
    text: string
  ): Promise<ApiResponse<ThreadMessage>> {
    return safeCall(() =>
      authFetch(`/landlord/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
    );
  },

  async markConversationRead(conversationId: string): Promise<ApiResponse<void>> {
    return safeCall(() =>
      authFetch(`/landlord/messages/conversations/${conversationId}/read`, { method: 'PATCH' })
    );
  },

  async startConversation(
    participantId: string,
    propertyId?: string
  ): Promise<ApiResponse<Conversation>> {
    return safeCall(() =>
      authFetch('/landlord/messages/conversations', {
        method: 'POST',
        body: JSON.stringify({ participantId, propertyId: propertyId ?? undefined }),
      })
    );
  },

  // ---- Leads inbox ----
  async listLeads(
    params: {
      search?: string;
      stage?: string;
      staleOnly?: boolean;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<ApiResponse<Paginated<LandlordLead>>> {
    return safeCall(() => authFetch<Paginated<LandlordLead>>(`/landlord/leads${toQuery(params)}`));
  },

  async nudgeLead(leadId: string, message: string): Promise<ApiResponse<LeadNudgeResult>> {
    return safeCall(() =>
      authFetch(`/landlord/leads/${leadId}/nudge`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      })
    );
  },

  async bulkNudgeLeads(leadIds: string[], message: string): Promise<ApiResponse<BulkNudgeResult>> {
    return safeCall(() =>
      authFetch(`/landlord/leads/bulk-nudge`, {
        method: 'POST',
        body: JSON.stringify({ leadIds, message }),
      })
    );
  },

  async listViewingRequests(
    params: { page?: number; pageSize?: number; status?: string } = {}
  ): Promise<ApiResponse<Paginated<LandlordViewingRequest>>> {
    return safeCall(() =>
      authFetch<Paginated<LandlordViewingRequest>>(`/landlord/viewing-requests${toQuery(params)}`)
    );
  },

  async confirmViewingRequest(
    id: string,
    scheduledAt: string
  ): Promise<ApiResponse<LandlordViewingRequest>> {
    return safeCall(() =>
      authFetch(`/landlord/viewing-requests/${id}/confirm`, {
        method: 'PATCH',
        body: JSON.stringify({ scheduledAt }),
      })
    );
  },

  async cancelViewingRequest(id: string): Promise<ApiResponse<LandlordViewingRequest>> {
    return safeCall(() =>
      authFetch(`/landlord/viewing-requests/${id}/cancel`, { method: 'PATCH' })
    );
  },

  // ---- Offers (for-sale listings the landlord owns or manages) ----
  async listOffers(
    params: { page?: number; pageSize?: number; status?: string; search?: string } = {}
  ): Promise<ApiResponse<Paginated<LandlordOffer>>> {
    return safeCall(() =>
      authFetch<Paginated<LandlordOffer>>(`/landlord/offers${toQuery(params)}`)
    );
  },

  async acceptOffer(id: string): Promise<ApiResponse<LandlordOffer>> {
    return safeCall(() =>
      authFetch<LandlordOffer>(`/landlord/offers/${id}/accept`, { method: 'POST' })
    );
  },

  async rejectOffer(id: string): Promise<ApiResponse<LandlordOffer>> {
    return safeCall(() =>
      authFetch<LandlordOffer>(`/landlord/offers/${id}/reject`, { method: 'POST' })
    );
  },

  async counterOffer(
    id: string,
    amount: number,
    note?: string
  ): Promise<ApiResponse<LandlordOffer>> {
    return safeCall(() =>
      authFetch<LandlordOffer>(`/landlord/offers/${id}/counter`, {
        method: 'POST',
        body: JSON.stringify({ amount, message: note }),
      })
    );
  },

  async getOfferThread(id: string): Promise<ApiResponse<LandlordOfferMessage[]>> {
    return safeCall(() => authFetch<LandlordOfferMessage[]>(`/landlord/offers/${id}/thread`));
  },

  // ---- Microsite ----
  async getMicrositeSettings(): Promise<ApiResponse<LandlordMicrositeSettings>> {
    return safeCall(() => authFetch('/landlord/microsite'));
  },

  async updateMicrositeSettings(
    patch: Partial<Pick<LandlordMicrositeSettings, 'slug' | 'bio' | 'enabled'>>
  ): Promise<ApiResponse<LandlordMicrositeSettings>> {
    return safeCall(() =>
      authFetch('/landlord/microsite', { method: 'PATCH', body: JSON.stringify(patch) })
    );
  },

  async uploadMicrositeBanner(file: File): Promise<ApiResponse<LandlordMicrositeSettings>> {
    const formData = new FormData();
    formData.append('file', file);
    return safeCall(() =>
      authFetch('/landlord/microsite/banner', { method: 'POST', body: formData })
    );
  },

  // ---- Settings: Profile ----
  async getProfile(): Promise<ApiResponse<LandlordProfile>> {
    return safeCall(() => authFetch('/landlord/profile'));
  },

  async updateProfile(
    data: Partial<Pick<LandlordProfile, 'fullName' | 'email' | 'phone' | 'companyName'>>
  ): Promise<ApiResponse<LandlordProfile>> {
    return safeCall(() =>
      authFetch('/landlord/profile', { method: 'PUT', body: JSON.stringify(data) })
    );
  },

  async uploadAvatar(file: File): Promise<ApiResponse<LandlordProfile>> {
    const formData = new FormData();
    formData.append('file', file);
    return safeCall(() =>
      authFetch('/landlord/profile/avatar', { method: 'POST', body: formData })
    );
  },

  // ---- Settings: Notifications ----
  async getNotificationPreferences(): Promise<ApiResponse<LandlordNotificationPreference[]>> {
    return safeCall(() => authFetch('/landlord/settings/notifications'));
  },

  async updateNotificationPreferences(
    preferences: LandlordNotificationPreference[]
  ): Promise<ApiResponse<LandlordNotificationPreference[]>> {
    return safeCall(() =>
      authFetch('/landlord/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify({ preferences }),
      })
    );
  },

  // ---- Settings: Payout ----
  async getPayoutAccount(): Promise<ApiResponse<LandlordPayoutAccount>> {
    return safeCall(() => authFetch('/landlord/settings/payout'));
  },

  async updatePayoutAccount(
    data: Pick<LandlordPayoutAccount, 'bankCode' | 'accountNumber'>
  ): Promise<ApiResponse<LandlordPayoutAccount>> {
    return safeCall(() =>
      authFetch('/landlord/settings/payout', { method: 'PUT', body: JSON.stringify(data) })
    );
  },

  // ---- Settings: Automation ----
  async getAutomationSettings(): Promise<ApiResponse<LandlordAutomationSettings>> {
    return safeCall(() => authFetch('/landlord/settings/automation'));
  },

  async updateAutomationSettings(
    data: LandlordAutomationSettings
  ): Promise<ApiResponse<LandlordAutomationSettings>> {
    return safeCall(() =>
      authFetch('/landlord/settings/automation', { method: 'PUT', body: JSON.stringify(data) })
    );
  },

  // ---- Tenancy notices ----

  /** Where a tenancy stands: what is served, what is next, what blocks it. */
  async getLeaseLadder(leaseId: string): Promise<ApiResponse<LeaseLadder>> {
    return safeCall(() => authFetch(`/landlord/tenancy-notices/lease/${leaseId}`));
  },

  async listNotices(
    params: {
      leaseId?: string;
      state?: NoticeState;
      kind?: NoticeKind;
      limit?: number;
    } = {}
  ): Promise<ApiResponse<{ notices: TenancyNotice[]; limit: number; truncated: boolean }>> {
    return safeCall(() => authFetch(`/landlord/tenancy-notices${toQuery(params)}`));
  },

  /**
   * Served notices running out, so the next step can be prepared before the
   * current one completes rather than after.
   */
  async listExpiringNotices(withinDays?: number): Promise<ApiResponse<TenancyNotice[]>> {
    return safeCall(() =>
      authFetch(`/landlord/tenancy-notices/expiring${toQuery({ withinDays })}`)
    );
  },

  async raiseNotice(data: {
    leaseId: string;
    kind: NoticeKind;
    reason: string;
    arrearsAmount?: number;
    /**
     * A number typed for this one notice. Kept available because counsel may
     * advise a period the register does not hold — it is recorded as the least
     * certain source and still needs a basis.
     */
    manualDays?: number;
    manualBasis?: string;
  }): Promise<ApiResponse<TenancyNotice>> {
    return safeCall(() =>
      authFetch('/landlord/tenancy-notices', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  /**
   * Record service. This is where the period starts running, and the date is
   * declared rather than assumed: whether it runs from the day of service or the
   * day after is interpretation, so the person serving says which.
   */
  async serveNotice(
    id: string,
    data: { serviceDate: string; serviceMethod: NoticeServiceMethod; evidenceNote?: string }
  ): Promise<ApiResponse<TenancyNotice>> {
    return safeCall(() =>
      authFetch(`/landlord/tenancy-notices/${id}/serve`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    );
  },

  async withdrawNotice(id: string, reason: string): Promise<ApiResponse<TenancyNotice>> {
    return safeCall(() =>
      authFetch(`/landlord/tenancy-notices/${id}/withdraw`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      })
    );
  },

  async supersedeNotice(
    id: string,
    replacementId: string,
    reason: string
  ): Promise<ApiResponse<TenancyNotice>> {
    return safeCall(() =>
      authFetch(`/landlord/tenancy-notices/${id}/supersede`, {
        method: 'PATCH',
        body: JSON.stringify({ replacementId, reason }),
      })
    );
  },

  // ---- The period register ----

  async getNoticePeriods(): Promise<ApiResponse<NoticePeriodSettings>> {
    return safeCall(() => authFetch('/landlord/tenancy-notices/periods'));
  },

  async setNoticePeriod(data: {
    jurisdiction: string;
    kind: NoticeKind;
    days: number;
    basis: string;
  }): Promise<ApiResponse<NoticePeriodEntry>> {
    return safeCall(() =>
      authFetch('/landlord/tenancy-notices/periods', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  async clearNoticePeriod(data: {
    jurisdiction: string;
    kind: NoticeKind;
  }): Promise<ApiResponse<{ cleared: boolean }>> {
    return safeCall(() =>
      authFetch('/landlord/tenancy-notices/periods', {
        method: 'DELETE',
        body: JSON.stringify(data),
      })
    );
  },
};
