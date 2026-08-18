'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ShieldCheck } from 'lucide-react';
import { VerificationRequestCard } from '@/components/admin/verifications/VerificationRequestCard';
import { ReviewVerificationModal } from '@/components/admin/verifications/ReviewVerificationModal';
import { EmptyState } from '@getrentos/ui';
import { Input } from '@getrentos/ui';
import { Pagination } from '@getrentos/ui';
import { Select } from '@getrentos/ui';
import { cn } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import type {
  VerificationRequest,
  VerificationRequestStatus,
  VerificationRequestType,
} from '@/types/admin';

type StatusFilter = 'all' | VerificationRequestStatus;
type TypeFilter = 'all' | VerificationRequestType;

const PAGE_SIZE = 12;

export default function AdminVerificationsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [page, setPage] = useState(1);
  const [activeRequest, setActiveRequest] = useState<VerificationRequest | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading } = useQuery({
    queryKey: adminKeys.verifications({
      search: debouncedSearch,
      status: statusFilter,
      type: typeFilter,
      page,
      pageSize: PAGE_SIZE,
    }),
    queryFn: () =>
      unwrap(
        adminService.listVerifications({
          search: debouncedSearch || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          type: typeFilter === 'all' ? undefined : typeFilter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const requests = data?.items ?? [];
  const total = data?.total ?? 0;

  const invalidateRequests = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });

  const closeModalAndRefresh = () => {
    invalidateRequests();
    setActiveRequest(null);
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => unwrap(adminService.approveVerification(id)),
    onSuccess: closeModalAndRefresh,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      unwrap(adminService.rejectVerification(id, reason)),
    onSuccess: closeModalAndRefresh,
  });

  const requestClarificationMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      unwrap(adminService.requestVerificationClarification(id, reason)),
    onSuccess: closeModalAndRefresh,
  });

  const handleApprove = (id: string) => approveMutation.mutate(id);
  const handleReject = (id: string, reason: string) => rejectMutation.mutate({ id, reason });
  const handleRequestClarification = (id: string, reason: string) =>
    requestClarificationMutation.mutate({ id, reason });

  const { data: pendingData } = useQuery({
    queryKey: ['admin', 'verifications', 'pending-count'],
    queryFn: () =>
      unwrap(adminService.listVerifications({ status: 'pending_review', page: 1, pageSize: 1 })),
  });
  const pendingReviewCount = pendingData?.total ?? 0;

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending_review', label: 'Pending' },
    { value: 'needs_clarification', label: 'Needs Info' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'identity', label: 'Identity' },
    { value: 'property', label: 'Property' },
    { value: 'license', label: 'License' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Verification Queue</h1>
        <p className="text-muted-foreground mt-1">
          {pendingReviewCount} request{pendingReviewCount === 1 ? '' : 's'} awaiting review
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
            placeholder="Search by applicant or subject..."
            leadingIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value as TypeFilter);
            setPage(1);
          }}
          options={typeOptions}
          className="w-full sm:w-44"
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
      ) : requests.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No requests match your filters" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {requests.map((request, index) => (
            <VerificationRequestCard
              key={request.id}
              request={request}
              delay={index * 0.05}
              onReview={() => setActiveRequest(request)}
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

      <ReviewVerificationModal
        request={activeRequest}
        onClose={() => setActiveRequest(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestClarification={handleRequestClarification}
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
        isRequestingClarification={requestClarificationMutation.isPending}
      />
    </>
  );
}
