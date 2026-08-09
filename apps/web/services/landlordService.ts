import { authFetch, safeCall, toQuery } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type { Property, Unit, Listing } from '@/types/landlord';

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
};
