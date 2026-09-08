'use client';

import { motion } from 'framer-motion';
import { Wallet, AlertCircle, Receipt, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface EstateFinancialStatsProps {
  duesCollected: number;
  duesOutstanding: number;
  lateFeesCollected: number;
  householdsBilled: number;
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

export const EstateFinancialStats = ({
  duesCollected,
  duesOutstanding,
  lateFeesCollected,
  householdsBilled,
}: EstateFinancialStatsProps) => {
  const stats = [
    {
      icon: Wallet,
      label: 'Dues Collected',
      value: formatCurrency(duesCollected, { compact: true }),
      color: 'emerald',
    },
    {
      icon: AlertCircle,
      label: 'Dues Outstanding',
      value: formatCurrency(duesOutstanding, { compact: true }),
      color: 'red',
    },
    {
      icon: Receipt,
      label: 'Late Fees Collected',
      value: formatCurrency(lateFeesCollected, { compact: true }),
      color: 'orange',
    },
    { icon: Users, label: 'Households Billed', value: String(householdsBilled), color: 'blue' },
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
            className="bg-card rounded-2xl border border-border p-4"
          >
            <div className={`inline-flex p-2.5 rounded-xl ${colors.bg} mb-3`}>
              <stat.icon className={`w-5 h-5 ${colors.icon}`} />
            </div>
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-foreground tracking-tight">{stat.value}</p>
          </motion.div>
        );
      })}
    </div>
  );
};
