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
import { formatTrend, monthTrend } from '@getrentos/shared';
import { Badge, Card, EmptyState, Skeleton } from '@getrentos/ui';
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
  const { data = [], isPending } = useQuery({
    queryKey: landlordKeys.revenueTrend,
    queryFn: () => unwrap(landlordService.getRevenueTrend()),
  });

  const revenueData: RevenuePoint[] = data.map((p) => ({ month: p.label, collected: p.value }));
  const hasData = revenueData.some((p) => p.collected > 0);

  const trend = monthTrend(data);

  return (
    <Card className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-[-0.015em] text-foreground">
            Rent collection
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Collected income over the last 6 months
          </p>
        </div>
        {trend && (
          <Badge
            variant={trend.change >= 0 ? 'success' : 'danger'}
            icon={<TrendingUp className={trend.change < 0 ? 'w-3 h-3 rotate-180' : 'w-3 h-3'} />}
            title={`${trend.months[1]} against ${trend.months[0]}`}
          >
            {formatTrend(trend.change)}
          </Badge>
        )}
      </div>

      {isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : !hasData ? (
        <div className="flex h-64 items-center justify-center">
          <EmptyState icon={TrendingUp} title="No rent collection data yet" size="compact" bare />
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="currentColor" className="text-border" />
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
                fill="var(--accent)"
                activeDot={{ r: 4, fill: 'var(--primary)', stroke: 'var(--card)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};
