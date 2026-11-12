import type { PlanTier, VisitorIdDocumentType } from '@sureground/shared';

export interface Estate {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  /** The Google place the address was checked against; absent for a typed address. */
  placeId?: string | null;
  addressVerifiedAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  gateCount: number | null;
  lateFeeAmount: number;
  /** Days a due may run past its due date before it is treated as late. */
  graceDays: number;
  householdCount: number;
  createdAt: string;
  /**
   * The estate's plan, not the viewer's. Treat an absent value as UNKNOWN, never FREE: hiding a
   * paid feature is worse than an upsell on submit.
   */
  planTier?: PlanTier;
  /** Only the viewer's own estate list carries it. */
  capacity?: 'MANAGER' | 'GATE';
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
  /** Only set when payMyDue started a real Paystack checkout. */
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
/** See `OwnerStatementPayoutStatus`: the two held states are not failures. */
export type EstateStatementPayoutStatus =
  | 'PENDING'
  | 'AWAITING_APPROVAL'
  | 'PAID'
  | 'FAILED'
  | 'REJECTED';

export interface EstateStatementRelease {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
  thresholdAtRequest: number;
}

/** Only the organisation's owner may raise one; the firm gets a reply route, never a verdict. */
export interface EstateStatementLineDispute {
  id: string;
  statementId: string;
  lineId: string;
  lineLabel: string;
  lineAmount: number;
  reason: string;
  status: 'OPEN' | 'UPHELD' | 'REJECTED' | 'WITHDRAWN';
  raisedById: string;
  raisedByName: string | null;
  raisedByMe: boolean;
  firmResponse: string | null;
  firmRespondedByName: string | null;
  firmRespondedAt: string | null;
  resolvedByName: string | null;
  resolvedAt: string | null;
  outcomeNote: string | null;
  adjustmentEntryId: string | null;
  createdAt: string;
  moneyEffect: 'HELD' | 'IN_FLIGHT' | 'PAID' | 'NONE';
}

export interface EstateStatementDisputeSummary {
  openCount: number;
  totalCount: number;
  moneyEffect: 'HELD' | 'IN_FLIGHT' | 'PAID' | 'NONE';
  reason: string | null;
}

export interface EstateStatementLineItem {
  id: string;
  label: string;
  amount: number; /**
   * Cites the ledger movement and document the line renders; null on lines written
   * before the ledger was the source of truth.
   */
  ledgerEntryId?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  sourceDetail?: string | null;
  propertyId?: string | null;
}

export interface EstateStatement {
  id: string;
  periodStart: string;
  periodEnd: string;
  grossIncome: number;
  totalExpenses: number;
  managementFee: number;
  /** Charged on top of the fee and held for the tax authority, not earned. */
  vatAmount: number;
  /** Charged apart from the expense it applies to, so expenses still add up. */
  maintenanceMarkup: number;
  /** Withheld from the manager. Disclosed to the owner, never deducted from the payout. */
  whtAmount: number;
  netPayout: number;
  status: EstateStatementStatus;
  payoutStatus: EstateStatementPayoutStatus;
  transferRef?: string;
  /** Detail response only. */
  release?: EstateStatementRelease | null;
  /** Newest first. Detail only. */
  disputes?: EstateStatementLineDispute[];
  disputeSummary?: EstateStatementDisputeSummary | null;
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
  /** CAC registration number + class of the estate's organisation, if given. */
  registrationNumber?: string | null;
  businessType?: 'BUSINESS_NAME' | 'LIMITED_COMPANY' | 'INCORPORATED_TRUSTEES' | null;
  /** Not sent by the API yet; shown once it is. */
  payoutHoldUntil?: string | null;
}

/**
 * `awaiting_approval`: the household has not answered; `approved`: consented but not yet admitted.
 * Consent and entry are kept apart on purpose for the audit.
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
 * `contractor` means a standing authorisation from the estate office, not a pass the household
 * issued.
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
  checkedOutAt?: string;
  respondedAt?: string;
  denialReason?: string;
  /**
   * Only on a write that screened somebody at a gate and matched without refusing; absent on passes
   * read from records.
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
  /** Name of whoever took the parcel, if the gate recorded one. */
  collectedBy?: string;
  createdAt: string;
}

