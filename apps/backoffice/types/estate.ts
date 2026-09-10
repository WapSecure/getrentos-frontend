// ---- Estate/community enums ----
export type HouseholdStatus = 'ACTIVE' | 'INACTIVE';
export type DueStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PROCESSING';
export type EstateIncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
export type EstateIncidentCategory = 'SECURITY' | 'MAINTENANCE' | 'SAFETY' | 'OTHER';
export type EstateIncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type EstateMaintenanceCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'STRUCTURAL'
  | 'COMMON_AREA'
  | 'OTHER';
export type EstateMaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type EstateMaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
export type EstatePollStatus = 'OPEN' | 'CLOSED';
export type EstateAnnouncementPriority = 'NORMAL' | 'URGENT';
export type OrgRole = 'OWNER' | 'STAFF' | 'ACCOUNTANT';
export type WorkspaceRole = 'GATEMAN' | 'RESIDENT';
export type GovernanceRecordType = 'BYLAWS' | 'MEETING_MINUTES' | 'OTHER';
export type GovernanceRecordStatus = 'PUBLISHED' | 'PENDING_SIGNATURES' | 'APPROVED';

// ---- Overview ----
export interface AdminEstateOverview {
  estateOrganizationCount: number;
  totalEstates: number;
  totalHouseholds: number;
  activeHouseholds: number;
  residentLinkedHouseholds: number;
  collectedDueAmount: number;
  outstandingDueAmount: number;
  overdueDueCount: number;
  openIncidentCount: number;
  openMaintenanceCount: number;
  openPollCount: number;
  activeMicrositeCount: number;
}

// ---- Register row + detail ----
export interface AdminEstate {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  gateCount: number | null;
  organizationId: string;
  organizationName: string;
  managerId: string;
  managerName: string;
  managerEmail?: string;
  householdCount: number;
  residentLinkedHouseholds: number;
  activeHouseholds: number;
  collectedDueAmount: number;
  outstandingDueAmount: number;
  overdueDueCount: number;
  openIncidentCount: number;
  openMaintenanceCount: number;
  micrositeSlug?: string;
  micrositeEnabled: boolean;
  createdAt: string;
}

export interface AdminEstateManager {
  id: string;
  legalName: string;
  email?: string;
}

export interface AdminEstateOrganization {
  id: string;
  name: string;
  manager: AdminEstateManager;
  staffCount: number;
}

export interface AdminEstateHousehold {
  id: string;
  unitLabel: string;
  residentName: string;
  contactPhone?: string;
  contactEmail?: string;
  status: HouseholdStatus;
  residentUserId?: string;
  residentLinked: boolean;
  directoryOptIn: boolean;
  createdAt: string;
}

export interface AdminEstateIncident {
  id: string;
  category: EstateIncidentCategory;
  priority: EstateIncidentPriority;
  status: EstateIncidentStatus;
  description: string;
  createdAt: string;
}

export interface AdminEstateMaintenance {
  id: string;
  unitLabel?: string;
  category: EstateMaintenanceCategory;
  priority: EstateMaintenancePriority;
  status: EstateMaintenanceStatus;
  description: string;
  createdAt: string;
}

export interface AdminEstateAnnouncement {
  id: string;
  title: string;
  priority: EstateAnnouncementPriority;
  createdAt: string;
}

export interface AdminEstatePoll {
  id: string;
  question: string;
  status: EstatePollStatus;
  closesAt?: string;
  voteCount: number;
  createdAt: string;
}

export interface AdminEstateDue {
  id: string;
  unitLabel?: string;
  amount: number;
  status: DueStatus;
  dueDate: string;
  paidDate?: string;
  createdAt: string;
}

export interface AdminEstateMicrosite {
  slug: string;
  bio?: string;
  enabled: boolean;
  bannerKey?: string;
}

export interface AdminEstateDueSummary {
  collectedAmount: number;
  outstandingAmount: number;
  overdueCount: number;
  totalCount: number;
}

