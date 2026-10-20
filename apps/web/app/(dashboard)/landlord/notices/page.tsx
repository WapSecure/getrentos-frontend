'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BellRing, Plus, Settings2 } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogTitle,
  EmptyState,
  PageErrorState,
  SegmentedControl,
  Skeleton,
  useToast,
  type Column,
} from '@getrentos/ui';
import {
  NoticeLadderTimeline,
  noticeKindLabel,
} from '@/components/landlord/notices/NoticeLadderTimeline';
import { NoticePeriodRegister } from '@/components/landlord/notices/NoticePeriodRegister';
import { RaiseNoticeDialog, ServeNoticeDialog } from '@/components/landlord/notices/NoticeDialogs';
import { ListState } from '@/components/shared/ListState';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { formatDate } from '@/lib/format';
import type { NoticeKind, NoticeServiceMethod, TenancyNotice } from '@/types/tenancy-notice';

/**
 * Notices.
 *
 * Reworked from one long page that stacked a configuration form, a tenancy
 * picker, a ladder and a list of everything — four things with four different
 * jobs, in an order that served none of them. The daily question is "what is
 * running and what runs out soon", so that is the page; the period register is
 * configuration and lives behind its own tab, surfacing only as a warning when it
 * is actually blocking something.
 *
 * The one thing kept from before is the wording around a block, because a
 * possession claim served too early is technically fatal and the sentence
 * explaining the date is worth the space.
 */

type Tab = 'running' | 'periods';

