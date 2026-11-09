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
import type { LandMarketTrendPoint } from '@/types/landMarket';
import { monthLabel } from './InsightsCharts';

// Its own module so the market page can load recharts (~100 kB) after the rest.
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

// Months without a priced listing are gaps, not zeros.
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
