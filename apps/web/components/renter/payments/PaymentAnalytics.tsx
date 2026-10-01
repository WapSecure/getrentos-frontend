'use client';

import { motion } from 'framer-motion';
import { TrendingUp, PieChart, Calendar } from 'lucide-react';
import { NairaSign } from '@getrentos/ui/NairaSign';

interface Payment {
  id: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue' | 'processing';
}

interface PaymentAnalyticsProps {
  payments: Payment[];
}

export const PaymentAnalytics = ({ payments }: PaymentAnalyticsProps) => {
  const paidPayments = payments.filter((p) => p.status === 'paid');
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const averagePayment = paidPayments.length > 0 ? totalPaid / paidPayments.length : 0;

  const paidMonths = new Set(
    paidPayments
      .map((payment) => {
        const date = new Date(payment.date);
        return Number.isNaN(date.getTime())
          ? null
          : `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;
      })
      .filter((month): month is string => month !== null)
  );
  const monthlyAverage = paidMonths.size > 0 ? totalPaid / paidMonths.size : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Payment Analytics</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Based on payments shown on this page</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-1">
              <NairaSign className="w-3 h-3 text-primary" />
              <span className="text-xs text-gray-500">Total Paid</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-primary" />
              <span className="text-xs text-gray-500">Avg Payment</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(averagePayment)}</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-primary" />
            <span className="text-xs text-gray-500">Average per active month</span>
          </div>
          <p className="text-lg font-bold text-foreground">{formatCurrency(monthlyAverage)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Across {paidMonths.size} month{paidMonths.size === 1 ? '' : 's'} represented
          </p>
        </div>
      </div>
    </motion.div>
  );
};
