'use client';

import { CheckCircle, Wallet } from 'lucide-react';
import { Badge, Button, Card } from '@getrentos/ui';
import { formatCurrency, formatLagosDate } from '@/lib/format';
import { leftToPay } from './PaymentCard';

interface OpenCharge {
  id: string;
  propertyName: string;
  amount: number;
  amountPaid?: number;
  outstanding?: number;
  status: 'paid' | 'pending' | 'overdue' | 'processing';
  dueDate: string;
}

interface PaymentsSummaryProps {
  /** Open charges, soonest due first, as the API returns them with `open=true`. */
  openCharges: OpenCharge[];
  /** How many charges are open in all (the API's total, which may exceed the list). */
  openCount: number;
  /** Opens the pay dialog for the oldest open charge. */
  onPay: () => void;
  isPaying?: boolean;
}

/**
 * What the renter owes and the one way to pay it. Figures come from every open
 * charge (not the page of history below), so they stay right past ten charges.
 */
export const PaymentsSummary = ({
  openCharges,
  openCount,
  onPay,
  isPaying = false,
}: PaymentsSummaryProps) => {
  const next = openCharges[0];

  if (!next) {
    return (
      <Card className="mb-7 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-success-subtle text-success">
            <CheckCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold text-foreground">You&apos;re up to date</h2>
            <p className="text-sm text-muted-foreground">Nothing is due right now.</p>
          </div>
        </div>
      </Card>
    );
  }

  const owed = openCharges.reduce((sum, charge) => sum + leftToPay(charge), 0);
  const overdue = openCharges.filter((charge) => charge.status === 'overdue').length;
  // The API returns at most a page of open charges; if there are more, the sum is a floor.
  const partial = openCount > openCharges.length;

  return (
    <Card className="mb-7 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">You owe</h2>
            {overdue > 0 && (
              <Badge variant="danger">{overdue === 1 ? '1 overdue' : `${overdue} overdue`}</Badge>
            )}
          </div>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {partial ? 'At least ' : ''}
            {formatCurrency(owed)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {openCount === 1 ? '1 charge to pay' : `${openCount} charges to pay`} · next due{' '}
            {formatLagosDate(next.dueDate)}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
          <Button
            variant="primary"
            icon={<Wallet className="h-4 w-4" aria-hidden="true" />}
            onClick={onPay}
            disabled={isPaying}
            isLoading={isPaying}
          >
            Pay {formatCurrency(leftToPay(next))}
          </Button>
          <p className="text-xs text-muted-foreground sm:text-right">
            {openCount > 1
              ? `Pays the oldest charge first: ${next.propertyName}. You see the fee before you pay.`
              : `${next.propertyName}. You see the fee before you pay.`}
          </p>
        </div>
      </div>
    </Card>
  );
};
