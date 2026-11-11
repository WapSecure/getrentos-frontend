'use client';

import { MarketListingCard } from '@/components/market/MarketListingCard';
import { toMarketCard } from '@/lib/marketCards';
import type { PublicCollection } from '@/lib/collections';

/** The collection's listings, in the curator's order, counted under `{market}_collection`. */
export function CollectionListings({ collection }: { collection: PublicCollection }) {
  return (
    <ol
      aria-label="Listings in this collection"
      className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3"
    >
      {collection.items.map((item, position) => (
        <li key={item.listingId}>
          <MarketListingCard
            listing={toMarketCard(collection.market, item.card)}
            market={collection.market}
            surface={`${collection.market}_collection`}
            position={position}
            eager={position < 3}
            meta={item.note ? <span className="text-foreground/80">{item.note}</span> : undefined}
          />
        </li>
      ))}
    </ol>
  );
}
