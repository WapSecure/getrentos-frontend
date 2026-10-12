'use client';

import { Badge } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import type { LandEscrowRelease, LandPurchasePayment } from '@/types/landDeveloper';

const PAYMENT_STATUS = {
  PENDING: { label: 'Processing', variant: 'info' },
  CONFIRMED: { label: 'Received', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'danger' },
} as const;

/** Buyer payments into escrow, and escrow releases out to the developer. */
export const PurchasePayments = ({
  payments,
  releases,
}: {
  payments: LandPurchasePayment[];
  releases: LandEscrowRelease[];
}) => (
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
          Nothing released yet. Escrow pays out as the buyer confirms each delivered step.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border/60 rounded-xl border border-border">
          {releases.map((release) => (
            <li key={release.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{release.reason}</p>
                <p className="text-xs text-muted-foreground">{formatDate(release.createdAt)}</p>
              </div>
              <p className="whitespace-nowrap font-medium text-success">
                {formatCurrency(release.amount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);
