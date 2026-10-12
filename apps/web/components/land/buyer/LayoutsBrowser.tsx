'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge, Input, Pagination, Select } from '@getrentos/ui';
import { BadgeCheck, LayoutGrid, MapPin, Search } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import { landLayoutKeys } from '@/lib/landSalesQueryKeys';
import {
  ALL_NIGERIAN_CITIES,
  NIGERIA_STATE_CITIES,
  NIGERIA_STATES,
} from '@/lib/constants/locations';
import { landLayoutService } from '@/services/landBuyerService';
import type { PublicLandLayoutSummary } from '@/types/landBuyer';

const PAGE_SIZE = 12;

const priceRange = (layout: PublicLandLayoutSummary) => {
  if (layout.priceFrom === undefined) return 'Sold out';
  if (layout.priceTo === undefined || layout.priceTo === layout.priceFrom) {
    return formatCurrency(layout.priceFrom, { compact: true });
  }
  return `${formatCurrency(layout.priceFrom, { compact: true })} – ${formatCurrency(layout.priceTo, { compact: true })}`;
};

/** Estates selling plots on verified, in-date master parcels. */
export const LayoutsBrowser = () => {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(
    () => ({
      search: debounced || undefined,
      state: state || undefined,
      city: city || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [debounced, state, city, page]
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: landLayoutKeys.list(params),
    queryFn: () => unwrap(landLayoutService.list(params)),
  });
  const layouts = data?.items ?? [];
  const total = data?.total ?? 0;
  const cities = state ? (NIGERIA_STATE_CITIES[state] ?? []) : ALL_NIGERIAN_CITIES;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-3 sm:grid-cols-[1.6fr_1fr_1fr]">
        <Input
          id="layout-search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search estates by name"
          aria-label="Search estates"
          leadingIcon={<Search className="h-4 w-4" />}
        />
        <Select
          value={state}
          onValueChange={(v) => {
            setState(v);
            setCity('');
            setPage(1);
          }}
          options={[
            { value: '', label: 'All states' },
            ...NIGERIA_STATES.map((s) => ({ value: s, label: s })),
          ]}
          ariaLabel="Filter by state"
        />
        <Select
          value={city}
          onValueChange={(v) => {
            setCity(v);
            setPage(1);
          }}
          options={[
            { value: '', label: 'All cities' },
            ...cities.map((c) => ({ value: c, label: c })),
          ]}
          ariaLabel="Filter by city"
          searchable
        />
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {isLoading
          ? 'Loading estates…'
          : `${total} ${total === 1 ? 'estate' : 'estates'} selling plots`}
      </p>

      {isError ? (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive"
        >
          {error instanceof Error ? error.message : 'Unable to load estates.'}
        </div>
      ) : isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : layouts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <LayoutGrid className="mx-auto h-9 w-9 text-primary" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold text-foreground">No estates match</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Only estates on a verified, in-date master parcel are listed. Try another area.
          </p>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {layouts.map((layout) => (
            <li key={layout.id}>
              <Link
                href={LAND_BUYER_ROUTES.layout(layout.id)}
                className="block h-full rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Badge variant="success" icon={<BadgeCheck className="h-3.5 w-3.5" />}>
                  Verified parcel
                </Badge>
                <h2 className="mt-3 text-lg font-semibold text-foreground">{layout.name}</h2>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {layout.city}, {layout.state}
                </p>
                {layout.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                    {layout.description}
                  </p>
                )}
                <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Plots</dt>
                    <dd className="font-medium text-foreground">
                      {layout.availablePlots} of {layout.totalPlots} available
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Price</dt>
                    <dd className="font-medium text-foreground">{priceRange(layout)}</dd>
                  </div>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {total > PAGE_SIZE && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      )}
    </div>
  );
};
