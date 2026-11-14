'use client';

import Link from 'next/link';
import { ChevronRight, ReceiptText } from '@sureground/icons';
import {
  formatCurrency,
  type RenterServiceCharge,
  type RenterServiceChargeCollection,
} from '@sureground/shared';
import { Badge, Card, EmptyState, type BadgeVariant } from '@sureground/ui';

export const RENTER_COLLECTION: Record<
  RenterServiceChargeCollection,
  { label: string; variant: BadgeVariant }
> = {
  PAID: { label: 'Paid', variant: 'success' },
  PART_PAID: { label: 'Part paid', variant: 'warning' },
  UNPAID: { label: 'To pay', variant: 'neutral' },
  REMOVED: { label: 'Removed', variant: 'neutral' },
};

/** A `YYYY-MM-DD` day as "1 Jan 2027", read at midday so no time zone moves it. */
export function formatDay(day: string): string {
  return new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** The tenant's service charges, each opening its statement. */
export function ServiceChargesTab({ charges }: { charges: RenterServiceCharge[] }) {
  if (charges.length === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        title="No service charges"
        description="When your landlord or estate bills a service charge, it appears here with how your share was worked out."
      />
    );
  }
  return (
    <section aria-labelledby="service-charges-heading" className="space-y-4">
      <div>
        <h2 id="service-charges-heading" className="text-lg font-semibold text-foreground">
          Service charges
        </h2>
        <p className="text-sm text-muted-foreground">
          Your share of the building&apos;s shared costs. You pay them with your rent under
          Payments. Open one to see how it was worked out or to raise a query.
        </p>
      </div>
      <ul className="space-y-3">
        {charges.map((charge) => {
          const status = RENTER_COLLECTION[charge.collection];
          return (
            <li key={charge.id}>
              <Link
                href={`/renter/payments/service-charges/${charge.id}`}
                className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Card className="flex items-center gap-4 rounded-2xl p-4 transition-colors hover:bg-secondary/60">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{charge.title}</p>
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {charge.openQueries > 0 && <Badge variant="info">Query open</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {charge.unit}
                      {charge.property ? `, ${charge.property}` : ''} ·{' '}
                      {formatDay(charge.periodStart)} to {formatDay(charge.periodEnd)} · due{' '}
                      {formatDay(charge.dueDate)}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">{formatCurrency(charge.amount)}</p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
