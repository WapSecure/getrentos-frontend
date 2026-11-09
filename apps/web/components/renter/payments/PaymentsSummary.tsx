'use client';

import { CheckCircle, Wallet } from 'lucide-react';
import { Badge, Button, Card } from '@getrentos/ui';
import { formatCurrency, formatLagosDate } from '@/lib/format';
import type { PaymentsSummary as AccountSummary } from '@/services/renterService';
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
  /** The API's account-wide figures. Older APIs send none; then they are worked out from `openCharges`. */
  summary?: AccountSummary;
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
  summary,
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
            <p className="text-sm text-muted-foreground">
              Nothing is due right now.
              {summary && summary.totalHeldNaira > 0
                ? ` ${formatCurrency(summary.totalHeldNaira)} of your rent is held by GetRentos until it is released to your landlord.`
                : ''}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Server figures cover every charge. Without them, the sum of the loaded open
  // charges is only a floor when the API has more than it returned.
  const owed = summary?.amountOwedNaira ?? openCharges.reduce((sum, c) => sum + leftToPay(c), 0);
  const overdue =
    summary?.overdueCount ?? openCharges.filter((charge) => charge.status === 'overdue').length;
  const count = summary?.openCount ?? openCount;
  const nextDue = summary?.nextDueDate ?? next.dueDate;
  const partial = !summary && openCount > openCharges.length;
  const held = summary?.totalHeldNaira ?? 0;

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
            {count === 1 ? '1 charge to pay' : `${count} charges to pay`} · next due{' '}
            {formatLagosDate(nextDue)}
          </p>
          {held > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatCurrency(held)} of your rent is held by GetRentos until it is released to your
              landlord.
            </p>
          )}
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
            {count > 1
              ? `Pays the oldest charge first: ${next.propertyName}. You see the fee before you pay.`
              : `${next.propertyName}. You see the fee before you pay.`}
          </p>
        </div>
      </div>
    </Card>
  );
};
