import { ApiError } from '@/lib/apiClient';
import { authFetch, safeCall, toQuery, type Paginated } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import { getAuthToken } from '@/lib/authStorage';
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
  EvictionCase,
  RentIncreaseCheck,
  TenancyStanding,
  LandlordLead,
  LandlordViewingRequest,
  LeadNudgeResult,
  BulkNudgeResult,
} from '@/types/landlord';
import type { Conversation } from '@/components/landlord/messages/ConversationList';
import type { ThreadMessage } from '@/components/landlord/messages/MessageThread';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  generatedAt: string;
  issuedAt: string | null;
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
}

export interface LandlordDashboardStats {
  totalProperties: number;
  occupiedUnits: number;
  vacantUnits: number;
  monthlyRevenue: number;
  outstandingPayments: number;
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
      | 'monthlyRevenue'
      | 'createdAt'
      | 'coverImage'
      | 'verificationStatus'
      | 'archived'
      | 'totalUnits'
    > & { totalUnits?: number }
  ): Promise<ApiResponse<Property>> {
    return safeCall(() =>
      authFetch('/landlord/properties', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async updateProperty(
    id: string,
    updates: Pick<Property, 'name' | 'type' | 'address' | 'city' | 'state' | 'totalUnits'>
  ): Promise<ApiResponse<Property>> {
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
    monthlyRent: number
  ): Promise<ApiResponse<{ updated: number }>> {
    return safeCall(() =>
      authFetch('/landlord/units/bulk-price', {
        method: 'PATCH',
        body: JSON.stringify({ unitIds, monthlyRent }),
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
      | 'monthlyRent'
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
    >,
    sendImmediately: boolean
  ): Promise<ApiResponse<Lease>> {
    return safeCall(() =>
      authFetch('/landlord/leases', {
        method: 'POST',
        body: JSON.stringify({ ...data, sendImmediately }),
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
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/landlord/leases/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new ApiError(response.status, 'Failed to download lease PDF');

      const blob = await response.blob();
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

  // ---- Evictions ----
  async listEvictions(
    params: { page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<EvictionCase>>> {
    return safeCall(() =>
      authFetch<Paginated<EvictionCase>>(`/landlord/evictions${toQuery(params)}`)
    );
  },

  async initiateEviction(leaseId: string, reason: string): Promise<ApiResponse<EvictionCase>> {
    return safeCall(() =>
      authFetch('/landlord/evictions', {
        method: 'POST',
        body: JSON.stringify({ leaseId, reason }),
      })
    );
  },

  async issueEvictionNotice(id: string, cureDays: number): Promise<ApiResponse<EvictionCase>> {
    return safeCall(() =>
      authFetch(`/landlord/evictions/${id}/issue-notice`, {
        method: 'PATCH',
        body: JSON.stringify({ cureDays }),
      })
    );
  },

  async markEvictionFiled(id: string): Promise<ApiResponse<EvictionCase>> {
    return safeCall(() => authFetch(`/landlord/evictions/${id}/file`, { method: 'PATCH' }));
  },

  async resolveEviction(id: string, resolutionNotes?: string): Promise<ApiResponse<EvictionCase>> {
    return safeCall(() =>
      authFetch(`/landlord/evictions/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNotes }),
      })
    );
  },

  async withdrawEviction(id: string): Promise<ApiResponse<EvictionCase>> {
    return safeCall(() => authFetch(`/landlord/evictions/${id}/withdraw`, { method: 'PATCH' }));
  },

  async downloadEvictionNoticePdf(id: string): Promise<ApiResponse<void>> {
    return safeCall(async () => {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/landlord/evictions/${id}/notice.pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok)
        throw new ApiError(response.status, 'Failed to download eviction notice PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `eviction-notice-${id}.pdf`;
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

  // ---- Financials ----
  async getFinancialStats(period: string): Promise<ApiResponse<FinancialStats>> {
    return safeCall(() => authFetch(`/landlord/financials/stats${toQuery({ period })}`));
  },

  async getFinancialChart(): Promise<ApiResponse<FinancialChartPoint[]>> {
    return safeCall(() => authFetch('/landlord/financials/chart'));
  },

  async exportFinancialsCsv(): Promise<ApiResponse<void>> {
    return safeCall(async () => {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/landlord/financials/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new ApiError(response.status, 'Failed to export financials');

      const blob = await response.blob();
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

  // ---- Vendors ----
  async listVendors(
    params: { page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<Vendor>>> {
    return safeCall(() => authFetch<Paginated<Vendor>>(`/landlord/vendors${toQuery(params)}`));
  },

  async addVendor(
    data: Omit<Vendor, 'id' | 'rating' | 'jobsCompleted'>
  ): Promise<ApiResponse<Vendor>> {
    return safeCall(() =>
      authFetch('/landlord/vendors', { method: 'POST', body: JSON.stringify(data) })
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
    vendorId: string
  ): Promise<ApiResponse<LandlordMaintenanceRequest>> {
    return safeCall(() =>
      authFetch(`/landlord/maintenance/${requestId}/assign-vendor`, {
        method: 'PATCH',
        body: JSON.stringify({ vendorId }),
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
    data: Pick<LandlordPayoutAccount, 'bankName' | 'accountNumber' | 'accountName'>
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
};
