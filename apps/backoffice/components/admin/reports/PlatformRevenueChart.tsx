'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@getrentos/shared';

interface RevenuePoint {
  month: string;
  gmv: number;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {formatCurrency(payload[0].value as number, { compact: true })} GMV
      </p>
    </div>
  );
};

interface PlatformRevenueChartProps {
  data: RevenuePoint[];
}

export const PlatformRevenueChart = ({ data }: PlatformRevenueChartProps) => {
  const currentValue = data.length > 0 ? data[data.length - 1].gmv : 0;
  const previousValue = data.length > 1 ? data[data.length - 2].gmv : 0;
  const change = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : null;

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Platform GMV</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gross merchandise value, last 6 months
          </p>
        </div>
        {change !== null && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${change >= 0 ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}
          >
            <TrendingUp
              className={`h-3 w-3 ${change < 0 ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
            {change >= 0 ? '+' : ''}
            {change.toFixed(1)}%
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-center">
          <div>
            <TrendingUp className="mx-auto mb-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No GMV data is available yet</p>
          </div>
        </div>
      ) : (
        <div
          className="h-56"
          role="img"
          aria-label={`Platform gross merchandise value over the last six months. Latest value: ${formatCurrency(currentValue, { compact: true })}.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="currentColor"
                className="text-muted-foreground/20"
              />
              <XAxis
                dataKey="month"
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
                width={48}
                tickFormatter={(value: number) => formatCurrency(value, { compact: true })}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="gmv"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#revenueFill)"
                activeDot={{ r: 4, fill: 'var(--primary)', stroke: 'white', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
