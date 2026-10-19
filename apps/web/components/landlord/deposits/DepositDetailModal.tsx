'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  Button,
  Badge,
  Input,
  Textarea,
  CurrencyInput,
  PageLoadingState,
  type BadgeVariant,
} from '@getrentos/ui';
import { Plus, Check, X, Undo2 } from 'lucide-react';
import {
  depositService,
  DEDUCTION_STATUS_LABELS,
  DEPOSIT_STATUS_LABELS,
  type DeductionStatus,
  type DepositDeduction,
} from '@/services/depositService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';

const DEDUCTION_VARIANT: Record<DeductionStatus, BadgeVariant> = {
  PROPOSED: 'warning',
  APPROVED: 'success',
  REJECTED: 'neutral',
};

const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

/**
 * One deduction, with what the owner can do about it. A tenant's dispute is
 * shown in their words; a disputed proposal is approved only with an answer,
 * and a disputed deduction that already counts is kept (with a reason) or
 * dropped. Errors are shown, not swallowed.
 */
const DeductionRow = ({
  depositId,
  deduction: d,
  open,
  onChanged,
}: {
  depositId: string;
  deduction: DepositDeduction;
  open: boolean;
  onChanged: () => void;
}) => {
  const [mode, setMode] = useState<'idle' | 'reject' | 'answer'>('idle');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const disputeOpen = Boolean(d.tenantDisputedAt && !d.disputeAnsweredAt);
  const done = () => {
    setMode('idle');
    setText('');
    setError(null);
    onChanged();
  };
  const onError = (err: Error) => setError(err.message || 'That did not go through.');
  const approve = useMutation({
    mutationFn: () =>
      unwrap(depositService.approveDeduction(depositId, d.id, text.trim() || undefined)),
    onSuccess: done,
    onError,
  });
  const reject = useMutation({
    mutationFn: () => unwrap(depositService.rejectDeduction(depositId, d.id, text.trim())),
    onSuccess: done,
    onError,
  });
  const answer = useMutation({
    mutationFn: (withdraw: boolean) =>
      unwrap(depositService.answerDispute(depositId, d.id, { answer: text.trim(), withdraw })),
    onSuccess: done,
    onError,
  });

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-foreground">{formatNaira(d.amount)}</span>
        <div className="flex items-center gap-1.5">
          {disputeOpen && <Badge variant="danger">Disputed</Badge>}
          <Badge variant={DEDUCTION_VARIANT[d.status]}>{DEDUCTION_STATUS_LABELS[d.status]}</Badge>
        </div>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{d.reason}</p>
      {d.decisionNote && (
        <p className="mt-1 text-sm text-muted-foreground">
          {d.status === 'REJECTED' ? 'Rejected' : 'Note'}: {d.decisionNote}
        </p>
      )}
      {d.tenantDisputedAt && (
        <div className="mt-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <p className="text-foreground">
            <span className="font-medium">Tenant disputes this:</span> {d.tenantDisputeReason}
          </p>
          {d.disputeAnswer && (
            <p className="mt-1 text-muted-foreground">
              <span className="font-medium text-foreground">Your answer:</span> {d.disputeAnswer}
            </p>
          )}
        </div>
      )}

      {open && d.status === 'PROPOSED' && (
        <div className="mt-3 space-y-2">
          {(mode !== 'idle' || disputeOpen) && (
            <Input
              placeholder={
                mode === 'reject'
                  ? 'Reason for rejecting'
                  : disputeOpen
                    ? 'Answer the tenant (needed to approve)'
                    : 'Note (optional)'
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          )}
          <div className="flex flex-wrap gap-2">
            {mode === 'reject' ? (
              <>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={!text.trim() || reject.isPending}
                  onClick={() => reject.mutate()}
                >
                  Confirm reject
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setMode('idle')}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                  disabled={approve.isPending || (disputeOpen && text.trim().length < 10)}
                  onClick={() => approve.mutate()}
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setMode('reject')}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {open && d.status === 'APPROVED' && disputeOpen && (
        <div className="mt-3 space-y-2">
          <Textarea
            placeholder="Answer the tenant: why it stands, or that you are dropping it"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={text.trim().length < 10 || answer.isPending}
              onClick={() => answer.mutate(false)}
            >
              Keep deduction
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={text.trim().length < 10 || answer.isPending}
              onClick={() => answer.mutate(true)}
            >
              Drop deduction
            </Button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
};

interface DepositDetailModalProps {
  depositId: string | null;
  onClose: () => void;
}

export const DepositDetailModal = ({ depositId, onClose }: DepositDetailModalProps) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('');

  const { data: deposit, isLoading } = useQuery({
    queryKey: depositId ? landlordKeys.deposit(depositId) : ['deposit', 'none'],
    queryFn: () => unwrap(depositService.get(depositId!)),
    enabled: Boolean(depositId),
  });

  const afterChange = () => {
    if (depositId) queryClient.invalidateQueries({ queryKey: landlordKeys.deposit(depositId) });
    queryClient.invalidateQueries({ queryKey: ['landlord', 'deposits'] });
  };

  const deductMutation = useMutation({
    mutationFn: () =>
      unwrap(depositService.proposeDeduction(depositId!, { amount, reason: reason.trim() })),
    onSuccess: () => {
      setAmount(0);
      setReason('');
      afterChange();
    },
  });

  const returnMutation = useMutation({
    mutationFn: () => unwrap(depositService.returnDeposit(depositId!)),
    onSuccess: afterChange,
  });

  const isOpen = Boolean(depositId);
  const canReturn = deposit && deposit.status !== 'RETURNED';
  const hasProposed = deposit?.deductions.some((d) => d.status === 'PROPOSED') ?? false;
  const hasOpenDispute =
    deposit?.deductions.some((d) => d.tenantDisputedAt && !d.disputeAnsweredAt) ?? false;
  const returnBlocker = hasProposed
    ? 'Resolve proposed deductions before returning'
    : hasOpenDispute
      ? 'Answer the tenant’s dispute before returning'
      : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-2xl">
        <div className="max-h-[85vh] overflow-y-auto p-6">
          {isLoading || !deposit ? (
            <PageLoadingState />
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {deposit.propertyTitle ?? 'Property'}
                  </h2>
                  <p className="mt-1">
                    <Badge variant={deposit.status === 'RETURNED' ? 'success' : 'info'}>
                      {DEPOSIT_STATUS_LABELS[deposit.status]}
                    </Badge>
                  </p>
                </div>
              </div>

              {/* Balances */}
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-secondary p-4 sm:grid-cols-4">
                {[
                  { label: 'Held', value: deposit.summary.held },
                  { label: 'Approved', value: deposit.summary.approvedDeductions },
                  { label: 'Proposed', value: deposit.summary.proposedDeductions },
                  { label: 'Returnable', value: deposit.summary.returnable },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="font-semibold text-foreground">{formatNaira(stat.value)}</p>
                  </div>
                ))}
              </div>

              {deposit.returnedAt && deposit.returnedAmount != null && (
                <p className="rounded-xl bg-success-subtle p-3 text-sm text-success">
                  {formatNaira(deposit.returnedAmount)} returned to the tenant on{' '}
                  {new Date(deposit.returnedAt).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  .
                </p>
              )}

              {/* Deductions */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Deductions</p>
                {deposit.deductions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No deductions.</p>
                ) : (
                  deposit.deductions.map((d) => (
                    <DeductionRow
                      key={d.id}
                      depositId={deposit.id}
                      deduction={d}
                      open={deposit.status !== 'RETURNED'}
                      onChanged={afterChange}
                    />
                  ))
                )}
              </div>

              {/* Record a deduction (while open) */}
              {deposit.status !== 'RETURNED' && (
                <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
                  <p className="text-sm font-medium text-foreground">Record a deduction</p>
                  <CurrencyInput value={amount} onValueChange={setAmount} placeholder="Amount" />
                  <Textarea
                    placeholder="Reason, e.g. repaint, cleaning"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      className="gap-1.5"
                      disabled={amount <= 0 || !reason.trim() || deductMutation.isPending}
                      onClick={() => deductMutation.mutate()}
                    >
                      <Plus className="h-4 w-4" />
                      Add deduction
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                {canReturn && (
                  <Button
                    variant="primary"
                    className="gap-1.5"
                    disabled={Boolean(returnBlocker) || returnMutation.isPending}
                    title={returnBlocker}
                    onClick={() => returnMutation.mutate()}
                  >
                    <Undo2 className="h-4 w-4" />
                    {returnMutation.isPending ? 'Returning…' : 'Return deposit'}
                  </Button>
                )}
              </div>
              {returnBlocker && canReturn && (
                <p className="text-right text-xs text-muted-foreground">{returnBlocker}.</p>
              )}
              {returnMutation.error && (
                <p className="text-right text-sm text-destructive">
                  {(returnMutation.error as Error).message}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
