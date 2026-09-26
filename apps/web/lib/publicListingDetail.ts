/**
 * Server-safe detail pages for the public markets: one rental, one sale, one
 * land parcel. Shortlets have their own richer page (booking calendar).
 *
 * Like `publicListingMap`, this has NO imports so server components can use it.
 * Every route read here is `@Public()` and returns a publicly safe DTO — owner
 * contact details are never in it, so nothing needs stripping.
 */

export type PublicDetailMarket = 'rent' | 'sale' | 'land';

export interface PublicListingFact {
  label: string;
  value: string;
}

export interface PublicListingDetail {
  id: string;
  market: PublicDetailMarket;
  title: string;
  location: string;
  address?: string;
  price: number;
  priceUnit?: 'month' | 'year';
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  verified: boolean;
  images: string[];
  description?: string;
  amenities: string[];
  facts: PublicListingFact[];
  host?: { label: string; name: string; verified?: boolean; rating?: number; reviews?: number };
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/** Cached for a minute: fresh enough for price changes, cheap for crawlers. */
export const PUBLIC_DETAIL_REVALIDATE = 60;

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: PUBLIC_DETAIL_REVALIDATE } });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

const money = (v: unknown) => {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};
// Falsy on purpose: "0 bed" reads as a claim about the property, not a gap in the data.
const positive = (n?: number) => (n && n > 0 ? n : undefined);
const place = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(', ');
const humanise = (v?: string) =>
  v
    ? v
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase())
    : undefined;
const gallery = (cover?: string, images?: string[]) =>
  Array.from(new Set([cover, ...(images ?? [])].filter((x): x is string => !!x)));
const fact = (label: string, value: unknown): PublicListingFact[] =>
  value === undefined || value === null || value === '' ? [] : [{ label, value: String(value) }];

interface RentalDto {
  id: string;
  title: string;
  location: string;
  address?: string;
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
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  coverImageUrl?: string;
  images?: string[];
  amenities?: string[];
  isVerified?: boolean;
}

interface LandDto {
  id: string;
  title: string;
  price: number;
  city: string;
  state: string;
  address: string;
  description: string;
  amenities?: string[];
  coverImageUrl?: string;
  galleryImageUrls?: string[];
  isVerified: boolean;
  parcel?: {
    estateName?: string;
    plotNumber?: string;
    areaValue: number;
    areaUnit: 'SQUARE_METERS' | 'ACRE' | 'HECTARE';
    zoning?: string;
    permittedUse?: string;
    terrain?: string;
    roadAccess?: boolean;
    utilities?: string[];
    titleType?: string;
    tenure?: string;
  };
  diligence?: { status: string };
}

const AREA_UNIT = { SQUARE_METERS: 'sqm', ACRE: 'acres', HECTARE: 'hectares' } as const;

export async function fetchPublicListing(
  market: PublicDetailMarket,
  id: string
): Promise<PublicListingDetail | null> {
  const safeId = encodeURIComponent(id);

  if (market === 'rent') {
    const r = await get<RentalDto>(`/rentals/${safeId}`);
    if (!r) return null;
    return {
      id: r.id,
      market,
      title: r.title,
      location: r.location,
      address: r.address,
      price: money(r.price),
      priceUnit: r.period,
      bedrooms: positive(r.bedrooms),
      bathrooms: positive(r.bathrooms),
      size: positive(r.size),
      verified: !!r.verified,
      images: gallery(r.image, r.images),
      description: r.description,
      amenities: r.amenities ?? [],
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

  if (market === 'sale') {
    const s = await get<SaleDto>(`/marketplace/listings/${safeId}`);
    if (!s) return null;
    return {
      id: s.id,
      market,
      title: s.title,
      location: place(s.city, s.state),
      address: s.address,
      price: money(s.price),
      bedrooms: positive(s.bedrooms),
      bathrooms: positive(s.bathrooms),
      verified: !!s.isVerified,
      images: gallery(s.coverImageUrl, s.images),
      amenities: s.amenities ?? [],
      facts: [
        ...fact('Property type', humanise(s.propertyType)),
        ...fact('Payment', 'Escrow-protected'),
      ],
    };
  }

  const l = await get<LandDto>(`/land/listings/${safeId}`);
  if (!l) return null;
  const p = l.parcel;
  return {
    id: l.id,
    market,
    title: l.title,
    location: place(l.city, l.state),
    address: l.address,
    price: money(l.price),
    verified: !!l.isVerified,
    images: gallery(l.coverImageUrl, l.galleryImageUrls),
    description: l.description,
    amenities: l.amenities ?? [],
    facts: [
      ...fact('Area', p ? `${p.areaValue.toLocaleString()} ${AREA_UNIT[p.areaUnit]}` : undefined),
      ...fact('Title', humanise(p?.titleType)),
      ...fact('Estate', p?.estateName),
      ...fact('Plot', p?.plotNumber),
      ...fact('Zoning', p?.zoning),
      ...fact('Permitted use', p?.permittedUse),
      ...fact('Terrain', p?.terrain),
      ...fact('Road access', p?.roadAccess === undefined ? undefined : p.roadAccess ? 'Yes' : 'No'),
      ...fact('Utilities', p?.utilities?.length ? p.utilities.join(', ') : undefined),
      ...fact('Tenure', p?.tenure),
      ...fact('Due diligence', humanise(l.diligence?.status)),
    ],
  };
}

/** Where each market's browse page lives, for breadcrumbs and "back to results". */
export const MARKET_PATH: Record<PublicDetailMarket, string> = {
  rent: '/rent',
  sale: '/buy',
  land: '/land',
};
