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
import { formatCurrency } from '@/lib/format';

interface ValuePoint {
  month: string;
  value: number;
}

const portfolioData: ValuePoint[] = [
  { month: 'Mar', value: 285_000_000 },
  { month: 'Apr', value: 288_500_000 },
  { month: 'May', value: 291_000_000 },
  { month: 'Jun', value: 296_200_000 },
  { month: 'Jul', value: 301_800_000 },
  { month: 'Aug', value: 308_500_000 },
];

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {formatCurrency(payload[0].value as number)}
      </p>
    </div>
  );
};

export const OwnerPortfolioChart = () => {
  const currentValue = portfolioData[portfolioData.length - 1].value;
  const previousValue = portfolioData[portfolioData.length - 2].value;
  const change = ((currentValue - previousValue) / previousValue) * 100;

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Portfolio Value Trend</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Estimated market value, last 6 months
          </p>
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            change >= 0
              ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
              : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
          }`}
        >
          <TrendingUp className={`w-3 h-3 ${change < 0 ? 'rotate-180' : ''}`} />
          {change >= 0 ? '+' : ''}
          {change.toFixed(1)}%
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={portfolioData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="currentColor"
              className="text-gray-100 dark:text-white/5"
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
              tickFormatter={(value) => formatCurrency(value, { compact: true })}
              width={64}
              domain={['dataMin - 5000000', 'dataMax + 5000000']}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#portfolioFill)"
              activeDot={{ r: 4, fill: 'var(--primary)', stroke: 'white', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
