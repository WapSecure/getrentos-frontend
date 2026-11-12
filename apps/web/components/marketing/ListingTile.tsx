import Link from 'next/link';
import { BadgeCheck } from '@sureground/icons';
import { formatCurrency } from '@/lib/format';
import { listingPath } from '@/lib/listingSlug';
import type { PublicListingCard, PublicMarket } from '@/lib/publicListingMap';

interface ListingTileProps {
  listing: PublicListingCard;
  market: PublicMarket;
  /** Only the first row on a page should load eagerly. */
  eager?: boolean;
}

const PRICE_BASIS: Record<string, string> = { year: 'per year', month: 'per month' };

/** Brik-style listing: photo, a serif name, then one line of facts in tracked capitals. */
export const ListingTile = ({ listing, market, eager = false }: ListingTileProps) => {
  const facts = [
    listing.bedrooms ? `${listing.bedrooms} ${listing.bedrooms === 1 ? 'bed' : 'beds'}` : null,
    listing.bathrooms ? `${listing.bathrooms} ${listing.bathrooms === 1 ? 'bath' : 'baths'}` : null,
    listing.size ? `${listing.size} m²` : null,
  ].filter(Boolean);
  const basis =
    market === 'sale' ? 'asking' : listing.priceUnit ? PRICE_BASIS[listing.priceUnit] : null;

  return (
    <Link
      href={listingPath(market, listing.id, listing.title)}
      className="group flex min-w-0 flex-col gap-4 focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {listing.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived storage links
          <img
            src={listing.image}
            srcSet={listing.imageSrcSet}
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            alt=""
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="label-caps text-muted-foreground">Photos coming soon</span>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <h3 className="font-display truncate text-[1.375rem] leading-tight font-normal tracking-[-0.005em]">
          {listing.title}
        </h3>
        {listing.location ? (
          <p className="truncate text-sm text-muted-foreground">{listing.location}</p>
        ) : null}
        <p className="label-caps flex flex-wrap items-center gap-x-2 gap-y-1 tabular-nums">
          <span>{formatCurrency(listing.price)}</span>
          {basis ? <span className="text-muted-foreground">{basis}</span> : null}
          {facts.map((fact) => (
            <span key={fact} className="flex items-center gap-2">
              <span aria-hidden="true" className="text-muted-foreground/60">
                /
              </span>
              {fact}
            </span>
          ))}
        </p>
        {listing.verified ? (
          <p className="label-caps flex items-center gap-1.5 text-success">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Verified listing
          </p>
        ) : null}
      </div>
    </Link>
  );
};
