'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { VerificationRequestCard } from '@/components/admin/verifications/VerificationRequestCard';
import { ReviewVerificationModal } from '@/components/admin/verifications/ReviewVerificationModal';
import {
  CardSkeleton,
  ConfirmDialog,
  EmptyState,
  PageErrorState,
  SearchInput,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
} from '@getrentos/ui';
import { Pagination } from '@getrentos/ui';
import { Select } from '@getrentos/ui';
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
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, error, isLoading, isError, isFetching, refetch } = useQuery({
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
    placeholderData: keepPreviousData,
  });
  const requests = data?.items ?? [];
  const total = data?.total ?? 0;

  const invalidateRequests = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });

  const closeModalAndRefresh = () => {
    invalidateRequests();
    setShowApproveConfirm(false);
    setActiveRequest(null);
  };

  const reportActionError = (error: unknown, fallback: string) =>
    toast.error(error instanceof Error ? error.message : fallback);

  const approveMutation = useMutation({
    mutationFn: (id: string) => unwrap(adminService.approveVerification(id)),
    onSuccess: closeModalAndRefresh,
    onError: (error) => reportActionError(error, 'Could not approve this verification.'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      unwrap(adminService.rejectVerification(id, reason)),
    onSuccess: closeModalAndRefresh,
    onError: (error) => reportActionError(error, 'Could not reject this verification.'),
  });

  const requestClarificationMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      unwrap(adminService.requestVerificationClarification(id, reason)),
    onSuccess: closeModalAndRefresh,
    onError: (error) =>
      reportActionError(error, 'Could not request clarification for this verification.'),
  });

  const handleApprove = () => setShowApproveConfirm(true);
  const handleReject = (id: string, reason: string) => rejectMutation.mutate({ id, reason });
  const handleRequestClarification = (id: string, reason: string) =>
    requestClarificationMutation.mutate({ id, reason });

  const { data: pendingData, isError: pendingCountError } = useQuery({
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
          {pendingCountError
            ? 'Pending-review count temporarily unavailable'
            : `${pendingReviewCount} request${pendingReviewCount === 1 ? '' : 's'} awaiting review`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput
          value={searchQuery}
          onValueChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          label="Search verification requests"
          placeholder="Search by applicant or subject..."
          className="flex-1 max-w-sm"
        />
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value as TypeFilter);
            setPage(1);
          }}
          options={typeOptions}
          ariaLabel="Filter by type"
          searchable={false}
          className="w-full sm:w-44"
        />
      </div>

      <Tabs
        value={statusFilter}
        onValueChange={(value) => {
          setStatusFilter(value as StatusFilter);
          setPage(1);
        }}
        className="mb-6"
      >
        <TabsList>
          {statusOptions.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError && !data ? (
        <PageErrorState
          error={error}
          title="Could not load verification requests"
          description="The verification queue is temporarily unavailable. Your filters have been preserved."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
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
        key={activeRequest?.id ?? 'closed'}
        request={activeRequest}
        onClose={() => {
          setShowApproveConfirm(false);
          setActiveRequest(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestClarification={handleRequestClarification}
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
        isRequestingClarification={requestClarificationMutation.isPending}
      />
      <ConfirmDialog
        open={showApproveConfirm && activeRequest !== null}
        onOpenChange={setShowApproveConfirm}
        title="Approve verification?"
        description={
          activeRequest
            ? `${activeRequest.applicantName}'s ${activeRequest.subjectLabel} verification will be approved and may unlock trusted platform actions.`
            : ''
        }
        confirmLabel="Approve verification"
        isLoading={approveMutation.isPending}
        onConfirm={() => activeRequest && approveMutation.mutate(activeRequest.id)}
      />
    </>
  );
}
