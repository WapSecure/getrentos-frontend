import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';
import type { IssuedVisitorPass, VisitorPass } from './visitor-pass';

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

export type DueStatus = 'pending' | 'paid' | 'overdue' | 'processing';
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
  /** Whether the caller's own committee seat has already signed this record. */
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

/** What kind of emergency was declared. Drives the wording every resident is sent. */
export type EmergencyKind = 'FIRE' | 'GAS_LEAK' | 'STRUCTURAL' | 'SECURITY' | 'MEDICAL' | 'OTHER';

/**
 * `TIMED_OUT` is not a kind of closed: a roll nobody stood down has no all-clear
 * to report, so it keeps its own status and its own wording.
 */
export type MusterStatus = 'ACTIVE' | 'CLOSED' | 'TIMED_OUT';

/** Where one person is. `UNACCOUNTED` is where everybody starts. */
export type MusterRollState = 'UNACCOUNTED' | 'ACCOUNTED' | 'NOT_ON_SITE' | 'NEEDS_HELP';

/** What a resident may say about their own household. */
export type MusterSelfAnswer = 'ACCOUNTED' | 'NOT_ON_SITE' | 'NEEDS_HELP';

/** One name on a roll call, as this household is allowed to see it. */
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
  /** "13 people on the roll, 1 person accounted for, …" */
  tallyLabel: string;
}

/**
 * What a resident sees during an emergency: their own lines, and the estate's
 * numbers. Never the estate's roll — the names are not this household's to see.
 */
export interface ResidentEmergency {
  muster: ResidentMuster;
  myEntries: MusterRollEntry[];
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

  /**
   * Consents to a walk-in: someone is at the gate asking for this household and
   * the estate will not let them in until somebody who lives here says so.
   */
  approveWalkIn: (passId: string) =>
    apiFetch<VisitorPass>(`/estate/resident/visitor-passes/${passId}/approve`, {
      method: 'POST',
    }),

  /** Refuses a walk-in. The reason is carried through to the guard. */
  denyWalkIn: (passId: string, reason?: string) =>
    apiFetch<VisitorPass>(`/estate/resident/visitor-passes/${passId}/deny`, {
      method: 'POST',
      body: reason ? { reason } : {},
    }),

  listAmenities: () => apiFetch<Amenity[]>('/estate/resident/amenities'),

  bookAmenity: (data: { amenityId: string; startsAt: string; endsAt: string }) =>
    apiFetch<AmenityBooking>('/estate/resident/amenities/book', { method: 'POST', body: data }),

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
    // The create DTO validates against the raw (UPPERCASE) Prisma enum;
    // the read mapper lowercases it for display — same asymmetry the web
    // frontend's reportMaintenanceTicket already accounts for.
    if (data.category) form.append('category', data.category.toUpperCase());
    if (data.priority) form.append('priority', data.priority.toUpperCase());
    if (data.photo) appendFile(form, 'file', data.photo);
    return apiUpload<MaintenanceTicket>('/estate/resident/maintenance', form);
  },

  listDues: (page = 1, pageSize = 50) =>
    apiFetch<Paginated<Due>>(`/estate/resident/dues${toQuery({ page, pageSize })}`),

  payDue: (dueId: string) =>
    apiFetch<Due>(`/estate/resident/dues/${dueId}/pay`, { method: 'POST' }),

  listGovernanceRecords: () => apiFetch<GovernanceRecord[]>('/estate/resident/governance'),

  signGovernanceRecord: (recordId: string, signatureData: string) =>
    apiFetch<GovernanceRecord>(`/estate/resident/governance/${recordId}/sign`, {
      method: 'POST',
      body: { signatureData },
    }),

  /**
   * The roll call in progress, or null.
   *
   * Null is the ordinary answer, not an error: most of the time the estate is not
   * on fire. No household id is sent — the household is resolved from the
   * signed-in user, so there is nothing here to tamper with.
   *
   * Normalised to null here rather than at the call sites, because the handler
   * returns `null` and Nest sends that as an empty body, which `readJson` yields
   * as `undefined` — and react-query rejects an undefined query result outright,
   * so "nothing is happening" would render as a broken screen.
   */
  getEmergency: async (): Promise<ResidentEmergency | null> =>
    (await apiFetch<ResidentEmergency | null>('/estate/resident/emergency')) ?? null,

  /**
   * Answers for your own household.
   *
   * Moves this household's residents only: a visitor line stays with the marshal,
   * because the person the estate admitted is not necessarily the person holding
   * the phone.
   */
  answerRollCall: (data: { state: MusterSelfAnswer; stateNote?: string }) =>
    apiFetch<ResidentEmergency>('/estate/resident/emergency/answer', {
      method: 'POST',
      body: data,
    }),
};
