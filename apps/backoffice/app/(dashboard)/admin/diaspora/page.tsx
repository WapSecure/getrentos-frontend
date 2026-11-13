'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleAlert, ClipboardCheck, RefreshCw, X } from '@sureground/icons';
import {
  Button,
  EmptyState,
  IconButton,
  PageHeader,
  Pagination,
  QueryState,
  SearchInput,
  Select,
  Skeleton,
  StatGroup,
  StatGroupSkeleton,
  TableSkeleton,
  type StatGroupItem,
  useToast,
} from '@sureground/ui';
import { ApiError, unwrap } from '@sureground/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import {
  DIASPORA_QUEUE_KIND_LABEL,
  DIASPORA_QUEUE_KINDS,
  diasporaQueueKeys,
  groupQueueItems,
} from '@/lib/diasporaQueue';
import {
  adminDiasporaService,
  type ListDiasporaQueueParams,
} from '@/services/adminDiasporaService';
import type {
  DiasporaQueueDue,
  DiasporaQueueItem,
  DiasporaQueueKind,
  DiasporaQueueSummary,
} from '@/types/diaspora';
import { DiasporaQueueTable } from '@/components/admin/diaspora/DiasporaQueueTable';
import { AssignQueueItemDialog } from '@/components/admin/diaspora/AssignQueueItemDialog';
import { OpsToolbar } from '@/components/admin/ops/OpsParts';
import type { PickedUser } from '@/components/admin/land/case/UserLookup';

type Assignee = 'all' | 'me' | 'unassigned';

const PAGE_SIZE = 25;

const kindOptions = [
  { value: 'all', label: 'All kinds' },
  ...DIASPORA_QUEUE_KINDS.map((kind) => ({ value: kind, label: DIASPORA_QUEUE_KIND_LABEL[kind] })),
];

const assigneeOptions: { value: Assignee; label: string }[] = [
  { value: 'all', label: 'Anyone' },
  { value: 'me', label: 'Assigned to me' },
  { value: 'unassigned', label: 'Unassigned' },
];

const DUE_FIGURES: {
  due: DiasporaQueueDue;
  label: string;
  field: keyof DiasporaQueueSummary;
  subtitle?: string;
}[] = [
  { due: 'overdue', label: 'Overdue', field: 'overdue' },
  { due: 'today', label: 'Due today', field: 'dueToday' },
  { due: 'week', label: 'Due this week', field: 'dueThisWeek', subtitle: 'Next 7 days' },
];

const ASSIGNEE_FIGURES: {
  assignee: Exclude<Assignee, 'all'>;
  label: string;
  field: keyof DiasporaQueueSummary;
}[] = [
  { assignee: 'unassigned', label: 'Unassigned', field: 'unassigned' },
  { assignee: 'me', label: 'Assigned to me', field: 'mine' },
];

/** Shaped like the loaded page: summary strip, filter bar, then the table. */
function QueueSkeleton() {
  return (
    <div className="space-y-4">
      <StatGroupSkeleton groups={[5]} />
      <Skeleton className="h-[3.75rem] w-full rounded-xl" />
      <TableSkeleton rows={8} columns={6} />
    </div>
  );
}

