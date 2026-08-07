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
import { formatCurrency } from '@/lib/format';

interface RevenuePoint {
  month: string;
  collected: number;
}

const revenueData: RevenuePoint[] = [
  { month: 'Feb', collected: 3_150_000 },
  { month: 'Mar', collected: 3_400_000 },
  { month: 'Apr', collected: 3_200_000 },
  { month: 'May', collected: 3_650_000 },
  { month: 'Jun', collected: 3_580_000 },
  { month: 'Jul', collected: 3_920_000 },
];

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a2a2f] px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {formatCurrency(payload[0].value as number)}
      </p>
    </div>
  );
};

export const LandlordRevenueChart = () => {
  const currentMonth = revenueData[revenueData.length - 1].collected;
  const previousMonth = revenueData[revenueData.length - 2].collected;
  const change = ((currentMonth - previousMonth) / previousMonth) * 100;

  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Rent Collection Trend</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Monthly income, last 6 months
          </p>
        </div>
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
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c4a747" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#c4a747" stopOpacity={0} />
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
              className="text-gray-400 dark:text-gray-500"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'currentColor' }}
              className="text-gray-400 dark:text-gray-500"
              tickFormatter={(value) => formatCurrency(value, { compact: true })}
              width={56}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#c4a747', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="collected"
              stroke="#c4a747"
              strokeWidth={2}
              fill="url(#revenueFill)"
              activeDot={{ r: 4, fill: '#c4a747', stroke: 'white', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
