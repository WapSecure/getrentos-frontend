'use client';

import { useQuery } from '@tanstack/react-query';
import { cn } from '@sureground/shared';
import { unwrap } from '@/lib/apiHelpers';
import type { CardMarket } from '@/lib/marketCards';
import { collectionsService } from '@/services/collectionsService';
import { CollectionTile } from './CollectionTile';

/**
 * Published collections for a market or an estate. Renders nothing until there is at least one,
 * and nothing at all if the request fails: the page works the same without it.
 */
export function CollectionsStrip({
  market,
  estate,
  title = 'Collections',
  description = 'Hand-picked sets of listings. Each listing shows its own checks.',
  className,
}: {
  market?: CardMarket;
  /** An estate storefront slug: only that estate's own collections. */
  estate?: string;
  title?: string;
  description?: string;
  className?: string;
}) {
  const query = useQuery({
    queryKey: ['collections', 'public', market ?? 'all', estate ?? ''],
    queryFn: () => unwrap(collectionsService.listPublic({ market, estate, limit: 6 })),
    staleTime: 5 * 60_000,
    retry: false,
  });
  const collections = query.data ?? [];
  if (!collections.length) return null;

  const headingId = `collections-${market ?? 'all'}-${estate ?? 'market'}`;
  return (
    <section aria-labelledby={headingId} className={cn('min-w-0', className)}>
      <h2 id={headingId} className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <ul className="-mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {collections.map((collection) => (
          <li
            key={collection.id}
            className="w-[80vw] max-w-sm shrink-0 snap-start sm:w-auto sm:max-w-none"
          >
            <CollectionTile collection={collection} />
          </li>
        ))}
      </ul>
    </section>
  );
}
