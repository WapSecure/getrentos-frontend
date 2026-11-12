export type CardMarket = 'rent' | 'sale' | 'land' | 'shortlet';
export type CollectionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type CollectionKind = 'hand_picked' | 'rule';
export type RuleSort = 'newest' | 'price_asc' | 'price_desc';

/** A saved public search; the backend runs it through the market's own browse query. */
export interface CollectionRule {
  search?: string;
  city?: string;
  state?: string;
  minLat?: number;
  minLng?: number;
  maxLat?: number;
  maxLng?: number;
  polygon?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  furnished?: boolean;
  verifiedOnly?: boolean;
  sort?: RuleSort;
  limit?: number;
}

export interface CollectionRulePreview {
  count: number;
  matching: number;
  limit: number;
  items: unknown[];
}

/** Who paid for a sponsored collection. Staff only; the amount is never public. */
export interface CollectionSponsorship {
  sponsorKind: 'organisation' | 'person';
  sponsorName: string;
  /** Whole naira. */
  amount: number;
  startDate: string;
  endDate: string;
  reference: string | null;
  note: string | null;
  recordedById: string;
  updatedAt: string;
  /** By Lagos date: scheduled before the start day, running from start to end day inclusive, then ended. */
  state: SponsorshipState;
  /** Lagos days, YYYY-MM-DD, both included. */
  startDay: string;
  endDay: string;
}

export type SponsorshipState = 'scheduled' | 'running' | 'ended';

export const SPONSORSHIP_STATE_LABEL: Record<SponsorshipState, string> = {
  scheduled: 'Scheduled',
  running: 'Running',
  ended: 'Ended',
};

export type SponsorshipInput = Omit<
  CollectionSponsorship,
  'recordedById' | 'updatedAt' | 'reference' | 'note' | 'state' | 'startDay' | 'endDay'
> & {
  reference?: string;
  note?: string;
};

/** Enough of a listing card to pick and order it; each market's card is mapped by cardSummary. */
export interface MarketCard {
  id: string;
  title: string;
  location: string;
  price?: number;
  /** Staff collections: why the listing cannot be added (its lister opted out). */
  unavailableReason?: string;
}

export interface ManagedCollectionItem {
  listingId: string;
  position: number;
  note: string | null;
  visible: boolean;
  card: unknown | null;
}

export interface ManagedCollection {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  market: CardMarket;
  curatorType: 'STAFF' | 'ESTATE' | 'AGENCY' | 'REALTOR';
  curatorId: string | null;
  curatorName: string;
  status: CollectionStatus;
  /** The stored flag; the public label needs `sponsorship` too. */
  sponsored: boolean;
  sponsorship: CollectionSponsorship | null;
  /** Flagged sponsored with no record: the public label is hidden until one is added. */
  sponsorshipMissing: boolean;
  /** Whether the public sees the Sponsored label today: a record, and today within its dates. */
  sponsoredLabelShowing: boolean;
  kind: CollectionKind;
  rule: CollectionRule | null;
  coverListingId: string | null;
  publishedAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  itemCount: number;
  updatedAt: string;
  items?: ManagedCollectionItem[];
  /** Staff collections: listings their listers took out. */
  optOuts?: Array<{ listingId: string; title: string; reason: string; at: string }>;
}

export interface CollectionInput {
  title: string;
  description?: string | null;
  market?: CardMarket;
  startsAt?: string | null;
  endsAt?: string | null;
  coverListingId?: string | null;
  /** Only false: clears a flag that has no sponsor record. */
  sponsored?: boolean;
  kind?: CollectionKind;
  rule?: CollectionRule;
}

export const COLLECTION_MARKET_LABEL: Record<CardMarket, string> = {
  rent: 'Homes to rent',
  sale: 'Homes for sale',
  shortlet: 'Shortlets',
  land: 'Land',
};

export const COLLECTION_STATUS_LABEL: Record<CollectionStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

export const CURATOR_LABEL: Record<ManagedCollection['curatorType'], string> = {
  STAFF: 'Sureground',
  ESTATE: 'Estate',
  AGENCY: 'Agency',
  REALTOR: 'Realtor',
};

export const COLLECTION_TITLE_MAX = 80;
export const COLLECTION_DESCRIPTION_MAX = 600;
export const COLLECTION_NOTE_MAX = 200;
export const COLLECTION_MAX_ITEMS = 24;
export const RULE_DEFAULT_LIMIT = 12;

export const RULE_SORT_LABEL: Record<RuleSort, string> = {
  newest: 'Newest first',
  price_asc: 'Price, low to high',
  price_desc: 'Price, high to low',
};

export const RULE_PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'CONDO', label: 'Condo' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'SHARED_APARTMENT', label: 'Shared apartment' },
] as const;

const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_APP_URL || 'http://localhost:3000';
export const collectionPath = (slug: string) =>
  `${WEB_APP_URL}/collections/${encodeURIComponent(slug)}`;

const num = (v: unknown) => {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : undefined;
};

/** Rent cards carry `location`; sale, land and shortlet cards carry city and state. */
export function cardSummary(market: CardMarket, raw: unknown): MarketCard {
  const r = (raw ?? {}) as Record<string, unknown>;
  const place =
    typeof r.location === 'string'
      ? r.location
      : [r.city, r.state].filter((v) => typeof v === 'string' && v).join(', ');
  return {
    id: String(r.id ?? ''),
    title: String(r.title ?? 'Listing'),
    location: place,
    price: num(market === 'shortlet' ? r.nightlyRate : r.price),
    unavailableReason: typeof r.unavailableReason === 'string' ? r.unavailableReason : undefined,
  };
}
