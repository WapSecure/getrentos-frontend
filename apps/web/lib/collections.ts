// Server-safe types and pure helpers for showroom collections.
import type { CardMarket } from '@/lib/marketCards';

export type CollectionCuratorKind = 'sureground' | 'estate' | 'agency' | 'realtor';

export interface CollectionCurator {
  type: CollectionCuratorKind;
  name: string;
  /** The estate's storefront slug, when it has a public storefront. */
  estateSlug: string | null;
}

export type CollectionKind = 'hand_picked' | 'rule';
export type CollectionOrder = 'curator' | 'newest' | 'price_asc' | 'price_desc';

export interface PublicCollectionSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  market: CardMarket;
  /** Paid placement with a sponsor record on file: always labelled "Sponsored". */
  sponsored: boolean;
  /** hand_picked: the curator's order and notes. rule: a saved search. Older APIs omit both. */
  kind?: CollectionKind;
  order?: CollectionOrder;
  curator: CollectionCurator;
  itemCount: number;
  /** The market's raw public card for the cover listing. */
  cover: unknown | null;
  publishedAt: string | null;
}

export interface PublicCollection extends PublicCollectionSummary {
  items: Array<{ listingId: string; position: number; note: string | null; card: unknown }>;
}

export type CollectionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ManagedCollectionItem {
  listingId: string;
  position: number;
  note: string | null;
  /** False once the listing is paused, closed or no longer public; kept but not shown. */
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
  sponsored: boolean;
  coverListingId: string | null;
  publishedAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  itemCount: number;
  updatedAt: string;
  items?: ManagedCollectionItem[];
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

export const collectionPath = (slug: string) => `/collections/${encodeURIComponent(slug)}`;

const curatorName = (curator: CollectionCurator) =>
  curator.type === 'sureground' ? 'the Sureground team' : curator.name || 'the lister';

/** "Picked by Palm Grove Estate": who chose these, never a claim about the homes themselves. */
export const curatorLine = (curator: CollectionCurator, kind?: CollectionKind) =>
  kind === 'rule'
    ? `A saved search by ${curatorName(curator)}`
    : `Picked by ${curatorName(curator)}`;

/** How the listings on a collection page are ordered, in words. */
export function orderLine(c: Pick<PublicCollectionSummary, 'kind' | 'order'>): string {
  if (c.kind !== 'rule') return 'Listings appear in the order the curator chose.';
  if (c.order === 'price_asc')
    return 'Listings match a saved search and are shown by price, lowest first.';
  if (c.order === 'price_desc')
    return 'Listings match a saved search and are shown by price, highest first.';
  return 'Listings match a saved search and are shown newest first.';
}

/** A lister's view of the Sureground collections showing their listings (decided 2026-11-12). */
export interface ListingCollectionFeature {
  collectionId: string;
  collectionTitle: string;
  collectionSlug: string;
  published: boolean;
  kind: CollectionKind;
  listingId: string;
  listingTitle: string;
  addedAt: string | null;
}

export interface ListingCollectionOptOut {
  id: string;
  listingId: string;
  listingTitle: string;
  /** Null: kept out of every Sureground collection. */
  collectionId: string | null;
  collectionTitle: string | null;
  createdAt: string;
}

export interface ListingCollectionFeatures {
  features: ListingCollectionFeature[];
  optOuts: ListingCollectionOptOut[];
}

export const COLLECTION_TITLE_MAX = 80;
export const COLLECTION_DESCRIPTION_MAX = 600;
export const COLLECTION_NOTE_MAX = 200;
export const COLLECTION_MAX_ITEMS = 24;
