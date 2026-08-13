export type PeriodType = 'month' | 'year' | 'week';
export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
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

export interface Property {
  id: string;
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
  image: string;
  score?: number;
  hasVirtualTour?: boolean;
  virtualTourUrl?: string;
  landlordResponseRate?: number;
  landlordRating?: number;
  landlordReviews?: number;
  landlordVerified?: boolean;
  description?: string;
  amenities?: string[];
  landlordName?: string;
  landlordEmail?: string;
  landlordPhone?: string;
  availableFrom?: string;
  additionalFees?: PropertyFee[];
  reviews?: PropertyReview[];
  /** Whether the landlord allows paying this property's rent in monthly installments (GetRentos Flex), instead of the standard upfront yearly payment. */
  allowsMonthlyPayment?: boolean;
}

// ---- Real map / neighborhood insights (OpenStreetMap + optional AI) ----

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
  formattedAddress: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  neighborhood: Record<string, NearbyPlace[]> | null;
  travelTimes: TravelTimes | null;
  pricing: {
    price: number;
    sizeSqm: number | null;
    pricePerSqm: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
  };
  walkability: { score: number; label: string; summary: string } | null;
  aiSummary: string | null;
  generatedAt: string;
  cacheTtlSeconds: number;
}

export interface Document {
  name: string;
  uploaded: boolean;
  required: boolean;
}

export interface LandlordInfo {
  name: string;
  email: string;
  phone: string;
  responseRate: number;
  rating?: number;
}

export interface TimelineStep {
  stage: string;
  date: string;
  completed: boolean;
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
