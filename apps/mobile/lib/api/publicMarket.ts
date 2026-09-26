import { apiFetch } from './client';
import type { Paginated } from './properties';
import type { ShortletListing } from './shortlets';
import { formatLandArea, LAND_TITLE_TYPE_LABEL, type LandListing } from './land';

/**
 * The public marketplace — what anyone can browse without an account, mirroring
 * the web's /rent, /buy, /shortlets, /land and /estates.
 *
 * Every call is `anonymous`: these routes are `@Public()` on the API and return
 * publicly safe DTOs (no owner contact details). Sending a token would not add
 * anything and would make a stale session 401 on a page that needs none.
 *
 * Four modules, four DTOs, three different names for "city". Normalising here
 * means the browse and detail screens are written once.
 */

export const MARKET_KINDS = ['rent', 'sale', 'shortlet', 'land'] as const;
export type MarketKind = (typeof MARKET_KINDS)[number];

export const MARKET_LABEL: Record<MarketKind, string> = {
  rent: 'Rent',
  sale: 'Buy',
  shortlet: 'Shortlets',
  land: 'Land',
};

export function isMarketKind(value: unknown): value is MarketKind {
  return typeof value === 'string' && (MARKET_KINDS as readonly string[]).includes(value);
}

export interface MarketCard {
  id: string;
  kind: MarketKind;
  title: string;
  location: string;
  price: number;
  period?: 'month' | 'year' | 'night';
  bedrooms?: number;
  bathrooms?: number;
  /** Floor area in m² — rentals only. */
  size?: number;
  image?: string;
  verified: boolean;
  /** A short secondary fact for the card, e.g. "600 sqm · C of O". */
  highlight?: string;
}

export interface MarketFact {
  label: string;
  value: string;
}

export interface MarketDetail extends MarketCard {
  images: string[];
  address?: string;
  description?: string;
  amenities: string[];
  latitude?: number;
  longitude?: number;
  /** Who is behind the listing — a name and trust signal only, never contact details. */
  host?: { label: string; name: string; verified?: boolean; rating?: number; reviews?: number };
  facts: MarketFact[];
}

export interface MarketFilters {
  search?: string;
  /** Estate public slug — where an estate's "For rent" / "For sale" lands. */
  estate?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: MarketSort;
}

export type MarketSort = 'newest' | 'price_asc' | 'price_desc';

export const MARKET_SORT_LABEL: Record<MarketSort, string> = {
  newest: 'Newest',
  price_asc: 'Lowest price',
  price_desc: 'Highest price',
};

/* ------------------------------- API DTOs ------------------------------- */

interface RentalDto {
  id: string;
  title: string;
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price: number;
  period: 'month' | 'year';
  allowsMonthlyPayment?: boolean;
  bedrooms: number;
  bathrooms: number;
  size: number;
  rating: number;
  verified: boolean;
  image: string;
  images?: string[];
  landlordName?: string;
  landlordVerified?: boolean;
  landlordRating?: number;
  landlordReviews?: number;
  description?: string;
  amenities?: string[];
  availableFrom?: string;
}

interface SaleDto {
  id: string;
  title: string;
  price: number;
  city: string;
  state: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  coverImageUrl?: string;
  images?: string[];
  amenities?: string[];
  isVerified?: boolean;
  description?: string;
}

export interface EstateDirectoryEntry {
  estateId: string;
  /** Present only when the estate has a public storefront — the filter needs it. */
  slug?: string;
  name: string;
  city: string;
  state: string;
  address: string;
  listingCount: number;
  rentCount: number;
  saleCount: number;
}

/* ------------------------------ normalisers ------------------------------ */

const money = (v: unknown) => {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};
const place = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(', ');
// Falsy, not nullish: listings without bedroom data come back as 0, and "0 bed"
// reads as a claim about the property rather than a missing field.
const positive = (n?: number) => (n && n > 0 ? n : undefined);
const humanise = (value?: string) =>
  value
    ? value
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase())
    : undefined;

const rentToCard = (r: RentalDto): MarketCard => ({
  id: r.id,
  kind: 'rent',
  title: r.title,
  location: r.location,
  price: money(r.price),
  period: r.period,
  bedrooms: positive(r.bedrooms),
  bathrooms: positive(r.bathrooms),
  size: positive(r.size),
  image: r.image || undefined,
  verified: !!r.verified,
});

