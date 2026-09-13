import { authFetch, safeCall, toQuery } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import type { Paginated } from './adminService';
import type {
  AdminEstate,
  AdminEstateAnnouncementQueue,
  AdminEstateDetail,
  AdminEstateDueQueue,
  AdminEstateDueScanResult,
  AdminEstateGovernanceRecord,
  AdminEstateGovernanceRecordDetail,
  AdminEstateHouseholdQueue,
  AdminEstateIncidentQueue,
  AdminEstateMaintenanceQueue,
  AdminEstateOverview,
  AdminEstatePollQueue,
  AdminEstateStaffMember,
  EstateIncidentStatus,
  EstateMaintenanceStatus,
} from '@/types/estate';

export interface EstateQuery {
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
  state?: string;
  city?: string;
  orgRole?: string;
  workspaceRole?: string;
  organizationId?: string;
  residentLinked?: 'true' | 'false';
  estateId?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

const listResource = <T>(
  resource: string,
  params: EstateQuery = {}
): Promise<ApiResponse<Paginated<T>>> => {
  const query = toQuery({
    search: params.search,
    status: params.status,
    category: params.category,
    priority: params.priority,
    state: params.state,
    city: params.city,
    orgRole: params.orgRole,
    workspaceRole: params.workspaceRole,
    organizationId: params.organizationId,
    residentLinked: params.residentLinked,
    estateId: params.estateId,
    type: params.type,
    page: params.page,
    pageSize: params.pageSize,
  });
  return safeCall(() => authFetch<Paginated<T>>(`/admin/estates/${resource}${query}`));
};

const post = <T>(path: string): Promise<ApiResponse<T>> =>
  safeCall(() =>
    authFetch<T>(`/admin/estates/${path}`, {
      method: 'POST',
    })
  );

const mutate = <T>(
  path: string,
  method: 'PATCH' | 'POST' | 'DELETE',
  body: Record<string, unknown>
): Promise<ApiResponse<T>> =>
  safeCall(() =>
    authFetch<T>(`/admin/estates/${path}`, {
      method,
      body: JSON.stringify(body),
    })
  );

/** Backoffice estate/community oversight (register, queues, access, governance). */
export const adminEstateService = {
  overview(): Promise<ApiResponse<AdminEstateOverview>> {
    return safeCall(() => authFetch<AdminEstateOverview>('/admin/estates/overview'));
  },

  listEstates(params: EstateQuery = {}): Promise<ApiResponse<Paginated<AdminEstate>>> {
    const query = toQuery({
      search: params.search,
      state: params.state,
      city: params.city,
      page: params.page,
      pageSize: params.pageSize,
    });
    return safeCall(() => authFetch<Paginated<AdminEstate>>(`/admin/estates${query}`));
  },

  estateDetail(estateId: string): Promise<ApiResponse<AdminEstateDetail>> {
    return safeCall(() => authFetch<AdminEstateDetail>(`/admin/estates/${estateId}`));
  },

  // 11b community-ops queues
  listHouseholds(
    params: EstateQuery = {}
  ): Promise<ApiResponse<Paginated<AdminEstateHouseholdQueue>>> {
    return listResource<AdminEstateHouseholdQueue>('households', params);
  },

  listDues(params: EstateQuery = {}): Promise<ApiResponse<Paginated<AdminEstateDueQueue>>> {
    return listResource<AdminEstateDueQueue>('dues', params);
  },

  listIncidents(
    params: EstateQuery = {}
  ): Promise<ApiResponse<Paginated<AdminEstateIncidentQueue>>> {
    return listResource<AdminEstateIncidentQueue>('incidents', params);
  },

  listMaintenanceTickets(
    params: EstateQuery = {}
  ): Promise<ApiResponse<Paginated<AdminEstateMaintenanceQueue>>> {
    return listResource<AdminEstateMaintenanceQueue>('maintenance', params);
  },

  listPolls(params: EstateQuery = {}): Promise<ApiResponse<Paginated<AdminEstatePollQueue>>> {
    return listResource<AdminEstatePollQueue>('polls', params);
  },

  listAnnouncements(
    params: EstateQuery = {}
  ): Promise<ApiResponse<Paginated<AdminEstateAnnouncementQueue>>> {
    return listResource<AdminEstateAnnouncementQueue>('announcements', params);
  },

  // 11c access + governance + scan
  listStaff(params: EstateQuery = {}): Promise<ApiResponse<Paginated<AdminEstateStaffMember>>> {
    return listResource<AdminEstateStaffMember>('staff', params);
  },

  listGovernanceRecords(
    params: EstateQuery = {}
  ): Promise<ApiResponse<Paginated<AdminEstateGovernanceRecord>>> {
    return listResource<AdminEstateGovernanceRecord>('governance-records', params);
  },

  governanceRecordDetail(
    recordId: string
  ): Promise<ApiResponse<AdminEstateGovernanceRecordDetail>> {
    return safeCall(() =>
      authFetch<AdminEstateGovernanceRecordDetail>(`/admin/estates/governance-records/${recordId}`)
    );
  },

  runDueScan(): Promise<ApiResponse<AdminEstateDueScanResult>> {
    return post<AdminEstateDueScanResult>('dues/scan');
  },

  updateIncidentStatus(id: string, status: EstateIncidentStatus, reason: string) {
    return mutate<AdminEstateIncidentQueue>(`incidents/${id}/status`, 'PATCH', { status, reason });
  },

  updateMaintenanceStatus(id: string, status: EstateMaintenanceStatus, reason: string) {
    return mutate<AdminEstateMaintenanceQueue>(`maintenance/${id}/status`, 'PATCH', {
      status,
      reason,
    });
  },

  closePoll(id: string, reason: string) {
    return mutate<AdminEstatePollQueue>(`polls/${id}/close`, 'POST', { reason });
  },

  removeAnnouncement(id: string, reason: string) {
    return mutate<void>(`announcements/${id}`, 'DELETE', { reason });
  },

  archiveEstate(estateId: string, reason: string) {
    return mutate<AdminEstate>(`${estateId}/archive`, 'PATCH', { reason });
  },

  reactivateEstate(estateId: string, reason: string) {
    return mutate<AdminEstate>(`${estateId}/reactivate`, 'PATCH', { reason });
  },

  updateHousehold(
    id: string,
    dto: {
      unitLabel?: string;
      contactPhone?: string;
      contactEmail?: string;
      status?: string;
      unlinkResident?: boolean;
      reason: string;
    }
  ) {
    return mutate<AdminEstateHouseholdQueue>(`households/${id}`, 'PATCH', dto);
  },

  waiveDue(id: string, reason: string) {
    return mutate<AdminEstateDueQueue>(`dues/${id}/waive`, 'POST', { reason });
  },

  adjustDueAmount(id: string, amount: number, reason: string) {
    return mutate<AdminEstateDueQueue>(`dues/${id}/amount`, 'PATCH', { amount, reason });
  },

  revokeStaff(membershipId: string, reason: string) {
    return mutate<void>(`staff/${membershipId}`, 'DELETE', { reason });
  },

  removeGovernanceRecord(recordId: string, reason: string) {
    return mutate<void>(`governance-records/${recordId}`, 'DELETE', { reason });
  },
};
