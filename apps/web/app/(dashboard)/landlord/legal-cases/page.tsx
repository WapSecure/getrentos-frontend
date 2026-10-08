'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Scale } from 'lucide-react';
import { Button, DataTable, type Column } from '@getrentos/ui';

import { LegalCaseDetail } from '@/components/landlord/legal-cases/LegalCaseDetail';
import { LegalCaseStage } from '@/components/landlord/legal-cases/LegalCaseStage';
import { OpenLegalCaseModal } from '@/components/landlord/legal-cases/OpenLegalCaseModal';
import { ListState } from '@/components/shared/ListState';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { formatDate } from '@/lib/format';
import type {
  EnforcementMethod,
  HearingOutcome,
  LegalCase,
  LegalCaseOutcome,
  LegalCaseStatus,
} from '@/types/legal-case';

/**
 * Legal cases: recovery, injunction, title dispute and eviction.
 *
 * Built on the same shapes as the rest of the app — a filter bar, a table,
 * `ListState` for the three async states — because a landlord moving between
 * Applications and Legal cases should not have to learn a second layout.
 *
 * The table is arranged around, in order:
 *
 * 1. **Stage**, as a position rather than a word, so the trajectory of twelve
 *    cases is visible without reading twelve statuses.
 * 2. **What is next on it** — a hearing date, or the fact that nothing is
 *    scheduled, which is the state that loses cases by default.
 * 3. **What is blocked** — a possession claim that cannot be filed is the thing
 *    most worth seeing before somebody attempts it.
 */

const STAGES: { value: 'all' | LegalCaseStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'FILED', label: 'Filed' },
  { value: 'DECIDED', label: 'Decided' },
  { value: 'CLOSED', label: 'Closed' },
];

type Focus = 'attention' | 'all';

