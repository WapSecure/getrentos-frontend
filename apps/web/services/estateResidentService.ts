import { authFetch, safeCall, toQuery } from '@/lib/apiHelpers';
import type { ApiResponse, Paginated } from '@/lib/apiHelpers';
import type {
  Announcement,
  DeliveryLog,
  Due,
  IssuedVisitorPass,
  ResidentHousehold,
  Violation,
  VisitorPass,
} from '@/types/estate';

type PageQuery = { page?: number; pageSize?: number };

export const estateResidentService = {
  async getMyHousehold(): Promise<ApiResponse<ResidentHousehold>> {
    return safeCall(() => authFetch('/estate/resident/household'));
  },

  async listMyDues(
    query: PageQuery & { status?: string } = {}
  ): Promise<ApiResponse<Paginated<Due>>> {
    return safeCall(() => authFetch(`/estate/resident/dues${toQuery(query)}`));
  },

  async payMyDue(dueId: string): Promise<ApiResponse<Due>> {
    return safeCall(() => authFetch(`/estate/resident/dues/${dueId}/pay`, { method: 'POST' }));
  },

  async listMyAnnouncements(query: PageQuery = {}): Promise<ApiResponse<Paginated<Announcement>>> {
    return safeCall(() => authFetch(`/estate/resident/announcements${toQuery(query)}`));
  },

  async listMyViolations(): Promise<ApiResponse<Violation[]>> {
    return safeCall(() => authFetch('/estate/resident/violations'));
  },

  async listMyDeliveries(
    query: PageQuery & { status?: string } = {}
  ): Promise<ApiResponse<Paginated<DeliveryLog>>> {
    return safeCall(() => authFetch(`/estate/resident/deliveries${toQuery(query)}`));
  },

  async listMyVisitorPasses(
    query: PageQuery & { status?: string } = {}
  ): Promise<ApiResponse<Paginated<VisitorPass>>> {
    return safeCall(() => authFetch(`/estate/resident/visitor-passes${toQuery(query)}`));
  },

  async issueMyVisitorPass(data: {
    visitorName: string;
    visitorPhone?: string;
    purpose?: string;
    expiresAt?: string;
  }): Promise<ApiResponse<IssuedVisitorPass>> {
    return safeCall(() =>
      authFetch('/estate/resident/visitor-passes', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async revokeMyVisitorPass(passId: string): Promise<ApiResponse<VisitorPass>> {
    return safeCall(() =>
      authFetch(`/estate/resident/visitor-passes/${passId}/revoke`, { method: 'PATCH' })
    );
  },
};
