'use client';

import Link from 'next/link';
import { ImageOff } from '@sureground/icons';
import { cn } from '@sureground/shared';
import { toMarketCard } from '@/lib/marketCards';
import { collectionPath, curatorLine, type PublicCollectionSummary } from '@/lib/collections';
import { SponsoredBadge } from './SponsoredBadge';

/** A collection on a landing page or storefront: its cover, title, who picked it and how many homes. */
export function CollectionTile({
  collection,
  className,
}: {
  collection: PublicCollectionSummary;
  className?: string;
}) {
  const cover = collection.cover ? toMarketCard(collection.market, collection.cover) : null;
  const count = `${collection.itemCount} ${collection.itemCount === 1 ? 'listing' : 'listings'}`;
  return (
    <Link
      href={collectionPath(collection.slug)}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {cover?.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed storage links, sized by srcset
          <img
            src={cover.image}
            srcSet={cover.imageSrcSet}
            sizes="(min-width: 1024px) 22rem, 80vw"
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-6 w-6" aria-hidden="true" />
          </div>
        )}
        {collection.sponsored && <SponsoredBadge className="absolute left-3 top-3 shadow-sm" />}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-base font-semibold text-foreground group-hover:text-primary">
          {collection.title}
        </h3>
        {collection.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{collection.description}</p>
        )}
        <p className="mt-auto pt-2 text-xs text-muted-foreground">
          {curatorLine(collection.curator)} · {count}
        </p>
      </div>
    </Link>
  );
}
