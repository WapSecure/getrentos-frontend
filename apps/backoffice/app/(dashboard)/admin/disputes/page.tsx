'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUpCircle, Clock, Gavel, Search } from '@sureground/icons';
import { DisputeCard } from '@/components/admin/disputes/DisputeCard';
import { DisputeCaseModal } from '@/components/admin/disputes/DisputeCaseModal';
import {
  CardSkeleton,
  EmptyState,
  PageErrorState,
  PageHeader,
  SearchInput,
  StatGroup,
} from '@sureground/ui';
import { FilterChips, OpsToolbar } from '@/components/admin/ops/OpsParts';
import { Pagination } from '@sureground/ui';
import { Select } from '@sureground/ui';
import { adminService } from '@/services/adminService';
import { unwrap } from '@sureground/shared';
import { adminKeys } from '@/lib/queryKeys';
import { useAdminSearchParam } from '@/lib/readAdminSearchParam';
import { hasAdminPermission } from '@/lib/adminAccess';
import { useAdminUser } from '../layout';
import type {
  DisputeCategory,
  DisputeMessage,
  DisputeResolveOutcome,
  DisputeStatus,
} from '@/types/admin';

type StatusFilter = 'all' | DisputeStatus;
type CategoryFilter = 'all' | DisputeCategory;

const PAGE_SIZE = 12;

