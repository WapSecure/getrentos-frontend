'use client';

import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Button, ConfirmDialog } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@getrentos/shared';
import type { LandInstallment } from '@/types/landPurchase';
import { LandCaseSection, PanelMessage } from '@/components/admin/land/case/shared';
import { LandLineStatusBadge } from './LandPurchaseStatusBadge';

const MIN_REASON = 5;

/** The installment schedule, with late-fee waivers for finance (`escrow.approve`). */
export const LandPurchaseSchedule = ({
  installments,
  canWaiveLateFee,
  purchaseEnded,
  onWaive,
  isWaiving,
}: {
  installments: LandInstallment[];
  canWaiveLateFee: boolean;
  purchaseEnded: boolean;
  onWaive: (installmentId: string, reason: string) => Promise<unknown>;
  isWaiving: boolean;
}) => {
  const [target, setTarget] = useState<LandInstallment | null>(null);
  const [reason, setReason] = useState('');

  return (
    <LandCaseSection title="Payment schedule" icon={CalendarClock}>
      {installments.length === 0 ? (
        <PanelMessage>No installments on this contract.</PanelMessage>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">Due</th>
                <th className="py-2 pr-3 text-right">Amount</th>
                <th className="py-2 pr-3 text-right">Paid</th>
                <th className="py-2 pr-3 text-right">Late fee</th>
                <th className="py-2 pr-3 text-right">Outstanding</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {installments.map((installment) => {
                const waivable =
                  canWaiveLateFee &&
                  !purchaseEnded &&
                  installment.lateFee > 0 &&
                  (installment.status === 'PENDING' || installment.status === 'OVERDUE');
                return (
                  <tr
                    key={installment.id}
                    className={installment.status === 'OVERDUE' ? 'bg-destructive/5' : undefined}
                  >
                    <td className="py-2 pr-3 text-muted-foreground">{installment.sequence}</td>
                    <td className="py-2 pr-3">
                      <p className="text-foreground">{installment.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(installment.dueDate)}
                        {installment.paidAt && ` · paid ${formatDate(installment.paidAt)}`}
                      </p>
                    </td>
                    <td className="py-2 pr-3 text-right">{formatCurrency(installment.amount)}</td>
                    <td className="py-2 pr-3 text-right">
                      {formatCurrency(installment.amountPaid)}
                    </td>
                    <td
                      className={`py-2 pr-3 text-right ${installment.lateFee > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
                    >
                      {formatCurrency(installment.lateFee)}
                    </td>
                    <td className="py-2 pr-3 text-right font-medium">
                      {formatCurrency(installment.outstanding)}
                    </td>
                    <td className="py-2 pr-3">
                      <LandLineStatusBadge status={installment.status} />
                    </td>
                    <td className="py-2 text-right">
                      {waivable && (
                        <Button variant="ghost" size="xs" onClick={() => setTarget(installment)}>
                          Waive late fee
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        onOpenChange={(open) => {
          if (!open) {
            setTarget(null);
            setReason('');
          }
        }}
        title="Waive this late fee?"
        description={`${formatCurrency(target?.lateFee ?? 0)} on "${target?.label ?? ''}" will be written off and cannot be charged again. The buyer's balance drops by the same amount.`}
        confirmLabel="Waive late fee"
        promptLabel="Reason"
        promptPlaceholder="e.g. Payment delayed by a bank outage confirmed by the provider"
        promptValue={reason}
        onPromptChange={setReason}
        promptRequired
        promptMinLength={MIN_REASON}
        isLoading={isWaiving}
        onConfirm={async () => {
          if (!target) return;
          try {
            await onWaive(target.id, reason);
            setTarget(null);
            setReason('');
          } catch {
            // The parent reports the server error; keep the decision and reason for retry.
          }
        }}
      />
    </LandCaseSection>
  );
};