const saleToCard = (s: SaleDto): MarketCard => ({
  id: s.id,
  kind: 'sale',
  title: s.title,
  location: place(s.city, s.state),
  price: money(s.price),
  bedrooms: positive(s.bedrooms),
  bathrooms: positive(s.bathrooms),
  image: s.coverImageUrl || s.images?.[0] || undefined,
  verified: !!s.isVerified,
  highlight: humanise(s.propertyType),
});

const shortletToCard = (s: ShortletListing): MarketCard => ({
  id: s.listingId ?? s.id,
  kind: 'shortlet',
  title: s.title,
  location: place(s.city, s.state),
  price: money(s.nightlyRate),
  period: 'night',
  image: s.coverImageUrl || s.images?.[0] || undefined,
  verified: !!s.isVerified,
  highlight: [
    `Up to ${s.maxGuests} guest${s.maxGuests === 1 ? '' : 's'}`,
    s.instantBooking ? 'Instant book' : undefined,
  ]
    .filter(Boolean)
    .join(' · '),
});

const landToCard = (l: LandListing): MarketCard => ({
  id: l.id,
  kind: 'land',
  title: l.title,
  location: place(l.city, l.state),
  price: money(l.price),
  image: l.coverImageUrl || l.galleryImageUrls?.[0] || undefined,
  verified: !!l.isVerified,
  highlight: [
    l.parcel ? formatLandArea(l.parcel.areaValue, l.parcel.areaUnit) : undefined,
    l.parcel?.titleType ? LAND_TITLE_TYPE_LABEL[l.parcel.titleType] : undefined,
  ]
    .filter(Boolean)
    .join(' · '),
});

const fact = (label: string, value: string | number | undefined | null): MarketFact[] =>
  value === undefined || value === null || value === '' ? [] : [{ label, value: String(value) }];

const gallery = (cover?: string, images?: string[]) =>
  Array.from(new Set([cover, ...(images ?? [])].filter((x): x is string => !!x)));

/* --------------------------------- query --------------------------------- */

function toQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

// Each module names its sorts differently; the whitelist rejects unknown params.
const RENT_SORT: Record<MarketSort, string> = {
  newest: 'recent',
  price_asc: 'price-low',
  price_desc: 'price-high',
};

const anon = { anonymous: true } as const;

/**
 * The shortlet and land modules have no sort parameter, so their list is
 * ordered here when a price sort is asked for — within the loaded page only,
 * which is honest for the page the visitor is looking at.
 */
const sortPage = (items: MarketCard[], sort?: MarketSort) =>
  sort === 'price_asc'
    ? [...items].sort((a, b) => a.price - b.price)
    : sort === 'price_desc'
      ? [...items].sort((a, b) => b.price - a.price)
      : items;

async function mapPage<T>(
  promise: Promise<Paginated<T>>,
  map: (item: T) => MarketCard
): Promise<Paginated<MarketCard>> {
  const page = await promise;
  return { ...page, items: page.items.map(map) };
}

