'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, CheckCircle2, Landmark } from 'lucide-react';
import { Button, Pagination } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap, unwrapOptional } from '@/lib/apiHelpers';
import { realtorService } from '@/services/realtorService';
import { realtorKeys } from '@/lib/queryKeys';
import { VerificationRequiredNotice } from '@/components/shared/verification/VerificationRequiredNotice';
import type { RealtorPayoutStatus } from '@/types/realtor';

const PAGE_SIZE = 5;

const PAYOUT_STATUS: Record<RealtorPayoutStatus, { label: string; className: string }> = {
  pending: {
    label: 'Processing',
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  success: {
    label: 'Paid',
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  failed: {
    label: 'Failed',
    className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
};

/**
 * Where commission is paid out and what has been paid so far.
 *
 * The withdrawal is shown before it is attempted: a realtor holding a balance
 * they cannot take out needs to know why at a glance, and the reason comes from
 * the summary rather than from a 403, because a tier held down by an open
 * dispute and one held down by missing evidence need different advice.
 */
export const RealtorPayoutSection = () => {
  const queryClient = useQueryClient();
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [justPaid, setJustPaid] = useState<number | null>(null);

  const { data: account } = useQuery({
    queryKey: realtorKeys.payoutAccount,
    // The API answers 200 with no body when there is no account yet, which
    // axios turns into `undefined`: a value react-query rejects outright.
    queryFn: () => unwrapOptional(realtorService.getPayoutAccount(), null),
  });

  const { data: summary } = useQuery({
    queryKey: realtorKeys.payoutsSummary,
    queryFn: () => unwrap(realtorService.getPayoutSummary()),
  });

  const { data: payouts } = useQuery({
    queryKey: [...realtorKeys.payouts, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(realtorService.listPayouts({ page, pageSize: PAGE_SIZE })),
  });

  const save = useMutation({
    mutationFn: () => unwrap(realtorService.savePayoutAccount({ bankCode, accountNumber })),
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
    mutationFn: () => unwrap(realtorService.requestPayout()),
    onSuccess: (payout) => {
      setJustPaid(payout.amount);
      // Everything the money touches has to refresh, or the balance still shows
      // as withdrawable after it has gone.
      queryClient.invalidateQueries({ queryKey: realtorKeys.commissions });
      queryClient.invalidateQueries({ queryKey: realtorKeys.payoutsSummary });
      queryClient.invalidateQueries({ queryKey: realtorKeys.payouts });
    },
  });

  const canSave = bankCode.trim().length >= 3 && accountNumber.trim().length === 10;
  const rows = payouts?.items ?? [];
  const total = payouts?.total ?? 0;
  const blocked = summary?.canWithdraw === false;
  const withdrawDisabled =
    !summary?.accountSet || !summary.available || blocked || withdraw.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Payouts</h2>
      </div>

      {/* Payout account */}
      <div className="rounded-2xl bg-card border border-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <Landmark className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Payout account</h3>
        </div>

        {account ? (
          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-medium text-foreground">
              {account.bankName} · {account.accountNumber} · {account.accountName}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-xs text-green-700 dark:text-green-400">
                Commission for closed deals is paid into this account
              </p>
            </div>
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
              Replace it by entering a new account below.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
            <input
              inputMode="numeric"
              placeholder="Bank code (e.g. 058)"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <input
              inputMode="numeric"
              placeholder="10-digit account number"
              value={accountNumber}
              maxLength={10}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <Button
              onClick={() => save.mutate()}
              disabled={!canSave || save.isPending}
              variant={account ? 'outline' : 'primary'}
            >
              {save.isPending ? 'Saving…' : account ? 'Replace' : 'Save account'}
            </Button>
          </div>
          {saveError && <p className="text-xs text-red-600 mt-2">{saveError}</p>}
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
      </div>

      {/* Balance + withdraw */}
      <div className="rounded-2xl bg-card border border-border p-5">
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
            onClick={() => withdraw.mutate()}
            disabled={withdrawDisabled}
            title={
              blocked
                ? `Withdrawing needs Trust Tier ${summary?.withdrawTierRequired}.`
                : !summary?.accountSet
                  ? 'Add a payout account first.'
                  : undefined
            }
          >
            <Banknote className="mr-1.5 h-4 w-4" />
            {withdraw.isPending ? 'Withdrawing…' : 'Withdraw'}
          </Button>
        </div>

        {justPaid != null && !withdraw.isPending && (
          <p className="text-xs text-green-700 dark:text-green-400 mt-3">
            {formatCurrency(justPaid)} is on its way to your bank.
          </p>
        )}

        {/* The requirement, shown before it is hit. */}
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
        <div className="mt-3 empty:mt-0">
          <VerificationRequiredNotice
            error={withdraw.error}
            href={ROUTES.REALTOR_VERIFICATION}
            verificationHref={ROUTES.REALTOR_VERIFICATION}
            scoreHref={ROUTES.REALTOR_TRUST_PROFILE}
          />
        </div>
      </div>

      {/* Payout history */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
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
                        {formatCurrency(p.amount, { compact: true })}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                        {/* A failed transfer is money the bank sent back, so say why
                            rather than leaving the realtor to guess. */}
                        {p.status === 'failed' && p.failureReason && (
                          <span className="block text-xs text-muted-foreground mt-1">
                            {p.failureReason}
                          </span>
                        )}
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
      </div>
    </div>
  );
};
