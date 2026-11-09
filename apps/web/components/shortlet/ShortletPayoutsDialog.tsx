'use client';

import { SHORTLET_PAYOUT_STATUS_LABEL } from '@/types/shortlet';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  useToast,
  type BadgeVariant,
} from '@sureground/ui';
import { Banknote, Wallet } from 'lucide-react';
import { NairaSign } from '@sureground/ui/NairaSign';
import { unwrap, unwrapOptional } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { VerificationRequiredNotice } from '@/components/shared/verification/VerificationRequiredNotice';
import { formatCurrency, formatDate } from '@/lib/format';
import { BankAccountFields } from '@/components/shared/payouts/BankAccountFields';
import {
  PAYOUT_CHANGE_COOLDOWN_HINT,
  PayoutHoldNotice,
} from '@/components/shared/payouts/PayoutHoldNotice';
import { payoutDestination } from '@/lib/payoutDestination';
import { PayoutRowDetails } from '@/components/shared/payouts/PayoutRowDetails';
import {
  INCOMPLETE_ACCOUNT_LOOKUP,
  PAYOUT_ARRIVAL_NOTE,
  lookupAllowsSave,
  payoutAccountLabel,
  payoutAccountStepUpSummary,
  saveAccountLabel,
  withdrawStepUpSummary,
  withStepUpSummary,
  type AccountLookup,
} from '@sureground/shared';

const PAYOUT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  SUCCESS: 'success',
  PENDING: 'info',
  FAILED: 'danger',
};

