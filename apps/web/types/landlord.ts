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
  monthlyRent: number;
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
