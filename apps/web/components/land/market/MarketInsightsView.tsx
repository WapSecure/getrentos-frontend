'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Button,
  DataTable,
  EmptyState,
  PageErrorState,
  Select,
  Skeleton,
  type Column,
} from '@sureground/ui';
import { AlertTriangle, BarChart3 } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
import {
  ALL_NIGERIAN_CITIES,
  NIGERIA_STATE_CITIES,
  NIGERIA_STATES,
} from '@/lib/constants/locations';
import { landMarketKeys } from '@/lib/landSalesQueryKeys';
import { estateStorefrontService } from '@/services/estateMarketplaceService';
import { landMarketService } from '@/services/landMarketService';
import { LAND_TITLE_TYPE_LABELS, type LandTitleType } from '@/types/land';
import type { LandMarketInsightsParams, LandMarketTrendPoint } from '@/types/landMarket';
import { DistributionStrip, TitleTypeBars, monthLabel } from './InsightsCharts';

// The trend chart pulls in recharts; it loads after the rest of the page.
const PriceTrendChart = dynamic(() => import('./PriceTrendChart').then((m) => m.PriceTrendChart), {
  ssr: false,
  loading: () => <Skeleton className="h-56 w-full rounded-xl" />,
});

const TITLE_OPTIONS = [
  { value: '', label: 'Any title document' },
  ...(Object.keys(LAND_TITLE_TYPE_LABELS) as LandTitleType[]).map((t) => ({
    value: t,
    label: LAND_TITLE_TYPE_LABELS[t],
  })),
];

const trendColumns: Column<LandMarketTrendPoint>[] = [
  { key: 'month', header: 'Month', render: (p) => monthLabel(p.month) },
  { key: 'listings', header: 'Listings', numeric: true, render: (p) => p.count },
  {
    key: 'median',
    header: 'Median ₦/m²',
    numeric: true,
    render: (p) => (p.medianPricePerSqm !== undefined ? formatCurrency(p.medianPricePerSqm) : '–'),
  },
];

const isTitleType = (v: string | null): v is LandTitleType => !!v && v in LAND_TITLE_TYPE_LABELS;

const Tile = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{value}</p>
    {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

export const MarketInsightsView = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params: LandMarketInsightsParams = useMemo(() => {
    const titleType = searchParams.get('titleType');
    return {
      state: searchParams.get('state') || undefined,
      city: searchParams.get('city') || undefined,
      estate: searchParams.get('estate') || undefined,
      titleType: isTitleType(titleType) ? titleType : undefined,
    };
  }, [searchParams]);

  const setFilter = (patch: Partial<Record<keyof LandMarketInsightsParams, string>>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const insights = useQuery({
    queryKey: landMarketKeys.insights(params),
    queryFn: () => unwrap(landMarketService.insights(params)),
    placeholderData: keepPreviousData,
  });
  const estates = useQuery({
    queryKey: ['estate-storefronts', 'directory', 'land-insights'],
    queryFn: () => unwrap(estateStorefrontService.directory({ pageSize: 100 })),
    staleTime: 5 * 60_000,
  });
  const estateOptions = [
    { value: '', label: 'Any estate' },
    ...(estates.data?.items ?? [])
      .filter((e) => e.slug)
      .map((e) => ({ value: e.slug as string, label: `${e.name} (${e.city})` })),
  ];
  const cities = params.state ? (NIGERIA_STATE_CITIES[params.state] ?? []) : ALL_NIGERIAN_CITIES;
  const data = insights.data;
  const filtered = Object.values(params).some(Boolean);

  return (
    <div className="space-y-8">
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          value={params.state ?? ''}
          onValueChange={(v) => setFilter({ state: v, city: '' })}
          options={[
            { value: '', label: 'All states' },
            ...NIGERIA_STATES.map((s) => ({ value: s, label: s })),
          ]}
          ariaLabel="State"
        />
        <Select
          value={params.city ?? ''}
          onValueChange={(v) => setFilter({ city: v })}
          options={[
            { value: '', label: 'All cities' },
            ...cities.map((c) => ({ value: c, label: c })),
          ]}
          ariaLabel="City"
          searchable
        />
        <Select
          value={params.estate ?? ''}
          onValueChange={(v) => setFilter({ estate: v })}
          options={estateOptions}
          ariaLabel="Estate"
          searchable
        />
        <Select
          value={params.titleType ?? ''}
          onValueChange={(v) => setFilter({ titleType: v })}
          options={TITLE_OPTIONS}
          ariaLabel="Title document"
        />
      </div>
      {filtered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.replace(pathname, { scroll: false })}
        >
          Clear filters
        </Button>
      )}

      {insights.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : !data ? (
        <PageErrorState
          description={insights.error instanceof Error ? insights.error.message : undefined}
          onRetry={() => insights.refetch()}
          isRetrying={insights.isRefetching}
        />
      ) : data.count === 0 ? (
        <EmptyState
          icon={BarChart3}
          title={filtered ? 'No verified land matches these filters' : 'No verified land here yet'}
          description="Figures cover only verified, in-date listings. Try a wider area."
          action={
            filtered ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.replace(pathname, { scroll: false })}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tile label="Verified listings" value={data.count.toLocaleString('en-NG')} />
            <Tile
              label="Median price per m²"
              value={
                data.pricePerSqm.median !== undefined
                  ? formatCurrency(data.pricePerSqm.median)
                  : '–'
              }
              hint={`From ${data.pricePerSqm.sampleSize} listings with an area`}
            />
            <Tile
              label="Median asking price"
              value={
                data.medianPrice !== undefined
                  ? formatCurrency(data.medianPrice, { compact: true })
                  : '–'
              }
            />
            <Tile
              label="Median plot size"
              value={
                data.medianAreaSqm !== undefined
                  ? `${Math.round(data.medianAreaSqm).toLocaleString('en-NG')} m²`
                  : '–'
              }
            />
          </div>

          {data.truncated && (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
              This area has many listings; the figures cover the newest of them.
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <section
              aria-labelledby="dist-heading"
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h2 id="dist-heading" className="font-semibold text-foreground">
                Spread of price per m²
              </h2>
              <p className="mb-4 mt-1 text-xs text-muted-foreground">
                The shaded band is the middle half of listings; the tick is the median.
              </p>
              <DistributionStrip dist={data.pricePerSqm} />
            </section>
            <section
              aria-labelledby="title-heading"
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h2 id="title-heading" className="mb-4 font-semibold text-foreground">
                Median price per m² by title document
              </h2>
              <TitleTypeBars groups={data.byTitleType} />
            </section>
          </div>

          <section
            aria-labelledby="trend-heading"
            className="rounded-2xl border border-border bg-card p-5 text-foreground"
          >
            <h2 id="trend-heading" className="font-semibold">
              Median asking price per m², last six months
            </h2>
            <p className="mb-4 mt-1 text-xs text-muted-foreground">
              By month the listing was published.
            </p>
            <PriceTrendChart trend={data.trend} />
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                Show as a table
              </summary>
              <DataTable
                className="mt-2"
                caption="Median asking price per m² by month"
                density="compact"
                columns={trendColumns}
                data={data.trend}
                getRowKey={(p) => p.month}
              />
            </details>
          </section>
          <p className="text-xs text-muted-foreground">
            Asking prices of verified, in-date land listings on Sureground, not completed sale
            prices. Updated {new Date(data.generatedAt).toLocaleString('en-NG')}.
          </p>
        </>
      )}
    </div>
  );
};
