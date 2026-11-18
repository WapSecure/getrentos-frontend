'use client';

import { ListingCard } from '@sureground/ui/ListingCard';
import type { ShowroomEventMarket } from '@sureground/shared/showroom';
import { track } from '@/lib/analytics';
import { MARKET_STATUS, type CardMarket, type MarketCard } from '@/lib/marketCards';
import { SaveListingButton } from './SaveListingButton';
import { TrustChainBadge } from '@/components/shared/trust/TrustChainBadge';
import { BoostedBadge } from '@/components/shared/boosts/BoostedBadge';
import { listingPath } from '@/lib/listingSlug';

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
  const href = listingPath(market, listing.id, listing.title);
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
      imagePreview={listing.imagePreview}
      imageAlt={listing.title}
      eager={eager}
      status={MARKET_STATUS[market]}
      // The chain pill says "Verified" only when every check is met; a passed property check alone never does.
      badges={
        <>
          <TrustChainBadge chain={listing.trustChain} fallbackVerified={listing.verified} />
          {listing.boosted && <BoostedBadge />}
        </>
      }
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
