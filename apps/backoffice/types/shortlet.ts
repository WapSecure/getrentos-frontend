export type ShortletPricingMode = 'PER_NIGHT' | 'FLAT_STAY';
export type ShortletListingStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'CLOSED';
export type ShortletBookingStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface AdminShortletListing {
  id: string;
  title: string;
  city: string;
  state: string;
  nightlyRate?: number;
  pricingMode: ShortletPricingMode;
  status: ShortletListingStatus;
  instantBooking: boolean;
  maxGuests: number;
  hostId: string;
  hostName: string;
  bookingCount: number;
  createdAt: string;
}

export interface AdminShortletBooking {
  id: string;
  listingId: string;
  propertyTitle: string;
  city: string;
  guestId: string;
  guestName: string;
  hostName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  status: ShortletBookingStatus;
  paymentReference?: string;
  createdAt: string;
}

export interface AdminShortletOverview {
  totalListings: number;
  activeListings: number;
  pausedListings: number;
  pendingRequests: number;
  confirmedBookings: number;
  totalBookingValue: number;
}
