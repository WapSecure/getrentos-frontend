'use client';

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
import { formatCurrency } from '@/lib/format';
import { LAND_TITLE_TYPE_LABELS } from '@/types/land';
import type {
  LandMarketTrendPoint,
  LandTitleTypeBreakdown,
  NairaDistribution,
} from '@/types/landMarket';

/** "2026-03" → "Mar 2026". */
export const monthLabel = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return month;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

const TrendTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as { median?: number; count: number };
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold text-foreground">
        {point.median !== undefined ? `${formatCurrency(point.median)}/m²` : 'No priced listings'}
      </p>
      <p className="text-muted-foreground">
        {point.count} listing{point.count === 1 ? '' : 's'}
      </p>
    </div>
  );
};

/**
 * Median asking ₦/m² by month of publication. One series, so no legend: the
 * heading names it. Months without a priced listing show as gaps, not zeros.
 */
export const PriceTrendChart = ({ trend }: { trend: LandMarketTrendPoint[] }) => {
  const data = trend.map((p) => ({
    month: monthLabel(p.month),
    median: p.medianPricePerSqm,
    count: p.count,
  }));
  if (!data.some((d) => d.median !== undefined)) {
    return (
      <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Not enough priced listings in the last six months.
      </p>
    );
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.08} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }}
            tickFormatter={(v: number) => formatCurrency(v, { compact: true })}
          />
          <Tooltip
            content={<TrendTooltip />}
            cursor={{ fill: 'currentColor', fillOpacity: 0.05 }}
          />
          <Bar dataKey="median" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Median ₦/m² by title document, as plain bars scaled to the dearest group. */
export const TitleTypeBars = ({ groups }: { groups: LandTitleTypeBreakdown[] }) => {
  const priced = groups.filter((g) => g.medianPricePerSqm !== undefined);
  const max = Math.max(1, ...priced.map((g) => g.medianPricePerSqm ?? 0));
  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">No listings to break down.</p>;
  }
  return (
    <ul className="space-y-3">
      {[...groups]
        .sort((a, b) => (b.medianPricePerSqm ?? -1) - (a.medianPricePerSqm ?? -1))
        .map((g) => {
          const label = g.titleType ? LAND_TITLE_TYPE_LABELS[g.titleType] : 'Title not recorded';
          const pct = g.medianPricePerSqm ? (g.medianPricePerSqm / max) * 100 : 0;
          return (
            <li key={g.titleType ?? 'none'}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-foreground">{label}</span>
                <span className="tabular-nums text-foreground">
                  {g.medianPricePerSqm ? `${formatCurrency(g.medianPricePerSqm)}/m²` : '–'}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {g.count} listing{g.count === 1 ? '' : 's'}
                  </span>
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-secondary" aria-hidden>
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
    </ul>
  );
};

/** The spread of ₦/m²: the middle half as a band, the median as a tick. */
export const DistributionStrip = ({ dist }: { dist: NairaDistribution }) => {
  const { min, p25, median, p75, max } = dist;
  if (min === undefined || max === undefined || median === undefined) {
    return <p className="text-sm text-muted-foreground">Not enough listings with an area.</p>;
  }
  const span = Math.max(1, max - min);
  const at = (v: number) => `${((v - min) / span) * 100}%`;
  return (
    <div className="space-y-3">
      <div className="relative h-4 rounded-full bg-secondary" aria-hidden>
        {p25 !== undefined && p75 !== undefined && (
          <div
            className="absolute inset-y-0 rounded-full bg-primary/30"
            style={{ left: at(p25), width: `${((p75 - p25) / span) * 100}%` }}
          />
        )}
        <div
          className="absolute inset-y-[-3px] w-1 rounded bg-primary"
          style={{ left: at(median) }}
        />
      </div>
      <dl className="grid grid-cols-3 gap-2 text-xs sm:grid-cols-5">
        {(
          [
            ['Lowest', min],
            ['Lower quarter', p25],
            ['Median', median],
            ['Upper quarter', p75],
            ['Highest', max],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {value !== undefined ? formatCurrency(value) : '–'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
