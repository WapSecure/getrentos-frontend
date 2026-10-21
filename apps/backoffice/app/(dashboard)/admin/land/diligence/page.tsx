'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CircleAlert, ClipboardCheck, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  Alert,
  Button,
  EmptyState,
  Pagination,
  SearchInput,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { useAdminUser } from '../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { adminLandService, type ListLandDiligenceParams } from '@/services/adminLandService';
import type { LandDiligenceStatus } from '@/types/land';
import { landQueryKeys } from '@/lib/landDiligence';
import {
  LandDiligenceQueueTable,
  landCaseHref,
} from '@/components/admin/land/LandDiligenceQueueTable';

type StatusFilter = 'all' | LandDiligenceStatus;
type QueueTab = 'all' | 'mine' | 'unassigned' | 'overdue';
type SortOrder = 'sla' | 'updated';

const PAGE_SIZE = 20;

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'NOT_STARTED', label: 'Not started' },
  { value: 'IN_REVIEW', label: 'In review' },
  { value: 'ACTION_REQUIRED', label: 'Action required' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CONDITIONAL', label: 'Verified with conditions' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

const sortOptions: { value: SortOrder; label: string }[] = [
  { value: 'sla', label: 'SLA: oldest owed first' },
  { value: 'updated', label: 'Recently updated' },
];

const tabFilters: Record<QueueTab, Pick<ListLandDiligenceParams, 'assigned' | 'overdue'>> = {
  all: {},
  mine: { assigned: 'me' },
  unassigned: { assigned: 'unassigned' },
  overdue: { overdue: true },
};

export default function AdminLandDiligencePage() {
  const router = useRouter();
  const user = useAdminUser();
  const canApprove = hasAdminPermission(user?.roles, 'verifications.approve');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [tab, setTab] = useState<QueueTab>('all');
  const [sort, setSort] = useState<SortOrder>('sla');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = useMemo<ListLandDiligenceParams>(
    () => ({
      search: debouncedSearch || undefined,
      status: status === 'all' ? undefined : status,
      sort,
      page,
      pageSize: PAGE_SIZE,
      ...tabFilters[tab],
    }),
    [debouncedSearch, page, sort, status, tab]
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: landQueryKeys.queue(params),
    queryFn: () => unwrap(adminLandService.listDiligence(params)),
    placeholderData: keepPreviousData,
  });
  const records = data?.items ?? [];
  const total = data?.total ?? 0;
  const errorMessage =
    error instanceof Error ? error.message : 'Unable to load the diligence queue.';

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-accent p-2.5 text-primary">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="type-title">Land diligence</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              The work queue for land titles, surveys and the evidence behind them. Cases are
              ordered by when their review is owed; open one to record checks, cite documents and
              decide.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          isLoading={isFetching && !isLoading}
          icon={<RefreshCw className="h-4 w-4" />}
        >
          Refresh
        </Button>
      </div>

      {!canApprove && (
        <Alert variant="warning" icon={ShieldCheck} className="mb-6">
          You can review cases, record checks and request clarification. A staff member with
          verification approval permission must make the final approve or reject decision.
        </Alert>
      )}

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as QueueTab);
          setPage(1);
        }}
        className="mb-4"
      >
        <TabsList aria-label="Queue view">
          <TabsTrigger value="all">All cases</TabsTrigger>
          <TabsTrigger value="mine">My cases</TabsTrigger>
          <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="w-full max-w-lg">
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search parcel, owner, plot, estate, city…"
            label="Search land diligence records"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as StatusFilter);
            setPage(1);
          }}
          options={statusOptions}
          ariaLabel="Filter diligence status"
          className="w-full sm:w-52"
        />
        <Select
          value={sort}
          onValueChange={(value) => {
            setSort(value as SortOrder);
            setPage(1);
          }}
          options={sortOptions}
          ariaLabel="Sort the queue"
          className="w-full sm:w-60"
        />
      </div>

      {isError && !data ? (
        <EmptyState
          icon={CircleAlert}
          title="The diligence queue could not be loaded"
          description={errorMessage}
          action={
            <Button
              variant="outline"
              onClick={() => refetch()}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Try again
            </Button>
          }
        />
      ) : !isLoading && records.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No land diligence cases match these filters"
          description="New land submissions appear here once an owner submits their parcel for review."
        />
      ) : (
        <>
          {total > 0 && (
            <div className="mb-3 text-sm text-muted-foreground">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–
              {Math.min(page * PAGE_SIZE, total)} of {total} case{total === 1 ? '' : 's'}
            </div>
          )}
          <LandDiligenceQueueTable
            records={records}
            isLoading={isLoading}
            onOpen={(record) => router.push(landCaseHref(record.propertyId))}
          />
        </>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-7"
        />
      )}
    </>
  );
}
