'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { buyerLandKeys } from '@/lib/landSalesQueryKeys';
import { landBuyerService } from '@/services/landBuyerService';

const KIND_LABELS = {
  CHARGE: 'Charge',
  LATE_FEE: 'Late fee',
  PAYMENT: 'Payment',
  WAIVER: 'Waiver',
} as const;

/** Ledger of charges and payments with a running balance. Loaded on demand. */
export const PurchaseStatement = ({ purchaseId }: { purchaseId: string }) => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: buyerLandKeys.statement(purchaseId),
    queryFn: () => unwrap(landBuyerService.getStatement(purchaseId)),
  });

  if (isLoading)
    return <div className="h-32 animate-pulse rounded-xl bg-secondary" aria-busy="true" />;
  if (isError || !data) {
    return (
      <div role="alert" className="space-y-2 text-sm text-destructive">
        <p>{error instanceof Error ? error.message : 'Could not load the statement.'}</p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        {[
          ['Charged to date', data.totalCharged],
          ['Paid', data.totalPaid],
          ['Due now', data.balance],
          ['Left on contract', data.outstandingBalance],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border p-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
              {formatCurrency(Number(value))}
            </dd>
          </div>
        ))}
      </dl>
      {data.entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing has been charged or paid yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">Statement for {data.reference}</caption>
            <thead className="bg-secondary/60 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Date
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Entry
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Charged
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Paid
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.entries.map((entry, index) => (
                <tr key={`${entry.date}-${index}`}>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {formatDate(entry.date)}
                  </td>
                  <td className="px-3 py-2 text-foreground">
                    <span className="mr-2 text-xs text-muted-foreground">
                      {KIND_LABELS[entry.kind]}
                    </span>
                    {entry.description}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">
                    {entry.debit ? formatCurrency(entry.debit) : '–'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-success">
                    {entry.credit ? formatCurrency(entry.credit) : '–'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">
                    {formatCurrency(entry.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Generated {new Date(data.generatedAt).toLocaleString('en-NG')}. Future installments are
        charged as they fall due.
      </p>
    </div>
  );
};
