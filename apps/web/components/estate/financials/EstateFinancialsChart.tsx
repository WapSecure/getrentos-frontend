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
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { Card, EmptyState, Skeleton } from '@getrentos/ui';

interface DuesPoint {
  month: string;
  collected: number;
}

interface EstateFinancialsChartProps {
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

/** Same shape as EstateDuesTrendChart, but backed by the Financials feature's
 * own /financials/chart route rather than the Dashboard's: kept as a
 * separate component/route pair so each page owns its own data path even
 * though the underlying computation is identical today. */
export const EstateFinancialsChart = ({ estateId }: EstateFinancialsChartProps) => {
  const { data = [], isLoading } = useQuery({
    queryKey: estateKeys.financialChart(estateId),
    queryFn: () => unwrap(estateService.getFinancialChartSeries(estateId)),
    enabled: !!estateId,
  });

  const duesData: DuesPoint[] = data.map((p) => ({ month: p.label, collected: p.value }));
  const hasData = duesData.some((p) => p.collected > 0);

  return (
    <Card className="p-5 mb-6">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">Dues Collected</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Monthly, last 6 months</p>
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
                <linearGradient id="financialsDuesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                fill="url(#financialsDuesFill)"
                activeDot={{ r: 4, fill: 'var(--primary)', stroke: 'var(--card)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};
