'use client';

import { CheckCircle, Clock, AlertCircle, Shield } from 'lucide-react';
import { StatCard, type StatCardAccent } from '@getrentos/ui';

interface Payment {
  id: string;
  amount: number;
  amountPaid?: number;
  status: 'paid' | 'pending' | 'overdue' | 'processing';
  escrowStatus: 'not_funded' | 'held' | 'pending_review' | 'released' | 'frozen';
}

interface PaymentsStatsProps {
  payments: Payment[];
}

export const PaymentsStats = ({ payments }: PaymentsStatsProps) => {
  // Part-payments count as paid; what is pending or overdue is only what is left.
  const paidOf = (p: Payment) => (p.status === 'paid' ? p.amount : (p.amountPaid ?? 0));
  const totalPaid = payments.reduce((sum, p) => sum + paidOf(p), 0);

  const pendingAmount = payments
    .filter((p) => p.status === 'pending' || p.status === 'processing')
    .reduce((sum, p) => sum + p.amount - paidOf(p), 0);

  const overdueAmount = payments
    .filter((p) => p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount - paidOf(p), 0);

  // Escrow holds money that has actually been received. An unpaid charge is
  // 'not_funded', so the outstanding balance can never be reported as funds
  // the tenant has already secured.
  const escrowAmount = payments
    .filter((p) => p.status === 'paid' && p.escrowStatus === 'held')
    .reduce((sum, p) => sum + p.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      icon: CheckCircle,
      label: 'Total Paid',
      value: formatCurrency(totalPaid),
      accent: 'green' as StatCardAccent,
    },
    {
      icon: Clock,
      label: 'Pending',
      value: formatCurrency(pendingAmount),
      accent: 'orange' as StatCardAccent,
    },
    {
      icon: AlertCircle,
      label: 'Overdue',
      value: formatCurrency(overdueAmount),
      accent: 'red' as StatCardAccent,
    },
    {
      icon: Shield,
      label: 'Held by GetRentos',
      value: formatCurrency(escrowAmount),
      accent: 'blue' as StatCardAccent,
    },
  ];

  return (
    <section aria-label="Payment overview" className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          accent={stat.accent}
        />
      ))}
    </section>
  );
};
