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
import { formatCurrency } from '@/lib/format';

interface FinancialPoint {
  period: string;
  income: number;
  expenses: number;
}

const financialData: FinancialPoint[] = [
  { period: 'Mar', income: 3_400_000, expenses: 620_000 },
  { period: 'Apr', income: 3_200_000, expenses: 540_000 },
  { period: 'May', income: 3_650_000, expenses: 780_000 },
  { period: 'Jun', income: 3_580_000, expenses: 490_000 },
  { period: 'Jul', income: 3_920_000, expenses: 610_000 },
  { period: 'Aug', income: 3_750_000, expenses: 705_000 },
];

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value as number)}
        </p>
      ))}
    </div>
  );
};

export const FinancialChart = () => {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Income vs Expenses</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 6 months</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Income
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            Expenses
          </span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={financialData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid
              vertical={false}
              stroke="currentColor"
              className="text-gray-100 dark:text-white/5"
            />
            <XAxis
              dataKey="period"
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
              cursor={{ fill: 'currentColor', className: 'text-gray-100 dark:text-white/5' }}
            />
            <Bar
              dataKey="income"
              name="Income"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="expenses"
              name="Expenses"
              fill="#9ca3af"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
