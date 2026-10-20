'use client';

import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge, Button, Card } from '@getrentos/ui';

interface Payment {
  month: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  date: string;
}

interface LeasePaymentScheduleProps {
  payments: Payment[];
}

export const LeasePaymentSchedule = ({ payments }: LeasePaymentScheduleProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          label: 'Paid',
          variant: 'success' as const,
          icon: CheckCircle,
        };
      case 'pending':
        return {
          label: 'Pending',
          variant: 'warning' as const,
          icon: Clock,
        };
      case 'overdue':
        return {
          label: 'Overdue',
          variant: 'danger' as const,
          icon: AlertCircle,
        };
      default:
        return {
          label: 'Unknown',
          variant: 'neutral' as const,
          icon: Clock,
        };
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Payment Schedule</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Rent payment history</p>
      </div>

      <div className="divide-y divide-border">
        {payments.map((payment, index) => {
          const statusConfig = getStatusConfig(payment.status);
          const StatusIcon = statusConfig.icon;

          return (
            <motion.div
              key={payment.month}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 hover:bg-secondary transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{payment.month}</p>
                <p className="text-xs text-muted-foreground">{payment.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(payment.amount)}
                </span>
                <Badge variant={statusConfig.variant} icon={<StatusIcon className="w-3 h-3" />}>
                  {statusConfig.label}
                </Badge>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="p-3 border-t border-border">
        <Button variant="ghost" size="sm" fullWidth className="gap-1">
          View All Payments
        </Button>
      </div>
      </Card>
    </motion.div>
  );
};
