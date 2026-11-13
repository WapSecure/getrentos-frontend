import type { TravelTimesSource, WalkabilityInsight } from '@sureground/shared';

export type PeriodType = 'month' | 'year' | 'week';
export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
export type PaymentStatus = 'upcoming' | 'overdue' | 'paid';
export type MaintenanceStatus = 'submitted' | 'assigned' | 'in_progress' | 'resolved';

export interface PropertyReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
}

export interface PropertyFee {
  label: string;
  amount: number;
}

/** In display order. */
export type PropertyTrustStepId = 'owner' | 'authority' | 'property' | 'payment';

export interface PropertyTrustStep {
  id: PropertyTrustStepId;
  label: string;
  met: boolean;
  detail: string;
}

/** Only present on the single-property detail payload; the browse list omits it. */
export interface PropertyTrustChain {
  steps: PropertyTrustStep[];
  metCount: number;
  totalCount: number;
}

export interface Property {
  id: string;
  propertyId: string;
  title: string;
  location: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  price: number;
  period: PeriodType;
  bedrooms: number;
  bathrooms: number;
  size: number;
  rating: number;
  verified: boolean;
  /** First entry of `images`. */
  image: string;
  /** Cover first. */
  images?: string[];
  videoTourUrl?: string;
  /** The video tour was filmed in the Sureground app at the property. */
  videoTourFilmedOnSite?: boolean;
  score?: number;
  landlordResponseRate?: number;
  landlordRating?: number;
  landlordReviews?: number;
  landlordVerified?: boolean;
  description?: string;
  amenities?: string[];
  landlordId?: string;
  landlordName?: string;
  availableFrom?: string;
  /** False once the unit is let. */
  acceptingApplications?: boolean;
  additionalFees?: PropertyFee[];
  reviews?: PropertyReview[];
  allowsMonthlyPayment?: boolean;
  /** Only on the property detail payload. */
  trustChain?: PropertyTrustChain;
}

export interface NearbyPlace {
  name: string;
  address: string;
  rating: number | null;
  userRatingsTotal: number | null;
  distanceMeters: number;
}

export interface TravelModeResult {
  durationSeconds: number;
  durationText: string;
  distanceMeters: number;
  distanceText: string;
}

export interface TravelTimes {
  /** Who estimated the times; absent from older API responses. */
  source?: TravelTimesSource;
  destination: string;
  destinationCoords: { latitude: number; longitude: number };
  modes: Partial<Record<'driving' | 'transit' | 'walking', TravelModeResult | null>>;
}

export interface GeoInsights {
  listingId: string;
  propertyId: string;
  title: string;
  latitude: number | null;
  longitude: number | null;
  /** `approximate` until the property is verified: draw an area, not a pin. */
  locationPrecision?: 'exact' | 'approximate';
  formattedAddress: string | null;
  /** Left out until the property is verified; see addressHidden. */
  address?: string;
  addressHidden?: boolean;
  city: string;
  state: string;
  country: string;
  neighborhood: Record<string, NearbyPlace[]> | null;
  travelTimes: TravelTimes | null;
  pricing: {
    price: number;
    /** RENT listings only — null for SALE, which has no periodic-rent concept. */
    rentPeriod: 'month' | 'year' | null;
    sizeSqm: number | null;
    pricePerSqm: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
  };
  walkability: WalkabilityInsight | null;
  aiSummary: string | null;
  generatedAt: string;
  cacheTtlSeconds: number;
}

export interface Document {
  name: string;
  uploaded: boolean;
  required: boolean;
  documentId?: string;
  /** Short-lived. */
  url?: string;
}

export interface LandlordInfo {
  id?: string;
  name: string;
  email: string;
  phone: string;
  /** Only when Sureground actually measures it; never a placeholder. */
  responseRate?: number;
  rating?: number;
}

export interface TimelineStep {
  stage: string;
  date: string;
  completed: boolean;
}

export type RenterInspectionType = 'move_in' | 'move_out' | 'periodic' | 'other';
export type RenterRoomCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';

export interface RenterInspectionRoom {
  room: string;
  condition: RenterRoomCondition;
  notes?: string;
  photoCount?: number;
  photos?: { url: string; name: string }[];
  /** In naira. */
  estimatedCost?: number;
}

export interface RenterInspection {
  id: string;
  type: RenterInspectionType;
  scheduledDate: string;
  propertyName: string;
  propertyAddress: string;
  overallCondition?: RenterRoomCondition;
  rooms: RenterInspectionRoom[];
  acknowledgedAt?: string;
  /** 'condition_report' is the one deposit deductions cite. */
  source: 'agent' | 'condition_report';
  summaryNotes?: string;
  tenantComment?: string;
}

export interface Application {
  id: string;
  propertyId: string;
  title: string;
  address: string;
  status: ApplicationStatus;
  date: string;
  price: number;
  period: PeriodType;
  bedrooms: number;
  bathrooms: number;
  size: number;
  image: string;
  applicationDate: string;
  moveInDate: string;
  leaseTerm: string;
  documents: Document[];
  landlord: LandlordInfo;
  applicationNotes?: string;
  timeline: TimelineStep[];
}

export const formatPrice = (price: number, period: PeriodType): string => {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const periodMap: Record<PeriodType, string> = {
    month: '/mo',
    year: '/yr',
    week: '/wk',
  };
  return `${formatter.format(price)}${periodMap[period]}`;
};

/** Null for a price already quoted monthly. */
export const monthlyEquivalent = (price: number, period: PeriodType): string | null => {
  if (period === 'month') return null;
  const monthsPerPeriod = period === 'year' ? 12 : 12 / 52;
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `≈${formatter.format(Math.round(price / monthsPerPeriod))}/mo`;
};
