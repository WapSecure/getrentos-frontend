import type { MediaRoom } from '@sureground/shared/showroom';
import type { ChargeCategory } from '@/lib/chargeCategory';
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
  /** Absent: a guess from the address. */
  latitude?: number;
  longitude?: number;
  locationConfirmedAt?: string;
  /** The Google place the address was checked against; absent for a typed address. */
  placeId?: string;
  addressVerifiedAt?: string;
  lga?: string;
  description?: string;
  coverImage: string;
  galleryImages?: string[];
  coverImageKey?: string;
  galleryImageKeys?: string[];
  videoTourUrl?: string;
  videoTourKey?: string;
  /** A 360 tour link on an allowed host. */
  tourUrl?: string;
  /** Room and caption per photo, keyed by storage key. */
  mediaDetails?: PropertyMediaDetails;
  verificationStatus: VerificationStatus;
  totalUnits: number;
  occupiedUnits: number;
  /** Contracted rent per year across let units, normalised to a year. */
  annualRentRoll: number;
  /** In naira. Optional; they drive cap rate and yield. */
  estimatedValue?: number;
  purchasePrice?: number;
  /** Share it so an agent can request to act for the property. */
  referenceCode?: string | null;
  createdAt: string;
  archived?: boolean;
}

/**
 * Media is sent as storage keys; `null` clears a single key and an empty `galleryImageKeys` clears
 * the gallery.
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
    | 'latitude'
    | 'longitude'
    | 'placeId'
    | 'galleryImageKeys'
    | 'estimatedValue'
    | 'purchasePrice'
  >
> & {
  /** `null` clears the stored cover; omit to leave it untouched. */
  coverImageKey?: string | null;
  /** `null` clears the video tour; omit to leave it untouched. */
  videoTourKey?: string | null;
  /** `null` or '' clears it. */
  tourUrl?: string | null;
  /** Replaces the whole map; `null` clears it. Keys must be this property's photos. */
  mediaDetails?: PropertyMediaDetails | null;
};

export type PropertyMediaDetails = Record<string, { room?: MediaRoom; caption?: string }>;

export interface Unit {
  id: string;
  propertyId: string;
  propertyName: string;
  unitName: string;
  bedrooms: number;
  bathrooms: number;
  /** Annual unless stated. The advert publishes a snapshot; the lease fixes what is charged. */
  askingRent?: number;
  askingRentPeriod?: 'month' | 'year';
  leaseRent?: number;
  leaseRentPeriod?: 'month' | 'year';
  occupancyStatus: UnitOccupancyStatus;
  tenantId?: string;
  tenantName?: string;
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
  askingRent: number;
  /** Yearly upfront is the Nigerian market default. */
  rentPeriod: RentPeriod;
  /** Only meaningful when rentPeriod is 'year'. */
  allowsMonthlyPayment: boolean;
  securityDeposit?: number;
  /** Naira. Absent = not stated; 0 = none. */
  serviceCharge?: number;
  agencyFee?: number;
  legalFee?: number;
  amenities: string[];
  availabilityDate: string;
  allowPets: boolean;
  furnished: boolean;
  shortLetEnabled: boolean;
  /** A listing has no media of its own. Signed per request. */
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
  /** While the lease is conditional. */
  paymentDueAt?: string;
  possessionConfirmedAt?: string;
  /**
   * While present the lease still carries its current rent and end date; accepting applies them.
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
  /** Otherwise income is self-declared. */
  incomeEvidenced: boolean;
}

export interface ScreeningDocument {
  name: string;
  required: boolean;
  uploaded: boolean;
  /** Short-lived link. */
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
  /** Lowercased charge category: 'rent' | 'late_fee' | 'service_charge' | ... */
  category?: string;
  lateFeeApplied?: boolean;
  /** Less than `amount` while part-paid. */
  amountPaid?: number;
  /** The period billed, when the charge came from a rent schedule. */
  periodStart?: string;
  periodEnd?: string;
  lines?: { category: string; label: string; amount: number }[];
  /** Null while it is on no statement. */
  payoutStatus?: RentPayoutStatus | null;
}

export type RentPayoutStatus = 'QUEUED' | 'SENT' | 'PAID' | 'FAILED';

/** CAC registration class — mirrors the backend AgencyBusinessType enum. */
export type BusinessRegistrationType =
  | 'BUSINESS_NAME'
  | 'LIMITED_COMPANY'
  | 'INCORPORATED_TRUSTEES';

export interface Vendor {
  id: string;
  name: string;
  serviceType: string;
  phone: string;
  registrationNumber?: string | null;
  businessType?: BusinessRegistrationType | null;
  /** Inactive vendors keep their history but cannot be given new work. */
  isActive: boolean;
  /** 0 while `ratingCount` is 0, so check the count before showing stars. */
  rating: number;
  ratingCount: number;
  jobsCompleted: number;
  openJobs: number;
  /** In naira. */
  totalSpend: number;
  averageCost: number | null;
  averageResolutionDays: number | null;
  nextVisitAt?: string;
}

export type VendorInput = Pick<
  Vendor,
  'name' | 'serviceType' | 'phone' | 'registrationNumber' | 'businessType'
>;

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
  /** Set when a triage proposal is accepted. */
  workOrderScope?: string | null;
  priority: MaintenancePriority;
  status: MaintenanceRequestStatus;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  unitName: string;
  assignedVendorId?: string;
  assignedVendorName?: string;
  scheduledFor?: string;
  /** 1-5. */
  vendorRating?: number;
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
  /** 'video': a live video call at scheduledAt that the landlord hosts. */
  mode: 'in_person' | 'video';
  requestedAt: string;
  /** The slot the renter asked for; the confirmed time is `scheduledAt`. */
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
  /** In percentage points. */
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
  /** Only the properties that have a value on file. */
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

export interface PortfolioBriefing {
  hasData: boolean;
  headline: string;
  insights: string[];
  actions: string[];
  source: 'ai' | 'heuristic';
  model: string | null;
  generatedAt: string;
}

/** Each later period is invoiced `leadDays` before it is due. */
export interface RentScheduleItem {
  id?: string;
  category: 'SERVICE_CHARGE' | 'LEVY';
  label: string;
  amount: number;
}

export interface RentSchedule {
  id: string;
  leaseId: string;
  cycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  amount: number;
  nextDueDate: string;
  leadDays: number;
  status: 'ACTIVE' | 'PAUSED' | 'ENDED';
  nextIssueDate: string;
  leaseEnd: string;
  items: RentScheduleItem[];
  nextInvoiceTotal: number;
}

export interface RentScheduleInput {
  amount?: number;
  leadDays?: number;
  items?: RentScheduleItem[];
}

export interface LeaseRentAccount {
  leaseId: string;
  creditBalance: number;
  receipts: {
    id: string;
    reference: string;
    amount: number;
    method: string | null;
    receivedAt: string;
    allocations: {
      rentPaymentId: string;
      dueDate: string;
      category?: ChargeCategory;
      amount: number;
    }[];
    toCredit: number;
  }[];
  creditApplied: {
    rentPaymentId: string;
    dueDate: string;
    category?: ChargeCategory;
    amount: number;
    appliedAt: string;
  }[];
  /** Credit paid back to the tenant, the way it was paid. */
  refunds?: {
    id: string;
    amount: number;
    refundedAmount: number;
    status: 'PROCESSING' | 'REFUNDED' | 'PARTLY_REFUNDED' | 'FAILED';
    requestedAs: 'TENANT' | 'MANAGER' | 'ADMIN';
    createdAt: string;
  }[];
}
