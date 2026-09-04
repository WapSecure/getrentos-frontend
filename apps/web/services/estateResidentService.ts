import { authFetch, safeCall, toQuery } from '@/lib/apiHelpers';
import type { ApiResponse, Paginated } from '@/lib/apiHelpers';
import type {
  Announcement,
  DeliveryLog,
  DirectoryEntry,
  Due,
  IssuedVisitorPass,
  MaintenanceTicket,
  Poll,
  Amenity,
  AmenityBooking,
  CommitteeMember,
  GovernanceRecord,
  ResidentHousehold,
  Violation,
  VisitorPass,
} from '@/types/estate';

type PageQuery = { page?: number; pageSize?: number };

export const estateResidentService = {
  async getMyHousehold(): Promise<ApiResponse<ResidentHousehold>> {
    return safeCall(() => authFetch('/estate/resident/household'));
  },

  async setDirectoryOptIn(optIn: boolean): Promise<ApiResponse<ResidentHousehold>> {
    return safeCall(() =>
      authFetch('/estate/resident/household/directory-opt-in', {
        method: 'PATCH',
        body: JSON.stringify({ optIn }),
      })
    );
  },

  async getDirectory(): Promise<ApiResponse<DirectoryEntry[]>> {
    return safeCall(() => authFetch('/estate/resident/directory'));
  },

  async reportMaintenanceTicket(data: {
    description: string;
    category?: 'PLUMBING' | 'ELECTRICAL' | 'STRUCTURAL' | 'COMMON_AREA' | 'OTHER';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    photo?: File;
  }): Promise<ApiResponse<MaintenanceTicket>> {
    const formData = new FormData();
    formData.append('description', data.description);
    if (data.category) formData.append('category', data.category);
    if (data.priority) formData.append('priority', data.priority);
    if (data.photo) formData.append('file', data.photo);
    return safeCall(() =>
      authFetch('/estate/resident/maintenance', { method: 'POST', body: formData })
    );
  },

  async listMyMaintenanceTickets(): Promise<ApiResponse<MaintenanceTicket[]>> {
    return safeCall(() => authFetch('/estate/resident/maintenance'));
  },

  async listMyPolls(): Promise<ApiResponse<Poll[]>> {
    return safeCall(() => authFetch('/estate/resident/polls'));
  },

  async voteOnPoll(pollId: string, optionId: string): Promise<ApiResponse<Poll>> {
    return safeCall(() =>
      authFetch(`/estate/resident/polls/${pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ optionId }),
      })
    );
  },

  async listAmenities(): Promise<ApiResponse<Amenity[]>> {
    return safeCall(() => authFetch('/estate/resident/amenities'));
  },

  async bookAmenity(data: {
    amenityId: string;
    startsAt: string;
    endsAt: string;
  }): Promise<ApiResponse<AmenityBooking>> {
    return safeCall(() =>
      authFetch('/estate/resident/amenities/book', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async listMyAmenityBookings(): Promise<ApiResponse<AmenityBooking[]>> {
    return safeCall(() => authFetch('/estate/resident/amenity-bookings'));
  },

  async cancelMyAmenityBooking(bookingId: string): Promise<ApiResponse<AmenityBooking>> {
    return safeCall(() =>
      authFetch(`/estate/resident/amenity-bookings/${bookingId}/cancel`, { method: 'PATCH' })
    );
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

  async listMyEstateCommittee(): Promise<ApiResponse<CommitteeMember[]>> {
    return safeCall(() => authFetch('/estate/resident/committee'));
  },

  async listMyEstateGovernanceRecords(): Promise<ApiResponse<GovernanceRecord[]>> {
    return safeCall(() => authFetch('/estate/resident/governance'));
  },

  async signGovernanceRecord(
    recordId: string,
    signatureData: string
  ): Promise<ApiResponse<GovernanceRecord>> {
    return safeCall(() =>
      authFetch(`/estate/resident/governance/${recordId}/sign`, {
        method: 'POST',
        body: JSON.stringify({ signatureData }),
      })
    );
  },
};
