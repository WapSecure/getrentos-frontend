import type {
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceRequestStatus,
} from './maintenance';

export type PropertyType = 'apartment' | 'duplex' | 'condo' | 'commercial' | 'shared_apartment';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type UnitOccupancyStatus = 'occupied' | 'vacant' | 'notice_given';
export type ListingStatus = 'draft' | 'pending_verification' | 'published' | 'paused' | 'closed';
export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type LeaseStatus = 'draft' | 'sent' | 'signed' | 'expired';
export type RentPaymentStatus = 'paid' | 'pending' | 'overdue' | 'processing';
export type EscrowStatus = 'held' | 'pending_review' | 'released' | 'frozen';
export type RentPeriod = 'year' | 'month';

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  address: string;
  city: string;
  state: string;
  country: string;
  description?: string;
  coverImage: string;
  galleryImages?: string[];
  verificationStatus: VerificationStatus;
  totalUnits: number;
  occupiedUnits: number;
  monthlyRevenue: number;
  createdAt: string;
  archived?: boolean;
}

export interface Unit {
  id: string;
  propertyId: string;
  propertyName: string;
  unitName: string;
  bedrooms: number;
  bathrooms: number;
  monthlyRent: number;
  occupancyStatus: UnitOccupancyStatus;
  tenantId?: string;
  tenantName?: string;
}

export interface Listing {
  id: string;
  unitId: string;
  propertyId: string;
  propertyName: string;
  unitName: string;
  listingTitle: string;
  /** Rent amount for whichever cadence `rentPeriod` specifies. Field name kept as `monthlyRent` for API compatibility. */
  monthlyRent: number;
  /** Billing cadence for `monthlyRent`. Yearly upfront is the Nigerian market default. */
  rentPeriod: RentPeriod;
  /** Whether the landlord will accept the tenant repaying in monthly installments via GetRentos Flex, instead of the full amount upfront. Only meaningful when rentPeriod is 'year'. */
  allowsMonthlyPayment: boolean;
  securityDeposit?: number;
  amenities: string[];
  availabilityDate: string;
  allowPets: boolean;
  furnished: boolean;
  shortLetEnabled: boolean;
  status: ListingStatus;
  createdAt: string;
}

export interface Lease {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitName: string;
  leaseStart: string;
  leaseEnd: string;
  rentAmount: number;
  securityDeposit?: number;
  status: LeaseStatus;
  tenantSigned: boolean;
  landlordSigned: boolean;
  createdAt: string;
}

export interface TenancyStanding {
  shared: boolean;
  trustScore?: number;
  signedLeaseCount?: number;
  identityVerified?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

export interface RentIncreaseCheck {
  increasePercent: number;
  exceedsGuidance: boolean;
  maxAnnualIncreasePercent: number | null;
  minNoticeDays: number;
  advisory: string;
  source: string;
}

export type EvictionStatus = 'draft' | 'issued' | 'filed' | 'resolved' | 'withdrawn';

export interface EvictionCase {
  id: string;
  leaseId: string;
  propertyId: string;
  propertyName: string;
  unitName: string;
  tenantName: string;
  reason: string;
  status: EvictionStatus;
  noticeIssuedAt?: string;
  cureDeadline?: string;
  filedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface RentalApplication {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitName: string;
  monthlyIncome: number;
  employmentStatus: string;
  verificationStatus: VerificationStatus;
  trustScore: number;
  applicationDate: string;
  status: ApplicationStatus;
  documents: { name: string; uploaded: boolean }[];
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelationship?: string;
  references: { name: string; phone: string; relationship: string }[];
}

export interface RentPayment {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitName: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: RentPaymentStatus;
  escrowStatus: EscrowStatus;
  releaseDate?: string;
  disputeReason?: string;
}

export interface Vendor {
  id: string;
  name: string;
  serviceType: string;
  phone: string;
  rating: number;
  jobsCompleted: number;
}

export interface LandlordMaintenanceRequest {
  id: string;
  issueTitle: string;
  category: MaintenanceCategory;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceRequestStatus;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  unitName: string;
  assignedVendorId?: string;
  assignedVendorName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitName: string;
  leaseId?: string;
  moveInDate: string;
  trustScore: number;
  verified: boolean;
  rentStatus: RentPaymentStatus;
}

export type LeadStage =
  | 'inquiry'
  | 'requested'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected';

export interface LandlordLead {
  id: string;
  leadName: string;
  email: string;
  phone: string;
  leadUserId?: string;
  propertyId: string;
  propertyName: string;
  inquiryDate: string;
  trustScore: number;
  verified: boolean;
  stage: LeadStage;
  applicationId?: string;
  viewingRequestId?: string;
  lastActivityAt: string;
  daysSinceActivity: number;
  stale: boolean;
  lastNudgedAt?: string;
}

export interface LeadNudgeResult {
  leadId: string;
  nudgedAt: string;
}

export interface BulkNudgeResult {
  nudged: number;
  skipped: number;
  errors: { leadId: string; reason: string }[];
}

export type ViewingRequestStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled';

export interface LandlordViewingRequest {
  id: string;
  propertyId: string;
  propertyName: string;
  unitId?: string;
  renterId: string;
  renterName: string;
  renterEmail: string;
  status: ViewingRequestStatus;
  requestedAt: string;
  scheduledAt?: string;
  notes?: string;
}

export interface LandlordMicrositeSettings {
  slug: string;
  bio?: string;
  bannerUrl?: string;
  enabled: boolean;
}
