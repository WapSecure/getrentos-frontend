'use client';

import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle, Wrench, PiggyBank } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface FinancialStatsProps {
  rentalIncome: number;
  outstandingRent: number;
  maintenanceCosts: number;
  netProfit: number;
}

const colorClasses = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  red: { bg: 'bg-red-50 dark:bg-red-950/20', icon: 'text-red-600 dark:text-red-400' },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', icon: 'text-blue-600 dark:text-blue-400' },
} as const;

export const FinancialStats = ({
  rentalIncome,
  outstandingRent,
  maintenanceCosts,
  netProfit,
}: FinancialStatsProps) => {
  const stats = [
    { icon: TrendingUp, label: 'Rental Income', value: rentalIncome, color: 'emerald' },
    { icon: AlertCircle, label: 'Outstanding Rent', value: outstandingRent, color: 'red' },
    { icon: Wrench, label: 'Maintenance Costs', value: maintenanceCosts, color: 'orange' },
    { icon: PiggyBank, label: 'Net Profit', value: netProfit, color: 'blue' },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const colors = colorClasses[stat.color];
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-4"
          >
            <div className={`inline-flex p-2.5 rounded-xl ${colors.bg} mb-3`}>
              <stat.icon className={`w-5 h-5 ${colors.icon}`} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              {formatCurrency(stat.value, { compact: true })}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
};
