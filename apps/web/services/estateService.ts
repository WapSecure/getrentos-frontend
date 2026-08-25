import { authFetch, safeCall, toQuery } from '@/lib/apiHelpers';
import type { ApiResponse, Paginated } from '@/lib/apiHelpers';
import type {
  Estate,
  Household,
  HouseholdStatus,
  Due,
  VisitorPass,
  IssuedVisitorPass,
  StaffMember,
  Announcement,
  Violation,
  GovernanceRecord,
} from '@/types/estate';

type EstatePageQuery = {
  page?: number;
  pageSize?: number;
};

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

  async listHouseholds(
    estateId: string,
    query: EstatePageQuery & { status?: HouseholdStatus } = {}
  ): Promise<ApiResponse<Paginated<Household>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/households${toQuery(query)}`));
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

  async listDues(
    estateId: string,
    query: EstatePageQuery & { status?: string } = {}
  ): Promise<ApiResponse<Paginated<Due>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/dues${toQuery(query)}`));
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

  async listVisitorPasses(
    estateId: string,
    query: EstatePageQuery & { status?: string } = {}
  ): Promise<ApiResponse<Paginated<VisitorPass>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/visitor-passes${toQuery(query)}`));
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

  async listStaff(
    estateId: string,
    query: EstatePageQuery = {}
  ): Promise<ApiResponse<Paginated<StaffMember>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/staff${toQuery(query)}`));
  },

  async removeGateman(estateId: string, memberUserId: string): Promise<ApiResponse<void>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/staff/${memberUserId}`, { method: 'DELETE' })
    );
  },

  async createAnnouncement(
    estateId: string,
    data: { title: string; body: string; priority?: 'NORMAL' | 'URGENT' }
  ): Promise<ApiResponse<Announcement>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/announcements`, { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async listAnnouncements(
    estateId: string,
    query: EstatePageQuery = {}
  ): Promise<ApiResponse<Paginated<Announcement>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/announcements${toQuery(query)}`));
  },

  async updateAnnouncement(
    estateId: string,
    announcementId: string,
    data: Partial<{ title: string; body: string; priority: 'NORMAL' | 'URGENT' }>
  ): Promise<ApiResponse<Announcement>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/announcements/${announcementId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    );
  },

  async removeAnnouncement(estateId: string, announcementId: string): Promise<ApiResponse<void>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/announcements/${announcementId}`, { method: 'DELETE' })
    );
  },

  async reportViolation(
    estateId: string,
    data: {
      householdId: string;
      description: string;
      category?:
        | 'NOISE'
        | 'UNAUTHORIZED_PARKING'
        | 'PET_VIOLATION'
        | 'PROPERTY_MAINTENANCE'
        | 'OTHER';
    }
  ): Promise<ApiResponse<Violation>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/violations`, { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async listViolations(estateId: string, status?: string): Promise<ApiResponse<Violation[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/violations${toQuery({ status })}`));
  },

  async issueViolationWarning(
    estateId: string,
    violationId: string
  ): Promise<ApiResponse<Violation>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/violations/${violationId}/warn`, { method: 'PATCH' })
    );
  },

  async resolveViolation(
    estateId: string,
    violationId: string,
    resolutionNotes?: string
  ): Promise<ApiResponse<Violation>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/violations/${violationId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNotes }),
      })
    );
  },

  async dismissViolation(
    estateId: string,
    violationId: string,
    resolutionNotes?: string
  ): Promise<ApiResponse<Violation>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/violations/${violationId}/dismiss`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNotes }),
      })
    );
  },

  async uploadGovernanceRecord(
    estateId: string,
    data: {
      title: string;
      type?: 'BYLAWS' | 'MEETING_MINUTES' | 'OTHER';
      meetingDate?: string;
      file: File;
    }
  ): Promise<ApiResponse<GovernanceRecord>> {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.type) formData.append('type', data.type);
    if (data.meetingDate) formData.append('meetingDate', data.meetingDate);
    formData.append('file', data.file);
    return safeCall(() =>
      authFetch(`/estate/${estateId}/governance`, { method: 'POST', body: formData })
    );
  },

  async listGovernanceRecords(
    estateId: string,
    type?: string
  ): Promise<ApiResponse<GovernanceRecord[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/governance${toQuery({ type })}`));
  },

  async removeGovernanceRecord(estateId: string, recordId: string): Promise<ApiResponse<void>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/governance/${recordId}`, { method: 'DELETE' })
    );
  },
};
