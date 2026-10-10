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

interface DepositDetailModalProps {
  depositId: string | null;
  onClose: () => void;
}

export const DepositDetailModal = ({ depositId, onClose }: DepositDetailModalProps) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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

  const approveMutation = useMutation({
    mutationFn: (deductionId: string) =>
      unwrap(depositService.approveDeduction(depositId!, deductionId)),
    onSuccess: afterChange,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ deductionId, note }: { deductionId: string; note: string }) =>
      unwrap(depositService.rejectDeduction(depositId!, deductionId, note)),
    onSuccess: () => {
      setRejectingId(null);
      setRejectReason('');
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
                    <div key={d.id} className="rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-foreground">{formatNaira(d.amount)}</span>
                        <Badge variant={DEDUCTION_VARIANT[d.status]}>
                          {DEDUCTION_STATUS_LABELS[d.status]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{d.reason}</p>
                      {d.decisionNote && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Rejected: {d.decisionNote}
                        </p>
                      )}
                      {d.status === 'PROPOSED' && deposit.status !== 'RETURNED' && (
                        <div className="mt-3">
                          {rejectingId === d.id ? (
                            <div className="space-y-2">
                              <Input
                                placeholder="Reason for rejecting"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="danger"
                                  size="sm"
                                  disabled={!rejectReason.trim() || rejectMutation.isPending}
                                  onClick={() =>
                                    rejectMutation.mutate({
                                      deductionId: d.id,
                                      note: rejectReason.trim(),
                                    })
                                  }
                                >
                                  Confirm reject
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setRejectingId(null);
                                    setRejectReason('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="gap-1.5"
                                disabled={approveMutation.isPending}
                                onClick={() => approveMutation.mutate(d.id)}
                              >
                                <Check className="h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => setRejectingId(d.id)}
                              >
                                <X className="h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
                    disabled={hasProposed || returnMutation.isPending}
                    title={hasProposed ? 'Resolve proposed deductions before returning' : undefined}
                    onClick={() => returnMutation.mutate()}
                  >
                    <Undo2 className="h-4 w-4" />
                    {returnMutation.isPending ? 'Returning…' : 'Return deposit'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
