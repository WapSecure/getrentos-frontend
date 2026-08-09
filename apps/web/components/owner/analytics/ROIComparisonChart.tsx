'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import type { InvestmentMetrics } from '@/types/owner';

interface ROIComparisonChartProps {
  metrics: InvestmentMetrics[];
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {(payload[0].value as number).toFixed(1)}% ROI
      </p>
    </div>
  );
};

export const ROIComparisonChart = ({ metrics }: ROIComparisonChartProps) => {
  const data = metrics.map((m) => ({
    name: m.propertyName.length > 14 ? `${m.propertyName.slice(0, 14)}…` : m.propertyName,
    roi: m.roiPercentage,
  }));

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <h3 className="font-semibold text-foreground">ROI by Property</h3>
      <p className="text-xs text-muted-foreground mt-0.5 mb-4">
        Return on investment across your portfolio
      </p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid
              vertical={false}
              stroke="currentColor"
              className="text-gray-100 dark:text-white/5"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'currentColor' }}
              className="text-muted-foreground"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'currentColor' }}
              className="text-muted-foreground"
              tickFormatter={(value) => `${value}%`}
              width={44}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'currentColor', className: 'text-gray-50 dark:text-white/5' }}
            />
            <Bar dataKey="roi" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
