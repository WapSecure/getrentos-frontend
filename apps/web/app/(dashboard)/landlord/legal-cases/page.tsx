'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Scale } from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  PageErrorState,
  PageLoadingState,
  Select,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';

import { LegalCaseCard } from '@/components/landlord/legal-cases/LegalCaseCard';
import { LegalCaseDetailModal } from '@/components/landlord/legal-cases/LegalCaseDetailModal';
import { OpenLegalCaseModal } from '@/components/landlord/legal-cases/OpenLegalCaseModal';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import type {
  EnforcementMethod,
  HearingOutcome,
  LegalCase,
  LegalCaseKind,
  LegalCaseOutcome,
  LegalCaseStatus,
} from '@/types/legal-case';

/**
 * Legal cases: recovery, injunction, title dispute, and eviction.
 *
 * This replaces the evictions page. An eviction is a kind of case now, so the
 * same list shows every matter a firm is running, and the notice steps that used
 * to be buttons here live on the tenancy's notice ladder instead — a case points
 * at its tenancy rather than carrying its own copy of when a notice ran.
 */

const PAGE_SIZE = 10;

const STATUS_FILTERS: { value: 'all' | LegalCaseStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'FILED', label: 'Filed' },
  { value: 'DECIDED', label: 'Decided' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

const KIND_FILTERS: { value: 'all' | LegalCaseKind; label: string }[] = [
  { value: 'all', label: 'Every kind' },
  { value: 'EVICTION', label: 'Eviction' },
  { value: 'RENT_RECOVERY', label: 'Rent recovery' },
  { value: 'INJUNCTION', label: 'Injunction' },
  { value: 'TITLE_DISPUTE', label: 'Title dispute' },
  { value: 'DEBT_RECOVERY', label: 'Debt recovery' },
  { value: 'OTHER', label: 'Other' },
];

export default function LandlordLegalCasesPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'all' | LegalCaseStatus>('all');
  const [kind, setKind] = useState<'all' | LegalCaseKind>('all');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [opening, setOpening] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<LegalCase | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...landlordKeys.legalCases, { status, kind, limit }],
    queryFn: () =>
      unwrap(
        landlordService.listLegalCases({
          ...(status === 'all' ? {} : { status }),
          ...(kind === 'all' ? {} : { kind }),
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

  // The refusals are the useful part of this feature — filing before the notices
  // have run out, enforcing before a decision — so the server's sentence is shown
  // verbatim rather than replaced with something generic.
  const onError = (error: unknown) =>
    setToast({
      message: error instanceof Error ? error.message : 'Something went wrong.',
      variant: 'error',
    });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: landlordKeys.legalCases });
    if (selectedId) queryClient.invalidateQueries({ queryKey: landlordKeys.legalCase(selectedId) });
  };

  const onSuccess = (message: string) => () => {
    setToast({ message, variant: 'success' });
    refresh();
  };

  const openCase = useMutation({
    mutationFn: (input: Parameters<typeof landlordService.openLegalCase>[0]) =>
      unwrap(landlordService.openLegalCase(input)),
    onSuccess: () => {
      setOpening(false);
      onSuccess(
        'Case opened. Nothing has been filed yet — record the court when proceedings are issued.'
      )();
    },
    onError,
  });

  const fileCase = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { court: string; suitNumber: string } }) =>
      unwrap(landlordService.fileLegalCase(id, input)),
    onSuccess: onSuccess('Recorded as filed.'),
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
    onSuccess: onSuccess('Hearing scheduled.'),
    onError,
  });

  const recordHearing = useMutation({
    mutationFn: ({
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
      };
    }) => unwrap(landlordService.recordHearing(id, input.hearingId, input)),
    onSuccess: onSuccess('Sitting recorded.'),
    onError,
  });

  const decideCase = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { outcome: LegalCaseOutcome; notes?: string; decidedAt?: string };
    }) => unwrap(landlordService.decideLegalCase(id, input)),
    onSuccess: onSuccess('Decision recorded.'),
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
    onSuccess: onSuccess('Enforcement recorded.'),
    onError,
  });

  const closeCase = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      unwrap(landlordService.closeLegalCase(id, notes)),
    onSuccess: onSuccess('Case closed.'),
    onError,
  });

  const withdrawCase = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      unwrap(landlordService.withdrawLegalCase(id, reason)),
    onSuccess: () => {
      setWithdrawing(null);
      setWithdrawReason('');
      onSuccess('Case withdrawn.')();
    },
    onError,
  });

  const isSubmitting =
    fileCase.isPending ||
    scheduleHearing.isPending ||
    recordHearing.isPending ||
    decideCase.isPending ||
    enforceCase.isPending ||
    closeCase.isPending;

  const cases = data?.cases ?? [];

  if (isLoading) return <PageLoadingState />;
  if (isError) return <PageErrorState onRetry={() => refetch()} />;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={ROUTES.LANDLORD_DASHBOARD}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to dashboard
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-gray-900">Legal cases</h1>
          <p className="mt-1 text-sm text-gray-600">
            Recovery, injunction, title dispute and eviction. A possession claim cannot be filed
            until the tenancy&rsquo;s notices have run out, and that is checked rather than assumed.
          </p>
        </div>
        <Button onClick={() => setOpening(true)}>Open a case</Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[10rem]">
          <Select
            ariaLabel="Filter by status"
            value={status}
            onValueChange={(value) => setStatus(value as 'all' | LegalCaseStatus)}
            options={STATUS_FILTERS}
          />
        </div>
        <div className="min-w-[12rem]">
          <Select
            ariaLabel="Filter by kind"
            value={kind}
            onValueChange={(value) => setKind(value as 'all' | LegalCaseKind)}
            options={KIND_FILTERS}
          />
        </div>
      </div>

      {cases.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No cases here"
          description={
            status === 'all' && kind === 'all'
              ? 'Nothing is being pursued yet. Open a case to start tracking a matter.'
              : 'No cases match these filters. Try a different status or kind.'
          }
        />
      ) : (
        <>
          {/*
            The API returns a capped page plus a `truncated` flag rather than
            numbered pages, so the control grows the window instead of pretending
            to know a page count it was never given.
          */}
          <div className="space-y-3">
            {cases.map((legalCase) => (
              <LegalCaseCard
                key={legalCase.id}
                legalCase={legalCase}
                onOpen={() => setSelectedId(legalCase.id)}
              />
            ))}
          </div>

          {data?.truncated && (
            <div className="flex flex-col items-center gap-2">
              <Badge variant="neutral">Showing the {data.limit} most recent</Badge>
              <Button variant="ghost" onClick={() => setLimit(limit + PAGE_SIZE)}>
                Show more
              </Button>
            </div>
          )}
        </>
      )}

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
        <LegalCaseDetailModal
          legalCase={selected}
          onOpenChange={(open) => !open && setSelectedId(null)}
          isSubmitting={isSubmitting}
          onFile={(input) => fileCase.mutate({ id: selected.id, input })}
          onScheduleHearing={(input) => scheduleHearing.mutate({ id: selected.id, input })}
          onRecordHearing={(input) => recordHearing.mutate({ id: selected.id, input })}
          onDecide={(input) => decideCase.mutate({ id: selected.id, input })}
          onEnforce={(input) => enforceCase.mutate({ id: selected.id, input })}
          onClose={(notes) => closeCase.mutate({ id: selected.id, notes })}
          onWithdraw={() => setWithdrawing(selected)}
        />
      )}

      <ConfirmDialog
        open={withdrawing !== null}
        onOpenChange={(open) => !open && setWithdrawing(null)}
        title="Withdraw this case?"
        description="Withdrawing is not the same as closing. One was abandoned, the other finished, and the record should say which — a withdrawn case stops being evidence of anything."
        promptLabel="Why is it being withdrawn?"
        promptPlaceholder="Settled directly with the tenant before the hearing."
        promptValue={withdrawReason}
        onPromptChange={setWithdrawReason}
        promptRequired
        promptMinLength={10}
        confirmLabel="Withdraw case"
        isLoading={withdrawCase.isPending}
        onConfirm={() =>
          withdrawing && withdrawCase.mutate({ id: withdrawing.id, reason: withdrawReason })
        }
      />

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
