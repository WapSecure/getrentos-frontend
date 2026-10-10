'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Banknote, Landmark, Loader2, Wallet } from 'lucide-react';
import {
  Badge,
  Button,
  Input,
  NumberInput,
  type BadgeVariant,
  type ToastVariant,
} from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { agencyCommissionService } from '@/services/agencyCommissionService';

const PAYOUT_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Processing', variant: 'info' },
  SUCCESS: { label: 'Paid', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'danger' },
};

/**
 * The firm's payout surface: where commission money goes, how much is ready, and
 * the history of batches. Withdrawing sweeps every earned commission into one
 * payout to the saved account.
 */
export function AgencyPayoutSection({
  onToast,
}: {
  onToast: (message: string, variant: ToastVariant) => void;
}) {
  const queryClient = useQueryClient();
  const [editingAccount, setEditingAccount] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const accountQuery = useQuery({
    queryKey: ['agency', 'payoutAccount'],
    queryFn: () => unwrap(agencyCommissionService.getPayoutAccount()),
  });
  const summaryQuery = useQuery({
    queryKey: ['agency', 'payoutSummary'],
    queryFn: () => unwrap(agencyCommissionService.payoutSummary()),
  });
  const payoutsQuery = useQuery({
    queryKey: ['agency', 'payouts'],
    queryFn: () => unwrap(agencyCommissionService.listPayouts()),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['agency', 'payoutAccount'] });
    queryClient.invalidateQueries({ queryKey: ['agency', 'payoutSummary'] });
    queryClient.invalidateQueries({ queryKey: ['agency', 'payouts'] });
    queryClient.invalidateQueries({ queryKey: ['agency', 'commissions'] });
  };

  const saveAccount = useMutation({
    mutationFn: () =>
      unwrap(agencyCommissionService.savePayoutAccount({ bankCode, accountNumber })),
    onSuccess: () => {
      setEditingAccount(false);
      setBankCode('');
      setAccountNumber('');
      refresh();
      onToast('Payout account saved.', 'success');
    },
    onError: (e: Error) => onToast(e.message || 'Could not save the account.', 'error'),
  });

  const withdraw = useMutation({
    mutationFn: () => unwrap(agencyCommissionService.requestPayout()),
    onSuccess: () => {
      refresh();
      onToast('Payout requested.', 'success');
    },
    onError: (e: Error) => onToast(e.message || 'Could not request a payout.', 'error'),
  });

  const account = accountQuery.data;
  const summary = summaryQuery.data;
  const canSave = bankCode.trim().length >= 3 && accountNumber.trim().length === 10;
  const canWithdraw =
    Boolean(summary?.accountSet) && (summary?.available ?? 0) > 0 && !withdraw.isPending;

  return (
    <div className="mt-8">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Wallet className="h-4 w-4 text-muted-foreground" />
        Payouts
      </h2>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Payout account */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Landmark className="h-4 w-4 text-muted-foreground" />
            Payout account
          </h3>
          {accountQuery.isLoading ? (
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

        {/* Available to withdraw */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Banknote className="h-4 w-4 text-muted-foreground" />
            Available to withdraw
          </h3>
          <p className="mt-3 text-2xl font-bold text-foreground">
            {summary ? formatCurrency(summary.available) : '—'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Earned commissions not yet paid out.</p>
          <Button className="mt-3" onClick={() => withdraw.mutate()} disabled={!canWithdraw}>
            {withdraw.isPending ? 'Requesting…' : 'Withdraw'}
          </Button>
          {!summary?.accountSet && (
            <p className="mt-2 text-xs text-muted-foreground">Add a payout account to withdraw.</p>
          )}
        </div>
      </div>

      {/* Payout history */}
      <div className="mt-4">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Payout history</h3>
        {payoutsQuery.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : !payoutsQuery.data || payoutsQuery.data.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No payouts yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Requested</th>
                  <th className="px-4 py-2.5 font-medium">Commissions</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {payoutsQuery.data.map((p) => {
                  const pill = PAYOUT_STATUS[p.status] ?? {
                    label: p.status,
                    variant: 'neutral' as BadgeVariant,
                  };
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{p.commissions}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-foreground">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={pill.variant}>{pill.label}</Badge>
                        {p.failureReason && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {p.failureReason}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
