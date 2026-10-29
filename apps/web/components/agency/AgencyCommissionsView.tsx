'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Coins, ReceiptText, Percent, Settings2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  NumberInput,
  Select,
  StatCard,
  PageLoadingState,
  PageErrorState,
  type BadgeVariant,
  useToast,
} from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { AgencyPayoutSection } from './AgencyPayoutSection';
import { AgencyAgentPayoutSection } from './AgencyAgentPayoutSection';
import { AgencyTeamSection } from './AgencyTeamSection';
import {
  agencyCommissionService,
  AGENCY_COMMISSION_TYPE_LABELS,
  type AgencyCommissionType,
} from '@/services/agencyCommissionService';

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  EARNED: 'info',
  PAID: 'success',
  VOID: 'neutral',
};

/**
 * The firm's commission book: what it has earned letting and renewing its
 * clients' tenancies, and the rate card those earnings come from.
 *
 * A commission is earned automatically the moment a managed tenancy is let or a
 * renewal is accepted — there is nothing to raise by hand here, so the screen is
 * a ledger plus the two rates that drive it. Payout settlement (turning earned
 * commission into money in the firm's account) is a later slice; until then the
 * rows read EARNED.
 */
export function AgencyCommissionsView() {
  const queryClient = useQueryClient();
  const queryKey = ['agency', 'commissions'];
  const [editing, setEditing] = useState(false);
  const [lettingPct, setLettingPct] = useState('');
  const [renewalPct, setRenewalPct] = useState('');
  const toast = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => unwrap(agencyCommissionService.summary()),
  });

  const configMutation = useMutation({
    mutationFn: (rates: { lettingPct: number; renewalPct: number }) =>
      unwrap(agencyCommissionService.setConfig(rates)),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, updated);
      setEditing(false);
      toast.success('Rate card updated.');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not update the rate card.'),
  });

  const teamQuery = useQuery({
    queryKey: ['agency', 'team'],
    queryFn: () => unwrap(agencyCommissionService.team()),
  });

  const refreshCommissionsAndTeam = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['agency', 'team'] });
  };

  const splitMutation = useMutation({
    mutationFn: ({ userId, splitPct }: { userId: string; splitPct: number }) =>
      unwrap(agencyCommissionService.setAgentSplit(userId, splitPct)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency', 'team'] });
      toast.success('Split updated.');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not update the split.'),
  });

  const assignMutation = useMutation({
    mutationFn: ({
      commissionId,
      agentUserId,
    }: {
      commissionId: string;
      agentUserId: string | null;
    }) => unwrap(agencyCommissionService.assignAgent(commissionId, agentUserId)),
    onSuccess: () => refreshCommissionsAndTeam(),
    onError: (e: Error) => toast.error(e.message || 'Could not credit the agent.'),
  });

  const agentOptions = [
    { value: '', label: 'Unassigned' },
    ...(teamQuery.data?.members ?? []).map((m) => ({
      value: m.userId,
      label: m.name ?? m.email ?? 'Agent',
    })),
  ];

  if (isLoading) return <PageLoadingState />;
  if (!data) return <PageErrorState title="Couldn’t load commissions" onRetry={() => refetch()} />;

  const startEditing = () => {
    setLettingPct(String(data.config.lettingPct));
    setRenewalPct(String(data.config.renewalPct));
    setEditing(true);
  };

  const save = () => {
    const letting = Number(lettingPct);
    const renewal = Number(renewalPct);
    if (!Number.isFinite(letting) || !Number.isFinite(renewal)) {
      toast.error('Enter both rates as whole percentages.');
      return;
    }
    if (letting < 0 || letting > 100 || renewal < 0 || renewal > 100) {
      toast.error('Rates must be between 0 and 100.');
      return;
    }
    configMutation.mutate({ lettingPct: letting, renewalPct: renewal });
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Link
        href="/agency/owners"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All clients
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Commissions</h1>
        <p className="mt-1 text-muted-foreground">
          What your firm has earned letting and renewing your clients’ tenancies.
        </p>
      </div>

      {/* Totals */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Coins}
          label="Earned"
          value={data.totals.earned}
          isCurrency
          accent="emerald"
        />
        <StatCard
          icon={ReceiptText}
          label="Paid out"
          value={data.totals.paid}
          isCurrency
          accent="blue"
        />
        <StatCard icon={Percent} label="Commissions" value={data.totals.count} accent="primary" />
      </div>

      {/* Rate card */}
      <Card className="mt-6 rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              Rate card
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Charged on the annual rent: once when a tenancy is let, then again when a renewal is
              accepted.
            </p>
          </div>
          {!editing && (
            <Button variant="secondary" onClick={startEditing}>
              Edit rates
            </Button>
          )}
        </div>

        {editing ? (
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <Field label="Letting %" className="w-32">
              <NumberInput
                value={lettingPct}
                onValueChange={setLettingPct}
                trailingIcon={<Percent className="h-4 w-4" />}
              />
            </Field>
            <Field label="Renewal %" className="w-32">
              <NumberInput
                value={renewalPct}
                onValueChange={setRenewalPct}
                trailingIcon={<Percent className="h-4 w-4" />}
              />
            </Field>
            <div className="flex gap-2">
              <Button onClick={save} isLoading={configMutation.isPending}>
                Save
              </Button>
              <Button
                variant="ghost"
                onClick={() => setEditing(false)}
                disabled={configMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-8">
            <div>
              <p className="text-2xl font-bold text-foreground">{data.config.lettingPct}%</p>
              <p className="text-xs text-muted-foreground">Letting</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.config.renewalPct}%</p>
              <p className="text-xs text-muted-foreground">Renewal</p>
            </div>
          </div>
        )}
      </Card>

      {/* Ledger */}
      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Ledger</h2>
        {data.commissions.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="No commissions earned yet."
            description="They appear here automatically when you let or renew a managed tenancy."
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Earned</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Client · Property</th>
                  <th className="px-4 py-2.5 text-right font-medium">Rent</th>
                  <th className="px-4 py-2.5 text-right font-medium">Rate</th>
                  <th className="px-4 py-2.5 text-right font-medium">Commission</th>
                  <th className="px-4 py-2.5 font-medium">Agent</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.commissions.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2.5 text-muted-foreground">{formatDate(c.earnedAt)}</td>
                    <td className="px-4 py-2.5">
                      {AGENCY_COMMISSION_TYPE_LABELS[c.type as AgencyCommissionType] ?? c.type}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="block text-foreground">{c.ownerName ?? 'Owner'}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {c.propertyTitle ?? 'Property'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      {formatCurrency(c.baseAmount)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{c.ratePct}%</td>
                    <td className="px-4 py-2.5 text-right font-medium text-foreground">
                      {formatCurrency(c.amount)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="w-40">
                        <Select
                          value={c.attributedUserId ?? ''}
                          onValueChange={(v) =>
                            assignMutation.mutate({ commissionId: c.id, agentUserId: v || null })
                          }
                          options={agentOptions}
                          ariaLabel="Credited agent"
                        />
                      </div>
                      {c.agentShareAmount != null && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          share {formatCurrency(c.agentShareAmount)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={STATUS_VARIANT[c.status] ?? 'neutral'}>
                        {c.status.toLowerCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AgencyTeamSection
        team={teamQuery.data}
        isLoading={teamQuery.isLoading}
        onSetSplit={(userId, splitPct) => splitMutation.mutate({ userId, splitPct })}
        savingUserId={splitMutation.isPending ? splitMutation.variables?.userId : null}
      />

      <AgencyPayoutSection onToast={(message, variant) => toast.show(message, variant)} />

      <AgencyAgentPayoutSection onToast={(message, variant) => toast.show(message, variant)} />
    </div>
  );
}
