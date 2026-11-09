'use client';

import { useState } from 'react';
import { CalendarClock } from '@sureground/icons';
import { Button, ConfirmDialog, DataTable, type Column } from '@sureground/ui';
import { formatCurrency, formatDate } from '@sureground/shared';
import type { LandInstallment } from '@/types/landPurchase';
import { LandCaseSection, PanelMessage } from '@/components/admin/land/case/shared';
import { LandLineStatusBadge } from './LandPurchaseStatusBadge';

const MIN_REASON = 5;

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

  const columns: Column<LandInstallment>[] = [
    {
      key: 'sequence',
      header: '#',
      className: 'text-muted-foreground',
      render: (installment) => installment.sequence,
    },
    {
      key: 'due',
      header: 'Due',
      render: (installment) => (
        <>
          <p className="text-foreground">{installment.label}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(installment.dueDate)}
            {installment.paidAt && ` · paid ${formatDate(installment.paidAt)}`}
          </p>
        </>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      numeric: true,
      render: (installment) => formatCurrency(installment.amount),
    },
    {
      key: 'paid',
      header: 'Paid',
      numeric: true,
      render: (installment) => formatCurrency(installment.amountPaid),
    },
    {
      key: 'lateFee',
      header: 'Late fee',
      numeric: true,
      render: (installment) => (
        <span className={installment.lateFee > 0 ? 'text-destructive' : 'text-muted-foreground'}>
          {formatCurrency(installment.lateFee)}
        </span>
      ),
    },
    {
      key: 'outstanding',
      header: 'Outstanding',
      numeric: true,
      className: 'font-medium',
      render: (installment) => formatCurrency(installment.outstanding),
    },
    {
      key: 'status',
      header: 'Status',
      render: (installment) => <LandLineStatusBadge status={installment.status} />,
    },
    {
      key: 'actions',
      header: '',
      srHeader: 'Actions',
      align: 'right',
      render: (installment) => {
        const waivable =
          canWaiveLateFee &&
          !purchaseEnded &&
          installment.lateFee > 0 &&
          (installment.status === 'PENDING' || installment.status === 'OVERDUE');
        return (
          waivable && (
            <Button variant="ghost" size="xs" onClick={() => setTarget(installment)}>
              Waive late fee
            </Button>
          )
        );
      },
    },
  ];

  return (
    <LandCaseSection title="Payment schedule" icon={CalendarClock}>
      {installments.length === 0 ? (
        <PanelMessage>No installments on this contract.</PanelMessage>
      ) : (
        <DataTable
          caption="Installments on this contract"
          density="compact"
          columns={columns}
          data={installments}
          getRowKey={(installment) => installment.id}
          getRowClassName={(installment) =>
            installment.status === 'OVERDUE' ? 'bg-destructive/5' : undefined
          }
        />
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
