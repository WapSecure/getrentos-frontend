'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Toast,
  type BadgeVariant,
  type ToastVariant,
} from '@getrentos/ui';
import { Banknote, Wallet } from 'lucide-react';
import { NairaSign } from '@getrentos/ui/NairaSign';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { VerificationRequiredNotice } from '@/components/shared/verification/VerificationRequiredNotice';
import { formatCurrency, formatDate } from '@/lib/format';

const PAYOUT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  SUCCESS: 'success',
  PENDING: 'info',
  FAILED: 'danger',
};

export function ShortletPayoutsDialog({
  onClose,
  verificationHref,
}: {
  onClose: () => void;
  /** Where the 'Verify now' upsell link goes (the persona's Verification Center). */
  verificationHref: string;
}) {
  const queryClient = useQueryClient();
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data: summary } = useQuery({
    queryKey: ['shortlets', 'host', 'payout-summary'],
    queryFn: () => unwrap(shortletService.payoutSummary()),
  });
  const { data: account } = useQuery({
    queryKey: ['shortlets', 'host', 'payout-account'],
    queryFn: () => unwrap(shortletService.payoutAccount()),
  });
  const { data: payouts } = useQuery({
    queryKey: shortletKeys.hostPayouts,
    queryFn: () => unwrap(shortletService.myPayouts({ page: 1, pageSize: 20 })),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['shortlets', 'host'] });
    queryClient.invalidateQueries({ queryKey: shortletKeys.hostPayouts });
  };

  const saveAccount = useMutation({
    mutationFn: () => unwrap(shortletService.savePayoutAccount({ bankCode, accountNumber })),
    onSuccess: () => {
      invalidate();
      setBankCode('');
      setAccountNumber('');
      setToast({ message: 'Payout account saved.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const withdraw = useMutation({
    mutationFn: () => unwrap(shortletService.requestPayout()),
    onSuccess: (p) => {
      invalidate();
      setToast({
        message: `Withdrawal of ${formatCurrency(p.amount)} is on its way.`,
        variant: 'success',
      });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <div className="p-5">
          <DialogTitle>Host payouts</DialogTitle>
          <DialogDescription>
            Withdraw your shortlet earnings to your bank account.
          </DialogDescription>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto border-t border-border p-5">
          {/* Saving a payout account needs identity (tier 2); withdrawing needs financial verification (tier 3). */}
          {(withdraw.error || saveAccount.error) && (
            <VerificationRequiredNotice
              error={withdraw.error || saveAccount.error}
              href={verificationHref}
              verificationHref={verificationHref}
            />
          )}
          {/* The same requirement, shown before the host tries: the balance below is
              real money they cannot withdraw yet, so say so up front. */}
          {!withdraw.error && summary && !summary.canWithdraw && (
            <VerificationRequiredNotice
              error={{
                reason: 'TRUST_TIER_REQUIRED',
                tierRequired: summary.withdrawTierRequired,
                currentTier: summary.hostTier,
              }}
              href={verificationHref}
              verificationHref={verificationHref}
            />
          )}
          {/* Balance */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Available to withdraw</p>
                <p className="text-xl font-semibold">{formatCurrency(summary?.available ?? 0)}</p>
              </div>
            </div>
            <Button
              onClick={() => withdraw.mutate()}
              disabled={
                !summary?.accountSet ||
                !summary.available ||
                summary?.canWithdraw === false ||
                withdraw.isPending
              }
              title={
                summary?.canWithdraw === false
                  ? `Withdrawing needs Trust Tier ${summary.withdrawTierRequired}.`
                  : undefined
              }
            >
              <Banknote className="mr-1.5 h-4 w-4" />
              {withdraw.isPending ? 'Withdrawing…' : 'Withdraw'}
            </Button>
          </div>

          {/* Money that is earned but not withdrawable yet, with the reason for each part. */}
          {summary &&
            (summary.upcoming > 0 ||
              summary.frozen > 0 ||
              summary.inTransit > 0 ||
              summary.inFailedPayout > 0 ||
              (summary.penaltiesOutstanding ?? 0) > 0) && (
              <ul className="space-y-2 rounded-lg border border-border p-4 text-sm">
                {summary.upcoming > 0 && (
                  <li className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">
                      Coming up
                      {summary.nextReleaseAt && (
                        <> — the next part unlocks {formatDate(summary.nextReleaseAt)}</>
                      )}
                    </span>
                    <span className="font-medium">{formatCurrency(summary.upcoming)}</span>
                  </li>
                )}
                {summary.frozen > 0 && (
                  <li className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">On hold while a dispute is open</span>
                    <span className="font-medium">{formatCurrency(summary.frozen)}</span>
                  </li>
                )}
                {summary.inTransit > 0 && (
                  <li className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">
                      On its way to your bank — shows as paid once the bank confirms
                    </span>
                    <span className="font-medium">{formatCurrency(summary.inTransit)}</span>
                  </li>
                )}
                {summary.inFailedPayout > 0 && (
                  <li className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">
                      In a payout that failed — support will retry it
                    </span>
                    <span className="font-medium">{formatCurrency(summary.inFailedPayout)}</span>
                  </li>
                )}
                {(summary.penaltiesOutstanding ?? 0) > 0 && (
                  <li className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">
                      Cancellation fees you owe — taken out of your next withdrawal
                    </span>
                    <span className="whitespace-nowrap font-medium text-destructive">
                      −{formatCurrency(summary.penaltiesOutstanding)}
                    </span>
                  </li>
                )}
              </ul>
            )}
          {summary && (
            <p className="text-xs text-muted-foreground">
              Earnings unlock {summary.holdHours} hours after your guest&apos;s check-in time
              {summary.holdHours > 24
                ? ' (a longer wait applies until your first payout is complete)'
                : ''}
              , so a guest who doesn&apos;t arrive or reports a problem can be refunded first.
            </p>
          )}

          {/* Payout account */}
          {account ? (
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium">Payout account</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {account.bankName} · {account.accountNumber} · {account.accountName}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                To change it, enter new details below and save.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4">
              <p className="text-sm font-medium">Set up your payout account</p>
              <p className="mb-3 mt-1 text-xs text-muted-foreground">
                Your earnings are paid to this NUBAN bank account.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Bank code" hint="e.g. 058 for GTBank">
                  <Input
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    placeholder="058"
                    maxLength={6}
                  />
                </Field>
                <Field label="Account number">
                  <Input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="0123456789"
                    maxLength={10}
                  />
                </Field>
              </div>
              <Button
                className="mt-3 w-full"
                variant="outline"
                onClick={() => saveAccount.mutate()}
                disabled={
                  bankCode.length < 3 || accountNumber.length !== 10 || saveAccount.isPending
                }
              >
                {saveAccount.isPending ? 'Saving…' : 'Save account'}
              </Button>
            </div>
          )}

          {/* Ledger */}
          <div>
            <p className="mb-2 text-sm font-medium">Payout history</p>
            {payouts && payouts.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No withdrawals yet — earnings appear here once you withdraw.
              </p>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border">
                {(payouts?.items ?? []).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3">
                    <div>
                      <Badge variant={PAYOUT_STATUS_VARIANT[p.status]}>{p.status}</Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.bookingCount} booking{p.bookingCount === 1 ? '' : 's'} ·{' '}
                        {formatDate(p.createdAt, 'short')}
                        {(p.penaltyDeducted ?? 0) > 0 &&
                          ` · ${formatCurrency(p.penaltyDeducted ?? 0)} cancellation fees taken out`}
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(p.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <NairaSign className="h-3.5 w-3.5" /> Payouts transfer to your bank via Paystack.
          </p>
        </div>
        {toast && (
          <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
