export interface Estate {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  gateCount: number | null;
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
  category: DueCategory;
  billingCycle: BillingCycle;
  description?: string;
  isRecurring: boolean;
  createdAt: string;
  /** Only set when payMyDue started a real Paystack checkout (Paystack configured). */
  authorizationUrl?: string;
  reference?: string;
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

export type GovernanceRecordType = 'bylaws' | 'meeting_minutes' | 'other';

export interface GovernanceRecord {
  id: string;
  estateId: string;
  type: GovernanceRecordType;
  title: string;
  meetingDate?: string;
  size: string;
  url: string;
  createdAt: string;
}
