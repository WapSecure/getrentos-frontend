'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleAlert, ClipboardCheck, RefreshCw, X } from '@sureground/icons';
import {
  Button,
  EmptyState,
  PageHeader,
  Pagination,
  QueryState,
  SegmentedControl,
  Select,
  TableSkeleton,
  useToast,
} from '@sureground/ui';
import { ApiError, unwrap } from '@sureground/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import {
  DIASPORA_QUEUE_KIND_LABEL,
  DIASPORA_QUEUE_KINDS,
  diasporaQueueKeys,
} from '@/lib/diasporaQueue';
import {
  adminDiasporaService,
  type ListDiasporaQueueParams,
} from '@/services/adminDiasporaService';
import type { DiasporaQueueItem, DiasporaQueueKind } from '@/types/diaspora';
import { DiasporaQueueTable } from '@/components/admin/diaspora/DiasporaQueueTable';
import { AssignQueueItemDialog } from '@/components/admin/diaspora/AssignQueueItemDialog';
import type { PickedUser } from '@/components/admin/land/case/UserLookup';

type View = 'all' | 'overdue' | 'mine' | 'unassigned';

const PAGE_SIZE = 25;

const viewFilters: Record<View, Pick<ListDiasporaQueueParams, 'overdue' | 'assignee'>> = {
  all: {},
  overdue: { overdue: true },
  mine: { assignee: 'me' },
  unassigned: { assignee: 'unassigned' },
};

const kindOptions = [
  { value: 'all', label: 'All kinds' },
  ...DIASPORA_QUEUE_KINDS.map((kind) => ({ value: kind, label: DIASPORA_QUEUE_KIND_LABEL[kind] })),
];

export default function DiasporaOperationsPage() {
  const user = useAdminUser();
  const toast = useToast();
  const queryClient = useQueryClient();
  const canAssign = hasAdminPermission(user?.roles, 'diaspora.ops');
  const canSearchUsers = hasAdminPermission(user?.roles, 'users.view');
  const [view, setView] = useState<View>('all');
  const [kind, setKind] = useState<'all' | DiasporaQueueKind>('all');
  const [investor, setInvestor] = useState<{ id: string; name: string } | null>(null);
  const [page, setPage] = useState(1);
  const [assigning, setAssigning] = useState<DiasporaQueueItem | null>(null);

  const params = useMemo<ListDiasporaQueueParams>(
    () => ({
      ...viewFilters[view],
      kind: kind === 'all' ? undefined : kind,
      investorId: investor?.id,
      page,
      pageSize: PAGE_SIZE,
    }),
    [investor, kind, page, view]
  );

  const query = useQuery({
    queryKey: diasporaQueueKeys.list(params),
    queryFn: () => unwrap(adminDiasporaService.queue(params)),
    placeholderData: keepPreviousData,
  });
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const switchedOff = query.error instanceof ApiError && query.error.status === 404;

  const assign = useMutation({
    mutationFn: ({ item, staff }: { item: DiasporaQueueItem; staff?: PickedUser }) =>
      unwrap(adminDiasporaService.assign(item.kind, item.subjectId, staff?.id)),
    onSuccess: (_result, { staff }) => {
      void queryClient.invalidateQueries({ queryKey: diasporaQueueKeys.all });
      setAssigning(null);
      toast.success(
        staff ? `Assigned to ${staff.name}. They have been notified.` : 'Assigned to you.'
      );
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'The item could not be assigned.'),
  });

  const resetPage =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setPage(1);
    };

  if (switchedOff) {
    return (
      <>
        <PageHeader title="Diaspora operations" />
        <EmptyState
          icon={CircleAlert}
          title="Diaspora Invest is switched off here"
          description="This queue opens once Diaspora Invest is enabled in this environment."
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diaspora operations"
        description="Investor work in one list: identity reviews, diligence, purchase milestones, legal steps, approvals, disputes and Managed intake. Overdue items come first; deadlines are Lagos working days."
        actions={
          <Button
            variant="outline"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            isLoading={query.isFetching && !query.isLoading}
            icon={<RefreshCw />}
          >
            Refresh
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl<View>
          aria-label="Queue view"
          value={view}
          onValueChange={resetPage(setView)}
          segments={[
            { value: 'all', label: 'All' },
            {
              value: 'overdue',
              label: 'Overdue',
              ...(view === 'all' && query.data
                ? { count: query.data.overdueTotal, countTone: 'warning' as const }
                : {}),
            },
            { value: 'mine', label: 'Assigned to me' },
            { value: 'unassigned', label: 'Unassigned' },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          {investor && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resetPage(setInvestor)(null)}
              icon={<X className="h-4 w-4" />}
              aria-label={`Clear the investor filter (${investor.name})`}
            >
              {investor.name}
            </Button>
          )}
          <Select
            value={kind}
            onValueChange={(value) => resetPage(setKind)(value as 'all' | DiasporaQueueKind)}
            options={kindOptions}
            ariaLabel="Filter by kind"
            className="w-full sm:w-56"
          />
        </div>
      </div>

      <QueryState
        isLoading={query.isLoading}
        loading={<TableSkeleton rows={6} columns={6} />}
        isError={query.isError && !query.data}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
        errorTitle="The Diaspora queue could not be loaded"
        isEmpty={items.length === 0}
        empty={{
          icon: ClipboardCheck,
          title:
            view === 'all' && kind === 'all' && !investor
              ? 'Nothing is waiting'
              : 'Nothing matches these filters',
          description:
            view === 'all' && kind === 'all' && !investor
              ? 'New investor reviews, overdue steps and disputes appear here as they arrive.'
              : 'Try another view or kind, or clear the investor filter.',
        }}
      >
        <DiasporaQueueTable
          items={items}
          currentUserId={user?.id}
          canAssign={canAssign}
          pendingId={
            assign.isPending && !assign.variables?.staff ? assign.variables?.item.id : undefined
          }
          onTake={(item) => assign.mutate({ item })}
          onAssign={setAssigning}
          onInvestor={(item) =>
            item.investorId &&
            resetPage(setInvestor)({ id: item.investorId, name: item.investorName ?? 'Investor' })
          }
        />
        {total > PAGE_SIZE && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            isLoading={query.isFetching}
            className="mt-6"
          />
        )}
      </QueryState>

      <AssignQueueItemDialog
        item={assigning}
        canSearchUsers={canSearchUsers}
        isPending={assign.isPending && Boolean(assign.variables?.staff)}
        onClose={() => setAssigning(null)}
        onAssign={(item, staff) => assign.mutate({ item, staff })}
      />
    </div>
  );
}
