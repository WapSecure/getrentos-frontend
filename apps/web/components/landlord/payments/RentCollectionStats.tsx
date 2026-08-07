'use client';

import { motion } from 'framer-motion';
import { Wallet, AlertTriangle, Lock, CalendarClock } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface RentCollectionStatsProps {
  totalCollected: number;
  outstandingBalance: number;
  escrowPending: number;
  upcomingPayments: number;
}

const colorClasses = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  red: { bg: 'bg-red-50 dark:bg-red-950/20', icon: 'text-red-600 dark:text-red-400' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', icon: 'text-blue-600 dark:text-blue-400' },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    icon: 'text-orange-600 dark:text-orange-400',
  },
} as const;

export const RentCollectionStats = ({
  totalCollected,
  outstandingBalance,
  escrowPending,
  upcomingPayments,
}: RentCollectionStatsProps) => {
  const stats = [
    {
      icon: Wallet,
      label: 'Total Collected',
      value: formatCurrency(totalCollected, { compact: true }),
      subtitle: 'This month',
      color: 'emerald',
    },
    {
      icon: AlertTriangle,
      label: 'Outstanding Balance',
      value: formatCurrency(outstandingBalance, { compact: true }),
      subtitle: 'Unpaid rent',
      color: 'red',
    },
    {
      icon: Lock,
      label: 'Escrow Pending',
      value: formatCurrency(escrowPending, { compact: true }),
      subtitle: 'Awaiting release',
      color: 'blue',
    },
    {
      icon: CalendarClock,
      label: 'Upcoming Payments',
      value: upcomingPayments,
      subtitle: 'Due in 7 days',
      color: 'orange',
    },
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
              {stat.value}
            </p>
            <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
          </motion.div>
        );
      })}
    </div>
  );
};
