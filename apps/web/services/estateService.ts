import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type { Estate, Household } from '@/types/estate';

export const estateService = {
  async createEstate(data: {
    name: string;
    address: string;
    city: string;
    state: string;
    gateCount?: number;
  }): Promise<ApiResponse<Estate>> {
    return safeCall(() => authFetch('/estate', { method: 'POST', body: JSON.stringify(data) }));
  },

  async getMyEstate(): Promise<ApiResponse<Estate | null>> {
    return safeCall(() => authFetch('/estate/me'));
  },

  async listHouseholds(estateId: string): Promise<ApiResponse<Household[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/households`));
  },

  async addHousehold(
    estateId: string,
    data: { unitLabel: string; residentName: string; contactPhone?: string; contactEmail?: string }
  ): Promise<ApiResponse<Household>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/households`, { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async updateHousehold(
    estateId: string,
    householdId: string,
    data: Partial<{
      unitLabel: string;
      residentName: string;
      contactPhone: string;
      contactEmail: string;
      status: 'ACTIVE' | 'INACTIVE';
    }>
  ): Promise<ApiResponse<Household>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/households/${householdId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    );
  },

  async removeHousehold(estateId: string, householdId: string): Promise<ApiResponse<void>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/households/${householdId}`, { method: 'DELETE' })
    );
  },
};
