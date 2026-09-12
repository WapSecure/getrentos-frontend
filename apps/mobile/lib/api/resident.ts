import { apiFetch } from './client';

export type HouseholdStatus = 'active' | 'inactive';

export interface ResidentHousehold {
  id: string;
  unitLabel: string;
  residentName: string;
  contactPhone?: string;
  contactEmail?: string;
  status: HouseholdStatus;
  directoryOptIn: boolean;
  estate: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
}

export interface DirectoryEntry {
  id: string;
  unitLabel: string;
  residentName: string;
  contactPhone?: string;
  contactEmail?: string;
}

export type AnnouncementPriority = 'normal' | 'urgent';

export interface Announcement {
  id: string;
  estateId: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  createdAt: string;
  updatedAt: string;
}

export type ViolationCategory =
  | 'noise'
  | 'unauthorized_parking'
  | 'pet_violation'
  | 'property_maintenance'
  | 'other';

export type ViolationStatus = 'reported' | 'warning_issued' | 'resolved' | 'dismissed';

export interface Violation {
  id: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  category: ViolationCategory;
  description: string;
  status: ViolationStatus;
  warningIssuedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export type DeliveryLogStatus = 'received' | 'collected';

export interface DeliveryLog {
  id: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  courier?: string;
  recipientName?: string;
  status: DeliveryLogStatus;
  photoUrl?: string;
  gateId?: string;
  gateName?: string;
  receivedAt: string;
  collectedAt?: string;
  createdAt: string;
}

export type CommitteeTitle = 'president' | 'vice_president' | 'secretary' | 'treasurer' | 'member';

export interface CommitteeMember {
  id: string;
  estateId: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  title: CommitteeTitle;
  appointedAt: string;
}

export type PollStatus = 'open' | 'closed';

export interface PollOptionResult {
  id: string;
  label: string;
  voteCount: number;
}

export interface Poll {
  id: string;
  estateId: string;
  question: string;
  status: PollStatus;
  closesAt?: string;
  options: PollOptionResult[];
  totalVotes: number;
  myVote?: string;
  createdAt: string;
}

export type VisitorPassStatus = 'pending' | 'checked_in' | 'expired' | 'revoked';

export interface VisitorPass {
  id: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  visitorName: string;
  visitorPhone?: string;
  purpose?: string;
  status: VisitorPassStatus;
  expiresAt: string;
  checkedInAt?: string;
  createdAt: string;
}

export interface IssuedVisitorPass extends VisitorPass {
  pin: string;
  /** The pin encoded as a scannable QR code (data:image/png;base64,...). */
  qrDataUrl: string;
}

export interface Amenity {
  id: string;
  estateId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export type AmenityBookingStatus = 'confirmed' | 'cancelled';

export interface AmenityBooking {
  id: string;
  amenityId: string;
  amenityName: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  startsAt: string;
  endsAt: string;
  status: AmenityBookingStatus;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const residentApi = {
  getMyHousehold: () => apiFetch<ResidentHousehold>('/estate/resident/household'),

  setDirectoryOptIn: (optIn: boolean) =>
    apiFetch<ResidentHousehold>('/estate/resident/household/directory-opt-in', {
      method: 'PATCH',
      body: { optIn },
    }),

  getDirectory: () => apiFetch<DirectoryEntry[]>('/estate/resident/directory'),

  listAnnouncements: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<Announcement>>(
      `/estate/resident/announcements${toQuery({ page, pageSize })}`
    ),

  listViolations: () => apiFetch<Violation[]>('/estate/resident/violations'),

  listDeliveries: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<DeliveryLog>>(`/estate/resident/deliveries${toQuery({ page, pageSize })}`),

  listCommittee: () => apiFetch<CommitteeMember[]>('/estate/resident/committee'),

  listPolls: () => apiFetch<Poll[]>('/estate/resident/polls'),

  voteOnPoll: (pollId: string, optionId: string) =>
    apiFetch<Poll>(`/estate/resident/polls/${pollId}/vote`, { method: 'POST', body: { optionId } }),

  listVisitorPasses: (page = 1, pageSize = 50) =>
    apiFetch<Paginated<VisitorPass>>(
      `/estate/resident/visitor-passes${toQuery({ page, pageSize })}`
    ),

  issueVisitorPass: (data: {
    visitorName: string;
    visitorPhone?: string;
    purpose?: string;
    expiresAt?: string;
  }) =>
    apiFetch<IssuedVisitorPass>('/estate/resident/visitor-passes', { method: 'POST', body: data }),

  revokeVisitorPass: (passId: string) =>
    apiFetch<VisitorPass>(`/estate/resident/visitor-passes/${passId}/revoke`, { method: 'PATCH' }),

  listAmenities: () => apiFetch<Amenity[]>('/estate/resident/amenities'),

  bookAmenity: (data: { amenityId: string; startsAt: string; endsAt: string }) =>
    apiFetch<AmenityBooking>('/estate/resident/amenities/book', { method: 'POST', body: data }),

  listAmenityBookings: () => apiFetch<AmenityBooking[]>('/estate/resident/amenity-bookings'),

  cancelAmenityBooking: (bookingId: string) =>
    apiFetch<AmenityBooking>(`/estate/resident/amenity-bookings/${bookingId}/cancel`, {
      method: 'PATCH',
    }),
};
