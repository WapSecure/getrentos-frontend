export type ShortletPricingMode = 'PER_NIGHT' | 'FLAT_STAY';
export type ShortletBookingStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface ShortletListing {
  id: string;
  listingId: string;
  propertyId: string;
  title: string;
  description?: string;
  city: string;
  state: string;
  address: string;
  coverImageUrl?: string;
  imageKeys: string[];
  images: string[];
  videoKey?: string;
  videoUrl?: string;
  tourUrl?: string;
  pricingMode: ShortletPricingMode;
  nightlyRate?: number;
  cleaningFee?: number;
  minNights: number;
  maxNights?: number;
  weekendUpliftPct?: number;
  currency: string;
  instantBooking: boolean;
  maxGuests: number;
  checkInTime?: string;
  checkOutTime?: string;
  status: string;
  hostName: string;
  hostVerified: boolean;
  isVerified: boolean;
  amenities: string[];
  furnished: boolean;
  bedrooms?: number;
  bathrooms?: number;
  propertySize?: number;
  publishedAt: string;
}

export interface ShortletBooking {
  id: string;
  listingId: string;
  propertyId: string;
  propertyTitle: string;
  city: string;
  coverImageUrl?: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  nights: number;
  nightlyRate?: number;
  cleaningFee?: number;
  subtotal: number;
  total: number;
  status: ShortletBookingStatus;
  paymentStatus?: 'UNPAID' | 'PROCESSING' | 'PAID' | 'REFUNDED';
  paidAt?: string;
  paymentRequired?: boolean;
  paymentReference?: string;
  notes?: string;
  hostName: string;
  guestName?: string;
  createdAt: string;
}

export interface ShortletPayResponse {
  id: string;
  total: number;
  paymentStatus: 'UNPAID' | 'PROCESSING' | 'PAID' | 'REFUNDED';
  authorizationUrl?: string;
  reference?: string;
}

export interface ShortletAvailability {
  listingId: string;
  available: boolean;
  reason?: string;
  estimatedNights?: number;
  estimatedTotal?: number;
}

export interface CreateShortletListingInput {
  propertyId: string;
  unitId?: string;
  listingTitle?: string;
  amenities?: string[];
  furnished?: boolean;
  pricingMode?: ShortletPricingMode;
  nightlyRate?: number;
  cleaningFee?: number;
  minNights?: number;
  maxNights?: number;
  weekendUpliftPct?: number;
  currency?: string;
  instantBooking?: boolean;
  maxGuests?: number;
  checkInTime?: string;
  checkOutTime?: string;
  imageKeys?: string[];
  videoKey?: string;
  videoUrl?: string;
  tourUrl?: string;
}

export interface UpdateShortletListingInput {
  pricingMode?: ShortletPricingMode;
  nightlyRate?: number;
  cleaningFee?: number;
  minNights?: number;
  maxNights?: number;
  weekendUpliftPct?: number;
  currency?: string;
  instantBooking?: boolean;
  maxGuests?: number;
  checkInTime?: string;
  checkOutTime?: string;
  imageKeys?: string[];
  videoKey?: string;
  videoUrl?: string;
  tourUrl?: string;
}

export interface CreateShortletBookingInput {
  checkIn: string;
  checkOut: string;
  guestCount?: number;
  notes?: string;
}

export interface BlockShortletDatesInput {
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface BlockedDateRange {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
}
