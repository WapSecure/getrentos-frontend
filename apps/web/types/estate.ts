import type { PlanTier } from '@getrentos/shared';

export interface Estate {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  gateCount: number | null;
  lateFeeAmount: number;
  /** Days a due may run past its due date before it is treated as late. */
  graceDays: number;
  householdCount: number;
  createdAt: string;
  /**
   * What this estate's subscription reaches — the ESTATE'S plan, not the
   * viewer's.
   *
   * An estate is entitled through its organisation's owner, so a manager on a
   * free personal plan still administers an Enterprise estate, and a manager on
   * Pro still cannot use Enterprise features on a free one. Any "is this paid
   * for?" badge in the estate console has to read this, and must treat an absent
   * value as UNKNOWN rather than FREE: hiding a feature the estate pays for is
   * worse than showing one that refuses with an upsell on submit.
   */
  planTier?: PlanTier;
}

export type HouseholdStatus = 'active' | 'inactive';

export interface Household {
  id: string;
  estateId: string;
  unitLabel: string;
  residentName: string;
  contactPhone?: string;
  contactEmail?: string;
  status: HouseholdStatus;
  residentUserId?: string;
  residentLinked: boolean;
  createdAt: string;
}

export interface ImportHouseholdError {
  row: number;
  unitLabel?: string;
  message: string;
}

export interface ImportHouseholdsResult {
  created: number;
  failed: number;
  errors: ImportHouseholdError[];
}

export interface EstateDashboardStats {
  totalHouseholds: number;
  duesCollectedThisMonth: number;
  duesOutstanding: number;
  openIncidents: number;
  openMaintenanceTickets: number;
  pendingViolations: number;
}

export interface EstateDuesPoint {
  label: string;
  value: number;
}

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
  /** Only set when payMyDue started a real Paystack checkout (Paystack configured). */
  authorizationUrl?: string;
  reference?: string;
}

export interface EstateFinancialStats {
  duesCollected: number;
  duesOutstanding: number;
  lateFeesCollected: number;
  householdsBilled: number;
}

export type EstateStatementStatus = 'DRAFT' | 'ISSUED';
export type EstateStatementPayoutStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface EstateStatementLineItem {
  id: string;
  label: string;
  amount: number;
}

export interface EstateStatement {
  id: string;
  periodStart: string;
  periodEnd: string;
  grossIncome: number;
  totalExpenses: number;
  managementFee: number;
  netPayout: number;
  status: EstateStatementStatus;
  payoutStatus: EstateStatementPayoutStatus;
  transferRef?: string;
  paidAt: string | null;
  generatedAt: string;
  issuedAt: string | null;
  lineItems?: EstateStatementLineItem[];
}

export interface EstatePayoutAccount {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  verified: boolean;
}

/**
 * `awaiting_approval` is a walk-in the gate raised and the household has not
 * answered; `approved` means they consented and the guard has not admitted them
 * yet. Consent and entry are kept apart on purpose, so the audit can show both
 * times and there is no arrival recorded for someone who walked away.
 */
export type VisitorPassStatus =
  | 'pending'
  | 'awaiting_approval'
  | 'approved'
  | 'checked_in'
  | 'checked_out'
  | 'expired'
  | 'revoked'
  | 'denied';

/**
 * `resident` when the household raised it; `gate` when a guard raised it
 * because somebody arrived with nothing; `contractor` when the estate office
 * authorised them to keep arriving, so the credential they used was not a pass
 * the household issued for one visit.
 */
export type VisitorPassSource = 'resident' | 'gate' | 'contractor';

export interface VisitorPass {
  id: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  visitorName: string;
  visitorPhone?: string;
  purpose?: string;
  status: VisitorPassStatus;
  source: VisitorPassSource;
  expiresAt: string;
  checkedInAt?: string;
  /** Set once the gate logs the visitor off the estate. */
  checkedOutAt?: string;
  /** When the household answered a walk-in request. */
  respondedAt?: string;
  /** Why they refused, so the guard can tell the visitor something. */
  denialReason?: string;
  /**
   * Set only on a write that screened somebody at a gate, and only when the
   * estate's list matched without refusing them.
   *
   * Absent on a pass read from the estate's records: that pass was not screened
   * at the moment somebody is looking at it, and a warning there would report a
   * check that never happened.
   */
  watchlistWarning?: string;
  createdAt: string;
}

export interface IssuedVisitorPass extends VisitorPass {
  pin: string;
  /** The pin encoded as a scannable QR code (data:image/png;base64,...). */
  qrDataUrl: string;
}

