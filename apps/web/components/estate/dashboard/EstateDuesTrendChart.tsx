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
import { Badge, Card, EmptyState, Skeleton } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';

interface DuesPoint {
  month: string;
  collected: number;
}

interface EstateDuesTrendChartProps {
  estateId: string;
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

export const EstateDuesTrendChart = ({ estateId }: EstateDuesTrendChartProps) => {
  const { data = [], isLoading } = useQuery({
    queryKey: estateKeys.duesTrend(estateId),
    queryFn: () => unwrap(estateService.getDuesCollectedTrend(estateId)),
    enabled: !!estateId,
  });

  const duesData: DuesPoint[] = data.map((p) => ({ month: p.label, collected: p.value }));
  const hasData = duesData.some((p) => p.collected > 0);

  const currentMonth = duesData[duesData.length - 1]?.collected ?? 0;
  const previousMonth = duesData[duesData.length - 2]?.collected ?? 0;
  const change = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : null;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Dues Collection Trend</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monthly dues collected, last 6 months
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
        <Skeleton className="h-56 w-full" />
      ) : !hasData ? (
        <div className="h-56 flex items-center justify-center">
          <EmptyState icon={TrendingUp} title="No dues collected yet" size="compact" bare />
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={duesData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="duesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="currentColor"
                className="text-border"
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
                fill="url(#duesFill)"
                activeDot={{ r: 4, fill: 'var(--primary)', stroke: 'var(--card)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};
