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
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/format';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';

interface RevenuePoint {
  month: string;
  collected: number;
}

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

export const LandlordRevenueChart = () => {
  const { data = [] } = useQuery({
    queryKey: landlordKeys.revenueTrend,
    queryFn: () => unwrap(landlordService.getRevenueTrend()),
  });

  const revenueData: RevenuePoint[] = data.map((p) => ({ month: p.label, collected: p.value }));
  const hasData = revenueData.some((p) => p.collected > 0);

  const currentMonth = revenueData[revenueData.length - 1]?.collected ?? 0;
  const previousMonth = revenueData[revenueData.length - 2]?.collected ?? 0;
  const change = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : null;

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Rent Collection Trend</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Monthly income, last 6 months</p>
        </div>
        {change !== null && (
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
        )}
      </div>

      {!hasData ? (
        <div className="h-56 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-secondary flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No rent collection data yet</p>
          </div>
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
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
                width={56}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="collected"
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
