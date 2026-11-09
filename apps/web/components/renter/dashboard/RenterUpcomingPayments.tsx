'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Home, AlertCircle, ArrowRight } from '@sureground/icons';
import { Badge } from '@sureground/ui';
import { Button } from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

// The year matters: a charge a year out must not read as due this week.
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  });

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const RenterUpcomingPayments = () => {
  const { data } = useQuery({
    queryKey: [...renterKeys.payments, { page: 1, pageSize: 5, open: true }],
    queryFn: () => unwrap(renterService.listPayments({ page: 1, pageSize: 5, open: true })),
  });
  const payments = data?.items ?? [];
  const upcomingPayments = payments
    .filter((p) => p.status === 'pending' || p.status === 'overdue')
    .map((p) => ({
      id: p.id,
      property: p.propertyName,
      amount: p.amount,
      dueDate: p.dueDate,
      status: (p.status === 'overdue' ? 'overdue' : 'upcoming') as 'upcoming' | 'overdue',
    }));

  if (upcomingPayments.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.4 }}
      className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
    >
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Upcoming payments</h2>
        <p className="text-sm text-muted-foreground">Don&apos;t miss your rent deadlines</p>
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
                ? 'bg-destructive-subtle border-destructive/20'
                : 'bg-secondary/60 border-border'
            }`}
          >
            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="flex min-w-0 items-center gap-2">
                <Home className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="font-medium text-foreground text-sm">{payment.property}</span>
              </div>
              {payment.status === 'overdue' && (
                <Badge variant="danger" icon={<AlertCircle className="w-3 h-3" />}>
                  Overdue
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>Due {formatDate(payment.dueDate)}</span>
              </div>
              <span className="text-lg font-bold text-primary">{formatPrice(payment.amount)}</span>
            </div>
            <Button
              href={ROUTES.RENTER_PAYMENTS}
              variant={payment.status === 'overdue' ? 'danger' : 'primary'}
              size="sm"
              fullWidth
              className="gap-2"
            >
              Pay now
              <ArrowRight className="w-3 h-3" />
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="p-4 border-t border-border">
        <Button href={ROUTES.RENTER_PAYMENTS} variant="ghost" size="sm" fullWidth className="gap-1">
          View payment history
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
};
