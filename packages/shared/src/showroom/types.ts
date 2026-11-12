import type { LandDiligenceStatus, LandTitleType, VerificationSummary } from '../utils/landTrust';
import type { ShowroomFloorPlan } from './floorPlans';

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

export type ShowroomTrustStepId = 'owner' | 'authority' | 'property' | 'payment';

/** The same chain the browse cards show: owner ID, ownership, property check, payment protection. */
export interface ShowroomTrustChain {
  steps: { id: ShowroomTrustStepId; label: string; met: boolean; detail: string }[];
  metCount: number;
  totalCount: number;
}

export type CommercialPermittedUse = 'SHOP' | 'OFFICE' | 'WAREHOUSE' | 'MIXED' | 'OTHER';
export type CommercialFitOutCondition = 'SHELL' | 'SEMI_FITTED' | 'FITTED';

/**
 * What the lister states about a commercial property. An absent field was not stated. Sureground
 * never computes VAT, a rent review or an escalation from these, and never measures the power hours.
 */
export interface CommercialDetails {
  permittedUse?: CommercialPermittedUse;
  permittedUseNote?: string;
  lettableAreaSqm?: number;
  fitOutCondition?: CommercialFitOutCondition;
  parkingSpaces?: number;
  /** Hours a day of public power, as the lister states it. */
  publicSupplyHoursStated?: number;
  generator?: boolean;
  generatorNote?: string;
  solar?: boolean;
  loadingAccess?: boolean;
  loadingAccessNote?: string;
  /** Whole years, ascending. */
  leaseTermOptionsYears?: number[];
  /** As written in the lease. */
  rentReviewNote?: string;
  escalationNote?: string;
  /** The rate the landlord states, e.g. 7.5. Show as stated; never apply it to an amount. */
  vatStatedPct?: number;
  vatIncluded?: boolean;
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
  /** Sale and land detail routes only; undefined from an older API. */
  verificationSummary?: VerificationSummary;
  /** Structured floor plans (rooms and sizes); absent when the lister added none. */
  floorPlans?: ShowroomFloorPlan[];
  /** Rent and sale only; undefined where the API sends no chain. */
  trustChain?: ShowroomTrustChain;
  /** Commercial properties only, and only what the lister stated. */
  commercial?: CommercialDetails;
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
  /** Read through `trustChainOf`, never trusted as is. */
  trustChain?: unknown;
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
  /** Detail route only. Read through `floorPlansOf`, never trusted as is. */
  floorPlans?: unknown;
  /** Commercial properties only. Read through `commercialDetailsOf`, never trusted as is. */
  commercial?: unknown;
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
  /** Read through `trustChainOf`, never trusted as is. */
  trustChain?: unknown;
  underOffer?: boolean;
  /** Detail route only (DIA-11). Read through `verificationSummaryOf`, never trusted as is. */
  verificationSummary?: unknown;
  /** Detail route only. Read through `floorPlansOf`, never trusted as is. */
  floorPlans?: unknown;
  /** Commercial properties only. Read through `commercialDetailsOf`, never trusted as is. */
  commercial?: unknown;
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
  /** Detail route only (DIA-11). Read through `verificationSummaryOf`, never trusted as is. */
  verificationSummary?: unknown;
}
