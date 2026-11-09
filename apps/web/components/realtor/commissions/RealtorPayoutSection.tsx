'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, CheckCircle2, Landmark } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Pagination,
  type BadgeVariant,
} from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap, unwrapOptional } from '@/lib/apiHelpers';
import { realtorService } from '@/services/realtorService';
import { realtorKeys } from '@/lib/queryKeys';
import {
  VerificationRequiredNotice,
  isVerificationGateError,
} from '@/components/shared/verification/VerificationRequiredNotice';
import { payoutDestination } from '@/lib/payoutDestination';
import type { RealtorPayoutStatus } from '@/types/realtor';
import { BankAccountFields } from '@/components/shared/payouts/BankAccountFields';
import {
  PAYOUT_CHANGE_COOLDOWN_HINT,
  PayoutHoldNotice,
} from '@/components/shared/payouts/PayoutHoldNotice';
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

const PAGE_SIZE = 5;

const PAYOUT_STATUS: Record<RealtorPayoutStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Processing', variant: 'warning' },
  success: { label: 'Paid', variant: 'success' },
  failed: { label: 'Failed', variant: 'danger' },
};

// The withdrawal block reason comes from the summary, not a 403: a dispute hold and missing evidence need different advice.
export const RealtorPayoutSection = () => {
  const queryClient = useQueryClient();
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [lookup, setLookup] = useState<AccountLookup>(INCOMPLETE_ACCOUNT_LOOKUP);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [justPaid, setJustPaid] = useState<number | null>(null);
  // Money moves only after the amount and the account it goes to are confirmed.
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);

  const { data: account } = useQuery({
    queryKey: realtorKeys.payoutAccount,
    // No account yet comes back as 200 with no body, which axios makes `undefined`, a value react-query rejects.
    queryFn: () => unwrapOptional(realtorService.getPayoutAccount(), null),
  });

  const { data: summary } = useQuery({
    queryKey: realtorKeys.payoutsSummary,
    queryFn: () => unwrap(realtorService.getPayoutSummary()),
  });

  const { data: payouts } = useQuery({
    queryKey: [...realtorKeys.payouts, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(realtorService.listPayouts({ page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });

  const save = useMutation({
    mutationFn: () =>
      withStepUpSummary(
        payoutAccountStepUpSummary({
          bankName: lookup.bankName,
          accountNumber,
          accountName: lookup.accountName,
        }),
        () => unwrap(realtorService.savePayoutAccount({ bankCode, accountNumber }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.payoutAccount });
      queryClient.invalidateQueries({ queryKey: realtorKeys.payoutsSummary });
      setBankCode('');
      setAccountNumber('');
      setSaveError(null);
    },
    onError: (err: Error) => setSaveError(err.message || 'Unable to save your payout account.'),
  });

  const withdraw = useMutation({
    mutationFn: () =>
      withStepUpSummary(
        withdrawStepUpSummary(formatCurrency(summary?.available ?? 0), account),
        () => unwrap(realtorService.requestPayout())
      ),
    onSuccess: (payout) => {
      setJustPaid(payout.amount);
      // Everything the money touches must refresh, or the balance still shows as withdrawable.
      queryClient.invalidateQueries({ queryKey: realtorKeys.commissions });
      queryClient.invalidateQueries({ queryKey: realtorKeys.payoutsSummary });
      queryClient.invalidateQueries({ queryKey: realtorKeys.payouts });
    },
  });

  const canSave = lookupAllowsSave(lookup);
  const rows = payouts?.items ?? [];
  const total = payouts?.total ?? 0;
  const blocked = summary?.canWithdraw === false;
  const withdrawDisabled = !summary?.accountSet || !summary.available || blocked;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Payouts</h2>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Landmark className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Payout account</h3>
        </div>

        {account ? (
          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-medium text-foreground">
              {payoutAccountLabel(account)} · {account.accountName}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <p className="text-xs text-success">
                Commission for closed deals is paid into this account
              </p>
            </div>
            <PayoutHoldNotice holdUntil={account.payoutHoldUntil} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            Add the bank account commission should be paid into. You can only withdraw once it is on
            file.
          </p>
        )}

        <div className={account ? 'mt-4' : ''}>
          {account && (
            <p className="text-xs text-muted-foreground mb-3">
              Replace it by entering a new account below. {PAYOUT_CHANGE_COOLDOWN_HINT}
            </p>
          )}
          <div className="space-y-3">
            <BankAccountFields
              idPrefix="realtor-payout"
              bankCode={bankCode}
              onBankCode={setBankCode}
              accountNumber={accountNumber}
              onAccountNumber={setAccountNumber}
              onLookup={setLookup}
            />
            <Button
              onClick={() => save.mutate()}
              isLoading={save.isPending}
              loadingText="Saving…"
              disabled={!canSave}
              variant={account ? 'outline' : 'primary'}
            >
              {saveAccountLabel(lookup, account ? 'Replace' : 'Save account')}
            </Button>
          </div>
          {saveError && (
            <Alert variant="danger" className="mt-2">
              {saveError}
            </Alert>
          )}
          {/* Saving an account needs identity verification (tier 2). */}
          <div className="mt-3 empty:mt-0">
            <VerificationRequiredNotice
              error={save.error}
              href={ROUTES.REALTOR_VERIFICATION}
              verificationHref={ROUTES.REALTOR_VERIFICATION}
              scoreHref={ROUTES.REALTOR_TRUST_PROFILE}
            />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex p-2.5 rounded-xl bg-accent">
              <Banknote className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available to withdraw</p>
              <p className="text-xl font-bold text-foreground tracking-tight">
                {formatCurrency(summary?.available ?? 0)}
              </p>
            </div>
          </div>
          <Button
            icon={<Banknote className="h-4 w-4" />}
            onClick={() => setConfirmingWithdraw(true)}
            isLoading={withdraw.isPending}
            loadingText="Withdrawing…"
            disabled={withdrawDisabled}
            title={
              blocked
                ? `Withdrawing needs Trust Tier ${summary?.withdrawTierRequired}.`
                : !summary?.accountSet
                  ? 'Add a payout account first.'
                  : undefined
            }
          >
            Withdraw
          </Button>
        </div>

        {justPaid != null && !withdraw.isPending && (
          <p className="text-xs text-success mt-3">
            {formatCurrency(justPaid)} is on its way to your bank. {PAYOUT_ARRIVAL_NOTE}
          </p>
        )}

        {!withdraw.error && summary && blocked && (
          <div className="mt-4">
            <VerificationRequiredNotice
              error={{
                reason: 'TRUST_TIER_REQUIRED',
                tierRequired: summary.withdrawTierRequired,
                currentTier: summary.tier,
                withheldReason: summary.withdrawWithheldReason ?? undefined,
              }}
              href={ROUTES.REALTOR_VERIFICATION}
              verificationHref={ROUTES.REALTOR_VERIFICATION}
              scoreHref={ROUTES.REALTOR_TRUST_PROFILE}
            />
          </div>
        )}
        {withdraw.error && !isVerificationGateError(withdraw.error) && (
          <Alert variant="danger" className="mt-3">
            {withdraw.error.message || 'Your withdrawal didn’t go through. Please try again.'}
          </Alert>
        )}
        <div className="mt-3 empty:mt-0">
          <VerificationRequiredNotice
            error={withdraw.error}
            href={ROUTES.REALTOR_VERIFICATION}
            verificationHref={ROUTES.REALTOR_VERIFICATION}
            scoreHref={ROUTES.REALTOR_TRUST_PROFILE}
          />
        </div>
      </Card>

      <ConfirmDialog
        open={confirmingWithdraw}
        onOpenChange={setConfirmingWithdraw}
        tone="primary"
        title={`Withdraw ${formatCurrency(summary?.available ?? 0)}?`}
        description={`${formatCurrency(summary?.available ?? 0)} will be sent to ${
          account ? payoutDestination(account) : 'your payout account'
        }. Check this is your account before you continue.`}
        confirmLabel={`Withdraw ${formatCurrency(summary?.available ?? 0)}`}
        onConfirm={() => withdraw.mutate()}
      />

      <Card>
        <div className="px-5 pt-5">
          <h3 className="text-sm font-semibold text-foreground">Payout history</h3>
        </div>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="p-4 font-medium">Requested</th>
                <th className="p-4 font-medium">Commissions</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">
                    No payouts yet. Withdrawing your available commission creates one.
                  </td>
                </tr>
              ) : (
                rows.map((p) => {
                  const meta = PAYOUT_STATUS[p.status];
                  return (
                    <tr key={p.id} className="hover:bg-secondary transition-colors">
                      <td className="p-4 text-muted-foreground whitespace-nowrap">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="p-4 text-muted-foreground whitespace-nowrap">
                        {p.commissionCount}
                      </td>
                      <td className="p-4 font-medium text-foreground whitespace-nowrap">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="p-4 min-w-56">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        <PayoutRowDetails
                          state={
                            p.status === 'success'
                              ? 'paid'
                              : p.status === 'failed'
                                ? 'failed'
                                : 'pending'
                          }
                          paidAt={p.paidAt}
                          transferRef={p.transferRef}
                          failureReason={p.failureReason}
                          sentTo={p.sentTo}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {total > 0 && (
          <div className="p-5">
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
};
