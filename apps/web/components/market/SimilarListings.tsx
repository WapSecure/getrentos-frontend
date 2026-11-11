'use client';

import { useQuery } from '@tanstack/react-query';
import { ListingCard, Skeleton, type ListingPriceUnit } from '@sureground/ui';
import { srcSetOf, type ImageVariant, type ShowroomEventMarket } from '@sureground/shared/showroom';
import { authFetch, unwrap, safeCall } from '@/lib/apiHelpers';
import { track } from '@/lib/analytics';
import { publicMarketService } from '@/services/publicMarketService';
import { SaveListingButton } from './SaveListingButton';

export type SimilarMarket = 'rent' | 'sale' | 'land' | 'shortlet';

interface SimilarCard {
  id: string;
  title: string;
  location: string;
  price?: number;
  priceUnit?: ListingPriceUnit;
  image?: string;
  imageSrcSet?: string;
  verified?: boolean;
  beds?: number;
  baths?: number;
  size?: number | string;
  type?: string;
}

const LIMIT = 3;

const DETAIL_PATH: Record<SimilarMarket, string> = {
  rent: '/rent',
  sale: '/buy',
  land: '/land',
  shortlet: '/shortlets',
};

const STATUS: Record<SimilarMarket, string> = {
  rent: 'For rent',
  sale: 'For sale',
  land: 'Land',
  shortlet: 'Shortlet',
};

const AREA_UNIT: Record<string, string> = { SQUARE_METERS: 'sqm', ACRE: 'acres', HECTARE: 'ha' };

interface LandSimilarApi {
  id: string;
  title: string;
  price: number;
  city: string;
  state: string;
  isVerified?: boolean;
  coverImageUrl?: string;
  imageVariants?: ImageVariant[];
  parcel?: { areaValue?: number; areaUnit?: string };
}

interface ShortletSimilarApi {
  id: string;
  title: string;
  city: string;
  state: string;
  nightlyRate?: number;
  pricingMode?: 'PER_NIGHT' | 'FLAT_STAY';
  coverImageUrl?: string;
  imageVariants?: ImageVariant[];
  bedrooms?: number;
  bathrooms?: number;
}

/** Ranked by the server: same market, nearby, a comparable price and about the same bedrooms. */
async function fetchSimilar(market: SimilarMarket, id: string): Promise<SimilarCard[]> {
  const path = (base: string) => `${base}/${encodeURIComponent(id)}/similar?limit=${LIMIT}`;
  if (market === 'rent' || market === 'sale') {
    const cards = await unwrap(publicMarketService.similar(market, id, LIMIT));
    return cards.map((c) => ({
      id: c.id,
      title: c.title,
      location: c.location,
      price: c.price,
      priceUnit: c.priceUnit,
      image: c.image,
      imageSrcSet: c.imageSrcSet,
      verified: c.verified,
      beds: c.bedrooms,
      baths: c.bathrooms,
      size: c.size,
      type: c.propertyType,
    }));
  }
  if (market === 'land') {
    const items = await unwrap(safeCall(() => authFetch<LandSimilarApi[]>(path('/land/listings'))));
    return items.map((l) => ({
      id: l.id,
      title: l.title,
      location: `${l.city}, ${l.state}`,
      price: Number(l.price),
      image: l.coverImageUrl,
      imageSrcSet: srcSetOf(l.imageVariants),
      verified: l.isVerified,
      size:
        l.parcel?.areaValue != null
          ? `${l.parcel.areaValue.toLocaleString('en-NG')} ${AREA_UNIT[l.parcel.areaUnit ?? ''] ?? ''}`.trim()
          : undefined,
    }));
  }
  const items = await unwrap(safeCall(() => authFetch<ShortletSimilarApi[]>(path('/shortlets'))));
  return items.map((s) => ({
    id: s.id,
    title: s.title,
    location: `${s.city}, ${s.state}`,
    price: s.nightlyRate,
    priceUnit: s.pricingMode === 'PER_NIGHT' ? 'night' : undefined,
    image: s.coverImageUrl,
    imageSrcSet: srcSetOf(s.imageVariants),
    beds: s.bedrooms,
    baths: s.bathrooms,
  }));
}

export function SimilarListings({
  listingId,
  market,
}: {
  listingId: string;
  market: SimilarMarket;
}) {
  const query = useQuery({
    queryKey: ['public-market', market, 'similar', listingId],
    queryFn: () => fetchSimilar(market, listingId),
    staleTime: 5 * 60_000,
  });
  const listings = query.data ?? [];

  if (query.isLoading) {
    return (
      <section aria-label="Loading similar listings" className="mt-14 border-t border-border pt-10">
        <Skeleton className="h-7 w-48" />
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-72 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }
  if (!listings.length) return null;

  return (
    <section aria-labelledby="similar-listings" className="mt-14 border-t border-border pt-10">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Keep exploring</p>
      <h2 id="similar-listings" className="mt-1 text-2xl font-semibold tracking-tight">
        Similar listings
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Nearby options at a similar price{market === 'land' ? '' : ' and size'}.
      </p>
      <div className="mt-6 grid gap-x-5 gap-y-8 md:grid-cols-3">
        {listings.map((listing, position) => {
          const href = `${DETAIL_PATH[market]}/${listing.id}`;
          const event = {
            listingId: listing.id,
            market: market as ShowroomEventMarket,
            surface: `${market}_similar`,
            props: { position },
          };
          return (
            <ListingCard
              key={listing.id}
              href={href}
              onVisible={() => track({ name: 'property_impression', ...event })}
              onOpen={() => track({ name: 'property_card_click', ...event })}
              title={listing.title}
              location={listing.location}
              price={listing.price}
              priceUnit={listing.priceUnit}
              priceCompact={market === 'land'}
              image={listing.image}
              imageSrcSet={listing.imageSrcSet}
              imageAlt={listing.title}
              status={STATUS[market]}
              verified={listing.verified}
              facts={{
                beds: listing.beds,
                baths: listing.baths,
                size: listing.size,
                type: listing.type,
              }}
              actions={
                market === 'rent' || market === 'sale' ? (
                  <SaveListingButton listingId={listing.id} returnPath={href} appearance="card" />
                ) : undefined
              }
            />
          );
        })}
      </div>
    </section>
  );
}
