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

interface GrowthPoint {
  month: string;
  users: number;
}

const growthData: GrowthPoint[] = [
  { month: 'Mar', users: 420 },
  { month: 'Apr', users: 610 },
  { month: 'May', users: 890 },
  { month: 'Jun', users: 1180 },
  { month: 'Jul', users: 1540 },
  { month: 'Aug', users: 1920 },
];

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{payload[0].value} total users</p>
    </div>
  );
};

export const PlatformGrowthChart = () => {
  const currentValue = growthData[growthData.length - 1].users;
  const previousValue = growthData[growthData.length - 2].users;
  const change = ((currentValue - previousValue) / previousValue) * 100;

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Platform Growth</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cumulative registered users, last 6 months
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20">
          <TrendingUp className="w-3 h-3" />+{change.toFixed(1)}%
        </div>
      </div>

      <div className="h-56">
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
    </div>
  );
};
