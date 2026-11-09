'use client';

import { useQuery } from '@tanstack/react-query';
import { Button, DataTable, Skeleton, type Column } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { buyerLandKeys } from '@/lib/landSalesQueryKeys';
import { landBuyerService } from '@/services/landBuyerService';
import type { LandStatementEntry } from '@/types/landBuyer';

const KIND_LABELS = {
  CHARGE: 'Charge',
  LATE_FEE: 'Late fee',
  PAYMENT: 'Payment',
  WAIVER: 'Waiver',
} as const;

// A negative running balance is credit: never show it as a minus that reads like debt.
const BalanceCell = ({ balance }: { balance: number }) =>
  balance < 0 ? (
    <span className="text-success">{formatCurrency(-balance)} credit</span>
  ) : (
    <>{formatCurrency(balance)}</>
  );

const columns: Column<LandStatementEntry>[] = [
  {
    key: 'date',
    header: 'Date',
    className: 'whitespace-nowrap text-muted-foreground',
    render: (entry) => formatDate(entry.date),
  },
  {
    key: 'entry',
    header: 'Entry',
    className: 'text-foreground',
    render: (entry) => (
      <>
        <span className="mr-2 text-xs text-muted-foreground">{KIND_LABELS[entry.kind]}</span>
        {entry.description}
      </>
    ),
  },
  {
    key: 'charged',
    header: 'Charged',
    numeric: true,
    className: 'text-foreground',
    render: (entry) => (entry.debit ? formatCurrency(entry.debit) : '–'),
  },
  {
    key: 'paid',
    header: 'Paid',
    numeric: true,
    className: 'text-success',
    render: (entry) => (entry.credit ? formatCurrency(entry.credit) : '–'),
  },
  {
    key: 'balance',
    header: 'Balance',
    numeric: true,
    className: 'text-foreground',
    render: (entry) => <BalanceCell balance={entry.balance} />,
  },
];

export const PurchaseStatement = ({ purchaseId }: { purchaseId: string }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: buyerLandKeys.statement(purchaseId),
    queryFn: () => unwrap(landBuyerService.getStatement(purchaseId)),
  });

  if (isLoading) return <Skeleton className="h-32 rounded-xl" />;
  if (!data) {
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
          data.balance < 0 ? ['Paid ahead', -data.balance] : ['Due now', data.balance],
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
        <DataTable
          caption={`Statement for ${data.reference}`}
          density="compact"
          columns={columns}
          data={data.entries}
          getRowKey={(entry, index) => `${entry.date}-${index}`}
        />
      )}
      <p className="text-xs text-muted-foreground">
        Balance is what you owe on instalments due so far; credit means you paid for an instalment
        before it fell due. Future instalments are charged as they fall due. Generated{' '}
        {formatDate(data.generatedAt)}.
      </p>
    </div>
  );
};
