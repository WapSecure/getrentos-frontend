import { authFetch, safeCall, toQuery } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type { Property, Application } from '@/types/renter';
import type { ApplicationFormData } from '@/components/renter/property-apply/ApplicationWizard';

export interface RenterListingsFilters {
  search?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  propertyType?: string;
  verifiedOnly?: boolean;
}

export const renterService = {
  // ---- Listings ----
  async listListings(filters: RenterListingsFilters = {}): Promise<ApiResponse<Property[]>> {
    const { verifiedOnly, ...rest } = filters;
    return safeCall(() =>
      authFetch(
        `/renter/listings${toQuery({ ...rest, verifiedOnly: verifiedOnly ? 'true' : undefined })}`
      )
    );
  },

  async getListing(id: string): Promise<ApiResponse<Property>> {
    return safeCall(() => authFetch(`/renter/listings/${id}`));
  },

  // ---- Saved listings ----
  async listSavedListings(): Promise<ApiResponse<Property[]>> {
    return safeCall(() => authFetch('/renter/saved-listings'));
  },

  async saveListing(listingId: string): Promise<ApiResponse<{ saved: boolean }>> {
    return safeCall(() => authFetch(`/renter/saved-listings/${listingId}`, { method: 'POST' }));
  },

  async unsaveListing(listingId: string): Promise<ApiResponse<{ saved: boolean }>> {
    return safeCall(() => authFetch(`/renter/saved-listings/${listingId}`, { method: 'DELETE' }));
  },

  // ---- Applications ----
  async listMyApplications(): Promise<ApiResponse<Application[]>> {
    return safeCall(() => authFetch('/renter/applications'));
  },

  async withdrawApplication(id: string): Promise<ApiResponse<Application>> {
    return safeCall(() => authFetch(`/renter/applications/${id}/withdraw`, { method: 'PATCH' }));
  },

  async submitApplication(
    listingId: string,
    data: ApplicationFormData
  ): Promise<ApiResponse<Application>> {
    return safeCall(() =>
      authFetch('/renter/applications', {
        method: 'POST',
        body: JSON.stringify({
          listingId,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          currentAddress: data.currentAddress,
          employer: data.employer,
          employmentStatus: data.employmentStatus,
          monthlyIncome: Number(data.monthlyIncome) || 0,
          moveInDate: data.moveInDate || undefined,
          leaseTerm: data.leaseTerm,
          notes: data.notes,
          documents: data.documents,
        }),
      })
    );
  },
};
