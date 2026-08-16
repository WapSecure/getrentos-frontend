'use client';

import { motion } from 'framer-motion';
import { Calendar, Bell, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@getrentos/ui';

interface PaymentReminder {
  id: string;
  dueDate: string;
  amount: number;
  propertyName: string;
  status: 'upcoming' | 'due' | 'overdue';
  daysRemaining: number;
}

interface UpcomingPaymentRemindersProps {
  reminders: PaymentReminder[];
}

export const UpcomingPaymentReminders = ({ reminders }: UpcomingPaymentRemindersProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusConfig = (status: string, daysRemaining: number) => {
    if (status === 'overdue') {
      return {
        label: 'Overdue',
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        icon: AlertTriangle,
      };
    }
    if (status === 'due' || daysRemaining <= 3) {
      return {
        label: 'Due Soon',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        icon: Bell,
      };
    }
    return {
      label: 'Upcoming',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      icon: Clock,
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Payment Reminders</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Upcoming rent payments</p>
      </div>

      <div className="divide-y divide-border">
        {reminders.map((reminder, index) => {
          const statusConfig = getStatusConfig(reminder.status, reminder.daysRemaining);
          const StatusIcon = statusConfig.icon;

          return (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 hover:bg-secondary transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{reminder.propertyName}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(reminder.dueDate)}</span>
                    </div>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs font-semibold text-primary">
                      {formatCurrency(reminder.amount)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                  {reminder.status !== 'overdue' && (
                    <p className="text-xs text-gray-500 mt-1">{reminder.daysRemaining} days left</p>
                  )}
                </div>
              </div>
              {reminder.status === 'overdue' && (
                <Button variant="danger" size="sm" className="mt-2 w-full">
                  Pay Now
                </Button>
              )}
              {reminder.status !== 'overdue' && reminder.daysRemaining <= 5 && (
                <Button variant="primary" size="sm" className="mt-2 w-full">
                  Pay Now
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="p-3 border-t border-border">
        <Button variant="ghost" size="sm" fullWidth className="gap-1">
          View All Payments
        </Button>
      </div>
    </motion.div>
  );
};
