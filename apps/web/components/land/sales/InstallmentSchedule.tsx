'use client';

import { Badge, DataTable, type Column } from '@sureground/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import type { LandInstallment } from '@/types/landDeveloper';
import { INSTALLMENT_STATUS } from '../developer/labels';

const columns: Column<LandInstallment>[] = [
  {
    key: 'label',
    header: 'Instalment',
    className: 'text-foreground',
    render: (installment) => installment.label,
  },
  {
    key: 'due',
    header: 'Due',
    className: 'whitespace-nowrap text-muted-foreground',
    render: (installment) => formatDate(installment.dueDate),
  },
  {
    key: 'amount',
    header: 'Amount',
    numeric: true,
    className: 'whitespace-nowrap text-foreground',
    render: (installment) => (
      <>
        {formatCurrency(installment.amount)}
        {installment.lateFee > 0 && (
          <span className="block text-xs text-destructive">
            + {formatCurrency(installment.lateFee)} late fee
          </span>
        )}
      </>
    ),
  },
  {
    key: 'paid',
    header: 'Paid',
    numeric: true,
    className: 'whitespace-nowrap text-foreground',
    render: (installment) => (
      <>
        {formatCurrency(installment.amountPaid)}
        {installment.paidAt && (
          <span className="block text-xs text-muted-foreground">
            {formatDate(installment.paidAt)}
          </span>
        )}
      </>
    ),
  },
  {
    key: 'owed',
    header: 'Owed',
    numeric: true,
    className: 'whitespace-nowrap font-medium text-foreground',
    render: (installment) => formatCurrency(installment.outstanding),
  },
  {
    key: 'status',
    header: 'Status',
    render: (installment) => {
      const status = INSTALLMENT_STATUS[installment.status] ?? INSTALLMENT_STATUS.PENDING;
      return <Badge variant={status.variant}>{status.label}</Badge>;
    },
  },
];

export const InstallmentSchedule = ({ installments }: { installments: LandInstallment[] }) => {
  if (installments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No instalments yet. The schedule is set when the deposit is paid.
      </p>
    );
  }
  const ordered = [...installments].sort((a, b) => a.sequence - b.sequence);
  return (
    <DataTable
      caption="Instalment schedule"
      density="compact"
      columns={columns}
      data={ordered}
      getRowKey={(installment) => installment.id}
    />
  );
};
