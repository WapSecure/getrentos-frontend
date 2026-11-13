'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Home, AlertCircle } from '@sureground/icons';
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
      className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
    >
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold tracking-[-0.015em] text-foreground">
          Upcoming payments
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Rent and charges that are due</p>
      </div>

      <ul className="divide-y divide-border">
        {upcomingPayments.map((payment, index) => {
          const overdue = payment.status === 'overdue';
          return (
            <motion.li
              key={payment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05, duration: 0.3 }}
              className="px-5 py-4"
            >
              <div className="flex items-start gap-3.5">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${overdue ? 'bg-destructive-subtle text-destructive' : 'bg-primary/10 text-primary'}`}
                >
                  {overdue ? (
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Home className="h-4 w-4" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{payment.property}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                    <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
                    Due {formatDate(payment.dueDate)}
                  </p>
                  {overdue && (
                    <Badge variant="danger" className="mt-1.5">
                      Overdue
                    </Badge>
                  )}
                </div>
                <span className="data-value shrink-0 whitespace-nowrap text-base font-semibold text-foreground">
                  {formatPrice(payment.amount)}
                </span>
              </div>
              <Button
                href={ROUTES.RENTER_PAYMENTS}
                variant={overdue ? 'danger' : 'primary'}
                size="sm"
                fullWidth
                className="mt-3"
              >
                Pay now
              </Button>
            </motion.li>
          );
        })}
      </ul>

      <div className="border-t border-border px-5 py-2.5">
        <Button href={ROUTES.RENTER_PAYMENTS} variant="link" size="sm">
          View payment history
        </Button>
      </div>
    </motion.div>
  );
};
