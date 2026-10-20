'use client';

import { Wallet, AlertTriangle, Lock, CalendarClock } from 'lucide-react';
import { StatCard } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';

interface RentCollectionStatsProps {
  totalCollected: number;
  outstandingBalance: number;
  escrowPending: number;
  upcomingPayments: number;
}

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
      accent: 'emerald',
    },
    {
      icon: AlertTriangle,
      label: 'Outstanding Balance',
      value: formatCurrency(outstandingBalance, { compact: true }),
      subtitle: 'Unpaid rent',
      accent: 'red',
    },
    {
      icon: Lock,
      label: 'Held by GetRentos',
      value: formatCurrency(escrowPending, { compact: true }),
      subtitle: 'Awaiting release',
      accent: 'blue',
    },
    {
      icon: CalendarClock,
      label: 'Upcoming Payments',
      value: upcomingPayments,
      subtitle: 'Due in 7 days',
      accent: 'orange',
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
};
