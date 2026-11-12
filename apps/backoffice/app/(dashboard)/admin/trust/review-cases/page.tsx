'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Fingerprint } from '@sureground/icons';
import { ReviewCaseCard } from '@/components/admin/trust/ReviewCaseCard';
import { ReviewCaseModal } from '@/components/admin/trust/ReviewCaseModal';
import {
  CardSkeleton,
  EmptyState,
  PageErrorState,
  Pagination,
  Select,
  PageHeader,
} from '@sureground/ui';
import { unwrap } from '@sureground/shared';
import { trustService } from '@/services/trustService';
import { adminKeys } from '@/lib/queryKeys';
import type {
  ForeignReviewCaseSummary,
  Paginated,
  TrustReviewCasePriority,
  TrustReviewCaseStatus,
  TrustReviewCaseSummary,
} from '@/types/trust';

type StatusFilter = 'all' | TrustReviewCaseStatus;
type PriorityFilter = 'all' | TrustReviewCasePriority;
type PurposeFilter = 'all' | 'foreign';

const PAGE_SIZE = 12;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'ESCALATED', label: 'Escalated' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const PRIORITY_OPTIONS: { value: PriorityFilter; label: string }[] = [
  { value: 'all', label: 'All priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const PURPOSE_OPTIONS: { value: PurposeFilter; label: string }[] = [
  { value: 'all', label: 'All purposes' },
  { value: 'foreign', label: 'Diaspora identity' },
];

// The diaspora queue has its own list (soonest due first); the card and modal take the shared shape.
const fromForeign = (
  page: Paginated<ForeignReviewCaseSummary>
): Paginated<TrustReviewCaseSummary> => ({
  ...page,
  items: page.items.map((row) => ({
    id: row.id,
    verificationId: '',
    status: row.status,
    priority: row.priority,
    assigneeId: row.assigneeId,
    reasonCodes: row.reasonCodes,
    createdAt: row.createdAt,
    updatedAt: row.createdAt,
    dueAt: row.dueAt,
    overdue: row.overdue,
    verification: {
      id: '',
      subjectType: 'PERSON',
      subjectId: row.subjectId,
      purpose: row.purpose,
      decision: '',
      status: '',
      createdAt: row.createdAt,
    },
  })),
});

export default function TrustReviewCasesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [purposeFilter, setPurposeFilter] = useState<PurposeFilter>('all');
  const foreign = purposeFilter === 'foreign';
  const [page, setPage] = useState(1);
  const [activeCase, setActiveCase] = useState<TrustReviewCaseSummary | null>(null);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.reviewCases({
      status: statusFilter === 'all' ? undefined : statusFilter,
      priority: foreign || priorityFilter === 'all' ? undefined : priorityFilter,
      purpose: purposeFilter,
      page,
      pageSize: PAGE_SIZE,
    }),
    queryFn: async () =>
      foreign
        ? fromForeign(
            await unwrap(
              trustService.listForeignReviewCases({
                status: statusFilter === 'all' ? undefined : statusFilter,
                page,
                pageSize: PAGE_SIZE,
              })
            )
          )
        : unwrap(
            trustService.listReviewCases({
              status: statusFilter === 'all' ? undefined : statusFilter,
              priority: priorityFilter === 'all' ? undefined : priorityFilter,
              page,
              pageSize: PAGE_SIZE,
            })
          ),
    placeholderData: keepPreviousData,
  });
  const cases = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <PageHeader
        title="Trust review cases"
        description="Verifications flagged for a human decision. Every decision needs a second officer, who works through the case's evidence checklist."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as StatusFilter);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          ariaLabel="Filter by status"
          searchable={false}
          className="w-full sm:w-44"
        />
        <Select
          value={priorityFilter}
          onValueChange={(value) => {
            setPriorityFilter(value as PriorityFilter);
            setPage(1);
          }}
          options={PRIORITY_OPTIONS}
          ariaLabel="Filter by priority"
          searchable={false}
          disabled={foreign}
          className="w-full sm:w-44"
        />
        <Select
          value={purposeFilter}
          onValueChange={(value) => {
            setPurposeFilter(value as PurposeFilter);
            setPage(1);
          }}
          options={PURPOSE_OPTIONS}
          ariaLabel="Filter by purpose"
          searchable={false}
          className="w-full sm:w-48"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} lines={4} />
          ))}
        </div>
      ) : isError && !data ? (
        <PageErrorState
          title="Could not load review cases"
          description="The trust review queue is temporarily unavailable."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : cases.length === 0 ? (
        <EmptyState
          icon={Fingerprint}
          title="No review cases match your filters"
          description={
            foreign && statusFilter === 'all'
              ? 'Shows open, assigned and escalated diaspora cases. Choose a status to see others.'
              : undefined
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((caseItem, index) => (
            <ReviewCaseCard
              key={caseItem.id}
              caseItem={caseItem}
              delay={index * 0.05}
              onReview={() => setActiveCase(caseItem)}
            />
          ))}
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <ReviewCaseModal caseItem={activeCase} onClose={() => setActiveCase(null)} />
    </>
  );
}
