import type { LandDiligenceStatus, LandTitleType } from '../utils/landTrust';

export type ShowroomMarket = 'rent' | 'sale' | 'land';

export type MediaRoom =
  | 'living'
  | 'bedroom'
  | 'bathroom'
  | 'kitchen'
  | 'exterior'
  | 'amenity'
  | 'floor_plan'
  | 'neighbourhood'
  | 'other';

/** A WebP copy at one width; only copies that exist are listed. */
export interface ImageVariant {
  width: number;
  url: string;
}

/** A list card's cover: its shape and a tiny blurred stand-in to show while it loads. */
export interface ImagePreview {
  width: number;
  height: number;
  /** `data:image/webp;base64,...`, under 1 KB; missing for photos not yet backfilled. */
  placeholder?: string;
}

export interface MediaItem {
  id: string;
  kind: 'image' | 'video' | 'tour';
  url: string;
  posterUrl?: string;
  width?: number;
  height?: number;
  /** Images only: a tiny blurred `data:` URI shown while the photo loads. */
  placeholder?: string;
  variants?: ImageVariant[];
  durationSeconds?: number;
  alt?: string;
  caption?: string;
  room?: MediaRoom;
  order: number;
  capturedAt?: string;
  filmedOnSite?: boolean;
  source?: 'owner' | 'agent' | 'inspection' | 'render';
  tourHost?: string;
}

export interface ShowroomFact {
  label: string;
  value: string;
}

export interface CostLine {
  label: string;
  amount: number;
}

export interface ShowroomCosts {
  lines: CostLine[];
  total?: { label: string; amount: number };
  /** Fees the listing does not state yet; shown so a partial total is never read as the full cost. */
  notStated: string[];
}

export interface ShowroomHost {
  label: string;
  name: string;
  verified?: boolean;
  rating?: number;
  reviews?: number;
}

export interface ShowroomListing {
  id: string;
  market: ShowroomMarket;
  title: string;
  location: string;
  address?: string;
  price: number;
  priceUnit?: 'month' | 'year';
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  verified: boolean;
  media: MediaItem[];
  /** Image URLs in display order with floor plans last, for metadata, structured data and older callers. */
  images: string[];
  description?: string;
  amenities: string[];
  facts: ShowroomFact[];
  costs: ShowroomCosts;
  host?: ShowroomHost;
  underOffer?: boolean;
  availableFrom?: string;
}

export interface PublicRentalDto {
  id: string;
  title: string;
  location: string;
  address?: string;
  price: number | string;
  period: 'month' | 'year';
  allowsMonthlyPayment?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  rating?: number;
  verified?: boolean;
  image?: string;
  images?: string[];
  media?: MediaItem[];
  landlordName?: string;
  landlordVerified?: boolean;
  landlordRating?: number;
  landlordReviews?: number;
  description?: string;
  amenities?: string[];
  availableFrom?: string;
  availableUntil?: string;
  securityDeposit?: number | string;
  serviceCharge?: number | string;
  agencyFee?: number | string;
  legalFee?: number | string;
  minimumLeaseMonths?: number;
  furnished?: boolean;
  petsAllowed?: boolean;
  propertyType?: string;
  videoTourFilmedOnSite?: boolean;
}

export interface PublicSaleDto {
  id: string;
  title: string;
  price: number | string;
  city?: string;
  state?: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  coverImageUrl?: string;
  images?: string[];
  media?: MediaItem[];
  amenities?: string[];
  isVerified?: boolean;
  underOffer?: boolean;
}

export interface PublicLandDto {
  id: string;
  title: string;
  price: number | string;
  city?: string;
  state?: string;
  address?: string;
  description?: string;
  amenities?: string[];
  coverImageUrl?: string;
  galleryImageUrls?: string[];
  media?: MediaItem[];
  isVerified?: boolean;
  parcel?: {
    estateName?: string;
    plotNumber?: string;
    block?: string;
    areaValue: number;
    areaUnit: 'SQUARE_METERS' | 'ACRE' | 'HECTARE';
    /** Metres. */
    frontage?: number;
    depth?: number;
    zoning?: string;
    permittedUse?: string;
    terrain?: string;
    roadAccess?: boolean;
    utilities?: string[];
    titleType?: LandTitleType;
    tenure?: string;
  };
  diligence?: { status: LandDiligenceStatus };
}
