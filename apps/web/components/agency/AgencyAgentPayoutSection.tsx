'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Landmark, Loader2, Users, Wallet } from 'lucide-react';
import { Badge, Button, Input, NumberInput, type ToastVariant } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { agencyCommissionService, type AgentPayRunResult } from '@/services/agencyCommissionService';

/**
 * On-platform per-agent payouts. Two audiences on one surface:
 *  - the firm reviews each agent's unpaid share + readiness, then pays them all;
 *  - an agent sets up their own account and sees what they've earned / been paid.
 * The viewer may be both (a firm owner is also an agent), so both panels show.
 */
export function AgencyAgentPayoutSection({
  onToast,
}: {
  onToast: (message: string, variant: ToastVariant) => void;
}) {
  const queryClient = useQueryClient();
  const [editingAccount, setEditingAccount] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [lastRun, setLastRun] = useState<AgentPayRunResult | null>(null);

  const payableQuery = useQuery({
    queryKey: ['agency', 'agentPayable'],
    queryFn: () => unwrap(agencyCommissionService.agentPayable()),
  });
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

  const refresh = () => {
    ['agentPayable', 'myAgentAccount', 'myAgentSummary', 'myAgentPayouts', 'commissions'].forEach((k) =>
      queryClient.invalidateQueries({ queryKey: ['agency', k] }),
    );
  };

  const run = useMutation({
    mutationFn: () => unwrap(agencyCommissionService.runAgentPayouts()),
    onSuccess: (result) => {
      setLastRun(result);
      refresh();
      onToast(
        `Paid ${result.paid.length} agent${result.paid.length === 1 ? '' : 's'}${
          result.skipped.length ? `, ${result.skipped.length} skipped` : ''
        }.`,
        'success',
      );
    },
    onError: (e: Error) => onToast(e.message || 'Could not run agent payouts.', 'error'),
  });

  const saveAccount = useMutation({
    mutationFn: () => unwrap(agencyCommissionService.saveMyAgentAccount({ bankCode, accountNumber })),
    onSuccess: () => {
      setEditingAccount(false);
      setBankCode('');
      setAccountNumber('');
      refresh();
      onToast('Your payout account is saved.', 'success');
    },
    onError: (e: Error) => onToast(e.message || 'Could not save your account.', 'error'),
  });

  const payable = payableQuery.data ?? [];
  const totalReady = payable.filter((p) => p.ready).reduce((sum, p) => sum + p.payable, 0);
  const account = myAccountQuery.data;
  const summary = mySummaryQuery.data;
  const requiredTier = summary?.withdrawTierRequired ?? 3;
  const myPayouts = (myPayoutsQuery.data ?? []).slice(0, 5);
  const canSave = bankCode.trim().length >= 3 && accountNumber.trim().length === 10;

  return (
    <div className="mt-8">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Users className="h-4 w-4 text-muted-foreground" />
        Agent payouts
      </h2>

      {/* Firm: pay the agents */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Pay your agents</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Each agent is paid their attributed share to their own account. Your net is paid
              separately on the firm payout.
            </p>
          </div>
          <Button
            onClick={() => run.mutate()}
            disabled={run.isPending || totalReady <= 0}
          >
            {run.isPending ? 'Paying…' : `Pay agents (${formatCurrency(totalReady)})`}
          </Button>
        </div>

        {payableQuery.isLoading ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : payable.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No agent has an unpaid share right now.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Agent</th>
                  <th className="px-4 py-2.5 text-right font-medium">Unpaid share</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {payable.map((p) => (
                  <tr key={p.agentUserId}>
                    <td className="px-4 py-2.5 text-foreground">{p.agentName}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-foreground">
                      {formatCurrency(p.payable)}
                    </td>
                    <td className="px-4 py-2.5">
                      {p.ready ? (
                        <Badge variant="success">Ready</Badge>
                      ) : !p.accountSet ? (
                        <Badge variant="neutral">No payout account</Badge>
                      ) : (
                        <Badge variant="warning">Needs ID tier {requiredTier}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lastRun && lastRun.skipped.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Skipped: {lastRun.skipped.map((s) => `${s.agentName} (${s.reason})`).join('; ')}
          </p>
        )}
      </div>

      {/* Agent: your own account + what you've earned */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
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
                        p.status === 'SUCCESS' ? 'success' : p.status === 'FAILED' ? 'danger' : 'neutral'
                      }
                    >
                      {p.status === 'SUCCESS' ? 'Paid' : p.status === 'FAILED' ? 'Failed' : 'Processing'}
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
                <Button onClick={() => saveAccount.mutate()} disabled={!canSave || saveAccount.isPending}>
                  Save account
                </Button>
                {account?.verified && (
                  <Button variant="ghost" onClick={() => setEditingAccount(false)} disabled={saveAccount.isPending}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
