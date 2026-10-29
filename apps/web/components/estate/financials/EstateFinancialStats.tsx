'use client';

import { Wallet, AlertCircle, ReceiptText, Users } from 'lucide-react';
import { StatCard } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';

interface EstateFinancialStatsProps {
  duesCollected: number;
  duesOutstanding: number;
  lateFeesCollected: number;
  householdsBilled: number;
}

export const EstateFinancialStats = ({
  duesCollected,
  duesOutstanding,
  lateFeesCollected,
  householdsBilled,
}: EstateFinancialStatsProps) => (
  <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
    <StatCard
      icon={Wallet}
      accent="emerald"
      label="Dues Collected"
      value={formatCurrency(duesCollected, { compact: true })}
    />
    <StatCard
      icon={AlertCircle}
      accent="red"
      label="Dues Outstanding"
      value={formatCurrency(duesOutstanding, { compact: true })}
    />
    <StatCard
      icon={ReceiptText}
      accent="orange"
      label="Late Fees Collected"
      value={formatCurrency(lateFeesCollected, { compact: true })}
    />
    <StatCard icon={Users} label="Households Billed" value={String(householdsBilled)} />
  </div>
);
