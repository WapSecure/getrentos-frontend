'use client';

import { useQuery } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';

/**
 * Money paid in per lease: each payment, what it paid, and any credit held
 * (an overpayment), which pays the next invoice automatically.
 */
export const RentAccountCard = () => {
  const accounts = useQuery({
    queryKey: ['renter', 'rent-accounts'],
    queryFn: () => unwrap(renterService.listRentAccounts()),
  });
  const list = accounts.data ?? [];
  if (!list.length) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <Wallet className="w-4 h-4 text-primary" /> Rent account
      </h3>
      <div className="mt-3 space-y-4">
        {list.map((a) => (
          <div key={a.leaseId}>
            <p className="text-sm font-medium text-foreground">
              {a.propertyName} • {a.unitName}
            </p>
            {a.creditBalance > 0 && (
              <p className="mt-1 text-xs rounded-lg bg-success-subtle text-success px-2 py-1">
                {formatCurrency(a.creditBalance)} credit: it pays your next invoice automatically.
              </p>
            )}
            <ul className="mt-2 space-y-1.5">
              {a.receipts.slice(0, 5).map((r) => (
                <li key={r.id} className="text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Paid {formatDate(r.receivedAt)}</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {formatCurrency(r.amount)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {[
                      ...r.allocations.map(
                        (al) => `${formatCurrency(al.amount)} to rent due ${formatDate(al.dueDate)}`
                      ),
                      ...(r.toCredit > 0 ? [`${formatCurrency(r.toCredit)} to credit`] : []),
                    ].join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
            {(a.creditApplied ?? []).length > 0 && (
              <ul className="mt-2 space-y-1">
                {(a.creditApplied ?? []).slice(0, 5).map((c) => (
                  <li
                    key={`${c.rentPaymentId}-${c.appliedAt}`}
                    className="flex justify-between gap-2 text-xs"
                  >
                    <span className="text-muted-foreground">
                      Credit used on rent due {formatDate(c.dueDate)}
                    </span>
                    <span className="text-success tabular-nums">{formatCurrency(c.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
