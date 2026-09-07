'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Fingerprint } from 'lucide-react';
import { ReviewCaseCard } from '@/components/admin/trust/ReviewCaseCard';
import { ReviewCaseModal } from '@/components/admin/trust/ReviewCaseModal';
import { EmptyState, PageErrorState, Pagination, Select } from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { trustService } from '@/services/trustService';
import { adminKeys } from '@/lib/queryKeys';
import type {
  TrustReviewCasePriority,
  TrustReviewCaseStatus,
  TrustReviewCaseSummary,
} from '@/types/trust';

type StatusFilter = 'all' | TrustReviewCaseStatus;
type PriorityFilter = 'all' | TrustReviewCasePriority;

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

export default function TrustReviewCasesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [page, setPage] = useState(1);
  const [activeCase, setActiveCase] = useState<TrustReviewCaseSummary | null>(null);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.reviewCases({
      status: statusFilter === 'all' ? undefined : statusFilter,
      priority: priorityFilter === 'all' ? undefined : priorityFilter,
      page,
      pageSize: PAGE_SIZE,
    }),
    queryFn: () =>
      unwrap(
        trustService.listReviewCases({
          status: statusFilter === 'all' ? undefined : statusFilter,
          priority: priorityFilter === 'all' ? undefined : priorityFilter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const cases = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Fingerprint className="h-6 w-6 text-primary" />
          Trust Review Cases
        </h1>
        <p className="mt-1 text-muted-foreground">
          Verifications flagged for a human decision. Blocking decisions (reject / restrict) are
          four-eyes — they need a second officer.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as StatusFilter);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          className="w-full sm:w-44"
        />
        <Select
          value={priorityFilter}
          onValueChange={(value) => {
            setPriorityFilter(value as PriorityFilter);
            setPage(1);
          }}
          options={PRIORITY_OPTIONS}
          className="w-full sm:w-44"
        />
      </div>

      {isError ? (
        <PageErrorState
          title="Could not load review cases"
          description="The trust review queue is temporarily unavailable."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : cases.length === 0 ? (
        <EmptyState icon={Fingerprint} title="No review cases match your filters" />
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
