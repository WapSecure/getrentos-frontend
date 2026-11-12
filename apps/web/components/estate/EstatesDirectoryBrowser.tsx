'use client';

import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, MapPin } from '@sureground/icons';
import { EmptyState, Pagination, SearchInput, Select, Skeleton } from '@sureground/ui';
import { Container } from '@/components/marketing/Container';
import { estateStorefrontService } from '@/services/estateMarketplaceService';
import { unwrap, type Paginated } from '@/lib/apiHelpers';
import { ALL_NIGERIAN_CITIES } from '@/lib/constants/locations';
import type { EstateDirectoryEntry } from '@/types/estate-marketplace';

const PAGE_SIZE = 12;

const EstateCard = ({ estate }: { estate: EstateDirectoryEntry }) => {
  const href = estate.slug ? `/e/${estate.slug}` : undefined;
  const counts = [
    estate.rentCount > 0 ? `${estate.rentCount} to rent` : null,
    estate.saleCount > 0 ? `${estate.saleCount} for sale` : null,
    estate.shortletCount > 0
      ? `${estate.shortletCount} short ${estate.shortletCount === 1 ? 'stay' : 'stays'}`
      : null,
  ].filter(Boolean);

  const body = (
    <>
      <div
        className="flex aspect-[16/9] items-center justify-center overflow-hidden bg-muted bg-cover bg-center"
        style={estate.bannerUrl ? { backgroundImage: `url(${estate.bannerUrl})` } : undefined}
      >
        {!estate.bannerUrl && (
          <Building2 className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <h2 className="font-display text-[1.375rem] leading-tight font-normal tracking-[-0.005em]">
          {estate.name}
        </h2>

        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {estate.address}, {estate.city}, {estate.state}
          </span>
        </p>

        {estate.bio && <p className="line-clamp-2 text-sm text-muted-foreground">{estate.bio}</p>}

        <p className="label-caps text-muted-foreground tabular-nums">
          {counts.length > 0 ? counts.join(' · ') : 'No live listings'}
        </p>

        <div className="mt-auto pt-2">
          {href ? (
            <span className="label-caps inline-flex items-center gap-3 border-b border-foreground/40 pb-1.5 text-foreground transition-colors group-hover:border-foreground">
              View {estate.listingCount === 1 ? 'the property' : 'properties'}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </span>
          ) : (
            // No public page yet: shown as not clickable rather than as a card that links nowhere.
            <span className="text-sm text-muted-foreground">
              This estate has not published a public page yet.
            </span>
          )}
        </div>
      </div>
    </>
  );

  const className = 'group flex min-w-0 flex-col gap-4 border-t border-border pt-5';

  return href ? (
    <Link
      href={href}
      className={`${className} focus-visible:outline-2 focus-visible:outline-offset-4`}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
};

export const EstatesDirectoryBrowser = ({
  initialData,
}: {
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

  // Only the unfiltered view may start from the server payload; seeding a filtered query with it would show the wrong estates while loading.
  const isDefaultView = !search.trim() && !city && page === 1;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['estates', 'directory', queryParams],
    queryFn: () => unwrap(estateStorefrontService.directory(queryParams)),
    initialData: isDefaultView ? initialData : undefined,
    placeholderData: keepPreviousData,
  });

  const estates = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <Container className="pb-20 md:pb-28">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:max-w-md sm:flex-1">
          <SearchInput
            id="estate-directory-search"
            value={search}
            onValueChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            label="Search estates"
            placeholder="Search by estate name, address or city"
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
        <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-none" />
          ))}
        </div>
      ) : isError && !data ? (
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
          <p className="label-caps mt-10 text-muted-foreground tabular-nums">
            {total} estate{total === 1 ? '' : 's'}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {estates.map((estate) => (
              <EstateCard key={estate.estateId} estate={estate} />
            ))}
          </div>
          <div className="mt-8">
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </div>
        </>
      )}
    </Container>
  );
};
