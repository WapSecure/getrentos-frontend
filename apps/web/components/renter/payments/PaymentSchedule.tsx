'use client';

import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button, Card, EmptyState } from '@getrentos/ui';

interface Payment {
  id: string;
  propertyName: string;
  amount: number;
  amountPaid?: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue' | 'processing';
  dueDate: string;
}

interface PaymentScheduleProps {
  payments: Payment[];
  onPayAll?: () => void;
  isPayingAll?: boolean;
}

export const PaymentSchedule = ({
  payments,
  onPayAll,
  isPayingAll = false,
}: PaymentScheduleProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'overdue':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-success';
      case 'pending':
        return 'text-warning';
      case 'overdue':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const upcomingPayments = payments
    .filter((p) => p.status !== 'paid')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  if (upcomingPayments.length === 0) {
    return (
      <Card>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Upcoming Payments</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">No upcoming payments</p>
        </div>
        <EmptyState icon={CheckCircle} title="All payments are up to date!" size="compact" bare />
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Upcoming Payments</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {upcomingPayments.length} payments pending
        </p>
      </div>

      <div className="divide-y divide-border">
        {upcomingPayments.map((payment, index) => {
          const StatusIcon = getStatusIcon(payment.status);
          const statusColor = getStatusColor(payment.status);

          return (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between gap-3 p-3 hover:bg-secondary transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{payment.propertyName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    Due {formatDate(payment.dueDate)}
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    {formatCurrency(payment.amount - (payment.amountPaid ?? 0))}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                <span className={`text-xs font-medium ${statusColor}`}>{payment.status}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="p-3 border-t border-border">
        <Button
          variant="primary"
          size="sm"
          fullWidth
          onClick={onPayAll}
          disabled={isPayingAll}
          isLoading={isPayingAll}
        >
          Pay All Now
        </Button>
      </div>
    </Card>
  );
};