export default function AdminDisputesPage() {
  const queryClient = useQueryClient();
  const adminUser = useAdminUser();
  const canAttachEvidence = hasAdminPermission(adminUser?.roles, 'disputes.resolve');
  const [searchQuery, setSearchQuery] = useAdminSearchParam();
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [page, setPage] = useState(1);
  const [activeDisputeId, setActiveDisputeId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.disputes({
      search: debouncedSearch,
      status: statusFilter,
      category: categoryFilter,
      page,
      pageSize: PAGE_SIZE,
    }),
    queryFn: () =>
      unwrap(
        adminService.listDisputes({
          search: debouncedSearch || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          category: categoryFilter === 'all' ? undefined : categoryFilter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const disputes = data?.items ?? [];
  const total = data?.total ?? 0;

  const { data: activeDisputeMessages = [] } = useQuery({
    queryKey: adminKeys.disputeMessages(activeDisputeId ?? ''),
    queryFn: () => unwrap(adminService.getDisputeMessages(activeDisputeId!)),
    enabled: !!activeDisputeId,
  });

  const { data: activeDisputeDetail, isLoading: activeDisputeDetailLoading } = useQuery({
    queryKey: adminKeys.disputeDetail(activeDisputeId ?? ''),
    queryFn: () => unwrap(adminService.getDisputeDetail(activeDisputeId!)),
    enabled: !!activeDisputeId,
  });

  const activeDispute = disputes.find((d) => d.id === activeDisputeId) || null;

  const invalidateDisputes = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });

  const resolveMutation = useMutation({
    meta: { showGlobalError: true },
    mutationFn: ({
      id,
      resolution,
      outcome,
    }: {
      id: string;
      resolution?: string;
      outcome: DisputeResolveOutcome;
    }) => unwrap(adminService.resolveDispute(id, resolution, outcome)),
    onSuccess: () => {
      invalidateDisputes();
      setActiveDisputeId(null);
    },
  });

  const reviewMutation = useMutation({
    meta: { showGlobalError: true },
    mutationFn: (id: string) => unwrap(adminService.startDisputeReview(id)),
    onSuccess: invalidateDisputes,
  });

  const reopenMutation = useMutation({
    meta: { showGlobalError: true },
    mutationFn: (id: string) => unwrap(adminService.reopenDispute(id)),
    onSuccess: invalidateDisputes,
  });

  const escalateMutation = useMutation({
    meta: { showGlobalError: true },
    mutationFn: (id: string) => unwrap(adminService.escalateDispute(id)),
    onSuccess: () => {
      invalidateDisputes();
      setActiveDisputeId(null);
    },
  });

  const sendMessageMutation = useMutation({
    meta: { showGlobalError: true },
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      unwrap(adminService.sendDisputeMessage(id, text)),
    onMutate: async ({ id, text }) => {
      const queryKey = adminKeys.disputeMessages(id);
      await queryClient.cancelQueries({ queryKey });
      const previousMessages = queryClient.getQueryData<DisputeMessage[]>(queryKey);
      const optimisticMessage: DisputeMessage = {
        id: `optimistic-${crypto.randomUUID()}`,
        disputeId: id,
        senderId: 'admin',
        senderName: 'You',
        text,
        timestamp: new Date().toISOString(),
      };
      queryClient.setQueryData<DisputeMessage[]>(queryKey, (old = []) => [
        ...old,
        optimisticMessage,
      ]);
      return { previousMessages, queryKey };
    },
    onError: (_error, _variables, context) => {
      if (context) queryClient.setQueryData(context.queryKey, context.previousMessages);
    },
    onSettled: (_data, _error, { id }) =>
      queryClient.invalidateQueries({ queryKey: adminKeys.disputeMessages(id) }),
  });

  const handleResolve = (
    id: string,
    resolution?: string,
    outcome: DisputeResolveOutcome = 'none'
  ) => resolveMutation.mutate({ id, resolution, outcome });
  const handleStartReview = (id: string) => reviewMutation.mutate(id);
  const handleReopen = (id: string) => reopenMutation.mutate(id);
  const handleEscalate = (id: string) => escalateMutation.mutate(id);
  const handleSendMessage = async (id: string, text: string) => {
    try {
      await sendMessageMutation.mutateAsync({ id, text });
      return true;
    } catch {
      return false;
    }
  };

  const attachEvidenceMutation = useMutation({
    meta: { showGlobalError: true },
    mutationFn: ({ id, file, note }: { id: string; file: File; note?: string }) =>
      unwrap(adminService.addDisputeEvidence(id, file, note)),
    onSuccess: (_created, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.disputeDetail(id) });
      invalidateDisputes();
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-log'] });
    },
  });
  const handleAttachEvidence = (id: string, file: File, note?: string) =>
    attachEvidenceMutation.mutate({ id, file, note });

  // Signed evidence links expire, so a preview left open past the deadline asks for a fresh one.
  const handleResolveEvidenceUrl = async (evidenceId: string) => {
    if (!activeDisputeId) return null;
    const fresh = await unwrap(adminService.getDisputeDetail(activeDisputeId));
    const match = fresh.evidence?.find((entry) => entry.id === evidenceId);
    if (!match || match.kind !== 'STORED') return null;
    queryClient.setQueryData(adminKeys.disputeDetail(activeDisputeId), fresh);
    return match.url;
  };

  const { data: openDisputes, isError: openCountError } = useQuery({
    queryKey: ['admin', 'disputes', 'count', 'open'],
    queryFn: () => unwrap(adminService.listDisputes({ status: 'open', page: 1, pageSize: 1 })),
  });
  const { data: underReviewDisputes, isError: reviewCountError } = useQuery({
    queryKey: ['admin', 'disputes', 'count', 'under_review'],
    queryFn: () =>
      unwrap(adminService.listDisputes({ status: 'under_review', page: 1, pageSize: 1 })),
  });
  const activeDisputeCount = (openDisputes?.total ?? 0) + (underReviewDisputes?.total ?? 0);
  const countsUnavailable = openCountError || reviewCountError;

  const statusOptions: { value: StatusFilter; label: string; count?: number }[] = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open', count: openDisputes?.total },
    { value: 'under_review', label: 'Under review', count: underReviewDisputes?.total },
    { value: 'escalated', label: 'Escalated' },
    { value: 'resolved', label: 'Resolved' },
  ];

  const categoryOptions: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: 'All categories' },
    { value: 'escrow', label: 'Escrow' },
    { value: 'lease', label: 'Lease' },
    { value: 'sale', label: 'Sale' },
    { value: 'service_quality', label: 'Service quality' },
    { value: 'payment', label: 'Payment' },
    { value: 'damage', label: 'Damage' },
    { value: 'cancellation', label: 'Cancellation' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Trust and safety"
        title="Disputes and arbitration"
        description={
          countsUnavailable
            ? 'Active dispute count temporarily unavailable'
            : `${activeDisputeCount} active dispute${activeDisputeCount === 1 ? '' : 's'} requiring attention`
        }
      />

      <StatGroup
        title="Active cases"
        items={[
          {
            label: 'Open',
            value: openCountError ? '–' : (openDisputes?.total ?? '–'),
            subtitle: openCountError ? 'Count unavailable' : 'Waiting for a reviewer',
            icon: Clock,
            attention: (openDisputes?.total ?? 0) > 0,
          },
          {
            label: 'Under review',
            value: reviewCountError ? '–' : (underReviewDisputes?.total ?? '–'),
            subtitle: reviewCountError ? 'Count unavailable' : 'With a reviewer now',
            icon: Search,
          },
          {
            label: 'Active in total',
            value: countsUnavailable ? '–' : activeDisputeCount,
            subtitle: 'Open and under review',
            icon: ArrowUpCircle,
          },
        ]}
      />

      <OpsToolbar>
        <SearchInput
          value={searchQuery}
          onValueChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          label="Search disputes"
          placeholder="Search by title or party..."
          className="flex-1 max-w-sm"
        />
        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value as CategoryFilter);
            setPage(1);
          }}
          options={categoryOptions}
          ariaLabel="Filter by category"
          className="w-full sm:w-48"
        />
      </OpsToolbar>

      <FilterChips
        label="Filter disputes by status"
        value={statusFilter}
        onChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        options={statusOptions}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError && !data ? (
        <PageErrorState
          title="Could not load disputes"
          description="The dispute queue is temporarily unavailable. Your filters have been preserved."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : disputes.length === 0 ? (
        <EmptyState
          icon={Gavel}
          title="No disputes match your filters"
          description="Try another title or party, or clear the category and status filters."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {disputes.map((dispute, index) => (
            <DisputeCard
              key={dispute.id}
              dispute={dispute}
              delay={index * 0.05}
              onClick={() => setActiveDisputeId(dispute.id)}
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

      <DisputeCaseModal
        dispute={activeDispute}
        detail={activeDisputeDetail}
        detailLoading={activeDisputeDetailLoading}
        messages={activeDisputeMessages}
        onClose={() => setActiveDisputeId(null)}
        onStartReview={handleStartReview}
        onReopen={handleReopen}
        onEscalate={handleEscalate}
        onResolve={handleResolve}
        onSendMessage={handleSendMessage}
        onAttachEvidence={handleAttachEvidence}
        onResolveEvidenceUrl={handleResolveEvidenceUrl}
        canAttachEvidence={canAttachEvidence}
        isResolving={resolveMutation.isPending}
        isReviewing={reviewMutation.isPending}
        isReopening={reopenMutation.isPending}
        isEscalating={escalateMutation.isPending}
        isSendingMessage={sendMessageMutation.isPending}
        isAttachingEvidence={attachEvidenceMutation.isPending}
      />
    </div>
  );
}
