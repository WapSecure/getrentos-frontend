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
import { RefreshCcw, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { Button } from '@getrentos/ui';

interface GrowthPoint {
  month: string;
  users: number;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{payload[0].value} new users</p>
    </div>
  );
};

export const PlatformGrowthChart = () => {
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.userGrowth,
    queryFn: () => unwrap(adminService.getUserGrowth()),
  });

  const growthData: GrowthPoint[] = (data ?? []).map((p) => ({ month: p.label, users: p.value }));
  const hasData = growthData.some((p) => p.users > 0);

  const currentValue = growthData[growthData.length - 1]?.users ?? 0;
  const previousValue = growthData[growthData.length - 2]?.users ?? 0;
  const change = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : null;

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Platform Growth</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            New registered users, last 6 months
          </p>
        </div>
        {change !== null && (
          <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20">
            <TrendingUp className="w-3 h-3" />
            {change >= 0 ? '+' : ''}
            {change.toFixed(1)}%
          </div>
        )}
      </div>

      {isLoading ? (
        <div
          className="h-56 animate-pulse rounded-lg bg-secondary/50"
          aria-label="Loading platform growth chart"
        />
      ) : isError ? (
        <div className="h-56 flex flex-col items-center justify-center text-center" role="alert">
          <p className="text-sm font-medium text-foreground">Growth data could not be loaded</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try again without reloading the dashboard.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => refetch()}
            disabled={isFetching}
            isLoading={isFetching}
          >
            <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" /> Try again
          </Button>
        </div>
      ) : !hasData ? (
        <div className="h-56 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-secondary flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No user growth data yet</p>
          </div>
        </div>
      ) : (
        <div
          className="h-56"
          role="img"
          aria-label={`New registered users over the last six months. Latest value: ${currentValue}.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
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
                width={40}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#growthFill)"
                activeDot={{ r: 4, fill: 'var(--primary)', stroke: 'white', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