export default function LandlordLegalCasesPage() {
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<'all' | LegalCaseStatus>('all');
  const [focus, setFocus] = useState<Focus>('attention');
  const [limit, setLimit] = useState(50);
  const [opening, setOpening] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [...landlordKeys.legalCases, { stage, limit }],
    queryFn: () =>
      unwrap(
        landlordService.listLegalCases({
          ...(stage === 'all' ? {} : { status: stage }),
          limit,
        })
      ),
  });

  const { data: leases, isLoading: isLoadingLeases } = useQuery({
    queryKey: [...landlordKeys.leases(), { page: 1, pageSize: 50, status: 'signed' }],
    queryFn: () => unwrap(landlordService.listLeases({ status: 'signed', page: 1, pageSize: 50 })),
  });

  const { data: selected } = useQuery({
    queryKey: landlordKeys.legalCase(selectedId ?? ''),
    queryFn: () => unwrap(landlordService.getLegalCase(selectedId as string)),
    enabled: selectedId !== null,
  });

  const onError = (error: unknown) =>
    setToast(error instanceof Error ? error.message : 'Something went wrong.');

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: landlordKeys.legalCases });
    if (selectedId) queryClient.invalidateQueries({ queryKey: landlordKeys.legalCase(selectedId) });
  };
  const done = (message: string) => () => {
    setToast(message);
    refresh();
  };

  const openCase = useMutation({
    mutationFn: (input: Parameters<typeof landlordService.openLegalCase>[0]) =>
      unwrap(landlordService.openLegalCase(input)),
    onSuccess: () => {
      setOpening(false);
      done('Case opened.')();
    },
    onError,
  });
  const fileCase = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { court: string; suitNumber: string } }) =>
      unwrap(landlordService.fileLegalCase(id, input)),
    onSuccess: done('Recorded as filed.'),
    onError,
  });
  const scheduleHearing = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { scheduledFor: string; purpose?: string };
    }) => unwrap(landlordService.scheduleHearing(id, input)),
    onSuccess: done('Hearing scheduled.'),
    onError,
  });
  const recordHearing = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: {
        hearingId: string;
        heldAt: string;
        outcome: HearingOutcome;
        notes?: string;
        adjournNextFor?: string;
        decision?: { outcome: LegalCaseOutcome; notes?: string };
      };
    }) => {
      const { decision, ...hearing } = input;
      // A sitting that decided the matter also decides the case, so both are
      // written from the one action. Recording the sitting alone would leave the
      // case parked in FILED with a decision nobody entered.
      await unwrap(landlordService.recordHearing(id, hearing.hearingId, hearing));
      if (decision) {
        await unwrap(
          landlordService.decideLegalCase(id, {
            outcome: decision.outcome,
            ...(decision.notes ? { notes: decision.notes } : {}),
            decidedAt: hearing.heldAt,
          })
        );
      }
    },
    onSuccess: done('Sitting recorded.'),
    onError,
  });
  const enforceCase = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { method: EnforcementMethod; notes?: string };
    }) => unwrap(landlordService.enforceLegalCase(id, input)),
    onSuccess: done('Enforcement recorded.'),
    onError,
  });
  const recordAdvocate = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { name: string; firm?: string; contact?: string; feeAgreement?: string };
    }) => unwrap(landlordService.recordLegalCaseAdvocate(id, input)),
    onSuccess: done('Advocate recorded.'),
    onError,
  });
  const recordCost = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { amount: number; note: string; incurredAt?: string };
    }) => unwrap(landlordService.recordLegalCaseCost(id, input)),
    onSuccess: done('Cost recorded.'),
    onError,
  });
  const closeCase = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      unwrap(landlordService.closeLegalCase(id, notes)),
    onSuccess: done('Case closed.'),
    onError,
  });
  const withdrawCase = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      unwrap(landlordService.withdrawLegalCase(id, reason)),
    onSuccess: done('Case withdrawn.'),
    onError,
  });

  const isSubmitting =
    fileCase.isPending ||
    scheduleHearing.isPending ||
    recordHearing.isPending ||
    enforceCase.isPending ||
    recordAdvocate.isPending ||
    recordCost.isPending ||
    closeCase.isPending;

  const cases = data?.cases ?? [];

  /**
   * "Needs attention" is derived from the same fields the server returns, not a
   * stored flag, so the filter cannot disagree with what the detail view says
   * about the row it just opened.
   */
  const needsAttention = (row: LegalCase) =>
    row.outstanding.some((item) => item.action === 'Not ready to file') ||
    (row.status === 'FILED' && row.nextHearingAt === null) ||
    row.status === 'DECIDED';

  const visible = focus === 'attention' ? cases.filter(needsAttention) : cases;
  const attentionCount = cases.filter(needsAttention).length;

  const counts = STAGES.reduce<Record<string, number>>((acc, option) => {
    acc[option.value] =
      option.value === 'all'
        ? cases.length
        : cases.filter((row) => row.status === option.value).length;
    return acc;
  }, {});

  const columns: Column<LegalCase>[] = [
    {
      key: 'matter',
      header: 'Matter',
      className: 'max-w-[22rem]',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{row.kindLabel}</p>
          <p className="truncate text-xs text-muted-foreground">{row.description}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Property',
      className: 'max-w-[16rem]',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">{row.property.address}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[row.unitName, row.tenantName].filter(Boolean).join(' · ') || row.property.city}
          </p>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      render: (row) => <LegalCaseStage status={row.status} />,
    },
    {
      key: 'next',
      header: 'Next',
      render: (row) => {
        if (row.outstanding.some((item) => item.action === 'Not ready to file')) {
          return <span className="text-xs font-medium text-warning">Cannot file yet</span>;
        }
        if (row.nextHearingAt) {
          return <span className="text-sm text-foreground">{formatDate(row.nextHearingAt)}</span>;
        }
        if (row.status === 'FILED') {
          return <span className="text-xs font-medium text-warning">Nothing scheduled</span>;
        }
        if (row.status === 'DECIDED') {
          return <span className="text-xs font-medium text-warning">Awaiting enforcement</span>;
        }
        if (row.status === 'OPEN') {
          return <span className="text-xs text-muted-foreground">Not filed</span>;
        }
        return <span className="text-xs text-muted-foreground">—</span>;
      },
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Legal cases</h1>
          <p className="mt-1 text-muted-foreground">
            {attentionCount > 0
              ? `${attentionCount} of ${cases.length} need${attentionCount === 1 ? 's' : ''} attention`
              : `${cases.length} case${cases.length === 1 ? '' : 's'}, none needing attention`}
          </p>
        </div>
        <Button onClick={() => setOpening(true)}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden />
          Open a case
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex w-fit gap-1 overflow-x-auto rounded-lg bg-secondary p-1">
          {STAGES.map((option) => (
            <button
              key={option.value}
              onClick={() => setStage(option.value)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                stage === option.value
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {option.label}
              {counts[option.value] > 0 && (
                <span className="ml-1.5 text-muted-foreground/80">{counts[option.value]}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex w-fit gap-1 rounded-lg bg-secondary p-1">
          <button
            onClick={() => setFocus('attention')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              focus === 'attention'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Needs attention
            {attentionCount > 0 && (
              <span className="ml-1.5 text-muted-foreground/80">{attentionCount}</span>
            )}
          </button>
          <button
            onClick={() => setFocus('all')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              focus === 'all'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
        </div>
      </div>

      <ListState
        items={visible}
        query={{ isPending, isError, refetch }}
        errorTitle="We couldn't load your cases"
        skeletonClassName="h-16"
        empty={
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Scale className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {focus === 'attention'
                ? 'Nothing needs attention. Every case has a next step.'
                : 'No cases here yet.'}
            </p>
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={visible}
          getRowKey={(row) => row.id}
          onRowClick={(row) => setSelectedId(row.id)}
          footer={
            data?.truncated ? (
              <div className="flex justify-center border-t border-border p-3">
                <Button variant="ghost" onClick={() => setLimit(limit + 50)}>
                  Show more
                </Button>
              </div>
            ) : undefined
          }
        />
      </ListState>

      {opening && (
        <OpenLegalCaseModal
          open
          onOpenChange={setOpening}
          leases={leases?.items ?? []}
          isLoadingLeases={isLoadingLeases}
          isSubmitting={openCase.isPending}
          onSubmit={(input) => openCase.mutate(input)}
        />
      )}

      {selected && (
        <LegalCaseDetail
          legalCase={selected}
          onOpenChange={(open) => !open && setSelectedId(null)}
          isSubmitting={isSubmitting}
          onFile={(input) => fileCase.mutate({ id: selected.id, input })}
          onScheduleHearing={(input) => scheduleHearing.mutate({ id: selected.id, input })}
          onRecordHearing={(input) => recordHearing.mutate({ id: selected.id, input })}
          onEnforce={(input) => enforceCase.mutate({ id: selected.id, input })}
          onRecordAdvocate={(input) => recordAdvocate.mutate({ id: selected.id, input })}
          onRecordCost={(input) => recordCost.mutate({ id: selected.id, input })}
          onClose={(notes) => closeCase.mutate({ id: selected.id, notes })}
          onWithdraw={() =>
            withdrawCase.mutate({
              id: selected.id,
              reason: 'Withdrawn by the owner after the tenant settled directly.',
            })
          }
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground px-4 py-2 text-sm text-background shadow-lg"
        >
          {toast}
        </div>
      )}
    </>
  );
}
