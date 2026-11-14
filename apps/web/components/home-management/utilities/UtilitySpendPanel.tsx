'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { BarChart3 } from '@sureground/icons';
import {
  UTILITY_SPEND_CATEGORIES,
  UTILITY_SPEND_CATEGORY_LABELS,
  costPerUnitFigure,
  formatCurrency,
  formatLitres,
  formatSpendOrNoData,
  type UtilitiesAnalytics,
  type UtilitySpendCategory,
} from '@sureground/shared';
import {
  Card,
  DataTable,
  EmptyState,
  SegmentedControl,
  Skeleton,
  type Column,
} from '@sureground/ui';
import { HomeManagementSectionHeading } from '@/components/home-management/HomeManagementSectionHeading';
import { unwrap } from '@/lib/apiHelpers';
import { homeManagementKeys } from '@/lib/queryKeys';
import { utilitiesService } from '@/services/utilitiesService';

/** Categorical slots 1 to 4 of the validated chart palette, light and dark (see the dataviz palette). */
const SERIES_VAR: Record<UtilitySpendCategory, string> = {
  fuel: 'var(--utility-series-1)',
  electricity: 'var(--utility-series-2)',
  water: 'var(--utility-series-3)',
  repairs: 'var(--utility-series-4)',
};

/** Written out in full so Tailwind generates them; `dark:` follows the app's theme class. */
const PALETTE_CLASS =
  '[--utility-series-1:#2a78d6] [--utility-series-2:#eb6834] [--utility-series-3:#1baf7a] [--utility-series-4:#eda100] dark:[--utility-series-1:#3987e5] dark:[--utility-series-2:#d95926] dark:[--utility-series-3:#199e70] dark:[--utility-series-4:#c98500]';

type Range = '6' | '12' | '24';

type ChartRow = { label: string } & Partial<Record<UtilitySpendCategory, number>>;

function SpendTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-lg">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={String(entry.dataKey)} className="flex items-center gap-2 text-foreground">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: entry.color }}
          />
          {UTILITY_SPEND_CATEGORY_LABELS[entry.dataKey as UtilitySpendCategory]}:{' '}
          {formatCurrency(Number(entry.value))}
        </p>
      ))}
      <p className="mt-1 font-semibold text-foreground">Total {formatCurrency(total)}</p>
    </div>
  );
}

/** Recorded spend by Lagos month. A month with nothing logged reads "No data yet", never ₦0. */
export function UtilitySpendPanel({ propertyId }: { propertyId?: string }) {
  const [range, setRange] = useState<Range>('12');
  const query = useQuery({
    queryKey: [...homeManagementKeys.utilities.all, 'analytics', propertyId ?? 'all', range],
    queryFn: () => unwrap(utilitiesService.analytics({ propertyId, months: Number(range) })),
  });
  const data = query.data;
  const hasData = !!data && data.entriesCount > 0;
  const chartRows: ChartRow[] = (data?.months ?? []).map((month) => ({
    label: month.label.replace(/ (\d{4})$/, (_, year: string) => ` ${year.slice(2)}`),
    ...Object.fromEntries(
      UTILITY_SPEND_CATEGORIES.flatMap((category) =>
        month[category] ? [[category, month[category]!.amount]] : []
      )
    ),
  }));
  const presentCategories = UTILITY_SPEND_CATEGORIES.filter((category) => data?.totals[category]);

  const columns: Column<UtilitiesAnalytics['months'][number]>[] = [
    { key: 'month', header: 'Month', render: (row) => row.label },
    ...UTILITY_SPEND_CATEGORIES.map(
      (category): Column<UtilitiesAnalytics['months'][number]> => ({
        key: category,
        header: UTILITY_SPEND_CATEGORY_LABELS[category],
        numeric: true,
        render: (row) => (
          <span className={row[category] ? '' : 'text-muted-foreground'}>
            {formatSpendOrNoData(row[category]?.amount ?? null, 'None')}
          </span>
        ),
      })
    ),
    {
      key: 'total',
      header: 'Total',
      numeric: true,
      render: (row) => (
        <span className={row.total === null ? 'text-muted-foreground' : 'font-medium'}>
          {formatSpendOrNoData(row.total)}
        </span>
      ),
    },
  ];

  return (
    <section aria-labelledby="utility-spend-heading" className={`space-y-5 ${PALETTE_CLASS}`}>
      <HomeManagementSectionHeading
        id="utility-spend-heading"
        title="Recorded spend"
        description="Fuel, electricity, water and utility repairs as logged, by month in Lagos time. Voided entries are left out."
        actions={
          <SegmentedControl
            aria-label="Months shown"
            value={range}
            onValueChange={setRange}
            segments={[
              { value: '6', label: '6 months' },
              { value: '12', label: '12 months' },
              { value: '24', label: '24 months' },
            ]}
          />
        }
      />

      {query.isLoading ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : query.isError ? (
        <EmptyState
          icon={BarChart3}
          title="Spend could not be loaded"
          description="Refresh the page to try again."
        />
      ) : !hasData ? (
        <EmptyState
          icon={BarChart3}
          title="No data yet"
          description="Log fuel, tokens, bills, tanker deliveries or water tests and the monthly spend appears here."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Figure label="Total recorded" value={formatSpendOrNoData(data!.totals.total)} />
            <Figure label="Per unit" {...costPerUnitFigure(data!, Boolean(propertyId))} />
            <Figure
              label="Diesel bought"
              value={
                data!.totals.fuel?.quantity
                  ? formatLitres(data!.totals.fuel.quantity)
                  : 'No data yet'
              }
            />
            <Figure
              label="Average diesel price"
              value={
                data!.dieselPricePerLitre === null
                  ? 'No data yet'
                  : `${formatCurrency(data!.dieselPricePerLitre)} a litre`
              }
              hint="From entries that recorded litres"
            />
          </div>

          <Card className="rounded-2xl p-5">
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Legend">
              {presentCategories.map((category) => (
                <span key={category} className="flex items-center gap-1.5 text-sm text-foreground">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: SERIES_VAR[category] }}
                  />
                  {UTILITY_SPEND_CATEGORY_LABELS[category]}
                </span>
              ))}
            </div>
            <div
              className="h-64"
              role="img"
              aria-label="Recorded utility spend by month. The table below lists the same figures."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="currentColor" className="text-border" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'currentColor' }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'currentColor' }}
                    className="text-muted-foreground"
                    tickFormatter={(value) => formatCurrency(value, { compact: true })}
                    width={60}
                  />
                  <Tooltip
                    content={<SpendTooltip />}
                    cursor={{ fill: 'var(--secondary)', opacity: 0.5 }}
                  />
                  {presentCategories.map((category, index) => (
                    <Bar
                      key={category}
                      dataKey={category}
                      stackId="spend"
                      fill={SERIES_VAR[category]}
                      stroke="var(--card)"
                      strokeWidth={2}
                      maxBarSize={36}
                      radius={index === presentCategories.length - 1 ? [4, 4, 0, 0] : 0}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Based on {data!.entriesCount} recorded{' '}
              {data!.entriesCount === 1 ? 'entry' : 'entries'}. Only what was logged is counted, so
              a month with gaps may be understated.
            </p>
          </Card>

          <DataTable
            caption="Recorded utility spend by month"
            columns={columns}
            data={[...data!.months].reverse()}
            getRowKey={(row) => row.month}
            minWidth="640px"
            density="compact"
          />
        </>
      )}
    </section>
  );
}

function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="rounded-2xl p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-[-0.01em] text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
