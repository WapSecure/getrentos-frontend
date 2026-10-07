'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageErrorState,
  PageLoadingState,
  Select,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';

import { RaiseNoticeDialog, ServeNoticeDialog } from '@/components/landlord/notices/NoticeDialogs';
import {
  NoticeLadderTimeline,
  NoticeStateBadge,
} from '@/components/landlord/notices/NoticeLadderTimeline';
import { NoticePeriodRegister } from '@/components/landlord/notices/NoticePeriodRegister';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { formatDate } from '@/lib/format';
import type { NoticeKind, NoticeServiceMethod, TenancyNotice } from '@/types/tenancy-notice';

/**
 * Notices: the ladder, and the register that decides whether it can be walked.
 *
 * The lease selector is the spine of the screen. A notice only means something
 * against a tenancy — what has already been served, and what that makes available
 * next — so there is no useful global list to show first. The firm-wide list sits
 * underneath as a cross-check rather than as the entry point.
 */

const PAGE_SIZE = 25;

export default function LandlordNoticesPage() {
  const queryClient = useQueryClient();
  const [leaseId, setLeaseId] = useState<string>('');
  const [raising, setRaising] = useState(false);
  const [serving, setServing] = useState<TenancyNotice | null>(null);
  const [withdrawing, setWithdrawing] = useState<TenancyNotice | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const {
    data: leases,
    isLoading: isLoadingLeases,
    isError: leasesFailed,
    refetch: refetchLeases,
  } = useQuery({
    queryKey: [...landlordKeys.leases(), { page: 1, pageSize: PAGE_SIZE, status: 'signed' }],
    queryFn: () =>
      unwrap(landlordService.listLeases({ status: 'signed', page: 1, pageSize: PAGE_SIZE })),
  });

  const { data: periods, isLoading: isLoadingPeriods } = useQuery({
    queryKey: landlordKeys.noticePeriods,
    queryFn: () => unwrap(landlordService.getNoticePeriods()),
  });

  const {
    data: ladder,
    isLoading: isLoadingLadder,
    isError: ladderFailed,
    error: ladderError,
    refetch: refetchLadder,
  } = useQuery({
    queryKey: landlordKeys.leaseLadder(leaseId),
    queryFn: () => unwrap(landlordService.getLeaseLadder(leaseId)),
    enabled: leaseId.length > 0,
  });

  const { data: allNotices } = useQuery({
    queryKey: [...landlordKeys.notices, { limit: 50 }],
    queryFn: () => unwrap(landlordService.listNotices({ limit: 50 })),
  });

  const onError = (error: unknown) =>
    setToast({
      // The refusals are the useful part of this feature — a period nobody has
      // recorded, a rung served too early — so the server's sentence is surfaced
      // verbatim rather than replaced with something generic.
      message: error instanceof Error ? error.message : 'Something went wrong.',
      variant: 'error',
    });

  const refreshLadder = () => {
    queryClient.invalidateQueries({ queryKey: landlordKeys.leaseLadder(leaseId) });
    queryClient.invalidateQueries({ queryKey: landlordKeys.notices });
    queryClient.invalidateQueries({ queryKey: landlordKeys.noticePeriods });
  };

  const raiseNotice = useMutation({
    mutationFn: (input: Parameters<typeof landlordService.raiseNotice>[0]) =>
      unwrap(landlordService.raiseNotice(input)),
    onSuccess: () => {
      setRaising(false);
      setToast({
        message: 'Notice raised. It is a draft until service is recorded against it.',
        variant: 'success',
      });
      refreshLadder();
    },
    onError,
  });

  const serveNotice = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { serviceDate: string; serviceMethod: NoticeServiceMethod; evidenceNote?: string };
    }) => unwrap(landlordService.serveNotice(id, input)),
    onSuccess: () => {
      setServing(null);
      setToast({
        message: 'Service recorded. The period now runs from the date you gave.',
        variant: 'success',
      });
      refreshLadder();
    },
    onError,
  });

  const withdrawNotice = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      unwrap(landlordService.withdrawNotice(id, reason)),
    onSuccess: () => {
      setWithdrawing(null);
      setToast({ message: 'Notice withdrawn.', variant: 'success' });
      refreshLadder();
    },
    onError,
  });

  const setPeriod = useMutation({
    mutationFn: (input: { jurisdiction: string; kind: NoticeKind; days: number; basis: string }) =>
      unwrap(landlordService.setNoticePeriod(input)),
    onSuccess: () => {
      setToast({
        message:
          'Period recorded. Notices that run for a period can now be served in that jurisdiction.',
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: landlordKeys.noticePeriods });
      if (leaseId) queryClient.invalidateQueries({ queryKey: landlordKeys.leaseLadder(leaseId) });
    },
    onError,
  });

  const clearPeriod = useMutation({
    mutationFn: (input: { jurisdiction: string; kind: NoticeKind }) =>
      unwrap(landlordService.clearNoticePeriod(input)),
    onSuccess: () => {
      setToast({
        message: 'Your period was removed. Notices will use whatever is shipped instead.',
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: landlordKeys.noticePeriods });
    },
    onError,
  });

  const leaseOptions = (leases?.items ?? []).map((lease) => ({
    value: lease.id,
    label: `${lease.propertyName || 'Tenancy'}${lease.tenantName ? ` — ${lease.tenantName}` : ''}`,
  }));

  if (isLoadingPeriods) return <PageLoadingState />;
  if (leasesFailed) return <PageErrorState onRetry={() => refetchLeases()} />;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div>
        <Link
          href="/landlord/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-gray-900">Notices</h1>
        <p className="mt-1 text-sm text-gray-600">
          The escalation ladder, and the period register it depends on. Served one step at a time,
          because a claim that skips a step has no evidence for it.
        </p>
      </div>

      {/* The register comes first: it is what decides whether the ladder can be walked at all. */}
      {periods && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900">
            <ShieldCheck className="h-4 w-4 text-gray-400" aria-hidden />
            Notice periods
          </h2>
          <NoticePeriodRegister
            settings={periods}
            isSubmitting={setPeriod.isPending || clearPeriod.isPending}
            onSubmit={(input) => setPeriod.mutate(input)}
            onClear={(input) => clearPeriod.mutate(input)}
          />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium text-gray-900">A tenancy</h2>

        <Card className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[16rem] flex-1">
              <Select
                ariaLabel="Tenancy"
                value={leaseId}
                onValueChange={setLeaseId}
                options={leaseOptions}
                placeholder={isLoadingLeases ? 'Loading tenancies…' : 'Choose a tenancy'}
              />
            </div>
            {ladder?.next && !ladder.nextBlockedReason && (
              <Button onClick={() => setRaising(true)}>
                Raise {ladder.next.kind.replace(/_/g, ' ').toLowerCase()}
              </Button>
            )}
          </div>
        </Card>

        <div className="mt-4">
          {!leaseId ? (
            <EmptyState
              icon={ShieldCheck}
              title="Choose a tenancy"
              description="A notice only means something against a tenancy — what has already been served, and what that makes available next."
            />
          ) : isLoadingLadder ? (
            <PageLoadingState />
          ) : ladderFailed ? (
            <PageErrorState
              onRetry={() => refetchLadder()}
              description={ladderError instanceof Error ? ladderError.message : undefined}
            />
          ) : ladder ? (
            <NoticeLadderTimeline
              ladder={ladder}
              actions={(notice) =>
                notice.state === 'DRAFT' ? (
                  <div className="flex gap-2">
                    <Button onClick={() => setServing(notice)}>Record service</Button>
                    <Button variant="ghost" onClick={() => setWithdrawing(notice)}>
                      Withdraw
                    </Button>
                  </div>
                ) : notice.state === 'SERVED' ? (
                  <Button variant="ghost" onClick={() => setWithdrawing(notice)}>
                    Withdraw
                  </Button>
                ) : null
              }
            />
          ) : null}
        </div>
      </section>

      {(allNotices?.notices.length ?? 0) > 0 && (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-gray-900">Everything raised</h2>
            {allNotices?.truncated && (
              <Badge variant="neutral">
                Showing the most recent {allNotices.limit} — there are more
              </Badge>
            )}
          </div>

          <Card className="divide-y divide-gray-100">
            {allNotices?.notices.map((notice) => (
              <div
                key={notice.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-900">{notice.kindLabel}</span>
                    <NoticeStateBadge state={notice.state} />
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {notice.property?.address ?? 'Tenancy'} · raised {formatDate(notice.createdAt)}
                    {notice.expiresAt && ` · runs to ${formatDate(notice.expiresAt)}`}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setLeaseId(notice.leaseId)}>
                  Open tenancy
                </Button>
              </div>
            ))}
          </Card>
        </section>
      )}

      {/*
        Both dialogs are mounted only while open, rather than left mounted with an
        `open` flag. It is the difference between a step that is actually next and
        one that merely was next when the page first rendered: `useState` reads its
        initial value on mount only, so a permanently-mounted dialog freezes on
        whatever the ladder said before the query resolved. That bug showed the
        *reminder* behind a button labelled "Raise notice to quit".

        It also resets the fields, which matters most for the service date — a date
        left over from a different notice would be recorded against this one, and
        the expiry is computed from it.
      */}
      {raising && (
        <RaiseNoticeDialog
          open
          onOpenChange={setRaising}
          leaseId={leaseId}
          jurisdiction={ladder?.jurisdiction ?? 'NG-LA'}
          nextKind={ladder?.next?.kind ?? null}
          unconfigured={periods?.unconfigured ?? []}
          isSubmitting={raiseNotice.isPending}
          onSubmit={(input) => raiseNotice.mutate(input)}
        />
      )}

      {serving && (
        <ServeNoticeDialog
          notice={serving}
          onOpenChange={(open) => !open && setServing(null)}
          isSubmitting={serveNotice.isPending}
          onSubmit={(input) => serveNotice.mutate({ id: serving.id, input })}
        />
      )}

      <ConfirmDialog
        open={withdrawing !== null}
        onOpenChange={(open) => !open && setWithdrawing(null)}
        title="Withdraw this notice?"
        description="Withdrawing is not the same as letting it run out. This one is recorded as taken back, so it stops being evidence of anything — and it will not unblock the next step the way an expired one does."
        promptLabel="Why is it being withdrawn?"
        promptPlaceholder="Arrears cleared in full after the notice was handed over."
        promptValue={withdrawReason}
        onPromptChange={setWithdrawReason}
        promptRequired
        promptMinLength={10}
        confirmLabel="Withdraw notice"
        isLoading={withdrawNotice.isPending}
        onConfirm={() =>
          withdrawing && withdrawNotice.mutate({ id: withdrawing.id, reason: withdrawReason })
        }
      />

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
