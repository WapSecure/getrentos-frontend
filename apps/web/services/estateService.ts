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
  VehicleLog,
  VehicleLogPurpose,
  DeliveryLog,
  DeliveryLogStatus,
  Gate,
  Incident,
  MaintenanceTicket,
  Poll,
  Amenity,
  AmenityBooking,
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

  async linkResident(
    estateId: string,
    householdId: string,
    email: string
  ): Promise<ApiResponse<Household>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/households/${householdId}/resident`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    );
  },

  async unlinkResident(estateId: string, householdId: string): Promise<ApiResponse<Household>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/households/${householdId}/resident`, { method: 'DELETE' })
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
      isRecurring?: boolean;
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

  async logVehicleEntry(
    estateId: string,
    data: {
      plateNumber: string;
      vehicleDescription?: string;
      driverName?: string;
      purpose?: 'VISITOR' | 'RESIDENT' | 'DELIVERY' | 'STAFF' | 'OTHER';
      gateId?: string;
      photo?: File;
    }
  ): Promise<ApiResponse<VehicleLog>> {
    const formData = new FormData();
    formData.append('plateNumber', data.plateNumber);
    if (data.vehicleDescription) formData.append('vehicleDescription', data.vehicleDescription);
    if (data.driverName) formData.append('driverName', data.driverName);
    if (data.purpose) formData.append('purpose', data.purpose);
    if (data.gateId) formData.append('gateId', data.gateId);
    if (data.photo) formData.append('file', data.photo);
    return safeCall(() =>
      authFetch(`/estate/${estateId}/vehicle-logs`, { method: 'POST', body: formData })
    );
  },

  async listVehicleLogs(
    estateId: string,
    query: EstatePageQuery & { purpose?: VehicleLogPurpose; open?: boolean } = {}
  ): Promise<ApiResponse<Paginated<VehicleLog>>> {
    return safeCall(() =>
      authFetch(
        `/estate/${estateId}/vehicle-logs${toQuery({
          ...query,
          purpose: query.purpose?.toUpperCase(),
        })}`
      )
    );
  },

  async markVehicleExited(estateId: string, logId: string): Promise<ApiResponse<VehicleLog>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/vehicle-logs/${logId}/exit`, { method: 'PATCH' })
    );
  },

  async logDelivery(
    estateId: string,
    data: {
      householdId: string;
      courier?: string;
      recipientName?: string;
      gateId?: string;
      photo?: File;
    }
  ): Promise<ApiResponse<DeliveryLog>> {
    const formData = new FormData();
    formData.append('householdId', data.householdId);
    if (data.courier) formData.append('courier', data.courier);
    if (data.recipientName) formData.append('recipientName', data.recipientName);
    if (data.gateId) formData.append('gateId', data.gateId);
    if (data.photo) formData.append('file', data.photo);
    return safeCall(() =>
      authFetch(`/estate/${estateId}/deliveries`, { method: 'POST', body: formData })
    );
  },

  async listDeliveries(
    estateId: string,
    query: EstatePageQuery & { status?: DeliveryLogStatus } = {}
  ): Promise<ApiResponse<Paginated<DeliveryLog>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/deliveries${toQuery(query)}`));
  },

  async markDeliveryCollected(estateId: string, logId: string): Promise<ApiResponse<DeliveryLog>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/deliveries/${logId}/collect`, { method: 'PATCH' })
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

  async createGate(
    estateId: string,
    data: { name: string; location?: string }
  ): Promise<ApiResponse<Gate>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/gates`, { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async listGates(estateId: string): Promise<ApiResponse<Gate[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/gates`));
  },

  async deleteGate(estateId: string, gateId: string): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch(`/estate/${estateId}/gates/${gateId}`, { method: 'DELETE' }));
  },

  async createAnnouncement(
    estateId: string,
    data: {
      title: string;
      body: string;
      priority?: 'NORMAL' | 'URGENT';
      deliveryChannels?: ('SMS' | 'WHATSAPP')[];
    }
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

  async reportIncident(
    estateId: string,
    data: {
      description: string;
      category?: 'SECURITY' | 'MAINTENANCE' | 'SAFETY' | 'OTHER';
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      photo?: File;
    }
  ): Promise<ApiResponse<Incident>> {
    const formData = new FormData();
    formData.append('description', data.description);
    if (data.category) formData.append('category', data.category);
    if (data.priority) formData.append('priority', data.priority);
    if (data.photo) formData.append('file', data.photo);
    return safeCall(() =>
      authFetch(`/estate/${estateId}/incidents`, { method: 'POST', body: formData })
    );
  },

  async listIncidents(estateId: string, status?: string): Promise<ApiResponse<Incident[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/incidents${toQuery({ status })}`));
  },

  async resolveIncident(
    estateId: string,
    incidentId: string,
    resolutionNotes?: string
  ): Promise<ApiResponse<Incident>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/incidents/${incidentId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNotes }),
      })
    );
  },

  async dismissIncident(
    estateId: string,
    incidentId: string,
    resolutionNotes?: string
  ): Promise<ApiResponse<Incident>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/incidents/${incidentId}/dismiss`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNotes }),
      })
    );
  },

  async listMaintenanceTickets(
    estateId: string,
    status?: string
  ): Promise<ApiResponse<MaintenanceTicket[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/maintenance${toQuery({ status })}`));
  },

  async startMaintenanceTicket(
    estateId: string,
    ticketId: string
  ): Promise<ApiResponse<MaintenanceTicket>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/maintenance/${ticketId}/start`, { method: 'PATCH' })
    );
  },

  async resolveMaintenanceTicket(
    estateId: string,
    ticketId: string,
    resolutionNotes?: string
  ): Promise<ApiResponse<MaintenanceTicket>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/maintenance/${ticketId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNotes }),
      })
    );
  },

  async dismissMaintenanceTicket(
    estateId: string,
    ticketId: string,
    resolutionNotes?: string
  ): Promise<ApiResponse<MaintenanceTicket>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/maintenance/${ticketId}/dismiss`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNotes }),
      })
    );
  },

  async createPoll(
    estateId: string,
    data: { question: string; options: string[] }
  ): Promise<ApiResponse<Poll>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/polls`, { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async listPolls(estateId: string): Promise<ApiResponse<Poll[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/polls`));
  },

  async closePoll(estateId: string, pollId: string): Promise<ApiResponse<Poll>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/polls/${pollId}/close`, { method: 'PATCH' })
    );
  },

  async createAmenity(
    estateId: string,
    data: { name: string; description?: string }
  ): Promise<ApiResponse<Amenity>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/amenities`, { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async listAmenities(estateId: string): Promise<ApiResponse<Amenity[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/amenities`));
  },

  async deleteAmenity(estateId: string, amenityId: string): Promise<ApiResponse<void>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/amenities/${amenityId}`, { method: 'DELETE' })
    );
  },

  async listAmenityBookings(estateId: string): Promise<ApiResponse<AmenityBooking[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/amenity-bookings`));
  },

  async cancelAmenityBooking(
    estateId: string,
    bookingId: string
  ): Promise<ApiResponse<AmenityBooking>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/amenity-bookings/${bookingId}/cancel`, { method: 'PATCH' })
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