export default function LandlordNoticesPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const leaseIdParam = searchParams.get('leaseId');
  const [tab, setTab] = useState<Tab>('running');
  const [openLadder, setOpenLadder] = useState<string | null>(null);
  const [dismissedLink, setDismissedLink] = useState<string | null>(null);

  /*
    Two ways in: the row you clicked, and ?leaseId from a legal case. The link is
    derived rather than copied into state so that arriving here again with a
    different tenancy still opens — a client-side navigation does not remount
    this component, so state seeded on mount would go stale.
  */
  const ladderFor = openLadder ?? (leaseIdParam !== dismissedLink ? leaseIdParam : null);

  const closeLadder = () => {
    setDismissedLink(leaseIdParam);
    setOpenLadder(null);
  };
  const [raising, setRaising] = useState(false);
  const [serving, setServing] = useState<TenancyNotice | null>(null);
  const toast = useToast();

  const {
    data: running,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: [...landlordKeys.notices, { state: 'SERVED' }],
    queryFn: () => unwrap(landlordService.listNotices({ state: 'SERVED', limit: 200 })),
  });

  const {
    data: periods,
    isPending: isPeriodsPending,
    refetch: refetchPeriods,
    isFetching: isPeriodsFetching,
  } = useQuery({
    queryKey: landlordKeys.noticePeriods,
    queryFn: () => unwrap(landlordService.getNoticePeriods()),
  });

  const { data: ladder, isError: ladderFailed } = useQuery({
    queryKey: landlordKeys.leaseLadder(ladderFor ?? ''),
    queryFn: () => unwrap(landlordService.getLeaseLadder(ladderFor as string)),
    enabled: ladderFor !== null,
  });

  /*
    A tenancy the reader cannot open is not worth a modal: the page behind it is
    still the answer to the question they arrived with, so it goes to the same
    place as every other outcome on this screen.
  */
  useEffect(() => {
    if (!ladderFailed) return;
    toast.error('That tenancy is not one you can read.');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    closeLadder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ladderFailed]);

  const onError = (error: unknown) =>
    toast.error(error instanceof Error ? error.message : 'Something went wrong.');

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: landlordKeys.notices });
    queryClient.invalidateQueries({ queryKey: landlordKeys.noticePeriods });
    if (ladderFor) queryClient.invalidateQueries({ queryKey: landlordKeys.leaseLadder(ladderFor) });
  };

  const raiseNotice = useMutation({
    mutationFn: (input: Parameters<typeof landlordService.raiseNotice>[0]) =>
      unwrap(landlordService.raiseNotice(input)),
    onSuccess: () => {
      setRaising(false);
      toast.success('Notice raised. It is a draft until service is recorded.');
      refresh();
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
      toast.success('Service recorded. The period now runs from the date you gave.');
      refresh();
    },
    onError,
  });

  const setPeriod = useMutation({
    mutationFn: (input: { jurisdiction: string; kind: NoticeKind; days: number; basis: string }) =>
      unwrap(landlordService.setNoticePeriod(input)),
    onSuccess: () => {
      toast.success('Period recorded.');
      refresh();
    },
    onError,
  });

  const clearPeriod = useMutation({
    mutationFn: (input: { jurisdiction: string; kind: NoticeKind }) =>
      unwrap(landlordService.clearNoticePeriod(input)),
    onSuccess: () => {
      toast.success('Your period was removed.');
      refresh();
    },
    onError,
  });

  // Soonest first: the whole point of this view is what runs out next.
  const notices = [...(running?.notices ?? [])].sort(
    (a, b) =>
      (a.daysRemaining ?? Number.MAX_SAFE_INTEGER) - (b.daysRemaining ?? Number.MAX_SAFE_INTEGER)
  );

  const soon = notices.filter(
    (notice) => notice.daysRemaining !== null && notice.daysRemaining <= 14
  );
  const unconfigured = periods?.unconfigured.length ?? 0;

  const columns: Column<TenancyNotice>[] = [
    {
      key: 'tenancy',
      header: 'Tenancy',
      className: 'max-w-[18rem]',
      render: (notice) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {notice.property?.address ?? 'Tenancy'}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {[notice.property?.city, notice.tenantName].filter(Boolean).join(' · ')}
          </p>
        </div>
      ),
    },
    {
      key: 'step',
      header: 'Step',
      render: (notice) => <span className="text-sm text-foreground">{notice.kindLabel}</span>,
    },
    {
      key: 'served',
      header: 'Served',
      render: (notice) => (
        <span className="text-sm text-muted-foreground">
          {notice.serviceDate ? formatDate(notice.serviceDate) : '—'}
        </span>
      ),
    },
    {
      key: 'runs',
      header: 'Runs to',
      render: (notice) =>
        notice.expiresAt ? (
          <span className="text-sm text-foreground">{formatDate(notice.expiresAt)}</span>
        ) : (
          <span className="text-xs text-muted-foreground">No set period</span>
        ),
    },
    {
      key: 'left',
      header: 'Left',
      render: (notice) => {
        if (notice.daysRemaining === null)
          return <span className="text-xs text-muted-foreground">—</span>;
        const urgent = notice.daysRemaining <= 14;
        return (
          <Badge variant={urgent ? 'warning' : 'neutral'}>
            {notice.daysRemaining} {notice.daysRemaining === 1 ? 'day' : 'days'}
          </Badge>
        );
      },
    },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Notices</h1>
        <p className="mt-1 text-muted-foreground">
          {notices.length === 0
            ? 'Nothing is running'
            : soon.length > 0
              ? `${notices.length} running · ${soon.length} running out within a fortnight`
              : `${notices.length} running`}
        </p>
      </div>

      <SegmentedControl
        aria-label="Notices view"
        size="sm"
        className="mb-4"
        value={tab}
        onValueChange={setTab}
        segments={[
          { value: 'running', label: 'Running', icon: <BellRing /> },
          {
            value: 'periods',
            label: 'Periods',
            icon: <Settings2 />,
            count: unconfigured > 0 ? unconfigured : undefined,
            countTone: 'warning',
          },
        ]}
      />

      {/*
        The register only surfaces on the daily view when it is actually standing
        in the way of something. Otherwise it is configuration, and configuration
        does not belong at the top of a worklist.
      */}
      {tab === 'running' && unconfigured > 0 && (
        <Alert
          variant="warning"
          className="mb-4"
          title={`${unconfigured} notice ${unconfigured === 1 ? 'period is' : 'periods are'} unrecorded`}
          action={
            <Button variant="ghost" size="sm" onClick={() => setTab('periods')}>
              Record one
            </Button>
          }
        >
          A notice to quit or an intention to recover will be refused in those jurisdictions until a
          number is recorded. This platform holds no day count of its own.
        </Alert>
      )}

      {tab === 'running' ? (
        <ListState
          items={notices}
          query={{ isPending, isError, refetch }}
          errorTitle="We couldn't load your notices"
          skeletonClassName="h-16"
          empty={
            <EmptyState
              icon={BellRing}
              title="Nothing is running. Open a tenancy to raise the first step."
            />
          }
        >
          <DataTable
            columns={columns}
            data={notices}
            getRowKey={(notice) => notice.id}
            onRowClick={(notice) => setOpenLadder(notice.leaseId)}
          />
        </ListState>
      ) : isPeriodsPending ? (
        <div className="space-y-3" role="status" aria-busy="true" aria-label="Loading">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : !periods ? (
        <PageErrorState
          headingLevel="h2"
          title="We couldn't load your notice periods"
          description="This was a connection problem: nothing was changed. Try again."
          onRetry={() => void refetchPeriods()}
          isRetrying={isPeriodsFetching}
        />
      ) : (
        <NoticePeriodRegister
          settings={periods}
          isSubmitting={setPeriod.isPending || clearPeriod.isPending}
          onSubmit={(input) => setPeriod.mutate(input)}
          onClear={(input) => clearPeriod.mutate(input)}
        />
      )}

      {/* The tenancy behind a row, or behind ?leaseId from a legal case. */}
      {ladder && (
        <Dialog open onOpenChange={(open) => !open && closeLadder()}>
          <DialogContent size="lg" padded={false}>
            {/*
              The header carries the tenancy so the body does not have to, and
              stays put while the ladder scrolls — the one action in here should
              never scroll out of reach.
            */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card px-5 py-4">
              <div className="min-w-0">
                <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                  Notices on this tenancy
                </DialogTitle>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {[
                    [ladder.lease.property.address, ladder.lease.property.city]
                      .filter(Boolean)
                      .join(', '),
                    ladder.lease.tenantName ?? 'Tenant not named',
                    ladder.jurisdiction,
                  ].join(' · ')}
                </p>
              </div>

              {/*
                Raising lives with the ladder rather than on the daily list,
                because it is always "the next step" — there is no meaningful way
                to raise one out of sequence, and the server refuses it.
              */}
              {ladder.next && !ladder.nextBlockedReason && (
                <Button className="mr-7 shrink-0" onClick={() => setRaising(true)}>
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                  Raise {noticeKindLabel(ladder.next.kind).toLowerCase()}
                </Button>
              )}
            </div>

            <div className="px-5 py-4">
              <NoticeLadderTimeline
                ladder={ladder}
                actions={(notice) =>
                  notice.state === 'DRAFT' ? (
                    <Button onClick={() => setServing(notice)}>Record service</Button>
                  ) : null
                }
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {raising && ladder && (
        <RaiseNoticeDialog
          open
          onOpenChange={setRaising}
          leaseId={ladder.lease.id}
          jurisdiction={ladder.jurisdiction}
          nextKind={ladder.next?.kind ?? null}
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
    </>
  );
}
