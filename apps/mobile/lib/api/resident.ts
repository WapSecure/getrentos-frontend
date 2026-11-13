import { apiFetch, apiUpload } from './client';
import { toQuery } from './query';
import { appendFile, type PickedFile } from './documents';
import type { IssuedVisitorPass, VisitorPass } from './visitor-pass';
import { providerQuery, type PaymentProvider } from './paymentStatus';

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

/** Labels are server-worded and rendered verbatim, so this screen cannot contradict the guard's refusal. */
export type ExpectedDeliveryStatus = 'AWAITING' | 'RECEIVED' | 'CANCELLED' | 'EXPIRED';

export interface ExpectedDelivery {
  id: string;
  courier: string;
  description?: string | null;
  status: ExpectedDeliveryStatus;
  statusLabel: string;
  live: boolean;
  expiresAt: string;
  summary: string;
  createdAt: string;
  receivedAt?: string | null;
  receivedAtGateName?: string | null;
  deliveryLogId?: string | null;
}

/** The only time the code exists outside the app: it is stored hashed and cannot be retrieved again. */
export interface IssuedExpectedDelivery extends ExpectedDelivery {
  /** The six digits to give the courier. Present only in this response. */
  code: string;
  guidance: string;
}

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
  /** Name of whoever took the parcel, if the gate recorded one. */
  collectedBy?: string;
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

export type {
  IssuedVisitorPass,
  VisitorPass,
  VisitorPassSource,
  VisitorPassStatus,
} from './visitor-pass';

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

export type MaintenanceTicketCategory =
  | 'plumbing'
  | 'electrical'
  | 'structural'
  | 'common_area'
  | 'other';

export type MaintenanceTicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceTicketStatus = 'open' | 'in_progress' | 'resolved' | 'dismissed';

export interface MaintenanceTicket {
  id: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  category: MaintenanceTicketCategory;
  priority: MaintenanceTicketPriority;
  status: MaintenanceTicketStatus;
  description: string;
  photoUrl?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export type DueStatus = 'pending' | 'paid' | 'overdue' | 'processing' | 'waived';
export type DueCategory = 'rent' | 'service_charge' | 'deposit' | 'levy';
export type BillingCycle = 'monthly' | 'quarterly' | 'annual';

export interface Due {
  id: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: DueStatus;
  lateFeeApplied: number;
  category: DueCategory;
  billingCycle: BillingCycle;
  description?: string;
  isRecurring: boolean;
  createdAt: string;
  /** Only set when payDue started a real Paystack checkout (Paystack configured). */
  authorizationUrl?: string;
  reference?: string;
}

export type GovernanceRecordType = 'bylaws' | 'meeting_minutes' | 'other';
export type GovernanceRecordStatus = 'published' | 'pending_signatures' | 'approved';

export interface SignatureProgress {
  signed: number;
  total: number;
}

export interface GovernanceRecord {
  id: string;
  estateId: string;
  type: GovernanceRecordType;
  title: string;
  meetingDate?: string;
  size: string;
  url: string;
  version: number;
  rootId?: string;
  requiresSignatures: boolean;
  status: GovernanceRecordStatus;
  signatureProgress?: SignatureProgress;
  signedByMe?: boolean;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type EmergencyKind = 'FIRE' | 'GAS_LEAK' | 'STRUCTURAL' | 'SECURITY' | 'MEDICAL' | 'OTHER';

/** `TIMED_OUT` is not a kind of closed: a roll nobody stood down has no all-clear to report. */
export type MusterStatus = 'ACTIVE' | 'CLOSED' | 'TIMED_OUT';

/** `UNACCOUNTED` is where everybody starts. */
export type MusterRollState = 'UNACCOUNTED' | 'ACCOUNTED' | 'NOT_ON_SITE' | 'NEEDS_HELP';

export type MusterSelfAnswer = 'ACCOUNTED' | 'NOT_ON_SITE' | 'NEEDS_HELP';

export interface MusterRollEntry {
  id: string;
  householdId: string;
  unitLabel: string;
  personName: string;
  basis: 'RESIDENT' | 'ON_SITE';
  basisLabel: string;
  state: MusterRollState;
  stateLabel: string;
  stateAt?: string | null;
  stateNote?: string | null;
}

/** Counted server-side, so the phone and the estate office cannot disagree. */
export interface MusterTally {
  total: number;
  accountedFor: number;
  notOnSite: number;
  needsHelp: number;
  unaccounted: number;
  settled: boolean;
}

export interface ResidentMuster {
  id: string;
  kind: EmergencyKind;
  kindLabel: string;
  description: string;
  assemblyPoint?: string | null;
  /** What residents were told to do, composed server-side. */
  assemblyInstruction: string;
  status: MusterStatus;
  statusLabel: string;
  declaredAt: string;
  tally: MusterTally;
  tallyLabel: string;
}

/** Never the estate's roll: the names are not this household's to see. */
export interface ResidentEmergency {
  muster: ResidentMuster;
  myEntries: MusterRollEntry[];
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