export function ShortletPayoutsDialog({
  onClose,
  verificationHref,
  trustProfileHref,
}: {
  onClose: () => void;
  /** Where the 'Verify now' upsell link goes (the persona's Verification Center). */
  verificationHref: string;
  /**
   * Where the "something else is holding your tier" upsell goes (the persona's
   * trust profile). Omitted for personas that have no profile page, in which
   * case the notice falls back to `verificationHref`.
   */
  trustProfileHref?: string;
}) {
  const queryClient = useQueryClient();
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [lookup, setLookup] = useState<AccountLookup>(INCOMPLETE_ACCOUNT_LOOKUP);
  // Changing the saved account opens the same form as setting one up.
  const [editingAccount, setEditingAccount] = useState(false);
  // Money moves only after the amount and the account it goes to are confirmed.
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);
  const toast = useToast();

  const { data: summary } = useQuery({
    queryKey: ['shortlets', 'host', 'payout-summary'],
    queryFn: () => unwrap(shortletService.payoutSummary()),
  });
  const { data: account } = useQuery({
    queryKey: ['shortlets', 'host', 'payout-account'],
    // No account yet comes back as 200 with no body, and an undefined query
    // result makes react-query throw "Query data cannot be undefined".
    queryFn: () => unwrapOptional(shortletService.payoutAccount(), null),
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
    mutationFn: () =>
      withStepUpSummary(
        payoutAccountStepUpSummary({
          bankName: lookup.bankName,
          accountNumber,
          accountName: lookup.accountName,
        }),
        () => unwrap(shortletService.savePayoutAccount({ bankCode, accountNumber }))
      ),
    onSuccess: () => {
      invalidate();
      setBankCode('');
      setAccountNumber('');
      setEditingAccount(false);
      toast.success('Payout account saved.');
    },
    onError: (reason: Error) => toast.error(reason.message),
  });

  const withdraw = useMutation({
    mutationFn: () =>
      withStepUpSummary(
        withdrawStepUpSummary(formatCurrency(summary?.available ?? 0), account),
        () => unwrap(shortletService.requestPayout())
      ),
    onSuccess: (p) => {
      invalidate();
      toast.success(
        `Withdrawal of ${formatCurrency(p.amount)} is on its way. ${PAYOUT_ARRIVAL_NOTE}`
      );
    },
    onError: (reason: Error) => toast.error(reason.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg p-0">
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
              real money they cannot withdraw yet, so say so up front. When the tier
              is only held back by something else: an open dispute, a review case:
              the summary says which, because sending an already-verified host to get
              verified again is a dead end. */}
          {!withdraw.error && summary && !summary.canWithdraw && (
            <VerificationRequiredNotice
              error={{
                reason: 'TRUST_TIER_REQUIRED',
                tierRequired: summary.withdrawTierRequired,
                currentTier: summary.hostTier,
                withheldReason: summary.withdrawWithheldReason ?? undefined,
              }}
              href={verificationHref}
              verificationHref={verificationHref}
              scoreHref={trustProfileHref}
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
              onClick={() => setConfirmingWithdraw(true)}
              disabled={
                !summary?.accountSet || !summary.available || summary?.canWithdraw === false
              }
              title={
                summary?.canWithdraw === false
                  ? `Withdrawing needs Trust Tier ${summary.withdrawTierRequired}.`
                  : undefined
              }
              icon={<Banknote className="h-4 w-4" />}
              isLoading={withdraw.isPending}
              loadingText="Withdrawing…"
            >
              Withdraw
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
                        <>: the next part unlocks {formatDate(summary.nextReleaseAt)}</>
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
                      On its way to your bank: shows as paid once the bank confirms
                    </span>
                    <span className="font-medium">{formatCurrency(summary.inTransit)}</span>
                  </li>
                )}
                {summary.inFailedPayout > 0 && (
                  <li className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">
                      In a payout that failed: support sends it again to your account
                    </span>
                    <span className="font-medium">{formatCurrency(summary.inFailedPayout)}</span>
                  </li>
                )}
                {(summary.penaltiesOutstanding ?? 0) > 0 && (
                  <li className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">
                      Cancellation fees you owe: taken out of your next withdrawal
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
          {account && !editingAccount ? (
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium">Payout account</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {payoutAccountLabel(account)} · {account.accountName}
              </p>
              <PayoutHoldNotice holdUntil={account.payoutHoldUntil} />
              <p className="mt-2 text-xs text-muted-foreground">{PAYOUT_CHANGE_COOLDOWN_HINT}</p>
              <Button
                className="mt-3"
                variant="outline"
                size="sm"
                onClick={() => setEditingAccount(true)}
              >
                Change account
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4">
              <p className="text-sm font-medium">
                {account ? 'Change your payout account' : 'Set up your payout account'}
              </p>
              <p className="mb-3 mt-1 text-xs text-muted-foreground">
                Your earnings are paid to this NUBAN bank account.
                {account ? ` ${PAYOUT_CHANGE_COOLDOWN_HINT}` : ''}
              </p>
              <div>
                <BankAccountFields
                  idPrefix="shortlet-payout"
                  bankCode={bankCode}
                  onBankCode={setBankCode}
                  accountNumber={accountNumber}
                  onAccountNumber={setAccountNumber}
                  onLookup={setLookup}
                />
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => saveAccount.mutate()}
                  isLoading={saveAccount.isPending}
                  loadingText="Saving…"
                  disabled={!lookupAllowsSave(lookup)}
                >
                  {saveAccountLabel(lookup, 'Save account')}
                </Button>
                {account && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingAccount(false);
                      setBankCode('');
                      setAccountNumber('');
                    }}
                    disabled={saveAccount.isPending}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Ledger */}
          <div>
            <p className="mb-2 text-sm font-medium">Payout history</p>
            {payouts && payouts.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No withdrawals yet: earnings appear here once you withdraw.
              </p>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border">
                {(payouts?.items ?? []).map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <Badge variant={PAYOUT_STATUS_VARIANT[p.status]}>
                        {SHORTLET_PAYOUT_STATUS_LABEL[p.status] ?? p.status}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.bookingCount} booking{p.bookingCount === 1 ? '' : 's'} · Requested{' '}
                        {formatDate(p.createdAt, 'short')}
                        {(p.penaltyDeducted ?? 0) > 0 &&
                          ` · ${formatCurrency(p.penaltyDeducted ?? 0)} cancellation fees taken out`}
                      </p>
                      <PayoutRowDetails
                        state={
                          p.status === 'SUCCESS'
                            ? 'paid'
                            : p.status === 'FAILED'
                              ? 'failed'
                              : 'pending'
                        }
                        paidAt={p.paidAt}
                        transferRef={p.transferRef}
                        sentTo={p.sentTo}
                      />
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
        <ConfirmDialog
          open={confirmingWithdraw}
          onOpenChange={setConfirmingWithdraw}
          tone="primary"
          title={`Withdraw ${formatCurrency(summary?.available ?? 0)}?`}
          description={`${formatCurrency(summary?.available ?? 0)} will be sent to ${
            account ? payoutDestination(account) : 'your payout account'
          }.${
            (summary?.penaltiesOutstanding ?? 0) > 0
              ? ` ${formatCurrency(summary?.penaltiesOutstanding ?? 0)} in cancellation fees you owe is taken out first.`
              : ''
          } Check this is your account before you continue.`}
          confirmLabel={`Withdraw ${formatCurrency(summary?.available ?? 0)}`}
          onConfirm={() => withdraw.mutate()}
        />
      </DialogContent>
    </Dialog>
  );
}