export default function DiasporaOperationsPage() {
  const user = useAdminUser();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const canAssign = hasAdminPermission(user?.roles, 'diaspora.ops');
  const canSearchUsers = hasAdminPermission(user?.roles, 'users.view');
  const [due, setDue] = useState<DiasporaQueueDue | null>(null);
  const [assignee, setAssignee] = useState<Assignee>('all');
  const [kind, setKind] = useState<'all' | DiasporaQueueKind>('all');
  const [investor, setInvestor] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [assigning, setAssigning] = useState<DiasporaQueueItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const params = useMemo<ListDiasporaQueueParams>(
    () => ({
      // Overdue rides on the older `overdue` flag, which every server version accepts.
      ...(due === 'overdue' ? { overdue: true } : { due: due ?? undefined }),
      assignee: assignee === 'all' ? undefined : assignee,
      kind: kind === 'all' ? undefined : kind,
      investorId: investor?.id,
      search: debouncedSearch || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [assignee, debouncedSearch, due, investor, kind, page]
  );

  const query = useQuery({
    queryKey: diasporaQueueKeys.list(params),
    queryFn: () => unwrap(adminDiasporaService.queue(params)),
    placeholderData: keepPreviousData,
  });
  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  const groups = useMemo(() => groupQueueItems(items), [items]);
  const total = query.data?.total ?? 0;
  const summary = query.data?.summary;
  const switchedOff = query.error instanceof ApiError && query.error.status === 404;
  const filtered =
    due !== null ||
    assignee !== 'all' ||
    kind !== 'all' ||
    Boolean(investor) ||
    Boolean(debouncedSearch);

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

  const clearFilters = () => {
    setDue(null);
    setAssignee('all');
    setKind('all');
    setInvestor(null);
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
  };

  const copyLink = (item: DiasporaQueueItem) => {
    const url = new URL(item.link.path, window.location.origin).toString();
    navigator.clipboard.writeText(url).then(
      () => toast.success('Link copied.'),
      () => toast.error('The link could not be copied.')
    );
  };

  // A dash, never a guess, while the figures are unknown (first load, or an older server).
  const figure = (field: keyof DiasporaQueueSummary) => summary?.[field] ?? '–';
  const workload: StatGroupItem[] = [
    ...DUE_FIGURES.map((entry) => ({
      label: entry.label,
      value: figure(entry.field),
      subtitle: entry.subtitle,
      attention: entry.due === 'overdue' && (summary?.overdue ?? 0) > 0,
      selected: due === entry.due,
      onSelect: () => resetPage(setDue)(due === entry.due ? null : entry.due),
    })),
    ...ASSIGNEE_FIGURES.map((entry) => ({
      label: entry.label,
      value: figure(entry.field),
      selected: assignee === entry.assignee,
      onSelect: () => resetPage(setAssignee)(assignee === entry.assignee ? 'all' : entry.assignee),
    })),
  ];

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
    <div className="space-y-5">
      <PageHeader
        title="Diaspora operations"
        description="Investor work in one inbox, most urgent first. Deadlines count Lagos working days."
        actions={
          <IconButton
            variant="outline"
            label="Refresh"
            icon={<RefreshCw />}
            onClick={() => void query.refetch()}
            isLoading={query.isFetching && !query.isLoading}
            disabled={query.isLoading}
          />
        }
      />

      {query.isLoading ? (
        <QueueSkeleton />
      ) : (
        <div className="space-y-4">
          <StatGroup
            title="Workload"
            items={workload}
            action={
              filtered ? (
                <Button size="xs" variant="ghost" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />

          <OpsToolbar>
            <SearchInput
              value={search}
              onValueChange={setSearch}
              label="Search by investor or item"
              placeholder="Search investor or item"
              className="w-full sm:max-w-xs sm:flex-1"
            />
            <Select
              value={kind}
              onValueChange={(value) => resetPage(setKind)(value as 'all' | DiasporaQueueKind)}
              options={kindOptions}
              ariaLabel="Filter by kind"
              className="w-full sm:w-52"
            />
            <Select
              value={assignee}
              onValueChange={(value) => resetPage(setAssignee)(value as Assignee)}
              options={assigneeOptions}
              ariaLabel="Filter by assignee"
              className="w-full sm:w-44"
            />
            {investor && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => resetPage(setInvestor)(null)}
                icon={<X className="h-4 w-4" />}
                iconPosition="right"
                aria-label={`Clear the investor filter (${investor.name})`}
              >
                {investor.name}
              </Button>
            )}
            {query.data && (
              <p
                className="text-xs tabular-nums text-muted-foreground sm:ml-auto"
                aria-live="polite"
              >
                {total === 1 ? '1 item' : `${total} items`}
              </p>
            )}
          </OpsToolbar>

          <QueryState
            isLoading={false}
            isError={query.isError && !query.data}
            onRetry={() => void query.refetch()}
            isRetrying={query.isFetching}
            errorTitle="The Diaspora queue could not be loaded"
            scope="section"
            isEmpty={items.length === 0}
            empty={{
              icon: ClipboardCheck,
              title: filtered ? 'Nothing matches these filters' : 'Nothing waiting',
              description: filtered
                ? 'Try another figure or filter, or clear them all.'
                : 'New investor work will appear here.',
              action: filtered ? (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined,
            }}
          >
            <DiasporaQueueTable
              groups={groups}
              currentUserId={user?.id}
              canAssign={canAssign}
              pendingId={
                assign.isPending && !assign.variables?.staff ? assign.variables?.item.id : undefined
              }
              onOpen={(item) => router.push(item.link.path)}
              onTake={(item) => assign.mutate({ item })}
              onAssign={setAssigning}
              onCopyLink={copyLink}
              onInvestor={(item) =>
                item.investorId &&
                resetPage(setInvestor)({
                  id: item.investorId,
                  name: item.investorName ?? 'Investor',
                })
              }
            />
            {total > PAGE_SIZE && (
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={setPage}
                isLoading={query.isFetching}
                className="mt-4"
              />
            )}
          </QueryState>
        </div>
      )}

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
