import { ApiError } from '@/lib/apiClient';
import { authFetch, safeCall, toQuery } from '@/lib/apiHelpers';
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

  // ---- Properties ----
  async listProperties(
    params: {
      search?: string;
      verificationStatus?: string;
    } = {}
  ): Promise<ApiResponse<Property[]>> {
    return safeCall(() => authFetch(`/landlord/properties${toQuery(params)}`));
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
    params: { search?: string; propertyId?: string } = {}
  ): Promise<ApiResponse<Unit[]>> {
    return safeCall(() => authFetch(`/landlord/units${toQuery(params)}`));
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
  async listApplications(status?: string): Promise<ApiResponse<RentalApplication[]>> {
    return safeCall(() => authFetch(`/landlord/applications${toQuery({ status })}`));
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

  // ---- Leases ----
  async listLeases(status?: string): Promise<ApiResponse<Lease[]>> {
    return safeCall(() => authFetch(`/landlord/leases${toQuery({ status })}`));
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

  // ---- Tenants ----
  async listTenants(): Promise<ApiResponse<Tenant[]>> {
    return safeCall(() => authFetch('/landlord/tenants'));
  },

  // ---- Payments ----
  async listPayments(status?: string): Promise<ApiResponse<RentPayment[]>> {
    return safeCall(() => authFetch(`/landlord/payments${toQuery({ status })}`));
  },

  async getRentCollectionStats(): Promise<ApiResponse<RentCollectionStats>> {
    return safeCall(() => authFetch('/landlord/payments/stats'));
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

  // ---- Vendors ----
  async listVendors(): Promise<ApiResponse<Vendor[]>> {
    return safeCall(() => authFetch('/landlord/vendors'));
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
    status?: string
  ): Promise<ApiResponse<LandlordMaintenanceRequest[]>> {
    return safeCall(() => authFetch(`/landlord/maintenance${toQuery({ status })}`));
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
    params: { search?: string; category?: string } = {}
  ): Promise<ApiResponse<LandlordDocument[]>> {
    return safeCall(() => authFetch(`/landlord/documents${toQuery(params)}`));
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
  async listReviews(): Promise<ApiResponse<TenantReview[]>> {
    return safeCall(() => authFetch('/landlord/reviews'));
  },

  // ---- Messages ----
  async listConversations(search?: string): Promise<ApiResponse<Conversation[]>> {
    return safeCall(() => authFetch(`/landlord/messages/conversations${toQuery({ search })}`));
  },

  async getConversationMessages(conversationId: string): Promise<ApiResponse<ThreadMessage[]>> {
    return safeCall(() => authFetch(`/landlord/messages/conversations/${conversationId}/messages`));
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
