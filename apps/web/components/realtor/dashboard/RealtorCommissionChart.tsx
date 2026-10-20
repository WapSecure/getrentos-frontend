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
import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import { Badge, Card } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { realtorService } from '@/services/realtorService';

interface CommissionPoint {
  month: string;
  amount: number;
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

export const RealtorCommissionChart = () => {
  const { data: trend = [] } = useQuery({
    queryKey: realtorKeys.commissionTrend,
    queryFn: () => unwrap(realtorService.getCommissionTrend()),
  });

  const commissionData: CommissionPoint[] = trend.map((t) => ({
    month: t.label,
    amount: t.value,
  }));

  const currentValue = commissionData[commissionData.length - 1]?.amount ?? 0;
  const previousValue = commissionData[commissionData.length - 2]?.amount ?? 0;
  const change = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : null;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Commission Trend</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monthly commission earned, last 6 months
          </p>
        </div>
        {change !== null && (
          <Badge
            variant={change >= 0 ? 'success' : 'danger'}
            icon={<TrendingUp className={`w-3 h-3 ${change < 0 ? 'rotate-180' : ''}`} />}
            className="shrink-0"
          >
            {change >= 0 ? '+' : ''}
            {change.toFixed(1)}%
          </Badge>
        )}
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={commissionData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="commissionFill" x1="0" y1="0" x2="0" y2="1">
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
              width={64}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#commissionFill)"
              activeDot={{ r: 4, fill: 'var(--primary)', stroke: 'white', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
