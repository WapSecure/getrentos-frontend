import Link from 'next/link';
import { BadgeCheck, Bath, BedDouble, ImageOff, MapPin, Ruler } from '@sureground/icons';
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
const MARKET_LABEL: Record<PublicMarket, string> = { rent: 'To rent', sale: 'For sale' };

/**
 * Brik-style listing: a 4:3 photo with the market and verified mark on it, a serif name, the area,
 * a prominent price and one line of facts.
 */
export const ListingTile = ({ listing, market, eager = false }: ListingTileProps) => {
  const facts = [
    listing.bedrooms
      ? { icon: BedDouble, label: `${listing.bedrooms} ${listing.bedrooms === 1 ? 'bed' : 'beds'}` }
      : null,
    listing.bathrooms
      ? {
          icon: Bath,
          label: `${listing.bathrooms} ${listing.bathrooms === 1 ? 'bath' : 'baths'}`,
        }
      : null,
    listing.size ? { icon: Ruler, label: `${listing.size} m²` } : null,
  ].filter((fact): fact is NonNullable<typeof fact> => fact !== null);
  // "Lagos, Lagos" (city and state with the same name) reads as a mistake.
  const location = [...new Set((listing.location ?? '').split(',').map((part) => part.trim()))]
    .filter(Boolean)
    .join(', ');
  const basis =
    market === 'sale' ? 'asking' : listing.priceUnit ? PRICE_BASIS[listing.priceUnit] : null;

  return (
    <Link
      href={listingPath(market, listing.id, listing.title)}
      className="group relative flex min-w-0 flex-col gap-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted">
        {listing.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived storage links
          <img
            src={listing.image}
            srcSet={listing.imageSrcSet}
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            alt=""
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="h-6 w-6" aria-hidden="true" />
            <span className="label-caps">Photos coming soon</span>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <h3 className="truncate text-[1.0625rem] leading-snug font-medium text-foreground transition-colors group-hover:text-primary">
          {listing.title}
        </h3>
        {location ? (
          <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">{location}</span>
          </p>
        ) : null}
        <p className="order-first flex flex-wrap items-baseline gap-x-2 tabular-nums">
          <span className="font-display text-[1.625rem] leading-none font-normal tracking-[-0.01em] text-foreground">
            {formatCurrency(listing.price)}
          </span>
          {basis ? <span className="label-caps text-muted-foreground">{basis}</span> : null}
        </p>
        {facts.length > 0 ? (
          <ul className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-sm text-foreground">
            {facts.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5 tabular-nums">
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {/* Over the photo, but last in the markup so the link's name starts with the title.
          Solid chips, not translucent: they have to read on any photo in both themes. */}
      <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start gap-2">
        <span className="label-caps rounded-xs bg-card px-2.5 py-1 text-foreground shadow-sm">
          {MARKET_LABEL[market]}
        </span>
        {listing.verified ? (
          <span className="label-caps inline-flex items-center gap-1.5 rounded-xs bg-primary px-2.5 py-1 text-primary-foreground shadow-sm">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Verified
          </span>
        ) : null}
      </div>
    </Link>
  );
};
