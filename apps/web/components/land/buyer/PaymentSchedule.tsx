import { Alert } from '@getrentos/ui';
import { AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import type { LandInstallment } from '@/types/landBuyer';
import { InstallmentStatusBadge } from './LandSaleBadges';
import type { ScheduleSummary } from './landSaleLogic';

/**
 * The installment schedule, with the one the Pay button settles highlighted
 * and overdue rows (and their late fees) called out.
 */
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
          {summary.overdueCount} installment{summary.overdueCount === 1 ? ' is' : 's are'} overdue:{' '}
          {formatCurrency(summary.overdueAmount)} including late fees. Pay now to avoid default.
        </Alert>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[560px] text-sm">
          <caption className="sr-only">Payment schedule</caption>
          <thead className="bg-secondary/60 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">
                Installment
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Due
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Amount
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Late fee
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Owed
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ordered.map((i) => {
              const next = i.id === summary.nextInstallmentId;
              return (
                <tr
                  key={i.id}
                  className={
                    i.status === 'OVERDUE' ? 'bg-destructive/5' : next ? 'bg-primary/5' : undefined
                  }
                  aria-current={next ? 'step' : undefined}
                >
                  <td className="px-3 py-2 text-foreground">
                    {i.label}
                    {next && (
                      <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
                        Next
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{formatDate(i.dueDate)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">
                    {formatCurrency(i.amount)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right tabular-nums ${i.lateFee > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
                  >
                    {i.lateFee > 0 ? formatCurrency(i.lateFee) : '–'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">
                    {i.outstanding > 0 ? formatCurrency(i.outstanding) : '–'}
                  </td>
                  <td className="px-3 py-2">
                    <InstallmentStatusBadge status={i.status} />
                    {i.paidAt && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatDate(i.paidAt)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {installments.length === 1 && installments[0].sequence === 0 && (
        <p className="text-xs text-muted-foreground">
          The monthly schedule is built when the deposit is paid; the first installment falls a
          month later.
        </p>
      )}
    </div>
  );
};
