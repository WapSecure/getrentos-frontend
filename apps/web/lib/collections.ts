// Server-safe types and pure helpers for showroom collections.
import type { CardMarket } from '@/lib/marketCards';

export type CollectionCuratorKind = 'sureground' | 'estate' | 'agency' | 'realtor';

export interface CollectionCurator {
  type: CollectionCuratorKind;
  name: string;
  /** The estate's storefront slug, when it has a public storefront. */
  estateSlug: string | null;
}

export interface PublicCollectionSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  market: CardMarket;
  /** Paid placement: always labelled "Sponsored". */
  sponsored: boolean;
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

/** "Picked by Palm Grove Estate": who chose these, never a claim about the homes themselves. */
export const curatorLine = (curator: CollectionCurator) =>
  `Picked by ${curator.type === 'sureground' ? 'the Sureground team' : curator.name || 'the lister'}`;

export const COLLECTION_TITLE_MAX = 80;
export const COLLECTION_DESCRIPTION_MAX = 600;
export const COLLECTION_NOTE_MAX = 200;
export const COLLECTION_MAX_ITEMS = 24;
