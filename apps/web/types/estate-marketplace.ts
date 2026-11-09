/** The estate's view and the owner's view are typed separately on purpose. */

export type EstateAgreementStatus = 'PENDING' | 'ACTIVE' | 'DECLINED' | 'REVOKED';

export interface EstateAgreement {
  id: string;
  estateId: string;
  estateName: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  status: EstateAgreementStatus;
  ownerName?: string;
  requestedByEmail?: string | null;
  note?: string | null;
  decisionNote?: string | null;
  approvedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  effective: boolean;
  estateListingCount: number;
}

export type EstateListingType = 'RENT' | 'SALE' | 'SHORTLET';

/** Removal takes `key`; a signed `url` cannot be turned back into one. */
export interface EstateListingMedia {
  key: string;
  url: string;
}

export interface EstateListing {
  id: string;
  propertyId: string;
  propertyTitle: string;
  address: string;
  city: string;
  state: string;
  propertyType?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  unitName?: string | null;
  listingType: EstateListingType;
  listingTitle?: string | null;
  price: number;
  status: 'DRAFT' | 'PENDING_VERIFICATION' | 'PUBLISHED' | 'PAUSED' | 'CLOSED';
  availableFrom?: string;
  coverImageUrl?: string;
  /** Cover first. Absent when none, and the card falls back to the owner's own imagery. */
  media?: EstateListingMedia[];
  /** Never the estate. */
  ownerName?: string;
  viewCount: number;
  createdAt: string;
}

export interface EstateInventorySummary {
  properties: number;
  /** The estate's real blocker: properties with no agreement yet. */
  agreementsPending: number;
  agreementsActive: number;
  listingsPublished: number;
  listingsDraft: number;
  listingsPaused: number;
  forRent: number;
  forSale: number;
  shortLets: number;
}

export interface EstatePropertySummary {
  id: string;
  title: string;
  propertyType: string;
  address: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
}

/** The canonical public estate profile, so visibility rules live in one place. */
export interface EstateStorefront {
  slug: string;
  estateId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  bannerUrl?: string;
  bio?: string;
  /** By market. */
  listingCount: number;
  rentCount: number;
  saleCount: number;
  shortletCount: number;
  gates?: number | null;
  storefrontEnabled: boolean;
}

export interface EstateStorefrontListing {
  listingId: string;
  propertyId: string;
  title: string;
  propertyType: string;
  /** Left out until the property is verified; see addressHidden. */
  address?: string;
  addressHidden?: boolean;
  city: string;
  state: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  listingType: EstateListingType;
  price: number;
  coverImageUrl?: string;
  /** True when the estate itself is marketing this property. */
  listedByEstate: boolean;
  ownerName: string;
  availableFrom?: string;
  createdAt: string;
}

export interface EstateDirectoryEntry {
  estateId: string;
  /** Present only when the estate has a public storefront page. */
  slug?: string;
  name: string;
  city: string;
  state: string;
  address: string;
  listingCount: number;
  rentCount: number;
  saleCount: number;
  shortletCount: number;
  bannerUrl?: string;
  bio?: string;
}

export interface BulkPublishResult {
  published: number;
  skipped: { listingId: string; reason: string }[];
}

export type EstateLeadMarket = 'RENT' | 'SALE' | 'SHORTLET';

/**
 * `ownerName` is here so the estate can bring the owner in; `listedByEstate` mirrors the public
 * storefront.
 */
export interface EstateLead {
  id: string;
  leadName: string;
  email: string;
  phone: string;
  leadUserId?: string;
  propertyId: string;
  propertyName: string;
  ownerName?: string;
  market: EstateLeadMarket;
  inquiryDate: string;
  lastActivityAt: string;
  trustScore: number;
  verified: boolean;
  stage: string;
  offerAmount?: number;
  listedByEstate: boolean;
}
