'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Landmark, Wallet } from 'lucide-react';
import { Badge, Button, Card, Skeleton, useToast, type ToastVariant } from '@sureground/ui';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { agencyCommissionService } from '@/services/agencyCommissionService';
import {
  PAYOUT_CHANGE_COOLDOWN_HINT,
  PayoutHoldNotice,
} from '@/components/shared/payouts/PayoutHoldNotice';
import { BankAccountFields } from '@/components/shared/payouts/BankAccountFields';
import { PayoutRowDetails } from '@/components/shared/payouts/PayoutRowDetails';
import {
  INCOMPLETE_ACCOUNT_LOOKUP,
  lookupAllowsSave,
  payoutAccountLabel,
  payoutAccountStepUpSummary,
  saveAccountLabel,
  withStepUpSummary,
  type AccountLookup,
} from '@sureground/shared';

/** The agent payout API sends its status in lower case ("success"); the firm's in upper. */
function payoutState(status: string): 'paid' | 'failed' | 'pending' {
  const s = status.toUpperCase();
  return s === 'SUCCESS' ? 'paid' : s === 'FAILED' ? 'failed' : 'pending';
}

// Also rendered in the realtor and agent portals (`standalone`), since many agency agents never see /agency; there it renders nothing unless the viewer belongs to an agency.
export function AgencyAgentSelfPayout({
  onToast,
  standalone = false,
  className,
}: {
  onToast?: (message: string, variant: ToastVariant) => void;
  standalone?: boolean;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const [editingAccount, setEditingAccount] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [lookup, setLookup] = useState<AccountLookup>(INCOMPLETE_ACCOUNT_LOOKUP);
  const toast = useToast();
  const notify =
    onToast ?? ((message: string, variant: ToastVariant) => toast.show(message, variant));

  const myAccountQuery = useQuery({
    queryKey: ['agency', 'myAgentAccount'],
    queryFn: () => unwrap(agencyCommissionService.getMyAgentAccount()),
  });
  const mySummaryQuery = useQuery({
    queryKey: ['agency', 'myAgentSummary'],
    queryFn: () => unwrap(agencyCommissionService.myAgentSummary()),
  });
  const myPayoutsQuery = useQuery({
    queryKey: ['agency', 'myAgentPayouts'],
    queryFn: () => unwrap(agencyCommissionService.myAgentPayouts()),
  });

  const saveAccount = useMutation({
    mutationFn: () =>
      withStepUpSummary(
        payoutAccountStepUpSummary({
          bankName: lookup.bankName,
          accountNumber,
          accountName: lookup.accountName,
        }),
        () => unwrap(agencyCommissionService.saveMyAgentAccount({ bankCode, accountNumber }))
      ),
    onSuccess: () => {
      setEditingAccount(false);
      setBankCode('');
      setAccountNumber('');
      ['agentPayable', 'myAgentAccount', 'myAgentSummary', 'myAgentPayouts'].forEach((k) =>
        queryClient.invalidateQueries({ queryKey: ['agency', k] })
      );
      notify('Your payout account is saved.', 'success');
    },
    onError: (e: Error) => notify(e.message || 'Could not save your account.', 'error'),
  });

  const account = myAccountQuery.data;
  const summary = mySummaryQuery.data;
  const myPayouts = (myPayoutsQuery.data ?? []).slice(0, 5);
  const canSave = lookupAllowsSave(lookup);

  if (standalone && !(summary?.agencyName || (summary?.earned ?? 0) > 0)) return null;

  const cards = (
    <div className={cn('grid gap-4 lg:grid-cols-2', !standalone && className)}>
      <Card className="rounded-2xl p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          Your commission payouts
        </h3>
        {summary ? (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(summary.earned)}</p>
              <p className="text-xs text-muted-foreground">Earned</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(summary.paid)}</p>
              <p className="text-xs text-muted-foreground">Paid</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(summary.pending)}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        ) : mySummaryQuery.isLoading ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">—</p>
        )}
        {summary && !summary.canReceive && (
          <p className="mt-3 text-xs text-warning">
            Verify your identity to trust tier {summary.withdrawTierRequired} to receive payouts.
          </p>
        )}
        {myPayouts.length > 0 && (
          <ul className="mt-4 divide-y divide-border/60 border-t border-border/60 text-sm">
            {myPayouts.map((p) => {
              const state = payoutState(p.status);
              return (
                <li key={p.id} className="py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      Requested {formatDate(p.createdAt)}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {formatCurrency(p.amount)}
                      </span>
                      <Badge
                        variant={
                          state === 'paid' ? 'success' : state === 'failed' ? 'danger' : 'neutral'
                        }
                      >
                        {state === 'paid' ? 'Paid' : state === 'failed' ? 'Failed' : 'Processing'}
                      </Badge>
                    </span>
                  </div>
                  <PayoutRowDetails
                    state={state}
                    paidAt={p.paidAt}
                    transferRef={p.transferRef}
                    failureReason={p.failureReason}
                    sentTo={p.sentTo}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="rounded-2xl p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Landmark className="h-4 w-4 text-muted-foreground" />
          Your payout account
        </h3>
        {myAccountQuery.isLoading ? (
          <div role="status" aria-label="Loading" className="mt-3 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : !editingAccount && account?.verified ? (
          <div className="mt-3">
            <p className="text-sm text-foreground">
              {payoutAccountLabel({ ...account, bankName: account.bankName || 'Bank' })}
            </p>
            {account.accountName && (
              <p className="text-xs text-muted-foreground">{account.accountName}</p>
            )}
            <PayoutHoldNotice holdUntil={account.payoutHoldUntil} />
            <p className="mt-2 text-xs text-muted-foreground">{PAYOUT_CHANGE_COOLDOWN_HINT}</p>
            <Button variant="secondary" className="mt-3" onClick={() => setEditingAccount(true)}>
              Replace
            </Button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <BankAccountFields
              idPrefix="agent-payout"
              bankCode={bankCode}
              onBankCode={setBankCode}
              accountNumber={accountNumber}
              onAccountNumber={setAccountNumber}
              onLookup={setLookup}
            />
            {account?.verified && (
              <p className="text-xs text-muted-foreground">{PAYOUT_CHANGE_COOLDOWN_HINT}</p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => saveAccount.mutate()}
                disabled={!canSave}
                isLoading={saveAccount.isPending}
              >
                {saveAccountLabel(lookup, 'Save account')}
              </Button>
              {account?.verified && (
                <Button
                  variant="ghost"
                  onClick={() => setEditingAccount(false)}
                  disabled={saveAccount.isPending}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  if (!standalone) return cards;

  return (
    <section className={cn('mt-8', className)}>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Briefcase className="h-4 w-4 text-muted-foreground" />
        Agency commission share
      </h2>
      <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
        {summary?.agencyName
          ? `Your share of commissions you earned for ${summary.agencyName}, paid by the firm to your own account.`
          : 'Your share of agency commissions, paid by the firm to your own account.'}
      </p>
      {cards}
    </section>
  );
}
