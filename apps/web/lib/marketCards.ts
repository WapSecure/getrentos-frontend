import type { PropertyTrustChain } from '@/types/renter';
// Pure: maps each market's public card from the API into one shape for ListingCard. Server-safe.
import type { ListingPriceUnit } from '@sureground/ui';
import {
  imagePreviewOf,
  srcSetOf,
  type ImagePreview,
  type ImageVariant,
} from '@sureground/shared/showroom';
import {
  rentToCard,
  saleToCard,
  type PublicListingCard,
  type RentApiItem,
  type SaleApiItem,
} from '@/lib/publicListingMap';

export type CardMarket = 'rent' | 'sale' | 'land' | 'shortlet';

export interface MarketCard {
  id: string;
  title: string;
  location: string;
  price?: number;
  priceUnit?: ListingPriceUnit;
  image?: string;
  imageSrcSet?: string;
  imagePreview?: ImagePreview;
  /** The backend's flag only. */
  verified?: boolean;
  /** The owner, ownership and property checks: cards show these, not a bare tick, like the browse grid. */
  trustChain?: PropertyTrustChain;
  beds?: number;
  baths?: number;
  size?: number | string;
  type?: string;
}

export const DETAIL_PATH: Record<CardMarket, string> = {
  rent: '/rent',
  sale: '/buy',
  land: '/land',
  shortlet: '/shortlets',
};

export const MARKET_STATUS: Record<CardMarket, string> = {
  rent: 'For rent',
  sale: 'For sale',
  land: 'Land',
  shortlet: 'Shortlet',
};

const AREA_UNIT: Record<string, string> = { SQUARE_METERS: 'sqm', ACRE: 'acres', HECTARE: 'ha' };

export interface LandCardApi {
  id: string;
  title: string;
  price: number;
  city: string;
  state: string;
  isVerified?: boolean;
  coverImageUrl?: string;
  imageVariants?: ImageVariant[];
  imagePreview?: ImagePreview;
  parcel?: { areaValue?: number; areaUnit?: string };
}

export interface ShortletCardApi {
  id: string;
  title: string;
  city: string;
  state: string;
  nightlyRate?: number;
  pricingMode?: 'PER_NIGHT' | 'FLAT_STAY';
  coverImageUrl?: string;
  imageVariants?: ImageVariant[];
  imagePreview?: ImagePreview;
  bedrooms?: number;
  bathrooms?: number;
}

/** Rent and sale cards already mapped by publicListingMap. */
export const fromPublicCard = (c: PublicListingCard): MarketCard => ({
  id: c.id,
  title: c.title,
  location: c.location,
  price: c.price,
  priceUnit: c.priceUnit,
  image: c.image,
  imageSrcSet: c.imageSrcSet,
  imagePreview: c.imagePreview,
  verified: c.verified,
  trustChain: c.trustChain,
  beds: c.bedrooms,
  baths: c.bathrooms,
  size: c.size,
  type: c.propertyType,
});

export const fromLandCard = (l: LandCardApi): MarketCard => ({
  id: l.id,
  title: l.title,
  location: `${l.city}, ${l.state}`,
  price: Number(l.price),
  image: l.coverImageUrl,
  imageSrcSet: srcSetOf(l.imageVariants),
  imagePreview: imagePreviewOf(l.imagePreview),
  verified: l.isVerified,
  size:
    l.parcel?.areaValue != null
      ? `${l.parcel.areaValue.toLocaleString('en-NG')} ${AREA_UNIT[l.parcel.areaUnit ?? ''] ?? ''}`.trim()
      : undefined,
});

export const fromShortletCard = (s: ShortletCardApi): MarketCard => ({
  id: s.id,
  title: s.title,
  location: `${s.city}, ${s.state}`,
  price: s.nightlyRate,
  priceUnit: s.pricingMode === 'PER_NIGHT' ? 'night' : undefined,
  image: s.coverImageUrl,
  imageSrcSet: srcSetOf(s.imageVariants),
  imagePreview: imagePreviewOf(s.imagePreview),
  beds: s.bedrooms,
  baths: s.bathrooms,
});

/** Any market's raw public card, as the API returns it from browse, similar or collection endpoints. */
export function toMarketCard(market: CardMarket, raw: unknown): MarketCard {
  switch (market) {
    case 'rent':
      return fromPublicCard(rentToCard(raw as RentApiItem));
    case 'sale':
      return fromPublicCard(saleToCard(raw as SaleApiItem));
    case 'land':
      return fromLandCard(raw as LandCardApi);
    case 'shortlet':
    default:
      return fromShortletCard(raw as ShortletCardApi);
  }
}
