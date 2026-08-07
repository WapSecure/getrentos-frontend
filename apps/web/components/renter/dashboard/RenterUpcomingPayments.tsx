'use client';

import { motion } from 'framer-motion';
import { Calendar, Home, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Payment {
  id: string;
  property: string;
  amount: number;
  dueDate: string;
  status: 'upcoming' | 'overdue' | 'paid';
}

const upcomingPayments: Payment[] = [
  {
    id: '1',
    property: 'Modern Downtown Loft',
    amount: 200000,
    dueDate: '2024-09-01',
    status: 'upcoming',
  },
  {
    id: '2',
    property: 'Cozy Studio Apartment',
    amount: 150000,
    dueDate: '2024-08-25',
    status: 'overdue',
  },
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const RenterUpcomingPayments = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.4 }}
      className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Payments</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Don&apos;t miss your rent deadlines
        </p>
      </div>

      <div className="p-4 space-y-3">
        {upcomingPayments.map((payment, index) => (
          <motion.div
            key={payment.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.05, duration: 0.3 }}
            className={`p-3 rounded-lg border ${
              payment.status === 'overdue'
                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {payment.property}
                </span>
              </div>
              {payment.status === 'overdue' && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-red-500">Overdue</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-3 h-3" />
                <span>Due {formatDate(payment.dueDate)}</span>
              </div>
              <span className="text-lg font-bold text-[#c4a747]">
                {formatPrice(payment.amount)}
              </span>
            </div>
            <Button
              variant={payment.status === 'overdue' ? 'danger' : 'primary'}
              size="sm"
              fullWidth
              className="gap-2"
            >
              Pay Now
              <ArrowRight className="w-3 h-3" />
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-white/10">
        <Button href="/renter/payments" variant="ghost" size="sm" fullWidth className="gap-1">
          View Payment History
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
};
