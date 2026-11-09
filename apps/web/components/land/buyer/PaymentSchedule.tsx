import { Alert, Badge, DataTable } from '@sureground/ui';
import { AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import type { LandInstallment } from '@/types/landBuyer';
import { InstallmentStatusBadge } from './LandSaleBadges';
import type { ScheduleSummary } from './landSaleLogic';

export const PaymentSchedule = ({
  installments,
  summary,
}: {
  installments: LandInstallment[];
  summary: ScheduleSummary;
}) => {
  const ordered = [...installments].sort((a, b) => a.sequence - b.sequence);
  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {summary.paidCount} of {summary.total} paid
          </span>
          <span>{summary.percentPaid}% of the schedule</span>
        </div>
        <div
          className="mt-1 h-2 overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={summary.percentPaid}
          aria-label="Schedule paid"
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${summary.percentPaid}%` }}
          />
        </div>
      </div>

      {summary.overdueCount > 0 && (
        <Alert variant="danger" icon={AlertTriangle}>
          {summary.overdueCount} instalment{summary.overdueCount === 1 ? ' is' : 's are'} overdue:{' '}
          {formatCurrency(summary.overdueAmount)} including late fees. Pay now to avoid default.
        </Alert>
      )}

      <DataTable
        caption="Payment schedule"
        density="compact"
        minWidth="560px"
        data={ordered}
        getRowKey={(i) => i.id}
        getRowClassName={(i) =>
          i.status === 'OVERDUE'
            ? 'bg-destructive/5'
            : i.id === summary.nextInstallmentId
              ? 'bg-primary/5'
              : undefined
        }
        getRowProps={(i) => ({
          'aria-current': i.id === summary.nextInstallmentId ? 'step' : undefined,
        })}
        columns={[
          {
            key: 'instalment',
            header: 'Instalment',
            className: 'text-foreground',
            render: (i) => (
              <>
                {i.label}
                {i.id === summary.nextInstallmentId && (
                  <Badge variant="primary" className="ml-2">
                    Next
                  </Badge>
                )}
              </>
            ),
          },
          {
            key: 'due',
            header: 'Due',
            className: 'text-muted-foreground',
            render: (i) => formatDate(i.dueDate),
          },
          {
            key: 'amount',
            header: 'Amount',
            numeric: true,
            className: 'text-foreground',
            render: (i) => formatCurrency(i.amount),
          },
          {
            key: 'lateFee',
            header: 'Late fee',
            numeric: true,
            render: (i) => (
              <span className={i.lateFee > 0 ? 'text-destructive' : 'text-muted-foreground'}>
                {i.lateFee > 0 ? formatCurrency(i.lateFee) : '–'}
              </span>
            ),
          },
          {
            key: 'owed',
            header: 'Owed',
            numeric: true,
            className: 'text-foreground',
            render: (i) => (i.outstanding > 0 ? formatCurrency(i.outstanding) : '–'),
          },
          {
            key: 'status',
            header: 'Status',
            render: (i) => (
              <>
                <InstallmentStatusBadge status={i.status} />
                {i.paidAt && (
                  <span className="ml-2 text-xs text-muted-foreground">{formatDate(i.paidAt)}</span>
                )}
              </>
            ),
          },
        ]}
      />
      {installments.length === 1 && installments[0].sequence === 0 && (
        <p className="text-xs text-muted-foreground">
          The monthly schedule is built when the deposit is paid; the first instalment falls a month
          later.
        </p>
      )}
    </div>
  );
};
