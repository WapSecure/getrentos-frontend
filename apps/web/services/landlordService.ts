import { ApiError } from '@/lib/apiClient';
import { authFetch, safeCall, toQuery } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import { STORAGE_KEYS } from '@/lib/constants/auth';
import type {
  Property,
  Unit,
  Listing,
  RentalApplication,
  ApplicationStatus,
  Lease,
  Tenant,
  RentPayment,
} from '@/types/landlord';

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
      const token =
        typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) : null;
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
};
