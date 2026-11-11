'use client';

import { ListingCard } from '@sureground/ui';
import type { ShowroomEventMarket } from '@sureground/shared/showroom';
import { track } from '@/lib/analytics';
import { DETAIL_PATH, MARKET_STATUS, type CardMarket, type MarketCard } from '@/lib/marketCards';
import { SaveListingButton } from './SaveListingButton';

/** One public listing card in any market, counted under `surface` (e.g. "rent_similar"). */
export function MarketListingCard({
  listing,
  market,
  surface,
  position,
  meta,
  eager,
}: {
  listing: MarketCard;
  market: CardMarket;
  surface: string;
  position: number;
  meta?: React.ReactNode;
  eager?: boolean;
}) {
  const href = `${DETAIL_PATH[market]}/${listing.id}`;
  const event = {
    listingId: listing.id,
    market: market as ShowroomEventMarket,
    surface,
    props: { position },
  };
  return (
    <ListingCard
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
      eager={eager}
      status={MARKET_STATUS[market]}
      verified={listing.verified}
      facts={{ beds: listing.beds, baths: listing.baths, size: listing.size, type: listing.type }}
      meta={meta}
      actions={
        market === 'rent' || market === 'sale' ? (
          <SaveListingButton listingId={listing.id} returnPath={href} appearance="card" />
        ) : undefined
      }
    />
  );
}
