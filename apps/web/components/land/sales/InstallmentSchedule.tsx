'use client';

import { Badge } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import type { LandInstallment } from '@/types/landDeveloper';
import { INSTALLMENT_STATUS } from '../developer/labels';

/** The purchase's schedule: each installment, what was paid and what is still owed. */
export const InstallmentSchedule = ({ installments }: { installments: LandInstallment[] }) => {
  if (installments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No installments yet. The schedule is set when the deposit is paid.
      </p>
    );
  }
  const ordered = [...installments].sort((a, b) => a.sequence - b.sequence);
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5">Installment</th>
            <th className="px-4 py-2.5">Due</th>
            <th className="px-4 py-2.5 text-right">Amount</th>
            <th className="px-4 py-2.5 text-right">Paid</th>
            <th className="px-4 py-2.5 text-right">Owed</th>
            <th className="px-4 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {ordered.map((installment) => {
            const status = INSTALLMENT_STATUS[installment.status] ?? INSTALLMENT_STATUS.PENDING;
            return (
              <tr key={installment.id}>
                <td className="px-4 py-2.5 text-foreground">{installment.label}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                  {formatDate(installment.dueDate)}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right text-foreground">
                  {formatCurrency(installment.amount)}
                  {installment.lateFee > 0 && (
                    <span className="block text-xs text-destructive">
                      + {formatCurrency(installment.lateFee)} late fee
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right text-foreground">
                  {formatCurrency(installment.amountPaid)}
                  {installment.paidAt && (
                    <span className="block text-xs text-muted-foreground">
                      {formatDate(installment.paidAt)}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium text-foreground">
                  {formatCurrency(installment.outstanding)}
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