export type ExpectedDeliveryStatus = 'AWAITING' | 'RECEIVED' | 'CANCELLED' | 'EXPIRED';

/**
 * Every label is written server-side and rendered verbatim, so the resident and guard read the same
 * rule.
 */
export interface ExpectedDelivery {
  id: string;
  courier: string;
  description?: string | null;
  status: ExpectedDeliveryStatus;
  statusLabel: string;
  /** Whether the code can still be presented at the gate. */
  live: boolean;
  expiresAt: string;
  summary: string;
  createdAt: string;
  /** Set when it was handed over. */
  receivedAt?: string | null;
  receivedAtGateName?: string | null;
  deliveryLogId?: string | null;
}

/**
 * The only place the code ever exists: it is not stored in plaintext and cannot be asked for again.
 */
export interface IssuedExpectedDelivery extends ExpectedDelivery {
  /** Present only in this response. */
  code: string;
  /** Worded server-side. */
  guidance: string;
}

/**
 * No reason field on purpose: distinguishing "no such code" from "expired" would reveal whether a
 * household exists.
 */
export interface DeliveryCodeScreen {
  matched: boolean;
  householdId?: string;
  unitLabel?: string;
  residentName?: string;
  courier?: string;
  description?: string | null;
  expiresAt?: string;
  declaredAt?: string;
  message: string;
  instruction: string;
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

/** `BLOCK` refuses entry. `WATCH` admits the visitor but tells the estate. */
export type WatchlistSeverity = 'BLOCK' | 'WATCH';

/**
 * Lifted entries stay on the list rather than being deleted, so past decisions can still be
 * audited.
 */
export type WatchlistStatus = 'ACTIVE' | 'LIFTED';

/**
 * A plate or phone is an identifier, a name is a coincidence; the guard needs to know which
 * matched.
 */
export type WatchlistMatchedOn = 'NAME' | 'PHONE' | 'PLATE';

export type ContractorPassStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

/**
 * A standing permission, not a VisitorPass; every arrival still records its own pass so "who is
 * inside?" and check-out keep working.
 */
export interface ContractorPass {
  id: string;
  estateId: string;
  householdId: string;
  householdLabel?: string | null;
  /** The person, not the firm: a company that rotates staff is re-authorised. */
  name: string;
  phone?: string | null;
  company?: string | null;
  trade?: string | null;
  status: ContractorPassStatus;
  statusLabel: string;
  validFrom: string;
  validUntil: string;
  /** 0 = Sunday. Empty means every day. */
  daysOfWeek: number[];
  dailyFrom?: string | null;
  dailyTo?: string | null;
  scheduleLabel: string;
  /** Arrivals this authorisation has ever let in. */
  visitCount: number;
  createdAt: string;
  revokedAt?: string | null;
  revokeReason?: string | null;
}

/** The only time the PIN is visible; nothing can read it back. */
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
 * `message` is written server-side and shown verbatim, so neither platform's gate console can
 * drift.
 */
export interface WatchlistMatch {
  entryId: string;
  label: string;
  subjectType: WatchlistSubjectType;
  severity: WatchlistSeverity;
  reason: string;
  matchedOn: WatchlistMatchedOn;
  blocked: boolean;
  message: string;
}

/**
 * Always the same shape whether or not anything matched, so "not screened" is never mistaken for
 * "clear".
 */
export interface WatchlistScreening {
  flagged: boolean;
  blocked: boolean;
  matches: WatchlistMatch[];
  /** Undefined when nothing blocked. */
  message?: string;
}

/** A fixed set because it drives the wording every resident is sent. */
export type EmergencyKind = 'FIRE' | 'GAS_LEAK' | 'STRUCTURAL' | 'SECURITY' | 'MEDICAL' | 'OTHER';

/** `TIMED_OUT` is not a kind of closed: it keeps its own status and wording. */
export type MusterStatus = 'ACTIVE' | 'CLOSED' | 'TIMED_OUT';

/** `UNACCOUNTED` is where everybody starts. */
export type MusterRollState = 'UNACCOUNTED' | 'ACCOUNTED' | 'NOT_ON_SITE' | 'NEEDS_HELP';

/** `basisLabel` says why they are on the roll, worded server-side. */
export interface MusterRollEntry {
  id: string;
  householdId: string;
  unitLabel: string;
  personName: string;
  basis: 'RESIDENT' | 'ON_SITE';
  basisLabel: string;
  visitorPassId?: string | null;
  admittedAt?: string | null;
  state: MusterRollState;
  stateLabel: string;
  stateAt?: string | null;
  stateById?: string | null;
  stateNote?: string | null;
}

/** Counted server-side; never derive these here, so every surface prints the same figures. */
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
  kindLabel: string;
  description: string;
  assemblyPoint?: string | null;
  /** Composed server-side. */
  assemblyInstruction: string;
  status: MusterStatus;
  statusLabel: string;
  declaredAt: string;
  declaredById: string;
  closedAt?: string | null;
  closedById?: string | null;
  closingNote?: string | null;
  /** False once closed or timed out. */
  rollOpen: boolean;
  tally: MusterTally;
  tallyLabel: string;
  roll: MusterRollEntry[];
}

