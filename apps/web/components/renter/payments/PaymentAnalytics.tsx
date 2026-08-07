'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Calendar } from 'lucide-react';

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

  // Calculate monthly spending (mock)
  const monthlySpending = totalPaid / 6; // Assuming 6 months of data

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
      className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-[#c4a747]" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Payment Analytics</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Spending insights</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-[#c4a747]" />
              <span className="text-xs text-gray-500">Total Paid</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalPaid)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#c4a747]" />
              <span className="text-xs text-gray-500">Avg Payment</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(averagePayment)}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#c4a747]" />
            <span className="text-xs text-gray-500">Monthly Average</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(monthlySpending)}
          </p>
        </div>

        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Spending Trend</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                Your rent spending has been consistent over the last 6 months.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
