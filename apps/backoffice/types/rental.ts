export type RentalListingType = 'RENT' | 'SALE';
export type RentalListingStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'CLOSED';
export type RentalApplicationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
export type RentalViewingStatus = 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type RentalLeaseStatus = 'DRAFT' | 'SENT' | 'SIGNED' | 'EXPIRED';
export type RentalRenewalStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
export type RentalTerminationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RentalEvictionStatus = 'DRAFT' | 'ISSUED' | 'FILED' | 'RESOLVED' | 'WITHDRAWN';

export interface AdminRentalOverview {
  totalListings: number;
  publishedListings: number;
  pendingVerification: number;
  pausedListings: number;
  closedListings: number;
  openApplications: number;
  activeLeases: number;
}

export interface AdminRentalListing {
  id: string;
  listingType: RentalListingType;
  title: string;
  propertyTitle: string;
  city: string;
  state: string;
  unitName: string | null;
  price: number;
  status: RentalListingStatus;
  isFeatured: boolean;
  viewCount: number;
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  bedrooms: number | null;
  bathrooms: number | null;
  createdAt: string;
}

export interface AdminRentalApplication {
  id: string;
  unitName: string | null;
  propertyTitle: string;
  city: string;
  state: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  monthlyIncome: number;
  employmentStatus: string;
  moveInDate: string | null;
  leaseTerm: string | null;
  status: RentalApplicationStatus;
  verificationStatus: string;
  trustScore: number;
  unitMonthlyRent: number | null;
  noteCount: number;
  createdAt: string;
}

export interface AdminRentalViewing {
  id: string;
  propertyTitle: string;
  city: string;
  state: string;
  unitName: string | null;
  renterId: string;
  renterName: string;
  renterEmail?: string;
  requestedAt: string;
  scheduledAt: string | null;
  status: RentalViewingStatus;
  notes: string | null;
  createdAt: string;
}

export interface AdminRentalLease {
  id: string;
  unitName: string | null;
  propertyTitle: string;
  city: string;
  state: string;
  tenantId: string | null;
  tenantName: string | null;
  rentAmount: number;
  securityDeposit: number | null;
  leaseStart: string;
  leaseEnd: string;
  status: RentalLeaseStatus;
  paymentCount: number;
  createdAt: string;
}

export interface AdminRentalRenewal {
  id: string;
  status: RentalRenewalStatus;
  newRentAmount: number;
  increasePercentage: number;
  newEndDate: string;
  respondedAt: string | null;
  leaseId: string;
  propertyTitle: string;
  city: string;
  unitName: string | null;
  tenantName: string | null;
  createdAt: string;
}

export interface AdminRentalTermination {
  id: string;
  status: RentalTerminationStatus;
  leaseId: string;
  propertyTitle: string;
  city: string;
  unitName: string | null;
  tenantName: string | null;
  requesterName: string | null;
  reason: string;
  noticeDate: string;
  createdAt: string;
}

export interface AdminRentalEviction {
  id: string;
  status: RentalEvictionStatus;
  leaseId: string;
  propertyTitle: string;
  city: string;
  unitName: string | null;
  tenantName: string | null;
  initiatorName: string | null;
  reason: string;
  noticeIssuedAt: string | null;
  cureDeadline: string | null;
  filedAt: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
}