/** No names: a roll can be hundreds long. */
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
 * Never the estate's roll: the list of names and who was home is the most sensitive thing this
 * feature produces.
 */
export interface ResidentEmergency {
  muster: EmergencyMuster;
  myEntries: MusterRollEntry[];
}

export type MusterSelfAnswer = 'ACCOUNTED' | 'NOT_ON_SITE' | 'NEEDS_HELP';

/** `NONE` is the ordinary case, not a fault: only a standing authorisation's hours state an end. */
export type ExpectedOutSource = 'AUTHORISED_WINDOW' | 'NONE';

/**
 * `insideLabel` and `expectationLabel` are composed server-side and shown verbatim; do not rebuild
 * them.
 */
export interface OnSiteEntry {
  passId: string;
  visitorName: string;
  source: 'RESIDENT' | 'GATE' | 'CONTRACTOR';
  sourceLabel: string;
  householdId: string;
  unitLabel: string;
  gateName?: string | null;
  contractorPassId?: string | null;
  authorisationName?: string | null;
  admittedAt: string;
  minutesInside: number;
  insideLabel: string;
  expectedOutAt?: string | null;
  expectedOutSource: ExpectedOutSource;
  expectationLabel: string;
  minutesOver: number;
  /** Past the authorised end by more than the grace period. */
  overstaying: boolean;
  /** So the screen can say the alert has already gone. */
  reportedAt?: string | null;
}

export interface OnSiteTally {
  open: number;
  overstaying: number;
  oldestMinutes: number | null;
  label: string;
}

export interface OnSiteBoard {
  estateId: string;
  /** The instant every elapsed time on the board is measured to. */
  asOf: string;
  /** The grace period the sweep applies, so the screen can state the rule. */
  graceMinutes: number;
  tally: OnSiteTally;
  entries: OnSiteEntry[];
}

export interface AuthorisationDwell {
  contractorPassId: string;
  name: string;
  company?: string | null;
  trade?: string | null;
  householdLabel?: string | null;
  status: ContractorPassStatus;
  statusLabel: string;
  scheduleLabel: string;
  visits: number;
  completed: number;
  /** Still recorded as inside: the number a completed average hides. */
  openVisits: number;
  overstays: number;
  /** Mean dwell over COMPLETED visits only; null when none finished. */
  averageMinutes: number | null;
  longestMinutes: number | null;
  totalMinutes: number;
  firstVisitAt?: string | null;
  lastVisitAt?: string | null;
  summaryLabel: string;
}

