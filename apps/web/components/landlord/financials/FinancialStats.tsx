'use client';

import { TrendingUp, AlertCircle, Wrench, PiggyBank } from 'lucide-react';
import { StatCard } from '@getrentos/ui';

interface FinancialStatsProps {
  rentalIncome: number;
  outstandingRent: number;
  maintenanceCosts: number;
  netProfit: number;
}

export const FinancialStats = ({
  rentalIncome,
  outstandingRent,
  maintenanceCosts,
  netProfit,
}: FinancialStatsProps) => {
  const stats = [
    { icon: TrendingUp, label: 'Rental income', value: rentalIncome, accent: 'emerald' },
    { icon: AlertCircle, label: 'Outstanding rent', value: outstandingRent, accent: 'red' },
    { icon: Wrench, label: 'Maintenance costs', value: maintenanceCosts, accent: 'orange' },
    { icon: PiggyBank, label: 'Net profit', value: netProfit, accent: 'blue' },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} isCurrency />
      ))}
    </div>
  );
};
