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

/** `gate` when a guard raised it because somebody arrived with nothing. */
export type VisitorPassSource = 'resident' | 'gate';

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
  createdAt: string;
}

export interface Gate {
  id: string;
  estateId: string;
  name: string;
  location?: string;
  createdAt: string;
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
