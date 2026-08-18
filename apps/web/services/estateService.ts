import { authFetch, safeCall, toQuery } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type {
  Estate,
  Household,
  Due,
  VisitorPass,
  IssuedVisitorPass,
  StaffMember,
} from '@/types/estate';

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

  async createDues(
    estateId: string,
    data: {
      amount: number;
      dueDate: string;
      description?: string;
      category?: 'RENT' | 'SERVICE_CHARGE' | 'DEPOSIT' | 'LEVY';
      billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
      householdIds?: string[];
    }
  ): Promise<ApiResponse<{ created: number }>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/dues`, { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async listDues(estateId: string, status?: string): Promise<ApiResponse<Due[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/dues${toQuery({ status })}`));
  },

  async markDuePaid(estateId: string, dueId: string): Promise<ApiResponse<Due>> {
    return safeCall(() => authFetch(`/estate/${estateId}/dues/${dueId}/pay`, { method: 'PATCH' }));
  },

  async issueVisitorPass(
    estateId: string,
    data: {
      householdId: string;
      visitorName: string;
      visitorPhone?: string;
      purpose?: string;
      expiresAt?: string;
    }
  ): Promise<ApiResponse<IssuedVisitorPass>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/visitor-passes`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  async listVisitorPasses(estateId: string, status?: string): Promise<ApiResponse<VisitorPass[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/visitor-passes${toQuery({ status })}`));
  },

  async revokeVisitorPass(estateId: string, passId: string): Promise<ApiResponse<VisitorPass>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/visitor-passes/${passId}/revoke`, { method: 'PATCH' })
    );
  },

  async verifyVisitorPass(estateId: string, pin: string): Promise<ApiResponse<VisitorPass>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/visitor-passes/verify`, {
        method: 'POST',
        body: JSON.stringify({ pin }),
      })
    );
  },

  async inviteGateman(estateId: string, email: string): Promise<ApiResponse<StaffMember>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/staff/gateman`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    );
  },

  async listStaff(estateId: string): Promise<ApiResponse<StaffMember[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/staff`));
  },

  async removeGateman(estateId: string, memberUserId: string): Promise<ApiResponse<void>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/staff/${memberUserId}`, { method: 'DELETE' })
    );
  },
};
