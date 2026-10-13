'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { sellerPayoutKeys } from '@/lib/queryKeys';
import { sellerPayoutService } from '@/services/sellerPayoutService';
import type {
  LandEscrowRelease,
  LandPurchasePayment,
  LandReleasePayoutStatus,
} from '@/types/landDeveloper';

const PAYOUT_STATUS: Record<
  LandReleasePayoutStatus,
  { label: string; variant: 'info' | 'success' | 'danger' | 'warning' | 'neutral' }
> = {
  AWAITING_APPROVAL: { label: 'Awaiting approval', variant: 'warning' },
  PENDING: { label: 'Payout queued', variant: 'neutral' },
  PROCESSING: { label: 'Sending to your bank', variant: 'info' },
  PAID: { label: 'Paid to your bank', variant: 'success' },
  FAILED: { label: 'Payout failed', variant: 'danger' },
};

const PAYMENT_STATUS = {
  PENDING: { label: 'Processing', variant: 'info' },
  CONFIRMED: { label: 'Received', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'danger' },
} as const;

/**
 * Buyer payments GetRentos holds, the shares released to the developer as
 * steps are confirmed, and whether each share has reached their bank.
 */
export const PurchasePayments = ({
  payments,
  releases,
}: {
  payments: LandPurchasePayment[];
  releases: LandEscrowRelease[];
}) => {
  const waitingForPayout = releases.some((release) => release.payoutStatus === 'PENDING');
  const account = useQuery({
    queryKey: sellerPayoutKeys.account,
    queryFn: () => unwrap(sellerPayoutService.getAccount()),
    enabled: waitingForPayout,
    retry: false,
  });
  const needsAccount = waitingForPayout && account.isSuccess && !account.data.verified;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Payments from the buyer</h3>
        {payments.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border/60 rounded-xl border border-border">
            {payments.map((payment) => {
              const status = PAYMENT_STATUS[payment.status] ?? PAYMENT_STATUS.PENDING;
              return (
                <li key={payment.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{formatCurrency(payment.amount)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDate(payment.confirmedAt ?? payment.createdAt)} ·{' '}
                      {payment.providerReference}
                      {payment.simulated ? ' · test payment' : ''}
                    </p>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">Released to you</h3>
        {releases.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing released yet. Each step&apos;s share is released as the buyer confirms it was
            delivered.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border/60 rounded-xl border border-border">
            {releases.map((release) => {
              const payout = release.payoutStatus ? PAYOUT_STATUS[release.payoutStatus] : null;
              return (
                <li key={release.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{release.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Released {formatDate(release.createdAt)}
                      {release.paidAt ? ` · paid ${formatDate(release.paidAt)}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="whitespace-nowrap font-medium text-success">
                      {formatCurrency(release.amount)}
                    </p>
                    {payout && <Badge variant={payout.variant}>{payout.label}</Badge>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {needsAccount && (
          <p className="mt-3 rounded-xl bg-warning/10 p-3 text-sm text-foreground">
            Add your sale-proceeds bank account so released money can be paid to you.{' '}
            <Link
              href="/owner/settings?tab=payouts"
              className="font-medium text-primary hover:underline"
            >
              Set up payout account
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};
