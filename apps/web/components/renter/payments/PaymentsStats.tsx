'use client';

import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, Clock, AlertCircle, Shield, TrendingUp } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'processing';
  escrowStatus: 'held' | 'released' | 'pending';
}

interface PaymentsStatsProps {
  payments: Payment[];
}

export const PaymentsStats = ({ payments }: PaymentsStatsProps) => {
  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter((p) => p.status === 'pending' || p.status === 'processing')
    .reduce((sum, p) => sum + p.amount, 0);

  const overdueAmount = payments
    .filter((p) => p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  const escrowAmount = payments
    .filter((p) => p.escrowStatus === 'held')
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
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: Clock,
      label: 'Pending',
      value: formatCurrency(pendingAmount),
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      icon: AlertCircle,
      label: 'Overdue',
      value: formatCurrency(overdueAmount),
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      icon: Shield,
      label: 'In Escrow',
      value: formatCurrency(escrowAmount),
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`${stat.bg} rounded-xl p-4 border border-gray-200 dark:border-white/10`}
        >
          <div className="flex items-center gap-2">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</span>
          </div>
          <p className={`text-lg font-bold ${stat.color} mt-1`}>{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
};