export interface StaffMember {
  userId: string;
  name: string;
  email: string;
  addedAt: string;
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

export type VehicleLogPurpose = 'visitor' | 'resident' | 'delivery' | 'staff' | 'other';

export interface VehicleLog {
  id: string;
  estateId: string;
  plateNumber: string;
  vehicleDescription?: string;
  driverName?: string;
  purpose: VehicleLogPurpose;
  photoUrl?: string;
  gateId?: string;
  gateName?: string;
  enteredAt: string;
  exitedAt?: string;
  /** Set only on the write that logged this vehicle — see `VisitorPass`. */
  watchlistWarning?: string;
  createdAt: string;
}

export interface Gate {
  id: string;
  estateId: string;
  name: string;
  location?: string;
  createdAt: string;
}

/** `PERSON` is recognised by name or phone; `VEHICLE` by registration. */
export type WatchlistSubjectType = 'PERSON' | 'VEHICLE';

/**
 * `BLOCK` refuses entry. `WATCH` admits the visitor but the estate wants to be
told, for somebody they would rather know about than exclude.
 */
export type WatchlistSeverity = 'BLOCK' | 'WATCH';

/**
 * Lifted entries stay on the list rather than being deleted, so the estate can
 * still answer "was this person on our list in March, and who decided that?" —
 * a question that gets asked precisely when something has gone wrong.
 */
export type WatchlistStatus = 'ACTIVE' | 'LIFTED';

/**
 * Which detail the match was found on.
 *
 * Not cosmetic: a plate or a phone number is an identifier, while a name is a
 * coincidence waiting to happen, and a guard looking at a real person is
 * entitled to know which one they are looking at before deciding.
 */
export type WatchlistMatchedOn = 'NAME' | 'PHONE' | 'PLATE';

export type ContractorPassStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

/**
 * A standing authorisation for somebody who arrives repeatedly.
 *
 * Not a kind of VisitorPass: that IS a visit — created, used once, closed. This
 * is a permission that outlives any single arrival, so the two answer different
 * questions. Every arrival here still records its own visitor pass, which is
 * what keeps "who is inside?" and check-out working unchanged.
 */
export interface ContractorPass {
  id: string;
  estateId: string;
  householdId: string;
  /** The unit they work for, when the authorisation names one. */
  householdLabel?: string | null;
  /** The person, not the firm — a company that rotates staff is re-authorised. */
  name: string;
  phone?: string | null;
  company?: string | null;
  trade?: string | null;
  status: ContractorPassStatus;
  /** Ready to render: Active / Withdrawn / Expired. */
  statusLabel: string;
  validFrom: string;
  validUntil: string;
  /** 0 = Sunday. Empty means every day. */
  daysOfWeek: number[];
  dailyFrom?: string | null;
  dailyTo?: string | null;
  /** "Monday and Thursday, 08:00-17:00, until 31 Dec 2026". */
  scheduleLabel: string;
  /**
   * Arrivals this authorisation has let in, ever.
   *
   * The number an estate actually reviews: a cleaner authorised for Tuesdays who
   * has been admitted forty times is the shape of problem this exists to show.
   */
  visitCount: number;
  createdAt: string;
  revokedAt?: string | null;
  revokeReason?: string | null;
}

/**
 * The one and only time the PIN is visible.
 *
 * Nothing can read it back afterwards, so there is no "show me the code again"
 * screen — the manager hands it over once, or withdraws the authorisation and
 * issues a new one.
 */
export interface IssuedContractorPass extends ContractorPass {
  pin: string;
  qrDataUrl: string;
}

export interface WatchlistEntry {
  id: string;
  estateId: string;
  subjectType: WatchlistSubjectType;
  severity: WatchlistSeverity;
  status: WatchlistStatus;
  label: string;
  phone?: string;
  plateNumber?: string;
  reason: string;
  photoUrl?: string;
  addedById: string;
  expiresAt?: string;
  liftedAt?: string;
  liftedById?: string;
  liftReason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * One entry a visitor or vehicle matched.
 *
 * `message` is written server-side and shown verbatim. It is the only place the
 * wording lives, so the gate console on either platform cannot drift into
 * saying something the estate did not.
 */
export interface WatchlistMatch {
  entryId: string;
  label: string;
  subjectType: WatchlistSubjectType;
  severity: WatchlistSeverity;
  reason: string;
  matchedOn: WatchlistMatchedOn;
  /** True when this match should refuse the entry, false when it only warns. */
  blocked: boolean;
  message: string;
}

/**
 * The result of screening somebody.
 *
 * Always the same shape whether or not anything matched, so a caller cannot
 * mistake "not screened" for "screened and clear" — only one of those means
 * anything.
 */
export interface WatchlistScreening {
  flagged: boolean;
  blocked: boolean;
  matches: WatchlistMatch[];
  /**
   * The refusal in words, when there is one to give.
   *
   * Undefined when nothing blocked — "nothing found" is better said plainly by
   * the caller than by a sentence that has to hedge about what it did not cover.
   */
  message?: string;
}

/**
 * What kind of emergency was declared.
 *
 * Drives the wording every resident is sent, which is why it is a fixed set
 * rather than free text: "gas leak" has to reach people as "a gas leak, leave by
 * the nearest exit", not depend on what a manager typed at 3am.
 */
export type EmergencyKind = 'FIRE' | 'GAS_LEAK' | 'STRUCTURAL' | 'SECURITY' | 'MEDICAL' | 'OTHER';

/**
 * `TIMED_OUT` is not a kind of closed.
 *
 * A roll nobody stood down has no all-clear to report — the estate stopped
 * asking, which is a different and less reassuring thing to tell people, so it
 * keeps its own status and its own wording.
 */
export type MusterStatus = 'ACTIVE' | 'CLOSED' | 'TIMED_OUT';

/** Where one person is. `UNACCOUNTED` is where everybody starts. */
export type MusterRollState = 'UNACCOUNTED' | 'ACCOUNTED' | 'NOT_ON_SITE' | 'NEEDS_HELP';

/**
 * One name on a roll call.
 *
 * `basisLabel` says why they are on the roll — a resident of the estate, or
 * somebody who was inside when the alarm was raised. A visitor admitted *after*
 * the roll was taken gets a third wording, because claiming they were here when
 * the alarm went is a claim about where a person physically was.
 */
export interface MusterRollEntry {
  id: string;
  householdId: string;
  /** The unit, so a marshal can walk the roll in order. */
  unitLabel: string;
  personName: string;
  basis: 'RESIDENT' | 'ON_SITE';
  basisLabel: string;
  visitorPassId?: string | null;
  admittedAt?: string | null;
  state: MusterRollState;
  /** Ready to render: Accounted for / Not yet accounted for / … */
  stateLabel: string;
  stateAt?: string | null;
  stateById?: string | null;
  stateNote?: string | null;
}

/**
 * The numbers at the top of the screen.
 *
 * Counted server-side and never derived here: the console, the resident app and
 * the notification people are sent must all print the same figures, and three
 * independent sums of the same roll is three chances to disagree.
 */
export interface MusterTally {
  total: number;
  accountedFor: number;
  notOnSite: number;
  needsHelp: number;
  unaccounted: number;
  /** True when every name has an answer, whatever the answer was. */
  settled: boolean;
}

export interface EmergencyMuster {
  id: string;
  estateId: string;
  kind: EmergencyKind;
  /** 'Fire' / 'Gas leak' — the heading. */
  kindLabel: string;
  description: string;
  assemblyPoint?: string | null;
  /** What residents were told to do, composed server-side. */
  assemblyInstruction: string;
  status: MusterStatus;
  /** 'In progress' / 'Closed' / 'Timed out'. */
  statusLabel: string;
  declaredAt: string;
  declaredById: string;
  closedAt?: string | null;
  closedById?: string | null;
  closingNote?: string | null;
  /** False once closed or timed out: the roll stops moving for a reason. */
  rollOpen: boolean;
  tally: MusterTally;
  /** "13 people on the roll, 1 person accounted for, …" */
  tallyLabel: string;
  roll: MusterRollEntry[];
}

/** A roll call as the history list shows it — no names, because a roll can be hundreds long. */
export interface MusterSummary {
  id: string;
  kind: EmergencyKind;
  kindLabel: string;
  description: string;
  status: MusterStatus;
  statusLabel: string;
  declaredAt: string;
  closedAt?: string | null;
  tally: MusterTally;
  tallyLabel: string;
}

/**
 * What a resident sees during an emergency: their own lines, and the estate's
 * numbers. Never the estate's roll — a list of names, units and who was home in
 * the middle of the night is the most sensitive thing this feature produces.
 */
export interface ResidentEmergency {
  muster: EmergencyMuster;
  myEntries: MusterRollEntry[];
}

/** What a resident may say about their own household. */
export type MusterSelfAnswer = 'ACCOUNTED' | 'NOT_ON_SITE' | 'NEEDS_HELP';

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

export type IncidentCategory = 'security' | 'maintenance' | 'safety' | 'other';
export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'dismissed';

export interface Incident {
  id: string;
  estateId: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  status: IncidentStatus;
  description: string;
  photoUrl?: string;
  resolutionNotes?: string;
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
  /** Resident-only: whether the caller's own committee seat has already signed this record. */
  signedByMe?: boolean;
  createdAt: string;
}

export interface GovernanceRecordSignature {
  id: string;
  committeeMemberId: string;
  unitLabel: string;
  residentName: string;
  title: CommitteeTitle;
  signedAt: string;
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

export interface EstateMicrositeSettings {
  slug: string;
  bio?: string;
  bannerUrl?: string;
  enabled: boolean;
}