export const publicMarketApi = {
  list(kind: MarketKind, f: MarketFilters, page = 1, pageSize = 20) {
    // Only the parameters each route declares: the API rejects anything else (400).
    const paging = { page, pageSize };
    const base = { ...paging, minPrice: f.minPrice, maxPrice: f.maxPrice };
    switch (kind) {
      case 'rent':
        return mapPage(
          apiFetch<Paginated<RentalDto>>(
            `/rentals${toQuery({ ...base, search: f.search, estate: f.estate, sortBy: f.sort ? RENT_SORT[f.sort] : undefined })}`,
            anon
          ),
          rentToCard
        );
      case 'sale':
        return mapPage(
          apiFetch<Paginated<SaleDto>>(
            `/marketplace/listings${toQuery({ ...base, city: f.search, estate: f.estate, sort: f.sort })}`,
            anon
          ),
          saleToCard
        );
      case 'shortlet':
        return mapPage(
          apiFetch<Paginated<ShortletListing>>(
            // No price or sort parameters on this route.
            `/shortlets${toQuery({ ...paging, search: f.search, estate: f.estate })}`,
            anon
          ),
          shortletToCard
        ).then((p) => ({ ...p, items: sortPage(p.items, f.sort) }));
      case 'land':
        return mapPage(
          apiFetch<Paginated<LandListing>>(
            // Public land filters by city, not free text.
            `/land${toQuery({ ...base, city: f.search, sort: f.sort })}`,
            anon
          ),
          landToCard
        );
    }
  },

  async detail(kind: MarketKind, id: string): Promise<MarketDetail> {
    switch (kind) {
      case 'rent': {
        const r = await apiFetch<RentalDto>(`/rentals/${id}`, anon);
        return {
          ...rentToCard(r),
          images: gallery(r.image, r.images),
          address: r.address,
          description: r.description,
          amenities: r.amenities ?? [],
          latitude: r.latitude,
          longitude: r.longitude,
          host: r.landlordName
            ? {
                label: 'Landlord',
                name: r.landlordName,
                verified: r.landlordVerified,
                rating: r.landlordRating || undefined,
                reviews: r.landlordReviews || undefined,
              }
            : undefined,
          facts: [
            ...fact('Rent paid', r.period === 'year' ? 'Yearly' : 'Monthly'),
            ...fact('Monthly payments', r.allowsMonthlyPayment ? 'Available' : undefined),
            ...fact('Available from', r.availableFrom?.slice(0, 10)),
            ...fact('Rating', r.rating ? `${r.rating.toFixed(1)} / 5` : undefined),
          ],
        };
      }
      case 'sale': {
        const s = await apiFetch<SaleDto>(`/marketplace/listings/${id}`, anon);
        return {
          ...saleToCard(s),
          images: gallery(s.coverImageUrl, s.images),
          address: s.address,
          description: s.description,
          amenities: s.amenities ?? [],
          latitude: s.latitude,
          longitude: s.longitude,
          facts: [
            ...fact('Property type', humanise(s.propertyType)),
            ...fact('Payment', 'Escrow-protected'),
          ],
        };
      }
      case 'shortlet': {
        const s = await apiFetch<ShortletListing>(`/shortlets/${id}`, anon);
        return {
          ...shortletToCard(s),
          images: gallery(s.coverImageUrl, s.images),
          address: s.address,
          description: s.description,
          amenities: s.amenities ?? [],
          latitude: s.latitude,
          longitude: s.longitude,
          host: {
            label: 'Host',
            name: s.hostName,
            verified: s.hostVerified,
            rating: s.ratingAverage || undefined,
            reviews: s.reviewCount || undefined,
          },
          facts: [
            ...fact('Minimum stay', `${s.minNights} night${s.minNights === 1 ? '' : 's'}`),
            ...fact('Guests', `Up to ${s.maxGuests}`),
            ...fact('Check-in', s.checkInTime),
            ...fact('Check-out', s.checkOutTime),
            ...fact(
              'Cleaning fee',
              s.cleaningFee ? `₦${s.cleaningFee.toLocaleString()}` : undefined
            ),
            ...fact(
              'Booking',
              s.instantBooking ? 'Instant confirmation' : 'Host approves requests'
            ),
            ...fact('Cancellation', humanise(s.cancellationPolicy)),
          ],
        };
      }
      case 'land': {
        const l = await apiFetch<LandListing>(`/land/listings/${id}`, anon);
        const p = l.parcel;
        return {
          ...landToCard(l),
          images: gallery(l.coverImageUrl, l.galleryImageUrls),
          address: l.address,
          description: l.description,
          amenities: l.amenities ?? [],
          latitude: l.latitude,
          longitude: l.longitude,
          facts: [
            ...fact('Area', p ? formatLandArea(p.areaValue, p.areaUnit) : undefined),
            ...fact('Title', p?.titleType ? LAND_TITLE_TYPE_LABEL[p.titleType] : undefined),
            ...fact('Estate', p?.estateName),
            ...fact('Zoning', p?.zoning),
            ...fact('Permitted use', p?.permittedUse),
            ...fact('Terrain', p?.terrain),
            ...fact(
              'Road access',
              p?.roadAccess === undefined ? undefined : p.roadAccess ? 'Yes' : 'No'
            ),
            ...fact('Utilities', p?.utilities?.length ? p.utilities.join(', ') : undefined),
            ...fact('Due diligence', humanise(l.diligence?.status)),
          ],
        };
      }
    }
  },

  estates(search: string | undefined, page = 1, pageSize = 20) {
    return apiFetch<Paginated<EstateDirectoryEntry>>(
      `/estate-storefronts${toQuery({ search, page, pageSize })}`,
      anon
    );
  },
};
