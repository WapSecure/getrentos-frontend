/**
 * Estate marketplace: an estate marketing the properties inside it, and the
 * owner's consent for it to do so.
 *
 * The two halves are deliberately typed separately — the estate's view and the
 * owner's view are different jobs, and the same agreement looks different from
 * each side.
 */

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
  /** Whether the estate may publish right now. */
  effective: boolean;
  /** Listings the estate currently has live or paused on this property. */
  estateListingCount: number;
}

export type EstateListingType = 'RENT' | 'SALE' | 'SHORTLET';

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
  /** Owner of record — never the estate. */
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

/** A property inside an estate, for the storefront's "what's here". */
export interface EstatePropertySummary {
  id: string;
  title: string;
  propertyType: string;
  address: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
}

export interface EstateStorefrontListing {
  listingId: string;
  propertyId: string;
  title: string;
  propertyType: string;
  address: string;
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
 * One enquiry on a property this estate markets.
 *
 * `ownerName` is here because the estate is selling someone else's asset: when a
 * serious buyer appears its job is to bring the owner in. `listedByEstate` mirrors
 * the public storefront so the console and the public page agree on who is
 * marketing what.
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
