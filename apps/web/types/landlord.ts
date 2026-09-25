import type { SharedCreditCheck } from '@/types/credit-check';
import type {
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceRequestStatus,
} from './maintenance';

export type PropertyType = 'apartment' | 'duplex' | 'condo' | 'commercial' | 'shared_apartment';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type UnitOccupancyStatus = 'occupied' | 'vacant' | 'notice_given';
export type ListingStatus = 'draft' | 'pending_verification' | 'published' | 'paused' | 'closed';
export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
export type LeaseStatus =
  | 'draft'
  | 'sent'
  /** Tenant has signed; the lease is conditional on the first payment. */
  | 'awaiting_payment'
  /** Money is in escrow and the landlord owes a handover. */
  | 'awaiting_landlord'
  | 'signed'
  /** First payment missed: the unit returns to the market. */
  | 'lapsed'
  | 'expired';
export type RentPaymentStatus = 'paid' | 'pending' | 'overdue' | 'processing';
/** `not_funded` means nothing has been paid yet, so no money is held. */
export type EscrowStatus = 'not_funded' | 'held' | 'pending_review' | 'released' | 'frozen';
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
  coverImageKey?: string;
  galleryImageKeys?: string[];
  videoTourUrl?: string;
  videoTourKey?: string;
  verificationStatus: VerificationStatus;
  totalUnits: number;
  occupiedUnits: number;
  /** Contracted rent per year across let units, normalised to a year. */
  annualRentRoll: number;
  /** What the property is worth today and what was paid for it, in naira. Optional — they drive cap rate and yield. */
  estimatedValue?: number;
  purchasePrice?: number;
  createdAt: string;
  archived?: boolean;
}

/**
 * Fields a landlord may change after a property exists (PATCH /landlord/properties/:id).
 * Media is sent as storage keys; `null` clears a single key and an empty
 * `galleryImageKeys` array clears the gallery.
 */
export type PropertyUpdatePayload = Partial<
  Pick<
    Property,
    | 'name'
    | 'type'
    | 'address'
    | 'city'
    | 'state'
    | 'country'
    | 'description'
    | 'totalUnits'
    | 'galleryImageKeys'
    | 'estimatedValue'
    | 'purchasePrice'
  >
> & {
  /** `null` clears the stored cover; omit to leave it untouched. */
  coverImageKey?: string | null;
  /** `null` clears the video tour; omit to leave it untouched. */
  videoTourKey?: string | null;
};

export interface Unit {
  id: string;
  propertyId: string;
  propertyName: string;
  unitName: string;
  bedrooms: number;
  bathrooms: number;
  /**
   * This unit's asking rent and its cadence — annual unless stated. The advert
   * publishes a snapshot of it; the lease fixes what is charged.
   */
  askingRent?: number;
  askingRentPeriod?: 'month' | 'year';
  /** What the signed lease charges, when the unit is let. */
  leaseRent?: number;
  leaseRentPeriod?: 'month' | 'year';
  occupancyStatus: UnitOccupancyStatus;
  tenantId?: string;
  tenantName?: string;
  /** Approved applicant waiting on this unit; the lease links to their account. */
  approvedApplicant?: {
    applicationId: string;
    userId?: string;
    name: string;
    email: string;
  };
}

