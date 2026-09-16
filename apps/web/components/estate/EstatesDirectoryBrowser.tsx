'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, MapPin, Search } from 'lucide-react';
import { Badge, EmptyState, Input, Pagination, Select, Skeleton } from '@getrentos/ui';
import { estateStorefrontService } from '@/services/estateMarketplaceService';
import { unwrap, type Paginated } from '@/lib/apiHelpers';
import { ALL_NIGERIAN_CITIES } from '@/lib/constants/locations';
import type { EstateDirectoryEntry } from '@/types/estate-marketplace';

const PAGE_SIZE = 12;

const EstateCard = ({ estate }: { estate: EstateDirectoryEntry }) => {
  const href = estate.slug ? `/e/${estate.slug}` : undefined;

  const body = (
    <>
      <div
        className="flex h-32 items-center justify-center rounded-t-2xl bg-gradient-to-br from-primary/15 to-primary/5 bg-cover bg-center"
        style={estate.bannerUrl ? { backgroundImage: `url(${estate.bannerUrl})` } : undefined}
      >
        {!estate.bannerUrl && <Building2 className="h-8 w-8 text-primary/50" />}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold text-foreground">{estate.name}</h3>

        <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {estate.address}, {estate.city}, {estate.state}
          </span>
        </p>

        {estate.bio && (
          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{estate.bio}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {estate.rentCount > 0 && <Badge variant="info">{estate.rentCount} to rent</Badge>}
          {estate.saleCount > 0 && <Badge variant="success">{estate.saleCount} for sale</Badge>}
          {estate.shortletCount > 0 && <Badge variant="warning">{estate.shortletCount} shortlets</Badge>}
          {estate.listingCount === 0 && <Badge variant="neutral">No live listings</Badge>}
        </div>

        <div className="mt-auto pt-4">
          {href ? (
            <span className="flex items-center gap-1 text-sm font-medium text-primary">
              View {estate.listingCount === 1 ? 'the property' : 'properties'}
              <ArrowRight className="h-4 w-4" />
            </span>
          ) : (
            // The estate has live listings but no public page yet. Saying so is
            // better than a card that looks clickable and is not.
            <span className="text-sm text-muted-foreground">
              This estate has not published a public page yet.
            </span>
          )}
        </div>
      </div>
    </>
  );

  const className =
    'flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow';

  return href ? (
    <Link href={href} className={`${className} hover:shadow-lg`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
};

/**
 * Public directory of estates.
 *
 * The directory only lists estates that are actually worth visiting — one with a
 * live listing or a published page — because a directory of empty pages is worse
 * than no directory. An estate whose page is not published yet can still appear
 * (it has live listings) and the card says so rather than pretending to be
 * clickable.
 */
export const EstatesDirectoryBrowser = ({
  initialData,
}: {
  /** The server-rendered first page. Used only for the unfiltered view. */
  initialData?: Paginated<EstateDirectoryEntry>;
}) => {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(1);

  const queryParams = {
    search: search.trim() || undefined,
    city: city || undefined,
    page,
    pageSize: PAGE_SIZE,
  };

  // Only the default view may start from the server payload: seeding a filtered
  // query with page 1 of everything would show the wrong estates while it loads.
  const isDefaultView = !search.trim() && !city && page === 1;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['estates', 'directory', queryParams],
    queryFn: () => unwrap(estateStorefrontService.directory(queryParams)),
    initialData: isDefaultView ? initialData : undefined,
  });

  const estates = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
          Estates on GetRentos
        </h1>
        <p className="mt-3 text-muted-foreground">
          Browse the properties marketed by an estate — the ones its own team lists, and the ones its
          residents&apos; owners list. Every home shows who is marketing it and whose it is.
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:max-w-md sm:flex-1">
          <Input
            id="estate-directory-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by estate name, address or city"
            leadingIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="sm:w-56">
          <Select
            ariaLabel="City"
            value={city}
            onValueChange={(value) => {
              setCity(value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All cities' },
              ...ALL_NIGERIAN_CITIES.map((name) => ({ value: name, label: name })),
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-10">
          <EmptyState
            icon={Building2}
            title="We could not load the estates"
            description="Something went wrong on our side. Please try again in a moment."
          />
        </div>
      ) : estates.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={Building2}
            title={search || city ? 'No estates match that' : 'No estates are listed yet'}
            description={
              search || city
                ? 'Try a different name or city.'
                : 'As soon as an estate markets a property, it appears here.'
            }
          />
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted-foreground">
            {total} estate{total === 1 ? '' : 's'}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {estates.map((estate) => (
              <EstateCard key={estate.estateId} estate={estate} />
            ))}
          </div>
          <div className="mt-8">
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </div>
        </>
      )}
    </section>
  );
};
