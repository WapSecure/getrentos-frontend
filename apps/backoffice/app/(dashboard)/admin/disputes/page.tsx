'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Gavel } from 'lucide-react';
import { DisputeCard } from '@/components/admin/disputes/DisputeCard';
import { DisputeCaseModal } from '@/components/admin/disputes/DisputeCaseModal';
import { EmptyState } from '@getrentos/ui';
import { Input } from '@getrentos/ui';
import { Pagination } from '@getrentos/ui';
import { Select } from '@getrentos/ui';
import { cn } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
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
  const [searchQuery, setSearchQuery] = useState('');
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

  const { data, isLoading } = useQuery({
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
    mutationFn: (id: string) => unwrap(adminService.startDisputeReview(id)),
    onSuccess: invalidateDisputes,
  });

  const reopenMutation = useMutation({
    mutationFn: (id: string) => unwrap(adminService.reopenDispute(id)),
    onSuccess: invalidateDisputes,
  });

  const escalateMutation = useMutation({
    mutationFn: (id: string) => unwrap(adminService.escalateDispute(id)),
    onSuccess: () => {
      invalidateDisputes();
      setActiveDisputeId(null);
    },
  });

  const sendMessageMutation = useMutation({
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
  const handleSendMessage = (id: string, text: string) => sendMessageMutation.mutate({ id, text });

  const { data: openDisputes } = useQuery({
    queryKey: ['admin', 'disputes', 'count', 'open'],
    queryFn: () => unwrap(adminService.listDisputes({ status: 'open', page: 1, pageSize: 1 })),
  });
  const { data: underReviewDisputes } = useQuery({
    queryKey: ['admin', 'disputes', 'count', 'under_review'],
    queryFn: () =>
      unwrap(adminService.listDisputes({ status: 'under_review', page: 1, pageSize: 1 })),
  });
  const activeDisputeCount = (openDisputes?.total ?? 0) + (underReviewDisputes?.total ?? 0);

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'escalated', label: 'Escalated' },
    { value: 'resolved', label: 'Resolved' },
  ];

  const categoryOptions: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'escrow', label: 'Escrow' },
    { value: 'lease', label: 'Lease' },
    { value: 'sale', label: 'Sale' },
    { value: 'service_quality', label: 'Service Quality' },
    { value: 'payment', label: 'Payment' },
    { value: 'damage', label: 'Damage' },
    { value: 'cancellation', label: 'Cancellation' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dispute &amp; Arbitration</h1>
        <p className="text-muted-foreground mt-1">
          {activeDisputeCount} active dispute{activeDisputeCount === 1 ? '' : 's'} requiring
          attention
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title or party..."
            leadingIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value as CategoryFilter);
            setPage(1);
          }}
          options={categoryOptions}
          className="w-full sm:w-48"
        />
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto mb-6">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setStatusFilter(option.value);
              setPage(1);
            }}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
              statusFilter === option.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : disputes.length === 0 ? (
        <EmptyState icon={Gavel} title="No disputes match your filters" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
        isResolving={resolveMutation.isPending}
        isReviewing={reviewMutation.isPending}
        isReopening={reopenMutation.isPending}
        isEscalating={escalateMutation.isPending}
        isSendingMessage={sendMessageMutation.isPending}
      />
    </>
  );
}