export interface Listing {
  id: string;
  unitId: string;
  propertyId: string;
  propertyName: string;
  unitName: string;
  listingTitle: string;
  /** The advert's asking rent, in `rentPeriod`. */
  askingRent: number;
  /** Cadence of `askingRent`. Yearly upfront is the Nigerian market default. */
  rentPeriod: RentPeriod;
  /** Whether the landlord will accept the tenant repaying in monthly installments via GetRentos Flex, instead of the full amount upfront. Only meaningful when rentPeriod is 'year'. */
  allowsMonthlyPayment: boolean;
  securityDeposit?: number;
  amenities: string[];
  availabilityDate: string;
  allowPets: boolean;
  furnished: boolean;
  shortLetEnabled: boolean;
  /** The property's media (a listing has none of its own). Signed per request. */
  coverImage?: string;
  galleryImages?: string[];
  videoTourUrl?: string;
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
  /** Cadence of rentAmount; absent on leases written before it was tracked. */
  rentPeriod?: 'month' | 'year';
  securityDeposit?: number;
  status: LeaseStatus;
  tenantSigned: boolean;
  landlordSigned: boolean;
  /** Deadline for the tenant's first payment, while the lease is conditional. */
  paymentDueAt?: string;
  /** Set once the landlord confirmed handover. */
  possessionConfirmedAt?: string;
  /**
   * Renewal terms awaiting the tenant's answer. While this is present the lease
   * still carries its current rent and end date — accepting is what applies them.
   */
  pendingRenewalOffer?: {
    id: string;
    newRentAmount: number;
    increasePercentage: number;
    newEndDate: string;
    offeredAt: string;
  };
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

export type ScreeningFlagLevel = 'ok' | 'watch' | 'concern';
export type AffordabilityBand = 'comfortable' | 'stretched' | 'high' | 'unknown';
export type ReferenceOutcome = 'not_contacted' | 'confirmed' | 'concern' | 'unreachable';

export interface ScreeningFlag {
  level: ScreeningFlagLevel;
  text: string;
}

export interface ScreeningAffordability {
  available: boolean;
  reason?: string;
  monthlyIncome: number;
  monthlyRent?: number;
  annualRent?: number;
  /** A year's rent as a share of a year's declared income. */
  rentToIncomePercent?: number | null;
  band: AffordabilityBand;
  /** Whether a proof of income or bank statement is attached; otherwise income is self-declared. */
  incomeEvidenced: boolean;
}

export interface ScreeningDocument {
  name: string;
  required: boolean;
  uploaded: boolean;
  /** Short-lived link to a file the applicant attached to this application. */
  url?: string;
  sizeBytes?: number;
  isCreditReport: boolean;
}

export interface ScreeningReference {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  status: ReferenceOutcome;
  note?: string;
  checkedAt?: string;
}

export interface RentalHistory {
  paymentsCount: number;
  onTimeRatePercent: number | null;
  landlordReviewCount: number;
  landlordReviewAverage: number | null;
}

export interface ScreeningReport {
  applicationId: string;
  applicantName: string;
  affordability: ScreeningAffordability;
  standing: TenancyStanding;
  history?: RentalHistory;
  references: ScreeningReference[];
  nextOfKin?: { name: string; phone?: string; relationship?: string };
  documents: ScreeningDocument[];
  flags: ScreeningFlag[];
  /** `available` says a credit provider is connected; `latest` is present once the applicant shares a check. */
  creditCheck: { available: boolean; latest?: SharedCreditCheck };
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
  /** Inactive vendors keep their history but cannot be given new work. */
  isActive: boolean;
  /** Mean of the rated jobs — 0 while `ratingCount` is 0, so check the count before showing stars. */
  rating: number;
  ratingCount: number;
  jobsCompleted: number;
  openJobs: number;
  /** Approved cost of completed jobs, in naira. */
  totalSpend: number;
  averageCost: number | null;
  averageResolutionDays: number | null;
  nextVisitAt?: string;
}

/** What a landlord types when adding or editing a vendor. */
export type VendorInput = Pick<Vendor, 'name' | 'serviceType' | 'phone'>;

export interface VendorJob {
  id: string;
  issueTitle: string;
  propertyName: string;
  unitName: string;
  status: MaintenanceRequestStatus;
  approvedCost: number | null;
  rating: number | null;
  scheduledFor?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface VendorDetail {
  vendor: Vendor;
  recentJobs: VendorJob[];
  upcomingVisits: VendorJob[];
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
  /** When the assigned vendor is due to visit. */
  scheduledFor?: string;
  /** The landlord's own 1-5 mark for the vendor on this job. */
  vendorRating?: number;
  /** What the tenant gave, when they rated the job. */
  tenantVendorRating?: number;
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
  /** The slot the renter asked for. The landlord's confirmed time is `scheduledAt`. */
  preferredAt?: string;
  scheduledAt?: string;
  notes?: string;
}

export type LandlordOfferStatus =
  | 'submitted'
  | 'countered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'expired'
  | 'closed';

export type LandlordFinancingType = 'cash' | 'mortgage' | 'installment';

export interface LandlordOffer {
  id: string;
  buyerId: string;
  buyerName: string;
  propertyId: string;
  propertyName: string;
  offerAmount: number;
  askingPrice: number;
  financingType: LandlordFinancingType;
  depositAmount?: number;
  message?: string;
  status: LandlordOfferStatus;
  submittedAt: string;
}

export interface LandlordOfferMessage {
  id: string;
  offerId: string;
  senderId: string;
  senderName: string;
  type: 'message' | 'offer' | 'counter' | 'accepted' | 'rejected';
  amount?: number;
  text: string;
  timestamp: string;
}

export interface LandlordMicrositeSettings {
  slug: string;
  bio?: string;
  bannerUrl?: string;
  enabled: boolean;
}

/** Rates are percentages to one decimal place (6.4 means 6.4%); money is whole naira. */
export interface PropertyPerformance {
  propertyId: string;
  name: string;
  city: string;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number | null;
  annualRentRoll: number;
  rentCollected: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  expenseRatio: number | null;
  estimatedValue?: number;
  purchasePrice?: number;
  capRate: number | null;
  grossYield: number | null;
  yieldOnCost: number | null;
  appreciation: number | null;
  /** Cap rate minus the portfolio cap rate, in percentage points. */
  capRateVsPortfolio: number | null;
  /** Figures the landlord could add to unlock the rates above. */
  missing: ('estimatedValue' | 'purchasePrice')[];
}

export interface PortfolioSummary {
  windowMonths: number;
  propertyCount: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number | null;
  rentCollected: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  /** Worth of the properties that have a value on file only. */
  portfolioValue: number;
  valuedPropertyCount: number;
  capRate: number | null;
  yieldOnCost: number | null;
  bestCapRatePropertyId: string | null;
  weakestCapRatePropertyId: string | null;
}

export interface PortfolioAnalytics {
  summary: PortfolioSummary;
  properties: PropertyPerformance[];
}