export interface AuthorisationDwellReport {
  estateId: string;
  from: string;
  /** Exclusive, so adjacent periods never double-count a visit. */
  to: string;
  graceMinutes: number;
  authorisations: AuthorisationDwell[];
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

/** Deliberately no code on this type: it is returned only once, when minted or re-issued. */
export interface PatrolCheckpoint {
  id: string;
  name: string;
  location?: string | null;
  active: boolean;
  /** So retiring one can warn. */
  routeCount: number;
  /** Retiring keeps these. */
  scanCount: number;
  createdAt: string;
}

/** The only moment the code exists in readable form; `guidance` is worded server-side. */
export interface IssuedPatrolCheckpoint extends PatrolCheckpoint {
  code: string;
  guidance: string;
}

/** `position` is the intended order. */
export interface PatrolRouteCheckpoint {
  id: string;
  name: string;
  location?: string | null;
  position: number;
  active: boolean;
}

export interface PatrolRoute {
  id: string;
  name: string;
  /** 0 = Sunday. Empty means every day. */
  daysOfWeek: number[];
  /** 'HH:MM' local, on the estate's own clock. */
  startTime: string;
  windowMinutes: number;
  active: boolean;
  checkpoints: PatrolRouteCheckpoint[];
  /** Rendered verbatim. */
  scheduleLabel: string;
  createdAt: string;
}

export type PatrolRoundStatus = 'OPEN' | 'COMPLETE' | 'MISSED';

export interface PatrolScan {
  id: string;
  checkpointId: string;
  checkpointName: string;
  expectedPosition: number | null;
  scannedAt: string;
  scannedBy: string;
  /** Recorded, not refused. */
  late: boolean;
}

/**
 * A round is a row, not inferred from scans, so a night nobody walked still shows. `expected` and
 * `missing` use the roster frozen when the round opened.
 */
export interface PatrolRound {
  id: string;
  routeId: string;
  routeName: string;
  scheduledFor: string;
  windowEndsAt: string;
  status: PatrolRoundStatus;
  statusLabel: string;
  expected: number;
  scanned: number;
  missing: { id: string; name: string; position: number | null }[];
  late: number;
  inOrder: boolean;
  scans: PatrolScan[];
  /** Null means it never happened. */
  reportedAt?: string | null;
}

export interface PatrolReport {
  estateId: string;
  asOf: string;
  from: string;
  to: string;
  rounds: PatrolRound[];
  tally: {
    closed: number;
    walked: number;
    missed: number;
    open: number;
    missedScans: number;
    label: string;
  };
}

/** Every failure shares one sentence, so codes cannot be tried to map patrol points. */
export interface PatrolScanResult {
  accepted: boolean;
  checkpointId?: string;
  checkpointName?: string;
  position?: number;
  total?: number;
  routeName?: string;
  roundId?: string;
  scheduledFor?: string;
  scannedAt?: string;
  /** True when this scan arrived after the window closed but was still recorded. */
  late?: boolean;
  alreadyScanned?: boolean;
  message: string;
  instruction: string;
}

/**
 * `deadlineToday` is computed against the estate's own day; the PIN, not this row, admits anybody.
 */
export interface ExpectedVisitor {
  id: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  visitorName: string;
  visitorPhone?: string | null;
  purpose?: string | null;
  deadline: string;
  /** Server-worded. */
  deadlineLabel: string;
  deadlineToday: boolean;
  source: 'RESIDENT' | 'GATE' | 'CONTRACTOR' | 'IMPORT';
  sourceLabel: string;
}

export interface ExpectedContractor {
  id: string;
  name: string;
  company?: string | null;
  trade?: string | null;
  householdId?: string | null;
  unitLabel?: string | null;
  hoursLabel: string;
  deadline: string;
  deadlineLabel: string;
  deadlineToday: boolean;
  daysLabel: string;
}

export interface ExpectedParcel {
  id: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  courier: string;
  description?: string | null;
  deadline: string;
  deadlineLabel: string;
  deadlineToday: boolean;
}

/** A hint board: the pass PIN remains the only thing that admits anybody. */
export interface ExpectedToday {
  estateId: string;
  asOf: string;
  visitors: ExpectedVisitor[];
  contractors: ExpectedContractor[];
  parcels: ExpectedParcel[];
  tally: {
    visitors: number;
    contractors: number;
    parcels: number;
    byEndOfToday: number;
    label: string;
  };
}

/**
 * `documentUrl` is short-lived, and absent when this caller may not see the document. Fetched for
 * one pass at a time, never in a list.
 */
export interface VisitorIdCheck {
  id: string;
  visitorPassId: string;
  documentType: VisitorIdDocumentType;
  documentTypeLabel: string;
  checkedAt: string;
  checkedById: string;
  checkedByName?: string | null;
  sizeBytes: number;
  mimeType: string;
  documentUrl?: string;
  documentWithheld?: boolean;
  notice?: string;
}

/** Numbered like the spreadsheet. */
export interface GuestListImportError {
  row: number;
  visitorName?: string;
  message: string;
}

/** Per row, never all-or-nothing. */
export interface GuestListImportResult {
  created: number;
  failed: number;
  errors: GuestListImportError[];
  label: string;
  expiresAt: string;
  deadlineLabel: string;
}