  /** The reply is the only time the code exists, so the caller must show it before the response is dropped. */
  declareExpectedDelivery: (data: { courier: string; description?: string }) =>
    apiFetch<IssuedExpectedDelivery>('/estate/resident/deliveries/expected', {
      method: 'POST',
      body: data,
    }),

  listExpectedDeliveries: () =>
    apiFetch<ExpectedDelivery[]>('/estate/resident/deliveries/expected'),

  cancelExpectedDelivery: (expectedDeliveryId: string) =>
    apiFetch<ExpectedDelivery>(
      `/estate/resident/deliveries/expected/${expectedDeliveryId}/cancel`,
      {
        method: 'PATCH',
        body: {},
      }
    ),

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

  approveWalkIn: (passId: string) =>
    apiFetch<VisitorPass>(`/estate/resident/visitor-passes/${passId}/approve`, {
      method: 'POST',
    }),

  /** The reason is carried through to the guard. */
  denyWalkIn: (passId: string, reason?: string) =>
    apiFetch<VisitorPass>(`/estate/resident/visitor-passes/${passId}/deny`, {
      method: 'POST',
      body: reason ? { reason } : {},
    }),

  listAmenities: () => apiFetch<Amenity[]>('/estate/resident/amenities'),

  bookAmenity: (data: { amenityId: string; startsAt: string; endsAt: string }) =>
    apiFetch<AmenityBooking>('/estate/resident/amenities/book', { method: 'POST', body: data }),

  listAmenityBusy: (amenityId: string) =>
    apiFetch<{ startsAt: string; endsAt: string }[]>(
      `/estate/resident/amenities/${amenityId}/busy`
    ),

  listAmenityBookings: () => apiFetch<AmenityBooking[]>('/estate/resident/amenity-bookings'),

  cancelAmenityBooking: (bookingId: string) =>
    apiFetch<AmenityBooking>(`/estate/resident/amenity-bookings/${bookingId}/cancel`, {
      method: 'PATCH',
    }),

  listMaintenanceTickets: () => apiFetch<MaintenanceTicket[]>('/estate/resident/maintenance'),

  reportMaintenanceTicket: (data: {
    description: string;
    category?: MaintenanceTicketCategory;
    priority?: MaintenanceTicketPriority;
    photo?: PickedFile;
  }) => {
    const form = new FormData();
    form.append('description', data.description);
    // The create DTO validates against the raw UPPERCASE enum; the read mapper lowercases it.
    if (data.category) form.append('category', data.category.toUpperCase());
    if (data.priority) form.append('priority', data.priority.toUpperCase());
    if (data.photo) appendFile(form, 'file', data.photo);
    return apiUpload<MaintenanceTicket>('/estate/resident/maintenance', form);
  },

  listDues: (page = 1, pageSize = 50) =>
    apiFetch<Paginated<Due>>(`/estate/resident/dues${toQuery({ page, pageSize })}`),

  payDue: (dueId: string, provider?: PaymentProvider) =>
    apiFetch<Due>(`/estate/resident/dues/${dueId}/pay${providerQuery(provider)}`, {
      method: 'POST',
    }),

  listGovernanceRecords: () => apiFetch<GovernanceRecord[]>('/estate/resident/governance'),

  signGovernanceRecord: (recordId: string, signatureData: string) =>
    apiFetch<GovernanceRecord>(`/estate/resident/governance/${recordId}/sign`, {
      method: 'POST',
      body: { signatureData },
    }),

  /** Null is the ordinary answer. Normalised here because Nest sends `null` as an empty body, read as `undefined`, which react-query rejects. */
  getEmergency: async (): Promise<ResidentEmergency | null> =>
    (await apiFetch<ResidentEmergency | null>('/estate/resident/emergency')) ?? null,

  /** Moves this household's residents only: a visitor line stays with the marshal. */
  answerRollCall: (data: { state: MusterSelfAnswer; stateNote?: string }) =>
    apiFetch<ResidentEmergency>('/estate/resident/emergency/answer', {
      method: 'POST',
      body: data,
    }),
};
