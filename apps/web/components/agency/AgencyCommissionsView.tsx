'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Coins, ReceiptText, Percent, Settings2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Field,
  NumberInput,
  Select,
  StatCard,
  PageLoadingState,
  PageErrorState,
  type BadgeVariant,
  type Column,
  useToast,
  PageHeader,
} from '@sureground/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { AgencyPayoutSection } from './AgencyPayoutSection';
import { AgencyAgentPayoutSection } from './AgencyAgentPayoutSection';
import { AgencyTeamSection } from './AgencyTeamSection';
import {
  agencyCommissionService,
  AGENCY_COMMISSION_TYPE_LABELS,
  type AgencyCommission,
  type AgencyCommissionType,
} from '@/services/agencyCommissionService';

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  EARNED: 'info',
  PAID: 'success',
  VOID: 'neutral',
};

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

  const columns: Column<AgencyCommission>[] = [
    {
      key: 'earned',
      header: 'Earned',
      className: 'text-muted-foreground',
      render: (c) => formatDate(c.earnedAt),
    },
    {
      key: 'type',
      header: 'Type',
      render: (c) => AGENCY_COMMISSION_TYPE_LABELS[c.type as AgencyCommissionType] ?? c.type,
    },
    {
      key: 'client',
      header: 'Client · Property',
      render: (c) => (
        <>
          <span className="block text-foreground">{c.ownerName ?? 'Owner'}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {c.propertyTitle ?? 'Property'}
          </span>
        </>
      ),
    },
    {
      key: 'rent',
      header: 'Rent',
      numeric: true,
      className: 'text-muted-foreground',
      render: (c) => formatCurrency(c.baseAmount),
    },
    {
      key: 'rate',
      header: 'Rate',
      numeric: true,
      className: 'text-muted-foreground',
      render: (c) => `${c.ratePct}%`,
    },
    {
      key: 'commission',
      header: 'Commission',
      numeric: true,
      className: 'font-medium text-foreground',
      render: (c) => formatCurrency(c.amount),
    },
    {
      key: 'agent',
      header: 'Agent',
      render: (c) => (
        <>
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
        </>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <Badge variant={STATUS_VARIANT[c.status] ?? 'neutral'}>{c.status.toLowerCase()}</Badge>
      ),
    },
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
      <PageHeader
        breadcrumbs={[{ label: 'Clients', href: '/agency/owners' }, { label: 'Commissions' }]}
        title="Commissions"
        description="What your firm has earned letting and renewing your clients’ tenancies."
      />

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

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Ledger</h2>
        {data.commissions.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="No commissions earned yet."
            description="They appear here automatically when you let or renew a managed tenancy."
          />
        ) : (
          <DataTable
            caption="Commission ledger"
            density="compact"
            columns={columns}
            data={data.commissions}
            getRowKey={(c) => c.id}
          />
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