export interface AdminEstateDetail {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  gateCount: number | null;
  createdAt: string;
  organization?: AdminEstateOrganization;
  householdCount: number;
  residentLinkedHouseholds: number;
  activeHouseholds: number;
  dueSummary?: AdminEstateDueSummary;
  openIncidentCount: number;
  openMaintenanceCount: number;
  microsite?: AdminEstateMicrosite;
  households: AdminEstateHousehold[];
  recentIncidents: AdminEstateIncident[];
  recentMaintenance: AdminEstateMaintenance[];
  recentAnnouncements: AdminEstateAnnouncement[];
  openPolls: AdminEstatePoll[];
  recentDues: AdminEstateDue[];
}

// ---- Community-ops queue rows ----
export interface AdminEstateHouseholdQueue {
  id: string;
  estateId: string;
  estateName: string;
  estateCity: string;
  estateState: string;
  unitLabel: string;
  residentName: string;
  contactPhone?: string;
  contactEmail?: string;
  status: HouseholdStatus;
  residentUserId?: string;
  residentLinked: boolean;
  directoryOptIn: boolean;
  createdAt: string;
}

export interface AdminEstateDueQueue {
  id: string;
  estateId: string;
  estateName: string;
  householdId: string;
  unitLabel?: string;
  residentName: string;
  amount: number;
  status: DueStatus;
  category?: string;
  billingCycle?: string;
  description?: string;
  dueDate: string;
  paidDate?: string;
  isRecurring: boolean;
  createdAt: string;
}

export interface AdminEstateIncidentQueue {
  id: string;
  estateId: string;
  estateName: string;
  category: EstateIncidentCategory;
  priority: EstateIncidentPriority;
  status: EstateIncidentStatus;
  description: string;
  reportedById?: string;
  reportedByName?: string;
  createdAt: string;
}

export interface AdminEstateMaintenanceQueue {
  id: string;
  estateId: string;
  estateName: string;
  householdId?: string;
  unitLabel?: string;
  category: EstateMaintenanceCategory;
  priority: EstateMaintenancePriority;
  status: EstateMaintenanceStatus;
  description: string;
  reportedById?: string;
  reportedByName?: string;
  createdAt: string;
}

export interface AdminEstatePollQueue {
  id: string;
  estateId: string;
  estateName: string;
  question: string;
  status: EstatePollStatus;
  closesAt?: string;
  createdById?: string;
  createdByName?: string;
  voteCount: number;
  createdAt: string;
}

export interface AdminEstateAnnouncementQueue {
  id: string;
  estateId: string;
  estateName: string;
  title: string;
  body?: string;
  priority?: EstateAnnouncementPriority;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
}

// ---- Access register + governance ----
export interface AdminEstateAccessEstate {
  id: string;
  name: string;
  city: string;
  state: string;
}

export interface AdminEstateStaffMember {
  id: string;
  userId: string;
  legalName: string;
  email?: string;
  organizationId: string;
  organizationName: string;
  orgRole: OrgRole;
  workspaceRole?: WorkspaceRole;
  estates: AdminEstateAccessEstate[];
  createdAt: string;
}

export interface AdminEstateGovernanceRecord {
  id: string;
  estateId: string;
  estateName: string;
  type: GovernanceRecordType;
  title: string;
  meetingDate?: string;
  status: GovernanceRecordStatus;
  version: number;
  rootId?: string;
  requiresSignatures: boolean;
  uploadedById?: string;
  uploadedByName?: string;
  signatureCount: number;
  createdAt: string;
}

export interface AdminEstateGovernanceSignature {
  id: string;
  signedAt: string;
  committeeMemberId: string;
  title?: string;
  unitLabel?: string;
  residentName?: string;
  documentHash: string;
}

export interface AdminEstateGovernanceVersion {
  id: string;
  version: number;
  status: GovernanceRecordStatus;
  uploadedById?: string;
  uploadedByName?: string;
  signatureCount: number;
  createdAt: string;
}

export interface AdminEstateGovernanceRecordDetail {
  id: string;
  estateId: string;
  estateName: string;
  type: GovernanceRecordType;
  title: string;
  meetingDate?: string;
  status: GovernanceRecordStatus;
  version: number;
  rootId?: string;
  requiresSignatures: boolean;
  versions: AdminEstateGovernanceVersion[];
  signatures: AdminEstateGovernanceSignature[];
  createdAt: string;
}

export interface AdminEstateDueScanResult {
  flagged: number;
  generated: number;
}
