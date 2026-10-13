'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench } from 'lucide-react';
import {
  Pagination,
  PageErrorState,
  PageLoadingState,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { MaintenanceRequestCard } from '@/components/landlord/maintenance/MaintenanceRequestCard';
import { AssignVendorModal } from '@/components/landlord/maintenance/AssignVendorModal';
import { ScheduleVisitModal } from '@/components/landlord/maintenance/ScheduleVisitModal';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import type { LandlordMaintenanceRequest } from '@/types/landlord';
import type { MaintenanceRequestStatus } from '@/types/maintenance';

const statusFilters: { value: 'all' | MaintenanceRequestStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

const PAGE_SIZE = 10;

export function MaintenanceRequestsView() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | MaintenanceRequestStatus>('all');
  const [assigningRequest, setAssigningRequest] = useState<LandlordMaintenanceRequest | null>(null);
  const [schedulingRequest, setSchedulingRequest] = useState<LandlordMaintenanceRequest | null>(
    null
  );
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const requestsQuery = useQuery({
    queryKey: [
      ...landlordKeys.maintenanceRequests(),
      { page, pageSize: PAGE_SIZE, status: filter === 'all' ? undefined : filter },
    ],
    queryFn: () =>
      unwrap(
        landlordService.listMaintenanceRequests({
          status: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const { data, isPending: isLoadingRequests } = requestsQuery;
  const requests = data?.items ?? [];
  const total = data?.total ?? 0;

  const summaryQuery = useQuery({
    queryKey: landlordKeys.maintenanceSummary,
    queryFn: () => unwrap(landlordService.getMaintenanceSummary()),
  });
  const { data: summary, isPending: isLoadingSummary } = summaryQuery;
  const openCount = summary?.openCount ?? 0;

  const invalidateRequests = () => {
    void queryClient.invalidateQueries({ queryKey: ['landlord', 'maintenanceRequests'] });
    void queryClient.invalidateQueries({ queryKey: landlordKeys.maintenanceSummary });
  };

  const assignVendorMutation = useMutation({
    mutationFn: ({
      requestId,
      vendorId,
      scheduledFor,
    }: {
      requestId: string;
      vendorId: string;
      scheduledFor?: string;
    }) => unwrap(landlordService.assignMaintenanceVendor(requestId, vendorId, scheduledFor)),
    onSuccess: () => {
      invalidateRequests();
      void queryClient.invalidateQueries({ queryKey: landlordKeys.vendors });
      setAssigningRequest(null);
    },
  });

  const scheduleVisitMutation = useMutation({
    mutationFn: ({ requestId, scheduledFor }: { requestId: string; scheduledFor: string }) =>
      unwrap(landlordService.scheduleMaintenanceVisit(requestId, scheduledFor)),
    onSuccess: () => {
      invalidateRequests();
      void queryClient.invalidateQueries({ queryKey: landlordKeys.vendors });
      setSchedulingRequest(null);
    },
  });

  const rateVendorMutation = useMutation({
    mutationFn: ({ requestId, rating }: { requestId: string; rating: number }) =>
      unwrap(landlordService.rateMaintenanceVendor(requestId, rating)),
    onSuccess: () => {
      invalidateRequests();
      void queryClient.invalidateQueries({ queryKey: landlordKeys.vendors });
    },
    onError: (error: Error) =>
      setToast({ message: error.message || 'Could not save the vendor rating.', variant: 'error' }),
  });

  const markResolvedMutation = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.markMaintenanceResolved(id)),
    onSuccess: invalidateRequests,
    onError: (error: Error) =>
      setToast({ message: error.message || 'Could not resolve this request.', variant: 'error' }),
  });

  const escalateMutation = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.escalateMaintenance(id)),
    onSuccess: invalidateRequests,
    onError: (error: Error) =>
      setToast({ message: error.message || 'Could not escalate this request.', variant: 'error' }),
  });

  const handleAssignVendor = (requestId: string, vendorId: string, scheduledFor?: string) =>
    assignVendorMutation.mutate({ requestId, vendorId, scheduledFor });

  const handleMarkResolved = (id: string) => markResolvedMutation.mutate(id);

  const handleEscalate = (id: string) => escalateMutation.mutate(id);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Maintenance</h1>
        {/* Zero is a claim about the portfolio, so wait until it has been read
            before making it. */}
        <p className="text-muted-foreground mt-1">
          {isLoadingSummary
            ? 'Counting your open tickets…'
            : `${openCount} open ticket${openCount === 1 ? '' : 's'} across your portfolio`}
        </p>
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit mb-6 overflow-x-auto">
        {statusFilters.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => {
              setFilter(option.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              filter === option.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoadingRequests ? (
        <PageLoadingState />
      ) : requestsQuery.isError || summaryQuery.isError ? (
        <PageErrorState
          title="Maintenance requests are unavailable"
          description="We could not load requests and open-ticket totals. No request has been changed."
          onRetry={() => {
            void requestsQuery.refetch();
            void summaryQuery.refetch();
          }}
          isRetrying={requestsQuery.isFetching || summaryQuery.isFetching}
        />
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Wrench className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="font-medium text-foreground">
            {filter === 'all'
              ? 'No maintenance requests yet'
              : `No ${filter.replace('_', ' ')} requests`}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {requests.map((request) => (
            <MaintenanceRequestCard
              key={request.id}
              request={request}
              onAssignVendor={(target) => {
                assignVendorMutation.reset();
                setAssigningRequest(target);
              }}
              onScheduleVisit={(target) => {
                scheduleVisitMutation.reset();
                setSchedulingRequest(target);
              }}
              onRateVendor={(id, rating) => rateVendorMutation.mutate({ requestId: id, rating })}
              isRatingVendor={
                rateVendorMutation.isPending &&
                rateVendorMutation.variables?.requestId === request.id
              }
              onMarkResolved={handleMarkResolved}
              onEscalate={handleEscalate}
              isMarkingResolved={
                markResolvedMutation.isPending && markResolvedMutation.variables === request.id
              }
              isEscalating={escalateMutation.isPending && escalateMutation.variables === request.id}
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

      <AssignVendorModal
        request={assigningRequest}
        onClose={() => setAssigningRequest(null)}
        onAssign={handleAssignVendor}
        assigningVendorId={
          assignVendorMutation.isPending ? assignVendorMutation.variables?.vendorId : null
        }
        error={
          assignVendorMutation.error instanceof Error ? assignVendorMutation.error.message : null
        }
      />

      <ScheduleVisitModal
        request={schedulingRequest}
        onClose={() => setSchedulingRequest(null)}
        onSchedule={(requestId, scheduledFor) =>
          scheduleVisitMutation.mutate({ requestId, scheduledFor })
        }
        isSaving={scheduleVisitMutation.isPending}
        error={
          scheduleVisitMutation.error instanceof Error ? scheduleVisitMutation.error.message : null
        }
      />

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
