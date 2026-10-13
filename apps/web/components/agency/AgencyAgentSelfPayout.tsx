'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Landmark, Loader2, Wallet } from 'lucide-react';
import { Badge, Button, Input, NumberInput, Toast, type ToastVariant } from '@getrentos/ui';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { agencyCommissionService } from '@/services/agencyCommissionService';
import {
  PAYOUT_CHANGE_COOLDOWN_HINT,
  PayoutHoldNotice,
} from '@/components/shared/payouts/PayoutHoldNotice';

/**
 * An agency agent's own side of per-agent payouts: what they've earned from the
 * firm's commissions, their recent payouts, and the bank account it goes to.
 *
 * Rendered inside the agency portal, and also in the realtor and agent portals,
 * because many of a firm's agents are plain realtor/agent accounts that never
 * see /agency. There (`standalone`) it renders nothing unless the viewer belongs
 * to an agency, and brings its own heading and toast.
 */
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
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const notify =
    onToast ?? ((message: string, variant: ToastVariant) => setToast({ message, variant }));

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
      unwrap(agencyCommissionService.saveMyAgentAccount({ bankCode, accountNumber })),
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
  const canSave = bankCode.trim().length >= 3 && accountNumber.trim().length === 10;

  // Outside the agency portal, only agency members (or agents still owed a share) see this.
  if (standalone && !(summary?.agencyName || (summary?.earned ?? 0) > 0)) return null;

  const cards = (
    <div className={cn('grid gap-4 lg:grid-cols-2', !standalone && className)}>
      <div className="rounded-2xl border border-border bg-card p-5">
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
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">—</p>
        )}
        {summary && !summary.canReceive && (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
            Verify your identity to trust tier {summary.withdrawTierRequired} to receive payouts.
          </p>
        )}
        {myPayouts.length > 0 && (
          <ul className="mt-4 divide-y divide-border/60 border-t border-border/60 text-sm">
            {myPayouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-muted-foreground">{formatDate(p.paidAt ?? p.createdAt)}</span>
                <span className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{formatCurrency(p.amount)}</span>
                  <Badge
                    variant={
                      p.status === 'SUCCESS'
                        ? 'success'
                        : p.status === 'FAILED'
                          ? 'danger'
                          : 'neutral'
                    }
                  >
                    {p.status === 'SUCCESS'
                      ? 'Paid'
                      : p.status === 'FAILED'
                        ? 'Failed'
                        : 'Processing'}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Landmark className="h-4 w-4 text-muted-foreground" />
          Your payout account
        </h3>
        {myAccountQuery.isLoading ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : !editingAccount && account?.verified ? (
          <div className="mt-3">
            <p className="text-sm text-foreground">
              {account.bankName || 'Bank'} · {account.accountNumber}
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
            <label className="block">
              <span className="text-xs text-muted-foreground">Bank code</span>
              <Input
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="e.g. 058 for GTBank"
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Account number</span>
              <NumberInput
                value={accountNumber}
                onValueChange={(v) => setAccountNumber(v.slice(0, 10))}
                placeholder="10-digit NUBAN"
                className="mt-1"
              />
            </label>
            <div className="flex gap-2">
              <Button
                onClick={() => saveAccount.mutate()}
                disabled={!canSave || saveAccount.isPending}
              >
                Save account
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
      </div>
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
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </section>
  );
}
