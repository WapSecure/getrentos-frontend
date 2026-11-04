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
import { Badge, Card, EmptyState, Skeleton } from '@getrentos/ui';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/format';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';

interface ValuePoint {
  month: string;
  value: number;
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

export const OwnerPortfolioChart = () => {
  const { data = [], isLoading } = useQuery({
    queryKey: ownerKeys.portfolioTrend,
    queryFn: () => unwrap(ownerService.getPortfolioTrend()),
  });

  const portfolioData: ValuePoint[] = data.map((p) => ({ month: p.label, value: p.value }));
  const hasData = portfolioData.some((p) => p.value > 0);

  const currentValue = portfolioData[portfolioData.length - 1]?.value ?? 0;
  const previousValue = portfolioData[portfolioData.length - 2]?.value ?? 0;
  const change = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : null;

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.015em] text-foreground">
            Portfolio value
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Estimated market value, last 6 months
          </p>
        </div>
        {change !== null && (
          <Badge
            variant={change >= 0 ? 'success' : 'danger'}
            icon={<TrendingUp className={`w-3 h-3 ${change < 0 ? 'rotate-180' : ''}`} />}
          >
            {change >= 0 ? '+' : ''}
            {change.toFixed(1)}%
          </Badge>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !hasData ? (
        <div className="flex h-64 items-center justify-center">
          <EmptyState icon={TrendingUp} title="No portfolio value data yet" size="compact" bare />
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={portfolioData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
