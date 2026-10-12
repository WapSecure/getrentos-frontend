'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Users } from 'lucide-react';
import { Badge, Button, type ToastVariant } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import {
  agencyCommissionService,
  type AgentPayRunResult,
} from '@/services/agencyCommissionService';
import { AgencyAgentSelfPayout } from './AgencyAgentSelfPayout';

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
  const [lastRun, setLastRun] = useState<AgentPayRunResult | null>(null);

  const payableQuery = useQuery({
    queryKey: ['agency', 'agentPayable'],
    queryFn: () => unwrap(agencyCommissionService.agentPayable()),
  });
  const mySummaryQuery = useQuery({
    queryKey: ['agency', 'myAgentSummary'],
    queryFn: () => unwrap(agencyCommissionService.myAgentSummary()),
  });

  const refresh = () => {
    ['agentPayable', 'myAgentAccount', 'myAgentSummary', 'myAgentPayouts', 'commissions'].forEach(
      (k) => queryClient.invalidateQueries({ queryKey: ['agency', k] })
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
        'success'
      );
    },
    onError: (e: Error) => onToast(e.message || 'Could not run agent payouts.', 'error'),
  });

  const payable = payableQuery.data ?? [];
  const totalReady = payable.filter((p) => p.ready).reduce((sum, p) => sum + p.payable, 0);
  const summary = mySummaryQuery.data;
  const requiredTier = summary?.withdrawTierRequired ?? 3;

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
          <Button onClick={() => run.mutate()} disabled={run.isPending || totalReady <= 0}>
            {run.isPending ? 'Paying…' : `Pay agents (${formatCurrency(totalReady)})`}
          </Button>
        </div>

        {payableQuery.isLoading ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : payable.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No agent has an unpaid share right now.
          </p>
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

      <AgencyAgentSelfPayout onToast={onToast} className="mt-4" />
    </div>
  );
}
