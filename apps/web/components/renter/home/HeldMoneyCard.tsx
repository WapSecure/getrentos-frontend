'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronRight, PiggyBank, ShieldCheck } from 'lucide-react';
import { Button, Card } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { myDeposits } from '@/services/renterDepositService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/format';
import { ROUTES } from '@/lib/constants/auth';

const formatLagosDate = (iso: string) =>
  new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  }).format(new Date(iso));

/**
 * Money GetRentos is holding for the renter, on the home overview: rent held
 * under Payment Protection (with the next release date) and the deposit
 * balance. Hidden when nothing is held.
 */
export function HeldMoneyCard() {
  const paymentsQuery = useQuery({
    queryKey: [...renterKeys.payments, { page: 1, pageSize: 100 }],
    queryFn: () => unwrap(renterService.listPayments({ page: 1, pageSize: 100 })),
  });
  const depositsQuery = useQuery({
    queryKey: ['renter', 'deposits'],
    queryFn: () => unwrap(myDeposits()),
  });

  const held = (paymentsQuery.data?.items ?? []).filter(
    (p) => p.status === 'paid' && p.escrowStatus === 'held'
  );
  const heldTotal = held.reduce((sum, p) => sum + p.amount, 0);
  const nextRelease = held
    .map((p) => p.releaseDate)
    .filter((d): d is string => !!d)
    .sort()[0];

  const depositHolds = (depositsQuery.data ?? [])
    .map((d) => d.hold)
    .filter((h): h is NonNullable<typeof h> => !!h && h.status !== 'RETURNED');
  const depositHeld = depositHolds.reduce((sum, h) => sum + h.summary.held, 0);
  const depositReturnable = depositHolds.reduce((sum, h) => sum + h.summary.returnable, 0);

  if (heldTotal <= 0 && depositHeld <= 0) return null;

  return (
    <Card static hover={false} className="p-5">
      <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
        Money held for you
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {heldTotal > 0 && (
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-subtle text-success">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Rent held by GetRentos</p>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(heldTotal)}</p>
              <p className="text-xs text-muted-foreground">
                {nextRelease
                  ? `Next release to your landlord ${formatLagosDate(nextRelease)}`
                  : 'Released to your landlord once you confirm move-in'}
              </p>
              <Button href={ROUTES.RENTER_PAYMENTS} variant="ghost" size="sm" className="mt-1 px-0">
                View payments
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
        {depositHeld > 0 && (
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
              <PiggyBank className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Deposit balance</p>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(depositHeld)}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(depositReturnable)} returnable after agreed deductions
              </p>
              <Button
                href={`${ROUTES.RENTER_HOME}?tab=deposit`}
                variant="ghost"
                size="sm"
                className="mt-1 px-0"
              >
                View deposit
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
